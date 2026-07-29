'use client'

import { useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { isPortfolioViewer, STATUS_LABELS, STATUS_STYLES } from '@/lib/types'
import { useInquiries } from './inquiries-context'
import { useNavigationProgress } from './navigation-progress'
import { TrendChart, type TrendPoint } from './trend-chart'

const TREND_DAYS = 14

const ACCENTS = {
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo: 'bg-indigo-50 text-indigo-600',
} as const

type Accent = keyof typeof ACCENTS

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const inquiries = useInquiries()

  const stats = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    let today = 0
    let yesterday = 0
    let converted = 0
    let portfolio = 0
    let awaiting = 0

    for (const inquiry of inquiries) {
      const created = new Date(inquiry.created_at)
      if (created >= todayStart) today += 1
      else if (created >= yesterdayStart) yesterday += 1

      if (inquiry.status === 'closed') converted += 1
      if (inquiry.status === 'new') awaiting += 1
      if (isPortfolioViewer(inquiry)) portfolio += 1
    }

    return {
      total: inquiries.length,
      enquiries: inquiries.length - portfolio,
      today,
      yesterday,
      converted,
      portfolio,
      awaiting,
    }
  }, [inquiries])

  const unread = useMemo(() => {
    let enquiries = 0
    let portfolio = 0
    for (const inquiry of inquiries) {
      if (inquiry.viewed_at) continue
      if (isPortfolioViewer(inquiry)) portfolio += 1
      else enquiries += 1
    }
    return { enquiries, portfolio }
  }, [inquiries])

  const recent = inquiries.slice(0, 8)

  const trend = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const days: TrendPoint[] = []

    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const dayStart = new Date(todayStart)
      dayStart.setDate(dayStart.getDate() - i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const count = inquiries.filter((inquiry) => {
        const created = new Date(inquiry.created_at)
        return created >= dayStart && created < dayEnd
      }).length

      days.push({
        date: dayStart.toISOString().slice(0, 10),
        label: dayStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        count,
      })
    }

    return days
  }, [inquiries])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live overview of enquiries and portfolio activity.</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total leads" value={stats.total} accent="sky" icon={<InboxIcon />} />
        <StatCard label="Today's leads" value={stats.today} accent="violet" icon={<SunIcon />} />
        <StatCard label="Yesterday's leads" value={stats.yesterday} accent="amber" icon={<ClockIcon />} />
        <StatCard label="Awaiting action" value={stats.awaiting} accent="rose" icon={<BellIcon />} />
        <StatCard label="Converted" value={stats.converted} accent="emerald" icon={<CheckIcon />} />
        <StatCard label="Portfolio views" value={stats.portfolio} accent="indigo" icon={<EyeIcon />} />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Leads over the last {TREND_DAYS} days</h2>
        <div className="mt-4">
          <TrendChart data={trend} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>

          {recent.length === 0 ? (
            <p className="mt-6 py-8 text-center text-sm text-slate-500">No inquiries yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recent.map((inquiry) => (
                <li key={inquiry.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{inquiry.name}</p>
                    <p className="truncate text-xs text-slate-500">{inquiry.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      {isPortfolioViewer(inquiry) ? 'Portfolio' : 'Enquiry'}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[inquiry.status]}`}
                    >
                      {STATUS_LABELS[inquiry.status]}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400 sm:w-14 sm:text-right">
                      {relativeTime(inquiry.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <QuickLink
            href="/enquiries"
            label="Enquiries"
            description="Contact & callback requests"
            count={stats.enquiries}
            unread={unread.enquiries}
          />
          <QuickLink
            href="/portfolio"
            label="Portfolio Viewer"
            description="Property portfolio access"
            count={stats.portfolio}
            unread={unread.portfolio}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent, icon }: { label: string; value: number; accent: Accent; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${ACCENTS[accent]}`}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value.toLocaleString('en-IN')}</p>
    </div>
  )
}

function QuickLink({
  href,
  label,
  description,
  count,
  unread,
}: {
  href: string
  label: string
  description: string
  count: number
  unread: number
}) {
  const { start } = useNavigationProgress()
  return (
    <Link
      href={href}
      onNavigate={() => start()}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">{label}</p>
        <div className="flex items-center gap-1.5">
          {unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[11px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">{count}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <p className="mt-3 text-sm font-semibold text-sky-600">Go to {label.toLowerCase()} →</p>
    </Link>
  )
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V6.75M3.75 6.75 12 13.5l8.25-6.75"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m0 13.5V21m8.25-9H18m-12 0H3.75m13.5-6.375-1.591 1.591M7.841 16.159 6.25 17.75m11.5 0-1.591-1.591M7.841 7.841 6.25 6.25M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75V12l3 1.5m5.25-1.5a8.25 8.25 0 1 1-16.5 0 8.25 8.25 0 0 1 16.5 0Z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 2.25 2.25 6-6m5.25 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}
