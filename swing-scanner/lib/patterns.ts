import { OHLCVBar } from './yahoo'

export interface PatternResult {
  symbol: string
  pattern: string
  direction: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  support: number
  resistance: number
  target: number
  description: string
  bars: OHLCVBar[]
}

function sma(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue }
    const slice = data.slice(i - period + 1, i + 1)
    result.push(slice.reduce((a, b) => a + b, 0) / period)
  }
  return result
}


export function detectPatterns(symbol: string, bars: OHLCVBar[]): PatternResult[] {
  if (bars.length < 20) return []

  const closes = bars.map(b => b.close)
  const highs = bars.map(b => b.high)
  const lows = bars.map(b => b.low)
  const opens = bars.map(b => b.open)
  const volumes = bars.map(b => b.volume)

  const ma20 = sma(closes, 20)
  const ma50 = sma(closes, Math.min(50, bars.length))
  const ma10 = sma(closes, 10)

  const results: PatternResult[] = []
  const n = bars.length
  const last = n - 1
  const curPrice = closes[last]
  const support = Math.min(...lows.slice(-20))
  const resistance = Math.max(...highs.slice(-20))

  // --- BULLISH PATTERNS ---

  // 1. Bull Flag
  const recentHigh = Math.max(...highs.slice(-15, -5))
  const flagLow = Math.min(...lows.slice(-5))
  const flagHigh = Math.max(...highs.slice(-5))
  const flagRange = flagHigh - flagLow
  const poleHeight = recentHigh - Math.min(...lows.slice(-15, -5))
  if (
    poleHeight > curPrice * 0.05 &&
    flagRange < poleHeight * 0.4 &&
    closes[last] > closes[last - 5] &&
    volumes[last] > volumes[last - 1]
  ) {
    results.push({
      symbol, pattern: 'Bull Flag', direction: 'bullish',
      confidence: 75, support: flagLow, resistance: flagHigh,
      target: flagHigh + poleHeight * 0.8,
      description: 'Strong uptrend followed by tight consolidation. Breakout imminent.',
      bars: bars.slice(-15),
    })
  }

  // 2. Double Bottom
  const lows20 = lows.slice(-25)
  const minLow = Math.min(...lows20)
  const minIdx1 = lows20.indexOf(minLow)
  let secondMin = Infinity, minIdx2 = -1
  for (let i = 0; i < lows20.length; i++) {
    if (Math.abs(i - minIdx1) > 4 && lows20[i] < minLow * 1.02 && lows20[i] < secondMin) {
      secondMin = lows20[i]; minIdx2 = i
    }
  }
  if (minIdx2 > 0 && Math.abs(minLow - secondMin) / minLow < 0.03) {
    const neckline = Math.max(...lows20.slice(Math.min(minIdx1, minIdx2), Math.max(minIdx1, minIdx2)))
    results.push({
      symbol, pattern: 'Double Bottom', direction: 'bullish',
      confidence: 80, support: minLow, resistance: neckline,
      target: neckline + (neckline - minLow),
      description: 'Two equal lows signal exhaustion of selling. Neckline break = buy signal.',
      bars: bars.slice(-25),
    })
  }

  // 3. Ascending Triangle
  const recentHighs = highs.slice(-15)
  const highStd = Math.sqrt(recentHighs.reduce((a, b) => a + (b - resistance) ** 2, 0) / recentHighs.length)
  const ascLows = lows.slice(-15)
  const liftingFloor = ascLows[ascLows.length - 1] > ascLows[0] * 1.01
  if (highStd / resistance < 0.015 && liftingFloor) {
    results.push({
      symbol, pattern: 'Ascending Triangle', direction: 'bullish',
      confidence: 72, support: Math.min(...ascLows), resistance,
      target: resistance + (resistance - Math.min(...ascLows)) * 0.7,
      description: 'Flat resistance + rising lows = coiling energy. Bullish breakout expected.',
      bars: bars.slice(-15),
    })
  }

  // 4. Golden Cross
  if (ma20[last] > ma50[last] && ma20[last - 3] <= ma50[last - 3]) {
    results.push({
      symbol, pattern: 'Golden Cross', direction: 'bullish',
      confidence: 78, support: ma50[last], resistance,
      target: curPrice * 1.08,
      description: '20-day MA crossed above 50-day MA — classic bullish momentum signal.',
      bars: bars.slice(-30),
    })
  }

  // 5. Hammer
  const lastBar = bars[last]
  const bodySize = Math.abs(lastBar.close - lastBar.open)
  const lowerWick = Math.min(lastBar.close, lastBar.open) - lastBar.low
  const upperWick = lastBar.high - Math.max(lastBar.close, lastBar.open)
  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && closes[last] > closes[last - 5]) {
    results.push({
      symbol, pattern: 'Hammer', direction: 'bullish',
      confidence: 68, support: lastBar.low, resistance,
      target: curPrice * 1.05,
      description: 'Long lower wick shows buyers rejected lower prices strongly.',
      bars: bars.slice(-10),
    })
  }

  // 6. Morning Star
  if (n >= 3) {
    const b3 = bars[last - 2], b2 = bars[last - 1], b1 = bars[last]
    const isDownCandle = b3.close < b3.open
    const isSmallBody = Math.abs(b2.close - b2.open) < Math.abs(b3.close - b3.open) * 0.3
    const isUpCandle = b1.close > b1.open && b1.close > (b3.open + b3.close) / 2
    if (isDownCandle && isSmallBody && isUpCandle) {
      results.push({
        symbol, pattern: 'Morning Star', direction: 'bullish',
        confidence: 74, support: Math.min(b3.low, b2.low, b1.low), resistance,
        target: curPrice * 1.06,
        description: '3-candle reversal: down candle → small doji → strong up candle.',
        bars: bars.slice(-10),
      })
    }
  }

  // 7. Inverse Head & Shoulders (simplified)
  const recentLows = lows.slice(-20)
  const midLow = Math.min(...recentLows.slice(8, 12))
  const leftShoulder = Math.min(...recentLows.slice(0, 7))
  const rightShoulder = Math.min(...recentLows.slice(13, 20))
  if (midLow < leftShoulder * 0.98 && midLow < rightShoulder * 0.98 && Math.abs(leftShoulder - rightShoulder) / leftShoulder < 0.03) {
    const necklineIHS = Math.max(...highs.slice(-20))
    results.push({
      symbol, pattern: 'Inverse Head & Shoulders', direction: 'bullish',
      confidence: 82, support: midLow, resistance: necklineIHS,
      target: necklineIHS + (necklineIHS - midLow),
      description: 'Classic reversal: three lows with middle being deepest. Neckline break triggers rally.',
      bars: bars.slice(-20),
    })
  }

  // 8. Falling Wedge
  const wedgeHighs = highs.slice(-15)
  const wedgeLows = lows.slice(-15)
  const highSlope = (wedgeHighs[wedgeHighs.length - 1] - wedgeHighs[0]) / wedgeHighs.length
  const lowSlope = (wedgeLows[wedgeLows.length - 1] - wedgeLows[0]) / wedgeLows.length
  if (highSlope < -0.1 && lowSlope < -0.05 && highSlope < lowSlope) {
    results.push({
      symbol, pattern: 'Falling Wedge', direction: 'bullish',
      confidence: 70, support: Math.min(...wedgeLows), resistance: Math.max(...wedgeHighs),
      target: curPrice * 1.07,
      description: 'Converging downward channel — compressing toward bullish breakout.',
      bars: bars.slice(-15),
    })
  }

  // 9. Cup & Handle
  if (bars.length >= 40) {
    const cupDepth = Math.min(...lows.slice(-40, -10))
    const rimLeft = Math.max(...highs.slice(-40, -25))
    const rimRight = Math.max(...highs.slice(-15, -5))
    const handleLow = Math.min(...lows.slice(-10))
    if (
      Math.abs(rimLeft - rimRight) / rimLeft < 0.03 &&
      cupDepth < rimLeft * 0.93 &&
      handleLow > cupDepth * 1.02 &&
      handleLow < rimRight
    ) {
      results.push({
        symbol, pattern: 'Cup & Handle', direction: 'bullish',
        confidence: 77, support: handleLow, resistance: rimRight,
        target: rimRight + (rimRight - cupDepth),
        description: 'U-shaped cup followed by small pullback handle. Breakout above rim = buy.',
        bars: bars.slice(-40),
      })
    }
  }

  // 10. 4 Green Candles
  const last4up = [last - 3, last - 2, last - 1, last].every(i => closes[i] > opens[i])
  const last4vol = volumes[last] > volumes[last - 1]
  if (last4up && last4vol) {
    results.push({
      symbol, pattern: '4 Green Candles', direction: 'bullish',
      confidence: 65, support, resistance,
      target: curPrice * 1.04,
      description: '4 consecutive green candles with rising volume — strong momentum.',
      bars: bars.slice(-10),
    })
  }

  // 11. Equal Lows (support bounce)
  const lows10 = lows.slice(-10)
  const minL = Math.min(...lows10)
  const equaLows = lows10.filter(l => Math.abs(l - minL) / minL < 0.005)
  if (equaLows.length >= 2 && closes[last] > minL * 1.005) {
    results.push({
      symbol, pattern: 'Equal Lows', direction: 'bullish',
      confidence: 66, support: minL, resistance,
      target: curPrice + (resistance - minL) * 0.5,
      description: 'Multiple touches of same support level. Strong floor identified.',
      bars: bars.slice(-15),
    })
  }

  // 12. Gilligan's Island Buy (gap down then gap up)
  if (n >= 5 && lows[last - 2] > highs[last - 4] + curPrice * 0.005) {
    const gapDown = opens[last - 3] < closes[last - 4] * 0.98
    const gapUp = opens[last] > closes[last - 1] * 1.01
    if (gapDown && gapUp) {
      results.push({
        symbol, pattern: "Gilligan's Island Buy", direction: 'bullish',
        confidence: 71, support, resistance,
        target: curPrice * 1.06,
        description: 'Gap down island reversal followed by gap back up — trapped sellers squeezed.',
        bars: bars.slice(-8),
      })
    }
  }

  // 13. Bullish Reversal (oversold bounce)
  const change5 = (closes[last] - closes[last - 5]) / closes[last - 5]
  const change10 = (closes[last - 5] - closes[last - 10]) / closes[last - 10]
  if (change10 < -0.08 && change5 > 0.03) {
    results.push({
      symbol, pattern: 'Bullish Reversal', direction: 'bullish',
      confidence: 67, support, resistance,
      target: curPrice * 1.06,
      description: 'Oversold stock starting to bounce with volume confirmation.',
      bars: bars.slice(-15),
    })
  }

  // --- BEARISH PATTERNS ---

  // 14. Bear Flag
  const downTrend = closes[last - 8] > closes[last - 3] * 1.04
  const bearFlagHigh = Math.max(...highs.slice(-5))
  const bearFlagLow = Math.min(...lows.slice(-5))
  const bearFlagRange = bearFlagHigh - bearFlagLow
  const bearPoleH = closes[last - 8] - closes[last - 3]
  if (downTrend && bearFlagRange < bearPoleH * 0.4 && closes[last] < closes[last - 5]) {
    results.push({
      symbol, pattern: 'Bear Flag', direction: 'bearish',
      confidence: 74, support: bearFlagLow, resistance: bearFlagHigh,
      target: bearFlagLow - bearPoleH * 0.8,
      description: 'Downtrend consolidates in a channel before continuing lower.',
      bars: bars.slice(-15),
    })
  }

  // 15. Double Top
  const highs25 = highs.slice(-25)
  const maxH = Math.max(...highs25)
  const maxIdx1 = highs25.indexOf(maxH)
  let secondMax = -Infinity, maxIdx2 = -1
  for (let i = 0; i < highs25.length; i++) {
    if (Math.abs(i - maxIdx1) > 4 && highs25[i] > highs25[i - 1] * 0.98 && highs25[i] > secondMax) {
      secondMax = highs25[i]; maxIdx2 = i
    }
  }
  if (maxIdx2 > 0 && Math.abs(maxH - secondMax) / maxH < 0.03 && closes[last] < maxH * 0.97) {
    const necklineDT = Math.min(...lows.slice(-25).slice(Math.min(maxIdx1, maxIdx2), Math.max(maxIdx1, maxIdx2)))
    results.push({
      symbol, pattern: 'Double Top', direction: 'bearish',
      confidence: 80, support: necklineDT, resistance: maxH,
      target: necklineDT - (maxH - necklineDT),
      description: 'Two equal highs signal exhaustion of buying. Neckline break = sell signal.',
      bars: bars.slice(-25),
    })
  }

  // 16. Head & Shoulders
  const midHigh = Math.max(...highs.slice(-20).slice(8, 12))
  const leftHShoulder = Math.max(...highs.slice(-20).slice(0, 7))
  const rightHShoulder = Math.max(...highs.slice(-20).slice(13, 20))
  if (midHigh > leftHShoulder * 1.02 && midHigh > rightHShoulder * 1.02 && Math.abs(leftHShoulder - rightHShoulder) / leftHShoulder < 0.04) {
    const necklineHS = Math.min(...lows.slice(-20))
    results.push({
      symbol, pattern: 'Head & Shoulders', direction: 'bearish',
      confidence: 82, support: necklineHS, resistance: midHigh,
      target: necklineHS - (midHigh - necklineHS),
      description: 'Three peaks with middle tallest. Classic topping pattern — expect reversal.',
      bars: bars.slice(-20),
    })
  }

  // 17. Death Cross
  if (ma20[last] < ma50[last] && ma20[last - 3] >= ma50[last - 3]) {
    results.push({
      symbol, pattern: 'Death Cross', direction: 'bearish',
      confidence: 77, support, resistance: ma50[last],
      target: curPrice * 0.92,
      description: '20-day MA crossed below 50-day MA — bearish momentum accelerating.',
      bars: bars.slice(-30),
    })
  }

  // 18. Rising Wedge
  const rwHighs = highs.slice(-15)
  const rwLows = lows.slice(-15)
  const rwHighSlope = (rwHighs[rwHighs.length - 1] - rwHighs[0]) / rwHighs.length
  const rwLowSlope = (rwLows[rwLows.length - 1] - rwLows[0]) / rwLows.length
  if (rwHighSlope > 0.05 && rwLowSlope > 0.1 && rwLowSlope > rwHighSlope) {
    results.push({
      symbol, pattern: 'Rising Wedge', direction: 'bearish',
      confidence: 69, support: Math.min(...rwLows), resistance: Math.max(...rwHighs),
      target: curPrice * 0.93,
      description: 'Converging upward channel with narrowing range — bearish breakdown coming.',
      bars: bars.slice(-15),
    })
  }

  // 19. Hanging Man
  const lbSize = Math.abs(lastBar.close - lastBar.open)
  const lbLower = Math.min(lastBar.close, lastBar.open) - lastBar.low
  const lbUpper = lastBar.high - Math.max(lastBar.close, lastBar.open)
  if (lbLower > lbSize * 2 && lbUpper < lbSize * 0.5 && closes[last] < closes[last - 5]) {
    results.push({
      symbol, pattern: 'Hanging Man', direction: 'bearish',
      confidence: 67, support, resistance,
      target: curPrice * 0.95,
      description: 'Long lower wick at top of uptrend — sellers testing highs.',
      bars: bars.slice(-10),
    })
  }

  // 20. Evening Star
  if (n >= 3) {
    const b3 = bars[last - 2], b2 = bars[last - 1], b1 = bars[last]
    const isUpC = b3.close > b3.open
    const isSmall = Math.abs(b2.close - b2.open) < Math.abs(b3.close - b3.open) * 0.3
    const isDownC = b1.close < b1.open && b1.close < (b3.open + b3.close) / 2
    if (isUpC && isSmall && isDownC) {
      results.push({
        symbol, pattern: 'Evening Star', direction: 'bearish',
        confidence: 73, support, resistance,
        target: curPrice * 0.94,
        description: '3-candle reversal at top: up candle → doji → strong down candle.',
        bars: bars.slice(-10),
      })
    }
  }

  // 21. Descending Triangle
  const dtLows = lows.slice(-15)
  const dtHighs = highs.slice(-15)
  const dtLowStd = Math.sqrt(dtLows.reduce((a, b) => a + (b - support) ** 2, 0) / dtLows.length)
  const fallingCeiling = dtHighs[0] > dtHighs[dtHighs.length - 1] * 1.01
  if (dtLowStd / support < 0.015 && fallingCeiling) {
    results.push({
      symbol, pattern: 'Descending Triangle', direction: 'bearish',
      confidence: 71, support, resistance: Math.max(...dtHighs),
      target: support - (Math.max(...dtHighs) - support) * 0.7,
      description: 'Flat support + falling highs = mounting pressure. Bearish breakdown likely.',
      bars: bars.slice(-15),
    })
  }

  // 22. 4 Red Candles
  const last4down = [last - 3, last - 2, last - 1, last].every(i => closes[i] < opens[i])
  if (last4down && volumes[last] > volumes[last - 1]) {
    results.push({
      symbol, pattern: '4 Red Candles', direction: 'bearish',
      confidence: 64, support, resistance,
      target: curPrice * 0.96,
      description: '4 consecutive red candles with rising volume — strong selling pressure.',
      bars: bars.slice(-10),
    })
  }

  // 23. Equal Highs (resistance rejection)
  const highs10 = highs.slice(-10)
  const maxH10 = Math.max(...highs10)
  const equalHighs = highs10.filter(h => Math.abs(h - maxH10) / maxH10 < 0.005)
  if (equalHighs.length >= 2 && closes[last] < maxH10 * 0.995) {
    results.push({
      symbol, pattern: 'Equal Highs', direction: 'bearish',
      confidence: 65, support, resistance: maxH10,
      target: curPrice - (maxH10 - support) * 0.5,
      description: 'Multiple rejections at same resistance. Strong ceiling confirmed.',
      bars: bars.slice(-15),
    })
  }

  // 24. Bearish Reversal
  const bChange5 = (closes[last] - closes[last - 5]) / closes[last - 5]
  const bChange10 = (closes[last - 5] - closes[last - 10]) / closes[last - 10]
  if (bChange10 > 0.08 && bChange5 < -0.03) {
    results.push({
      symbol, pattern: 'Bearish Reversal', direction: 'bearish',
      confidence: 66, support, resistance,
      target: curPrice * 0.94,
      description: 'Overbought stock starting to roll over — distribution phase beginning.',
      bars: bars.slice(-15),
    })
  }

  // 25. Gilligan's Island Sell
  if (n >= 5) {
    const gapUpSell = opens[last - 3] > closes[last - 4] * 1.02
    const gapDownSell = opens[last] < closes[last - 1] * 0.99
    if (gapUpSell && gapDownSell) {
      results.push({
        symbol, pattern: "Gilligan's Island Sell", direction: 'bearish',
        confidence: 70, support, resistance,
        target: curPrice * 0.94,
        description: 'Gap up island reversal followed by gap back down — trapped buyers squeezed.',
        bars: bars.slice(-8),
      })
    }
  }

  // NEUTRAL
  // Double Inside Day
  const inside1 = highs[last - 1] <= highs[last - 2] && lows[last - 1] >= lows[last - 2]
  const inside2 = highs[last] <= highs[last - 1] && lows[last] >= lows[last - 1]
  if (inside1 && inside2) {
    results.push({
      symbol, pattern: 'Double Inside Day', direction: 'neutral',
      confidence: 60, support, resistance,
      target: curPrice,
      description: 'Compression pattern — two inside bars signal a big move coming soon.',
      bars: bars.slice(-8),
    })
  }

  return results
}
