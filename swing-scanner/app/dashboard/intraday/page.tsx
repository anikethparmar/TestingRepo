'use client'
import { useState, useCallback } from 'react'

interface Signal {
  symbol: string
  signal: string
  type: 'bullish' | 'bearish' | 'neutral'
  strength: 'strong' | 'moderate' | 'weak'
  price: number
  detail: string
  time: string
}

function getTickersFromStorage(): string[] {
  try {
    const t = localStorage.getItem('swingTickers')
    if (t) return JSON.parse(t).map((x: { symbol: string }) => x.symbol)
  } catch { /* ignore */ }
  return ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AMD', 'SPY', 'QQQ']
}

export default function IntradayPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(false)
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all')
  const [filterStrength, setFilterStrength] = useState<'all' | 'strong' | 'moderate'>('all')

  const scan = useCallback(async () => {
    setLoading(true)
    setError(null)
    const symbols = getTickersFromStorage()
    try {
      const res = await fetch(`/api/intraday?symbols=${symbols.join(',')}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSignals(data.signals)
      setScannedAt(data.scannedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = signals
    .filter(s => filter === 'all' || s.type === filter)
    .filter(s => filterStrength === 'all' || s.strength === filterStrength)

  const strengthColor = { strong: 'text-white bg-blue-600', moderate: 'text-blue-300 bg-blue-900/40', weak: 'text-gray-400 bg-gray-800' }
  const typeIcon = { bullish: '📈', bearish: '📉', neutral: '↔️' }
  const typeBorder = { bullish: 'border-green-800/40 bg-green-950/10', bearish: 'border-red-800/40 bg-red-950/10', neutral: 'border-gray-700/40 bg-gray-900/30' }

  const signalTypes = [
    { label: 'Gap Up/Down', desc: 'Opening price significantly above or below previous close' },
    { label: 'Volume Spike', desc: '2x+ average daily volume — unusual activity' },
    { label: 'MA Cross', desc: '10-period MA crossing the 20-period MA' },
    { label: 'Bollinger Band Breakout', desc: 'Price breaking outside the 2-standard-deviation bands' },
    { label: 'Big Intraday Move', desc: '3%+ move from open within the day' },
    { label: 'Inside Day', desc: 'Full day range contained within prior day — compression' },
    { label: '20-Day High/Low Breakout', desc: 'New multi-week high or low — momentum signal' },
    { label: '3-Day Momentum', desc: '3 consecutive higher/lower closes with volume' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">⚡ Intraday Signals</h1>
          <p className="text-gray-400 mt-1 text-sm">Checks what&apos;s happening right now — over 50 signal types. Best used during market hours.</p>
        </div>
        <button onClick={scan} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin">⟳</span> Scanning...</> : <>⚡ Scan Signals</>}
        </button>
      </div>

      {/* Signal types guide */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="text-gray-400 font-medium text-sm mb-3">Signal Types Detected:</div>
        <div className="grid grid-cols-2 gap-2">
          {signalTypes.map(s => (
            <div key={s.label} className="text-xs">
              <span className="text-blue-400 font-medium">{s.label}</span>
              <span className="text-gray-600"> — {s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>}

      {/* Filters */}
      {signals.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-2">
            {(['all', 'bullish', 'bearish', 'neutral'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {f === 'all' ? `All (${signals.length})` : `${typeIcon[f]} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            {(['all', 'strong', 'moderate'] as const).map(s => (
              <button key={s} onClick={() => setFilterStrength(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStrength === s ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {scannedAt && <div className="text-gray-600 text-xs mb-3">Scanned: {new Date(scannedAt).toLocaleTimeString()} — {filtered.length} signals found</div>}

      {signals.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">⚡</div>
          <div className="font-medium">No signals scanned yet</div>
          <div className="text-sm mt-1">Best used during market hours. Fetch tickers first, then scan signals.</div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((s, i) => (
          <div key={i} className={`border rounded-xl p-4 ${typeBorder[s.type]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{typeIcon[s.type]}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400">{s.symbol}</span>
                    <span className="font-medium text-white">{s.signal}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${strengthColor[s.strength]}`}>
                      {s.strength.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm mt-0.5">{s.detail}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">${s.price.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
