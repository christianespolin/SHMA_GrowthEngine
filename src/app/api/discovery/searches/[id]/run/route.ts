import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/client'
import { buildDiscoveryPrompt } from '@/lib/ai/prompts'
import { enrichDiscoveryCriteria } from '@/lib/ai/web-search'

// Allow up to 5 minutes — AI generation for 25+ companies takes time
export const maxDuration = 300

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonArray(text: string): any[] | null {
  // Try direct parse first
  try {
    const parsed = JSON.parse(text.trim())
    if (Array.isArray(parsed)) return parsed
  } catch { /* fall through */ }

  // Try extracting array from text
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed)) return parsed
    } catch { /* fall through */ }
  }

  return null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch the search
    const { data: search, error: searchError } = await supabase
      .from('discovery_searches')
      .select('*')
      .eq('id', id)
      .single()

    if (searchError || !search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Set status to running
    await supabase
      .from('discovery_searches')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', id)

    // Fetch existing company names to avoid duplicates
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('name')
      .order('name')

    const existingNames = (existingCompanies || []).map((c: { name: string }) => c.name)

    // Build and call AI
    const webContext = await enrichDiscoveryCriteria(search.criteria_json || {})
    const prompt = buildDiscoveryPrompt({
      criteria: search.criteria_json,
      number_requested: search.number_requested || 25,
      search_depth: search.search_depth || 'standard',
      mode: search.mode || 'generate',
      existing_companies: existingNames,
    }) + webContext

    let suggestions = null
    let aiResponse = null

    try {
      aiResponse = await callClaude(prompt, undefined, 16000)
      suggestions = parseJsonArray(aiResponse.content)

      // Retry once with repair prompt if parse failed
      if (!suggestions) {
        const repairPrompt = `The following text is a JSON array that failed to parse. Fix it and return ONLY valid JSON:\n\n${aiResponse.content}`
        const repairResponse = await callClaude(repairPrompt, undefined, 16000)
        suggestions = parseJsonArray(repairResponse.content)
      }
    } catch (aiError) {
      console.error('AI call error:', aiError)
      await supabase
        .from('discovery_searches')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    if (!suggestions || !Array.isArray(suggestions)) {
      await supabase
        .from('discovery_searches')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Delete any existing suggestions for this search
    await supabase
      .from('discovery_suggestions')
      .delete()
      .eq('discovery_search_id', id)

    // Insert suggestions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData = suggestions.map((s: any) => ({
      discovery_search_id: id,
      company_name: s.company_name || 'Unknown',
      website: s.website || null,
      country: s.country || null,
      region: s.region || null,
      segment: s.segment || null,
      subsegment: s.subsegment || null,
      description: s.description || null,
      what_they_sell: s.what_they_sell || null,
      shma_fit_reason: s.why_they_fit_shma || null,
      possible_as_a_service_concept: s.possible_as_a_service_concept || null,
      capex_barrier: s.customer_capex_barrier || null,
      service_potential: s.service_support_potential || null,
      software_data_monitoring_potential: s.software_data_monitoring_potential || null,
      financing_logic: s.financing_logic || null,
      strategic_trigger: s.strategic_trigger || null,
      suggested_decision_makers: s.suggested_decision_makers || [],
      outreach_angle: s.outreach_angle || null,
      scores_json: s.scores || {},
      shma_fit_score: s.shma_fit_score || null,
      opportunity_score: s.opportunity_score || null,
      confidence_score: s.confidence_score || null,
      overall_priority: s.overall_priority || null,
      confidence_level: s.confidence_level || null,
      known_information: s.known_information || [],
      ai_hypotheses: s.ai_hypotheses || [],
      missing_information: s.missing_information || [],
      validation_tasks: s.validation_tasks || [],
      ai_rationale: s.ai_rationale || null,
      recommendation: s.recommendation || null,
      status: 'suggested',
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('discovery_suggestions')
      .insert(insertData)
      .select()

    if (insertError) {
      console.error('Insert suggestions error:', insertError)
      await supabase
        .from('discovery_searches')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ error: 'Failed to save suggestions' }, { status: 500 })
    }

    // Mark search as completed
    await supabase
      .from('discovery_searches')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ suggestions: inserted, count: inserted?.length || 0 })
  } catch (error) {
    console.error('POST discovery run error:', error)
    return NextResponse.json({ error: 'Failed to run discovery search' }, { status: 500 })
  }
}
