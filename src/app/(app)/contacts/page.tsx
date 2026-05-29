import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ContactsListClient } from './contacts-list-client'

export default async function ContactsPage() {
  const supabase = await createClient()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, companies(id, name, stage, segment), outreach_messages(count)')
    .order('created_at', { ascending: false })

  const all = contacts || []

  const byRole = all.reduce<Record<string, number>>((acc, c) => {
    const role = c.role_category || 'Unknown'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  return (
    <>
      <Header
        title="Contacts"
        subtitle={`${all.length} contacts across ${new Set(all.map(c => c.company_id)).size} companies`}
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Summary */}
        <div className="px-5 py-3 border-b border-slate-800 flex gap-4 flex-wrap flex-shrink-0">
          {Object.entries(byRole).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([role, count]) => (
            <div key={role} className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">{role}</span>
              <span className="text-xs font-semibold text-slate-300 tabular-nums">{count}</span>
            </div>
          ))}
        </div>

        <ContactsListClient contacts={all} />
      </div>
    </>
  )
}
