'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Inquiry, InquiryStatus, InquiryStatusHistoryEntry } from '@/lib/types'
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES } from '@/lib/types'
import { useInquiryActions } from './inquiries-context'
import { deleteInquiry, markInquiryViewed, updateInquiryNotes, updateInquiryStatus } from './actions'

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

export function InquiryModal({ inquiry, onClose }: { inquiry: Inquiry; onClose: () => void }) {
  const [notes, setNotes] = useState(inquiry.notes ?? '')
  const [history, setHistory] = useState<InquiryStatusHistoryEntry[] | null>(null)
  const [pending, startTransition] = useTransition()
  const { applyUpdate, applyDelete } = useInquiryActions()
  const property = requestedProperty(inquiry.message)

  useEffect(() => {
    if (!inquiry.viewed_at) {
      const viewedAt = new Date().toISOString()
      applyUpdate(inquiry.id, { viewed_at: viewedAt })
      markInquiryViewed(inquiry.id).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry.id])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('inquiry_status_history')
      .select('*')
      .eq('inquiry_id', inquiry.id)
      .order('changed_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setHistory((data ?? []) as InquiryStatusHistoryEntry[])
      })
    return () => {
      cancelled = true
    }
  }, [inquiry.id])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2 id="inquiry-modal-title" className="truncate text-lg font-bold text-slate-900">
              {inquiry.name}
            </h2>
            <p className="truncate text-sm text-slate-500">{inquiry.email}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Field label="Phone" value={inquiry.phone} />
            <Field label="Company" value={inquiry.company} />
            <Field label="Type" value={property ?? inquiry.project_type} />
            <Field label="City" value={inquiry.city} />
            <Field label="Timeline" value={inquiry.timeline} />
            <Field label="Received" value={formatDate(inquiry.created_at)} />
          </div>

          {inquiry.message && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Message</p>
              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {inquiry.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <select
                value={inquiry.status}
                disabled={pending}
                onChange={(e) => {
                  const status = e.target.value as InquiryStatus
                  applyUpdate(inquiry.id, { status })
                  startTransition(async () => {
                    try {
                      await updateInquiryStatus(inquiry.id, status)
                    } catch (err) {
                      applyUpdate(inquiry.id, { status: inquiry.status })
                      alert(err instanceof Error ? err.message : 'Failed to update status.')
                    }
                  })
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <span
                className={`inline-flex w-fit items-center rounded-full border px-3 py-2 text-xs font-semibold ${STATUS_STYLES[inquiry.status]}`}
              >
                {STATUS_LABELS[inquiry.status]}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (inquiry.notes ?? '')) {
                  const nextNotes = notes
                  applyUpdate(inquiry.id, { notes: nextNotes.trim() || null })
                  startTransition(async () => {
                    try {
                      await updateInquiryNotes(inquiry.id, nextNotes)
                    } catch (err) {
                      applyUpdate(inquiry.id, { notes: inquiry.notes })
                      alert(err instanceof Error ? err.message : 'Failed to save notes.')
                    }
                  })
                }
              }}
              placeholder="Internal notes…"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Status history</p>
            {history === null ? (
              <p className="text-xs text-slate-400">Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400">No status changes yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {history.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                      {entry.old_status ? STATUS_LABELS[entry.old_status] : 'Created'} →{' '}
                      {STATUS_LABELS[entry.new_status]}
                    </span>
                    <span className="text-slate-400">{formatDate(entry.changed_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete inquiry from ${inquiry.name}? This cannot be undone.`)) return
              applyDelete([inquiry.id])
              onClose()
              startTransition(async () => {
                try {
                  await deleteInquiry(inquiry.id)
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Failed to delete inquiry.')
                }
              })
            }}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Delete inquiry
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm text-slate-700">{value ?? '—'}</p>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
