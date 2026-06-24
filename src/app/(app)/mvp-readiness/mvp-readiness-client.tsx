'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, AlertCircle, MinusCircle, Clock } from 'lucide-react'

interface ReadinessItem {
  id: string
  item_key: string
  label: string
  description: string | null
  category: string
  status: string
  owner_name: string | null
  due_date: string | null
  notes: string | null
  completed_at: string | null
  sort_order: number
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  'Not started': { icon: Circle, color: 'text-slate-600', label: 'Not started' },
  'In progress': { icon: Clock, color: 'text-amber-400', label: 'In progress' },
  'Blocked': { icon: AlertCircle, color: 'text-rose-400', label: 'Blocked' },
  'Done': { icon: CheckCircle2, color: 'text-emerald-400', label: 'Done' },
  'Not needed': { icon: MinusCircle, color: 'text-slate-700', label: 'Not needed' },
}

const CATEGORIES = ['Scoring', 'Import', 'Compliance', 'Contacts', 'Partners', 'Origination', 'Outreach', 'Data', 'Dashboard', 'Security', 'Testing', 'Scale', 'Launch', 'General']

export function MvpReadinessClient({ items: initialItems }: { items: ReadinessItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const done = items.filter(i => i.status === 'Done').length
  const inProgress = items.filter(i => i.status === 'In progress').length
  const blocked = items.filter(i => i.status === 'Blocked').length
  const total = items.filter(i => i.status !== 'Not needed').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {} as Record<string, ReadinessItem[]>)

  const updateItem = async (id: string, updates: Partial<ReadinessItem>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/mvp-readiness/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const updated = await res.json()
        setItems(its => its.map(i => i.id === id ? { ...i, ...updated } : i))
        if (updates.status) setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  const cycleStatus = (item: ReadinessItem) => {
    const statuses = ['Not started', 'In progress', 'Done']
    const idx = statuses.indexOf(item.status)
    const next = statuses[(idx + 1) % statuses.length]
    updateItem(item.id, { status: next })
  }

  return (
    <div className="flex-1 p-5 max-w-3xl">
      {/* Progress header */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-3xl font-bold text-slate-100">{pct}%</div>
            <div className="text-xs text-slate-500 mt-0.5">MVP readiness</div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-emerald-400 font-semibold">{done}</div>
              <div className="text-xs text-slate-600">Done</div>
            </div>
            <div className="text-center">
              <div className="text-amber-400 font-semibold">{inProgress}</div>
              <div className="text-xs text-slate-600">In progress</div>
            </div>
            {blocked > 0 && (
              <div className="text-center">
                <div className="text-rose-400 font-semibold">{blocked}</div>
                <div className="text-xs text-slate-600">Blocked</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-slate-400 font-semibold">{total - done - inProgress - blocked}</div>
              <div className="text-xs text-slate-600">Not started</div>
            </div>
          </div>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct >= 80 && (
          <p className="text-xs text-emerald-400 mt-2">
            {pct >= 100 ? '✓ Ready for production use' : `Almost ready — ${total - done} items remaining`}
          </p>
        )}
        {pct < 80 && (
          <p className="text-xs text-amber-400 mt-2">
            Target: 100% complete before importing large lists or starting September outreach
          </p>
        )}
      </div>

      {/* Checklist by category */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category}>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{category}</h3>
            <div className="space-y-2">
              {catItems.map(item => {
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['Not started']
                const Icon = cfg.icon
                const isEditing = editingId === item.id

                return (
                  <div key={item.id} className={`bg-slate-800 border rounded-lg transition-colors ${
                    item.status === 'Done' ? 'border-emerald-500/20' :
                    item.status === 'Blocked' ? 'border-rose-500/20' :
                    item.status === 'In progress' ? 'border-amber-500/20' :
                    'border-slate-700'
                  }`}>
                    <div className="flex items-start gap-3 p-3.5">
                      <button onClick={() => cycleStatus(item)} className="mt-0.5 flex-shrink-0" title="Click to cycle status">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`text-sm font-medium ${item.status === 'Done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {item.label}
                            </span>
                            {item.description && (
                              <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                            )}
                            {item.notes && (
                              <p className="text-xs text-slate-500 mt-1 italic">{item.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <select
                              value={item.status}
                              onChange={e => updateItem(item.id, { status: e.target.value })}
                              className={`text-xs border rounded px-2 py-0.5 focus:outline-none focus:border-cyan-500 ${
                                item.status === 'Done' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                item.status === 'Blocked' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                                item.status === 'In progress' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                'bg-slate-900 border-slate-700 text-slate-500'
                              }`}
                            >
                              {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button
                              onClick={() => setEditingId(isEditing ? null : item.id)}
                              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                            >
                              {isEditing ? 'Close' : 'Note'}
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={item.notes || ''}
                              onChange={e => setItems(its => its.map(i => i.id === item.id ? { ...i, notes: e.target.value } : i))}
                              placeholder="Add notes, blockers or context…"
                              rows={2}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-cyan-500"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" variant="primary" onClick={() => updateItem(item.id, { notes: item.notes })} loading={saving}>
                                Save Note
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
