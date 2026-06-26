import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { BulkListDetailClient } from './bulk-list-detail-client'

export default async function BulkListDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        shma_fit_score, overall_priority_score,
        sensitivity_status, registration_number, description,
        employee_range, revenue_range
      )
    `)
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')
    .order('created_at', { ascending: true })

  const { data: aiRuns } = await supabase
    .from('ai_process_runs')
    .select('*')
    .eq('bulk_list_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="flex flex-col h-full">
      <Header
        title={list.name}
        subtitle={`${list.category} · ${list.company_count || 0} companies`}
        backHref="/bulk-lists"
        backLabel="List Process View"
      />
      <div className="flex-1 overflow-auto">
        <BulkListDetailClient list={list} items={items || []} aiRuns={aiRuns || []} />
      </div>
    </div>
  )
}
