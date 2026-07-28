'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#0b1730]">
      <div className="flex items-center gap-2 px-6 py-6">
        <Image src="/logo.png" alt="NS Ventures" width={500} height={123} className="h-8 w-auto" priority />
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border border-sky-500/50 bg-sky-500/15 text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={active ? 'text-sky-400' : 'text-slate-400'}>{icon}</span>
              {label}
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
  )
}
