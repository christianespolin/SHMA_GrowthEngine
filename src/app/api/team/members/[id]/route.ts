import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const TEAM_ROLES = ['admin', 'partner', 'consultant', 'outreach', 'user'] as const
export type TeamRole = typeof TEAM_ROLES[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { role, full_name, email, password } = body

    if (role !== undefined && !TEAM_ROLES.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${TEAM_ROLES.join(', ')}` }, { status: 400 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )


    // Update auth user (email and/or password) via admin API
    const authUpdates: Record<string, string> = {}
    if (email) authUpdates.email = email
    if (password) {
      if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      authUpdates.password = password
    }
    if (Object.keys(authUpdates).length > 0) {
      const { error: authErr } = await adminClient.auth.admin.updateUserById(id, authUpdates)
      if (authErr) throw authErr
    }

    // Update profile (role and/or full_name) — use admin client to bypass RLS
    const profileUpdates: Record<string, string> = {}
    if (role !== undefined) profileUpdates.role = role
    if (full_name !== undefined) profileUpdates.full_name = full_name
    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await adminClient
        .from('profiles')
        .upsert({ id, ...profileUpdates }, { onConflict: 'id' })
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH team member role error:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (id === user.id) {
      return NextResponse.json({ error: 'Cannot remove your own account' }, { status: 400 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )


    const { error } = await adminClient.auth.admin.deleteUser(id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE team member error:', error)
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
  }
}
