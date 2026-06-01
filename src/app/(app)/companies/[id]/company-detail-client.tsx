'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ScoreBar, ScoreBadge, PriorityBadge } from '@/components/ui/score-display'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateRelative, cn } from '@/lib/utils'
import { PIPELINE_STAGES, SEGMENTS, NEXT_ACTION_TYPES } from '@/lib/types'
import { ContactsTabClient } from './contacts-tab-client'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import {
  Sparkles, Building2, Globe, MapPin, User, Mail, Phone, Link2,
  Calendar, FileText, MessageSquare, Activity, ChevronDown, ChevronUp, Edit3,
  Plus, Send, AlertTriangle, CheckCircle2, Clock, ExternalLink, Copy, Save, Trash2
} from 'lucide-react'

const SCORE_LABELS: Record<string, string> = {
  asset_intensity: 'Asset Intensity',
  customer_upfront_investment: 'Customer Upfront Investment',
  technical_complexity: 'Technical Complexity',
  service_support_potential: 'Service / Support Potential',
  software_data_monitoring_potential: 'Software / Data / Monitoring',
  standardization_potential: 'Standardization Potential',
  residual_value_redeployment: 'Residual Value / Redeployment',
  recurring_revenue_ambition: 'Recurring Revenue Ambition',
  growth_trigger: 'Growth Trigger',
  decision_maker_access: 'Decision-Maker Access',
  commercial_value_to_shma: 'Commercial Value to SHMA',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CompanyDetailClient({ company, contacts, brief, outreach, meetings, activity, latestRun }: {
  company: Record<string, any>
  contacts: Record<string, any>[]
  brief: Record<string, any> | null
  outreach: Record<string, any>[]
  meetings: Record<string, any>[]
  activity: Record<string, any>[]
  latestRun?: Record<string, any> | null
}) {
  const [tab, setTab] = useState<'overview' | 'fit' | 'research' | 'contacts' | 'outreach' | 'meetings' | 'activity'>('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<Record<string, string> | null>(null)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showOutreachModal, setShowOutreachModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loggingOutreach, setLoggingOutreach] = useState(false)
  const [outreachJustSaved, setOutreachJustSaved] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localActivity, setLocalActivity] = useState<Record<string, any>[]>(activity)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localCompany, setLocalCompany] = useState<Record<string, any>>(company)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localBrief, setLocalBrief] = useState<Record<string, any> | null>(brief)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localContacts, setLocalContacts] = useState<Record<string, any>[]>(contacts)
  const [editData, setEditData] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    if (outreachJustSaved) {
      const timer = setTimeout(() => setOutreachJustSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [outreachJustSaved])

  const startEdit = () => {
    setEditData({
      name: String(localCompany.name || ''),
      website: String(localCompany.website || ''),
      segment: String(localCompany.segment || ''),
      country: String(localCompany.country || ''),
      stage: String(localCompany.stage || ''),
      priority: String(localCompany.priority || ''),
      internal_owner: String(localCompany.internal_owner || ''),
      next_action: String(localCompany.next_action || ''),
      next_action_type: String(localCompany.next_action_type || ''),
      next_action_date: String(localCompany.next_action_date || ''),
      notes: String(localCompany.notes || ''),
      description: String(localCompany.description || ''),
      pe_owned: String(localCompany.pe_owned || 'unknown'),
      ownership_type: String(localCompany.ownership_type || ''),
      revenue_range: String(localCompany.revenue_range || ''),
      employee_range: String(localCompany.employee_range || ''),
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${localCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (res.ok) {
        const updated = await res.json()
        setLocalCompany(updated)
        setEditing(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const runAI = async (action: string) => {
    setAiLoading(action)
    setAiResult(null)
    try {
      let endpoint = ''
      let body: Record<string, unknown> = { company_id: localCompany.id }

      if (action === 'research') {
        endpoint = '/api/ai/research'
        body = { ...body, company_name: localCompany.name, website: localCompany.website, segment: localCompany.segment, notes: localCompany.notes }
      } else if (action === 'score') {
        endpoint = '/api/ai/score'
        body = { ...body, company_name: localCompany.name, segment: localCompany.segment, description: localCompany.description, notes: localCompany.notes, website: localCompany.website }
      } else if (action === 'linkedin') {
        endpoint = '/api/ai/outreach'
        body = { ...body, company_name: localCompany.name, channel: 'linkedin', shma_hypothesis: localBrief?.possible_aaas_concept }
      } else if (action === 'email') {
        endpoint = '/api/ai/outreach'
        body = { ...body, company_name: localCompany.name, channel: 'email', shma_hypothesis: localBrief?.possible_aaas_concept }
      } else if (action === 'meeting') {
        endpoint = '/api/ai/meeting-brief'
        body = { ...body, company_name: localCompany.name, company_background: localBrief?.company_snapshot, shma_hypothesis: localBrief?.possible_aaas_concept, stage: localCompany.stage }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (action === 'research') {
        setLocalBrief(data.sections)
        setTab('research')
      } else if (action === 'score') {
        setLocalCompany(prev => ({
          ...prev,
          shma_fit_score: data.shma_fit_score,
          opportunity_score: data.opportunity_score,
          closing_score: data.closing_score,
          overall_priority_score: data.overall_priority_score,
          priority: data.priority,
          score_breakdown: data.scores,
          score_explanation: data.overall_explanation,
        }))
        setTab('fit')
      } else {
        setAiResult(data)
        if (action === 'linkedin' || action === 'email' || action === 'warm_intro') {
          setOutreachJustSaved(true)
        }
      }
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(null)
    }
  }

  const logOutreach = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const channel = form.get('channel') as string
    const subject = form.get('subject') as string
    const notes = form.get('notes') as string
    const logged_at = form.get('logged_at') as string
    setLoggingOutreach(true)
    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: localCompany.id,
          type: 'outreach_sent',
          description: `${channel}: ${subject || 'Outreach'}`,
          metadata_json: { channel, subject, notes, logged_at },
        }),
      })
      if (res.ok) {
        const newActivity = await res.json()
        setLocalActivity(prev => [newActivity, ...prev])
        setShowOutreachModal(false)
        router.refresh()
      }
    } finally {
      setLoggingOutreach(false)
    }
  }

  const addMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form.entries())
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, company_id: localCompany.id }),
    })
    if (res.ok) {
      setShowMeetingModal(false)
      router.refresh()
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'fit', label: 'SHMA Fit' },
    { id: 'research', label: 'AI Research' },
    {
      id: 'contacts',
      label: `Contacts (${localContacts.length})${localCompany.decision_maker_identified ? ' ●' : ''}`,
    },
    { id: 'outreach', label: `Outreach (${outreach.length})` },
    { id: 'meetings', label: `Meetings (${meetings.length})` },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 flex-shrink-0">
        <PriorityBadge priority={String(localCompany.priority)} size="md" />
        <ScoreBadge score={localCompany.shma_fit_score as number | null} label="Fit" />
        <ScoreBadge score={localCompany.opportunity_score as number | null} label="Opp" />
        <ScoreBadge score={localCompany.closing_score as number | null} label="Close" />

        <div className="flex-1" />

        <Button size="sm" variant="ghost" onClick={() => runAI('research')} loading={aiLoading === 'research'}>
          <Sparkles className="h-3.5 w-3.5" /> Research
        </Button>
        <Button size="sm" variant="ghost" onClick={() => runAI('score')} loading={aiLoading === 'score'}>
          <Sparkles className="h-3.5 w-3.5" /> Score
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setTab('outreach'); runAI('linkedin') }} loading={aiLoading === 'linkedin'}>
          <MessageSquare className="h-3.5 w-3.5" /> LinkedIn
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setTab('outreach'); runAI('email') }} loading={aiLoading === 'email'}>
          <Mail className="h-3.5 w-3.5" /> Email
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setTab('meetings'); runAI('meeting') }} loading={aiLoading === 'meeting'}>
          <FileText className="h-3.5 w-3.5" /> Meeting Brief
        </Button>

        {editing ? (
          <>
            <Button size="sm" variant="primary" onClick={saveEdit} loading={saving}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={startEdit}>
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded"
          title="Delete company"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Delete Company Modal */}
      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Delete company"
        description={`Delete "${localCompany.name}"? All associated contacts, meetings, activity, and outreach will also be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete company"
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          const res = await fetch(`/api/companies/${localCompany.id}`, { method: 'DELETE' })
          if (res.ok) router.push('/companies')
        }}
      />

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-800 px-5 flex-shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px',
              tab === t.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'overview' && (
          <OverviewTab
            company={localCompany}
            editing={editing}
            editData={editData}
            setEditData={setEditData}
          />
        )}
        {tab === 'fit' && (
          <FitTab company={localCompany} />
        )}
        {tab === 'research' && (
          <ResearchTab brief={localBrief} loading={aiLoading === 'research'} onGenerate={() => runAI('research')} />
        )}
        {tab === 'contacts' && (
          <ContactsTabClient
            companyId={String(localCompany.id)}
            company={localCompany}
            initialContacts={localContacts}
            initialLatestRun={latestRun || null}
            brief={localBrief}
            outreach={outreach}
          />
        )}
        {tab === 'outreach' && (
          <OutreachTab
            outreach={outreach}
            aiResult={aiLoading ? null : aiResult}
            loading={aiLoading === 'linkedin' || aiLoading === 'email'}
            onGenerate={(channel) => { setAiResult(null); runAI(channel) }}
            justSaved={outreachJustSaved}
          />
        )}
        {tab === 'meetings' && (
          <MeetingsTab
            meetings={meetings}
            meetingBrief={aiLoading ? null : (tab === 'meetings' ? aiResult : null)}
            loading={aiLoading === 'meeting'}
            onGenerateBrief={() => runAI('meeting')}
            onAdd={() => setShowMeetingModal(true)}
          />
        )}
        {tab === 'activity' && (
          <ActivityTab activity={localActivity} onLogOutreach={() => setShowOutreachModal(true)} />
        )}
      </div>

      {/* Modals */}
      <Modal open={showMeetingModal} onClose={() => setShowMeetingModal(false)} title="Log Meeting" size="md">
        <form onSubmit={addMeeting} className="p-5 space-y-4">
          <Input name="meeting_date" label="Date & Time" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          <Input name="participants" label="Participants" placeholder="CEO, CFO, Stian (SHMA)" />
          <Input name="objective" label="Meeting Objective" placeholder="Validate servitization hypothesis, map decision process" />
          <Textarea name="notes" label="Meeting Notes" placeholder="What was discussed, key insights, decisions made…" rows={5} />
          <Input name="next_step" label="Next Step" placeholder="Send proposal by Friday" />
          <Button type="submit" variant="primary" className="w-full">Save Meeting</Button>
        </form>
      </Modal>

      <Modal open={showOutreachModal} onClose={() => setShowOutreachModal(false)} title="Log Outreach" size="md">
        <form onSubmit={logOutreach} className="p-5 space-y-4">
          <Select
            name="channel"
            label="Channel"
            placeholder="Select channel"
            options={[
              { value: 'Email', label: 'Email' },
              { value: 'LinkedIn', label: 'LinkedIn' },
              { value: 'Phone Call', label: 'Phone Call' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <Input
            name="logged_at"
            label="Date & Time"
            type="datetime-local"
            defaultValue={new Date().toISOString().slice(0, 16)}
          />
          <Input name="subject" label="Subject / Purpose" placeholder="Introduction to SHMA" />
          <Textarea name="notes" label="Notes" placeholder="What was sent / discussed…" rows={4} />
          <Button type="submit" variant="primary" className="w-full" loading={loggingOutreach}>
            Log Outreach
          </Button>
        </form>
      </Modal>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OverviewTab({ company, editing, editData, setEditData }: {
  company: Record<string, any>
  editing: boolean
  editData: Record<string, string>
  setEditData: (d: Record<string, string>) => void
}) {
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setEditData({ ...editData, [key]: e.target.value })

  if (editing) {
    return (
      <div className="max-w-2xl space-y-4">
        <Input label="Company Name" value={editData.name} onChange={set('name')} />
        <Input label="Website" value={editData.website} onChange={set('website')} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Segment" value={editData.segment} onChange={set('segment')} placeholder="Select" options={SEGMENTS.map(s => ({ value: s, label: s }))} />
          <Input label="Country" value={editData.country} onChange={set('country')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Stage" value={editData.stage} onChange={set('stage')} placeholder="Select" options={PIPELINE_STAGES.map(s => ({ value: s, label: s }))} />
          <Select label="Priority" value={editData.priority} onChange={set('priority')} placeholder="Select" options={['A', 'B', 'C', 'Nurture', 'Disqualified', 'Unknown'].map(p => ({ value: p, label: p }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Owner" value={editData.internal_owner} onChange={set('internal_owner')} />
          <Select label="PE-Owned" value={editData.pe_owned} onChange={set('pe_owned')} placeholder="Select" options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Unknown' }]} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Revenue Range" value={editData.revenue_range} onChange={set('revenue_range')} placeholder="€10M–€50M" />
          <Input label="Employee Range" value={editData.employee_range} onChange={set('employee_range')} placeholder="50–200" />
        </div>
        <Textarea label="Description" value={editData.description} onChange={set('description')} />
        <Select label="Next Action Type" value={editData.next_action_type} onChange={set('next_action_type')} placeholder="Select" options={NEXT_ACTION_TYPES.map(t => ({ value: t, label: t }))} />
        <Input label="Next Action" value={editData.next_action} onChange={set('next_action')} />
        <Input label="Next Action Date" type="date" value={editData.next_action_date} onChange={set('next_action_date')} />
        <Textarea label="Notes" value={editData.notes} onChange={set('notes')} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Company Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Company Information</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          <InfoRow icon={<Building2 />} label="Segment" value={String(company.segment || '—')} />
          <InfoRow icon={<MapPin />} label="Country" value={String(company.country || '—')} />
          <InfoRow icon={<Globe />} label="Website" value={company.website ? (
            <a href={String(company.website)} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              {String(company.website)} <ExternalLink className="h-3 w-3" />
            </a>
          ) : '—'} />
          <InfoRow icon={<User />} label="Ownership" value={String(company.ownership_type || '—')} />
          <InfoRow label="Revenue" value={String(company.revenue_range || '—')} />
          <InfoRow label="Employees" value={String(company.employee_range || '—')} />
          <InfoRow label="Lead Source" value={String(company.lead_source || '—')} />
          <InfoRow label="PE-Owned" value={
            company.pe_owned === 'yes' ? <Badge variant="info">Yes</Badge> :
            company.pe_owned === 'no' ? <Badge variant="muted">No</Badge> :
            <Badge variant="muted">Unknown</Badge>
          } />
        </div>
        {company.description && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Description</div>
            <p className="text-sm text-slate-300 leading-relaxed">{String(company.description)}</p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pipeline Status</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          <InfoRow label="Stage" value={String(company.stage || '—')} />
          <InfoRow label="Priority" value={<PriorityBadge priority={String(company.priority)} />} />
          <InfoRow label="Owner" value={String(company.internal_owner || '—')} />
          <InfoRow label="Last Activity" value={formatDateRelative(company.last_activity_date as string | null)} />
        </div>

        {company.next_action && (
          <div className="mt-3 bg-slate-700/50 rounded-md p-3">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Next Action
            </div>
            <div className="text-sm text-slate-200">{String(company.next_action)}</div>
            {company.next_action_date && (
              <div className="text-xs text-slate-500 mt-1">{formatDate(company.next_action_date as string | null)}</div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {company.notes && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Notes</h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{String(company.notes)}</p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-600 mb-0.5 flex items-center gap-1">
        {icon && <span className="h-3 w-3 [&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
        {label}
      </div>
      <div className="text-sm text-slate-300">{value}</div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FitTab({ company }: { company: Record<string, any> }) {
  const breakdown = company.score_breakdown as Record<string, number> | null

  return (
    <div className="max-w-2xl space-y-5">
      {/* Score Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'SHMA Fit', score: company.shma_fit_score },
          { label: 'Opportunity', score: company.opportunity_score },
          { label: 'Closing', score: company.closing_score },
          { label: 'Overall', score: company.overall_priority_score },
        ].map(({ label, score }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
            <ScoreBadge score={score as number | null} size="lg" />
            <div className="text-xs text-slate-500 mt-1.5">{label}</div>
          </div>
        ))}
      </div>

      {company.score_explanation && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Assessment</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{String(company.score_explanation)}</p>
        </div>
      )}

      {breakdown && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Score Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(SCORE_LABELS).map(([key, label]) => (
              <ScoreBar
                key={key}
                label={label}
                score={breakdown[key] ?? null}
              />
            ))}
          </div>
        </div>
      )}

      {company.disqualification_reason && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-medium text-rose-300">Disqualification Flag</h3>
          </div>
          <p className="text-sm text-rose-300/80">{String(company.disqualification_reason)}</p>
        </div>
      )}

      {!breakdown && (
        <div className="text-center py-8 text-slate-600">
          <p className="text-sm">No scoring data yet.</p>
          <p className="text-xs mt-1">Click "Score" in the top bar to run AI scoring.</p>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResearchTab({ brief, loading, onGenerate }: { brief: Record<string, any> | null; loading: boolean; onGenerate: () => void }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm">Generating AI research brief…</p>
      </div>
    )
  }

  if (!brief) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No research brief yet</p>
        <p className="text-xs text-slate-600 mt-1 mb-4">Click Research to generate an AI account brief</p>
        <Button onClick={onGenerate} variant="primary" size="sm">
          <Sparkles className="h-3.5 w-3.5" /> Generate Research Brief
        </Button>
      </div>
    )
  }

  const sections = [
    { key: 'company_snapshot', label: 'Company Snapshot' },
    { key: 'what_they_sell', label: 'What They Sell' },
    { key: 'who_they_sell_to', label: 'Who They Sell To' },
    { key: 'likely_customer_pain', label: 'Likely Customer Pain' },
    { key: 'possible_aaas_concept', label: 'Possible As-a-Service Concept', highlight: true },
    { key: 'why_shma_relevant', label: 'Why SHMA Is Relevant', highlight: true },
    { key: 'potential_business_model', label: 'Potential Business Model' },
    { key: 'potential_financial_model', label: 'Potential Financial Model' },
    { key: 'potential_operational_model', label: 'Potential Operational Model' },
    { key: 'strategic_trigger', label: 'Strategic Trigger' },
    { key: 'suggested_entry_angle', label: 'Suggested Entry Angle', highlight: true },
    { key: 'risks_and_uncertainties', label: 'Risks & Uncertainties' },
    { key: 'recommended_next_action', label: 'Recommended Next Action', highlight: true },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600">
          Generated: {formatDate((brief.generated_at as string) || '')} · {String(brief.model_used || '')}
        </p>
        <Button size="sm" variant="ghost" onClick={onGenerate}>
          <Sparkles className="h-3.5 w-3.5" /> Regenerate
        </Button>
      </div>

      {sections.map(({ key, label, highlight }) => {
        const content = brief[key] || brief[`company_snapshot`]
        if (!content) return null
        return (
          <div
            key={key}
            className={cn(
              'bg-slate-800 border rounded-lg p-4',
              highlight ? 'border-cyan-500/30' : 'border-slate-700'
            )}
          >
            <h3 className={cn('text-xs font-medium uppercase tracking-wide mb-2', highlight ? 'text-cyan-400' : 'text-slate-500')}>
              {label}
            </h3>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {String(content)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOutreachContent(content: string): string {
  if (!content) return ''
  const trimmed = content.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      return parsed.first_email || parsed.connection_request || parsed.message || JSON.stringify(parsed, null, 2)
    } catch {
      return content
    }
  }
  return content
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OutreachTab({ outreach, aiResult, loading, onGenerate, justSaved }: {
  outreach: Record<string, any>[]
  aiResult: Record<string, string> | null
  loading: boolean
  onGenerate: (channel: string) => void
  justSaved: boolean
}) {
  const [copied, setCopied] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localOutreach, setLocalOutreach] = useState<Record<string, any>[]>(outreach)
  const [marking, setMarking] = useState<string | null>(null)

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const markSent = async (id: string) => {
    setMarking(id + '_sent')
    try {
      const res = await fetch(`/api/outreach/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLocalOutreach(prev => prev.map(m => m.id === id ? { ...m, status: 'sent', sent_at: updated.sent_at } : m))
      }
    } finally {
      setMarking(null)
    }
  }

  const markReplied = async (id: string) => {
    setMarking(id + '_replied')
    try {
      const res = await fetch(`/api/outreach/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'replied' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLocalOutreach(prev => prev.map(m => m.id === id ? { ...m, status: 'replied', reply_received_at: updated.reply_received_at } : m))
      }
    } finally {
      setMarking(null)
    }
  }

  const updateMessage = (id: string, updates: { content: string; subject?: string }) => {
    setLocalOutreach(prev => prev.map(m =>
      String(m.id) === id ? { ...m, ...updates } : m
    ))
  }

  // Group messages by contact
  const grouped: Record<string, Record<string, any>[]> = {}
  const noContact: Record<string, any>[] = []
  for (const msg of localOutreach) {
    const key = msg.contact_id
      ? msg.contact_name || msg.contacts?.full_name || msg.contacts?.name || msg.contact_id
      : null
    if (key) {
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(msg)
    } else {
      noContact.push(msg)
    }
  }

  const statusBadge = (msg: Record<string, any>) => {
    if (msg.status === 'replied') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    if (msg.status === 'sent') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    return 'bg-slate-700 text-slate-400 border-slate-600'
  }

  const aiResultLabels: Record<string, string> = {
    connection_request: 'LinkedIn Connection Request',
    follow_up_message: 'LinkedIn Follow-up (after connection)',
    subject: 'Email Subject',
    first_email: 'First Email',
    follow_up_subject: 'Follow-up Subject',
    follow_up_email: 'Follow-up Email (7 days)',
    request_to_connector: 'Request to Mutual Connection',
    suggested_intro_text: 'Suggested Intro Text',
    message: 'Message',
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="ghost" onClick={() => onGenerate('linkedin')}>
          <Sparkles className="h-3.5 w-3.5" /> LinkedIn
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onGenerate('email')}>
          <Sparkles className="h-3.5 w-3.5" /> Email
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onGenerate('warm_intro')}>
          <Sparkles className="h-3.5 w-3.5" /> Warm Intro
        </Button>
        {justSaved && (
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs">
            Saved to Outreach tab ✓
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
          Generating outreach…
        </div>
      )}

      {aiResult && !loading && (
        <div className="space-y-3">
          {Object.entries(aiResult).map(([key, value]) => {
            if (!value || typeof value !== 'string') return null
            return (
              <div key={key} className="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-cyan-400 uppercase tracking-wide">{aiResultLabels[key] || key}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">Saved ✓</span>
                    <button
                      onClick={() => copy(value, key)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {copied === key ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{value}</p>
              </div>
            )
          })}
        </div>
      )}

      {localOutreach.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Saved Messages</h3>
          <div className="space-y-4">
            {/* Contact-linked messages grouped */}
            {Object.entries(grouped).map(([contactLabel, msgs]) => (
              <div key={contactLabel}>
                <div className="text-xs text-slate-500 font-medium mb-1.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-slate-600 rounded-full" />
                  {contactLabel}
                  {msgs[0]?.contact_title && (
                    <span className="text-slate-600">· {msgs[0].contact_title}</span>
                  )}
                </div>
                <div className="space-y-2 pl-3 border-l border-slate-700/50">
                  {msgs.map(msg => (
                    <OutreachMessageCard
                      key={String(msg.id)}
                      msg={msg}
                      marking={marking}
                      copied={copied}
                      statusBadge={statusBadge}
                      onMarkSent={markSent}
                      onMarkReplied={markReplied}
                      onCopy={copy}
                      onUpdate={updateMessage}
                    />
                  ))}
                </div>
              </div>
            ))}
            {/* Company-level messages (no contact) */}
            {noContact.length > 0 && (
              <div>
                {Object.keys(grouped).length > 0 && (
                  <div className="text-xs text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    Company-level
                  </div>
                )}
                <div className={cn('space-y-2', Object.keys(grouped).length > 0 && 'pl-3 border-l border-slate-700/50')}>
                  {noContact.map(msg => (
                    <OutreachMessageCard
                      key={String(msg.id)}
                      msg={msg}
                      marking={marking}
                      copied={copied}
                      statusBadge={statusBadge}
                      onMarkSent={markSent}
                      onMarkReplied={markReplied}
                      onCopy={copy}
                      onUpdate={updateMessage}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OutreachMessageCard({ msg, marking, copied, statusBadge, onMarkSent, onMarkReplied, onCopy, onUpdate }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  msg: Record<string, any>
  marking: string | null
  copied: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statusBadge: (msg: Record<string, any>) => string
  onMarkSent: (id: string) => void
  onMarkReplied: (id: string) => void
  onCopy: (text: string, key: string) => void
  onUpdate: (id: string, updates: { content: string; subject?: string }) => void
}) {
  const msgId = String(msg.id)
  const content = parseOutreachContent(String(msg.content || ''))
  const contactDisplay = msg.contact_name || msg.contacts?.full_name || msg.contacts?.name

  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [editSubject, setEditSubject] = useState(String(msg.subject || ''))
  const [saving, setSaving] = useState(false)

  const saveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/outreach/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, subject: editSubject || undefined }),
      })
      if (res.ok) {
        onUpdate(msgId, { content: editContent, subject: editSubject || undefined })
        setEditing(false)
        setExpanded(true)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] border', statusBadge(msg))}>
            {String(msg.message_type)}
          </span>
          {msg.status === 'replied' && msg.reply_received_at && (
            <span className="text-[10px] text-emerald-400">✓ Replied {formatDate(msg.reply_received_at as string)}</span>
          )}
          {msg.status === 'sent' && !msg.reply_received_at && msg.sent_at && (
            <span className="text-[10px] text-cyan-400">Sent {formatDate(msg.sent_at as string)}</span>
          )}
          {msg.status === 'draft' && (
            <span className="text-[10px] text-slate-600">Draft</span>
          )}
          {contactDisplay && !msg.contact_name && (
            <span className="text-[10px] text-slate-500">{contactDisplay}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600">{formatDate(msg.created_at as string)}</span>
          {/* Edit button */}
          {!editing && (
            <button
              onClick={() => { setEditing(true); setExpanded(true); setEditContent(content); setEditSubject(String(msg.subject || '')) }}
              className="text-slate-600 hover:text-slate-300 transition-colors"
              title="Edit"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
          {/* Copy button */}
          {content && !editing && (
            <button
              onClick={() => onCopy(content, msgId)}
              className="text-slate-600 hover:text-slate-300 transition-colors"
              title="Copy"
            >
              {copied === msgId ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          {/* Expand/collapse button */}
          {!editing && content && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-slate-600 hover:text-slate-300 transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded
                ? <ChevronUp className="h-3.5 w-3.5" />
                : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Subject */}
      {editing ? (
        <input
          value={editSubject}
          onChange={e => setEditSubject(e.target.value)}
          placeholder="Subject line…"
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 mb-2"
        />
      ) : (
        msg.subject && <div className="text-xs text-slate-400 mb-1 font-medium">{String(msg.subject)}</div>
      )}

      {/* Content */}
      {editing ? (
        <textarea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={8}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-y leading-relaxed"
        />
      ) : expanded ? (
        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{content}</p>
      ) : (
        <p
          className="text-xs text-slate-500 line-clamp-2 cursor-pointer hover:text-slate-400 transition-colors"
          onClick={() => setExpanded(true)}
          title="Click to expand"
        >
          {content}
        </p>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/50">
        {editing ? (
          <>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="text-xs text-cyan-500 hover:text-cyan-300 disabled:opacity-50 flex items-center gap-1 font-medium"
            >
              <Save className="h-3 w-3" />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => { setEditing(false); setEditContent(content); setEditSubject(String(msg.subject || '')) }}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {msg.status !== 'sent' && msg.status !== 'replied' && (
              <button
                onClick={() => onMarkSent(msgId)}
                disabled={marking === msgId + '_sent'}
                className="text-xs text-cyan-500 hover:text-cyan-300 disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                {marking === msgId + '_sent' ? 'Saving…' : 'Mark Sent'}
              </button>
            )}
            {msg.status === 'sent' && (
              <button
                onClick={() => onMarkReplied(msgId)}
                disabled={marking === msgId + '_replied'}
                className="text-xs text-emerald-500 hover:text-emerald-300 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {marking === msgId + '_replied' ? 'Saving…' : 'Mark Replied'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MeetingsTab({ meetings, meetingBrief, loading, onGenerateBrief, onAdd }: {
  meetings: Record<string, any>[]
  meetingBrief: Record<string, string> | null
  loading: boolean
  onGenerateBrief: () => void
  onAdd: () => void
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onGenerateBrief} loading={loading}>
          <Sparkles className="h-3.5 w-3.5" /> Meeting Brief
        </Button>
        <Button size="sm" variant="primary" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Log Meeting
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
          Generating meeting brief…
        </div>
      )}

      {meetingBrief?.content && !loading && (
        <div className="bg-slate-800 border border-cyan-500/30 rounded-lg p-4">
          <h3 className="text-xs font-medium text-cyan-400 uppercase tracking-wide mb-3">AI Meeting Brief</h3>
          <div
            className="ai-content text-sm text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(meetingBrief.content) }}
          />
        </div>
      )}

      {meetings.map(meeting => (
        <div key={String(meeting.id)} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-medium text-slate-200">{formatDate(meeting.meeting_date as string)}</div>
              {meeting.participants && <div className="text-xs text-slate-500 mt-0.5">{String(meeting.participants)}</div>}
            </div>
          </div>
          {meeting.objective && (
            <div>
              <div className="text-xs text-slate-600 mb-1">Objective</div>
              <p className="text-sm text-slate-400">{String(meeting.objective)}</p>
            </div>
          )}
          {meeting.notes && (
            <div className="mt-2">
              <div className="text-xs text-slate-600 mb-1">Notes</div>
              <p className="text-sm text-slate-400 whitespace-pre-wrap">{String(meeting.notes)}</p>
            </div>
          )}
          {meeting.action_points && (
            <div className="mt-2 bg-cyan-500/10 border border-cyan-500/20 rounded p-2">
              <div className="text-xs text-cyan-400 mb-1">Action Points</div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{String(meeting.action_points)}</p>
            </div>
          )}
        </div>
      ))}

      {meetings.length === 0 && !meetingBrief && !loading && (
        <div className="text-center py-8 text-slate-600">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No meetings logged yet</p>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActivityTab({ activity, onLogOutreach }: { activity: Record<string, any>[]; onLogOutreach: () => void }) {
  const icons: Record<string, React.ReactNode> = {
    stage_change: <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />,
    priority_change: <Target className="h-3.5 w-3.5 text-amber-400" />,
    ai_research: <Sparkles className="h-3.5 w-3.5 text-purple-400" />,
    ai_scoring: <Sparkles className="h-3.5 w-3.5 text-purple-400" />,
    ai_outreach: <MessageSquare className="h-3.5 w-3.5 text-blue-400" />,
    ai_meeting_brief: <FileText className="h-3.5 w-3.5 text-teal-400" />,
    company_created: <Plus className="h-3.5 w-3.5 text-emerald-400" />,
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-300">Activity Log</h3>
        <Button size="sm" variant="primary" onClick={onLogOutreach}>
          <Plus className="h-3.5 w-3.5" /> Log Outreach
        </Button>
      </div>
      {activity.length === 0 && (
        <div className="text-center py-8 text-slate-600">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No activity yet</p>
        </div>
      )}
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-700" />
        <div className="space-y-3">
          {activity.map(item => (
            <div key={String(item.id)} className="flex items-start gap-3 pl-8 relative">
              <div className="absolute left-2 top-1 w-3 h-3 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center">
                {icons[String(item.activity_type)] || <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />}
              </div>
              <div>
                <p className="text-sm text-slate-300">{String(item.description)}</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatDateRelative(item.created_at as string)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Target({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-•] (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
}
