'use client'
import { useState, useCallback } from 'react'

interface OptionsFlow {
  symbol: string
  name: string
  price: number
  changePct: number
  callVolume: number
  putVolume: number
  putCallRatio: number
  volumeRatio: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  note: string
}

function getTickersFromStorage(): string[] {
  try {
    const t = localStorage.getItem('swingTickers')
    if (t) return JSON.parse(t).map((x: { symbol: string }) => x.symbol)
  } catch { /* ignore */ }
  return ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AMD', 'SPY', 'QQQ']
}

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toString()
}

export default function OptionsFlowPage() {
  const [flows, setFlows] = useState<OptionsFlow[]>([])
  const [loading, setLoading] = useState(false)
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all')

  const scan = useCallback(async () => {
    setLoading(true)
    setError(null)
    const symbols = getTickersFromStorage()
    try {
      const res = await fetch(`/api/options-flow?symbols=${symbols.join(',')}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFlows(data.flows)
      setScannedAt(data.scannedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = flows.filter(f => filter === 'all' || f.sentiment === filter)

  const bullCount = flows.filter(f => f.sentiment === 'bullish').length
  const bearCount = flows.filter(f => f.sentiment === 'bearish').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">💰 Unusual Options Flow</h1>
          <p className="text-gray-400 mt-1 text-sm">Finds stocks where options traders are making unusually large bets — follow the smart money.</p>
        </div>
        <button onClick={scan} disabled={loading} className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin">⟳</span> Scanning...</> : <>💰 Scan Options Flow</>}
        </button>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-4">
          <div className="text-green-400 font-semibold text-sm mb-1">🟢 Bullish Flow</div>
          <div className="text-gray-500 text-xs">High call volume, low put/call ratio (&lt;0.5). Smart money betting on upside.</div>
        </div>
        <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-4">
          <div className="text-red-400 font-semibold text-sm mb-1">🔴 Bearish Flow</div>
          <div className="text-gray-500 text-xs">Heavy put buying, high put/call ratio (&gt;1.5). Hedging or directional bets to downside.</div>
        </div>
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
          <div className="text-gray-400 font-semibold text-sm mb-1">⚪ Neutral/Unusual</div>
          <div className="text-gray-500 text-xs">Abnormal total volume but no clear directional bias. Watch for catalyst.</div>
        </div>
      </div>

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>}

      {flows.length > 0 && (
        <div className="flex gap-2 mb-4">
          {(['all', 'bullish', 'bearish'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {f === 'all' ? `All (${flows.length})` : f === 'bullish' ? `🟢 Bullish (${bullCount})` : `🔴 Bearish (${bearCount})`}
            </button>
          ))}
        </div>
      )}

      {scannedAt && <div className="text-gray-600 text-xs mb-3">Scanned: {new Date(scannedAt).toLocaleTimeString()} — {filtered.length} unusual flows found</div>}

      {flows.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">💰</div>
          <div className="font-medium">No options flow scanned yet</div>
          <div className="text-sm mt-1">Fetch tickers first, then scan for unusual options activity.</div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((f, i) => {
          const isBull = f.sentiment === 'bullish'
          const isBear = f.sentiment === 'bearish'
          const border = isBull ? 'border-green-800/50 bg-green-950/10' : isBear ? 'border-red-800/50 bg-red-950/10' : 'border-gray-700/50 bg-gray-900/30'
          const pcrColor = f.putCallRatio < 0.5 ? 'text-green-400' : f.putCallRatio > 1.5 ? 'text-red-400' : 'text-gray-300'

          return (
            <div key={i} className={`border rounded-xl p-4 ${border}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-blue-400 text-lg">{f.symbol}</span>
                    <span className="text-gray-400 text-sm truncate max-w-40">{f.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isBull ? 'bg-green-500/20 text-green-400' : isBear ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {f.sentiment.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm">{f.note}</div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-white font-medium">${f.price.toFixed(2)}</div>
                  <div className={`text-sm ${f.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {f.changePct >= 0 ? '+' : ''}{(f.changePct * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-950/50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">Call Volume</div>
                  <div className="text-green-400 font-medium">{fmt(f.callVolume)}</div>
                </div>
                <div className="bg-gray-950/50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">Put Volume</div>
                  <div className="text-red-400 font-medium">{fmt(f.putVolume)}</div>
                </div>
                <div className="bg-gray-950/50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">P/C Ratio</div>
                  <div className={`font-medium ${pcrColor}`}>{f.putCallRatio}</div>
                </div>
                <div className="bg-gray-950/50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">Vol Ratio</div>
                  <div className="text-orange-400 font-medium">{f.volumeRatio}x</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
