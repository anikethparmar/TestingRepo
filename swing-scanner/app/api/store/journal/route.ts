import { db, KEYS } from '@/lib/db'

export interface Trade {
  id: string
  date: string
  symbol: string
  optionType: 'call' | 'put'
  strike: number
  expiry: string
  contracts: number
  entryPrice: number
  exitPrice: number
  entryTime: string
  exitTime: string
  outcome: 'win' | 'loss' | 'open'
  pnl: number
  pnlPercent: number
  notes: string
  grade: 'A' | 'B' | 'C'
  exitReason: 'target' | 'stop' | 'manual' | 'expired'
}

export async function GET() {
  const store = await db()
  const trades = await store.get<Trade[]>(KEYS.journal)
  return Response.json(trades ?? [])
}

// Replace entire journal (POST full array)
export async function POST(req: Request) {
  const store = await db()
  const trades: Trade[] = await req.json()
  await store.set(KEYS.journal, trades)
  return Response.json(trades)
}
