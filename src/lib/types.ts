export type InquiryStatus = 'new' | 'contacted' | 'in_progress' | 'closed'

export interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  project_type: string | null
  city: string | null
  timeline: string | null
  message: string | null
  status: InquiryStatus
  notes: string | null
  created_at: string
  updated_at: string
  viewed_at: string | null
}

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  closed: 'Closed',
}

export const STATUS_ORDER: InquiryStatus[] = ['new', 'contacted', 'in_progress', 'closed']

export const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: 'bg-sky-50 text-sky-700 border-sky-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-purple-50 text-purple-700 border-purple-200',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function isPortfolioViewer(inquiry: Inquiry) {
  return inquiry.project_type === 'Portfolio viewer'
}

export interface InquiryStatusHistoryEntry {
  id: string
  inquiry_id: string
  old_status: InquiryStatus | null
  new_status: InquiryStatus
  changed_by: string | null
  changed_at: string
}
