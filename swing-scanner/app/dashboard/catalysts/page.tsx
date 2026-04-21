'use client'
import { useState, useCallback } from 'react'

interface Catalyst {
  symbol: string
  name: string
  type: string
  date: string
  daysAway: number
  timing: string
  price: number
  impliedVolatility: number | null
  expectedMove: number
  expectedEPS: number | null
  sentiment: string
  tradingAngle: string
}

function getTickersFromStorage(): string[] {
  try {
    const t = localStorage.getItem('swingTickers')
    if (t) return JSON.parse(t).map((x: { symbol: string }) => x.symbol)
  } catch { /* ignore */ }
  return ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AMD', 'JPM', 'NFLX']
}

export default function CatalystsPage() {
  const [catalysts, setCatalysts] = useState<Catalyst[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'Earnings' | 'Dividend'>('all')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    const symbols = getTickersFromStorage()
    try {
      const res = await fetch(`/api/catalysts?symbols=${symbols.join(',')}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCatalysts(data.catalysts)
      setFetchedAt(data.fetchedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = catalysts.filter(c => filter === 'all' || c.type === filter)

  function urgencyColor(days: number) {
    if (days <= 3) return 'text-red-400'
    if (days <= 7) return 'text-orange-400'
    if (days <= 14) return 'text-yellow-400'
    return 'text-gray-400'
  }

  function urgencyBg(days: number) {
    if (days <= 3) return 'border-red-800/50 bg-red-950/10'
    if (days <= 7) return 'border-orange-800/50 bg-orange-950/10'
    if (days <= 14) return 'border-yellow-800/30 bg-yellow-950/5'
    return 'border-gray-700/50 bg-gray-900/30'
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📅 Upcoming Catalysts</h1>
          <p className="text-gray-400 mt-1 text-sm">Earnings reports, dividend dates, implied volatility, and options sentiment for your tickers.</p>
        </div>
        <button onClick={fetch_} disabled={loading} className="bg-red-700 hover:bg-red-800 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin">⟳</span> Loading...</> : <>📅 Fetch Catalysts</>}
        </button>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-3 mb-6 text-sm">
        {[
          { color: 'text-red-400', label: '≤ 3 days', desc: 'Act now or sit out' },
          { color: 'text-orange-400', label: '≤ 7 days', desc: 'Time to plan trade' },
          { color: 'text-yellow-400', label: '≤ 14 days', desc: 'Start watching' },
          { color: 'text-gray-400', label: '14+ days', desc: 'Mark calendar' },
        ].map(({ color, label, desc }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className={`font-medium ${color}`}>{label}</div>
            <div className="text-gray-500 text-xs">{desc}</div>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>}

      {catalysts.length > 0 && (
        <div className="flex gap-2 mb-4">
          {(['all', 'Earnings', 'Dividend'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {f === 'all' ? `All (${catalysts.length})` : `${f === 'Earnings' ? '📊' : '💵'} ${f} (${catalysts.filter(c => c.type === f).length})`}
            </button>
          ))}
        </div>
      )}

      {fetchedAt && <div className="text-gray-600 text-xs mb-3">Fetched: {new Date(fetchedAt).toLocaleTimeString()} — {filtered.length} upcoming catalysts</div>}

      {catalysts.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">📅</div>
          <div className="font-medium">No catalysts loaded yet</div>
          <div className="text-sm mt-1">Fetch tickers first, then click &quot;Fetch Catalysts&quot;</div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((c, i) => (
          <div key={i} className={`border rounded-xl p-4 ${urgencyBg(c.daysAway)}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-400 text-lg">{c.symbol}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.type === 'Earnings' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                    {c.type === 'Earnings' ? '📊 EARNINGS' : '💵 DIVIDEND'}
                  </span>
                  <span className={`font-semibold ${urgencyColor(c.daysAway)}`}>
                    {c.daysAway === 0 ? 'TODAY' : `${c.daysAway} days away`}
                  </span>
                </div>
                <div className="text-gray-400 text-sm mt-0.5">{c.name}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">${c.price.toFixed(2)}</div>
                <div className="text-gray-500 text-xs">{c.date} {c.timing !== 'Unknown' ? `• ${c.timing}` : ''}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
              {c.impliedVolatility && (
                <div className="bg-gray-950/50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">Implied Vol</div>
                  <div className="text-orange-400 font-medium">{c.impliedVolatility}%</div>
                </div>
              )}
              <div className="bg-gray-950/50 rounded-lg p-2">
                <div className="text-gray-500 text-xs mb-0.5">{c.type === 'Earnings' ? 'Expected Move' : 'Dividend'}</div>
                <div className="text-white font-medium">${c.expectedMove.toFixed(2)}</div>
              </div>
              {c.expectedEPS !== null && (
                <div className="bg-gray-950/50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">Est. EPS</div>
                  <div className="text-blue-300 font-medium">${c.expectedEPS.toFixed(2)}</div>
                </div>
              )}
            </div>

            <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-3">
              <span className="text-blue-400 text-xs font-semibold">💡 TRADING ANGLE: </span>
              <span className="text-gray-300 text-xs">{c.tradingAngle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
