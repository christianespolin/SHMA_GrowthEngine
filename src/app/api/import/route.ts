import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

interface ExcelRow {
  name: string
  segment: string | null
  registration_number: string | null
  excel_s_score: number | null
  excel_t_score: number | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_role: string | null
  lead_source: string | null
  q1: number | null
  q2: number | null
  q3: number | null
  q4: number | null
  q5: number | null
  q6: number | null
  q7: number | null
  q8: number | null
  q9: number | null
  q10: number | null
  q11: number | null
  sweetspot_score: number | null
  notes: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const preview = formData.get('preview') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]

    // Find header row (row with 'Selskap')
    let headerRowIndex = -1
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as unknown[]
      if (row.some(cell => String(cell || '').toLowerCase().includes('selskap'))) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json({ error: 'Could not find header row in Excel file' }, { status: 400 })
    }

    const rows: ExcelRow[] = []

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i] as unknown[]
      if (!row || !row[0]) continue

      const name = String(row[0] || '').trim()
      if (!name || name === '(husker ikke)' || name === '') continue

      const qualifyingScores = {
        q1: parseScore(row[11]),
        q2: parseScore(row[12]),
        q3: parseScore(row[13]),
        q4: parseScore(row[14]),
        q5: parseScore(row[15]),
        q6: parseScore(row[16]),
        q7: parseScore(row[17]),
        q8: parseScore(row[18]),
        q9: parseScore(row[19]),
        q10: parseScore(row[20]),
        q11: parseScore(row[21]),
      }

      const sweetspotScores = Object.values(qualifyingScores).filter(s => s !== null) as number[]
      const sweetspot_score = sweetspotScores.length > 0
        ? Math.round((sweetspotScores.reduce((a, b) => a + b, 0) / sweetspotScores.length) * 10) / 10
        : null

      rows.push({
        name,
        segment: String(row[1] || '').trim() || null,
        registration_number: String(row[2] || '').trim() || null,
        excel_s_score: parseScore(row[3]),
        excel_t_score: parseScore(row[4]),
        contact_name: String(row[6] || '').trim() || null,
        contact_email: String(row[7] || '').trim() || null,
        contact_phone: String(row[8] || '').trim() || null,
        contact_role: String(row[9] || '').trim() || null,
        lead_source: String(row[10] || '').trim() || null,
        ...qualifyingScores,
        sweetspot_score,
        notes: String(row[23] || '').trim() || null,
      })
    }

    if (preview) {
      return NextResponse.json({ rows, count: rows.length })
    }

    // Check for duplicates and import
    let imported = 0
    let skipped = 0
    const errors: string[] = []
    const importedIds: string[] = []

    for (const row of rows) {
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', row.name)
        .limit(1)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }

      const closingScore = row.excel_s_score !== null && row.excel_t_score !== null
        ? Math.round(((row.excel_s_score + row.excel_t_score) / 2) * 10) / 10
        : null

      const qualifyingScoresObj: Record<string, number | null> = {
        q1: row.q1, q2: row.q2, q3: row.q3, q4: row.q4, q5: row.q5,
        q6: row.q6, q7: row.q7, q8: row.q8, q9: row.q9, q10: row.q10, q11: row.q11,
      }

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: row.name,
          segment: normalizeSegment(row.segment),
          registration_number: row.registration_number,
          lead_source: row.lead_source,
          notes: row.notes,
          stage: 'Longlist',
          priority: 'Unknown',
          excel_s_score: row.excel_s_score,
          excel_t_score: row.excel_t_score,
          closing_score: closingScore,
          excel_sweetspot_score: row.sweetspot_score,
          excel_qualifying_scores: qualifyingScoresObj,
          excel_contact_name: row.contact_name,
          excel_contact_email: row.contact_email,
          excel_contact_phone: row.contact_phone,
          excel_contact_role: row.contact_role,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (companyError) {
        errors.push(`${row.name}: ${companyError.message}`)
        continue
      }

      // Create contact if we have one
      if (row.contact_name && company) {
        await supabase.from('contacts').insert({
          company_id: company.id,
          name: row.contact_name,
          email: row.contact_email || null,
          phone: row.contact_phone || null,
          role: row.contact_role || null,
          relationship_strength: 'unknown',
          decision_maker_relevance: 'unknown',
        })
      }

      if (company) {
        importedIds.push(company.id)
      }
      imported++
    }

    // Log the import
    await supabase.from('imports').insert({
      filename: file.name,
      row_count: rows.length,
      imported_count: imported,
      skipped_count: skipped,
      status: 'completed',
      imported_by: user.id,
    })

    // Create a bulk list for this import batch
    if (importedIds.length > 0) {
      const listName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').trim() || 'Imported Longlist'

      const { data: bulkList } = await supabase.from('bulk_lists').insert({
        name: listName,
        description: `Imported from ${file.name} — ${imported} companies`,
        category: 'Longlist',
        source_type: 'Excel Import',
        source_name: file.name,
        created_by: user.id,
        owner_id: user.id,
        company_count: importedIds.length,
        status: 'Ready',
      }).select().single()

      if (bulkList) {
        const memberRows = importedIds.map(cid => ({
          bulk_list_id: bulkList.id,
          company_id: cid,
          list_status: 'Active',
        }))

        // Insert in chunks of 100 to avoid request size limits
        for (let i = 0; i < memberRows.length; i += 100) {
          await supabase.from('bulk_list_companies').upsert(
            memberRows.slice(i, i + 100),
            { onConflict: 'bulk_list_id,company_id', ignoreDuplicates: true }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      importedIds,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}

function parseScore(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return isNaN(num) ? null : num
}

function normalizeSegment(segment: string | null): string | null {
  if (!segment) return null
  const s = segment.toLowerCase()
  if (s.includes('warehouse') || s.includes('intralogistics')) return 'Warehouse automation and intralogistics'
  if (s.includes('industrial') && (s.includes('tech') || s.includes('machinery'))) return 'Industrial technology and machinery'
  if (s.includes('industrial') && (s.includes('vehicle') || s.includes('equipment'))) return 'Industrial technology and machinery'
  if (s.includes('robot')) return 'Robotics and automation'
  if (s.includes('maritime') || s.includes('offshore') || s.includes('subsea')) return 'Maritime, offshore and subsea'
  if (s.includes('energy') || s.includes('hvac') || s.includes('building')) return 'Energy, charging, HVAC and building technology'
  if (s.includes('medtech') || s.includes('labtech') || s.includes('pharma')) return 'Medtech and labtech'
  if (s.includes('av') || s.includes('control room') || s.includes('workplace')) return 'AV, control rooms and workplace technology'
  if (s.includes('pe-owned') || s.includes('pe owned')) return 'PE-owned B2B companies'
  return segment
}
