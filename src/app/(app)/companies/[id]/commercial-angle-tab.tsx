'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ROUTE_TO_MARKET_OPTIONS, ROUTE_TO_MARKET_COLORS, type RouteToMarket } from '@/lib/types'
import { Target, Lightbulb, DollarSign, Save } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CommercialAngleTab({ company, brief, onSave }: {
  company: Record<string, any>
  brief: Record<string, any> | null
  onSave: (updates: Record<string, unknown>) => void
}) {
  const [route, setRoute] = useState<string>(company.route_to_market ?? 'Unknown')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveRoute = async () => {
    setSaving(true)
    try {
      await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_to_market: route }),
      })
      onSave({ route_to_market: route })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const aaas = brief?.possible_aaas_concept ?? brief?.sections?.possible_aaas_concept
  const whyShma = brief?.why_shma_relevant ?? brief?.sections?.why_shma_relevant
  const strategicTriggers = brief?.strategic_triggers ?? brief?.sections?.strategic_triggers
  const fundingReadiness = brief?.funding_readiness ?? brief?.sections?.funding_readiness
  const endCustomerCredit = brief?.end_customer_credit_quality ?? brief?.sections?.end_customer_credit_quality
  const missingInfo = brief?.missing_information ?? brief?.sections?.missing_information

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Route to Market */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Route to Market</h3>
        </div>
        <p className="text-xs text-slate-500">
          Not every qualified target should go through the same outreach process. Select the best approach path for this company.
        </p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Route to market</label>
            <select
              value={route}
              onChange={e => setRoute(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {ROUTE_TO_MARKET_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={saveRoute} loading={saving}>
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
        {route && route !== 'Unknown' && (
          <span className={cn(
            'inline-block text-xs px-2 py-0.5 rounded-full border font-medium',
            ROUTE_TO_MARKET_COLORS[route as RouteToMarket] ?? 'bg-slate-700 text-slate-400 border-slate-600'
          )}>
            {route}
          </span>
        )}
      </div>

      {/* Servitization hypothesis */}
      {aaas && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">Servitization hypothesis</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{String(aaas)}</p>
        </div>
      )}

      {/* Why relevant for SHMA */}
      {whyShma && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">Why relevant for SHMA</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{String(whyShma)}</p>
        </div>
      )}

      {/* Funding angle */}
      {(fundingReadiness || endCustomerCredit) && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">Funding angle</h3>
          </div>
          {fundingReadiness && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Funding readiness</p>
              <p className="text-sm text-slate-300">{String(fundingReadiness)}</p>
            </div>
          )}
          {endCustomerCredit && (
            <div>
              <p className="text-xs text-slate-500 mb-1">End-customer credit quality</p>
              <p className="text-sm text-slate-300">{String(endCustomerCredit)}</p>
            </div>
          )}
        </div>
      )}

      {/* Strategic triggers */}
      {strategicTriggers && Array.isArray(strategicTriggers) && strategicTriggers.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">Strategic triggers</h3>
          <ul className="space-y-1">
            {strategicTriggers.map((t: unknown, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-cyan-500 mt-1 flex-shrink-0">→</span>
                {String(t)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing information */}
      {missingInfo && Array.isArray(missingInfo) && missingInfo.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-amber-400">Missing information</h3>
          <ul className="space-y-1">
            {missingInfo.map((m: unknown, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-amber-600 mt-0.5 flex-shrink-0">?</span>
                {String(m)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!brief && (
        <div className="text-sm text-slate-600 text-center py-8">
          No AI research brief yet. Run Deep Research from the List Process View or use the Research button above.
        </div>
      )}

    </div>
  )
}
