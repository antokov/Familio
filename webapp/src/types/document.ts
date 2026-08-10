import type { Attendee } from './event'

export interface Document {
  id: string
  filename: string
  contentType: string
  sizeBytes: number
  familyMemberId: string | null
  uploadedAt: string
}

export interface ExtractedEventCandidate {
  id: string
  title: string
  startDt: string
  endDt: string
  allDay: boolean
  attendees: Attendee[]
}

const EXTRACTABLE_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

export function isExtractable(contentType: string): boolean {
  return EXTRACTABLE_CONTENT_TYPES.has(contentType)
}
