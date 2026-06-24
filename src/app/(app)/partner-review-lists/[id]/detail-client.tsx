'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown, Users, Download } from 'lucide-react'

interface ReviewItem {
  id: string
  company_id: string
  partner_feedback_status: string
  relationship_strength: string | null
  known_contact_name: string | null
  known_contact_role: string | null
  intro_possible: boolean | null
  intro_owner_name: string | null
  feedback_notes: string | null
  reviewed_at: string | null
  company: {
    id: string
    name: string
    website: string | null
    country: string | null
    segment: string | null
    stage: string
    shma_fit_score: number | null
    opportunity_score: number | null
    description: string | null
  } | null
}

interface ReviewList {
  id: string
  name: string
  reviewer_name: string
  reviewer_type: string
  status: string
  description: string | null
}

const FEEDBACK_OPTIONS = [
  { value: 'Knows company', color: 'text-blue-400', icon: '🏢' },
  { value: 'Knows person', color: 'text-cyan-400', icon: '👤' },
  { value: 'Strong intro possible', color: 'text-emerald-400', icon: '🤝' },
  { value: 'Weak intro possible', color: 'text-amber-400', icon: '👋' },
  { value: 'Contact through reviewer', color: 'text-purple-400', icon: '📞' },
  { value: 'No relationship', color: 'text-slate-500', icon: '—' },
  { value: 'Do not approach', color: 'text-rose-400', icon: '🚫' },
  { value: 'Not relevant', color: 'text-slate-600', icon: '✗' },
]

export function PartnerReviewListDetailClient({ list, items: initialItems }: { list: ReviewList; items: ReviewItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const reviewed = items.filter(i => i.partner_feedback_status !== 'Pending').length
  const intros = items.filter(i =>
    ['Strong intro possible', 'Weak intro possible', 'Contact through reviewer', 'Knows person'].includes(i.partner_feedback_status)
  ).length

  const startEdit = (item: ReviewItem) => {
    setEditingId(item.id)
    setEditForm({
      partner_feedback_status: item.partner_feedback_status,
      known_contact_name: item.known_contact_name || '',
      known_contact_role: item.known_contact_role || '',
      intro_possible: item.intro_possible ?? false,
      intro_owner_name: item.intro_owner_name || '',
      feedback_notes: item.feedback_notes || '',
      relationship_strength: item.relationship_strength || '',
    })
  }

  const saveEdit = async (itemId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/partner-review-lists/${list.id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, ...editForm }),
      })
      if (res.ok) {
        const updated = await res.json()
        setItems(its => its.map(i => i.id === itemId ? { ...i, ...updated } : i))
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    setStatusUpdating(true)
    try {
      await fetch(`/api/partner-review-lists/${list.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } finally {
      setStatusUpdating(false)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['Company', 'Country', 'Segment', 'SHMA Score', 'Feedback', 'Contact Name', 'Contact Role', 'Intro Possible', 'Notes'].join(','),
      ...items.map(i => [
        `"${i.company?.name || ''}"`,
        `"${i.company?.country || ''}"`,
        `"${i.company?.segment || ''}"`,
        i.company?.shma_fit_score || '',
        `"${i.partner_feedback_status}"`,
        `"${i.known_contact_name || ''}"`,
        `"${i.known_contact_role || ''}"`,
        i.intro_possible ? 'Yes' : '',
        `"${i.feedback_notes || ''}"`,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${list.name.replace(/[^a-z0-9]/gi, '_')}_review.csv`
    a.click()
  }

  return (
    <div className="flex-1 p-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-xl font-bold text-slate-200">{items.length}</div>
          <div className="text-xs text-slate-500">Total companies</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-xl font-bold text-emerald-400">{reviewed}</div>
          <div className="text-xs text-slate-500">Reviewed</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-xl font-bold text-cyan-400">{intros}</div>
          <div className="text-xs text-slate-500">Warm intros identified</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-xl font-bold text-slate-400">{items.length - reviewed}</div>
          <div className="text-xs text-slate-500">Pending review</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {list.status === 'Draft' && (
            <Button variant="primary" size="sm" onClick={() => updateStatus('Sent')} loading={statusUpdating}>
              Mark as Sent to Reviewer
            </Button>
          )}
          {list.status === 'Sent' && (
            <Button variant="primary" size="sm" onClick={() => updateStatus('Completed')} loading={statusUpdating}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={exportCsv}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Items table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900">
              <th className="text-left text-slate-500 px-4 py-2.5 font-medium">Company</th>
              <th className="text-left text-slate-500 px-3 py-2.5 font-medium">Country / Segment</th>
              <th className="text-left text-slate-500 px-3 py-2.5 font-medium">SHMA Score</th>
              <th className="text-left text-slate-500 px-3 py-2.5 font-medium">Partner Feedback</th>
              <th className="text-left text-slate-500 px-3 py-2.5 font-medium">Known Contact</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const feedbackOpt = FEEDBACK_OPTIONS.find(o => o.value === item.partner_feedback_status)
              const isEditing = editingId === item.id
              return (
                <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3">
                    <Link href={`/companies/${item.company_id}`} className="font-medium text-slate-200 hover:text-cyan-400 transition-colors">
                      {item.company?.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-500">
                    {item.company?.country}
                    {item.company?.segment && <><br /><span className="text-slate-600">{item.company.segment}</span></>}
                  </td>
                  <td className="px-3 py-3">
                    {item.company?.shma_fit_score
                      ? <span className="text-cyan-400 font-medium">{item.company.shma_fit_score}</span>
                      : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    {isEditing ? (
                      <select
                        value={editForm.partner_feedback_status as string}
                        onChange={e => setEditForm(f => ({ ...f, partner_feedback_status: e.target.value }))}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Pending">Pending</option>
                        {FEEDBACK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.icon} {o.value}</option>)}
                      </select>
                    ) : (
                      <span className={feedbackOpt?.color || 'text-slate-600'}>
                        {feedbackOpt?.icon} {item.partner_feedback_status}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          value={editForm.known_contact_name as string}
                          onChange={e => setEditForm(f => ({ ...f, known_contact_name: e.target.value }))}
                          placeholder="Contact name"
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                        />
                        <input
                          value={editForm.known_contact_role as string}
                          onChange={e => setEditForm(f => ({ ...f, known_contact_role: e.target.value }))}
                          placeholder="Role / title"
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                        />
                        <input
                          value={editForm.feedback_notes as string}
                          onChange={e => setEditForm(f => ({ ...f, feedback_notes: e.target.value }))}
                          placeholder="Notes"
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    ) : (
                      <>
                        {item.known_contact_name && <div className="font-medium text-slate-300">{item.known_contact_name}</div>}
                        {item.known_contact_role && <div className="text-slate-600">{item.known_contact_role}</div>}
                        {item.feedback_notes && <div className="text-slate-600 mt-0.5 italic">{item.feedback_notes}</div>}
                        {!item.known_contact_name && !item.feedback_notes && <span className="text-slate-700">—</span>}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {isEditing ? (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="primary" onClick={() => saveEdit(item.id)} loading={saving}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>Edit</Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
