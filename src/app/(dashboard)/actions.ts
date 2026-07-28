'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InquiryStatus } from '@/lib/types'

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const supabase = await createClient()
  const { error } = await supabase.from('inquiries').update({ status }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function updateInquiryNotes(id: string, notes: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inquiries')
    .update({ notes: notes.trim() || null })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function deleteInquiry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('inquiries').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}
