'use client'
import { useState } from 'react'

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
  deltaNeeded: number
  suggestedDelta: string
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
}): TradeCalc {
  const { budget, targetProfit, maxLossPercent, stockPrice, strike, premium, optionType, delta } = params
  const contractsAffordable = premium > 0 ? Math.floor(budget / (premium * 100)) : 0
  const totalCost = contractsAffordable * premium * 100
  const maxLoss = Math.min(totalCost, (budget * maxLossPercent) / 100)

  const profitPerShare = targetProfit / Math.max(contractsAffordable, 1) / 100
  const premiumNeeded = premium + profitPerShare
  const maxProfit = contractsAffordable * profitPerShare * 100

  const breakEven = optionType === 'call' ? strike + premium : strike - premium
  const targetStockPrice = optionType === 'call' ? breakEven + profitPerShare / delta : breakEven - profitPerShare / Math.abs(delta)
  const stopLossPremium = premium * (1 - maxLossPercent / 100)
  const stopStockPrice = optionType === 'call' ? stockPrice - (premium - stopLossPremium) / Math.max(delta, 0.01) : stockPrice + (premium - stopLossPremium) / Math.max(Math.abs(delta), 0.01)

  return {
    contractsAffordable,
    totalCost: parseFloat(totalCost.toFixed(2)),
    maxLoss: parseFloat(maxLoss.toFixed(2)),
    maxProfit: parseFloat(maxProfit.toFixed(2)),
    riskReward: maxLoss > 0 ? parseFloat((maxProfit / maxLoss).toFixed(2)) : 0,
    breakEven: parseFloat(breakEven.toFixed(2)),
    targetStockPrice: parseFloat(targetStockPrice.toFixed(2)),
    stopStockPrice: parseFloat(stopStockPrice.toFixed(2)),
    returnOnBudget: totalCost > 0 ? parseFloat(((maxProfit / totalCost) * 100).toFixed(1)) : 0,
    deltaNeeded: parseFloat((targetProfit / (contractsAffordable * 100 * stockPrice * 0.01)).toFixed(2)),
    suggestedDelta: delta < 0.25 ? 'Too risky for beginners — try 0.30+ delta' : delta < 0.40 ? 'Good — lottery ticket / momentum play' : delta < 0.60 ? '✅ Sweet spot — balanced risk/reward' : 'Deep ITM — high cost, lower reward %',
  }
}

const RULES = [
  { rule: 'Never risk more than 50% of daily budget on one trade', detail: 'If budget is $200, max $100 per trade. Split into 2 trades.' },
  { rule: 'Set your stop BEFORE entering', detail: 'If premium drops 40-50%, exit. No exceptions. Cut losses fast.' },
  { rule: 'Take profits at 25-50% gain', detail: 'On a $200 trade, $50-100 profit = take it. Greed kills accounts.' },
  { rule: 'Only trade A-grade setups', detail: 'Gap + volume + momentum = A grade. Never chase weak signals.' },
  { rule: 'Trade in the 10-11am or 2-3pm windows', detail: 'Avoid first 30 min (wide spreads) and last 30 min (theta burn).' },
  { rule: 'One trade at a time as a beginner', detail: 'Master one setup before running multiple positions.' },
  { rule: 'IV Rank < 30: buy options. IV Rank > 70: sell or use spreads', detail: 'Never buy expensive premium. Check VIX and IV Rank first.' },
  { rule: 'Check bid/ask spread — must be < 10% of premium', detail: 'Wide spreads = you\'re giving money away. Use midpoint orders.' },
]

export default function TradePlannerPage() {
  const [budget, setBudget] = useState(200)
  const [targetProfit, setTargetProfit] = useState(50)
  const [maxLossPercent, setMaxLossPercent] = useState(50)
  const [stockPrice, setStockPrice] = useState(500)
  const [strike, setStrike] = useState(502)
  const [premium, setPremium] = useState(1.5)
  const [optionType, setOptionType] = useState<'call' | 'put'>('call')
  const [delta, setDelta] = useState(0.4)

  const result = calc({ budget, targetProfit, maxLossPercent, stockPrice, strike, premium, optionType, delta })

  const isGoodRR = result.riskReward >= 1.5
  const isAffordable = result.contractsAffordable > 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🎯 Trade Planner</h1>
        <p className="text-gray-400 mt-1 text-sm">Position sizing, break-even, risk/reward — calculated precisely for your budget. Know your numbers before you click Buy.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-white font-bold mb-4">💼 Your Parameters</div>
            <div className="space-y-3">
              {[
                { label: 'Budget', value: budget, set: setBudget, prefix: '$', step: 50 },
                { label: 'Profit Target', value: targetProfit, set: setTargetProfit, prefix: '$', step: 10 },
                { label: 'Max Loss %', value: maxLossPercent, set: setMaxLossPercent, suffix: '%', step: 5 },
              ].map(({ label, value, set, prefix, suffix, step }) => (
                <div key={label} className="flex items-center justify-between">
                  <label className="text-gray-400 text-sm">{label}</label>
                  <div className="flex items-center gap-2">
                    {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
                    <input type="number" value={value} step={step} onChange={e => set(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                    {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-white font-bold mb-4">📋 Option Details</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-sm">Type</label>
                <div className="flex gap-2">
                  {(['call', 'put'] as const).map(t => (
                    <button key={t} onClick={() => setOptionType(t)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${optionType === t ? (t === 'call' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-800 text-gray-400'}`}>
                      {t === 'call' ? '📈 CALL' : '📉 PUT'}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: 'Stock Price', value: stockPrice, set: setStockPrice, prefix: '$', step: 1 },
                { label: 'Strike Price', value: strike, set: setStrike, prefix: '$', step: 1 },
                { label: 'Premium (per share)', value: premium, set: setPremium, prefix: '$', step: 0.05 },
                { label: 'Delta', value: delta, set: setDelta, step: 0.05 },
              ].map(({ label, value, set, prefix, step }) => (
                <div key={label} className="flex items-center justify-between">
                  <label className="text-gray-400 text-sm">{label}</label>
                  <div className="flex items-center gap-2">
                    {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
                    <input type="number" value={value} step={step} onChange={e => set(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                  </div>
                </div>
              ))}
              <div className="text-xs text-blue-400 bg-blue-950/30 rounded p-2">{result.suggestedDelta}</div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className={`rounded-xl border p-5 ${isAffordable && isGoodRR ? 'bg-green-950/20 border-green-700/40' : !isAffordable ? 'bg-red-950/20 border-red-700/40' : 'bg-yellow-950/20 border-yellow-700/30'}`}>
            <div className="text-white font-bold mb-4">📊 Trade Analysis</div>

            {!isAffordable ? (
              <div className="text-red-400 font-bold">❌ Premium too expensive for your budget. Increase budget or find cheaper option.</div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Contracts', value: `${result.contractsAffordable}`, color: 'text-white text-2xl font-black' },
                    { label: 'Total Cost', value: `$${result.totalCost.toFixed(2)}`, color: 'text-white text-2xl font-black' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-950/50 rounded-xl p-3">
                      <div className="text-gray-500 text-xs mb-1">{label}</div>
                      <div className={color}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-950/30 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Max Profit</div>
                    <div className="text-green-400 font-bold text-lg">+${result.maxProfit.toFixed(0)}</div>
                    <div className="text-green-600 text-xs">+{result.returnOnBudget}% ROI</div>
                  </div>
                  <div className="bg-red-950/30 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Max Loss</div>
                    <div className="text-red-400 font-bold text-lg">-${result.maxLoss.toFixed(0)}</div>
                    <div className="text-red-600 text-xs">-{maxLossPercent}% of budget</div>
                  </div>
                  <div className={`rounded-xl p-3 ${isGoodRR ? 'bg-blue-950/30' : 'bg-gray-800/50'}`}>
                    <div className="text-gray-500 text-xs mb-1">Risk/Reward</div>
                    <div className={`font-bold text-lg ${isGoodRR ? 'text-blue-400' : 'text-yellow-400'}`}>1:{result.riskReward}</div>
                    <div className={`text-xs ${isGoodRR ? 'text-blue-600' : 'text-yellow-600'}`}>{isGoodRR ? '✅ Good' : '⚠️ Thin margin'}</div>
                  </div>
                </div>

                <div className="bg-gray-950/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="text-gray-400 text-xs font-bold uppercase mb-2">Key Levels</div>
                  <div className="flex justify-between"><span className="text-gray-500">Break-even price:</span> <span className="text-white font-medium">${result.breakEven}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Target stock price:</span> <span className="text-green-400 font-bold">${result.targetStockPrice} ✅ SELL HERE</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Stop-loss price:</span> <span className="text-red-400 font-bold">${result.stopStockPrice} 🚨 EXIT HERE</span></div>
                </div>

                {/* Visual P&L bar */}
                <div>
                  <div className="text-gray-500 text-xs mb-2">P&amp;L Spectrum</div>
                  <div className="relative h-6 rounded-full overflow-hidden flex">
                    <div className="bg-red-900/60 flex-1 flex items-center justify-center text-xs text-red-400 font-bold">-${result.maxLoss.toFixed(0)}</div>
                    <div className="bg-gray-700 w-px" />
                    <div className="bg-green-900/60 flex-1 flex items-center justify-center text-xs text-green-400 font-bold">+${result.maxProfit.toFixed(0)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wall Street Rules */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="text-white font-bold mb-4">📏 Wall Street Rules for Options Day Trading</div>
        <div className="grid grid-cols-2 gap-3">
          {RULES.map((r, i) => (
            <div key={i} className="flex gap-3">
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
