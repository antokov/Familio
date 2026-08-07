import { useState, useCallback, useEffect } from 'react'
import type { Document } from '../types/document'
import { API_BASE } from '../api/config'

function fromApi(raw: Record<string, unknown>): Document {
  return {
    id: raw['id'] as string,
    filename: raw['filename'] as string,
    contentType: raw['content_type'] as string,
    sizeBytes: raw['size_bytes'] as number,
    familyMemberId: (raw['family_member_id'] as string | null) ?? null,
    uploadedAt: raw['uploaded_at'] as string,
  }
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/documents`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Record<string, unknown>[]
      setDocuments(data.map(fromApi))
    } catch {
      setError('Dokumente konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const uploadDocument = useCallback(
    async (file: File, familyMemberId: string | null): Promise<string | null> => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        if (familyMemberId) formData.append('family_member_id', familyMemberId)
        const res = await fetch(`${API_BASE}/api/documents`, {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          return body?.detail ?? 'Dokument konnte nicht hochgeladen werden'
        }
        const raw = (await res.json()) as Record<string, unknown>
        setDocuments(prev => [fromApi(raw), ...prev])
        return null
      } catch {
        return 'Dokument konnte nicht hochgeladen werden'
      }
    },
    []
  )

  const reassignDocument = useCallback(
    async (id: string, familyMemberId: string | null): Promise<void> => {
      try {
        const res = await fetch(`${API_BASE}/api/documents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ family_member_id: familyMemberId }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw = (await res.json()) as Record<string, unknown>
        setDocuments(prev => prev.map(d => (d.id === id ? fromApi(raw) : d)))
      } catch {
        setError('Zuweisung konnte nicht geändert werden')
      }
    },
    []
  )

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch {
      setError('Dokument konnte nicht gelöscht werden')
    }
  }, [])

  function downloadUrl(id: string): string {
    return `${API_BASE}/api/documents/${id}/download`
  }

  function viewUrl(id: string): string {
    return `${API_BASE}/api/documents/${id}/view`
  }

  return { documents, loading, error, uploadDocument, reassignDocument, deleteDocument, downloadUrl, viewUrl }
}
