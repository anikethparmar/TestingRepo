import { db, KEYS } from '@/lib/db'

export interface AppConfig {
  budget: number
  targetProfit: number
  minMarketCap: number
  minVolume: number
  numTickers: number
  minOptionVolume: number
  optionsOnly: boolean
  manualTickers: string
}

const DEFAULT: AppConfig = {
  budget: 200,
  targetProfit: 50,
  minMarketCap: 10,
  minVolume: 500000,
  numTickers: 30,
  minOptionVolume: 1000,
  optionsOnly: false,
  manualTickers: '',
}

export async function GET() {
  const store = await db()
  const config = await store.get<AppConfig>(KEYS.config)
  return Response.json(config ?? DEFAULT)
}

export async function POST(req: Request) {
  const store = await db()
  const body: AppConfig = await req.json()
  await store.set(KEYS.config, body)
  return Response.json(body)
}
