import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MvpReadinessClient } from './mvp-readiness-client'

export default async function MvpReadinessPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('mvp_readiness_items')
    .select('*')
    .order('sort_order')

  return (
    <>
      <Header
        title="MVP Readiness"
        subtitle="Track whether the Growth Engine is ready for large-scale real use"
      />
      <MvpReadinessClient items={items || []} />
    </>
  )
}
