'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { DISCOVERY_SEGMENTS, OWNERSHIP_TYPES, STRATEGIC_TRIGGERS, DiscoveryCriteria } from '@/lib/types'
import { ArrowLeft, Sparkles, Loader2, Save, FolderOpen, X as XIcon } from 'lucide-react'

const COUNTRIES = [
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Netherlands', 'Germany', 'United Kingdom',
  'France', 'Belgium', 'Switzerland', 'Austria', 'Spain', 'Italy', 'Poland',
  'United States', 'Canada', 'Australia', 'Singapore', 'Any',
]

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

  const step = GENERATION_STEPS[stepIdx]
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
      <div className="text-center space-y-1.5 max-w-sm">
        <h3 className="text-base font-semibold text-slate-200">{step.message}</h3>
        <p className="text-sm text-slate-500">{step.sub}</p>
        <p className="text-xs text-slate-600 mt-3">Elapsed: {elapsedStr} · Typical range: 1–3 minutes</p>
      </div>
      <div className="flex gap-1.5">
        {GENERATION_STEPS.slice(0, 5).map((_, i) => (
          <div key={i} className={cn('h-1 rounded-full transition-all duration-500', i <= stepIdx ? 'w-8 bg-cyan-500' : 'w-3 bg-slate-700')} />
        ))}
      </div>
    </div>
  )
}

function SliderField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex justify-between">
        <span>{label}</span>
        <span className="text-cyan-400">{value}/5</span>
      </label>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-600 rounded-full appearance-none cursor-pointer accent-cyan-500"
      />
      <div className="flex justify-between text-xs text-slate-600">
        <span>Not required</span>
        <span>Essential</span>
      </div>
    </div>
  )
}

function MultiCheckbox({
  options, selected, onToggle,
}: { options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label
          key={opt}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-colors',
            selected.includes(opt)
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
          )}
        >
          <input
            type="checkbox"
            className="hidden"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {children}
    </div>
  )
}

const TEMPLATE_KEY = 'shma_discovery_templates'
interface Template { name: string; criteria: Partial<DiscoveryCriteria>; savedAt: string }

const defaultCriteria: DiscoveryCriteria = {
  segments: [],
  countries: [],
  region: '',
  min_revenue: '',
  max_revenue: '',
  min_employees: '',
  max_employees: '',
  size_notes: '',
  ownership_types: [],
  strategic_triggers: [],
  asset_intensity_min: 1,
  technical_complexity_min: 1,
  customer_upfront_investment_min: 1,
  service_support_potential_min: 1,
  software_data_monitoring_min: 1,
  standardization_potential_min: 1,
  residual_value_min: 1,
  open_criteria: '',
  seed_companies: '',
  companies_to_avoid: '',
  pasted_company_list: '',
}

export function DiscoveryFormClient() {
  const router = useRouter()
  const [searchName, setSearchName] = useState('')
  const [mode, setMode] = useState<'generate' | 'enrich'>('generate')
  const [searchDepth, setSearchDepth] = useState('standard')
  const [numberRequested, setNumberRequested] = useState(10)
  const [criteria, setCriteria] = useState<DiscoveryCriteria>(defaultCriteria)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_KEY)
      if (saved) setTemplates(JSON.parse(saved))
    } catch {}
  }, [])

  const saveTemplate = () => {
    if (!templateName.trim()) return
    const t: Template = { name: templateName, criteria, savedAt: new Date().toISOString() }
    const updated = [...templates.filter(x => x.name !== templateName), t]
    setTemplates(updated)
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(updated))
    setTemplateName('')
    setShowSaveTemplate(false)
  }

  const loadTemplate = (t: Template) => {
    setCriteria(prev => ({ ...prev, ...t.criteria }))
    setShowTemplates(false)
  }

  const deleteTemplate = (name: string) => {
    const updated = templates.filter(t => t.name !== name)
    setTemplates(updated)
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(updated))
  }

  const updateCriteria = (key: keyof DiscoveryCriteria, value: DiscoveryCriteria[typeof key]) => {
    setCriteria(prev => ({ ...prev, [key]: value }))
  }

  const toggleArray = (key: 'segments' | 'countries' | 'ownership_types' | 'strategic_triggers', value: string) => {
    setCriteria(prev => {
      const arr = prev[key] as string[]
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchName.trim()) {
      setError('Search name is required')
      return
    }
    setError(null)
    setLoading(true)

    try {
      // Create search
      const createRes = await fetch('/api/discovery/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_name: searchName,
          criteria_json: criteria,
          number_requested: numberRequested,
          search_depth: searchDepth,
          mode,
        }),
      })

      if (!createRes.ok) {
        throw new Error('Failed to create search')
      }

      const search = await createRes.json()

      // Run AI
      const runRes = await fetch(`/api/discovery/searches/${search.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!runRes.ok) {
        throw new Error('AI generation failed. The search was created but could not be run.')
      }

      router.push(`/discovery/${search.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="New Discovery Search" subtitle="Configure AI-powered client candidate generation" />
      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <GeneratingState />
        ) : (
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-5 pb-10">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/discovery">
                <Button variant="ghost" size="sm" type="button">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
              </Link>
              <div className="flex-1" />
              {/* Template actions */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => { setShowTemplates(!showTemplates); setShowSaveTemplate(false) }}
                >
                  <FolderOpen className="h-3.5 w-3.5" /> Load template
                  {templates.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">{templates.length}</span>
                  )}
                </Button>
                {showTemplates && (
                  <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl min-w-60">
                    {templates.length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-500">No saved templates yet</div>
                    )}
                    {templates.map(t => (
                      <div key={t.name} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50">
                        <button
                          type="button"
                          onClick={() => loadTemplate(t)}
                          className="flex-1 text-left"
                        >
                          <div className="text-sm text-slate-200">{t.name}</div>
                          <div className="text-xs text-slate-500">{new Date(t.savedAt).toLocaleDateString()}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTemplate(t.name)}
                          className="text-slate-600 hover:text-rose-400 transition-colors"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!showSaveTemplate ? (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => { setShowSaveTemplate(true); setShowTemplates(false) }}
                >
                  <Save className="h-3.5 w-3.5" /> Save as template
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="Template name…"
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-40"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveTemplate() } }}
                  />
                  <Button variant="primary" size="sm" type="button" onClick={saveTemplate} disabled={!templateName.trim()}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowSaveTemplate(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            {/* 1. Search Setup */}
            <SectionCard title="1. Search Setup">
              <Input
                label="Search name"
                placeholder="e.g. Nordic robotics companies Q2 2026"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                required
              />
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Mode"
                  value={mode}
                  onChange={e => setMode(e.target.value as 'generate' | 'enrich')}
                  options={[
                    { value: 'generate', label: 'Generate new candidates' },
                    { value: 'enrich', label: 'Enrich company list' },
                  ]}
                />
                <Select
                  label="Search depth"
                  value={searchDepth}
                  onChange={e => setSearchDepth(e.target.value)}
                  options={[
                    { value: 'quick', label: 'Quick (faster, fewer details)' },
                    { value: 'standard', label: 'Standard' },
                    { value: 'deep', label: 'Deep (slower, richer detail)' },
                  ]}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Number to generate
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={numberRequested}
                    onChange={e => setNumberRequested(Math.min(15, Number(e.target.value)))}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-colors duration-150"
                    disabled={mode === 'enrich'}
                  />
                </div>
              </div>
            </SectionCard>

            {/* 2. Target Universe */}
            <SectionCard title="2. Target Universe">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-2">
                  Industry segments
                </label>
                <MultiCheckbox
                  options={DISCOVERY_SEGMENTS}
                  selected={criteria.segments}
                  onToggle={v => toggleArray('segments', v)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-2">
                  Countries
                </label>
                <MultiCheckbox
                  options={COUNTRIES}
                  selected={criteria.countries}
                  onToggle={v => toggleArray('countries', v)}
                />
              </div>
              <Input
                label="Region / geography notes"
                placeholder="e.g. Northern Europe, DACH, Nordics..."
                value={criteria.region}
                onChange={e => updateCriteria('region', e.target.value)}
              />
            </SectionCard>

            {/* 3. Company Size */}
            <SectionCard title="3. Company Size">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min revenue"
                  placeholder="e.g. €10M"
                  value={criteria.min_revenue}
                  onChange={e => updateCriteria('min_revenue', e.target.value)}
                />
                <Input
                  label="Max revenue"
                  placeholder="e.g. €200M"
                  value={criteria.max_revenue}
                  onChange={e => updateCriteria('max_revenue', e.target.value)}
                />
                <Input
                  label="Min employees"
                  placeholder="e.g. 50"
                  value={criteria.min_employees}
                  onChange={e => updateCriteria('min_employees', e.target.value)}
                />
                <Input
                  label="Max employees"
                  placeholder="e.g. 2000"
                  value={criteria.max_employees}
                  onChange={e => updateCriteria('max_employees', e.target.value)}
                />
              </div>
              <Input
                label="Size notes"
                placeholder="e.g. Mid-market preferred, PE-ready, not listed"
                value={criteria.size_notes}
                onChange={e => updateCriteria('size_notes', e.target.value)}
              />
            </SectionCard>

            {/* 4. Ownership & Triggers */}
            <SectionCard title="4. Ownership & Strategic Triggers">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-2">
                  Ownership types
                </label>
                <MultiCheckbox
                  options={OWNERSHIP_TYPES}
                  selected={criteria.ownership_types}
                  onToggle={v => toggleArray('ownership_types', v)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-2">
                  Strategic triggers (why now)
                </label>
                <MultiCheckbox
                  options={STRATEGIC_TRIGGERS}
                  selected={criteria.strategic_triggers}
                  onToggle={v => toggleArray('strategic_triggers', v)}
                />
              </div>
            </SectionCard>

            {/* 5. SHMA Fit Criteria */}
            <SectionCard title="5. SHMA Fit Criteria — Minimum Thresholds">
              <p className="text-xs text-slate-500">
                Set minimum acceptable scores (1–5). Claude will filter or deprioritize companies below these thresholds.
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <SliderField
                  label="Asset intensity"
                  value={criteria.asset_intensity_min}
                  onChange={v => updateCriteria('asset_intensity_min', v)}
                />
                <SliderField
                  label="Technical complexity"
                  value={criteria.technical_complexity_min}
                  onChange={v => updateCriteria('technical_complexity_min', v)}
                />
                <SliderField
                  label="Customer upfront investment"
                  value={criteria.customer_upfront_investment_min}
                  onChange={v => updateCriteria('customer_upfront_investment_min', v)}
                />
                <SliderField
                  label="Service & support potential"
                  value={criteria.service_support_potential_min}
                  onChange={v => updateCriteria('service_support_potential_min', v)}
                />
                <SliderField
                  label="Software / data / monitoring potential"
                  value={criteria.software_data_monitoring_min}
                  onChange={v => updateCriteria('software_data_monitoring_min', v)}
                />
                <SliderField
                  label="Standardization potential"
                  value={criteria.standardization_potential_min}
                  onChange={v => updateCriteria('standardization_potential_min', v)}
                />
                <SliderField
                  label="Residual value / redeployment"
                  value={criteria.residual_value_min}
                  onChange={v => updateCriteria('residual_value_min', v)}
                />
              </div>
            </SectionCard>

            {/* 6. AI Guidance */}
            <SectionCard title="6. AI Guidance">
              <Textarea
                label="Open criteria"
                placeholder="Any additional guidance for Claude. E.g. 'Focus on companies with IoT sensor products', 'Avoid Norwegian companies already in our CRM', 'Prefer B2B companies selling to oil & gas'..."
                value={criteria.open_criteria}
                onChange={e => updateCriteria('open_criteria', e.target.value)}
                rows={4}
              />
            </SectionCard>

            {/* 7. Seed Input */}
            <SectionCard title="7. Reference Companies">
              <Textarea
                label="Seed companies (positive examples to guide style)"
                placeholder="List company names as examples of the type you want, one per line..."
                value={criteria.seed_companies}
                onChange={e => updateCriteria('seed_companies', e.target.value)}
                rows={3}
              />
              <Textarea
                label="Companies to avoid (negative examples)"
                placeholder="List companies Claude should NOT suggest, one per line..."
                value={criteria.companies_to_avoid}
                onChange={e => updateCriteria('companies_to_avoid', e.target.value)}
                rows={3}
              />
            </SectionCard>

            {/* 8. Enrich Mode */}
            {mode === 'enrich' && (
              <SectionCard title="8. Company List to Enrich">
                <Textarea
                  label="Paste company list"
                  placeholder="Paste company names or a list to score and rank. One per line, or comma-separated..."
                  value={criteria.pasted_company_list}
                  onChange={e => updateCriteria('pasted_company_list', e.target.value)}
                  rows={8}
                />
              </SectionCard>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/discovery">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button variant="primary" type="submit" size="lg">
                <Sparkles className="h-4 w-4" />
                Run Discovery Search
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
