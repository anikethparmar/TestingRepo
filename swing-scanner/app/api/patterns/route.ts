import { NextRequest } from 'next/server'
import { fetchOHLCV } from '@/lib/yahoo'
import { detectPatterns } from '@/lib/patterns'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const symbolsParam = sp.get('symbols') ?? ''
  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)

  if (symbols.length === 0) {
    return Response.json({ error: 'No symbols provided' }, { status: 400 })
  }

  const results = []
  for (const symbol of symbols.slice(0, 30)) {
    try {
      const bars = await fetchOHLCV(symbol, 90)
      if (bars.length < 20) continue
      const patterns = detectPatterns(symbol, bars)
      results.push(...patterns)
    } catch { /* skip */ }
  }

  results.sort((a, b) => b.confidence - a.confidence)
  return Response.json({ patterns: results, scannedAt: new Date().toISOString() })
}
