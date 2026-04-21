import { NextRequest } from 'next/server'

interface MarketEvent {
  date: string
  event: string
  category: 'FOMC' | 'Inflation' | 'Jobs' | 'GDP' | 'Options' | 'Earnings' | 'Holiday'
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  prediction?: string
  analysis: string
  tradingAngle: string
}

function getUpcomingEvents(): MarketEvent[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Known 2025-2026 schedule — key macro events
  const events: MarketEvent[] = [
    // FOMC Meetings
    { date: '2025-05-07', event: 'FOMC Rate Decision', category: 'FOMC', impact: 'HIGH', prediction: 'Hold at 4.25-4.50%', analysis: 'Fed likely to hold as they monitor inflation progress. Watch for hawkish/dovish language shift.', tradingAngle: 'Buy VIX puts before if calm. Sell vol after decision. Watch XLF, TLT reaction.' },
    { date: '2025-06-18', event: 'FOMC Rate Decision', category: 'FOMC', impact: 'HIGH', prediction: 'Possible 25bp cut', analysis: 'June cut is 60% priced in by markets. Any surprise would cause sharp moves.', tradingAngle: 'Long TLT if cut expected. Buy rate-sensitive sectors (XLF, XLRE) in anticipation.' },
    { date: '2025-07-30', event: 'FOMC Rate Decision', category: 'FOMC', impact: 'HIGH', prediction: 'Data-dependent', analysis: 'Mid-summer meeting — outcome driven by June CPI and jobs data.', tradingAngle: 'Straddle play on SPY or QQQ into the decision if IV is cheap.' },
    { date: '2025-09-17', event: 'FOMC Rate Decision', category: 'FOMC', impact: 'HIGH', prediction: 'Data-dependent', analysis: 'Summer data will shape this. Major inflection point for 2H 2025.', tradingAngle: 'Key meeting for fall rally setup. Watch bond market for leading signal.' },
    { date: '2025-11-05', event: 'FOMC Rate Decision', category: 'FOMC', impact: 'HIGH', prediction: 'Data-dependent', analysis: 'Post-election FOMC (if Nov 2024 pattern repeats). High political sensitivity.', tradingAngle: 'Position after clarity on economic trajectory. Bonds vs equities rotation play.' },
    { date: '2025-12-17', event: 'FOMC Rate Decision + SEP', category: 'FOMC', impact: 'HIGH', prediction: 'Dot plot update', analysis: 'Year-end FOMC with Summary of Economic Projections. Sets tone for 2026.', tradingAngle: 'December cuts historically bullish for Jan. Watch small-caps (IWM) on rate cut confirmation.' },

    // CPI Reports
    { date: '2025-05-13', event: 'CPI Inflation Report (April)', category: 'Inflation', impact: 'HIGH', prediction: '~3.1% YoY', analysis: 'Tariff effects starting to show in goods prices. Services still sticky.', tradingAngle: 'Hot CPI = sell TLT, buy UUP. Cool CPI = buy QQQ, sell DXY.' },
    { date: '2025-06-11', event: 'CPI Inflation Report (May)', category: 'Inflation', impact: 'HIGH', prediction: '~2.9% YoY', analysis: 'June CPI directly influences July FOMC decision. Market-moving.', tradingAngle: 'June CPI is the key for summer rate cut narrative. High vol expected.' },
    { date: '2025-07-15', event: 'CPI Inflation Report (June)', category: 'Inflation', impact: 'HIGH', prediction: 'Data-dependent', analysis: 'Mid-year inflation checkup. Energy and food components key.', tradingAngle: 'Energy stocks (XLE) react inversely to CPI. Tech loves low inflation.' },
    { date: '2025-08-12', event: 'CPI Inflation Report (July)', category: 'Inflation', impact: 'HIGH', prediction: 'Data-dependent', analysis: 'Summer CPI — seasonal adjustments matter. Watch shelter component.', tradingAngle: 'Shelter + services data matters most. REIT sector (XLRE) sensitive.' },

    // NFP Jobs Reports
    { date: '2025-05-02', event: 'Non-Farm Payrolls (April)', category: 'Jobs', impact: 'HIGH', prediction: '~160K jobs', analysis: 'Labor market cooling is key to Fed cutting. Weak jobs = rate cut hopes rise.', tradingAngle: 'Weak NFP = long bonds (TLT), long growth (QQQ). Strong NFP = sell bonds.' },
    { date: '2025-06-06', event: 'Non-Farm Payrolls (May)', category: 'Jobs', impact: 'HIGH', prediction: '~155K jobs', analysis: 'Pre-FOMC jobs data. Feeds directly into June rate decision.', tradingAngle: 'Miss on jobs = buy SPY call spreads (rate cut relief). Beat = sell into strength.' },
    { date: '2025-07-03', event: 'Non-Farm Payrolls (June)', category: 'Jobs', impact: 'HIGH', prediction: 'Data-dependent', analysis: 'July 4th week — thin markets amplify moves. Be careful.', tradingAngle: 'Thin holiday market = exaggerated reaction. Keep position sizes small.' },
    { date: '2025-08-01', event: 'Non-Farm Payrolls (July)', category: 'Jobs', impact: 'HIGH', prediction: 'Data-dependent', analysis: 'Summer jobs — seasonal adjustments complex.', tradingAngle: 'August is historically volatile. Sell vol before, buy if market overreacts.' },

    // GDP
    { date: '2025-04-30', event: 'GDP Q1 2025 (Advance)', category: 'GDP', impact: 'HIGH', prediction: '~1.8% annualized', analysis: 'First look at Q1 GDP. Tariff impacts and consumer slowdown watched closely.', tradingAngle: 'Weak GDP paradoxically bullish (rate cut hope). Strong GDP = rate hold = mixed.' },
    { date: '2025-07-30', event: 'GDP Q2 2025 (Advance)', category: 'GDP', impact: 'HIGH', prediction: 'Data-dependent', analysis: 'Q2 GDP — critical for recession call or soft-landing confirmation.', tradingAngle: 'Soft-landing GDP = buy cyclicals. Contraction = defensive rotation (XLU, XLP).' },

    // Options Expiration
    { date: '2025-05-16', event: 'Monthly Options Expiration (May)', category: 'Options', impact: 'MEDIUM', prediction: 'Increased volatility', analysis: 'Max pain levels matter. Market-makers hedge through expiry.', tradingAngle: 'Check max pain for SPY/QQQ. Pin risk real near expiry. Close short-term positions.' },
    { date: '2025-06-20', event: 'Quarterly Options + Quad Witching (June)', category: 'Options', impact: 'HIGH', prediction: 'Very high volume', analysis: 'Quarterly quad witching — stocks, ETFs, index options all expire. Massive volume.', tradingAngle: 'Huge volume = whipsaw danger. Great for scalping. Avoid holding naked options.' },
    { date: '2025-07-18', event: 'Monthly Options Expiration (July)', category: 'Options', impact: 'MEDIUM', prediction: 'Elevated volatility', analysis: 'Summer opex — lighter volume than quad witching but still moves markets.', tradingAngle: 'Theta decay accelerates final week. Premium sellers in their element.' },
    { date: '2025-09-19', event: 'Quarterly Options + Quad Witching (Sept)', category: 'Options', impact: 'HIGH', prediction: 'Very high volume', analysis: 'September quad witching historically most volatile. Post-summer repositioning.', tradingAngle: 'September is historically the worst month for stocks. Hedge into quad witch.' },
    { date: '2025-12-19', event: 'Quarterly Options + Quad Witching (Dec)', category: 'Options', impact: 'HIGH', prediction: 'Year-end repositioning', analysis: 'December quad witching + year-end window dressing. Santa rally?', tradingAngle: 'Post-quad witching often relief rally. Buy dips into year-end if markets held up.' },
  ]

  // Filter to next 14 days + some longer term
  const twoWeeksOut = new Date(now)
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 60)

  return events
    .filter(e => {
      const d = new Date(e.date)
      return d >= now && d <= twoWeeksOut
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 20)
}

export async function GET(request: NextRequest) {
  const events = getUpcomingEvents()
  return Response.json({ events, fetchedAt: new Date().toISOString() })
}
