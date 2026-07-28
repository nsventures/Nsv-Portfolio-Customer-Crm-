'use client'

import { useMemo, useState, useTransition } from 'react'
import type { Inquiry, InquiryStatus } from '@/lib/types'
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES } from '@/lib/types'
import { deleteInquiry, updateInquiryNotes, updateInquiryStatus } from './actions'

type TabKey = 'all' | InquiryStatus

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function requestedProperty(message: string | null) {
  if (!message) return null
  const match = message.match(/view:\s*(.+)$/i)
  return match ? match[1].trim() : null
}

export function InquiriesTable({ inquiries, emptyLabel }: { inquiries: Inquiry[]; emptyLabel: string }) {
  const [tab, setTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const counts = useMemo(() => {
    const base: Record<TabKey, number> = { all: inquiries.length, new: 0, contacted: 0, in_progress: 0, closed: 0 }
    for (const inquiry of inquiries) base[inquiry.status] += 1
    return base
  }, [inquiries])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inquiries.filter((inquiry) => {
      if (tab !== 'all' && inquiry.status !== tab) return false
      if (!q) return true
      return [inquiry.name, inquiry.email, inquiry.phone, inquiry.company, inquiry.project_type, inquiry.city]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    })
  }, [inquiries, tab, query])

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    ...STATUS_ORDER.map((s) => ({ key: s as TabKey, label: STATUS_LABELS[s] })),
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === key
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-sky-50'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone, company…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-72 focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-semibold">Contact</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">City</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Received</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                  {emptyLabel}
                </td>
              </tr>
            )}

            {filtered.map((inquiry) => (
              <InquiryRow
                key={inquiry.id}
                inquiry={inquiry}
                expanded={expanded === inquiry.id}
                onToggle={() => setExpanded((cur) => (cur === inquiry.id ? null : inquiry.id))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InquiryRow({
  inquiry,
  expanded,
  onToggle,
}: {
  inquiry: Inquiry
  expanded: boolean
  onToggle: () => void
}) {
  const [notes, setNotes] = useState(inquiry.notes ?? '')
  const [pending, startTransition] = useTransition()
  const property = requestedProperty(inquiry.message)

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-sky-50/60"
      >
        <td className="px-5 py-4">
          <p className="font-semibold text-slate-900">{inquiry.name}</p>
          <p className="text-xs text-slate-500">{inquiry.email}</p>
          {inquiry.phone && <p className="text-xs text-slate-400">{inquiry.phone}</p>}
        </td>
        <td className="px-5 py-4 text-slate-700">
          {property ?? inquiry.project_type ?? '—'}
        </td>
        <td className="px-5 py-4 text-slate-700">{inquiry.city ?? '—'}</td>
        <td className="px-5 py-4">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[inquiry.status]}`}>
            {STATUS_LABELS[inquiry.status]}
          </span>
        </td>
        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">{formatDate(inquiry.created_at)}</td>
        <td className="px-5 py-4 text-right">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={2}
            stroke="currentColor"
            className={`ml-auto h-4 w-4 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-slate-50 bg-slate-50/70 last:border-0">
          <td colSpan={6} className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
            {inquiry.message && (
              <p className="mb-3 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                {inquiry.message}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <select
                value={inquiry.status}
                disabled={pending}
                onChange={(e) => {
                  const status = e.target.value as InquiryStatus
                  startTransition(() => updateInquiryStatus(inquiry.id, status))
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if (notes !== (inquiry.notes ?? '')) {
                    startTransition(() => updateInquiryNotes(inquiry.id, notes))
                  }
                }}
                placeholder="Internal notes…"
                rows={2}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />

              <button
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete inquiry from ${inquiry.name}? This cannot be undone.`)) return
                  startTransition(() => deleteInquiry(inquiry.id))
                }}
                className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
