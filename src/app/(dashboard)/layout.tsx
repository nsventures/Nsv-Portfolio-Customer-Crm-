import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAllowedAdminEmail } from '@/lib/admin'
import type { Inquiry } from '@/lib/types'
import { InquiriesProvider } from './inquiries-context'
import { NavigationProgressProvider } from './navigation-progress'
import { SidebarNav } from './sidebar-nav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAllowedAdminEmail(user.email)) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load inquiries: {error.message}
        </p>
      </div>
    )
  }

  return (
    <InquiriesProvider initial={(data ?? []) as Inquiry[]}>
      <NavigationProgressProvider>
        <div className="min-h-screen bg-slate-50">
          <SidebarNav email={user.email} />
          <main className="min-w-0 overflow-x-hidden px-4 pt-20 pb-8 sm:px-6 lg:ml-64 lg:px-10 lg:pt-8">
            {children}
          </main>
        </div>
      </NavigationProgressProvider>
    </InquiriesProvider>
  )
}
