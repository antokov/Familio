import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { FamilyMember } from '../../types/family'
import styles from './DocumentUploadModal.module.css'

interface DocumentUploadModalProps {
  familyMembers: FamilyMember[]
  onSave: (file: File, familyMemberId: string | null) => Promise<string | null>
  onClose: () => void
}

export function DocumentUploadModal({ familyMembers, onSave, onClose }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [familyMemberId, setFamilyMemberId] = useState<string>('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setApiError(null)
    const err = await onSave(file, familyMemberId || null)
    setUploading(false)
    if (err) {
      setApiError(err)
    } else {
      onClose()
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Dokument hochladen">
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>Dokument hochladen</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="doc-file" className={styles.label}>Datei *</label>
            <input
              id="doc-file"
              ref={fileInputRef}
              type="file"
              className={styles.fileInput}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="doc-member" className={styles.label}>Zuweisen an</label>
            <select
              id="doc-member"
              className={styles.select}
              value={familyMemberId}
              onChange={e => setFamilyMemberId(e.target.value)}
            >
              <option value="">Nicht zugewiesen</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className={styles.saveBtn} disabled={!file || uploading}>
              {uploading ? 'Wird hochgeladen…' : 'Hochladen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
