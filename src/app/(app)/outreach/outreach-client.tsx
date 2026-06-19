'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { cn, formatDateRelative } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import {
  MessageSquarePlus, Mail, Copy, CheckCircle2, RefreshCw,
  ExternalLink, ChevronDown, ChevronUp, Building2,
} from 'lucide-react'

interface Message {
  id: string
  company_id: string
  contact_id: string | null
  message_type: string
  subject: string | null
  content: string
  tone: string | null
  status: string
  sent_at: string | null
  created_at: string
  contact_name?: string | null
  contact_title?: string | null
  company: { id: string; name: string; website: string | null; pipeline_stage: string | null } | null
  contact: { id: string; first_name: string | null; last_name: string | null; title: string | null } | null
}

const STATUS_VARIANTS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  sent: 'info',
  replied: 'success',
  archived: 'default',
}

const TYPE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  email: 'Email',
  follow_up: 'Follow-up',
  warm_intro: 'Warm intro',
  meeting_invite: 'Meeting invite',
  re_engagement: 'Re-engagement',
}

function ChannelIcon({ type }: { type: string }) {
  if (type === 'linkedin') return <span className="text-xs font-bold text-blue-400">in</span>
  return <Mail className="w-3.5 h-3.5 text-slate-400" />
}

function MessageCard({ msg, onStatusChange }: {
  msg: Message
  onStatusChange: (id: string, status: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const contactName = msg.contact
    ? [msg.contact.first_name, msg.contact.last_name].filter(Boolean).join(' ')
    : msg.contact_name || null

  const copy = async () => {
    await navigator.clipboard.writeText([msg.subject && `Subject: ${msg.subject}`, msg.content].filter(Boolean).join('\n\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <ChannelIcon type={msg.message_type} />
          <span className="text-xs font-medium text-slate-300">{TYPE_LABELS[msg.message_type] || msg.message_type}</span>
          <Badge variant={STATUS_VARIANTS[msg.status] || 'default'}>{msg.status}</Badge>
          {msg.company && (
            <Link href={`/companies/${msg.company.id}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {msg.company.name}
            </Link>
          )}
          {contactName && (
            <span className="text-xs text-slate-500">→ {contactName}{msg.contact?.title ? `, ${msg.contact.title}` : ''}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={copy} title="Copy" className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Subject */}
      {msg.subject && (
        <p className="text-xs font-semibold text-slate-200">{msg.subject}</p>
      )}

      {/* Content preview / full */}
      <div
        className={cn('text-xs text-slate-400 whitespace-pre-wrap cursor-pointer', !expanded && 'line-clamp-3')}
        onClick={() => setExpanded(e => !e)}
      >
        {msg.content}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
        <span className="text-xs text-slate-600">{formatDateRelative(msg.created_at)}</span>
        <div className="flex gap-1.5">
          {msg.status === 'draft' && (
            <Button size="sm" variant="ghost" onClick={() => onStatusChange(msg.id, 'sent')}>
              Mark sent
            </Button>
          )}
          {msg.status === 'sent' && (
            <Button size="sm" variant="ghost" onClick={() => onStatusChange(msg.id, 'replied')}>
              Mark replied
            </Button>
          )}
          {msg.company && (
            <Link href={`/companies/${msg.company.id}?tab=outreach`}>
              <Button size="sm" variant="ghost">
                <ExternalLink className="w-3 h-3" /> Open
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

const FILTERS = ['All', 'Draft', 'Sent', 'Replied'] as const
const CHANNEL_FILTERS = ['All channels', 'LinkedIn', 'Email', 'Follow-up'] as const

export function OutreachClient({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages] = useState(initial)
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [channelFilter, setChannelFilter] = useState<string>('All channels')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async (silent = true) => {
    if (!silent) setRefreshing(true)
    try {
      const res = await fetch('/api/outreach')
      if (res.ok) {
        const json = await res.json()
        setMessages(json.messages ?? [])
      }
    } finally {
      if (!silent) setRefreshing(false)
    }
  }, [])

  // Refresh on window focus and every 30s
  useEffect(() => {
    const onFocus = () => refresh(true)
    window.addEventListener('focus', onFocus)
    const interval = setInterval(() => refresh(true), 30_000)
    return () => { window.removeEventListener('focus', onFocus); clearInterval(interval) }
  }, [refresh])

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/outreach/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status } : m))
    }
  }

  const filtered = messages.filter(m => {
    if (statusFilter !== 'All' && m.status !== statusFilter.toLowerCase()) return false
    if (channelFilter !== 'All channels') {
      const ch = channelFilter.toLowerCase().replace('-', '_')
      if (!m.message_type.includes(ch)) return false
    }
    if (search) {
      const q = search.toLowerCase()
      const companyName = m.company?.name?.toLowerCase() ?? ''
      const contactName = [m.contact?.first_name, m.contact?.last_name].filter(Boolean).join(' ').toLowerCase()
      if (!companyName.includes(q) && !contactName.includes(q) &&
          !m.content.toLowerCase().includes(q) && !(m.subject ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const counts = {
    draft: messages.filter(m => m.status === 'draft').length,
    sent: messages.filter(m => m.status === 'sent').length,
    replied: messages.filter(m => m.status === 'replied').length,
  }

  return (
    <>
      <Header title="Outreach" subtitle="AI-generated messages across all companies" />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total messages', value: messages.length },
            { label: 'Draft', value: counts.draft },
            { label: 'Sent', value: counts.sent },
            { label: 'Replied', value: counts.replied },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-slate-100">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search company, contact, content…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 w-64"
          />
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === f ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300')}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {CHANNEL_FILTERS.map(f => (
              <button key={f} onClick={() => setChannelFilter(f)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  channelFilter === f ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-400')}>
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-600">{filtered.length} messages</span>
            <button onClick={() => refresh(false)} disabled={refreshing}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-600 hover:text-slate-400 transition-colors">
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquarePlus className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">No outreach messages yet</p>
            <p className="text-xs text-slate-600 mt-1">Generate messages from a company's Outreach tab</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {filtered.map(m => (
              <MessageCard key={m.id} msg={m} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
