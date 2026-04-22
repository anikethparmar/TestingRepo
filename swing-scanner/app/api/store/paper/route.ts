import { db, KEYS } from '@/lib/db'

export interface PaperTrade {
  id: string
  openedAt: string
  closedAt?: string
  symbol: string
  optionType: 'call' | 'put'
  strike: number
  expiry: string
  contracts: number
  entryPremium: number
  exitPremium?: number
  status: 'open' | 'closed'
  pnl?: number
  notes: string
}

export async function GET() {
  const store = await db()
  const trades = await store.get<PaperTrade[]>(KEYS.paper)
  return Response.json(trades ?? [])
}

export async function POST(req: Request) {
  const store = await db()
  const trades: PaperTrade[] = await req.json()
  await store.set(KEYS.paper, trades)
  return Response.json(trades)
}
