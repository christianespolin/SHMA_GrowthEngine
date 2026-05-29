import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/client'

export const maxDuration = 60

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { message_type } = body as { message_type: 'linkedin' | 'email' | 'follow_up' | 'call_script' }

    // Fetch contact
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    // Fetch company
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', contact.company_id)
      .single()

    // Fetch brief
    const { data: brief } = await supabase
      .from('ai_research_briefs')
      .select('*')
      .eq('company_id', contact.company_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const contactName = contact.full_name || contact.name || 'Unknown'
    const contactTitle = contact.title || contact.role || null
    const companyName = company?.name || 'Unknown company'
    const shmaHypothesis = contact.outreach_angle || brief?.possible_aaas_concept || brief?.why_shma_relevant || ''

    let prompt = ''

    if (message_type === 'linkedin') {
      prompt = `Write a LinkedIn outreach message for SHMA targeting ${contactName} (${contact.title || contact.role || 'Unknown role'}) at ${companyName}.

Contact details:
- Role: ${contact.title || contact.role || 'Unknown'}
- Role category: ${contact.role_category || 'Unknown'}
- AI rationale: ${contact.ai_rationale || 'Not available'}
- Outreach angle: ${contact.outreach_angle || 'Not specified'}

SHMA hypothesis: ${shmaHypothesis}
Company: ${companyName} (${company?.segment || 'Unknown segment'}, ${company?.country || 'Unknown country'})

Write:
1. LinkedIn CONNECTION REQUEST (max 200 characters) — direct, specific, creates genuine curiosity, no sales language
2. FOLLOW-UP MESSAGE (max 500 characters, after connection accepted) — brief explanation of SHMA in one concrete sentence, references their specific situation, suggests a short call without being pushy

Rules:
- No buzzwords ("synergies", "transformation journey", "strategic partner")
- No generic consulting language
- Sound like a real person
- Reference something specific about their company or role

Respond as JSON: {"connection_request": "...", "follow_up_message": "..."}`
    } else if (message_type === 'email') {
      prompt = `Write a cold outreach email for SHMA targeting ${contactName} (${contact.title || contact.role || 'Unknown role'}) at ${companyName}.

Contact details:
- Role: ${contact.title || contact.role || 'Unknown'}
- Role category: ${contact.role_category || 'Unknown'}
- Outreach angle: ${contact.outreach_angle || 'Not specified'}

SHMA hypothesis: ${shmaHypothesis}
Company: ${companyName} (${company?.segment || 'Unknown segment'}, ${company?.country || 'Unknown country'})

Write:
1. A FIRST EMAIL (under 180 words):
   - Sharp, specific subject line
   - No "I hope this finds you well" opening
   - Opens with something specific about their business
   - 2-3 sentences on why SHMA is reaching out
   - One sentence about what SHMA does
   - Clear, low-friction CTA (15-min call)
2. A FOLLOW-UP EMAIL (under 100 words, for 7 days later)

Rules: No buzzwords. Sound like a real senior person.

Respond as JSON: {"subject": "...", "first_email": "...", "follow_up_subject": "...", "follow_up_email": "..."}`
    } else if (message_type === 'call_script') {
      prompt = `Write a call script for SHMA targeting ${contactName} (${contact.title || contact.role || 'Unknown role'}) at ${companyName}.

Contact details:
- Role: ${contact.title || contact.role || 'Unknown'}
- Outreach angle: ${contact.outreach_angle || 'Not specified'}

SHMA hypothesis: ${shmaHypothesis}

Write a cold call script with:
1. OPENING (10 seconds) — introduce yourself and create curiosity
2. BRIDGE (20 seconds) — why calling this specific person at this company
3. HYPOTHESIS (30 seconds) — what SHMA has observed about their situation
4. ASK (10 seconds) — simple, low-commitment next step
5. OBJECTION HANDLERS — 3 common objections with brief responses

Keep it conversational, not scripted-sounding.

Respond as JSON: {"opening": "...", "bridge": "...", "hypothesis": "...", "ask": "...", "objection_handlers": [{"objection": "...", "response": "..."}]}`
    } else {
      prompt = `Write a follow-up message for SHMA targeting ${contactName} (${contact.title || contact.role || 'Unknown role'}) at ${companyName}.

Context: Previously reached out but no response.
Outreach angle: ${contact.outreach_angle || 'Not specified'}

Write a brief re-engagement message (under 100 words) that:
- References previous contact briefly
- Adds a new angle
- Has a simple CTA
- Sounds human, not automated

Respond as JSON: {"subject": "...", "message": "..."}`
    }

    const aiResponse = await callClaude(prompt, undefined, 2048, 55_000)
    let parsed: Record<string, unknown> = {}

    try {
      const jsonMatch = aiResponse.content.match(/```json\n?([\s\S]*?)\n?```/) ||
        aiResponse.content.match(/(\{[\s\S]*\})/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
      }
    } catch {
      parsed = { content: aiResponse.content }
    }

    // Build rows to insert based on message_type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowsToInsert: Record<string, any>[] = []
    const now = new Date().toISOString()
    const baseRow = {
      company_id: contact.company_id,
      contact_id: id,
      contact_name: contactName,
      contact_title: contactTitle,
      channel: message_type,
      status: 'draft',
      generated_at: now,
    }

    if (message_type === 'linkedin') {
      // Two rows: connection_request + follow_up
      rowsToInsert.push({
        ...baseRow,
        message_type: 'linkedin',
        subject: `LinkedIn to ${contactName}`,
        content: (parsed.connection_request as string) || '',
      })
      if (parsed.follow_up_message) {
        rowsToInsert.push({
          ...baseRow,
          message_type: 'follow_up',
          subject: `LinkedIn follow-up to ${contactName}`,
          content: parsed.follow_up_message as string,
        })
      }
    } else if (message_type === 'email') {
      // Two rows: first_email + follow_up_email
      rowsToInsert.push({
        ...baseRow,
        message_type: 'email',
        subject: (parsed.subject as string) || `Email to ${contactName}`,
        content: (parsed.first_email as string) || '',
      })
      if (parsed.follow_up_email) {
        rowsToInsert.push({
          ...baseRow,
          message_type: 'follow_up',
          subject: (parsed.follow_up_subject as string) || `Follow-up to ${contactName}`,
          content: parsed.follow_up_email as string,
        })
      }
    } else if (message_type === 'call_script') {
      // One row with JSON content (structured data)
      rowsToInsert.push({
        ...baseRow,
        message_type: 'linkedin',
        subject: `Call script for ${contactName}`,
        content: JSON.stringify(parsed),
      })
    } else {
      // follow_up: one row
      rowsToInsert.push({
        ...baseRow,
        message_type: 'follow_up',
        subject: (parsed.subject as string) || `Follow-up to ${contactName}`,
        content: (parsed.message as string) || JSON.stringify(parsed),
      })
    }

    const { data: insertedRows } = await supabase
      .from('outreach_messages')
      .insert(rowsToInsert)
      .select()

    // Log activity
    await supabase.from('activity_log').insert({
      company_id: contact.company_id,
      activity_type: 'ai_outreach_generated',
      description: `AI ${message_type} outreach generated for ${contactName}`,
      user_id: user.id,
    })

    return NextResponse.json({ ...parsed, outreach_messages: insertedRows || [] })
  } catch (error) {
    console.error('POST contact outreach error:', error)
    return NextResponse.json({ error: 'Failed to generate outreach' }, { status: 500 })
  }
}
