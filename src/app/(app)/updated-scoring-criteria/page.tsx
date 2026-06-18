import { createClient } from '@/lib/supabase/server'
import { ScoringCriteriaClient } from './scoring-client'

export default async function ScoringCriteriaPage() {
  const supabase = await createClient()
  const { data: criteria } = await supabase
    .from('scoring_criteria')
    .select('*')
    .order('score_group')
    .order('sort_order')

  const { data: thresholds } = await supabase
    .from('scoring_thresholds')
    .select('*')
    .order('score_name')

  return <ScoringCriteriaClient criteria={criteria || []} thresholds={thresholds || []} />
}
