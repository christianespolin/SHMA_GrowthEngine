import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { Mail, Phone, Link2, User, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function ContactsPage() {
  const supabase = await createClient()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, companies(id, name, stage, segment)')
    .order('created_at', { ascending: false })

  const all = contacts || []

  const byRole = all.reduce<Record<string, number>>((acc, c) => {
    const role = c.contact_type || 'Other'
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
        <div className="px-5 py-3 border-b border-slate-800 flex gap-4 flex-shrink-0">
          {Object.entries(byRole).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([role, count]) => (
            <div key={role} className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">{role}</span>
              <span className="text-xs font-semibold text-slate-300 tabular-nums">{count}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">Contact</th>
                <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Company</th>
                <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Stage</th>
                <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Reach</th>
                <th className="text-left text-xs font-medium text-slate-500 px-3 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {all.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-600">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <div>No contacts yet — add them from a company page</div>
                  </td>
                </tr>
              )}
              {all.map(contact => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const company = contact.companies as Record<string, any> | null
                return (
                  <tr key={contact.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-slate-400">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200">{contact.name}</span>
                            {contact.contact_type && <Badge variant="info">{contact.contact_type}</Badge>}
                            {contact.decision_maker_relevance === 'high' && <Badge variant="success">DM</Badge>}
                          </div>
                          {contact.role && <div className="text-xs text-slate-500 mt-0.5">{contact.role}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {company ? (
                        <Link href={`/companies/${company.id}`} className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
                          <Building2 className="h-3 w-3 text-slate-600 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{company.name}</span>
                        </Link>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-500">{company?.stage || '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-slate-500 hover:text-cyan-400 transition-colors" title={contact.email}>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="text-slate-500 hover:text-cyan-400 transition-colors" title={contact.phone}>
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {contact.linkedin_url && (
                          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors">
                            <Link2 className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {!contact.email && !contact.phone && !contact.linkedin_url && (
                          <span className="text-xs text-slate-700">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 max-w-xs">
                      <p className="text-xs text-slate-600 truncate">{contact.notes || '—'}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
