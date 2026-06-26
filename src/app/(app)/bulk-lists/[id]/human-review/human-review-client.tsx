'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn, formatDateRelative } from '@/lib/utils'
import { type HumanReviewStatus, HUMAN_REVIEW_STATUSES } from '@/lib/types'
import {
  CheckCircle2, X, MessageSquare, Clock, AlertTriangle, ChevronDown,
  ChevronUp, Users, BarChart2, Filter, ArrowRight, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

const DECISION_BTNS: { status: HumanReviewStatus; label: string; icon: React.ElementType; color: string; hotkey: string }[] = [
  { status: 'Approved',          label: 'Approve',           icon: CheckCircle2,   color: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/40', hotkey: 'A' },
  { status: 'Rejected',          label: 'Reject',            icon: X,              color: 'bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/40',             hotkey: 'R' },
  { status: 'Needs discussion',  label: 'Discuss',           icon: MessageSquare,  color: 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/40',         hotkey: 'D' },
  { status: 'Keep for later',    label: 'Later',             icon: Clock,          color: 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600',                  hotkey: 'L' },
  { status: 'Sensitive',         label: 'Sensitive',         icon: AlertTriangle,  color: 'bg-orange-600/20 text-orange-300 border-orange-500/40 hover:bg-orange-600/40',     hotkey: 'S' },
  { status: 'Do not contact',    label: 'DNC',               icon: AlertTriangle,  color: 'bg-red-800/30 text-red-300 border-red-700/40 hover:bg-red-800/40',                 hotkey: 'X' },
]

const STATUS_BADGE: Record<HumanReviewStatus, string> = {
  'Not reviewed':    'bg-slate-700 text-slate-400 border-slate-600',
  'Approved':        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Rejected':        'bg-rose-500/10 text-rose-400 border-rose-500/30',
  'Needs discussion':'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Keep for later':  'bg-slate-700 text-slate-500 border-slate-600',
  'Sensitive':       'bg-orange-500/10 text-orange-400 border-orange-500/30',
  'Do not contact':  'bg-red-700/20 text-red-300 border-red-700/40',
}

const SCORE_COLOR = (s: number | null) => {
  if (!s) return 'text-slate-700'
  if (s >= 80) return 'text-emerald-400'
  if (s >= 60) return 'text-amber-400'
  return 'text-rose-400'
}

export function HumanReviewClient({ list, items }: { list: AnyRecord; items: AnyRecord[] }) {
  const router = useRouter()
  const [localItems, setLocalItems] = useState(items)
  const [saving, setSaving] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<HumanReviewStatus | 'All'>('All')
  const [filterCountry, setFilterCountry] = useState('')
  const [splitting, setSplitting] = useState(false)
  const [showHotkeys, setShowHotkeys] = useState(false)

  const countries = [...new Set(localItems.map(i => i.companies?.country).filter(Boolean))].sort()

  const filtered = localItems.filter(item => {
    if (filterStatus !== 'All' && item.human_review_status !== filterStatus) return false
    if (filterCountry && item.companies?.country !== filterCountry) return false
    return true
  })

  const stats = {
    total: localItems.length,
    reviewed: localItems.filter(i => i.human_review_status !== 'Not reviewed').length,
    approved: localItems.filter(i => i.human_review_status === 'Approved').length,
    rejected: localItems.filter(i => i.human_review_status === 'Rejected').length,
    discussion: localItems.filter(i => i.human_review_status === 'Needs discussion').length,
    pending: localItems.filter(i => i.human_review_status === 'Not reviewed').length,
  }
  const pct = stats.total > 0 ? Math.round((stats.reviewed / stats.total) * 100) : 0

  const setDecision = useCallback(async (companyId: string, status: HumanReviewStatus) => {
    const note = notes[companyId] || undefined
    setSaving(companyId)
    try {
      await fetch(`/api/bulk-lists/${list.id}/companies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_ids: [companyId], human_review_status: status, review_notes: note }),
      })
      setLocalItems(prev => prev.map(i =>
        i.company_id === companyId ? { ...i, human_review_status: status } : i
      ))
    } finally { setSaving(null) }
  }, [list.id, notes])

  const splitList = async () => {
    setSplitting(true)
    try {
      const res = await fetch(`/api/bulk-lists/${list.id}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        router.push('/bulk-lists')
        router.refresh()
      }
    } finally { setSplitting(false) }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
      {/* Progress */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400 font-medium">{stats.reviewed}/{stats.total} reviewed ({pct}%)</span>
            <span className="text-emerald-400">{stats.approved} approved</span>
            <span className="text-rose-400">{stats.rejected} rejected</span>
            {stats.discussion > 0 && <span className="text-amber-400">{stats.discussion} to discuss</span>}
            <span className="text-slate-600">{stats.pending} pending</span>
          </div>
          {(stats.approved > 0 || stats.rejected > 0) && (
            <Button size="sm" variant="primary" onClick={splitList} loading={splitting}>
              <ArrowRight className="w-3.5 h-3.5" /> Split & finalise
            </Button>
          )}
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full flex rounded-full overflow-hidden">
            <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.approved/stats.total)*100}%` }} />
            <div className="bg-rose-500 transition-all" style={{ width: `${(stats.rejected/stats.total)*100}%` }} />
            <div className="bg-amber-500 transition-all" style={{ width: `${(stats.discussion/stats.total)*100}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-600" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as HumanReviewStatus | 'All')}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500">
          <option value="All">All ({localItems.length})</option>
          {HUMAN_REVIEW_STATUSES.map(s => (
            <option key={s} value={s}>{s} ({localItems.filter(i => i.human_review_status === s).length})</option>
          ))}
        </select>
        {countries.length > 1 && (
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500">
            <option value="">All countries</option>
            {countries.map(c => <option key={c}>{c}</option>)}
          </select>
        )}
        <button onClick={() => setShowHotkeys(v => !v)} className="ml-auto text-xs text-slate-700 hover:text-slate-500">
          {showHotkeys ? 'Hide' : 'Hotkeys'}
        </button>
        {showHotkeys && (
          <div className="flex gap-2 text-xs text-slate-600">
            {DECISION_BTNS.map(b => <span key={b.hotkey}><kbd className="text-slate-400">{b.hotkey}</kbd> {b.label}</span>)}
          </div>
        )}
      </div>

      {/* Company review cards */}
      <div className="space-y-3">
        {filtered.map(item => {
          const company = item.companies
          if (!company) return null
          const currentStatus = item.human_review_status as HumanReviewStatus
          const isExpanded = expanded.has(item.company_id)
          const brief = item.brief

          return (
            <div
              key={item.id}
              className={cn(
                'bg-slate-800/60 border rounded-xl transition-colors',
                currentStatus === 'Approved' ? 'border-emerald-500/30' :
                currentStatus === 'Rejected' ? 'border-rose-500/20' :
                currentStatus === 'Needs discussion' ? 'border-amber-500/30' :
                currentStatus === 'Do not contact' ? 'border-red-700/30' :
                'border-slate-700'
              )}
            >
              {/* Header row */}
              <div className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link href={`/companies/${company.id}`} target="_blank"
                      className="text-sm font-semibold text-slate-100 hover:text-cyan-400 transition-colors flex items-center gap-1">
                      {company.name}
                      <ExternalLink className="w-3 h-3 opacity-40" />
                    </Link>
                    {company.sensitivity_status && company.sensitivity_status !== 'Normal' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400 border-orange-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> {company.sensitivity_status}
                      </span>
                    )}
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', STATUS_BADGE[currentStatus])}>
                      {currentStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    {company.country && <span>{company.country}</span>}
                    {company.segment && <span>· {company.segment}</span>}
                    {company.employee_range && <span>· {company.employee_range} employees</span>}
                    {company.revenue_range && <span>· {company.revenue_range}</span>}
                  </div>
                  {brief?.possible_aaas_concept && (
                    <p className="text-xs text-slate-400 mt-2 italic">"{brief.possible_aaas_concept}"</p>
                  )}
                  {brief?.why_shma_relevant && (
                    <p className="text-xs text-slate-600 mt-1">{brief.why_shma_relevant}</p>
                  )}
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  {company.shma_fit_score && (
                    <div className={cn('text-2xl font-bold font-mono', SCORE_COLOR(company.shma_fit_score))}>
                      {Math.round(company.shma_fit_score)}
                    </div>
                  )}
                  {company.overall_priority_score && (
                    <div className="text-[10px] text-slate-600">priority {Math.round(company.overall_priority_score)}</div>
                  )}
                  <button onClick={() => toggleExpand(item.company_id)}
                    className="text-slate-600 hover:text-slate-400 transition-colors mt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-2 border-t border-slate-700/50 pt-3">
                  {brief?.missing_information && (
                    <div className="text-xs text-slate-600">
                      <span className="text-slate-500">Missing: </span>{brief.missing_information}
                    </div>
                  )}
                  {brief?.recommended_next_action && (
                    <div className="text-xs text-slate-600">
                      <span className="text-slate-500">Rec. next: </span>{brief.recommended_next_action}
                    </div>
                  )}
                  {company.score_explanation && (
                    <div className="text-xs text-slate-700 italic">{company.score_explanation}</div>
                  )}
                  <div>
                    <label className="text-[10px] text-slate-600 uppercase tracking-wide">Review note</label>
                    <input
                      value={notes[item.company_id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [item.company_id]: e.target.value }))}
                      placeholder="Add note…"
                      className="mt-1 w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Decision buttons */}
              <div className="flex items-center gap-1.5 px-4 pb-4 flex-wrap">
                {DECISION_BTNS.map(btn => {
                  const Icon = btn.icon
                  const isActive = currentStatus === btn.status
                  return (
                    <button
                      key={btn.status}
                      onClick={() => setDecision(item.company_id, btn.status)}
                      disabled={saving === item.company_id}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                        isActive ? btn.color.replace('hover:', '') : 'bg-slate-700/50 text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-600',
                        saving === item.company_id && 'opacity-50'
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {btn.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-600 text-sm">All companies reviewed in this filter.</div>
        )}
      </div>
    </div>
  )
}
