import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CompaniesClient } from './companies-client'

interface SearchParams {
  stage?: string
  priority?: string
  segment?: string
  search?: string
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('companies').select('*').order('updated_at', { ascending: false })

  if (params.stage) query = query.eq('stage', params.stage)
  if (params.priority) query = query.eq('priority', params.priority)
  if (params.segment) query = query.eq('segment', params.segment)
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,notes.ilike.%${params.search}%,segment.ilike.%${params.search}%`)
  }

  const { data: companies } = await query

  return (
    <>
      <Header title="Companies" subtitle="Full lead database and pipeline" />
      <CompaniesClient companies={companies || []} filters={params} />
    </>
  )
}
