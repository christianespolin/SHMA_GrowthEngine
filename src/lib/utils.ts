import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export function isStale(date: string | null | undefined, days = 14): boolean {
  if (!date) return true
  const d = new Date(date)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return d < cutoff
}

export function scoreToColor(score: number): string {
  if (score >= 4.5) return 'text-emerald-400'
  if (score >= 3.5) return 'text-cyan-400'
  if (score >= 2.5) return 'text-amber-400'
  return 'text-rose-400'
}

export function scoreToBg(score: number): string {
  if (score >= 4.5) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (score >= 3.5) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  if (score >= 2.5) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
}

export function priorityToBadge(priority: string): string {
  switch (priority) {
    case 'A': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'B': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    case 'C': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    case 'Nurture': return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    case 'Disqualified': return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  }
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}
