import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ContactDetailClient } from './contact-detail-client'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: contact }, { data: outreach }] = await Promise.all([
    supabase
      .from('contacts')
      .select('*, companies(id, name, stage, segment, country, website)')
      .eq('id', id)
      .single(),
    supabase
      .from('outreach_messages')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!contact) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const company = contact.companies as Record<string, any> | null

  return (
    <>
      <Header
        title={contact.full_name || contact.name}
        subtitle={[contact.title || contact.role, company?.name].filter(Boolean).join(' · ')}
        actions={
          company ? (
            <Link
              href={`/companies/${company.id}`}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {company.name}
            </Link>
          ) : undefined
        }
      />
      <ContactDetailClient
        contact={contact}
        company={company}
        outreach={outreach || []}
      />
    </>
  )
}
