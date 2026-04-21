'use client'
import { useState, useEffect } from 'react'

interface Config {
  minMarketCap: number
  minVolume: number
  numTickers: number
  minOptionVolume: number
  optionsOnly: boolean
  manualTickers: string
}

const DEFAULTS: Config = {
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
  const [config, setConfig] = useState<Config>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('swingConfig')
      if (stored) setConfig(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  function save() {
    localStorage.setItem('swingConfig', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function reset() {
    setConfig(DEFAULTS)
    localStorage.removeItem('swingConfig')
  }

  const recipes = [
    { label: 'Options Focus', fn: () => setConfig(c => ({ ...c, numTickers: 20, minOptionVolume: 5000, optionsOnly: true })) },
    { label: 'Swing Setups', fn: () => setConfig(c => ({ ...c, numTickers: 50, optionsOnly: false, minMarketCap: 500_000_000 })) },
    { label: 'Large Cap Only', fn: () => setConfig(c => ({ ...c, minMarketCap: 10_000_000_000, numTickers: 25 })) },
    { label: 'High Volume', fn: () => setConfig(c => ({ ...c, minVolume: 2_000_000 })) },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">⚙️ Config</h1>
        <p className="text-gray-400 mt-1">Set your scanner filters. These are saved locally and used by all modules.</p>
      </div>

      {/* Quick recipes */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2">Quick presets:</div>
        <div className="flex gap-2 flex-wrap">
          {recipes.map(r => (
            <button key={r.label} onClick={r.fn} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-lg border border-gray-700 transition-colors">
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Min Market Cap */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium">Min Market Cap</div>
              <div className="text-gray-500 text-sm">Filters out tiny/micro-cap stocks</div>
            </div>
            <div className="text-blue-400 font-bold text-lg">{fmt(config.minMarketCap)}</div>
          </div>
          <input
            type="range" min={100_000_000} max={50_000_000_000} step={100_000_000}
            value={config.minMarketCap}
            onChange={e => setConfig(c => ({ ...c, minMarketCap: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>$100M</span><span>$50B</span>
          </div>
        </div>

        {/* Min Volume */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium">Min Daily Volume</div>
              <div className="text-gray-500 text-sm">Ensures enough liquidity</div>
            </div>
            <div className="text-blue-400 font-bold text-lg">{fmt(config.minVolume)}</div>
          </div>
          <input
            type="range" min={100_000} max={10_000_000} step={100_000}
            value={config.minVolume}
            onChange={e => setConfig(c => ({ ...c, minVolume: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>100K</span><span>10M</span>
          </div>
        </div>

        {/* Num Tickers */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium">Number of Tickers</div>
              <div className="text-gray-500 text-sm">How many stocks to scan (more = slower)</div>
            </div>
            <div className="text-blue-400 font-bold text-lg">{config.numTickers}</div>
          </div>
          <input
            type="range" min={5} max={80} step={5}
            value={config.numTickers}
            onChange={e => setConfig(c => ({ ...c, numTickers: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>5</span><span>80</span>
          </div>
        </div>

        {/* Min Option Volume */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium">Min Option Volume</div>
              <div className="text-gray-500 text-sm">Filter stocks with enough options liquidity</div>
            </div>
            <div className="text-blue-400 font-bold text-lg">{fmt(config.minOptionVolume)}</div>
          </div>
          <input
            type="range" min={100} max={20_000} step={100}
            value={config.minOptionVolume}
            onChange={e => setConfig(c => ({ ...c, minOptionVolume: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>100</span><span>20K</span>
          </div>
        </div>

        {/* Options Only */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Options Only</div>
              <div className="text-gray-500 text-sm">Only include stocks that meet option volume threshold</div>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, optionsOnly: !c.optionsOnly }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.optionsOnly ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.optionsOnly ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Manual Tickers */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-white font-medium mb-1">Manual Tickers (Override)</div>
          <div className="text-gray-500 text-sm mb-3">Enter specific tickers to scan instead of auto-fetching. Comma-separated.</div>
          <textarea
            value={config.manualTickers}
            onChange={e => setConfig(c => ({ ...c, manualTickers: e.target.value }))}
            placeholder="e.g. AAPL, TSLA, NVDA, SPY"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
          {saved ? '✓ Saved!' : 'Save Config'}
        </button>
        <button onClick={reset} className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition-colors border border-gray-700">
          Reset
        </button>
      </div>

      <p className="text-gray-600 text-xs text-center mt-4">Config is saved in your browser&apos;s local storage.</p>
    </div>
  )
}
