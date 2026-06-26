import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'

const COST_PER_COMPANY_USD = 0.035
const BATCH_SIZE = 3

const CONTACT_CATEGORIES = [
  'CEO / Managing Director',
  'CFO',
  'CCO / Commercial Leader',
  'Head of Service',
  'Head of Strategy',
  'Product / Technology leader',
  'Board member',
  'Chair',
  'Owner',
  'Shareholder',
  'PE owner',
  'Investor',
  'Warm intro source',
  'Advisor',
]

function buildContactResearchPrompt(company: {
  name: string; website?: string | null; country?: string | null
  segment?: string | null; description?: string | null
  possible_aaas_concept?: string | null
}): string {
  return `You are researching contacts at ${company.name} for SH Management (SHMA), an As-a-Service advisory firm.

Company: ${company.name}
Website: ${company.website || 'Unknown'}
Country: ${company.country || 'Unknown'}
Segment: ${company.segment || 'Unknown'}
Description: ${company.description || 'Not available'}
SHMA opportunity: ${company.possible_aaas_concept || 'Servitization / As-a-Service transformation'}

SHMA needs to reach the right decision-makers to discuss a potential As-a-Service transformation.

Research and return the most likely key contacts. Only include contacts where you have reasonable confidence from public sources (company website, LinkedIn, news, annual reports).

IMPORTANT RULES:
- Never invent email addresses or phone numbers
- Never invent shareholders, board members or owners without public evidence
- Mark everything with a confidence level
- "Known from source" = found in a specific public document or official website
- "AI hypothesis" = reasonable inference but not confirmed
- "Needs validation" = requires manual verification before use

Return JSON:
{
  "contacts": [
    {
      "full_name": "string or null if unknown",
      "suggested_role": "string — what role we need even if name unknown",
      "category": "CEO / Managing Director | CFO | CCO / Commercial Leader | Head of Service | Head of Strategy | Product / Technology leader | Board member | Chair | Owner | Shareholder | PE owner | Investor | Warm intro source | Advisor",
      "title": "string or null",
      "linkedin_url": "string or null — only if you have high confidence",
      "source": "string — where this was found",
      "confidence": "Known from source | AI hypothesis | Needs validation",
      "outreach_priority": 1-5,
      "outreach_angle": "string — why this specific person, what angle to use",
      "missing_information": ["list of what we still need"]
    }
  ],
  "ownership_summary": "1-2 sentences on ownership structure if known",
  "board_summary": "1-2 sentences on board composition if known",
  "warm_intro_paths": ["list of potential warm intro routes if any"],
  "recommended_approach": "string — overall recommended approach path for SHMA",
  "contact_coverage": "Weak | Partial | Good | Strong"
}

Return ONLY valid JSON. Include at least 2-4 contacts even if confidence is low.`
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const batch_offset: number = body.batch_offset || 0
  const run_id: string | null = body.run_id || null

  const { data: list } = await supabase.from('bulk_lists').select('*').eq('id', id).single()
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })

  // Fetch companies + their existing AI brief
  const { data: listItems } = await supabase
    .from('bulk_list_companies')
    .select(`
      company_id,
      companies ( id, name, segment, description, notes, website, country ),
      ai_briefs:companies ( ai_research_briefs ( possible_aaas_concept ) )
    `)
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')
    .range(batch_offset, batch_offset + BATCH_SIZE - 1)

  const totalCount = list.company_count || 0
  const isFirstBatch = batch_offset === 0

  let processRunId = run_id
  if (isFirstBatch) {
    const { data: run } = await supabase.from('ai_process_runs').insert({
      process_type: 'Contact Research',
      bulk_list_id: id,
      started_by: user.id,
      status: 'Running',
      model: 'claude-sonnet-4-6',
      total_items: totalCount,
      processed_items: 0,
      estimated_cost: totalCount * COST_PER_COMPANY_USD,
      started_at: new Date().toISOString(),
    }).select().single()
    processRunId = run?.id || null

    await supabase.from('bulk_lists').update({
      status: 'Processing',
      last_ai_process_type: 'Contact Research',
      last_ai_process_status: 'Running',
      last_ai_process_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  }

  if (!listItems?.length) {
    // All done — move to Qualified Targets in Customer Kanban
    if (processRunId) {
      await supabase.from('ai_process_runs').update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', processRunId)

      // Move all companies in this list to Qualified Targets stage
      const { data: allItems } = await supabase
        .from('bulk_list_companies')
        .select('company_id')
        .eq('bulk_list_id', id)
        .eq('list_status', 'Active')

      if (allItems?.length) {
        const companyIds = allItems.map(i => i.company_id)
        await supabase.from('companies')
          .update({ stage: 'Qualified Targets', updated_at: new Date().toISOString() })
          .in('id', companyIds)

        // Mark all as converted
        await supabase.from('bulk_list_companies')
          .update({ list_status: 'Converted', contact_research_status: 'Completed', updated_at: new Date().toISOString() })
          .eq('bulk_list_id', id)

        // Activity log
        await supabase.from('activity_log').insert(
          companyIds.map(cid => ({
            company_id: cid,
            activity_type: 'moved_to_kanban',
            title: 'Moved to Customer Kanban',
            description: 'Contact Research completed — moved to Qualified Targets in Customer Kanban',
            user_id: user.id,
            related_bulk_list_id: id,
            related_ai_process_run_id: processRunId,
          }))
        )
      }

      await supabase.from('bulk_lists').update({
        category: 'Converted to Customer Kanban',
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const briefData = (item as any).ai_briefs?.ai_research_briefs?.[0]

    try {
      const prompt = buildContactResearchPrompt({
        name: company.name,
        website: company.website,
        country: company.country,
        segment: company.segment,
        description: company.description,
        possible_aaas_concept: briefData?.possible_aaas_concept,
      })

      const result = await callClaudeJSON<{
        contacts: Array<{
          full_name: string | null; suggested_role: string; category: string
          title: string | null; linkedin_url: string | null
          source: string; confidence: string
          outreach_priority: number; outreach_angle: string
          missing_information: string[]
        }>
        ownership_summary: string; board_summary: string
        warm_intro_paths: string[]; recommended_approach: string
        contact_coverage: string
      }>(prompt, SYSTEM_PROMPT)

      // Insert contacts
      for (const contact of (result.contacts || [])) {
        if (!CONTACT_CATEGORIES.includes(contact.category)) continue

        // Check if contact already exists
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('company_id', item.company_id)
          .eq('name', contact.full_name || contact.suggested_role)
          .maybeSingle()

        if (!existing) {
          await supabase.from('contacts').insert({
            company_id: item.company_id,
            name: contact.full_name || contact.suggested_role,
            full_name: contact.full_name,
            title: contact.title,
            role: contact.category,
            linkedin_url: contact.linkedin_url,
            source_type: 'AI Research',
            known_or_hypothesis: contact.confidence === 'Known from source' ? 'Known contact'
              : contact.confidence === 'AI hypothesis' ? 'Hypothesis' : 'Needs validation',
            contact_status: 'Suggested',
            decision_power_score: contact.outreach_priority,
            ai_rationale: contact.outreach_angle,
          })
        }
      }

      // Update company coverage score
      if (result.contact_coverage) {
        await supabase.from('companies').update({
          contact_coverage_score: result.contact_coverage,
          updated_at: new Date().toISOString(),
        }).eq('id', item.company_id)
      }

      await supabase.from('bulk_list_companies').update({
        contact_research_status: 'Completed',
        updated_at: new Date().toISOString(),
      }).eq('bulk_list_id', id).eq('company_id', item.company_id)

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
    } catch {
      failedCount++
      await supabase.from('bulk_list_companies').update({
        contact_research_status: 'Failed',
        updated_at: new Date().toISOString(),
      }).eq('bulk_list_id', id).eq('company_id', item.company_id)
    }
  }

  if (processRunId) {
    const { data: currentRun } = await supabase
      .from('ai_process_runs').select('processed_items, failed_items').eq('id', processRunId).single()

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
