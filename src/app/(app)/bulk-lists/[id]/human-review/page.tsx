import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { HumanReviewClient } from './human-review-client'

export default async function HumanReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('bulk_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!list) notFound()

  const { data: items } = await supabase
    .from('bulk_list_companies')
    .select(`
      *,
      companies (
        id, name, website, country, segment, stage,
        shma_fit_score, overall_priority_score, opportunity_score,
        sensitivity_status, sensitivity_reason,
        description, notes, registration_number,
        employee_range, revenue_range,
        score_breakdown, score_explanation
      ),
      contacts:companies (
        contacts ( id, name, full_name, role, email, contact_status )
      )
    `)
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')
    .order('companies(shma_fit_score)', { ascending: false })

  // Fetch AI research briefs for companies
  const companyIds = (items || []).map(i => i.company_id)
  const { data: briefs } = companyIds.length > 0 ? await supabase
    .from('ai_research_briefs')
    .select('company_id, possible_aaas_concept, why_shma_relevant, missing_information, recommended_next_action, company_snapshot')
    .in('company_id', companyIds) : { data: [] }

  const briefsByCompany = (briefs || []).reduce<Record<string, Record<string, unknown>>>((acc, b) => {
    acc[b.company_id] = b
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      <Header
        title={`Human Review: ${list.name}`}
        subtitle="Workshop view — approve, reject, or flag each company"
        backHref={`/bulk-lists/${id}`}
        backLabel="List detail"
      />
      <div className="flex-1 overflow-auto">
        <HumanReviewClient
          list={list}
          items={(items || []).map(i => ({ ...i, brief: briefsByCompany[i.company_id] || null }))}
        />
      </div>
    </div>
  )
}
