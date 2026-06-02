'use client'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

interface RecommendedAction {
  action: string
  reason: string
  tab: string
  priority: 'high' | 'medium' | 'low'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRecommendedAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  company: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contacts: Record<string, any>[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  financialProfile: Record<string, any> | null
): RecommendedAction {
  const hasFinancial = financialProfile && (financialProfile.revenue || financialProfile.financial_notes)
  const hasContacts = contacts.length > 0
  const hasEmail = contacts.some(c => c.email)
  const hasDecisionMaker = contacts.some(c =>
    ['Executive sponsor', 'Finance / ownership'].includes(c.role_category) &&
    (c.decision_power_score || 0) >= 4
  )

  if (!hasFinancial) return {
    action: 'Validate financial & funding readiness',
    reason: 'No financial data entered. Assess before investing in outreach.',
    tab: 'financial',
    priority: 'high',
  }
  if (!hasContacts) return {
    action: 'Find decision-maker contacts',
    reason: 'No contacts identified. Use AI Contact Finder to map key roles.',
    tab: 'contacts',
    priority: 'high',
  }
  if (!hasDecisionMaker) return {
    action: 'Identify executive sponsor or financial decision-maker',
    reason: 'No high-priority decision-maker found yet.',
    tab: 'contacts',
    priority: 'medium',
  }
  if (!hasEmail) return {
    action: 'Find or verify contact email addresses',
    reason: `${contacts.length} contacts found but none have validated emails.`,
    tab: 'contacts',
    priority: 'medium',
  }
  if (company.stage === 'Discovery') return {
    action: 'Generate and review outreach message',
    reason: 'Contacts ready. Create outreach before moving to Qualified.',
    tab: 'outreach',
    priority: 'medium',
  }
  if (company.stage === 'Qualified') return {
    action: 'Send first outreach and log response',
    reason: 'Company qualified. First contact should be made.',
    tab: 'outreach',
    priority: 'high',
  }
  return {
    action: company.next_action || 'Review and confirm next step',
    reason: `Stage: ${company.stage}`,
    tab: 'overview',
    priority: 'low',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NextActionPanel({ company, contacts, financialProfile, onTabChange }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  company: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contacts: Record<string, any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  financialProfile: Record<string, any> | null
  onTabChange: (tab: string) => void
}) {
  const rec = getRecommendedAction(company, contacts, financialProfile)

  if (rec.priority === 'low') return null

  const styles = {
    high: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    medium: 'bg-slate-800 border-slate-700 text-slate-300',
  } as const

  const dotStyles = {
    high: 'bg-amber-400',
    medium: 'bg-cyan-400',
  } as const

  const tabLabels: Record<string, string> = {
    financial: 'Financial & Funding',
    contacts: 'Contacts',
    outreach: 'Outreach',
    overview: 'Overview',
    fit: 'SHMA Fit',
    research: 'AI Research',
    meetings: 'Meetings',
    activity: 'Activity',
  }

  return (
    <div className={cn(
      'flex items-center gap-3 px-5 py-2.5 border-b text-sm',
      styles[rec.priority]
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotStyles[rec.priority])} />
      <span className="font-medium flex-shrink-0">{rec.action}</span>
      <span className="text-xs opacity-70 flex-1 min-w-0 truncate">{rec.reason}</span>
      {rec.tab && (
        <button
          onClick={() => onTabChange(rec.tab)}
          className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 transition-opacity flex-shrink-0"
        >
          Go to {tabLabels[rec.tab] || rec.tab}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
