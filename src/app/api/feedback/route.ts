import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { area, feedback_type, comment, related_company_id, priority } = body

    if (!comment) {
      return NextResponse.json({ error: 'comment is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_feedback')
      .insert({
        created_by: user.id,
        area: area || null,
        feedback_type: feedback_type || null,
        comment,
        related_company_id: related_company_id || null,
        priority: priority || 'medium',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}
