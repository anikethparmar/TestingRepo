'use client'
import Link from 'next/link'

const modules = [
  { href: '/dashboard/game-plan', label: "Tomorrow's Game Plan", icon: '🗓', color: 'yellow', desc: 'Auto-ranks 30 tickers for tomorrow. Gets your top picks, strategies, and entry plan ready.' },
  { href: '/dashboard/zero-dte', label: '0DTE Scanner', icon: '⚡', color: 'orange', desc: 'Scans for same-day options setups — gaps, volume surges, momentum. Graded A/B/C.' },
  { href: '/dashboard/market-pulse', label: 'Options Market Pulse', icon: '📡', color: 'blue', desc: 'VIX environment, options strategy guide, put/call ratio, and day trading conditions.' },
  { href: '/dashboard/options-chain', label: 'Options Chain', icon: '📊', color: 'purple', desc: 'Full chain with real Greeks (delta, gamma, theta, vega), IV rank, and contract sizing.' },
  { href: '/dashboard/trade-planner', label: 'Trade Planner', icon: '🎯', color: 'green', desc: 'Position sizer. Enter budget, target, max loss — get exact contracts, break-even, R/R.' },
  { href: '/dashboard/journal', label: 'Trade Journal', icon: '📓', color: 'teal', desc: 'Log every trade. Track win rate, P&L, profit factor, and daily progress to $50 goal.' },
  { href: '/dashboard/market-calendar', label: 'Market Calendar', icon: '🗓️', color: 'red', desc: 'FOMC, CPI, NFP, options expiration — each event with its trading angle and impact.' },
  { href: '/dashboard/config', label: 'Config', icon: '⚙️', color: 'gray', desc: 'Set your daily budget, profit target, ticker universe, and trading preferences.' },
]

const colorMap: Record<string, string> = {
  yellow: 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/60',
  orange: 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/60',
  blue:   'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60',
  purple: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/60',
  green:  'bg-green-500/10 border-green-500/30 hover:border-green-500/60',
  teal:   'bg-teal-500/10 border-teal-500/30 hover:border-teal-500/60',
  red:    'bg-red-500/10 border-red-500/30 hover:border-red-500/60',
  gray:   'bg-gray-500/10 border-gray-500/30 hover:border-gray-500/60',
}

const workflow = [
  {
    title: 'Night before — plan tomorrow',
    steps: [
      "Open Tomorrow's Game Plan — it scans 30 tickers and ranks the best setups",
      "Check Market Pulse → note the VIX level → determines whether to buy or sell premium",
      "Open Options Chain on your top pick → find the right strike and expiry",
      "Run Trade Planner → confirm your contract count, break-even, and R/R",
    ],
  },
  {
    title: 'Morning of — set up your trade',
    steps: [
      'Wait until 10:00 AM — never trade the first 30 min open',
      'Confirm direction: is SPY/QQQ moving the way you expected?',
      'Enter your position at the 10:00–10:30 AM window',
      'Set a mental stop: exit if the trade is down 50% of your max loss',
    ],
  },
  {
    title: 'During the day — manage it',
    steps: [
      'Take profit at 50–80% of max gain — never hold for 100%',
      'If losing, stop after 3 bad trades — walk away for the day',
      'Avoid trading 11:30 AM – 2:00 PM (lunch dead zone)',
      'Re-enter at 2:00–2:30 PM if a new setup appears',
    ],
  },
  {
    title: 'End of day — review and log',
    steps: [
      'Close ALL positions by 3:30 PM — no exceptions',
      'Log every trade in Trade Journal (win, loss, grade)',
      'Check your win rate by grade — only take A-grade setups',
      'Open Tomorrow\'s Game Plan to prep for next session',
    ],
  },
]

export default function DashboardPage() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">📡 Options Day Trader</h1>
          <p className="text-gray-400 mt-1 text-sm">$200/day budget · $50/day target · Options only</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-white font-semibold">{timeStr}</div>
          <div className="text-gray-400 text-sm">{dateStr}</div>
        </div>
      </div>

      {/* What it does */}
      <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 sm:p-5 mb-6">
        <h2 className="text-blue-300 font-bold mb-2">What this app does</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-3">
          An options day trading assistant built around a $200/day budget with a $50 daily profit target.
          It automatically finds the best tickers to trade, tells you when to enter, shows the full options chain with Greeks,
          and tracks your progress toward your daily goal.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
          {[
            'Scans 30 tickers nightly and ranks the best options setups',
            'VIX-based strategy guide — buy or sell premium based on IV',
            'Real Greeks (delta, gamma, theta, vega) on every contract',
            'Entry timing based on time-of-day win rates (10am/2pm windows)',
            'Trade journal with win rate by grade and daily P&L tracker',
            'Full position sizing — contracts, break-even, R/R in one click',
          ].map(f => (
            <div key={f} className="flex items-start gap-2 text-gray-400">
              <span className="text-green-400 mt-0.5 shrink-0">✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <h2 className="text-white font-semibold text-base mb-3">Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {modules.map(m => (
          <Link key={m.href} href={m.href} className={`rounded-xl border p-4 transition-all ${colorMap[m.color]}`}>
            <div className="text-xl mb-1.5">{m.icon}</div>
            <div className="font-semibold text-white text-sm mb-1">{m.label}</div>
            <div className="text-gray-400 text-xs leading-relaxed">{m.desc}</div>
          </Link>
        ))}
      </div>

      {/* Daily workflow */}
      <h2 className="text-white font-semibold text-base mb-3">Daily Workflow</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {workflow.map((w, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="font-medium text-white text-sm mb-2">
              <span className="text-gray-500 mr-2">{i + 1}.</span>{w.title}
            </div>
            {w.steps.map((s, j) => (
              <div key={j} className="text-gray-500 text-xs mb-1 pl-4 relative">
                <span className="absolute left-0 text-gray-700">·</span>{s}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Golden rules */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
        <h2 className="text-white font-semibold mb-3 text-sm">⚡ The 6 Rules (never break these)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Never risk more than $60/day — stop after 3 losses',
            'No trades 9:30–10:00 AM — wait for direction',
            'Best entries: 10:00–11:00 AM and 2:00–3:00 PM only',
            'Take profit at 50–80% of max gain, not 100%',
            'Never average down on a losing options position',
            'Close ALL positions by 3:30 PM — no exceptions',
          ].map((rule, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-400">
              <span className="text-gray-600 shrink-0">{i + 1}.</span>{rule}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
