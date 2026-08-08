import { useEffect, useRef } from 'react'
import type { CalendarEvent } from '../../types/event'
import styles from './WeekView.module.css'

const HOUR_PX = 60
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const GAP_PX = 3
const MAX_ALLDAY_VISIBLE = 2

export interface LayoutInfo {
  ev: CalendarEvent
  col: number
  totalCols: number
}

interface WeekViewProps {
  weekStart: Date
  events: CalendarEvent[]
  today: string
  onSlotClick: (dateStr: string, time: string) => void
  onEventClick: (event: CalendarEvent) => void
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function minutesSinceMidnight(isoStr: string): number {
  const d = new Date(isoStr)
  return d.getHours() * 60 + d.getMinutes()
}

function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  return minutesSinceMidnight(a.startDt) < minutesSinceMidnight(b.endDt)
      && minutesSinceMidnight(b.startDt) < minutesSinceMidnight(a.endDt)
}

export function computeEventLayout(events: CalendarEvent[]): LayoutInfo[] {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) =>
    minutesSinceMidnight(a.startDt) - minutesSinceMidnight(b.startDt)
  )

  // Build overlap clusters via transitive closure
  const inCluster = new Set<number>()
  const clusters: number[][] = []

  for (let i = 0; i < sorted.length; i++) {
    if (inCluster.has(i)) continue
    const cluster = [i]
    inCluster.add(i)
    let changed = true
    while (changed) {
      changed = false
      for (let j = 0; j < sorted.length; j++) {
        if (inCluster.has(j)) continue
        if (cluster.some(k => eventsOverlap(sorted[k], sorted[j]))) {
          cluster.push(j)
          inCluster.add(j)
          changed = true
        }
      }
    }
    clusters.push(cluster)
  }

  // Assign columns within each cluster using greedy sweep
  const result: LayoutInfo[] = []
  for (const clusterIndices of clusters) {
    const clusterEvents = clusterIndices.map(i => sorted[i])
    const colEndMinutes: number[] = []
    const assignments: number[] = []

    for (const ev of clusterEvents) {
      const startMin = minutesSinceMidnight(ev.startDt)
      const endMin   = minutesSinceMidnight(ev.endDt)
      let col = colEndMinutes.findIndex(end => end <= startMin)
      if (col === -1) { col = colEndMinutes.length; colEndMinutes.push(0) }
      colEndMinutes[col] = endMin
      assignments.push(col)
    }

    const totalCols = colEndMinutes.length
    clusterEvents.forEach((ev, i) =>
      result.push({ ev, col: assignments[i], totalCols })
    )
  }
  return result
}

function eventColor(ev: CalendarEvent): string {
  return ev.attendees[0]?.color ?? 'var(--color-primary)'
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function WeekView({ weekStart, events, today, onSlotClick, onEventClick }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date()
      const scrollTo = Math.max(0, (now.getHours() - 1) * HOUR_PX)
      scrollRef.current.scrollTop = scrollTo
    }
  }, [])

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  function eventsByDay(day: Date): CalendarEvent[] {
    const dateStr = toLocalDateStr(day)
    return events.filter(ev => ev.startDt.slice(0, 10) === dateStr && !ev.allDay)
  }

  function allDayEventsByDay(day: Date): CalendarEvent[] {
    const dateStr = toLocalDateStr(day)
    return events.filter(ev =>
      ev.allDay && dateStr >= ev.startDt.slice(0, 10) && dateStr <= ev.endDt.slice(0, 10)
    )
  }

  const hasAllDayEvents = events.some(ev => ev.allDay)

  const now = new Date()
  const todayWeekIndex = weekDays.findIndex(d => toLocalDateStr(d) === today)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  return (
    <div className={styles.wrapper}>
      {/* Column headers */}
      <div className={styles.headerRow}>
        <div className={styles.timeGutter} />
        {weekDays.map((day, i) => {
          const dateStr = toLocalDateStr(day)
          const isToday = dateStr === today
          return (
            <div key={dateStr} className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ''}`}>
              <span className={styles.weekdayLabel}>{WEEKDAYS[i]}</span>
              <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ''}`}>
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* All-day row */}
      {hasAllDayEvents && (
        <div className={styles.allDayRow}>
          <div className={styles.allDayGutter}>Ganztägig</div>
          {weekDays.map(day => {
            const dateStr = toLocalDateStr(day)
            const dayAllDayEvents = allDayEventsByDay(day)
            const visible = dayAllDayEvents.slice(0, MAX_ALLDAY_VISIBLE)
            const hiddenCount = dayAllDayEvents.length - visible.length

            return (
              <div key={dateStr} className={styles.allDayCell}>
                {visible.map(ev => (
                  <div
                    key={ev.id}
                    className={styles.allDayPill}
                    style={{ backgroundColor: eventColor(ev) }}
                    title={ev.title}
                    onClick={() => onEventClick(ev)}
                  >
                    {ev.title}
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <div className={styles.allDayMore}>+{hiddenCount} weitere</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Scrollable body */}
      <div ref={scrollRef} className={styles.scrollArea}>
        <div className={styles.body}>
          {/* Time gutter */}
          <div className={styles.timeGutter}>
            {HOURS.map(h => (
              <div key={h} className={styles.hourLabel}>
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, colIdx) => {
            const dateStr = toLocalDateStr(day)
            const dayEvents = eventsByDay(day)
            const isToday = colIdx === todayWeekIndex

            return (
              <div
                key={dateStr}
                className={styles.dayColumn}
                onClick={e => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  const relY = e.clientY - rect.top
                  const totalMinutes = Math.floor(relY / HOUR_PX * 60)
                  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
                  const m = String(totalMinutes % 60).padStart(2, '0')
                  onSlotClick(dateStr, `${h}:${m}`)
                }}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} className={styles.hourLine} style={{ top: h * HOUR_PX }} />
                ))}

                {/* Current time indicator */}
                {isToday && (
                  <div
                    className={styles.currentTime}
                    style={{ top: (currentMinutes / 60) * HOUR_PX }}
                  />
                )}

                {/* Events */}
                {computeEventLayout(dayEvents).map(({ ev, col, totalCols }) => {
                  const startMin = minutesSinceMidnight(ev.startDt)
                  const endMin = minutesSinceMidnight(ev.endDt)
                  const durationMin = Math.max(endMin - startMin, 15)
                  const top = (startMin / 60) * HOUR_PX
                  const height = (durationMin / 60) * HOUR_PX
                  const leftPct  = (col / totalCols) * 100
                  const rightPct = ((totalCols - col - 1) / totalCols) * 100

                  return (
                    <div
                      key={ev.id}
                      className={styles.eventBlock}
                      style={{
                        top,
                        height,
                        backgroundColor: eventColor(ev),
                        left:  `calc(${leftPct}%  + ${GAP_PX}px)`,
                        right: `calc(${rightPct}% + ${GAP_PX}px)`,
                      }}
                      title={`${ev.title}\n${formatTime(ev.startDt)} – ${formatTime(ev.endDt)}`}
                      onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                    >
                      <span className={styles.eventTitle}>{ev.title}</span>
                      <span className={styles.eventTime}>
                        {formatTime(ev.startDt)} – {formatTime(ev.endDt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
