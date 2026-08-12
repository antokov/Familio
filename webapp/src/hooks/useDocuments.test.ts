import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useDocuments } from './useDocuments'

const DOC = {
  id: 'doc-1',
  filename: 'impfausweis.pdf',
  content_type: 'application/pdf',
  size_bytes: 2048,
  family_member_id: null,
  uploaded_at: '2026-01-01T00:00:00',
}

function mockFetchOnce(status: number, body: unknown = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })
  )
}

async function seedOneDocument() {
  mockFetchOnce(200, [DOC])
  const { result } = renderHook(() => useDocuments())
  await waitFor(() => expect(result.current.documents).toHaveLength(1))
  return result
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useDocuments — renameDocument', () => {
  it('aktualisiert den Dateinamen lokal und liefert true bei Erfolg', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(200, { ...DOC, filename: 'Impfausweis 2026.pdf' })

    let ok = false
    await act(async () => {
      ok = await result.current.renameDocument('doc-1', 'Impfausweis 2026.pdf')
    })

    expect(ok).toBe(true)
    expect(result.current.documents[0].filename).toBe('Impfausweis 2026.pdf')
  })

  it('liefert false und behält den alten Namen bei einem Server-Fehler (422)', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(422, { detail: 'invalid' })

    let ok = true
    await act(async () => {
      ok = await result.current.renameDocument('doc-1', '')
    })

    expect(ok).toBe(false)
    expect(result.current.documents[0].filename).toBe('impfausweis.pdf')
  })

  it('liefert false, wenn fetch wirft (Netzwerkfehler)', async () => {
    const result = await seedOneDocument()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    let ok = true
    await act(async () => {
      ok = await result.current.renameDocument('doc-1', 'Neu.pdf')
    })

    expect(ok).toBe(false)
    expect(result.current.documents[0].filename).toBe('impfausweis.pdf')
  })
})
