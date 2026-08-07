import { useState, useEffect } from 'react'

const DESKTOP_BREAKPOINT = 768

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(v => !v)

  return { isOpen, open, close, toggle }
}
