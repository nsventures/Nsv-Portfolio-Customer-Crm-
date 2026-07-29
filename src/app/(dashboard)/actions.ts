'use server'

import { createClient } from '@/lib/supabase/server'
import { isAllowedAdminEmail } from '@/lib/admin'
import type { InquiryStatus } from '@/lib/types'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAllowedAdminEmail(user.email)) {
    throw new Error('Not authorized')
  }
  return supabase
}

// None of these actions call revalidatePath: the client already applies each
// mutation optimistically (see useInquiryActions in inquiries-context.tsx)
// and reconciles via the realtime subscription, so the SSR `initial` prop
// these would refresh is never even read again after mount. Calling it here
// used to force a full auth check + table re-fetch as part of every single
// action's response (Next.js returns the re-rendered RSC payload in the same
// round trip), which made every click noticeably slower for zero UI benefit.

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('inquiries').update({ status }).eq('id', id)

  if (error) throw new Error(error.message)
}

export async function updateInquiryNotes(id: string, notes: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('inquiries')
    .update({ notes: notes.trim() || null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteInquiry(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('inquiries').delete().eq('id', id)

  if (error) throw new Error(error.message)
}

export async function markInquiryViewed(id: string) {
  const supabase = await requireAdmin()
  // .is('viewed_at', null) guards against re-writing on every expand of an
  // already-viewed row.
  const { error } = await supabase
    .from('inquiries')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', id)
    .is('viewed_at', null)

  if (error) throw new Error(error.message)
}

export async function bulkUpdateInquiryStatus(ids: string[], status: InquiryStatus) {
  if (ids.length === 0) return
  const supabase = await requireAdmin()
  const { error } = await supabase.from('inquiries').update({ status }).in('id', ids)

  if (error) throw new Error(error.message)
}

export async function bulkDeleteInquiries(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await requireAdmin()
  const { error } = await supabase.from('inquiries').delete().in('id', ids)

  if (error) throw new Error(error.message)
}
