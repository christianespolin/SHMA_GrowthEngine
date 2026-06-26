import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH bulk update human_review_status on multiple companies in a list
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { company_ids, human_review_status, reviewer_id, review_notes } = body

  if (!company_ids?.length || !human_review_status) {
    return NextResponse.json({ error: 'company_ids and human_review_status required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    human_review_status,
    updated_at: new Date().toISOString(),
  }
  if (reviewer_id) updates.reviewer_id = reviewer_id
  if (review_notes) updates.review_notes = review_notes
  if (['Approved', 'Rejected', 'Needs discussion', 'Sensitive', 'Do not contact'].includes(human_review_status)) {
    updates.reviewed_at = new Date().toISOString()
    if (!reviewer_id) updates.reviewer_id = user.id
  }

  const { error } = await supabase
    .from('bulk_list_companies')
    .update(updates)
    .eq('bulk_list_id', id)
    .in('company_id', company_ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// POST: add companies to list
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { company_ids } = body
  if (!company_ids?.length) return NextResponse.json({ error: 'company_ids required' }, { status: 400 })

  const rows = company_ids.map((cid: string) => ({
    bulk_list_id: id,
    company_id: cid,
    list_status: 'Active',
  }))

  const { error } = await supabase
    .from('bulk_list_companies')
    .upsert(rows, { onConflict: 'bulk_list_id,company_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update company_count
  const { count } = await supabase
    .from('bulk_list_companies')
    .select('id', { count: 'exact', head: true })
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')

  await supabase
    .from('bulk_lists')
    .update({ company_count: count || 0, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true, company_count: count })
}
