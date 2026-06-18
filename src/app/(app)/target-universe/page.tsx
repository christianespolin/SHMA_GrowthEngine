import { createClient } from '@/lib/supabase/server'
import { TargetUniverseClient } from './target-universe-client'

export default async function TargetUniversePage() {
  const supabase = await createClient()

  const { data: universes } = await supabase
    .from('target_universes')
    .select('*, created_by_profile:profiles!target_universes_created_by_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  // Get company counts per universe per stage
  const { data: stageCounts } = await supabase
    .from('target_universe_companies')
    .select('target_universe_id, universe_status')

  return <TargetUniverseClient universes={universes || []} stageCounts={stageCounts || []} />
}
