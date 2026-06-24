import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/partner-review-lists/[id]/items
// Update feedback on one or more items
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { item_id, ...updates } = body

  const { data, error } = await supabase
    .from('partner_review_list_items')
    .update({ ...updates, reviewed_at: new Date().toISOString() })
    .eq('id', item_id)
    .eq('partner_review_list_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
