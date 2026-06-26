import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { BulkListsClient } from './bulk-lists-client'

export default async function BulkListsPage() {
  const supabase = await createClient()

  const { data: lists } = await supabase
    .from('bulk_lists')
    .select('*')
    .neq('category', 'Archived')
    .order('created_at', { ascending: false })

  const { data: aiRuns } = await supabase
    .from('ai_process_runs')
    .select('id, process_type, bulk_list_id, status, total_items, processed_items, failed_items, started_at')
    .in('status', ['Queued', 'Running'])
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <Header title="List Process View" subtitle="Bulk pipeline — Longlist through Contact Research" />
      <div className="flex-1 overflow-auto p-6">
        <BulkListsClient lists={lists || []} activeRuns={aiRuns || []} />
      </div>
    </div>
  )
}
