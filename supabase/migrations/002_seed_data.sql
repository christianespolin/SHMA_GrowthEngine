-- SHMA Growth Engine — Seed Data
-- 8 realistic example companies + prompt library

-- ============================================================
-- PROMPT LIBRARY
-- ============================================================
insert into public.prompt_library (name, category, prompt_text, description) values

('company_research', 'Research',
'You are a senior business analyst working for SH Management (SHMA), a specialist advisory firm that helps asset-heavy B2B companies develop and commercialize service-based business models (Equipment-as-a-Service, Managed Service, Pay-per-use, Outcome-based, etc.).

Your task is to research and analyze the following company as a potential SHMA client:

Company: {{company_name}}
Website: {{website}}
Segment: {{segment}}
Additional notes: {{notes}}

Produce a structured account brief with these sections:
1. Company Snapshot (2-3 sentences)
2. What They Sell (products/solutions/assets)
3. Who They Sell To (customer profile, industries, geography)
4. Likely Customer Pain (what challenges do their customers face — especially around upfront investment, complexity, maintenance, operations)
5. Possible As-a-Service Concept (what XaaS model could fit — be specific and creative)
6. Why SHMA Could Be Relevant (concrete reasons, not generic consulting language)
7. Potential Business Model (how the XaaS model could work commercially)
8. Potential Financial Model Logic (how financing, risk-sharing, or OpEx shift could work)
9. Potential Operational Model (what operations would be required to deliver the service)
10. Strategic Trigger (why is NOW the right time — market shift, PE ownership, new CEO, growth plateau, etc.)
11. Suggested Entry Angle (how SHMA should approach this company — through whom, with what message)
12. Risks and Uncertainties (what could disqualify or complicate this)
13. Recommended Next Action (concrete next step for SHMA)

Be specific, practical and senior in tone. Distinguish clearly between:
- Known facts (from public information)
- Reasonable assumptions (logical but unverified)
- Hypotheses to validate (questions for the first conversation)
- Unknowns (information gaps)

Do not invent facts. If information is not available, say so.',
'Generates a structured account research brief for a potential SHMA client'),

('shma_scoring', 'Scoring',
'You are a senior analyst at SH Management (SHMA), evaluating whether a company is a strong candidate for an SHMA servitization engagement.

Score the following company on each criterion from 1-5, where:
1 = Very weak fit
2 = Weak fit
3 = Moderate fit
4 = Strong fit
5 = Very strong fit

Company: {{company_name}}
Segment: {{segment}}
Description: {{description}}
Website info: {{website_text}}
Notes: {{notes}}

Score each criterion and provide a brief explanation:

1. Asset Intensity — Is the solution asset-heavy, equipment-heavy or infrastructure-heavy?
2. Customer Upfront Investment — Does the end customer face high CapEx or upfront investment barriers?
3. Technical Complexity — Is the solution complex to implement, operate, maintain or integrate?
4. Service/Support Potential — Is there meaningful service, maintenance, support or lifecycle element?
5. Software/Data/Monitoring Potential — Could monitoring, IoT, analytics or software become part of the service?
6. Standardization Potential — Can the solution be standardized enough to scale across customers?
7. Residual Value/Redeployment Potential — Can assets be reused, redeployed, financed or risk-managed?
8. Recurring Revenue Ambition — Does the company appear to want more predictable recurring revenue?
9. Growth Trigger — Is there a strategic reason why servitization matters now?
10. Decision-Maker Access — Can SHMA access CEO, CFO, CCO, Head of Service, board or PE owner?
11. Commercial Value to SHMA — Would this be a meaningful engagement if converted?

Then provide:
- SHMA Fit Score (weighted average, asset intensity × 1.5, customer investment × 1.3, service potential × 1.2, others × 1.0)
- Opportunity Score (average of recurring revenue ambition, growth trigger, decision-maker access)
- Overall Assessment (A/B/C/Nurture/Disqualify)
- Confidence Level (High/Medium/Low) and why
- Key Missing Information needed to validate
- Top 3 Questions for human review

Respond in valid JSON format.',
'Scores a company against SHMA fit criteria'),

('outreach_linkedin', 'Outreach',
'You are writing a LinkedIn connection request message on behalf of {{sender_name}} from SH Management (SHMA).

Company being approached: {{company_name}}
Contact name: {{contact_name}}
Contact role: {{contact_role}}
SHMA fit summary: {{shma_fit_summary}}
Tone: {{tone}}

Write a LinkedIn connection request that:
- Is maximum 200 characters (LinkedIn limit)
- Is direct, professional and senior
- References something specific about their company or role
- Does NOT sound like a sales pitch or generic template
- Does NOT mention "consulting", "transformation" or buzzwords
- Creates genuine curiosity

Also write a follow-up LinkedIn message (for after connection is accepted), maximum 500 characters, that:
- Briefly explains what SHMA does in one concrete sentence
- References a specific hypothesis about their company
- Suggests a short conversation without being pushy

Output as JSON with fields: connection_request, follow_up_message',
'Generates LinkedIn outreach messages'),

('outreach_email', 'Outreach',
'You are writing a prospecting email on behalf of {{sender_name}} from SH Management (SHMA).

Company being approached: {{company_name}}
Contact name: {{contact_name}}
Contact role: {{contact_role}}
SHMA fit summary: {{shma_fit_summary}}
Tone: {{tone}}

Write a first outreach email that:
- Has a sharp, specific subject line (not generic)
- Opening line references something specific about their business (no "I hope this finds you well")
- In 2-3 sentences explains why SHMA is reaching out and what specific hypothesis they have about this company
- One sentence about what SHMA does (practical, not consulting-speak)
- Clear and low-friction call to action (15-min call, not a meeting)
- Professional sign-off
- Total length: under 180 words

Also write a follow-up email for 7 days later:
- References the first email briefly
- Adds one new angle or insight
- Simple CTA
- Under 100 words

Output as JSON with fields: subject, first_email, follow_up_subject, follow_up_email',
'Generates email outreach messages'),

('meeting_brief', 'Meetings',
'You are preparing a meeting brief for a SH Management (SHMA) sales meeting.

Company: {{company_name}}
Contact name: {{contact_name}}
Contact role: {{contact_role}}
Meeting objective: {{objective}}
Company background: {{company_background}}
SHMA hypothesis: {{shma_hypothesis}}
Stage: {{stage}}

Generate a structured meeting brief with:
1. Meeting Objective (1 sentence)
2. Suggested Opening (2-3 sentences to start the conversation naturally)
3. Key Hypotheses to Test (3-5 bullet points — what SHMA believes about this company that needs validation)
4. Questions by Role:
   - For CEO: strategic and vision questions
   - For CFO: financial model and risk questions
   - For Head of Service/Product: operational and capability questions
5. Likely Objections and Suggested Responses (3-4 objections with brief responses)
6. Suggested Close (how to end the meeting with a clear next step)
7. Recommended Next Step (concrete action within 48 hours of the meeting)

Tone: senior, direct, commercial. Not generic consulting.',
'Generates a pre-meeting brief'),

('post_meeting_followup', 'Meetings',
'You are a senior analyst at SH Management summarizing a meeting and drafting follow-up actions.

Company: {{company_name}}
Meeting date: {{meeting_date}}
Participants: {{participants}}
Meeting notes/transcript: {{meeting_notes}}
Previous stage: {{previous_stage}}

Generate:
1. Meeting Summary (3-5 bullet points, what was actually discussed)
2. Key Decisions Made (if any)
3. Action Points (who does what by when — be specific)
4. Updated Qualification Assessment (based on this meeting, how does SHMA now assess the opportunity?)
5. Follow-up Email draft (professional, references the meeting, confirms next steps, under 200 words)
6. Recommended Stage Movement (should the company move to a new stage? Which one? Why?)
7. Updated SHMA Hypothesis (what do we now believe about the servitization opportunity?)

Be factual and grounded. Do not invent information not in the notes.',
'Generates post-meeting follow-up and summary'),

('pipeline_analysis', 'Pipeline',
'You are analyzing the SHMA sales pipeline for SH Management.

Today''s date: {{today_date}}
Pipeline data: {{pipeline_data}}

Provide a weekly pipeline analysis with:
1. Pipeline Health Summary (2-3 sentences overall assessment)
2. Top 5 Focus Accounts This Week (with specific reasons — not just highest score, but momentum, timing and opportunity)
3. Stale Leads (companies with no activity in 14+ days that need attention)
4. Bottleneck Analysis (where is the pipeline stuck? What stage has the most companies?)
5. Leads to Consider Disqualifying (with reasoning — not harsh, but pragmatic)
6. Leads Needing Executive Involvement (where SHMA principal should step in)
7. Missing Actions (companies with high scores but no next action)
8. AI Recommendations for Each Owner (tailored actions per internal owner)
9. Risk Flags (any leads at risk of going cold, competitor engagement, etc.)
10. One Bold Recommendation (what is the single most impactful action SHMA should take this week?)

Be direct, commercial and action-oriented. This is for internal SHMA use.',
'Generates weekly pipeline analysis'),

('warm_intro_request', 'Outreach',
'You are drafting a warm introduction request for SH Management.

Target company: {{target_company}}
Target contact: {{target_contact}}
Target contact role: {{target_role}}
Mutual connection: {{connector_name}}
Connector relationship: {{connector_context}}
SHMA hypothesis about target: {{shma_hypothesis}}

Write a warm introduction request message to the mutual connection that:
- Is personal and respectful of their time
- Clearly explains what SHMA does in one sentence
- States specifically why SHMA is interested in the target company
- Makes a clear, easy ask (not too much — just an introduction or green light)
- Is under 150 words

Also write a suggested introduction message the connector could send (for their convenience):
- Under 100 words
- Natural and not salesy
- Sets up SHMA well without over-selling

Output as JSON with fields: request_to_connector, suggested_intro_text',
'Generates warm introduction request messages')

on conflict (name) do nothing;

-- ============================================================
-- SEED COMPANIES (8 realistic examples)
-- ============================================================
insert into public.companies (
  name, website, country, segment, description, ownership_type, pe_owned,
  revenue_range, employee_range, lead_source, stage, priority,
  next_action, next_action_type, next_action_date,
  shma_fit_score, opportunity_score, closing_score, overall_priority_score,
  score_breakdown, score_explanation, notes, ai_researched
) values

(
  'Scaletronic',
  'https://scaletronicglobal.com',
  'Denmark',
  'Warehouse automation and intralogistics',
  'Scaletronic provides advanced warehouse automation solutions including conveyor systems, sorters and intralogistics software. Solutions typically cost €500k–€3M per installation. Strong IoT monitoring capability.',
  'Private',
  'unknown',
  '€10M–€50M',
  '50–200',
  'LinkedIn, via AaaS reference',
  'Engaged',
  'A',
  'Book follow-up meeting with CEO and Head of Operations',
  'Book meeting',
  (current_date + interval '5 days')::date,
  4.5, 4.2, 4.0, 4.3,
  '{"asset_intensity": 5, "customer_upfront_investment": 5, "technical_complexity": 4, "service_support_potential": 5, "software_data_monitoring_potential": 4, "standardization_potential": 4, "residual_value_redeployment": 4, "recurring_revenue_ambition": 4, "growth_trigger": 4, "decision_maker_access": 4, "commercial_value_to_shma": 5}',
  'Excellent SHMA fit. Asset-heavy solutions with high customer CapEx, strong service and monitoring potential. CFO already engaged. CEO meeting needed to validate recurring revenue ambition. Strong AaaS reference case synergy.',
  'Spoke with Kevin Dieck (CFO). Very positive. Connecting to CEO. Solutions €500k–€3M. IoT monitoring in place. 20+ year asset lifetime.',
  false
),

(
  'Örsted Industrial Services',
  'https://orsted.com',
  'Denmark',
  'Energy, charging, HVAC and building technology',
  'Subsidiary of Ørsted focused on industrial energy optimization, HVAC systems and building energy management for large commercial and industrial clients.',
  'Public',
  'no',
  '€500M+',
  '1000+',
  'Research',
  'AI Researched',
  'B',
  'Identify correct business unit and decision-maker',
  'Identify decision-maker',
  (current_date + interval '3 days')::date,
  4.0, 3.5, 2.5, 3.7,
  '{"asset_intensity": 4, "customer_upfront_investment": 4, "technical_complexity": 4, "service_support_potential": 5, "software_data_monitoring_potential": 5, "standardization_potential": 3, "residual_value_redeployment": 3, "recurring_revenue_ambition": 4, "growth_trigger": 3, "decision_maker_access": 2, "commercial_value_to_shma": 4}',
  'Strong technical fit but access to the right decision-maker within a large public company is the key challenge. Business unit targeting required.',
  'Large public company — need to identify the right business unit. Industrial energy optimization could be excellent AaaS candidate.',
  true
),

(
  'Norva24',
  'https://norva24.com',
  'Norway',
  'Industrial technology and machinery',
  'Norva24 is a PE-owned Scandinavian environmental services company providing industrial cleaning, inspection and maintenance of underground infrastructure. Recently expanded through acquisitions.',
  'PE-owned',
  'yes',
  '€100M–€500M',
  '500–2000',
  'Research - PE portfolio scan',
  'Human Review',
  'A',
  'Map PE ownership structure and identify board contact',
  'Find warm intro',
  (current_date + interval '7 days')::date,
  4.2, 4.5, 3.5, 4.1,
  '{"asset_intensity": 5, "customer_upfront_investment": 3, "technical_complexity": 4, "service_support_potential": 5, "software_data_monitoring_potential": 4, "standardization_potential": 4, "residual_value_redeployment": 3, "recurring_revenue_ambition": 5, "growth_trigger": 5, "decision_maker_access": 3, "commercial_value_to_shma": 4}',
  'PE-owned with active growth strategy. Strong service and monitoring potential. PE pressure for recurring revenue and value creation aligns perfectly with SHMA proposition. Need warm intro to PE owner or board.',
  'PE-owned environmental services. Acquisition-led growth. PE ownership creates strong motivation for service model improvements and recurring revenue.',
  true
),

(
  'Autostore',
  'https://www.autostoresystem.com',
  'Norway',
  'Warehouse automation and intralogistics',
  'AutoStore is a global leader in cube storage automation systems. Their robotic grid systems are sold to enterprise e-commerce, retail and pharma clients. High-value installations with complex integration.',
  'Public',
  'no',
  '€200M+',
  '500–1000',
  'Research',
  'Qualified Target',
  'B',
  'Draft outreach to Head of Commercial',
  'Draft outreach',
  (current_date + interval '10 days')::date,
  4.3, 3.8, 2.8, 3.8,
  '{"asset_intensity": 5, "customer_upfront_investment": 5, "technical_complexity": 5, "service_support_potential": 4, "software_data_monitoring_potential": 5, "standardization_potential": 5, "residual_value_redeployment": 4, "recurring_revenue_ambition": 4, "growth_trigger": 3, "decision_maker_access": 2, "commercial_value_to_shma": 4}',
  'Perfect technical profile for RaaS (Robotics-as-a-Service). Already growing rapidly but larger enterprise customers may want OpEx model. Decision-maker access through public company channels will require effort.',
  'Global robotics company. System installations are extremely expensive. Strong candidate for RaaS or subscription model. Already publicly listed but may have internal service transformation team.',
  true
),

(
  'Kongsberg Maritime',
  'https://www.kongsberg.com/maritime',
  'Norway',
  'Maritime, offshore and subsea',
  'Kongsberg Maritime provides maritime automation, navigation, propulsion and dynamic positioning systems for offshore vessels, merchant ships and submarines. Technology-intensive with global service network.',
  'Public',
  'no',
  '€1B+',
  '5000+',
  'Research',
  'Longlist',
  'B',
  'Research correct division for service transformation angle',
  'Research company',
  (current_date + interval '14 days')::date,
  4.5, 3.2, 2.0, 3.5,
  '{"asset_intensity": 5, "customer_upfront_investment": 5, "technical_complexity": 5, "service_support_potential": 5, "software_data_monitoring_potential": 5, "standardization_potential": 3, "residual_value_redeployment": 3, "recurring_revenue_ambition": 3, "growth_trigger": 3, "decision_maker_access": 1, "commercial_value_to_shma": 3}',
  'Technically excellent fit but very large public company. SHMA would need to find the right business unit or spin-off initiative. May be too large unless targeting a specific division with autonomy.',
  'Very large company. May need to focus on a specific division or new product line that is exploring XaaS. Autonomous vessels or remote monitoring could be entry angle.',
  false
),

(
  'Xellia Pharmaceuticals',
  null,
  'Denmark',
  'Medtech and labtech',
  'PE-owned pharma manufacturing company producing antibiotics and specialty injectables. Complex manufacturing equipment, GMP compliance requirements, high service and maintenance needs.',
  'PE-owned',
  'yes',
  '€200M–€500M',
  '500–1000',
  'Research - PE portfolio scan',
  'Longlist',
  'C',
  'Research equipment profile and service structure',
  'Research company',
  (current_date + interval '21 days')::date,
  3.5, 3.8, 2.5, 3.3,
  '{"asset_intensity": 4, "customer_upfront_investment": 3, "technical_complexity": 5, "service_support_potential": 5, "software_data_monitoring_potential": 4, "standardization_potential": 2, "residual_value_redeployment": 2, "recurring_revenue_ambition": 4, "growth_trigger": 4, "decision_maker_access": 2, "commercial_value_to_shma": 3}',
  'PE-owned with complex equipment needs. Regulatory environment creates strong service dependency. However, pharma manufacturing equipment is highly specialized — standardization may be limited. Worth validating.',
  'PE-owned pharma. High complexity. Service and compliance are critical. Standardization potential is the key question.',
  false
),

(
  'Remora Robotics',
  null,
  'Sweden',
  'Robotics and automation',
  'Early-stage robotics startup developing underwater inspection robots for offshore infrastructure. Pre-revenue but strong technology. Targeting oil & gas, offshore wind and port operators.',
  'Startup / VC-backed',
  'no',
  '<€5M',
  '10–50',
  'LinkedIn - network',
  'Nurture',
  'Nurture',
  'Check back in 6 months when they have first customers',
  'Nurture',
  (current_date + interval '180 days')::date,
  3.8, 2.5, 1.5, 2.8,
  '{"asset_intensity": 4, "customer_upfront_investment": 4, "technical_complexity": 5, "service_support_potential": 4, "software_data_monitoring_potential": 5, "standardization_potential": 3, "residual_value_redeployment": 3, "recurring_revenue_ambition": 4, "growth_trigger": 3, "decision_maker_access": 4, "commercial_value_to_shma": 2}',
  'Interesting technology but too early stage. Pre-revenue startups rarely have the budget for SHMA engagement. Strong candidate in 12-18 months when they have paying customers and face scaling decisions.',
  'Exciting tech but pre-revenue. Nurture and revisit when they close Series A or get first 3 customers.',
  false
),

(
  'Hatteland Technology',
  'https://www.hatteland.com',
  'Norway',
  'AV, control rooms and workplace technology',
  'Hatteland provides ruggedized display systems, computers and integration solutions for maritime, industrial and defense control rooms. Premium B2B hardware with long lifecycle and global service network.',
  'Private',
  'unknown',
  '€50M–€200M',
  '200–500',
  'Research',
  'Contact Identified',
  'B',
  'Send LinkedIn message to CEO',
  'Send LinkedIn request',
  (current_date + interval '2 days')::date,
  3.8, 3.5, 3.2, 3.6,
  '{"asset_intensity": 4, "customer_upfront_investment": 4, "technical_complexity": 4, "service_support_potential": 4, "software_data_monitoring_potential": 4, "standardization_potential": 4, "residual_value_redeployment": 3, "recurring_revenue_ambition": 3, "growth_trigger": 3, "decision_maker_access": 3, "commercial_value_to_shma": 3}',
  'Solid SHMA candidate. Ruggedized hardware with long lifecycles and global service operations. Control room as a managed service could be compelling. Private company — decision-maker should be accessible.',
  'Rugged hardware for control rooms. Global service network. Premium B2B. Could position as Control-Room-as-a-Service or Display-Lifecycle-Service.',
  false
)
on conflict do nothing;
