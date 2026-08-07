import { useState, useEffect } from 'react'
import type { ShoppingItem, CreateShoppingInput } from '../types/shopping'

const STORAGE_KEY = 'kovacevic-shopping'

function loadItems(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ShoppingItem[]
  } catch {
    return []
  }
}

function generateId(): string {
  return `shopping-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>(loadItems)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // localStorage not available
    }
  }, [items])

  function addItem(input: CreateShoppingInput): void {
    const trimmed = input.name.trim()
    if (!trimmed) return
    const item: ShoppingItem = {
      id:        generateId(),
      name:      trimmed,
      quantity:  input.quantity,
      unit:      input.unit,
      store:     input.store,
      checked:   false,
      createdAt: new Date().toISOString(),
    }
    setItems(prev => [item, ...prev])
  }

  function toggleItem(id: string): void {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      if (item.checked) {
        return { ...item, checked: false, checkedAt: undefined }
      }
      return { ...item, checked: true, checkedAt: new Date().toISOString() }
    }))
  }

  function deleteItem(id: string): void {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function editItem(id: string, updates: CreateShoppingInput): void {
    const trimmed = updates.name.trim()
    if (!trimmed) return
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      return {
        ...item,
        name:     trimmed,
        quantity: updates.quantity,
        unit:     updates.unit,
        store:    updates.store,
      }
    }))
  }

  const openItems = items
    .filter(i => !i.checked)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const checkedItems = items
    .filter(i => i.checked)
    .sort((a, b) => (b.checkedAt ?? b.createdAt).localeCompare(a.checkedAt ?? a.createdAt))

  return { items, openItems, checkedItems, addItem, toggleItem, deleteItem, editItem }
}
