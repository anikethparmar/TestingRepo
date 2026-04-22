'use client'
import { useState, useEffect, useCallback } from 'react'

interface MarketPulseData {
  indices: Record<string, { price: number; changePct: number; volume: number }>
  vix: { price: number; changePct: number; label: string; color: string; note: string; action: string }
  fearGreed: { score: number; label: string }
  marketTrend: string
  putCallRatio: { value: number; sentiment: string }
  dayTrading: { score: number; note: string }
  spyLevels: { price: number; high52: number; low52: number; fromHigh: string }
  fetchedAt: string
}

function Pct({ v }: { v: number }) {
  return (
    <span className={v >= 0 ? 'text-green-400' : 'text-red-400'}>
      {v >= 0 ? '+' : ''}{v.toFixed(2)}%
    </span>
  )
}

function GaugeMeter({ value, label }: { value: number; label: string }) {
  const color = value >= 75 ? '#22c55e' : value >= 55 ? '#86efac' : value >= 45 ? '#facc15' : value >= 25 ? '#f97316' : '#ef4444'
  const deg = (value / 100) * 180 - 90
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute inset-0 rounded-t-full border-8 border-gray-700" style={{ borderBottomColor: 'transparent' }} />
        <div className="absolute bottom-0 left-1/2 w-1 h-14 origin-bottom rounded" style={{ background: color, transform: `translateX(-50%) rotate(${deg}deg)` }} />
        <div className="absolute bottom-0 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 translate-y-1/2" style={{ background: color }} />
      </div>
      <div className="text-2xl font-bold mt-1" style={{ color }}>{value}</div>
      <div className="text-xs font-semibold" style={{ color }}>{label}</div>
    </div>
  )
}

function optionsStrategyFromVix(vixPrice: number, action: string): {
  strategies: string[]
  maxPremium: string
  budgetNote: string
  warning?: string
} {
  if (vixPrice < 15) return {
    strategies: ['Long Calls (cheap premium)', 'Long Puts (cheap premium)', 'Debit Spreads'],
    maxPremium: '$40–60 per contract',
    budgetNote: 'IV is low — options are affordable. Good day to buy premium outright.',
  }
  if (vixPrice < 20) return {
    strategies: ['Call Debit Spread', 'Put Debit Spread', 'Long calls/puts on A-grade setups'],
    maxPremium: '$50–70 per contract',
    budgetNote: 'Normal IV environment. Debit spreads give the best risk/reward.',
  }
  if (vixPrice < 30) return {
    strategies: ['Debit Spreads only (no naked long options)', 'Bull Put Spread', 'Bear Call Spread'],
    maxPremium: '$30–50 per contract (spreads only)',
    budgetNote: 'IV is elevated — premium is expensive. Use spreads to cap your cost.',
    warning: 'Avoid buying naked calls or puts. Spreads only.',
  }
  return {
    strategies: ['Sell Iron Condor (if experienced)', 'Credit Spreads', 'Skip today — wait for VIX to drop'],
    maxPremium: 'Avoid paying premium — collect it instead',
    budgetNote: 'VIX is very high — premium is extremely expensive. Selling is better than buying.',
    warning: 'Extremely expensive options. Beginners should sit out today.',
  }
}

export default function MarketPulsePage() {
  const [data, setData] = useState<MarketPulseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/market-pulse')
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setData(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const vixColorMap: Record<string, string> = {
    green: 'text-green-400 bg-green-950/30 border-green-700/40',
    blue:  'text-blue-400 bg-blue-950/30 border-blue-700/40',
    yellow:'text-yellow-400 bg-yellow-950/30 border-yellow-700/40',
    red:   'text-red-400 bg-red-950/30 border-red-700/40',
  }

  const actionBg: Record<string, string> = {
    'BUY OPTIONS':   'bg-green-800/40 text-green-300 border-green-600/40',
    'STANDARD':      'bg-blue-800/40 text-blue-300 border-blue-600/40',
    'USE SPREADS':   'bg-yellow-800/40 text-yellow-300 border-yellow-600/40',
    'SELL PREMIUM':  'bg-red-800/40 text-red-300 border-red-600/40',
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">📡 Options Market Pulse</h1>
          <p className="text-gray-400 mt-1 text-sm">VIX environment, options strategy guide, and day trading conditions.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          {loading ? '⟳' : '🔄'} Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Day Trading Score */}
          <div className={`rounded-xl border p-4 sm:p-5 ${
            data.dayTrading.score >= 85 ? 'bg-green-950/30 border-green-700/40' :
            data.dayTrading.score >= 65 ? 'bg-blue-950/30 border-blue-700/40' :
            data.dayTrading.score >= 45 ? 'bg-yellow-950/20 border-yellow-700/30' :
            'bg-red-950/20 border-red-700/30'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Options Day Trading Score</div>
                <div className={`text-4xl font-black ${
                  data.dayTrading.score >= 85 ? 'text-green-400' :
                  data.dayTrading.score >= 65 ? 'text-blue-400' :
                  data.dayTrading.score >= 45 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {data.dayTrading.score}<span className="text-xl font-normal text-gray-500">/100</span>
                </div>
                <div className="text-gray-300 text-sm mt-1">{data.dayTrading.note}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs mb-1">Market Regime</div>
                <div className="text-white font-medium text-sm">{data.marketTrend}</div>
              </div>
            </div>
          </div>

          {/* SPY/QQQ/IWM indices */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Object.entries(data.indices).map(([sym, d]) => (
              <div key={sym} className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4">
                <div className="text-gray-400 text-xs font-bold mb-1">{sym}</div>
                <div className="text-white text-lg sm:text-xl font-bold">${d.price?.toFixed(2)}</div>
                <Pct v={d.changePct} />
                <div className="text-gray-600 text-xs mt-1 hidden sm:block">
                  {d.volume >= 1e6 ? `${(d.volume / 1e6).toFixed(0)}M vol` : `${(d.volume / 1e3).toFixed(0)}K vol`}
                </div>
              </div>
            ))}
          </div>

          {/* VIX + Fear & Greed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`rounded-xl border p-4 sm:p-5 ${vixColorMap[data.vix.color] ?? 'bg-gray-900 border-gray-800'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase mb-1">VIX — Volatility Index</div>
                  <div className="text-3xl font-black text-white">{data.vix.price?.toFixed(2)}</div>
                  <Pct v={data.vix.changePct} />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${vixColorMap[data.vix.color]}`}>
                  {data.vix.label}
                </span>
              </div>
              <div className="text-gray-300 text-sm">{data.vix.note}</div>
              <div className={`mt-3 text-xs font-bold px-3 py-1.5 rounded-lg inline-block border ${actionBg[data.vix.action] ?? 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                TODAY: {data.vix.action}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2">
              <div className="text-xs text-gray-400 font-bold uppercase">Fear &amp; Greed Index</div>
              <GaugeMeter value={data.fearGreed.score} label={data.fearGreed.label} />
              <div className="text-gray-500 text-xs text-center">
                {data.fearGreed.score >= 60 ? 'Greed = market may reverse. Be cautious with calls.' :
                 data.fearGreed.score <= 40 ? 'Fear = potential bounce. Watch for reversal setups.' :
                 'Neutral — no strong sentiment edge.'}
              </div>
            </div>
          </div>

          {/* Options strategy guide */}
          {(() => {
            const guide = optionsStrategyFromVix(data.vix.price, data.vix.action)
            return (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-5">
                <div className="text-xs text-gray-400 font-bold uppercase mb-3">Today's Options Strategy Guide</div>
                {guide.warning && (
                  <div className="mb-3 p-2.5 rounded-lg bg-red-950/40 border border-red-700/40 text-red-300 text-sm font-medium">
                    ⚠ {guide.warning}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Recommended strategies</div>
                    <ul className="space-y-1">
                      {guide.strategies.map((s, i) => (
                        <li key={i} className="text-sm text-gray-200 flex gap-2">
                          <span className="text-blue-400 shrink-0">→</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Max premium per trade</div>
                      <div className="text-white font-bold">{guide.maxPremium}</div>
                    </div>
                    <div className="text-sm text-gray-400">{guide.budgetNote}</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Put/Call Ratio */}
          <div className={`rounded-xl border p-4 ${
            data.putCallRatio.sentiment === 'bullish' ? 'bg-green-950/20 border-green-800/30' :
            data.putCallRatio.sentiment === 'bearish' ? 'bg-red-950/20 border-red-800/30' :
            'bg-gray-900 border-gray-800'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-gray-400 text-xs font-bold uppercase mb-1">Options Put/Call Ratio</div>
                <div className="text-3xl font-bold text-white">{data.putCallRatio.value}</div>
                <div className={`text-sm font-bold mt-1 ${
                  data.putCallRatio.sentiment === 'bullish' ? 'text-green-400' :
                  data.putCallRatio.sentiment === 'bearish' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {data.putCallRatio.sentiment.toUpperCase()} SENTIMENT
                </div>
              </div>
              <div className="text-sm text-gray-400 max-w-xs">
                {data.putCallRatio.value < 0.7
                  ? 'Low PCR — traders are buying calls. Could signal overcrowding on the long side.'
                  : data.putCallRatio.value > 1.1
                  ? 'High PCR — heavy put buying. Often a contrarian bullish signal (fear peak).'
                  : 'PCR is neutral. No strong options sentiment edge today.'}
                <div className="text-gray-600 text-xs mt-1">&lt;0.7 = call-heavy | 0.7–1.1 = neutral | &gt;1.1 = put-heavy</div>
              </div>
            </div>
          </div>

          {/* SPY Key Levels */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
            <div className="text-gray-400 text-xs font-bold uppercase mb-3">SPY Key Levels (for strike selection)</div>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <div><div className="text-xs text-gray-500">52W High</div><div className="text-green-400 font-bold">${data.spyLevels.high52?.toFixed(2)}</div></div>
              <div><div className="text-xs text-gray-500">Current</div><div className="text-white font-bold text-lg">${data.spyLevels.price?.toFixed(2)}</div></div>
              <div><div className="text-xs text-gray-500">52W Low</div><div className="text-red-400 font-bold">${data.spyLevels.low52?.toFixed(2)}</div></div>
              <div><div className="text-xs text-gray-500">From High</div><div className={`font-bold ${parseFloat(data.spyLevels.fromHigh) < -10 ? 'text-red-400' : 'text-gray-300'}`}>{data.spyLevels.fromHigh}%</div></div>
            </div>
            <div className="mt-3 relative h-2 bg-gray-800 rounded-full">
              <div className="absolute h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 rounded-full w-full opacity-40" />
              <div
                className="absolute h-3 w-1 bg-white rounded-full top-1/2 -translate-y-1/2"
                style={{ left: `${((data.spyLevels.price - data.spyLevels.low52) / (data.spyLevels.high52 - data.spyLevels.low52) * 100).toFixed(1)}%` }}
              />
            </div>
            <div className="text-gray-600 text-xs mt-2">Use these levels to pick strikes — buy calls above support, puts below resistance.</div>
          </div>

          <div className="text-gray-700 text-xs text-right">Updated: {new Date(data.fetchedAt).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  )
}
