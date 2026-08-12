import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useDocuments } from './useDocuments'
import type { ExtractedEventCandidate } from '../types/document'

type ExtractOutcome = { events: ExtractedEventCandidate[] } | { error: string }

function asEvents(outcome: ExtractOutcome): ExtractedEventCandidate[] {
  if ('events' in outcome) return outcome.events
  throw new Error(`erwartete { events }, bekam { error: ${outcome.error} }`)
}

function asError(outcome: ExtractOutcome): string {
  if ('error' in outcome) return outcome.error
  throw new Error('erwartete { error }, bekam { events }')
}

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

describe('useDocuments — uploadDocument', () => {
  function makeFile() {
    return new File(['dummy content'], 'neu.pdf', { type: 'application/pdf' })
  }

  it('stellt das neue Dokument vorne in die Liste und liefert null bei Erfolg', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(200, { ...DOC, id: 'doc-2', filename: 'neu.pdf' })

    let err: string | null = 'unset'
    await act(async () => {
      err = await result.current.uploadDocument(makeFile(), null)
    })

    expect(err).toBeNull()
    expect(result.current.documents.map(d => d.id)).toEqual(['doc-2', 'doc-1'])
  })

  it('sendet keine family_member_id im FormData, wenn familyMemberId null ist', async () => {
    const result = await seedOneDocument()
    const fetchSpy = vi.fn().mockResolvedValueOnce({ ok: true, status: 200, json: async () => DOC })
    vi.stubGlobal('fetch', fetchSpy)

    await act(async () => {
      await result.current.uploadDocument(makeFile(), null)
    })

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const body = options.body as FormData
    expect(body.has('family_member_id')).toBe(false)
    expect(body.get('file')).toBeInstanceOf(File)
  })

  it('sendet die family_member_id im FormData, wenn eine übergeben wird', async () => {
    const result = await seedOneDocument()
    const fetchSpy = vi.fn().mockResolvedValueOnce({ ok: true, status: 200, json: async () => DOC })
    vi.stubGlobal('fetch', fetchSpy)

    await act(async () => {
      await result.current.uploadDocument(makeFile(), 'member-1')
    })

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const body = options.body as FormData
    expect(body.get('family_member_id')).toBe('member-1')
  })

  it('liefert die Server-Fehlermeldung, wenn der Fehler-Body ein detail-Feld hat', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(415, { detail: 'Nicht unterstützter Dateityp' })

    let err: string | null = null
    await act(async () => {
      err = await result.current.uploadDocument(makeFile(), null)
    })

    expect(err).toBe('Nicht unterstützter Dateityp')
    expect(result.current.documents).toHaveLength(1)
  })

  it('liefert die Standard-Fehlermeldung, wenn der Fehler-Body kein detail-Feld hat', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(500, {})

    let err: string | null = null
    await act(async () => {
      err = await result.current.uploadDocument(makeFile(), null)
    })

    expect(err).toBe('Dokument konnte nicht hochgeladen werden')
  })

  it('liefert die Standard-Fehlermeldung, wenn der Fehler-Body kein gültiges JSON ist', async () => {
    const result = await seedOneDocument()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('not json') },
      })
    )

    let err: string | null = null
    await act(async () => {
      err = await result.current.uploadDocument(makeFile(), null)
    })

    expect(err).toBe('Dokument konnte nicht hochgeladen werden')
  })

  it('liefert die Standard-Fehlermeldung bei einem Netzwerkfehler', async () => {
    const result = await seedOneDocument()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    let err: string | null = null
    await act(async () => {
      err = await result.current.uploadDocument(makeFile(), null)
    })

    expect(err).toBe('Dokument konnte nicht hochgeladen werden')
  })
})

describe('useDocuments — reassignDocument', () => {
  it('aktualisiert die Zuweisung lokal bei Erfolg', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(200, { ...DOC, family_member_id: 'member-1' })

    await act(async () => {
      await result.current.reassignDocument('doc-1', 'member-1')
    })

    expect(result.current.documents[0].familyMemberId).toBe('member-1')
  })

  it('kann die Zuweisung zurück auf unzugewiesen (null) setzen', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(200, { ...DOC, family_member_id: null })

    await act(async () => {
      await result.current.reassignDocument('doc-1', null)
    })

    expect(result.current.documents[0].familyMemberId).toBeNull()
  })

  it('setzt error und lässt das Dokument unverändert bei einem Server-Fehler (500)', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(500)

    await act(async () => {
      await result.current.reassignDocument('doc-1', 'member-1')
    })

    expect(result.current.error).toBe('Zuweisung konnte nicht geändert werden')
    expect(result.current.documents[0].familyMemberId).toBeNull()
  })

  it('setzt error und lässt das Dokument unverändert bei einem Netzwerkfehler', async () => {
    const result = await seedOneDocument()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    await act(async () => {
      await result.current.reassignDocument('doc-1', 'member-1')
    })

    expect(result.current.error).toBe('Zuweisung konnte nicht geändert werden')
    expect(result.current.documents[0].familyMemberId).toBeNull()
  })
})

describe('useDocuments — deleteDocument', () => {
  it('entfernt das Dokument lokal bei Erfolg', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(204)

    await act(async () => {
      await result.current.deleteDocument('doc-1')
    })

    expect(result.current.documents).toHaveLength(0)
  })

  it('setzt error und behält das Dokument bei einem Server-Fehler (500)', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(500)

    await act(async () => {
      await result.current.deleteDocument('doc-1')
    })

    expect(result.current.error).toBe('Dokument konnte nicht gelöscht werden')
    expect(result.current.documents).toHaveLength(1)
  })

  it('setzt error und behält das Dokument bei einem Netzwerkfehler', async () => {
    const result = await seedOneDocument()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    await act(async () => {
      await result.current.deleteDocument('doc-1')
    })

    expect(result.current.error).toBe('Dokument konnte nicht gelöscht werden')
    expect(result.current.documents).toHaveLength(1)
  })
})

describe('useDocuments — extractEvents', () => {
  it('liefert die gemappten Termine bei Erfolg', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(200, {
      events: [
        { title: 'Elternabend', start_dt: '2026-03-01T18:00:00', end_dt: '2026-03-01T19:00:00', all_day: false, attendees: [{ initials: 'AK', color: '#5B6AF0' }] },
      ],
    })

    let outcome!: ExtractOutcome
    await act(async () => {
      outcome = await result.current.extractEvents('doc-1')
    })

    expect(asEvents(outcome)).toEqual([
      {
        id: 'candidate-0',
        title: 'Elternabend',
        startDt: '2026-03-01T18:00:00',
        endDt: '2026-03-01T19:00:00',
        allDay: false,
        attendees: [{ initials: 'AK', color: '#5B6AF0' }],
      },
    ])
    expect(result.current.error).toBeNull()
    expect(result.current.documents).toHaveLength(1)
  })

  it('setzt Standardwerte für fehlende allDay/attendees-Felder', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(200, {
      events: [{ title: 'Ferien', start_dt: '2026-07-01T00:00:00', end_dt: '2026-07-01T23:59:00' }],
    })

    let outcome!: ExtractOutcome
    await act(async () => {
      outcome = await result.current.extractEvents('doc-1')
    })

    const events = asEvents(outcome)
    expect(events[0].allDay).toBe(false)
    expect(events[0].attendees).toEqual([])
  })

  it('liefert die Server-Fehlermeldung, wenn der Fehler-Body ein detail-Feld hat', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(503, { detail: 'Claude API nicht konfiguriert' })

    let outcome!: ExtractOutcome
    await act(async () => {
      outcome = await result.current.extractEvents('doc-1')
    })

    expect(asError(outcome)).toBe('Claude API nicht konfiguriert')
  })

  it('liefert die Standard-Fehlermeldung, wenn der Fehler-Body kein detail-Feld hat', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(500, {})

    let outcome!: ExtractOutcome
    await act(async () => {
      outcome = await result.current.extractEvents('doc-1')
    })

    expect(asError(outcome)).toBe('Termine konnten nicht extrahiert werden')
  })

  it('liefert die Standard-Fehlermeldung, wenn der Fehler-Body kein gültiges JSON ist', async () => {
    const result = await seedOneDocument()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('not json') },
      })
    )

    let outcome!: ExtractOutcome
    await act(async () => {
      outcome = await result.current.extractEvents('doc-1')
    })

    expect(asError(outcome)).toBe('Termine konnten nicht extrahiert werden')
  })

  it('liefert die Standard-Fehlermeldung bei einem Netzwerkfehler', async () => {
    const result = await seedOneDocument()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    let outcome!: ExtractOutcome
    await act(async () => {
      outcome = await result.current.extractEvents('doc-1')
    })

    expect(asError(outcome)).toBe('Termine konnten nicht extrahiert werden')
  })

  it('ändert weder documents noch error, unabhängig vom Ergebnis', async () => {
    const result = await seedOneDocument()
    mockFetchOnce(500, { detail: 'Fehler' })

    await act(async () => {
      await result.current.extractEvents('doc-1')
    })

    expect(result.current.error).toBeNull()
    expect(result.current.documents).toHaveLength(1)
  })
})
