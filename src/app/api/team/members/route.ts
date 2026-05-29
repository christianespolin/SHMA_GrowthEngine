import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const { data: profiles } = await supabase.from('profiles').select('*')

  const members = (users || []).map(u => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (profiles || []).find((p: any) => p.id === u.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ua = u.user_metadata as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = profile as any

    // Pending = invited but email not yet confirmed
    const isPending = !u.email_confirmed_at && !!u.invited_at

    return {
      id: u.id,
      email: u.email,
      full_name: p?.full_name || ua?.full_name || ua?.name || null,
      role: p?.role || 'user',
      status: isPending ? 'pending' : 'active',
      created_at: u.created_at,
      invited_at: u.invited_at || null,
      last_sign_in: u.last_sign_in_at || null,
    }
  })

  // Active members first, then pending; newest first within each group
  members.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return NextResponse.json({ members })
}
