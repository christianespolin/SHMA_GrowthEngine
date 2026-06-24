import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { calculateCompanySimilarity } from '@/lib/import/duplicate-detection'

export const maxDuration = 120

// POST /api/long-list/import
// Steps: upload → returns headers + sample rows for column mapping
//        confirm → runs duplicate check, creates import_batch + rows
//        execute → creates/skips company records

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const step = searchParams.get('step') || 'preview'

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  // ── Step 1: preview ─────────────────────────────────────────────────────────
  if (step === 'preview') {
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (rows.length < 2) return NextResponse.json({ error: 'File has no data rows' }, { status: 400 })

    const headers = (rows[0] as string[]).map(h => String(h ?? '').trim())
    const sampleRows = rows.slice(1, 6).map(row =>
      headers.reduce((acc, h, i) => ({ ...acc, [h]: row[i] }), {} as Record<string, unknown>)
    )
    const totalRows = rows.length - 1

    return NextResponse.json({ headers, sample_rows: sampleRows, total_rows: totalRows })
  }

  // ── Step 2: validate + duplicate check ──────────────────────────────────────
  if (step === 'validate') {
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const mapping = JSON.parse(formData.get('mapping') as string || '{}') as Record<string, string>
    const batchName = formData.get('batch_name') as string || 'Untitled Import'
    const sourceName = formData.get('source_name') as string || null
    const sourceDescription = formData.get('source_description') as string || null

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    const headers = (rows[0] as string[]).map(h => String(h ?? '').trim())
    const dataRows = rows.slice(1)

    // Fetch all existing companies for duplicate checking
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('id, name, website, registration_number, country, stage, sensitivity_status, internal_owner')

    // Create the import batch
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        batch_name: batchName,
        import_type: 'Long List',
        source_name: sourceName,
        source_description: sourceDescription,
        uploaded_file_name: file.name,
        uploaded_by: user.id,
        status: 'Validated',
        column_mapping_json: mapping,
        raw_headers: headers,
        total_rows: dataRows.length,
      })
      .select()
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Failed to create import batch' }, { status: 500 })
    }

    // Process each row
    const batchRows = []
    let validCount = 0, duplicateCount = 0, errorCount = 0

    for (let i = 0; i < dataRows.length; i++) {
      const rawRow = headers.reduce((acc, h, j) => ({ ...acc, [h]: dataRows[i][j] }), {} as Record<string, unknown>)

      // Map columns
      const mapped: Record<string, unknown> = {}
      for (const [field, col] of Object.entries(mapping)) {
        if (col && col !== '__none__') mapped[field] = rawRow[col]
      }

      const companyName = String(mapped.name || '').trim()
      if (!companyName) {
        batchRows.push({
          import_batch_id: batch.id,
          row_number: i + 1,
          raw_data_json: rawRow,
          mapped_data_json: mapped,
          validation_status: 'Invalid',
          duplicate_status: 'Not checked',
          error_message: 'Company name is required',
        })
        errorCount++
        continue
      }

      // Duplicate detection
      let duplicateStatus = 'No duplicate'
      let matchedCompanyId: string | null = null
      let suggestedAction = 'Create new company'
      const incoming = {
        name: companyName,
        website: String(mapped.website || ''),
        registration_number: String(mapped.registration_number || ''),
        country: String(mapped.country || ''),
      }

      type ExistingCompany = { id: string; name: string; website: string | null; registration_number: string | null; country: string | null; stage: string | null; sensitivity_status: string | null; internal_owner: string | null }
      let bestMatch: { company: ExistingCompany, result: ReturnType<typeof calculateCompanySimilarity> } | null = null

      for (const existing of (existingCompanies || [])) {
        const result = calculateCompanySimilarity(incoming, existing)
        if (result.confidence !== 'none') {
          if (!bestMatch || result.score > bestMatch.result.score) {
            bestMatch = { company: existing, result }
          }
        }
      }

      if (bestMatch) {
        matchedCompanyId = bestMatch.company.id
        const company = bestMatch.company

        if (bestMatch.result.confidence === 'exact') {
          if (company.sensitivity_status === 'Do not contact') {
            duplicateStatus = 'Existing do-not-contact company'
            suggestedAction = 'Skip'
          } else if (['Disqualified', 'Nurture'].includes(company.stage || '')) {
            duplicateStatus = 'Existing disqualified company'
            suggestedAction = 'Needs review'
          } else {
            duplicateStatus = 'Exact duplicate'
            suggestedAction = 'Skip'
          }
          duplicateCount++
        } else if (bestMatch.result.confidence === 'strong' || bestMatch.result.confidence === 'possible') {
          duplicateStatus = 'Possible duplicate'
          suggestedAction = 'Needs review'
          duplicateCount++
        }
      }

      validCount++
      batchRows.push({
        import_batch_id: batch.id,
        row_number: i + 1,
        raw_data_json: rawRow,
        mapped_data_json: mapped,
        validation_status: 'Valid',
        duplicate_status: duplicateStatus,
        matched_company_id: matchedCompanyId,
        action: suggestedAction,
      })
    }

    // Bulk insert rows
    if (batchRows.length > 0) {
      await supabase.from('import_batch_rows').insert(batchRows)
    }

    // Update batch counts
    await supabase
      .from('import_batches')
      .update({
        status: duplicateCount > 0 ? 'Reviewing Duplicates' : 'Validated',
        valid_rows: validCount,
        duplicate_rows: duplicateCount,
        error_rows: errorCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    return NextResponse.json({
      batch_id: batch.id,
      total_rows: dataRows.length,
      valid_rows: validCount,
      duplicate_rows: duplicateCount,
      error_rows: errorCount,
    })
  }

  // ── Step 3: execute import ───────────────────────────────────────────────────
  if (step === 'execute') {
    const batchId = formData.get('batch_id') as string
    if (!batchId) return NextResponse.json({ error: 'batch_id required' }, { status: 400 })

    // Fetch batch + rows marked for creation
    const { data: rows } = await supabase
      .from('import_batch_rows')
      .select('*')
      .eq('import_batch_id', batchId)
      .eq('action', 'Create new company')

    let importedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const row of (rows || [])) {
      const mapped = row.mapped_data_json as Record<string, unknown>
      const companyName = String(mapped.name || '').trim()
      if (!companyName) { skippedCount++; continue }

      try {
        const { error } = await supabase.from('companies').insert({
          name: companyName,
          website: mapped.website ? String(mapped.website) : null,
          country: mapped.country ? String(mapped.country) : null,
          segment: mapped.segment ? String(mapped.segment) : null,
          subsegment: mapped.subsegment ? String(mapped.subsegment) : null,
          description: mapped.description ? String(mapped.description) : null,
          revenue_range: mapped.revenue ? String(mapped.revenue) : null,
          employee_range: mapped.employees ? String(mapped.employees) : null,
          ownership_type: mapped.ownership ? String(mapped.ownership) : null,
          registration_number: mapped.registration_number ? String(mapped.registration_number) : null,
          geography: mapped.headquarters ? String(mapped.headquarters) : null,
          notes: mapped.notes ? String(mapped.notes) : null,
          lead_source: mapped.source ? String(mapped.source) : null,
          stage: 'Longlist',
          import_batch_id: batchId,
          import_source_name: mapped.source ? String(mapped.source) : null,
          import_row_data_json: mapped,
        })
        if (error) {
          errors.push(`Row ${row.row_number}: ${error.message}`)
          skippedCount++
        } else {
          // Mark row as imported
          await supabase
            .from('import_batch_rows')
            .update({ validation_status: 'Imported' })
            .eq('id', row.id)
          importedCount++
        }
      } catch (err) {
        errors.push(`Row ${row.row_number}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        skippedCount++
      }
    }

    // Update batch
    await supabase
      .from('import_batches')
      .update({
        status: 'Completed',
        imported_rows: importedCount,
        skipped_rows: skippedCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    return NextResponse.json({ imported: importedCount, skipped: skippedCount, errors })
  }

  return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
}
