import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DiscoveryResultsClient } from './discovery-results-client'

export default async function DiscoverySearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: search, error } = await supabase
    .from('discovery_searches')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !search) {
    notFound()
  }

  const { data: suggestions } = await supabase
    .from('discovery_suggestions')
    .select('*')
    .eq('discovery_search_id', id)
    .order('shma_fit_score', { ascending: false })

  return (
    <DiscoveryResultsClient
      search={search}
      initialSuggestions={suggestions || []}
    />
  )
}
