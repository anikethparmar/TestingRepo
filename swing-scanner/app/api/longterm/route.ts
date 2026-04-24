import { NextRequest } from 'next/server'

export const maxDuration = 60

export const SECTOR_UNIVERSE: Record<string, string[]> = {
  Technology:     ['PLTR', 'NET', 'SNOW', 'DDOG', 'PATH', 'MDB', 'IOT', 'CRWD', 'ZS', 'ARM', 'MRVL', 'GTLB', 'BILL', 'CFLT', 'TTD'],
  'AI & Data':    ['AI', 'RXRX', 'TEM', 'SOUN', 'BBAI', 'GFAI', 'AMBA'],
  Healthcare:     ['CRSP', 'NTLA', 'PACB', 'TXG', 'BEAM', 'EDIT', 'SRPT', 'RARE', 'ARQT'],
  'Clean Energy': ['ENPH', 'BE', 'PLUG', 'RUN', 'FSLR', 'ARRY', 'NOVA', 'BLNK', 'CHPT'],
  Fintech:        ['SOFI', 'AFRM', 'TOST', 'MQ', 'NU', 'UPST', 'RELY'],
  Consumer:       ['DASH', 'CPNG', 'SE', 'MELI', 'DUOL', 'ABNB', 'LYFT'],
  'Space & Defense': ['RKLB', 'JOBY', 'ACHR', 'LUNR', 'ASTS'],
  Materials:      ['MP', 'LAC', 'PLL', 'LITM', 'SGML'],
}

export interface LongTermSetup {
  symbol: string
  name: string
  sector: string
  spotPrice: number
  change52w: number | null
  marketCap: number
  ltScore: number
  grade: 'A' | 'B' | 'C'
  profitabilityStage: string
  revenueGrowth: number | null
  grossMargin: number | null
  ebitdaMargin: number | null
  operatingMargin: number | null
  freeCashflow: number | null
  totalCash: number | null
  totalDebt: number | null
  analystTarget: number | null
  analystUpside: number | null
  analystCount: number | null
  forwardPE: number | null
  evToRevenue: number | null
  pegRatio: number | null
  shortRatio: number | null
  institutionalPct: number | null
  insiderPct: number | null
  beta: number | null
  rule40: number | null
  thesis: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeN(v: any, fallback: number | null = null): number | null {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

function profitabilityStage(
  eps: number | null,
  opMargin: number | null,
  ebitdaMargin: number | null,
  grossMargin: number | null,
): string {
  if (eps !== null && eps > 0) return 'Profitable'
  if (opMargin !== null && opMargin > 0) return 'Near Profitable'
  if (ebitdaMargin !== null && ebitdaMargin > 0) return 'EBITDA+'
  if (grossMargin !== null && grossMargin > 0) return 'Gross Profit+'
  return 'Pre-Profitable'
}

function calcScore(
  revGrowth: number | null,
  grossMargin: number | null,
  ebitdaMargin: number | null,
  opMargin: number | null,
  eps: number | null,
  analystUpside: number | null,
  totalCash: number | null,
  freeCashflow: number | null,
): number {
  let score = 0

  // Revenue growth trajectory (30 pts) — primary signal for pre-profitable growth stocks
  const rg = revGrowth ?? 0
  if (rg > 0.5) score += 30
  else if (rg > 0.3) score += 24
  else if (rg > 0.2) score += 18
  else if (rg > 0.1) score += 12
  else if (rg > 0) score += 6

  // Gross margin quality (25 pts) — indicates scalable, defensible business model
  const gm = grossMargin ?? 0
  if (gm > 0.7) score += 25
  else if (gm > 0.5) score += 20
  else if (gm > 0.3) score += 14
  else if (gm > 0.15) score += 8
  else if (gm > 0) score += 3

  // Path to profitability (25 pts)
  if ((eps ?? -1) > 0) score += 25
  else if ((opMargin ?? -1) > 0) score += 20
  else if ((ebitdaMargin ?? -1) > 0) score += 15
  else if (gm > 0) score += 8

  // Analyst consensus upside (10 pts)
  const au = analystUpside ?? 0
  if (au > 1.0) score += 10
  else if (au > 0.5) score += 8
  else if (au > 0.25) score += 5
  else if (au > 0.1) score += 3

  // Balance sheet / cash runway (10 pts)
  const fcf = freeCashflow ?? 0
  if (fcf > 0) {
    score += 10
  } else {
    const cash = totalCash ?? 0
    if (cash > 0 && fcf < 0) {
      const yearsRunway = cash / Math.abs(fcf)
      if (yearsRunway > 2) score += 10
      else if (yearsRunway > 1) score += 7
      else if (yearsRunway > 0.5) score += 4
      else score += 1
    } else if (cash > 0) {
      score += 5
    }
  }

  return Math.min(100, score)
}

function buildThesis(
  revGrowth: number | null,
  grossMargin: number | null,
  analystUpside: number | null,
  shortRatio: number | null,
  freeCashflow: number | null,
  institutionalPct: number | null,
  rule40: number | null,
): string[] {
  const pts: string[] = []
  if (revGrowth !== null && revGrowth > 0.2)
    pts.push(`Revenue growing ${(revGrowth * 100).toFixed(0)}% YoY — strong top-line momentum`)
  if (grossMargin !== null && grossMargin > 0.5)
    pts.push(`${(grossMargin * 100).toFixed(0)}% gross margin signals a scalable, software-like model`)
  if (analystUpside !== null && analystUpside > 0.2)
    pts.push(`Analyst consensus: ${(analystUpside * 100).toFixed(0)}% upside to mean price target`)
  if (freeCashflow !== null && freeCashflow > 0)
    pts.push(`FCF positive — self-funding, no dilution needed`)
  if (shortRatio !== null && shortRatio > 6)
    pts.push(`High short interest (${shortRatio.toFixed(1)}x) — strong contrarian upside if thesis plays`)
  if (institutionalPct !== null && institutionalPct > 0.55)
    pts.push(`Institutional backing: ${(institutionalPct * 100).toFixed(0)}% held by funds — smart-money conviction`)
  if (rule40 !== null && rule40 >= 40)
    pts.push(`Rule of 40 score: ${rule40.toFixed(0)} — efficient growth (rev growth % + FCF margin %)`)
  return pts.slice(0, 3)
}

export async function GET(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const yf = new (require('yahoo-finance2').default)()

  const sp = request.nextUrl.searchParams
  const sector = sp.get('sector') ?? 'all'

  const symbols: { symbol: string; sector: string }[] =
    sector === 'all'
      ? Object.entries(SECTOR_UNIVERSE).flatMap(([s, tickers]) =>
          tickers.map(t => ({ symbol: t, sector: s }))
        )
      : (SECTOR_UNIVERSE[sector] ?? []).map(t => ({ symbol: t, sector }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function scanSymbol(symbol: string, sectorName: string): Promise<LongTermSetup | null> {
    try {
      const [quote, summary] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yf.quote(symbol) as Promise<any>,
        yf
          .quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics'] })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .catch(() => null) as Promise<any>,
      ])

      if (!quote?.regularMarketPrice) return null

      const fin = summary?.financialData
      const ks = summary?.defaultKeyStatistics

      const spotPrice = safeN(quote.regularMarketPrice) ?? 0
      const marketCap = safeN(quote.marketCap) ?? 0

      const revenueGrowth = safeN(fin?.revenueGrowth)
      const grossMargin = safeN(fin?.grossMargins)
      const ebitdaMargin = safeN(fin?.ebitdaMargins)
      const opMargin = safeN(fin?.operatingMargins)
      const freeCashflow = safeN(fin?.freeCashflow)
      const totalCash = safeN(fin?.totalCash)
      const totalDebt = safeN(fin?.totalDebt)
      const analystTarget = safeN(fin?.targetMeanPrice)
      const analystCount = safeN(fin?.numberOfAnalystOpinions)
      const forwardPE = safeN(quote.forwardPE)
      const evToRevenue = safeN(ks?.enterpriseToRevenue)
      const pegRatio = safeN(ks?.pegRatio)
      const shortRatio = safeN(ks?.shortRatio)
      const institutionalPct = safeN(ks?.heldPercentInstitutions)
      const insiderPct = safeN(ks?.heldPercentInsiders)
      const beta = safeN(quote.beta ?? ks?.beta)
      const eps = safeN(quote.epsTrailingTwelveMonths)
      const change52w = safeN(ks?.['52WeekChange'])

      const analystUpside =
        analystTarget && spotPrice ? (analystTarget - spotPrice) / spotPrice : null

      // Rule of 40: revenue growth % + FCF margin % (classic SaaS health check)
      const totalRevenue = safeN(fin?.totalRevenue)
      const fcfMargin =
        freeCashflow !== null && totalRevenue && totalRevenue > 0
          ? (freeCashflow / totalRevenue) * 100
          : null
      const rule40 =
        revenueGrowth !== null && fcfMargin !== null
          ? revenueGrowth * 100 + fcfMargin
          : null

      const stage = profitabilityStage(eps, opMargin, ebitdaMargin, grossMargin)
      const ltScore = calcScore(
        revenueGrowth, grossMargin, ebitdaMargin, opMargin,
        eps, analystUpside, totalCash, freeCashflow,
      )
      const grade: 'A' | 'B' | 'C' = ltScore >= 65 ? 'A' : ltScore >= 45 ? 'B' : 'C'
      const thesis = buildThesis(
        revenueGrowth, grossMargin, analystUpside,
        shortRatio, freeCashflow, institutionalPct, rule40,
      )

      return {
        symbol,
        name: quote.longName ?? quote.shortName ?? symbol,
        sector: sectorName,
        spotPrice,
        change52w: change52w !== null ? change52w * 100 : null,
        marketCap,
        ltScore,
        grade,
        profitabilityStage: stage,
        revenueGrowth,
        grossMargin,
        ebitdaMargin,
        operatingMargin: opMargin,
        freeCashflow,
        totalCash,
        totalDebt,
        analystTarget,
        analystUpside,
        analystCount,
        forwardPE,
        evToRevenue,
        pegRatio,
        shortRatio,
        institutionalPct,
        insiderPct,
        beta,
        rule40,
        thesis,
      }
    } catch {
      return null
    }
  }

  const results = await Promise.allSettled(
    symbols.map(({ symbol, sector: s }) => scanSymbol(symbol, s))
  )

  const setups = results
    .filter(
      (r): r is PromiseFulfilledResult<LongTermSetup> =>
        r.status === 'fulfilled' && r.value !== null,
    )
    .map(r => r.value)
    .sort((a, b) => b.ltScore - a.ltScore)

  return Response.json({ setups, scannedAt: new Date().toISOString(), sector })
}
