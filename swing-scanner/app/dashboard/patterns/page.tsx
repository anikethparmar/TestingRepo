'use client'
import { useState, useCallback } from 'react'

interface PatternResult {
  symbol: string
  pattern: string
  direction: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  support: number
  resistance: number
  target: number
  description: string
}

function getTickersFromStorage(): string[] {
  try {
    const t = localStorage.getItem('swingTickers')
    if (t) return JSON.parse(t).map((x: { symbol: string }) => x.symbol)
  } catch { /* ignore */ }
  return ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AMD', 'SPY', 'QQQ']
}

const BULLISH_PATTERNS = ['Bull Flag', 'Double Bottom', 'Ascending Triangle', 'Golden Cross', 'Hammer', 'Morning Star', 'Inverse Head & Shoulders', 'Falling Wedge', 'Cup & Handle', '4 Green Candles', 'Equal Lows', "Gilligan's Island Buy", 'Bullish Reversal']
const BEARISH_PATTERNS = ['Bear Flag', 'Double Top', 'Head & Shoulders', 'Death Cross', 'Hanging Man', 'Evening Star', 'Rising Wedge', 'Descending Triangle', '4 Red Candles', 'Equal Highs', "Gilligan's Island Sell", 'Bearish Reversal']

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<PatternResult[]>([])
  const [loading, setLoading] = useState(false)
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all')
  const [minConf, setMinConf] = useState(60)

  const scan = useCallback(async () => {
    setLoading(true)
    setError(null)
    const symbols = getTickersFromStorage()
    try {
      const res = await fetch(`/api/patterns?symbols=${symbols.join(',')}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPatterns(data.patterns)
      setScannedAt(data.scannedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = patterns
    .filter(p => filter === 'all' || p.direction === filter)
    .filter(p => p.confidence >= minConf)

  const bullishCount = patterns.filter(p => p.direction === 'bullish').length
  const bearishCount = patterns.filter(p => p.direction === 'bearish').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🔍 Scanner Results</h1>
          <p className="text-gray-400 mt-1 text-sm">25 chart patterns detected. Green = bullish, Red = bearish, Gray = neutral.</p>
        </div>
        <button onClick={scan} disabled={loading} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin">⟳</span> Scanning...</> : <>🔍 Scan Patterns</>}
        </button>
      </div>

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>}

      {/* Pattern Guide */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-4">
          <div className="text-green-400 font-semibold mb-2 text-sm">📈 Bullish Patterns</div>
          <div className="text-gray-500 text-xs leading-relaxed">{BULLISH_PATTERNS.join(', ')}</div>
        </div>
        <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-4">
          <div className="text-red-400 font-semibold mb-2 text-sm">📉 Bearish Patterns</div>
          <div className="text-gray-500 text-xs leading-relaxed">{BEARISH_PATTERNS.join(', ')}</div>
        </div>
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
          <div className="text-gray-400 font-semibold mb-2 text-sm">↔️ Neutral Patterns</div>
          <div className="text-gray-500 text-xs">Double Inside Day — compression, big move coming, direction unknown</div>
        </div>
      </div>

      {/* Filters */}
      {patterns.length > 0 && (
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex gap-2">
            {(['all', 'bullish', 'bearish', 'neutral'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {f === 'all' ? `All (${patterns.length})` : f === 'bullish' ? `📈 Bullish (${bullishCount})` : f === 'bearish' ? `📉 Bearish (${bearishCount})` : `Neutral`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-400 text-sm">Min confidence: {minConf}%</span>
            <input type="range" min={50} max={90} value={minConf} onChange={e => setMinConf(Number(e.target.value))} className="w-24 accent-blue-500" />
          </div>
        </div>
      )}

      {scannedAt && <div className="text-gray-600 text-xs mb-3">Scanned: {new Date(scannedAt).toLocaleTimeString()} — {filtered.length} patterns found</div>}

      {patterns.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-medium">No patterns scanned yet</div>
          <div className="text-sm mt-1">Fetch tickers first, then click &quot;Scan Patterns&quot;</div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((p, i) => {
          const isBull = p.direction === 'bullish'
          const isBear = p.direction === 'bearish'
          const borderColor = isBull ? 'border-green-800/50 bg-green-950/10' : isBear ? 'border-red-800/50 bg-red-950/10' : 'border-gray-700/50 bg-gray-900/50'
          const dirColor = isBull ? 'text-green-400' : isBear ? 'text-red-400' : 'text-gray-400'
          const targetMove = ((p.target - p.support) / p.support * 100).toFixed(1)

          return (
            <div key={`${p.symbol}-${p.pattern}-${i}`} className={`border rounded-xl p-4 ${borderColor}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`text-xl`}>{isBull ? '📈' : isBear ? '📉' : '↔️'}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400 text-lg">{p.symbol}</span>
                      <span className="font-semibold text-white">{p.pattern}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isBull ? 'bg-green-500/20 text-green-400' : isBear ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {p.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm mt-0.5">{p.description}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-white font-bold">{p.confidence}%</div>
                  <div className="text-gray-500 text-xs">confidence</div>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <div><span className="text-gray-500">Support:</span> <span className="text-white">${p.support.toFixed(2)}</span></div>
                <div><span className="text-gray-500">Resistance:</span> <span className="text-white">${p.resistance.toFixed(2)}</span></div>
                <div><span className="text-gray-500">Target:</span> <span className={dirColor}>${p.target.toFixed(2)} ({isBull ? '+' : ''}{targetMove}%)</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
