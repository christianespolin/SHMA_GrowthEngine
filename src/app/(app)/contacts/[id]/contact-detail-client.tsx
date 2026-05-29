'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User,
  Mail,
  Phone,
  Smartphone,
  Link2,
  Building2,
  Sparkles,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Tag,
  Shield,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props {
  contact: Record<string, any>
  company: Record<string, any> | null
  outreach: Record<string, any>[]
}

function getRoleCategoryBadge(role: string | null) {
  if (!role) return 'muted'
  const lower = role.toLowerCase()
  if (lower.includes('executive')) return 'purple'
  if (lower.includes('commercial') || lower.includes('strategy')) return 'blue'
  if (lower.includes('service') || lower.includes('operations')) return 'amber'
  if (lower.includes('product') || lower.includes('technology')) return 'cyan'
  if (lower.includes('finance') || lower.includes('ownership')) return 'emerald'
  return 'muted'
}

function RoleCategoryBadge({ role }: { role: string | null }) {
  if (!role) return null
  const color = getRoleCategoryBadge(role)
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    muted: 'bg-slate-600/50 text-slate-400 border-slate-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorMap[color] || colorMap.muted}`}>
      {role}
    </span>
  )
}

function ContactStatusBadge({ status }: { status: string | null }) {
  if (!status) return null
  const map: Record<string, string> = {
    'Validated': 'success',
    'Needs validation': 'warning',
    'Suggested role': 'muted',
    'Rejected': 'danger',
    'Do not contact': 'danger',
  }
  return <Badge variant={(map[status] as 'success' | 'warning' | 'muted' | 'danger') || 'muted'}>{status}</Badge>
}

function GdprBadge({ status }: { status: string | null }) {
  if (!status) return null
  const map: Record<string, string> = {
    'Not reviewed': 'muted',
    'Compliant': 'success',
    'Requires action': 'warning',
  }
  return <Badge variant={(map[status] as 'muted' | 'success' | 'warning') || 'muted'}>{status}</Badge>
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  if (score == null) return null
  const pct = (score / 5) * 100
  const color = score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-500' : 'bg-rose-500'
  const textColor = score >= 4 ? 'text-emerald-400' : score >= 3 ? 'text-amber-400' : 'text-rose-400'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`text-xs font-semibold tabular-nums ${textColor}`}>{score}/5</span>
      </div>
      <div className="w-full h-1.5 rounded bg-slate-700">
        <div className={`h-1.5 rounded ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EmailStatusChip({ status }: { status: string | null }) {
  if (!status) return null
  const map: Record<string, string> = {
    'Verified': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Unverified': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Pattern guess': 'bg-slate-600/50 text-slate-400 border-slate-600',
    'Unknown': 'bg-slate-700 text-slate-500 border-slate-700',
  }
  const cls = map[status] || map['Unknown']
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${cls}`}>
      {status}
    </span>
  )
}

function ValidationTaskList({ tasks }: { tasks: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  if (!tasks || tasks.length === 0) return null
  return (
    <div className="space-y-2">
      {tasks.map((task, i) => (
        <div
          key={i}
          className="flex items-start gap-2 cursor-pointer group"
          onClick={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
        >
          <div className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border transition-colors ${
            checked[i]
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-slate-600 group-hover:border-slate-400'
          }`}>
            {checked[i] && (
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-white">
                <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className={`text-sm transition-colors ${checked[i] ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
            {task}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ContactDetailClient({ contact, company, outreach }: Props) {
  const [localOutreach, setLocalOutreach] = useState(outreach)
  const [marking, setMarking] = useState<string | null>(null)
  const [gdprExpanded, setGdprExpanded] = useState(false)

  const validationTasks: string[] = Array.isArray(contact.validation_tasks) ? contact.validation_tasks : []
  const missingInfo: string[] = Array.isArray(contact.missing_information) ? contact.missing_information : []
  const hasValidation = validationTasks.length > 0 || missingInfo.length > 0

  const markSent = async (id: string) => {
    setMarking(id)
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

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const contactName = contact.full_name || contact.name || 'Unknown'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-5 space-y-5">

        {/* Section A — Identity */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-slate-300">{initials(contactName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-slate-100">{contactName}</h2>
              <RoleCategoryBadge role={contact.role_category} />
              <ContactStatusBadge status={contact.contact_status} />
              <GdprBadge status={contact.gdpr_status} />
            </div>
            <div className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              {contact.title || contact.role ? (
                <span>{contact.title || contact.role}</span>
              ) : null}
              {contact.seniority ? <span className="text-slate-600">·</span> : null}
              {contact.seniority ? <span>{contact.seniority}</span> : null}
              {contact.department ? <span className="text-slate-600">·</span> : null}
              {contact.department ? <span>{contact.department}</span> : null}
              {company ? (
                <>
                  <span className="text-slate-600">·</span>
                  <Link href={`/companies/${company.id}`} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {company.name}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Section B — Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Contact information */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contact Information</h3>

            {contact.suggested_role_to_find && !contact.full_name && (
              <div className="flex items-center gap-2 text-amber-400/80 text-sm">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Role to find: <span className="font-medium">{contact.suggested_role_to_find}</span></span>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-sm text-cyan-400 hover:text-cyan-300 truncate flex-1">{contact.email}</a>
                <EmailStatusChip status={contact.email_status} />
              </div>
            )}

            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <a href={`tel:${contact.phone}`} className="text-sm text-slate-300 flex-1">{contact.phone}</a>
                <EmailStatusChip status={contact.phone_status} />
              </div>
            )}

            {contact.mobile && (
              <div className="flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <a href={`tel:${contact.mobile}`} className="text-sm text-slate-300 flex-1">{contact.mobile}</a>
                <EmailStatusChip status={contact.mobile_status} />
              </div>
            )}

            {contact.linkedin_url && (
              <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 truncate flex-1">
                  LinkedIn Profile
                </a>
                <EmailStatusChip status={contact.linkedin_status} />
              </div>
            )}

            {contact.source_type && (
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-sm text-slate-400">{contact.source_type}</span>
                {contact.source_url && (
                  <a href={contact.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300">
                    source
                  </a>
                )}
              </div>
            )}

            {!contact.email && !contact.phone && !contact.mobile && !contact.linkedin_url && !contact.suggested_role_to_find && (
              <p className="text-sm text-slate-600">No contact information available</p>
            )}
          </div>

          {/* Right: AI Scores */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">AI Scores</h3>
            {contact.decision_power_score || contact.shma_relevance_score || contact.outreach_fit_score || contact.confidence_score ? (
              <div className="space-y-3">
                <ScoreBar label="Decision Power" score={contact.decision_power_score} />
                <ScoreBar label="SHMA Relevance" score={contact.shma_relevance_score} />
                <ScoreBar label="Outreach Fit" score={contact.outreach_fit_score} />
                <ScoreBar label="Confidence" score={contact.confidence_score} />
              </div>
            ) : (
              <p className="text-sm text-slate-600">No scores available</p>
            )}
          </div>
        </div>

        {/* Section C — AI Intelligence */}
        {(contact.ai_rationale || contact.outreach_angle || contact.recommended_next_action) && (
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-medium text-slate-200">AI Intelligence</h3>
            </div>

            {contact.ai_rationale && (
              <div>
                <div className="text-xs font-medium text-cyan-400/60 uppercase tracking-wide mb-1.5">Why this contact matters</div>
                <p className="text-sm text-slate-300 leading-relaxed">{contact.ai_rationale}</p>
              </div>
            )}

            {contact.outreach_angle && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-400/60 uppercase tracking-wide mb-1.5">
                  <MessageSquare className="h-3 w-3" />
                  Outreach angle
                </div>
                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded p-3">
                  <p className="text-sm text-slate-300 leading-relaxed">{contact.outreach_angle}</p>
                </div>
              </div>
            )}

            {contact.recommended_next_action && (
              <div className="flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-cyan-400/60 uppercase tracking-wide mb-1">Recommended next action</div>
                  <p className="text-sm text-slate-300">{contact.recommended_next_action}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section D — Validation & Gaps */}
        {hasValidation && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Validation & Gaps</h3>

            {validationTasks.length > 0 && (
              <div>
                <div className="text-xs text-slate-600 mb-2 uppercase tracking-wide">Validation tasks</div>
                <ValidationTaskList tasks={validationTasks} />
              </div>
            )}

            {missingInfo.length > 0 && (
              <div>
                <div className="text-xs text-slate-600 mb-2 uppercase tracking-wide">Missing information</div>
                <div className="space-y-1.5">
                  {missingInfo.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-400/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section E — Outreach History */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-medium text-slate-200">Outreach History ({localOutreach.length})</h3>
          </div>

          {localOutreach.length === 0 && (
            <p className="text-sm text-slate-600">No outreach yet — generate from the Outreach tab</p>
          )}

          {localOutreach.map(msg => {
            const msgId = String(msg.id)
            const typeColors: Record<string, string> = {
              email: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
              linkedin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
              follow_up: 'bg-slate-600/50 text-slate-400 border-slate-600',
            }
            const statusColors: Record<string, string> = {
              draft: 'bg-slate-600/50 text-slate-400 border-slate-600',
              sent: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              replied: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            }
            const typeColor = typeColors[String(msg.message_type)] || typeColors.follow_up
            const statusColor = statusColors[String(msg.status)] || statusColors.draft

            return (
              <div key={msgId} className="border border-slate-700 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${typeColor}`}>
                      {msg.message_type}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${statusColor}`}>
                      {msg.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600">{formatDate(msg.created_at as string)}</span>
                </div>
                {msg.subject && <div className="text-xs font-medium text-slate-300 truncate">{msg.subject}</div>}
                {msg.content && (
                  <p className="text-xs text-slate-500 line-clamp-2">{String(msg.content).trim()}</p>
                )}
                {msg.status === 'draft' && (
                  <button
                    onClick={() => markSent(msgId)}
                    disabled={marking === msgId}
                    className="text-xs text-cyan-500 hover:text-cyan-300 disabled:opacity-50 flex items-center gap-1 mt-1"
                  >
                    <Send className="h-3 w-3" />
                    {marking === msgId ? 'Saving…' : 'Mark Sent'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Section F — Source & GDPR */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setGdprExpanded(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              Source &amp; GDPR details
            </div>
            {gdprExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {gdprExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pt-3">
                {contact.source_type && (
                  <div>
                    <div className="text-xs text-slate-600 mb-0.5">Source type</div>
                    <div className="text-sm text-slate-300">{contact.source_type}</div>
                  </div>
                )}
                {contact.source_url && (
                  <div>
                    <div className="text-xs text-slate-600 mb-0.5">Source URL</div>
                    <a href={contact.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 truncate block">{contact.source_url}</a>
                  </div>
                )}
                {contact.source_note && (
                  <div className="col-span-2">
                    <div className="text-xs text-slate-600 mb-0.5">Source note</div>
                    <div className="text-sm text-slate-300">{contact.source_note}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-600 mb-0.5">GDPR status</div>
                  <GdprBadge status={contact.gdpr_status} />
                </div>
                {contact.lawful_basis_note && (
                  <div>
                    <div className="text-xs text-slate-600 mb-0.5">Lawful basis</div>
                    <div className="text-sm text-slate-300">{contact.lawful_basis_note}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-600 mb-0.5">Created</div>
                  <div className="text-sm text-slate-400">{formatDate(contact.created_at as string)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-0.5">Updated</div>
                  <div className="text-sm text-slate-400">{formatDate(contact.updated_at as string)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
