'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Sparkles, AlertTriangle, ChevronDown, ChevronUp,
  Target, CheckCircle2, Loader2, Info, Play,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SEARCH_MODES = [
  'Structured search', 'Similar-company search', 'Problem-based search',
  'Funding-based search', 'Exploratory discovery', 'Imported list',
]

const SHMA_RELEVANCE_CHIPS = [
  'High customer CapEx', 'Complex physical equipment', 'Technical implementation complexity',
  'Service / maintenance need', 'Installed base', 'Aftermarket revenue potential',
  'Monitoring / IoT / data potential', 'Standardized repeatable solution',
  'Residual value / redeployment potential', 'Recurring revenue potential',
  'Asset-backed financing potential', 'Pay-per-use potential', 'Subscription potential',
  'Outcome-based pricing potential', 'Customers prefer OpEx', 'End-customer credit quality matters',
  'Growth pressure', 'Margin pressure', 'Valuation uplift through recurring revenue',
]

const GEO_PRESETS = ['Nordics', 'DACH', 'Benelux', 'UK', 'Europe', 'North America', 'Global']

const OWNERSHIP_TRIGGERS = [
  'PE-owned / investor-backed', 'Founder-owned', 'Family-owned', 'Listed',
  'Industrial group-owned', 'Board-driven growth mandate', 'Founder transition',
  'New leadership', 'International expansion', 'Customer CapEx friction',
  'Service revenue opportunity', 'Recurring revenue ambition',
]

const INDUSTRY_PRESETS = [
  'Industrial technology and machinery', 'Warehouse automation and intralogistics',
  'Robotics and automation', 'Maritime, offshore and subsea',
  'Energy, charging, HVAC and building technology', 'Medtech and labtech',
  'AV, control rooms and workplace technology', 'Other asset-heavy B2B technology',
]

const SEARCH_DEPTHS = ['Quick estimate', 'Build universe list', 'AI qualification sample', 'Deep AI qualification']
const DATA_SOURCE_TYPES = ['Manual', 'CSV/XLS upload', 'External data provider', 'Company registry', 'AI estimated', 'Mixed']

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  search_name: string
  search_mode: string
  scope_definition: string
  include_text: string
  avoid_text: string
  reference_companies_text: string
  shma_relevance_chips: string[]
  shma_relevance_notes: string
  geography_presets: string[]
  geography_notes: string
  revenue_notes: string
  employee_notes: string
  ownership_triggers: string[]
  // advanced
  advanced_industry_presets: string[]
  search_depth: string
  number_to_generate: number
  data_source_type: string
  advanced_funding_json: Record<string, boolean>
  funding_notes: string
  adv_min_revenue: string
  adv_max_revenue: string
  adv_revenue_currency: string
}

const DEFAULT: FormState = {
  search_name: '', search_mode: 'Exploratory discovery', scope_definition: '',
  include_text: '', avoid_text: '', reference_companies_text: '',
  shma_relevance_chips: [], shma_relevance_notes: '',
  geography_presets: [], geography_notes: '',
  revenue_notes: '', employee_notes: '',
  ownership_triggers: [],
  advanced_industry_presets: [],
  search_depth: 'Build universe list', number_to_generate: 15,
  data_source_type: 'AI estimated',
  advanced_funding_json: {}, funding_notes: '',
  adv_min_revenue: '', adv_max_revenue: '', adv_revenue_currency: 'EUR',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      'px-3 py-1.5 rounded-full text-xs border transition-all',
      active ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
    )}>
      {label}
    </button>
  )
}

function AdvancedSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>
      {open && <div className="px-5 pb-5 pt-2 space-y-4 bg-slate-900/30">{children}</div>}
    </div>
  )
}

// ─── Completeness ─────────────────────────────────────────────────────────────

function useValidation(f: FormState) {
  const hasDesc = !!f.scope_definition.trim()
  const hasInclude = !!f.include_text.trim()
  const hasRef = !!f.reference_companies_text.trim()
  const hasIndustry = f.advanced_industry_presets.length > 0
  const hasContent = hasDesc || hasInclude || hasRef || hasIndustry
  const hasGeo = f.geography_presets.length > 0 || !!f.geography_notes.trim()
  const hasRelevance = f.shma_relevance_chips.length > 0
  const hasAvoid = !!f.avoid_text.trim()

  const warnings: string[] = []
  if (!hasDesc) warnings.push('No target universe description')
  if (!hasRelevance) warnings.push('No SHMA relevance logic selected')
  if (!hasGeo) warnings.push('No geography defined')
  if (!hasAvoid) warnings.push('No exclusions defined')

  const score = [hasDesc, hasInclude || hasRef, hasGeo, hasRelevance, hasAvoid,
    f.ownership_triggers.length > 0].filter(Boolean).length

  const canRun = !!f.search_name.trim() && hasContent && hasGeo
  const level = score >= 5 ? 'strong' : score >= 3 ? 'good' : 'weak'

  return { warnings, canRun, level, score }
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ f, aiResult }: { f: FormState; aiResult: Record<string, unknown> | null }) {
  const { level, score, warnings, canRun } = useValidation(f)
  const levelCfg = {
    weak:   { label: 'Weak',   bar: 'bg-rose-500',    text: 'text-rose-400' },
    good:   { label: 'Good',   bar: 'bg-amber-500',   text: 'text-amber-400' },
    strong: { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-400' },
  }[level]

  const geos = [...f.geography_presets, ...f.geography_notes.split(',').map(s => s.trim()).filter(Boolean)]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">Search Strategy Summary</span>
        <span className={cn('text-xs font-bold', levelCfg.text)}>{levelCfg.label}</span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', levelCfg.bar)} style={{ width: `${(score / 6) * 100}%` }} />
      </div>
      <div className="space-y-1.5 text-xs">
        {f.search_mode && <SRow label="Mode" value={f.search_mode} />}
        {f.scope_definition && <SRow label="Universe" value={f.scope_definition.slice(0, 120) + (f.scope_definition.length > 120 ? '…' : '')} />}
        {f.include_text && <SRow label="Include" value={f.include_text.slice(0, 80) + (f.include_text.length > 80 ? '…' : '')} />}
        {f.avoid_text && <SRow label="Avoid" value={f.avoid_text.slice(0, 80) + (f.avoid_text.length > 80 ? '…' : '')} warn />}
        {f.reference_companies_text && <SRow label="Similar to" value={f.reference_companies_text} />}
        {f.shma_relevance_chips.length > 0 && <SRow label="SHMA logic" value={f.shma_relevance_chips.join(', ')} />}
        {geos.length > 0 && <SRow label="Geography" value={geos.join(', ')} />}
        {f.ownership_triggers.length > 0 && <SRow label="Ownership" value={f.ownership_triggers.join(', ')} />}
      </div>
      {warnings.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-800">
          {warnings.map(w => (
            <div key={w} className="flex items-start gap-1.5 text-xs text-amber-400/80">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {w}
            </div>
          ))}
        </div>
      )}
      {aiResult && (
        <div className="text-xs text-purple-400/70 flex items-center gap-1 pt-1 border-t border-slate-800">
          <CheckCircle2 className="w-3 h-3" /> Claude has structured this search strategy
        </div>
      )}
      {!canRun && (
        <p className="text-xs text-slate-600 italic">Fill name + description/include + geography to enable Run</p>
      )}
    </div>
  )
}

function SRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div><span className="text-slate-500">{label}: </span>
    <span className={warn ? 'text-rose-400' : 'text-slate-300'}>{value}</span></div>
  )
}

// ─── AI preview modal ─────────────────────────────────────────────────────────

function AiPreview({ result, onApply, onClose }: {
  result: Record<string, unknown>; onApply: () => void; onClose: () => void
}) {
  const arr = (k: string) => (result[k] as string[] | undefined) || []
  const str = (k: string) => (result[k] as string | undefined) || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">Claude Search Refinement</div>
            <div className="text-xs text-slate-500 mt-0.5">Review before applying to your form</div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg flex gap-2 text-xs text-amber-400/80">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Claude has structured the search strategy. It has not verified the full market universe unless a data source is connected.
          </div>
          {str('improved_search_name') && <AiRow label="Suggested name" value={str('improved_search_name')} />}
          {str('clean_scope_definition') && <AiRow label="Structured scope" value={str('clean_scope_definition')} block />}
          {arr('included_industries').length > 0 && <AiRow label="Include" value={arr('included_industries').join(', ')} />}
          {arr('excluded_industries').length > 0 && <AiRow label="Exclude" value={arr('excluded_industries').join(', ')} warn />}
          {arr('suggested_adjacent_sectors').length > 0 && <AiRow label="Adjacent sectors" value={arr('suggested_adjacent_sectors').join(', ')} />}
          {arr('geography_interpretation').length > 0 && <AiRow label="Geography" value={arr('geography_interpretation').join(', ')} />}
          {arr('shma_relevance_logic').length > 0 && <AiRow label="SHMA logic" value={arr('shma_relevance_logic').join('; ')} block />}
          {arr('objective_screening_criteria').length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Objective screening criteria</div>
              <ul className="space-y-0.5">{arr('objective_screening_criteria').map((c, i) => <li key={i} className="text-xs text-slate-300">• {c}</li>)}</ul>
            </div>
          )}
          {arr('disqualifiers').length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Disqualifiers</div>
              <ul className="space-y-0.5">{arr('disqualifiers').map((c, i) => <li key={i} className="text-xs text-rose-300">✕ {c}</li>)}</ul>
            </div>
          )}
          {arr('clarifying_questions').length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Clarifying questions</div>
              <ul className="space-y-0.5">{arr('clarifying_questions').map((q, i) => <li key={i} className="text-xs text-amber-300">? {q}</li>)}</ul>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1" onClick={onApply}>Apply to form</Button>
            <Button variant="ghost" onClick={onClose}>Discard</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AiRow({ label, value, warn, block }: { label: string; value: string; warn?: boolean; block?: boolean }) {
  if (block) return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={cn('text-xs p-3 bg-slate-800 rounded-lg', warn ? 'text-rose-300' : 'text-slate-300')}>{value}</div>
    </div>
  )
  return <div className="text-xs"><span className="text-slate-500">{label}: </span><span className={warn ? 'text-rose-300' : 'text-slate-300'}>{value}</span></div>
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function UniverseBuilder() {
  const router = useRouter()
  const [f, setF] = useState<FormState>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [refining, setRefining] = useState(false)
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { canRun } = useValidation(f)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF(p => ({ ...p, [k]: v }))
  const toggleChip = (k: 'shma_relevance_chips' | 'geography_presets' | 'ownership_triggers' | 'advanced_industry_presets', val: string) =>
    set(k, (f[k] as string[]).includes(val) ? (f[k] as string[]).filter(v => v !== val) : [...(f[k] as string[]), val])

  const handleRefine = async () => {
    setRefining(true)
    setError(null)
    try {
      const res = await fetch('/api/target-universe/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope_definition: f.scope_definition,
          search_mode: f.search_mode,
          include_industries_text: f.include_text,
          exclude_industries_text: f.avoid_text,
          reference_companies_text: f.reference_companies_text,
          shma_fit: Object.fromEntries(f.shma_relevance_chips.map(c => [c, 3])),
          country_presets: f.geography_presets,
          region_notes: f.geography_notes,
          ownership_filters: f.ownership_triggers,
          industry_presets: f.advanced_industry_presets,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setAiResult(json.result)
      setShowPreview(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI refinement failed')
    } finally {
      setRefining(false)
    }
  }

  const applyAiResult = () => {
    if (!aiResult) return
    const str = (k: string) => (aiResult[k] as string | undefined) || ''
    const arr = (k: string) => (aiResult[k] as string[] | undefined) || []
    if (str('improved_search_name') && !f.search_name) set('search_name', str('improved_search_name'))
    if (str('clean_scope_definition')) set('scope_definition', str('clean_scope_definition'))
    if (arr('included_industries').length) set('include_text', arr('included_industries').join(', '))
    if (arr('excluded_industries').length) set('avoid_text', arr('excluded_industries').join(', '))
    setShowPreview(false)
  }

  const handleSave = async (runDiscovery = false) => {
    if (!canRun) return
    setSaving(true)
    setError(null)
    try {
      const geos = [...f.geography_presets, ...f.geography_notes.split(',').map(s => s.trim()).filter(Boolean)]
      const industries = [
        ...f.advanced_industry_presets,
        ...f.include_text.split(',').map(s => s.trim()).filter(Boolean),
      ]
      const body = {
        name: f.search_name,
        status: 'Draft',
        data_source_type: f.data_source_type,
        search_mode: f.search_mode,
        scope_definition: f.scope_definition || null,
        include_industries_text: f.include_text || null,
        exclude_industries_text: f.avoid_text || null,
        reference_companies_text: f.reference_companies_text || null,
        country_presets: f.geography_presets.length ? f.geography_presets : null,
        region_notes: f.geography_notes || null,
        geography: geos.length ? geos : null,
        industries: industries.length ? industries : null,
        industry_presets: f.advanced_industry_presets.length ? f.advanced_industry_presets : null,
        ownership_filters: f.ownership_triggers.length ? f.ownership_triggers : null,
        strategic_triggers: f.ownership_triggers.length ? f.ownership_triggers : null,
        shma_fit_requirements_json: f.shma_relevance_chips.length
          ? Object.fromEntries(f.shma_relevance_chips.map(c => [c, 3])) : null,
        other_exclusions_text: f.avoid_text || null,
        search_depth: f.search_depth,
        ai_structured_criteria_json: aiResult || null,
        ai_structured_at: aiResult ? new Date().toISOString() : null,
      }
      const res = await fetch('/api/target-universe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')

      if (runDiscovery) {
        // Navigate to discovery with universe pre-context
        router.push(`/discovery/new?universe=${json.universe.id}`)
      } else {
        router.push(`/target-universe/${json.universe.id}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {showPreview && aiResult && (
        <AiPreview result={aiResult} onApply={applyAiResult} onClose={() => setShowPreview(false)} />
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/target-universe">
              <Button variant="ghost" size="sm" type="button"><ArrowLeft className="w-3.5 h-3.5" /> Back</Button>
            </Link>
          </div>

          <div className="grid grid-cols-[1fr_280px] gap-5 items-start">
            {/* ── Left: form ── */}
            <div className="space-y-3">

              {/* ── Section 1: Define Target Universe ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">1 · Define Target Universe</div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Search name *" placeholder="e.g. Nordic Warehouse Automation Q3 2026"
                    value={f.search_name} onChange={e => set('search_name', e.target.value)} />
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Search mode</label>
                    <select value={f.search_mode} onChange={e => set('search_mode', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                      {SEARCH_MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Target universe description *</label>
                  <textarea
                    rows={5}
                    value={f.scope_definition}
                    onChange={e => set('scope_definition', e.target.value)}
                    placeholder={`Describe the universe in your own words — strategic logic, not just industry labels.\n\nExample: Find European mid-market companies selling expensive physical equipment where customer CapEx is a barrier, service/maintenance is important, and SHMA could help build an As-a-Service or outcome-based model.\n\nExample: Find companies similar to AutoStore, Element Logic and Vestergaard — asset-heavy, technical, with service/lifecycle potential.`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> This is your primary search definition — be strategic about the business logic.
                  </p>
                </div>
              </div>

              {/* ── Section 2: Guide the Search ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">2 · Guide the Search</div>
                <div className="grid grid-cols-1 gap-3">
                  <Textarea label="Include" rows={2}
                    placeholder="Industries, company types, regions or characteristics to include. Example: warehouse automation, airport ground support equipment, aquaculture technology, industrial refrigeration, Nordic and DACH companies."
                    value={f.include_text} onChange={e => set('include_text', e.target.value)} />
                  <Textarea label="Avoid" rows={2}
                    placeholder="Company types or industries to avoid. Example: pure software, consulting, simple distributors, ordinary leasing, low-value services."
                    value={f.avoid_text} onChange={e => set('avoid_text', e.target.value)} />
                  <Textarea label="Reference companies" rows={2}
                    placeholder="Companies that represent the type of target you want. Example: AutoStore, Element Logic, TOMRA, Vestergaard, Kalmar, Kongsberg Maritime."
                    value={f.reference_companies_text} onChange={e => set('reference_companies_text', e.target.value)} />
                </div>
              </div>

              {/* ── Section 3: SHMA Relevance ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">3 · SHMA Relevance</div>
                <p className="text-xs text-slate-500">What makes these companies relevant for SHMA?</p>
                <div className="flex flex-wrap gap-2">
                  {SHMA_RELEVANCE_CHIPS.map(c => (
                    <Chip key={c} label={c} active={f.shma_relevance_chips.includes(c)}
                      onClick={() => toggleChip('shma_relevance_chips', c)} />
                  ))}
                </div>
                <Input label="Other SHMA relevance logic" placeholder="Any other characteristics that make these companies relevant"
                  value={f.shma_relevance_notes} onChange={e => set('shma_relevance_notes', e.target.value)} />
              </div>

              {/* ── Section 4: Basic Filters ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">4 · Basic Filters</div>
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">Geography *</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {GEO_PRESETS.map(g => (
                      <Chip key={g} label={g} active={f.geography_presets.includes(g)}
                        onClick={() => toggleChip('geography_presets', g)} />
                    ))}
                  </div>
                  <Input placeholder="Other regions or countries (comma-separated)"
                    value={f.geography_notes} onChange={e => set('geography_notes', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Revenue range / notes" placeholder="e.g. EUR 20–300m, mid-market, NOK 100m+"
                    value={f.revenue_notes} onChange={e => set('revenue_notes', e.target.value)} />
                  <Input label="Employee range / notes" placeholder="e.g. 50–2,000 employees"
                    value={f.employee_notes} onChange={e => set('employee_notes', e.target.value)} />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">Ownership / strategic triggers</div>
                  <div className="flex flex-wrap gap-2">
                    {OWNERSHIP_TRIGGERS.map(o => (
                      <Chip key={o} label={o} active={f.ownership_triggers.includes(o)}
                        onClick={() => toggleChip('ownership_triggers', o)} />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Section 5: Review and Run ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">5 · Review and Run</div>

                {error && <p className="text-xs text-rose-400">{error}</p>}

                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" type="button" onClick={handleRefine} loading={refining}
                    disabled={!f.scope_definition.trim() && !f.include_text.trim() && !f.reference_companies_text.trim()}>
                    <Sparkles className="w-3.5 h-3.5" />
                    Let Claude improve search logic
                  </Button>
                </div>

                {aiResult && (
                  <div className="p-3 bg-purple-500/8 border border-purple-500/20 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-purple-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Claude has structured the search strategy
                    </div>
                    <button type="button" onClick={() => setShowPreview(true)} className="text-xs text-purple-400 hover:text-purple-300 underline">
                      View result
                    </button>
                  </div>
                )}

                <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg flex gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400/70">Claude has not verified the full market universe unless a data source is connected.</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => handleSave(false)} loading={saving} disabled={!canRun}>
                    <Target className="w-3.5 h-3.5" /> Save Universe
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={() => handleSave(true)} loading={saving} disabled={!canRun}>
                    <Play className="w-3.5 h-3.5" /> Run Discovery Search
                  </Button>
                </div>
                {!canRun && (
                  <p className="text-xs text-slate-600 text-center">Requires: search name · description or include text · geography</p>
                )}
              </div>

              {/* ── Advanced sections ── */}
              <div className="space-y-2 pt-1">
                <AdvancedSection title="Advanced: Industry presets">
                  <p className="text-xs text-slate-500">Optional — use these to complement the free-text description above.</p>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_PRESETS.map(p => (
                      <Chip key={p} label={p} active={f.advanced_industry_presets.includes(p)}
                        onClick={() => toggleChip('advanced_industry_presets', p)} />
                    ))}
                  </div>
                </AdvancedSection>

                <AdvancedSection title="Advanced: Search depth">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-slate-400 mb-2">Search depth</div>
                      <div className="space-y-1.5">
                        {SEARCH_DEPTHS.map(s => (
                          <label key={s} className={cn('flex items-center gap-2 text-xs cursor-pointer px-3 py-2 rounded-lg border transition-all',
                            f.search_depth === s ? 'border-cyan-500/40 bg-cyan-500/8 text-slate-200' : 'border-slate-700 text-slate-400')}>
                            <input type="radio" name="search_depth" value={s} checked={f.search_depth === s}
                              onChange={() => set('search_depth', s)} className="accent-cyan-500" />
                            {s}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Number of candidates to generate</label>
                        <input type="number" min={5} max={25} value={f.number_to_generate}
                          onChange={e => set('number_to_generate', parseInt(e.target.value) || 15)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Data source</label>
                        <select value={f.data_source_type} onChange={e => set('data_source_type', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                          {DATA_SOURCE_TYPES.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </AdvancedSection>

                <AdvancedSection title="Advanced: Financial & funding requirements">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Currency</label>
                      <select value={f.adv_revenue_currency} onChange={e => set('adv_revenue_currency', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                        {['EUR','NOK','SEK','DKK','GBP','USD'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <Input label="Min revenue (m)" type="number" placeholder="20"
                      value={f.adv_min_revenue} onChange={e => set('adv_min_revenue', e.target.value)} />
                    <Input label="Max revenue (m)" type="number" placeholder="500"
                      value={f.adv_max_revenue} onChange={e => set('adv_max_revenue', e.target.value)} />
                    <Input label="Funding notes" placeholder="End-customer credit quality"
                      value={f.funding_notes} onChange={e => set('funding_notes', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['min_financial_strength', 'Min financial strength required'],
                      ['creditworthiness', 'Creditworthiness required'],
                      ['end_customer_credit', 'End-customer credit quality important'],
                      ['asset_finance', 'Asset finance suitability important'],
                      ['residual_value', 'Residual value important'],
                      ['avoid_weak_credit', 'Avoid weak end-customer credit'],
                    ].map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={!!f.advanced_funding_json[k]}
                          onChange={e => setF(p => ({ ...p, advanced_funding_json: { ...p.advanced_funding_json, [k]: e.target.checked } }))}
                          className="accent-cyan-500" />
                        {label}
                      </label>
                    ))}
                  </div>
                </AdvancedSection>
              </div>
            </div>

            {/* ── Right: sticky summary ── */}
            <div className="sticky top-5">
              <SummaryCard f={f} aiResult={aiResult} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
