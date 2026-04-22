'use client'
import { useState, useEffect } from 'react'

interface Lesson {
  id: string
  title: string
  duration: string
  body: string
  tip: string
  link?: { label: string; url: string }
  appLink?: { label: string; href: string }
}

interface Module {
  id: string
  icon: string
  title: string
  description: string
  lessons: Lesson[]
}

const MODULES: Module[] = [
  {
    id: 'options-101',
    icon: '📚',
    title: 'Options 101',
    description: 'What options are, how they work, and why traders love them.',
    lessons: [
      {
        id: 'what-is-an-option',
        title: 'What is an Option?',
        duration: '3 min',
        body: `An option is a contract that gives you the RIGHT (not the obligation) to buy or sell a stock at a specific price before a specific date.\n\nThere are two types:\n• CALL option — the right to BUY at the strike price. You profit when the stock goes UP.\n• PUT option — the right to SELL at the strike price. You profit when the stock goes DOWN.\n\nYou pay a PREMIUM upfront to buy this right. That's your max loss. If the trade works in your favor, your gains can be much larger than the premium paid — that's the appeal.`,
        tip: 'Think of a call option like a rain check coupon for a stock at today\'s price. If the stock shoots up, your coupon is worth a lot.',
        link: { label: 'Options basics explained', url: 'https://www.investopedia.com/options-basics-tutorial-4583012' },
        appLink: { label: 'Try Options Chain', href: '/dashboard/options-chain' },
      },
      {
        id: 'strike-expiry',
        title: 'Strike Price & Expiration',
        duration: '3 min',
        body: `Every option has two key parameters:\n\n• STRIKE PRICE — the price at which you can buy (call) or sell (put) the stock. Choose too far from the current price and the option is cheap but rarely pays off. Too close and it's expensive.\n\n• EXPIRATION DATE — the deadline. After this date, the option is worthless if not exercised. 0DTE means it expires today. Weekly options expire on Friday.\n\nFor day trading: most traders buy options with 0–5 DTE (days to expiration) for maximum leverage, but they decay fast. Beginners should start with at least 7–14 DTE to give trades room to breathe.`,
        tip: '0DTE options can 10x in hours — but they can also go to zero just as fast. Learn the mechanics before trading them live.',
        link: { label: 'Understanding strike price', url: 'https://www.investopedia.com/terms/s/strikeprice.asp' },
        appLink: { label: 'See 0DTE Scanner', href: '/dashboard/zero-dte' },
      },
      {
        id: 'premium-intrinsic-extrinsic',
        title: 'Option Premium: Intrinsic vs Extrinsic Value',
        duration: '4 min',
        body: `The price you pay for an option (the PREMIUM) has two parts:\n\n• INTRINSIC VALUE — the "real" value. For a call at $150 strike when the stock is at $155, the intrinsic value is $5 (it's "in the money" by $5).\n\n• EXTRINSIC VALUE (Time Value) — the extra amount you pay for the possibility that the trade might work out. An at-the-money option is almost entirely extrinsic.\n\nAs expiration approaches, extrinsic value melts away — this is called THETA DECAY. Time is always working against option buyers. This is why timing matters so much in options trading.`,
        tip: 'Buy options when you expect a big move soon. Don\'t hold hoping for a slow grind — theta will eat your premium alive.',
        link: { label: 'Intrinsic vs extrinsic value', url: 'https://www.tastylive.com/learn/intrinsic-vs-extrinsic-value' },
        appLink: { label: 'Analyze in Trade Planner', href: '/dashboard/trade-planner' },
      },
      {
        id: 'itm-atm-otm',
        title: 'ITM, ATM, OTM — What Does It Mean?',
        duration: '3 min',
        body: `Options are described by how close the strike is to the current stock price:\n\n• IN THE MONEY (ITM) — has intrinsic value. A $145 call when the stock is $155 is $10 ITM. These are expensive but have a higher chance of profit.\n\n• AT THE MONEY (ATM) — strike ≈ current stock price. Most sensitive to price movements and popular for day trading.\n\n• OUT OF THE MONEY (OTM) — no intrinsic value yet. Cheap, but requires a bigger move to profit. Many expire worthless.\n\nDay traders often buy ATM or slightly OTM options to balance cost with leverage.`,
        tip: 'If you\'re new, start with ATM options. They\'re the easiest to understand and have the most predictable behavior.',
        link: { label: 'In the money options explained', url: 'https://www.investopedia.com/terms/i/inthemoney.asp' },
      },
    ],
  },
  {
    id: 'greeks',
    icon: '🔢',
    title: 'The Greeks',
    description: 'Delta, gamma, theta, vega — the four forces driving every options price.',
    lessons: [
      {
        id: 'delta',
        title: 'Delta — How Much Will My Option Move?',
        duration: '4 min',
        body: `DELTA tells you how much your option's price moves for every $1 move in the stock.\n\n• A call with 0.50 delta gains $0.50 for every $1 the stock goes up.\n• A put with -0.50 delta gains $0.50 for every $1 the stock goes down.\n• Delta ranges from 0 to 1.0 for calls, -1.0 to 0 for puts.\n\nATM options have ~0.50 delta. Deep ITM options have delta near 1.0 (they move almost dollar-for-dollar with the stock). OTM options have low delta.\n\nAs a day trader: Delta tells you your directional exposure. A 0.30 delta call means you need the stock to move more to profit vs a 0.70 delta call.`,
        tip: 'Think of delta as the "odds" the option expires in the money. A 0.30 delta option has roughly a 30% chance of being profitable at expiry.',
        link: { label: 'Options delta explained', url: 'https://www.tastylive.com/learn/delta' },
        appLink: { label: 'Use Trade Planner', href: '/dashboard/trade-planner' },
      },
      {
        id: 'gamma',
        title: 'Gamma — The Accelerator',
        duration: '3 min',
        body: `GAMMA measures how fast delta changes as the stock moves.\n\n• High gamma means your delta (and profits) accelerate quickly — great when you're right, brutal when you're wrong.\n• ATM options near expiration have the highest gamma. This is why 0DTE options can make or lose 200% in a single hour.\n• Gamma is always positive for option buyers.\n\nIn practice: If you own a 0DTE ATM call and the stock surges $2, your delta might jump from 0.50 to 0.80 — your position is now making money much faster. But if the stock drops $2, delta falls to 0.20 and you're losing ground fast.`,
        tip: 'Gamma is your best friend when you\'re right and your worst enemy when you\'re wrong. Respect it on 0DTE trades.',
        link: { label: 'Gamma explained', url: 'https://www.investopedia.com/terms/g/gamma.asp' },
        appLink: { label: 'See P&L Simulator', href: '/dashboard/trade-planner' },
      },
      {
        id: 'theta',
        title: 'Theta — The Time Decay Enemy',
        duration: '4 min',
        body: `THETA is how much your option loses in value every day just from the passage of time — even if the stock doesn't move.\n\n• If theta is -$5, your option loses $5 per day from decay.\n• Theta accelerates as expiration approaches. A 0DTE option might lose 50% of its value in the morning and the rest by 3pm if the stock goes nowhere.\n• Theta is the buyer's enemy and the seller's friend.\n\nFor day traders: You're racing against theta every minute. You need the stock to move in your direction fast enough to overcome time decay. This is why day traders buy in the morning and almost never hold options overnight.`,
        tip: 'Never hold a 0DTE option through lunch (12–2pm ET). Volume dries up, the stock often goes flat, and theta chews through your position.',
        link: { label: 'Options theta decay', url: 'https://www.tastylive.com/learn/theta-decay' },
        appLink: { label: 'Check Theta in Trade Planner', href: '/dashboard/trade-planner' },
      },
      {
        id: 'vega-iv',
        title: 'Vega & Implied Volatility',
        duration: '4 min',
        body: `VEGA measures how much your option gains or loses when IMPLIED VOLATILITY (IV) changes by 1%.\n\nIMPLIED VOLATILITY (IV) is the market's forecast of how much the stock will move. High IV means expensive options; low IV means cheap options.\n\n• High IV before earnings = expensive options. After earnings, IV "crushes" — even if you're right on direction, your option can lose value.\n• Low IV = cheap options. Good time to buy if you expect a big move.\n\nThe VIX (Volatility Index) measures overall market IV. Above 20 = elevated. Above 30 = fearful market. Day traders often find the best 0DTE setups when VIX is between 15–25.`,
        tip: 'Check IV Rank before buying options. If IV is at a 52-week high, options are expensive — the market expects a move that may already be priced in.',
        link: { label: 'Implied volatility explained', url: 'https://www.tastylive.com/learn/implied-volatility' },
        appLink: { label: 'See Market Pulse (VIX)', href: '/dashboard/market-pulse' },
      },
    ],
  },
  {
    id: 'day-trading',
    icon: '⚡',
    title: 'Day Trading Options',
    description: 'How to read setups, manage risk, and build consistent habits.',
    lessons: [
      {
        id: 'reading-setups',
        title: 'Reading a Trade Setup',
        duration: '5 min',
        body: `A good trade setup has all of these:\n\n1. DIRECTION — Is the stock trending up (bullish, buy calls) or down (bearish, buy puts)? Don't fight the trend.\n\n2. CATALYST — Why should it move? Earnings? Breaking news? Technical breakout? Sector rotation? Random guessing is gambling.\n\n3. ENTRY LEVEL — Where exactly will you buy? Breakout above a key level? Bounce off support? Define this before entering.\n\n4. TARGET — Where will you take profit? Set a realistic target based on the stock's normal daily range.\n\n5. STOP LOSS — Where will you cut the loss? Options traders often use a 50% loss rule: if your option drops 50%, close it — no questions.\n\nAll 5 must be answered before you place a trade.`,
        tip: 'If you can\'t explain WHY you\'re taking a trade in one sentence, don\'t take it. "It looks like it might go up" is not a trade thesis.',
        link: { label: 'Trade setups explained', url: 'https://www.investopedia.com/trading/trading-setups-strategies/' },
        appLink: { label: 'Use Game Plan', href: '/dashboard/game-plan' },
      },
      {
        id: 'risk-management',
        title: 'Risk Management: The #1 Skill',
        duration: '5 min',
        body: `Most beginners blow up their accounts not from bad analysis but from bad risk management.\n\nThe rules:\n\n• RISK ONLY 1–2% of your account per trade. If you have $1,000, risk $10–$20 per trade. This lets you survive 50 bad trades in a row.\n\n• SET A DAILY LOSS LIMIT. If you lose 5–10% of your account in one day, STOP TRADING. Come back tomorrow with a clear head.\n\n• HONOR YOUR STOP LOSS. The most dangerous thought in trading: "It'll come back." Sometimes it does. Sometimes it goes to zero.\n\n• DON'T AVERAGE DOWN. If your option is losing, don't buy more to "lower your cost." Options can go to zero.\n\n• TAKE PARTIAL PROFITS. If your option is up 50%, sell half. Let the rest run for free.`,
        tip: 'Professional traders focus on losing LESS, not winning more. A trader who loses 10% when wrong and gains 20% when right will get rich slowly and surely.',
        link: { label: 'Options risk management', url: 'https://www.tastylive.com/learn/position-sizing' },
        appLink: { label: 'Set your budget in Config', href: '/dashboard/config' },
      },
      {
        id: 'trading-hours',
        title: 'Best Times to Trade',
        duration: '3 min',
        body: `Not all hours are equal for options day traders:\n\n• 9:30–10:30am ET (POWER HOUR) — Highest volume, biggest moves, best spreads. This is when the best 0DTE setups form. Most professional day traders make all their trades in this window.\n\n• 10:30am–12pm ET — Still active. Good for continuation trades after the morning trend is established.\n\n• 12pm–2pm ET (DEAD ZONE) — Volume dries up. Stocks chop sideways. Theta eats your premium. Most experienced traders DON'T trade during this window.\n\n• 2pm–4pm ET (POWER HOUR 2) — Volume returns, often a second trend develops. Also where 0DTE options make their final moves.\n\n• After 3:30pm ET — 0DTE options become pure speculation. Avoid holding them this late unless you're up big.`,
        tip: 'Set a rule: "I only trade in the first hour and the last hour." You\'ll take fewer trades, but better ones.',
        appLink: { label: 'Check 0DTE Scanner', href: '/dashboard/zero-dte' },
      },
      {
        id: 'journaling-habit',
        title: 'The Journaling Habit',
        duration: '3 min',
        body: `The fastest way to improve as a trader is to review every trade you've made.\n\nAfter each trade, log:\n• Why you entered (the thesis)\n• What actually happened\n• Did you follow your rules? (Grade: A/B/C)\n• What would you do differently?\n\nReview your journal weekly. Look for patterns:\n• Do you lose money between 12–2pm? Stop trading then.\n• Do Grade C trades always lose? Stop taking them.\n• Does a certain setup have 70%+ win rate? Trade it more.\n\nThe journal turns trading from guessing into a repeatable process. This is how you go from hoping to knowing.`,
        tip: 'Winning traders review losing trades more carefully than winning ones. A loss with good discipline is a lesson; a win with bad discipline is a trap.',
        link: { label: 'Trading journal guide', url: 'https://www.investopedia.com/articles/trading/08/trading-journal.asp' },
        appLink: { label: 'Open Trade Journal', href: '/dashboard/journal' },
      },
      {
        id: 'psychology',
        title: 'Trading Psychology: Your Biggest Enemy',
        duration: '4 min',
        body: `The market doesn't beat most traders — their own psychology does.\n\nCommon traps:\n\n• FOMO (Fear Of Missing Out) — Chasing a trade that already moved. By the time everyone sees it, the move is over.\n\n• REVENGE TRADING — After a loss, doubling down to "make it back." This turns small losses into account-killers.\n\n• OVERCONFIDENCE — After 3 winning trades in a row, taking bigger size and breaking your rules.\n\n• HOPE — Holding a losing trade hoping it comes back. Hope is not a strategy.\n\n• PARALYSIS — Being so afraid of losing that you can't pull the trigger on good setups.\n\nThe solution: write your rules down before the market opens. Then just follow the rules. The rules are made by the calm version of you. The market triggers the emotional version. Let the rules decide.`,
        tip: 'Before each trading session, write down your 3 rules for the day. Place them next to your screen. Before every trade, read them.',
        link: { label: 'Trading psychology guide', url: 'https://www.investopedia.com/articles/trading/02/110502.asp' },
        appLink: { label: 'Plan tomorrow with Game Plan', href: '/dashboard/game-plan' },
      },
    ],
  },
]

export default function LearnPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [openLesson, setOpenLesson] = useState<string | null>(null)
  const [openModule, setOpenModule] = useState<string>(MODULES[0].id)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/store/learn')
      .then(r => r.json())
      .then((ids: string[]) => setCompleted(new Set(ids)))
      .catch(() => {})
  }, [])

  async function toggleLesson(id: string) {
    const next = new Set(completed)
    const isNowComplete = !next.has(id)
    if (isNowComplete) next.add(id)
    else next.delete(id)
    setCompleted(next)
    setSaving(true)
    await fetch('/api/store/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: isNowComplete }),
    }).finally(() => setSaving(false))
  }

  const totalLessons = MODULES.reduce((s, m) => s + m.lessons.length, 0)
  const totalCompleted = completed.size
  const pct = Math.round((totalCompleted / totalLessons) * 100)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white">🎓 Options Academy</h1>
        <p className="text-gray-400 mt-1 text-sm">Learn options from zero to confident — tied directly to the tools in this app.</p>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white font-semibold text-sm">Your Progress</div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-gray-500 text-xs">Saving...</span>}
            <span className="text-blue-400 font-bold text-sm">{totalCompleted}/{totalLessons} lessons</span>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">{pct}% complete{pct === 100 ? ' 🏆 You\'re ready to trade!' : ''}</div>
      </div>

      {/* Module tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {MODULES.map(m => {
          const done = m.lessons.filter(l => completed.has(l.id)).length
          return (
            <button
              key={m.id}
              onClick={() => setOpenModule(m.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                openModule === m.id ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {m.icon} {m.title}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${done === m.lessons.length ? 'bg-green-500 text-black font-bold' : 'bg-gray-700 text-gray-400'}`}>
                {done}/{m.lessons.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active module */}
      {MODULES.filter(m => m.id === openModule).map(module => (
        <div key={module.id}>
          <div className="text-gray-500 text-sm mb-4">{module.description}</div>
          <div className="space-y-3">
            {module.lessons.map((lesson, i) => {
              const isDone = completed.has(lesson.id)
              const isOpen = openLesson === lesson.id
              return (
                <div key={lesson.id} className={`border rounded-xl overflow-hidden transition-all ${isDone ? 'border-green-800/40 bg-green-950/10' : 'border-gray-800 bg-gray-900'}`}>
                  {/* Lesson header */}
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/30 transition-colors"
                    onClick={() => setOpenLesson(isOpen ? null : lesson.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDone ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm">{lesson.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{lesson.duration} read</div>
                    </div>
                    <svg
                      className={`text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Lesson body */}
                  {isOpen && (
                    <div className="px-4 pb-5 border-t border-gray-800">
                      <div className="mt-4 text-gray-300 text-sm leading-relaxed whitespace-pre-line">{lesson.body}</div>

                      {/* Pro tip */}
                      <div className="mt-4 bg-blue-950/30 border border-blue-800/40 rounded-lg p-3">
                        <div className="text-blue-400 text-xs font-bold mb-1">PRO TIP</div>
                        <div className="text-blue-200 text-sm">{lesson.tip}</div>
                      </div>

                      {/* Links */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        {lesson.link && (
                          <a
                            href={lesson.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 underline"
                          >
                            📖 {lesson.link.label} →
                          </a>
                        )}
                        {lesson.appLink && (
                          <a
                            href={lesson.appLink.href}
                            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            🚀 {lesson.appLink.label}
                          </a>
                        )}
                      </div>

                      {/* Mark complete button */}
                      <button
                        onClick={() => toggleLesson(lesson.id)}
                        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          isDone
                            ? 'bg-green-900/40 text-green-400 border border-green-800 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isDone ? '✓ Completed — click to unmark' : 'Mark as Complete'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
