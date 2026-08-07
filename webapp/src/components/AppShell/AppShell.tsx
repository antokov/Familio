import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '../Sidebar/Sidebar'
import { useTheme } from '../../hooks/useTheme'
import { useSidebar } from '../../hooks/useSidebar'
import { useFamilyMembers } from '../../hooks/useFamilyMembers'
import styles from './AppShell.module.css'

export interface AppShellOutletContext {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/calendar':  'Kalender',
  '/tasks':     'Aufgaben',
  '/shopping':  'Einkauf',
  '/settings':  'Einstellungen',
}

export function AppShell() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { isOpen, open, close } = useSidebar()
  const location = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Familio'
  const { members: familyMembers } = useFamilyMembers()

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.overlay} onClick={close} aria-hidden="true" />}

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <aside className={`${styles.sidebarWrapper} ${isOpen ? styles.drawerOpen : ''}`}>
        <Sidebar theme={theme} onThemeToggle={toggleTheme} onClose={close} familyMembers={familyMembers} />
      </aside>

      {/* Main area */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button
            className={styles.hamburger}
            onClick={open}
            aria-label="Menü öffnen"
          >
            <Menu size={22} />
          </button>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
          <button
            className={`${styles.hamburger} ${styles.closeBtn} ${isOpen ? styles.visible : ''}`}
            onClick={close}
            aria-label="Menü schließen"
          >
            <X size={22} />
          </button>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet context={{ theme, toggleTheme } satisfies AppShellOutletContext} />
        </main>
      </div>
    </div>
  )
}
