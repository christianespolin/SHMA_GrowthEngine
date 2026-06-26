import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Split a human-reviewed list into sub-lists by review decision
// Creates: "Ready for Contact Research", "AI Researched, Not Interesting"
// Leaves unapproved/pending in the source list
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sourceList } = await supabase
    .from('bulk_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!sourceList) return NextResponse.json({ error: 'List not found' }, { status: 404 })

  // Get all active items
  const { data: items } = await supabase
    .from('bulk_list_companies')
    .select('company_id, human_review_status')
    .eq('bulk_list_id', id)
    .eq('list_status', 'Active')

  if (!items?.length) return NextResponse.json({ error: 'No companies in list' }, { status: 400 })

  const approved = items.filter(i => i.human_review_status === 'Approved').map(i => i.company_id)
  const rejected = items.filter(i => i.human_review_status === 'Rejected').map(i => i.company_id)

  const created: { list: Record<string, unknown>; count: number }[] = []

  // Create "Ready for Contact Research" list for approved
  if (approved.length > 0) {
    const { data: contactList } = await supabase
      .from('bulk_lists')
      .insert({
        name: `${sourceList.name} — Ready for Contact Research`,
        category: 'Ready for Contact Research',
        source_type: 'Selection from Existing List',
        source_notes: `Split from "${sourceList.name}" after human review`,
        parent_bulk_list_id: id,
        created_by: user.id,
        status: 'Ready',
        company_count: approved.length,
      })
      .select()
      .single()

    if (contactList) {
      await supabase.from('bulk_list_companies').insert(
        approved.map(cid => ({ bulk_list_id: contactList.id, company_id: cid, list_status: 'Active' }))
      )
      created.push({ list: contactList, count: approved.length })
    }
  }

  // Create "AI Researched, Not Interesting" list for rejected
  if (rejected.length > 0) {
    const { data: notIntList } = await supabase
      .from('bulk_lists')
      .insert({
        name: `${sourceList.name} — Not Interesting`,
        category: 'AI Researched, Not Interesting',
        source_type: 'Selection from Existing List',
        source_notes: `Rejected during human review of "${sourceList.name}"`,
        parent_bulk_list_id: id,
        created_by: user.id,
        status: 'Completed',
        company_count: rejected.length,
      })
      .select()
      .single()

    if (notIntList) {
      await supabase.from('bulk_list_companies').insert(
        rejected.map(cid => ({ bulk_list_id: notIntList.id, company_id: cid, list_status: 'Active' }))
      )
      // Mark as converted in source
      await supabase.from('bulk_list_companies')
        .update({ list_status: 'Converted' })
        .eq('bulk_list_id', id)
        .in('company_id', rejected)
      created.push({ list: notIntList, count: rejected.length })
    }
  }

  // Mark approved as converted in source
  if (approved.length > 0) {
    await supabase.from('bulk_list_companies')
      .update({ list_status: 'Converted' })
      .eq('bulk_list_id', id)
      .in('company_id', approved)
  }

  // Log activity
  await supabase.from('activity_log').insert(
    [...approved, ...rejected].map(cid => ({
      company_id: cid,
      activity_type: 'human_review_split',
      title: 'Human review — list split',
      description: `Split from "${sourceList.name}" after human review`,
      user_id: user.id,
      related_bulk_list_id: id,
    }))
  )

  return NextResponse.json({ ok: true, created })
}
