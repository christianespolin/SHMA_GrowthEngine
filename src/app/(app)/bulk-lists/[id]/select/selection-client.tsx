'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Filter, ArrowRight, Info, CheckCircle2 } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export function SelectionClient({
  list, countries, segments, totalCompanies, avgScore, p75Score,
}: {
  list: AnyRecord
  countries: string[]
  segments: string[]
  totalCompanies: number
  avgScore: number | null
  p75Score: number | null
}) {
  const router = useRouter()

  const [minScore, setMinScore] = useState(p75Score ? Math.round(p75Score) : 70)
  const [minOppScore, setMinOppScore] = useState(0)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])
  const [maxCompanies, setMaxCompanies] = useState(200)
  const [excludeSensitive, setExcludeSensitive] = useState(true)
  const [excludeDNC, setExcludeDNC] = useState(true)
  const [excludeNotInteresting, setExcludeNotInteresting] = useState(true)
  const [notes, setNotes] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<AnyRecord | null>(null)
  const [error, setError] = useState('')

  const toggleCountry = (c: string) =>
    setSelectedCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const toggleSegment = (s: string) =>
    setSelectedSegments(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const runSelection = async () => {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/bulk-lists/${list.id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_shma_score: minScore > 0 ? minScore : undefined,
          min_opportunity_score: minOppScore > 0 ? minOppScore : undefined,
          countries: selectedCountries.length > 0 ? selectedCountries : undefined,
          segments: selectedSegments.length > 0 ? selectedSegments : undefined,
          max_companies: maxCompanies > 0 ? maxCompanies : undefined,
          exclude_sensitive: excludeSensitive,
          exclude_do_not_contact: excludeDNC,
          exclude_not_interesting: excludeNotInteresting,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Selection failed')
      } else {
        setResult(data)
      }
    } finally { setRunning(false) }
  }

  if (result) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Selection complete</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ready for Deep Research</span>
              <span className="font-bold text-slate-200">{result.qualifying_count} companies</span>
            </div>
            {result.pending_count > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Moved to Pending</span>
                <span className="text-slate-400">{result.pending_count} companies</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => router.push(`/bulk-lists/${result.deep_research_list.id}`)}>
            <ArrowRight className="w-3.5 h-3.5" /> Open Deep Research list
          </Button>
          <Button variant="ghost" onClick={() => router.push('/bulk-lists')}>
            Back to all lists
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Context */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-1 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>Total companies in list</span>
          <span className="text-slate-300 font-medium">{totalCompanies.toLocaleString()}</span>
        </div>
        {avgScore && (
          <div className="flex justify-between">
            <span>Average SHMA score</span>
            <span className="text-slate-300">{avgScore}</span>
          </div>
        )}
        {p75Score && (
          <div className="flex justify-between">
            <span>Top 25% threshold (suggested minimum)</span>
            <span className="text-cyan-400 font-medium">{Math.round(p75Score)}</span>
          </div>
        )}
      </div>

      {/* Score thresholds */}
      <div className="space-y-4">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Score thresholds</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Minimum SHMA score (0 = no filter)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} step={5} value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="flex-1 accent-cyan-500" />
              <span className={cn('text-sm font-bold w-8 text-right',
                minScore >= 80 ? 'text-emerald-400' : minScore >= 60 ? 'text-amber-400' : 'text-slate-400'
              )}>{minScore || '—'}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Min opportunity score (0 = no filter)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} step={5} value={minOppScore}
                onChange={e => setMinOppScore(Number(e.target.value))}
                className="flex-1 accent-cyan-500" />
              <span className="text-sm font-bold w-8 text-right text-slate-400">{minOppScore || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Countries */}
      {countries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Country filter (leave empty for all)</h3>
          <div className="flex flex-wrap gap-1.5">
            {countries.map(c => (
              <button key={c} onClick={() => toggleCountry(c)}
                className={cn('px-2.5 py-1 rounded-lg border text-xs transition-colors',
                  selectedCountries.includes(c)
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                )}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Segments */}
      {segments.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Segment filter (leave empty for all)</h3>
          <div className="flex flex-wrap gap-1.5">
            {segments.map(s => (
              <button key={s} onClick={() => toggleSegment(s)}
                className={cn('px-2.5 py-1 rounded-lg border text-xs transition-colors',
                  selectedSegments.includes(s)
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                )}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Max companies */}
      <div>
        <label className="text-xs text-slate-500 block mb-1">
          Maximum companies to take forward (0 = no limit)
        </label>
        <input
          type="number" min={0} max={5000} step={25}
          value={maxCompanies}
          onChange={e => setMaxCompanies(Number(e.target.value))}
          className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 w-32 focus:outline-none focus:border-cyan-500"
        />
        <p className="text-xs text-slate-700 mt-1">Deep Research runs best on 50–300 companies. Larger batches cost more and take longer.</p>
      </div>

      {/* Exclusions */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Exclusions</h3>
        {[
          { label: 'Exclude Sensitive companies', checked: excludeSensitive, set: setExcludeSensitive },
          { label: 'Exclude Do-not-contact companies', checked: excludeDNC, set: setExcludeDNC },
          { label: 'Exclude Not Interesting companies', checked: excludeNotInteresting, set: setExcludeNotInteresting },
        ].map(opt => (
          <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={opt.checked} onChange={e => opt.set(e.target.checked)}
              className="w-3.5 h-3.5 accent-cyan-500" />
            <span className="text-xs text-slate-400">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-slate-500 block mb-1">Selection notes (optional)</label>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Focus on Nordic PE-backed companies with strong service margin"
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded p-3">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={runSelection} loading={running}>
          <Filter className="w-3.5 h-3.5" /> Run selection
        </Button>
        <span className="text-xs text-slate-600">Creates a "Ready for Deep Research" sub-list + a "Pending" list for the rest</span>
      </div>
    </div>
  )
}
