import { NextRequest } from 'next/server'
import { fetchOHLCV } from '@/lib/yahoo'

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')?.toUpperCase()
  if (!symbol) {
    return Response.json({ error: 'No symbol provided' }, { status: 400 })
  }

  try {
    const bars = await fetchOHLCV(symbol, 90)
    return Response.json({ symbol, bars, fetchedAt: new Date().toISOString() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
