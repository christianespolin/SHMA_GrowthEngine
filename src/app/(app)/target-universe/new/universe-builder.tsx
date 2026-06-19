'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Sparkles, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Target, Globe2, Building2, Sliders, ShieldAlert, Loader2, Info,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SEARCH_MODES = [
  { value: 'Structured search',     label: 'Structured search',     desc: 'Define industries, geography, size and filters' },
  { value: 'Open strategic search', label: 'Open strategic search', desc: 'Describe the universe in free text — AI structures criteria' },
  { value: 'Similar-company search',label: 'Similar-company search',desc: 'Provide reference companies and find similar targets' },
  { value: 'Problem-based search',  label: 'Problem-based search',  desc: 'Define customer pain, CapEx barrier or service burden' },
  { value: 'Imported universe',     label: 'Imported universe',     desc: 'Upload or paste a company list and screen it' },
]

const INDUSTRY_PRESETS = [
  'Industrial technology and machinery',
  'Warehouse automation and intralogistics',
  'Robotics and automation',
  'Maritime, offshore and subsea',
  'Energy, charging, HVAC and building technology',
  'Medtech and labtech',
  'AV/control rooms and workplace technology',
]

const COUNTRY_PRESETS = [
  'Norway','Sweden','Denmark','Finland','Germany','Netherlands','Belgium',
  'United Kingdom','France','Switzerland','Austria','Spain','Italy','Poland',
  'United States','Canada','Australia','Singapore',
]

const OWNERSHIP_OPTIONS = [
  'Founder-owned','Family-owned','PE-owned','Investor-backed',
  'Listed','Industrial group-owned','Corporate carve-out','Unknown / any',
]

const STRATEGIC_TRIGGER_OPTIONS = [
  'PE-owned','Board-driven','Founder transition','Growth pressure',
  'Recurring revenue ambition','Margin pressure','Customer CapEx friction',
  'Service revenue opportunity','International expansion',
]

const SHMA_FIT_KEYS = [
  { key: 'asset_intensity',         label: 'Asset intensity' },
  { key: 'customer_upfront_inv',    label: 'Customer upfront investment' },
  { key: 'technical_complexity',    label: 'Technical complexity' },
  { key: 'service_support',         label: 'Service/support potential' },
  { key: 'software_data',           label: 'Software/data/monitoring potential' },
  { key: 'standardization',         label: 'Standardisation potential' },
  { key: 'residual_value',          label: 'Residual value/redeployment potential' },
  { key: 'recurring_revenue',       label: 'Recurring revenue potential' },
  { key: 'installed_base',          label: 'Installed base potential' },
  { key: 'aftermarket',             label: 'Aftermarket/service revenue potential' },
]

const FIT_LABELS = ['Not important','Nice to have','Important','Critical']

const UNIVERSE_SIZES = ['Unknown','Small niche: <1,000','Focused: 1,000–5,000','Broad: 5,000–25,000','Very broad: 25,000–100,000+']
const SEARCH_DEPTHS = ['Estimate only','Build universe list','Objective screening','AI qualification sample','Deep AI qualification']
const DATA_SOURCE_TYPES = ['Manual','CSV/XLS upload','External data provider','Company registry','AI estimated','Mixed']
const STATUSES = ['Draft','Active','Screening','Completed','Archived']

const DISQUALIFIER_OPTIONS = [
  { key: 'exclude_pure_software',      label: 'Exclude pure software companies' },
  { key: 'exclude_consulting',         label: 'Exclude pure consulting companies' },
  { key: 'exclude_distributors',       label: 'Exclude distributors/resellers only' },
  { key: 'exclude_very_small',         label: 'Exclude very small companies' },
  { key: 'exclude_no_service',         label: 'Exclude companies without service/support potential' },
  { key: 'exclude_no_physical',        label: 'Exclude companies with no physical asset connection' },
  { key: 'exclude_simple_leasing',     label: 'Exclude companies where only simple leasing is relevant' },
  { key: 'exclude_no_mgmt_willingness',label: 'Exclude companies without likely management willingness to change' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  status: string
  data_source_type: string
  search_mode: string
  scope_definition: string
  industry_presets: string[]
  include_industries_text: string
  exclude_industries_text: string
  reference_companies_text: string
  country_presets: string[]
  region_notes: string
  include_countries_text: string
  exclude_countries_text: string
  any_geography: boolean
  min_revenue: string
  max_revenue: string
  revenue_currency: string
  revenue_notes: string
  min_employees: string
  max_employees: string
  ownership_filters: string[]
  strategic_triggers: string[]
  shma_fit: Record<string, number>
  funding: Record<string, boolean>
  funding_notes: string
  disqualifiers: Record<string, boolean>
  other_exclusions_text: string
  expected_universe_size: string
  search_depth: string
  estimated_total_count: string
}

const DEFAULT_FORM: FormState = {
  name: '', status: 'Draft', data_source_type: 'Manual',
  search_mode: 'Open strategic search',
  scope_definition: '',
  industry_presets: [],
  include_industries_text: '', exclude_industries_text: '', reference_companies_text: '',
  country_presets: [], region_notes: '', include_countries_text: '', exclude_countries_text: '', any_geography: false,
  min_revenue: '', max_revenue: '', revenue_currency: 'EUR', revenue_notes: '',
  min_employees: '', max_employees: '',
  ownership_filters: [], strategic_triggers: [],
  shma_fit: {},
  funding: {}, funding_notes: '',
  disqualifiers: {},
  other_exclusions_text: '',
  expected_universe_size: 'Unknown',
  search_depth: 'Build universe list',
  estimated_total_count: '',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children, collapsible = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; collapsible?: boolean
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => collapsible && setOpen(o => !o)}
        className={cn('w-full flex items-center justify-between px-5 py-4', collapsible && 'cursor-pointer hover:bg-slate-800/50 transition-colors')}
      >
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
          <span className="text-cyan-400">{icon}</span>
          {title}
        </div>
        {collapsible && (open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />)}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  )
}

function PresetToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs border transition-all',
        active
          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
      )}
    >
      {label}
    </button>
  )
}

function FitSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-52 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1">
        {FIT_LABELS.map((l, i) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              'flex-1 py-1 text-xs rounded border transition-all',
              value === i
                ? i === 0 ? 'bg-slate-700 border-slate-600 text-slate-300'
                  : i === 1 ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : i === 2 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-600 hover:border-slate-600'
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Completeness & warnings ──────────────────────────────────────────────────

function useCompleteness(form: FormState) {
  const warnings: string[] = []
  const hasScope = !!form.scope_definition.trim()
  const hasIndustry = form.industry_presets.length > 0 || !!form.include_industries_text.trim()
  const hasRef = !!form.reference_companies_text.trim()
  const hasGeo = form.country_presets.length > 0 || !!form.region_notes.trim() || !!form.include_countries_text.trim() || form.any_geography
  const hasExclusions = Object.values(form.disqualifiers).some(Boolean) || !!form.other_exclusions_text.trim() || !!form.exclude_industries_text.trim()
  const hasSize = !!form.min_revenue || !!form.max_revenue || !!form.min_employees || !!form.max_employees
  const hasFit = Object.keys(form.shma_fit).length > 0

  if (!form.name.trim()) warnings.push('Universe name is required')
  if (!hasScope && !hasIndustry && !hasRef) warnings.push('No scope, industry or reference companies defined')
  if (!hasGeo) warnings.push('No geography or region selected')
  if (!hasExclusions) warnings.push('No disqualifiers defined — may generate poor matches')
  if (!hasSize) warnings.push('No revenue or employee criteria set')

  const score = [hasScope, hasIndustry || hasRef, hasGeo, hasExclusions, hasSize, hasFit].filter(Boolean).length
  const canSave = !!form.name.trim() && (hasScope || hasIndustry || hasRef) && hasGeo
  const level = score >= 5 ? 'strong' : score >= 3 ? 'good' : 'weak'

  return { warnings, level, score, canSave }
}

// ─── Summary panel ────────────────────────────────────────────────────────────

function SummaryPanel({ form }: { form: FormState }) {
  const { level, score, warnings } = useCompleteness(form)

  const levelConfig = {
    weak:   { label: 'Weak definition',   color: 'text-rose-400',    bar: 'bg-rose-500' },
    good:   { label: 'Good definition',   color: 'text-amber-400',   bar: 'bg-amber-500' },
    strong: { label: 'Strong definition', color: 'text-emerald-400', bar: 'bg-emerald-500' },
  }[level]

  const industries = [
    ...form.industry_presets,
    ...form.include_industries_text.split(',').map(s => s.trim()).filter(Boolean),
  ]
  const excludeIndustries = form.exclude_industries_text.split(',').map(s => s.trim()).filter(Boolean)
  const geos = [
    ...(form.any_geography ? ['Any geography'] : []),
    ...form.country_presets,
    ...form.region_notes.split(',').map(s => s.trim()).filter(Boolean),
    ...form.include_countries_text.split(',').map(s => s.trim()).filter(Boolean),
  ]

  return (
    <div className="space-y-4">
      {/* Completeness */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Definition quality</span>
          <span className={cn('text-xs font-bold', levelConfig.color)}>{levelConfig.label}</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', levelConfig.bar)} style={{ width: `${(score / 6) * 100}%` }} />
        </div>
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {warnings.map(w => (
              <div key={w} className="flex items-start gap-1.5 text-xs text-amber-400/80">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Summary</div>
        <div className="space-y-2.5 text-xs">
          <Row label="Mode" value={form.search_mode || '—'} />
          {form.scope_definition && (
            <div>
              <div className="text-slate-500 mb-1">Scope</div>
              <div className="text-slate-300 leading-relaxed">{form.scope_definition.slice(0, 150)}{form.scope_definition.length > 150 ? '…' : ''}</div>
            </div>
          )}
          {industries.length > 0 && <Row label="Industries" value={industries.join(', ')} />}
          {excludeIndustries.length > 0 && <Row label="Excludes" value={excludeIndustries.join(', ')} warn />}
          {form.reference_companies_text && <Row label="Similar to" value={form.reference_companies_text} />}
          {geos.length > 0 && <Row label="Geography" value={geos.join(', ')} />}
          {(form.min_revenue || form.max_revenue) && (
            <Row label="Revenue" value={[form.min_revenue && `${form.revenue_currency} ${form.min_revenue}m+`, form.max_revenue && `up to ${form.revenue_currency} ${form.max_revenue}m`].filter(Boolean).join(' – ')} />
          )}
          {form.ownership_filters.length > 0 && <Row label="Ownership" value={form.ownership_filters.join(', ')} />}
          {form.expected_universe_size !== 'Unknown' && <Row label="Size estimate" value={form.expected_universe_size} />}
          {form.search_depth && <Row label="Search depth" value={form.search_depth} />}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <span className="text-slate-500">{label}: </span>
      <span className={warn ? 'text-rose-400' : 'text-slate-300'}>{value}</span>
    </div>
  )
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function UniverseBuilder() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [refining, setRefining] = useState(false)
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { canSave, warnings } = useCompleteness(form)

  const set = (key: keyof FormState, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const toggleArr = (key: keyof FormState, val: string) => {
    const arr = (form[key] as string[]) || []
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const setFit = (k: string, v: number) => setForm(f => ({ ...f, shma_fit: { ...f.shma_fit, [k]: v } }))
  const setFunding = (k: string, v: boolean) => setForm(f => ({ ...f, funding: { ...f.funding, [k]: v } }))
  const setDisq = (k: string, v: boolean) => setForm(f => ({ ...f, disqualifiers: { ...f.disqualifiers, [k]: v } }))

  const handleRefine = async () => {
    setRefining(true)
    setAiError(null)
    try {
      const res = await fetch('/api/target-universe/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'AI refinement failed')
      setAiResult(json.result)
      // Auto-fill name if empty
      if (!form.name && json.result?.suggested_name) set('name', json.result.suggested_name)
      if (!form.scope_definition && json.result?.clean_scope_definition) set('scope_definition', json.result.clean_scope_definition)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI refinement failed')
    } finally {
      setRefining(false)
    }
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const body = {
        name: form.name,
        status: form.status,
        data_source_type: form.data_source_type,
        scope_definition: form.scope_definition || null,
        search_mode: form.search_mode,
        industry_presets: form.industry_presets.length ? form.industry_presets : null,
        include_industries_text: form.include_industries_text || null,
        exclude_industries_text: form.exclude_industries_text || null,
        reference_companies_text: form.reference_companies_text || null,
        country_presets: form.country_presets.length ? form.country_presets : null,
        region_notes: form.region_notes || null,
        include_countries_text: form.any_geography ? 'Any geography' : (form.include_countries_text || null),
        exclude_countries_text: form.exclude_countries_text || null,
        geography: [
          ...form.country_presets,
          ...form.region_notes.split(',').map(s => s.trim()).filter(Boolean),
          ...(form.any_geography ? ['Any'] : []),
        ].filter(Boolean) || null,
        industries: [
          ...form.industry_presets,
          ...form.include_industries_text.split(',').map(s => s.trim()).filter(Boolean),
        ].filter(Boolean) || null,
        min_revenue: form.min_revenue ? parseFloat(form.min_revenue) : null,
        max_revenue: form.max_revenue ? parseFloat(form.max_revenue) : null,
        revenue_currency: form.revenue_currency || null,
        revenue_notes: form.revenue_notes || null,
        min_employees: form.min_employees ? parseInt(form.min_employees) : null,
        max_employees: form.max_employees ? parseInt(form.max_employees) : null,
        ownership_filters: form.ownership_filters.length ? form.ownership_filters : null,
        strategic_triggers: form.strategic_triggers.length ? form.strategic_triggers : null,
        shma_fit_requirements_json: Object.keys(form.shma_fit).length ? form.shma_fit : null,
        funding_requirements_json: Object.keys(form.funding).length ? { ...form.funding, notes: form.funding_notes } : null,
        exclusion_criteria_json: Object.keys(form.disqualifiers).length ? form.disqualifiers : null,
        other_exclusions_text: form.other_exclusions_text || null,
        expected_universe_size: form.expected_universe_size,
        search_depth: form.search_depth,
        estimated_total_count: form.estimated_total_count ? parseInt(form.estimated_total_count) : null,
        ai_structured_criteria_json: aiResult || null,
      }
      const res = await fetch('/api/target-universe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      router.push(`/target-universe/${json.universe.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/target-universe">
            <Button variant="ghost" size="sm" type="button"><ArrowLeft className="w-3.5 h-3.5" /> Back</Button>
          </Link>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
          {/* ── Left: form ── */}
          <div className="space-y-4">

            {/* Name + meta */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <Input
                label="Universe name *"
                placeholder="e.g. Nordic Warehouse Automation & Robotics Q3 2026"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Data source</label>
                  <select value={form.data_source_type} onChange={e => set('data_source_type', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                    {DATA_SOURCE_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <Input label="Estimated size" type="number" placeholder="5000" value={form.estimated_total_count} onChange={e => set('estimated_total_count', e.target.value)} />
              </div>
            </div>

            {/* Section 1: Search Strategy */}
            <Section title="1. Search Strategy" icon={<Target className="w-4 h-4" />}>
              <Textarea
                label="Define your target universe in your own words *"
                placeholder={`Examples:
• Find European companies selling expensive industrial equipment where customer CapEx is a barrier and service/maintenance is important.
• Find companies similar to AutoStore, Element Logic, TOMRA and Kalmar — exclude pure software and consulting.
• Find mid-sized B2B companies in Northern Europe with physical assets, installed base and potential for subscription or pay-per-use models.`}
                value={form.scope_definition}
                onChange={e => set('scope_definition', e.target.value)}
                rows={5}
              />
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg flex gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300/70">
                  This is your primary search definition. Be strategic, not just descriptive — explain the business logic that makes these companies relevant for SHMA.
                </p>
              </div>
            </Section>

            {/* Section 2: Search Mode */}
            <Section title="2. Search Mode" icon={<Sliders className="w-4 h-4" />}>
              <div className="grid grid-cols-1 gap-2">
                {SEARCH_MODES.map(m => (
                  <label key={m.value} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    form.search_mode === m.value
                      ? 'border-cyan-500/40 bg-cyan-500/8'
                      : 'border-slate-700 hover:border-slate-600'
                  )}>
                    <input type="radio" name="search_mode" value={m.value} checked={form.search_mode === m.value}
                      onChange={() => set('search_mode', m.value)} className="mt-0.5 accent-cyan-500" />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{m.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Section>

            {/* Section 3: Industry & Segment */}
            <Section title="3. Industry & Segment" icon={<Building2 className="w-4 h-4" />}>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">Industry presets <span className="text-slate-600 font-normal">(click to include)</span></div>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_PRESETS.map(p => (
                    <PresetToggle key={p} label={p} active={form.industry_presets.includes(p)} onClick={() => toggleArr('industry_presets', p)} />
                  ))}
                </div>
              </div>
              <Textarea
                label="Free-text industries to include"
                placeholder="e.g. airport ground support equipment, fish farming equipment, industrial refrigeration, automated storage, lab automation, marine sensors"
                value={form.include_industries_text}
                onChange={e => set('include_industries_text', e.target.value)}
                rows={2}
              />
              <Textarea
                label="Industries to exclude"
                placeholder="e.g. pure software, IT consulting, simple distributors, staffing, ordinary leasing, low-value services"
                value={form.exclude_industries_text}
                onChange={e => set('exclude_industries_text', e.target.value)}
                rows={2}
              />
              <Textarea
                label="Reference companies / similar-to"
                placeholder="e.g. AutoStore, Element Logic, TOMRA, Kalmar, Vestergaard, Kongsberg Maritime"
                value={form.reference_companies_text}
                onChange={e => set('reference_companies_text', e.target.value)}
                rows={2}
              />
            </Section>

            {/* Section 4: Geography */}
            <Section title="4. Geography" icon={<Globe2 className="w-4 h-4" />}>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">Country presets</div>
                <div className="flex flex-wrap gap-2">
                  {COUNTRY_PRESETS.map(c => (
                    <PresetToggle key={c} label={c} active={form.country_presets.includes(c)} onClick={() => toggleArr('country_presets', c)} />
                  ))}
                  <PresetToggle label="Any geography" active={form.any_geography} onClick={() => set('any_geography', !form.any_geography)} />
                </div>
              </div>
              <Input
                label="Free-text region / geography"
                placeholder="e.g. Nordics, DACH, Northern Europe, Benelux, global niche leaders, export-oriented European companies"
                value={form.region_notes}
                onChange={e => set('region_notes', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Additional countries to include" placeholder="e.g. Portugal, Ireland" value={form.include_countries_text} onChange={e => set('include_countries_text', e.target.value)} />
                <Input label="Countries to exclude" placeholder="e.g. Russia, Belarus" value={form.exclude_countries_text} onChange={e => set('exclude_countries_text', e.target.value)} />
              </div>
            </Section>

            {/* Section 5: Size & Ownership */}
            <Section title="5. Company Size & Ownership" icon={<Building2 className="w-4 h-4" />} collapsible>
              <div className="grid grid-cols-4 gap-3">
                <Input label="Min revenue" type="number" placeholder="20" value={form.min_revenue} onChange={e => set('min_revenue', e.target.value)} />
                <Input label="Max revenue" type="number" placeholder="500" value={form.max_revenue} onChange={e => set('max_revenue', e.target.value)} />
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Currency</label>
                  <select value={form.revenue_currency} onChange={e => set('revenue_currency', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                    {['EUR','NOK','SEK','DKK','GBP','USD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Input label="Revenue notes" placeholder="Mid-market" value={form.revenue_notes} onChange={e => set('revenue_notes', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Min employees" type="number" placeholder="50" value={form.min_employees} onChange={e => set('min_employees', e.target.value)} />
                <Input label="Max employees" type="number" placeholder="5000" value={form.max_employees} onChange={e => set('max_employees', e.target.value)} />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">Ownership type</div>
                <div className="flex flex-wrap gap-2">
                  {OWNERSHIP_OPTIONS.map(o => (
                    <PresetToggle key={o} label={o} active={form.ownership_filters.includes(o)} onClick={() => toggleArr('ownership_filters', o)} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">Strategic triggers</div>
                <div className="flex flex-wrap gap-2">
                  {STRATEGIC_TRIGGER_OPTIONS.map(o => (
                    <PresetToggle key={o} label={o} active={form.strategic_triggers.includes(o)} onClick={() => toggleArr('strategic_triggers', o)} />
                  ))}
                </div>
              </div>
            </Section>

            {/* Section 6: SHMA-fit */}
            <Section title="6. SHMA-Fit Requirements" icon={<CheckCircle2 className="w-4 h-4" />} collapsible>
              <p className="text-xs text-slate-500">Set the importance of each SHMA servitization factor. Higher-rated factors will be weighted more heavily in AI qualification.</p>
              <div className="space-y-2">
                {SHMA_FIT_KEYS.map(({ key, label }) => (
                  <FitSlider key={key} label={label} value={form.shma_fit[key] ?? 0} onChange={v => setFit(key, v)} />
                ))}
              </div>
            </Section>

            {/* Section 7: Financial & Funding */}
            <Section title="7. Financial & Funding Filters" icon={<Building2 className="w-4 h-4" />} collapsible>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'min_financial_strength', label: 'Minimum financial strength required' },
                  { key: 'creditworthiness',        label: 'Creditworthiness required' },
                  { key: 'end_customer_credit',     label: 'End-customer credit quality important' },
                  { key: 'asset_finance',           label: 'Asset finance suitability important' },
                  { key: 'residual_value',          label: 'Residual value important' },
                  { key: 'avoid_weak_credit',       label: 'Avoid companies with weak end-customer credit profile' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={!!form.funding[key]} onChange={e => setFunding(key, e.target.checked)} className="accent-cyan-500" />
                    {label}
                  </label>
                ))}
              </div>
              <Input label="Financing/funding relevance notes" placeholder="e.g. Must have end-customers with investment-grade credit quality" value={form.funding_notes} onChange={e => set('funding_notes', e.target.value)} />
            </Section>

            {/* Section 8: Disqualifiers */}
            <Section title="8. Negative Filters / Disqualifiers" icon={<ShieldAlert className="w-4 h-4" />} collapsible>
              <div className="grid grid-cols-2 gap-3">
                {DISQUALIFIER_OPTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={!!form.disqualifiers[key]} onChange={e => setDisq(key, e.target.checked)} className="accent-cyan-500" />
                    {label}
                  </label>
                ))}
              </div>
              <Textarea label="Other exclusions" placeholder="Describe any additional exclusion criteria" value={form.other_exclusions_text} onChange={e => set('other_exclusions_text', e.target.value)} rows={2} />
            </Section>

            {/* Section 9: Size & depth */}
            <Section title="9. Universe Size & Search Depth" icon={<Sliders className="w-4 h-4" />} collapsible>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">Target universe size expectation</div>
                  <div className="space-y-1.5">
                    {UNIVERSE_SIZES.map(s => (
                      <label key={s} className={cn('flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition-all',
                        form.expected_universe_size === s ? 'border-cyan-500/40 bg-cyan-500/8 text-slate-200' : 'border-slate-700 text-slate-400 hover:border-slate-600')}>
                        <input type="radio" name="expected_universe_size" value={s} checked={form.expected_universe_size === s} onChange={() => set('expected_universe_size', s)} className="accent-cyan-500" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">Search depth</div>
                  <div className="space-y-1.5">
                    {SEARCH_DEPTHS.map(s => (
                      <label key={s} className={cn('flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition-all',
                        form.search_depth === s ? 'border-cyan-500/40 bg-cyan-500/8 text-slate-200' : 'border-slate-700 text-slate-400 hover:border-slate-600')}>
                        <input type="radio" name="search_depth" value={s} checked={form.search_depth === s} onChange={() => set('search_depth', s)} className="accent-cyan-500" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* AI refinement */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-200">AI Criteria Refinement</div>
                  <p className="text-xs text-slate-500 mt-0.5">Let Claude structure your search strategy into precise qualification criteria</p>
                </div>
                <Button variant="ghost" size="sm" type="button" onClick={handleRefine} loading={refining} disabled={!form.scope_definition.trim() && !form.include_industries_text.trim() && !form.reference_companies_text.trim()}>
                  <Sparkles className="w-3.5 h-3.5" /> Let AI structure this universe
                </Button>
              </div>
              <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg flex gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/70">AI has structured the search strategy. It has not verified the full market universe unless a data source is connected.</p>
              </div>
              {aiError && <p className="text-xs text-rose-400">{aiError}</p>}
              {aiResult && (
                <div className="space-y-3">
                  {aiResult.suggested_name && (
                    <div><span className="text-xs text-slate-500">Suggested name: </span><span className="text-xs text-slate-200">{String(aiResult.suggested_name)}</span></div>
                  )}
                  {aiResult.clean_scope_definition && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Structured scope</div>
                      <div className="text-xs text-slate-300 bg-slate-800 rounded-lg p-3">{String(aiResult.clean_scope_definition)}</div>
                    </div>
                  )}
                  {(aiResult.included_industries as string[])?.length > 0 && (
                    <Row label="Included industries" value={(aiResult.included_industries as string[]).join(', ')} />
                  )}
                  {(aiResult.excluded_industries as string[])?.length > 0 && (
                    <Row label="Excluded industries" value={(aiResult.excluded_industries as string[]).join(', ')} warn />
                  )}
                  {(aiResult.disqualifiers as string[])?.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Disqualifiers</div>
                      <ul className="space-y-0.5">
                        {(aiResult.disqualifiers as string[]).map((d, i) => <li key={i} className="text-xs text-rose-300">• {d}</li>)}
                      </ul>
                    </div>
                  )}
                  {(aiResult.clarifying_questions as string[])?.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Clarifying questions from AI</div>
                      <ul className="space-y-0.5">
                        {(aiResult.clarifying_questions as string[]).map((q, i) => <li key={i} className="text-xs text-amber-300">? {q}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save */}
            {error && <p className="text-sm text-rose-400">{error}</p>}
            {warnings.filter(w => w.includes('required')).map(w => (
              <p key={w} className="text-xs text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {w}</p>
            ))}
            <div className="flex gap-3 pb-6">
              <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave} disabled={!canSave}>
                <Target className="w-4 h-4" /> Save Target Universe
              </Button>
              <Link href="/target-universe">
                <Button variant="ghost">Cancel</Button>
              </Link>
            </div>
          </div>

          {/* ── Right: summary panel ── */}
          <div className="sticky top-6">
            <SummaryPanel form={form} />
          </div>
        </div>
      </div>
    </div>
  )
}
