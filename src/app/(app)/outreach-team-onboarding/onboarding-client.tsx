'use client'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  BookOpen, Users, MessageSquare, Target, Sparkles, CheckCircle2,
  ArrowRight, ChevronDown, ChevronUp, Building2, List, Search,
} from 'lucide-react'

type Section = 'welcome' | 'what_is_aaas' | 'the_pipeline' | 'your_role' | 'daily_workflow' | 'key_rules' | 'links'

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'welcome', label: 'Welcome', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'what_is_aaas', label: 'What is AaaS?', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'the_pipeline', label: 'The pipeline', icon: <List className="w-3.5 h-3.5" /> },
  { id: 'your_role', label: 'Your role', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'daily_workflow', label: 'Daily workflow', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'key_rules', label: 'Key rules', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { id: 'links', label: 'Quick links', icon: <ArrowRight className="w-3.5 h-3.5" /> },
]

const PIPELINE_STAGES = [
  {
    stage: 'Longlist',
    color: 'bg-slate-700 text-slate-300',
    who: 'AI / Import',
    description: 'Thousands of companies identified via AI or imported from Excel. Not yet scored or validated.',
  },
  {
    stage: 'AI Scored',
    color: 'bg-sky-500/15 text-sky-400',
    who: 'AI (Haiku)',
    description: 'Each company receives an SHMA Fit Score based on segment, business model, and growth indicators.',
  },
  {
    stage: 'Selection',
    color: 'bg-violet-500/15 text-violet-400',
    who: 'Stian',
    description: 'Top-scoring companies are selected for deeper research. Criteria: score, country, segment, max batch size.',
  },
  {
    stage: 'Deep Research',
    color: 'bg-amber-500/15 text-amber-400',
    who: 'AI (Sonnet)',
    description: 'Full AI research brief per company: servitization hypothesis, strategic angle, decision-maker landscape.',
  },
  {
    stage: 'Human Review',
    color: 'bg-orange-500/15 text-orange-400',
    who: 'Stian',
    description: 'Review workshop: approve, reject, or flag for discussion. Creates the Contact Research list.',
  },
  {
    stage: 'Contact Research',
    color: 'bg-cyan-500/15 text-cyan-400',
    who: 'AI (Sonnet)',
    description: 'AI identifies key decision-makers, board members, and ownership structure for each company.',
  },
  {
    stage: 'Qualified Targets',
    color: 'bg-emerald-500/15 text-emerald-400',
    who: 'You',
    description: 'Companies arrive here in the Customer Kanban. Contacts are identified. Outreach can begin.',
  },
  {
    stage: 'Engaged',
    color: 'bg-lime-500/15 text-lime-400',
    who: 'You + Stian',
    description: 'Live dialogue with the company. First meeting booked or confirmed interest expressed.',
  },
]

const QUICK_LINKS = [
  { label: 'Outreach Playbook', href: '/outreach-playbook', description: '8 message styles with when-to-use guidance', icon: <MessageSquare className="w-4 h-4" /> },
  { label: 'Customer Kanban', href: '/pipeline', description: 'All active companies in the outreach pipeline', icon: <Target className="w-4 h-4" /> },
  { label: 'All Companies', href: '/companies', description: 'Full searchable company database', icon: <Building2 className="w-4 h-4" /> },
  { label: 'List Process View', href: '/bulk-lists', description: 'Bulk lists from Longlist through to Contact Research', icon: <List className="w-4 h-4" /> },
  { label: 'Contacts', href: '/contacts', description: 'All contacts across all companies', icon: <Users className="w-4 h-4" /> },
  { label: 'AI Run Monitor', href: '/ai-runs', description: 'Track AI processes and costs', icon: <Sparkles className="w-4 h-4" /> },
]

function SectionBlock({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-slate-700 pt-4">{children}</div>}
    </div>
  )
}

export function OnboardingClient() {
  const [activeSection, setActiveSection] = useState<Section>('welcome')

  return (
    <div className="flex h-full">
      {/* Sidebar nav */}
      <div className="w-48 flex-shrink-0 border-r border-slate-800 p-3 space-y-0.5 hidden sm:block">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors',
              activeSection === item.id
                ? 'bg-cyan-500/10 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6 max-w-2xl space-y-5">

        {activeSection === 'welcome' && (
          <>
            <div className="bg-gradient-to-r from-cyan-500/5 to-transparent border border-cyan-500/15 rounded-xl p-5">
              <h1 className="text-lg font-bold text-slate-100 mb-2">Welcome to the SHMA Growth Engine</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                This is the system SHMA uses to identify, research, qualify, and engage
                industrial companies that are candidates for an As-a-Service transformation.
                Your role as an outreach team member is to turn qualified targets into real conversations.
              </p>
            </div>
            <SectionBlock title="What you need to know first">
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> SHMA is an advisor. We do not manage money or make investments — we help companies design and execute service revenue growth.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Companies come to you already researched. AI has done the heavy lifting — you focus on the human conversation.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Every outreach message must be approved before it is sent. Stian reviews and approves.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Your job is not to sell. It is to open a conversation. One meeting booked is a win.</li>
              </ul>
            </SectionBlock>
          </>
        )}

        {activeSection === 'what_is_aaas' && (
          <>
            <SectionBlock title="As-a-Service (AaaS) — what it means">
              <p className="text-sm text-slate-400 leading-relaxed">
                Traditional industrial businesses sell products once. As-a-Service companies sell outcomes or access on a recurring basis — think "lighting as a service" instead of selling light fittings, or "compressed air as a service" instead of selling compressors.
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                The shift to AaaS typically means higher customer retention, recurring revenue, and better company valuations. But it requires redesigning the business model — which is where SHMA comes in.
              </p>
            </SectionBlock>
            <SectionBlock title="Why companies do it">
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Improve valuation multiples (recurring revenue is valued at 3–5× one-time revenue)</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Stabilise cash flow and reduce revenue volatility</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Lock in customers and reduce churn</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Capture more lifetime value from the installed base</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Differentiate from product competitors</li>
              </ul>
            </SectionBlock>
            <SectionBlock title="What SHMA offers">
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Strategic assessment: is this company ready for AaaS?</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Model design: what does their AaaS offer look like?</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Commercial architecture: pricing, contracts, go-to-market</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 flex-shrink-0">→</span> Execution support: running pilots, building the service team, tracking KPIs</li>
              </ul>
            </SectionBlock>
          </>
        )}

        {activeSection === 'the_pipeline' && (
          <>
            <p className="text-sm text-slate-500">Companies move through stages. You engage them once they reach Qualified Targets.</p>
            <div className="space-y-2">
              {PIPELINE_STAGES.map((stage, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-800/40 border border-slate-700 rounded-xl p-3">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mt-0.5', stage.color)}>
                    {stage.stage}
                  </span>
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Handled by: {stage.who} · </span>
                    <span className="text-xs text-slate-400">{stage.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeSection === 'your_role' && (
          <>
            <SectionBlock title="What you do">
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Review companies that arrive in Qualified Targets in the Customer Kanban</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Read the AI research brief to understand the company and the opportunity</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Validate the suggested contacts — is this the right person?</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Choose the right message style from the playbook</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Generate an AI draft, personalise it, submit for approval</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Send once approved, log the send in the system</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> Track replies and update company status in the Kanban</li>
              </ul>
            </SectionBlock>
            <SectionBlock title="What Stian does">
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="text-slate-600">→</span> Approves outreach messages before they are sent</li>
                <li className="flex items-start gap-2"><span className="text-slate-600">→</span> Runs the Human Review workshop (decides which companies move forward)</li>
                <li className="flex items-start gap-2"><span className="text-slate-600">→</span> Handles sensitive companies and Do Not Contact decisions</li>
                <li className="flex items-start gap-2"><span className="text-slate-600">→</span> Joins meetings once a company is Engaged</li>
                <li className="flex items-start gap-2"><span className="text-slate-600">→</span> Manages the Origination tab and deal economics</li>
              </ul>
            </SectionBlock>
          </>
        )}

        {activeSection === 'daily_workflow' && (
          <SectionBlock title="Suggested daily workflow">
            <ol className="space-y-4">
              {[
                { n: 1, title: 'Check Qualified Targets', detail: 'Open /pipeline and look at the Qualified Targets column. Are there new companies that need outreach? Prioritise by SHMA score and contact readiness.' },
                { n: 2, title: 'Open the company card', detail: 'Read the AI Research Brief under Qualification. Understand the opportunity before writing anything. Check the Relationships tab for suggested contacts.' },
                { n: 3, title: 'Draft and personalise', detail: 'Use the outreach generator in Activity & Outreach. Select a style. Generate. Edit the first line to make it feel human. Read it aloud.' },
                { n: 4, title: 'Submit for approval', detail: 'The message status will be "Needs review". Stian will see it and approve or request a rewrite.' },
                { n: 5, title: 'Send and log', detail: 'Once approved, send via LinkedIn or email. Click "Mark Sent" in the system to log it and advance the Kanban stage.' },
                { n: 6, title: 'Track replies', detail: 'Check for responses daily. If a reply comes in, update the message status and move the company to Engaged in the Kanban. Log a note.' },
              ].map(step => (
                <li key={step.n} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-300">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionBlock>
        )}

        {activeSection === 'key_rules' && (
          <>
            <SectionBlock title="Non-negotiable rules">
              <ul className="space-y-3">
                {[
                  'Every message must be approved before it is sent — no exceptions.',
                  'Never contact a company flagged as Do Not Contact.',
                  'Sensitive companies require explicit sign-off from Stian before any outreach.',
                  'Never claim a warm intro without confirmation from the mutual contact.',
                  'Log all sends in the system — including messages sent manually outside the tool.',
                  'If you are unsure whether to contact a company, ask Stian first.',
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-rose-500 font-bold flex-shrink-0 mt-0.5">!</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </SectionBlock>
            <SectionBlock title="Good habits">
              <ul className="space-y-3">
                {[
                  'Read the AI research brief before writing anything — it gives you angles you would not otherwise have.',
                  'Always personalise the first sentence. The rest can be structured, but the opener must feel human.',
                  'Match the style to the contact\'s role, not just the company type.',
                  'If you get no reply after 14 days, try a new angle — not the same message again.',
                  'If a company moves to a competitor or announces news, use it as a re-engagement trigger.',
                ].map((habit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {habit}
                  </li>
                ))}
              </ul>
            </SectionBlock>
          </>
        )}

        {activeSection === 'links' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-cyan-500/30 hover:bg-slate-800 transition-colors"
              >
                <span className="text-cyan-400 mt-0.5">{link.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{link.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{link.description}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 ml-auto flex-shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
