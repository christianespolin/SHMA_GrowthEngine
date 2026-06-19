'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { OWNERSHIP_TYPES, STRATEGIC_TRIGGERS } from '@/lib/types'
import {
  ArrowLeft, Sparkles, Loader2, Info, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, Play,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SHMA_CHIPS = [
  'High customer CapEx', 'Complex physical equipment', 'Technical implementation complexity',
  'Service / maintenance need', 'Installed base', 'Aftermarket revenue potential',
  'Monitoring / IoT / data potential', 'Standardized repeatable solution',
  'Residual value / redeployment potential', 'Recurring revenue potential',
  'Asset-backed financing potential', 'Pay-per-use potential', 'Subscription potential',
  'Outcome-based pricing potential', 'Customers prefer OpEx', 'End-customer credit quality matters',
  'Growth pressure', 'Margin pressure', 'Valuation uplift through recurring revenue',
]

const GEO_PRESETS = ['Nordics', 'DACH', 'Benelux', 'UK', 'Europe', 'North America', 'Global']

const OWNERSHIP_TRIGGER_CHIPS = [...OWNERSHIP_TYPES, ...STRATEGIC_TRIGGERS]

const INDUSTRY_PRESETS = [
  'Industrial technology and machinery', 'Warehouse automation and intralogistics',
  'Robotics and automation', 'Maritime, offshore and subsea',
  'Energy, charging, HVAC and building technology', 'Medtech and labtech',
  'AV, control rooms and workplace technology', 'Other asset-heavy B2B technology',
]

// ─── Generating state ─────────────────────────────────────────────────────────

const GENERATION_STEPS = [
  { after: 0,   message: 'Web search running…',              sub: 'Finding real companies online to seed the list (~20s)' },
  { after: 22,  message: 'Claude is generating candidates…', sub: 'One AI call — writing all company profiles (60–90s)' },
  { after: 70,  message: 'Still generating…',                sub: 'Writing analysis for each company' },
  { after: 100, message: 'Nearly done…',                     sub: 'Should complete any moment now' },
  { after: 115, message: 'Taking longer than expected…',     sub: 'Try fewer companies or Quick depth if this times out' },
]

function GeneratingState() {
  const [elapsed, setElapsed] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000)
      setElapsed(secs)
      const next = [...GENERATION_STEPS].reverse().findIndex(s => secs >= s.after)
      if (next >= 0) setStepIdx(GENERATION_STEPS.length - 1 - next)
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  const step = GENERATION_STEPS[Math.min(stepIdx, GENERATION_STEPS.length - 1)]
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
      <div className="text-center space-y-1.5 max-w-sm">
        <h3 className="text-base font-semibold text-slate-200">{step.message}</h3>
        <p className="text-sm text-slate-500">{step.sub}</p>
        <p className="text-xs text-slate-600 mt-3">
          Elapsed: {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} · Typical range: 1–3 minutes
        </p>
      </div>
      <div className="flex gap-1.5">
        {GENERATION_STEPS.slice(0, 5).map((_, i) => (
          <div key={i} className={cn('h-1 rounded-full transition-all duration-500',
            i <= stepIdx ? 'w-8 bg-cyan-500' : 'w-3 bg-slate-700')} />
        ))}
      </div>
    </div>
  )
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      'px-3 py-1.5 rounded-full text-xs border transition-all',
      active
        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
    )}>
      {label}
    </button>
  )
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">{num} · {title}</div>
      {children}
    </div>
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

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ f, aiApplied }: { f: FormState; aiApplied: boolean }) {
  const hasDesc = !!f.scope_definition.trim()
  const hasInclude = !!f.include_text.trim()
  const hasGeo = f.geography_presets.length > 0 || !!f.geography_notes.trim()
  const hasRelevance = f.shma_chips.length > 0
  const hasAvoid = !!f.avoid_text.trim()
  const hasOwnership = f.ownership_triggers.length > 0

  const score = [hasDesc, hasInclude || !!f.reference_text.trim(), hasGeo, hasRelevance, hasAvoid, hasOwnership].filter(Boolean).length
  const level = score >= 5 ? 'strong' : score >= 3 ? 'good' : 'weak'
  const levelCfgMap: Record<string, { label: string; bar: string; text: string }> = {
    weak:   { label: 'Weak',   bar: 'bg-rose-500',    text: 'text-rose-400' },
    good:   { label: 'Good',   bar: 'bg-amber-500',   text: 'text-amber-400' },
    strong: { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-400' },
  }
  const levelCfg = levelCfgMap[level] ?? levelCfgMap.weak

  const warnings: string[] = []
  if (!hasDesc && !hasInclude) warnings.push('No description or include criteria')
  if (!hasRelevance) warnings.push('No SHMA relevance logic selected')
  if (!hasGeo) warnings.push('No geography defined')

  const geos = [...f.geography_presets, ...f.geography_notes.split(',').map(s => s.trim()).filter(Boolean)]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">Search Summary</span>
        <span className={cn('text-xs font-bold', levelCfg.text)}>{levelCfg.label}</span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', levelCfg.bar)} style={{ width: `${(score / 6) * 100}%` }} />
      </div>
      <div className="space-y-1.5 text-xs">
        {f.search_name && <SRow label="Name" value={f.search_name} />}
        {f.search_mode && <SRow label="Mode" value={f.search_mode} />}
        {f.scope_definition && <SRow label="Universe" value={f.scope_definition.slice(0, 120) + (f.scope_definition.length > 120 ? '…' : '')} />}
        {f.include_text && <SRow label="Include" value={f.include_text.slice(0, 80) + (f.include_text.length > 80 ? '…' : '')} />}
        {f.avoid_text && <SRow label="Avoid" value={f.avoid_text.slice(0, 80) + (f.avoid_text.length > 80 ? '…' : '')} warn />}
        {f.reference_text && <SRow label="Similar to" value={f.reference_text} />}
        {f.shma_chips.length > 0 && <SRow label="SHMA" value={f.shma_chips.join(', ')} />}
        {geos.length > 0 && <SRow label="Geography" value={geos.join(', ')} />}
        {f.ownership_triggers.length > 0 && <SRow label="Ownership" value={f.ownership_triggers.join(', ')} />}
      </div>
      {warnings.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-800">
          {warnings.map(w => (
            <div key={w} className="flex items-start gap-1.5 text-xs text-amber-400/80">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{w}
            </div>
          ))}
        </div>
      )}
      {aiApplied && (
        <div className="text-xs text-purple-400/70 flex items-center gap-1 pt-1 border-t border-slate-800">
          <CheckCircle2 className="w-3 h-3" /> Claude has refined this search
        </div>
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

// ─── AI preview ───────────────────────────────────────────────────────────────

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
            <div className="text-xs text-slate-500 mt-0.5">Review before applying</div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg flex gap-2 text-xs text-amber-400/80">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Claude has not verified the market universe unless a data source is connected.
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
              <div className="text-xs text-slate-500 mb-1">Screening criteria</div>
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

// ─── SHMA sliders (advanced) ──────────────────────────────────────────────────

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 flex justify-between">
        <span>{label}</span><span className="text-cyan-400">{value}/5</span>
      </label>
      <input type="range" min={1} max={5} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-600 rounded-full appearance-none cursor-pointer accent-cyan-500" />
      <div className="flex justify-between text-xs text-slate-600"><span>Not required</span><span>Essential</span></div>
    </div>
  )
}

// ─── Types / defaults ─────────────────────────────────────────────────────────

interface FormState {
  search_name: string
  search_mode: string
  scope_definition: string
  include_text: string
  avoid_text: string
  reference_text: string
  shma_chips: string[]
  shma_notes: string
  geography_presets: string[]
  geography_notes: string
  revenue_notes: string
  employee_notes: string
  ownership_triggers: string[]
  // advanced
  adv_industry_presets: string[]
  adv_asset_intensity: number
  adv_technical_complexity: number
  adv_customer_upfront: number
  adv_service_support: number
  adv_software_data: number
  adv_standardization: number
  adv_residual_value: number
  search_depth: string
  number_requested: number
}

const DEFAULT: FormState = {
  search_name: '', search_mode: 'Exploratory discovery', scope_definition: '',
  include_text: '', avoid_text: '', reference_text: '',
  shma_chips: [], shma_notes: '',
  geography_presets: [], geography_notes: '',
  revenue_notes: '', employee_notes: '',
  ownership_triggers: [],
  adv_industry_presets: [],
  adv_asset_intensity: 1, adv_technical_complexity: 1, adv_customer_upfront: 1,
  adv_service_support: 1, adv_software_data: 1, adv_standardization: 1, adv_residual_value: 1,
  search_depth: 'standard', number_requested: 10,
}

const SEARCH_MODES = [
  'Exploratory discovery', 'Similar-company search', 'Problem-based search',
  'Funding-based search', 'Structured search', 'Imported list',
]

// ─── Main form ────────────────────────────────────────────────────────────────

export function DiscoveryFormClient() {
  const router = useRouter()
  const [f, setF] = useState<FormState>(DEFAULT)
  const [loading, setLoading] = useState(false)
  const [refining, setRefining] = useState(false)
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF(p => ({ ...p, [k]: v }))
  const toggleChip = (k: 'shma_chips' | 'geography_presets' | 'ownership_triggers' | 'adv_industry_presets', val: string) =>
    set(k, (f[k] as string[]).includes(val)
      ? (f[k] as string[]).filter(v => v !== val)
      : [...(f[k] as string[]), val])

  const canRun = !!f.search_name.trim() && (!!f.scope_definition.trim() || !!f.include_text.trim())

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
          reference_companies_text: f.reference_text,
          shma_fit: Object.fromEntries(f.shma_chips.map(c => [c, 3])),
          country_presets: f.geography_presets,
          region_notes: f.geography_notes,
          ownership_filters: f.ownership_triggers,
          industry_presets: f.adv_industry_presets,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canRun) { setError('Search name and description or include criteria are required'); return }
    setError(null)
    setLoading(true)

    const geos = [...f.geography_presets, ...f.geography_notes.split(',').map(s => s.trim()).filter(Boolean)]
    const open_criteria = [
      f.scope_definition && `Target universe: ${f.scope_definition}`,
      f.include_text && `Include: ${f.include_text}`,
      f.shma_chips.length && `SHMA relevance: ${f.shma_chips.join(', ')}`,
      f.shma_notes && f.shma_notes,
      f.revenue_notes && `Revenue: ${f.revenue_notes}`,
      f.employee_notes && `Employees: ${f.employee_notes}`,
    ].filter(Boolean).join('\n\n')

    const criteria_json = {
      segments: f.adv_industry_presets,
      countries: geos,
      region: f.geography_notes,
      size_notes: [f.revenue_notes, f.employee_notes].filter(Boolean).join(' · '),
      ownership_types: f.ownership_triggers.filter(o => OWNERSHIP_TYPES.includes(o)),
      strategic_triggers: f.ownership_triggers.filter(o => STRATEGIC_TRIGGERS.includes(o)),
      asset_intensity_min: f.adv_asset_intensity,
      technical_complexity_min: f.adv_technical_complexity,
      customer_upfront_investment_min: f.adv_customer_upfront,
      service_support_potential_min: f.adv_service_support,
      software_data_monitoring_min: f.adv_software_data,
      standardization_potential_min: f.adv_standardization,
      residual_value_min: f.adv_residual_value,
      open_criteria,
      seed_companies: f.reference_text,
      companies_to_avoid: f.avoid_text,
      scope_definition: f.scope_definition,
      shma_relevance_chips: f.shma_chips,
      include_text: f.include_text,
      pasted_company_list: '',
    }

    try {
      const createRes = await fetch('/api/discovery/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_name: f.search_name,
          criteria_json,
          number_requested: f.number_requested,
          search_depth: f.search_depth,
          mode: 'generate',
        }),
      })
      if (!createRes.ok) throw new Error('Failed to create search')
      const search = await createRes.json()

      const runRes = await fetch(`/api/discovery/searches/${search.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!runRes.ok) throw new Error('AI generation failed. The search was created but could not be run.')

      router.push(`/discovery/${search.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="New Discovery Search" subtitle="Configure AI-powered client candidate generation" />
      {showPreview && aiResult && (
        <AiPreview result={aiResult} onApply={applyAiResult} onClose={() => setShowPreview(false)} />
      )}
      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <GeneratingState />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="max-w-[1200px] mx-auto">
              <div className="flex items-center gap-3 mb-5">
                <Link href="/discovery">
                  <Button variant="ghost" size="sm" type="button"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
                </Link>
              </div>

              <div className="grid grid-cols-[1fr_280px] gap-5 items-start">
                {/* ── Left: form sections ── */}
                <div className="space-y-3">

                  {/* Section 1 */}
                  <Section num="1" title="Define Target Universe">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Search name *"
                        placeholder="e.g. Nordic Warehouse Automation Q3 2026"
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
                      <textarea rows={5} value={f.scope_definition}
                        onChange={e => set('scope_definition', e.target.value)}
                        placeholder={`Describe the universe in your own words — strategic logic, not just industry labels.\n\nExample: Find European mid-market companies selling expensive physical equipment where customer CapEx is a barrier, service/maintenance is important, and SHMA could help build an As-a-Service or outcome-based model.\n\nExample: Find companies similar to AutoStore, Element Logic and Vestergaard — asset-heavy, technical, with service/lifecycle potential.`}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                      />
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> This is your primary search definition — be strategic about the business logic.
                      </p>
                    </div>
                  </Section>

                  {/* Section 2 */}
                  <Section num="2" title="Guide the Search">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Include</label>
                        <textarea rows={2} value={f.include_text} onChange={e => set('include_text', e.target.value)}
                          placeholder="Industries, company types, regions or characteristics to include. Example: warehouse automation, airport ground support equipment, aquaculture technology, industrial refrigeration, Nordic and DACH companies."
                          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Avoid</label>
                        <textarea rows={2} value={f.avoid_text} onChange={e => set('avoid_text', e.target.value)}
                          placeholder="Company types or industries to avoid. Example: pure software, consulting, simple distributors, ordinary leasing, low-value services."
                          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Reference companies</label>
                        <textarea rows={2} value={f.reference_text} onChange={e => set('reference_text', e.target.value)}
                          placeholder="Companies that represent the type of target you want. Example: AutoStore, Element Logic, TOMRA, Vestergaard, Kalmar, Kongsberg Maritime."
                          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none" />
                      </div>
                    </div>
                  </Section>

                  {/* Section 3 */}
                  <Section num="3" title="SHMA Relevance">
                    <p className="text-xs text-slate-500">What makes these companies relevant for SHMA?</p>
                    <div className="flex flex-wrap gap-2">
                      {SHMA_CHIPS.map(c => (
                        <Chip key={c} label={c} active={f.shma_chips.includes(c)}
                          onClick={() => toggleChip('shma_chips', c)} />
                      ))}
                    </div>
                    <Input label="Other SHMA relevance logic"
                      placeholder="Any other characteristics that make these companies relevant"
                      value={f.shma_notes} onChange={e => set('shma_notes', e.target.value)} />
                  </Section>

                  {/* Section 4 */}
                  <Section num="4" title="Basic Filters">
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
                        {OWNERSHIP_TRIGGER_CHIPS.map(o => (
                          <Chip key={o} label={o} active={f.ownership_triggers.includes(o)}
                            onClick={() => toggleChip('ownership_triggers', o)} />
                        ))}
                      </div>
                    </div>
                  </Section>

                  {/* Section 5 */}
                  <Section num="5" title="Review and Run">
                    {error && <p className="text-xs text-rose-400">{error}</p>}
                    <Button variant="ghost" className="w-full" type="button" onClick={handleRefine} loading={refining}
                      disabled={!f.scope_definition.trim() && !f.include_text.trim()}>
                      <Sparkles className="w-3.5 h-3.5" /> Let Claude improve search logic
                    </Button>
                    {aiResult && (
                      <div className="p-3 bg-purple-500/8 border border-purple-500/20 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-purple-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Claude has structured the search strategy
                        </div>
                        <button type="button" onClick={() => setShowPreview(true)}
                          className="text-xs text-purple-400 hover:text-purple-300 underline">View result</button>
                      </div>
                    )}
                    <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg flex gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-400/70">Claude has not verified the full market universe unless a data source is connected.</p>
                    </div>
                    <Button variant="primary" className="w-full" type="submit" disabled={!canRun}>
                      <Play className="w-3.5 h-3.5" /> Run Discovery Search
                    </Button>
                    {!canRun && (
                      <p className="text-xs text-slate-600 text-center">Requires: search name · description or include text</p>
                    )}
                  </Section>

                  {/* Advanced sections */}
                  <div className="space-y-2 pt-1">
                    <AdvancedSection title="Advanced: Industry presets">
                      <p className="text-xs text-slate-500">Optional — complements the free-text description above.</p>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRY_PRESETS.map(p => (
                          <Chip key={p} label={p} active={f.adv_industry_presets.includes(p)}
                            onClick={() => toggleChip('adv_industry_presets', p)} />
                        ))}
                      </div>
                    </AdvancedSection>

                    <AdvancedSection title="Advanced: SHMA scoring thresholds">
                      <p className="text-xs text-slate-500">Minimum scores Claude uses to filter or deprioritise companies.</p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        <SliderField label="Asset intensity" value={f.adv_asset_intensity} onChange={v => set('adv_asset_intensity', v)} />
                        <SliderField label="Technical complexity" value={f.adv_technical_complexity} onChange={v => set('adv_technical_complexity', v)} />
                        <SliderField label="Customer upfront investment" value={f.adv_customer_upfront} onChange={v => set('adv_customer_upfront', v)} />
                        <SliderField label="Service & support potential" value={f.adv_service_support} onChange={v => set('adv_service_support', v)} />
                        <SliderField label="Software / data / monitoring" value={f.adv_software_data} onChange={v => set('adv_software_data', v)} />
                        <SliderField label="Standardization potential" value={f.adv_standardization} onChange={v => set('adv_standardization', v)} />
                        <SliderField label="Residual value / redeployment" value={f.adv_residual_value} onChange={v => set('adv_residual_value', v)} />
                      </div>
                    </AdvancedSection>

                    <AdvancedSection title="Advanced: Search depth">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">Search depth</label>
                          <div className="space-y-1.5">
                            {[
                              { v: 'quick', label: 'Quick — faster, fewer details' },
                              { v: 'standard', label: 'Standard' },
                              { v: 'deep', label: 'Deep — slower, richer detail' },
                            ].map(o => (
                              <label key={o.v} className={cn('flex items-center gap-2 text-xs cursor-pointer px-3 py-2 rounded-lg border transition-all',
                                f.search_depth === o.v ? 'border-cyan-500/40 bg-cyan-500/8 text-slate-200' : 'border-slate-700 text-slate-400')}>
                                <input type="radio" name="search_depth" value={o.v} checked={f.search_depth === o.v}
                                  onChange={() => set('search_depth', o.v)} className="accent-cyan-500" />
                                {o.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">Number to generate</label>
                          <input type="number" min={1} max={20} value={f.number_requested}
                            onChange={e => set('number_requested', Math.min(20, Number(e.target.value)))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                          <p className="text-xs text-slate-600 mt-1">Max 20. More = slower.</p>
                        </div>
                      </div>
                    </AdvancedSection>
                  </div>
                </div>

                {/* ── Right: sticky summary ── */}
                <div className="sticky top-5">
                  <SummaryCard f={f} aiApplied={!!aiResult} />
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
