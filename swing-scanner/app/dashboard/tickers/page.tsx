'use client'
import { useState, useCallback } from 'react'

interface Ticker {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  volume: number
  avgVolume: number
  marketCap: number
  sector: string
  earningsDate: string | null
  daysToEarnings: number | null
  optionVolume: number
  putCallRatio: number
}

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toString()
}

function getConfig() {
  try {
    const stored = localStorage.getItem('swingConfig')
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

export default function TickersPage() {
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<keyof Ticker>('volume')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchTickers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const cfg = getConfig()
    const params = new URLSearchParams({
      minMarketCap: cfg.minMarketCap ?? 1_000_000_000,
      minVolume: cfg.minVolume ?? 500_000,
      numTickers: cfg.numTickers ?? 30,
      minOptionVolume: cfg.minOptionVolume ?? 1_000,
      optionsOnly: cfg.optionsOnly ?? false,
      manualTickers: cfg.manualTickers ?? '',
    })
    try {
      const res = await fetch(`/api/tickers?${params}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTickers(data.tickers)
      setFetchedAt(data.fetchedAt)
      localStorage.setItem('swingTickers', JSON.stringify(data.tickers))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tickers')
    } finally {
      setLoading(false)
    }
  }, [])

  function toggleSort(col: keyof Ticker) {
    if (sort === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(col); setSortDir('desc') }
  }

  const sorted = [...tickers].sort((a, b) => {
    const av = a[sort] as number | string
    const bv = b[sort] as number | string
    if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  function SortHeader({ col, label }: { col: keyof Ticker; label: string }) {
    return (
      <th className="text-left px-3 py-2 text-gray-400 text-xs font-medium cursor-pointer hover:text-white select-none" onClick={() => toggleSort(col)}>
        {label}{sort === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
      </th>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📋 Tickers</h1>
          <p className="text-gray-400 mt-1 text-sm">Your stock list — sorted by volume. Orange rows = earnings within 7 days.</p>
        </div>
        <button
          onClick={fetchTickers}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⟳</span> Fetching...</>
          ) : (
            <>📡 Fetch Top Tickers</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>
      )}

      {fetchedAt && (
        <div className="text-gray-600 text-xs mb-3">Last fetched: {new Date(fetchedAt).toLocaleTimeString()}</div>
      )}

      {tickers.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-medium">No tickers loaded yet</div>
          <div className="text-sm mt-1">Click &quot;Fetch Top Tickers&quot; to get started</div>
        </div>
      )}

      {tickers.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-800 text-sm text-gray-500">{tickers.length} stocks</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-950 border-b border-gray-800">
                <tr>
                  <SortHeader col="symbol" label="Symbol" />
                  <th className="text-left px-3 py-2 text-gray-400 text-xs font-medium">Name</th>
                  <SortHeader col="price" label="Price" />
                  <SortHeader col="changePct" label="Change%" />
                  <SortHeader col="volume" label="Volume" />
                  <SortHeader col="marketCap" label="Mkt Cap" />
                  <SortHeader col="putCallRatio" label="P/C Ratio" />
                  <SortHeader col="daysToEarnings" label="Earnings" />
                </tr>
              </thead>
              <tbody>
                {sorted.map(t => {
                  const earningsAlert = t.daysToEarnings !== null && t.daysToEarnings <= 7
                  return (
                    <tr key={t.symbol} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${earningsAlert ? 'bg-orange-950/20' : ''}`}>
                      <td className="px-3 py-2.5">
                        <span className="font-bold text-blue-400">{t.symbol}</span>
                        {earningsAlert && <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">ERN</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 max-w-32 truncate">{t.name}</td>
                      <td className="px-3 py-2.5 text-white font-medium">${t.price.toFixed(2)}</td>
                      <td className={`px-3 py-2.5 font-medium ${t.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.changePct >= 0 ? '+' : ''}{(t.changePct * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2.5 text-gray-300">{fmt(t.volume)}</td>
                      <td className="px-3 py-2.5 text-gray-300">{fmt(t.marketCap)}</td>
                      <td className={`px-3 py-2.5 font-medium ${t.putCallRatio < 0.7 ? 'text-green-400' : t.putCallRatio > 1.3 ? 'text-red-400' : 'text-gray-300'}`}>
                        {t.putCallRatio.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5">
                        {t.earningsDate ? (
                          <span className={earningsAlert ? 'text-orange-400 font-medium' : 'text-gray-400'}>
                            {t.earningsDate} {t.daysToEarnings !== null ? `(${t.daysToEarnings}d)` : ''}
                          </span>
                        ) : <span className="text-gray-700">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
