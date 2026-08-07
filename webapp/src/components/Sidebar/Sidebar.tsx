import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, CheckSquare, ShoppingCart, Settings } from 'lucide-react'
import { AvatarBadge } from '../AvatarBadge/AvatarBadge'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'
import type { FamilyMember } from '../../types/family'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { path: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calendar', label: 'Kalender',  icon: Calendar },
  { path: '/tasks',    label: 'Aufgaben',  icon: CheckSquare },
  { path: '/shopping', label: 'Einkauf',   icon: ShoppingCart },
]

interface SidebarProps {
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onClose?: () => void
  familyMembers?: FamilyMember[]
}

export function Sidebar({ theme, onThemeToggle, onClose, familyMembers = [] }: SidebarProps) {

  return (
    <nav className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoMark}>F</span>
        <span className={styles.logoText}>FAMILIO</span>
      </div>

      {/* Navigation */}
      <ul className={styles.nav}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
              onClick={onClose}
            >
              <Icon size={18} className={styles.navIcon} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles.divider} />

      {/* Familienmitglieder */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Familie</span>
        <ul className={styles.familyList}>
          {familyMembers.map(member => (
            <li key={member.id} className={styles.familyItem} title={member.name}>
              <AvatarBadge
                initials={member.initials}
                color={member.color}
                online={member.online}
                size="sm"
              />
              <span className={styles.familyName}>{member.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.spacer} />

      {/* Footer */}
      <div className={styles.footer}>
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${styles.settingsBtn} ${isActive ? styles.settingsBtnActive : ''}`
          }
          title="Einstellungen"
          aria-label="Einstellungen"
          onClick={onClose}
        >
          <Settings size={18} />
        </NavLink>
      </div>
    </nav>
  )
}
