'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/app/providers'
import {
  LayoutDashboard, Building2, Kanban, BarChart3,
  Upload, Settings, ChevronRight, Zap, Users, CalendarDays, Crosshair,
  Sun, Moon
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/discovery', label: 'Target Discovery', icon: Crosshair },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/import', label: 'Import', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-800">
        <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-tight">SHMA</div>
          <div className="text-xs text-slate-500 leading-none">Growth Engine</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-100',
                active
                  ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors duration-100"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 flex-shrink-0" />
            : <Moon className="w-4 h-4 flex-shrink-0" />
          }
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <div>
          <div className="text-xs text-slate-600">SH Management</div>
          <div className="text-xs text-slate-700 mt-0.5">Roadmap to 10 clients</div>
        </div>
      </div>
    </aside>
  )
}
