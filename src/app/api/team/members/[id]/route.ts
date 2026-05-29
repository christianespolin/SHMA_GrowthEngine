import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Only admins can change roles
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 })
    }

    const { role } = await request.json()
    if (!TEAM_ROLES.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${TEAM_ROLES.join(', ')}` }, { status: 400 })
    }

    // Upsert profile with new role
    const { error } = await supabase
      .from('profiles')
      .upsert({ id, role }, { onConflict: 'id' })

    if (error) throw error

    return NextResponse.json({ ok: true, role })
  } catch (error) {
    console.error('PATCH team member role error:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}
