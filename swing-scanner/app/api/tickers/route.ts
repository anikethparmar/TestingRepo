import { NextRequest } from 'next/server'
import { fetchTopTickers } from '@/lib/yahoo'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const config = {
    minMarketCap: Number(sp.get('minMarketCap') ?? 1_000_000_000),
    minVolume: Number(sp.get('minVolume') ?? 500_000),
    numTickers: Number(sp.get('numTickers') ?? 30),
    minOptionVolume: Number(sp.get('minOptionVolume') ?? 1000),
    optionsOnly: sp.get('optionsOnly') === 'true',
    manualTickers: sp.get('manualTickers') ? sp.get('manualTickers')!.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [],
  }

  try {
    const tickers = await fetchTopTickers(config)
    return Response.json({ tickers, fetchedAt: new Date().toISOString() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
