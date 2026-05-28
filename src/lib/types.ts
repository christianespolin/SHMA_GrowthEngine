export type Priority = 'A' | 'B' | 'C' | 'Nurture' | 'Disqualified' | 'Unknown'

export type PipelineStage =
  | 'Longlist'
  | 'AI Researched'
  | 'Human Review'
  | 'Qualified Target'
  | 'Contact Identified'
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
  'Longlist',
  'AI Researched',
  'Human Review',
  'Qualified Target',
  'Contact Identified',
  'Warm Intro / Outreach Ready',
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
  'Founder-owned',
  'Family-owned',
  'PE-owned',
  'Investor-backed',
  'Listed',
  'Corporate-owned',
  'Unknown',
  'Any',
] as const

export const STRATEGIC_TRIGGERS = [
  'Wants recurring revenue',
  'Needs growth',
  'Margin pressure',
  'Customer CapEx friction',
  'Complex sales cycles',
  'Strong installed base',
  'Service revenue opportunity',
  'Financing could unlock sales',
  'Needs differentiation',
  'International expansion',
  'Board / PE value creation pressure',
  'Other',
] as const

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
