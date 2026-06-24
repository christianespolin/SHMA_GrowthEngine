import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { status, content, subject, approval_status, rejection_reason } = body

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updates.status = status
    if (content !== undefined) updates.content = content
    if (subject !== undefined) updates.subject = subject
    if (approval_status !== undefined) updates.approval_status = approval_status
    if (rejection_reason !== undefined) updates.rejection_reason = rejection_reason
    if (status === 'sent') updates.sent_at = new Date().toISOString()
    if (status === 'replied') updates.reply_received_at = new Date().toISOString()
    if (approval_status === 'Approved') {
      updates.approved_by = user.id
      updates.approved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('outreach_messages')
      .update(updates)
      .eq('id', id)
      .select('*, company_id')
      .single()

    if (error) throw error

    if (status === 'sent' && data.company_id) {
      await supabase.from('activity_log').insert({
        company_id: data.company_id,
        activity_type: 'outreach_sent',
        description: `Outreach marked as sent (${data.message_type})`,
        user_id: user.id,
      })
      await supabase
        .from('companies')
        .update({ last_activity_date: new Date().toISOString() })
        .eq('id', data.company_id)
    }

    if (status === 'replied' && data.company_id) {
      await supabase.from('activity_log').insert({
        company_id: data.company_id,
        activity_type: 'outreach_replied',
        description: `Reply received${data.contact_name ? ` from ${data.contact_name}` : ''} (${data.message_type})`,
        user_id: user.id,
      })
      await supabase
        .from('companies')
        .update({ last_activity_date: new Date().toISOString() })
        .eq('id', data.company_id)
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update outreach message' }, { status: 500 })
  }
}
