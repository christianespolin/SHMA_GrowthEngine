'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, Star, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const GROUP_META: Record<string, { label: string; description: string; color: string }> = {
  shma_fit:    { label: 'SHMA Fit Score',         color: 'text-cyan-400',    description: 'Measures whether the company matches SHMA\'s core sweet spot for servitization.' },
  opportunity: { label: 'Opportunity Score',      color: 'text-violet-400',  description: 'Measures whether the commercial opportunity is attractive and actionable.' },
  funding:     { label: 'Funding Readiness Score', color: 'text-amber-400',  description: 'Measures whether the case can likely support financing or external funding.' },
  contact:     { label: 'Contact Coverage Score', color: 'text-blue-400',    description: 'Measures whether SHMA can realistically reach the right decision makers.' },
  closing:     { label: 'Closing Score',          color: 'text-emerald-400', description: 'Measures practical probability of moving from target to signed engagement.' },
}

interface Criterion {
  id: string; score_group: string; criterion_key: string; label: string
  description: string | null; weight: number; active: boolean; sort_order: number
}

interface Threshold {
  id: string; score_name: string; a_priority_min: number; b_priority_min: number
  c_priority_min: number; disqualified_below: number
}

export function ScoringCriteriaClient({ criteria: initial, thresholds: initialThresholds }: {
  criteria: Criterion[]
  thresholds: Threshold[]
}) {
  const [criteria, setCriteria] = useState(initial)
  const [thresholds, setThresholds] = useState(initialThresholds)
  const [savingCriterion, setSavingCriterion] = useState<string | null>(null)
  const [savingThreshold, setSavingThreshold] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(GROUP_META)))

  const groups = [...new Set(criteria.map(c => c.score_group))]

  const updateCriterion = (id: string, field: keyof Criterion, value: unknown) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const saveCriterion = async (c: Criterion) => {
    setSavingCriterion(c.id)
    try {
      await fetch(`/api/scoring-criteria/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: c.label, description: c.description, weight: c.weight, active: c.active, sort_order: c.sort_order }),
      })
    } finally {
      setSavingCriterion(null)
    }
  }

  const saveThreshold = async (t: Threshold) => {
    setSavingThreshold(t.id)
    try {
      await fetch(`/api/scoring-criteria/thresholds/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a_priority_min: t.a_priority_min, b_priority_min: t.b_priority_min, c_priority_min: t.c_priority_min, disqualified_below: t.disqualified_below }),
      })
    } finally {
      setSavingThreshold(null)
    }
  }

  const toggleGroup = (g: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(g) ? next.delete(g) : next.add(g)
      return next
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Star className="w-5 h-5 text-cyan-400" />
        <div>
          <h1 className="text-lg font-semibold text-slate-100">SHMA Scoring Criteria</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure how companies are scored and prioritized</p>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">What is the SHMA Score?</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          SHMA Score measures how attractive a company is as a potential SHMA servitization client.
          A high score means the company likely sells asset-heavy or complex B2B solutions where customers
          face high upfront investment, service/support needs, financing friction or operational complexity —
          and where SHMA can help convert the model into scalable As-a-Service, managed service, subscription,
          pay-per-use or outcome-based growth.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {groups.map(g => {
            const meta = GROUP_META[g]
            if (!meta) return null
            return (
              <div key={g} className="text-center">
                <div className={cn('text-xs font-semibold', meta.color)}>{meta.label.split(' ')[0]}</div>
                <div className="text-xs text-slate-600 mt-0.5">{meta.label.split(' ').slice(1).join(' ')}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Score groups */}
      {groups.map(g => {
        const meta = GROUP_META[g] || { label: g, color: 'text-slate-400', description: '' }
        const groupCriteria = criteria.filter(c => c.score_group === g).sort((a, b) => a.sort_order - b.sort_order)
        const isExpanded = expandedGroups.has(g)

        return (
          <div key={g} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors"
              onClick={() => toggleGroup(g)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                <span className={cn('text-sm font-semibold', meta.color)}>{meta.label}</span>
                <Badge variant="default">{groupCriteria.filter(c => c.active).length} active</Badge>
              </div>
              <span className="text-xs text-slate-600">{groupCriteria.length} criteria</span>
            </button>
            {isExpanded && (
              <div className="px-5 pb-5 space-y-3">
                <p className="text-xs text-slate-500 pb-1 border-b border-slate-800">{meta.description}</p>
                {groupCriteria.map(c => (
                  <div key={c.id} className={cn('bg-slate-800 border rounded-lg p-3 space-y-2', c.active ? 'border-slate-700' : 'border-slate-800 opacity-50')}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCriterion(c.id, 'active', !c.active)}
                          className={cn('text-xs px-2 py-0.5 rounded border transition-colors', c.active ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-slate-700 text-slate-600')}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </button>
                        <span className="text-xs text-slate-600 font-mono">{c.criterion_key}</span>
                      </div>
                      <Button size="sm" variant="ghost" loading={savingCriterion === c.id} onClick={() => saveCriterion(c)}>
                        <Save className="w-3 h-3" /> Save
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input label="Label" value={c.label} onChange={e => updateCriterion(c.id, 'label', e.target.value)} />
                      </div>
                      <Input label="Weight" type="number" step="0.1" value={String(c.weight)} onChange={e => updateCriterion(c.id, 'weight', parseFloat(e.target.value) || 1)} />
                    </div>
                    <Input label="Description" value={c.description || ''} onChange={e => updateCriterion(c.id, 'description', e.target.value || null)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Thresholds */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Priority Thresholds</h2>
        <p className="text-xs text-slate-500">Define the minimum score required for each priority tier. Scores are out of 5.0.</p>
        <div className="space-y-3">
          {thresholds.sort((a, b) => a.score_name.localeCompare(b.score_name)).map(t => (
            <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300 capitalize">{t.score_name}</span>
                  <span className="text-xs text-slate-600">score</span>
                </div>
                <Button size="sm" variant="ghost" loading={savingThreshold === t.id} onClick={() => saveThreshold(t)}>
                  <Save className="w-3 h-3" /> Save
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { field: 'a_priority_min' as const, label: 'A Priority min', color: 'text-emerald-400' },
                  { field: 'b_priority_min' as const, label: 'B Priority min', color: 'text-cyan-400' },
                  { field: 'c_priority_min' as const, label: 'C Priority min', color: 'text-amber-400' },
                  { field: 'disqualified_below' as const, label: 'Disqualify below', color: 'text-rose-400' },
                ].map(({ field, label, color }) => (
                  <div key={field}>
                    <label className={cn('block text-xs font-medium mb-1', color)}>{label}</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={t[field]}
                      onChange={e => setThresholds(prev => prev.map(x => x.id === t.id ? { ...x, [field]: parseFloat(e.target.value) || 0 } : x))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
