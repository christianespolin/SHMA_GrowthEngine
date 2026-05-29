import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

async function recalculateContactCoverage(supabase: SupabaseClient, companyId: string) {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('role_category, outreach_fit_score, decision_power_score, contact_status')
    .eq('company_id', companyId)
    .not('contact_status', 'in', '("Rejected","Do not contact")')

  const all = contacts || []
  const hasDecisionMaker = all.some((c: { role_category: string; decision_power_score: number | null }) =>
    ['Executive sponsor', 'Finance / ownership'].includes(c.role_category) &&
    (c.decision_power_score || 0) >= 4
  )
  const hasHighOutreach = all.some((c: { outreach_fit_score: number | null }) => (c.outreach_fit_score || 0) >= 4)

  const coverageScore = all.length === 0 ? 0 :
    Math.min(5, Math.round((
      (hasDecisionMaker ? 2 : 0) +
      (hasHighOutreach ? 1 : 0) +
      Math.min(2, all.length / 2)
    ) * 10) / 10)

  await supabase.from('companies').update({
    contact_coverage_score: coverageScore,
    decision_maker_identified: hasDecisionMaker,
    warm_intro_available: all.some((c: { contact_status: string }) => c.contact_status === 'Responded'),
  }).eq('id', companyId)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch the suggestion
    const { data: suggestion, error: suggError } = await supabase
      .from('contact_suggestions')
      .select('*')
      .eq('id', id)
      .single()

    if (suggError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    // Check for duplicates
    const normalizedName = (suggestion.full_name || '').toLowerCase().trim()
    const normalizedEmail = (suggestion.email || '').toLowerCase().trim()
    const normalizedLinkedin = (suggestion.linkedin_url || '').toLowerCase().trim()

    let duplicateWarning: string | null = null

    if (normalizedName || normalizedEmail || normalizedLinkedin) {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id, name, email, linkedin_url')
        .eq('company_id', suggestion.company_id)

      for (const contact of (existing || [])) {
        const contactName = (contact.name || '').toLowerCase().trim()
        const contactEmail = (contact.email || '').toLowerCase().trim()
        const contactLinkedin = (contact.linkedin_url || '').toLowerCase().trim()

        if (
          (normalizedName && contactName === normalizedName) ||
          (normalizedEmail && contactEmail === normalizedEmail) ||
          (normalizedLinkedin && contactLinkedin === normalizedLinkedin)
        ) {
          duplicateWarning = `Possible duplicate: contact "${contact.name}" already exists`
          break
        }
      }
    }

    // Insert into contacts
    const displayName = suggestion.full_name || suggestion.suggested_role_to_find || 'Unknown contact'
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        company_id: suggestion.company_id,
        name: displayName,
        full_name: suggestion.full_name || null,
        role: suggestion.title || null,
        title: suggestion.title || null,
        role_category: suggestion.role_category || null,
        seniority: suggestion.seniority || null,
        department: suggestion.department || null,
        email: suggestion.email || null,
        email_status: suggestion.email_status || 'Unknown',
        phone: suggestion.phone || null,
        phone_status: suggestion.phone_status || 'Unknown',
        mobile: suggestion.mobile || null,
        mobile_status: suggestion.mobile_status || 'Unknown',
        linkedin_url: suggestion.linkedin_url || null,
        linkedin_status: suggestion.linkedin_status || 'Unknown',
        source_type: suggestion.source_type || 'AI suggested role',
        source_url: suggestion.source_url || null,
        decision_power_score: suggestion.decision_power_score || null,
        shma_relevance_score: suggestion.shma_relevance_score || null,
        outreach_fit_score: suggestion.outreach_fit_score || null,
        relationship_potential_score: suggestion.relationship_potential_score || null,
        confidence_score: suggestion.confidence_score || null,
        ai_rationale: suggestion.ai_rationale || null,
        outreach_angle: suggestion.outreach_angle || null,
        validation_tasks: suggestion.validation_tasks || [],
        missing_information: suggestion.missing_information || [],
        scores_json: suggestion.scores_json || {},
        recommended_next_action: suggestion.recommended_next_action || null,
        suggested_role_to_find: suggestion.suggested_role_to_find || null,
        source_suggestion_id: id,
        notes: suggestion.recommended_next_action
          ? `Recommended next action: ${suggestion.recommended_next_action}`
          : null,
        gdpr_status: 'Not reviewed',
        contact_status: 'Validated',
        relationship_strength: 'unknown',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Update suggestion status
    await supabase
      .from('contact_suggestions')
      .update({
        status: 'Converted to contact',
        converted_contact_id: newContact.id,
      })
      .eq('id', id)

    // Recalculate coverage
    await recalculateContactCoverage(supabase, suggestion.company_id)

    // Activity log
    await supabase.from('activity_log').insert({
      company_id: suggestion.company_id,
      activity_type: 'contact_added',
      description: `Contact added from AI suggestion: ${displayName}`,
      user_id: user.id,
    })

    return NextResponse.json({ contact_id: newContact.id, duplicate_warning: duplicateWarning })
  } catch (error) {
    console.error('POST convert suggestion error:', error)
    return NextResponse.json({ error: 'Failed to convert suggestion' }, { status: 500 })
  }
}
