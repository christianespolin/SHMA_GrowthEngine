'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ENGAGEMENT_TYPES = [
  'Direct response', 'Warm intro', 'Meeting dialogue', 'Email reply',
  'LinkedIn reply', 'Phone conversation', 'Existing relationship', 'Other',
]

const CONTRIBUTOR_TYPES = ['User', 'Contact', 'Partner Company', 'External Person', 'External Company']

const CONTRIBUTION_ROLES = [
  'Opportunity Creator', 'Warm Introduction', 'Relationship Owner',
  'Research Contributor', 'Outreach Contributor', 'Closer', 'Other',
]

interface Allocation {
  contributor_type: string
  contributor_name: string
  contribution_role: string
  allocation_percentage: number
  allocation_basis: string
}

interface EngagedModalProps {
  open: boolean
  companyId: string
  companyName: string
  onClose: () => void
  onConfirm: (data: { origination: Record<string, unknown>; allocations: Allocation[] }) => Promise<void>
}

export function EngagedModal({ open, companyId, companyName, onClose, onConfirm }: EngagedModalProps) {
  const [engagementType, setEngagementType] = useState('Direct response')
  const [engagementDate, setEngagementDate] = useState(new Date().toISOString().split('T')[0])
  const [engagedContactName, setEngagedContactName] = useState('')
  const [engagementSummary, setEngagementSummary] = useState('')
  const [opportunityCreatorName, setOpportunityCreatorName] = useState('')
  const [opportunityCreatorType, setOpportunityCreatorType] = useState('User')
  const [ownerName, setOwnerName] = useState('')
  const [warmIntroSource, setWarmIntroSource] = useState('')
  const [originationNotes, setOriginationNotes] = useState('')
  const [allocations, setAllocations] = useState<Allocation[]>([
    { contributor_type: 'User', contributor_name: '', contribution_role: 'Opportunity Creator', allocation_percentage: 8, allocation_basis: '' }
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalAllocation = allocations.reduce((s, a) => s + Number(a.allocation_percentage), 0)
  const allocationValid = Math.abs(totalAllocation - 8) < 0.01
  const hasCreator = allocations.some(a => a.contribution_role === 'Opportunity Creator')

  const addAllocation = () => {
    setAllocations(prev => [...prev, { contributor_type: 'User', contributor_name: '', contribution_role: 'Other', allocation_percentage: 0, allocation_basis: '' }])
  }

  const updateAllocation = (i: number, field: keyof Allocation, value: string | number) => {
    setAllocations(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  const removeAllocation = (i: number) => {
    setAllocations(prev => prev.filter((_, idx) => idx !== i))
  }

  const isValid = engagementType && engagementDate && engagementSummary.trim() &&
    opportunityCreatorName.trim() && ownerName.trim() &&
    allocationValid && hasCreator

  const handleConfirm = async () => {
    if (!isValid) return
    setError(null)
    setSaving(true)
    try {
      await onConfirm({
        origination: {
          company_id: companyId,
          engagement_type: engagementType,
          engagement_date: engagementDate,
          engagement_summary: engagementSummary,
          opportunity_creator_type: opportunityCreatorType,
          opportunity_creator_name: opportunityCreatorName,
          owner_id: null, // Will be resolved server-side if needed
          warm_intro_source_name: warmIntroSource || null,
          origination_notes: originationNotes || null,
          // Denormalize owner name for display — owner_id set to creator's id in API
          _owner_name: ownerName,
        },
        allocations,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirm Engaged Stage" size="xl">
      <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-300">Engaged stage requires origination details</div>
            <div className="text-xs text-amber-400/70 mt-0.5">
              Moving <strong>{companyName}</strong> to Engaged. All required fields must be completed.
              Origination commission allocation must total exactly 8.00%.
            </div>
          </div>
        </div>

        {/* Engagement details */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Engagement Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Engagement Type *</label>
              <select value={engagementType} onChange={e => setEngagementType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                {ENGAGEMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Input label="Engagement Date *" type="date" value={engagementDate} onChange={e => setEngagementDate(e.target.value)} />
          </div>
          <Input label="Engaged Contact Name" placeholder="Name of the person who engaged" value={engagedContactName} onChange={e => setEngagedContactName(e.target.value)} />
          <Textarea label="Engagement Summary *" placeholder="Describe how the engagement happened and what was discussed…" value={engagementSummary} onChange={e => setEngagementSummary(e.target.value)} rows={3} />
        </div>

        {/* Opportunity Creator & Owner */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Opportunity Creator & Owner</h3>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Creator Type *</label>
                <select value={opportunityCreatorType} onChange={e => setOpportunityCreatorType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                  {CONTRIBUTOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <Input label="Opportunity Creator Name *" placeholder="Exactly one person or company" value={opportunityCreatorName} onChange={e => setOpportunityCreatorName(e.target.value)} />
            </div>
            <p className="text-xs text-amber-400/70">⚠ Opportunity Creator is a legally significant field. Must be exactly one entity and will require approval.</p>
          </div>
          <Input label="Owner (operational) *" placeholder="Who owns progressing this opportunity?" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
          <Input label="Warm Intro Source" placeholder="Person or company who provided introduction (optional)" value={warmIntroSource} onChange={e => setWarmIntroSource(e.target.value)} />
        </div>

        {/* Commission Allocation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Origination Commission Allocation *</h3>
            <div className={cn('text-sm font-bold tabular-nums', allocationValid ? 'text-emerald-400' : 'text-rose-400')}>
              {totalAllocation.toFixed(2)}% / 8.00%
            </div>
          </div>
          <p className="text-xs text-slate-600 italic">
            This records proposed origination allocation for internal review. Final entitlement is subject to SHMA agreement and approval.
          </p>
          <div className="space-y-2">
            {allocations.map((a, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-3 grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Contributor</label>
                  <input value={a.contributor_name} onChange={e => updateAllocation(i, 'contributor_name', e.target.value)}
                    placeholder="Name"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select value={a.contributor_type} onChange={e => updateAllocation(i, 'contributor_type', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50">
                    {CONTRIBUTOR_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Role</label>
                  <select value={a.contribution_role} onChange={e => updateAllocation(i, 'contribution_role', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50">
                    {CONTRIBUTION_ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">% Allocation</label>
                  <input type="number" step="0.01" min="0" max="8" value={a.allocation_percentage}
                    onChange={e => updateAllocation(i, 'allocation_percentage', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="col-span-2 flex justify-end">
                  {allocations.length > 1 && (
                    <button onClick={() => removeAllocation(i)} className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={addAllocation} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add contributor
            </button>
          </div>
          {!allocationValid && (
            <p className="text-xs text-rose-400">Total must be exactly 8.00% (currently {totalAllocation.toFixed(2)}%)</p>
          )}
          {!hasCreator && (
            <p className="text-xs text-rose-400">Opportunity Creator must be included in the allocation</p>
          )}
        </div>

        {/* Notes */}
        <Textarea label="Legal / Origination Notes" placeholder="Any additional context, caveats or legal notes…" value={originationNotes} onChange={e => setOriginationNotes(e.target.value)} rows={2} />

        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* Validation summary */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { label: 'Engagement summary', ok: !!engagementSummary.trim() },
            { label: 'Opportunity Creator', ok: !!opportunityCreatorName.trim() },
            { label: 'Owner', ok: !!ownerName.trim() },
            { label: 'Allocation = 8%', ok: allocationValid },
            { label: 'Creator in allocation', ok: hasCreator },
          ].map(({ label, ok }) => (
            <div key={label} className={cn('flex items-center gap-1', ok ? 'text-emerald-400' : 'text-slate-600')}>
              <span>{ok ? '✓' : '○'}</span> {label}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="primary" className="flex-1" loading={saving} onClick={handleConfirm} disabled={!isValid}>
            Confirm Engaged — Save Origination
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}
