import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { Calendar, Clock, Users, Building2, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function MeetingsPage() {
  const supabase = await createClient()

  const { data: meetings } = await supabase
    .from('meetings')
    .select('*, companies(id, name, stage, segment)')
    .order('meeting_date', { ascending: false })

  const all = meetings || []
  const now = new Date()

  const upcoming = all.filter(m => new Date(m.meeting_date) >= now)
  const past = all.filter(m => new Date(m.meeting_date) < now)

  return (
    <>
      <Header
        title="Meetings"
        subtitle={`${upcoming.length} upcoming · ${past.length} past`}
      />
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Upcoming ({upcoming.length})
            </h2>
            <div className="space-y-2">
              {upcoming.reverse().map(meeting => (
                <MeetingRow key={meeting.id} meeting={meeting} upcoming />
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Past ({past.length})
            </h2>
            <div className="space-y-2">
              {past.map(meeting => (
                <MeetingRow key={meeting.id} meeting={meeting} upcoming={false} />
              ))}
            </div>
          </section>
        )}

        {all.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No meetings logged yet</p>
            <p className="text-xs text-slate-700 mt-1">Log meetings from a company page</p>
          </div>
        )}
      </div>
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MeetingRow({ meeting, upcoming }: { meeting: Record<string, any>; upcoming: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const company = meeting.companies as Record<string, any> | null
  const date = new Date(meeting.meeting_date)
  const isToday = date.toDateString() === new Date().toDateString()

  return (
    <Link href={`/companies/${company?.id}`}>
      <div className={`bg-slate-800 border rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer flex items-start gap-4 ${upcoming ? 'border-cyan-500/20' : 'border-slate-700'}`}>
        {/* Date block */}
        <div className={`flex-shrink-0 w-12 text-center rounded-md py-1.5 ${upcoming ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-slate-700/50'}`}>
          <div className={`text-lg font-bold leading-none ${upcoming ? 'text-cyan-400' : 'text-slate-400'}`}>
            {date.getDate()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {date.toLocaleString('default', { month: 'short' })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                {company && (
                  <span className="font-medium text-slate-200">{company.name}</span>
                )}
                {isToday && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">Today</span>
                )}
              </div>
              {company?.stage && (
                <span className="text-xs text-slate-500">{company.stage}</span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0 mt-0.5" />
          </div>

          {meeting.objective && (
            <p className="text-sm text-slate-400 mt-1 truncate">{meeting.objective}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {meeting.participants && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {meeting.participants}
              </span>
            )}
          </div>

          {meeting.next_step && (
            <div className="mt-2 text-xs text-amber-400/70 truncate">
              → {meeting.next_step}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
