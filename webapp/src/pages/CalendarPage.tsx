import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { MonthView } from '../components/MonthView/MonthView'
import { WeekView } from '../components/WeekView/WeekView'
import { EventFormModal } from '../components/EventFormModal/EventFormModal'
import { useEvents } from '../hooks/useEvents'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import type { CalendarEvent, CreateEventInput } from '../types/event'
import styles from './CalendarPage.module.css'

type ViewType = 'month' | 'week'

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  d.setHours(0, 0, 0, 0)
  return d
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const now = new Date()
  const today = toLocalDateStr(now)

  const [view, setView] = useState<ViewType>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(now)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [modalDate, setModalDate] = useState<string | undefined>()
  const [modalTime, setModalTime] = useState<string | undefined>()

  const { events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent } = useEvents()
  const { members: familyMembers } = useFamilyMembers()

  const loadForCurrentView = useCallback(() => {
    if (view === 'month') {
      const from = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
      const to = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      fetchEvents(from, to)
    } else {
      const ws = getWeekStart(selectedDate)
      const we = new Date(ws)
      we.setDate(ws.getDate() + 6)
      fetchEvents(toLocalDateStr(ws), toLocalDateStr(we))
    }
  }, [view, selectedDate, fetchEvents])

  useEffect(() => {
    loadForCurrentView()
  }, [loadForCurrentView])

  function navigate(delta: number) {
    setSelectedDate(prev => {
      const d = new Date(prev)
      if (view === 'month') {
        d.setMonth(d.getMonth() + delta)
      } else {
        d.setDate(d.getDate() + delta * 7)
      }
      return d
    })
  }

  function openNewModal(date?: string, time?: string) {
    setEditingEvent(null)
    setModalDate(date)
    setModalTime(time)
    setShowModal(true)
  }

  function openEditModal(event: CalendarEvent) {
    setEditingEvent(event)
    setModalDate(undefined)
    setModalTime(undefined)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingEvent(null)
  }

  async function handleSave(input: CreateEventInput): Promise<boolean> {
    if (editingEvent) {
      const ok = await updateEvent(editingEvent.id, input)
      if (ok) loadForCurrentView()
      return ok
    }
    const ok = await createEvent(input)
    if (ok) loadForCurrentView()
    return ok
  }

  async function handleDelete(id: string): Promise<boolean> {
    const ok = await deleteEvent(id)
    if (ok) loadForCurrentView()
    return ok
  }

  function headerTitle(): string {
    if (view === 'month') {
      return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
    }
    const ws = getWeekStart(selectedDate)
    const we = new Date(ws)
    we.setDate(ws.getDate() + 6)
    if (ws.getMonth() === we.getMonth()) {
      return `${ws.getDate()}. – ${we.getDate()}. ${MONTH_NAMES[ws.getMonth()]} ${ws.getFullYear()}`
    }
    return `${ws.getDate()}. ${MONTH_NAMES[ws.getMonth()]} – ${we.getDate()}. ${MONTH_NAMES[we.getMonth()]} ${we.getFullYear()}`
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.navGroup}>
          <button className={styles.navBtn} onClick={() => navigate(-1)} aria-label="Zurück">
            <ChevronLeft size={18} />
          </button>
          <button className={styles.navBtn} onClick={() => navigate(1)} aria-label="Weiter">
            <ChevronRight size={18} />
          </button>
          <h2 className={styles.title}>{headerTitle()}</h2>
        </div>
        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${view === 'month' ? styles.toggleActive : ''}`}
              onClick={() => setView('month')}
            >
              Monat
            </button>
            <button
              className={`${styles.toggleBtn} ${view === 'week' ? styles.toggleActive : ''}`}
              onClick={() => setView('week')}
            >
              Woche
            </button>
          </div>
          <button
            className={styles.newBtn}
            onClick={() => openNewModal()}
            disabled={!!error}
          >
            <Plus size={16} />
            Neu
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Lädt…</div>}

      {!loading && !error && view === 'month' && (
        <MonthView
          year={selectedDate.getFullYear()}
          month={selectedDate.getMonth()}
          events={events}
          today={today}
          onDayClick={date => openNewModal(date)}
          onEventClick={openEditModal}
        />
      )}

      {!loading && !error && view === 'week' && (
        <div className={styles.weekWrapper}>
          <WeekView
            weekStart={getWeekStart(selectedDate)}
            events={events}
            today={today}
            onSlotClick={(date, time) => openNewModal(date, time)}
            onEventClick={openEditModal}
          />
        </div>
      )}

      {showModal && (
        <EventFormModal
          editEvent={editingEvent ?? undefined}
          familyMembers={familyMembers}
          initialDate={modalDate}
          initialTime={modalTime}
          onSave={handleSave}
          onDelete={editingEvent ? handleDelete : undefined}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
