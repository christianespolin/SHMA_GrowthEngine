import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: prompts } = await supabase
    .from('prompt_library')
    .select('*')
    .order('category')

  const { data: imports } = await supabase
    .from('imports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <>
      <Header title="Settings" subtitle="Prompt library, AI configuration, and import history" />
      <SettingsClient prompts={prompts || []} imports={imports || []} />
    </>
  )
}
