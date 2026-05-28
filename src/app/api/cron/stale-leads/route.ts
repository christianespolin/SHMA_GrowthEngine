import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)

  const { data: staleLeads } = await supabase
    .from('companies')
    .select('id, name, stage, priority, last_activity_date, next_action')
    .lt('last_activity_date', cutoff.toISOString())
    .not('stage', 'in', '("Disqualified","Nurture","Signed")')
    .order('last_activity_date', { ascending: true })
    .limit(20)

  const count = staleLeads?.length || 0

  // Send email via Resend if API key is configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && count > 0) {
    const tableRows = (staleLeads || []).map(c =>
      `<tr><td style="padding:4px 8px">${c.name}</td><td style="padding:4px 8px">${c.stage}</td><td style="padding:4px 8px">${c.priority || '—'}</td><td style="padding:4px 8px">${c.last_activity_date ? new Date(c.last_activity_date).toLocaleDateString() : 'Never'}</td></tr>`
    ).join('')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SHMA Growth Engine <noreply@shma.no>',
        to: [process.env.ALERT_EMAIL || 'christian@shma.no'],
        subject: `${count} stale leads need attention`,
        html: `<h2>Stale Leads Report</h2><p>${count} leads have had no activity in 14+ days:</p><table border="1" cellpadding="0" cellspacing="0"><thead><tr><th>Company</th><th>Stage</th><th>Priority</th><th>Last Activity</th></tr></thead><tbody>${tableRows}</tbody></table><p><a href="https://shma-growth-engine.vercel.app/reports">View in SHMA Growth Engine</a></p>`,
      }),
    })
  }

  return NextResponse.json({ staleCount: count, emailSent: !!(resendKey && count > 0) })
}
