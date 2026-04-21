'use client'
import { useState } from 'react'
import Link from 'next/link'

const modules = [
  { href: '/dashboard/tickers', label: 'Fetch Top Tickers', icon: '📋', color: 'blue', desc: 'Pull top stocks matching your config filters, sorted by volume.' },
  { href: '/dashboard/patterns', label: 'Scan Chart Patterns', icon: '🔍', color: 'purple', desc: 'Scan 25 patterns: bull flags, double bottoms, head & shoulders, and more.' },
  { href: '/dashboard/charts', label: 'Pattern Charts', icon: '📈', color: 'green', desc: 'Visual candlestick charts with pattern lines, moving averages & targets.' },
  { href: '/dashboard/intraday', label: 'Intraday Signals', icon: '⚡', color: 'yellow', desc: 'Gap ups, volume spikes, MA crosses, Bollinger breakouts — 50+ signal types.' },
  { href: '/dashboard/options-flow', label: 'Unusual Options Flow', icon: '💰', color: 'orange', desc: 'Find smart money bets — abnormal call/put activity and put/call ratios.' },
  { href: '/dashboard/catalysts', label: 'Upcoming Catalysts', icon: '📅', color: 'red', desc: 'Earnings, dividends, implied volatility, and options sentiment per ticker.' },
  { href: '/dashboard/market-calendar', label: 'Market Calendar', icon: '🗓️', color: 'teal', desc: 'FOMC, CPI, NFP, GDP, options expiration — each event with trading angles.' },
  { href: '/dashboard/config', label: 'Config Settings', icon: '⚙️', color: 'gray', desc: 'Set min market cap, volume, num tickers, options filters, and manual tickers.' },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60',
  purple: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/60',
  green: 'bg-green-500/10 border-green-500/30 hover:border-green-500/60',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/60',
  orange: 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/60',
  red: 'bg-red-500/10 border-red-500/30 hover:border-red-500/60',
  teal: 'bg-teal-500/10 border-teal-500/30 hover:border-teal-500/60',
  gray: 'bg-gray-500/10 border-gray-500/30 hover:border-gray-500/60',
}

const recipeList = [
  { title: 'Find options trades this week', steps: ['Set Num Tickers = 20, Min Option Volume = 5000, Options Only = yes', 'Visit: Tickers → Catalysts → Options Flow → Market Calendar'] },
  { title: 'Find swing trade setups', steps: ['Set Num Tickers = 50', 'Visit: Tickers → Scanner Results → Filter by High Confidence → Confirm on Charts'] },
  { title: 'Find a specific pattern across the market', steps: ['Go to Scanner Results', 'Filter by the pattern name and sort by confidence'] },
  { title: 'See what\'s moving the market this week', steps: ['Go to Market Calendar', 'Read each event\'s Trading Angle at the bottom'] },
]

export default function DashboardPage() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">📡 Swing Scanner</h1>
            <p className="text-gray-400 mt-1">Options & Swing Trading Assistant</p>
          </div>
          <div className="text-right">
            <div className="text-white font-semibold">{timeStr}</div>
            <div className="text-gray-400 text-sm">{dateStr}</div>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-5 mb-6">
        <h2 className="text-blue-300 font-bold text-lg mb-2">What is this?</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          This app automatically finds stocks with trading opportunities, scans for chart patterns, tracks market-moving events, and helps you plan options trades.
          Instead of manually scrolling through hundreds of stocks, the scanner does the work for you.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {['Finds the hottest stocks based on your filters', 'Spots 25 chart patterns while they\'re still forming', 'Shows where big money is flowing in options market', 'Alerts you to earnings, FOMC, CPI & other catalysts'].map(f => (
            <div key={f} className="flex items-start gap-2 text-gray-400">
              <span className="text-green-400 mt-0.5">✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Quick start tip */}
      <div className="bg-amber-950/20 border border-amber-700/30 rounded-xl p-4 mb-6 text-sm text-amber-300">
        💡 <strong>Quick start:</strong> Go to <Link href="/dashboard/config" className="underline">Config</Link> to set your filters, then visit <Link href="/dashboard/tickers" className="underline">Tickers</Link> to fetch your stock list. Or go straight to <Link href="/dashboard/market-calendar" className="underline">Market Calendar</Link> — it works without a ticker list.
      </div>

      {/* Module grid */}
      <h2 className="text-white font-semibold text-lg mb-4">Modules</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {modules.map(m => (
          <Link key={m.href} href={m.href} className={`rounded-xl border p-5 transition-all cursor-pointer ${colorMap[m.color]}`}>
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="font-semibold text-white mb-1">{m.label}</div>
            <div className="text-gray-400 text-sm">{m.desc}</div>
          </Link>
        ))}
      </div>

      {/* Quick start recipes */}
      <h2 className="text-white font-semibold text-lg mb-4">Quick Start Recipes</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {recipeList.map(r => (
          <div key={r.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="font-medium text-white mb-2 text-sm">🎯 {r.title}</div>
            {r.steps.map((s, i) => (
              <div key={i} className="text-gray-400 text-xs mb-1">{i + 1}. {s}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-3">💡 Tips</h2>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Run daily before market open for fresh data</li>
          <li>• Start with 20–30 tickers until you&apos;re comfortable</li>
          <li>• High confidence patterns are more reliable but less frequent</li>
          <li>• Always check the chart before trading a pattern</li>
          <li>• Market Calendar works on its own — no need to fetch tickers first</li>
          <li>• If you see $0 prices or empty results, Yahoo Finance may be rate-limited — try again in a few minutes</li>
        </ul>
      </div>
    </div>
  )
}
