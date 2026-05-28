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
    return {
      id: u.id,
      email: u.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      full_name: (profile as any)?.full_name || (u.user_metadata as any)?.full_name || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: (profile as any)?.role || 'user',
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
    }
  })

  return NextResponse.json({ members })
}
