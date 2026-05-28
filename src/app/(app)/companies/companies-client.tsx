'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PIPELINE_STAGES, SEGMENTS } from '@/lib/types'
import { ScoreBadge, PriorityBadge } from '@/components/ui/score-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { formatDate, isOverdue, isStale, cn } from '@/lib/utils'
import {
  Plus, Search, ExternalLink, AlertTriangle, Clock,
  Building2, Globe, ChevronRight, Sparkles, Download
} from 'lucide-react'

interface Company {
  id: string
  name: string
  website: string | null
  segment: string | null
  stage: string
  priority: string
  shma_fit_score: number | null
  opportunity_score: number | null
  closing_score: number | null
  internal_owner: string | null
  next_action: string | null
  next_action_date: string | null
  last_activity_date: string | null
  country: string | null
  pe_owned: string
  ai_researched: boolean
}

interface Filters {
  stage?: string
  priority?: string
  segment?: string
  search?: string
}

export function CompaniesClient({ companies, filters }: { companies: Company[]; filters: Filters }) {
  const [search, setSearch] = useState(filters.search || '')
  const [stageFilter, setStageFilter] = useState(filters.stage || '')
  const [priorityFilter, setPriorityFilter] = useState(filters.priority || '')
  const [segmentFilter, setSegmentFilter] = useState(filters.segment || '')
  const [showAddModal, setShowAddModal] = useState(false)
  const [bulkScoring, setBulkScoring] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)
  const router = useRouter()

  const unscored = companies.filter(c => c.shma_fit_score === null && !['Disqualified', 'Nurture'].includes(c.stage))

  const runBulkScore = async () => {
    if (unscored.length === 0) return
    setBulkScoring(true)
    setBulkProgress({ done: 0, total: unscored.length })
    for (let i = 0; i < unscored.length; i++) {
      const c = unscored[i]
      try {
        await fetch('/api/ai/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: c.id,
            company_name: c.name,
            segment: c.segment,
          }),
        })
      } catch { /* continue on error */ }
      setBulkProgress({ done: i + 1, total: unscored.length })
    }
    setBulkScoring(false)
    setBulkProgress(null)
    router.refresh()
  }

  const filtered = companies.filter(c => {
    if (stageFilter && c.stage !== stageFilter) return false
    if (priorityFilter && c.priority !== priorityFilter) return false
    if (segmentFilter && c.segment !== segmentFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) ||
        (c.segment || '').toLowerCase().includes(q) ||
        (c.country || '').toLowerCase().includes(q)
    }
    return true
  })

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form.entries())
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const company = await res.json()
      setShowAddModal(false)
      router.push(`/companies/${company.id}`)
      router.refresh()
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies…"
            className="w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All stages</option>
          {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All priorities</option>
          {['A', 'B', 'C', 'Nurture', 'Disqualified', 'Unknown'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={segmentFilter}
          onChange={e => setSegmentFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All segments</option>
          {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex-1" />

        <span className="text-xs text-slate-600">{filtered.length} companies</span>

        {unscored.length > 0 && (
          <Button size="sm" variant="secondary" onClick={runBulkScore} disabled={bulkScoring}>
            <Sparkles className="h-3.5 w-3.5" />
            {bulkScoring && bulkProgress
              ? `Scoring ${bulkProgress.done}/${bulkProgress.total}…`
              : `Score unscored (${unscored.length})`}
          </Button>
        )}

        <a href="/api/export/companies" download>
          <Button size="sm" variant="secondary">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </a>

        <Button size="sm" variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus className="h-3.5 w-3.5" /> Add company
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Company</th>
              <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Stage</th>
              <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Priority</th>
              <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Fit</th>
              <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Opp</th>
              <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Owner</th>
              <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Next Action</th>
              <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Last Activity</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-600">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <div>No companies found</div>
                </td>
              </tr>
            )}
            {filtered.map(company => {
              const stale = isStale(company.last_activity_date)
              const overdue = isOverdue(company.next_action_date)

              return (
                <tr
                  key={company.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="px-5 py-3">
                    <Link href={`/companies/${company.id}`} className="flex items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200 hover:text-cyan-400 transition-colors">
                            {company.name}
                          </span>
                          {company.pe_owned === 'yes' && (
                            <Badge variant="info">PE</Badge>
                          )}
                          {!company.ai_researched && (
                            <Badge variant="muted">No AI</Badge>
                          )}
                          {stale && !['Disqualified', 'Nurture', 'Signed'].includes(company.stage) && (
                            <AlertTriangle className="h-3 w-3 text-amber-500" aria-label="Stale — no recent activity" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {company.segment && (
                            <span className="text-xs text-slate-600">{company.segment}</span>
                          )}
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-slate-700 hover:text-slate-500"
                            >
                              <Globe className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-slate-400">{company.stage}</span>
                  </td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={company.priority} />
                  </td>
                  <td className="px-3 py-3">
                    <ScoreBadge score={company.shma_fit_score} />
                  </td>
                  <td className="px-3 py-3">
                    <ScoreBadge score={company.opportunity_score} />
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-slate-500">{company.internal_owner || '—'}</span>
                  </td>
                  <td className="px-3 py-3 max-w-48">
                    {company.next_action ? (
                      <div>
                        <div className="text-xs text-slate-400 truncate">{company.next_action}</div>
                        {company.next_action_date && (
                          <div className={cn('text-xs mt-0.5', overdue ? 'text-rose-400' : 'text-slate-600')}>
                            {overdue && <Clock className="h-2.5 w-2.5 inline mr-0.5" />}
                            {formatDate(company.next_action_date)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-rose-500">No action</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-slate-600">
                      {company.last_activity_date ? formatDate(company.last_activity_date) : '—'}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/companies/${company.id}`}>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Company Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Company" size="md">
        <form onSubmit={handleAddCompany} className="p-5 space-y-4">
          <Input name="name" label="Company Name" placeholder="Acme Industrial" required />
          <Input name="website" label="Website" placeholder="https://acme.com" type="url" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              name="segment"
              label="Segment"
              placeholder="Select segment"
              options={SEGMENTS.map(s => ({ value: s, label: s }))}
            />
            <Input name="country" label="Country" placeholder="Norway" />
          </div>
          <Input name="lead_source" label="Lead Source" placeholder="LinkedIn, referral, etc." />
          <Input name="internal_owner" label="Owner" placeholder="Stian" />
          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full">Add to Pipeline</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
