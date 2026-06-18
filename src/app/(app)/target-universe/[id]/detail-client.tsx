'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ChevronLeft, Plus, ArrowRight, CheckCircle2, Globe2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const FUNNEL_STEPS = [
  { key: 'In Target Universe',          label: 'Target Universe',          color: 'bg-slate-700',   textColor: 'text-slate-300',   border: 'border-slate-600' },
  { key: 'Long List / Screened Target', label: 'Long List',                color: 'bg-blue-900/40', textColor: 'text-blue-300',    border: 'border-blue-700/50' },
  { key: 'AI Qualified Target',         label: 'AI Qualified',             color: 'bg-violet-900/40', textColor: 'text-violet-300', border: 'border-violet-700/50' },
  { key: 'Validated Target',            label: 'Validated',                color: 'bg-cyan-900/40', textColor: 'text-cyan-300',    border: 'border-cyan-700/50' },
  { key: 'Qualified Target',            label: 'Qualified',                color: 'bg-emerald-900/40', textColor: 'text-emerald-300', border: 'border-emerald-700/50' },
]

const VALIDATION_STATUSES = ['Not reviewed', 'Validated', 'Rejected', 'Needs more data']
const ALL_STAGES = [
  'In Target Universe', 'Long List / Screened Target', 'AI Qualified Target',
  'Validated Target', 'Qualified Target', 'Converted to Pipeline',
  'Screened Out', 'Disqualified',
]

interface Universe {
  id: string; name: string; description: string | null; scope_definition: string | null
  estimated_total_count: number | null; actual_total_count: number | null; status: string
  geography: string[] | null; industries: string[] | null; data_source_type: string
}

interface TUCompany {
  id: string; company_name: string; website: string | null; country: string | null
  region: string | null; industry: string | null; segment: string | null
  revenue: string | null; employees: string | null; ownership_type: string | null
  universe_status: string; objective_screening_score: number | null
  ai_qualification_score: number | null; human_validation_status: string
  screening_reason: string | null; exclusion_reason: string | null
}

export function TargetUniverseDetailClient({ universe, companies: initial }: {
  universe: Universe
  companies: TUCompany[]
}) {
  const [companies, setCompanies] = useState(initial)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({
    company_name: '', website: '', country: '', industry: '',
    segment: '', revenue: '', employees: '', ownership_type: '',
  })

  const countForStage = (key: string) => companies.filter(c => c.universe_status === key).length
  const totalUniverse = universe.actual_total_count || universe.estimated_total_count || countForStage('In Target Universe')

  const filteredCompanies = activeStage
    ? companies.filter(c => c.universe_status === activeStage)
    : companies.filter(c => FUNNEL_STEPS.map(s => s.key).includes(c.universe_status))

  const handleAddCompany = async () => {
    if (!addForm.company_name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/target-universe/${universe.id}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (res.ok) {
        setCompanies(prev => [data.company, ...prev])
        setShowAdd(false)
        setAddForm({ company_name: '', website: '', country: '', industry: '', segment: '', revenue: '', employees: '', ownership_type: '' })
      }
    } finally {
      setSaving(false)
    }
  }

  const moveStage = async (companyId: string, newStatus: string) => {
    const res = await fetch(`/api/target-universe/${universe.id}/companies`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, universe_status: newStatus }),
    })
    if (res.ok) {
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, universe_status: newStatus } : c))
    }
  }

  const nextStage = (current: string) => {
    const idx = FUNNEL_STEPS.findIndex(s => s.key === current)
    return idx >= 0 && idx < FUNNEL_STEPS.length - 1 ? FUNNEL_STEPS[idx + 1].key : null
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <Link href="/target-universe" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Target Universe
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">{universe.name}</h1>
            {universe.scope_definition && (
              <p className="text-xs text-slate-500 mt-1">{universe.scope_definition}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button size="sm" variant="primary" onClick={() => setShowAdd(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Company
            </Button>
          </div>
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex-shrink-0">
        <div className="flex items-stretch gap-1 max-w-4xl">
          {FUNNEL_STEPS.map((step, i) => {
            const count = i === 0 ? totalUniverse : countForStage(step.key)
            const prevCount = i === 0 ? totalUniverse : (i === 1 ? totalUniverse : countForStage(FUNNEL_STEPS[i - 1].key))
            const pct = prevCount > 0 && i > 0 ? Math.round((count / prevCount) * 100) : null
            const isActive = activeStage === step.key
            return (
              <button
                key={step.key}
                onClick={() => setActiveStage(isActive ? null : step.key)}
                className={cn(
                  'flex-1 rounded-lg border p-3 text-left transition-all',
                  step.color, step.border,
                  isActive ? 'ring-2 ring-cyan-500/50' : 'hover:border-opacity-80'
                )}
              >
                <div className={cn('text-2xl font-bold', step.textColor)}>
                  {count?.toLocaleString() ?? '—'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-medium">{step.label}</div>
                {pct !== null && (
                  <div className="text-xs text-slate-600 mt-1">{pct}% of prev</div>
                )}
              </button>
            )
          })}
          <div className="flex items-center">
            <ArrowRight className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex-1 rounded-lg border border-amber-700/30 bg-amber-900/20 p-3">
            <div className="text-2xl font-bold text-amber-400">
              {companies.filter(c => c.universe_status === 'Converted to Pipeline').length}
            </div>
            <div className="text-xs text-amber-300/70 mt-0.5 font-medium">In Pipeline</div>
          </div>
        </div>
        {activeStage && (
          <div className="mt-2 text-xs text-slate-500">
            Showing <span className="text-cyan-400">{activeStage}</span> —{' '}
            <button className="underline hover:text-slate-300" onClick={() => setActiveStage(null)}>show all</button>
          </div>
        )}
      </div>

      {/* Company table */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <Globe2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No companies in this stage</p>
            <Button size="sm" variant="ghost" className="mt-3" onClick={() => setShowAdd(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Company
            </Button>
          </div>
        ) : (
          <div className="max-w-6xl">
            <div className="text-xs text-slate-500 mb-3">
              {filteredCompanies.length} {activeStage ? `in ${activeStage}` : 'active companies'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Company', 'Country', 'Industry', 'Segment', 'Revenue', 'Employees', 'Stage', 'Obj. Score', 'AI Score', 'Validation', 'Actions'].map(h => (
                      <th key={h} className="text-left text-slate-500 font-medium py-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredCompanies.map(c => {
                    const next = nextStage(c.universe_status)
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-200">{c.company_name}</div>
                          {c.website && <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-cyan-400 transition-colors">{c.website.replace(/^https?:\/\//, '')}</a>}
                        </td>
                        <td className="py-2 pr-4 text-slate-400">{c.country || '—'}</td>
                        <td className="py-2 pr-4 text-slate-400">{c.industry || '—'}</td>
                        <td className="py-2 pr-4 text-slate-400">{c.segment || '—'}</td>
                        <td className="py-2 pr-4 text-slate-400">{c.revenue || '—'}</td>
                        <td className="py-2 pr-4 text-slate-400">{c.employees || '—'}</td>
                        <td className="py-2 pr-4">
                          <select
                            value={c.universe_status}
                            onChange={e => moveStage(c.id, e.target.value)}
                            className="bg-transparent border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                          >
                            {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-4 text-slate-400">{c.objective_screening_score ?? '—'}</td>
                        <td className="py-2 pr-4 text-slate-400">{c.ai_qualification_score ?? '—'}</td>
                        <td className="py-2 pr-4">
                          <select
                            value={c.human_validation_status}
                            onChange={async e => {
                              await fetch(`/api/target-universe/${universe.id}/companies`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ companyId: c.id, human_validation_status: e.target.value }),
                              })
                              setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, human_validation_status: e.target.value } : x))
                            }}
                            className="bg-transparent border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                          >
                            {VALIDATION_STATUSES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="py-2">
                          {next && (
                            <button
                              onClick={() => moveStage(c.id, next)}
                              className="flex items-center gap-1 text-cyan-500 hover:text-cyan-300 transition-colors whitespace-nowrap"
                              title={`Move to ${next}`}
                            >
                              <ArrowRight className="w-3 h-3" /> Advance
                            </button>
                          )}
                          {c.universe_status === 'Qualified Target' && (
                            <button
                              onClick={() => moveStage(c.id, 'Converted to Pipeline')}
                              className="flex items-center gap-1 text-emerald-500 hover:text-emerald-300 transition-colors whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Convert
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add company modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Company to Target Universe" size="md">
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company name *" value={addForm.company_name} onChange={e => setAddForm(f => ({ ...f, company_name: e.target.value }))} />
            <Input label="Website" value={addForm.website} onChange={e => setAddForm(f => ({ ...f, website: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Country" value={addForm.country} onChange={e => setAddForm(f => ({ ...f, country: e.target.value }))} />
            <Input label="Industry" value={addForm.industry} onChange={e => setAddForm(f => ({ ...f, industry: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Segment" value={addForm.segment} onChange={e => setAddForm(f => ({ ...f, segment: e.target.value }))} />
            <Input label="Revenue" value={addForm.revenue} onChange={e => setAddForm(f => ({ ...f, revenue: e.target.value }))} />
            <Input label="Employees" value={addForm.employees} onChange={e => setAddForm(f => ({ ...f, employees: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="primary" className="flex-1" loading={saving} onClick={handleAddCompany} disabled={!addForm.company_name.trim()}>
              <Plus className="w-3.5 h-3.5" /> Add Company
            </Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
