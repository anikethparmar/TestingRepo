'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider'

const nav = [
  { group: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/market-pulse', label: 'Market Pulse', icon: '📡' },
  ]},
  { group: 'Day Trading', items: [
    { href: '/dashboard/game-plan', label: "Tomorrow's Game Plan", icon: '🗓', badge: 'NEW' },
    { href: '/dashboard/zero-dte', label: '0DTE Scanner', icon: '⚡' },
    { href: '/dashboard/options-chain', label: 'Options Chain', icon: '📊' },
    { href: '/dashboard/trade-planner', label: 'Trade Planner', icon: '🎯' },
    { href: '/dashboard/journal', label: 'Trade Journal', icon: '📓' },
  ]},
  { group: 'Settings', items: [
    { href: '/dashboard/config', label: 'Config', icon: '⚙️' },
  ]},
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-lg shrink-0">📡</div>
          <div>
            <div className="font-bold text-white text-sm">Swing Scanner</div>
            <div className="text-gray-500 text-xs">Options & Swing Trading</div>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-white p-1 rounded"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {nav.map(({ group, items }) => (
          <div key={group} className="mb-5">
            <div className="text-gray-600 text-xs font-bold uppercase tracking-wider px-3 mb-1">{group}</div>
            <div className="space-y-0.5">
              {items.map(({ href, label, icon, badge }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-base shrink-0">{icon}</span>
                    <span className="truncate">{label}</span>
                    {badge && (
                      <span className="ml-auto text-xs bg-yellow-500 text-black font-bold px-1.5 py-0.5 rounded shrink-0">
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
