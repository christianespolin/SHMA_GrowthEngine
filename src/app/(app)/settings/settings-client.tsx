'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatDateRelative } from '@/lib/utils'
import { Edit3, Save, CheckCircle2, FileSpreadsheet, Users, UserPlus, RefreshCw, Clock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Prompt {
  id: string
  name: string
  category: string
  prompt_text: string
  description: string | null
  is_active: boolean
}

interface Import {
  id: string
  filename: string
  row_count: number | null
  imported_count: number | null
  skipped_count: number | null
  status: string
  created_at: string
}

const TEAM_ROLES = [
  { value: 'admin',      label: 'Admin',      description: 'Full access — manages team, all data, settings' },
  { value: 'partner',    label: 'Partner',    description: 'Senior access — pipeline, companies, contacts, reports' },
  { value: 'consultant', label: 'Consultant', description: 'Standard access — view and update companies and contacts' },
  { value: 'outreach',   label: 'Outreach',   description: 'Focused access — contacts, outreach, and discovery' },
  { value: 'user',       label: 'User',       description: 'Basic read-only access' },
] as const

type TeamRoleValue = typeof TEAM_ROLES[number]['value']

interface Member {
  id: string
  email: string | undefined
  full_name: string | null
  role: string
  status: 'active' | 'pending'
  created_at: string
  invited_at: string | null
  last_sign_in: string | null
}

export function SettingsClient({ prompts, imports }: { prompts: Prompt[]; imports: Import[] }) {
  const [tab, setTab] = useState<'prompts' | 'ai' | 'imports' | 'team'>('prompts')
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRoleValue>('consultant')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  const categories = [...new Set(prompts.map(p => p.category))]

  const fetchMembers = () => {
    setLoadingMembers(true)
    fetch('/api/team/members')
      .then(r => r.json())
      .then(data => setMembers(data.members || []))
      .catch(() => {})
      .finally(() => setLoadingMembers(false))
  }

  useEffect(() => {
    if (tab === 'team' && members.length === 0) fetchMembers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteStatus('loading')
    setInviteError(null)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInviteStatus('success')
      setInviteEmail('')
      // Refresh list to show pending invite
      fetchMembers()
    } catch (err) {
      setInviteStatus('error')
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite')
    }
  }

  const updateRole = async (memberId: string, newRole: TeamRoleValue) => {
    setUpdatingRole(memberId)
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      }
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setEditText(prompt.prompt_text)
  }

  const handleSave = async () => {
    if (!editingPrompt) return
    setSaving(true)
    try {
      await fetch(`/api/prompts/${editingPrompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_text: editText }),
      })
      setEditingPrompt(null)
    } finally {
      setSaving(false)
    }
  }

  const tabs = ['prompts', 'ai', 'imports', 'team'] as const

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex gap-0 border-b border-slate-800 px-5 flex-shrink-0">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px capitalize',
              tab === t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {t === 'prompts' ? 'Prompt Library' : t === 'ai' ? 'AI Configuration' : t === 'imports' ? 'Import History' : 'Team'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'prompts' && (
          <div className="max-w-3xl space-y-5">
            <p className="text-sm text-slate-500">Edit AI prompt templates used throughout the application. Changes apply immediately.</p>
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{cat}</h3>
                <div className="space-y-2">
                  {prompts.filter(p => p.category === cat).map(prompt => (
                    <div key={prompt.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium text-slate-200">{prompt.name.replace(/_/g, ' ')}</span>
                          {prompt.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{prompt.description}</p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(prompt)}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 bg-slate-900 rounded p-2 max-h-24 overflow-hidden relative">
                        <pre className="whitespace-pre-wrap font-mono">{prompt.prompt_text.slice(0, 200)}…</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'ai' && (
          <div className="max-w-lg space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-200 mb-3">AI Configuration</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Provider</span>
                  <Badge variant="info">Anthropic Claude</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Model</span>
                  <span className="text-slate-300 font-mono text-xs">{process.env.NEXT_PUBLIC_MODEL || 'claude-sonnet-4-6'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">API Key</span>
                  <Badge variant={process.env.ANTHROPIC_API_KEY ? 'success' : 'danger'}>
                    {process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Not set'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-200 mb-2">Environment Variables</h3>
              <p className="text-xs text-slate-500 mb-3">Configure these in your <code className="bg-slate-700 px-1 rounded">.env.local</code> file</p>
              <div className="space-y-2 font-mono text-xs bg-slate-900 rounded p-3">
                {[
                  'ANTHROPIC_API_KEY=sk-ant-...',
                  'ANTHROPIC_MODEL=claude-sonnet-4-6',
                  'NEXT_PUBLIC_SUPABASE_URL=https://...',
                  'NEXT_PUBLIC_SUPABASE_ANON_KEY=...',
                  'SUPABASE_SERVICE_ROLE_KEY=...',
                ].map(v => (
                  <div key={v} className="text-slate-400">{v}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'imports' && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-medium text-slate-200 mb-3">Import History</h3>
            {imports.length === 0 && (
              <div className="text-center py-8 text-slate-600">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No imports yet</p>
              </div>
            )}
            <div className="space-y-2">
              {imports.map(imp => (
                <div key={imp.id} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-200">{imp.filename}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {imp.imported_count ?? 0} imported · {imp.skipped_count ?? 0} skipped · {formatDate(imp.created_at)}
                      </div>
                    </div>
                    <Badge variant={imp.status === 'completed' ? 'success' : 'danger'}>{imp.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'team' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-200">Team Members</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {members.filter(m => m.status === 'active').length} active
                  {members.filter(m => m.status === 'pending').length > 0 && (
                    <span className="ml-1 text-amber-500">· {members.filter(m => m.status === 'pending').length} pending</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchMembers}
                  disabled={loadingMembers}
                  className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingMembers ? 'animate-spin' : ''}`} />
                </button>
                <Button size="sm" variant="primary" onClick={() => { setShowInviteModal(true); setInviteStatus('idle') }}>
                  <UserPlus className="h-3.5 w-3.5" /> Invite member
                </Button>
              </div>
            </div>

            {!loadingMembers && members.length === 0 && (
              <div className="text-center py-8 text-slate-600">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No team members found</p>
              </div>
            )}

            {/* Active members */}
            {members.filter(m => m.status === 'active').length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <ShieldCheck className="h-3 w-3" /> Active
                </div>
                {members.filter(m => m.status === 'active').map(m => (
                  <div key={m.id} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-medium text-slate-200">{m.full_name || m.email || 'Unknown'}</div>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {m.email}
                          {m.last_sign_in && (
                            <span className="ml-2 text-slate-600">· Last login: {formatDateRelative(m.last_sign_in)}</span>
                          )}
                        </div>
                      </div>
                      {/* Role selector */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {updatingRole === m.id && (
                          <div className="animate-spin h-3.5 w-3.5 border-2 border-cyan-500 border-t-transparent rounded-full" />
                        )}
                        <select
                          value={m.role}
                          onChange={e => updateRole(m.id, e.target.value as TeamRoleValue)}
                          disabled={updatingRole === m.id}
                          className="bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                        >
                          {TEAM_ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending invites */}
            {members.filter(m => m.status === 'pending').length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-500/80 font-medium uppercase tracking-wide">
                  <Clock className="h-3 w-3" /> Pending invites
                </div>
                {members.filter(m => m.status === 'pending').map(m => (
                  <div key={m.id} className="bg-slate-800/50 border border-amber-500/20 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-slate-300">{m.email}</div>
                        <div className="text-xs text-amber-500/70 mt-0.5">
                          Invite sent {m.invited_at ? formatDateRelative(m.invited_at) : formatDate(m.created_at)} · awaiting acceptance
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={m.role}
                          onChange={e => updateRole(m.id, e.target.value as TeamRoleValue)}
                          disabled={updatingRole === m.id}
                          className="bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                        >
                          {TEAM_ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-600">
                  Click refresh ↑ to check if pending invites have been accepted.
                </p>
              </div>
            )}

            {/* Role legend */}
            <details className="group">
              <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-400 transition-colors list-none flex items-center gap-1">
                <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
                Role descriptions
              </summary>
              <div className="mt-2 space-y-1.5 pl-3 border-l border-slate-800">
                {TEAM_ROLES.map(r => (
                  <div key={r.value} className="flex items-start gap-2">
                    <span className="text-xs font-medium text-slate-400 w-20 flex-shrink-0">{r.label}</span>
                    <span className="text-xs text-slate-600">{r.description}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      <Modal open={!!editingPrompt} onClose={() => setEditingPrompt(null)} title={`Edit: ${editingPrompt?.name?.replace(/_/g, ' ')}`} size="xl">
        <div className="p-5 space-y-3">
          <Textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={20}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleSave} loading={saving} className="flex-1">
              <Save className="h-3.5 w-3.5" /> Save Prompt
            </Button>
            <Button variant="ghost" onClick={() => setEditingPrompt(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showInviteModal} onClose={() => { setShowInviteModal(false); setInviteStatus('idle') }} title="Invite Team Member" size="sm">
        <div className="p-5 space-y-4">
          {inviteStatus === 'success' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">Invite sent! They&apos;ll appear as Pending until they accept.</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowInviteModal(false); setInviteStatus('idle') }}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <Input
                label="Email address"
                type="email"
                placeholder="colleague@shma.no"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as TeamRoleValue)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  {TEAM_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                  ))}
                </select>
              </div>
              {inviteStatus === 'error' && inviteError && (
                <p className="text-xs text-rose-400">{inviteError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={sendInvite}
                  loading={inviteStatus === 'loading'}
                  className="flex-1"
                  disabled={!inviteEmail.trim()}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Send Invite
                </Button>
                <Button variant="ghost" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
