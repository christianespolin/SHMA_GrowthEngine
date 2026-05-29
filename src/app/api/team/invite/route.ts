import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role = 'user' } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: invited, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shma-growth-engine.vercel.app'}/auth/callback`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Pre-set the role in profiles so it's ready when they accept
  if (invited?.user?.id) {
    await supabase
      .from('profiles')
      .upsert({ id: invited.user.id, role }, { onConflict: 'id' })
  }

  return NextResponse.json({ success: true })
}
