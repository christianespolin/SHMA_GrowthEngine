import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('contact_discovery_runs')
      .select('*, contact_suggestions(count)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET contact discovery runs error:', error)
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { company_id, criteria_json, source_types } = body

    if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('contact_discovery_runs')
      .insert({
        company_id,
        created_by: user.id,
        criteria_json: criteria_json || {},
        source_types: source_types || [],
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('activity_log').insert({
      company_id,
      activity_type: 'contact_discovery_started',
      description: 'Contact discovery run created',
      user_id: user.id,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST contact discovery run error:', error)
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 })
  }
}
