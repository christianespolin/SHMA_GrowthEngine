import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/client'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.json()

  const userInput = `
Scope definition: ${form.scope_definition || 'Not provided'}

Search mode: ${form.search_mode || 'Not specified'}

Industry presets selected: ${form.industry_presets?.join(', ') || 'None'}
Industries to include (free text): ${form.include_industries_text || 'None'}
Industries to exclude: ${form.exclude_industries_text || 'None'}
Reference companies / similar-to: ${form.reference_companies_text || 'None'}

Country presets: ${form.country_presets?.join(', ') || 'None'}
Region notes: ${form.region_notes || 'None'}
Any geography: ${form.any_geography ? 'Yes' : 'No'}

Revenue range: ${[form.min_revenue && `${form.revenue_currency} ${form.min_revenue}m`, form.max_revenue && `to ${form.revenue_currency} ${form.max_revenue}m`].filter(Boolean).join(' ') || 'Not specified'}
Employee range: ${[form.min_employees && `${form.min_employees}+`, form.max_employees && `up to ${form.max_employees}`].filter(Boolean).join(' – ') || 'Not specified'}
Ownership filters: ${form.ownership_filters?.join(', ') || 'None'}
Strategic triggers: ${form.strategic_triggers?.join(', ') || 'None'}

SHMA-fit requirements: ${Object.keys(form.shma_fit || {}).length ? JSON.stringify(form.shma_fit) : 'Not set'}
Funding requirements: ${Object.keys(form.funding || {}).length ? JSON.stringify(form.funding) : 'Not set'}

Disqualifiers: ${Object.entries(form.disqualifiers || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'None set'}
Other exclusions: ${form.other_exclusions_text || 'None'}

Expected universe size: ${form.expected_universe_size || 'Unknown'}
Search depth: ${form.search_depth || 'Not specified'}
`

  const systemPrompt = `You are a senior B2B market segmentation and servitization strategy analyst for SHMA.

SHMA helps asset-heavy B2B companies move from CapEx, project or equipment sales into scalable As-a-Service, managed service, subscription, pay-per-use or outcome-based models.

Your task is to help structure a Target Universe search. You are NOT searching the live market. You are translating the user's strategic intent into clear search criteria.

Prioritize companies with:
- Asset-heavy or equipment-heavy offerings
- High customer upfront investment
- Technical complexity
- Service, maintenance, support or lifecycle potential
- Software, data, monitoring, IoT or optimization potential
- Standardization potential
- Residual value or redeployment potential
- Installed base or aftermarket potential
- Recurring revenue potential
- Strategic growth or margin pressure
- Potential for fundable As-a-Service models

Avoid:
- Pure consulting
- Pure software unless connected to physical assets
- Simple distributors/resellers without own solution
- Very small companies
- Companies where simple leasing is the only relevant model
- Companies without service/support/software/monitoring potential

Return ONLY valid JSON with exactly this structure. No markdown, no explanation, just JSON.`

  const prompt = `User input:\n${userInput}\n\nReturn valid JSON only:\n{\n  "suggested_name": "",\n  "clean_scope_definition": "",\n  "included_industries": [],\n  "excluded_industries": [],\n  "included_geographies": [],\n  "excluded_geographies": [],\n  "objective_screening_criteria": [],\n  "ai_qualification_criteria": [],\n  "disqualifiers": [],\n  "estimated_universe_breadth": "",\n  "suggested_first_screening_logic": [],\n  "suggested_data_sources": [],\n  "risks_and_ambiguities": [],\n  "clarifying_questions": []\n}\n\nDo not invent market counts. Do not claim to have verified companies. Be precise, practical and commercially useful.`

  try {
    const response = await callClaude(prompt, systemPrompt, 2048, 55_000)
    const text = response.content.trim()

    let result: Record<string, unknown>
    // Try direct parse
    try {
      result = JSON.parse(text)
    } catch {
      // Strip markdown code fences if present
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        result = JSON.parse(match[1].trim())
      } else {
        const objMatch = text.match(/\{[\s\S]*\}/)
        if (!objMatch) throw new Error('No JSON found in AI response')
        result = JSON.parse(objMatch[0])
      }
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('AI refine error:', err)
    return NextResponse.json({ error: 'AI refinement failed' }, { status: 500 })
  }
}
