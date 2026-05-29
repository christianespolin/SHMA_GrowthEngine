import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('GET contact error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowedFields = [
      'name', 'full_name', 'first_name', 'last_name', 'role', 'title',
      'role_category', 'seniority', 'department',
      'email', 'email_status', 'phone', 'phone_status', 'mobile', 'mobile_status',
      'linkedin_url', 'linkedin_status', 'contact_type',
      'source_type', 'source_url', 'source_note', 'lawful_basis_note',
      'gdpr_status', 'contact_status', 'relationship_strength',
      'decision_power_score', 'shma_relevance_score', 'outreach_fit_score',
      'relationship_potential_score', 'confidence_score',
      'ai_rationale', 'outreach_angle', 'notes', 'validation_tasks',
      'decision_maker_relevance',
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH contact error:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch first so we can log the deletion
    const { data: contact } = await supabase
      .from('contacts')
      .select('name, company_id')
      .eq('id', id)
      .single()

    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) throw error

    if (contact?.company_id) {
      await supabase.from('activity_log').insert({
        company_id: contact.company_id,
        activity_type: 'contact_deleted',
        description: `Contact deleted: ${contact.name}`,
        user_id: user.id,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE contact error:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
