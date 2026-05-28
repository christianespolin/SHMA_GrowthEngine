'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DiscoveryList({ searches }: { searches: Record<string, any>[] }) {
  const router = useRouter()

  const archiveSearch = async (id: string) => {
    await fetch(`/api/discovery/searches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    })
    router.refresh()
  }

  if (searches.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-2">
      {searches.map((search) => {
        const suggCount = search.discovery_suggestions?.[0]?.count ?? 0
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => archiveSearch(search.id)}
                  className="text-slate-600 hover:text-slate-400"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
