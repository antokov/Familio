import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useShoppingListApi } from './useShoppingListApi'

const ITEM_A = {
  id:         'item-1',
  name:       'Milch',
  quantity:   1,
  unit:       'stk',
  store:      'egal',
  checked:    false,
  checked_at: null,
  created_at: '2026-01-01T10:00:00',
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

async function seedItems(rawItems: unknown[]) {
  mockFetchOnce(200, rawItems)
  const { result } = renderHook(() => useShoppingListApi())
  await waitFor(() => expect(result.current.loading).toBe(false))
  return result
}

async function seedOneItem() {
  return seedItems([ITEM_A])
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useShoppingListApi — Laden (loadItems, AC1)', () => {
  it('ist beim Mounten sofort im Ladezustand', async () => {
    mockFetchOnce(200, [])
    const { result } = renderHook(() => useShoppingListApi())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('lädt Artikel beim Mounten und verteilt sie sortiert in offene/erledigte Listen', async () => {
    const result = await seedItems([
      { ...ITEM_A, id: 'open-old', checked: false, created_at: '2026-01-01T00:00:00' },
      { ...ITEM_A, id: 'open-new', checked: false, created_at: '2026-01-03T00:00:00' },
      { ...ITEM_A, id: 'checked-with-checkedAt', checked: true, created_at: '2026-01-02T00:00:00', checked_at: '2026-01-05T00:00:00' },
      { ...ITEM_A, id: 'checked-no-checkedAt', checked: true, created_at: '2026-01-04T00:00:00', checked_at: null },
    ])

    expect(result.current.openItems.map(i => i.id)).toEqual(['open-new', 'open-old'])
    // "checked-no-checkedAt" fällt für die Sortierung auf createdAt (04.) zurück,
    // das liegt vor checkedAt von "checked-with-checkedAt" (05.) → bleibt an zweiter Stelle
    expect(result.current.checkedItems.map(i => i.id)).toEqual(['checked-with-checkedAt', 'checked-no-checkedAt'])
    expect(result.current.checkedItems.find(i => i.id === 'checked-no-checkedAt')?.checkedAt).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it('setzt error und behält eine leere Liste, wenn das initiale Laden fehlschlägt (500)', async () => {
    mockFetchOnce(500)
    const { result } = renderHook(() => useShoppingListApi())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Artikel konnten nicht geladen werden')
    expect(result.current.openItems).toHaveLength(0)
    expect(result.current.checkedItems).toHaveLength(0)
  })

  it('setzt error, wenn das initiale Laden am Netzwerk scheitert', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))
    const { result } = renderHook(() => useShoppingListApi())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Artikel konnten nicht geladen werden')
  })
})

describe('useShoppingListApi — addItem (AC2)', () => {
  it('stellt einen neuen Artikel vorne in die offene Liste, wenn das Anlegen erfolgreich ist', async () => {
    const result = await seedOneItem()
    mockFetchOnce(200, { ...ITEM_A, id: 'item-2', name: 'Butter' })

    await act(async () => {
      await result.current.addItem({ name: 'Butter', quantity: 1, unit: 'stk', store: 'egal' })
    })

    expect(result.current.openItems.map(i => i.name)).toEqual(['Butter', 'Milch'])
  })

  it('ruft fetch nicht auf, wenn der Name leer/nur Leerzeichen ist', async () => {
    const result = await seedOneItem()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await act(async () => {
      await result.current.addItem({ name: '   ', quantity: 1, unit: 'stk', store: 'egal' })
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.openItems).toHaveLength(1)
  })

  it('setzt error und lässt die Liste unverändert bei einem Server-Fehler (500)', async () => {
    const result = await seedOneItem()
    mockFetchOnce(500)

    await act(async () => {
      await result.current.addItem({ name: 'Butter', quantity: 1, unit: 'stk', store: 'egal' })
    })

    expect(result.current.error).toBe('Artikel konnte nicht erstellt werden')
    expect(result.current.openItems).toHaveLength(1)
  })

  it('setzt error und lässt die Liste unverändert bei einem Netzwerkfehler', async () => {
    const result = await seedOneItem()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    await act(async () => {
      await result.current.addItem({ name: 'Butter', quantity: 1, unit: 'stk', store: 'egal' })
    })

    expect(result.current.error).toBe('Artikel konnte nicht erstellt werden')
    expect(result.current.openItems).toHaveLength(1)
  })
})

describe('useShoppingListApi — toggleItem (AC3)', () => {
  it('ersetzt den Artikel mit der Server-Antwort und verschiebt ihn in die erledigte Liste', async () => {
    const result = await seedOneItem()
    mockFetchOnce(200, { ...ITEM_A, checked: true, checked_at: '2026-01-02T00:00:00' })

    await act(async () => {
      await result.current.toggleItem('item-1')
    })

    expect(result.current.openItems).toHaveLength(0)
    expect(result.current.checkedItems).toHaveLength(1)
  })

  it('sendet das invertierte checked-Flag im Request-Body', async () => {
    const result = await seedOneItem()
    const fetchSpy = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...ITEM_A, checked: true }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    await act(async () => {
      await result.current.toggleItem('item-1')
    })

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(options.body as string)).toEqual({ checked: true })
  })

  it('ruft fetch nicht auf, wenn die id unbekannt ist', async () => {
    const result = await seedOneItem()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await act(async () => {
      await result.current.toggleItem('does-not-exist')
    })

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('setzt error und lässt den Artikel unverändert bei einem Server-Fehler (500)', async () => {
    const result = await seedOneItem()
    mockFetchOnce(500)

    await act(async () => {
      await result.current.toggleItem('item-1')
    })

    expect(result.current.error).toBe('Artikel konnte nicht aktualisiert werden')
    expect(result.current.openItems).toHaveLength(1)
  })

  it('setzt error und lässt den Artikel unverändert bei einem Netzwerkfehler', async () => {
    const result = await seedOneItem()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    await act(async () => {
      await result.current.toggleItem('item-1')
    })

    expect(result.current.error).toBe('Artikel konnte nicht aktualisiert werden')
    expect(result.current.openItems).toHaveLength(1)
  })
})

describe('useShoppingListApi — deleteItem (AC4)', () => {
  it('entfernt den Artikel lokal bei Erfolg', async () => {
    const result = await seedOneItem()
    mockFetchOnce(204)

    await act(async () => {
      await result.current.deleteItem('item-1')
    })

    expect(result.current.openItems).toHaveLength(0)
  })

  it('setzt error und behält den Artikel bei einem Server-Fehler (500)', async () => {
    const result = await seedOneItem()
    mockFetchOnce(500)

    await act(async () => {
      await result.current.deleteItem('item-1')
    })

    expect(result.current.error).toBe('Artikel konnte nicht gelöscht werden')
    expect(result.current.openItems).toHaveLength(1)
  })

  it('setzt error und behält den Artikel bei einem Netzwerkfehler', async () => {
    const result = await seedOneItem()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))

    await act(async () => {
      await result.current.deleteItem('item-1')
    })

    expect(result.current.error).toBe('Artikel konnte nicht gelöscht werden')
    expect(result.current.openItems).toHaveLength(1)
  })
})

describe('useShoppingListApi — editItem', () => {
  it('aktualisiert den Artikel lokal mit der Server-Antwort bei Erfolg', async () => {
    const result = await seedOneItem()
    mockFetchOnce(200, { ...ITEM_A, name: 'Vollmilch' })

    await act(async () => {
      await result.current.editItem('item-1', { name: 'Vollmilch', quantity: 1, unit: 'stk', store: 'egal' })
    })

    expect(result.current.openItems[0].name).toBe('Vollmilch')
  })

  it('ruft fetch nicht auf, wenn der Name leer ist', async () => {
    const result = await seedOneItem()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await act(async () => {
      await result.current.editItem('item-1', { name: '  ', quantity: 1, unit: 'stk', store: 'egal' })
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.openItems[0].name).toBe('Milch')
  })

  it('setzt error und lässt den Artikel unverändert bei einem Server-Fehler (500)', async () => {
    const result = await seedOneItem()
    mockFetchOnce(500)

    await act(async () => {
      await result.current.editItem('item-1', { name: 'Vollmilch', quantity: 1, unit: 'stk', store: 'egal' })
    })

    expect(result.current.error).toBe('Artikel konnte nicht bearbeitet werden')
    expect(result.current.openItems[0].name).toBe('Milch')
  })
})
