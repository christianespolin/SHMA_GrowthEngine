import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/client'
import { buildResearchPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { company_id, company_name, website, segment, notes, additional_context } = body

    if (!company_name) {
      return NextResponse.json({ error: 'company_name is required' }, { status: 400 })
    }

    const prompt = buildResearchPrompt({ company_name, website, segment, notes, additional_context })
    const response = await callClaude(prompt, SYSTEM_PROMPT, 4096)

    // Parse sections from the AI response
    const sections = parseResearchBrief(response.content)

    if (company_id) {
      // Save to database
      const { error } = await supabase
        .from('ai_research_briefs')
        .insert({
          company_id,
          ...sections,
          generated_at: new Date().toISOString(),
          model_used: response.model,
        })

      if (!error) {
        // Update company as researched
        await supabase
          .from('companies')
          .update({ ai_researched: true, updated_at: new Date().toISOString() })
          .eq('id', company_id)

        // Log activity
        await supabase.from('activity_log').insert({
          company_id,
          activity_type: 'ai_research',
          description: 'AI research brief generated',
          user_id: user.id,
        })
      }
    }

    return NextResponse.json({
      content: response.content,
      sections,
      model: response.model,
    })
  } catch (error) {
    console.error('AI research error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI request failed' },
      { status: 500 }
    )
  }
}

function parseResearchBrief(content: string): Record<string, string> {
  const sections: Record<string, string> = {}

  const sectionMap: Record<string, string> = {
    'Company Snapshot': 'company_snapshot',
    'What They Sell': 'what_they_sell',
    'Who They Sell To': 'who_they_sell_to',
    'Likely Customer Pain': 'likely_customer_pain',
    'Possible As-a-Service Concept': 'possible_aaas_concept',
    'Why SHMA Could Be Relevant': 'why_shma_relevant',
    'Potential Business Model': 'potential_business_model',
    'Potential Financial Model': 'potential_financial_model',
    'Potential Operational Model': 'potential_operational_model',
    'Strategic Trigger': 'strategic_trigger',
    'Suggested Entry Angle': 'suggested_entry_angle',
    'Risks and Uncertainties': 'risks_and_uncertainties',
    'Recommended Next Action': 'recommended_next_action',
  }

  for (const [title, key] of Object.entries(sectionMap)) {
    const regex = new RegExp(`(?:^|\\n)#+\\s*\\d*\\.?\\s*${title}[:\\s]*([\\s\\S]*?)(?=\\n#+\\s*\\d*\\.?\\s*(?:${Object.keys(sectionMap).join('|')})|$)`, 'i')
    const match = content.match(regex)
    if (match) {
      sections[key] = match[1].trim()
    }
  }

  if (Object.keys(sections).length === 0) {
    sections['company_snapshot'] = content
  }

  return sections
}
