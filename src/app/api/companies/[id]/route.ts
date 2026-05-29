import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { stage_note, ...updateData } = body

    // Get current state for activity log
    const { data: current } = await supabase
      .from('companies')
      .select('stage, priority, name, notes, next_action, next_action_date, description')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('companies')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log stage changes
    if (updateData.stage && current && updateData.stage !== current.stage) {
      await supabase.from('activity_log').insert({
        company_id: id,
        activity_type: 'stage_change',
        description: stage_note || `Moved from ${current.stage} to ${updateData.stage}`,
        old_value: current.stage,
        new_value: updateData.stage,
        user_id: user.id,
      })

      await supabase
        .from('companies')
        .update({ last_activity_date: new Date().toISOString() })
        .eq('id', id)
    }

    if (updateData.priority && current && updateData.priority !== current.priority) {
      await supabase.from('activity_log').insert({
        company_id: id,
        activity_type: 'priority_change',
        description: `Priority changed from ${current.priority} to ${updateData.priority}`,
        old_value: current.priority,
        new_value: updateData.priority,
        user_id: user.id,
      })
    }

    // Log next action changes
    if (updateData.next_action !== undefined && current && updateData.next_action !== current.next_action) {
      await supabase.from('activity_log').insert({
        company_id: id,
        activity_type: 'next_action_set',
        description: updateData.next_action
          ? `Next action set: ${updateData.next_action}`
          : 'Next action cleared',
        old_value: current.next_action || null,
        new_value: updateData.next_action || null,
        user_id: user.id,
      })
    }

    // Log notes changes
    if (updateData.notes !== undefined && current && updateData.notes !== current.notes) {
      await supabase.from('activity_log').insert({
        company_id: id,
        activity_type: 'notes_updated',
        description: 'Company notes updated',
        user_id: user.id,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH company error:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
