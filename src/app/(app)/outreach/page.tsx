import { createClient } from '@/lib/supabase/server'
import { OutreachClient } from './outreach-client'

export default async function OutreachPage() {
  const supabase = await createClient()

  const { data: messages } = await supabase
    .from('outreach_messages')
    .select(`
      *,
      company:companies(id, name, website, pipeline_stage),
      contact:contacts(id, first_name, last_name, title)
    `)
    .order('created_at', { ascending: false })

  return <OutreachClient messages={messages ?? []} />
}
