import type { CalendarEvent } from '../../types/event'
import styles from './MonthView.module.css'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

interface MonthViewProps {
  year: number
  month: number
  events: CalendarEvent[]
  today: string
  onDayClick: (dateStr: string, isCurrentMonth: boolean) => void
  onEventClick: (event: CalendarEvent) => void
}

/** The full rendered grid range for a month, including leading/trailing spillover days. */
export function getMonthGridRange(year: number, month: number): { start: Date; end: Date } {
  const first = new Date(year, month, 1)
  // 0=Sun→6, 1=Mon→0, …, shift so Mon=0
  const startDow = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - startDow)

  const last = new Date(year, month + 1, 0)
  const endDow = (last.getDay() + 6) % 7
  const end = new Date(year, month + 1, endDow === 6 ? 0 : 6 - endDow)

  return { start, end }
}

function getMonthGrid(year: number, month: number): Date[] {
  const { start, end } = getMonthGridRange(year, month)

  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function eventColor(event: CalendarEvent): string {
  return event.attendees[0]?.color ?? 'var(--color-primary)'
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function eventDateKeys(ev: CalendarEvent): string[] {
  const startKey = ev.startDt.slice(0, 10)
  const endKey = ev.endDt.slice(0, 10)
  if (!ev.allDay || startKey === endKey) return [startKey]

  const keys: string[] = []
  const cur = parseLocalDate(startKey)
  const end = parseLocalDate(endKey)
  while (cur <= end) {
    keys.push(toLocalDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return keys
}

export function MonthView({ year, month, events, today, onDayClick, onEventClick }: MonthViewProps) {
  const grid = getMonthGrid(year, month)

  const eventsByDay = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    for (const key of eventDateKeys(ev)) {
      if (!eventsByDay.has(key)) eventsByDay.set(key, [])
      eventsByDay.get(key)!.push(ev)
    }
  }

  return (
    <div className={styles.grid}>
      {WEEKDAYS.map(d => (
        <div key={d} className={styles.weekdayHeader}>{d}</div>
      ))}
      {grid.map(date => {
        const dateStr = toLocalDateStr(date)
        const isCurrentMonth = date.getMonth() === month
        const isToday = dateStr === today
        const dayEvents = eventsByDay.get(dateStr) ?? []

        return (
          <div
            key={dateStr}
            className={`${styles.cell} ${!isCurrentMonth ? styles.cellOtherMonth : ''}`}
            onClick={() => onDayClick(dateStr, isCurrentMonth)}
          >
            <span className={`${styles.dayNumber} ${isToday ? styles.today : ''}`}>
              {date.getDate()}
            </span>
            <div className={styles.pills}>
              {dayEvents.slice(0, 3).map(ev => (
                <div
                  key={ev.id}
                  className={styles.pill}
                  style={{ backgroundColor: eventColor(ev) }}
                  title={ev.title}
                  onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                >
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className={styles.moreLabel}>+{dayEvents.length - 3} weitere</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
