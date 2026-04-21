'use client'
import { useState, useCallback } from 'react'

interface OptionContract {
  strike: number
  expiry: string
  type: 'call' | 'put'
  bid: number
  ask: number
  last: number
  iv: number
  delta: number
  gamma: number
  theta: number
  vega: number
  volume: number
  openInterest: number
  itm: boolean
  spread: number
  spreadPct: number
  midpoint: number
  contractsFor200: number
  maxProfit200: number
  breakEven: number
}

interface ChainData {
  symbol: string
  spotPrice: number
  expiries: string[]
  calls: OptionContract[]
  puts: OptionContract[]
  ivRank: number
  ivPercentile: number
  historicalVol30: number
  fetchedAt: string
}

function IVBadge({ iv, ivRank }: { iv: number; ivRank: number }) {
  const color = ivRank < 30 ? 'text-green-400 bg-green-900/30' : ivRank < 60 ? 'text-yellow-400 bg-yellow-900/30' : 'text-red-400 bg-red-900/30'
  return <span className={`text-xs px-2 py-0.5 rounded font-bold ${color}`}>{iv.toFixed(0)}%</span>
}

function DeltaBadge({ delta }: { delta: number }) {
  const abs = Math.abs(delta)
  const color = abs > 0.6 ? 'text-blue-300' : abs > 0.35 ? 'text-blue-400' : 'text-gray-400'
  return <span className={`font-mono text-xs ${color}`}>{delta.toFixed(3)}</span>
}

export default function OptionsChainPage() {
  const [symbol, setSymbol] = useState('SPY')
  const [inputSymbol, setInputSymbol] = useState('SPY')
  const [expiry, setExpiry] = useState('')
  const [data, setData] = useState<ChainData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'both' | 'calls' | 'puts'>('both')
  const [budget, setBudget] = useState(200)
  const [showItmOnly, setShowItmOnly] = useState(false)
  const [focusStrike, setFocusStrike] = useState<number | null>(null)

  const load = useCallback(async (sym = symbol, exp = expiry) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/options-chain?symbol=${sym}&expiry=${exp}`)
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setData(d)
      if (d.expiries?.length > 0 && !exp) setExpiry(d.expiries[0])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chain')
    } finally {
      setLoading(false)
    }
  }, [symbol, expiry])

  function handleLoad() {
    setSymbol(inputSymbol.toUpperCase())
    load(inputSymbol.toUpperCase(), expiry)
  }

  const filterContracts = (contracts: OptionContract[]) => {
    let filtered = contracts
    if (showItmOnly) filtered = filtered.filter(c => c.itm)
    if (focusStrike) {
      filtered = filtered.filter(c => Math.abs(c.strike - focusStrike) / focusStrike < 0.05)
    }
    return filtered
  }

  const ivEnvColor = !data ? 'text-gray-400' :
    data.ivRank < 30 ? 'text-green-400' : data.ivRank < 60 ? 'text-yellow-400' : 'text-red-400'
  const ivEnvLabel = !data ? '' :
    data.ivRank < 30 ? '✅ BUY OPTIONS (cheap)' : data.ivRank < 60 ? '⚠️ MODERATE — use spreads' : '🚨 SELL PREMIUM (expensive)'

  const quickStrikes = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'AMD', 'SPX', 'IWM']

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">📊 Options Chain</h1>
        <p className="text-gray-400 mt-1 text-sm">Full options chain with real Greeks. Find the right strike for your $200 budget.</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <div className="flex gap-3 mb-3 items-end flex-wrap">
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase mb-1.5">Symbol</div>
            <div className="flex gap-2">
              <input value={inputSymbol} onChange={e => setInputSymbol(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleLoad()} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase mb-1.5">Expiry</div>
            <select value={expiry} onChange={e => { setExpiry(e.target.value); load(symbol, e.target.value) }} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {data?.expiries.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase mb-1.5">Budget</div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-sm">$</span>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button onClick={handleLoad} disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors">
            {loading ? '⟳ Loading...' : 'Load Chain'}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer ml-auto">
            <input type="checkbox" checked={showItmOnly} onChange={e => setShowItmOnly(e.target.checked)} className="accent-blue-500" />
            ITM Only
          </label>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickStrikes.map(s => (
            <button key={s} onClick={() => { setInputSymbol(s); setSymbol(s); load(s, '') }} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${symbol === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{s}</button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>}

      {/* IV Environment Banner */}
      {data && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1">Spot Price</div>
            <div className="text-white text-xl font-bold">${data.spotPrice.toFixed(2)}</div>
          </div>
          <div className={`rounded-xl border p-3 ${data.ivRank < 30 ? 'bg-green-950/20 border-green-800/30' : data.ivRank < 60 ? 'bg-yellow-950/20 border-yellow-800/30' : 'bg-red-950/20 border-red-800/30'}`}>
            <div className="text-gray-500 text-xs mb-1">IV Rank</div>
            <div className={`text-xl font-bold ${ivEnvColor}`}>{data.ivRank.toFixed(0)}<span className="text-sm font-normal text-gray-500">/100</span></div>
            <div className={`text-xs font-bold ${ivEnvColor}`}>{ivEnvLabel}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1">IV Percentile</div>
            <div className="text-white text-xl font-bold">{data.ivPercentile.toFixed(0)}%</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1">30-Day HV</div>
            <div className="text-white text-xl font-bold">{data.historicalVol30.toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* View toggle */}
      {data && (
        <div className="flex gap-2 mb-4">
          {(['both', 'calls', 'puts'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {v === 'both' ? '↔ Both' : v === 'calls' ? '📈 Calls' : '📉 Puts'}
            </button>
          ))}
          <div className="ml-auto text-gray-600 text-xs self-center">Updated: {new Date(data.fetchedAt).toLocaleTimeString()}</div>
        </div>
      )}

      {/* Chain Table */}
      {data && (
        <div className="grid gap-4" style={{ gridTemplateColumns: view === 'both' ? '1fr 1fr' : '1fr' }}>
          {(view === 'both' || view === 'calls') && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-800 bg-green-950/20">
                <span className="text-green-400 font-bold text-sm">📈 CALLS</span>
                <span className="text-gray-500 text-xs ml-2">{filterContracts(data.calls).length} contracts</span>
              </div>
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-950 border-b border-gray-800">
                    <tr className="text-gray-500">
                      <th className="px-2 py-2 text-left">Strike</th>
                      <th className="px-2 py-2 text-right">Bid</th>
                      <th className="px-2 py-2 text-right">Ask</th>
                      <th className="px-2 py-2 text-right">IV</th>
                      <th className="px-2 py-2 text-right">Δ Delta</th>
                      <th className="px-2 py-2 text-right">Θ Theta</th>
                      <th className="px-2 py-2 text-right">Vol</th>
                      <th className="px-2 py-2 text-right">OI</th>
                      <th className="px-2 py-2 text-right">#{budget}$</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterContracts(data.calls).map((c, i) => (
                      <tr key={i} onClick={() => setFocusStrike(focusStrike === c.strike ? null : c.strike)} className={`border-b border-gray-800/40 cursor-pointer transition-colors ${c.itm ? 'bg-green-950/20 hover:bg-green-950/30' : 'hover:bg-gray-800/30'} ${focusStrike === c.strike ? 'ring-1 ring-blue-500' : ''}`}>
                        <td className="px-2 py-2">
                          <span className={`font-bold ${c.itm ? 'text-green-400' : 'text-white'}`}>${c.strike}</span>
                          {c.itm && <span className="ml-1 text-xs text-green-600">ITM</span>}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-300">{c.bid.toFixed(2)}</td>
                        <td className="px-2 py-2 text-right text-gray-300">{c.ask.toFixed(2)}</td>
                        <td className="px-2 py-2 text-right"><IVBadge iv={c.iv} ivRank={data.ivRank} /></td>
                        <td className="px-2 py-2 text-right"><DeltaBadge delta={c.delta} /></td>
                        <td className="px-2 py-2 text-right text-red-400 font-mono">{c.theta.toFixed(3)}</td>
                        <td className="px-2 py-2 text-right text-gray-400">{c.volume >= 1000 ? `${(c.volume / 1000).toFixed(0)}K` : c.volume}</td>
                        <td className="px-2 py-2 text-right text-gray-500">{c.openInterest >= 1000 ? `${(c.openInterest / 1000).toFixed(0)}K` : c.openInterest}</td>
                        <td className="px-2 py-2 text-right">
                          <span className={`font-bold ${c.contractsFor200 > 0 ? 'text-blue-400' : 'text-gray-600'}`}>{c.contractsFor200}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(view === 'both' || view === 'puts') && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-800 bg-red-950/20">
                <span className="text-red-400 font-bold text-sm">📉 PUTS</span>
                <span className="text-gray-500 text-xs ml-2">{filterContracts(data.puts).length} contracts</span>
              </div>
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-950 border-b border-gray-800">
                    <tr className="text-gray-500">
                      <th className="px-2 py-2 text-left">Strike</th>
                      <th className="px-2 py-2 text-right">Bid</th>
                      <th className="px-2 py-2 text-right">Ask</th>
                      <th className="px-2 py-2 text-right">IV</th>
                      <th className="px-2 py-2 text-right">Δ Delta</th>
                      <th className="px-2 py-2 text-right">Θ Theta</th>
                      <th className="px-2 py-2 text-right">Vol</th>
                      <th className="px-2 py-2 text-right">OI</th>
                      <th className="px-2 py-2 text-right">#{budget}$</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterContracts(data.puts).map((c, i) => (
                      <tr key={i} onClick={() => setFocusStrike(focusStrike === c.strike ? null : c.strike)} className={`border-b border-gray-800/40 cursor-pointer transition-colors ${c.itm ? 'bg-red-950/20 hover:bg-red-950/30' : 'hover:bg-gray-800/30'} ${focusStrike === c.strike ? 'ring-1 ring-blue-500' : ''}`}>
                        <td className="px-2 py-2">
                          <span className={`font-bold ${c.itm ? 'text-red-400' : 'text-white'}`}>${c.strike}</span>
                          {c.itm && <span className="ml-1 text-xs text-red-600">ITM</span>}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-300">{c.bid.toFixed(2)}</td>
                        <td className="px-2 py-2 text-right text-gray-300">{c.ask.toFixed(2)}</td>
                        <td className="px-2 py-2 text-right"><IVBadge iv={c.iv} ivRank={data.ivRank} /></td>
                        <td className="px-2 py-2 text-right"><DeltaBadge delta={c.delta} /></td>
                        <td className="px-2 py-2 text-right text-red-400 font-mono">{c.theta.toFixed(3)}</td>
                        <td className="px-2 py-2 text-right text-gray-400">{c.volume >= 1000 ? `${(c.volume / 1000).toFixed(0)}K` : c.volume}</td>
                        <td className="px-2 py-2 text-right text-gray-500">{c.openInterest >= 1000 ? `${(c.openInterest / 1000).toFixed(0)}K` : c.openInterest}</td>
                        <td className="px-2 py-2 text-right">
                          <span className={`font-bold ${c.contractsFor200 > 0 ? 'text-blue-400' : 'text-gray-600'}`}>{c.contractsFor200}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-medium">Enter a symbol and click Load Chain</div>
          <div className="text-sm mt-1">SPY, QQQ, AAPL, TSLA, NVDA — anything with liquid options</div>
        </div>
      )}
    </div>
  )
}
