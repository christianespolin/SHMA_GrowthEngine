import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { status, content, subject } = body

    const { data, error } = await supabase
      .from('outreach_messages')
      .update({
        ...(status !== undefined ? { status } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
        ...(status === 'replied' ? { reply_received_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      })
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
