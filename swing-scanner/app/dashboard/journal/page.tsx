'use client'
import { useState, useEffect } from 'react'

interface Trade {
  id: string
  date: string
  symbol: string
  optionType: 'call' | 'put'
  strike: number
  expiry: string
  contracts: number
  entryPrice: number
  exitPrice: number
  entryTime: string
  exitTime: string
  outcome: 'win' | 'loss' | 'open'
  pnl: number
  pnlPercent: number
  notes: string
  grade: 'A' | 'B' | 'C'
  exitReason: 'target' | 'stop' | 'manual' | 'expired'
}

const EMPTY_TRADE: Omit<Trade, 'id' | 'pnl' | 'pnlPercent' | 'outcome'> = {
  date: new Date().toISOString().split('T')[0],
  symbol: '',
  optionType: 'call',
  strike: 0,
  expiry: '',
  contracts: 1,
  entryPrice: 0,
  exitPrice: 0,
  entryTime: '',
  exitTime: '',
  notes: '',
  grade: 'B',
  exitReason: 'target',
}

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_TRADE })
  const [editId, setEditId] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState('')
  const [tab, setTab] = useState<'journal' | 'stats'>('journal')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('swingJournal')
      if (saved) setTrades(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  function save(updatedTrades: Trade[]) {
    setTrades(updatedTrades)
    localStorage.setItem('swingJournal', JSON.stringify(updatedTrades))
  }

  function calcPnl(entry: number, exit: number, contracts: number, type: 'call' | 'put') {
    void type
    const pnl = (exit - entry) * contracts * 100
    const pnlPercent = entry > 0 ? ((exit - entry) / entry) * 100 : 0
    return { pnl, pnlPercent }
  }

  function submitTrade() {
    const { pnl, pnlPercent } = calcPnl(form.entryPrice, form.exitPrice, form.contracts, form.optionType)
    const outcome: Trade['outcome'] = form.exitPrice === 0 ? 'open' : pnl >= 0 ? 'win' : 'loss'

    if (editId) {
      const updated = trades.map(t => t.id === editId ? { ...form, id: editId, pnl, pnlPercent, outcome } : t)
      save(updated)
      setEditId(null)
    } else {
      const newTrade: Trade = { ...form, id: Date.now().toString(), pnl, pnlPercent, outcome }
      save([newTrade, ...trades])
    }
    setForm({ ...EMPTY_TRADE })
    setShowForm(false)
  }

  function deleteTrade(id: string) {
    save(trades.filter(t => t.id !== id))
  }

  function editTrade(t: Trade) {
    setForm(t)
    setEditId(t.id)
    setShowForm(true)
  }

  const filtered = filterDate ? trades.filter(t => t.date === filterDate) : trades

  // Stats
  const closed = trades.filter(t => t.outcome !== 'open')
  const wins = closed.filter(t => t.outcome === 'win')
  const losses = closed.filter(t => t.outcome === 'loss')
  const totalPnl = closed.reduce((sum, t) => sum + t.pnl, 0)
  const winRate = closed.length > 0 ? (wins.length / closed.length * 100).toFixed(1) : '0'
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0
  const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : 0
  const bestDay = trades.reduce((best: Record<string, number>, t) => {
    best[t.date] = (best[t.date] ?? 0) + t.pnl
    return best
  }, {})
  const bestDayPnl = Object.values(bestDay).length > 0 ? Math.max(...Object.values(bestDay)) : 0
  const todayPnl = (bestDay[new Date().toISOString().split('T')[0]] ?? 0)

  const gradeColors = { A: 'text-green-400', B: 'text-blue-400', C: 'text-gray-400' }
  const gradeWins = { A: 0, B: 0, C: 0 } as Record<string, number>
  const gradeTotals = { A: 0, B: 0, C: 0 } as Record<string, number>
  closed.forEach(t => {
    gradeTotals[t.grade]++
    if (t.outcome === 'win') gradeWins[t.grade]++
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📓 Trade Journal</h1>
          <p className="text-gray-400 mt-1 text-sm">Log every trade. Track your P&amp;L, win rate, and patterns. The journal is your edge.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ ...EMPTY_TRADE }) }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          {showForm ? '✕ Cancel' : '+ Log Trade'}
        </button>
      </div>

      {/* Today's P&L banner */}
      <div className={`rounded-xl border p-4 mb-4 ${todayPnl >= 0 ? 'bg-green-950/20 border-green-700/30' : 'bg-red-950/20 border-red-700/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase">Today&apos;s P&amp;L</div>
            <div className={`text-3xl font-black ${todayPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {todayPnl >= 0 ? '+' : ''} ${todayPnl.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs">Daily Target</div>
            <div className="text-white font-bold">$50.00</div>
            <div className="mt-1 h-2 w-32 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${todayPnl >= 50 ? 'bg-green-500' : todayPnl > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, (todayPnl / 50) * 100))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
          <div className="text-white font-bold mb-4">{editId ? 'Edit Trade' : 'Log New Trade'}</div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Date', type: 'date', key: 'date' },
              { label: 'Symbol', type: 'text', key: 'symbol', upper: true },
              { label: 'Strike', type: 'number', key: 'strike' },
              { label: 'Expiry', type: 'date', key: 'expiry' },
              { label: 'Contracts', type: 'number', key: 'contracts' },
              { label: 'Entry Price', type: 'number', key: 'entryPrice', step: 0.01 },
              { label: 'Exit Price (0 = still open)', type: 'number', key: 'exitPrice', step: 0.01 },
              { label: 'Entry Time', type: 'time', key: 'entryTime' },
              { label: 'Exit Time', type: 'time', key: 'exitTime' },
            ].map(({ label, type, key, upper, step }) => (
              <div key={key}>
                <div className="text-gray-400 text-xs mb-1">{label}</div>
                <input type={type} step={step} value={(form as Record<string, string | number>)[key] as string} onChange={e => setForm(f => ({ ...f, [key]: upper ? e.target.value.toUpperCase() : (type === 'number' ? Number(e.target.value) : e.target.value) }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <div className="text-gray-400 text-xs mb-1">Option Type</div>
              <div className="flex gap-2">
                {(['call', 'put'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, optionType: t }))} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${form.optionType === t ? (t === 'call' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-800 text-gray-400'}`}>
                    {t === 'call' ? '📈 Call' : '📉 Put'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Setup Grade</div>
              <div className="flex gap-2">
                {(['A', 'B', 'C'] as const).map(g => (
                  <button key={g} onClick={() => setForm(f => ({ ...f, grade: g }))} className={`flex-1 py-2 rounded-lg text-sm font-black transition-colors ${form.grade === g ? (g === 'A' ? 'bg-green-500 text-black' : g === 'B' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white') : 'bg-gray-800 text-gray-400'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Exit Reason</div>
              <select value={form.exitReason} onChange={e => setForm(f => ({ ...f, exitReason: e.target.value as Trade['exitReason'] }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                <option value="target">Hit Target ✅</option>
                <option value="stop">Stop Loss 🚨</option>
                <option value="manual">Manual Exit</option>
                <option value="expired">Expired Worthless</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-gray-400 text-xs mb-1">Notes</div>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What was the setup? What worked or didn't? Lessons learned." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" />
          </div>
          <button onClick={submitTrade} disabled={!form.symbol || !form.entryPrice} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
            {editId ? 'Update Trade' : 'Save Trade'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['journal', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {t === 'journal' ? `📓 Journal (${filtered.length})` : '📊 Stats'}
          </button>
        ))}
        {tab === 'journal' && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-gray-500 text-xs">Filter by date:</span>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none" />
            {filterDate && <button onClick={() => setFilterDate('')} className="text-gray-500 text-xs hover:text-white">✕ Clear</button>}
          </div>
        )}
      </div>

      {/* Journal tab */}
      {tab === 'journal' && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <div className="text-4xl mb-3">📓</div>
              <div>No trades logged yet. Start tracking every trade.</div>
            </div>
          )}
          {filtered.map(t => {
            const isWin = t.outcome === 'win'
            const isOpen = t.outcome === 'open'
            return (
              <div key={t.id} className={`border rounded-xl p-4 ${isOpen ? 'border-blue-700/40 bg-blue-950/10' : isWin ? 'border-green-800/40 bg-green-950/10' : 'border-red-800/40 bg-red-950/10'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black px-2 py-0.5 rounded ${t.grade === 'A' ? 'bg-green-500 text-black' : t.grade === 'B' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'}`}>{t.grade}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">{t.symbol}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.optionType === 'call' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>${t.strike} {t.optionType.toUpperCase()}</span>
                        <span className="text-gray-500 text-xs">{t.expiry}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isOpen ? 'bg-blue-900/50 text-blue-400' : isWin ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {isOpen ? '⏳ OPEN' : isWin ? '✅ WIN' : '❌ LOSS'}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {t.date} · {t.contracts} contract{t.contracts !== 1 ? 's' : ''} · Entry: ${t.entryPrice.toFixed(2)} {t.exitPrice > 0 ? `→ Exit: $${t.exitPrice.toFixed(2)}` : '(still open)'} · {t.exitReason}
                      </div>
                      {t.notes && <div className="text-gray-400 text-xs mt-1 italic">{t.notes}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-xl font-black ${isOpen ? 'text-blue-400' : isWin ? 'text-green-400' : 'text-red-400'}`}>
                        {isOpen ? '—' : `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}`}
                      </div>
                      {!isOpen && <div className="text-xs text-gray-500">{t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(1)}%</div>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => editTrade(t)} className="text-gray-600 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-800">✏️</button>
                      <button onClick={() => deleteTrade(t.id)} className="text-gray-600 hover:text-red-400 text-sm px-2 py-1 rounded hover:bg-gray-800">🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Win Rate', value: `${winRate}%`, color: parseFloat(winRate) >= 50 ? 'text-green-400' : 'text-red-400' },
              { label: 'Total Trades', value: closed.length.toString(), color: 'text-white' },
              { label: 'Profit Factor', value: profitFactor.toFixed(2), color: profitFactor >= 1.5 ? 'text-green-400' : 'text-yellow-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-gray-500 text-xs mb-1">{label}</div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm font-bold mb-3">Win vs Loss</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-green-400">Wins: {wins.length}</span><span className="text-green-400">Avg +${avgWin.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-red-400">Losses: {losses.length}</span><span className="text-red-400">Avg -${Math.abs(avgLoss).toFixed(2)}</span></div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden mt-2 flex">
                  <div className="bg-green-500 rounded-l-full" style={{ width: `${closed.length > 0 ? (wins.length / closed.length * 100) : 0}%` }} />
                  <div className="bg-red-500 rounded-r-full flex-1" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm font-bold mb-3">Win Rate by Grade</div>
              {(['A', 'B', 'C'] as const).map(g => (
                <div key={g} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-bold ${gradeColors[g]}`}>Grade {g}</span>
                    <span className="text-gray-400">{gradeTotals[g] > 0 ? `${((gradeWins[g] / gradeTotals[g]) * 100).toFixed(0)}% (${gradeWins[g]}/${gradeTotals[g]})` : 'No trades'}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${g === 'A' ? 'bg-green-500' : g === 'B' ? 'bg-blue-500' : 'bg-gray-500'}`} style={{ width: `${gradeTotals[g] > 0 ? (gradeWins[g] / gradeTotals[g] * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm font-bold mb-3">Best Day</div>
              <div className="text-green-400 text-2xl font-bold">+${bestDayPnl.toFixed(2)}</div>
              <div className="text-gray-500 text-xs mt-2">Daily P&L Breakdown</div>
              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                {Object.entries(bestDay).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).slice(0, 7).map(([date, pnl]) => (
                  <div key={date} className="flex justify-between text-xs">
                    <span className="text-gray-500">{date}</span>
                    <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
