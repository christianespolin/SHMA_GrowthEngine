import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: list, error } = await supabase
    .from('bulk_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Fetch companies in this list with their company data
  const { data: items } = await supabase
    .from('bulk_list_companies')
    .select(`
      *,
      companies (
        id, name, website, country, segment, stage,
        shma_fit_score, overall_priority_score, sensitivity_status,
        registration_number, description
      )
    `)
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')
    .order('created_at', { ascending: true })

  return NextResponse.json({ list, items: items || [] })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('bulk_lists')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
