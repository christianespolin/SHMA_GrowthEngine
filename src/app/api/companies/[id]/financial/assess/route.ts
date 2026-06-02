import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { getModel } from '@/lib/ai/client'

export const maxDuration = 60

interface FinancialScores {
  financial_strength_score: number
  creditworthiness_score: number
  funding_readiness_score: number
  end_customer_credit_quality_score: number
  asset_finance_suitability_score: number
  implementation_capacity_score: number
  funder_attractiveness_score: number
  score_explanations_json: Record<string, string>
  score_confidence: 'High' | 'Medium' | 'Low'
  score_known_facts: string
  score_hypotheses: string
  score_missing_information: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch company and financial profile
    const [{ data: company }, { data: profile }] = await Promise.all([
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('financial_profiles').select('*').eq('company_id', id).maybeSingle(),
    ])

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const prompt = buildAssessPrompt(company, profile)

    const scores = await callClaudeJSON<FinancialScores>(
      prompt,
      `You are a senior financial analyst and funding advisor specializing in B2B technology companies seeking to transition to As-a-Service business models.
You assess financial health, creditworthiness, and funding readiness to help SHMA (SH Management) advisory firm identify which companies are ready to work with on servitization financing.
Always return valid JSON with the exact structure requested. Be honest — if you lack financial data, set score_confidence to "Low" and do not invent scores above 3.`
    )

    // Validate and clamp scores
    const clamp = (v: number) => Math.min(5, Math.max(1, Math.round(v * 10) / 10))
    const validatedScores = {
      financial_strength_score: clamp(scores.financial_strength_score),
      creditworthiness_score: clamp(scores.creditworthiness_score),
      funding_readiness_score: clamp(scores.funding_readiness_score),
      end_customer_credit_quality_score: clamp(scores.end_customer_credit_quality_score),
      asset_finance_suitability_score: clamp(scores.asset_finance_suitability_score),
      implementation_capacity_score: clamp(scores.implementation_capacity_score),
      funder_attractiveness_score: clamp(scores.funder_attractiveness_score),
      score_explanations_json: scores.score_explanations_json || {},
      score_confidence: scores.score_confidence || 'Low',
      score_known_facts: scores.score_known_facts || '',
      score_hypotheses: scores.score_hypotheses || '',
      score_missing_information: scores.score_missing_information || '',
      scores_generated_at: new Date().toISOString(),
      scores_model: getModel(),
    }

    // Upsert scores to financial_profiles
    const { data: updated, error } = await supabase
      .from('financial_profiles')
      .upsert(
        { ...validatedScores, company_id: id, updated_at: new Date().toISOString() },
        { onConflict: 'company_id' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Financial assess error:', error)
    return NextResponse.json({ error: 'Failed to assess financial profile' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAssessPrompt(company: Record<string, any>, profile: Record<string, any> | null): string {
  const financialData = profile ? `
Revenue: ${profile.revenue ? `${profile.revenue}M ${profile.revenue_currency || 'NOK'} (${profile.revenue_year || 'year unknown'})` : 'Not available'}
EBITDA: ${profile.ebitda ? `${profile.ebitda}M` : 'Not available'}
EBITDA Margin: ${profile.ebitda_margin ? `${profile.ebitda_margin}%` : 'Not available'}
Profit/Loss: ${profile.profit_loss ?? 'Not available'}
Equity: ${profile.equity ?? 'Not available'}
Total Assets: ${profile.total_assets ?? 'Not available'}
Equity Ratio: ${profile.equity_ratio ? `${profile.equity_ratio}%` : 'Not available'}
Debt Level: ${profile.debt_level ?? 'Not available'}
Cash Position: ${profile.cash_position ?? 'Not available'}
Growth Trend: ${profile.growth_trend || 'Unknown'}
Credit Score: ${profile.credit_score || 'Not available'} (${profile.credit_score_provider || 'provider unknown'})
Public Financials: ${profile.public_financials_available ? 'Yes' : 'No/Unknown'}
Financial Notes: ${profile.financial_notes || 'None'}
End-Customer Credit Profile: ${profile.end_customer_credit_profile || 'Not specified'}
Typical End-Customer Type: ${profile.typical_end_customer_type || 'Not specified'}
End-Customer Insolvency Risk: ${profile.end_customer_insolvency_risk || 'Unknown'}
Financing Complexity: ${profile.financing_complexity || 'Unknown'}
Funding Opportunities: ${profile.funding_opportunities || 'None noted'}
Funding Risks: ${profile.funding_risks || 'None noted'}
` : 'No financial data has been entered yet.'

  return `Assess the financial and funding readiness of the following company for SHMA's As-a-Service servitization advisory work.

COMPANY PROFILE:
Name: ${company.name}
Segment: ${company.segment || 'Unknown'}
Description: ${company.description || 'No description available'}
Ownership Type: ${company.ownership_type || 'Unknown'}
Revenue Range: ${company.revenue_range || 'Unknown'}
Employee Range: ${company.employee_range || 'Unknown'}
Country: ${company.country || 'Unknown'}
Stage: ${company.stage || 'Unknown'}

FINANCIAL DATA:
${financialData}

Score each dimension from 1 (very low) to 5 (excellent).
IMPORTANT: If financial data is missing or sparse, set score_confidence to "Low" and keep scores at 2-3 unless the business description strongly suggests otherwise. Do NOT invent scores above 3 without data.

Return ONLY valid JSON matching exactly this structure:
{
  "financial_strength_score": <1-5 numeric>,
  "creditworthiness_score": <1-5 numeric>,
  "funding_readiness_score": <1-5 numeric>,
  "end_customer_credit_quality_score": <1-5 numeric>,
  "asset_finance_suitability_score": <1-5 numeric>,
  "implementation_capacity_score": <1-5 numeric>,
  "funder_attractiveness_score": <1-5 numeric>,
  "score_explanations_json": {
    "financial_strength_score": "<1-2 sentence explanation>",
    "creditworthiness_score": "<1-2 sentence explanation>",
    "funding_readiness_score": "<1-2 sentence explanation>",
    "end_customer_credit_quality_score": "<1-2 sentence explanation>",
    "asset_finance_suitability_score": "<1-2 sentence explanation>",
    "implementation_capacity_score": "<1-2 sentence explanation>",
    "funder_attractiveness_score": "<1-2 sentence explanation>"
  },
  "score_confidence": "High" | "Medium" | "Low",
  "score_known_facts": "<bullet points of facts we know>",
  "score_hypotheses": "<bullet points of reasonable assumptions made>",
  "score_missing_information": "<bullet points of what would improve accuracy>"
}`
}
