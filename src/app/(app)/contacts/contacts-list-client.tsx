'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { User, Building2, Search, ChevronRight, Trash2 } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props {
  contacts: Record<string, any>[]
}

function ScoreDisplay({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-slate-700">—</span>
  const color = score >= 5 ? 'text-emerald-400' : score >= 4 ? 'text-cyan-400' : score >= 3 ? 'text-amber-400' : 'text-slate-500'
  return <span className={`font-semibold tabular-nums ${color}`}>{score}</span>
}

function RoleCategoryBadge({ role }: { role: string | null | undefined }) {
  if (!role) return null
  const lower = role.toLowerCase()
  let cls = 'bg-slate-600/50 text-slate-400 border-slate-600'
  if (lower.includes('executive')) cls = 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  else if (lower.includes('commercial') || lower.includes('strategy')) cls = 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  else if (lower.includes('service') || lower.includes('operations')) cls = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  else if (lower.includes('product') || lower.includes('technology')) cls = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  else if (lower.includes('finance') || lower.includes('ownership')) cls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${cls}`}>
      {role}
    </span>
  )
}

function StageBadge({ stage }: { stage: string | null | undefined }) {
  if (!stage) return <span className="text-slate-600 text-xs">—</span>
  const map: Record<string, string> = {
    'Discovery': 'bg-slate-700 text-slate-400 border-slate-600',
    'Qualified': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Active': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'Proposal': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Negotiation': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Won': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Lost': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  }
  const cls = map[stage] || map['Discovery']
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${cls}`}>
      {stage}
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOutreachCount(contact: Record<string, any>): number {
  const om = contact.outreach_messages
  if (!om) return 0
  if (Array.isArray(om)) return om.length
  if (Array.isArray(om) && om[0]?.count != null) return Number(om[0].count)
  return 0
}

export function ContactsListClient({ contacts }: Props) {
  const [search, setSearch] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localContacts, setLocalContacts] = useState<Record<string, any>[]>(contacts)

  const filtered = search.trim()
    ? localContacts.filter(c => {
        const q = search.toLowerCase()
        const name = (c.full_name || c.name || '').toLowerCase()
        const title = (c.title || c.role || '').toLowerCase()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const company = (c.companies as Record<string, any> | null)
        const companyName = (company?.name || '').toLowerCase()
        const role = (c.role_category || '').toLowerCase()
        return name.includes(q) || title.includes(q) || companyName.includes(q) || role.includes(q)
      })
    : localContacts

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Search bar */}
      <div className="px-5 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {/* Header row */}
        <div className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800 grid grid-cols-[2fr_1.5fr_auto_2fr_auto_auto] gap-3 px-5 py-2.5">
          <div className="text-xs font-medium text-slate-500">Contact</div>
          <div className="text-xs font-medium text-slate-500">Company</div>
          <div className="text-xs font-medium text-slate-500 text-center">Scores</div>
          <div className="text-xs font-medium text-slate-500">AI Rationale</div>
          <div className="text-xs font-medium text-slate-500 text-center">Outreach</div>
          <div className="text-xs font-medium text-slate-500 sr-only">Actions</div>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <User className="h-8 w-8 mb-2 opacity-30" />
            <div className="text-sm">{search ? 'No contacts match your search' : 'No contacts yet — add them from a company page'}</div>
          </div>
        )}

        {filtered.map(contact => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const company = contact.companies as Record<string, any> | null
          const displayName = contact.full_name || contact.name || 'Unknown'
          const outreachCount = getOutreachCount(contact)
          const rationale = contact.ai_rationale
            ? String(contact.ai_rationale).slice(0, 80) + (contact.ai_rationale.length > 80 ? '…' : '')
            : null

          return (
            <div key={contact.id} className="grid grid-cols-[2fr_1.5fr_auto_2fr_auto_auto] gap-3 px-5 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center group">
              {/* Contact — clickable */}
              <Link href={`/contacts/${contact.id}`} className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-slate-400">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-slate-200 text-sm truncate">{displayName}</span>
                    <RoleCategoryBadge role={contact.role_category} />
                  </div>
                  {(contact.title || contact.role) && (
                    <div className="text-xs text-slate-500 truncate mt-0.5">{contact.title || contact.role}</div>
                  )}
                </div>
              </Link>

              {/* Company */}
              <div className="min-w-0">
                {company ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="h-3 w-3 text-slate-600 flex-shrink-0" />
                    <span className="text-sm text-slate-300 truncate">{company.name}</span>
                  </div>
                ) : (
                  <span className="text-slate-600 text-sm">—</span>
                )}
                {company?.stage && <div className="mt-0.5"><StageBadge stage={company.stage} /></div>}
              </div>

              {/* Scores */}
              <div className="text-xs font-mono text-center whitespace-nowrap">
                <ScoreDisplay score={contact.decision_power_score} />
                <span className="text-slate-700 mx-0.5">/</span>
                <ScoreDisplay score={contact.shma_relevance_score} />
                <span className="text-slate-700 mx-0.5">/</span>
                <ScoreDisplay score={contact.outreach_fit_score} />
              </div>

              {/* Rationale */}
              <div className="min-w-0">
                {rationale ? (
                  <p className="text-xs text-slate-500 truncate">{rationale}</p>
                ) : (
                  <span className="text-slate-700 text-xs">—</span>
                )}
              </div>

              {/* Outreach count */}
              <div className="text-center">
                {outreachCount > 0 ? (
                  <Badge variant="info">{outreachCount}</Badge>
                ) : (
                  <span className="text-slate-700 text-xs">0</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => setDeleteTarget(contact)}
                  className="p-1 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete contact"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <Link href={`/contacts/${contact.id}`}>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete contact modal */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete contact"
        description={`Delete "${deleteTarget?.full_name || deleteTarget?.name}"? Their outreach history will also be removed. This cannot be undone.`}
        confirmLabel="Delete contact"
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          const res = await fetch(`/api/contacts/${deleteTarget.id}`, { method: 'DELETE' })
          if (res.ok) {
            setLocalContacts(prev => prev.filter(c => c.id !== deleteTarget.id))
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
