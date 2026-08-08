import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { computeEventLayout, WeekView } from './WeekView'
import type { CalendarEvent } from '../../types/event'

function makeEvent(id: string, startH: number, startM: number, endH: number, endM: number): CalendarEvent {
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    id,
    title: `Event ${id}`,
    startDt: `2024-01-15T${pad(startH)}:${pad(startM)}:00`,
    endDt:   `2024-01-15T${pad(endH)}:${pad(endM)}:00`,
    attendees: [],
    allDay: false,
    createdAt: '2024-01-01T00:00:00',
  }
}

describe('computeEventLayout', () => {
  it('gibt leeres Array für keine Events zurück', () => {
    expect(computeEventLayout([])).toEqual([])
  })

  it('einzelnes Event: totalCols=1, col=0 (volle Breite)', () => {
    const ev = makeEvent('a', 9, 0, 10, 0)
    const layout = computeEventLayout([ev])
    expect(layout).toHaveLength(1)
    expect(layout[0]).toMatchObject({ col: 0, totalCols: 1 })
  })

  it('zwei nicht-überlappende Events: jedes totalCols=1', () => {
    const a = makeEvent('a', 9, 0, 10, 0)
    const b = makeEvent('b', 11, 0, 12, 0)
    const layout = computeEventLayout([a, b])
    const la = layout.find(l => l.ev.id === 'a')!
    const lb = layout.find(l => l.ev.id === 'b')!
    expect(la).toMatchObject({ col: 0, totalCols: 1 })
    expect(lb).toMatchObject({ col: 0, totalCols: 1 })
  })

  it('Events die sich nur am Endpunkt berühren überlappen NICHT (A endet 11:00, B startet 11:00)', () => {
    const a = makeEvent('a', 9, 0, 11, 0)
    const b = makeEvent('b', 11, 0, 12, 0)
    const layout = computeEventLayout([a, b])
    expect(layout.find(l => l.ev.id === 'a')!.totalCols).toBe(1)
    expect(layout.find(l => l.ev.id === 'b')!.totalCols).toBe(1)
  })

  it('zwei überlappende Events: jedes col 0 und 1, totalCols=2', () => {
    const a = makeEvent('a', 9, 0, 11, 0)
    const b = makeEvent('b', 10, 0, 12, 0)
    const layout = computeEventLayout([a, b])
    const la = layout.find(l => l.ev.id === 'a')!
    const lb = layout.find(l => l.ev.id === 'b')!
    expect(la.totalCols).toBe(2)
    expect(lb.totalCols).toBe(2)
    expect(la.col).not.toBe(lb.col)
    expect([la.col, lb.col].sort()).toEqual([0, 1])
  })

  it('A↔B, B↔C, A∩C=∅ → 2 Spalten, nicht 3 (AC-3)', () => {
    const a = makeEvent('a', 9, 0, 11, 0)   // 9-11
    const b = makeEvent('b', 10, 0, 12, 0)  // 10-12
    const c = makeEvent('c', 11, 0, 13, 0)  // 11-13
    const layout = computeEventLayout([a, b, c])
    const la = layout.find(l => l.ev.id === 'a')!
    const lb = layout.find(l => l.ev.id === 'b')!
    const lc = layout.find(l => l.ev.id === 'c')!
    // All in one cluster
    expect(la.totalCols).toBe(2)
    expect(lb.totalCols).toBe(2)
    expect(lc.totalCols).toBe(2)
    // A and C must be in different cols from B
    expect(la.col).not.toBe(lb.col)
    expect(lc.col).not.toBe(lb.col)
    // A and C share a column (they don't overlap)
    expect(la.col).toBe(lc.col)
  })

  it('drei komplett überlappende Events → 3 Spalten', () => {
    const a = makeEvent('a', 9, 0, 12, 0)
    const b = makeEvent('b', 9, 0, 12, 0)
    const c = makeEvent('c', 9, 0, 12, 0)
    const layout = computeEventLayout([a, b, c])
    expect(layout.every(l => l.totalCols === 3)).toBe(true)
    const cols = layout.map(l => l.col).sort()
    expect(cols).toEqual([0, 1, 2])
  })

  it('isoliertes Event nach einer Überlappungsgruppe hat totalCols=1', () => {
    const a = makeEvent('a', 9, 0, 11, 0)
    const b = makeEvent('b', 10, 0, 12, 0) // overlaps a
    const c = makeEvent('c', 14, 0, 15, 0) // isolated
    const layout = computeEventLayout([a, b, c])
    const lc = layout.find(l => l.ev.id === 'c')!
    expect(lc.totalCols).toBe(1)
    expect(lc.col).toBe(0)
  })

  it('gibt für jedes Event genau einen LayoutInfo-Eintrag zurück', () => {
    const events = [
      makeEvent('a', 9, 0, 10, 0),
      makeEvent('b', 9, 30, 10, 30),
      makeEvent('c', 11, 0, 12, 0),
    ]
    const layout = computeEventLayout(events)
    expect(layout).toHaveLength(3)
    const ids = layout.map(l => l.ev.id).sort()
    expect(ids).toEqual(['a', 'b', 'c'])
  })
})

function makeAllDayEvent(id: string, title: string): CalendarEvent {
  return {
    id,
    title,
    startDt: '2024-01-15T00:00:00',
    endDt: '2024-01-15T23:59:00',
    attendees: [],
    allDay: true,
    createdAt: '2024-01-01T00:00:00',
  }
}

function renderWeekView(events: CalendarEvent[]) {
  const onEventClick = vi.fn()
  const onSlotClick = vi.fn()
  render(
    <WeekView
      weekStart={new Date(2024, 0, 15)}
      events={events}
      today="2024-01-15"
      onSlotClick={onSlotClick}
      onEventClick={onEventClick}
    />
  )
  return { onEventClick, onSlotClick }
}

describe('WeekView — Ganztägig-Zeile', () => {
  it('zeigt keine Ganztägig-Zeile, wenn keine All-Day-Events vorhanden sind', () => {
    renderWeekView([makeEvent('a', 9, 0, 10, 0)])
    expect(screen.queryByText('Ganztägig')).not.toBeInTheDocument()
  })

  it('zeigt die Ganztägig-Zeile mit dem Termin-Titel, wenn ein All-Day-Event vorhanden ist', () => {
    renderWeekView([makeAllDayEvent('a', 'Geburtstag Anton')])
    expect(screen.getByText('Ganztägig')).toBeInTheDocument()
    expect(screen.getByText('Geburtstag Anton')).toBeInTheDocument()
  })

  it('All-Day-Event erscheint nicht als zeitgebundener Block im Stunden-Raster', () => {
    renderWeekView([makeAllDayEvent('a', 'Geburtstag Anton')])
    expect(screen.queryByText('00:00 – 23:59')).not.toBeInTheDocument()
  })

  it('zeigt mehrere All-Day-Events desselben Tages nebeneinander', () => {
    renderWeekView([makeAllDayEvent('a', 'Termin A'), makeAllDayEvent('b', 'Termin B')])
    expect(screen.getByText('Termin A')).toBeInTheDocument()
    expect(screen.getByText('Termin B')).toBeInTheDocument()
  })

  it('zeigt "+N weitere" wenn mehr als 2 All-Day-Events am selben Tag liegen', () => {
    renderWeekView([
      makeAllDayEvent('a', 'Termin A'),
      makeAllDayEvent('b', 'Termin B'),
      makeAllDayEvent('c', 'Termin C'),
    ])
    expect(screen.getByText('+1 weitere')).toBeInTheDocument()
    expect(screen.queryByText('Termin C')).not.toBeInTheDocument()
  })

  it('ruft onEventClick auf, wenn ein All-Day-Pill angeklickt wird', async () => {
    const user = userEvent.setup()
    const ev = makeAllDayEvent('a', 'Geburtstag Anton')
    const { onEventClick } = renderWeekView([ev])
    await user.click(screen.getByText('Geburtstag Anton'))
    expect(onEventClick).toHaveBeenCalledWith(ev)
  })
})
