import { createClient } from '@/lib/supabase/server'
import { DashboardHeroSettingsClient } from './heroes-client'

export default async function DashboardHeroSettingsPage() {
  const supabase = await createClient()
  const { data: heroes } = await supabase
    .from('dashboard_hero_settings')
    .select('*')
    .order('sort_order')
  return <DashboardHeroSettingsClient heroes={heroes || []} />
}
