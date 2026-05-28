'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScoreBadge, PriorityBadge } from '@/components/ui/score-display'
import { formatDate, formatDateRelative, isOverdue } from '@/lib/utils'
import {
  Building2, Target, Calendar, FileText, TrendingUp, CheckCircle2,
  AlertTriangle, Clock, Sparkles, ArrowRight, RefreshCw, ChevronRight
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
}

export function DashboardClient({ stats, stageBreakdown, upcomingActions, recentlyActive }: DashboardClientProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)

  const runPipelineAnalysis = async () => {
    setLoadingAI(true)
    try {
      const res = await fetch('/api/ai/pipeline-analysis', { method: 'POST' })
      const data = await res.json()
      setAiAnalysis(data.content)
    } catch {
      setAiAnalysis('Pipeline analysis failed. Check your API key configuration.')
    } finally {
      setLoadingAI(false)
    }
  }

  return (
    <div className="flex-1 p-5 space-y-5 overflow-y-auto">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Companies" value={stats.total_companies} icon={<Building2 className="h-5 w-5" />} href="/companies" />
        <StatCard label="A-Priority Leads" value={stats.a_priority} icon={<Target className="h-5 w-5" />} href="/companies?priority=A" variant="success" />
        <StatCard label="Qualified Targets" value={stats.qualified_targets} icon={<CheckCircle2 className="h-5 w-5" />} href="/pipeline" variant="info" />
        <StatCard label="Signed Clients" value={stats.signed_clients} icon={<TrendingUp className="h-5 w-5" />} href="/companies?stage=Signed" variant="success" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Meetings Booked" value={stats.meetings_booked} icon={<Calendar className="h-5 w-5" />} href="/companies?stage=Meeting+Booked" />
        <StatCard label="Proposals Active" value={stats.proposals_active} icon={<FileText className="h-5 w-5" />} href="/companies?stage=Proposal+%2F+Agreement" />
        <StatCard label="Stale Leads" value={stats.stale_leads} icon={<AlertTriangle className="h-5 w-5" />} variant={stats.stale_leads > 5 ? 'warning' : 'default'} />
        <StatCard label="Avg Fit Score" value={stats.avg_fit_score || '—'} icon={<Target className="h-5 w-5" />} variant={stats.avg_fit_score >= 4 ? 'success' : stats.avg_fit_score >= 3 ? 'info' : 'default'} />
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
              <div
                className="ai-content text-sm text-slate-300 leading-relaxed max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnalysis) }}
              />
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
