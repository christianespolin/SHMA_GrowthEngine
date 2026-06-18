'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScoreBadge, PriorityBadge } from '@/components/ui/score-display'
import { formatDate, formatDateRelative, isOverdue } from '@/lib/utils'
import {
  Building2, Target, Calendar, FileText, TrendingUp, CheckCircle2,
  AlertTriangle, Clock, Sparkles, ArrowRight, RefreshCw, ChevronRight, Activity,
  Globe2, Layers, FlaskConical, ShieldCheck, Star, Users, MessageSquare, AlertCircle,
} from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  href?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variantStyles = {
  default: 'border-slate-700',
  success: 'border-emerald-500/30 bg-emerald-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  danger: 'border-rose-500/30 bg-rose-500/5',
  info: 'border-cyan-500/30 bg-cyan-500/5',
}

function StatCard({ label, value, icon, href, variant = 'default' }: StatCardProps) {
  const content = (
    <div className={`bg-slate-800 border rounded-lg p-4 ${variantStyles[variant]} hover:border-slate-600 transition-colors`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-100 tabular-nums">{value}</div>
          <div className="text-xs text-slate-500 mt-1">{label}</div>
        </div>
        <div className="text-slate-600">{icon}</div>
      </div>
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

interface DashboardClientProps {
  stats: Record<string, number>
  stageBreakdown: { stage: string; count: number }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upcomingActions: Record<string, any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentlyActive: Record<string, any>[]
  totalCompanies: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upcomingMeetings: Record<string, any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentActivity: Record<string, any>[]
}

function activityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    meeting_logged: 'Meeting',
    outreach_sent: 'Outreach',
    stage_changed: 'Stage change',
    ai_research_completed: 'AI Research',
    contact_added: 'Contact added',
    note_updated: 'Note',
    ai_research: 'AI Research',
    ai_scoring: 'AI Scoring',
    company_created: 'Created',
    priority_change: 'Priority',
  }
  return map[type] || type.replace(/_/g, ' ')
}

function activityTypeBadgeClass(type: string): string {
  if (type === 'meeting_logged') return 'bg-cyan-500/20 text-cyan-300'
  if (type === 'outreach_sent') return 'bg-emerald-500/20 text-emerald-300'
  if (type === 'stage_changed' || type === 'stage_change') return 'bg-amber-500/20 text-amber-300'
  if (type === 'note_updated' || type === 'note') return 'bg-slate-700 text-slate-400'
  if (type.startsWith('ai_')) return 'bg-purple-500/20 text-purple-300'
  return 'bg-slate-700 text-slate-400'
}

const DASH_ANALYSIS_KEY = 'shma_pipeline_analysis' // shared with Reports page

export function DashboardClient({ stats, stageBreakdown, upcomingActions, recentlyActive, upcomingMeetings, recentActivity }: DashboardClientProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DASH_ANALYSIS_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setAiAnalysis(saved.content)
        setAiGeneratedAt(saved.generatedAt)
      }
    } catch { /* ignore */ }
  }, [])

  const runPipelineAnalysis = async () => {
    setLoadingAI(true)
    try {
      const res = await fetch('/api/ai/pipeline-analysis', { method: 'POST' })
      const data = await res.json()
      const now = new Date().toISOString()
      setAiAnalysis(data.content)
      setAiGeneratedAt(now)
      try {
        localStorage.setItem(DASH_ANALYSIS_KEY, JSON.stringify({ content: data.content, generatedAt: now }))
      } catch { /* storage unavailable */ }
    } catch {
      setAiAnalysis('Pipeline analysis failed. Check your API key configuration.')
    } finally {
      setLoadingAI(false)
    }
  }

  return (
    <div className="flex-1 p-5 space-y-5 overflow-y-auto">
      {/* Primary heroes — Target Universe funnel + Active sales */}
      <div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Target Funnel</div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <StatCard label="Target Universe" value={stats.target_universe || 0} icon={<Globe2 className="h-5 w-5" />} href="/target-universe" variant="default" />
          <StatCard label="Long List / Screened" value={stats.long_list || 0} icon={<Layers className="h-5 w-5" />} href="/target-universe" variant="info" />
          <StatCard label="AI Qualified" value={stats.ai_qualified || 0} icon={<FlaskConical className="h-5 w-5" />} href="/target-universe" variant="info" />
          <StatCard label="Validated Targets" value={stats.validated_targets || 0} icon={<ShieldCheck className="h-5 w-5" />} href="/target-universe" variant="info" />
        </div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Active Sales</div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Qualified Targets" value={stats.qualified_targets || 0} icon={<Star className="h-5 w-5" />} href="/companies" variant="success" />
          <StatCard label="Engaged" value={stats.engaged || 0} icon={<MessageSquare className="h-5 w-5" />} href="/pipeline" variant="success" />
          <StatCard label="Meetings Booked" value={stats.meetings_booked || 0} icon={<Calendar className="h-5 w-5" />} href="/companies?stage=Meeting+Booked" variant="success" />
          <StatCard label="Signed Clients" value={stats.signed_clients || 0} icon={<TrendingUp className="h-5 w-5" />} href="/companies?stage=Signed" variant="success" />
        </div>
      </div>

      {/* Secondary heroes */}
      <div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Attention Required</div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Outreach Ready" value={stats.outreach_ready || 0} icon={<Users className="h-5 w-5" />} href="/companies?stage=Warm+Intro+%2F+Outreach+Ready" />
          <StatCard label="Missing Contact Data" value={stats.missing_contact_data || 0} icon={<AlertCircle className="h-5 w-5" />} href="/companies" variant={stats.missing_contact_data > 0 ? 'warning' : 'default'} />
          <StatCard label="Stale Opportunities" value={stats.stale_opportunities || 0} icon={<Clock className="h-5 w-5" />} href="/companies" variant={stats.stale_opportunities > 5 ? 'warning' : 'default'} />
          <StatCard label="Origination Not Approved" value={stats.origination_not_approved || 0} icon={<AlertTriangle className="h-5 w-5" />} href="/companies" variant={stats.origination_not_approved > 0 ? 'danger' : 'default'} />
        </div>
      </div>

      {/* Alerts */}
      {(stats.no_next_action > 0 || stats.overdue_next_action > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {stats.no_next_action > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-amber-300">{stats.no_next_action} companies have no next action</div>
                <div className="text-xs text-amber-400/70 mt-0.5">Review and assign actions to keep pipeline moving</div>
              </div>
            </div>
          )}
          {stats.overdue_next_action > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-center gap-3">
              <Clock className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-rose-300">{stats.overdue_next_action} overdue next actions</div>
                <div className="text-xs text-rose-400/70 mt-0.5">Actions past their due date need immediate attention</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* AI Recommendations */}
        <div className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-200">AI Pipeline Recommendations</h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={runPipelineAnalysis}
              loading={loadingAI}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Analyze
            </Button>
          </div>

          <div className="p-4">
            {!aiAnalysis && !loadingAI && (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Click Analyze to generate this week's AI pipeline recommendations</p>
                <p className="text-xs text-slate-600 mt-1">Analyzes your pipeline and suggests focus accounts, stale leads, and action priorities</p>
              </div>
            )}
            {loadingAI && (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-slate-500">Analyzing pipeline…</p>
              </div>
            )}
            {aiAnalysis && (
              <>
                <div
                  className="ai-content text-sm text-slate-300 leading-relaxed max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnalysis) }}
                />
                {aiGeneratedAt && (
                  <div className="mt-3 pt-2 border-t border-slate-700 flex items-center gap-1.5 text-xs text-slate-600">
                    <Clock className="h-3 w-3" />
                    {new Date(aiGeneratedAt).toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })} at {new Date(aiGeneratedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Pipeline by Stage */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-200">Pipeline by Stage</h2>
          </div>
          <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
            {stageBreakdown.map(({ stage, count }) => (
              <Link
                key={stage}
                href={`/pipeline`}
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-700/50 transition-colors group"
              >
                <span className="text-xs text-slate-400 group-hover:text-slate-300 truncate">{stage}</span>
                <span className="text-xs font-semibold text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded tabular-nums flex-shrink-0 ml-2">{count}</span>
              </Link>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-slate-700">
            <Link href="/pipeline" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              View Kanban board <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Meetings + Recent Activity */}
      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming Meetings */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-200">Upcoming Meetings</h2>
            </div>
            <span className="text-xs text-slate-500">Next 14 days</span>
          </div>
          <div className="divide-y divide-slate-700/50">
            {upcomingMeetings.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-600">No meetings scheduled</div>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {upcomingMeetings.map((m: any) => {
              const company = m.companies as Record<string, unknown> | null
              const meetingDate = new Date(String(m.meeting_date))
              const day = meetingDate.getDate()
              const month = meetingDate.toLocaleString('default', { month: 'short' })
              return (
                <Link
                  key={String(m.id)}
                  href={company ? `/companies/${company.id}` : '#'}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 text-center">
                    <div className="text-xs text-cyan-400 font-semibold uppercase">{month}</div>
                    <div className="text-lg font-bold text-slate-100 leading-none">{day}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">
                      {company ? String(company.name) : 'Unknown Company'}
                    </div>
                    {m.objective && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{String(m.objective)}</div>
                    )}
                    {m.participants && (
                      <div className="text-xs text-slate-600 mt-0.5 truncate">{String(m.participants)}</div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Recent Activity</h2>
          </div>
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
            {recentActivity.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-600">No recent activity</div>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {recentActivity.map((item: any) => {
              const company = item.companies as Record<string, unknown> | null
              const actType = String(item.type || item.activity_type || '')
              return (
                <div key={String(item.id)} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${activityTypeBadgeClass(actType)}`}>
                        {activityTypeLabel(actType)}
                      </span>
                      {company && (
                        <Link href={`/companies/${company.id}`} className="text-xs text-cyan-400 hover:text-cyan-300 truncate">
                          {String(company.name)}
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{String(item.description || '')}</p>
                  </div>
                  <div className="text-xs text-slate-600 flex-shrink-0">
                    {formatDateRelative(item.created_at as string | null)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Upcoming Actions</h2>
            <Link href="/companies" className="text-xs text-slate-500 hover:text-slate-300">View all</Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {upcomingActions.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-600">No upcoming actions</div>
            )}
            {upcomingActions.map((c: Record<string, unknown>) => (
              <Link
                key={String(c.id)}
                href={`/companies/${c.id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">{String(c.name)}</span>
                    <PriorityBadge priority={String(c.priority)} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{String(c.next_action)}</div>
                </div>
                <div className={`text-xs flex-shrink-0 ${isOverdue(String(c.next_action_date)) ? 'text-rose-400' : 'text-slate-500'}`}>
                  {formatDate(String(c.next_action_date))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recently Active */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Recently Active</h2>
            <Link href="/companies" className="text-xs text-slate-500 hover:text-slate-300">View all</Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentlyActive.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-600">No recent activity</div>
            )}
            {recentlyActive.map((c: Record<string, unknown>) => (
              <Link
                key={String(c.id)}
                href={`/companies/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">{String(c.name)}</span>
                    <ScoreBadge score={c.shma_fit_score as number | null} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{String(c.stage)}</div>
                </div>
                <div className="text-xs text-slate-500 flex-shrink-0">
                  {formatDateRelative(c.last_activity_date as string | null)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•] (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gim, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}
