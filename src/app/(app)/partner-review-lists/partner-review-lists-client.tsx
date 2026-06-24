'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, ChevronRight, Clock, CheckCircle2, Send, Archive } from 'lucide-react'

interface ReviewList {
  id: string
  name: string
  description: string | null
  reviewer_name: string
  reviewer_type: string
  status: string
  created_at: string
  items: { count: number }[]
}

interface Company {
  id: string
  name: string
  country: string | null
  segment: string | null
  stage: string
  shma_fit_score: number | null
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-700 text-slate-300',
  Sent: 'bg-blue-500/20 text-blue-300',
  'In Review': 'bg-amber-500/20 text-amber-300',
  Completed: 'bg-emerald-500/20 text-emerald-300',
  Archived: 'bg-slate-800 text-slate-500',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  Draft: Clock,
  Sent: Send,
  'In Review': Users,
  Completed: CheckCircle2,
  Archived: Archive,
}

export function PartnerReviewListsClient({ lists, companies }: { lists: ReviewList[]; companies: Company[] }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', reviewer_name: '', reviewer_email: '', reviewer_type: 'External Partner' })
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [companySearch, setCompanySearch] = useState('')

  const filteredCompanies = companies.filter(c =>
    !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.name || !form.reviewer_name) return
    setCreating(true)
    try {
      const res = await fetch('/api/partner-review-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company_ids: selectedCompanies }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/partner-review-lists/${data.id}`)
        router.refresh()
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex-1 p-5">
      {/* Context note */}
      <div className="mb-5 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-xs text-slate-400">
        <p className="font-medium text-slate-300 mb-1">How Partner Review Lists work</p>
        <p>Create a curated list of 50–100 companies and share with a partner (Sean, Bas, Jean-Baptiste, Simon).
          They indicate which companies they know — creating warm-intro pathways into the pipeline.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-300">{lists.length} review lists</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> New Review List
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Create Partner Review List</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">List Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. France Target List — Sean Review"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Reviewer Name *</label>
              <input
                value={form.reviewer_name}
                onChange={e => setForm(f => ({ ...f, reviewer_name: e.target.value }))}
                placeholder="e.g. Sean Baker"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Reviewer Email</label>
              <input
                value={form.reviewer_email}
                onChange={e => setForm(f => ({ ...f, reviewer_email: e.target.value }))}
                placeholder="sean@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Reviewer Type</label>
              <select
                value={form.reviewer_type}
                onChange={e => setForm(f => ({ ...f, reviewer_type: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option>External Partner</option>
                <option>SHMA Principal</option>
                <option>Chetwode</option>
                <option>Channel Partner</option>
                <option>Investor</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Context for this review batch…"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Company selection */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block">
              Add Companies ({selectedCompanies.length} selected) — from Longlist / AI Researched / Human Review / Qualified
            </label>
            <input
              value={companySearch}
              onChange={e => setCompanySearch(e.target.value)}
              placeholder="Search companies…"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 mb-2"
            />
            <div className="max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-md">
              {filteredCompanies.slice(0, 100).map(c => (
                <label key={c.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(c.id)}
                    onChange={e => setSelectedCompanies(s =>
                      e.target.checked ? [...s, c.id] : s.filter(id => id !== c.id)
                    )}
                    className="accent-cyan-500"
                  />
                  <span className="text-sm text-slate-300 flex-1">{c.name}</span>
                  <span className="text-xs text-slate-600">{c.country}</span>
                  <span className="text-xs text-slate-600">{c.segment}</span>
                  {c.shma_fit_score && <span className="text-xs text-cyan-600">SHMA {c.shma_fit_score}</span>}
                </label>
              ))}
              {filteredCompanies.length === 0 && (
                <p className="px-3 py-3 text-xs text-slate-600">No companies found</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={creating}
              disabled={!form.name || !form.reviewer_name}>
              Create List
            </Button>
          </div>
        </div>
      )}

      {/* List of review lists */}
      <div className="space-y-3">
        {lists.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No partner review lists yet.</p>
            <p className="text-xs mt-1">Create your first list to start identifying warm intros.</p>
          </div>
        ) : lists.map(list => {
          const Icon = STATUS_ICONS[list.status] || Clock
          const itemCount = list.items?.[0]?.count ?? 0
          return (
            <Link
              key={list.id}
              href={`/partner-review-lists/${list.id}`}
              className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-200">{list.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_COLORS[list.status] || 'bg-slate-700 text-slate-400'}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {list.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Reviewer: <span className="text-slate-400">{list.reviewer_name}</span>
                  <span className="mx-2">·</span>
                  {itemCount} companies
                  {list.description && <><span className="mx-2">·</span>{list.description}</>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
