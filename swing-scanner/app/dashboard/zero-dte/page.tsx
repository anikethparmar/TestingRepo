'use client'
import { useState, useCallback } from 'react'

interface ZeroDteSetup {
  symbol: string
  name: string
  spotPrice: number
  changePct: number
  volRatio: number
  trend: 'bullish' | 'bearish' | 'neutral'
  signal: string
  signalStrength: number
  entryType: string
  suggestedStrike: number
  suggestedExpiry: string
  optionType: 'call' | 'put'
  estimatedPremium: number
  targetPremium: number
  stopPremium: number
  contractsFor200: number
  maxProfit: number
  maxLoss: number
  riskReward: number
  gapPct: number
  relativeVolume: number
  momentum1h: number
  catalysts: string[]
  timeOfDayNote: string
  grade: 'A' | 'B' | 'C'
}

const gradeStyle = {
  A: 'bg-green-500 text-black font-black',
  B: 'bg-blue-500 text-white font-bold',
  C: 'bg-gray-600 text-gray-200 font-medium',
}

export default function ZeroDtePage() {
  const [setups, setSetups] = useState<ZeroDteSetup[]>([])
  const [timeNote, setTimeNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [budget, setBudget] = useState(200)
  const [targetProfit, setTargetProfit] = useState(50)
  const [filterGrade, setFilterGrade] = useState<'all' | 'A' | 'B'>('all')
  const [filterTrend, setFilterTrend] = useState<'all' | 'bullish' | 'bearish'>('all')

  const scan = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/zero-dte?budget=${budget}&targetProfit=${targetProfit}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSetups(data.setups)
      setTimeNote(data.timeOfDayNote)
      setScannedAt(data.scannedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }, [budget, targetProfit])

  const filtered = setups
    .filter(s => filterGrade === 'all' || s.grade === filterGrade)
    .filter(s => filterTrend === 'all' || s.trend === filterTrend)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">⚡ 0DTE &amp; Weekly Options Scanner</h1>
          <p className="text-gray-400 mt-1 text-sm">Best same-day and weekly plays based on gap, volume, and momentum. Calibrated to your budget.</p>
        </div>
      </div>

      {/* Time of Day Banner */}
      {timeNote && (
        <div className="bg-blue-950/40 border border-blue-700/40 rounded-xl p-3 mb-4 text-blue-300 text-sm font-medium">
          🕐 {timeNote}
        </div>
      )}

      {/* Budget Config */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase mb-2">Budget per Trade</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase mb-2">Profit Target</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input type="number" value={targetProfit} onChange={e => setTargetProfit(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-gray-500 text-xs">({((targetProfit / budget) * 100).toFixed(0)}% return)</span>
            </div>
          </div>
          <button onClick={scan} disabled={loading} className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 text-black font-bold px-6 py-2.5 rounded-xl transition-colors">
            {loading ? '⟳ Scanning...' : '⚡ Scan Now'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>}

      {/* Filters */}
      {setups.length > 0 && (
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <div className="flex gap-2">
            {(['all', 'A', 'B'] as const).map(g => (
              <button key={g} onClick={() => setFilterGrade(g)} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${filterGrade === g ? (g === 'A' ? 'bg-green-500 text-black' : g === 'B' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {g === 'all' ? `All (${setups.length})` : `Grade ${g} (${setups.filter(s => s.grade === g).length})`}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            {(['all', 'bullish', 'bearish'] as const).map(t => (
              <button key={t} onClick={() => setFilterTrend(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterTrend === t ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {t === 'all' ? 'All' : t === 'bullish' ? '📈 Bullish' : '📉 Bearish'}
              </button>
            ))}
          </div>
        </div>
      )}

      {scannedAt && <div className="text-gray-600 text-xs mb-3">Scanned: {new Date(scannedAt).toLocaleTimeString()} — {filtered.length} setups found</div>}

      {setups.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">⚡</div>
          <div className="font-medium">No setups scanned yet</div>
          <div className="text-sm mt-1">Set your budget and profit target, then click Scan Now</div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((s, i) => {
          const isBull = s.trend === 'bullish'
          const border = isBull ? 'border-green-800/50 bg-green-950/10' : 'border-red-800/50 bg-red-950/10'

          return (
            <div key={i} className={`border rounded-xl p-5 ${border}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black px-2.5 py-1 rounded-lg ${gradeStyle[s.grade]}`}>{s.grade}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white">{s.symbol}</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${isBull ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isBull ? '📈 CALL' : '📉 PUT'}
                      </span>
                      <span className="text-gray-400 text-sm">{s.entryType}</span>
                    </div>
                    <div className="text-gray-400 text-sm">{s.signal}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">${s.spotPrice.toFixed(2)}</div>
                  <div className={`text-sm font-medium ${s.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}% today
                  </div>
                  <div className="text-gray-600 text-xs">{s.relativeVolume}x avg vol</div>
                </div>
              </div>

              {/* Trade Plan */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-800/50">
                  <div className="text-gray-400 text-xs font-bold uppercase mb-3">📋 Trade Setup</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Type:</span> <span className="text-white font-bold">{s.optionType.toUpperCase()} ${s.suggestedStrike} {s.suggestedExpiry}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Entry (midpoint):</span> <span className="text-blue-400 font-bold">${s.estimatedPremium.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Target exit:</span> <span className="text-green-400 font-bold">${s.targetPremium.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Stop loss:</span> <span className="text-red-400 font-bold">${s.stopPremium.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Break-even stock:</span> <span className="text-white">${isBull ? (s.suggestedStrike + s.estimatedPremium).toFixed(2) : (s.suggestedStrike - s.estimatedPremium).toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-800/50">
                  <div className="text-gray-400 text-xs font-bold uppercase mb-3">💰 Position for ${budget}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Contracts:</span> <span className="text-white font-bold">{s.contractsFor200} contract{s.contractsFor200 !== 1 ? 's' : ''}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total cost:</span> <span className="text-white">${(s.contractsFor200 * s.estimatedPremium * 100).toFixed(0)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Max profit:</span> <span className="text-green-400 font-bold">+${s.maxProfit}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Max loss:</span> <span className="text-red-400 font-bold">-${s.maxLoss}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Risk/Reward:</span> <span className={`font-bold ${s.riskReward >= 1.5 ? 'text-green-400' : s.riskReward >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>1:{s.riskReward.toFixed(1)}</span></div>
                  </div>
                </div>
              </div>

              {/* Signal strength bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Signal Strength</span>
                  <span className={`font-bold ${s.signalStrength >= 80 ? 'text-green-400' : s.signalStrength >= 65 ? 'text-blue-400' : 'text-yellow-400'}`}>{s.signalStrength}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${s.signalStrength >= 80 ? 'bg-green-500' : s.signalStrength >= 65 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${s.signalStrength}%` }} />
                </div>
              </div>

              {/* Catalysts */}
              {s.catalysts.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {s.catalysts.map((c, ci) => (
                    <span key={ci} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">⚡ {c}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
