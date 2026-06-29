import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { DashboardClient } from './dashboard-client'
import { isStale, isOverdue } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('updated_at', { ascending: false })

  const all = companies || []

  // Target Universe counts
  const { data: tuCompanies } = await supabase
    .from('target_universe_companies')
    .select('universe_status, target_universe_id')

  const tuAll = tuCompanies || []

  // Active TU ids
  const { data: activeUniverses } = await supabase
    .from('target_universes')
    .select('id, estimated_total_count, actual_total_count, status')
    .in('status', ['Active', 'Screening'])

  const activeIds = new Set((activeUniverses || []).map(u => u.id))
  const activeTuCompanies = tuAll.filter(c => activeIds.has(c.target_universe_id))

  const targetUniverseCount = (activeUniverses || []).reduce((sum, u) =>
    sum + (u.actual_total_count || u.estimated_total_count || 0), 0)

  // Origination not approved
  const { data: originations } = await supabase
    .from('opportunity_origination')
    .select('id, company_id, approval_status')

  const { data: allocations } = await supabase
    .from('origination_commission_allocations')
    .select('opportunity_origination_id, allocation_percentage')

  const engagedAndBeyond = all.filter(c =>
    ['Engaged', 'Meeting Booked', 'Discovery Completed', 'Proposal / Agreement', 'Signed', 'Onboarding'].includes(c.stage)
  )

  const originationNotApproved = engagedAndBeyond.filter(c => {
    const orig = (originations || []).find(o => o.company_id === c.id)
    if (!orig) return true
    if (!['Approved', 'Locked'].includes(orig.approval_status)) return true
    const allocs = (allocations || []).filter(a => a.opportunity_origination_id === orig.id)
    const total = allocs.reduce((s, a) => s + Number(a.allocation_percentage), 0)
    return Math.abs(total - 8) > 0.01
  }).length

  const stats = {
    // Target universe funnel
    target_universe: targetUniverseCount,
    long_list: activeTuCompanies.filter(c => c.universe_status === 'Long List / Screened Target').length,
    ai_qualified: activeTuCompanies.filter(c => c.universe_status === 'AI Qualified Target').length,
    validated_targets: activeTuCompanies.filter(c => c.universe_status === 'Validated Target').length,
    qualified_targets: all.filter(c => ['Qualified Target', 'Contact Identified', 'Warm Intro / Outreach Ready', 'Outreach Sent', 'Engaged', 'Meeting Booked', 'Discovery Completed', 'Proposal / Agreement', 'Signed', 'Onboarding'].includes(c.stage)).length,
    // Active sales funnel
    engaged: all.filter(c => ['Engaged', 'Meeting Booked', 'Discovery Completed', 'Proposal / Agreement', 'Signed', 'Onboarding'].includes(c.stage)).length,
    meetings_booked: all.filter(c => c.stage === 'Meeting Booked').length,
    signed_clients: all.filter(c => c.stage === 'Signed').length,
    // Secondary
    outreach_ready: all.filter(c => c.stage === 'Warm Intro / Outreach Ready').length,
    missing_contact_data: all.filter(c =>
      ['Qualified Target', 'Contact Identified'].includes(c.stage) && !c.primary_contact_email
    ).length,
    stale_opportunities: all.filter(c =>
      isStale(c.last_activity_date) && !['Disqualified', 'Nurture', 'Signed'].includes(c.stage)
    ).length,
    origination_not_approved: originationNotApproved,
    // Legacy
    total_companies: all.length,
    a_priority: all.filter(c => c.priority === 'A').length,
    proposals_active: all.filter(c => c.stage === 'Proposal / Agreement').length,
    avg_fit_score: all.filter(c => c.shma_fit_score).length > 0
      ? Math.round(all.filter(c => c.shma_fit_score).reduce((sum, c) => sum + c.shma_fit_score, 0) / all.filter(c => c.shma_fit_score).length * 10) / 10
      : 0,
    no_next_action: all.filter(c => !c.next_action && !['Disqualified', 'Nurture', 'Signed'].includes(c.stage)).length,
    overdue_next_action: all.filter(c => isOverdue(c.next_action_date) && !['Disqualified', 'Nurture', 'Signed'].includes(c.stage)).length,
  }

  const stageBreakdown = [
    'Longlist', 'AI Researched', 'Human Review', 'Qualified Target',
    'Contact Identified', 'Warm Intro / Outreach Ready', 'Outreach Sent',
    'Engaged', 'Meeting Booked', 'Discovery Completed', 'Proposal / Agreement',
    'Signed', 'Onboarding', 'Nurture', 'Disqualified'
  ].map(stage => ({
    stage,
    count: all.filter(c => c.stage === stage).length,
  })).filter(s => s.count > 0)

  const upcomingActions = all
    .filter(c => c.next_action && c.next_action_date)
    .sort((a, b) => new Date(a.next_action_date).getTime() - new Date(b.next_action_date).getTime())
    .slice(0, 8)

  const recentlyActive = all
    .filter(c => c.last_activity_date)
    .sort((a, b) => new Date(b.last_activity_date).getTime() - new Date(a.last_activity_date).getTime())
    .slice(0, 5)

  const twoWeeksOut = new Date()
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14)
  const { data: upcomingMeetings } = await supabase
    .from('meetings')
    .select('*, companies(id, name, stage)')
    .gte('meeting_date', new Date().toISOString())
    .lte('meeting_date', twoWeeksOut.toISOString())
    .order('meeting_date', { ascending: true })
    .limit(5)

  const { data: recentActivity } = await supabase
    .from('activity_log')
    .select('*, companies(id, name)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Bulk list funnel counts (List Process View)
  const { data: bulkLists } = await supabase
    .from('bulk_lists')
    .select('category, company_count, status')
    .neq('category', 'Archived')

  const blLists = bulkLists || []
  const blCount = (cat: string) =>
    blLists.filter(l => l.category === cat).reduce((s, l) => s + (l.company_count || 0), 0)

  const bulkStats = {
    longlist: blCount('Longlist'),
    ai_researched: blCount('AI Researched') + blCount('AI Researched, Pending'),
    ready_for_deep_research: blCount('Ready for AI Deep Research'),
    ready_for_human_review: blCount('Ready for Human Review'),
    ready_for_contact_research: blCount('Ready for Contact Research'),
    // Warnings
    ai_runs_failed: 0, // pulled from ai_process_runs below
  }

  const { data: failedRuns } = await supabase
    .from('ai_process_runs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Failed')

  bulkStats.ai_runs_failed = (failedRuns as unknown as { count: number } | null)?.count ?? 0

  const dnc = all.filter(c => c.sensitivity_status === 'Do not contact').length
  const sensitive = all.filter(c => c.sensitivity_status === 'Sensitive').length
  const missingOwner = all.filter(c =>
    !c.internal_owner && !['Disqualified', 'Nurture'].includes(c.stage)
  ).length

  return (
    <>
      <Header title="Dashboard" subtitle="Commercial operating system — pipeline, targets and origination" />
      <DashboardClient
        stats={stats}
        bulkStats={bulkStats}
        dnc={dnc}
        sensitive={sensitive}
        missingOwner={missingOwner}
        stageBreakdown={stageBreakdown}
        upcomingActions={upcomingActions}
        recentlyActive={recentlyActive}
        totalCompanies={all.length}
        upcomingMeetings={upcomingMeetings || []}
        recentActivity={recentActivity || []}
      />
    </>
  )
}
