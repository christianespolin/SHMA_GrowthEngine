'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sparkles, CheckCircle2, AlertTriangle, X } from 'lucide-react'

interface BatchRunPanelProps {
  listId: string
  processType: 'SHMA Scoring' | 'Deep Research' | 'Contact Research'
  endpoint: string // e.g. 'run-scoring' | 'run-deep-research'
  totalCompanies: number
  estimatedCostPerCompany: number
  onComplete?: () => void
  onCancel?: () => void
}

type RunState = 'idle' | 'running' | 'done' | 'error' | 'cancelled'

export function BatchRunPanel({
  listId, processType, endpoint, totalCompanies, estimatedCostPerCompany, onComplete, onCancel,
}: BatchRunPanelProps) {
  const [state, setState] = useState<RunState>('idle')
  const [processed, setProcessed] = useState(0)
  const [failed, setFailed] = useState(0)
  const [runId, setRunId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const cancelRef = useRef(false)

  const estimatedCost = (totalCompanies * estimatedCostPerCompany).toFixed(2)
  const pct = totalCompanies > 0 ? Math.round((processed / totalCompanies) * 100) : 0

  useEffect(() => {
    return () => { cancelRef.current = true }
  }, [])

  const startRun = async () => {
    setState('running')
    cancelRef.current = false
    setProcessed(0)
    setFailed(0)
    setError('')

    let currentOffset = 0
    let currentRunId: string | null = null

    while (!cancelRef.current) {
      try {
        const res: Response = await fetch(`/api/bulk-lists/${listId}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch_offset: currentOffset, run_id: currentRunId }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Request failed')
          setState('error')
          return
        }

        const data = await res.json()
        if (data.run_id && !currentRunId) currentRunId = data.run_id
        setRunId(data.run_id)
        setProcessed(data.total_processed || 0)
        setFailed(prev => prev + (data.failed_this_batch || 0))

        if (data.done) {
          setState('done')
          onComplete?.()
          return
        }

        currentOffset = data.next_offset
        // Small pause between batches to avoid overwhelming the API
        await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setState('error')
        return
      }
    }

    setState('cancelled')
  }

  const cancel = () => {
    cancelRef.current = true
    setState('cancelled')
    onCancel?.()
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className={cn('w-4 h-4', state === 'running' ? 'text-cyan-400 animate-pulse' : 'text-slate-500')} />
        <span className="text-sm font-medium text-slate-200">{processType}</span>
        {state === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        {state === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900 rounded-lg px-3 py-2">
          <div className="text-slate-600 mb-0.5">Companies</div>
          <div className="font-bold text-slate-300">{totalCompanies.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 rounded-lg px-3 py-2">
          <div className="text-slate-600 mb-0.5">Est. cost</div>
          <div className="font-bold text-amber-400">${estimatedCost}</div>
        </div>
        <div className="bg-slate-900 rounded-lg px-3 py-2">
          <div className="text-slate-600 mb-0.5">Model</div>
          <div className="font-bold text-slate-400 truncate">
            {endpoint === 'run-scoring' ? 'Haiku (fast)' : 'Sonnet (deep)'}
          </div>
        </div>
      </div>

      {state !== 'idle' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{processed}/{totalCompanies} processed{failed > 0 ? ` · ${failed} failed` : ''}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300',
                state === 'done' ? 'bg-emerald-500' :
                state === 'error' ? 'bg-rose-500' :
                state === 'cancelled' ? 'bg-amber-500' : 'bg-cyan-500'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded p-2">{error}</div>
      )}

      {state === 'done' && (
        <div className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded p-2">
          ✓ {processType} complete. {processed} companies processed. List category updated automatically.
        </div>
      )}

      {state === 'idle' && (
        <div className="text-xs text-slate-600 bg-slate-900/50 border border-slate-700 rounded p-3">
          <strong className="text-slate-500">Before starting:</strong> This will use Claude AI to process all {totalCompanies.toLocaleString()} companies.
          Estimated cost: <span className="text-amber-400">${estimatedCost}</span>. The process runs in batches and can be cancelled.
        </div>
      )}

      <div className="flex gap-2">
        {state === 'idle' && (
          <Button variant="primary" onClick={startRun}>
            <Sparkles className="w-3.5 h-3.5" /> Start {processType}
          </Button>
        )}
        {state === 'running' && (
          <Button variant="ghost" onClick={cancel} className="text-rose-400">
            <X className="w-3.5 h-3.5" /> Cancel
          </Button>
        )}
        {(state === 'done' || state === 'cancelled' || state === 'error') && (
          <Button variant="ghost" onClick={() => { setState('idle'); setProcessed(0); setFailed(0); setError('') }}>
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
