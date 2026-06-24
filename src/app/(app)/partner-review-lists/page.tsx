import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PartnerReviewListsClient } from './partner-review-lists-client'

export default async function PartnerReviewListsPage() {
  const supabase = await createClient()

  const { data: lists } = await supabase
    .from('partner_review_lists')
    .select(`*, items:partner_review_list_items(count)`)
    .order('created_at', { ascending: false })

  // For new list creation, we need companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, country, segment, stage, shma_fit_score')
    .in('stage', ['Longlist', 'AI Researched', 'Human Review', 'Qualified Target'])
    .order('name')

  return (
    <>
      <Header
        title="Partner Review Lists"
        subtitle="Share curated company lists with partners for warm-intro identification"
      />
      <PartnerReviewListsClient lists={lists || []} companies={companies || []} />
    </>
  )
}
