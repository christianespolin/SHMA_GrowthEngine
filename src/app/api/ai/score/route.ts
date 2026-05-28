import { NextRequest, NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { buildScoringPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

interface ScoringResult {
  scores: Record<string, number>
  score_explanations: Record<string, string>
  shma_fit_score: number
  opportunity_score: number
  closing_score: number
  overall_priority_score: number
  priority: string
  confidence_level: string
  confidence_reason: string
  missing_information: string[]
  disqualification_flags: string[]
  recommended_questions: string[]
  overall_explanation: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { company_id, company_name, segment, description, notes, website } = body

    if (!company_name) {
      return NextResponse.json({ error: 'company_name is required' }, { status: 400 })
    }

    const prompt = buildScoringPrompt({ company_name, segment, description, notes, website })
    const result = await callClaudeJSON<ScoringResult>(prompt, SYSTEM_PROMPT)

    if (company_id) {
      const { error } = await supabase
        .from('companies')
        .update({
          shma_fit_score: result.shma_fit_score,
          opportunity_score: result.opportunity_score,
          closing_score: result.closing_score,
          overall_priority_score: result.overall_priority_score,
          priority: result.priority,
          score_breakdown: result.scores,
          score_explanation: result.overall_explanation,
          score_confidence: result.confidence_level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', company_id)

      if (!error) {
        await supabase.from('activity_log').insert({
          company_id,
          activity_type: 'ai_scoring',
          description: `AI scoring completed. Priority: ${result.priority}, Fit Score: ${result.shma_fit_score}`,
          user_id: user.id,
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI scoring error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI scoring failed' },
      { status: 500 }
    )
  }
}
