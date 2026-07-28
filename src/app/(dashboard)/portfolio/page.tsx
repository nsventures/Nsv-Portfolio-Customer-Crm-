'use client'

import { useMemo } from 'react'
import { isPortfolioViewer } from '@/lib/types'
import { useInquiries } from '../inquiries-context'
import { InquiriesTable } from '../inquiries-table'

export default function PortfolioViewerPage() {
  const inquiries = useInquiries()
  const portfolio = useMemo(() => inquiries.filter(isPortfolioViewer), [inquiries])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Portfolio Viewer</h1>
        <p className="mt-1 text-sm text-slate-500">Property portfolio access requests.</p>
      </div>

      <InquiriesTable inquiries={portfolio} emptyLabel="No portfolio access requests here." />
    </div>
  )
}
