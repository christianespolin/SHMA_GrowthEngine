import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const priority = searchParams.get('priority')
    const segment = searchParams.get('segment')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (stage) query = query.eq('stage', stage)
    if (priority) query = query.eq('priority', priority)
    if (segment) query = query.eq('segment', segment)
    if (search) {
      query = query.or(`name.ilike.%${search}%,notes.ilike.%${search}%,segment.ilike.%${search}%,website.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ companies: data, total: count })
  } catch (error) {
    console.error('GET companies error:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const { data, error } = await supabase
      .from('companies')
      .insert({ ...body, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error

    await supabase.from('activity_log').insert({
      company_id: data.id,
      activity_type: 'company_created',
      description: `Company added to pipeline: ${data.name}`,
      user_id: user.id,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST company error:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
