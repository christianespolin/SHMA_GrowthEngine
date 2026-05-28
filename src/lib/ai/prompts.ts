export const SYSTEM_PROMPT = `You are a senior business analyst and commercial advisor at SH Management (SHMA), a specialist firm that helps asset-heavy B2B companies develop and commercialize service-based business models.

SHMA's core proposition: We help companies turn complex solutions or assets into outcome-based services — combining internal resources with our proven playbook to develop, fund, and operationalize concepts that unlock scalable growth and higher company value.

SHMA target profile:
- Asset-heavy, technically complex B2B solutions
- End customers face high upfront investment (CapEx barrier)
- Strong service, support, maintenance or lifecycle element
- Software, data or monitoring potential
- Standardizable solutions (for scaling)
- Companies wanting more recurring revenue
- PE-owned or board-driven companies seeking value creation

You are direct, commercial and senior in tone. You avoid buzzwords, generic consulting language and AI-sounding phrases. You distinguish between known facts, reasonable assumptions, hypotheses to validate, and unknowns.`

export function buildResearchPrompt(params: {
  company_name: string
  website?: string | null
  segment?: string | null
  notes?: string | null
  additional_context?: string
}): string {
  return `Analyze this company as a potential SHMA client:

Company: ${params.company_name}
Website: ${params.website || 'Not provided'}
Segment: ${params.segment || 'Unknown'}
Notes: ${params.notes || 'None'}
${params.additional_context ? `Additional context: ${params.additional_context}` : ''}

Produce a structured account brief. For each section, clearly label information as:
[FACT] = confirmed public information
[ASSUMPTION] = reasonable but unverified
[HYPOTHESIS] = needs validation in first conversation
[UNKNOWN] = information gap

Sections to cover:
1. Company Snapshot (2-3 sentences)
2. What They Sell (products/solutions/assets they offer)
3. Who They Sell To (customer profile, industries, geography)
4. Likely Customer Pain (upfront investment, complexity, maintenance, operations challenges)
5. Possible As-a-Service Concept (specific XaaS model that could fit — be creative and concrete)
6. Why SHMA Could Be Relevant (concrete reasons, not generic consulting language)
7. Potential Business Model (how XaaS would work commercially for this company)
8. Potential Financial Model Logic (financing, risk-sharing, OpEx shift mechanisms)
9. Potential Operational Model (what operations would be needed to deliver the service)
10. Strategic Trigger (why now — market shift, PE ownership, new CEO, growth plateau, competitor moves)
11. Suggested Entry Angle (how SHMA should approach — through whom, with what message)
12. Risks and Uncertainties (what could disqualify or complicate this)
13. Recommended Next Action (concrete next step for SHMA)

Be specific and practical. Do not invent facts. If data is missing, say so.`
}

export function buildScoringPrompt(params: {
  company_name: string
  segment?: string | null
  description?: string | null
  notes?: string | null
  website?: string | null
}): string {
  return `Score this company as a potential SHMA servitization client:

Company: ${params.company_name}
Segment: ${params.segment || 'Unknown'}
Description: ${params.description || 'Not provided'}
Website: ${params.website || 'Not provided'}
Notes: ${params.notes || 'None'}

Score each criterion 1-5 (1=very weak, 5=very strong fit):

1. asset_intensity — Is the solution asset-heavy, equipment-heavy or infrastructure-heavy?
2. customer_upfront_investment — Does the end customer face high CapEx or upfront investment barriers?
3. technical_complexity — Is the solution complex to implement, operate, maintain or integrate?
4. service_support_potential — Is there meaningful service, maintenance, support or lifecycle element?
5. software_data_monitoring_potential — Could monitoring, IoT, analytics or software become part of the service?
6. standardization_potential — Can the solution be standardized enough to scale across customers?
7. residual_value_redeployment — Can assets be reused, redeployed, financed or risk-managed?
8. recurring_revenue_ambition — Does the company appear to want more predictable recurring revenue?
9. growth_trigger — Is there a strategic reason why servitization matters now?
10. decision_maker_access — Can SHMA realistically access CEO, CFO, CCO, Head of Service, board or PE owner?
11. commercial_value_to_shma — Would this be a meaningful engagement if converted?

Respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "asset_intensity": <1-5>,
    "customer_upfront_investment": <1-5>,
    "technical_complexity": <1-5>,
    "service_support_potential": <1-5>,
    "software_data_monitoring_potential": <1-5>,
    "standardization_potential": <1-5>,
    "residual_value_redeployment": <1-5>,
    "recurring_revenue_ambition": <1-5>,
    "growth_trigger": <1-5>,
    "decision_maker_access": <1-5>,
    "commercial_value_to_shma": <1-5>
  },
  "score_explanations": {
    "asset_intensity": "<brief explanation>",
    "customer_upfront_investment": "<brief explanation>",
    "technical_complexity": "<brief explanation>",
    "service_support_potential": "<brief explanation>",
    "software_data_monitoring_potential": "<brief explanation>",
    "standardization_potential": "<brief explanation>",
    "residual_value_redeployment": "<brief explanation>",
    "recurring_revenue_ambition": "<brief explanation>",
    "growth_trigger": "<brief explanation>",
    "decision_maker_access": "<brief explanation>",
    "commercial_value_to_shma": "<brief explanation>"
  },
  "shma_fit_score": <1-5 weighted average>,
  "opportunity_score": <1-5>,
  "closing_score": <1-5>,
  "overall_priority_score": <1-5>,
  "priority": "<A|B|C|Nurture|Disqualified>",
  "confidence_level": "<High|Medium|Low>",
  "confidence_reason": "<why this confidence level>",
  "missing_information": ["<info gap 1>", "<info gap 2>"],
  "disqualification_flags": ["<flag if any>"],
  "recommended_questions": ["<question 1>", "<question 2>", "<question 3>"],
  "overall_explanation": "<2-3 sentence summary of the SHMA fit assessment>"
}`
}

export function buildOutreachPrompt(params: {
  company_name: string
  contact_name?: string | null
  contact_role?: string | null
  shma_hypothesis?: string | null
  channel: 'linkedin' | 'email' | 'warm_intro' | 'follow_up' | 're_engagement'
  tone?: string
  sender_name?: string
}): string {
  const channel = params.channel
  const tone = params.tone || 'professional and senior'

  if (channel === 'linkedin') {
    return `Write LinkedIn outreach for SH Management (SHMA).

Target company: ${params.company_name}
Target contact: ${params.contact_name || 'Unknown'}
Target role: ${params.contact_role || 'Unknown'}
SHMA hypothesis about them: ${params.shma_hypothesis || 'Not provided'}
Sender: ${params.sender_name || 'Stian from SH Management'}
Tone: ${tone}

Write:
1. A LinkedIn CONNECTION REQUEST (max 200 characters) — direct, specific, no sales language, creates genuine curiosity
2. A FOLLOW-UP MESSAGE (max 500 characters, for after connection accepted) — brief explanation of SHMA in one concrete sentence, references their specific situation, suggests a short call without being pushy

Rules:
- No buzzwords ("synergies", "transformation journey", "strategic partner")
- No generic consulting language
- Reference something specific about their company
- Sound like a real person, not a template
- Do not use "I hope this email finds you well"

Respond as JSON: {"connection_request": "...", "follow_up_message": "..."}`
  }

  if (channel === 'email') {
    return `Write a cold outreach email for SH Management (SHMA).

Target company: ${params.company_name}
Target contact: ${params.contact_name || 'Unknown'}
Target role: ${params.contact_role || 'Unknown'}
SHMA hypothesis about them: ${params.shma_hypothesis || 'Not provided'}
Sender: ${params.sender_name || 'Stian from SH Management'}
Tone: ${tone}

Write:
1. A FIRST EMAIL (under 180 words):
   - Sharp, specific subject line (not generic)
   - No "I hope this finds you well" opening
   - Opens with something specific about their business
   - 2-3 sentences explaining why SHMA is reaching out and what specific hypothesis they have
   - One sentence about what SHMA does (practical, not consulting-speak)
   - Clear, low-friction CTA (15-min call)
   - Professional sign-off

2. A FOLLOW-UP EMAIL (under 100 words, for 7 days later):
   - Brief reference to first email
   - One new angle or insight
   - Simple CTA

Rules: No buzzwords. Sound like a real senior person. Be specific.

Respond as JSON: {"subject": "...", "first_email": "...", "follow_up_subject": "...", "follow_up_email": "..."}`
  }

  if (channel === 'warm_intro') {
    return `Write a warm introduction request for SH Management (SHMA).

Target company: ${params.company_name}
Target contact: ${params.contact_name || 'Unknown'}
Target role: ${params.contact_role || 'Unknown'}
SHMA hypothesis: ${params.shma_hypothesis || 'Not provided'}
Sender: ${params.sender_name || 'Stian from SH Management'}

Write:
1. A REQUEST TO THE MUTUAL CONNECTION (under 150 words) — personal, explains what SHMA does in one sentence, why interested in target, easy ask
2. A SUGGESTED INTRODUCTION MESSAGE the connector could forward (under 100 words) — natural, not salesy, sets up SHMA well

Respond as JSON: {"request_to_connector": "...", "suggested_intro_text": "..."}`
  }

  return `Write a re-engagement message for SH Management (SHMA).

Company: ${params.company_name}
Contact: ${params.contact_name || 'Unknown'}
Role: ${params.contact_role || 'Unknown'}
Context: ${params.shma_hypothesis || 'Previously reached out but no response'}

Write a brief re-engagement message (under 100 words) that:
- References previous contact briefly
- Adds a new angle or development
- Has a simple CTA
- Sounds human, not automated

Respond as JSON: {"subject": "...", "message": "..."}`
}

export function buildMeetingBriefPrompt(params: {
  company_name: string
  contact_name?: string | null
  contact_role?: string | null
  objective?: string | null
  company_background?: string | null
  shma_hypothesis?: string | null
  stage?: string
}): string {
  return `Create a meeting brief for an SHMA sales meeting.

Company: ${params.company_name}
Contact: ${params.contact_name || 'TBD'} — ${params.contact_role || 'TBD'}
Meeting objective: ${params.objective || 'Discovery / qualification'}
Company background: ${params.company_background || 'Not provided'}
SHMA hypothesis: ${params.shma_hypothesis || 'Not provided'}
Pipeline stage: ${params.stage || 'Unknown'}

Generate a structured meeting brief:

1. MEETING OBJECTIVE (1 clear sentence)
2. SUGGESTED OPENING (2-3 sentences to start naturally and establish credibility)
3. KEY HYPOTHESES TO TEST (3-5 bullet points — what SHMA believes that needs validation)
4. QUESTIONS BY ROLE:
   - For CEO: strategic vision, growth ambition, board pressure
   - For CFO: financial model flexibility, CapEx burden, P&L concerns
   - For Head of Service/Product: operational readiness, service capability, customer feedback
5. LIKELY OBJECTIONS & RESPONSES (3-4 with brief, confident responses)
6. SUGGESTED CLOSE (how to end with a clear next step — always leave with a concrete action)
7. RECOMMENDED NEXT STEP (action within 48 hours of meeting)

Tone: senior, direct, commercial. Not a scripted sales playbook — a practical preparation tool.`
}

export function buildPostMeetingPrompt(params: {
  company_name: string
  meeting_date: string
  participants?: string | null
  meeting_notes: string
  previous_stage?: string
}): string {
  return `Summarize this SHMA meeting and recommend follow-up actions.

Company: ${params.company_name}
Meeting date: ${params.meeting_date}
Participants: ${params.participants || 'Not specified'}
Previous pipeline stage: ${params.previous_stage || 'Unknown'}

Meeting notes:
${params.meeting_notes}

Generate:
1. MEETING SUMMARY (3-5 bullet points — what was actually discussed, key revelations)
2. KEY DECISIONS MADE (if any — be specific)
3. ACTION POINTS (who does what by when — concrete)
4. UPDATED QUALIFICATION ASSESSMENT (how does SHMA now assess this opportunity? More or less confident? Why?)
5. FOLLOW-UP EMAIL DRAFT (professional, references meeting, confirms next steps, under 200 words)
6. RECOMMENDED STAGE MOVEMENT (should company move stage? Which one? Why?)
7. UPDATED SHMA HYPOTHESIS (what do we now believe about the servitization opportunity?)

Be factual. Do not invent information not in the notes. Be direct about if confidence has increased or decreased.`
}

export function buildPipelineAnalysisPrompt(pipelineData: string): string {
  return `Analyze the SHMA sales pipeline and provide this week's recommendations.

Today's date: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Pipeline data:
${pipelineData}

Provide a weekly pipeline analysis:

1. PIPELINE HEALTH SUMMARY (2-3 sentences)
2. TOP 5 FOCUS ACCOUNTS THIS WEEK (with specific reasoning — not just score, but timing and momentum)
3. STALE LEADS (no activity in 14+ days — list with recommended action)
4. BOTTLENECK ANALYSIS (where is the pipeline stuck? What pattern do you see?)
5. LEADS TO CONSIDER DISQUALIFYING (with pragmatic reasoning)
6. LEADS NEEDING PRINCIPAL INVOLVEMENT (where Stian should personally engage)
7. MISSING ACTIONS (high-score companies with no next action or overdue action)
8. ONE BOLD RECOMMENDATION (the single most impactful action SHMA should take this week)

Be direct and action-oriented. This is for internal use by the SHMA team.`
}

export function buildContactDiscoveryPrompt(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  company: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  brief: Record<string, unknown> | null
  existingContacts: { name: string; role: string | null }[]
  criteria: {
    target_roles: string[]
    seniority: string
    preferred_entry: string
    pasted_text: string
    instructions: string
    source_types: string[]
  }
  numberRequested: number
  webContext?: string
}): string {
  const { company, brief, existingContacts, criteria, webContext } = params

  const companyText = `
Name: ${company.name}
Segment: ${company.segment || 'Unknown'}
Country: ${company.country || 'Unknown'}
Website: ${company.website || 'Unknown'}
Stage: ${company.stage || 'Unknown'}
Description: ${company.description || 'Not available'}
PE Owned: ${company.pe_owned || 'Unknown'}
Revenue Range: ${company.revenue_range || 'Unknown'}
Employee Range: ${company.employee_range || 'Unknown'}
`
  const briefText = brief ? `
SHMA Fit Hypothesis: ${brief.why_shma_relevant || ''}
Possible AaaS Concept: ${brief.possible_aaas_concept || ''}
Strategic Trigger: ${brief.strategic_trigger || ''}
Suggested Entry Angle: ${brief.suggested_entry_angle || ''}
` : 'No research brief available.'

  const existingText = existingContacts.length > 0
    ? existingContacts.map(c => `- ${c.name}${c.role ? ` (${c.role})` : ''}`).join('\n')
    : 'None'

  const targetRolesText = criteria.target_roles.length > 0
    ? criteria.target_roles.join(', ')
    : 'CEO, CFO, Head of Service, Head of Strategy, Head of Business Development'

  return `You are an expert B2B sales intelligence analyst for SH Management / SHMA.

SHMA helps asset-heavy B2B companies move from CapEx, project or equipment sales into scalable As-a-Service, managed service, pay-per-use, subscription or performance-based models.

Your task is to identify and prioritize the most relevant contact persons or contact roles at a target company.

CRITICAL RULES:
- Do NOT invent personal contact data (names, emails, phone numbers).
- Only provide a named person if their name appears in the provided company data, pasted text, or web search results below.
- If a named person is found in web search results, use their real name and title — set source_type to "Company website" or "AI suggested role" as appropriate, and known_or_hypothesis to "Needs validation".
- If no named person is known for a role, suggest the role to find (known_or_hypothesis = "Suggested role", full_name = null).
- Do NOT create fake email addresses or phone numbers.
- If an email pattern is inferred (e.g. first.last@company.com), label email_status as "Pattern guess".
- Always include validation_tasks.
- Separate known contacts from suggested roles and AI hypotheses clearly.

COMPANY PROFILE:
${companyText}

SHMA FIT HYPOTHESIS:
${briefText}

KNOWN CONTACTS (do not duplicate):
${existingText}

${criteria.pasted_text ? `PROVIDED TEXT (website, LinkedIn notes, etc.):\n${criteria.pasted_text}\n` : ''}
${webContext || ''}

CONTACT SEARCH CRITERIA:
Target roles: ${targetRolesText}
Seniority preference: ${criteria.seniority || 'C-suite and VP/Director level'}
Preferred entry point: ${criteria.preferred_entry || 'Commercial or service decision-maker'}
Additional instructions: ${criteria.instructions || 'Focus on people who could sponsor or influence a servitization transformation'}

Return a JSON array of ${params.numberRequested} contact suggestions. Each must strictly follow this schema:

{
  "full_name": string or null,
  "title": string or null,
  "role_category": one of ["Executive sponsor","Commercial / strategy","Service / operations","Product / technology","Finance / ownership","Other influencer"],
  "seniority": string or null,
  "department": string or null,
  "suggested_role_to_find": string or null (fill if full_name is null),
  "email": string or null,
  "email_status": one of ["Verified","Unverified","Pattern guess","Unknown"],
  "phone": string or null,
  "phone_status": one of ["Verified","Unverified","Company switchboard","Unknown"],
  "mobile": null,
  "mobile_status": "Unknown",
  "linkedin_url": string or null,
  "linkedin_status": one of ["User provided","Public website","Imported","Needs validation","Unknown"],
  "source_type": one of ["Manual","Company website","Uploaded file","Pasted text","User-provided LinkedIn","AI suggested role"],
  "source_url": string or null,
  "known_or_hypothesis": one of ["Known contact","Suggested role","Hypothesis","Needs validation"],
  "decision_power_score": 1-5,
  "shma_relevance_score": 1-5,
  "outreach_fit_score": 1-5,
  "relationship_potential_score": 1-5,
  "confidence_score": 1-5,
  "ai_rationale": "2-3 sentence explanation of why this person/role matters",
  "outreach_angle": "specific first message angle for SHMA",
  "missing_information": ["list of things to validate"],
  "validation_tasks": ["specific validation steps"],
  "recommended_next_action": "concrete next step"
}

Return ONLY a valid JSON array. No markdown, no explanation. Start with [ and end with ].`
}

export function buildDiscoveryPrompt(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  criteria: any
  number_requested: number
  search_depth: string
  mode: string
  existing_companies: string[]
}): string {
  const c = params.criteria
  const criteriaText = `
SEARCH CRITERIA:
Mode: ${params.mode === 'enrich' ? 'Enrich and score a provided company list' : 'Generate new company suggestions'}
Industry/Segments: ${c.segments?.join(', ') || 'Any'}
Countries: ${c.countries?.join(', ') || 'Any'}
Region: ${c.region || 'Any'}
Revenue range: ${[c.min_revenue, c.max_revenue].filter(Boolean).join(' – ') || 'Not specified'}
Employee range: ${[c.min_employees, c.max_employees].filter(Boolean).join(' – ') || 'Not specified'}
Size notes: ${c.size_notes || 'None'}
Ownership types: ${c.ownership_types?.join(', ') || 'Any'}
Strategic triggers: ${c.strategic_triggers?.join(', ') || 'Any'}

MINIMUM SCORE THRESHOLDS (1–5):
Asset intensity: ≥${c.asset_intensity_min || 1}
Technical complexity: ≥${c.technical_complexity_min || 1}
Customer upfront investment: ≥${c.customer_upfront_investment_min || 1}
Service/support potential: ≥${c.service_support_potential_min || 1}
Software/data/monitoring potential: ≥${c.software_data_monitoring_min || 1}
Standardization potential: ≥${c.standardization_potential_min || 1}
Residual value/redeployment potential: ≥${c.residual_value_min || 1}

OPEN CRITERIA:
${c.open_criteria || 'None'}

SEED COMPANIES / EXAMPLES TO USE AS REFERENCE:
${c.seed_companies || 'None provided'}

COMPANIES TO AVOID (negative examples):
${c.companies_to_avoid || 'None specified'}

${params.mode === 'enrich' && c.pasted_company_list ? `COMPANY LIST TO ENRICH:\n${c.pasted_company_list}` : ''}

EXISTING PIPELINE COMPANIES (avoid suggesting these):
${params.existing_companies.length > 0 ? params.existing_companies.join(', ') : 'None'}

REQUEST: ${params.mode === 'enrich' ? `Score and rank the provided company list` : `Generate ${params.number_requested} candidate companies`}
Search depth: ${params.search_depth}
`

  return `You are an expert B2B servitization strategy analyst working for SH Management / SHMA.

SHMA helps asset-heavy B2B companies move from CapEx/project/equipment sales into scalable As-a-Service, managed service, subscription, pay-per-use, performance-based or outcome-based models.

SHMA SWEET SPOT — Prioritize companies with:
- Asset-heavy or equipment-heavy solutions
- High customer upfront investment (CapEx barrier)
- Technical complexity requiring expertise
- Service, support, maintenance or lifecycle potential
- Software, data, monitoring, IoT or optimization potential
- Standardizable solutions (for scaling)
- Residual value or redeployment potential
- Growth ambition or recurring revenue desire
- Strategic pressure from board, PE owner, customers or competition

DISQUALIFIERS — Avoid companies that are:
- Pure consulting firms or hourly service businesses
- Pure software firms unless software directly controls physical assets
- Very small startups without significant installed base or customer commitment
- Businesses where only simple leasing is needed (no servitization transformation)
- Companies without clear decision-maker access

${criteriaText}

IMPORTANT INSTRUCTIONS:
1. Do NOT suggest companies simply because they are in the right industry. Explain the specific servitization logic.
2. Be specific about the possible As-a-Service concept (e.g., "Equipment-as-a-Service where customers pay per scan instead of buying the scanner" NOT just "XaaS model").
3. Clearly distinguish: KNOWN INFO (from training data / user input) vs AI HYPOTHESES (reasonable but unverified) vs MISSING INFO (gaps to validate).
4. Do NOT invent specific revenue figures, ownership structures or executive names unless they are very well-known public facts.
5. Confidence level should reflect how well you know this company and how well-evidenced the servitization thesis is.
6. Be strict on scores. A score of 5 should be genuinely exceptional. Most companies should score 3–4 on most criteria.

Return a JSON array of exactly ${params.mode === 'enrich' ? 'all provided' : params.number_requested} company suggestions. Each entry must strictly follow this schema:

{
  "company_name": "string",
  "website": "string or null",
  "country": "string or null",
  "region": "string or null",
  "segment": "string",
  "subsegment": "string or null",
  "description": "2-3 sentence description",
  "what_they_sell": "string",
  "why_they_fit_shma": "string — specific servitization rationale",
  "possible_as_a_service_concept": "string — specific XaaS concept, not generic",
  "customer_capex_barrier": "string — describe the upfront cost or complexity faced by customers",
  "service_support_potential": "string",
  "software_data_monitoring_potential": "string",
  "financing_logic": "string — how financing or risk-sharing could work",
  "strategic_trigger": "string — why now is the right time",
  "suggested_decision_makers": ["string array of role titles to target"],
  "outreach_angle": "string — specific first message angle for SHMA",
  "scores": {
    "asset_intensity": 1-5,
    "customer_upfront_investment": 1-5,
    "technical_complexity": 1-5,
    "service_support_potential": 1-5,
    "software_data_monitoring_potential": 1-5,
    "standardization_potential": 1-5,
    "residual_value_redeployment_potential": 1-5,
    "recurring_revenue_potential": 1-5,
    "strategic_trigger_strength": 1-5,
    "decision_maker_accessibility": 1-5,
    "commercial_value_to_shma": 1-5
  },
  "shma_fit_score": 1-5,
  "opportunity_score": 1-5,
  "confidence_score": 1-5,
  "overall_priority": "A-priority" | "B-priority" | "C-priority" | "Nurture" | "Needs validation" | "Disqualified",
  "confidence_level": "High" | "Medium" | "Low",
  "known_information": ["array of facts from training data or user input"],
  "ai_hypotheses": ["array of reasonable but unverified assumptions"],
  "missing_information": ["array of gaps that need validation"],
  "validation_tasks": ["array of specific things the outreach team should verify before contacting"],
  "ai_rationale": "string — 2-3 sentence overall assessment",
  "recommendation": "string — concrete recommended next action for SHMA"
}

Return ONLY a valid JSON array. No markdown, no explanation, no prefix text. Start directly with [ and end with ].`
}
