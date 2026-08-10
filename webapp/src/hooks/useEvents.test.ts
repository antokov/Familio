import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useEvents } from './useEvents'

const EVENT = {
  id: 'ev-1',
  title: 'Testtermin',
  description: undefined,
  start_dt: '2026-01-15T10:00:00',
  end_dt: '2026-01-15T11:00:00',
  attendees: [],
  all_day: false,
  created_at: '2026-01-01T00:00:00',
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

async function seedOneEvent() {
  mockFetchOnce(200, [EVENT])
  const { result } = renderHook(() => useEvents())
  await act(async () => {
    await result.current.fetchEvents('2026-01-01', '2026-01-31')
  })
  expect(result.current.events).toHaveLength(1)
  return result
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useEvents — deleteEvent', () => {
  it('entfernt den Termin lokal und liefert true bei Erfolg (204)', async () => {
    const result = await seedOneEvent()
    mockFetchOnce(204)

    let ok = false
    await act(async () => {
      ok = await result.current.deleteEvent('ev-1')
    })

    expect(ok).toBe(true)
    expect(result.current.events).toHaveLength(0)
  })

  it('behandelt 404 (bereits gelöscht) wie Erfolg', async () => {
    const result = await seedOneEvent()
    mockFetchOnce(404)

    let ok = false
    await act(async () => {
      ok = await result.current.deleteEvent('ev-1')
    })

    expect(ok).toBe(true)
    expect(result.current.events).toHaveLength(0)
  })

  it('liefert false und behält den Termin bei einem Server-Fehler (500)', async () => {
    const result = await seedOneEvent()
    mockFetchOnce(500)

    let ok = true
    await act(async () => {
      ok = await result.current.deleteEvent('ev-1')
    })

    expect(ok).toBe(false)
    expect(result.current.events).toHaveLength(1)
  })

  it('liefert false, wenn fetch wirft (Netzwerkfehler)', async () => {
    const result = await seedOneEvent()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    let ok = true
    await act(async () => {
      ok = await result.current.deleteEvent('ev-1')
    })

    expect(ok).toBe(false)
    expect(result.current.events).toHaveLength(1)
  })
})
