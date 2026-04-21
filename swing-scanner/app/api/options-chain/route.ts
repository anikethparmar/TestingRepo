import { NextRequest } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinanceClass = require('yahoo-finance2').default
const yf = new YahooFinanceClass()

export interface OptionContract {
  strike: number
  expiry: string
  type: 'call' | 'put'
  bid: number
  ask: number
  last: number
  iv: number
  delta: number
  gamma: number
  theta: number
  vega: number
  volume: number
  openInterest: number
  itm: boolean
  spread: number
  spreadPct: number
  midpoint: number
  contractsFor200: number
  maxProfit200: number
  breakEven: number
}

export interface OptionsChainData {
  symbol: string
  spotPrice: number
  expiries: string[]
  calls: OptionContract[]
  puts: OptionContract[]
  ivRank: number
  ivPercentile: number
  historicalVol30: number
  fetchedAt: string
}

// Black-Scholes approximation for Greeks
function calcGreeks(spot: number, strike: number, expDays: number, iv: number, isCall: boolean): {
  delta: number; gamma: number; theta: number; vega: number
} {
  const T = Math.max(expDays, 1) / 365
  const r = 0.05 // risk-free rate
  const sigma = iv / 100

  const d1 = (Math.log(spot / strike) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)

  // Standard normal CDF approximation
  function N(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
    const sign = x >= 0 ? 1 : -1
    const t = 1.0 / (1.0 + p * Math.abs(x))
    const poly = ((((a5 * t + a4) * t) + a3) * t + a2) * t + a1
    return 0.5 * (1.0 + sign * (1 - poly * Math.exp(-Math.abs(x) * Math.abs(x) / 2)))
  }

  // Standard normal PDF
  function phi(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  }

  const delta = isCall ? N(d1) : N(d1) - 1
  const gamma = phi(d1) / (spot * sigma * Math.sqrt(T))
  const theta = isCall
    ? (-(spot * phi(d1) * sigma) / (2 * Math.sqrt(T)) - r * strike * Math.exp(-r * T) * N(d2)) / 365
    : (-(spot * phi(d1) * sigma) / (2 * Math.sqrt(T)) + r * strike * Math.exp(-r * T) * N(-d2)) / 365
  const vega = spot * phi(d1) * Math.sqrt(T) / 100

  return {
    delta: parseFloat(delta.toFixed(3)),
    gamma: parseFloat(gamma.toFixed(4)),
    theta: parseFloat(theta.toFixed(3)),
    vega: parseFloat(vega.toFixed(3)),
  }
}

function processContract(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c: any,
  spot: number,
  isCall: boolean,
  expiry: string,
  budget = 200
): OptionContract {
  const strike = c.strike ?? 0
  const bid = c.bid ?? 0
  const ask = c.ask ?? 0
  const last = c.lastPrice ?? 0
  const mid = (bid + ask) / 2
  const iv = (c.impliedVolatility ?? 0.3) * 100
  const now = new Date()
  const expDate = new Date(expiry)
  const expDays = Math.max(Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0)
  const greeks = calcGreeks(spot, strike, expDays, iv, isCall)
  const spread = ask - bid
  const spreadPct = bid > 0 ? (spread / bid) * 100 : 999
  const contractCost = mid * 100
  const contracts = contractCost > 0 ? Math.floor(budget / contractCost) : 0
  const breakEven = isCall ? strike + mid : strike - mid
  const targetMove = spot * 0.02 // 2% move
  const maxProfit = contracts * Math.abs(greeks.delta) * targetMove * 100

  return {
    strike,
    expiry,
    type: isCall ? 'call' : 'put',
    bid: parseFloat(bid.toFixed(2)),
    ask: parseFloat(ask.toFixed(2)),
    last: parseFloat(last.toFixed(2)),
    iv: parseFloat(iv.toFixed(1)),
    delta: greeks.delta,
    gamma: greeks.gamma,
    theta: greeks.theta,
    vega: greeks.vega,
    volume: c.volume ?? 0,
    openInterest: c.openInterest ?? 0,
    itm: isCall ? strike < spot : strike > spot,
    spread: parseFloat(spread.toFixed(2)),
    spreadPct: parseFloat(spreadPct.toFixed(1)),
    midpoint: parseFloat(mid.toFixed(2)),
    contractsFor200: contracts,
    maxProfit200: parseFloat(maxProfit.toFixed(2)),
    breakEven: parseFloat(breakEven.toFixed(2)),
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const symbol = sp.get('symbol')?.toUpperCase() ?? 'SPY'
  const expiry = sp.get('expiry') ?? ''

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [quote, optionsData] = await Promise.all([
      yf.quote(symbol) as Promise<any>,
      yf.options(symbol, expiry ? { date: new Date(expiry) } : {}) as Promise<any>,
    ])

    const spot = quote.regularMarketPrice ?? 0
    const expiries: string[] = (optionsData.expirationDates ?? []).map((d: Date) =>
      new Date(d).toISOString().split('T')[0]
    )

    const selectedExpiry = expiry || expiries[0] || ''
    const chain = optionsData.options?.[0]

    const calls: OptionContract[] = (chain?.calls ?? [])
      .map((c: any) => processContract(c, spot, true, selectedExpiry))
      .filter((c: OptionContract) => c.ask > 0 && c.volume > 0)
      .sort((a: OptionContract, b: OptionContract) => a.strike - b.strike)

    const puts: OptionContract[] = (chain?.puts ?? [])
      .map((c: any) => processContract(c, spot, false, selectedExpiry))
      .filter((c: OptionContract) => c.ask > 0 && c.volume > 0)
      .sort((a: OptionContract, b: OptionContract) => a.strike - b.strike)

    // IV environment estimate
    const atmIV = calls.find(c => Math.abs(c.strike - spot) / spot < 0.02)?.iv ?? 25
    const ivRank = Math.min(100, Math.max(0, ((atmIV - 15) / 50) * 100))
    const hv30 = atmIV * 0.85 // approximate

    const result: OptionsChainData = {
      symbol,
      spotPrice: spot,
      expiries,
      calls,
      puts,
      ivRank: parseFloat(ivRank.toFixed(1)),
      ivPercentile: parseFloat((ivRank * 0.95).toFixed(1)),
      historicalVol30: parseFloat(hv30.toFixed(1)),
      fetchedAt: new Date().toISOString(),
    }

    return Response.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
