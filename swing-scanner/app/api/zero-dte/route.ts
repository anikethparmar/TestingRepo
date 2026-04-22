import { NextRequest } from 'next/server'
import { fetchOHLCV } from '@/lib/yahoo'

// Best 0DTE candidates — liquid, high-volume options
const ZERO_DTE_UNIVERSE = [
  'SPY', 'QQQ', 'IWM', 'AAPL', 'TSLA', 'NVDA', 'AMZN', 'META', 'GOOGL', 'MSFT',
  'AMD', 'NFLX', 'COIN', 'MSTR', 'PLTR', 'ARM', 'SMCI', 'MU', 'AVGO', 'BABA',
  'SPX', 'NDX', 'RUT',
]

export interface ZeroDteSetup {
  symbol: string
  name: string
  spotPrice: number
  changePct: number
  volume: number
  avgVolume: number
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

function getMarketStatus(): { open: boolean; note: string; window: 'prime' | 'ok' | 'avoid' | 'closed' | 'premarket' } {
  const now = new Date()
  // Use Intl to get proper ET (handles EST/EDT DST automatically)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false,
  }).formatToParts(now)
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0')
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0')
  const weekday = parts.find(p => p.type === 'weekday')?.value ?? 'Mon'
  const etMinutes = hour * 60 + minute
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const dow = dowMap[weekday] ?? 1
  const isWeekend = dow === 0 || dow === 6

  if (isWeekend) return { open: false, window: 'closed', note: 'Market closed (weekend). Use Tomorrow\'s Game Plan to prep for Monday.' }

  const marketOpen = 9 * 60 + 30
  const marketClose = 16 * 60

  if (etMinutes < 4 * 60) return { open: false, window: 'closed', note: 'Market closed overnight. Check back at 9:30 AM ET.' }
  if (etMinutes < marketOpen) return { open: false, window: 'premarket', note: 'Pre-market: Wait for 9:45 AM to trade — let price discovery settle.' }
  if (etMinutes < marketOpen + 30) return { open: true, window: 'avoid', note: '⚠️ First 30 min: HIGH volatility, wide spreads — wait unless gapping hard.' }
  if (etMinutes < marketOpen + 90) return { open: true, window: 'prime', note: '✅ PRIME TIME (10–11 AM): Best entries. Trend established, spreads tight.' }
  if (etMinutes < marketOpen + 270) return { open: true, window: 'avoid', note: '⚡ Mid-day chop zone — only trade breakouts with strong volume.' }
  if (etMinutes < marketClose - 60) return { open: true, window: 'prime', note: '✅ PRIME TIME (2–3 PM): Afternoon trend resumes. Strong setups here.' }
  if (etMinutes < marketClose - 30) return { open: true, window: 'ok', note: '⚠️ 3:00 PM: Theta burns fast — only hold if strongly in profit.' }
  if (etMinutes < marketClose) return { open: true, window: 'avoid', note: '🚨 Final 30 min: 0DTE theta destruction — exit all positions now.' }
  return { open: false, window: 'closed', note: 'Market closed. Review trades in the Journal, then run Tomorrow\'s Game Plan.' }
}

export async function GET(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const yf = new (require('yahoo-finance2').default)()
  const sp = request.nextUrl.searchParams
  const budget = Number(sp.get('budget') ?? 200)
  const targetProfit = Number(sp.get('targetProfit') ?? 50)
  // Sensitivity thresholds passed from UI preset
  const minGap = Number(sp.get('minGap') ?? 0.8)
  const minVolRatio = Number(sp.get('minVolRatio') ?? 1.2)
  const minMomentum = Number(sp.get('minMomentum') ?? 0.3)

  const today = new Date().toISOString().split('T')[0]
  const marketStatus = getMarketStatus()

  // When market is closed, return early with helpful status
  if (!marketStatus.open) {
    return Response.json({
      setups: [],
      timeOfDayNote: marketStatus.note,
      marketOpen: false,
      marketWindow: marketStatus.window,
      scannedAt: new Date().toISOString(),
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function scanSymbol(symbol: string): Promise<ZeroDteSetup | null> {
    const [quote, bars] = await Promise.all([
      yf.quote(symbol) as Promise<any>,
      fetchOHLCV(symbol, 10),
    ])

    if (!quote || !quote.regularMarketPrice) return null

    const spot = quote.regularMarketPrice
    const prevClose = quote.regularMarketPreviousClose ?? spot
    const changePct = ((spot - prevClose) / prevClose) * 100
    const volume = quote.regularMarketVolume ?? 0
    const avgVolume = quote.averageDailyVolume3Month ?? 1
    const volRatio = volume / avgVolume

    if (volRatio < 0.3) return null

    const closes = bars.map((b: { close: number }) => b.close)
    const momentum1h = closes.length >= 5
      ? ((closes[closes.length - 1] - closes[closes.length - 5]) / closes[closes.length - 5]) * 100
      : 0

    const gapPct = changePct
    const isGapUp = gapPct > minGap
    const isGapDown = gapPct < -minGap
    const isHighVol = volRatio > minVolRatio
    const isMomentumUp = momentum1h > minMomentum
    const isMomentumDown = momentum1h < -minMomentum
    const isAnyMove = Math.abs(gapPct) > minGap * 0.4

    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    let signal = ''
    let signalStrength = 0
    let entryType = ''
    let optionType: 'call' | 'put' = 'call'

    if (isGapUp && isHighVol && isMomentumUp) {
      trend = 'bullish'; signal = 'Gap Up + Volume Surge + Momentum'; signalStrength = 90; entryType = 'Gap & Go'; optionType = 'call'
    } else if (isGapDown && isHighVol && isMomentumDown) {
      trend = 'bearish'; signal = 'Gap Down + Volume Surge + Momentum'; signalStrength = 90; entryType = 'Gap & Go'; optionType = 'put'
    } else if (isGapUp && isHighVol) {
      trend = 'bullish'; signal = 'Gap Up + High Volume'; signalStrength = 75; entryType = 'Gap & Go'; optionType = 'call'
    } else if (isGapDown && isHighVol) {
      trend = 'bearish'; signal = 'Gap Down + High Volume'; signalStrength = 75; entryType = 'Gap & Go'; optionType = 'put'
    } else if (isHighVol && isMomentumUp) {
      trend = 'bullish'; signal = 'Volume Surge + Upward Momentum'; signalStrength = 65; entryType = 'Momentum'; optionType = 'call'
    } else if (isHighVol && isMomentumDown) {
      trend = 'bearish'; signal = 'Volume Surge + Downward Momentum'; signalStrength = 65; entryType = 'Momentum'; optionType = 'put'
    } else if (isGapUp && isMomentumUp) {
      trend = 'bullish'; signal = 'Gap Up + Bullish Momentum'; signalStrength = 60; entryType = 'Trend'; optionType = 'call'
    } else if (isGapDown && isMomentumDown) {
      trend = 'bearish'; signal = 'Gap Down + Bearish Momentum'; signalStrength = 60; entryType = 'Trend'; optionType = 'put'
    } else if (isAnyMove && isHighVol) {
      trend = gapPct > 0 ? 'bullish' : 'bearish'
      signal = `${gapPct > 0 ? 'Bullish' : 'Bearish'} move + volume`
      signalStrength = 55; entryType = 'Trend'; optionType = gapPct > 0 ? 'call' : 'put'
    } else if (isGapUp || isGapDown) {
      trend = gapPct > 0 ? 'bullish' : 'bearish'
      signal = `${gapPct > 0 ? 'Gap Up' : 'Gap Down'} ${Math.abs(gapPct).toFixed(1)}%`
      signalStrength = 50; entryType = 'Gap Watch'; optionType = gapPct > 0 ? 'call' : 'put'
    } else {
      return null
    }

    const otmOffset = spot * 0.005
    const suggestedStrike = optionType === 'call'
      ? Math.ceil((spot + otmOffset) / (spot > 100 ? 1 : 0.5)) * (spot > 100 ? 1 : 0.5)
      : Math.floor((spot - otmOffset) / (spot > 100 ? 1 : 0.5)) * (spot > 100 ? 1 : 0.5)

    const ivEst = 0.25
    const premiumEst = spot * ivEst * Math.sqrt(0.5 / 365)
    const estimatedPremium = Math.max(0.05, parseFloat((premiumEst * (optionType === 'call' ? 1 : 0.9)).toFixed(2)))

    const contractsFor200 = Math.floor(budget / (estimatedPremium * 100))
    const maxLoss = contractsFor200 * estimatedPremium * 100
    const targetPremium = parseFloat((estimatedPremium * (1 + targetProfit / maxLoss)).toFixed(2))
    const stopPremium = parseFloat((estimatedPremium * 0.5).toFixed(2))
    const maxProfit = contractsFor200 * (targetPremium - estimatedPremium) * 100
    const riskReward = maxProfit / maxLoss

    const catalysts: string[] = []
    if (isGapUp || isGapDown) catalysts.push(`Gap ${gapPct > 0 ? 'up' : 'down'} ${Math.abs(gapPct).toFixed(1)}%`)
    if (isHighVol) catalysts.push(`${volRatio.toFixed(1)}x average volume`)
    if (quote.earningsTimestamp) {
      const daysToEarnings = Math.ceil((new Date(quote.earningsTimestamp * 1000).getTime() - Date.now()) / 86400000)
      if (daysToEarnings >= 0 && daysToEarnings <= 5) catalysts.push(`Earnings in ${daysToEarnings} days`)
    }

    const grade: 'A' | 'B' | 'C' = signalStrength >= 80 ? 'A' : signalStrength >= 65 ? 'B' : 'C'

    return {
      symbol,
      name: quote.longName ?? quote.shortName ?? symbol,
      spotPrice: parseFloat(spot.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(2)),
      volume,
      avgVolume,
      volRatio: parseFloat(volRatio.toFixed(1)),
      trend,
      signal,
      signalStrength,
      entryType,
      suggestedStrike,
      suggestedExpiry: today,
      optionType,
      estimatedPremium,
      targetPremium,
      stopPremium,
      contractsFor200,
      maxProfit: parseFloat(maxProfit.toFixed(0)),
      maxLoss: parseFloat(maxLoss.toFixed(0)),
      riskReward: parseFloat(riskReward.toFixed(2)),
      gapPct: parseFloat(gapPct.toFixed(2)),
      relativeVolume: parseFloat(volRatio.toFixed(1)),
      momentum1h: parseFloat(momentum1h.toFixed(2)),
      catalysts,
      timeOfDayNote: marketStatus.note,
      grade,
    }
  }

  const results = await Promise.allSettled(ZERO_DTE_UNIVERSE.map(scanSymbol))
  const setups = results
    .filter((r): r is PromiseFulfilledResult<ZeroDteSetup> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)

  setups.sort((a, b) => b.signalStrength - a.signalStrength)
  return Response.json({
    setups: setups.slice(0, 15),
    timeOfDayNote: marketStatus.note,
    marketOpen: true,
    marketWindow: marketStatus.window,
    scannedAt: new Date().toISOString(),
  })
}
