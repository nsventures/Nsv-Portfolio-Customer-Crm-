'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isPortfolioViewer } from '@/lib/types'
import { useInquiries } from './inquiries-context'
import { useNavigationProgress } from './navigation-progress'
import { SignOutButton } from './sign-out-button'

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5h6.75V3.75H3.75v9.75Zm0 6.75h6.75v-4.5H3.75v4.5Zm9.75 0h6.75V10.5h-6.75v9.75Zm0-16.5v4.5h6.75v-4.5h-6.75Z"
        />
      </svg>
    ),
  },
  {
    href: '/enquiries',
    label: 'Enquiries',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V6.75M3.75 6.75 12 13.5l8.25-6.75"
        />
      </svg>
    ),
  },
  {
    href: '/portfolio',
    label: 'Portfolio Viewer',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75 8.25 9.75c.75-.75 1.955-.75 2.706 0l4.294 4.294M14.25 12l1.545-1.545c.75-.75 1.955-.75 2.706 0l3.249 3.249M3.75 19.5h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z"
        />
      </svg>
    ),
  },
]

export function SidebarNav({ email }: { email: string | null | undefined }) {
  const pathname = usePathname()
  const inquiries = useInquiries()
  const { start } = useNavigationProgress()
  const [open, setOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  const unreadEnquiries = inquiries.filter((i) => !i.viewed_at && !isPortfolioViewer(i)).length
  const unreadPortfolio = inquiries.filter((i) => !i.viewed_at && isPortfolioViewer(i)).length
  const unreadCounts: Record<string, number> = {
    '/': unreadEnquiries + unreadPortfolio,
    '/enquiries': unreadEnquiries,
    '/portfolio': unreadPortfolio,
  }

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 bg-[#0b1730] px-4 py-3 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <MenuIcon />
        </button>
        <Image src="/logo.png" alt="NS Ventures" width={500} height={123} className="h-7 w-auto" priority />
        <span className="w-9" />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full transform flex-col bg-[#0b1730] transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-6 py-6">
          <Image src="/logo.png" alt="NS Ventures" width={500} height={123} className="h-8 w-auto" priority />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            const count = unreadCounts[href] ?? 0
            return (
              <Link
                key={href}
                href={href}
                onNavigate={() => start()}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'border border-sky-500/50 bg-sky-500/15 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={active ? 'text-sky-400' : 'text-slate-400'}>{icon}</span>
                {label}
                {count > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[11px] font-bold text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="truncate text-xs text-slate-400">{email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
