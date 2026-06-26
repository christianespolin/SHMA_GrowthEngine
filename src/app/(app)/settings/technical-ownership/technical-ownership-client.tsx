'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

type CheckStatus = 'ok' | 'attention' | 'todo'

interface CheckItem {
  id: string
  title: string
  description: string
  status: CheckStatus
  owner: string
  cadence: string
  link?: string
  linkLabel?: string
}

type Category = {
  id: string
  title: string
  description: string
  items: CheckItem[]
}

const CATEGORIES: Category[] = [
  {
    id: 'supabase',
    title: 'Supabase / Database',
    description: 'Database health, migrations, and backups',
    items: [
      {
        id: 'db_backups',
        title: 'Automatic backups enabled',
        description: 'Supabase Pro plans include daily automated backups with point-in-time recovery. Verify backups are running and test restoration quarterly.',
        status: 'ok',
        owner: 'Stian',
        cadence: 'Quarterly review',
        link: 'https://supabase.com/dashboard/project/_/database/backups',
        linkLabel: 'Supabase Backups',
      },
      {
        id: 'rls_policies',
        title: 'Row Level Security policies active',
        description: 'All tables use RLS with authenticated-user policies. Review if new tables are added without RLS — this is a critical security requirement.',
        status: 'ok',
        owner: 'Developer',
        cadence: 'Per migration',
      },
      {
        id: 'migration_log',
        title: 'Migration log up to date',
        description: 'All schema changes should go through numbered migration files in /supabase/migrations/. Currently at 025_bulk_process_engine.sql.',
        status: 'ok',
        owner: 'Developer',
        cadence: 'Per change',
      },
      {
        id: 'db_size',
        title: 'Database size monitoring',
        description: 'Monitor DB size growth as AI research briefs, bulk lists, and ai_process_items accumulate. Archive old/completed bulk list data if approaching plan limits.',
        status: 'attention',
        owner: 'Stian',
        cadence: 'Monthly',
        link: 'https://supabase.com/dashboard/project/_/settings/billing',
        linkLabel: 'Supabase Billing',
      },
      {
        id: 'old_ai_runs',
        title: 'Prune old ai_process_items',
        description: 'ai_process_items stores per-company AI output JSON. Completed runs older than 6 months can be archived or deleted to keep the DB lean.',
        status: 'todo',
        owner: 'Developer',
        cadence: 'Bi-annual',
      },
    ],
  },
  {
    id: 'ai_costs',
    title: 'AI / Anthropic',
    description: 'API usage, cost tracking, and model governance',
    items: [
      {
        id: 'anthropic_budget',
        title: 'Monthly spend limit set in Anthropic console',
        description: 'Set a hard spend limit in the Anthropic console to prevent runaway AI runs from exceeding budget. Recommended: set a monthly alert at 70% of budget.',
        status: 'attention',
        owner: 'Stian',
        cadence: 'Monthly review',
        link: 'https://console.anthropic.com',
        linkLabel: 'Anthropic Console',
      },
      {
        id: 'model_versions',
        title: 'Model versions pinned correctly',
        description: 'Scoring uses claude-haiku-4-5-20251001. Research and outreach use claude-sonnet-4-6. Check if newer versions are available and assess upgrade impact.',
        status: 'ok',
        owner: 'Developer',
        cadence: 'Per quarter',
      },
      {
        id: 'cost_per_run',
        title: 'Review AI run costs in AI Run Monitor',
        description: 'After each major batch run, check /ai-runs for actual vs estimated cost. Calibrate estimated_cost_per_company values if actuals diverge by >20%.',
        status: 'ok',
        owner: 'Stian',
        cadence: 'Per batch run',
      },
      {
        id: 'api_key_rotation',
        title: 'API key rotation',
        description: 'The Anthropic API key is stored as ANTHROPIC_API_KEY in Vercel environment variables. Rotate it every 12 months or immediately if exposed.',
        status: 'todo',
        owner: 'Stian',
        cadence: 'Annual',
      },
    ],
  },
  {
    id: 'vercel',
    title: 'Vercel / Deployment',
    description: 'Hosting, deployments, and environment configuration',
    items: [
      {
        id: 'env_vars',
        title: 'Environment variables documented',
        description: 'ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY must be set in Vercel for all environments (Production, Preview, Development).',
        status: 'ok',
        owner: 'Developer',
        cadence: 'Per deployment',
      },
      {
        id: 'deploy_preview',
        title: 'Preview deployments enabled',
        description: 'Vercel auto-deploys PRs as preview URLs. Do not use production Supabase data in preview — use a separate preview Supabase project if testing schema changes.',
        status: 'ok',
        owner: 'Developer',
        cadence: 'Per PR',
      },
      {
        id: 'function_timeouts',
        title: 'AI batch API routes handle timeouts',
        description: 'Batch AI routes use client-side polling (BatchRunPanel) rather than long-running single requests. Vercel default timeout is 300s — individual batch calls should stay under 60s.',
        status: 'ok',
        owner: 'Developer',
        cadence: 'Per batch size change',
      },
    ],
  },
  {
    id: 'data_quality',
    title: 'Data Quality',
    description: 'Company data, contact hygiene, and list maintenance',
    items: [
      {
        id: 'duplicate_companies',
        title: 'Duplicate company check',
        description: 'When importing Longlists from Excel, the duplicate detection (via org_nr or name match) flags potential duplicates. Review and resolve flagged duplicates after each large import.',
        status: 'ok',
        owner: 'Stian',
        cadence: 'Per import',
      },
      {
        id: 'dnc_list',
        title: 'Do Not Contact list maintained',
        description: 'Companies flagged as Do Not Contact must be actively maintained. Review quarterly — some may have changed ownership or circumstances.',
        status: 'ok',
        owner: 'Stian',
        cadence: 'Quarterly',
      },
      {
        id: 'contact_validation',
        title: 'AI-suggested contacts validated',
        description: 'Contact Research inserts contacts with status "Suggested". Before outreach, contacts should be validated (LinkedIn confirmed, role confirmed). Validate before marking Contacted.',
        status: 'attention',
        owner: 'Sofie / Henrik',
        cadence: 'Before each outreach',
      },
      {
        id: 'archived_lists',
        title: 'Archive completed bulk lists',
        description: 'After companies are converted to Customer Kanban, move the bulk list to Archived category to keep the List Process View clean.',
        status: 'todo',
        owner: 'Stian',
        cadence: 'After each pipeline run',
      },
    ],
  },
  {
    id: 'access',
    title: 'Access & Security',
    description: 'User management, permissions, and security hygiene',
    items: [
      {
        id: 'user_list',
        title: 'User list reviewed',
        description: 'Review active users in Supabase Auth. Remove access for anyone who is no longer at SHMA. Current users: Stian (admin), Sofie (outreach), Henrik (outreach).',
        status: 'ok',
        owner: 'Stian',
        cadence: 'Quarterly',
        link: 'https://supabase.com/dashboard/project/_/auth/users',
        linkLabel: 'Supabase Users',
      },
      {
        id: 'role_permissions',
        title: 'Role permissions aligned to access model',
        description: 'Profiles table has role field: admin / principal / outreach / viewer. Outreach team members should be on "outreach" role. Review if roles are enforced in UI where needed.',
        status: 'ok',
        owner: 'Developer',
        cadence: 'Per new user',
      },
      {
        id: 'supabase_service_role',
        title: 'Service role key access restricted',
        description: 'SUPABASE_SERVICE_ROLE_KEY bypasses RLS. It should only be used server-side in API routes — never exposed to the client. Verify it is not set as NEXT_PUBLIC_.',
        status: 'ok',
        owner: 'Developer',
        cadence: 'Per audit',
      },
    ],
  },
]

const STATUS_CONFIG: Record<CheckStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ok: {
    label: 'OK',
    color: 'text-emerald-400',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
  attention: {
    label: 'Needs attention',
    color: 'text-amber-400',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  },
  todo: {
    label: 'To do',
    color: 'text-slate-500',
    icon: <Circle className="w-4 h-4 text-slate-600" />,
  },
}

export function TechnicalOwnershipClient() {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map(c => [c.id, true]))
  )
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [localStatuses, setLocalStatuses] = useState<Record<string, CheckStatus>>({})

  const toggleCategory = (id: string) =>
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }))

  const toggleItem = (id: string) =>
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))

  const cycleStatus = (item: CheckItem) => {
    const current = localStatuses[item.id] ?? item.status
    const next: CheckStatus = current === 'ok' ? 'todo' : current === 'todo' ? 'attention' : 'ok'
    setLocalStatuses(prev => ({ ...prev, [item.id]: next }))
  }

  const totalItems = CATEGORIES.flatMap(c => c.items).length
  const okCount = CATEGORIES.flatMap(c => c.items).filter(i => (localStatuses[i.id] ?? i.status) === 'ok').length
  const attentionCount = CATEGORIES.flatMap(c => c.items).filter(i => (localStatuses[i.id] ?? i.status) === 'attention').length

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{okCount}</div>
          <div className="text-xs text-slate-500 mt-1">OK</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{attentionCount}</div>
          <div className="text-xs text-slate-500 mt-1">Needs attention</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-slate-400">{totalItems - okCount - attentionCount}</div>
          <div className="text-xs text-slate-500 mt-1">To do</div>
        </div>
      </div>

      <p className="text-xs text-slate-600">Click the status icon on any item to update it. Changes are session-only — this is a reference checklist, not a task tracker.</p>

      {CATEGORIES.map(category => (
        <section key={category.id}>
          <button
            onClick={() => toggleCategory(category.id)}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <div>
              <h2 className="text-sm font-semibold text-slate-200">{category.title}</h2>
              <p className="text-xs text-slate-600 mt-0.5">{category.description}</p>
            </div>
            {expandedCategories[category.id]
              ? <ChevronUp className="w-4 h-4 text-slate-600 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0" />}
          </button>

          {expandedCategories[category.id] && (
            <div className="space-y-2">
              {category.items.map(item => {
                const status = localStatuses[item.id] ?? item.status
                const cfg = STATUS_CONFIG[status]
                const open = expandedItems[item.id]

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'border rounded-xl overflow-hidden transition-colors',
                      status === 'attention' ? 'border-amber-500/20' :
                      status === 'ok' ? 'border-slate-700' : 'border-slate-700',
                      'bg-slate-800/30'
                    )}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => cycleStatus(item)}
                        className="flex-shrink-0"
                        title="Click to change status"
                      >
                        {cfg.icon}
                      </button>
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex-1 flex items-center justify-between text-left min-w-0"
                      >
                        <span className="text-sm text-slate-200 truncate">{item.title}</span>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className={cn('text-xs font-medium hidden sm:block', cfg.color)}>{cfg.label}</span>
                          <span className="text-xs text-slate-600 hidden md:block">{item.cadence}</span>
                          <span className="text-xs text-slate-700 hidden md:block">{item.owner}</span>
                          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                        </div>
                      </button>
                    </div>

                    {open && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-700 space-y-2">
                        <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>Owner: <span className="text-slate-500">{item.owner}</span></span>
                          <span>Cadence: <span className="text-slate-500">{item.cadence}</span></span>
                        </div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                          >
                            {item.linkLabel || item.link}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
