import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowedFields = ['status', 'rejection_reason']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    const { data, error } = await supabase
      .from('contact_suggestions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH contact suggestion error:', error)
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 })
  }
}
