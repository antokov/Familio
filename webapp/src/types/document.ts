export interface Document {
  id: string
  filename: string
  contentType: string
  sizeBytes: number
  familyMemberId: string | null
  uploadedAt: string
}
