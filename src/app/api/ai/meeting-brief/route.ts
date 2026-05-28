import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/client'
import { buildMeetingBriefPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { company_id, company_name, contact_name, contact_role, objective, company_background, shma_hypothesis, stage } = body

    const prompt = buildMeetingBriefPrompt({
      company_name, contact_name, contact_role, objective, company_background, shma_hypothesis, stage
    })
    const response = await callClaude(prompt, SYSTEM_PROMPT, 3000)

    if (company_id) {
      await supabase.from('activity_log').insert({
        company_id,
        activity_type: 'ai_meeting_brief',
        description: 'AI meeting brief generated',
        user_id: user.id,
      })
    }

    return NextResponse.json({ content: response.content, model: response.model })
  } catch (error) {
    console.error('Meeting brief error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meeting brief generation failed' },
      { status: 500 }
    )
  }
}
