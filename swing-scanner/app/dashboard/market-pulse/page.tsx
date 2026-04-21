'use client'
import { useState, useEffect, useCallback } from 'react'

interface MarketPulseData {
  indices: Record<string, { price: number; changePct: number; volume: number }>
  vix: { price: number; changePct: number; label: string; color: string; note: string; action: string }
  tlt: { price: number; changePct: number }
  gld: { price: number; changePct: number }
  hyg: { price: number; changePct: number }
  fearGreed: { score: number; label: string }
  marketTrend: string
  putCallRatio: { value: number; sentiment: string }
  dayTrading: { score: number; note: string }
  spyLevels: { price: number; high52: number; low52: number; fromHigh: string }
  fetchedAt: string
}

function Pct({ v }: { v: number }) {
  return <span className={v >= 0 ? 'text-green-400' : 'text-red-400'}>{v >= 0 ? '+' : ''}{v.toFixed(2)}%</span>
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
    blue: 'text-blue-400 bg-blue-950/30 border-blue-700/40',
    yellow: 'text-yellow-400 bg-yellow-950/30 border-yellow-700/40',
    red: 'text-red-400 bg-red-950/30 border-red-700/40',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📡 Market Pulse</h1>
          <p className="text-gray-400 mt-1 text-sm">Real-time market conditions, VIX environment, and day trading score.</p>
        </div>
        <button onClick={load} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
          {loading ? '⟳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>}

      {data && (
        <div className="space-y-4">
          {/* Day Trading Score — top banner */}
          <div className={`rounded-xl border p-5 ${data.dayTrading.score >= 85 ? 'bg-green-950/30 border-green-700/40' : data.dayTrading.score >= 65 ? 'bg-blue-950/30 border-blue-700/40' : data.dayTrading.score >= 45 ? 'bg-yellow-950/20 border-yellow-700/30' : 'bg-red-950/20 border-red-700/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Today&apos;s Day Trading Score</div>
                <div className={`text-4xl font-black ${data.dayTrading.score >= 85 ? 'text-green-400' : data.dayTrading.score >= 65 ? 'text-blue-400' : data.dayTrading.score >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {data.dayTrading.score}<span className="text-xl font-normal text-gray-500">/100</span>
                </div>
                <div className="text-gray-300 text-sm mt-1">{data.dayTrading.note}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs mb-1">Market Regime</div>
                <div className="text-white font-medium text-sm max-w-48 text-right">{data.marketTrend}</div>
              </div>
            </div>
          </div>

          {/* Indices row */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(data.indices).map(([sym, d]) => (
              <div key={sym} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-gray-400 text-xs font-bold mb-1">{sym}</div>
                <div className="text-white text-xl font-bold">${d.price?.toFixed(2)}</div>
                <Pct v={d.changePct} />
                <div className="text-gray-600 text-xs mt-1">{d.volume >= 1e6 ? `${(d.volume / 1e6).toFixed(0)}M vol` : `${(d.volume / 1e3).toFixed(0)}K vol`}</div>
              </div>
            ))}
          </div>

          {/* VIX + Fear & Greed */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl border p-5 ${vixColorMap[data.vix.color] ?? 'bg-gray-900 border-gray-800'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase mb-1">VIX — Volatility Index</div>
                  <div className="text-3xl font-black text-white">{data.vix.price?.toFixed(2)}</div>
                  <Pct v={data.vix.changePct} />
                </div>
                <div className={`text-xs font-bold px-3 py-1 rounded-full border ${vixColorMap[data.vix.color]}`}>
                  {data.vix.label}
                </div>
              </div>
              <div className="text-gray-300 text-sm">{data.vix.note}</div>
              <div className={`mt-2 text-xs font-bold px-2 py-1 rounded inline-block ${data.vix.action === 'BUY OPTIONS' ? 'bg-green-800/40 text-green-300' : data.vix.action === 'USE SPREADS' ? 'bg-yellow-800/40 text-yellow-300' : data.vix.action === 'SELL PREMIUM' ? 'bg-red-800/40 text-red-300' : 'bg-blue-800/40 text-blue-300'}`}>
                ACTION: {data.vix.action}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center">
              <div className="text-xs text-gray-400 font-bold uppercase mb-3">Fear &amp; Greed Index</div>
              <GaugeMeter value={data.fearGreed.score} label={data.fearGreed.label} />
            </div>
          </div>

          {/* Put/Call + Other markets */}
          <div className="grid grid-cols-4 gap-3">
            <div className={`rounded-xl border p-4 ${data.putCallRatio.sentiment === 'bullish' ? 'bg-green-950/20 border-green-800/30' : data.putCallRatio.sentiment === 'bearish' ? 'bg-red-950/20 border-red-800/30' : 'bg-gray-900 border-gray-800'}`}>
              <div className="text-gray-400 text-xs font-bold uppercase mb-1">Put/Call Ratio</div>
              <div className="text-2xl font-bold text-white">{data.putCallRatio.value}</div>
              <div className={`text-xs font-bold mt-1 ${data.putCallRatio.sentiment === 'bullish' ? 'text-green-400' : data.putCallRatio.sentiment === 'bearish' ? 'text-red-400' : 'text-gray-400'}`}>
                {data.putCallRatio.sentiment.toUpperCase()}
              </div>
              <div className="text-gray-600 text-xs mt-1">&lt;0.7 = bullish | &gt;1.1 = bearish</div>
            </div>

            {[
              { label: 'TLT (Bonds)', d: data.tlt },
              { label: 'GLD (Gold)', d: data.gld },
              { label: 'HYG (Junk Bonds)', d: data.hyg },
            ].map(({ label, d }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-gray-400 text-xs font-bold uppercase mb-1">{label}</div>
                <div className="text-xl font-bold text-white">${d.price?.toFixed(2)}</div>
                <Pct v={d.changePct} />
              </div>
            ))}
          </div>

          {/* SPY Levels */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-gray-400 text-xs font-bold uppercase mb-3">SPY Key Levels</div>
            <div className="flex items-center gap-6">
              <div><div className="text-xs text-gray-500">52W High</div><div className="text-green-400 font-bold">${data.spyLevels.high52?.toFixed(2)}</div></div>
              <div><div className="text-xs text-gray-500">Current</div><div className="text-white font-bold text-lg">${data.spyLevels.price?.toFixed(2)}</div></div>
              <div><div className="text-xs text-gray-500">52W Low</div><div className="text-red-400 font-bold">${data.spyLevels.low52?.toFixed(2)}</div></div>
              <div><div className="text-xs text-gray-500">From High</div><div className={`font-bold ${parseFloat(data.spyLevels.fromHigh) < -10 ? 'text-red-400' : 'text-gray-300'}`}>{data.spyLevels.fromHigh}%</div></div>
            </div>
            {/* Visual bar */}
            <div className="mt-3 relative h-2 bg-gray-800 rounded-full">
              <div className="absolute h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 rounded-full w-full opacity-40" />
              <div className="absolute h-3 w-1 bg-white rounded-full top-1/2 -translate-y-1/2" style={{ left: `${((data.spyLevels.price - data.spyLevels.low52) / (data.spyLevels.high52 - data.spyLevels.low52) * 100).toFixed(1)}%` }} />
            </div>
          </div>

          <div className="text-gray-700 text-xs text-right">Updated: {new Date(data.fetchedAt).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  )
}
