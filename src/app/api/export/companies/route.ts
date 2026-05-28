import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.join(','), ...rows.map(r => columns.map(c => escape(r[c])).join(','))].join('\n')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('companies').select('*').order('name')
  const columns = ['name', 'segment', 'stage', 'priority', 'country', 'website', 'shma_fit_score', 'pe_owned', 'revenue_eur', 'employees', 'next_action', 'next_action_date', 'last_activity_date', 'notes']
  const csv = toCSV(data || [], columns)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="shma-pipeline-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
