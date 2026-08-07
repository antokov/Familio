import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useShoppingList } from './useShoppingList'
import type { CreateShoppingInput } from '../types/shopping'

const DEFAULT_INPUT: CreateShoppingInput = {
  name:     'Milch',
  quantity: 2,
  unit:     'stk',
  store:    'migros',
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('useShoppingList — addItem', () => {
  it('fügt einen neuen Artikel hinzu', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem(DEFAULT_INPUT) })
    expect(result.current.openItems).toHaveLength(1)
    expect(result.current.openItems[0].name).toBe('Milch')
    expect(result.current.openItems[0].quantity).toBe(2)
    expect(result.current.openItems[0].unit).toBe('stk')
    expect(result.current.openItems[0].store).toBe('migros')
    expect(result.current.openItems[0].checked).toBe(false)
  })

  it('trimmt den Produktnamen', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem({ ...DEFAULT_INPUT, name: '  Brot  ' }) })
    expect(result.current.openItems[0].name).toBe('Brot')
  })

  it('ignoriert leere Namen', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem({ ...DEFAULT_INPUT, name: '   ' }) })
    expect(result.current.openItems).toHaveLength(0)
  })

  it('neuester Artikel erscheint zuerst (DESC)', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem({ ...DEFAULT_INPUT, name: 'Milch' }) })
    act(() => { result.current.addItem({ ...DEFAULT_INPUT, name: 'Brot' }) })
    expect(result.current.openItems[0].name).toBe('Brot')
  })

  it('persistiert in localStorage', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem(DEFAULT_INPUT) })
    const stored = JSON.parse(localStorage.getItem('kovacevic-shopping') ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Milch')
  })
})

describe('useShoppingList — toggleItem', () => {
  it('setzt checked=true und checkedAt beim ersten Klick', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem(DEFAULT_INPUT) })
    const id = result.current.openItems[0].id
    act(() => { result.current.toggleItem(id) })
    expect(result.current.openItems).toHaveLength(0)
    expect(result.current.checkedItems).toHaveLength(1)
    expect(result.current.checkedItems[0].checked).toBe(true)
    expect(result.current.checkedItems[0].checkedAt).toBeDefined()
  })

  it('setzt checked=false und checkedAt=undefined beim zweiten Klick (bidirektional)', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem(DEFAULT_INPUT) })
    const id = result.current.openItems[0].id
    act(() => { result.current.toggleItem(id) })
    act(() => { result.current.toggleItem(id) })
    expect(result.current.openItems).toHaveLength(1)
    expect(result.current.checkedItems).toHaveLength(0)
    expect(result.current.openItems[0].checked).toBe(false)
    expect(result.current.openItems[0].checkedAt).toBeUndefined()
  })

  it('sortiert checked Items nach checkedAt DESC', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem({ ...DEFAULT_INPUT, name: 'A' }) })
    act(() => { result.current.addItem({ ...DEFAULT_INPUT, name: 'B' }) })
    const idA = result.current.openItems.find(i => i.name === 'A')!.id
    const idB = result.current.openItems.find(i => i.name === 'B')!.id
    act(() => { result.current.toggleItem(idA) })
    act(() => { result.current.toggleItem(idB) })
    expect(result.current.checkedItems[0].name).toBe('B')
  })
})

describe('useShoppingList — deleteItem', () => {
  it('entfernt den Artikel aus der Liste', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem(DEFAULT_INPUT) })
    const id = result.current.openItems[0].id
    act(() => { result.current.deleteItem(id) })
    expect(result.current.openItems).toHaveLength(0)
    expect(result.current.items).toHaveLength(0)
  })

  it('lässt andere Artikel unberührt', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem({ ...DEFAULT_INPUT, name: 'A' }) })
    act(() => { result.current.addItem({ ...DEFAULT_INPUT, name: 'B' }) })
    const idA = result.current.openItems.find(i => i.name === 'A')!.id
    act(() => { result.current.deleteItem(idA) })
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].name).toBe('B')
  })
})

describe('useShoppingList — editItem', () => {
  it('aktualisiert Felder des Artikels', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem(DEFAULT_INPUT) })
    const id = result.current.openItems[0].id
    act(() => {
      result.current.editItem(id, { name: 'Käse', quantity: 500, unit: 'g', store: 'coop' })
    })
    const updated = result.current.openItems[0]
    expect(updated.name).toBe('Käse')
    expect(updated.quantity).toBe(500)
    expect(updated.unit).toBe('g')
    expect(updated.store).toBe('coop')
  })

  it('ändert checked-Status nicht', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem(DEFAULT_INPUT) })
    const id = result.current.openItems[0].id
    act(() => { result.current.toggleItem(id) })
    act(() => { result.current.editItem(id, { name: 'Käse', quantity: 1, unit: 'stk', store: 'egal' }) })
    expect(result.current.checkedItems[0].checked).toBe(true)
  })

  it('ignoriert leere Namen beim Bearbeiten', () => {
    const { result } = renderHook(() => useShoppingList())
    act(() => { result.current.addItem(DEFAULT_INPUT) })
    const id = result.current.openItems[0].id
    act(() => { result.current.editItem(id, { name: '  ', quantity: 1, unit: 'stk', store: 'egal' }) })
    expect(result.current.openItems[0].name).toBe('Milch')
  })
})

describe('useShoppingList — localStorage Persistenz', () => {
  it('lädt bestehende Daten beim Mount', () => {
    const item = {
      id: 'shopping-1', name: 'Äpfel', quantity: 6, unit: 'stk', store: 'egal',
      checked: false, createdAt: new Date().toISOString()
    }
    localStorage.setItem('kovacevic-shopping', JSON.stringify([item]))
    const { result } = renderHook(() => useShoppingList())
    expect(result.current.openItems).toHaveLength(1)
    expect(result.current.openItems[0].name).toBe('Äpfel')
  })

  it('gibt leeres Array zurück bei korruptem localStorage', () => {
    localStorage.setItem('kovacevic-shopping', 'INVALID_JSON')
    const { result } = renderHook(() => useShoppingList())
    expect(result.current.items).toHaveLength(0)
  })
})
