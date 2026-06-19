'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/app/providers'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Building2, Kanban, BarChart3,
  Settings, ChevronRight, ChevronDown, Zap, CalendarDays, Crosshair,
  Sun, Moon, Globe2, Star, MessageSquarePlus,
} from 'lucide-react'

const primaryNav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/companies',  label: 'Companies',  icon: Building2 },
  { href: '/pipeline',   label: 'Kanban',     icon: Kanban },
  { href: '/outreach',   label: 'Outreach',   icon: MessageSquarePlus },
  { href: '/meetings',   label: 'Meetings',   icon: CalendarDays },
]

const extendedNav = [
  { href: '/discovery',                   label: 'Target Discovery',        icon: Crosshair },
  { href: '/target-universe',             label: 'Target Universe',         icon: Globe2 },
  { href: '/reports',                     label: 'Reports',                 icon: BarChart3 },
  { href: '/updated-scoring-criteria',    label: 'Scoring Criteria',        icon: Star },
  { href: '/settings',                    label: 'Settings',                icon: Settings },
]

const STORAGE_KEY = 'shma_menu_expanded'

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [expanded, setExpanded] = useState(false)

  // Persist expanded state
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setExpanded(stored === 'true')
  }, [])

  const toggleExpanded = () => {
    setExpanded(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  // Auto-expand if current path is in extended nav
  useEffect(() => {
    const inExtended = extendedNav.some(n => pathname.startsWith(n.href))
    if (inExtended) setExpanded(true)
  }, [pathname])

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname.startsWith(href)
    return (
      <Link
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
  }

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
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {primaryNav.map(item => <NavLink key={item.href} {...item} />)}

        {/* More toggle */}
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full transition-colors duration-100 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
        >
          <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200', expanded && 'rotate-180')} />
          <span className="flex-1 text-left">{expanded ? 'Less' : 'More'}</span>
        </button>

        {/* Extended nav */}
        {expanded && (
          <div className="space-y-0.5 border-l border-slate-800 ml-2 pl-2">
            {extendedNav.map(item => <NavLink key={item.href} {...item} />)}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
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
