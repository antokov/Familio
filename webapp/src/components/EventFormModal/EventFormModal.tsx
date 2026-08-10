import { useState, useEffect, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'
import { AvatarBadge } from '../AvatarBadge/AvatarBadge'
import type { CalendarEvent, CreateEventInput, Attendee } from '../../types/event'
import type { FamilyMember } from '../../types/family'
import styles from './EventFormModal.module.css'

interface EventFormModalProps {
  editEvent?: CalendarEvent
  familyMembers: FamilyMember[]
  initialDate?: string
  initialTime?: string
  onSave: (input: CreateEventInput) => Promise<boolean>
  onDelete?: (id: string) => Promise<boolean>
  onClose: () => void
}

export function extractDate(isoStr: string): string {
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function extractTime(isoStr: string): string {
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function EventFormModal({ editEvent, familyMembers, initialDate, initialTime, onSave, onDelete, onClose }: EventFormModalProps) {
  const today = new Date().toISOString().slice(0, 10)
  const isEdit = !!editEvent

  const [title, setTitle] = useState(editEvent?.title ?? '')
  const [date, setDate] = useState(
    editEvent ? extractDate(editEvent.startDt) : (initialDate ?? today)
  )
  const [endDate, setEndDate] = useState(
    editEvent ? extractDate(editEvent.endDt) : (initialDate ?? today)
  )
  const [startTime, setStartTime] = useState(
    editEvent ? extractTime(editEvent.startDt) : (initialTime ?? '09:00')
  )
  const [endTime, setEndTime] = useState(() => {
    if (editEvent) return extractTime(editEvent.endDt)
    const [h, m] = (initialTime ?? '09:00').split(':').map(Number)
    return h + 1 < 24 ? `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}` : '23:59'
  })
  const [description, setDescription] = useState(editEvent?.description ?? '')
  const [attendees, setAttendees] = useState<Attendee[]>(editEvent?.attendees ?? [])
  const [allDay, setAllDay] = useState(editEvent?.allDay ?? false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  async function handleDeleteConfirm() {
    if (!editEvent || !onDelete) return
    setDeleting(true)
    setDeleteError(false)
    const ok = await onDelete(editEvent.id)
    if (ok) {
      onClose()
    } else {
      setDeleting(false)
      setDeleteError(true)
    }
  }

  function toggleAttendee(initials: string, color: string) {
    setAttendees(prev =>
      prev.some(a => a.initials === initials)
        ? prev.filter(a => a.initials !== initials)
        : [...prev, { initials, color }]
    )
  }

  function isTimeValid(): boolean {
    return startTime < endTime
  }

  function isDateRangeValid(): boolean {
    return endDate >= date
  }

  function handleDateChange(value: string) {
    setDate(value)
    if (allDay && endDate < value) setEndDate(value)
  }

  function handleAllDayChange(checked: boolean) {
    setAllDay(checked)
    if (checked && endDate < date) setEndDate(date)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || (allDay ? !isDateRangeValid() : !isTimeValid())) return

    setSaving(true)
    setSaveError(false)
    const ok = await onSave({
      title: trimmed,
      description: description.trim() || undefined,
      startDt: allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`,
      endDt: allDay ? `${endDate}T23:59:00` : `${date}T${endTime}:00`,
      attendees,
      allDay,
    })
    setSaving(false)
    if (ok) {
      onClose()
    } else {
      setSaveError(true)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const isValid = title.trim().length > 0 && (allDay ? isDateRangeValid() : isTimeValid())
  const modalLabel = isEdit ? 'Termin bearbeiten' : 'Neuer Termin'

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={modalLabel}>
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>{modalLabel}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="event-title" className={styles.label}>Titel *</label>
            <input
              id="event-title"
              ref={titleRef}
              type="text"
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Was findet statt?"
              maxLength={100}
              required
            />
          </div>

          {allDay ? (
            <div className={`${styles.field} ${styles.dateRow}`}>
              <div>
                <label htmlFor="event-date" className={styles.label}>Von</label>
                <input
                  id="event-date"
                  type="date"
                  className={styles.input}
                  value={date}
                  onChange={e => handleDateChange(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="event-date-end" className={styles.label}>Bis</label>
                <input
                  id="event-date-end"
                  type="date"
                  className={`${styles.input} ${!isDateRangeValid() ? styles.inputError : ''}`}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
                {!isDateRangeValid() && (
                  <span className={styles.timeErrorMsg}>Enddatum muss am oder nach dem Startdatum liegen</span>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.field}>
              <label htmlFor="event-date" className={styles.label}>Datum</label>
              <input
                id="event-date"
                type="date"
                className={styles.input}
                value={date}
                onChange={e => handleDateChange(e.target.value)}
              />
            </div>
          )}

          <div className={`${styles.field} ${styles.checkboxRow}`}>
            <input
              id="event-allday"
              type="checkbox"
              className={styles.checkbox}
              checked={allDay}
              onChange={e => handleAllDayChange(e.target.checked)}
            />
            <label htmlFor="event-allday" className={styles.checkboxLabel}>Ganztägig</label>
          </div>

          {!allDay && (
            <div className={`${styles.field} ${styles.timeRow}`}>
              <div>
                <label htmlFor="event-start" className={styles.label}>Von</label>
                <input
                  id="event-start"
                  type="time"
                  className={styles.input}
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="event-end" className={styles.label}>Bis</label>
                <input
                  id="event-end"
                  type="time"
                  className={`${styles.input} ${!isTimeValid() ? styles.inputError : ''}`}
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
                {!isTimeValid() && (
                  <span className={styles.timeErrorMsg}>Endzeit muss nach Startzeit liegen</span>
                )}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <span className={styles.label}>Teilnehmer</span>
            <div className={styles.attendeePicker}>
              {familyMembers.map(m => (
                <button
                  key={m.initials}
                  type="button"
                  className={`${styles.attendeeBtn} ${attendees.some(a => a.initials === m.initials) ? styles.attendeeSelected : ''}`}
                  onClick={() => toggleAttendee(m.initials, m.color)}
                  aria-label={m.name}
                  aria-pressed={attendees.some(a => a.initials === m.initials)}
                  title={m.name}
                >
                  <AvatarBadge initials={m.initials} color={m.color} size="md" />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="event-desc" className={styles.label}>Beschreibung</label>
            <textarea
              id="event-desc"
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optionale Notiz…"
              maxLength={500}
              rows={3}
            />
          </div>

          {saveError && (
            <p className={styles.saveError}>Speichern fehlgeschlagen. Bitte erneut versuchen.</p>
          )}
          {deleteError && (
            <p className={styles.saveError}>Löschen fehlgeschlagen. Bitte erneut versuchen.</p>
          )}

          <div className={styles.actions}>
            {isEdit && onDelete && (
              confirmDelete ? (
                <div className={styles.deleteConfirmRow}>
                  <span className={styles.deleteConfirmText}>Termin löschen?</span>
                  <button
                    type="button"
                    className={styles.deleteConfirmBtn}
                    onClick={() => void handleDeleteConfirm()}
                    disabled={deleting}
                  >
                    Ja, löschen
                  </button>
                  <button
                    type="button"
                    className={styles.deleteConfirmCancelBtn}
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    aria-label="Löschen abbrechen"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.deleteTriggerBtn}
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Termin löschen"
                >
                  <Trash2 size={16} />
                </button>
              )
            )}
            <div className={styles.primaryActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Abbrechen
              </button>
              <button type="submit" className={styles.saveBtn} disabled={!isValid || saving}>
                {saving ? 'Speichert…' : isEdit ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
