'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn, formatDateRelative } from '@/lib/utils'
import { BULK_LIST_CATEGORIES, type BulkListCategory } from '@/lib/types'
import {
  List, Plus, ChevronRight, Sparkles, Users, CheckSquare,
  AlertTriangle, Clock, BarChart2, Upload, ArrowRight,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

const CATEGORY_CFG: Record<BulkListCategory, {
  color: string
  badge: string
  dot: string
  nextAction: string
  icon: React.ElementType
}> = {
  'Longlist': {
    color: 'border-slate-700',
    badge: 'bg-slate-700 text-slate-300 border-slate-600',
    dot: 'bg-slate-500',
    nextAction: 'Run AI Scoring',
    icon: List,
  },
  'AI Researched': {
    color: 'border-cyan-500/30',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    dot: 'bg-cyan-500',
    nextAction: 'Select for Deep Research',
    icon: Sparkles,
  },
  'AI Researched, Pending': {
    color: 'border-slate-700',
    badge: 'bg-slate-700/50 text-slate-400 border-slate-700',
    dot: 'bg-slate-600',
    nextAction: 'Re-evaluate when ready',
    icon: Clock,
  },
  'AI Researched, Not Interesting': {
    color: 'border-slate-800',
    badge: 'bg-slate-800 text-slate-600 border-slate-700',
    dot: 'bg-slate-700',
    nextAction: 'Archive or review criteria',
    icon: BarChart2,
  },
  'Ready for AI Deep Research': {
    color: 'border-blue-500/30',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500',
    nextAction: 'Run Deep Research',
    icon: Sparkles,
  },
  'Ready for Human Review': {
    color: 'border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
    nextAction: 'Open Human Review',
    icon: CheckSquare,
  },
  'Ready for Contact Research': {
    color: 'border-purple-500/30',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-500',
    nextAction: 'Run Contact Research',
    icon: Users,
  },
  'Converted to Customer Kanban': {
    color: 'border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
    nextAction: 'View in Kanban',
    icon: ArrowRight,
  },
  'Archived': {
    color: 'border-slate-800',
    badge: 'bg-slate-800 text-slate-700 border-slate-700',
    dot: 'bg-slate-800',
    nextAction: '',
    icon: List,
  },
}

const STATUS_PIPELINE: BulkListCategory[] = [
  'Longlist',
  'AI Researched',
  'AI Researched, Pending',
  'Ready for AI Deep Research',
  'Ready for Human Review',
  'Ready for Contact Research',
  'Converted to Customer Kanban',
]

export function BulkListsClient({ lists, activeRuns }: { lists: AnyRecord[]; activeRuns: AnyRecord[] }) {
  const router = useRouter()
  const [filterCategory, setFilterCategory] = useState<BulkListCategory | 'All'>('All')
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = filterCategory === 'All'
    ? lists.filter(l => l.category !== 'AI Researched, Not Interesting')
    : lists.filter(l => l.category === filterCategory)

  const byCategory = STATUS_PIPELINE.reduce<Record<string, AnyRecord[]>>((acc, cat) => {
    acc[cat] = lists.filter(l => l.category === cat)
    return acc
  }, {})

  const createList = async () => {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/bulk-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName, description: createDesc, category: 'Longlist', source_type: 'Manual' }),
      })
      if (res.ok) {
        const data = await res.json()
        setShowCreate(false)
        setCreateName('')
        setCreateDesc('')
        router.push(`/bulk-lists/${data.id}`)
        router.refresh()
      }
    } finally { setCreating(false) }
  }

  const activeRunByList = activeRuns.reduce<Record<string, AnyRecord>>((acc, r) => {
    if (r.bulk_list_id) acc[r.bulk_list_id] = r
    return acc
  }, {})

  return (
    <div className="max-w-5xl space-y-6">
      {/* Pipeline progress strip */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Pipeline stages</div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_PIPELINE.filter(c => c !== 'AI Researched, Pending').map((cat, i, arr) => {
            const cfg = CATEGORY_CFG[cat]
            const count = byCategory[cat]?.length || 0
            return (
              <div key={cat} className="flex items-center gap-1">
                <button
                  onClick={() => setFilterCategory(cat === filterCategory ? 'All' : cat)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors',
                    filterCategory === cat ? cfg.badge : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                  {cat}
                  {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                </button>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-slate-400">{filtered.length} list{filtered.length !== 1 ? 's' : ''}</span>
          {filterCategory !== 'All' && (
            <button onClick={() => setFilterCategory('All')} className="ml-2 text-xs text-slate-600 hover:text-slate-400">
              Clear filter ×
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => router.push('/long-list/import')}>
            <Upload className="w-3.5 h-3.5" /> Import Longlist
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5" /> New List
          </Button>
        </div>
      </div>

      {/* List cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <List className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No lists yet in this category.</p>
          <p className="text-xs mt-1">Import a Longlist from Excel/CSV or create one manually.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(list => (
            <ListCard
              key={list.id}
              list={list}
              activeRun={activeRunByList[list.id]}
              onClick={() => router.push(`/bulk-lists/${list.id}`)}
            />
          ))}
        </div>
      )}

      {/* Not Interesting section — collapsed */}
      {lists.filter(l => l.category === 'AI Researched, Not Interesting').length > 0 && (
        <details className="group">
          <summary className="text-xs text-slate-700 cursor-pointer hover:text-slate-500 flex items-center gap-1.5">
            <span>{lists.filter(l => l.category === 'AI Researched, Not Interesting').length} archived / not interesting list(s)</span>
          </summary>
          <div className="mt-2 space-y-2 pl-3 border-l border-slate-800">
            {lists.filter(l => l.category === 'AI Researched, Not Interesting').map(list => (
              <ListCard key={list.id} list={list} onClick={() => router.push(`/bulk-lists/${list.id}`)} />
            ))}
          </div>
        </details>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create new list" size="sm">
        <div className="p-5 space-y-4">
          <Input label="List name" placeholder="e.g. Nordic Warehouse Automation Longlist June 2026"
            value={createName} onChange={e => setCreateName(e.target.value)} />
          <Input label="Description (optional)" placeholder="Brief description"
            value={createDesc} onChange={e => setCreateDesc(e.target.value)} />
          <Button variant="primary" className="w-full" onClick={createList} loading={creating} disabled={!createName.trim()}>
            Create list
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ListCard({ list, activeRun, onClick }: { list: AnyRecord; activeRun?: AnyRecord; onClick: () => void }) {
  const cfg = CATEGORY_CFG[list.category as BulkListCategory] || CATEGORY_CFG['Longlist']
  const Icon = cfg.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-slate-800/50 border rounded-xl p-4 hover:border-slate-600 transition-all group',
        cfg.color,
        activeRun && 'border-cyan-500/40'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1', cfg.badge)}>
              <Icon className="w-3 h-3" />
              {list.category}
            </span>
            {activeRun && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400 border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {activeRun.process_type} running…
              </span>
            )}
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded border',
              list.status === 'Processing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              list.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              list.status === 'Failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
              'bg-slate-700/50 text-slate-500 border-slate-700'
            )}>
              {list.status}
            </span>
          </div>

          <h3 className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{list.name}</h3>
          {list.description && <p className="text-xs text-slate-600 mt-0.5 truncate">{list.description}</p>}

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
            <span className="font-medium text-slate-400">{list.company_count?.toLocaleString() || 0} companies</span>
            {list.processed_count > 0 && <span>{list.processed_count} processed</span>}
            {list.error_count > 0 && <span className="text-rose-500">{list.error_count} errors</span>}
            {list.duplicate_conflict_count > 0 && <span className="text-amber-500">{list.duplicate_conflict_count} duplicate conflicts</span>}
            {list.source_name && <span>from {list.source_name}</span>}
            <span>{formatDateRelative(list.created_at)}</span>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          {activeRun ? (
            <div className="text-xs text-cyan-400">
              {activeRun.processed_items}/{activeRun.total_items}
            </div>
          ) : (
            <div className="text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {cfg.nextAction} <ChevronRight className="w-3 h-3" />
            </div>
          )}
          {list.last_ai_process_type && !activeRun && (
            <div className="text-[10px] text-slate-700 mt-1">
              Last: {list.last_ai_process_type}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
