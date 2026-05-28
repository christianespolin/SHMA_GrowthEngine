import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.join(','), ...rows.map(r => columns.map(c => escape(r[c])).join(','))].join('\n')
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('discovery_suggestions')
    .select('*')
    .eq('discovery_search_id', id)
    .order('shma_fit_score', { ascending: false })

  const columns = [
    'company_name', 'website', 'country', 'segment',
    'shma_fit_score', 'opportunity_score', 'confidence_score',
    'overall_priority', 'confidence_level', 'status',
    'shma_fit_reason', 'possible_as_a_service_concept', 'outreach_angle',
  ]
  const csv = toCSV(data || [], columns)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="discovery-${id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
