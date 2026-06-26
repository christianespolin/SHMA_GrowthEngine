'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatDateRelative } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sparkles, RefreshCw, X, CheckCircle2, AlertTriangle, Clock, Play,
} from 'lucide-react'
import Link from 'next/link'
import type { AIProcessStatus, AIProcessType } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

const STATUS_CFG: Record<AIProcessStatus, { badge: string; icon: React.ElementType }> = {
  'Queued':            { badge: 'bg-slate-700 text-slate-400 border-slate-600',            icon: Clock },
  'Running':           { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',         icon: Play },
  'Completed':         { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  'Failed':            { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',         icon: AlertTriangle },
  'Cancelled':         { badge: 'bg-slate-700 text-slate-500 border-slate-600',            icon: X },
  'Partially completed':{ badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',    icon: AlertTriangle },
}

const PROCESS_COLOR: Record<AIProcessType, string> = {
  'SHMA Scoring':       'text-cyan-400',
  'Deep Research':      'text-blue-400',
  'Contact Research':   'text-purple-400',
  'Outreach Drafting':  'text-amber-400',
  'Criteria Structuring': 'text-slate-400',
}

export function AIRunsClient({ runs }: { runs: AnyRecord[] }) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)

  const filtered = runs.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false
    if (filterType && r.process_type !== filterType) return false
    return true
  })

  const activeRuns = runs.filter(r => ['Queued', 'Running'].includes(r.status))
  const totalCost = runs.reduce((sum, r) => sum + (r.actual_cost || 0), 0)

  const cancelRun = async (id: string) => {
    setCancelling(id)
    try {
      await fetch(`/api/ai-runs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      })
      router.refresh()
    } finally { setCancelling(null) }
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-slate-200">{runs.length}</div>
          <div className="text-xs text-slate-600 mt-0.5">Total runs</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
          <div className={cn('text-2xl font-bold', activeRuns.length > 0 ? 'text-cyan-400' : 'text-slate-600')}>{activeRuns.length}</div>
          <div className="text-xs text-slate-600 mt-0.5">Active / queued</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-rose-400">
            {runs.filter(r => r.status === 'Failed').length}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">Failed</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-amber-400">
            ${totalCost.toFixed(2)}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">Total cost (USD)</div>
        </div>
      </div>

      {/* Active runs alert */}
      {activeRuns.length > 0 && (
        <div className="bg-cyan-500/5 border border-cyan-500/30 rounded-xl p-4">
          <div className="text-xs font-medium text-cyan-400 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {activeRuns.length} run{activeRuns.length !== 1 ? 's' : ''} active
          </div>
          <div className="space-y-2">
            {activeRuns.map(run => (
              <div key={run.id} className="flex items-center gap-3">
                <span className={cn('text-xs font-medium', PROCESS_COLOR[run.process_type as AIProcessType] || 'text-slate-400')}>
                  {run.process_type}
                </span>
                {run.bulk_lists && (
                  <span className="text-xs text-slate-500">{run.bulk_lists.name}</span>
                )}
                <span className="text-xs text-slate-600">
                  {run.processed_items}/{run.total_items}
                </span>
                {run.total_items > 0 && (
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.round((run.processed_items / run.total_items) * 100)}%` }} />
                  </div>
                )}
                <button onClick={() => cancelRun(run.id)} disabled={cancelling === run.id}
                  className="text-slate-600 hover:text-rose-400 transition-colors text-xs">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500">
          <option value="">All statuses</option>
          <option>Queued</option><option>Running</option><option>Completed</option>
          <option>Failed</option><option>Cancelled</option><option>Partially completed</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500">
          <option value="">All types</option>
          <option>SHMA Scoring</option><option>Deep Research</option>
          <option>Contact Research</option><option>Outreach Drafting</option>
        </select>
        <span className="text-xs text-slate-600">{filtered.length} runs</span>
        <button onClick={() => router.refresh()} className="ml-auto text-slate-600 hover:text-slate-400">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Runs table */}
      <div className="space-y-2">
        {filtered.map(run => {
          const StatusIcon = STATUS_CFG[run.status as AIProcessStatus]?.icon || Clock
          const statusBadge = STATUS_CFG[run.status as AIProcessStatus]?.badge || STATUS_CFG['Queued'].badge
          const pct = run.total_items > 0 ? Math.round((run.processed_items / run.total_items) * 100) : 0

          return (
            <div key={run.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <StatusIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0',
                  run.status === 'Running' ? 'text-cyan-400 animate-spin' :
                  run.status === 'Completed' ? 'text-emerald-400' :
                  run.status === 'Failed' ? 'text-rose-400' : 'text-slate-500'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn('text-sm font-medium', PROCESS_COLOR[run.process_type as AIProcessType] || 'text-slate-300')}>
                      {run.process_type}
                    </span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', statusBadge)}>
                      {run.status}
                    </span>
                    {run.model && (
                      <span className="text-[10px] text-slate-700">{run.model}</span>
                    )}
                  </div>

                  {run.bulk_lists && (
                    <Link href={`/bulk-lists/${run.bulk_lists.id}`}
                      className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                      {run.bulk_lists.name} · {run.bulk_lists.category}
                    </Link>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                    <span>{run.processed_items}/{run.total_items} items</span>
                    {run.failed_items > 0 && <span className="text-rose-400">{run.failed_items} failed</span>}
                    {run.estimated_cost && <span>Est. ${run.estimated_cost.toFixed(2)}</span>}
                    {run.actual_cost && <span className="text-amber-400">Actual ${run.actual_cost.toFixed(2)}</span>}
                    <span>{formatDateRelative(run.created_at)}</span>
                  </div>

                  {run.status === 'Running' && run.total_items > 0 && (
                    <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}

                  {run.error_summary && (
                    <div className="mt-2 text-xs text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded p-2">
                      {run.error_summary}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 flex gap-1">
                  {run.status === 'Failed' && (
                    <Button size="sm" variant="ghost" className="text-xs">
                      <RefreshCw className="w-3 h-3" /> Retry
                    </Button>
                  )}
                  {['Queued', 'Running'].includes(run.status) && (
                    <Button size="sm" variant="ghost" className="text-xs text-rose-400"
                      onClick={() => cancelRun(run.id)} loading={cancelling === run.id}>
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-600 text-sm">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30" />
            No AI runs yet. Start one from a bulk list.
          </div>
        )}
      </div>
    </div>
  )
}
