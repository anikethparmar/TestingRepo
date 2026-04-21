// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinanceClass = require('yahoo-finance2').default
const yf = new YahooFinanceClass()

const PULSE_SYMBOLS = ['SPY', 'QQQ', 'IWM', 'VIX', 'TLT', 'GLD', 'DXY', 'HYG', '^VIX', '^GSPC', '^IXIC', '^RUT']

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes: Record<string, any> = {}

    for (const sym of ['SPY', 'QQQ', 'IWM', '^VIX', 'TLT', 'GLD', 'HYG', 'DXY']) {
      try {
        quotes[sym] = await yf.quote(sym)
      } catch { /* skip */ }
    }

    const spy = quotes['SPY']
    const qqq = quotes['QQQ']
    const iwm = quotes['IWM']
    const vix = quotes['^VIX']
    const tlt = quotes['TLT']
    const gld = quotes['GLD']
    const hyg = quotes['HYG']

    const spyChg = (spy?.regularMarketChangePercent ?? 0)
    const qqqChg = (qqq?.regularMarketChangePercent ?? 0)
    const iwmChg = (iwm?.regularMarketChangePercent ?? 0)
    const vixPrice = vix?.regularMarketPrice ?? 20
    const vixChg = (vix?.regularMarketChangePercent ?? 0)

    // Fear & Greed (simplified composite)
    let fearGreedScore = 50
    if (spyChg > 0) fearGreedScore += 10
    if (spyChg > 1) fearGreedScore += 5
    if (vixPrice < 15) fearGreedScore += 15
    else if (vixPrice > 30) fearGreedScore -= 25
    else if (vixPrice > 20) fearGreedScore -= 10
    if (vixChg < -5) fearGreedScore += 10
    if (vixChg > 10) fearGreedScore -= 15
    fearGreedScore = Math.max(0, Math.min(100, fearGreedScore))

    const fearGreedLabel =
      fearGreedScore >= 75 ? 'Extreme Greed' :
      fearGreedScore >= 55 ? 'Greed' :
      fearGreedScore >= 45 ? 'Neutral' :
      fearGreedScore >= 25 ? 'Fear' : 'Extreme Fear'

    // Market regime
    const marketTrend =
      spyChg > 0.5 && qqqChg > 0.5 ? 'Risk On — Buy calls on leaders' :
      spyChg < -0.5 && qqqChg < -0.5 ? 'Risk Off — Buy puts or sit out' :
      'Choppy — Wait for clear direction'

    // VIX environment for options
    const vixEnv =
      vixPrice < 15 ? { label: 'LOW VIX', color: 'green', note: 'Options cheap. Good time to BUY premium (long calls/puts)', action: 'BUY OPTIONS' } :
      vixPrice < 20 ? { label: 'NORMAL VIX', color: 'blue', note: 'Normal conditions. Standard options strategies work well', action: 'STANDARD' } :
      vixPrice < 30 ? { label: 'ELEVATED VIX', color: 'yellow', note: 'Options expensive. Consider spreads to reduce premium cost', action: 'USE SPREADS' } :
      { label: 'HIGH VIX (FEAR)', color: 'red', note: 'Very expensive premium. Consider selling options or iron condors', action: 'SELL PREMIUM' }

    // Put/Call ratio estimate (simulated from market action)
    const putCallRatio = vixPrice > 25 ? 1.2 + Math.random() * 0.5 :
                         vixPrice > 18 ? 0.9 + Math.random() * 0.3 :
                         0.6 + Math.random() * 0.3
    const pcrSentiment = putCallRatio > 1.1 ? 'bearish' : putCallRatio < 0.7 ? 'bullish' : 'neutral'

    // Day trading conditions
    const dayTradingScore = Math.round(
      (vixPrice > 15 ? 25 : 10) +
      (Math.abs(spyChg) > 0.5 ? 25 : 10) +
      (spyChg * qqqChg > 0 ? 25 : 5) + // directional agreement
      (Math.abs(vixChg) < 10 ? 25 : 10)
    )
    const dayTradingNote =
      dayTradingScore >= 85 ? 'Excellent conditions — strong trends, good volume' :
      dayTradingScore >= 65 ? 'Good conditions — some clear setups available' :
      dayTradingScore >= 45 ? 'Fair conditions — be selective, wait for A-grade setups only' :
      'Poor conditions — small size or sit out today'

    // Key levels
    const spyPrice = spy?.regularMarketPrice ?? 0
    const spyHigh52 = spy?.fiftyTwoWeekHigh ?? spyPrice * 1.2
    const spyLow52 = spy?.fiftyTwoWeekLow ?? spyPrice * 0.8
    const spyFromHigh = ((spyPrice - spyHigh52) / spyHigh52 * 100).toFixed(1)

    return Response.json({
      indices: {
        SPY: { price: spy?.regularMarketPrice, changePct: spyChg, volume: spy?.regularMarketVolume },
        QQQ: { price: qqq?.regularMarketPrice, changePct: qqqChg, volume: qqq?.regularMarketVolume },
        IWM: { price: iwm?.regularMarketPrice, changePct: iwmChg, volume: iwm?.regularMarketVolume },
      },
      vix: { price: vixPrice, changePct: vixChg, ...vixEnv },
      tlt: { price: tlt?.regularMarketPrice, changePct: tlt?.regularMarketChangePercent ?? 0 },
      gld: { price: gld?.regularMarketPrice, changePct: gld?.regularMarketChangePercent ?? 0 },
      hyg: { price: hyg?.regularMarketPrice, changePct: hyg?.regularMarketChangePercent ?? 0 },
      fearGreed: { score: fearGreedScore, label: fearGreedLabel },
      marketTrend,
      putCallRatio: { value: parseFloat(putCallRatio.toFixed(2)), sentiment: pcrSentiment },
      dayTrading: { score: dayTradingScore, note: dayTradingNote },
      spyLevels: { price: spyPrice, high52: spyHigh52, low52: spyLow52, fromHigh: spyFromHigh },
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
