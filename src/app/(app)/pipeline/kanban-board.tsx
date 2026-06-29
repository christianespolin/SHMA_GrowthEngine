'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { PIPELINE_STAGES, ROUTE_TO_MARKET_COLORS, type RouteToMarket } from '@/lib/types'
import { ScoreBadge, PriorityBadge } from '@/components/ui/score-display'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { EngagedModal } from '@/components/origination/engaged-modal'
import { formatDateRelative, isOverdue, isStale, cn } from '@/lib/utils'
import {
  AlertTriangle, Clock, Sparkles, ChevronRight, ShieldAlert,
} from 'lucide-react'

const STAGE_COLORS: Record<string, string> = {
  'Qualified Target': 'border-cyan-500/50',
  'Qualified Targets': 'border-cyan-500/50',
  'Partner / Warm Intro Review': 'border-emerald-500/50',
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

const ENGAGED_AND_BEYOND = ['Engaged', 'Meeting Booked', 'Discovery Completed', 'Proposal / Agreement', 'Signed', 'Onboarding']
const REQUIRES_APPROVED_ORIGINATION = ['Proposal / Agreement', 'Signed']

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
  const [engagedModal, setEngagedModal] = useState<MoveModalState | null>(null)
  // Track origination status per company (fetched lazily)
  const [originationStatus, setOriginationStatus] = useState<Record<string, string>>({})

  const applyMove = useCallback((draggableId: string, source: { droppableId: string; index: number }, destination: { droppableId: string; index: number }, stageNote?: string) => {
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

    return fetch(`/api/companies/${draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: destination.droppableId,
        stage_note: stageNote || undefined,
        last_activity_date: new Date().toISOString(),
      }),
    })
  }, [])

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return

    const company = Object.values(grouped).flat().find(c => (c as Record<string, unknown>).id === draggableId) as Record<string, unknown>
    if (!company) return

    const toStage = destination.droppableId

    // Intercept move to Engaged — open origination modal
    if (toStage === 'Engaged' && source.droppableId !== 'Engaged') {
      setPendingMove({ draggableId, destination, source })
      setEngagedModal({
        companyId: String(company.id),
        companyName: String(company.name),
        fromStage: source.droppableId,
        toStage,
      })
      return
    }

    // Warn if moving to Proposal/Signed without approved origination
    const origStatus = originationStatus[String(company.id)]
    if (REQUIRES_APPROVED_ORIGINATION.includes(toStage) && origStatus && !['Approved', 'Locked'].includes(origStatus)) {
      setPendingMove({ draggableId, destination, source })
      setMoveModal({
        companyId: String(company.id),
        companyName: String(company.name),
        fromStage: source.droppableId,
        toStage,
      })
      setMoveNote('')
      return
    }

    // Normal move
    setPendingMove({ draggableId, destination, source })
    setMoveModal({
      companyId: String(company.id),
      companyName: String(company.name),
      fromStage: source.droppableId,
      toStage,
    })
    setMoveNote('')
  }, [grouped, originationStatus])

  const confirmMove = async () => {
    if (!moveModal || !pendingMove) return
    const { source, destination, draggableId } = pendingMove
    await applyMove(draggableId, source, destination, moveNote)
    setMoveModal(null)
    setPendingMove(null)
    setMoveNote('')
  }

  const cancelMove = () => {
    setMoveModal(null)
    setPendingMove(null)
    setMoveNote('')
  }

  const handleEngagedConfirm = async (data: { origination: Record<string, unknown>; allocations: unknown[] }) => {
    if (!pendingMove || !engagedModal) return

    // Save origination
    const res = await fetch('/api/origination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to save origination')

    // Track origination status
    setOriginationStatus(prev => ({ ...prev, [engagedModal.companyId]: 'Draft' }))

    const { source, destination, draggableId } = pendingMove
    await applyMove(draggableId, source, destination, 'Moved to Engaged')

    setEngagedModal(null)
    setPendingMove(null)
  }

  return (
    <>
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board h-full px-5 py-4">
            {PIPELINE_STAGES.map(stage => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const items = (grouped[stage] || []) as Record<string, any>[]
              return (
                <div key={stage} className={cn('kanban-column flex flex-col', 'min-h-0')}>
                  <div className={cn('rounded-t-lg border-t-2 bg-slate-800/80 border-x border-slate-700 px-3 py-2.5 flex-shrink-0', STAGE_COLORS[stage])}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 truncate">{stage}</span>
                      <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded tabular-nums flex-shrink-0 ml-1">
                        {items.length}
                      </span>
                    </div>
                  </div>

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
                        {items.map((company, index) => {
                          const origStatus = originationStatus[String(company.id)]
                          const showOrigWarn = ENGAGED_AND_BEYOND.includes(stage) &&
                            (!origStatus || !['Approved', 'Locked'].includes(origStatus))
                          return (
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
                                  <KanbanCard company={company} showOrigWarn={showOrigWarn} />
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                        {items.length === 0 && (
                          <div className="flex items-center justify-center h-16 text-slate-700 text-xs">Drop here</div>
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

      {/* Engaged origination modal */}
      {engagedModal && (
        <EngagedModal
          open={!!engagedModal}
          companyId={engagedModal.companyId}
          companyName={engagedModal.companyName}
          onClose={() => { setEngagedModal(null); setPendingMove(null) }}
          onConfirm={handleEngagedConfirm}
        />
      )}

      {/* Standard move modal */}
      <Modal open={!!moveModal} onClose={cancelMove} title="Move Company" size="sm">
        {moveModal && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-300">
              Moving <strong className="text-slate-100">{moveModal.companyName}</strong> from{' '}
              <span className="text-slate-400">{moveModal.fromStage}</span> to{' '}
              <span className="text-cyan-400">{moveModal.toStage}</span>
            </p>
            {REQUIRES_APPROVED_ORIGINATION.includes(moveModal.toStage) && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Origination not yet approved for this company. Moving to <strong>{moveModal.toStage}</strong> should normally require approved origination. Proceeding will be logged as an Admin override.
                </p>
              </div>
            )}
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
function KanbanCard({ company, showOrigWarn }: { company: Record<string, any>; showOrigWarn?: boolean }) {
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

      {company.route_to_market && company.route_to_market !== 'Unknown' && (
        <span className={cn(
          'inline-block text-xs px-1.5 py-0.5 rounded border font-medium leading-tight truncate max-w-full',
          ROUTE_TO_MARKET_COLORS[company.route_to_market as RouteToMarket] ?? 'bg-slate-700 text-slate-400 border-slate-600'
        )}>
          {String(company.route_to_market)}
        </span>
      )}

      <div className="flex items-center gap-1 flex-wrap">
        <PriorityBadge priority={String(company.priority)} />
        {company.shma_fit_score !== null && (
          <ScoreBadge score={company.shma_fit_score as number} />
        )}
        {company.pe_owned === 'yes' && <Badge variant="info">PE</Badge>}
        {company.ai_researched && <Sparkles className="h-2.5 w-2.5 text-purple-400" aria-label="AI researched" />}
        {showOrigWarn && (
          <span title="Origination not approved" className="flex items-center gap-0.5 text-amber-400">
            <ShieldAlert className="h-2.5 w-2.5" />
          </span>
        )}
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
