import { Sun, Moon } from 'lucide-react'
import styles from './ThemeToggle.module.css'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      className={styles.toggle}
      onClick={onToggle}
      aria-label={theme === 'light' ? 'Dark Mode aktivieren' : 'Light Mode aktivieren'}
      title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
