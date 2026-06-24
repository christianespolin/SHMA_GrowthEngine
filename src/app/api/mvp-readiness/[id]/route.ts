import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() }

  // Auto-set completed_at when marking Done
  if (body.status === 'Done') {
    updates.completed_at = new Date().toISOString()
    updates.completed_by = user.id
  } else if (body.status && body.status !== 'Done') {
    updates.completed_at = null
    updates.completed_by = null
  }

  const { data, error } = await supabase
    .from('mvp_readiness_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
