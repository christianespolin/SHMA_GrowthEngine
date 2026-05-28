import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/client'
import { buildPipelineAnalysisPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch pipeline data
    const { data: companies } = await supabase
      .from('companies')
      .select('name, segment, stage, priority, shma_fit_score, opportunity_score, next_action, next_action_date, last_activity_date, internal_owner, notes')
      .order('updated_at', { ascending: false })

    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: 'No companies in pipeline' }, { status: 400 })
    }

    const pipelineData = companies.map(c => {
      const daysSinceActivity = c.last_activity_date
        ? Math.floor((Date.now() - new Date(c.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
        : null

      return `- ${c.name} (${c.segment || 'Unknown segment'}) | Stage: ${c.stage} | Priority: ${c.priority} | Fit: ${c.shma_fit_score ?? 'unscored'} | Owner: ${c.internal_owner || 'unassigned'} | Next action: ${c.next_action || 'NONE'} | Due: ${c.next_action_date || 'No date'} | Last activity: ${daysSinceActivity !== null ? daysSinceActivity + 'd ago' : 'never'}`
    }).join('\n')

    const prompt = buildPipelineAnalysisPrompt(pipelineData)
    const response = await callClaude(prompt, SYSTEM_PROMPT, 3000)

    return NextResponse.json({ content: response.content, model: response.model })
  } catch (error) {
    console.error('Pipeline analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pipeline analysis failed' },
      { status: 500 }
    )
  }
}
