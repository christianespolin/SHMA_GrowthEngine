import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SelectionCriteria {
  min_shma_score?: number
  min_opportunity_score?: number
  countries?: string[]
  segments?: string[]
  max_companies?: number
  exclude_sensitive: boolean
  exclude_do_not_contact: boolean
  exclude_not_interesting: boolean
  notes?: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const criteria: SelectionCriteria = await request.json()

  const { data: list } = await supabase
    .from('bulk_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })

  // Fetch all active companies in this list with their company data
  const { data: items } = await supabase
    .from('bulk_list_companies')
    .select(`
      company_id, shma_score,
      companies (
        id, name, country, segment, shma_fit_score, opportunity_score,
        sensitivity_status, overall_priority_score
      )
    `)
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')

  if (!items?.length) return NextResponse.json({ error: 'No companies in list' }, { status: 400 })

  // Apply selection criteria
  const qualifying: string[] = []
  const pending: string[] = []

  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const company = item.companies as any
    if (!company) continue

    // Sensitivity exclusions
    if (criteria.exclude_do_not_contact && company.sensitivity_status === 'Do not contact') {
      continue
    }
    if (criteria.exclude_sensitive && ['Sensitive', 'Contact only through named person'].includes(company.sensitivity_status)) {
      pending.push(item.company_id)
      continue
    }
    if (criteria.exclude_not_interesting && company.sensitivity_status === 'Not interesting') {
      continue
    }

    // Score thresholds
    const score = item.shma_score || company.shma_fit_score || 0
    const oppScore = company.opportunity_score || 0

    if (criteria.min_shma_score && score < criteria.min_shma_score) {
      pending.push(item.company_id)
      continue
    }
    if (criteria.min_opportunity_score && oppScore < criteria.min_opportunity_score) {
      pending.push(item.company_id)
      continue
    }

    // Country filter
    if (criteria.countries?.length && !criteria.countries.includes(company.country)) {
      pending.push(item.company_id)
      continue
    }

    // Segment filter
    if (criteria.segments?.length && !criteria.segments.some(s => company.segment?.includes(s))) {
      pending.push(item.company_id)
      continue
    }

    qualifying.push(item.company_id)
  }

  // Apply max_companies cap
  const capped = criteria.max_companies && qualifying.length > criteria.max_companies
    ? qualifying.slice(0, criteria.max_companies)
    : qualifying

  const overCap = criteria.max_companies && qualifying.length > criteria.max_companies
    ? qualifying.slice(criteria.max_companies)
    : []

  const allPending = [...pending, ...overCap]

  if (capped.length === 0) {
    return NextResponse.json({ error: 'No companies qualify with these criteria. Loosen the filters.' }, { status: 400 })
  }

  // Create "Ready for AI Deep Research" sub-list
  const { data: deepResearchList } = await supabase
    .from('bulk_lists')
    .insert({
      name: `${list.name} — Ready for Deep Research`,
      description: criteria.notes || null,
      category: 'Ready for AI Deep Research',
      source_type: 'Selection from Existing List',
      source_notes: `Selected from "${list.name}" — criteria: SHMA score ≥ ${criteria.min_shma_score || 0}, ${capped.length} companies`,
      parent_bulk_list_id: id,
      created_by: user.id,
      status: 'Ready',
      company_count: capped.length,
      selection_criteria_json: criteria as unknown as Record<string, unknown>,
    })
    .select()
    .single()

  if (!deepResearchList) return NextResponse.json({ error: 'Failed to create sub-list' }, { status: 500 })

  await supabase.from('bulk_list_companies').insert(
    capped.map(cid => ({ bulk_list_id: deepResearchList.id, company_id: cid, list_status: 'Active', selection_reason: `Score threshold met` }))
  )

  // Create "AI Researched, Pending" sub-list for the remainder
  let pendingList = null
  if (allPending.length > 0) {
    const { data: pl } = await supabase
      .from('bulk_lists')
      .insert({
        name: `${list.name} — Pending`,
        category: 'AI Researched, Pending',
        source_type: 'Selection from Existing List',
        source_notes: `Did not qualify during selection from "${list.name}"`,
        parent_bulk_list_id: id,
        created_by: user.id,
        status: 'Ready',
        company_count: allPending.length,
      })
      .select()
      .single()

    if (pl) {
      pendingList = pl
      await supabase.from('bulk_list_companies').insert(
        allPending.map(cid => ({ bulk_list_id: pl.id, company_id: cid, list_status: 'Active', rejection_reason: 'Did not meet selection criteria' }))
      )
    }
  }

  // Update source list: store criteria used
  await supabase.from('bulk_lists').update({
    selection_criteria_json: criteria as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.json({
    ok: true,
    deep_research_list: deepResearchList,
    pending_list: pendingList,
    qualifying_count: capped.length,
    pending_count: allPending.length,
  })
}
