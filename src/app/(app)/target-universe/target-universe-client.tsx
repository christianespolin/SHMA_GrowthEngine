'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { formatDateRelative } from '@/lib/utils'
import { Globe2, Plus, ChevronRight, Users, Target, Layers, CheckCircle2 } from 'lucide-react'

const STATUS_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  Draft: 'default', Active: 'info', Screening: 'warning', Completed: 'success', Archived: 'default',
}

const FUNNEL_STAGES = [
  { key: 'In Target Universe',          label: 'Target Universe',          color: 'text-slate-400' },
  { key: 'Long List / Screened Target', label: 'Long List',                color: 'text-blue-400' },
  { key: 'AI Qualified Target',         label: 'AI Qualified',             color: 'text-violet-400' },
  { key: 'Validated Target',            label: 'Validated',                color: 'text-cyan-400' },
  { key: 'Qualified Target',            label: 'Qualified',                color: 'text-emerald-400' },
]

const DATA_SOURCE_TYPES = ['Manual', 'CSV/XLS upload', 'External data provider', 'Company registry', 'AI estimated', 'Mixed']
const STATUSES = ['Draft', 'Active', 'Screening', 'Completed', 'Archived']

interface Universe {
  id: string
  name: string
  description: string | null
  scope_definition: string | null
  geography: string[] | null
  industries: string[] | null
  segments: string[] | null
  estimated_total_count: number | null
  actual_total_count: number | null
  data_source_type: string
  status: string
  created_at: string
  updated_at: string
  created_by_profile: { full_name: string | null; email: string | null } | null
}

interface StageCount { target_universe_id: string; universe_status: string }

export function TargetUniverseClient({ universes: initial, stageCounts }: {
  universes: Universe[]
  stageCounts: StageCount[]
}) {
  const [universes, setUniverses] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', scope_definition: '',
    estimated_total_count: '', data_source_type: 'Manual', status: 'Draft',
    industries: '', geography: '',
  })

  const countsByUniverse = (id: string) => {
    const rows = stageCounts.filter(s => s.target_universe_id === id)
    const counts: Record<string, number> = {}
    FUNNEL_STAGES.forEach(s => {
      counts[s.key] = rows.filter(r => r.universe_status === s.key).length
    })
    return counts
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/target-universe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          scope_definition: form.scope_definition || null,
          estimated_total_count: form.estimated_total_count ? parseInt(form.estimated_total_count) : null,
          data_source_type: form.data_source_type,
          status: form.status,
          industries: form.industries ? form.industries.split(',').map(s => s.trim()).filter(Boolean) : null,
          geography: form.geography ? form.geography.split(',').map(s => s.trim()).filter(Boolean) : null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setUniverses(prev => [data.universe, ...prev])
        setShowCreate(false)
        setForm({ name: '', description: '', scope_definition: '', estimated_total_count: '', data_source_type: 'Manual', status: 'Draft', industries: '', geography: '' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Globe2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Target Universe</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Define your total addressable market before active sales begins
            </p>
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> New Target Universe
        </Button>
      </div>

      {/* Funnel legend */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-600 mr-1">Funnel:</span>
          {FUNNEL_STAGES.map((s, i) => (
            <span key={s.key} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-700" />}
              <span className={s.color}>{s.label}</span>
            </span>
          ))}
          <ChevronRight className="w-3 h-3 text-slate-700" />
          <span className="text-amber-400">Active Sales</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {universes.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <Globe2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-slate-500">No target universes yet</p>
            <p className="text-xs mt-1">Define your total addressable market to start qualifying targets</p>
            <Button size="sm" variant="primary" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5" /> Create first Target Universe
            </Button>
          </div>
        )}

        <div className="space-y-3 max-w-5xl">
          {universes.map(u => {
            const counts = countsByUniverse(u.id)
            const totalUniverse = u.actual_total_count || u.estimated_total_count || counts['In Target Universe'] || 0
            return (
              <Link
                key={u.id}
                href={`/target-universe/${u.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">{u.name}</h3>
                      <Badge variant={STATUS_COLORS[u.status] || 'default'}>{u.status}</Badge>
                    </div>
                    {u.scope_definition && (
                      <p className="text-xs text-slate-500 mt-1">{u.scope_definition}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-600">
                      {u.geography?.length ? (
                        <span>{u.geography.join(', ')}</span>
                      ) : null}
                      {u.industries?.length ? (
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{u.industries.join(', ')}</span>
                      ) : null}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{u.data_source_type}</span>
                      {u.updated_at && <span>Updated {formatDateRelative(u.updated_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>

                {/* Funnel bar */}
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {FUNNEL_STAGES.map((s, i) => {
                    const count = i === 0 ? totalUniverse : counts[s.key]
                    return (
                      <div key={s.key} className="text-center">
                        <div className="text-lg font-bold text-slate-100">{count?.toLocaleString() || '—'}</div>
                        <div className={`text-xs mt-0.5 ${s.color}`}>{s.label}</div>
                      </div>
                    )
                  })}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Target Universe" size="md">
        <div className="p-5 space-y-4">
          <Input label="Name *" placeholder="e.g. Nordic Warehouse Automation & Robotics" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" placeholder="Brief description of this target universe" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <Textarea label="Scope definition" placeholder="Define the scope, boundaries and focus of this universe" value={form.scope_definition} onChange={e => setForm(f => ({ ...f, scope_definition: e.target.value }))} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Estimated total count" type="number" placeholder="50000" value={form.estimated_total_count} onChange={e => setForm(f => ({ ...f, estimated_total_count: e.target.value }))} />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Data source type</label>
              <select value={form.data_source_type} onChange={e => setForm(f => ({ ...f, data_source_type: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                {DATA_SOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Geography (comma-separated)" placeholder="Norway, Sweden, Denmark" value={form.geography} onChange={e => setForm(f => ({ ...f, geography: e.target.value }))} />
            <Input label="Industries (comma-separated)" placeholder="Warehouse Automation, Robotics" value={form.industries} onChange={e => setForm(f => ({ ...f, industries: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="primary" className="flex-1" loading={saving} onClick={handleCreate} disabled={!form.name.trim()}>
              <Target className="w-3.5 h-3.5" /> Create Target Universe
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
