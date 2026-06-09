'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatDateRelative } from '@/lib/utils'
import { Edit3, Save, CheckCircle2, FileSpreadsheet, Users, UserPlus, RefreshCw, ShieldCheck, Trash2, Eye, EyeOff, Pencil } from 'lucide-react'
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addRole, setAddRole] = useState<TeamRoleValue>('consultant')
  const [showPassword, setShowPassword] = useState(false)
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [addError, setAddError] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState<TeamRoleValue>('consultant')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editStatus, setEditStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [editError, setEditError] = useState<string | null>(null)

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

  const resetAddModal = () => {
    setAddName('')
    setAddEmail('')
    setAddPassword('')
    setAddRole('consultant')
    setAddStatus('idle')
    setAddError(null)
    setShowPassword(false)
  }

  const createUser = async () => {
    if (!addEmail.trim() || !addPassword.trim()) return
    setAddStatus('loading')
    setAddError(null)
    try {
      const res = await fetch('/api/team/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, password: addPassword, full_name: addName, role: addRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAddStatus('success')
      fetchMembers()
    } catch (err) {
      setAddStatus('error')
      setAddError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  const openEditMember = (m: Member) => {
    setEditingMember(m)
    setEditName(m.full_name || '')
    setEditEmail(m.email || '')
    setEditPassword('')
    setEditRole(m.role as TeamRoleValue)
    setShowEditPassword(false)
    setEditStatus('idle')
    setEditError(null)
  }

  const saveMember = async () => {
    if (!editingMember) return
    setEditStatus('loading')
    setEditError(null)
    try {
      const body: Record<string, string> = {
        role: editRole,
        full_name: editName,
        email: editEmail,
      }
      if (editPassword) body.password = editPassword
      const res = await fetch(`/api/team/members/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMembers(prev => prev.map(m => m.id === editingMember.id
        ? { ...m, full_name: editName || null, email: editEmail, role: editRole }
        : m
      ))
      setEditingMember(null)
    } catch (err) {
      setEditStatus('error')
      setEditError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setEditStatus(s => s === 'loading' ? 'idle' : s)
    }
  }

  const removeMember = async (id: string) => {
    if (!confirm('Remove this user? They will lose access immediately.')) return
    setRemovingId(id)
    try {
      const res = await fetch(`/api/team/members/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to remove user')
      }
    } finally {
      setRemovingId(null)
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
                <Button size="sm" variant="primary" onClick={() => { setShowAddModal(true); resetAddModal() }}>
                  <UserPlus className="h-3.5 w-3.5" /> Add member
                </Button>
              </div>
            </div>

            {!loadingMembers && members.length === 0 && (
              <div className="text-center py-8 text-slate-600">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No team members found</p>
              </div>
            )}

            {members.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <ShieldCheck className="h-3 w-3" /> Members
                </div>
                {members.map(m => (
                  <div key={m.id} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-200">{m.full_name || m.email || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {m.full_name ? m.email : null}
                          {m.last_sign_in && (
                            <span className="ml-2 text-slate-600">· Last login: {formatDateRelative(m.last_sign_in)}</span>
                          )}
                        </div>
                      </div>
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
                        <button
                          onClick={() => openEditMember(m)}
                          className="p-1 text-slate-600 hover:text-cyan-400 transition-colors rounded"
                          title="Edit member"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeMember(m.id)}
                          disabled={removingId === m.id}
                          className="p-1 text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-40 rounded"
                          title="Remove user"
                        >
                          {removingId === m.id
                            ? <div className="animate-spin h-3.5 w-3.5 border-2 border-rose-400 border-t-transparent rounded-full" />
                            : <Trash2 className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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

      <Modal open={!!editingMember} onClose={() => setEditingMember(null)} title="Edit Team Member" size="sm">
        <div className="p-5 space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="Jane Doe"
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
          <Input
            label="Email address"
            type="email"
            placeholder="jane@shma.no"
            value={editEmail}
            onChange={e => setEditEmail(e.target.value)}
          />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">New password <span className="text-slate-600 font-normal">(leave blank to keep current)</span></label>
            <div className="relative">
              <input
                type={showEditPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 pr-9 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showEditPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
            <select
              value={editRole}
              onChange={e => setEditRole(e.target.value as TeamRoleValue)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              {TEAM_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
              ))}
            </select>
          </div>
          {editStatus === 'error' && editError && (
            <p className="text-xs text-rose-400">{editError}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={saveMember}
              loading={editStatus === 'loading'}
              className="flex-1"
              disabled={!editEmail.trim()}
            >
              <Save className="h-3.5 w-3.5" /> Save changes
            </Button>
            <Button variant="ghost" onClick={() => setEditingMember(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); resetAddModal() }} title="Add Team Member" size="sm">
        <div className="p-5 space-y-4">
          {addStatus === 'success' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">User created. They can log in with the credentials you set.</span>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => resetAddModal()} className="flex-1">
                  Add another
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowAddModal(false); resetAddModal() }}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Input
                label="Full name"
                type="text"
                placeholder="Jane Doe"
                value={addName}
                onChange={e => setAddName(e.target.value)}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="jane@shma.no"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
              />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={addPassword}
                    onChange={e => setAddPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 pr-9 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                <select
                  value={addRole}
                  onChange={e => setAddRole(e.target.value as TeamRoleValue)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  {TEAM_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                  ))}
                </select>
              </div>
              {addStatus === 'error' && addError && (
                <p className="text-xs text-rose-400">{addError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={createUser}
                  loading={addStatus === 'loading'}
                  className="flex-1"
                  disabled={!addEmail.trim() || !addPassword.trim()}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Create user
                </Button>
                <Button variant="ghost" onClick={() => { setShowAddModal(false); resetAddModal() }}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
