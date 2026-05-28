'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Header } from '@/components/layout/header'
import { PIPELINE_STAGES, REJECTION_REASONS } from '@/lib/types'
import {
  ChevronDown, ChevronUp, Check, X, Bookmark, ExternalLink,
  AlertTriangle, ArrowLeft, Globe
} from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Suggestion = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Search = Record<string, any>

interface Props {
  search: Search
  initialSuggestions: Suggestion[]
}

type ActiveTab = 'all' | 'suggested' | 'accepted' | 'rejected' | 'saved'

function priorityVariant(p: string | null): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (p === 'A-priority') return 'success'
  if (p === 'B-priority') return 'info'
  if (p === 'C-priority') return 'warning'
  if (p === 'Nurture') return 'muted'
  if (p === 'Disqualified') return 'danger'
  return 'default'
}

function confidenceVariant(c: string | null): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (c === 'High') return 'success'
  if (c === 'Medium') return 'warning'
  if (c === 'Low') return 'danger'
  return 'muted'
}

function statusVariant(s: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (s === 'completed') return 'success'
  if (s === 'running') return 'info'
  if (s === 'failed') return 'danger'
  if (s === 'archived') return 'muted'
  return 'default'
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-500' : 'bg-rose-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-6 text-right">{score?.toFixed(1) ?? '—'}</span>
    </div>
  )
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  if (!items || items.length === 0) return null
  return (
    <ul className="space-y-1 mt-1">
      {items.map((item, i) => (
        <li key={i} className={cn('text-xs flex gap-1.5', color)}>
          <span className="mt-0.5 flex-shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  onSave,
}: {
  suggestion: Suggestion
  onAccept: (id: string) => void
  onReject: (id: string, reason: string) => void
  onSave: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showRejectMenu, setShowRejectMenu] = useState(false)
  const [selectedRejection, setSelectedRejection] = useState('')
  const [acting, setActing] = useState(false)

  const scores = suggestion.scores_json || {}

  const handleReject = async () => {
    if (!selectedRejection) return
    setActing(true)
    await onReject(suggestion.id, selectedRejection)
    setShowRejectMenu(false)
    setActing(false)
  }

  const handleSave = async () => {
    setActing(true)
    await onSave(suggestion.id)
    setActing(false)
  }

  const isActed = ['accepted', 'rejected', 'saved_for_later', 'converted_to_lead'].includes(suggestion.status)

  return (
    <div className={cn(
      'bg-slate-800/40 border rounded-lg transition-colors',
      suggestion.status === 'accepted' || suggestion.status === 'converted_to_lead'
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : suggestion.status === 'rejected'
          ? 'border-slate-700/50 opacity-60'
          : suggestion.status === 'saved_for_later'
            ? 'border-amber-500/20'
            : 'border-slate-700 hover:border-slate-600'
    )}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-100">{suggestion.company_name}</h3>
              {suggestion.overall_priority && (
                <Badge variant={priorityVariant(suggestion.overall_priority)}>
                  {suggestion.overall_priority}
                </Badge>
              )}
              {suggestion.confidence_level && (
                <Badge variant={confidenceVariant(suggestion.confidence_level)}>
                  {suggestion.confidence_level} confidence
                </Badge>
              )}
              {suggestion.status === 'accepted' && <Badge variant="success">Accepted</Badge>}
              {suggestion.status === 'converted_to_lead' && <Badge variant="success">In Pipeline</Badge>}
              {suggestion.status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
              {suggestion.status === 'saved_for_later' && <Badge variant="warning">Saved</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
              {suggestion.country && <span>{suggestion.country}</span>}
              {suggestion.country && suggestion.segment && <span>·</span>}
              {suggestion.segment && <span>{suggestion.segment}</span>}
              {suggestion.subsegment && <><span>·</span><span>{suggestion.subsegment}</span></>}
              {suggestion.website && (
                <>
                  <span>·</span>
                  <a
                    href={suggestion.website.startsWith('http') ? suggestion.website : `https://${suggestion.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-slate-400 flex items-center gap-0.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <Globe className="h-3 w-3" />
                    {suggestion.website}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* What they sell */}
        {suggestion.what_they_sell && (
          <p className="text-xs text-slate-400 mb-2">
            <span className="text-slate-500 font-medium">What they sell: </span>
            {suggestion.what_they_sell}
          </p>
        )}

        {/* AaaS concept */}
        {suggestion.possible_as_a_service_concept && (
          <p className="text-xs text-slate-400 mb-3">
            <span className="text-cyan-600 font-medium">Possible AaaS concept: </span>
            {suggestion.possible_as_a_service_concept}
          </p>
        )}

        {/* Score bars */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">SHMA Fit</div>
            <ScoreBar score={suggestion.shma_fit_score} />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Opportunity</div>
            <ScoreBar score={suggestion.opportunity_score} />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Confidence</div>
            <ScoreBar score={suggestion.confidence_score} />
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Hide details' : 'Why this company?'}
          </button>

          <div className="flex-1" />

          {!isActed && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onAccept(suggestion.id)}
                className="text-xs"
              >
                <Check className="h-3 w-3" /> Accept
              </Button>

              {!showRejectMenu ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRejectMenu(true)}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  <X className="h-3 w-3" /> Reject
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <select
                    value={selectedRejection}
                    onChange={e => setSelectedRejection(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none"
                  >
                    <option value="">Select reason...</option>
                    {REJECTION_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleReject}
                    disabled={!selectedRejection || acting}
                    className="text-xs"
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowRejectMenu(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={acting}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                <Bookmark className="h-3 w-3" /> Save
              </Button>
            </>
          )}

          {suggestion.status === 'accepted' && suggestion.converted_company_id && (
            <Link href={`/companies/${suggestion.converted_company_id}`}>
              <Button size="sm" variant="ghost" className="text-xs text-emerald-400">
                <ExternalLink className="h-3 w-3" /> View in Pipeline
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-700/50 px-4 py-4 space-y-4">
          {/* SHMA fit reason */}
          {suggestion.shma_fit_reason && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Why SHMA fit</div>
              <p className="text-xs text-slate-300">{suggestion.shma_fit_reason}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {suggestion.capex_barrier && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Customer CapEx barrier</div>
                <p className="text-xs text-slate-300">{suggestion.capex_barrier}</p>
              </div>
            )}
            {suggestion.service_potential && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Service potential</div>
                <p className="text-xs text-slate-300">{suggestion.service_potential}</p>
              </div>
            )}
            {suggestion.software_data_monitoring_potential && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Software / data / monitoring</div>
                <p className="text-xs text-slate-300">{suggestion.software_data_monitoring_potential}</p>
              </div>
            )}
            {suggestion.financing_logic && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Financing logic</div>
                <p className="text-xs text-slate-300">{suggestion.financing_logic}</p>
              </div>
            )}
          </div>

          {suggestion.strategic_trigger && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Strategic trigger</div>
              <p className="text-xs text-slate-300">{suggestion.strategic_trigger}</p>
            </div>
          )}

          {suggestion.outreach_angle && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Outreach angle</div>
              <p className="text-xs text-slate-300">{suggestion.outreach_angle}</p>
            </div>
          )}

          {suggestion.suggested_decision_makers && suggestion.suggested_decision_makers.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Suggested decision makers</div>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.suggested_decision_makers.map((dm: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                    {dm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Evidence buckets */}
          <div className="grid grid-cols-2 gap-4">
            {suggestion.known_information && suggestion.known_information.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1">Known information</div>
                <BulletList items={suggestion.known_information} color="text-emerald-400/80" />
              </div>
            )}
            {suggestion.ai_hypotheses && suggestion.ai_hypotheses.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">AI hypotheses</div>
                <BulletList items={suggestion.ai_hypotheses} color="text-amber-400/80" />
              </div>
            )}
            {suggestion.missing_information && suggestion.missing_information.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Missing information</div>
                <BulletList items={suggestion.missing_information} color="text-orange-400/80" />
              </div>
            )}
            {suggestion.validation_tasks && suggestion.validation_tasks.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-cyan-500 uppercase tracking-wide mb-1">Validation tasks</div>
                <BulletList items={suggestion.validation_tasks} color="text-cyan-400/80" />
              </div>
            )}
          </div>

          {suggestion.ai_rationale && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">AI rationale</div>
              <p className="text-xs text-slate-300">{suggestion.ai_rationale}</p>
            </div>
          )}

          {suggestion.recommendation && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Recommendation</div>
              <p className="text-xs text-slate-300">{suggestion.recommendation}</p>
            </div>
          )}

          {/* Individual scores */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Score breakdown</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {Object.entries(scores).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                  </div>
                  <ScoreBar score={Number(val)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DiscoveryResultsClient({ search, initialSuggestions }: Props) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions)
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterConfidence, setFilterConfidence] = useState('')
  const [convertModal, setConvertModal] = useState<Suggestion | null>(null)
  const [convertStage, setConvertStage] = useState('AI Researched')
  const [converting, setConverting] = useState(false)
  const [convertResult, setConvertResult] = useState<{
    company_id: string
    duplicate_warning: boolean
    existing_company?: { id: string; name: string }
  } | null>(null)

  const tabCounts = {
    all: suggestions.length,
    suggested: suggestions.filter(s => s.status === 'suggested').length,
    accepted: suggestions.filter(s => ['accepted', 'converted_to_lead'].includes(s.status)).length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
    saved: suggestions.filter(s => s.status === 'saved_for_later').length,
  }

  const filtered = suggestions.filter(s => {
    if (activeTab === 'suggested' && s.status !== 'suggested') return false
    if (activeTab === 'accepted' && !['accepted', 'converted_to_lead'].includes(s.status)) return false
    if (activeTab === 'rejected' && s.status !== 'rejected') return false
    if (activeTab === 'saved' && s.status !== 'saved_for_later') return false
    if (filterPriority && s.overall_priority !== filterPriority) return false
    if (filterConfidence && s.confidence_level !== filterConfidence) return false
    return true
  })

  const patchSuggestion = async (id: string, updates: Record<string, string>) => {
    const res = await fetch(`/api/discovery/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))
    }
  }

  const handleAccept = (id: string) => {
    const sugg = suggestions.find(s => s.id === id)
    if (sugg) {
      setConvertModal(sugg)
      setConvertResult(null)
    }
  }

  const handleConvert = async () => {
    if (!convertModal) return
    setConverting(true)
    try {
      const res = await fetch(`/api/discovery/suggestions/${convertModal.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_stage: convertStage }),
      })
      if (res.ok) {
        const result = await res.json()
        setConvertResult(result)
        setSuggestions(prev => prev.map(s =>
          s.id === convertModal.id
            ? { ...s, status: 'converted_to_lead', converted_company_id: result.company_id }
            : s
        ))
      }
    } catch {
      // noop
    }
    setConverting(false)
  }

  const handleReject = async (id: string, reason: string) => {
    await patchSuggestion(id, { status: 'rejected', rejection_reason: reason })
  }

  const handleSave = async (id: string) => {
    await patchSuggestion(id, { status: 'saved_for_later' })
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'suggested', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'saved', label: 'Saved' },
  ]

  return (
    <>
      <Header
        title={search.search_name}
        subtitle={`Discovery search results`}
        actions={
          <Link href="/discovery">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" /> All searches
            </Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {/* Search meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={statusVariant(search.status)}>{search.status}</Badge>
          <Badge variant="muted">{search.mode}</Badge>
          <Badge variant="muted">{search.search_depth}</Badge>
          <span className="text-xs text-slate-500">{suggestions.length} suggestions</span>
        </div>

        {/* Warning banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            AI-generated suggestions. Validate company details before outreach. All suggestions are based on
            Claude&apos;s training data and may contain inaccuracies.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded text-xs',
                activeTab === tab.key ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-500'
              )}>
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All priorities</option>
            {['A-priority', 'B-priority', 'C-priority', 'Nurture', 'Needs validation', 'Disqualified'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filterConfidence}
            onChange={e => setFilterConfidence(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All confidence levels</option>
            {['High', 'Medium', 'Low'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-xs text-slate-600">{filtered.length} shown</span>
        </div>

        {/* Suggestion cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <p className="text-sm">No suggestions match the current filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={handleAccept}
                onReject={handleReject}
                onSave={handleSave}
              />
            ))}
          </div>
        )}
      </div>

      {/* Convert to Pipeline Modal */}
      <Modal
        open={!!convertModal}
        onClose={() => { setConvertModal(null); setConvertResult(null) }}
        title="Add to Pipeline"
        size="sm"
      >
        <div className="p-5 space-y-4">
          {!convertResult ? (
            <>
              <p className="text-sm text-slate-300">
                Add <strong className="text-slate-100">{convertModal?.company_name}</strong> to the SHMA pipeline.
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Initial pipeline stage
                </label>
                <select
                  value={convertStage}
                  onChange={e => setConvertStage(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {PIPELINE_STAGES.map(s => (
                    <option key={s} value={s} className="bg-slate-800">{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="primary" onClick={handleConvert} loading={converting} className="flex-1">
                  <Check className="h-3.5 w-3.5" /> Add to Pipeline
                </Button>
                <Button variant="ghost" onClick={() => setConvertModal(null)}>Cancel</Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {convertResult.duplicate_warning && convertResult.existing_company && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-300 font-medium">Possible duplicate detected</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">
                      A similar company &quot;{convertResult.existing_company.name}&quot; already exists in the pipeline.
                    </p>
                    <Link
                      href={`/companies/${convertResult.existing_company.id}`}
                      className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 block"
                    >
                      View existing company →
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <Check className="h-4 w-4" />
                <span>Added to pipeline successfully</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/companies/${convertResult.company_id}`} onClick={() => router.refresh()}>
                  <Button variant="primary" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" /> View Company
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => { setConvertModal(null); setConvertResult(null) }}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
