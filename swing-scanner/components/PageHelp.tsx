'use client'
import { useState } from 'react'

interface HelpLink {
  label: string
  url: string
  source: string
}

interface HelpSection {
  heading: string
  tips: string[]
  link?: HelpLink
}

interface PageHelpProps {
  title: string
  sections: HelpSection[]
}

export default function PageHelp({ title, sections }: PageHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <span className="w-4 h-4 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400">?</span>
        How to use: {title}
        <span className="text-gray-700">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 bg-gray-900/80 border border-gray-700 rounded-xl p-4 space-y-4">
          {sections.map((s, i) => (
            <div key={i}>
              <div className="text-blue-400 font-bold text-xs uppercase tracking-wide mb-1.5">{s.heading}</div>
              <ul className="space-y-1 mb-2">
                {s.tips.map((tip, j) => (
                  <li key={j} className="text-gray-400 text-xs flex gap-2">
                    <span className="text-gray-600 shrink-0 mt-0.5">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
              {s.link && (
                <a
                  href={s.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400 text-xs"
                >
                  📖 {s.link.label} — {s.link.source} ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
