import { cn, scoreToBg } from '@/lib/utils'

interface ScoreBarProps {
  label: string
  score: number | null
  max?: number
  explanation?: string
}

export function ScoreBar({ label, score, max = 5, explanation }: ScoreBarProps) {
  const pct = score !== null ? (score / max) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={cn(
          'text-xs font-semibold tabular-nums',
          score !== null ? scoreToBg(score).split(' ')[1] : 'text-slate-500'
        )}>
          {score !== null ? score.toFixed(1) : '—'}/{max}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            score !== null && score >= 4.5 ? 'bg-emerald-500' :
            score !== null && score >= 3.5 ? 'bg-cyan-500' :
            score !== null && score >= 2.5 ? 'bg-amber-500' : 'bg-rose-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {explanation && (
        <p className="text-xs text-slate-500 leading-relaxed">{explanation}</p>
      )}
    </div>
  )
}

interface ScoreBadgeProps {
  score: number | null
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreBadge({ score, label, size = 'sm' }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5 font-bold',
  }

  if (score === null) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded border bg-slate-700 text-slate-500 border-slate-600',
        sizeClasses[size]
      )}>
        {label && <span className="opacity-60">{label}</span>}
        <span>—</span>
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded border font-semibold tabular-nums',
      scoreToBg(score),
      sizeClasses[size]
    )}>
      {label && <span className="font-normal opacity-75">{label}</span>}
      <span>{score.toFixed(1)}</span>
    </span>
  )
}

interface PriorityBadgeProps {
  priority: string | null
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const colorMap: Record<string, string> = {
    A: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    B: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    C: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Nurture: 'bg-slate-600/50 text-slate-400 border-slate-600',
    Disqualified: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    Unknown: 'bg-slate-700 text-slate-500 border-slate-600',
  }

  const p = priority || 'Unknown'
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={cn(
      'inline-flex items-center rounded border font-semibold',
      colorMap[p] || colorMap.Unknown,
      sizeClasses
    )}>
      {p}
    </span>
  )
}
