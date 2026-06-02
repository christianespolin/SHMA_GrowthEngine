'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Tag, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIValidationPanelProps {
  confidenceLevel?: 'High' | 'Medium' | 'Low' | null
  knownFacts?: string | string[] | null
  hypotheses?: string | string[] | null
  missingInformation?: string | string[] | null
  validationTasks?: string[] | null
  sources?: string | null
  humanApprovalStatus?: string | null
  generatedAt?: string | null
  modelUsed?: string | null
  onApprove?: () => void
  onReject?: () => void
  onRequestRewrite?: () => void
  className?: string
}

function toLines(val: string | string[] | null | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  return val.split('\n').filter(l => l.trim())
}

export function AIValidationPanel({
  confidenceLevel,
  knownFacts,
  hypotheses,
  missingInformation,
  validationTasks,
  sources,
  humanApprovalStatus,
  generatedAt,
  modelUsed,
  onApprove,
  onReject,
  onRequestRewrite,
  className,
}: AIValidationPanelProps) {
  const [expanded, setExpanded] = useState(humanApprovalStatus !== 'approved')

  const confidenceColor = (c: string | null | undefined) => {
    if (c === 'High') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    if (c === 'Medium') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    if (c === 'Low') return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    return 'bg-slate-700 text-slate-400 border-slate-600'
  }

  const approvalColor = (s: string | null | undefined) => {
    if (s === 'approved') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    if (s === 'rejected') return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    if (s === 'rewrite_requested') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    return 'bg-slate-700 text-slate-400 border-slate-600'
  }

  const knownFactsLines = toLines(knownFacts)
  const hypothesesLines = toLines(hypotheses)
  const missingLines = toLines(missingInformation)
  const taskLines = toLines(validationTasks)

  return (
    <div className={cn('border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs font-medium text-slate-300">AI Intelligence</span>
          {confidenceLevel && (
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] border', confidenceColor(confidenceLevel))}>
              {confidenceLevel}
            </span>
          )}
          {humanApprovalStatus && humanApprovalStatus !== 'not_reviewed' && (
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] border', approvalColor(humanApprovalStatus))}>
              {humanApprovalStatus.replace('_', ' ')}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
          {/* Known Facts */}
          {knownFactsLines.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 pt-3">
                <Tag className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Known Facts</span>
              </div>
              <ul className="space-y-1">
                {knownFactsLines.map((line, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <span className="text-slate-600 flex-shrink-0 mt-0.5">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hypotheses */}
          {hypothesesLines.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">AI Hypotheses</span>
              </div>
              <ul className="space-y-1">
                {hypothesesLines.map((line, i) => (
                  <li key={i} className="text-xs text-amber-300/80 flex items-start gap-1.5">
                    <span className="text-amber-600 flex-shrink-0 mt-0.5">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Information */}
          {missingLines.length > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                <span className="text-[10px] font-medium text-rose-500 uppercase tracking-wide">Missing Information</span>
              </div>
              <ul className="space-y-1">
                {missingLines.map((line, i) => (
                  <li key={i} className="text-xs text-rose-300/80 flex items-start gap-1.5">
                    <span className="text-rose-600 flex-shrink-0 mt-0.5">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation Tasks */}
          {taskLines.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Validation Tasks</span>
              </div>
              <ul className="space-y-1">
                {taskLines.map((line, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <span className="w-3.5 h-3.5 border border-slate-600 rounded flex-shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources */}
          {sources && (
            <p className="text-xs text-slate-600">{sources}</p>
          )}

          {/* Timestamps */}
          {(generatedAt || modelUsed) && (
            <p className="text-[10px] text-slate-600">
              {generatedAt && `Generated: ${new Date(generatedAt).toLocaleString()}`}
              {generatedAt && modelUsed && ' · '}
              {modelUsed}
            </p>
          )}

          {/* Human approval actions */}
          {(onApprove || onReject || onRequestRewrite) && (
            <div className="flex gap-2 pt-1">
              {onApprove && (
                <Button size="sm" variant="ghost" className="border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={onApprove}>
                  Approve
                </Button>
              )}
              {onRequestRewrite && (
                <Button size="sm" variant="ghost" className="border border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={onRequestRewrite}>
                  Request rewrite
                </Button>
              )}
              {onReject && (
                <Button size="sm" variant="ghost" className="border border-rose-500/30 text-rose-400 hover:bg-rose-500/10" onClick={onReject}>
                  Reject
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
