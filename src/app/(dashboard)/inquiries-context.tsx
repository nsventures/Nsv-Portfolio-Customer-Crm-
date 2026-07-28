'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Inquiry } from '@/lib/types'

const InquiriesContext = createContext<Inquiry[] | null>(null)

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

    const channel = supabase
      .channel('inquiries-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries' },
        (payload: RealtimePostgresChangesPayload<Inquiry>) => {
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
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <InquiriesContext.Provider value={inquiries}>{children}</InquiriesContext.Provider>
}

export function useInquiries() {
  const ctx = useContext(InquiriesContext)
  if (!ctx) throw new Error('useInquiries must be used within an InquiriesProvider')
  return ctx
}
