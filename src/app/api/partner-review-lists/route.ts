import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('partner_review_lists')
    .select(`
      *,
      items:partner_review_list_items(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, description, reviewer_name, reviewer_email, reviewer_type, company_ids } = body

  if (!name || !reviewer_name) {
    return NextResponse.json({ error: 'name and reviewer_name are required' }, { status: 400 })
  }

  const { data: list, error } = await supabase
    .from('partner_review_lists')
    .insert({ name, description, reviewer_name, reviewer_email, reviewer_type: reviewer_type || 'External Partner', assigned_by: user.id })
    .select()
    .single()

  if (error || !list) return NextResponse.json({ error: error?.message || 'Failed to create list' }, { status: 500 })

  // Add companies if provided
  if (company_ids && company_ids.length > 0) {
    const items = company_ids.map((id: string) => ({
      partner_review_list_id: list.id,
      company_id: id,
    }))
    await supabase.from('partner_review_list_items').insert(items)
  }

  return NextResponse.json(list)
}
