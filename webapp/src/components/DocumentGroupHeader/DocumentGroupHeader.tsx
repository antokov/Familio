import { AvatarBadge } from '../AvatarBadge/AvatarBadge'
import type { FamilyMember } from '../../types/family'
import styles from './DocumentGroupHeader.module.css'

interface DocumentGroupHeaderProps {
  member: FamilyMember | null
}

export function DocumentGroupHeader({ member }: DocumentGroupHeaderProps) {
  return (
    <div className={styles.header}>
      {member && <AvatarBadge initials={member.initials} color={member.color} size="sm" />}
      <h3 className={styles.label}>{member ? member.name : 'Allgemein'}</h3>
    </div>
  )
}
