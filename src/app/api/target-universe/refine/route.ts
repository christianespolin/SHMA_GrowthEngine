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

Include: ${form.include_industries_text || 'None'}
Avoid: ${form.exclude_industries_text || 'None'}
Reference companies: ${form.reference_companies_text || 'None'}
Industry presets: ${form.industry_presets?.join(', ') || 'None'}

SHMA relevance selected: ${form.shma_fit ? Object.keys(form.shma_fit).join(', ') : 'None'}

Geography presets: ${form.country_presets?.join(', ') || 'None'}
Geography notes: ${form.region_notes || 'None'}

Ownership/triggers: ${form.ownership_filters?.join(', ') || 'None'}
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

  const prompt = `User input:\n${userInput}\n\nReturn valid JSON only:\n{\n  "improved_search_name": "",\n  "clean_scope_definition": "",\n  "included_industries": [],\n  "excluded_industries": [],\n  "suggested_adjacent_sectors": [],\n  "geography_interpretation": [],\n  "shma_relevance_logic": [],\n  "objective_screening_criteria": [],\n  "disqualifiers": [],\n  "clarifying_questions": []\n}\n\nDo not invent market counts. Do not claim to have verified companies. Be precise, practical and commercially useful.`

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
