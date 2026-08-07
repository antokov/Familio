import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useSidebar } from './useSidebar'

const originalInnerWidth = window.innerWidth

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalInnerWidth,
  })
})

describe('useSidebar — Initialzustand', () => {
  it('isOpen startet als false', () => {
    const { result } = renderHook(() => useSidebar())
    expect(result.current.isOpen).toBe(false)
  })
})

describe('useSidebar — open / close / toggle', () => {
  it('open() setzt isOpen auf true', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
  })

  it('close() setzt isOpen auf false', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.open())
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })

  it('open() wenn bereits offen → bleibt true', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.open())
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
  })

  it('close() wenn bereits geschlossen → bleibt false', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })

  it('toggle() wechselt false → true', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(true)
  })

  it('toggle() wechselt true → false', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.open())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(false)
  })

  it('toggle() mehrfach hintereinander alteriert korrekt', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.toggle()) // → true
    act(() => result.current.toggle()) // → false
    act(() => result.current.toggle()) // → true
    expect(result.current.isOpen).toBe(true)
  })
})

describe('useSidebar — Resize-Handler', () => {
  it('schließt Sidebar bei innerWidth >= 768 (Desktop)', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.open())
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('lässt Sidebar offen bei innerWidth < 768 (Mobile)', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.open())
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 767 })
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.isOpen).toBe(true)
  })

  it('schließt Sidebar bei innerWidth exakt 768 (Boundary)', () => {
    const { result } = renderHook(() => useSidebar())
    act(() => result.current.open())
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('Resize-Event wenn bereits geschlossen → kein Fehler, bleibt false', () => {
    const { result } = renderHook(() => useSidebar())
    expect(() => {
      act(() => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
        window.dispatchEvent(new Event('resize'))
      })
    }).not.toThrow()
    expect(result.current.isOpen).toBe(false)
  })
})

describe('useSidebar — Cleanup', () => {
  it('entfernt resize-Listener beim Unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useSidebar())
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeSpy.mockRestore()
  })
})
