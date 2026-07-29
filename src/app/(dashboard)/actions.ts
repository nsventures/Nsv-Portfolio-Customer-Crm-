'use server'

import { revalidatePath } from 'next/cache'
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

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('inquiries').update({ status }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function updateInquiryNotes(id: string, notes: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('inquiries')
    .update({ notes: notes.trim() || null })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function deleteInquiry(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('inquiries').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function markInquiryViewed(id: string) {
  const supabase = await requireAdmin()
  // .is('viewed_at', null) guards against re-writing/re-triggering on every
  // expand of an already-viewed row — this fires far more often than the
  // other actions, so we skip revalidatePath here (realtime already syncs it).
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
  revalidatePath('/', 'layout')
}

export async function bulkDeleteInquiries(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await requireAdmin()
  const { error } = await supabase.from('inquiries').delete().in('id', ids)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}
