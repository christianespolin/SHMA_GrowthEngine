import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CompanyDetailClient } from './company-detail-client'

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: company }, { data: contacts }, { data: brief }, { data: outreach }, { data: meetings }, { data: activity }, { data: latestRun }] =
    await Promise.all([
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('contacts').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('ai_research_briefs').select('*').eq('company_id', id).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('outreach_messages').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('meetings').select('*').eq('company_id', id).order('meeting_date', { ascending: false }),
      supabase.from('activity_log').select('*').eq('company_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('contact_discovery_runs').select('*, contact_suggestions(*)').eq('company_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])

  if (!company) notFound()

  return (
    <>
      <Header
        title={company.name}
        subtitle={`${company.stage} · ${company.segment || 'No segment'}`}
      />
      <CompanyDetailClient
        company={company}
        contacts={contacts || []}
        brief={brief}
        outreach={outreach || []}
        meetings={meetings || []}
        activity={activity || []}
        latestRun={latestRun}
      />
    </>
  )
}
