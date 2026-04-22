'use client'
import { useState, useRef, useEffect } from 'react'

interface InfoTipProps {
  title: string
  body: string
  link?: { label: string; url: string }
}

export default function InfoTip({ title, body, link }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white text-xs flex items-center justify-center transition-colors leading-none"
        aria-label="More info"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-50 left-6 top-0 w-64 bg-gray-800 border border-gray-600 rounded-xl shadow-xl p-3 text-sm">
          <div className="text-white font-bold mb-1">{title}</div>
          <div className="text-gray-300 text-xs leading-relaxed">{body}</div>
          {link && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium"
            >
              {link.label} ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}
