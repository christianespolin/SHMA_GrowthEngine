import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { company_id, type, description, metadata_json } = body

  if (!company_id || !type || !description) {
    return NextResponse.json({ error: 'company_id, type, and description are required' }, { status: 400 })
  }

  // Insert activity log entry
  const { data: activity, error: activityError } = await supabase
    .from('activity_log')
    .insert({
      company_id,
      type,
      description,
      metadata_json: metadata_json || {},
    })
    .select()
    .single()

  if (activityError) {
    return NextResponse.json({ error: activityError.message }, { status: 500 })
  }

  // Update company last_activity_date
  await supabase
    .from('companies')
    .update({ last_activity_date: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', company_id)

  return NextResponse.json(activity)
}
