'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, Eye, EyeOff, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Hero {
  id: string; hero_key: string; label: string; description: string | null
  is_visible: boolean; is_primary: boolean; sort_order: number
  threshold_warning: number | null; threshold_critical: number | null
  clickthrough_url: string | null
}

export function DashboardHeroSettingsClient({ heroes: initial }: { heroes: Hero[] }) {
  const [heroes, setHeroes] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const update = (id: string, field: keyof Hero, value: unknown) => {
    setHeroes(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  const save = async (hero: Hero) => {
    setSaving(hero.id)
    try {
      await fetch(`/api/dashboard-heroes/${hero.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hero),
      })
      setSaved(hero.id)
      setTimeout(() => setSaved(null), 2000)
    } finally {
      setSaving(null)
    }
  }

  const primary = heroes.filter(h => h.is_primary)
  const secondary = heroes.filter(h => !h.is_primary)

  const HeroRow = ({ h }: { h: Hero }) => (
    <div className={cn(
      'bg-slate-800 border rounded-lg p-4 space-y-3',
      h.is_visible ? 'border-slate-700' : 'border-slate-800 opacity-60'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => update(h.id, 'is_visible', !h.is_visible)}
            className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            title={h.is_visible ? 'Hide' : 'Show'}
          >
            {h.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <code className="text-xs text-slate-600 font-mono">{h.hero_key}</code>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => update(h.id, 'is_primary', !h.is_primary)}
            className={cn(
              'text-xs px-2 py-0.5 rounded border transition-colors',
              h.is_primary
                ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
                : 'border-slate-700 text-slate-500 hover:text-slate-300'
            )}
          >
            {h.is_primary ? 'Primary' : 'Secondary'}
          </button>
          <Button size="sm" variant={saved === h.id ? 'primary' : 'ghost'} loading={saving === h.id} onClick={() => save(h)}>
            <Save className="w-3 h-3" /> {saved === h.id ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Label" value={h.label} onChange={e => update(h.id, 'label', e.target.value)} />
        <Input label="Click-through URL" value={h.clickthrough_url || ''} onChange={e => update(h.id, 'clickthrough_url', e.target.value || null)} placeholder="/companies" />
      </div>
      <Input label="Description" value={h.description || ''} onChange={e => update(h.id, 'description', e.target.value || null)} />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Sort order" type="number" value={String(h.sort_order)} onChange={e => update(h.id, 'sort_order', parseInt(e.target.value) || 0)} />
        <Input label="Warning threshold" type="number" value={h.threshold_warning !== null ? String(h.threshold_warning) : ''} onChange={e => update(h.id, 'threshold_warning', e.target.value ? parseFloat(e.target.value) : null)} placeholder="e.g. 5" />
        <Input label="Critical threshold" type="number" value={h.threshold_critical !== null ? String(h.threshold_critical) : ''} onChange={e => update(h.id, 'threshold_critical', e.target.value ? parseFloat(e.target.value) : null)} placeholder="e.g. 10" />
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <LayoutDashboard className="w-5 h-5 text-cyan-400" />
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Dashboard Hero Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure which metrics appear on the dashboard, their labels, thresholds and destinations</p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="info">Primary</Badge>
          <span className="text-xs text-slate-500">Shown prominently at the top of the dashboard</span>
        </div>
        <div className="space-y-3">
          {primary.sort((a, b) => a.sort_order - b.sort_order).map(h => <HeroRow key={h.id} h={h} />)}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="default">Secondary</Badge>
          <span className="text-xs text-slate-500">Shown in the attention-required section</span>
        </div>
        <div className="space-y-3">
          {secondary.sort((a, b) => a.sort_order - b.sort_order).map(h => <HeroRow key={h.id} h={h} />)}
        </div>
      </div>
    </div>
  )
}
