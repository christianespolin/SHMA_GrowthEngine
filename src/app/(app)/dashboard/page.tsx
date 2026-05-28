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

  const stats = {
    total_companies: all.length,
    a_priority: all.filter(c => c.priority === 'A').length,
    qualified_targets: all.filter(c => ['Qualified Target', 'Contact Identified', 'Warm Intro / Outreach Ready', 'Outreach Sent', 'Engaged', 'Meeting Booked', 'Discovery Completed', 'Proposal / Agreement', 'Signed', 'Onboarding'].includes(c.stage)).length,
    meetings_booked: all.filter(c => c.stage === 'Meeting Booked').length,
    discovery_completed: all.filter(c => c.stage === 'Discovery Completed').length,
    proposals_active: all.filter(c => c.stage === 'Proposal / Agreement').length,
    signed_clients: all.filter(c => c.stage === 'Signed').length,
    stale_leads: all.filter(c => isStale(c.last_activity_date) && !['Disqualified', 'Nurture', 'Signed'].includes(c.stage)).length,
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

  // Upcoming meetings (next 14 days)
  const twoWeeksOut = new Date()
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14)
  const { data: upcomingMeetings } = await supabase
    .from('meetings')
    .select('*, companies(id, name, stage)')
    .gte('meeting_date', new Date().toISOString())
    .lte('meeting_date', twoWeeksOut.toISOString())
    .order('meeting_date', { ascending: true })
    .limit(5)

  // Recent activity (last 10 entries)
  const { data: recentActivity } = await supabase
    .from('activity_log')
    .select('*, companies(id, name)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <>
      <Header title="Dashboard" subtitle="Pipeline overview and AI recommendations" />
      <DashboardClient
        stats={stats}
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
