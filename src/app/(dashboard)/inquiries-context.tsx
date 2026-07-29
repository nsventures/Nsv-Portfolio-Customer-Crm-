'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Inquiry } from '@/lib/types'

const InquiriesContext = createContext<Inquiry[] | null>(null)

interface InquiriesActions {
  applyUpdate: (id: string, patch: Partial<Inquiry>) => void
  applyDelete: (ids: string[]) => void
}

const InquiriesActionsContext = createContext<InquiriesActions | null>(null)

export function InquiriesProvider({
  initial,
  children,
}: {
  initial: Inquiry[]
  children: React.ReactNode
}) {
  const [inquiries, setInquiries] = useState(initial)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    function handlePayload(payload: RealtimePostgresChangesPayload<Inquiry>) {
      setInquiries((current) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as Inquiry
          if (current.some((i) => i.id === row.id)) return current
          return [row, ...current].sort((a, b) => b.created_at.localeCompare(a.created_at))
        }
        if (payload.eventType === 'UPDATE') {
          const row = payload.new as Inquiry
          return current.map((i) => (i.id === row.id ? row : i))
        }
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as { id?: string }
          return current.filter((i) => i.id !== oldRow.id)
        }
        return current
      })
    }

    // Belt-and-suspenders: explicitly re-authenticate the realtime socket
    // whenever the browser session refreshes (every ~1hr by default). This
    // dashboard is meant to stay open for long stretches, so without this the
    // channel below can silently stop receiving postgres_changes events once
    // the original token expires, with no visible error — a page reload masks
    // it by re-authenticating everything from scratch.
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token)
      }
    })

    // Explicitly set the realtime socket's auth from the current session
    // BEFORE subscribing — `.channel().subscribe()` can otherwise race the
    // client's initial session load and open the socket unauthenticated,
    // which fails every RLS check (is_admin()) silently: no error, just no
    // events, ever, until something (like a full reload) re-authenticates it.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token)
      }
      channel = supabase
        .channel('inquiries-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, handlePayload)
        .subscribe()
    })

    return () => {
      cancelled = true
      authSubscription.unsubscribe()
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // Applied immediately on the client when this session performs a mutation,
  // rather than waiting on the realtime round-trip to echo it back — realtime
  // remains the source of truth for other sessions/tabs and reconciles any
  // discrepancy shortly after.
  const applyUpdate = useCallback((id: string, patch: Partial<Inquiry>) => {
    setInquiries((current) => current.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const applyDelete = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setInquiries((current) => current.filter((i) => !idSet.has(i.id)))
  }, [])

  const actions = useMemo(() => ({ applyUpdate, applyDelete }), [applyUpdate, applyDelete])

  return (
    <InquiriesContext.Provider value={inquiries}>
      <InquiriesActionsContext.Provider value={actions}>{children}</InquiriesActionsContext.Provider>
    </InquiriesContext.Provider>
  )
}

export function useInquiries() {
  const ctx = useContext(InquiriesContext)
  if (!ctx) throw new Error('useInquiries must be used within an InquiriesProvider')
  return ctx
}

export function useInquiryActions() {
  const ctx = useContext(InquiriesActionsContext)
  if (!ctx) throw new Error('useInquiryActions must be used within an InquiriesProvider')
  return ctx
}
