'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit3, Save, X, Users, Building2, TrendingUp, Star } from 'lucide-react'

interface OwnershipPerson {
  name: string
  role: string
  type: 'board' | 'shareholder' | 'investor' | 'owner'
  ownership_pct?: string
  source?: string
  confidence?: 'Known from source' | 'AI hypothesis' | 'Needs validation' | 'User-provided'
  notes?: string
}

const CONFIDENCE_COLORS: Record<string, string> = {
  'Known from source': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'User-provided': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  'AI hypothesis': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  'Needs validation': 'text-rose-400 border-rose-500/30 bg-rose-500/10',
}

const EMPTY_PERSON: OwnershipPerson = {
  name: '', role: '', type: 'board', source: '', confidence: 'User-provided', notes: '',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OwnershipTab({ company, onSave }: { company: Record<string, any>; onSave: (updates: Record<string, unknown>) => void }) {
  const [boardMembers, setBoardMembers] = useState<OwnershipPerson[]>(company.board_members_json || [])
  const [shareholders, setShareholders] = useState<OwnershipPerson[]>(company.shareholders_json || [])
  const [investors, setInvestors] = useState<OwnershipPerson[]>(company.investor_groups_json || [])
  const [portfolioNotes, setPortfolioNotes] = useState<string>(company.portfolio_notes || '')
  const [ownershipSource, setOwnershipSource] = useState<string>(company.ownership_source || '')
  const [adding, setAdding] = useState<'board' | 'shareholder' | 'investor' | null>(null)
  const [newPerson, setNewPerson] = useState<OwnershipPerson>(EMPTY_PERSON)
  const [saving, setSaving] = useState(false)
  const [editingIdx, setEditingIdx] = useState<{ type: string; idx: number } | null>(null)

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_members_json: boardMembers,
          shareholders_json: shareholders,
          investor_groups_json: investors,
          portfolio_notes: portfolioNotes,
          ownership_source: ownershipSource,
          ownership_last_checked_at: new Date().toISOString(),
        }),
      })
      onSave({ board_members_json: boardMembers, shareholders_json: shareholders, investor_groups_json: investors, portfolio_notes: portfolioNotes, ownership_source: ownershipSource })
    } finally {
      setSaving(false)
    }
  }

  const addPerson = (type: 'board' | 'shareholder' | 'investor') => {
    const p = { ...newPerson, type }
    if (type === 'board') setBoardMembers(b => [...b, p])
    else if (type === 'shareholder') setShareholders(s => [...s, p])
    else setInvestors(i => [...i, p])
    setAdding(null)
    setNewPerson(EMPTY_PERSON)
  }

  const removePerson = (type: string, idx: number) => {
    if (type === 'board') setBoardMembers(b => b.filter((_, i) => i !== idx))
    else if (type === 'shareholder') setShareholders(s => s.filter((_, i) => i !== idx))
    else setInvestors(i => i.filter((_, i2) => i2 !== idx))
  }

  const PersonCard = ({ person, type, idx }: { person: OwnershipPerson; type: string; idx: number }) => (
    <div className="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-slate-200">{person.name}</span>
          {person.confidence && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CONFIDENCE_COLORS[person.confidence] || 'text-slate-500 border-slate-700'}`}>
              {person.confidence}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">{person.role}</div>
        {person.ownership_pct && <div className="text-xs text-slate-600 mt-0.5">Ownership: {person.ownership_pct}</div>}
        {person.source && <div className="text-xs text-slate-700 mt-0.5">Source: {person.source}</div>}
        {person.notes && <div className="text-xs text-slate-600 italic mt-0.5">{person.notes}</div>}
      </div>
      <button onClick={() => removePerson(type, idx)} className="text-slate-700 hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )

  const AddForm = ({ type, label }: { type: 'board' | 'shareholder' | 'investor'; label: string }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
      <h4 className="text-xs font-medium text-slate-400">Add {label}</h4>
      <div className="grid grid-cols-2 gap-2">
        <input value={newPerson.name} onChange={e => setNewPerson(p => ({ ...p, name: e.target.value }))}
          placeholder="Full name" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
        <input value={newPerson.role} onChange={e => setNewPerson(p => ({ ...p, role: e.target.value }))}
          placeholder="Title / role" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
        {(type === 'shareholder' || type === 'investor') && (
          <input value={newPerson.ownership_pct || ''} onChange={e => setNewPerson(p => ({ ...p, ownership_pct: e.target.value }))}
            placeholder="Ownership %" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
        )}
        <select value={newPerson.confidence} onChange={e => setNewPerson(p => ({ ...p, confidence: e.target.value as OwnershipPerson['confidence'] }))}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
          <option>User-provided</option>
          <option>Known from source</option>
          <option>AI hypothesis</option>
          <option>Needs validation</option>
        </select>
        <input value={newPerson.source || ''} onChange={e => setNewPerson(p => ({ ...p, source: e.target.value }))}
          placeholder="Source URL or reference" className="col-span-2 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={() => addPerson(type)} disabled={!newPerson.name}>Add</Button>
        <Button size="sm" variant="ghost" onClick={() => { setAdding(null); setNewPerson(EMPTY_PERSON) }}>Cancel</Button>
      </div>
    </div>
  )

  const Section = ({
    title, icon: Icon, items, type, emptyText
  }: { title: string; icon: React.ElementType; items: OwnershipPerson[]; type: 'board' | 'shareholder' | 'investor'; emptyText: string }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-slate-500" />
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</h3>
          {items.length > 0 && <span className="text-xs text-slate-600">({items.length})</span>}
        </div>
        <button onClick={() => setAdding(type)} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {adding === type && <AddForm type={type} label={title} />}
      {items.length === 0 && adding !== type ? (
        <p className="text-xs text-slate-700 italic py-2">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((p, i) => <PersonCard key={i} person={p} type={type} idx={i} />)}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      {/* AI data quality notice */}
      <div className="text-xs text-slate-600 bg-slate-800/50 border border-slate-700 rounded-lg p-3">
        All ownership data must be labelled with a confidence level. AI-suggested data is marked <span className="text-amber-400">AI hypothesis</span> and
        must not be treated as verified. Only contact based on <span className="text-emerald-400">Known from source</span> or <span className="text-cyan-400">User-provided</span> data.
      </div>

      <Section title="Board Members" icon={Star} items={boardMembers} type="board" emptyText="No board members recorded. Add known or researched board members." />
      <Section title="Shareholders / Owners" icon={Building2} items={shareholders} type="shareholder" emptyText="No shareholders recorded. Add known ownership information." />
      <Section title="Investor Groups" icon={TrendingUp} items={investors} type="investor" emptyText="No investor groups recorded. Add PE owners, VCs or corporate investors." />

      {/* Portfolio and source notes */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block uppercase tracking-wide">Portfolio Notes</label>
          <textarea
            value={portfolioNotes}
            onChange={e => setPortfolioNotes(e.target.value)}
            placeholder="Note other portfolio companies this investor owns, repeat deal flow opportunities, etc."
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block uppercase tracking-wide">Ownership Data Source</label>
          <input
            value={ownershipSource}
            onChange={e => setOwnershipSource(e.target.value)}
            placeholder="e.g. Annual report 2024, Companies House, LinkedIn, AI research"
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <Button variant="primary" size="sm" onClick={save} loading={saving}>
        <Save className="w-3.5 h-3.5" /> Save Ownership Data
      </Button>
    </div>
  )
}
