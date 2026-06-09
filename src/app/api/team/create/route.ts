import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, password, full_name, role = 'user' } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation
    user_metadata: { full_name: full_name || email.split('@')[0] },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (created?.user?.id) {
    await adminClient
      .from('profiles')
      .upsert({ id: created.user.id, full_name: full_name || null, role }, { onConflict: 'id' })
  }

  return NextResponse.json({ success: true })
}
