import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('discovery_searches')
      .select('*, discovery_suggestions(count)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ searches: data })
  } catch (error) {
    console.error('GET discovery searches error:', error)
    return NextResponse.json({ error: 'Failed to fetch discovery searches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { search_name, criteria_json, number_requested, search_depth, mode, notes } = body

    const { data, error } = await supabase
      .from('discovery_searches')
      .insert({
        search_name,
        criteria_json: criteria_json || {},
        number_requested: number_requested || 25,
        search_depth: search_depth || 'standard',
        mode: mode || 'generate',
        notes: notes || null,
        created_by: user.id,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST discovery search error:', error)
    return NextResponse.json({ error: 'Failed to create discovery search' }, { status: 500 })
  }
}
