import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TargetUniverseDetailClient } from './detail-client'

export default async function TargetUniverseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: universe } = await supabase
    .from('target_universes')
    .select('*')
    .eq('id', id)
    .single()

  if (!universe) notFound()

  const { data: companies } = await supabase
    .from('target_universe_companies')
    .select('*')
    .eq('target_universe_id', id)
    .order('created_at', { ascending: false })

  return <TargetUniverseDetailClient universe={universe} companies={companies || []} />
}
