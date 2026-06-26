'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MessageSquare, CheckCircle2, AlertTriangle, Users, Sparkles, ThumbsUp, Send, ChevronDown, ChevronUp } from 'lucide-react'

const STYLES = [
  {
    key: 'executive_short_form',
    label: 'Executive short-form',
    badge: 'CEO · MD',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    description: 'Ultra-concise. CEO-to-CEO. One idea per sentence. Max 5 lines. No softening language.',
    whenToUse: 'CEO or MD with no prior contact. Time-poor executive. Use when you have a sharp single insight about their business.',
    avoid: 'Do not use for CFOs, board members, or anyone who needs context before they engage.',
    example: '"[First name] — SHMA works with industrial businesses moving from one-time sales to recurring service revenue. We\'ve seen [company type like theirs] reach 30–40% of turnover from services within 3 years. Worth a 20-minute call?"',
  },
  {
    key: 'clevel_strategic',
    label: 'C-level strategic note',
    badge: 'C-suite',
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    description: 'Peer-to-peer tone. References market dynamics or a specific strategic shift. Positions SHMA as a thoughtful partner, not a cold caller.',
    whenToUse: 'Senior leaders who are publicly active — speaking at conferences, posting on LinkedIn, or mentioned in press releases. Reference something specific.',
    avoid: 'Avoid generic "I noticed you\'re in the X industry" openers. The reference must be real and specific.',
    example: '"[First name] — saw you speaking at [event] on servitization. Your point about customer retention resonated — that\'s exactly the transition we help businesses architect. Happy to share what we\'re seeing across the Nordic market."',
  },
  {
    key: 'cfo_funding_angle',
    label: 'CFO / funding angle',
    badge: 'CFO · PE-backed',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Leads with capital structure or funding context. SHMA as a capital solution. Relevant when target is PE-backed or exploring liquidity.',
    whenToUse: 'CFOs, or any company that is PE-backed, has recently raised, or where recurring revenue transformation is a value-creation story.',
    avoid: 'Not suitable as a first touchpoint for owner-managed businesses where the owner is emotionally attached to the company.',
    example: '"[First name] — PE-backed businesses in your segment are increasingly being valued on recurring revenue multiples, not EBITDA alone. SHMA helps map the financial path from one-time sales to contracted service revenue. Could be relevant given your current ownership structure."',
  },
  {
    key: 'founder_owner_direct',
    label: 'Founder / owner — direct',
    badge: 'Founder · Owner',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Founder-to-founder register. Acknowledges what they built. Straight to the point about what SHMA can do for them personally.',
    whenToUse: 'Owner-founders, family business owners, entrepreneurs who built the business from scratch. Respect comes before a pitch.',
    avoid: 'Do not use for corporate executives or anyone in a hired-leadership role.',
    example: '"[First name] — you\'ve built [company] into something substantial. The shift to service-based revenue is often the next chapter for businesses like yours — creating recurring income without losing control of the core. SHMA advises on exactly that transition."',
  },
  {
    key: 'operational_credibility',
    label: 'Operational credibility',
    badge: 'Ops · Service head',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    description: 'Leads with sector expertise and operational understanding. For contacts who need to trust you know the business before engaging.',
    whenToUse: 'Heads of Service, Operations, or Product. People who are sceptical of consultants and need to know you understand the operational reality.',
    avoid: 'Too detailed for a short LinkedIn message. Better suited to email where you have more space.',
    example: '"[First name] — the challenge of building a scalable field service model while maintaining margin is one we know well. SHMA has worked with several [segment] businesses to redesign their service delivery architecture. Happy to share what we\'ve seen work."',
  },
  {
    key: 'warm_referral_light',
    label: 'Warm referral (light touch)',
    badge: 'Intro available',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    description: 'Mentions the connection briefly. Conversational. Does not lean on the referral too hard. Natural, not transactional.',
    whenToUse: 'When a warm intro contact is available and has agreed to be referenced, or where the mutual connection has been confirmed.',
    avoid: 'Never claim a warm intro without explicit agreement from the mutual contact. Do not use the referral as the entire reason for reaching out.',
    example: '"[First name] — [name] suggested we connect. I work with SH Management on As-a-Service growth strategies — we\'ve been doing some relevant work in your space. Might be worth a brief call to see if there\'s a fit."',
  },
  {
    key: 'board_chairman',
    label: 'Board / chairman',
    badge: 'Board · NED · Chair',
    badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-600/40',
    description: 'Governance-aware. Respectful of their oversight role. Frames SHMA as alignment-conscious, not disruptive. For non-executive directors.',
    whenToUse: 'Chairs, NEDs, board members. Focus on strategic oversight and long-term value, not short-term operational wins.',
    avoid: 'Board members are not operational decision-makers — do not use operational language or ask for quick decisions.',
    example: '"[First name] — the shift toward service revenue is increasingly part of the value creation narrative in board strategy discussions. SHMA advises on structuring that transition in a way that is both commercially sound and board-level defensible. Would value a brief exchange of perspectives."',
  },
  {
    key: 're_engagement',
    label: 'Re-engagement',
    badge: 'Prior contact',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'References prior interaction. Acknowledges time passed. New angle or development at SHMA to justify reconnecting. No apology for the gap.',
    whenToUse: 'Companies or contacts previously in the pipeline with whom momentum was lost. Use when there is a genuine new angle — do not re-engage without one.',
    avoid: 'Do not apologise for not being in touch. Do not reference the gap unless it is very brief. A new angle is non-negotiable.',
    example: '"[First name] — we spoke earlier this year about As-a-Service revenue architecture. Since then, we\'ve built out a structured methodology specifically for [segment] businesses. Given what\'s happened in the market, the timing might be better now."',
  },
]

const PROCESS_STEPS = [
  {
    step: 1,
    title: 'Company enters Qualified Targets',
    description: 'After Contact Research, companies are automatically moved to the Customer Kanban at the Qualified Targets stage. Contacts have been identified and scored.',
    icon: <Users className="w-4 h-4" />,
  },
  {
    step: 2,
    title: 'Select the right contact',
    description: 'Open the company card → Relationships. Review suggested contacts. Validate the contact before outreach — confirm role, LinkedIn, and that they are the right entry point.',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    step: 3,
    title: 'Choose the right style',
    description: 'Match the style to the contact\'s role and what you know about them. If a warm intro is available, it will be flagged — use the Warm Referral style. Check the playbook if unsure.',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    step: 4,
    title: 'Generate and review',
    description: 'Use the AI draft as a starting point — not a finished message. Always read it aloud before sending. Personalise the first line. Adjust for tone. Remove anything that sounds generic.',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    step: 5,
    title: 'Approve before sending',
    description: 'Every message requires approval before it can be marked as sent. If you are Sofie or Henrik: write the message, then submit for review. Stian approves before it goes.',
    icon: <ThumbsUp className="w-4 h-4" />,
  },
  {
    step: 6,
    title: 'Log the send',
    description: 'Mark the message as Sent in the system. This triggers the company to move forward in the Kanban and logs the outreach in the activity timeline.',
    icon: <Send className="w-4 h-4" />,
  },
]

const DO_LIST = [
  'Always personalise the first sentence — reference something specific about the company or contact',
  'Match the style to the contact\'s role, not just the company type',
  'Use the AI draft as a starting point. Edit before sending.',
  'If a warm intro is available, always lead with it',
  'Submit for approval before marking as sent',
  'Log all sends in the system — including manual sends made outside the tool',
  'If rejected or no reply after 14 days, move the message to "Needs rewrite" and try a new angle',
]

const DONT_LIST = [
  'Never send a message that has not been approved',
  'Never invent a warm intro that has not been confirmed by the mutual contact',
  'Do not use email templates without editing them — they must feel personal',
  'Do not send outreach to companies flagged as Sensitive without Stian\'s explicit sign-off',
  'Never contact a Do Not Contact company under any circumstances',
  'Do not follow up more than twice without discussing with Stian first',
  'Do not use the "Operational credibility" style on a short LinkedIn message — it reads as a wall of text',
]

export function OutreachPlaybookClient() {
  const [activeStyle, setActiveStyle] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    process: true,
    styles: true,
    rules: true,
  })

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))

  const toggleStyle = (key: string) =>
    setActiveStyle(prev => prev === key ? null : key)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

      {/* Intro */}
      <div className="bg-gradient-to-r from-cyan-500/5 to-transparent border border-cyan-500/15 rounded-xl p-5">
        <h2 className="text-base font-semibold text-slate-200 mb-1">SHMA Outreach Playbook</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          This playbook covers how SHMA approaches outreach to target companies — the message styles,
          the process, and the rules. Every message starts with AI, but every message ends with a human judgment call.
          The goal is senior, focused, respectful outreach that opens a real conversation.
        </p>
      </div>

      {/* Process */}
      <section>
        <button
          onClick={() => toggleSection('process')}
          className="flex items-center justify-between w-full text-left mb-4"
        >
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Outreach process</h2>
          {expandedSections.process ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </button>
        {expandedSections.process && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROCESS_STEPS.map(step => (
              <div key={step.step} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 w-5">{step.step}</span>
                  <span className="text-slate-400">{step.icon}</span>
                  <span className="text-sm font-medium text-slate-200">{step.title}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-7">{step.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Styles */}
      <section>
        <button
          onClick={() => toggleSection('styles')}
          className="flex items-center justify-between w-full text-left mb-4"
        >
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Message styles</h2>
          {expandedSections.styles ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </button>
        {expandedSections.styles && (
          <div className="space-y-2">
            {STYLES.map(style => (
              <div
                key={style.key}
                className={cn(
                  'border rounded-xl overflow-hidden transition-colors',
                  activeStyle === style.key
                    ? 'border-cyan-500/30 bg-slate-800/80'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                )}
              >
                <button
                  onClick={() => toggleStyle(style.key)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap', style.badgeColor)}>
                    {style.badge}
                  </span>
                  <span className="text-sm font-medium text-slate-200 flex-1">{style.label}</span>
                  <span className="text-xs text-slate-600 hidden sm:block max-w-xs truncate">{style.description}</span>
                  {activeStyle === style.key
                    ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                </button>

                {activeStyle === style.key && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-700 pt-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Description</p>
                      <p className="text-sm text-slate-300">{style.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                        <p className="text-xs font-medium text-emerald-400 mb-1.5">When to use</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{style.whenToUse}</p>
                      </div>
                      <div className="bg-rose-500/5 border border-rose-500/15 rounded-lg p-3">
                        <p className="text-xs font-medium text-rose-400 mb-1.5">Avoid</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{style.avoid}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">Example opener</p>
                      <p className="text-xs text-slate-400 italic leading-relaxed">{style.example}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rules */}
      <section>
        <button
          onClick={() => toggleSection('rules')}
          className="flex items-center justify-between w-full text-left mb-4"
        >
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Rules of engagement</h2>
          {expandedSections.rules ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </button>
        {expandedSections.rules && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Do
              </h3>
              <ul className="space-y-2">
                {DO_LIST.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-emerald-600 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Do not
              </h3>
              <ul className="space-y-2">
                {DONT_LIST.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-rose-600 mt-0.5 flex-shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
