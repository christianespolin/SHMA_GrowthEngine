import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Map name to both name and full_name for backward compat
    const insertData = {
      ...body,
      name: body.name || body.full_name || '',
      full_name: body.full_name || body.name || null,
      // Defaults for new enrichment fields
      gdpr_status: body.gdpr_status || 'Not reviewed',
      contact_status: body.contact_status || 'Validated',
      email_status: body.email_status || 'Unknown',
      phone_status: body.phone_status || 'Unknown',
      linkedin_status: body.linkedin_status || 'Unknown',
      source_type: body.source_type || 'Manual',
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    if (body.company_id) {
      await supabase.from('activity_log').insert({
        company_id: body.company_id,
        activity_type: 'contact_added',
        description: `Contact added: ${insertData.name}`,
        user_id: user.id,
      })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST contact error:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
