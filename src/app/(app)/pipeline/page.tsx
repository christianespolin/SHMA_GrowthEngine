import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { KanbanBoard } from './kanban-board'
import { PIPELINE_STAGES } from '@/lib/types'

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('overall_priority_score', { ascending: false, nullsFirst: false })

  const grouped = PIPELINE_STAGES.reduce<Record<string, unknown[]>>((acc, stage) => {
    acc[stage] = (companies || []).filter(c => c.stage === stage)
    return acc
  }, {})

  return (
    <>
      <Header title="Pipeline" subtitle="Drag companies between stages" />
      <KanbanBoard initialGrouped={grouped} />
    </>
  )
}
