import { NextRequest, NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { buildOutreachPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      company_id, company_name, contact_id, contact_name, contact_role,
      shma_hypothesis, channel, tone, sender_name, save = true
    } = body

    if (!company_name || !channel) {
      return NextResponse.json({ error: 'company_name and channel are required' }, { status: 400 })
    }

    const prompt = buildOutreachPrompt({
      company_name, contact_name, contact_role, shma_hypothesis,
      channel, tone, sender_name
    })
    const result = await callClaudeJSON<Record<string, string>>(prompt, SYSTEM_PROMPT)

    if (company_id && save) {
      const messages = []

      if (channel === 'linkedin') {
        if (result.connection_request) {
          messages.push({
            company_id, contact_id: contact_id || null,
            message_type: 'linkedin',
            content: result.connection_request,
            contact_name: contact_name || null,
            contact_title: contact_role || null,
            channel,
            tone, status: 'draft',
            generated_at: new Date().toISOString(),
          })
        }
        if (result.follow_up_message) {
          messages.push({
            company_id, contact_id: contact_id || null,
            message_type: 'follow_up',
            content: result.follow_up_message,
            contact_name: contact_name || null,
            contact_title: contact_role || null,
            channel,
            tone, status: 'draft',
            generated_at: new Date().toISOString(),
          })
        }
      } else if (channel === 'email') {
        if (result.first_email) {
          messages.push({
            company_id, contact_id: contact_id || null,
            message_type: 'email',
            subject: result.subject,
            content: result.first_email,
            contact_name: contact_name || null,
            contact_title: contact_role || null,
            channel,
            tone, status: 'draft',
            generated_at: new Date().toISOString(),
          })
        }
        if (result.follow_up_email) {
          messages.push({
            company_id, contact_id: contact_id || null,
            message_type: 'follow_up',
            subject: result.follow_up_subject,
            content: result.follow_up_email,
            contact_name: contact_name || null,
            contact_title: contact_role || null,
            channel,
            tone, status: 'draft',
            generated_at: new Date().toISOString(),
          })
        }
      }

      if (messages.length > 0) {
        await supabase.from('outreach_messages').insert(messages)
        await supabase.from('activity_log').insert({
          company_id,
          activity_type: 'ai_outreach',
          description: `AI ${channel} outreach generated`,
          user_id: user.id,
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI outreach error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI outreach generation failed' },
      { status: 500 }
    )
  }
}
