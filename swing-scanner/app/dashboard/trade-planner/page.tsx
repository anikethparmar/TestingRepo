'use client'
import { useState } from 'react'
import PageHelp from '@/components/PageHelp'

const HELP = {
  title: 'Trade Planner',
  sections: [
    {
      heading: 'How to use this calculator',
      tips: [
        'Enter your budget, profit target, and option details from the Options Chain page.',
        'The calculator shows exactly how many contracts to buy, your break-even, and where to set your stop.',
        'Always plan the trade BEFORE you enter — never wing it in the moment.',
        'If Risk/Reward is below 1:1.5, skip the trade. The math doesn\'t work in your favor.',
      ],
    },
    {
      heading: 'Expected Move',
      tips: [
        'The expected move is how far the market prices the stock to move by expiration (1 standard deviation).',
        'Formula: IV × √(DTE/365) × Stock Price',
        '68% chance the stock stays within ±1 SD by expiry.',
        'If your strike is outside the expected move, probability is against you — price accordingly.',
        'Use the expected move to decide between ITM (inside EM) and OTM (outside EM) strikes.',
      ],
      link: { label: 'Expected move explained', url: 'https://www.tastylive.com/learn/expected-move', source: 'tastylive' },
    },
    {
      heading: 'Theta Burn',
      tips: [
        'Theta is the daily dollar cost of holding an option (time decay).',
        'For 0DTE trades, theta accelerates drastically after 2 PM — exit before 3:30 PM.',
        'If your position\'s theta burn is bigger than your expected gain, the trade is a losing bet over time.',
        'Theta benefits SELLERS (credit spreads). Theta hurts BUYERS (debit spreads, naked options).',
      ],
      link: { label: 'Time decay & theta', url: 'https://www.investopedia.com/terms/t/timedecay.asp', source: 'Investopedia' },
    },
    {
      heading: 'P&L Simulator',
      tips: [
        'Shows estimated P&L at different stock price moves using delta + gamma (second-order approximation).',
        'Delta: linear component — how much the option gains per $1 stock move.',
        'Gamma: curvature — option gains accelerate as it moves more in-the-money.',
        'Note: Does not include theta (time decay) or vega (IV change) effects.',
        'Use this to stress-test your trade: "If SPY drops 3%, what happens?"',
      ],
    },
  ],
}

interface TradeCalc {
  contractsAffordable: number
  totalCost: number
  maxLoss: number
  maxProfit: number
  riskReward: number
  breakEven: number
  targetStockPrice: number
  stopStockPrice: number
  returnOnBudget: number
  suggestedDelta: string
  expectedMoveUp: number
  expectedMoveDown: number
  expectedMovePct: number
  thetaPerDay: number
  thetaPerHour: number
  thetaFor4h: number
  scenarios: { move: string; priceDelta: number; pl: number; plPct: number }[]
  ivLabel: string
  ivAction: string
}

function calc(params: {
  budget: number
  targetProfit: number
  maxLossPercent: number
  stockPrice: number
  strike: number
  premium: number
  optionType: 'call' | 'put'
  delta: number
  gamma: number
  theta: number
  iv: number
  dte: number
}): TradeCalc {
  const { budget, targetProfit, maxLossPercent, stockPrice, strike, premium, optionType, delta, gamma, theta, iv, dte } = params
  const contracts = premium > 0 ? Math.floor(budget / (premium * 100)) : 0
  const totalCost = contracts * premium * 100
  const maxLoss = Math.min(totalCost, (budget * maxLossPercent) / 100)
  const profitPerShare = contracts > 0 ? targetProfit / contracts / 100 : 0
  const maxProfit = contracts * profitPerShare * 100
  const breakEven = optionType === 'call' ? strike + premium : strike - premium
  const targetStockPrice = optionType === 'call'
    ? breakEven + profitPerShare / Math.max(delta, 0.01)
    : breakEven - profitPerShare / Math.max(Math.abs(delta), 0.01)
  const stopLossPremium = premium * (1 - maxLossPercent / 100)
  const stopStockPrice = optionType === 'call'
    ? stockPrice - (premium - stopLossPremium) / Math.max(delta, 0.01)
    : stockPrice + (premium - stopLossPremium) / Math.max(Math.abs(delta), 0.01)

  // Expected move: IV × sqrt(DTE/365) × spot (1 standard deviation)
  const ivDecimal = iv / 100
  const expectedMovePct = ivDecimal * Math.sqrt(Math.max(dte, 1) / 365) * 100
  const expectedMoveUp = stockPrice * (1 + ivDecimal * Math.sqrt(Math.max(dte, 1) / 365))
  const expectedMoveDown = stockPrice * (1 - ivDecimal * Math.sqrt(Math.max(dte, 1) / 365))

  // Theta burn
  const thetaPerDay = Math.abs(theta) * contracts * 100
  const thetaPerHour = thetaPerDay / 6.5 // trading hours
  const thetaFor4h = thetaPerHour * 4

  // P&L simulator using delta + gamma approximation
  // ΔP = (delta × ΔS + 0.5 × gamma × ΔS²) × 100 × contracts
  const moves = [-0.05, -0.03, -0.01, 0, 0.01, 0.03, 0.05]
  const scenarios = moves.map(pct => {
    const ds = stockPrice * pct
    const rawPL = (delta * ds + 0.5 * gamma * ds * ds) * 100 * contracts
    const pl = Math.max(-totalCost, Math.min(rawPL, maxProfit * 2))
    return {
      move: pct === 0 ? 'Flat' : `${pct > 0 ? '+' : ''}${(pct * 100).toFixed(0)}%`,
      priceDelta: ds,
      pl: parseFloat(pl.toFixed(2)),
      plPct: totalCost > 0 ? parseFloat(((pl / totalCost) * 100).toFixed(1)) : 0,
    }
  })

  // IV label
  const ivLabel = iv < 20 ? 'LOW IV' : iv < 40 ? 'NORMAL IV' : iv < 70 ? 'ELEVATED IV' : 'HIGH IV'
  const ivAction = iv < 25 ? 'Buy premium outright — cheap options' :
    iv < 45 ? 'Debit spreads — standard conditions' :
    iv < 70 ? 'Spreads only — premium is expensive' :
    'Consider selling premium (iron condor, credit spread)'

  return {
    contractsAffordable: contracts,
    totalCost: parseFloat(totalCost.toFixed(2)),
    maxLoss: parseFloat(maxLoss.toFixed(2)),
    maxProfit: parseFloat(maxProfit.toFixed(2)),
    riskReward: maxLoss > 0 ? parseFloat((maxProfit / maxLoss).toFixed(2)) : 0,
    breakEven: parseFloat(breakEven.toFixed(2)),
    targetStockPrice: parseFloat(targetStockPrice.toFixed(2)),
    stopStockPrice: parseFloat(stopStockPrice.toFixed(2)),
    returnOnBudget: totalCost > 0 ? parseFloat(((maxProfit / totalCost) * 100).toFixed(1)) : 0,
    suggestedDelta: delta < 0.25 ? 'Very OTM — high risk, lottery ticket' :
      delta < 0.40 ? 'Good — momentum/aggressive play' :
      delta < 0.60 ? '✓ Sweet spot — balanced risk/reward' :
      'Deep ITM — safer, lower % return',
    expectedMoveUp: parseFloat(expectedMoveUp.toFixed(2)),
    expectedMoveDown: parseFloat(expectedMoveDown.toFixed(2)),
    expectedMovePct: parseFloat(expectedMovePct.toFixed(1)),
    thetaPerDay,
    thetaPerHour,
    thetaFor4h,
    scenarios,
    ivLabel,
    ivAction,
  }
}

const RULES = [
  { rule: 'Never risk more than 50% of daily budget per trade', detail: '$200 budget → max $100/trade. Split into 2 setups.' },
  { rule: 'Set your stop BEFORE entering — no exceptions', detail: 'If premium drops 40–50%, exit. Cut losses fast, never hope.' },
  { rule: 'Take profits at 50–80% of max gain', detail: 'On a $200 trade, $50–100 profit = take it. Greed destroys accounts.' },
  { rule: 'Check IV Rank before buying any option', detail: 'IV < 30 = buy calls/puts. IV > 70 = use spreads or sell premium.' },
  { rule: 'Trade the 10–11 AM or 2–3 PM windows only', detail: 'First 30 min = wide spreads. Last 30 min = theta destroys value.' },
  { rule: 'Check bid/ask spread — must be < 10% of premium', detail: 'Wide spread = giving money away. Use limit orders at midpoint.' },
]

export default function TradePlannerPage() {
  const [budget, setBudget] = useState(200)
  const [targetProfit, setTargetProfit] = useState(50)
  const [maxLossPercent, setMaxLossPercent] = useState(50)
  const [stockPrice, setStockPrice] = useState(500)
  const [strike, setStrike] = useState(502)
  const [premium, setPremium] = useState(1.5)
  const [optionType, setOptionType] = useState<'call' | 'put'>('call')
  const [delta, setDelta] = useState(0.40)
  const [gamma, setGamma] = useState(0.02)
  const [theta, setTheta] = useState(0.05)
  const [iv, setIv] = useState(35)
  const [dte, setDte] = useState(1)

  const r = calc({ budget, targetProfit, maxLossPercent, stockPrice, strike, premium, optionType, delta, gamma, theta, iv, dte })
  const isGoodRR = r.riskReward >= 1.5
  const isAffordable = r.contractsAffordable > 0

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">🎯 Trade Planner</h1>
        <p className="text-gray-400 mt-1 text-sm">Position sizing, expected move, P&L scenarios, and theta burn — know every number before you click Buy.</p>
      </div>

      <PageHelp {...HELP} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Inputs ── */}
        <div className="space-y-4">
          {/* Budget */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-white font-bold mb-3 text-sm">💼 Budget & Goal</div>
            <div className="space-y-2.5">
              {[
                { label: 'Budget', value: budget, set: setBudget, prefix: '$', step: 50 },
                { label: 'Profit Target', value: targetProfit, set: setTargetProfit, prefix: '$', step: 10 },
                { label: 'Max Loss %', value: maxLossPercent, set: setMaxLossPercent, suffix: '%', step: 5 },
              ].map(({ label, value, set, prefix, suffix, step }) => (
                <div key={label} className="flex items-center justify-between">
                  <label className="text-gray-400 text-sm">{label}</label>
                  <div className="flex items-center gap-1.5">
                    {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
                    <input type="number" value={value} step={step}
                      onChange={e => set(Number(e.target.value))}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm w-20 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                    />
                    {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Option details */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-white font-bold mb-3 text-sm">📋 Option Details</div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-sm">Type</label>
                <div className="flex gap-2">
                  {(['call', 'put'] as const).map(t => (
                    <button key={t} onClick={() => setOptionType(t)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${optionType === t ? (t === 'call' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-800 text-gray-400'}`}>
                      {t === 'call' ? '📈 CALL' : '📉 PUT'}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: 'Stock Price', value: stockPrice, set: setStockPrice, prefix: '$', step: 1 },
                { label: 'Strike Price', value: strike, set: setStrike, prefix: '$', step: 1 },
                { label: 'Premium / share', value: premium, set: setPremium, prefix: '$', step: 0.05 },
                { label: 'Delta', value: delta, set: setDelta, step: 0.05 },
                { label: 'Gamma', value: gamma, set: setGamma, step: 0.005 },
                { label: 'Theta / day', value: theta, set: setTheta, step: 0.01 },
                { label: 'IV %', value: iv, set: setIv, suffix: '%', step: 1 },
                { label: 'DTE (days)', value: dte, set: setDte, step: 1 },
              ].map(({ label, value, set, prefix, suffix, step }) => (
                <div key={label} className="flex items-center justify-between">
                  <label className="text-gray-400 text-sm">{label}</label>
                  <div className="flex items-center gap-1.5">
                    {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
                    <input type="number" value={value} step={step}
                      onChange={e => set(Number(e.target.value))}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm w-20 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                    />
                    {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
                  </div>
                </div>
              ))}
              <div className="text-xs text-blue-400 bg-blue-950/30 rounded p-2 mt-1">{r.suggestedDelta}</div>
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="space-y-4">
          {/* IV environment */}
          <div className={`rounded-xl border p-3 ${
            iv < 25 ? 'bg-green-950/20 border-green-700/30' :
            iv < 45 ? 'bg-blue-950/20 border-blue-700/30' :
            iv < 70 ? 'bg-yellow-950/20 border-yellow-700/30' :
            'bg-red-950/20 border-red-700/30'
          }`}>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold">IV Environment</div>
                <div className={`font-bold ${iv < 25 ? 'text-green-400' : iv < 45 ? 'text-blue-400' : iv < 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {r.ivLabel} — {iv}%
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-300 mt-1">{r.ivAction}</div>
          </div>

          {/* Core position analysis */}
          <div className={`rounded-xl border p-4 ${isAffordable && isGoodRR ? 'bg-green-950/20 border-green-700/40' : !isAffordable ? 'bg-red-950/20 border-red-700/40' : 'bg-yellow-950/20 border-yellow-700/30'}`}>
            <div className="text-white font-bold mb-3 text-sm">📊 Position Analysis</div>
            {!isAffordable ? (
              <div className="text-red-400 text-sm">❌ Premium too expensive for budget. Reduce premium or increase budget.</div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-950/50 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-0.5">Contracts</div>
                    <div className="text-white text-2xl font-black">{r.contractsAffordable}</div>
                  </div>
                  <div className="bg-gray-950/50 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-0.5">Total Cost</div>
                    <div className="text-white text-2xl font-black">${r.totalCost.toFixed(0)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-950/30 rounded-lg p-2.5">
                    <div className="text-gray-500 text-xs">Max Profit</div>
                    <div className="text-green-400 font-bold">+${r.maxProfit.toFixed(0)}</div>
                    <div className="text-green-700 text-xs">+{r.returnOnBudget}%</div>
                  </div>
                  <div className="bg-red-950/30 rounded-lg p-2.5">
                    <div className="text-gray-500 text-xs">Max Loss</div>
                    <div className="text-red-400 font-bold">-${r.maxLoss.toFixed(0)}</div>
                    <div className="text-red-700 text-xs">-{maxLossPercent}%</div>
                  </div>
                  <div className={`rounded-lg p-2.5 ${isGoodRR ? 'bg-blue-950/30' : 'bg-gray-800/50'}`}>
                    <div className="text-gray-500 text-xs">Risk/Reward</div>
                    <div className={`font-bold ${isGoodRR ? 'text-blue-400' : 'text-yellow-400'}`}>1:{r.riskReward}</div>
                    <div className={`text-xs ${isGoodRR ? 'text-blue-700' : 'text-yellow-700'}`}>{isGoodRR ? '✓ Good' : 'Thin'}</div>
                  </div>
                </div>
                <div className="bg-gray-950/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">Key Prices</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Break-even</span>
                    <span className="text-white font-medium">${r.breakEven}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Take profit at</span>
                    <span className="text-green-400 font-bold">${r.targetStockPrice} → EXIT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stop-loss at</span>
                    <span className="text-red-400 font-bold">${r.stopStockPrice} → EXIT</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expected Move */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="text-white font-bold mb-2 text-sm">📐 Expected Move ({dte}DTE @ {iv}% IV)</div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-center">
                <div className="text-red-400 font-bold text-lg">${r.expectedMoveDown.toFixed(2)}</div>
                <div className="text-gray-500 text-xs">1 SD down</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-1">±{r.expectedMovePct}%</div>
                <div className="text-white font-bold">${stockPrice.toFixed(2)}</div>
                <div className="text-gray-500 text-xs">current</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">${r.expectedMoveUp.toFixed(2)}</div>
                <div className="text-gray-500 text-xs">1 SD up</div>
              </div>
            </div>
            <div className="relative h-2 bg-gray-800 rounded-full mb-2">
              <div className="absolute h-2 bg-gradient-to-r from-red-600 via-gray-500 to-green-600 rounded-full opacity-40 w-full" />
              <div className="absolute h-3 w-0.5 bg-white rounded-full top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" />
            </div>
            <div className="text-gray-500 text-xs">
              68% chance stock stays between ${r.expectedMoveDown.toFixed(2)} – ${r.expectedMoveUp.toFixed(2)} by expiry.
              {optionType === 'call'
                ? ` Your strike $${strike} is ${strike > r.expectedMoveUp ? '❌ outside' : '✓ inside'} the expected move.`
                : ` Your strike $${strike} is ${strike < r.expectedMoveDown ? '❌ outside' : '✓ inside'} the expected move.`
              }
            </div>
          </div>

          {/* Theta burn */}
          {theta > 0 && r.contractsAffordable > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="text-white font-bold mb-2 text-sm">⏱ Theta Burn ({r.contractsAffordable} contracts)</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-red-400 font-bold">${r.thetaPerHour.toFixed(2)}</div>
                  <div className="text-gray-500 text-xs">per hour</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-red-400 font-bold">${r.thetaFor4h.toFixed(2)}</div>
                  <div className="text-gray-500 text-xs">4 hours</div>
                </div>
                <div className="bg-red-950/30 rounded-lg p-2 border border-red-900/40">
                  <div className="text-red-400 font-bold">${r.thetaPerDay.toFixed(2)}</div>
                  <div className="text-gray-500 text-xs">full day</div>
                </div>
              </div>
              <div className="text-gray-500 text-xs mt-2">
                Your position loses ${r.thetaPerHour.toFixed(2)}/hour to time decay even if the stock doesn't move.
                {dte === 0 || dte === 1 ? ' 0DTE theta accelerates into the close — exit before 3:30 PM.' : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* P&L Simulator */}
      {isAffordable && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <div className="text-white font-bold mb-3 text-sm">📈 P&L Scenario Simulator (delta + gamma)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <th className="text-left py-2 pr-4">Move</th>
                  <th className="text-right py-2 pr-4">Stock Price</th>
                  <th className="text-right py-2 pr-4">P&L</th>
                  <th className="text-right py-2">% of Cost</th>
                </tr>
              </thead>
              <tbody>
                {r.scenarios.map((s, i) => (
                  <tr key={i} className={`border-b border-gray-800/50 ${s.move === 'Flat' ? 'bg-gray-800/30' : ''}`}>
                    <td className={`py-2 pr-4 font-bold ${s.pl > 0 ? 'text-green-400' : s.pl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {s.move}
                    </td>
                    <td className="text-right py-2 pr-4 text-gray-300">
                      ${(stockPrice + s.priceDelta).toFixed(2)}
                    </td>
                    <td className={`text-right py-2 pr-4 font-bold ${s.pl > 0 ? 'text-green-400' : s.pl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {s.pl >= 0 ? '+' : ''}${s.pl.toFixed(2)}
                    </td>
                    <td className={`text-right py-2 font-medium ${s.plPct > 0 ? 'text-green-500' : s.plPct < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      {s.plPct >= 0 ? '+' : ''}{s.plPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-gray-600 text-xs mt-2">Estimates using delta + gamma. Does not account for IV change (vega) or time decay (theta).</div>
        </div>
      )}

      {/* Rules */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-white font-bold mb-3 text-sm">📏 Options Day Trading Rules</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RULES.map((r, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-blue-400 font-black text-sm mt-0.5 shrink-0">{i + 1}.</span>
              <div>
                <div className="text-white text-sm font-medium">{r.rule}</div>
                <div className="text-gray-500 text-xs mt-0.5">{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
