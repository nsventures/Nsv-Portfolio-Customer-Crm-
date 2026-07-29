'use client'

import { useId, useState } from 'react'

export interface TrendPoint {
  date: string // yyyy-mm-dd
  label: string // short display label, e.g. "16 Jul"
  count: number
}

const CHART_HEIGHT = 140
const BAR_GAP = 4

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const gradientId = useId()

  const max = Math.max(1, ...data.map((d) => d.count))
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center text-sm text-slate-400">
        No leads in this period yet.
      </div>
    )
  }

  const n = data.length
  const barWidth = `calc((100% - ${(n - 1) * BAR_GAP}px) / ${n})`

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${n * 100} ${CHART_HEIGHT}`} preserveAspectRatio="none" className="h-[140px] w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        <line x1="0" y1={CHART_HEIGHT - 1} x2={n * 100} y2={CHART_HEIGHT - 1} stroke="#e2e8f0" strokeWidth="1" />

        {data.map((d, i) => {
          const slotWidth = 100
          const barW = Math.min(24, slotWidth * 0.6)
          const x = i * slotWidth + (slotWidth - barW) / 2
          const barH = d.count === 0 ? 0 : Math.max(3, (d.count / max) * (CHART_HEIGHT - 20))
          const y = CHART_HEIGHT - 1 - barH
          const isHovered = hovered === i

          return (
            <g key={d.date}>
              <rect
                x={i * slotWidth}
                y={0}
                width={slotWidth}
                height={CHART_HEIGHT}
                fill="transparent"
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="img"
                aria-label={`${d.label}: ${d.count} lead${d.count === 1 ? '' : 's'}`}
              />
              {barH > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={isHovered ? '#0284c7' : `url(#${gradientId})`}
                  className="pointer-events-none transition-colors"
                />
              )}
            </g>
          )
        })}
      </svg>

      <div className="mt-1 flex text-[10px] text-slate-400" style={{ gap: BAR_GAP }}>
        {data.map((d, i) => (
          <div key={d.date} className="text-center" style={{ width: barWidth, flexShrink: 0 }}>
            {i % 2 === 0 ? d.label : ''}
          </div>
        ))}
      </div>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${((hovered + 0.5) / n) * 100}%` }}
        >
          <p className="font-semibold text-slate-900">{data[hovered].count.toLocaleString('en-IN')} leads</p>
          <p className="text-slate-500">{data[hovered].label}</p>
        </div>
      )}
    </div>
  )
}
