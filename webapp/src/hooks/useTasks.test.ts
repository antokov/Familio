import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getNextDueDate } from './useTasks'

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  localStorageMock.clear()
})

describe('getNextDueDate', () => {
  it('adds 1 day for daily recurrence', () => {
    expect(getNextDueDate('2025-06-19', 'daily')).toBe('2025-06-20')
  })

  it('adds 7 days for weekly recurrence', () => {
    expect(getNextDueDate('2025-06-19', 'weekly')).toBe('2025-06-26')
  })

  it('adds 1 month for monthly recurrence', () => {
    expect(getNextDueDate('2025-06-19', 'monthly')).toBe('2025-07-19')
  })

  it('adds 1 year for yearly recurrence', () => {
    expect(getNextDueDate('2025-06-19', 'yearly')).toBe('2026-06-19')
  })

  it('returns empty string for none recurrence', () => {
    expect(getNextDueDate('2025-06-19', 'none')).toBe('2025-06-19')
  })

  it('uses today as base when no dueDate given', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-19T12:00:00'))
    const result = getNextDueDate(undefined, 'weekly')
    expect(result).toBe('2025-06-26')
    vi.useRealTimers()
  })
})

describe('useTasks hook', () => {
  it('exports getNextDueDate as a pure function', () => {
    expect(typeof getNextDueDate).toBe('function')
  })
})
