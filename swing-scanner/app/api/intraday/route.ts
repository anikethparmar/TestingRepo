import { NextRequest } from 'next/server'
import { fetchOHLCV } from '@/lib/yahoo'
import { detectSignals } from '@/lib/signals'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const symbolsParam = sp.get('symbols') ?? ''
  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)

  if (symbols.length === 0) {
    return Response.json({ error: 'No symbols provided' }, { status: 400 })
  }

  const allSignals = []
  for (const symbol of symbols.slice(0, 30)) {
    try {
      const bars = await fetchOHLCV(symbol, 30)
      if (bars.length < 20) continue
      const signals = detectSignals(symbol, bars)
      allSignals.push(...signals)
    } catch { /* skip */ }
  }

  allSignals.sort((a, b) => {
    const s = { strong: 3, moderate: 2, weak: 1 }
    return s[b.strength] - s[a.strength]
  })

  return Response.json({ signals: allSignals, scannedAt: new Date().toISOString() })
}
