import { useEffect, useRef, useState } from 'react'
import { FileText, Eye, Download, Trash2, CalendarPlus, Loader2, Pencil, Check, X } from 'lucide-react'
import type { Document as FamilioDocument } from '../../types/document'
import { isExtractable } from '../../types/document'
import type { FamilyMember } from '../../types/family'
import styles from './DocumentItem.module.css'

interface DocumentItemProps {
  doc: FamilioDocument
  familyMembers: FamilyMember[]
  downloadUrl: string
  extracting: boolean
  onPreview: (doc: FamilioDocument) => void
  onReassign: (id: string, familyMemberId: string | null) => void
  onRename: (id: string, filename: string) => Promise<boolean>
  onDelete: (id: string) => void
  onExtractEvents: (doc: FamilioDocument) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DocumentItem({
  doc,
  familyMembers,
  downloadUrl,
  extracting,
  onPreview,
  onReassign,
  onRename,
  onDelete,
  onExtractEvents,
}: DocumentItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(doc.filename)
  const [renameSaving, setRenameSaving] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [renaming])

  function handleDeleteConfirm() {
    onDelete(doc.id)
  }

  function handleRenameStart() {
    setRenameValue(doc.filename)
    setRenameError(null)
    setRenaming(true)
  }

  function handleRenameCancel() {
    setRenaming(false)
    setRenameError(null)
  }

  async function handleRenameConfirm() {
    const trimmed = renameValue.trim()
    if (!trimmed) {
      setRenameError('Name darf nicht leer sein.')
      return
    }
    setRenameSaving(true)
    setRenameError(null)
    const ok = await onRename(doc.id, trimmed)
    setRenameSaving(false)
    if (ok) {
      setRenaming(false)
    } else {
      setRenameError('Umbenennen fehlgeschlagen. Bitte erneut versuchen.')
    }
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleRenameConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleRenameCancel()
    }
  }

  return (
    <li className={styles.item}>
      <span className={styles.iconBadge}>
        <FileText size={16} />
      </span>

      <div className={styles.content}>
        {renaming ? (
          <input
            ref={renameInputRef}
            type="text"
            className={styles.renameInput}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            disabled={renameSaving}
            maxLength={255}
            aria-label={`Neuer Name für ${doc.filename}`}
          />
        ) : (
          <span className={styles.title}>{doc.filename}</span>
        )}
        <span className={styles.meta}>{formatSize(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}</span>
        {renameError && <span className={styles.renameError}>{renameError}</span>}
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
      ) : renaming ? (
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.renameConfirmBtn}`}
            onClick={() => void handleRenameConfirm()}
            disabled={renameSaving}
            aria-label="Umbenennen bestätigen"
          >
            <Check size={15} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleRenameCancel}
            disabled={renameSaving}
            aria-label="Umbenennen abbrechen"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className={styles.actions}>
          {isExtractable(doc.contentType) && (
            <button
              className={styles.actionBtn}
              onClick={() => onExtractEvents(doc)}
              disabled={extracting}
              aria-label={`Termine aus ${doc.filename} extrahieren`}
              title="Termine extrahieren"
            >
              {extracting ? <Loader2 size={15} className={styles.spin} /> : <CalendarPlus size={15} />}
            </button>
          )}
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
            className={styles.actionBtn}
            onClick={handleRenameStart}
            aria-label={`${doc.filename} umbenennen`}
          >
            <Pencil size={15} />
          </button>
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
