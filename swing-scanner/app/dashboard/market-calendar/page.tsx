'use client'
import { useState, useEffect, useCallback } from 'react'

interface MarketEvent {
  date: string
  event: string
  category: 'FOMC' | 'Inflation' | 'Jobs' | 'GDP' | 'Options' | 'Earnings' | 'Holiday'
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  prediction?: string
  analysis: string
  tradingAngle: string
}

const categoryStyle: Record<string, { color: string; bg: string; icon: string }> = {
  FOMC: { color: 'text-purple-300', bg: 'bg-purple-950/30 border-purple-700/40', icon: '🏦' },
  Inflation: { color: 'text-red-300', bg: 'bg-red-950/30 border-red-700/40', icon: '📊' },
  Jobs: { color: 'text-blue-300', bg: 'bg-blue-950/30 border-blue-700/40', icon: '👷' },
  GDP: { color: 'text-green-300', bg: 'bg-green-950/30 border-green-700/40', icon: '📈' },
  Options: { color: 'text-orange-300', bg: 'bg-orange-950/30 border-orange-700/40', icon: '📅' },
  Earnings: { color: 'text-yellow-300', bg: 'bg-yellow-950/30 border-yellow-700/40', icon: '💰' },
  Holiday: { color: 'text-gray-300', bg: 'bg-gray-800/30 border-gray-700/30', icon: '🎉' },
}

const impactColor = { HIGH: 'text-red-400 bg-red-950/40', MEDIUM: 'text-yellow-400 bg-yellow-950/40', LOW: 'text-gray-400 bg-gray-800' }

export default function MarketCalendarPage() {
  const [events, setEvents] = useState<MarketEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/market-calendar')
      const data = await res.json()
      setEvents(data.events)
      setFetchedAt(data.fetchedAt)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function toggleExpand(i: number) {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(i) ? s.delete(i) : s.add(i)
      return s
    })
  }

  const categories = ['all', ...Array.from(new Set(events.map(e => e.category)))]
  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter)

  const highImpact = events.filter(e => e.impact === 'HIGH').length

  function daysUntil(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🗓️ Market Calendar</h1>
          <p className="text-gray-400 mt-1 text-sm">2-month view of market-moving events. Each event has an impact level and trading angle.</p>
        </div>
        <button onClick={load} disabled={loading} className="bg-teal-700 hover:bg-teal-800 disabled:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin">⟳</span> Loading...</> : <>🔄 Refresh</>}
        </button>
      </div>

      {/* Stats bar */}
      {events.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{events.length}</div>
            <div className="text-gray-500 text-xs">Total Events</div>
          </div>
          <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{highImpact}</div>
            <div className="text-gray-500 text-xs">High Impact</div>
          </div>
          <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{events.filter(e => e.category === 'FOMC').length}</div>
            <div className="text-gray-500 text-xs">FOMC Meetings</div>
          </div>
          <div className="bg-orange-950/20 border border-orange-800/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{events.filter(e => e.category === 'Options').length}</div>
            <div className="text-gray-500 text-xs">Options Expirations</div>
          </div>
        </div>
      )}

      {/* Category filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map(cat => {
          const style = cat !== 'all' ? categoryStyle[cat] : null
          return (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === cat ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {style ? `${style.icon} ${cat}` : `All (${events.length})`}
            </button>
          )
        })}
      </div>

      {fetchedAt && <div className="text-gray-600 text-xs mb-3">Updated: {new Date(fetchedAt).toLocaleTimeString()} — showing {filtered.length} events</div>}

      <div className="space-y-3">
        {filtered.map((event, i) => {
          const style = categoryStyle[event.category]
          const days = daysUntil(event.date)
          const isExpanded = expanded.has(i)

          return (
            <div key={i} className={`border rounded-xl overflow-hidden ${style.bg}`}>
              <div className="p-4 cursor-pointer" onClick={() => toggleExpand(i)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{style.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-base ${style.color}`}>{event.event}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${impactColor[event.impact]}`}>
                          {event.impact}
                        </span>
                        <span className="text-xs text-gray-500">{event.category}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-gray-400">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className={`font-medium ${days <= 7 ? 'text-orange-400' : days <= 14 ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {days === 0 ? 'TODAY' : days === 1 ? 'Tomorrow' : `${days} days away`}
                        </span>
                        {event.prediction && <span className="text-gray-500">· Est: {event.prediction}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-600 text-lg ml-2">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                  <div>
                    <div className="text-gray-400 text-xs font-semibold uppercase mb-1">Analysis</div>
                    <div className="text-gray-300 text-sm">{event.analysis}</div>
                  </div>
                  <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3">
                    <div className="text-blue-400 text-xs font-semibold mb-1">💡 TRADING ANGLE</div>
                    <div className="text-gray-300 text-sm">{event.tradingAngle}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {events.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">🗓️</div>
          <div>No events loaded</div>
        </div>
      )}
    </div>
  )
}
