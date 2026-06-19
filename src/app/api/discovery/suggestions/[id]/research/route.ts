import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/client'

export const maxDuration = 120

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: s } = await supabase
    .from('discovery_suggestions')
    .select('*')
    .eq('id', id)
    .single()

  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.from('discovery_suggestions').update({ ai_research_status: 'running' }).eq('id', id)

  const prompt = `You are an expert B2B servitization analyst for SHMA.

SHMA helps asset-heavy B2B companies move from CapEx/equipment sales into As-a-Service, managed service, subscription, pay-per-use, or outcome-based models.

Do a deep research analysis on this company:
Company: ${s.company_name}
Website: ${s.website || 'Unknown'}
Country: ${s.country || 'Unknown'}
Segment: ${s.segment || 'Unknown'}
Known description: ${s.description || 'None'}
Initial SHMA fit rationale: ${s.shma_fit_reason || s.why_they_fit_shma || 'None'}

Return ONLY valid JSON (no markdown) with exactly this structure:
{
  "what_they_sell": "one clear sentence",
  "why_they_fit_shma": "2-3 sentences — specific servitization rationale",
  "possible_as_a_service_concept": "specific XaaS concept (e.g. pay-per-scan, uptime guarantee, managed fleet model)",
  "customer_capex_barrier": "describe the upfront cost or complexity customers face",
  "service_support_potential": "what service/maintenance/lifecycle opportunity exists",
  "software_data_monitoring_potential": "IoT/data/software opportunity if any",
  "financing_logic": "how financing or risk-sharing could work",
  "strategic_trigger": "why now is the right time for this company",
  "suggested_decision_makers": ["3-4 specific role titles to target"],
  "outreach_angle": "specific first message angle for SHMA",
  "scores": {
    "asset_intensity": 1-5,
    "customer_upfront_investment": 1-5,
    "technical_complexity": 1-5,
    "service_support_potential": 1-5,
    "software_data_monitoring_potential": 1-5,
    "standardization_potential": 1-5,
    "residual_value_redeployment_potential": 1-5,
    "recurring_revenue_potential": 1-5,
    "strategic_trigger_strength": 1-5,
    "commercial_value_to_shma": 1-5
  },
  "known_information": ["up to 4 facts from training data"],
  "ai_hypotheses": ["up to 3 reasonable but unverified assumptions"],
  "missing_information": ["up to 3 key gaps to validate"],
  "validation_tasks": ["up to 3 specific things to verify before outreach"],
  "ai_rationale": "2-3 sentence overall assessment",
  "recommendation": "concrete recommended next action for SHMA"
}`

  try {
    const response = await callClaude(prompt, undefined, 2000, 90_000)
    const text = response.content.trim()

    let result: Record<string, unknown>
    try {
      result = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON found')
      result = JSON.parse(match[0])
    }

    const updates = {
      what_they_sell: result.what_they_sell,
      shma_fit_reason: result.why_they_fit_shma,
      possible_as_a_service_concept: result.possible_as_a_service_concept,
      capex_barrier: result.customer_capex_barrier,
      service_potential: result.service_support_potential,
      software_data_monitoring_potential: result.software_data_monitoring_potential,
      financing_logic: result.financing_logic,
      strategic_trigger: result.strategic_trigger,
      suggested_decision_makers: result.suggested_decision_makers,
      outreach_angle: result.outreach_angle,
      scores_json: result.scores,
      known_information: result.known_information,
      ai_hypotheses: result.ai_hypotheses,
      missing_information: result.missing_information,
      validation_tasks: result.validation_tasks,
      ai_rationale: result.ai_rationale,
      recommendation: result.recommendation,
      ai_research_status: 'completed',
    }

    const { data: updated } = await supabase
      .from('discovery_suggestions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Research error:', err)
    await supabase.from('discovery_suggestions').update({ ai_research_status: 'failed' }).eq('id', id)
    return NextResponse.json({ error: 'Research failed' }, { status: 500 })
  }
}
