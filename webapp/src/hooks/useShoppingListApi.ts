import { useState, useCallback, useEffect } from 'react'
import type { ShoppingItem, ShoppingUnit, ShoppingStore, CreateShoppingInput } from '../types/shopping'
import { API_BASE } from '../api/config'

function fromApi(raw: Record<string, unknown>): ShoppingItem {
  return {
    id:        raw['id'] as string,
    name:      raw['name'] as string,
    quantity:  raw['quantity'] as number,
    unit:      raw['unit'] as ShoppingUnit,
    store:     raw['store'] as ShoppingStore,
    checked:   raw['checked'] as boolean,
    checkedAt: (raw['checked_at'] as string | null) ?? undefined,
    createdAt: raw['created_at'] as string,
  }
}

function toApi(input: CreateShoppingInput): Record<string, unknown> {
  return {
    name:     input.name,
    quantity: input.quantity,
    unit:     input.unit,
    store:    input.store,
  }
}

export function useShoppingListApi() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/shopping`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Record<string, unknown>[]
      setItems(data.map(fromApi))
    } catch {
      setError('Artikel konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const addItem = useCallback(async (input: CreateShoppingInput): Promise<void> => {
    const trimmed = input.name.trim()
    if (!trimmed) return
    try {
      const res = await fetch(`${API_BASE}/api/shopping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApi({ ...input, name: trimmed })),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      setItems(prev => [fromApi(raw), ...prev])
    } catch {
      setError('Artikel konnte nicht erstellt werden')
    }
  }, [])

  const toggleItem = useCallback(async (id: string): Promise<void> => {
    const item = items.find(i => i.id === id)
    if (!item) return
    try {
      const res = await fetch(`${API_BASE}/api/shopping/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: !item.checked }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      setItems(prev => prev.map(i => i.id === id ? fromApi(raw) : i))
    } catch {
      setError('Artikel konnte nicht aktualisiert werden')
    }
  }, [items])

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/shopping/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {
      setError('Artikel konnte nicht gelöscht werden')
    }
  }, [])

  const editItem = useCallback(async (id: string, updates: CreateShoppingInput): Promise<void> => {
    const trimmed = updates.name.trim()
    if (!trimmed) return
    try {
      const res = await fetch(`${API_BASE}/api/shopping/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApi({ ...updates, name: trimmed })),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      setItems(prev => prev.map(i => i.id === id ? fromApi(raw) : i))
    } catch {
      setError('Artikel konnte nicht bearbeitet werden')
    }
  }, [])

  const openItems = items
    .filter(i => !i.checked)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const checkedItems = items
    .filter(i => i.checked)
    .sort((a, b) => (b.checkedAt ?? b.createdAt).localeCompare(a.checkedAt ?? a.createdAt))

  return { openItems, checkedItems, loading, error, addItem, toggleItem, deleteItem, editItem }
}
