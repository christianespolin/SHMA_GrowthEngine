import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { company_id, meeting_date, participants, objective, notes, next_step } = body

    if (!company_id || !meeting_date) {
      return NextResponse.json({ error: 'company_id and meeting_date are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('meetings')
      .insert({ company_id, meeting_date, participants, objective, notes, next_step })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      company_id,
      activity_type: 'meeting_logged',
      description: objective
        ? `Meeting logged: ${objective}`
        : `Meeting logged on ${new Date(meeting_date).toLocaleDateString()}`,
      user_id: user.id,
    })

    // Update last_activity_date on company
    await supabase
      .from('companies')
      .update({ last_activity_date: new Date().toISOString() })
      .eq('id', company_id)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST meeting error:', error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}
