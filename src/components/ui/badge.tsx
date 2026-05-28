import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  className?: string
}

const variants = {
  default: 'bg-slate-700 text-slate-200 border-slate-600',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  info: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  muted: 'bg-slate-600/50 text-slate-400 border-slate-600',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
