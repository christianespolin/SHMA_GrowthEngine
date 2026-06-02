import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('financial_profiles')
      .select('*')
      .eq('company_id', id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Financial GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch financial profile' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return upsertProfile(request, params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return upsertProfile(request, params)
}

async function upsertProfile(request: NextRequest, params: Promise<{ id: string }>) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const { data, error } = await supabase
      .from('financial_profiles')
      .upsert(
        { ...body, company_id: id, updated_at: new Date().toISOString() },
        { onConflict: 'company_id' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Financial upsert error:', error)
    return NextResponse.json({ error: 'Failed to save financial profile' }, { status: 500 })
  }
}
