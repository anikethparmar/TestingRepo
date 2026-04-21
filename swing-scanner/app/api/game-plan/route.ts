import { NextRequest } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinanceClass = require('yahoo-finance2').default
const yf = new YahooFinanceClass()

const SCAN_UNIVERSE = [
  'SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN', 'MSFT', 'GOOGL',
  'NFLX', 'CRM', 'SHOP', 'SQ', 'COIN', 'PLTR', 'RBLX', 'SNAP', 'UBER', 'LYFT',
  'SOFI', 'HOOD', 'MARA', 'RIOT', 'SMCI', 'ARM', 'AVGO', 'MU', 'INTC', 'TSM',
]

export interface TickerScore {
  symbol: string
  companyName: string
  score: number               // 0-100 composite score
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C'
  price: number
  change1d: number            // % change today
  volume: number
  avgVolume: number
  volumeRatio: number         // volume / avgVolume
  momentum5d: number          // 5-day return %
  momentum20d: number         // 20-day return %
  pattern: string             // detected pattern name
  patternDirection: 'bullish' | 'bearish' | 'neutral'
  hasEarningsNextWeek: boolean
  ivRank: number              // 0-100 estimated IV rank
  suggestedStrategy: string
  entryNote: string
  targetMove: number          // expected % move
  optimalEntry: string        // "10:00–11:00 AM" etc.
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  why: string[]               // bullet reasons
}

export interface GamePlanData {
  date: string
  marketBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  biasReason: string
  topPicks: TickerScore[]
  macroEvents: { time: string; event: string; importance: 'HIGH' | 'MEDIUM' | 'LOW' }[]
  morningChecklist: string[]
  entryWindows: { label: string; time: string; quality: 'PRIME' | 'GOOD' | 'AVOID' }[]
  dailyGoal: { target: number; maxRisk: number; idealTrades: number; stopAfterLosses: number }
  fetchedAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectSimplePattern(bars: any[]): { name: string; direction: 'bullish' | 'bearish' | 'neutral' } {
  if (bars.length < 10) return { name: 'Insufficient Data', direction: 'neutral' }

  const recent = bars.slice(-10)
  const closes = recent.map((b: { close: number }) => b.close)
  const highs = recent.map((b: { high: number }) => b.high)
  const lows = recent.map((b: { low: number }) => b.low)
  const volumes = recent.map((b: { volume: number }) => b.volume ?? 0)

  const last = closes[closes.length - 1]
  const prev = closes[closes.length - 2]
  const avgVol = volumes.slice(0, -1).reduce((a: number, b: number) => a + b, 0) / (volumes.length - 1)
  const lastVol = volumes[volumes.length - 1]

  // Golden Cross: SMA5 > SMA10
  const sma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5
  const sma10 = closes.reduce((a, b) => a + b, 0) / closes.length
  if (sma5 > sma10 * 1.005) return { name: 'Golden Cross', direction: 'bullish' }

  // Bull Flag: 3 higher closes + volume surge
  const last3Up = closes[7] < closes[8] && closes[8] < closes[9]
  if (last3Up && lastVol > avgVol * 1.5) return { name: 'Bull Flag', direction: 'bullish' }

  // Double Bottom: two similar lows in window
  const sortedLows = [...lows].sort((a, b) => a - b)
  if (Math.abs(sortedLows[0] - sortedLows[1]) / sortedLows[0] < 0.01 && last > prev)
    return { name: 'Double Bottom', direction: 'bullish' }

  // Death Cross: SMA5 < SMA10
  if (sma5 < sma10 * 0.995) return { name: 'Death Cross', direction: 'bearish' }

  // Bear Flag: 3 lower closes + volume surge
  const last3Down = closes[7] > closes[8] && closes[8] > closes[9]
  if (last3Down && lastVol > avgVol * 1.5) return { name: 'Bear Flag', direction: 'bearish' }

  // Double Top
  const sortedHighs = [...highs].sort((a, b) => b - a)
  if (Math.abs(sortedHighs[0] - sortedHighs[1]) / sortedHighs[0] < 0.01 && last < prev)
    return { name: 'Double Top', direction: 'bearish' }

  // Momentum
  if (sma5 > sma10) return { name: 'Uptrend Momentum', direction: 'bullish' }
  if (sma5 < sma10) return { name: 'Downtrend Momentum', direction: 'bearish' }

  return { name: 'Consolidation', direction: 'neutral' }
}

function scoreToGrade(score: number): TickerScore['grade'] {
  if (score >= 85) return 'A+'
  if (score >= 75) return 'A'
  if (score >= 65) return 'B+'
  if (score >= 55) return 'B'
  return 'C'
}

function suggestStrategy(pattern: string, ivRank: number, direction: string): string {
  if (direction === 'bearish') {
    if (ivRank > 60) return 'Bear Call Spread (sell high IV)'
    return 'Put Debit Spread'
  }
  if (ivRank > 70) return 'Bull Put Spread (sell premium)'
  if (ivRank > 40) return 'Call Debit Spread'
  if (pattern === 'Bull Flag' || pattern === 'Golden Cross') return 'Call Debit Spread (momentum)'
  return 'Call Debit Spread'
}

function riskLevel(volumeRatio: number, ivRank: number, momentum: number): TickerScore['riskLevel'] {
  const highRisk = ivRank > 80 || Math.abs(momentum) > 15 || volumeRatio > 4
  const lowRisk = ivRank < 40 && Math.abs(momentum) < 5 && volumeRatio < 2
  if (highRisk) return 'HIGH'
  if (lowRisk) return 'LOW'
  return 'MEDIUM'
}

function optimalEntry(direction: string): string {
  if (direction === 'bullish') return '10:00–11:00 AM (confirm morning momentum)'
  if (direction === 'bearish') return '10:00–10:30 AM (confirm gap-down continuation)'
  return '2:00–2:30 PM (afternoon breakout confirmation)'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scoreTicker(symbol: string): Promise<TickerScore | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await yf.quote(symbol)
    if (!quote || !quote.regularMarketPrice) return null

    const price = quote.regularMarketPrice ?? 0
    const change1d = quote.regularMarketChangePercent ?? 0
    const volume = quote.regularMarketVolume ?? 0
    const avgVolume = quote.averageDailyVolume10Day ?? quote.averageDailyVolume3Month ?? 1
    const volumeRatio = avgVolume > 0 ? volume / avgVolume : 1
    const companyName = quote.shortName ?? quote.longName ?? symbol

    // Fetch 30d daily bars for pattern detection
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartData: any = await yf.chart(symbol, { period1: start, period2: end, interval: '1d' })
    const bars = (chartData.quotes ?? []).filter((q: { close: number }) => q.close > 0)

    const closes = bars.map((b: { close: number }) => b.close)
    const momentum5d = closes.length >= 5
      ? ((closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6]) * 100
      : 0
    const momentum20d = closes.length >= 20
      ? ((closes[closes.length - 1] - closes[closes.length - 21]) / closes[closes.length - 21]) * 100
      : 0

    const pattern = detectSimplePattern(bars)

    // Estimate IV rank from 52-week high/low if available
    const w52high = quote.fiftyTwoWeekHigh ?? price * 1.3
    const w52low = quote.fiftyTwoWeekLow ?? price * 0.7
    const priceInRange = w52high > w52low ? (price - w52low) / (w52high - w52low) : 0.5
    const ivRank = Math.round(priceInRange * 100)

    // Scoring weights: volume (15%), momentum5d (15%), momentum20d (10%), pattern (25%), change1d (20%), ivRank suitability (15%)
    const volumeScore = Math.min(100, volumeRatio * 25)  // 4x avg vol = 100
    const momentumScore = Math.min(100, Math.max(0, 50 + momentum5d * 5))  // centered on 0
    const patternScore = pattern.direction === 'bullish' ? 80 : pattern.direction === 'bearish' ? 60 : 40
    const changeScore = Math.min(100, Math.max(0, 50 + change1d * 5))
    const ivScore = ivRank > 30 && ivRank < 80 ? 80 : 50  // sweet spot for options

    const score = Math.round(
      volumeScore * 0.15 +
      momentumScore * 0.25 +
      changeScore * 0.20 +
      patternScore * 0.25 +
      ivScore * 0.15
    )

    const why: string[] = []
    if (volumeRatio > 1.5) why.push(`Volume ${volumeRatio.toFixed(1)}x above average — institutional activity`)
    if (Math.abs(change1d) > 2) why.push(`${change1d > 0 ? '+' : ''}${change1d.toFixed(1)}% today — strong directional move`)
    if (pattern.direction !== 'neutral') why.push(`${pattern.name} pattern detected on daily chart`)
    if (Math.abs(momentum5d) > 3) why.push(`${momentum5d > 0 ? '+' : ''}${momentum5d.toFixed(1)}% over 5 days — trend has legs`)
    if (ivRank > 50) why.push(`IV at ${ivRank}% of yearly range — options have juice`)
    if (why.length === 0) why.push('Mixed signals — watch for confirmation before entry')

    const targetMove = Math.max(2, Math.abs(momentum5d) * 0.4 + Math.abs(change1d) * 0.3 + 1.5)

    return {
      symbol,
      companyName,
      score,
      grade: scoreToGrade(score),
      price,
      change1d: parseFloat(change1d.toFixed(2)),
      volume,
      avgVolume,
      volumeRatio: parseFloat(volumeRatio.toFixed(2)),
      momentum5d: parseFloat(momentum5d.toFixed(2)),
      momentum20d: parseFloat(momentum20d.toFixed(2)),
      pattern: pattern.name,
      patternDirection: pattern.direction,
      hasEarningsNextWeek: false, // would need earnings calendar API
      ivRank,
      suggestedStrategy: suggestStrategy(pattern.name, ivRank, pattern.direction),
      entryNote: `Wait for ${pattern.direction === 'bullish' ? 'pullback to support or breakout confirmation' : pattern.direction === 'bearish' ? 'bounce rejection or breakdown' : 'directional break'} before entry.`,
      targetMove: parseFloat(targetMove.toFixed(1)),
      optimalEntry: optimalEntry(pattern.direction),
      riskLevel: riskLevel(volumeRatio, ivRank, momentum5d),
      why,
    }
  } catch {
    return null
  }
}

function marketBias(tickers: TickerScore[]): { bias: GamePlanData['marketBias']; reason: string } {
  const bullish = tickers.filter(t => t.patternDirection === 'bullish').length
  const bearish = tickers.filter(t => t.patternDirection === 'bearish').length
  const avgChange = tickers.reduce((s, t) => s + t.change1d, 0) / tickers.length

  if (bullish > bearish * 1.5 || avgChange > 1) {
    return { bias: 'BULLISH', reason: `${bullish}/${tickers.length} tickers showing bullish patterns. Average move +${avgChange.toFixed(2)}% today. Favor long setups and call spreads.` }
  }
  if (bearish > bullish * 1.5 || avgChange < -1) {
    return { bias: 'BEARISH', reason: `${bearish}/${tickers.length} tickers showing bearish patterns. Average move ${avgChange.toFixed(2)}% today. Favor put spreads and short setups.` }
  }
  return { bias: 'NEUTRAL', reason: `Mixed signals across the tape. ${bullish} bullish, ${bearish} bearish patterns. Wait for clearer direction after 10am open.` }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const limit = parseInt(sp.get('limit') ?? '5')

  try {
    // Score all tickers in parallel (batched)
    const results = await Promise.all(SCAN_UNIVERSE.map(sym => scoreTicker(sym)))
    const valid = results.filter(Boolean) as TickerScore[]

    // Sort by score descending, take top N
    const sorted = valid.sort((a, b) => b.score - a.score)
    const topPicks = sorted.slice(0, limit)

    const { bias, reason } = marketBias(valid)

    const morningChecklist = [
      'Check pre-market SPY/QQQ gap direction',
      'Review any overnight news or earnings on your watchlist',
      'Note VIX level — below 20 favors spreads, above 25 favors premium selling',
      'Set your max daily loss at $60 (3 losing trades max)',
      'Do NOT trade the first 30 minutes (9:30–10:00) — wait for direction',
      'Enter only at the 10:00–10:30 or 2:00–2:30 windows',
      'Write down your target ticker and strategy BEFORE the bell',
      'Have your strike and expiry picked from Options Chain view',
    ]

    const entryWindows = [
      { label: '9:30–10:00 AM', time: '9:30', quality: 'AVOID' as const },
      { label: '10:00–11:00 AM', time: '10:00', quality: 'PRIME' as const },
      { label: '11:00 AM–2:00 PM', time: '11:00', quality: 'AVOID' as const },
      { label: '2:00–3:00 PM', time: '14:00', quality: 'PRIME' as const },
      { label: '3:00–3:30 PM', time: '15:00', quality: 'AVOID' as const },
      { label: '3:30–4:00 PM', time: '15:30', quality: 'AVOID' as const },
    ]

    const macroEvents = [
      { time: 'Pre-Market', event: 'Check for Fed speakers or CPI/PPI releases', importance: 'HIGH' as const },
      { time: '9:30 AM', event: 'Market open — watch SPY first 5 min candle direction', importance: 'HIGH' as const },
      { time: '10:00 AM', event: 'ISM or economic data often released — check calendar', importance: 'MEDIUM' as const },
      { time: '2:00 PM', event: 'Fed minutes or FOMC often at 2pm ET — watch for spikes', importance: 'HIGH' as const },
      { time: '3:00 PM', event: '0DTE theta accelerates — reduce position size', importance: 'MEDIUM' as const },
      { time: '3:30 PM', event: 'CLOSE all 0DTE positions — no exceptions', importance: 'HIGH' as const },
    ]

    const result: GamePlanData = {
      date: new Date().toISOString().split('T')[0],
      marketBias: bias,
      biasReason: reason,
      topPicks,
      macroEvents,
      morningChecklist,
      entryWindows,
      dailyGoal: {
        target: 50,
        maxRisk: 200,
        idealTrades: 2,
        stopAfterLosses: 3,
      },
      fetchedAt: new Date().toISOString(),
    }

    return Response.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
