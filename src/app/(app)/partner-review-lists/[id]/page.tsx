import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { notFound } from 'next/navigation'
import { PartnerReviewListDetailClient } from './detail-client'

export default async function PartnerReviewListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('partner_review_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!list) notFound()

  const { data: items } = await supabase
    .from('partner_review_list_items')
    .select(`
      *,
      company:companies(id, name, website, country, segment, stage, shma_fit_score, opportunity_score, description)
    `)
    .eq('partner_review_list_id', id)
    .order('created_at')

  return (
    <>
      <Header
        title={list.name}
        subtitle={`Reviewer: ${list.reviewer_name} · ${list.reviewer_type} · ${list.status}`}
        backHref="/partner-review-lists"
        backLabel="Partner Review Lists"
      />
      <PartnerReviewListDetailClient list={list} items={items || []} />
    </>
  )
}
