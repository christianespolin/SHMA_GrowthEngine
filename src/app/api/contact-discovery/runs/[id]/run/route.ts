import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { callClaude } from '@/lib/ai/client'
import { buildContactDiscoveryPrompt } from '@/lib/ai/prompts'
import { enrichContactsWithWebSearch } from '@/lib/ai/web-search'

// Web search (≤32s) + AI generation (≤100s) + overhead — stay well within 5 min
export const maxDuration = 180

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonArray(text: string): any[] | null {
  try {
    const parsed = JSON.parse(text.trim())
    if (Array.isArray(parsed)) return parsed
  } catch { /* fall through */ }

  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed)) return parsed
    } catch { /* fall through */ }
  }

  return null
}

async function recalculateContactCoverage(supabase: SupabaseClient, companyId: string) {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('role_category, outreach_fit_score, decision_power_score, contact_status')
    .eq('company_id', companyId)
    .not('contact_status', 'in', '("Rejected","Do not contact")')

  const all = contacts || []
  const hasDecisionMaker = all.some((c: { role_category: string; decision_power_score: number | null }) =>
    ['Executive sponsor', 'Finance / ownership'].includes(c.role_category) &&
    (c.decision_power_score || 0) >= 4
  )
  const hasHighOutreach = all.some((c: { outreach_fit_score: number | null }) => (c.outreach_fit_score || 0) >= 4)

  const coverageScore = all.length === 0 ? 0 :
    Math.min(5, Math.round((
      (hasDecisionMaker ? 2 : 0) +
      (hasHighOutreach ? 1 : 0) +
      Math.min(2, all.length / 2)
    ) * 10) / 10)

  await supabase.from('companies').update({
    contact_coverage_score: coverageScore,
    decision_maker_identified: hasDecisionMaker,
    warm_intro_available: all.some((c: { contact_status: string }) => c.contact_status === 'Responded'),
  }).eq('id', companyId)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch the run
    const { data: run, error: runError } = await supabase
      .from('contact_discovery_runs')
      .select('*')
      .eq('id', id)
      .single()

    if (runError || !run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    // Set status to running
    await supabase
      .from('contact_discovery_runs')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', id)

    // Fetch company
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', run.company_id)
      .single()

    if (!company) {
      await supabase.from('contact_discovery_runs').update({ status: 'failed' }).eq('id', id)
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch research brief
    const { data: brief } = await supabase
      .from('ai_research_briefs')
      .select('*')
      .eq('company_id', run.company_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Fetch existing contacts
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('name, role')
      .eq('company_id', run.company_id)

    const criteria = run.criteria_json || {}
    const numberRequested = criteria.number_requested || 8

    // Web search: scan news articles, press releases, and company website for real named executives
    // Non-fatal — if it fails or times out the AI falls back to role suggestions
    const webContext = await enrichContactsWithWebSearch(
      company.name as string,
      (company.website as string | undefined) || undefined
    )

    // Build prompt (includes web context if found)
    const prompt = buildContactDiscoveryPrompt({
      company,
      brief,
      existingContacts: (existingContacts || []).map((c: { name: string; role: string | null }) => ({ name: c.name, role: c.role })),
      criteria: {
        target_roles: criteria.target_roles || [],
        seniority: criteria.seniority || '',
        preferred_entry: criteria.preferred_entry || '',
        pasted_text: criteria.pasted_text || '',
        instructions: criteria.instructions || '',
        source_types: criteria.source_types || [],
      },
      numberRequested,
      webContext,
    })

    let suggestions = null
    let aiResponse = null

    try {
      const AI_TIMEOUT_MS = 100_000
      aiResponse = await callClaude(prompt, undefined, 8192, AI_TIMEOUT_MS)
      suggestions = parseJsonArray(aiResponse.content)

      if (!suggestions) {
        const repairPrompt = `The following text is a JSON array that failed to parse. Fix it and return ONLY valid JSON:\n\n${aiResponse.content}`
        const repairResponse = await callClaude(repairPrompt, undefined, 8192, AI_TIMEOUT_MS)
        suggestions = parseJsonArray(repairResponse.content)
      }
    } catch (aiError) {
      console.error('AI call error:', aiError)
      await supabase.from('contact_discovery_runs').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', id)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    if (!suggestions || !Array.isArray(suggestions)) {
      await supabase.from('contact_discovery_runs').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', id)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Delete old suggestions for this run
    await supabase.from('contact_suggestions').delete().eq('discovery_run_id', id)

    // Insert suggestions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData = suggestions.map((s: any) => ({
      discovery_run_id: id,
      company_id: run.company_id,
      full_name: s.full_name || null,
      title: s.title || null,
      role_category: s.role_category || 'Other influencer',
      seniority: s.seniority || null,
      department: s.department || null,
      suggested_role_to_find: s.suggested_role_to_find || null,
      email: s.email || null,
      email_status: s.email_status || 'Unknown',
      phone: s.phone || null,
      phone_status: s.phone_status || 'Unknown',
      mobile: s.mobile || null,
      mobile_status: s.mobile_status || 'Unknown',
      linkedin_url: s.linkedin_url || null,
      linkedin_status: s.linkedin_status || 'Unknown',
      source_type: s.source_type || 'AI suggested role',
      source_url: s.source_url || null,
      known_or_hypothesis: s.known_or_hypothesis || 'Suggested role',
      scores_json: {
        decision_power_score: s.decision_power_score,
        shma_relevance_score: s.shma_relevance_score,
        outreach_fit_score: s.outreach_fit_score,
        relationship_potential_score: s.relationship_potential_score,
        confidence_score: s.confidence_score,
      },
      decision_power_score: s.decision_power_score || null,
      shma_relevance_score: s.shma_relevance_score || null,
      outreach_fit_score: s.outreach_fit_score || null,
      relationship_potential_score: s.relationship_potential_score || null,
      confidence_score: s.confidence_score || null,
      ai_rationale: s.ai_rationale || null,
      outreach_angle: s.outreach_angle || null,
      missing_information: s.missing_information || [],
      validation_tasks: s.validation_tasks || [],
      recommended_next_action: s.recommended_next_action || null,
      status: 'Suggested',
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('contact_suggestions')
      .insert(insertData)
      .select()

    if (insertError) {
      console.error('Insert suggestions error:', insertError)
      await supabase.from('contact_discovery_runs').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', id)
      return NextResponse.json({ error: 'Failed to save suggestions' }, { status: 500 })
    }

    // Mark run as completed
    await supabase
      .from('contact_discovery_runs')
      .update({
        status: 'completed',
        summary: `Generated ${inserted?.length || 0} contact suggestions`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    // Recalculate coverage
    await recalculateContactCoverage(supabase, run.company_id)

    // Activity log
    await supabase.from('activity_log').insert({
      company_id: run.company_id,
      activity_type: 'contact_discovery_completed',
      description: `AI generated ${inserted?.length || 0} contact suggestions`,
      user_id: user.id,
    })

    return NextResponse.json({ suggestions: inserted, count: inserted?.length || 0 })
  } catch (error) {
    console.error('POST contact discovery run error:', error)
    return NextResponse.json({ error: 'Failed to run contact discovery' }, { status: 500 })
  }
}
