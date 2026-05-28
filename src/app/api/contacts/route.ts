import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { data, error } = await supabase
      .from('contacts')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    if (body.company_id) {
      await supabase.from('activity_log').insert({
        company_id: body.company_id,
        activity_type: 'contact_added',
        description: `Contact added: ${body.name}`,
        user_id: user.id,
      })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
