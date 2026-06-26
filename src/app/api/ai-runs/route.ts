import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const bulk_list_id = searchParams.get('bulk_list_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('ai_process_runs')
    .select(`
      *,
      bulk_lists ( id, name, category )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (bulk_list_id) query = query.eq('bulk_list_id', bulk_list_id)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { process_type, bulk_list_id, model, estimated_cost } = body

  if (!process_type) return NextResponse.json({ error: 'process_type is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('ai_process_runs')
    .insert({
      process_type,
      bulk_list_id: bulk_list_id || null,
      started_by: user.id,
      status: 'Queued',
      model: model || 'claude-sonnet-4-6',
      estimated_cost: estimated_cost || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
