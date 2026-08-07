import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './DashboardWidget.module.css'

interface DashboardWidgetProps {
  icon: ReactNode
  title: string
  viewAllTo?: string
  onNew?: () => void
  children: ReactNode
  className?: string
}

export function DashboardWidget({ icon, title, viewAllTo, onNew, children, className }: DashboardWidgetProps) {
  return (
    <section className={`${styles.widget} ${className ?? ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <h3 className={styles.title}>{title}</h3>
        {onNew && (
          <button className={styles.newBtn} onClick={onNew} aria-label={`Neues ${title}`}>
            +
          </button>
        )}
      </div>
      <div className={styles.body}>{children}</div>
      {viewAllTo && (
        <div className={styles.footer}>
          <NavLink to={viewAllTo} className={styles.viewAll}>
            Alle anzeigen →
          </NavLink>
        </div>
      )}
    </section>
  )
}
