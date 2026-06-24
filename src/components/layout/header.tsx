'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, LogOut, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function Header({ title, subtitle, actions, backHref, backLabel }: HeaderProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/companies?search=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-5 gap-4 flex-shrink-0">
      {backHref && (
        <Link href={backHref} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
          <ChevronLeft className="w-3.5 h-3.5" />
          {backLabel || 'Back'}
        </Link>
      )}
      {title && (
        <div className="flex-shrink-0">
          <h1 className="text-sm font-semibold text-slate-100">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search companies…"
            className="w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </form>

      <div className="flex-1" />

      {actions}

      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
