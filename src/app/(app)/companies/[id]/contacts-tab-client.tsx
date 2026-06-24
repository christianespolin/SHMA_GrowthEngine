'use client'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ROLE_CATEGORIES, CONTACT_GDPR_STATUSES, CONTACT_STATUSES } from '@/lib/types'
import {
  User, Mail, Phone, Link2, Plus, AlertTriangle, CheckCircle2,
  ExternalLink, Sparkles, ChevronDown, ChevronUp, X, Search,
  ShieldAlert, Copy,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

interface ContactsTabProps {
  companyId: string
  company: AnyRecord
  initialContacts: AnyRecord[]
  initialLatestRun: AnyRecord | null
  brief: AnyRecord | null
  outreach?: AnyRecord[]
}

// ============================================================
// Role category UI config
// ============================================================
const ROLE_CAT_CONFIG: Record<string, { color: string; badge: string }> = {
  'Executive sponsor': { color: 'border-purple-500/40 bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  'Commercial / strategy': { color: 'border-cyan-500/40 bg-cyan-500/5', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  'Service / operations': { color: 'border-emerald-500/40 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  'Product / technology': { color: 'border-blue-500/40 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'Finance / ownership': { color: 'border-amber-500/40 bg-amber-500/5', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'Other influencer': { color: 'border-slate-600 bg-slate-800', badge: 'bg-slate-700 text-slate-300 border-slate-600' },
}

function roleCatConfig(cat: string) {
  return ROLE_CAT_CONFIG[cat] || ROLE_CAT_CONFIG['Other influencer']
}

// ============================================================
// Score bar: 1=red, 2-3=amber, 4-5=green
// ============================================================
function MiniScoreBar({ score, label }: { score: number | null; label: string }) {
  if (!score) return null
  const pct = ((score - 1) / 4) * 100
  const color = score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-4 text-right">{score}</span>
    </div>
  )
}

// ============================================================
// GDPR status badge
// ============================================================
function GdprBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    'Not reviewed': 'bg-slate-700 text-slate-400 border-slate-600',
    'Legitimate interest reviewed': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Consent': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Do not contact': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'Suppression': 'bg-rose-700/20 text-rose-400 border-rose-700/30',
  }
  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] border', cfg[status] || cfg['Not reviewed'])}>
      {status}
    </span>
  )
}

// ============================================================
// Known/hypothesis badge
// ============================================================
function KnownBadge({ value }: { value: string }) {
  const cfg: Record<string, string> = {
    'Known contact': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Suggested role': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Hypothesis': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Needs validation': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  }
  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] border', cfg[value] || cfg['Suggested role'])}>
      {value}
    </span>
  )
}

// ============================================================
// Email status badge
// ============================================================
function EmailStatusBadge({ status }: { status: string }) {
  if (!status || status === 'Unknown') return null
  const cfg: Record<string, string> = {
    'Verified': 'bg-emerald-500/20 text-emerald-300',
    'Unverified': 'bg-slate-700 text-slate-400',
    'Pattern guess': 'bg-amber-500/20 text-amber-300',
  }
  return (
    <span className={cn('px-1 py-0.5 rounded text-[10px]', cfg[status] || cfg['Unverified'])}>
      {status === 'Pattern guess' ? '⚠ Pattern guess' : status}
    </span>
  )
}

// ============================================================
// Suggestion Card
// ============================================================
function SuggestionCard({
  suggestion,
  onAccept,
  onSaveLater,
  onReject,
}: {
  suggestion: AnyRecord
  onAccept: (s: AnyRecord) => void
  onSaveLater: (s: AnyRecord) => void
  onReject: (s: AnyRecord) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cat = suggestion.role_category || 'Other influencer'
  const cfg = roleCatConfig(cat)
  const displayName = suggestion.full_name || null
  const roleToFind = suggestion.suggested_role_to_find

  return (
    <div className={cn('border rounded-lg p-4 space-y-3', cfg.color)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {displayName
              ? <span className="font-medium text-slate-200">{displayName}</span>
              : <span className="text-slate-400 italic">Role to find: {roleToFind || 'Unknown'}</span>
            }
            <KnownBadge value={suggestion.known_or_hypothesis || 'Suggested role'} />
          </div>
          {suggestion.title && (
            <div className="text-xs text-slate-400 mt-0.5">{suggestion.title}</div>
          )}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] border', cfg.badge)}>{cat}</span>
            {suggestion.seniority && <span className="text-[10px] text-slate-500">{suggestion.seniority}</span>}
            {suggestion.department && <span className="text-[10px] text-slate-500">· {suggestion.department}</span>}
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Scores */}
      <div className="space-y-1">
        <MiniScoreBar score={suggestion.decision_power_score} label="Decision power" />
        <MiniScoreBar score={suggestion.shma_relevance_score} label="SHMA relevance" />
        <MiniScoreBar score={suggestion.outreach_fit_score} label="Outreach fit" />
      </div>

      {/* Contact info */}
      {(suggestion.email || suggestion.linkedin_url || suggestion.phone) && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {suggestion.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>{suggestion.email}</span>
              <EmailStatusBadge status={suggestion.email_status} />
            </div>
          )}
          {suggestion.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {suggestion.phone}
            </span>
          )}
          {suggestion.linkedin_url && (
            <a
              href={suggestion.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400"
            >
              <Link2 className="h-3 w-3" /> LinkedIn <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-slate-700/50">
          {suggestion.ai_rationale && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">AI Rationale</div>
              <p className="text-xs text-slate-300 leading-relaxed">{suggestion.ai_rationale}</p>
            </div>
          )}
          {suggestion.outreach_angle && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Outreach Angle</div>
              <p className="text-xs text-cyan-300 leading-relaxed italic">"{suggestion.outreach_angle}"</p>
            </div>
          )}
          {suggestion.validation_tasks && suggestion.validation_tasks.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Validation Tasks</div>
              <ul className="space-y-0.5">
                {suggestion.validation_tasks.map((task: string, i: number) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <span className="text-slate-600 shrink-0 mt-0.5">☐</span> {task}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {suggestion.missing_information && suggestion.missing_information.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Missing Information</div>
              <ul className="space-y-0.5">
                {suggestion.missing_information.map((info: string, i: number) => (
                  <li key={i} className="text-xs text-amber-400/70 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">·</span> {info}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {suggestion.recommended_next_action && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-2">
              <div className="text-xs font-medium text-cyan-400 mb-0.5">Recommended Next Action</div>
              <p className="text-xs text-slate-300">{suggestion.recommended_next_action}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {suggestion.status === 'Suggested' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="primary" className="flex-1" onClick={() => onAccept(suggestion)}>
            <CheckCircle2 className="h-3 w-3" /> Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSaveLater(suggestion)}>
            Save for later
          </Button>
          <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => onReject(suggestion)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      {suggestion.status === 'Saved for later' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="primary" className="flex-1" onClick={() => onAccept(suggestion)}>
            <CheckCircle2 className="h-3 w-3" /> Accept
          </Button>
          <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => onReject(suggestion)}>
            <X className="h-3 w-3" /> Reject
          </Button>
        </div>
      )}
      {suggestion.status === 'Converted to contact' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Converted to contact
        </div>
      )}
      {suggestion.status === 'Rejected' && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1">
          <X className="h-3.5 w-3.5" /> Rejected
        </div>
      )}
    </div>
  )
}

// ============================================================
// Contact Card (existing confirmed contact)
// ============================================================
function ContactCard({
  contact,
  onEdit,
  onDoNotContact,
  contactOutreach,
}: {
  contact: AnyRecord
  onEdit: (c: AnyRecord) => void
  onDoNotContact: (c: AnyRecord) => void
  contactOutreach?: AnyRecord[]
}) {
  const [generatingOutreach, setGeneratingOutreach] = useState(false)
  const [outreachResult, setOutreachResult] = useState<AnyRecord | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showOutreachHistory, setShowOutreachHistory] = useState(false)

  const cat = contact.role_category || 'Other influencer'
  const outreachCount = contactOutreach?.length || 0
  const cfg = roleCatConfig(cat)

  const generateOutreach = async (messageType: string) => {
    setGeneratingOutreach(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_type: messageType }),
      })
      if (res.ok) {
        const data = await res.json()
        setOutreachResult(data)
      }
    } finally {
      setGeneratingOutreach(false)
    }
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const displayName = contact.full_name || contact.name || 'Unknown'

  return (
    <div className={cn('border rounded-lg p-4 space-y-3', cfg.color)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-200">{displayName}</span>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] border', cfg.badge)}>{cat}</span>
            {contact.gdpr_status && <GdprBadge status={contact.gdpr_status} />}
            {contact.contact_readiness && contact.contact_readiness !== 'Role only' && (
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] border', {
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': contact.contact_readiness === 'Ready for outreach',
                'bg-amber-500/10 text-amber-400 border-amber-500/30': contact.contact_readiness === 'Contact data incomplete',
                'bg-purple-500/10 text-purple-400 border-purple-500/30': contact.contact_readiness === 'Use warm intro',
                'bg-rose-500/10 text-rose-400 border-rose-500/30': contact.contact_readiness === 'Do not contact',
                'bg-slate-700 text-slate-400 border-slate-600': contact.contact_readiness === 'Person identified',
              })}>
                {contact.contact_readiness}
              </span>
            )}
            {contact.warm_intro_available && (
              <span className="px-1.5 py-0.5 rounded text-[10px] border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                🤝 Warm intro
              </span>
            )}
          </div>
          {(contact.title || contact.role) && (
            <div className="text-xs text-slate-400 mt-0.5">{contact.title || contact.role}</div>
          )}
        </div>
        <div className="flex gap-1 items-center">
          {outreachCount > 0 && (
            <button
              onClick={() => setShowOutreachHistory(v => !v)}
              className="text-xs text-cyan-500/80 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/10 transition-colors flex items-center gap-1"
            >
              Outreach ({outreachCount})
              {showOutreachHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          <button
            onClick={() => onEdit(contact)}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDoNotContact(contact)}
            className="text-xs text-rose-500/70 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
          >
            DNC
          </button>
        </div>
      </div>

      {/* Inline outreach history */}
      {showOutreachHistory && contactOutreach && contactOutreach.length > 0 && (
        <div className="border border-slate-700/50 rounded-md overflow-hidden">
          {contactOutreach.map((msg: AnyRecord) => {
            const statusColor = msg.status === 'replied'
              ? 'text-emerald-400'
              : msg.status === 'sent'
              ? 'text-cyan-400'
              : 'text-slate-500'
            return (
              <div key={String(msg.id)} className="flex items-center gap-2 px-2.5 py-1.5 border-b border-slate-700/50 last:border-0 bg-slate-900/40">
                <span className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{String(msg.message_type)}</span>
                <span className="text-[10px] text-slate-400 flex-1 truncate">{msg.subject || msg.content?.slice?.(0, 60) || ''}</span>
                <span className={cn('text-[10px]', statusColor)}>{msg.status}</span>
                <span className="text-[10px] text-slate-600">{msg.created_at ? new Date(msg.created_at as string).toLocaleDateString() : ''}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Scores */}
      {(contact.decision_power_score || contact.outreach_fit_score) && (
        <div className="space-y-1">
          {contact.decision_power_score && <MiniScoreBar score={contact.decision_power_score} label="Decision power" />}
          {contact.outreach_fit_score && <MiniScoreBar score={contact.outreach_fit_score} label="Outreach fit" />}
        </div>
      )}

      {/* Contact info */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        {contact.email && (
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <a href={`mailto:${contact.email}`} className="hover:text-cyan-400">{contact.email}</a>
            {contact.email_status && contact.email_status !== 'Unknown' && (
              <EmailStatusBadge status={contact.email_status} />
            )}
          </div>
        )}
        {contact.phone && (
          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>
        )}
        {contact.mobile && (
          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.mobile} (mobile)</span>
        )}
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-cyan-400">
            <Link2 className="h-3 w-3" /> LinkedIn <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {contact.source_type && (
        <div className="text-[10px] text-slate-600">Source: {contact.source_type}</div>
      )}

      {contact.notes && (
        <p className="text-xs text-slate-500 border-t border-slate-700/50 pt-2">{contact.notes}</p>
      )}

      {/* Generate outreach */}
      {!outreachResult && (
        <div className="flex gap-1.5 pt-1 border-t border-slate-700/50">
          <button
            onClick={() => generateOutreach('linkedin')}
            disabled={generatingOutreach}
            className="text-[11px] text-cyan-500 hover:text-cyan-300 disabled:opacity-50 flex items-center gap-1"
          >
            {generatingOutreach ? (
              <><div className="animate-spin h-3 w-3 border border-cyan-500 border-t-transparent rounded-full" /> Generating…</>
            ) : (
              <><Sparkles className="h-3 w-3" /> LinkedIn</>
            )}
          </button>
          {!generatingOutreach && (
            <>
              <span className="text-slate-700">·</span>
              <button onClick={() => generateOutreach('email')} className="text-[11px] text-cyan-500 hover:text-cyan-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Email
              </button>
              <span className="text-slate-700">·</span>
              <button onClick={() => generateOutreach('call_script')} className="text-[11px] text-cyan-500 hover:text-cyan-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Call script
              </button>
            </>
          )}
        </div>
      )}

      {/* Outreach result */}
      {outreachResult && (
        <div className="border-t border-slate-700/50 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-400">Generated outreach</span>
            <button onClick={() => setOutreachResult(null)} className="text-slate-500 hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {Object.entries(outreachResult).filter(([k]) => k !== 'outreach_message_id').map(([key, value]) => {
            if (!value || typeof value !== 'string') return null
            const labels: Record<string, string> = {
              connection_request: 'LinkedIn Connection Request',
              follow_up_message: 'LinkedIn Follow-up',
              subject: 'Email Subject',
              first_email: 'First Email',
              follow_up_subject: 'Follow-up Subject',
              follow_up_email: 'Follow-up Email',
              opening: 'Opening',
              bridge: 'Bridge',
              hypothesis: 'Hypothesis',
              ask: 'Ask',
              message: 'Message',
            }
            return (
              <div key={key} className="bg-slate-900/50 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">{labels[key] || key}</span>
                  <button onClick={() => copy(value, key)} className="text-slate-600 hover:text-slate-300">
                    {copied === key ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{value}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Find Contacts Modal
// ============================================================
function FindContactsModal({
  company,
  brief,
  existingContacts,
  onClose,
  onComplete,
}: {
  company: AnyRecord
  brief: AnyRecord | null
  existingContacts: AnyRecord[]
  onClose: () => void
  onComplete: (run: AnyRecord, suggestions: AnyRecord[]) => void
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...ROLE_CATEGORIES])
  const [instructions, setInstructions] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [count, setCount] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleCat = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      // Create run
      const createRes = await fetch('/api/contact-discovery/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          criteria_json: {
            target_roles: selectedCategories,
            seniority: 'C-suite, VP and Director level',
            preferred_entry: 'Commercial or service decision-maker',
            pasted_text: pastedText,
            instructions,
            number_requested: count,
            source_types: pastedText ? ['Pasted text'] : ['AI suggested role'],
          },
          source_types: pastedText ? ['Pasted text'] : ['AI suggested role'],
        }),
      })

      if (!createRes.ok) throw new Error('Failed to create run')
      const runData = await createRes.json()

      // Execute run
      const execRes = await fetch(`/api/contact-discovery/runs/${runData.id}/run`, {
        method: 'POST',
      })

      if (!execRes.ok) throw new Error('AI generation failed')
      const result = await execRes.json()

      onComplete(runData, result.suggestions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // LinkedIn search instructions derived from selected categories
  const linkedInTitles = selectedCategories.flatMap(cat => {
    const titleMap: Record<string, string[]> = {
      'Executive sponsor': ['CEO', 'Managing Director', 'President', 'Owner'],
      'Commercial / strategy': ['CCO', 'Head of Sales', 'Head of Strategy', 'Head of Business Development', 'VP Sales'],
      'Service / operations': ['Head of Service', 'Head of Operations', 'Service Director', 'COO'],
      'Product / technology': ['CTO', 'Head of Product', 'Head of Engineering', 'VP Technology'],
      'Finance / ownership': ['CFO', 'Head of Finance', 'Finance Director'],
      'Other influencer': ['Head of Partnerships', 'Head of Innovation'],
    }
    return titleMap[cat] || []
  })

  return (
    <Modal open onClose={onClose} title="Find Contacts with AI" size="lg">
      <div className="p-5 space-y-5">
        {/* Role categories */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 block">
            Target Role Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {ROLE_CATEGORIES.map(cat => {
              const cfg = roleCatConfig(cat)
              const selected = selectedCategories.includes(cat)
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs border transition-all',
                    selected ? cfg.badge : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
                  )}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Count */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 block">
              Number of suggestions
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Additional instructions */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 block">
            Additional Instructions (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Focus on service and commercial leaders, not engineering"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Pasted text */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 block">
            Paste Company / LinkedIn Text (optional)
          </label>
          <textarea
            rows={4}
            placeholder="Paste website about page, LinkedIn people text, or any company info here…"
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>

        {/* LinkedIn search guide */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Search className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400">LinkedIn Sales Navigator Search Guide</span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Company: <span className="text-slate-300">{company.name}</span></div>
            <div>Titles to search: <span className="text-slate-300">{linkedInTitles.join(', ')}</span></div>
            {company.country && <div>Country filter: <span className="text-slate-300">{company.country}</span></div>}
          </div>
          <div className="mt-2 text-[10px] text-slate-600">
            Copy this to LinkedIn Sales Navigator → Lead Filters
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <p className="text-sm text-slate-400">Claude is analysing the company and identifying contacts…</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            onClick={run}
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate Suggestions
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// Edit Contact Modal
// ============================================================
function EditContactModal({
  contact,
  onClose,
  onSaved,
}: {
  contact: AnyRecord
  onClose: () => void
  onSaved: (c: AnyRecord) => void
}) {
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string, any>>({
    name: contact.name || '',
    title: contact.title || contact.role || '',
    role_category: contact.role_category || '',
    email: contact.email || '',
    email_status: contact.email_status || 'Unknown',
    phone: contact.phone || '',
    linkedin_url: contact.linkedin_url || '',
    linkedin_status: contact.linkedin_status || 'Unknown',
    gdpr_status: contact.gdpr_status || 'Not reviewed',
    contact_status: contact.contact_status || 'Validated',
    source_type: contact.source_type || 'Manual',
    notes: contact.notes || '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: form.title }),
      })
      if (res.ok) {
        const updated = await res.json()
        onSaved(updated)
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit Contact" size="md">
      <div className="p-5 space-y-4">
        <Input label="Full Name" value={form.name} onChange={set('name')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Job Title" value={form.title} onChange={set('title')} placeholder="CEO, Head of Service…" />
          <Select
            label="Role Category"
            value={form.role_category}
            onChange={set('role_category')}
            placeholder="Select category"
            options={ROLE_CATEGORIES.map(r => ({ value: r, label: r }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" value={form.email} onChange={set('email')} type="email" />
          <Select
            label="Email Status"
            value={form.email_status}
            onChange={set('email_status')}
            placeholder="Select"
            options={['Verified', 'Unverified', 'Pattern guess', 'Unknown'].map(v => ({ value: v, label: v }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" value={form.phone} onChange={set('phone')} />
          <Input label="LinkedIn URL" value={form.linkedin_url} onChange={set('linkedin_url')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="GDPR Status"
            value={form.gdpr_status}
            onChange={set('gdpr_status')}
            placeholder="Select"
            options={CONTACT_GDPR_STATUSES.map(v => ({ value: v, label: v }))}
          />
          <Select
            label="Contact Status"
            value={form.contact_status}
            onChange={set('contact_status')}
            placeholder="Select"
            options={CONTACT_STATUSES.map(v => ({ value: v, label: v }))}
          />
        </div>
        <Select
          label="Source Type"
          value={form.source_type}
          onChange={set('source_type')}
          placeholder="Select"
          options={['Manual', 'Company website', 'Uploaded file', 'Pasted text', 'User-provided LinkedIn', 'AI suggested role'].map(v => ({ value: v, label: v }))}
        />
        <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={3} />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving} className="flex-1">Save Changes</Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// Add Contact Modal
// ============================================================
function AddContactModal({
  companyId,
  onClose,
  onAdded,
}: {
  companyId: string
  onClose: () => void
  onAdded: (c: AnyRecord) => void
}) {
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string, any>>({
    name: '', title: '', role_category: '', email: '', email_status: 'Unknown',
    phone: '', linkedin_url: '', linkedin_status: 'Unknown',
    gdpr_status: 'Not reviewed', source_type: 'Manual', notes: '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: form.title,
          company_id: companyId,
          contact_status: 'Validated',
        }),
      })
      if (res.ok) {
        const newContact = await res.json()
        onAdded(newContact)
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add Contact" size="md">
      <div className="p-5 space-y-4">
        <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="Kevin Dieck" required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Job Title" value={form.title} onChange={set('title')} placeholder="CFO" />
          <Select
            label="Role Category"
            value={form.role_category}
            onChange={set('role_category')}
            placeholder="Select category"
            options={ROLE_CATEGORIES.map(r => ({ value: r, label: r }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" value={form.email} onChange={set('email')} type="email" />
          <Select
            label="Email Status"
            value={form.email_status}
            onChange={set('email_status')}
            placeholder="Select"
            options={['Verified', 'Unverified', 'Pattern guess', 'Unknown'].map(v => ({ value: v, label: v }))}
          />
        </div>
        <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+47 999 00 000" />
        <Input label="LinkedIn URL" value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="GDPR Status"
            value={form.gdpr_status}
            onChange={set('gdpr_status')}
            placeholder="Select"
            options={CONTACT_GDPR_STATUSES.map(v => ({ value: v, label: v }))}
          />
          <Select
            label="Source Type"
            value={form.source_type}
            onChange={set('source_type')}
            placeholder="Select"
            options={['Manual', 'Company website', 'User-provided LinkedIn', 'Pasted text', 'Other'].map(v => ({ value: v, label: v }))}
          />
        </div>
        <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={3} />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving} className="flex-1" disabled={!form.name}>
            Add Contact
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// Accept confirmation modal (with duplicate check)
// ============================================================
function AcceptModal({
  suggestion,
  onClose,
  onAccepted,
}: {
  suggestion: AnyRecord
  onClose: () => void
  onAccepted: (contactId: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accept = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contact-discovery/suggestions/${suggestion.id}/convert`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to convert')
      if (data.duplicate_warning) {
        setError(data.duplicate_warning)
      }
      onAccepted(data.contact_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Accept Contact Suggestion" size="sm">
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-300">
          This will add <strong>{suggestion.full_name || suggestion.suggested_role_to_find || 'this contact'}</strong> to your confirmed contacts.
        </p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Please verify this contact is relevant and that you have a lawful basis for outreach under GDPR
              (typically legitimate interest for B2B). Review the GDPR status after adding.
            </p>
          </div>
        </div>
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded p-2 text-xs text-rose-300">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={accept} loading={loading} className="flex-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Confirm & Add Contact
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// Main ContactsTabClient
// ============================================================
export function ContactsTabClient({
  companyId,
  company,
  initialContacts,
  initialLatestRun,
  brief,
  outreach = [],
}: ContactsTabProps) {
  const [contacts, setContacts] = useState<AnyRecord[]>(initialContacts)
  const [latestRun, setLatestRun] = useState<AnyRecord | null>(initialLatestRun)
  const [suggestions, setSuggestions] = useState<AnyRecord[]>(
    (initialLatestRun?.contact_suggestions as AnyRecord[]) || []
  )
  const [showFindModal, setShowFindModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState<AnyRecord | null>(null)
  const [acceptingSuggestion, setAcceptingSuggestion] = useState<AnyRecord | null>(null)

  // Group contacts by role_category
  const grouped = ROLE_CATEGORIES.reduce((acc, cat) => {
    const catContacts = contacts.filter(c => c.role_category === cat)
    if (catContacts.length > 0) acc[cat] = catContacts
    return acc
  }, {} as Record<string, AnyRecord[]>)
  const uncategorized = contacts.filter(c => !c.role_category || !ROLE_CATEGORIES.includes(c.role_category as never))

  const pendingSuggestions = suggestions.filter(s => s.status === 'Suggested' || s.status === 'Saved for later')
  const hasPendingSuggestions = pendingSuggestions.length > 0

  const handleFindComplete = useCallback((run: AnyRecord, newSuggestions: AnyRecord[]) => {
    setLatestRun(run)
    setSuggestions(newSuggestions)
    setShowFindModal(false)
  }, [])

  const handleSuggestionAction = async (suggestion: AnyRecord, status: string) => {
    const res = await fetch(`/api/contact-discovery/suggestions/${suggestion.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, ...updated } : s))
    }
  }

  const handleAccepted = (contactId: string) => {
    // Update suggestion status in local state
    if (acceptingSuggestion) {
      setSuggestions(prev => prev.map(s =>
        s.id === acceptingSuggestion.id ? { ...s, status: 'Converted to contact', converted_contact_id: contactId } : s
      ))
      setAcceptingSuggestion(null)
    }
    // Refresh contacts from server (just refetch)
    fetch(`/api/contacts/${contactId}`)
      .then(r => r.json())
      .then(newContact => setContacts(prev => [newContact, ...prev]))
      .catch(() => {})
  }

  const handleContactSaved = (updated: AnyRecord) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const handleDoNotContact = async (contact: AnyRecord) => {
    if (!confirm(`Mark ${contact.name} as Do Not Contact? This sets GDPR status to Suppression.`)) return
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, gdpr_status: 'Suppression', contact_status: 'Do not contact' } : c))
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-300">
            {contacts.length} confirmed contact{contacts.length !== 1 ? 's' : ''}
          </h3>
          {hasPendingSuggestions && (
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-xs">
              {pendingSuggestions.length} suggestion{pendingSuggestions.length !== 1 ? 's' : ''} pending
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowAddModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Contact
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowFindModal(true)}>
            <Sparkles className="h-3.5 w-3.5" /> Find Contacts
          </Button>
        </div>
      </div>

      {/* GDPR banner when suggestions are present */}
      {hasPendingSuggestions && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300">
            <strong>GDPR Notice:</strong> Contact data is personal data. Validate source, relevance, and lawful basis before outreach.
            For B2B commercial contacts, legitimate interest typically applies — but review each case.
          </div>
        </div>
      )}

      {/* Confirmed contacts by category */}
      {contacts.length > 0 ? (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, catContacts]) => (
            <div key={cat}>
              <h4 className={cn('text-xs font-medium uppercase tracking-wide mb-2 flex items-center gap-2',
                roleCatConfig(cat).badge.includes('purple') ? 'text-purple-400' :
                roleCatConfig(cat).badge.includes('cyan') ? 'text-cyan-400' :
                roleCatConfig(cat).badge.includes('emerald') ? 'text-emerald-400' :
                roleCatConfig(cat).badge.includes('blue') ? 'text-blue-400' :
                roleCatConfig(cat).badge.includes('amber') ? 'text-amber-400' :
                'text-slate-500'
              )}>
                {cat}
                <span className="text-slate-600 font-normal">({catContacts.length})</span>
              </h4>
              <div className="space-y-2">
                {catContacts.map(contact => (
                  <ContactCard
                    key={String(contact.id)}
                    contact={contact}
                    onEdit={setEditingContact}
                    onDoNotContact={handleDoNotContact}
                    contactOutreach={outreach.filter(m => m.contact_id === contact.id)}
                  />
                ))}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Uncategorized</h4>
              <div className="space-y-2">
                {uncategorized.map(contact => (
                  <ContactCard
                    key={String(contact.id)}
                    contact={contact}
                    onEdit={setEditingContact}
                    onDoNotContact={handleDoNotContact}
                    contactOutreach={outreach.filter(m => m.contact_id === contact.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !hasPendingSuggestions ? (
        <div className="text-center py-12 border border-slate-800 rounded-lg">
          <User className="h-10 w-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-1">No contacts yet</p>
          <p className="text-xs text-slate-600 mb-4">Use AI to find the right contacts or add manually</p>
          <Button variant="primary" size="sm" onClick={() => setShowFindModal(true)}>
            <Sparkles className="h-3.5 w-3.5" /> Find Contacts with AI
          </Button>
        </div>
      ) : null}

      {/* Suggestions section */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">
              AI Suggestions
              {latestRun?.status === 'completed' && (
                <span className="ml-2 text-xs text-slate-500 font-normal">from latest run</span>
              )}
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setShowFindModal(true)}>
              <Sparkles className="h-3.5 w-3.5" /> Run again
            </Button>
          </div>

          {/* Group suggestions by role_category */}
          {ROLE_CATEGORIES.map(cat => {
            const catSuggestions = suggestions.filter(s => s.role_category === cat)
            if (catSuggestions.length === 0) return null
            return (
              <div key={cat}>
                <h4 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">{cat}</h4>
                <div className="space-y-2">
                  {catSuggestions.map(suggestion => (
                    <SuggestionCard
                      key={String(suggestion.id)}
                      suggestion={suggestion}
                      onAccept={s => setAcceptingSuggestion(s)}
                      onSaveLater={s => handleSuggestionAction(s, 'Saved for later')}
                      onReject={s => handleSuggestionAction(s, 'Rejected')}
                    />
                  ))}
                </div>
              </div>
            )
          })}
          {/* Uncategorized suggestions */}
          {suggestions.filter(s => !s.role_category || !ROLE_CATEGORIES.includes(s.role_category as never)).map(suggestion => (
            <SuggestionCard
              key={String(suggestion.id)}
              suggestion={suggestion}
              onAccept={s => setAcceptingSuggestion(s)}
              onSaveLater={s => handleSuggestionAction(s, 'Saved for later')}
              onReject={s => handleSuggestionAction(s, 'Rejected')}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showFindModal && (
        <FindContactsModal
          company={company}
          brief={brief}
          existingContacts={contacts}
          onClose={() => setShowFindModal(false)}
          onComplete={handleFindComplete}
        />
      )}

      {showAddModal && (
        <AddContactModal
          companyId={companyId}
          onClose={() => setShowAddModal(false)}
          onAdded={c => setContacts(prev => [c, ...prev])}
        />
      )}

      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={handleContactSaved}
        />
      )}

      {acceptingSuggestion && (
        <AcceptModal
          suggestion={acceptingSuggestion}
          onClose={() => setAcceptingSuggestion(null)}
          onAccepted={handleAccepted}
        />
      )}
    </div>
  )
}
