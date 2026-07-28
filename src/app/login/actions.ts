'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL, isAllowedAdminEmail } from '@/lib/admin'

export async function signIn(_prevState: { error: string | null }, formData: FormData) {
  const password = String(formData.get('password') ?? '')

  if (!password) {
    return { error: 'Enter your password.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  })

  if (error) {
    return { error: 'Incorrect password.' }
  }

  if (!isAllowedAdminEmail(data.user?.email)) {
    await supabase.auth.signOut()
    return { error: 'This account is not authorized.' }
  }

  redirect('/')
}
