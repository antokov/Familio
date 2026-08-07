import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { AvatarBadge } from '../AvatarBadge/AvatarBadge'
import type { FamilyMember, CreateFamilyMemberInput } from '../../types/family'
import styles from './FamilyMemberFormModal.module.css'

const COLOR_OPTIONS = [
  '#5B6AF0', '#F0805B', '#4CAF82', '#F0C75B',
  '#E07A54', '#60B888', '#7A7F9A', '#D4623A',
  '#2E6B4A', '#C8962A',
]

interface FamilyMemberFormModalProps {
  editMember?: FamilyMember
  onSave: (input: CreateFamilyMemberInput) => Promise<string | null>
  onClose: () => void
}

export function FamilyMemberFormModal({ editMember, onSave, onClose }: FamilyMemberFormModalProps) {
  const [name, setName] = useState(editMember?.name ?? '')
  const [initials, setInitials] = useState(editMember?.initials ?? '')
  const [color, setColor] = useState(editMember?.color ?? COLOR_OPTIONS[0])
  const [apiError, setApiError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedInitials = initials.trim().toUpperCase()
    if (!trimmedName || !trimmedInitials) return
    setSaving(true)
    setApiError(null)
    const err = await onSave({ name: trimmedName, initials: trimmedInitials, color })
    setSaving(false)
    if (err) {
      setApiError(err)
    } else {
      onClose()
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const isValid = name.trim().length > 0 && initials.trim().length > 0

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={editMember ? 'Mitglied bearbeiten' : 'Neues Mitglied'}
      >
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>
            {editMember ? 'Mitglied bearbeiten' : 'Neues Mitglied'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="member-name" className={styles.label}>Name *</label>
            <input
              id="member-name"
              ref={nameRef}
              type="text"
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Vorname"
              maxLength={50}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="member-initials" className={styles.label}>Initialen * (max. 2)</label>
            <input
              id="member-initials"
              type="text"
              className={`${styles.input} ${styles.initialsInput}`}
              value={initials}
              onChange={e => setInitials(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="AK"
              maxLength={2}
              required
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Farbe *</span>
            <div className={styles.swatchGrid}>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.swatch} ${color === c ? styles.swatchActive : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Farbe ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
            <div className={styles.preview}>
              <AvatarBadge
                initials={initials || '?'}
                color={color}
                size="md"
              />
              <span className={styles.previewName}>{name || 'Vorschau'}</span>
            </div>
          </div>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className={styles.saveBtn} disabled={!isValid || saving}>
              {saving ? 'Speichern…' : editMember ? 'Speichern' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
