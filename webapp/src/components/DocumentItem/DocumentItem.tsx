import { useState } from 'react'
import { FileText, Eye, Download, Trash2 } from 'lucide-react'
import type { Document as FamilioDocument } from '../../types/document'
import type { FamilyMember } from '../../types/family'
import styles from './DocumentItem.module.css'

interface DocumentItemProps {
  doc: FamilioDocument
  familyMembers: FamilyMember[]
  downloadUrl: string
  onPreview: (doc: FamilioDocument) => void
  onReassign: (id: string, familyMemberId: string | null) => void
  onDelete: (id: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DocumentItem({ doc, familyMembers, downloadUrl, onPreview, onReassign, onDelete }: DocumentItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDeleteConfirm() {
    onDelete(doc.id)
  }

  return (
    <li className={styles.item}>
      <span className={styles.iconBadge}>
        <FileText size={16} />
      </span>

      <div className={styles.content}>
        <span className={styles.title}>{doc.filename}</span>
        <span className={styles.meta}>{formatSize(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}</span>
      </div>

      <select
        className={styles.assigneeSelect}
        value={doc.familyMemberId ?? ''}
        onChange={e => onReassign(doc.id, e.target.value || null)}
        aria-label={`Zuweisung für ${doc.filename}`}
      >
        <option value="">Nicht zugewiesen</option>
        {familyMembers.map(member => (
          <option key={member.id} value={member.id}>{member.name}</option>
        ))}
      </select>

      {confirmDelete ? (
        <div className={styles.confirmRow}>
          <span className={styles.confirmText}>Löschen?</span>
          <button className={styles.confirmBtn} onClick={handleDeleteConfirm}>Ja</button>
          <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Nein</button>
        </div>
      ) : (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onPreview(doc)}
            aria-label={`${doc.filename} ansehen`}
          >
            <Eye size={15} />
          </button>
          <a
            className={styles.actionBtn}
            href={downloadUrl}
            aria-label={`${doc.filename} herunterladen`}
          >
            <Download size={15} />
          </a>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => setConfirmDelete(true)}
            aria-label={`${doc.filename} löschen`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </li>
  )
}
