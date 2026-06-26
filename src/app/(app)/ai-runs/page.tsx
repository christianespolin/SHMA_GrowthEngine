import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AIRunsClient } from './ai-runs-client'

export default async function AIRunsPage() {
  const supabase = await createClient()

  const { data: runs } = await supabase
    .from('ai_process_runs')
    .select(`*, bulk_lists ( id, name, category )`)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col h-full">
      <Header title="AI Run Monitor" subtitle="Track AI process runs — cost, status, progress" />
      <div className="flex-1 overflow-auto p-6">
        <AIRunsClient runs={runs || []} />
      </div>
    </div>
  )
}
