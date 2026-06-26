import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'

const COST_PER_COMPANY_USD = 0.025 // deeper research costs more
const BATCH_SIZE = 3

function buildDeepResearchPrompt(company: {
  name: string; website?: string | null; country?: string | null
  segment?: string | null; description?: string | null; notes?: string | null
  shma_fit_score?: number | null
}): string {
  return `You are a senior investment analyst at SH Management (SHMA), researching whether ${company.name} is a strong candidate for SHMA's As-a-Service / servitization advisory.

Company: ${company.name}
Website: ${company.website || 'Unknown'}
Country: ${company.country || 'Unknown'}
Segment: ${company.segment || 'Unknown'}
Description: ${company.description || 'Not available'}
Internal notes: ${company.notes || 'None'}
SHMA fit score (prior): ${company.shma_fit_score || 'Not yet scored'}

SHMA helps B2B companies with asset-heavy equipment or technology transform from CapEx sales into recurring As-a-Service models. We look for:
- Equipment or asset-heavy solutions with high customer CapEx cost
- Service/maintenance/lifecycle management potential
- Software, data, IoT, monitoring or optimization potential
- Standardizable solution (can become a platform)
- Residual value or redeployment potential after end of contract
- Funding readiness (customer can benefit from external finance)

Do a deep servitization assessment. Be specific — reference things that are specific to this company.

Return JSON with these fields:
{
  "company_snapshot": "2-3 sentences describing what the company does and how they go to market",
  "what_they_sell": "one sentence",
  "who_they_sell_to": "one sentence",
  "servitization_assessment": "2-3 sentences on whether and why servitization makes sense for them",
  "possible_aaas_concept": "one sentence — specific As-a-Service concept SHMA could help implement",
  "why_shma_relevant": "2 sentences — specific reasons SHMA is a good fit",
  "customer_capex_barrier": "one sentence — estimated magnitude of customer CapEx barrier",
  "service_support_potential": "one sentence",
  "software_data_monitoring_potential": "one sentence",
  "standardization_potential": "one sentence",
  "residual_value_redeployment": "one sentence",
  "equipment_longevity": "one sentence",
  "funding_readiness": "one sentence — how ready/receptive is the customer base to funded models",
  "end_customer_credit_quality": "one sentence",
  "strategic_triggers": ["list", "of", "known", "triggers"],
  "known_facts": ["list of things we know with confidence"],
  "ai_hypotheses": ["list of hypotheses that need validation"],
  "missing_information": ["list of information gaps"],
  "validation_tasks": ["list of specific things to verify"],
  "recommended_next_step": "one sentence — what should SHMA do next with this company",
  "shma_fit_score": <1-100 integer>,
  "opportunity_score": <1-100 integer>,
  "funding_readiness_score": <1-100 integer>,
  "confidence_level": "High" | "Medium" | "Low"
}

Be honest. If the fit is weak, say so. If information is missing, flag it. Do not invent facts.
Return ONLY valid JSON.`
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const batch_offset: number = body.batch_offset || 0
  const run_id: string | null = body.run_id || null

  const { data: list } = await supabase
    .from('bulk_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })

  const { data: listItems } = await supabase
    .from('bulk_list_companies')
    .select('company_id, companies(id, name, segment, description, notes, website, country, shma_fit_score)')
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')
    .range(batch_offset, batch_offset + BATCH_SIZE - 1)

  const totalCount = list.company_count || 0
  const isFirstBatch = batch_offset === 0

  let processRunId = run_id
  if (isFirstBatch) {
    const { data: run } = await supabase
      .from('ai_process_runs')
      .insert({
        process_type: 'Deep Research',
        bulk_list_id: id,
        started_by: user.id,
        status: 'Running',
        model: 'claude-sonnet-4-6',
        total_items: totalCount,
        processed_items: 0,
        estimated_cost: totalCount * COST_PER_COMPANY_USD,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    processRunId = run?.id || null

    await supabase.from('bulk_lists').update({
      status: 'Processing',
      last_ai_process_type: 'Deep Research',
      last_ai_process_status: 'Running',
      last_ai_process_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  }

  if (!listItems?.length) {
    // All done
    if (processRunId) {
      await supabase.from('ai_process_runs').update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', processRunId)

      await supabase.from('bulk_lists').update({
        category: 'Ready for Human Review',
        status: 'Completed',
        last_ai_process_status: 'Completed',
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    }
    return NextResponse.json({ done: true, run_id: processRunId, next_offset: null })
  }

  let processedCount = 0
  let failedCount = 0

  for (const item of listItems) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const company = item.companies as any
    if (!company) continue

    try {
      const prompt = buildDeepResearchPrompt(company)
      const result = await callClaudeJSON<Record<string, unknown>>(prompt, SYSTEM_PROMPT)

      // Upsert AI research brief
      const { data: existing } = await supabase
        .from('ai_research_briefs')
        .select('id')
        .eq('company_id', item.company_id)
        .single()

      const briefData = {
        company_id: item.company_id,
        company_snapshot: result.company_snapshot as string || null,
        what_they_sell: result.what_they_sell as string || null,
        who_they_sell_to: result.who_they_sell_to as string || null,
        possible_aaas_concept: result.possible_aaas_concept as string || null,
        why_shma_relevant: result.why_shma_relevant as string || null,
        missing_information: Array.isArray(result.missing_information)
          ? (result.missing_information as string[]).join('; ')
          : result.missing_information as string || null,
        recommended_next_action: result.recommended_next_step as string || null,
        confidence_level: result.confidence_level as string || null,
        generated_at: new Date().toISOString(),
        model_used: 'claude-sonnet-4-6',
      }

      if (existing?.id) {
        await supabase.from('ai_research_briefs').update(briefData).eq('id', existing.id)
      } else {
        await supabase.from('ai_research_briefs').insert(briefData)
      }

      // Update company scores if provided
      const scoreUpdate: Record<string, unknown> = { ai_researched: true, updated_at: new Date().toISOString() }
      if (result.shma_fit_score) scoreUpdate.shma_fit_score = result.shma_fit_score
      if (result.opportunity_score) scoreUpdate.opportunity_score = result.opportunity_score
      await supabase.from('companies').update(scoreUpdate).eq('id', item.company_id)

      await supabase.from('bulk_list_companies').update({
        deep_research_status: 'Completed',
        shma_score: (result.shma_fit_score as number) || null,
        updated_at: new Date().toISOString(),
      }).eq('bulk_list_id', id).eq('company_id', item.company_id)

      if (processRunId) {
        await supabase.from('ai_process_items').insert({
          ai_process_run_id: processRunId,
          company_id: item.company_id,
          status: 'Completed',
          output_json: result,
          cost: COST_PER_COMPANY_USD,
          completed_at: new Date().toISOString(),
        })
      }

      processedCount++
    } catch (err) {
      failedCount++
      await supabase.from('bulk_list_companies').update({
        deep_research_status: 'Failed',
        updated_at: new Date().toISOString(),
      }).eq('bulk_list_id', id).eq('company_id', item.company_id)
    }
  }

  if (processRunId) {
    const { data: currentRun } = await supabase
      .from('ai_process_runs')
      .select('processed_items, failed_items')
      .eq('id', processRunId)
      .single()

    await supabase.from('ai_process_runs').update({
      processed_items: (currentRun?.processed_items || 0) + processedCount,
      failed_items: (currentRun?.failed_items || 0) + failedCount,
      actual_cost: ((currentRun?.processed_items || 0) + processedCount) * COST_PER_COMPANY_USD,
      updated_at: new Date().toISOString(),
    }).eq('id', processRunId)
  }

  const nextOffset = batch_offset + BATCH_SIZE
  const hasMore = nextOffset < totalCount

  return NextResponse.json({
    done: !hasMore,
    run_id: processRunId,
    next_offset: hasMore ? nextOffset : null,
    processed_this_batch: processedCount,
    failed_this_batch: failedCount,
    total_processed: batch_offset + processedCount,
    total: totalCount,
  })
}
