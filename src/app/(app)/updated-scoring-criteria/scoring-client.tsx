'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, Star, ChevronDown, ChevronRight, Plus, CheckCircle2, Lock, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CriteriaVersion {
  id: string
  version_name: string
  status: string
  notes: string | null
  approved_by_simon: boolean
  approved_by_stian: boolean
  approved_by_christian: boolean
  simon_notes: string | null
  stian_notes: string | null
  christian_notes: string | null
  locked_at: string | null
  created_at: string
}

const VERSION_STATUS_CFG: Record<string, { color: string; icon: React.ElementType }> = {
  Draft: { color: 'text-slate-400', icon: Clock },
  'Under Review': { color: 'text-amber-400', icon: Clock },
  Approved: { color: 'text-emerald-400', icon: CheckCircle2 },
  Locked: { color: 'text-cyan-400', icon: Lock },
  Superseded: { color: 'text-slate-600', icon: ChevronRight },
}

function ScoringVersionWorkflow({ versions: initialVersions }: { versions: CriteriaVersion[] }) {
  const [versions, setVersions] = useState(initialVersions)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(versions[0]?.id || null)

  const createVersion = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/scoring-criteria/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_name: newName, notes: newNotes }),
      })
      if (res.ok) {
        const v = await res.json()
        setVersions(vs => [v, ...vs])
        setCreating(false)
        setNewName('')
        setNewNotes('')
        setExpanded(v.id)
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleApproval = async (versionId: string, field: 'approved_by_simon' | 'approved_by_stian' | 'approved_by_christian', notes_field: 'simon_notes' | 'stian_notes' | 'christian_notes', currentVal: boolean, notes: string | null) => {
    const res = await fetch(`/api/scoring-criteria/versions/${versionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !currentVal, [notes_field]: notes }),
    })
    if (res.ok) {
      const updated = await res.json()
      setVersions(vs => vs.map(v => v.id === versionId ? { ...v, ...updated } : v))
    }
  }

  const updateStatus = async (versionId: string, status: string) => {
    const res = await fetch(`/api/scoring-criteria/versions/${versionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setVersions(vs => vs.map(v => v.id === versionId ? { ...v, ...updated } : v))
    }
  }

  const activeVersion = versions.find(v => v.status === 'Locked') || versions.find(v => v.status === 'Approved')

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Scoring Criteria Versions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Criteria must be reviewed by Simon, Stian and Christian before locking for production use.</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setCreating(true)}>
          <Plus className="w-3.5 h-3.5" /> New Version
        </Button>
      </div>

      {activeVersion && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-300 font-medium">Active: {activeVersion.version_name}</span>
          <span className="text-slate-500">· {activeVersion.status}</span>
        </div>
      )}

      {creating && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-medium text-slate-400">New criteria version</h3>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Version name, e.g. v1.0 — June 2026"
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
          <textarea
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            placeholder="Notes about what changed or what to review…"
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={createVersion} loading={saving} disabled={!newName.trim()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {versions.map(v => {
          const cfg = VERSION_STATUS_CFG[v.status] || VERSION_STATUS_CFG.Draft
          const Icon = cfg.icon
          const allApproved = v.approved_by_simon && v.approved_by_stian && v.approved_by_christian
          const isExpanded = expanded === v.id

          return (
            <div key={v.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : v.id)}
              >
                <Icon className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
                <span className="text-sm font-medium text-slate-200 flex-1">{v.version_name}</span>
                <span className={`text-xs ${cfg.color}`}>{v.status}</span>
                {allApproved && <span className="text-xs text-emerald-400">All approved ✓</span>}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
                  {v.notes && <p className="text-xs text-slate-500 mt-3">{v.notes}</p>}

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {([
                      { name: 'Simon', field: 'approved_by_simon' as const, notes_field: 'simon_notes' as const, approved: v.approved_by_simon, notes: v.simon_notes },
                      { name: 'Stian', field: 'approved_by_stian' as const, notes_field: 'stian_notes' as const, approved: v.approved_by_stian, notes: v.stian_notes },
                      { name: 'Christian', field: 'approved_by_christian' as const, notes_field: 'christian_notes' as const, approved: v.approved_by_christian, notes: v.christian_notes },
                    ] as const).map(p => (
                      <div key={p.name} className={`rounded-lg p-3 border ${p.approved ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900 border-slate-700'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-300">{p.name}</span>
                          <button
                            onClick={() => toggleApproval(v.id, p.field, p.notes_field, p.approved, p.notes)}
                            className={`text-xs px-2 py-0.5 rounded border transition-colors ${p.approved ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-slate-600 text-slate-500 hover:border-slate-500'}`}
                          >
                            {p.approved ? '✓ Approved' : 'Mark approved'}
                          </button>
                        </div>
                        {p.notes && <p className="text-xs text-slate-600 italic">{p.notes}</p>}
                      </div>
                    ))}
                  </div>

                  {v.status !== 'Locked' && (
                    <div className="flex gap-2 pt-1">
                      {v.status === 'Draft' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(v.id, 'Under Review')}>Send for Review</Button>
                      )}
                      {allApproved && v.status !== 'Approved' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(v.id, 'Approved')}>Mark Approved</Button>
                      )}
                      {v.status === 'Approved' && (
                        <Button size="sm" variant="primary" onClick={() => updateStatus(v.id, 'Locked')}>
                          <Lock className="w-3 h-3" /> Lock for Production
                        </Button>
                      )}
                    </div>
                  )}
                  {v.status === 'Locked' && (
                    <p className="text-xs text-cyan-400">🔒 Locked {v.locked_at ? new Date(v.locked_at).toLocaleDateString() : ''} — criteria frozen for production use.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {versions.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-4">No versions yet. Create one to start the review process.</p>
        )}
      </div>
    </div>
  )
}

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

export function ScoringCriteriaClient({ criteria: initial, thresholds: initialThresholds, versions }: {
  criteria: Criterion[]
  thresholds: Threshold[]
  versions: CriteriaVersion[]
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
      <ScoringVersionWorkflow versions={versions} />

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
