'use client'
import { useState, useCallback, useEffect } from 'react'
import PageHelp from '@/components/PageHelp'

const HELP = {
  title: '0DTE Scanner',
  sections: [
    {
      heading: 'What is 0DTE?',
      tips: [
        '0DTE = Zero Days to Expiration. Options that expire today.',
        'They are cheap (low premium) but move fast — a 1% stock move can double or zero your option.',
        'Only trade 0DTE if you can watch the screen. They are NOT set-and-forget.',
        'Best 0DTE tickers: SPY, QQQ, SPX — highest liquidity, tightest spreads.',
      ],
      link: { label: '0DTE options explained', url: 'https://www.tastylive.com/learn/0dte-options', source: 'tastylive' },
    },
    {
      heading: 'Grades (A / B / C)',
      tips: [
        'Grade A: 3+ confirming signals (gap + high volume + momentum). Highest probability.',
        'Grade B: 2 confirming signals. Good setups but wait for confirmation.',
        'Grade C: Weak signal. Avoid — risk/reward is not favorable.',
        'As a beginner, trade Grade A only. Never force a Grade C trade.',
      ],
    },
    {
      heading: 'Signal Strength & Entry Type',
      tips: [
        'Gap & Go: Stock gaps up/down at open with above-average volume — momentum trade.',
        'Volume Surge: Unusual volume without a gap — watch for direction confirmation.',
        'Momentum: Strong pre-market move continuing into the open.',
        'Always wait for the 10:00 AM candle to confirm direction before entering.',
      ],
      link: { label: 'Gap trading strategies', url: 'https://www.investopedia.com/articles/trading/05/playinggaps.asp', source: 'Investopedia' },
    },
    {
      heading: 'Position Sizing for $200 Budget',
      tips: [
        'The scanner calculates how many contracts your budget buys at the estimated midpoint premium.',
        'Never spend your entire $200 on one trade — keep 50% as a reserve.',
        'Stop loss is pre-set at 50% of premium paid. Exit immediately if hit.',
        'Target exit is when the premium doubles or reaches 80% of max profit.',
      ],
    },
  ],
}

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

type Sensitivity = 'strict' | 'normal' | 'relaxed'

const SENSITIVITY_PRESETS: Record<Sensitivity, {
  label: string; color: string; badge: string;
  minGap: number; minVolRatio: number; minMomentum: number; minSignal: number;
  desc: string; warning?: string
}> = {
  strict: {
    label: 'Strict', color: 'bg-green-600 text-white', badge: 'bg-green-900/40 text-green-400 border-green-700',
    minGap: 1.5, minVolRatio: 1.5, minMomentum: 0.5, minSignal: 65,
    desc: 'Gap >1.5% · Vol >1.5x · Grade A/B only',
    warning: undefined,
  },
  normal: {
    label: 'Normal', color: 'bg-blue-600 text-white', badge: 'bg-blue-900/40 text-blue-400 border-blue-700',
    minGap: 0.8, minVolRatio: 1.2, minMomentum: 0.3, minSignal: 50,
    desc: 'Gap >0.8% · Vol >1.2x · Grade A/B/C',
    warning: 'Some Grade C setups are lower-probability — confirm with a second signal before trading.',
  },
  relaxed: {
    label: 'Relaxed', color: 'bg-yellow-500 text-black', badge: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
    minGap: 0.3, minVolRatio: 0.8, minMomentum: 0.2, minSignal: 40,
    desc: 'Gap >0.3% · Vol >0.8x · All signals',
    warning: '⚠️ Relaxed mode shows weak setups. Treat these as a watchlist only — do not trade without additional confirmation.',
  },
}

export default function ZeroDtePage() {
  const [setups, setSetups] = useState<ZeroDteSetup[]>([])
  const [timeNote, setTimeNote] = useState('')
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null)
  const [marketWindow, setMarketWindow] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [budget, setBudget] = useState(200)
  const [targetProfit, setTargetProfit] = useState(50)
  const [sensitivity, setSensitivity] = useState<Sensitivity>('normal')
  const [filterGrade, setFilterGrade] = useState<'all' | 'A' | 'B'>('all')
  const [filterTrend, setFilterTrend] = useState<'all' | 'bullish' | 'bearish'>('all')

  // Auto-scan on mount with default budget
  useEffect(() => { scan() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scan = useCallback(async () => {
    setLoading(true)
    setError(null)
    const preset = SENSITIVITY_PRESETS[sensitivity]
    try {
      const params = new URLSearchParams({
        budget: String(budget),
        targetProfit: String(targetProfit),
        minGap: String(preset.minGap),
        minVolRatio: String(preset.minVolRatio),
        minMomentum: String(preset.minMomentum),
      })
      const res = await fetch(`/api/zero-dte?${params}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSetups(data.setups)
      setTimeNote(data.timeOfDayNote)
      setMarketOpen(data.marketOpen ?? true)
      setMarketWindow(data.marketWindow ?? '')
      setScannedAt(data.scannedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }, [budget, targetProfit, sensitivity])

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

      <PageHelp {...HELP} />

      {/* Time of Day Banner */}
      {timeNote && (
        <div className="bg-blue-950/40 border border-blue-700/40 rounded-xl p-3 mb-4 text-blue-300 text-sm font-medium">
          🕐 {timeNote}
        </div>
      )}

      {/* Budget Config */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3">
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

      {/* Scanner Sensitivity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <div className="text-gray-400 text-xs font-bold uppercase mb-3">Scanner Sensitivity</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(Object.entries(SENSITIVITY_PRESETS) as [Sensitivity, typeof SENSITIVITY_PRESETS[Sensitivity]][]).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setSensitivity(key)}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-colors border-2 ${
                sensitivity === key
                  ? `${preset.color} border-transparent`
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
              }`}
            >
              {key === 'strict' ? '🎯' : key === 'normal' ? '⚖️' : '🔓'} {preset.label}
            </button>
          ))}
        </div>
        <div className={`text-xs px-3 py-2 rounded-lg border ${SENSITIVITY_PRESETS[sensitivity].badge}`}>
          <span className="font-bold">{SENSITIVITY_PRESETS[sensitivity].label}:</span>{' '}
          {SENSITIVITY_PRESETS[sensitivity].desc}
        </div>
        {SENSITIVITY_PRESETS[sensitivity].warning && (
          <div className="mt-2 text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-800/40 rounded-lg px-3 py-2">
            {SENSITIVITY_PRESETS[sensitivity].warning}
          </div>
        )}
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

      {scannedAt && marketOpen && (
        <div className="flex items-center gap-3 mb-3">
          <div className="text-gray-600 text-xs">Scanned: {new Date(scannedAt).toLocaleTimeString()} — {filtered.length} setups found</div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${SENSITIVITY_PRESETS[sensitivity].badge}`}>
            {sensitivity === 'strict' ? '🎯' : sensitivity === 'normal' ? '⚖️' : '🔓'} {SENSITIVITY_PRESETS[sensitivity].label} mode
          </span>
        </div>
      )}

      {/* Market closed state */}
      {marketOpen === false && !loading && (
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-6 sm:p-8 text-center">
          <div className="text-4xl mb-3">🌙</div>
          <h2 className="text-white font-bold text-lg mb-2">Market is Closed</h2>
          <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
            The 0DTE scanner needs live market data — volume, intraday momentum, and real-time gaps.
            It runs during market hours: <span className="text-white font-medium">9:30 AM – 4:00 PM ET, Mon–Fri.</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-6 text-sm">
            {[
              { time: '9:30–10:00 AM', label: 'Avoid — opening chaos', color: 'text-red-400' },
              { time: '10:00–11:00 AM', label: 'PRIME — best window', color: 'text-green-400' },
              { time: '11:00 AM–2:00 PM', label: 'Avoid — lunch chop', color: 'text-red-400' },
              { time: '2:00–3:00 PM', label: 'PRIME — afternoon run', color: 'text-green-400' },
              { time: '3:00–3:30 PM', label: 'Caution — theta risk', color: 'text-yellow-400' },
              { time: '3:30–4:00 PM', label: 'Avoid — close all positions', color: 'text-red-400' },
            ].map(w => (
              <div key={w.time} className="bg-gray-800 rounded-lg p-2.5">
                <div className="text-gray-400 text-xs">{w.time}</div>
                <div className={`text-xs font-medium ${w.color}`}>{w.label}</div>
              </div>
            ))}
          </div>
          <div className="text-gray-500 text-sm">
            While you wait:{' '}
            <a href="/dashboard/game-plan" className="text-blue-400 hover:text-blue-300">Run Tomorrow&apos;s Game Plan →</a>
            {' '}or{' '}
            <a href="/dashboard/journal" className="text-blue-400 hover:text-blue-300">review your Trade Journal →</a>
          </div>
        </div>
      )}

      {/* No setups found during market hours */}
      {marketOpen === true && setups.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-600">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-medium text-gray-400">No qualifying setups found</div>
          <div className="text-sm mt-1 mb-4">
            Nothing passed the <span className="font-semibold text-gray-300">{SENSITIVITY_PRESETS[sensitivity].label}</span> filter ({SENSITIVITY_PRESETS[sensitivity].desc}).
          </div>
          {sensitivity !== 'relaxed' && (
            <button
              onClick={() => setSensitivity(sensitivity === 'strict' ? 'normal' : 'relaxed')}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Try {sensitivity === 'strict' ? 'Normal' : 'Relaxed'} mode →
            </button>
          )}
          {sensitivity === 'relaxed' && (
            <div className="text-sm text-gray-500">Market is quiet — no strong setups today. Come back during Power Hour (10–11 AM ET).</div>
          )}
        </div>
      )}

      {/* Initial loading state before first scan result */}
      {marketOpen === null && setups.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">⚡</div>
          <div className="font-medium">Scanning markets...</div>
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
