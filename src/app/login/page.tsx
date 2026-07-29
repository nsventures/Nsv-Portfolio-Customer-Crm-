'use client'

import Image from 'next/image'
import { useActionState } from 'react'
import { signIn } from './actions'
import { ADMIN_EMAIL } from '@/lib/admin'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<{ error: string | null }, FormData>(
    signIn,
    { error: null },
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-white to-white px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-sky-900/5 sm:p-10">
        <div className="flex justify-center">
          <div className="flex items-center justify-center rounded-2xl bg-[#0b1730] px-6 py-4">
            <Image src="/logo.png" alt="NS Ventures" width={500} height={123} className="h-9 w-auto" priority />
          </div>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">Inquiries CRM</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage enquiries.</p>
        </div>

        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MailIcon />
              </span>
              <input
                type="email"
                value={ADMIN_EMAIL}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </div>

          {state.error && (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-500 disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">Restricted to authorized NS Ventures admins.</p>
      </div>
    </main>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V6.75M3.75 6.75 12 13.5l8.25-6.75"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 9.75h10.5a1.5 1.5 0 0 0 1.5-1.5v-6.75a1.5 1.5 0 0 0-1.5-1.5H6.75a1.5 1.5 0 0 0-1.5 1.5v6.75a1.5 1.5 0 0 0 1.5 1.5Z"
      />
    </svg>
  )
}
