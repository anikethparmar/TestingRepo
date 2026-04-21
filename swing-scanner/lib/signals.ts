import { OHLCVBar } from './yahoo'

export interface IntradaySignal {
  symbol: string
  signal: string
  type: 'bullish' | 'bearish' | 'neutral'
  strength: 'strong' | 'moderate' | 'weak'
  price: number
  detail: string
  time: string
}

function sma(data: number[], period: number): number {
  const slice = data.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

function stddev(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  return Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length)
}

export function detectSignals(symbol: string, bars: OHLCVBar[]): IntradaySignal[] {
  if (bars.length < 20) return []

  const signals: IntradaySignal[] = []
  const n = bars.length
  const last = n - 1
  const closes = bars.map(b => b.close)
  const highs = bars.map(b => b.high)
  const lows = bars.map(b => b.low)
  const opens = bars.map(b => b.open)
  const volumes = bars.map(b => b.volume)
  const curPrice = closes[last]
  const now = bars[last].date.toISOString()

  // Gap Up
  const prevClose = closes[last - 1]
  const todayOpen = opens[last]
  const gapPct = (todayOpen - prevClose) / prevClose * 100
  if (gapPct > 1.5) {
    signals.push({ symbol, signal: 'Gap Up', type: 'bullish', strength: gapPct > 3 ? 'strong' : 'moderate', price: curPrice, detail: `Opened ${gapPct.toFixed(1)}% above yesterday's close`, time: now })
  } else if (gapPct < -1.5) {
    signals.push({ symbol, signal: 'Gap Down', type: 'bearish', strength: gapPct < -3 ? 'strong' : 'moderate', price: curPrice, detail: `Opened ${Math.abs(gapPct).toFixed(1)}% below yesterday's close`, time: now })
  }

  // Volume Spike
  const avgVol = sma(volumes.slice(-21, -1), 20)
  const volRatio = volumes[last] / avgVol
  if (volRatio > 2) {
    signals.push({ symbol, signal: 'Volume Spike', type: closes[last] > opens[last] ? 'bullish' : 'bearish', strength: volRatio > 4 ? 'strong' : 'moderate', price: curPrice, detail: `${volRatio.toFixed(1)}x average volume`, time: now })
  }

  // MA Cross (fast/slow)
  const ma10 = sma(closes.slice(-10), 10)
  const ma20v = sma(closes.slice(-20), 20)
  const ma10Prev = sma(closes.slice(-11, -1), 10)
  const ma20Prev = sma(closes.slice(-21, -1), 20)
  if (ma10Prev <= ma20Prev && ma10 > ma20v) {
    signals.push({ symbol, signal: 'MA Bullish Cross', type: 'bullish', strength: 'moderate', price: curPrice, detail: '10-period MA crossed above 20-period MA', time: now })
  } else if (ma10Prev >= ma20Prev && ma10 < ma20v) {
    signals.push({ symbol, signal: 'MA Bearish Cross', type: 'bearish', strength: 'moderate', price: curPrice, detail: '10-period MA crossed below 20-period MA', time: now })
  }

  // Bollinger Band Breakout
  const bbCloses = closes.slice(-20)
  const bbMean = sma(bbCloses, 20)
  const bbStd = stddev(bbCloses)
  const upperBB = bbMean + 2 * bbStd
  const lowerBB = bbMean - 2 * bbStd
  if (curPrice > upperBB) {
    signals.push({ symbol, signal: 'Bollinger Breakout (Upper)', type: 'bullish', strength: 'strong', price: curPrice, detail: `Price broke above upper Bollinger Band ($${upperBB.toFixed(2)})`, time: now })
  } else if (curPrice < lowerBB) {
    signals.push({ symbol, signal: 'Bollinger Breakdown (Lower)', type: 'bearish', strength: 'strong', price: curPrice, detail: `Price broke below lower Bollinger Band ($${lowerBB.toFixed(2)})`, time: now })
  }

  // Big Intraday Move
  const highToday = highs[last]
  const lowToday = lows[last]
  const intraMoveUp = (highToday - todayOpen) / todayOpen * 100
  const intraMoveDown = (todayOpen - lowToday) / todayOpen * 100
  if (intraMoveUp > 3) {
    signals.push({ symbol, signal: 'Big Intraday Rally', type: 'bullish', strength: 'strong', price: curPrice, detail: `+${intraMoveUp.toFixed(1)}% from open intraday`, time: now })
  } else if (intraMoveDown > 3) {
    signals.push({ symbol, signal: 'Big Intraday Sell-Off', type: 'bearish', strength: 'strong', price: curPrice, detail: `-${intraMoveDown.toFixed(1)}% from open intraday`, time: now })
  }

  // Reversal: intraday high then fade
  const halfRange = (highToday + lowToday) / 2
  if (curPrice < halfRange && intraMoveUp > 2) {
    signals.push({ symbol, signal: 'Intraday Reversal (Fade)', type: 'bearish', strength: 'moderate', price: curPrice, detail: 'Opened strong but reversing — selling into strength', time: now })
  }

  // Inside Day
  if (highs[last] <= highs[last - 1] && lows[last] >= lows[last - 1]) {
    signals.push({ symbol, signal: 'Inside Day', type: 'neutral', strength: 'weak', price: curPrice, detail: 'Price range contained within prior day — compression before breakout', time: now })
  }

  // Consecutive up closes
  const last3up = closes[last] > closes[last - 1] && closes[last - 1] > closes[last - 2] && closes[last - 2] > closes[last - 3]
  if (last3up && volumes[last] > avgVol) {
    signals.push({ symbol, signal: '3-Day Momentum', type: 'bullish', strength: 'moderate', price: curPrice, detail: '3 consecutive higher closes with above-average volume', time: now })
  }

  // Consecutive down closes
  const last3dn = closes[last] < closes[last - 1] && closes[last - 1] < closes[last - 2] && closes[last - 2] < closes[last - 3]
  if (last3dn && volumes[last] > avgVol) {
    signals.push({ symbol, signal: '3-Day Sell Pressure', type: 'bearish', strength: 'moderate', price: curPrice, detail: '3 consecutive lower closes with above-average volume', time: now })
  }

  // New 20-day high
  const high20 = Math.max(...highs.slice(-21, -1))
  if (highs[last] > high20) {
    signals.push({ symbol, signal: '20-Day High Breakout', type: 'bullish', strength: 'strong', price: curPrice, detail: `New 20-day high at $${highs[last].toFixed(2)}`, time: now })
  }

  // New 20-day low
  const low20 = Math.min(...lows.slice(-21, -1))
  if (lows[last] < low20) {
    signals.push({ symbol, signal: '20-Day Low Breakdown', type: 'bearish', strength: 'strong', price: curPrice, detail: `New 20-day low at $${lows[last].toFixed(2)}`, time: now })
  }

  return signals
}
