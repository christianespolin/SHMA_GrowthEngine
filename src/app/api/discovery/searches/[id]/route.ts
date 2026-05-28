import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: search, error: searchError } = await supabase
      .from('discovery_searches')
      .select('*')
      .eq('id', id)
      .single()

    if (searchError) return NextResponse.json({ error: 'Search not found' }, { status: 404 })

    const { data: suggestions, error: suggestionsError } = await supabase
      .from('discovery_suggestions')
      .select('*')
      .eq('discovery_search_id', id)
      .order('shma_fit_score', { ascending: false })

    if (suggestionsError) throw suggestionsError

    return NextResponse.json({ search, suggestions: suggestions || [] })
  } catch (error) {
    console.error('GET discovery search error:', error)
    return NextResponse.json({ error: 'Failed to fetch discovery search' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { status, notes } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('discovery_searches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH discovery search error:', error)
    return NextResponse.json({ error: 'Failed to update discovery search' }, { status: 500 })
  }
}
