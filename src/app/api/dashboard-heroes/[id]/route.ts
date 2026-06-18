import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { label, description, is_visible, is_primary, sort_order, threshold_warning, threshold_critical, clickthrough_url } = body

  const { data, error } = await supabase
    .from('dashboard_hero_settings')
    .update({ label, description, is_visible, is_primary, sort_order, threshold_warning, threshold_critical, clickthrough_url, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ hero: data })
}
