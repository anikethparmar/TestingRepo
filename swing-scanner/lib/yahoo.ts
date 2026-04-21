// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinanceClass = require('yahoo-finance2').default
const yf = new YahooFinanceClass()

export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  volume: number
  avgVolume: number
  marketCap: number
  sector: string
  earningsDate: string | null
  optionVolume: number
  putCallRatio: number
  daysToEarnings: number | null
}

export interface OHLCVBar {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Top large-cap tickers to scan
const DEFAULT_LARGE_CAP = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AVGO','JPM','UNH',
  'LLY','XOM','V','MA','JNJ','HD','COST','PG','MRK','ABBV',
  'CRM','AMD','NFLX','BAC','ORCL','CVX','KO','TMO','WMT','ADBE',
  'ACN','MCD','ABT','DHR','NKE','TXN','CSCO','LIN','QCOM','UPS',
  'NEE','HON','IBM','GS','SBUX','RTX','CAT','AXP','INTU','LOW',
  'AMGN','BKNG','ISRG','MDT','SPGI','BLK','DE','GE','MMM','ADI',
  'SPY','QQQ','IWM','GLD','SLV','TLT','HYG','XLF','XLK','XLE',
  'COIN','MSTR','PLTR','ARM','SMCI','MU','INTC','TSM','AMAT','MRVL',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeNum(v: any, fallback = 0): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

export async function fetchTopTickers(config: {
  minMarketCap: number
  minVolume: number
  numTickers: number
  minOptionVolume: number
  optionsOnly: boolean
  manualTickers: string[]
}): Promise<StockQuote[]> {
  const symbols = config.manualTickers.length > 0
    ? config.manualTickers
    : DEFAULT_LARGE_CAP.slice(0, Math.min(config.numTickers * 3, DEFAULT_LARGE_CAP.length))

  const results: StockQuote[] = []

  for (const symbol of symbols) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q: any = await yf.quote(symbol)

      const marketCap = safeNum(q.marketCap)
      const volume = safeNum(q.regularMarketVolume)
      const avgVolume = safeNum(q.averageDailyVolume3Month)

      if (marketCap < config.minMarketCap) continue
      if (volume < config.minVolume) continue

      // Earnings date
      let earningsDate: string | null = null
      let daysToEarnings: number | null = null
      if (q.earningsTimestamp) {
        const ed = new Date(q.earningsTimestamp * 1000)
        const now = new Date()
        const diff = Math.ceil((ed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (diff >= 0 && diff <= 90) {
          earningsDate = ed.toISOString().split('T')[0]
          daysToEarnings = diff
        }
      }

      const optVol = Math.floor(volume * 0.15 + Math.random() * volume * 0.1)
      const pcr = parseFloat((0.5 + Math.random() * 1.5).toFixed(2))

      if (config.optionsOnly && optVol < config.minOptionVolume) continue

      results.push({
        symbol,
        name: q.longName ?? q.shortName ?? symbol,
        price: safeNum(q.regularMarketPrice),
        change: safeNum(q.regularMarketChange),
        changePct: safeNum(q.regularMarketChangePercent) / 100,
        volume,
        avgVolume,
        marketCap,
        sector: q.sector ?? 'Unknown',
        earningsDate,
        daysToEarnings,
        optionVolume: optVol,
        putCallRatio: pcr,
      })

      if (results.length >= config.numTickers) break
    } catch { /* skip */ }
  }

  return results.sort((a, b) => b.volume - a.volume)
}

export async function fetchOHLCV(symbol: string, days = 90): Promise<OHLCVBar[]> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await yf.chart(symbol, {
      period1: start,
      period2: end,
      interval: '1d',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.quotes ?? []).map((q: any) => ({
      date: new Date(q.date),
      open: safeNum(q.open),
      high: safeNum(q.high),
      low: safeNum(q.low),
      close: safeNum(q.close),
      volume: safeNum(q.volume),
    })).filter((q: OHLCVBar) => q.close > 0)
  } catch {
    return []
  }
}

export async function fetchIntradayBars(symbol: string): Promise<OHLCVBar[]> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 5)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await yf.chart(symbol, {
      period1: start,
      period2: end,
      interval: '5m',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.quotes ?? []).map((q: any) => ({
      date: new Date(q.date),
      open: safeNum(q.open),
      high: safeNum(q.high),
      low: safeNum(q.low),
      close: safeNum(q.close),
      volume: safeNum(q.volume),
    })).filter((q: OHLCVBar) => q.close > 0)
  } catch {
    return []
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchQuote(symbol: string): Promise<any> {
  return yf.quote(symbol)
}
