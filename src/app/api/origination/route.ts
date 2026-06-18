import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { origination, allocations } = await request.json()

  // Validate allocation total
  const total = (allocations || []).reduce((s: number, a: { allocation_percentage: number }) => s + Number(a.allocation_percentage), 0)
  if (Math.abs(total - 8) > 0.01) {
    return NextResponse.json({ error: `Allocation total must be exactly 8.00% (got ${total.toFixed(2)}%)` }, { status: 400 })
  }

  // Validate Opportunity Creator is in allocations
  const hasCreator = (allocations || []).some((a: { contribution_role: string }) => a.contribution_role === 'Opportunity Creator')
  if (!hasCreator) {
    return NextResponse.json({ error: 'Opportunity Creator must be included in the commission allocation' }, { status: 400 })
  }

  const { data: orig, error: origError } = await supabase
    .from('opportunity_origination')
    .insert({ ...origination, created_by: user.id, approval_status: 'Draft' })
    .select()
    .single()

  if (origError) return NextResponse.json({ error: origError.message }, { status: 400 })

  // Insert allocations
  const allocationRows = (allocations || []).map((a: Record<string, unknown>) => ({
    ...a,
    opportunity_origination_id: orig.id,
    company_id: origination.company_id,
    created_by: user.id,
    approval_status: 'Draft',
  }))

  if (allocationRows.length > 0) {
    const { error: allocError } = await supabase
      .from('origination_commission_allocations')
      .insert(allocationRows)
    if (allocError) return NextResponse.json({ error: allocError.message }, { status: 400 })
  }

  // Write audit log
  await supabase.from('origination_audit_log').insert({
    opportunity_origination_id: orig.id,
    action: 'Created',
    actor_id: user.id,
    new_value_json: { origination, allocations },
  })

  return NextResponse.json({ origination: orig })
}
