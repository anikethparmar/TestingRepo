'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { group: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/market-pulse', label: 'Market Pulse', icon: '📡' },
    { href: '/dashboard/market-calendar', label: 'Market Calendar', icon: '🗓️' },
  ]},
  { group: 'Day Trading', items: [
    { href: '/dashboard/game-plan', label: "Tomorrow's Game Plan", icon: '🗓' },
    { href: '/dashboard/zero-dte', label: '0DTE Scanner', icon: '⚡' },
    { href: '/dashboard/options-chain', label: 'Options Chain', icon: '📊' },
    { href: '/dashboard/trade-planner', label: 'Trade Planner', icon: '🎯' },
    { href: '/dashboard/journal', label: 'Trade Journal', icon: '📓' },
  ]},
  { group: 'Swing Trading', items: [
    { href: '/dashboard/tickers', label: 'Tickers', icon: '📋' },
    { href: '/dashboard/patterns', label: 'Scanner Results', icon: '🔍' },
    { href: '/dashboard/charts', label: 'Charts', icon: '📈' },
    { href: '/dashboard/intraday', label: 'Intraday Signals', icon: '🔥' },
    { href: '/dashboard/options-flow', label: 'Options Flow', icon: '💰' },
    { href: '/dashboard/catalysts', label: 'Catalysts', icon: '📅' },
  ]},
  { group: 'Settings', items: [
    { href: '/dashboard/config', label: 'Config', icon: '⚙️' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-lg">📡</div>
          <div>
            <div className="font-bold text-white text-sm">Swing Scanner</div>
            <div className="text-gray-500 text-xs">Options & Swing Trading</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto">
        {nav.map(({ group, items }) => (
          <div key={group} className="mb-4">
            <div className="text-gray-600 text-xs font-bold uppercase tracking-wider px-3 mb-1">{group}</div>
            <div className="space-y-0.5">
              {items.map(({ href, label, icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-base">{icon}</span>
                    {label}
                    {href === '/dashboard/game-plan' && <span className="ml-auto text-xs bg-yellow-500 text-black font-bold px-1.5 py-0.5 rounded">NEW</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800">
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
