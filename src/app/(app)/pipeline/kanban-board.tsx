'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { PIPELINE_STAGES } from '@/lib/types'
import { ScoreBadge, PriorityBadge } from '@/components/ui/score-display'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { formatDateRelative, isOverdue, isStale, cn } from '@/lib/utils'
import {
  AlertTriangle, Clock, Sparkles, Globe, Building2, ChevronRight
} from 'lucide-react'

const STAGE_COLORS: Record<string, string> = {
  'Longlist': 'border-slate-600',
  'AI Researched': 'border-indigo-500/50',
  'Human Review': 'border-violet-500/50',
  'Qualified Target': 'border-cyan-500/50',
  'Contact Identified': 'border-sky-500/50',
  'Warm Intro / Outreach Ready': 'border-blue-500/50',
  'Outreach Sent': 'border-amber-500/50',
  'Engaged': 'border-orange-500/50',
  'Meeting Booked': 'border-pink-500/50',
  'Discovery Completed': 'border-purple-500/50',
  'Proposal / Agreement': 'border-teal-500/50',
  'Signed': 'border-emerald-500/50',
  'Onboarding': 'border-green-500/50',
  'Nurture': 'border-slate-500/50',
  'Disqualified': 'border-rose-500/50',
}

interface MoveModalState {
  companyId: string
  companyName: string
  fromStage: string
  toStage: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function KanbanBoard({ initialGrouped }: { initialGrouped: Record<string, any[]> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [grouped, setGrouped] = useState<Record<string, any[]>>(initialGrouped)
  const [moveModal, setMoveModal] = useState<MoveModalState | null>(null)
  const [moveNote, setMoveNote] = useState('')
  const [pendingMove, setPendingMove] = useState<{ draggableId: string; destination: { droppableId: string; index: number }; source: { droppableId: string; index: number } } | null>(null)

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return

    const company = Object.values(grouped).flat().find(c => (c as Record<string, unknown>).id === draggableId) as Record<string, unknown>
    if (!company) return

    setPendingMove({ draggableId, destination, source })
    setMoveModal({
      companyId: String(company.id),
      companyName: String(company.name),
      fromStage: source.droppableId,
      toStage: destination.droppableId,
    })
    setMoveNote('')
  }, [grouped])

  const confirmMove = async () => {
    if (!moveModal || !pendingMove) return

    const { source, destination, draggableId } = pendingMove

    setGrouped(prev => {
      const newGrouped = { ...prev }
      const sourceItems = [...(newGrouped[source.droppableId] as unknown[])]
      const destItems = [...(newGrouped[destination.droppableId] as unknown[])]
      const [moved] = sourceItems.splice(source.index, 1)
      destItems.splice(destination.index, 0, moved)
      newGrouped[source.droppableId] = sourceItems
      newGrouped[destination.droppableId] = destItems
      return newGrouped
    })

    await fetch(`/api/companies/${draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: destination.droppableId,
        stage_note: moveNote || undefined,
        last_activity_date: new Date().toISOString(),
      }),
    })

    setMoveModal(null)
    setPendingMove(null)
    setMoveNote('')
  }

  const cancelMove = () => {
    setMoveModal(null)
    setPendingMove(null)
    setMoveNote('')
  }

  return (
    <>
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board h-full px-5 py-4">
            {PIPELINE_STAGES.map(stage => {
              const items = (grouped[stage] || []) as Record<string, any>[]
              return (
                <div key={stage} className={cn('kanban-column flex flex-col', 'min-h-0')}>
                  {/* Column Header */}
                  <div className={cn('rounded-t-lg border-t-2 bg-slate-800/80 border-x border-slate-700 px-3 py-2.5 flex-shrink-0', STAGE_COLORS[stage])}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 truncate">{stage}</span>
                      <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded tabular-nums flex-shrink-0 ml-1">
                        {items.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'flex-1 overflow-y-auto border-x border-b border-slate-700 rounded-b-lg p-1.5 space-y-1.5 min-h-24',
                          snapshot.isDraggingOver && 'bg-slate-700/30'
                        )}
                      >
                        {items.map((company, index) => (
                          <Draggable key={String(company.id)} draggableId={String(company.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  'bg-slate-800 border border-slate-700 rounded-md p-2.5 cursor-grab active:cursor-grabbing',
                                  'hover:border-slate-600 transition-colors',
                                  snapshot.isDragging && 'shadow-xl border-cyan-500/50 rotate-1'
                                )}
                              >
                                <KanbanCard company={company} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {items.length === 0 && (
                          <div className="flex items-center justify-center h-16 text-slate-700 text-xs">
                            Drop here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Move Confirmation Modal */}
      <Modal
        open={!!moveModal}
        onClose={cancelMove}
        title="Move Company"
        size="sm"
      >
        {moveModal && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-300">
              Moving <strong className="text-slate-100">{moveModal.companyName}</strong> from{' '}
              <span className="text-slate-400">{moveModal.fromStage}</span> to{' '}
              <span className="text-cyan-400">{moveModal.toStage}</span>
            </p>
            <Textarea
              label="Add a note (optional)"
              placeholder="What happened? Any context for this move…"
              value={moveNote}
              onChange={e => setMoveNote(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={confirmMove} className="flex-1">Confirm Move</Button>
              <Button variant="ghost" onClick={cancelMove}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function KanbanCard({ company }: { company: Record<string, any> }) {
  const stale = isStale(company.last_activity_date as string | null)
  const overdue = isOverdue(company.next_action_date as string | null)

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-1">
        <Link
          href={`/companies/${company.id}`}
          onClick={e => e.stopPropagation()}
          className="text-xs font-semibold text-slate-200 hover:text-cyan-400 transition-colors leading-tight line-clamp-2"
        >
          {String(company.name)}
        </Link>
        <Link href={`/companies/${company.id}`} onClick={e => e.stopPropagation()}>
          <ChevronRight className="h-3 w-3 text-slate-600 hover:text-slate-400 flex-shrink-0 mt-0.5" />
        </Link>
      </div>

      {company.segment && (
        <div className="text-xs text-slate-600 truncate">{String(company.segment)}</div>
      )}

      <div className="flex items-center gap-1 flex-wrap">
        <PriorityBadge priority={String(company.priority)} />
        {company.shma_fit_score !== null && (
          <ScoreBadge score={company.shma_fit_score as number} />
        )}
        {company.pe_owned === 'yes' && <Badge variant="info">PE</Badge>}
        {company.ai_researched && <Sparkles className="h-2.5 w-2.5 text-purple-400" aria-label="AI researched" />}
      </div>

      {company.next_action && (
        <div className={cn('text-xs truncate', overdue ? 'text-rose-400' : 'text-slate-500')}>
          {overdue && <Clock className="h-2.5 w-2.5 inline mr-0.5" />}
          {String(company.next_action)}
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5">
        {company.internal_owner && (
          <span className="text-xs text-slate-600">{String(company.internal_owner)}</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {stale && !['Disqualified', 'Nurture', 'Signed'].includes(String(company.stage)) && (
            <AlertTriangle className="h-3 w-3 text-amber-500/70" aria-label="No recent activity" />
          )}
          {company.last_activity_date && (
            <span className="text-xs text-slate-700">
              {formatDateRelative(company.last_activity_date as string)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
