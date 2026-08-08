import { useState } from 'react'
import { X } from 'lucide-react'
import { extractDate, extractTime } from '../EventFormModal/EventFormModal'
import type { ExtractedEventCandidate } from '../../types/document'
import type { CreateEventInput } from '../../types/event'
import styles from './ExtractEventsModal.module.css'

interface ExtractEventsModalProps {
  filename: string
  candidates: ExtractedEventCandidate[]
  createEvent: (input: CreateEventInput) => Promise<boolean>
  onDone: (createdCount: number) => void
  onClose: () => void
}

interface CandidateRow {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  selected: boolean
}

function toRow(candidate: ExtractedEventCandidate): CandidateRow {
  return {
    id: candidate.id,
    title: candidate.title,
    date: extractDate(candidate.startDt),
    startTime: extractTime(candidate.startDt),
    endTime: extractTime(candidate.endDt),
    selected: true,
  }
}

function isRowValid(row: CandidateRow): boolean {
  return row.title.trim().length > 0 && row.startTime < row.endTime
}

export function ExtractEventsModal({ filename, candidates, createEvent, onDone, onClose }: ExtractEventsModalProps) {
  const [rows, setRows] = useState<CandidateRow[]>(candidates.map(toRow))
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  const selectedRows = rows.filter(r => r.selected)
  const selectedCount = selectedRows.length
  const allSelectedValid = selectedRows.every(isRowValid)

  function updateRow(id: string, patch: Partial<CandidateRow>) {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !saving) onClose()
  }

  async function handleConfirm() {
    const toCreate = rows.filter(r => r.selected && isRowValid(r))
    setSaving(true)
    setProgress({ current: 0, total: toCreate.length })
    let created = 0
    for (const row of toCreate) {
      const ok = await createEvent({
        title: row.title.trim(),
        startDt: `${row.date}T${row.startTime}:00`,
        endDt: `${row.date}T${row.endTime}:00`,
        attendees: [],
      })
      if (ok) created += 1
      setProgress(prev => (prev ? { ...prev, current: prev.current + 1 } : prev))
    }
    setSaving(false)
    onDone(created)
    onClose()
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Termine aus „${filename}“`}>
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>Termine aus „{filename}“</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen" disabled={saving}>
            <X size={18} />
          </button>
        </div>

        {rows.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Keine Termine im Dokument gefunden.</p>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Schließen</button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.body}>
              {rows.map(row => (
                <div key={row.id} className={`${styles.row} ${!row.selected ? styles.rowDeselected : ''}`}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={row.selected}
                    onChange={e => updateRow(row.id, { selected: e.target.checked })}
                    aria-label={`${row.title} übernehmen`}
                    disabled={saving}
                  />
                  <div className={styles.rowFields}>
                    <input
                      type="text"
                      className={styles.titleInput}
                      value={row.title}
                      onChange={e => updateRow(row.id, { title: e.target.value })}
                      maxLength={100}
                      disabled={saving}
                      aria-label="Titel"
                    />
                    <div className={styles.dateTimeRow}>
                      <input
                        type="date"
                        className={styles.input}
                        value={row.date}
                        onChange={e => updateRow(row.id, { date: e.target.value })}
                        disabled={saving}
                        aria-label="Datum"
                      />
                      <input
                        type="time"
                        className={styles.input}
                        value={row.startTime}
                        onChange={e => updateRow(row.id, { startTime: e.target.value })}
                        disabled={saving}
                        aria-label="Startzeit"
                      />
                      <input
                        type="time"
                        className={`${styles.input} ${row.selected && !isRowValid(row) ? styles.inputError : ''}`}
                        value={row.endTime}
                        onChange={e => updateRow(row.id, { endTime: e.target.value })}
                        disabled={saving}
                        aria-label="Endzeit"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <span className={styles.selectionCount}>
                {selectedCount} von {rows.length} ausgewählt
              </span>
              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>
                  Abbrechen
                </button>
                <button
                  className={styles.saveBtn}
                  onClick={() => void handleConfirm()}
                  disabled={selectedCount === 0 || !allSelectedValid || saving}
                >
                  {saving && progress
                    ? `Übernehme … (${progress.current}/${progress.total})`
                    : 'Termine übernehmen'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
