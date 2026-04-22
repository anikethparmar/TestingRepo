'use client'
import { useState, useEffect } from 'react'
import type { AppConfig } from '@/app/api/store/config/route'

const DEFAULTS: AppConfig = {
  budget: 200,
  targetProfit: 50,
  minMarketCap: 1_000_000_000,
  minVolume: 500_000,
  numTickers: 30,
  minOptionVolume: 1_000,
  optionsOnly: false,
  manualTickers: '',
}

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toString()
}

export default function ConfigPage() {
  const [config, setConfig] = useState<AppConfig>(DEFAULTS)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/store/config')
      .then(r => r.json())
      .then(d => setConfig(d))
      .catch(() => {/* use defaults */})
  }, [])

  async function save() {
    setStatus('saving')
    try {
      await fetch('/api/store/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  async function reset() {
    setConfig(DEFAULTS)
    await fetch('/api/store/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULTS),
    })
  }

  const recipes = [
    { label: 'Options Focus',  fn: () => setConfig(c => ({ ...c, numTickers: 20, minOptionVolume: 5000, optionsOnly: true })) },
    { label: 'Large Cap Only', fn: () => setConfig(c => ({ ...c, minMarketCap: 10_000_000_000, numTickers: 25 })) },
    { label: 'High Volume',    fn: () => setConfig(c => ({ ...c, minVolume: 2_000_000 })) },
    { label: 'Starter Setup',  fn: () => setConfig(DEFAULTS) },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white">⚙️ Config</h1>
        <p className="text-gray-400 mt-1 text-sm">Your settings are saved to the cloud — same across all devices.</p>
      </div>

      {/* Quick recipes */}
      <div className="mb-5">
        <div className="text-xs text-gray-500 uppercase font-bold mb-2">Quick Presets</div>
        <div className="flex gap-2 flex-wrap">
          {recipes.map(r => (
            <button key={r.label} onClick={r.fn}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-lg border border-gray-700 transition-colors">
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Daily goal */}
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 sm:p-5">
          <div className="text-blue-300 font-bold text-sm mb-3">💰 Daily Trading Goal</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Daily Budget', key: 'budget' as const, min: 50, max: 1000, step: 50, prefix: '$', hint: 'Max you risk per day' },
              { label: 'Profit Target', key: 'targetProfit' as const, min: 10, max: 500, step: 10, prefix: '$', hint: 'What you aim to make' },
            ].map(({ label, key, min, max, step, prefix, hint }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{label}</span>
                  <span className="text-blue-400 font-bold">{prefix}{config[key]}</span>
                </div>
                <input type="range" min={min} max={max} step={step}
                  value={config[key]}
                  onChange={e => setConfig(c => ({ ...c, [key]: Number(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
                <div className="text-gray-600 text-xs mt-1">{hint}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-blue-400 bg-blue-950/40 rounded-lg p-2">
            Return target: {config.budget > 0 ? ((config.targetProfit / config.budget) * 100).toFixed(0) : 0}% per day
            · Stop after {config.budget > 0 ? Math.floor(config.budget / (config.targetProfit * 0.8)) : 3} losing trades
          </div>
        </div>

        {/* Min Market Cap */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium text-sm">Min Market Cap</div>
              <div className="text-gray-500 text-xs">Filters out micro-cap / penny stocks</div>
            </div>
            <div className="text-blue-400 font-bold">{fmt(config.minMarketCap)}</div>
          </div>
          <input type="range" min={100_000_000} max={50_000_000_000} step={100_000_000}
            value={config.minMarketCap}
            onChange={e => setConfig(c => ({ ...c, minMarketCap: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1"><span>$100M</span><span>$50B</span></div>
        </div>

        {/* Min Volume */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium text-sm">Min Daily Volume</div>
              <div className="text-gray-500 text-xs">Ensures enough liquidity to trade</div>
            </div>
            <div className="text-blue-400 font-bold">{fmt(config.minVolume)}</div>
          </div>
          <input type="range" min={100_000} max={10_000_000} step={100_000}
            value={config.minVolume}
            onChange={e => setConfig(c => ({ ...c, minVolume: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1"><span>100K</span><span>10M</span></div>
        </div>

        {/* Num Tickers */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium text-sm">Tickers to Scan</div>
              <div className="text-gray-500 text-xs">More tickers = more setups but slower scan</div>
            </div>
            <div className="text-blue-400 font-bold">{config.numTickers}</div>
          </div>
          <input type="range" min={5} max={80} step={5}
            value={config.numTickers}
            onChange={e => setConfig(c => ({ ...c, numTickers: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1"><span>5</span><span>80</span></div>
        </div>

        {/* Min Option Volume */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium text-sm">Min Option Volume</div>
              <div className="text-gray-500 text-xs">Only stocks with active options markets</div>
            </div>
            <div className="text-blue-400 font-bold">{fmt(config.minOptionVolume)}</div>
          </div>
          <input type="range" min={100} max={20_000} step={100}
            value={config.minOptionVolume}
            onChange={e => setConfig(c => ({ ...c, minOptionVolume: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1"><span>100</span><span>20K</span></div>
        </div>

        {/* Options Only toggle */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium text-sm">Options Only</div>
              <div className="text-gray-500 text-xs">Only show stocks that meet the option volume threshold</div>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, optionsOnly: !c.optionsOnly }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.optionsOnly ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.optionsOnly ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Manual tickers */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <div className="text-white font-medium text-sm mb-1">Manual Watchlist (Override)</div>
          <div className="text-gray-500 text-xs mb-3">Enter specific tickers to scan. Comma-separated. Leave blank to use auto-scan.</div>
          <textarea
            value={config.manualTickers}
            onChange={e => setConfig(c => ({ ...c, manualTickers: e.target.value }))}
            placeholder="e.g. AAPL, TSLA, NVDA, SPY, QQQ"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3 mt-5">
        <button onClick={save} disabled={status === 'saving'}
          className={`flex-1 font-semibold py-3 rounded-xl transition-colors ${
            status === 'saved' ? 'bg-green-600 text-white' :
            status === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
          {status === 'saving' ? 'Saving...' : status === 'saved' ? '✓ Saved to cloud!' : status === 'error' ? '✗ Save failed' : 'Save Config'}
        </button>
        <button onClick={reset}
          className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition-colors border border-gray-700">
          Reset
        </button>
      </div>
      <p className="text-gray-600 text-xs text-center mt-3">Settings sync across all your devices via Vercel KV.</p>
    </div>
  )
}
