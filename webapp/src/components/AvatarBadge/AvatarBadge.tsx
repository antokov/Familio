import styles from './AvatarBadge.module.css'

interface AvatarBadgeProps {
  initials: string
  color: string
  online?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarBadge({ initials, color, online = false, size = 'md' }: AvatarBadgeProps) {
  return (
    <span className={`${styles.avatar} ${styles[size]}`} style={{ backgroundColor: color }}>
      {initials}
      {online && <span className={styles.dot} />}
    </span>
  )
}
