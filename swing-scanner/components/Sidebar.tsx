'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/tickers', label: 'Tickers', icon: '📋' },
  { href: '/dashboard/patterns', label: 'Scanner Results', icon: '🔍' },
  { href: '/dashboard/charts', label: 'Charts', icon: '📈' },
  { href: '/dashboard/intraday', label: 'Intraday Signals', icon: '⚡' },
  { href: '/dashboard/options-flow', label: 'Options Flow', icon: '💰' },
  { href: '/dashboard/catalysts', label: 'Catalysts', icon: '📅' },
  { href: '/dashboard/market-calendar', label: 'Market Calendar', icon: '🗓️' },
  { href: '/dashboard/config', label: 'Config', icon: '⚙️' },
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
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
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
