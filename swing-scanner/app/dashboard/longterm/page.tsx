'use client'
import { useState, useCallback } from 'react'
import PageHelp from '@/components/PageHelp'
import { SECTOR_UNIVERSE, type LongTermSetup } from '@/app/api/longterm/route'

const HELP = {
  title: 'Long-Term Stock Scanner',
  sections: [
    {
      heading: 'What this scanner finds',
      tips: [
        'Pre-profitable or near-profitable companies with strong revenue growth — the kind that could 5–10x over a decade.',
        'Focus is on gross margin quality: a 70%+ gross margin means the business scales without proportional cost increases.',
        'These are NOT short-term trades. Hold timeframe is 3–10 years. Expect volatility.',
        'Best used during market downturns — great companies go on sale when the market panic-sells growth stocks.',
      ],
    },
    {
      heading: 'LT Score explained',
      tips: [
        'Revenue Growth (30 pts): Is the top line expanding fast? >30% YoY earns full marks.',
        'Gross Margin (25 pts): Does the model scale? Software/platform businesses earn more here.',
        'Path to Profitability (25 pts): Profitable earns full marks; EBITDA+ earns 15; Gross Profit+ earns 8.',
        'Analyst Upside (10 pts): Wall Street consensus target vs current price.',
        'Balance Sheet (10 pts): FCF positive or >2 years of cash runway.',
      ],
    },
    {
      heading: 'Rule of 40',
      tips: [
        'A key SaaS/growth metric: Revenue Growth % + FCF Margin % should exceed 40.',
        'Score of 40+ means the company balances growth with efficiency — Wall Street rewards this.',
        'Companies above 60 are considered elite (e.g., early Datadog, Cloudflare).',
        'Below 40 is not disqualifying if they are in high-investment mode — watch the trend.',
      ],
      link: { label: 'Rule of 40 explained', url: 'https://www.bain.com/insights/rule-of-40-software/', source: 'Bain & Company' },
    },
    {
      heading: 'What Wall Street pros also watch',
      tips: [
        'Short interest: >5x days-to-cover means heavy bets against the stock — a catalyst can ignite a squeeze.',
        'Institutional accumulation: funds quietly building positions signals conviction before price moves.',
        'EV/Revenue: how much you pay per dollar of revenue. <10x is reasonable for 30%+ growers.',
        'PEG ratio: P/E divided by growth rate. Under 1.5 on a growth stock is undervalued by traditional metrics.',
      ],
    },
  ],
}

const SECTORS = ['all', ...Object.keys(SECTOR_UNIVERSE)]

const STAGE_COLORS: Record<string, string> = {
  Profitable:       'bg-green-500/20 text-green-400 border-green-700',
  'Near Profitable':'bg-blue-500/20 text-blue-400 border-blue-700',
  'EBITDA+':        'bg-cyan-500/20 text-cyan-400 border-cyan-700',
  'Gross Profit+':  'bg-yellow-500/20 text-yellow-400 border-yellow-700',
  'Pre-Profitable': 'bg-gray-500/20 text-gray-400 border-gray-600',
}

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-green-500 text-black font-black',
  B: 'bg-blue-500 text-white font-bold',
  C: 'bg-gray-600 text-gray-200 font-medium',
}

function fmt(n: number | null, decimals = 1, suffix = ''): string {
  if (n === null) return '—'
  return `${n.toFixed(decimals)}${suffix}`
}

function fmtPct(n: number | null): string {
  if (n === null) return '—'
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`
}

function fmtCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  return `$${n.toFixed(0)}`
}

function fmtFCF(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1e9) return `${n >= 0 ? '+' : ''}$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${n >= 0 ? '+' : ''}$${(n / 1e6).toFixed(0)}M`
  return `${n >= 0 ? '+' : ''}$${n.toFixed(0)}`
}

type SortKey = 'ltScore' | 'revenueGrowth' | 'analystUpside' | 'marketCap'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'ltScore', label: 'LT Score' },
  { value: 'revenueGrowth', label: 'Revenue Growth' },
  { value: 'analystUpside', label: 'Analyst Upside' },
  { value: 'marketCap', label: 'Market Cap' },
]

type StageFilter = 'all' | 'pre' | 'ebitda' | 'profitable'

export default function LongTermPage() {
  const [setups, setSetups] = useState<LongTermSetup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [sector, setSector] = useState('all')
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')
  const [sortBy, setSortBy] = useState<SortKey>('ltScore')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const scan = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/longterm?sector=${encodeURIComponent(sector)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSetups(data.setups)
      setScannedAt(data.scannedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }, [sector])

  function toggleExpand(symbol: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(symbol) ? next.delete(symbol) : next.add(symbol)
      return next
    })
  }

  const filtered = setups
    .filter(s => {
      if (stageFilter === 'pre') return s.profitabilityStage === 'Pre-Profitable' || s.profitabilityStage === 'Gross Profit+'
      if (stageFilter === 'ebitda') return s.profitabilityStage === 'EBITDA+' || s.profitabilityStage === 'Near Profitable'
      if (stageFilter === 'profitable') return s.profitabilityStage === 'Profitable'
      return true
    })
    .sort((a, b) => {
      const av = a[sortBy] ?? -Infinity
      const bv = b[sortBy] ?? -Infinity
      return (bv as number) - (av as number)
    })

  const gradeCount = (g: string) => filtered.filter(s => s.grade === g).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">🌱 Long-Term Growth Scanner</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Find pre-profitable and near-profitable companies with the fundamentals to 5–10x over the next decade.
          Scored using revenue growth, margin quality, path to profitability, analyst targets, and balance sheet strength.
        </p>
      </div>

      <PageHelp {...HELP} />

      {/* Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3 space-y-4">
        {/* Sector tabs */}
        <div>
          <div className="text-gray-400 text-xs font-bold uppercase mb-2">Sector</div>
          <div className="flex flex-wrap gap-1.5">
            {SECTORS.map(s => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                  sector === s
                    ? 'bg-blue-600 text-white border-transparent'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'
                }`}
              >
                {s === 'all' ? 'All Sectors' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Sort + scan row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs font-bold uppercase">Sort by</span>
            <div className="flex gap-1">
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setSortBy(o.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                    sortBy === o.value
                      ? 'bg-gray-600 text-white border-transparent'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={scan}
            disabled={loading}
            className="ml-auto bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 text-black font-bold px-6 py-2.5 rounded-xl transition-colors"
          >
            {loading ? '⟳ Scanning...' : '🌱 Scan Now'}
          </button>
        </div>
      </div>

      {/* Stage filter */}
      {setups.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {(
            [
              { value: 'all', label: `All (${setups.length})` },
              { value: 'pre', label: `Pre / Gross Profit+ (${setups.filter(s => ['Pre-Profitable','Gross Profit+'].includes(s.profitabilityStage)).length})` },
              { value: 'ebitda', label: `EBITDA+ / Near Profitable (${setups.filter(s => ['EBITDA+','Near Profitable'].includes(s.profitabilityStage)).length})` },
              { value: 'profitable', label: `Profitable (${setups.filter(s => s.profitabilityStage === 'Profitable').length})` },
            ] as const
          ).map(f => (
            <button
              key={f.value}
              onClick={() => setStageFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                stageFilter === f.value ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Summary bar */}
      {scannedAt && filtered.length > 0 && (
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <span>Scanned {new Date(scannedAt).toLocaleTimeString()} — {filtered.length} stocks</span>
          <span className="bg-green-950/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full font-bold">
            A: {gradeCount('A')}
          </span>
          <span className="bg-blue-950/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full font-bold">
            B: {gradeCount('B')}
          </span>
          <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full font-bold">
            C: {gradeCount('C')}
          </span>
        </div>
      )}

      {/* Empty / initial state */}
      {!loading && setups.length === 0 && !error && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">🌱</div>
          <div className="font-medium text-gray-400">Ready to scan for long-term growth stocks</div>
          <div className="text-sm mt-1 text-gray-500">
            Select a sector above (or leave on All) and hit Scan Now.
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {filtered.map(s => {
          const isExpanded = expanded.has(s.symbol)
          const stageStyle = STAGE_COLORS[s.profitabilityStage] ?? STAGE_COLORS['Pre-Profitable']

          return (
            <div key={s.symbol} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Card header — always visible */}
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-black px-2.5 py-1 rounded-lg min-w-[36px] text-center ${GRADE_STYLE[s.grade]}`}>
                      {s.grade}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl font-black text-white">{s.symbol}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700 font-medium">
                          {s.sector}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${stageStyle}`}>
                          {s.profitabilityStage}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm truncate max-w-xs">{s.name}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white font-bold text-lg">${s.spotPrice.toFixed(2)}</div>
                    {s.change52w !== null && (
                      <div className={`text-sm font-medium ${s.change52w >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {s.change52w >= 0 ? '+' : ''}{s.change52w.toFixed(1)}% (1Y)
                      </div>
                    )}
                    <div className="text-gray-500 text-xs">{fmtCap(s.marketCap)}</div>
                  </div>
                </div>

                {/* LT Score bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">LT Score</span>
                    <span className={`font-bold ${s.ltScore >= 65 ? 'text-green-400' : s.ltScore >= 45 ? 'text-blue-400' : 'text-gray-400'}`}>
                      {s.ltScore}/100
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.ltScore >= 65 ? 'bg-green-500' : s.ltScore >= 45 ? 'bg-blue-500' : 'bg-gray-500'}`}
                      style={{ width: `${s.ltScore}%` }}
                    />
                  </div>
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-3 gap-2 mb-3 sm:grid-cols-6">
                  {[
                    { label: 'Rev Growth', value: fmtPct(s.revenueGrowth), highlight: (s.revenueGrowth ?? 0) > 0.2 },
                    { label: 'Gross Margin', value: fmtPct(s.grossMargin), highlight: (s.grossMargin ?? 0) > 0.5 },
                    { label: 'EBITDA Margin', value: fmtPct(s.ebitdaMargin), highlight: (s.ebitdaMargin ?? 0) > 0 },
                    { label: 'Analyst Upside', value: s.analystUpside !== null ? `+${(s.analystUpside * 100).toFixed(0)}%` : '—', highlight: (s.analystUpside ?? 0) > 0.25 },
                    { label: 'EV / Revenue', value: s.evToRevenue !== null ? `${s.evToRevenue.toFixed(1)}x` : '—', highlight: false },
                    { label: 'Rule of 40', value: s.rule40 !== null ? `${s.rule40.toFixed(0)}` : '—', highlight: (s.rule40 ?? 0) >= 40 },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-800/60 rounded-lg p-2 text-center">
                      <div className="text-gray-500 text-xs mb-0.5">{m.label}</div>
                      <div className={`text-sm font-bold ${m.highlight ? 'text-white' : 'text-gray-400'}`}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Thesis bullets */}
                {s.thesis.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {s.thesis.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(s.symbol)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? '▲ Less detail' : '▼ More detail (valuation, balance sheet, ownership)'}
                </button>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="border-t border-gray-800 p-4 bg-gray-950/40">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs font-bold uppercase mb-2">Valuation</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Forward P/E</span>
                          <span className="text-white font-medium">{s.forwardPE !== null ? `${s.forwardPE.toFixed(1)}x` : '—'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">PEG Ratio</span>
                          <span className={`font-medium ${s.pegRatio !== null && s.pegRatio < 1.5 ? 'text-green-400' : 'text-white'}`}>
                            {s.pegRatio !== null ? s.pegRatio.toFixed(2) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">EV/Revenue</span>
                          <span className="text-white font-medium">{s.evToRevenue !== null ? `${s.evToRevenue.toFixed(1)}x` : '—'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Analyst target</span>
                          <span className="text-blue-400 font-medium">{s.analystTarget !== null ? `$${s.analystTarget.toFixed(2)}` : '—'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Analysts</span>
                          <span className="text-white font-medium">{s.analystCount !== null ? `${s.analystCount}` : '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 text-xs font-bold uppercase mb-2">Balance Sheet</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Free Cash Flow</span>
                          <span className={`font-medium ${(s.freeCashflow ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {fmtFCF(s.freeCashflow)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Cash on Hand</span>
                          <span className="text-white font-medium">{s.totalCash !== null ? fmtCap(s.totalCash) : '—'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Total Debt</span>
                          <span className={`font-medium ${(s.totalDebt ?? 0) === 0 ? 'text-green-400' : 'text-white'}`}>
                            {s.totalDebt !== null ? fmtCap(s.totalDebt) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Operating Margin</span>
                          <span className={`font-medium ${(s.operatingMargin ?? -1) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {fmtPct(s.operatingMargin)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 text-xs font-bold uppercase mb-2">Ownership & Risk</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Institutional</span>
                          <span className={`font-medium ${(s.institutionalPct ?? 0) > 0.5 ? 'text-green-400' : 'text-white'}`}>
                            {s.institutionalPct !== null ? `${(s.institutionalPct * 100).toFixed(0)}%` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Insider Owned</span>
                          <span className={`font-medium ${(s.insiderPct ?? 0) > 0.1 ? 'text-green-400' : 'text-white'}`}>
                            {s.insiderPct !== null ? `${(s.insiderPct * 100).toFixed(1)}%` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Short Ratio</span>
                          <span className={`font-medium ${(s.shortRatio ?? 0) > 5 ? 'text-yellow-400' : 'text-white'}`}>
                            {s.shortRatio !== null ? `${s.shortRatio.toFixed(1)}x` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Beta</span>
                          <span className="text-white font-medium">{s.beta !== null ? s.beta.toFixed(2) : '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 text-xs font-bold uppercase mb-2">Growth Health</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Rule of 40</span>
                          <span className={`font-bold ${(s.rule40 ?? 0) >= 40 ? 'text-green-400' : (s.rule40 ?? 0) >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {s.rule40 !== null ? s.rule40.toFixed(0) : '—'}
                            {s.rule40 !== null && s.rule40 >= 40 ? ' ✓' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Gross Margin</span>
                          <span className={`font-medium ${(s.grossMargin ?? 0) > 0.5 ? 'text-green-400' : 'text-white'}`}>
                            {fmtPct(s.grossMargin)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">EBITDA Margin</span>
                          <span className={`font-medium ${(s.ebitdaMargin ?? -1) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {fmtPct(s.ebitdaMargin)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Stage</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${stageStyle}`}>
                            {s.profitabilityStage}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length > 0 && (
        <div className="mt-6 text-xs text-gray-600 text-center">
          Data from Yahoo Finance. Fundamental data may lag 24–48h. Not financial advice — do your own research.
        </div>
      )}
    </div>
  )
}
