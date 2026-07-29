'use client'

import { useMemo, useState, useTransition } from 'react'
import type { Inquiry, InquiryStatus } from '@/lib/types'
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES } from '@/lib/types'
import { toCsv, downloadCsv } from '@/lib/csv'
import { useInquiryActions } from './inquiries-context'
import { InquiryModal } from './inquiry-modal'
import { bulkDeleteInquiries, bulkUpdateInquiryStatus } from './actions'

type TabKey = 'all' | InquiryStatus
type SortKey = 'name' | 'project_type' | 'city' | 'status' | 'created_at'
type SortDir = 'asc' | 'desc'

const CSV_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'project_type', label: 'Type' },
  { key: 'city', label: 'City' },
  { key: 'status_label', label: 'Status' },
  { key: 'created_at_formatted', label: 'Received' },
  { key: 'notes', label: 'Notes' },
]

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

function isoDateNDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function InquiriesTable({ inquiries, emptyLabel }: { inquiries: Inquiry[]; emptyLabel: string }) {
  const [tab, setTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<InquiryStatus>('contacted')
  const [bulkPending, startBulkTransition] = useTransition()
  const { applyUpdate, applyDelete } = useInquiryActions()

  const activeInquiry = activeId ? (inquiries.find((i) => i.id === activeId) ?? null) : null

  const counts = useMemo(() => {
    const base: Record<TabKey, number> = { all: inquiries.length, new: 0, contacted: 0, in_progress: 0, closed: 0 }
    for (const inquiry of inquiries) base[inquiry.status] += 1
    return base
  }, [inquiries])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null

    return inquiries.filter((inquiry) => {
      if (tab !== 'all' && inquiry.status !== tab) return false

      const created = new Date(inquiry.created_at).getTime()
      if (from !== null && created < from) return false
      if (to !== null && created >= to) return false

      if (!q) return true
      return [inquiry.name, inquiry.email, inquiry.phone, inquiry.company, inquiry.project_type, inquiry.city]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    })
  }, [inquiries, tab, query, dateFrom, dateTo])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    copy.sort((a, b) => {
      if (sortKey === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
      }
      const av = (a[sortKey] ?? '') as string
      const bv = (b[sortKey] ?? '') as string
      return av.localeCompare(bv) * dir
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    ...STATUS_ORDER.map((s) => ({ key: s as TabKey, label: STATUS_LABELS[s] })),
  ]

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'created_at' ? 'desc' : 'asc')
    }
  }

  function toggleSelected(id: string) {
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = sorted.length > 0 && sorted.every((i) => selected.has(i.id))
  const someVisibleSelected = sorted.some((i) => selected.has(i.id))

  function toggleSelectAll() {
    setSelected((cur) => {
      if (allVisibleSelected) {
        const next = new Set(cur)
        for (const i of sorted) next.delete(i.id)
        return next
      }
      const next = new Set(cur)
      for (const i of sorted) next.add(i.id)
      return next
    })
  }

  function handleExportCsv() {
    const rows = sorted.map((inquiry) => ({
      ...inquiry,
      status_label: STATUS_LABELS[inquiry.status],
      created_at_formatted: formatDate(inquiry.created_at),
    }))
    const csv = toCsv(rows, CSV_COLUMNS)
    downloadCsv(`inquiries-${todayIsoDate()}.csv`, csv)
  }

  function applyBulkStatus() {
    const ids = [...selected]
    for (const id of ids) applyUpdate(id, { status: bulkStatus })
    setSelected(new Set())
    startBulkTransition(async () => {
      try {
        await bulkUpdateInquiryStatus(ids, bulkStatus)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to update status.')
      }
    })
  }

  function applyBulkDelete() {
    const ids = [...selected]
    if (!window.confirm(`Delete ${ids.length} inquir${ids.length === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return
    applyDelete(ids)
    setSelected(new Set())
    startBulkTransition(async () => {
      try {
        await bulkDeleteInquiries(ids)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete inquiries.')
      }
    })
  }

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

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, company…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 sm:w-64 focus:border-sky-500 focus:outline-none"
          />
          <button
            onClick={handleExportCsv}
            className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-sky-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Received:</span>
        {[
          { label: 'Today', from: todayIsoDate() },
          { label: 'Last 7 days', from: isoDateNDaysAgo(7) },
          { label: 'Last 30 days', from: isoDateNDaysAgo(30) },
          { label: 'All time', from: '' },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setDateFrom(preset.from)
              setDateTo('')
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-sky-50"
          >
            {preset.label}
          </button>
        ))}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
        />
      </div>

      {someVisibleSelected && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <span className="text-sm font-semibold text-sky-900">{selected.size} selected</span>

          <select
            value={bulkStatus}
            disabled={bulkPending}
            onChange={(e) => setBulkStatus(e.target.value as InquiryStatus)}
            className="rounded-lg border border-sky-200 bg-white px-2 py-1.5 text-sm text-slate-900 disabled:opacity-50"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            disabled={bulkPending}
            onClick={applyBulkStatus}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            Apply status
          </button>

          <button
            disabled={bulkPending}
            onClick={applyBulkDelete}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>

          <button
            disabled={bulkPending}
            onClick={() => setSelected(new Set())}
            className="ml-auto text-sm font-medium text-sky-700 hover:underline disabled:opacity-50"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </th>
              <SortableHeader label="Contact" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Type" sortKey="project_type" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="City" sortKey="city" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Received" sortKey="created_at" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                  {emptyLabel}
                </td>
              </tr>
            )}

            {sorted.map((inquiry) => (
              <InquiryRow
                key={inquiry.id}
                inquiry={inquiry}
                onOpen={() => setActiveId(inquiry.id)}
                selected={selected.has(inquiry.id)}
                onToggleSelected={() => toggleSelected(inquiry.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {sorted.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
            {emptyLabel}
          </p>
        )}

        {sorted.map((inquiry) => (
          <InquiryCard
            key={inquiry.id}
            inquiry={inquiry}
            onOpen={() => setActiveId(inquiry.id)}
            selected={selected.has(inquiry.id)}
            onToggleSelected={() => toggleSelected(inquiry.id)}
          />
        ))}
      </div>

      {activeInquiry && (
        <InquiryModal key={activeInquiry.id} inquiry={activeInquiry} onClose={() => setActiveId(null)} />
      )}
    </div>
  )
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = sortKey === activeKey
  return (
    <th className="px-5 py-3 font-semibold">
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 transition hover:text-slate-600 ${active ? 'text-slate-600' : ''}`}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
          stroke="currentColor"
          className={`h-3 w-3 transition ${active ? 'opacity-100' : 'opacity-0'} ${
            active && dir === 'asc' ? 'rotate-180' : ''
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    </th>
  )
}

function InquiryRow({
  inquiry,
  onOpen,
  selected,
  onToggleSelected,
}: {
  inquiry: Inquiry
  onOpen: () => void
  selected: boolean
  onToggleSelected: () => void
}) {
  const property = requestedProperty(inquiry.message)
  const unread = !inquiry.viewed_at

  return (
    <tr
      onClick={onOpen}
      className={`cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-sky-50/60 ${
        unread ? 'bg-sky-50/40' : ''
      }`}
    >
      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelected}
          className="h-4 w-4 rounded border-slate-300"
        />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-label="Unread" />}
          <p className={`font-semibold ${unread ? 'text-slate-900' : 'text-slate-600'}`}>{inquiry.name}</p>
        </div>
        <p className="text-xs text-slate-500">{inquiry.email}</p>
        {inquiry.phone && <p className="text-xs text-slate-400">{inquiry.phone}</p>}
      </td>
      <td className="px-5 py-4 text-slate-700">{property ?? inquiry.project_type ?? '—'}</td>
      <td className="px-5 py-4 text-slate-700">{inquiry.city ?? '—'}</td>
      <td className="px-5 py-4">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[inquiry.status]}`}>
          {STATUS_LABELS[inquiry.status]}
        </span>
      </td>
      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">{formatDate(inquiry.created_at)}</td>
      <td className="px-5 py-4 text-right">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="ml-auto h-4 w-4 text-slate-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </td>
    </tr>
  )
}

function InquiryCard({
  inquiry,
  onOpen,
  selected,
  onToggleSelected,
}: {
  inquiry: Inquiry
  onOpen: () => void
  selected: boolean
  onToggleSelected: () => void
}) {
  const property = requestedProperty(inquiry.message)
  const unread = !inquiry.viewed_at

  return (
    <div
      onClick={onOpen}
      className={`cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-sky-50/60 ${
        unread ? 'bg-sky-50/40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-label="Unread" />}
              <p className={`truncate font-semibold ${unread ? 'text-slate-900' : 'text-slate-600'}`}>
                {inquiry.name}
              </p>
            </div>
            <p className="truncate text-xs text-slate-500">{inquiry.email}</p>
            {inquiry.phone && <p className="truncate text-xs text-slate-400">{inquiry.phone}</p>}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[inquiry.status]}`}
        >
          {STATUS_LABELS[inquiry.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{property ?? inquiry.project_type ?? '—'}</span>
        <span>{inquiry.city ?? '—'}</span>
        <span className="ml-auto text-slate-400">{formatDate(inquiry.created_at)}</span>
      </div>
    </div>
  )
}
