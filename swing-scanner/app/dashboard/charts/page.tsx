'use client'
import { useState, useCallback } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface OHLCBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  ma20?: number
  ma50?: number
}

function getTickersFromStorage(): string[] {
  try {
    const t = localStorage.getItem('swingTickers')
    if (t) return JSON.parse(t).map((x: { symbol: string }) => x.symbol).slice(0, 25)
  } catch { /* ignore */ }
  return ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AMD', 'SPY', 'QQQ']
}

function sma(data: number[], period: number): number[] {
  return data.map((_, i) => {
    if (i < period - 1) return NaN
    return data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  })
}

interface CandleProps { open: number; high: number; low: number; close: number; x: number; width: number; fill: string }
function CandleStick({ open, high, low, close, x, width, fill }: CandleProps) {
  const isUp = close >= open
  const bodyTop = Math.min(open, close)
  const bodyH = Math.max(Math.abs(close - open), 1)
  return (
    <g>
      <line x1={x + width / 2} y1={high} x2={x + width / 2} y2={low} stroke={fill} strokeWidth={1} />
      <rect x={x + 1} y={bodyTop} width={width - 2} height={bodyH} fill={isUp ? '#22c55e' : '#ef4444'} stroke={isUp ? '#16a34a' : '#dc2626'} strokeWidth={0.5} />
    </g>
  )
}

function CustomBar(props: Record<string, unknown>) {
  const { x, y, width, height, open, close, high, low } = props as { x: number; y: number; width: number; height: number; open: number; close: number; high: number; low: number }
  const isUp = close >= open
  void y; void height
  return <CandleStick open={open} high={high} low={low} close={close} x={x} width={width} fill={isUp ? '#22c55e' : '#ef4444'} />
}

export default function ChartsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [chartData, setChartData] = useState<OHLCBar[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedSymbol, setLoadedSymbol] = useState('')
  const [customSymbol, setCustomSymbol] = useState('')
  const tickers = getTickersFromStorage()

  const loadChart = useCallback(async (symbol: string) => {
    if (!symbol) return
    setLoading(true)
    setSelectedSymbol(symbol)
    try {
      const res = await fetch(`/api/patterns?symbols=${symbol}`)
      // We need raw OHLCV data — fetch from a different endpoint
      const ohlcvRes = await fetch(`/api/tickers?manualTickers=${symbol}&numTickers=1`)
      void ohlcvRes
      // Use patterns API which calls fetchOHLCV internally
      // Instead fetch chart data via dedicated endpoint
      const chartRes = await fetch(`/api/chart?symbol=${symbol}`)
      const data = await chartRes.json()

      const closes = data.bars.map((b: OHLCBar) => b.close)
      const ma20Vals = sma(closes, 20)
      const ma50Vals = sma(closes, Math.min(50, closes.length))

      setChartData(data.bars.map((b: OHLCBar, i: number) => ({
        ...b,
        date: new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ma20: isNaN(ma20Vals[i]) ? undefined : parseFloat(ma20Vals[i].toFixed(2)),
        ma50: isNaN(ma50Vals[i]) ? undefined : parseFloat(ma50Vals[i].toFixed(2)),
      })))
      setLoadedSymbol(symbol)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  const priceMin = chartData.length ? Math.min(...chartData.map(d => d.low)) * 0.995 : 0
  const priceMax = chartData.length ? Math.max(...chartData.map(d => d.high)) * 1.005 : 0
  const lastClose = chartData.length ? chartData[chartData.length - 1].close : 0
  const firstClose = chartData.length ? chartData[0].close : 0
  const totalReturn = firstClose ? ((lastClose - firstClose) / firstClose * 100).toFixed(2) : '0'
  const isPositive = parseFloat(totalReturn) >= 0

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📈 Charts</h1>
        <p className="text-gray-400 mt-1 text-sm">Candlestick charts with 20-day and 50-day moving averages. Always check the chart before trading a pattern.</p>
      </div>

      {/* Symbol selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex gap-3 mb-3">
          <input
            value={customSymbol}
            onChange={e => setCustomSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter' && customSymbol) loadChart(customSymbol) }}
            placeholder="Enter symbol (e.g. NVDA)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => customSymbol && loadChart(customSymbol)}
            disabled={loading || !customSymbol}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Load
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tickers.slice(0, 15).map(sym => (
            <button
              key={sym}
              onClick={() => loadChart(sym)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedSymbol === sym ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading && (
        <div className="text-center py-20 text-gray-500">
          <div className="animate-spin text-3xl mb-3">⟳</div>
          <div>Loading chart data...</div>
        </div>
      )}

      {chartData.length > 0 && !loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{loadedSymbol}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="text-gray-400">Last 90 days</span>
                <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{totalReturn}% period return
                </span>
                <span className="text-white font-semibold">${lastClose.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-yellow-400" /> MA20</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-400" /> MA50</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Up</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-sm" /> Down</div>
            </div>
          </div>

          {/* Price chart */}
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} interval={Math.floor(chartData.length / 8)} />
              <YAxis domain={[priceMin, priceMax]} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} width={55} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.[0]) return null
                  const d = payload[0].payload as OHLCBar & { ma20?: number; ma50?: number }
                  return (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs">
                      <div className="text-gray-400 mb-1">{label}</div>
                      <div className="text-white">O: ${d.open?.toFixed(2)} H: ${d.high?.toFixed(2)}</div>
                      <div className="text-white">L: ${d.low?.toFixed(2)} C: ${d.close?.toFixed(2)}</div>
                      {d.ma20 && <div className="text-yellow-400">MA20: ${d.ma20}</div>}
                      {d.ma50 && <div className="text-blue-400">MA50: ${d.ma50}</div>}
                    </div>
                  )
                }}
              />
              <Bar dataKey="high" shape={<CustomBar />} isAnimationActive={false} />
              <Line type="monotone" dataKey="ma20" stroke="#facc15" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="ma50" stroke="#60a5fa" strokeWidth={1.5} dot={false} connectNulls />
              <ReferenceLine y={lastClose} stroke="#4b5563" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Volume chart */}
          <div className="mt-2">
            <ResponsiveContainer width="100%" height={80}>
              <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : `${(v / 1e3).toFixed(0)}K`} width={55} />
                <Bar dataKey="volume" fill="#374151" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-gray-600 text-xs text-center mt-1">Volume</div>
          </div>

          {/* OHLC table (last 5) */}
          <div className="mt-4 border-t border-gray-800 pt-4">
            <div className="text-gray-500 text-xs font-medium mb-2">Recent OHLCV</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-600">
                    <th className="text-left pb-1">Date</th>
                    <th className="text-right pb-1">Open</th>
                    <th className="text-right pb-1">High</th>
                    <th className="text-right pb-1">Low</th>
                    <th className="text-right pb-1">Close</th>
                    <th className="text-right pb-1">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.slice(-5).reverse().map((d, i) => {
                    const isUp = d.close >= d.open
                    return (
                      <tr key={i} className="border-t border-gray-800/50">
                        <td className="text-gray-400 py-1">{d.date}</td>
                        <td className="text-right text-gray-300">${d.open.toFixed(2)}</td>
                        <td className="text-right text-green-400">${d.high.toFixed(2)}</td>
                        <td className="text-right text-red-400">${d.low.toFixed(2)}</td>
                        <td className={`text-right font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>${d.close.toFixed(2)}</td>
                        <td className="text-right text-gray-500">{d.volume >= 1e6 ? `${(d.volume / 1e6).toFixed(1)}M` : `${(d.volume / 1e3).toFixed(0)}K`}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && chartData.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">📈</div>
          <div className="font-medium">Select a symbol to view its chart</div>
          <div className="text-sm mt-1">Enter a symbol or click one from your ticker list above</div>
        </div>
      )}
    </div>
  )
}
