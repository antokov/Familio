import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('setzt data-theme Attribut auf html-Element', () => {
    renderHook(() => useTheme())
    expect(document.documentElement.getAttribute('data-theme')).toMatch(/light|dark/)
  })

  it('toggle wechselt zwischen light und dark', () => {
    const { result } = renderHook(() => useTheme())
    const initial = result.current.theme
    act(() => result.current.toggle())
    expect(result.current.theme).toBe(initial === 'light' ? 'dark' : 'light')
  })

  it('speichert Theme im localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(localStorage.getItem('kovacevic-theme')).toBe(result.current.theme)
  })
})
