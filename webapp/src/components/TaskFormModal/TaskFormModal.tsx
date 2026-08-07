import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { AvatarBadge } from '../AvatarBadge/AvatarBadge'
import type { Task, CreateTaskInput, RecurrenceType } from '../../types/task'
import type { FamilyMember } from '../../types/family'
import styles from './TaskFormModal.module.css'

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none:    'Keine Wiederholung',
  daily:   'Täglich',
  weekly:  'Wöchentlich',
  monthly: 'Monatlich',
  yearly:  'Jährlich',
}

interface TaskFormModalProps {
  editTask?: Task
  familyMembers: FamilyMember[]
  onSave: (input: CreateTaskInput) => void
  onClose: () => void
}

export function TaskFormModal({ editTask, familyMembers, onSave, onClose }: TaskFormModalProps) {
  const [title, setTitle] = useState(editTask?.title ?? '')
  const [dueDate, setDueDate] = useState(editTask?.dueDate ?? '')
  const [assigneeInitials, setAssigneeInitials] = useState(editTask?.assigneeInitials ?? '')
  const [assigneeColor, setAssigneeColor] = useState(editTask?.assigneeColor ?? '')
  const [recurrence, setRecurrence] = useState<RecurrenceType>(editTask?.recurrence ?? 'none')

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function handleAssigneeClick(initials: string, color: string) {
    if (assigneeInitials === initials) {
      setAssigneeInitials('')
      setAssigneeColor('')
    } else {
      setAssigneeInitials(initials)
      setAssigneeColor(color)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSave({
      title: trimmed,
      dueDate: dueDate || undefined,
      assigneeInitials: assigneeInitials || undefined,
      assigneeColor: assigneeColor || undefined,
      recurrence,
    })
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const isValid = title.trim().length > 0

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}>
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>{editTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="task-title" className={styles.label}>Titel *</label>
            <input
              id="task-title"
              ref={titleRef}
              type="text"
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Was muss erledigt werden?"
              maxLength={100}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="task-due" className={styles.label}>Fälligkeitsdatum</label>
            <input
              id="task-due"
              type="date"
              className={styles.input}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Zuständig</span>
            <div className={styles.assigneePicker}>
              {familyMembers.map(m => (
                <button
                  key={m.initials}
                  type="button"
                  className={`${styles.assigneeBtn} ${assigneeInitials === m.initials ? styles.assigneeSelected : ''}`}
                  onClick={() => handleAssigneeClick(m.initials, m.color)}
                  aria-label={m.name}
                  title={m.name}
                >
                  <AvatarBadge initials={m.initials} color={m.color} size="md" />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="task-recurrence" className={styles.label}>Wiederholung</label>
            <select
              id="task-recurrence"
              className={styles.select}
              value={recurrence}
              onChange={e => setRecurrence(e.target.value as RecurrenceType)}
            >
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map(key => (
                <option key={key} value={key}>{RECURRENCE_LABELS[key]}</option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className={styles.saveBtn} disabled={!isValid}>
              {editTask ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
