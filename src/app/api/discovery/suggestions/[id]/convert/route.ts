import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function extractDomain(url: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const initial_stage = body.initial_stage || 'AI Researched'

    // Fetch the suggestion
    const { data: suggestion, error: suggError } = await supabase
      .from('discovery_suggestions')
      .select('*')
      .eq('id', id)
      .single()

    if (suggError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    // Check for duplicates
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('id, name, website')

    let duplicate_warning = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existing_company: { id: string; name: string } | undefined = undefined

    const suggNorm = normalizeName(suggestion.company_name)
    const suggDomain = extractDomain(suggestion.website)

    for (const c of (allCompanies || [])) {
      const compNorm = normalizeName(c.name)
      const compDomain = extractDomain(c.website)

      if (compNorm === suggNorm || (suggDomain && compDomain && suggDomain === compDomain)) {
        duplicate_warning = true
        existing_company = { id: c.id, name: c.name }
        break
      }
    }

    // Create the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: suggestion.company_name,
        website: suggestion.website || null,
        country: suggestion.country || null,
        segment: suggestion.segment || null,
        subsegment: suggestion.subsegment || null,
        description: suggestion.description || null,
        stage: initial_stage,
        priority: mapPriority(suggestion.overall_priority),
        shma_fit_score: suggestion.shma_fit_score || null,
        opportunity_score: suggestion.opportunity_score || null,
        ai_researched: true,
        lead_source: 'AI Discovery',
        notes: suggestion.ai_rationale || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (companyError) throw companyError

    // Create AI research brief
    await supabase.from('ai_research_briefs').insert({
      company_id: company.id,
      company_snapshot: suggestion.description || null,
      what_they_sell: suggestion.what_they_sell || null,
      possible_aaas_concept: suggestion.possible_as_a_service_concept || null,
      why_shma_relevant: suggestion.shma_fit_reason || null,
      strategic_trigger: suggestion.strategic_trigger || null,
      suggested_entry_angle: suggestion.outreach_angle || null,
      recommended_next_action: suggestion.recommendation || null,
      confidence_level: suggestion.confidence_level || null,
      missing_information: Array.isArray(suggestion.missing_information)
        ? suggestion.missing_information.join('\n')
        : null,
      model_used: 'discovery',
      generated_at: new Date().toISOString(),
    })

    // Create activity log
    await supabase.from('activity_log').insert({
      company_id: company.id,
      activity_type: 'ai_suggestion_converted',
      description: `Company added to pipeline from AI Discovery search`,
      user_id: user.id,
    })

    // Update suggestion
    await supabase
      .from('discovery_suggestions')
      .update({
        status: 'converted_to_lead',
        converted_company_id: company.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      company_id: company.id,
      duplicate_warning,
      existing_company,
    }, { status: 201 })
  } catch (error) {
    console.error('POST convert suggestion error:', error)
    return NextResponse.json({ error: 'Failed to convert suggestion' }, { status: 500 })
  }
}

function mapPriority(overall_priority: string | null): string {
  if (!overall_priority) return 'Unknown'
  if (overall_priority === 'A-priority') return 'A'
  if (overall_priority === 'B-priority') return 'B'
  if (overall_priority === 'C-priority') return 'C'
  if (overall_priority === 'Nurture') return 'Nurture'
  if (overall_priority === 'Disqualified') return 'Disqualified'
  return 'Unknown'
}
