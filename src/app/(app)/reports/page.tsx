import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PIPELINE_STAGES, SEGMENTS } from '@/lib/types'
import { isStale } from '@/lib/utils'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('*')
  const all = companies || []

  const byStage = PIPELINE_STAGES.map(stage => ({
    stage,
    count: all.filter(c => c.stage === stage).length,
  }))

  const bySegment = SEGMENTS.map(seg => {
    const segCompanies = all.filter(c => c.segment === seg)
    const scores = segCompanies.filter(c => c.shma_fit_score).map(c => c.shma_fit_score)
    return {
      segment: seg,
      count: segCompanies.length,
      avg_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null,
      a_count: segCompanies.filter(c => c.priority === 'A').length,
    }
  }).filter(s => s.count > 0).sort((a, b) => b.count - a.count)

  const byPriority = ['A', 'B', 'C', 'Nurture', 'Disqualified', 'Unknown'].map(p => ({
    priority: p,
    count: all.filter(c => c.priority === p).length,
  })).filter(p => p.count > 0)

  const staleLeads = all.filter(c =>
    isStale(c.last_activity_date) && !['Disqualified', 'Nurture', 'Signed'].includes(c.stage)
  )

  const noAction = all.filter(c => !c.next_action && !['Disqualified', 'Nurture', 'Signed'].includes(c.stage))

  return (
    <>
      <Header title="Reports" subtitle="Pipeline analytics and performance" />
      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        <div className="grid grid-cols-3 gap-4">
          {/* Pipeline Report */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-slate-200">Pipeline by Stage</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {byStage.filter(s => s.count > 0).map(({ stage, count }) => (
                <div key={stage} className="flex items-center gap-2">
                  <div className="flex-1 text-xs text-slate-400 truncate">{stage}</div>
                  <div className="w-16 bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${Math.max(4, (count / Math.max(...byStage.map(s => s.count), 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 tabular-nums w-5 text-right">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* By Priority */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-slate-200">By Priority</h2>
            </div>
            <div className="p-3 space-y-2">
              {byPriority.map(({ priority, count }) => {
                const pct = Math.round((count / all.length) * 100)
                const colors: Record<string, string> = {
                  A: 'bg-emerald-500', B: 'bg-cyan-500', C: 'bg-amber-500',
                  Nurture: 'bg-slate-500', Disqualified: 'bg-rose-500', Unknown: 'bg-slate-600'
                }
                return (
                  <div key={priority} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 w-20">{priority}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div className={`${colors[priority] || 'bg-slate-500'} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-slate-200">Key Metrics</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Total Companies', value: all.length },
                { label: 'A-Priority', value: all.filter(c => c.priority === 'A').length },
                { label: 'Signed Clients', value: all.filter(c => c.stage === 'Signed').length },
                { label: 'Active Proposals', value: all.filter(c => c.stage === 'Proposal / Agreement').length },
                { label: 'Stale Leads', value: staleLeads.length },
                { label: 'No Next Action', value: noAction.length },
                { label: 'AI Researched', value: all.filter(c => c.ai_researched).length },
                { label: 'PE-Owned', value: all.filter(c => c.pe_owned === 'yes').length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-200 tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Segment Report */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-200">By Segment</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs text-slate-500 px-4 py-2.5">Segment</th>
                  <th className="text-right text-xs text-slate-500 px-4 py-2.5">Companies</th>
                  <th className="text-right text-xs text-slate-500 px-4 py-2.5">A-Priority</th>
                  <th className="text-right text-xs text-slate-500 px-4 py-2.5">Avg Fit Score</th>
                </tr>
              </thead>
              <tbody>
                {bySegment.map(({ segment, count, a_count, avg_score }) => (
                  <tr key={segment} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-4 py-2.5 text-slate-300">{segment}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400 tabular-nums">{count}</td>
                    <td className="px-4 py-2.5 text-right">
                      {a_count > 0 ? (
                        <span className="text-emerald-400 font-semibold tabular-nums">{a_count}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {avg_score !== null ? (
                        <span className={`font-semibold tabular-nums ${avg_score >= 4 ? 'text-emerald-400' : avg_score >= 3 ? 'text-cyan-400' : 'text-amber-400'}`}>
                          {avg_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issues */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 border border-amber-500/20 rounded-lg">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-amber-300">Stale Leads ({staleLeads.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">No activity in 14+ days</p>
            </div>
            <div className="divide-y divide-slate-700/50 max-h-60 overflow-y-auto">
              {staleLeads.slice(0, 10).map(c => (
                <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{c.name}</span>
                  <span className="text-xs text-slate-600">{c.stage}</span>
                </div>
              ))}
              {staleLeads.length === 0 && (
                <div className="px-4 py-4 text-xs text-slate-600">No stale leads</div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 border border-rose-500/20 rounded-lg">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-rose-300">No Next Action ({noAction.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">Active leads missing a next action</p>
            </div>
            <div className="divide-y divide-slate-700/50 max-h-60 overflow-y-auto">
              {noAction.slice(0, 10).map(c => (
                <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{c.name}</span>
                  <span className="text-xs text-slate-600">{c.priority}</span>
                </div>
              ))}
              {noAction.length === 0 && (
                <div className="px-4 py-4 text-xs text-slate-600">All leads have next actions</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
