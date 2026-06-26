import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: run } = await supabase
    .from('ai_process_runs')
    .select(`*, bulk_lists ( id, name, category )`)
    .eq('id', id)
    .single()

  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: items } = await supabase
    .from('ai_process_items')
    .select(`*, companies ( id, name, country, segment )`)
    .eq('ai_process_run_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  return NextResponse.json({ run, items: items || [] })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() }

  if (body.status === 'Running' && !body.started_at) updates.started_at = new Date().toISOString()
  if (['Completed', 'Failed', 'Cancelled', 'Partially completed'].includes(body.status)) {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('ai_process_runs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
