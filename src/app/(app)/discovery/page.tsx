import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Telescope, Plus, Search, Archive } from 'lucide-react'

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'completed') return 'success'
  if (status === 'running') return 'info'
  if (status === 'failed') return 'danger'
  if (status === 'archived') return 'muted'
  return 'default'
}

export default async function DiscoveryPage() {
  const supabase = await createClient()

  const { data: searches } = await supabase
    .from('discovery_searches')
    .select('*, discovery_suggestions(count)')
    .order('created_at', { ascending: false })

  const all = searches || []

  // Fetch suggestion stats
  const { data: acceptedData } = await supabase
    .from('discovery_suggestions')
    .select('id', { count: 'exact' })
    .eq('status', 'accepted')

  const { data: suggestedData } = await supabase
    .from('discovery_suggestions')
    .select('id', { count: 'exact' })
    .eq('status', 'suggested')

  const { data: allSuggestionsData } = await supabase
    .from('discovery_suggestions')
    .select('id', { count: 'exact' })

  const totalSearches = all.length
  const totalSuggestions = allSuggestionsData?.length ?? 0
  const acceptedLeads = acceptedData?.length ?? 0
  const pendingReview = suggestedData?.length ?? 0

  const stats = [
    { label: 'Total searches', value: totalSearches },
    { label: 'Total suggestions', value: totalSuggestions },
    { label: 'Accepted leads', value: acceptedLeads },
    { label: 'Pending review', value: pendingReview },
  ]

  return (
    <>
      <Header
        title="Target Discovery"
        subtitle="AI-powered client candidate generation"
        actions={
          <Link href="/discovery/new">
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" />
              New Discovery Search
            </Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Searches list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Discovery searches</h2>
            <span className="text-xs text-slate-600">{all.length} total</span>
          </div>

          {all.length === 0 ? (
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <Telescope className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-sm font-medium text-slate-300 mb-1">No discovery searches yet</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-xs">
                Use AI to discover and score potential SHMA clients based on your criteria.
              </p>
              <Link href="/discovery/new">
                <Button variant="primary" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Start first search
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {all.map((search) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const suggCount = (search as any).discovery_suggestions?.[0]?.count ?? 0

                return (
                  <div
                    key={search.id}
                    className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-center gap-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/discovery/${search.id}`}
                          className="text-sm font-medium text-slate-200 hover:text-cyan-400 transition-colors"
                        >
                          {search.search_name}
                        </Link>
                        <Badge variant={statusVariant(search.status)}>{search.status}</Badge>
                        <Badge variant="muted">{search.mode}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatDate(search.created_at)}</span>
                        <span>·</span>
                        <span>{suggCount} suggestions</span>
                        <span>·</span>
                        <span>Depth: {search.search_depth}</span>
                        {search.number_requested && (
                          <>
                            <span>·</span>
                            <span>Requested {search.number_requested}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/discovery/${search.id}`}>
                        <Button variant="ghost" size="sm">
                          <Search className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                      {search.status !== 'archived' && (
                        <form action={`/api/discovery/searches/${search.id}`} method="PATCH">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/discovery/searches/${search.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'archived' }),
                              })
                              window.location.reload()
                            }}
                            className="text-slate-600 hover:text-slate-400"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
