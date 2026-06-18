import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orig } = await supabase
    .from('opportunity_origination')
    .select('*, owner:profiles!opportunity_origination_owner_id_fkey(full_name, email)')
    .eq('company_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!orig) return NextResponse.json({ origination: null })

  const { data: allocations } = await supabase
    .from('origination_commission_allocations')
    .select('*')
    .eq('opportunity_origination_id', orig.id)

  const { data: auditLog } = await supabase
    .from('origination_audit_log')
    .select('*, actor:profiles!origination_audit_log_actor_id_fkey(full_name, email)')
    .eq('opportunity_origination_id', orig.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ origination: orig, allocations: allocations || [], auditLog: auditLog || [] })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action, reason, ...updates } = body

  // Get current state for audit
  const { data: current } = await supabase
    .from('opportunity_origination')
    .select('*')
    .eq('id', id)
    .single()

  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Guard: locked records require admin reopen
  if (current.approval_status === 'Locked' && action !== 'Reopen') {
    return NextResponse.json({ error: 'Locked origination can only be reopened by Admin' }, { status: 403 })
  }

  const statusMap: Record<string, string> = {
    Submit: 'Pending Approval',
    Approve: 'Approved',
    Reject: 'Rejected',
    RequestChange: 'Change Requested',
    Lock: 'Locked',
    Reopen: 'Draft',
  }

  const newStatus = action ? statusMap[action] : current.approval_status
  const additionalFields: Record<string, unknown> = {}
  if (action === 'Approve' || action === 'Lock') {
    additionalFields.approved_by = user.id
    additionalFields.approved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('opportunity_origination')
    .update({ ...updates, ...(newStatus ? { approval_status: newStatus } : {}), ...additionalFields, change_reason: reason || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Audit log
  if (action) {
    await supabase.from('origination_audit_log').insert({
      opportunity_origination_id: id,
      action,
      actor_id: user.id,
      previous_value_json: { approval_status: current.approval_status },
      new_value_json: { approval_status: newStatus },
      reason: reason || null,
    })
  }

  return NextResponse.json({ origination: data })
}
