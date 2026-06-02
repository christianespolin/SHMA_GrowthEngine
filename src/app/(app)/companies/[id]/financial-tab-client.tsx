'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { ScoreBar } from '@/components/ui/score-display'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FINANCIAL_DATA_SOURCES } from '@/lib/types'
import { ExternalLink, Sparkles, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

const CURRENCY_OPTIONS = ['NOK', 'EUR', 'USD', 'GBP', 'SEK', 'DKK'].map(c => ({ value: c, label: c }))
const GROWTH_TREND_OPTIONS = ['Strong growth', 'Moderate growth', 'Stable', 'Declining', 'Unknown'].map(v => ({ value: v, label: v }))
const COMPLEXITY_OPTIONS = ['Low', 'Medium', 'High', 'Unknown'].map(v => ({ value: v, label: v }))
const INSOLVENCY_OPTIONS = ['Low', 'Medium', 'High', 'Unknown'].map(v => ({ value: v, label: v }))
const SOURCE_OPTIONS = FINANCIAL_DATA_SOURCES.map(s => ({ value: s, label: s }))

const SCORE_LABELS: Record<string, string> = {
  financial_strength_score: 'Financial Strength',
  creditworthiness_score: 'Creditworthiness',
  funding_readiness_score: 'Funding Readiness',
  end_customer_credit_quality_score: 'End-Customer Credit Quality',
  asset_finance_suitability_score: 'Asset Finance Suitability',
  implementation_capacity_score: 'Implementation Capacity',
  funder_attractiveness_score: 'Funder Attractiveness',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FinancialTabClient({ companyId, company, initialProfile }: {
  companyId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  company: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialProfile: Record<string, any> | null
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<Record<string, any>>(initialProfile || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [assessing, setAssessing] = useState(false)
  const [markingReviewed, setMarkingReviewed] = useState(false)
  const [showKnownFacts, setShowKnownFacts] = useState(false)
  const [showHypotheses, setShowHypotheses] = useState(false)
  const [showMissing, setShowMissing] = useState(false)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value
    setProfile(prev => ({ ...prev, [key]: val }))
  }

  const setVal = (key: string, val: unknown) => setProfile(prev => ({ ...prev, [key]: val }))

  const hasFinancialData = !!(profile.revenue || profile.financial_notes || profile.equity || profile.ebitda)

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/financial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          financial_data_source_timestamp: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const runAssess = async () => {
    setAssessing(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/financial/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
      }
    } finally {
      setAssessing(false)
    }
  }

  const markReviewed = async (status: 'reviewed' | 'approved') => {
    setMarkingReviewed(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/financial`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ human_review_status: status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
      }
    } finally {
      setMarkingReviewed(false)
    }
  }

  const confidenceColor = (c: string | null | undefined) => {
    if (c === 'High') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    if (c === 'Medium') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  }

  const reviewStatusColor = (s: string | null | undefined) => {
    if (s === 'approved') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    if (s === 'reviewed') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    if (s === 'needs_validation') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    return 'bg-slate-700 text-slate-400 border-slate-600'
  }

  const scoreKeys = Object.keys(SCORE_LABELS)
  const hasScores = scoreKeys.some(k => profile[k] != null)
  const explanations = (profile.score_explanations_json as Record<string, string>) || {}

  return (
    <div className="max-w-4xl space-y-6">

      {/* Section A — Financial Data */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Financial Data</h3>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Revenue"
                  type="number"
                  placeholder="0"
                  value={String(profile.revenue ?? '')}
                  onChange={set('revenue')}
                />
              </div>
              <span className="text-sm text-slate-500 pb-2">M</span>
            </div>
            <Input
              label="Revenue Year"
              type="number"
              placeholder="2024"
              value={String(profile.revenue_year ?? '')}
              onChange={set('revenue_year')}
            />
            <Select
              label="Currency"
              value={String(profile.revenue_currency || 'NOK')}
              onChange={set('revenue_currency')}
              options={CURRENCY_OPTIONS}
            />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="EBITDA"
                  type="number"
                  placeholder="0"
                  value={String(profile.ebitda ?? '')}
                  onChange={set('ebitda')}
                />
              </div>
              <span className="text-sm text-slate-500 pb-2">M</span>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="EBITDA Margin"
                  type="number"
                  placeholder="0"
                  value={String(profile.ebitda_margin ?? '')}
                  onChange={set('ebitda_margin')}
                />
              </div>
              <span className="text-sm text-slate-500 pb-2">%</span>
            </div>
            <Input
              label="Profit / Loss"
              type="number"
              placeholder="0"
              value={String(profile.profit_loss ?? '')}
              onChange={set('profit_loss')}
            />
            <Select
              label="Growth Trend"
              value={String(profile.growth_trend || '')}
              onChange={set('growth_trend')}
              placeholder="Select trend"
              options={GROWTH_TREND_OPTIONS}
            />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Input
              label="Equity"
              type="number"
              placeholder="0"
              value={String(profile.equity ?? '')}
              onChange={set('equity')}
            />
            <Input
              label="Total Assets"
              type="number"
              placeholder="0"
              value={String(profile.total_assets ?? '')}
              onChange={set('total_assets')}
            />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Equity Ratio / Solidity"
                  type="number"
                  placeholder="0"
                  value={String(profile.equity_ratio ?? '')}
                  onChange={set('equity_ratio')}
                />
              </div>
              <span className="text-sm text-slate-500 pb-2">%</span>
            </div>
            <Input
              label="Debt Level"
              type="number"
              placeholder="0"
              value={String(profile.debt_level ?? '')}
              onChange={set('debt_level')}
            />
            <Input
              label="Cash Position"
              type="number"
              placeholder="0"
              value={String(profile.cash_position ?? '')}
              onChange={set('cash_position')}
            />
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="public_financials"
                checked={!!profile.public_financials_available}
                onChange={e => setVal('public_financials_available', e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-cyan-500"
              />
              <label htmlFor="public_financials" className="text-xs text-slate-400">Public financials available</label>
            </div>
            <Input
              label="Annual Report URL"
              placeholder="https://..."
              value={String(profile.annual_report_url || '')}
              onChange={set('annual_report_url')}
            />
            <Input
              label="Company Registry URL"
              placeholder="https://..."
              value={String(profile.company_registry_url || '')}
              onChange={set('company_registry_url')}
            />
          </div>
        </div>

        {/* Credit section */}
        <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-slate-700">
          <Input
            label="Credit Score"
            placeholder="e.g. A2, 650, Low Risk"
            value={String(profile.credit_score || '')}
            onChange={set('credit_score')}
          />
          <Select
            label="Credit Score Provider"
            value={String(profile.credit_score_provider || '')}
            onChange={set('credit_score_provider')}
            placeholder="Select provider"
            options={SOURCE_OPTIONS}
          />
          <Input
            label="Credit Score Date"
            type="date"
            value={String(profile.credit_score_date || '')}
            onChange={set('credit_score_date')}
          />
          <Input
            label="Credit Rating URL"
            placeholder="https://..."
            value={String(profile.credit_rating_url || '')}
            onChange={set('credit_rating_url')}
          />
        </div>

        <Textarea
          label="Financial Notes"
          placeholder="Observations, context, data quality notes…"
          rows={3}
          value={String(profile.financial_notes || '')}
          onChange={set('financial_notes')}
          className="mb-4"
        />

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              label="Data Source"
              value={String(profile.financial_data_source || '')}
              onChange={set('financial_data_source')}
              placeholder="Select source"
              options={SOURCE_OPTIONS}
            />
          </div>
          {profile.financial_data_source_timestamp && (
            <div className="text-xs text-slate-600 pt-5">
              Updated: {new Date(String(profile.financial_data_source_timestamp)).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" onClick={saveProfile} loading={saving}>
            Save Financial Data
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Section B — Funding Assessment */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Funding Assessment</h3>

        <div className="grid grid-cols-2 gap-8">
          {/* Left — Funding context */}
          <div className="space-y-4">
            <h4 className="text-xs text-slate-500 font-medium">Funding Context</h4>
            <Textarea
              label="End-Customer Credit Profile"
              placeholder="Describe the creditworthiness of this company's end customers…"
              rows={3}
              value={String(profile.end_customer_credit_profile || '')}
              onChange={set('end_customer_credit_profile')}
            />
            <Input
              label="Typical End-Customer Type"
              placeholder="e.g. Large enterprise, SME, Public sector"
              value={String(profile.typical_end_customer_type || '')}
              onChange={set('typical_end_customer_type')}
            />
            <Select
              label="End-Customer Insolvency Risk"
              value={String(profile.end_customer_insolvency_risk || '')}
              onChange={set('end_customer_insolvency_risk')}
              placeholder="Select level"
              options={INSOLVENCY_OPTIONS}
            />
            <Select
              label="Financing Complexity"
              value={String(profile.financing_complexity || '')}
              onChange={set('financing_complexity')}
              placeholder="Select level"
              options={COMPLEXITY_OPTIONS}
            />
            <Textarea
              label="Funding Opportunities"
              placeholder="What funding structures could work well here?"
              rows={3}
              value={String(profile.funding_opportunities || '')}
              onChange={set('funding_opportunities')}
            />
            <Textarea
              label="Funding Risks"
              placeholder="What could make funding difficult?"
              rows={3}
              value={String(profile.funding_risks || '')}
              onChange={set('funding_risks')}
            />
            <Textarea
              label="Suggested Funding Angle"
              placeholder="SHMA's recommended approach for funding this deal…"
              rows={3}
              value={String(profile.suggested_funding_angle || '')}
              onChange={set('suggested_funding_angle')}
            />
            <Button variant="primary" onClick={saveProfile} loading={saving}>
              Save Funding Data
            </Button>
          </div>

          {/* Right — AI Scores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs text-slate-500 font-medium">AI Scores</h4>
              {profile.score_confidence && (
                <span className={cn('px-2 py-0.5 rounded text-xs border', confidenceColor(profile.score_confidence as string))}>
                  {String(profile.score_confidence)} confidence
                </span>
              )}
            </div>

            {!hasFinancialData && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">Enter financial data above before assessing to get meaningful scores.</p>
              </div>
            )}

            {hasScores ? (
              <div className="space-y-3">
                {scoreKeys.map(key => (
                  <ScoreBar
                    key={key}
                    label={SCORE_LABELS[key]}
                    score={profile[key] != null ? Number(profile[key]) : null}
                    explanation={explanations[key]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-600">
                <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No scores yet. Click &quot;AI Assess&quot; to generate.</p>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full border border-slate-700"
              onClick={runAssess}
              loading={assessing}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {assessing ? 'Assessing…' : 'AI Assess'}
            </Button>

            {profile.scores_generated_at && (
              <p className="text-xs text-slate-600">
                Generated: {new Date(String(profile.scores_generated_at)).toLocaleString()} · {String(profile.scores_model || '')}
              </p>
            )}

            {/* Score detail sections */}
            {profile.score_known_facts && (
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowKnownFacts(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:bg-slate-700/30"
                >
                  Known Facts
                  {showKnownFacts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showKnownFacts && (
                  <div className="px-3 pb-3 text-xs text-slate-400 whitespace-pre-wrap border-t border-slate-700">
                    {String(profile.score_known_facts)}
                  </div>
                )}
              </div>
            )}

            {profile.score_hypotheses && (
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowHypotheses(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10"
                >
                  AI Hypotheses
                  {showHypotheses ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showHypotheses && (
                  <div className="px-3 pb-3 text-xs text-amber-300/80 whitespace-pre-wrap border-t border-amber-500/20">
                    {String(profile.score_hypotheses)}
                  </div>
                )}
              </div>
            )}

            {profile.score_missing_information && (
              <div className="border border-rose-500/20 bg-rose-500/5 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowMissing(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
                >
                  Missing Information
                  {showMissing ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showMissing && (
                  <div className="px-3 pb-3 text-xs text-rose-300/80 whitespace-pre-wrap border-t border-rose-500/20">
                    {String(profile.score_missing_information)}
                  </div>
                )}
              </div>
            )}

            {/* Human review */}
            {hasScores && (
              <div className="pt-2 border-t border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Review status</span>
                  <span className={cn('px-2 py-0.5 rounded text-xs border', reviewStatusColor(profile.human_review_status as string))}>
                    {String(profile.human_review_status || 'not_reviewed').replace('_', ' ')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 border border-slate-700"
                    onClick={() => markReviewed('reviewed')}
                    loading={markingReviewed}
                  >
                    Mark Reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => markReviewed('approved')}
                    loading={markingReviewed}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section C — Quick Links */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.proff.no/search?q=${encodeURIComponent(String(company.name || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md border border-slate-600 transition-colors"
          >
            Proff.no <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={`https://www.brreg.no/sokeside/?q=${encodeURIComponent(String(company.name || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md border border-slate-600 transition-colors"
          >
            Brønnøysundregistrene <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://www.creditsafe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md border border-slate-600 transition-colors"
          >
            Creditsafe <ExternalLink className="h-3 w-3" />
          </a>
          {profile.annual_report_url && (
            <a
              href={String(profile.annual_report_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs rounded-md border border-cyan-500/30 transition-colors"
            >
              Annual Report ↗
            </a>
          )}
          {profile.company_registry_url && (
            <a
              href={String(profile.company_registry_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs rounded-md border border-cyan-500/30 transition-colors"
            >
              Company Registry ↗
            </a>
          )}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          SHMA Growth Engine uses manual entry and AI interpretation. No external credit bureau API is connected. Label data sources accurately.
        </p>
      </div>
    </div>
  )
}
