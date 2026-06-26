'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn, formatDateRelative } from '@/lib/utils'
import { type HumanReviewStatus } from '@/lib/types'
import {
  Sparkles, Users, CheckSquare, ChevronRight, AlertTriangle,
  BarChart2, Filter, CheckCircle2, X, Clock, ArrowRight,
  Play, Info,
} from 'lucide-react'
import Link from 'next/link'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

const REVIEW_STATUS_CFG: Record<HumanReviewStatus, { badge: string; label: string }> = {
  'Not reviewed':    { badge: 'bg-slate-700 text-slate-400 border-slate-600',             label: 'Not reviewed' },
  'Approved':        { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Approved' },
  'Rejected':        { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',          label: 'Rejected' },
  'Needs discussion':{ badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',       label: 'Needs discussion' },
  'Keep for later':  { badge: 'bg-slate-700 text-slate-500 border-slate-600',             label: 'Keep for later' },
  'Sensitive':       { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',    label: 'Sensitive' },
  'Do not contact':  { badge: 'bg-rose-700/20 text-rose-300 border-rose-700/40',          label: 'Do not contact' },
}

const SENSITIVITY_WARN: Record<string, string> = {
  'Do not contact': 'text-rose-400',
  'Sensitive': 'text-amber-400',
  'Excluded from SHMA outreach': 'text-slate-500',
}

export function BulkListDetailClient({ list, items, aiRuns }: {
  list: AnyRecord
  items: AnyRecord[]
  aiRuns: AnyRecord[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'companies' | 'ai_runs' | 'settings'>('companies')
  const [filterReview, setFilterReview] = useState<HumanReviewStatus | 'All'>('All')
  const [filterCountry, setFilterCountry] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<HumanReviewStatus | ''>('')
  const [applying, setApplying] = useState(false)
  const [splitting, setSplitting] = useState(false)

  const isHumanReviewList = list.category === 'Ready for Human Review'

  const countries = [...new Set(items.map(i => i.companies?.country).filter(Boolean))].sort()

  const filtered = items.filter(item => {
    if (filterReview !== 'All' && item.human_review_status !== filterReview) return false
    if (filterCountry && item.companies?.country !== filterCountry) return false
    return true
  })

  const stats = {
    total: items.length,
    approved: items.filter(i => i.human_review_status === 'Approved').length,
    rejected: items.filter(i => i.human_review_status === 'Rejected').length,
    pending: items.filter(i => i.human_review_status === 'Not reviewed').length,
    discussion: items.filter(i => i.human_review_status === 'Needs discussion').length,
  }

  const toggleSelect = (companyId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(companyId)) next.delete(companyId)
      else next.add(companyId)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(i => i.company_id)))
  }

  const applyBulkStatus = async () => {
    if (!bulkStatus || selected.size === 0) return
    setApplying(true)
    try {
      await fetch(`/api/bulk-lists/${list.id}/companies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_ids: [...selected], human_review_status: bulkStatus }),
      })
      router.refresh()
      setSelected(new Set())
      setBulkStatus('')
    } finally { setApplying(false) }
  }

  const splitList = async () => {
    if (stats.approved === 0 && stats.rejected === 0) return
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

  const scoreColor = (score: number | null) => {
    if (!score) return 'text-slate-600'
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-rose-400'
  }

  const TABS = [
    { id: 'companies', label: `Companies (${items.length})` },
    { id: 'ai_runs', label: `AI Runs (${aiRuns.length})` },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="p-6 max-w-6xl space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-400' },
          { label: 'Rejected', value: stats.rejected, color: 'text-rose-400' },
          { label: 'Not reviewed', value: stats.pending, color: 'text-slate-500' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
            <div className={cn('text-2xl font-bold', s.color || 'text-slate-200')}>{s.value.toLocaleString()}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action panel */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex items-center gap-3 flex-wrap">
        {list.category === 'Longlist' && (
          <Button size="sm" variant="primary" onClick={() => router.push(`/ai-runs?new=SHMA+Scoring&bulk_list_id=${list.id}`)}>
            <Sparkles className="w-3.5 h-3.5" /> Run AI Scoring
          </Button>
        )}
        {list.category === 'AI Researched' && (
          <Button size="sm" variant="primary" onClick={() => router.push(`/bulk-lists/${list.id}/select`)}>
            <Filter className="w-3.5 h-3.5" /> Select for Deep Research
          </Button>
        )}
        {list.category === 'Ready for AI Deep Research' && (
          <Button size="sm" variant="primary" onClick={() => router.push(`/ai-runs?new=Deep+Research&bulk_list_id=${list.id}`)}>
            <Sparkles className="w-3.5 h-3.5" /> Run Deep Research
          </Button>
        )}
        {isHumanReviewList && (
          <Link href={`/bulk-lists/${list.id}/human-review`}>
            <Button size="sm" variant="primary">
              <CheckSquare className="w-3.5 h-3.5" /> Open Human Review
            </Button>
          </Link>
        )}
        {isHumanReviewList && (stats.approved > 0 || stats.rejected > 0) && (
          <Button size="sm" variant="ghost" onClick={splitList} loading={splitting}>
            <ArrowRight className="w-3.5 h-3.5" />
            Split list ({stats.approved} approved, {stats.rejected} rejected)
          </Button>
        )}
        {list.category === 'Ready for Contact Research' && (
          <Button size="sm" variant="primary" onClick={() => router.push(`/ai-runs?new=Contact+Research&bulk_list_id=${list.id}`)}>
            <Users className="w-3.5 h-3.5" /> Run Contact Research
          </Button>
        )}
        <div className="text-xs text-slate-600 ml-auto">
          Updated {formatDateRelative(list.updated_at)}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={cn(
                'px-4 py-2 text-xs font-medium border-b-2 transition-colors',
                tab === t.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'companies' && (
        <div className="space-y-3">
          {/* Filters + bulk actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterReview}
              onChange={e => setFilterReview(e.target.value as HumanReviewStatus | 'All')}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All review statuses</option>
              <option>Not reviewed</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Needs discussion</option>
              <option>Keep for later</option>
              <option>Sensitive</option>
              <option>Do not contact</option>
            </select>
            {countries.length > 1 && (
              <select
                value={filterCountry}
                onChange={e => setFilterCountry(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">All countries</option>
                {countries.map(c => <option key={c}>{c}</option>)}
              </select>
            )}
            <span className="text-xs text-slate-600">{filtered.length} shown</span>

            {/* Bulk action */}
            {isHumanReviewList && selected.size > 0 && (
              <div className="flex items-center gap-2 ml-auto bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                <span className="text-xs text-cyan-400">{selected.size} selected</span>
                <select
                  value={bulkStatus}
                  onChange={e => setBulkStatus(e.target.value as HumanReviewStatus | '')}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">Set status…</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>Needs discussion</option>
                  <option>Keep for later</option>
                  <option>Sensitive</option>
                  <option>Do not contact</option>
                </select>
                <Button size="sm" variant="primary" onClick={applyBulkStatus} loading={applying} disabled={!bulkStatus}>
                  Apply
                </Button>
                <button onClick={() => setSelected(new Set())} className="text-slate-600 hover:text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Select all row */}
          {isHumanReviewList && filtered.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={selectAll}
                className="w-3.5 h-3.5 accent-cyan-500"
              />
              <span className="text-xs text-slate-600">Select all visible</span>
            </div>
          )}

          {/* Company rows */}
          <div className="space-y-1">
            {filtered.map(item => {
              const company = item.companies
              if (!company) return null
              const reviewCfg = REVIEW_STATUS_CFG[item.human_review_status as HumanReviewStatus] || REVIEW_STATUS_CFG['Not reviewed']
              const sensitivityWarn = company.sensitivity_status && company.sensitivity_status !== 'Normal'
                ? SENSITIVITY_WARN[company.sensitivity_status]
                : null

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors',
                    selected.has(item.company_id) && 'border-cyan-500/40 bg-cyan-500/5'
                  )}
                >
                  {isHumanReviewList && (
                    <input
                      type="checkbox"
                      checked={selected.has(item.company_id)}
                      onChange={() => toggleSelect(item.company_id)}
                      className="w-3.5 h-3.5 accent-cyan-500 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/companies/${company.id}`}
                          className="text-sm font-medium text-slate-200 hover:text-cyan-400 transition-colors truncate">
                          {company.name}
                        </Link>
                        {sensitivityWarn && (
                          <AlertTriangle className={cn('w-3 h-3 flex-shrink-0', sensitivityWarn)} />
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                        {company.country && <span>{company.country}</span>}
                        {company.segment && <span>· {company.segment}</span>}
                        {company.employee_range && <span>· {company.employee_range}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {company.shma_fit_score && (
                        <span className={cn('text-xs font-mono font-bold', scoreColor(company.shma_fit_score))}>
                          {Math.round(company.shma_fit_score)}
                        </span>
                      )}
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', reviewCfg.badge)}>
                        {reviewCfg.label}
                      </span>
                      <Link href={`/companies/${company.id}`}
                        className="text-slate-700 hover:text-slate-400 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-600 text-sm">No companies match the current filter.</div>
          )}
        </div>
      )}

      {tab === 'ai_runs' && (
        <div className="space-y-2">
          {aiRuns.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm">No AI runs for this list yet.</div>
          ) : (
            aiRuns.map(run => (
              <div key={run.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{run.process_type}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border',
                        run.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        run.status === 'Running' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                        run.status === 'Failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-slate-700 text-slate-400 border-slate-600'
                      )}>
                        {run.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {run.processed_items}/{run.total_items} items
                      {run.failed_items > 0 && <span className="text-rose-500 ml-1">· {run.failed_items} failed</span>}
                      {run.actual_cost && <span className="ml-2">${run.actual_cost.toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-slate-700">{formatDateRelative(run.created_at)}</div>
                </div>
                {run.status === 'Running' && run.total_items > 0 && (
                  <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${Math.round((run.processed_items / run.total_items) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="max-w-md space-y-4 text-sm">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Category</span>
              <span className="text-slate-300">{list.category}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Source type</span>
              <span className="text-slate-300">{list.source_type}</span>
            </div>
            {list.source_name && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Source</span>
                <span className="text-slate-300">{list.source_name}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Created</span>
              <span className="text-slate-300">{formatDateRelative(list.created_at)}</span>
            </div>
            {list.parent_bulk_list_id && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Parent list</span>
                <Link href={`/bulk-lists/${list.parent_bulk_list_id}`} className="text-cyan-400 hover:underline">
                  View parent →
                </Link>
              </div>
            )}
          </div>
          <Button size="sm" variant="ghost" className="text-slate-600 hover:text-rose-400"
            onClick={async () => {
              await fetch(`/api/bulk-lists/${list.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: 'Archived', status: 'Archived' }),
              })
              router.push('/bulk-lists')
              router.refresh()
            }}>
            Archive this list
          </Button>
        </div>
      )}
    </div>
  )
}
