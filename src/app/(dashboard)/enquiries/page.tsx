'use client'

import { useMemo } from 'react'
import { isPortfolioViewer } from '@/lib/types'
import { useInquiries } from '../inquiries-context'
import { InquiriesTable } from '../inquiries-table'

export default function EnquiriesPage() {
  const inquiries = useInquiries()
  const enquiries = useMemo(() => inquiries.filter((i) => !isPortfolioViewer(i)), [inquiries])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Enquiries</h1>
        <p className="mt-1 text-sm text-slate-500">Contact and callback requests from the website.</p>
      </div>

      <InquiriesTable inquiries={enquiries} emptyLabel="No enquiries here." />
    </div>
  )
}
