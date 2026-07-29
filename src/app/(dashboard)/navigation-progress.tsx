'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface NavigationProgressContextValue {
  start: () => void
}

const NavigationProgressContext = createContext<NavigationProgressContextValue>({
  start: () => {},
})

export function useNavigationProgress() {
  return useContext(NavigationProgressContext)
}

export function NavigationProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')
  const [runId, setRunId] = useState(0)
  const isFirstRender = useRef(true)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    setRunId((n) => n + 1)
    setPhase('loading')
  }, [])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setPhase('done')
    idleTimer.current = setTimeout(() => setPhase('idle'), 350)
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [pathname, searchParams])

  return (
    <NavigationProgressContext.Provider value={{ start }}>
      {phase !== 'idle' && <ProgressBar key={runId} done={phase === 'done'} />}
      {children}
    </NavigationProgressContext.Provider>
  )
}

function ProgressBar({ done }: { done: boolean }) {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setStarted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const width = done ? 100 : started ? 85 : 0

  return (
    <div
      aria-hidden
      className={`fixed inset-x-0 top-0 z-[60] h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 shadow-[0_0_8px_rgba(14,165,233,0.6)] transition-[width,opacity] ease-out ${
        done ? 'duration-300 opacity-0' : 'duration-[4000ms] opacity-100'
      }`}
      style={{ width: `${width}%` }}
    />
  )
}
