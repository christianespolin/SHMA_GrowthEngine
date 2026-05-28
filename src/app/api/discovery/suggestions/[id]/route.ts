import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { status, rejection_reason } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updateData.status = status
    if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason

    const { data, error } = await supabase
      .from('discovery_suggestions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH suggestion error:', error)
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 })
  }
}
