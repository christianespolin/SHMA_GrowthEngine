import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { SelectionClient } from './selection-client'

export default async function SelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('bulk_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!list) notFound()

  // Get score distribution for guidance
  const { data: scoreData } = await supabase
    .from('bulk_list_companies')
    .select('shma_score, companies(shma_fit_score, opportunity_score, country, segment)')
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')

  const countries = [...new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scoreData || []).map((i: any) => i.companies?.country).filter(Boolean)
  )].sort()

  const segments = [...new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scoreData || []).map((i: any) => i.companies?.segment).filter(Boolean)
  )].sort()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scores = (scoreData || []).map((i: any) => i.shma_score || i.companies?.shma_fit_score || 0).filter(Boolean)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null
  const p75 = scores.length > 0 ? scores.sort((a: number, b: number) => b - a)[Math.floor(scores.length * 0.25)] : null

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Select for Deep Research"
        subtitle={`From: ${list.name} · ${list.company_count || 0} companies`}
        backHref={`/bulk-lists/${id}`}
        backLabel="List detail"
      />
      <div className="flex-1 overflow-auto p-6">
        <SelectionClient
          list={list}
          countries={countries as string[]}
          segments={segments as string[]}
          totalCompanies={list.company_count || 0}
          avgScore={avgScore}
          p75Score={p75}
        />
      </div>
    </div>
  )
}
