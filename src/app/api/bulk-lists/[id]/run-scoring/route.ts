import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { buildScoringPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts'

// Cost estimate: ~0.003 USD per company for scoring (input + output tokens)
const COST_PER_COMPANY_USD = 0.003
const BATCH_SIZE = 5 // process in small batches to stay within route timeout

interface ScoringResult {
  scores: Record<string, number>
  shma_fit_score: number
  opportunity_score: number
  closing_score: number
  overall_priority_score: number
  priority: string
  confidence_level: string
  overall_explanation: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  // batch_offset allows the client to call this endpoint repeatedly to process the full list
  const batch_offset: number = body.batch_offset || 0
  const run_id: string | null = body.run_id || null

  // Fetch the bulk list
  const { data: list } = await supabase
    .from('bulk_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })

  // Fetch companies in this list (paginated via offset)
  const { data: listItems } = await supabase
    .from('bulk_list_companies')
    .select('company_id, companies(id, name, segment, description, notes, website)')
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')
    .range(batch_offset, batch_offset + BATCH_SIZE - 1)

  const totalCount = list.company_count || 0
  const isFirstBatch = batch_offset === 0

  // Create or retrieve the AI process run
  let processRunId = run_id
  if (isFirstBatch) {
    const { data: run } = await supabase
      .from('ai_process_runs')
      .insert({
        process_type: 'SHMA Scoring',
        bulk_list_id: id,
        started_by: user.id,
        status: 'Running',
        model: 'claude-haiku-4-5-20251001',
        total_items: totalCount,
        processed_items: 0,
        estimated_cost: totalCount * COST_PER_COMPANY_USD,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    processRunId = run?.id || null

    // Update bulk list status
    await supabase.from('bulk_lists').update({
      status: 'Processing',
      last_ai_process_type: 'SHMA Scoring',
      last_ai_process_status: 'Running',
      last_ai_process_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  }

  if (!listItems?.length) {
    // No more items — run is complete
    if (processRunId) {
      const { data: finalRun } = await supabase
        .from('ai_process_runs')
        .select('processed_items, failed_items')
        .eq('id', processRunId)
        .single()

      await supabase.from('ai_process_runs').update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', processRunId)

      await supabase.from('bulk_lists').update({
        category: 'AI Researched',
        status: 'Completed',
        last_ai_process_status: 'Completed',
        updated_at: new Date().toISOString(),
      }).eq('id', id)

      await supabase.from('activity_log').insert({
        company_id: listItems?.[0]?.company_id || null,
        activity_type: 'ai_scoring_batch_complete',
        title: 'AI Scoring completed',
        description: `SHMA Scoring completed for list "${list.name}". ${finalRun?.processed_items || 0} scored, ${finalRun?.failed_items || 0} failed.`,
        user_id: user.id,
        related_bulk_list_id: id,
        related_ai_process_run_id: processRunId,
      }).filter('company_id', 'not.is', null)
    }
    return NextResponse.json({ done: true, run_id: processRunId, next_offset: null })
  }

  // Process this batch
  let processedCount = 0
  let failedCount = 0
  const items: { company_id: string; status: string; error_message?: string }[] = []

  for (const item of listItems) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const company = item.companies as any
    if (!company) continue

    try {
      const prompt = buildScoringPrompt({
        company_name: company.name,
        segment: company.segment,
        description: company.description,
        notes: company.notes,
        website: company.website,
      })

      const result = await callClaudeJSON<ScoringResult>(prompt, SYSTEM_PROMPT)

      // Update company
      await supabase.from('companies').update({
        shma_fit_score: result.shma_fit_score,
        opportunity_score: result.opportunity_score,
        closing_score: result.closing_score,
        overall_priority_score: result.overall_priority_score,
        priority: result.priority,
        score_breakdown: result.scores,
        score_explanation: result.overall_explanation,
        score_confidence: result.confidence_level,
        ai_researched: true,
        updated_at: new Date().toISOString(),
      }).eq('id', item.company_id)

      // Update bulk_list_companies score
      await supabase.from('bulk_list_companies').update({
        shma_score: result.shma_fit_score,
        updated_at: new Date().toISOString(),
      }).eq('bulk_list_id', id).eq('company_id', item.company_id)

      // Insert AI process item record
      if (processRunId) {
        await supabase.from('ai_process_items').insert({
          ai_process_run_id: processRunId,
          company_id: item.company_id,
          status: 'Completed',
          output_json: result as unknown as Record<string, unknown>,
          cost: COST_PER_COMPANY_USD,
          completed_at: new Date().toISOString(),
        })
      }

      processedCount++
      items.push({ company_id: item.company_id, status: 'Completed' })
    } catch (err) {
      failedCount++
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      items.push({ company_id: item.company_id, status: 'Failed', error_message: errMsg })
      if (processRunId) {
        await supabase.from('ai_process_items').insert({
          ai_process_run_id: processRunId,
          company_id: item.company_id,
          status: 'Failed',
          error_message: errMsg,
        })
      }
    }
  }

  // Update run progress
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
    items,
  })
}
