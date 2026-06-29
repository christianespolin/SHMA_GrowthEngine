export type Priority = 'A' | 'B' | 'C' | 'Nurture' | 'Disqualified' | 'Unknown'

// ============================================================
// BULK / LIST PROCESS categories (pre-Kanban pipeline)
// ============================================================
export type BulkListCategory =
  | 'Longlist'
  | 'AI Researched'
  | 'AI Researched, Pending'
  | 'AI Researched, Not Interesting'
  | 'Ready for AI Deep Research'
  | 'Ready for Human Review'
  | 'Ready for Contact Research'
  | 'Converted to Customer Kanban'
  | 'Archived'

export const BULK_LIST_CATEGORIES: BulkListCategory[] = [
  'Longlist',
  'AI Researched',
  'AI Researched, Pending',
  'AI Researched, Not Interesting',
  'Ready for AI Deep Research',
  'Ready for Human Review',
  'Ready for Contact Research',
  'Converted to Customer Kanban',
  'Archived',
]

export type HumanReviewStatus =
  | 'Not reviewed'
  | 'Approved'
  | 'Rejected'
  | 'Needs discussion'
  | 'Keep for later'
  | 'Sensitive'
  | 'Do not contact'

export const HUMAN_REVIEW_STATUSES: HumanReviewStatus[] = [
  'Not reviewed', 'Approved', 'Rejected',
  'Needs discussion', 'Keep for later', 'Sensitive', 'Do not contact',
]

export type AIProcessType =
  | 'SHMA Scoring'
  | 'Deep Research'
  | 'Contact Research'
  | 'Outreach Drafting'
  | 'Criteria Structuring'

export type AIProcessStatus =
  | 'Queued' | 'Running' | 'Completed'
  | 'Failed' | 'Cancelled' | 'Partially completed'

// ============================================================
// CUSTOMER KANBAN stages (post-Contact Research)
// ============================================================
export type CustomerKanbanStage =
  | 'Qualified Targets'
  | 'Partner / Warm Intro Review'
  | 'Contact Identified'
  | 'Outreach Ready'
  | 'Outreach Sent'
  | 'Engaged'
  | 'Meeting Booked'
  | 'Discovery Completed'
  | 'Proposal / Agreement'
  | 'Signed'
  | 'Onboarding'
  | 'Nurture'
  | 'Disqualified'

export const CUSTOMER_KANBAN_STAGES: CustomerKanbanStage[] = [
  'Qualified Targets',
  'Partner / Warm Intro Review',
  'Contact Identified',
  'Outreach Ready',
  'Outreach Sent',
  'Engaged',
  'Meeting Booked',
  'Discovery Completed',
  'Proposal / Agreement',
  'Signed',
  'Onboarding',
  'Nurture',
  'Disqualified',
]

export type RouteToMarket =
  | 'Warm intro via partner'
  | 'Chetwode / Simon route'
  | 'Board / shareholder route'
  | 'Existing SHMA network'
  | 'Sofie / Henrik outreach'
  | 'Founder / CEO direct'
  | 'CFO / funding angle'
  | 'Service / aftermarket angle'
  | 'Nurture'
  | 'Unknown'

export const ROUTE_TO_MARKET_OPTIONS: RouteToMarket[] = [
  'Warm intro via partner',
  'Chetwode / Simon route',
  'Board / shareholder route',
  'Existing SHMA network',
  'Sofie / Henrik outreach',
  'Founder / CEO direct',
  'CFO / funding angle',
  'Service / aftermarket angle',
  'Nurture',
  'Unknown',
]

export const ROUTE_TO_MARKET_COLORS: Record<RouteToMarket, string> = {
  'Warm intro via partner':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'Chetwode / Simon route':     'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'Board / shareholder route':  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'Existing SHMA network':      'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  'Sofie / Henrik outreach':    'bg-sky-500/15 text-sky-400 border-sky-500/25',
  'Founder / CEO direct':       'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'CFO / funding angle':        'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'Service / aftermarket angle':'bg-teal-500/15 text-teal-400 border-teal-500/25',
  'Nurture':                    'bg-slate-600/50 text-slate-400 border-slate-600/50',
  'Unknown':                    'bg-slate-700/50 text-slate-500 border-slate-700/50',
}

// Legacy combined stage type (kept for backward compat with existing company cards)
export type PipelineStage =
  | 'Longlist'
  | 'AI Researched'
  | 'Human Review'
  | 'Qualified Target'
  | 'Qualified Targets'
  | 'Partner / Warm Intro Review'
  | 'Contact Identified'
  | 'Outreach Ready'
  | 'Warm Intro / Outreach Ready'
  | 'Outreach Sent'
  | 'Engaged'
  | 'Meeting Booked'
  | 'Discovery Completed'
  | 'Proposal / Agreement'
  | 'Signed'
  | 'Onboarding'
  | 'Nurture'
  | 'Disqualified'

export const PIPELINE_STAGES: PipelineStage[] = [
  'Qualified Targets',
  'Partner / Warm Intro Review',
  'Contact Identified',
  'Outreach Ready',
  'Outreach Sent',
  'Engaged',
  'Meeting Booked',
  'Discovery Completed',
  'Proposal / Agreement',
  'Signed',
  'Onboarding',
  'Nurture',
  'Disqualified',
]

export const SEGMENTS = [
  'Warehouse automation & intralogistics',
  'Robotics & industrial automation',
  'Industrial technology & machinery',
  'Maritime, offshore & subsea',
  'Energy, charging & building technology',
  'Medtech & labtech',
  'AV, control rooms & workplace technology',
  'Other asset-heavy B2B technology',
] as const

export type Segment = (typeof SEGMENTS)[number]

export const CONTACT_ROLES = [
  'CEO',
  'CFO',
  'CCO',
  'Head of Strategy',
  'Head of Service',
  'Head of Product',
  'Board member',
  'PE owner',
  'Other',
] as const

export const NEXT_ACTION_TYPES = [
  'Research company',
  'Identify decision-maker',
  'Find warm intro',
  'Draft outreach',
  'Send LinkedIn request',
  'Send email',
  'Follow up',
  'Book meeting',
  'Prepare meeting',
  'Send proposal',
  'Follow up proposal',
  'Onboard client',
  'Disqualify',
  'Nurture',
] as const

export interface ScoreBreakdown {
  asset_intensity: number
  customer_upfront_investment: number
  technical_complexity: number
  service_support_potential: number
  software_data_monitoring_potential: number
  standardization_potential: number
  residual_value_redeployment: number
  recurring_revenue_ambition: number
  growth_trigger: number
  decision_maker_access: number
  commercial_value_to_shma: number
}

export interface Company {
  id: string
  name: string
  website: string | null
  country: string | null
  segment: string | null
  subsegment: string | null
  description: string | null
  ownership_type: string | null
  pe_owned: 'yes' | 'no' | 'unknown'
  estimated_size: string | null
  revenue_range: string | null
  employee_range: string | null
  geography: string | null
  lead_source: string | null
  relationship_owner: string | null
  internal_owner: string | null
  stage: PipelineStage
  priority: Priority
  next_action: string | null
  next_action_type: string | null
  next_action_date: string | null
  last_activity_date: string | null
  notes: string | null
  registration_number: string | null
  shma_fit_score: number | null
  opportunity_score: number | null
  closing_score: number | null
  overall_priority_score: number | null
  score_breakdown: ScoreBreakdown | null
  score_explanation: string | null
  score_confidence: string | null
  disqualification_reason: string | null
  disqualification_override: boolean
  disqualification_override_reason: string | null
  ai_researched: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  company_id: string
  name: string
  role: string | null
  email: string | null
  linkedin_url: string | null
  phone: string | null
  relationship_strength: 'strong' | 'medium' | 'weak' | 'unknown'
  contact_type: string | null
  decision_maker_relevance: 'high' | 'medium' | 'low' | 'unknown'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AIResearchBrief {
  id: string
  company_id: string
  company_snapshot: string | null
  what_they_sell: string | null
  who_they_sell_to: string | null
  likely_customer_pain: string | null
  possible_aaas_concept: string | null
  why_shma_relevant: string | null
  potential_business_model: string | null
  potential_financial_model: string | null
  potential_operational_model: string | null
  strategic_trigger: string | null
  suggested_entry_angle: string | null
  risks_and_uncertainties: string | null
  recommended_next_action: string | null
  confidence_level: string | null
  missing_information: string | null
  generated_at: string
  model_used: string | null
}

export interface OutreachMessage {
  id: string
  company_id: string
  contact_id: string | null
  message_type: 'linkedin' | 'email' | 'follow_up' | 'warm_intro' | 'meeting_invite' | 're_engagement'
  subject: string | null
  content: string
  tone: string | null
  status: 'draft' | 'sent' | 'archived'
  sent_at: string | null
  generated_at: string
  created_at: string
}

export interface Meeting {
  id: string
  company_id: string
  meeting_date: string
  participants: string | null
  objective: string | null
  notes: string | null
  transcript: string | null
  ai_summary: string | null
  decisions: string | null
  action_points: string | null
  follow_up_email: string | null
  next_step: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  company_id: string
  activity_type: string
  description: string
  old_value: string | null
  new_value: string | null
  user_id: string | null
  created_at: string
}

export interface DashboardStats {
  total_companies: number
  a_priority: number
  qualified_targets: number
  meetings_booked: number
  discovery_completed: number
  proposals_active: number
  signed_clients: number
  stale_leads: number
  avg_fit_score: number
  no_next_action: number
  overdue_next_action: number
}

// ============================================================
// DISCOVERY TYPES
// ============================================================

export interface DiscoveryCriteria {
  segments: string[]
  countries: string[]
  region: string
  min_revenue: string
  max_revenue: string
  min_employees: string
  max_employees: string
  size_notes: string
  ownership_types: string[]
  strategic_triggers: string[]
  asset_intensity_min: number
  technical_complexity_min: number
  customer_upfront_investment_min: number
  service_support_potential_min: number
  software_data_monitoring_min: number
  standardization_potential_min: number
  residual_value_min: number
  open_criteria: string
  seed_companies: string
  companies_to_avoid: string
  pasted_company_list: string
}

export interface DiscoveryScores {
  asset_intensity: number
  customer_upfront_investment: number
  technical_complexity: number
  service_support_potential: number
  software_data_monitoring_potential: number
  standardization_potential: number
  residual_value_redeployment_potential: number
  recurring_revenue_potential: number
  strategic_trigger_strength: number
  decision_maker_accessibility: number
  commercial_value_to_shma: number
}

export interface DiscoverySuggestion {
  company_name: string
  website?: string | null
  country?: string | null
  region?: string | null
  segment: string
  subsegment?: string | null
  description: string
  what_they_sell: string
  why_they_fit_shma: string
  possible_as_a_service_concept: string
  customer_capex_barrier: string
  service_support_potential: string
  software_data_monitoring_potential: string
  financing_logic: string
  strategic_trigger: string
  suggested_decision_makers: string[]
  outreach_angle: string
  scores: DiscoveryScores
  shma_fit_score: number
  opportunity_score: number
  confidence_score: number
  overall_priority: 'A-priority' | 'B-priority' | 'C-priority' | 'Nurture' | 'Needs validation' | 'Disqualified'
  confidence_level: 'High' | 'Medium' | 'Low'
  known_information: string[]
  ai_hypotheses: string[]
  missing_information: string[]
  validation_tasks: string[]
  ai_rationale: string
  recommendation: string
}

export type DiscoveryStatus = 'draft' | 'running' | 'completed' | 'failed' | 'archived'
export type SuggestionStatus = 'suggested' | 'accepted' | 'rejected' | 'saved_for_later' | 'needs_validation' | 'converted_to_lead'

export const DISCOVERY_SEGMENTS = [
  'Industrial technology and machinery',
  'Warehouse automation and intralogistics',
  'Robotics and automation',
  'Maritime, offshore and subsea',
  'Energy, charging, HVAC and building technology',
  'Medtech and labtech',
  'AV, control rooms and workplace technology',
  'PE-owned B2B companies',
  'Other',
] as const

export const OWNERSHIP_TYPES = [
  'PE-owned / investor-backed',
  'Founder-owned',
  'Family-owned',
  'Listed / public company',
  'Subsidiary / division',
  'Corporate spin-off',
  'Unknown',
] as const

export const STRATEGIC_TRIGGERS = [
  'PE-owned / investor-backed',
  'Board-driven growth mandate',
  'Founder transition',
  'Growth pressure',
  'Recurring revenue ambition',
  'Margin pressure',
  'International expansion',
  'Customer CapEx friction',
  'Service revenue opportunity',
  'Competitor pressure',
  'New leadership',
] as const

export const FINANCIAL_DATA_SOURCES = [
  'Manual entry',
  'Annual report (uploaded)',
  'Proff.no',
  'Brønnøysundregistrene',
  'Creditsafe',
  'Dun & Bradstreet',
  'Creditinfo',
  'Companies House',
  'AI-interpreted',
  'Other',
] as const

export const FEEDBACK_TYPES = [
  'Bug',
  'Improvement',
  'Wrong AI output',
  'Bad outreach',
  'Missing data',
  'Process issue',
  'Strategic suggestion',
  'Other',
] as const

// ============================================================
// CONTACT DISCOVERY TYPES
// ============================================================

export const ROLE_CATEGORIES = [
  'Executive sponsor',
  'Commercial / strategy',
  'Service / operations',
  'Product / technology',
  'Finance / ownership',
  'Other influencer',
] as const

export const CONTACT_GDPR_STATUSES = [
  'Not reviewed',
  'Legitimate interest reviewed',
  'Consent',
  'Do not contact',
  'Suppression',
] as const

export const CONTACT_STATUSES = [
  'Suggested',
  'Validated',
  'Contacted',
  'Responded',
  'Rejected',
  'Do not contact',
] as const

export const KNOWN_OR_HYPOTHESIS = [
  'Known contact',
  'Suggested role',
  'Hypothesis',
  'Needs validation',
] as const

export interface ContactSuggestion {
  full_name: string | null
  title: string | null
  role_category: string
  seniority: string | null
  department: string | null
  suggested_role_to_find: string | null
  email: string | null
  email_status: string
  phone: string | null
  phone_status: string
  mobile: string | null
  mobile_status: string
  linkedin_url: string | null
  linkedin_status: string
  source_type: string
  source_url: string | null
  known_or_hypothesis: string
  decision_power_score: number
  shma_relevance_score: number
  outreach_fit_score: number
  relationship_potential_score: number
  confidence_score: number
  ai_rationale: string
  outreach_angle: string
  missing_information: string[]
  validation_tasks: string[]
  recommended_next_action: string
}

export const REJECTION_REASONS = [
  'Not asset-heavy enough',
  'Too small',
  'Wrong industry',
  'Pure software',
  'Pure consulting',
  'Too little service potential',
  'Already known / duplicate',
  'Weak SHMA fit',
  'No strategic trigger',
  'Other',
] as const
