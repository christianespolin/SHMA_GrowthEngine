import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ScoringCriteriaClient } from './scoring-client'

export default async function ScoringCriteriaPage() {
  const supabase = await createClient()

  const [{ data: criteria }, { data: thresholds }, { data: versions }] = await Promise.all([
    supabase.from('scoring_criteria').select('*').order('score_group').order('sort_order'),
    supabase.from('scoring_thresholds').select('*').order('score_name'),
    supabase.from('scoring_criteria_versions').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <>
      <Header title="Scoring Criteria" subtitle="Configure, review and lock SHMA scoring criteria" />
      <ScoringCriteriaClient criteria={criteria || []} thresholds={thresholds || []} versions={versions || []} />
    </>
  )
}
