'use client'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EngagedModal } from '@/components/origination/engaged-modal'
import { formatDateRelative } from '@/lib/utils'
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock, Lock, CheckCircle2, RefreshCw } from 'lucide-react'

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; icon: React.ReactNode; label: string }> = {
  Draft:            { variant: 'default',  icon: <Clock className="w-3 h-3" />,          label: 'Draft' },
  'Pending Approval': { variant: 'warning', icon: <AlertTriangle className="w-3 h-3" />,  label: 'Pending Approval' },
  Approved:         { variant: 'success',  icon: <CheckCircle2 className="w-3 h-3" />,    label: 'Approved' },
  Rejected:         { variant: 'danger',   icon: <ShieldAlert className="w-3 h-3" />,     label: 'Rejected' },
  'Change Requested': { variant: 'warning', icon: <AlertTriangle className="w-3 h-3" />,  label: 'Change Requested' },
  Locked:           { variant: 'info',     icon: <Lock className="w-3 h-3" />,            label: 'Locked' },
}

interface Origination {
  id: string; approval_status: string; engagement_type: string; engagement_date: string
  engagement_summary: string; opportunity_creator_name: string; opportunity_creator_type: string
  warm_intro_source_name: string | null; origination_notes: string | null
  owner: { full_name: string | null; email: string | null } | null
}

interface Allocation {
  id: string; contributor_name: string; contributor_type: string
  contribution_role: string; allocation_percentage: number; approval_status: string
}

interface AuditEntry {
  id: string; action: string; reason: string | null; created_at: string
  actor: { full_name: string | null; email: string | null } | null
}

export function OriginationTab({ companyId, companyName, companyStage }: {
  companyId: string; companyName: string; companyStage: string
}) {
  const [origination, setOrigination] = useState<Origination | null>(null)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)
  const [reopenReason, setReopenReason] = useState('')
  const [showReopenInput, setShowReopenInput] = useState(false)

  const fetch_ = () => {
    setLoading(true)
    fetch(`/api/origination/${companyId}`)
      .then(r => r.json())
      .then(data => {
        setOrigination(data.origination)
        setAllocations(data.allocations || [])
        setAuditLog(data.auditLog || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch_() }, [companyId])

  const totalAllocation = allocations.reduce((s, a) => s + Number(a.allocation_percentage), 0)
  const allocationValid = Math.abs(totalAllocation - 8) < 0.01

  const action = async (actionName: string, reason?: string) => {
    if (!origination) return
    setActioning(actionName)
    try {
      const res = await fetch(`/api/origination/${origination.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName, reason }),
      })
      if (res.ok) fetch_()
    } finally {
      setActioning(null)
    }
  }

  const handleCreate = async (data: { origination: Record<string, unknown>; allocations: unknown[] }) => {
    const res = await fetch('/api/origination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setShowCreate(false)
    fetch_()
  }

  if (loading) {
    return <div className="p-5 text-sm text-slate-500">Loading origination…</div>
  }

  const statusCfg = origination ? (STATUS_CONFIG[origination.approval_status] || STATUS_CONFIG['Draft']) : null

  return (
    <div className="p-5 max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">Origination</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetch_} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {!origination && (
            <Button size="sm" variant="primary" onClick={() => setShowCreate(true)}>
              Add Origination
            </Button>
          )}
        </div>
      </div>

      {!origination ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-4 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-300">No origination record</div>
            <div className="text-xs text-amber-400/70 mt-1">
              {['Engaged', 'Meeting Booked', 'Discovery Completed', 'Proposal / Agreement', 'Signed', 'Onboarding'].includes(companyStage)
                ? 'This company is in an active stage but has no origination record. This should be resolved.'
                : 'Origination details are required when moving to Engaged.'}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Status banner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={statusCfg!.variant}>
                <span className="flex items-center gap-1">{statusCfg!.icon} {origination.approval_status}</span>
              </Badge>
              {!allocationValid && (
                <Badge variant="danger">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Allocation Error</span>
                </Badge>
              )}
              {allocationValid && origination.approval_status === 'Approved' && (
                <Badge variant="success">Total 8% Confirmed</Badge>
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
              {origination.approval_status === 'Draft' && (
                <Button size="sm" variant="ghost" loading={actioning === 'Submit'} onClick={() => action('Submit')}>
                  Submit for Approval
                </Button>
              )}
              {origination.approval_status === 'Pending Approval' && (
                <>
                  <Button size="sm" variant="primary" loading={actioning === 'Approve'} onClick={() => action('Approve')}>Approve</Button>
                  <Button size="sm" variant="ghost" loading={actioning === 'Reject'} onClick={() => action('Reject')}>Reject</Button>
                  <Button size="sm" variant="ghost" loading={actioning === 'RequestChange'} onClick={() => action('RequestChange')}>Request Change</Button>
                </>
              )}
              {origination.approval_status === 'Approved' && (
                <Button size="sm" variant="ghost" loading={actioning === 'Lock'} onClick={() => action('Lock')}>Lock</Button>
              )}
              {origination.approval_status === 'Locked' && (
                <div className="flex items-center gap-2">
                  {showReopenInput ? (
                    <>
                      <input
                        value={reopenReason}
                        onChange={e => setReopenReason(e.target.value)}
                        placeholder="Reason for reopening…"
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 w-48"
                      />
                      <Button size="sm" variant="ghost" loading={actioning === 'Reopen'} onClick={() => { action('Reopen', reopenReason); setShowReopenInput(false) }} disabled={!reopenReason.trim()}>
                        Confirm Reopen
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setShowReopenInput(true)}>Reopen</Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg divide-y divide-slate-700">
            {[
              { label: 'Opportunity Creator', value: `${origination.opportunity_creator_name} (${origination.opportunity_creator_type})` },
              { label: 'Owner', value: origination.owner?.full_name || origination.owner?.email || '—' },
              { label: 'Engagement Type', value: origination.engagement_type },
              { label: 'Engagement Date', value: origination.engagement_date },
              { label: 'Warm Intro Source', value: origination.warm_intro_source_name || '—' },
              { label: 'Engagement Summary', value: origination.engagement_summary },
              { label: 'Notes', value: origination.origination_notes || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 px-4 py-2.5">
                <span className="text-xs text-slate-500 w-36 flex-shrink-0">{label}</span>
                <span className="text-xs text-slate-300 flex-1">{value}</span>
              </div>
            ))}
          </div>

          {/* Commission allocation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Commission Allocation</h3>
              <span className={`text-sm font-bold tabular-nums ${allocationValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalAllocation.toFixed(2)}% / 8.00%
              </span>
            </div>
            <p className="text-xs text-slate-600 italic">
              This records proposed origination allocation for internal review. Final entitlement is subject to SHMA agreement and approval.
            </p>
            {allocations.map(a => (
              <div key={a.id} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200">{a.contributor_name}</div>
                  <div className="text-xs text-slate-500">{a.contributor_type} · {a.contribution_role}</div>
                </div>
                <div className="text-sm font-bold text-cyan-400 tabular-nums flex-shrink-0">{Number(a.allocation_percentage).toFixed(2)}%</div>
              </div>
            ))}
          </div>

          {/* Audit log */}
          {auditLog.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Audit History</h3>
              <div className="space-y-1.5">
                {auditLog.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 text-xs">
                    <span className="text-slate-500 flex-shrink-0 w-24">{formatDateRelative(entry.created_at)}</span>
                    <span className="text-slate-300 font-medium flex-shrink-0">{entry.action}</span>
                    <span className="text-slate-500">{entry.actor?.full_name || entry.actor?.email || 'Unknown'}</span>
                    {entry.reason && <span className="text-slate-600 italic">· {entry.reason}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <EngagedModal
          open={showCreate}
          companyId={companyId}
          companyName={companyName}
          onClose={() => setShowCreate(false)}
          onConfirm={handleCreate}
        />
      )}
    </div>
  )
}
