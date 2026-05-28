import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DiscoveryList } from './discovery-list-client'

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
          <DiscoveryList searches={all} />
        </div>
      </div>
    </>
  )
}
