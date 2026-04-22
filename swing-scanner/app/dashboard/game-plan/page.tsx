'use client'
import { useEffect, useState } from 'react'
import type { GamePlanData, TickerScore } from '@/app/api/game-plan/route'
import PageHelp from '@/components/PageHelp'

const HELP = {
  title: "Tomorrow's Game Plan",
  sections: [
    {
      heading: 'How the scanner ranks tickers',
      tips: [
        'Scores 30 liquid tickers across: volume ratio (15%), 5-day momentum (25%), today\'s move (20%), chart pattern (25%), IV suitability (15%).',
        'Grade A+/A tickers have the strongest combined signal across all factors.',
        'Volume ratio > 2x average = institutional activity. This is a strong signal.',
        'The top pick (★) is the highest-confidence setup for tomorrow.',
      ],
    },
    {
      heading: 'Market Bias (Bullish / Bearish / Neutral)',
      tips: [
        'Reads the tape across all 30 scanned tickers to determine overall market direction.',
        'Bullish bias: Favor calls on your top picks.',
        'Bearish bias: Favor puts or sit out if you\'re a beginner.',
        'Neutral: Wait for 10 AM to confirm direction before entering.',
      ],
    },
    {
      heading: 'Entry Windows',
      tips: [
        'PRIME windows (green): 10:00–11:00 AM and 2:00–3:00 PM. Highest win rate, tightest spreads.',
        'AVOID windows (red): 9:30–10:00 AM (opening chaos), 11:30 AM–2:00 PM (lunch chop), 3:30–4:00 PM (theta burn).',
        'Enter only in PRIME windows. If you miss the window, wait for the next one.',
      ],
      link: { label: 'Time of day trading patterns', url: 'https://www.investopedia.com/articles/active-trading/040714/best-time-day-week-month-trade-stocks.asp', source: 'Investopedia' },
    },
    {
      heading: 'Morning Checklist',
      tips: [
        'Check every item before your first trade. If you can\'t check all items, don\'t trade today.',
        'The most important: Is VIX below 25? Is SPY/QQQ trending clearly by 10 AM?',
        'If you have 3 unchecked items, sit out. Forced trades are losing trades.',
      ],
    },
  ],
}

const GRADE_COLOR: Record<string, string> = {
  'A+': 'bg-emerald-500 text-white',
  'A':  'bg-green-500 text-white',
  'B+': 'bg-blue-500 text-white',
  'B':  'bg-blue-400 text-white',
  'C':  'bg-gray-500 text-white',
}

const BIAS_COLOR: Record<string, string> = {
  BULLISH: 'text-emerald-400',
  BEARISH: 'text-red-400',
  NEUTRAL: 'text-yellow-400',
}

const BIAS_BG: Record<string, string> = {
  BULLISH: 'bg-emerald-500/10 border-emerald-500/30',
  BEARISH: 'bg-red-500/10 border-red-500/30',
  NEUTRAL: 'bg-yellow-500/10 border-yellow-500/30',
}

const RISK_COLOR: Record<string, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-red-400',
}

const IMPORTANCE_COLOR: Record<string, string> = {
  HIGH: 'bg-red-500/20 text-red-300 border-red-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  LOW: 'bg-gray-700 text-gray-400 border-gray-600',
}

const WINDOW_STYLE: Record<string, string> = {
  PRIME: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
  GOOD:  'bg-blue-500/10 border-blue-500/40 text-blue-300',
  AVOID: 'bg-red-500/10 border-red-500/30 text-red-400',
}

const WINDOW_BADGE: Record<string, string> = {
  PRIME: 'bg-emerald-500 text-white',
  GOOD:  'bg-blue-500 text-white',
  AVOID: 'bg-red-600 text-white',
}

function fmt(n: number, digits = 2) {
  return n.toFixed(digits)
}

function TickerCard({ t, rank }: { t: TickerScore; rank: number }) {
  const [open, setOpen] = useState(rank === 0)
  return (
    <div className={`rounded-xl border transition-all ${
      rank === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-gray-700 bg-gray-800/50'
    }`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-4 flex items-center gap-4"
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-gray-500 text-sm font-bold w-5">#{rank + 1}</span>
          {rank === 0 && <span className="text-yellow-400 text-lg">★</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-lg">{t.symbol}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${GRADE_COLOR[t.grade]}`}>{t.grade}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${
              t.riskLevel === 'LOW' ? 'border-emerald-500/40 text-emerald-400' :
              t.riskLevel === 'HIGH' ? 'border-red-500/40 text-red-400' :
              'border-yellow-500/40 text-yellow-400'
            }`}>{t.riskLevel} RISK</span>
            <span className="text-xs text-gray-400 italic">{t.pattern}</span>
          </div>
          <div className="text-gray-400 text-sm truncate">{t.companyName}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-white font-bold">${fmt(t.price)}</div>
          <div className={`text-sm font-medium ${t.change1d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {t.change1d >= 0 ? '+' : ''}{fmt(t.change1d)}%
          </div>
        </div>
        <div className="text-right shrink-0 w-16">
          <div className="text-xs text-gray-500 mb-1">SCORE</div>
          <div className="text-white font-bold text-lg">{t.score}</div>
        </div>
        <span className="text-gray-500 text-lg ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-700/50 pt-4 space-y-4">
          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Vol Ratio</div>
              <div className={`text-lg font-bold ${t.volumeRatio >= 1.5 ? 'text-emerald-400' : 'text-white'}`}>
                {fmt(t.volumeRatio)}x
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">5D Momentum</div>
              <div className={`text-lg font-bold ${t.momentum5d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.momentum5d >= 0 ? '+' : ''}{fmt(t.momentum5d)}%
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">IV Rank</div>
              <div className={`text-lg font-bold ${t.ivRank > 60 ? 'text-yellow-400' : 'text-white'}`}>
                {t.ivRank}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Target Move</div>
              <div className="text-lg font-bold text-blue-400">+{fmt(t.targetMove)}%</div>
            </div>
          </div>

          {/* Strategy + entry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="text-xs text-blue-400 font-bold mb-1">SUGGESTED STRATEGY</div>
              <div className="text-white font-bold">{t.suggestedStrategy}</div>
              <div className="text-gray-400 text-sm mt-1">{t.entryNote}</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <div className="text-xs text-emerald-400 font-bold mb-1">OPTIMAL ENTRY TIME</div>
              <div className="text-white font-bold">{t.optimalEntry}</div>
              <div className="text-gray-400 text-sm mt-1">
                Direction: <span className={
                  t.patternDirection === 'bullish' ? 'text-emerald-400' :
                  t.patternDirection === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                }>{t.patternDirection.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Why bullets */}
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-500 font-bold mb-2">WHY THIS TICKER</div>
            <ul className="space-y-1">
              {t.why.map((w, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-blue-400 shrink-0">→</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GamePlanPage() {
  const [data, setData] = useState<GamePlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch('/api/game-plan?limit=5')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function toggleCheck(i: number) {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-400">Scanning {30} tickers and building tomorrow's game plan...</div>
          <div className="text-gray-600 text-sm mt-1">This takes 20–30 seconds</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <div className="text-2xl mb-2">⚠</div>
          <div>{error || 'Failed to load game plan'}</div>
        </div>
      </div>
    )
  }

  const allChecked = checkedItems.size === data.morningChecklist.length

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-xl">🗓</div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tomorrow's Game Plan</h1>
            <div className="text-gray-500 text-sm">
              Auto-generated • {new Date(data.fetchedAt).toLocaleString()} •{' '}
              <span className="text-gray-400">{data.date}</span>
            </div>
          </div>
        </div>
      </div>

      <PageHelp {...HELP} />

      {/* Daily goal bar */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-bold">Daily Goal: ${data.dailyGoal.target} profit</div>
          <div className="text-gray-400 text-sm">Max risk: ${data.dailyGoal.maxRisk}</div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400">{data.dailyGoal.idealTrades}</div>
            <div className="text-xs text-gray-500">Ideal Trades</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{data.dailyGoal.stopAfterLosses}</div>
            <div className="text-xs text-gray-500">Stop After Losses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">${Math.round(data.dailyGoal.target / data.dailyGoal.idealTrades)}</div>
            <div className="text-xs text-gray-500">Per-Trade Target</div>
          </div>
        </div>
      </div>

      {/* Market bias */}
      <div className={`rounded-xl border p-4 ${BIAS_BG[data.marketBias]}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{data.marketBias === 'BULLISH' ? '📈' : data.marketBias === 'BEARISH' ? '📉' : '⚖️'}</span>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase">Tomorrow's Market Bias</div>
            <div className={`text-xl font-bold ${BIAS_COLOR[data.marketBias]}`}>{data.marketBias}</div>
          </div>
        </div>
        <p className="text-gray-300 text-sm">{data.biasReason}</p>
      </div>

      {/* Entry windows */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>⏰</span> Entry Time Windows
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.entryWindows.map(w => (
            <div key={w.time} className={`rounded-lg border p-3 ${WINDOW_STYLE[w.quality]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm font-bold">{w.label}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${WINDOW_BADGE[w.quality]}`}>{w.quality}</span>
              </div>
              <div className="text-xs opacity-70">
                {w.quality === 'PRIME' ? 'Enter here. Direction clear.' : w.quality === 'GOOD' ? 'OK if setup is clean.' : 'Sit out. High risk.'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top picks */}
      <div>
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>🎯</span> Top Tickers for Tomorrow
          <span className="ml-auto text-gray-500 text-sm font-normal">Scored across 30 tickers</span>
        </h2>
        <div className="space-y-3">
          {data.topPicks.map((t, i) => (
            <TickerCard key={t.symbol} t={t} rank={i} />
          ))}
        </div>
      </div>

      {/* Morning checklist */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <span>✅</span> Morning Checklist
          </h2>
          <span className="text-sm text-gray-500">{checkedItems.size}/{data.morningChecklist.length}</span>
        </div>
        {allChecked && (
          <div className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center font-bold">
            Ready to trade! Good luck today.
          </div>
        )}
        <ul className="space-y-2">
          {data.morningChecklist.map((item, i) => (
            <li
              key={i}
              onClick={() => toggleCheck(i)}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                checkedItems.has(i)
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-gray-600 group-hover:border-gray-400'
              }`}>
                {checkedItems.has(i) && <span className="text-xs">✓</span>}
              </div>
              <span className={`text-sm transition-colors ${checkedItems.has(i) ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Macro events */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>📅</span> Key Times to Watch
        </h2>
        <div className="space-y-2">
          {data.macroEvents.map((ev, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-20 shrink-0 text-xs text-gray-500 pt-1">{ev.time}</div>
              <div className="flex-1 text-sm text-gray-300">{ev.event}</div>
              <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${IMPORTANCE_COLOR[ev.importance]}`}>
                {ev.importance}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Wall street rules */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
        <h2 className="text-gray-400 font-bold mb-3 text-sm uppercase tracking-wider">The Golden Rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Never risk more than $60 per day (3 max losses at $20 each)',
            'Stop trading after 3 losing trades — walk away',
            'Take profits at 50–80% of max gain, not 100%',
            'Never average down on a losing options trade',
            'No trades in the 11:30am–2pm lunch dead zone',
            'Know your exit before you enter — always have a stop',
          ].map((rule, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-400">
              <span className="text-gray-600 shrink-0">{i + 1}.</span>
              {rule}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
