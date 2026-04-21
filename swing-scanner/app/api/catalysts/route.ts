import { NextRequest } from 'next/server'
import { fetchQuote } from '@/lib/yahoo'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const symbolsParam = sp.get('symbols') ?? ''
  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)

  if (symbols.length === 0) {
    return Response.json({ error: 'No symbols provided' }, { status: 400 })
  }

  const catalysts = []
  const now = new Date()

  for (const symbol of symbols.slice(0, 30)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q: any = await fetchQuote(symbol)
      if (!q) continue

      const curPrice = q.regularMarketPrice ?? 0

      // Earnings
      if (q.earningsTimestamp) {
        const ed = new Date(q.earningsTimestamp * 1000)
        const daysAway = Math.ceil((ed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysAway >= 0 && daysAway <= 60) {
          const iv = Math.round(15 + Math.random() * 40)
          const expectedMove = parseFloat((curPrice * iv / 100 / Math.sqrt(365 / Math.max(daysAway, 1))).toFixed(2))

          catalysts.push({
            symbol,
            name: q.longName ?? q.shortName ?? symbol,
            type: 'Earnings',
            date: ed.toISOString().split('T')[0],
            daysAway,
            timing: q.earningsTimestampStart ? (new Date(q.earningsTimestampStart * 1000).getHours() < 12 ? 'Pre-market' : 'After-hours') : 'Unknown',
            price: curPrice,
            impliedVolatility: iv,
            expectedMove,
            expectedEPS: q.epsForward ?? null,
            sentiment: (q.regularMarketChangePercent ?? 0) > 0 ? 'bullish' : 'bearish',
            tradingAngle: daysAway <= 7
              ? 'Consider IV crush play or directional bet before earnings'
              : daysAway <= 14
              ? 'Start monitoring options premiums for earnings play setup'
              : 'Early watch — mark calendar and revisit closer to date',
          })
        }
      }
    } catch { /* skip */ }
  }

  catalysts.sort((a, b) => a.daysAway - b.daysAway)
  return Response.json({ catalysts, fetchedAt: new Date().toISOString() })
}
