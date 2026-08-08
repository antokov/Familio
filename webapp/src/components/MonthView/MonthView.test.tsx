import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthView } from './MonthView'
import type { CalendarEvent } from '../../types/event'

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'ev-1',
    title: 'Ferien',
    startDt: '2026-07-05T00:00:00',
    endDt: '2026-07-05T23:59:00',
    attendees: [],
    allDay: true,
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  }
}

function renderMonthView(events: CalendarEvent[]) {
  const onDayClick = vi.fn()
  const onEventClick = vi.fn()
  render(
    <MonthView
      year={2026}
      month={6}
      events={events}
      today="2026-07-01"
      onDayClick={onDayClick}
      onEventClick={onEventClick}
    />
  )
  return { onDayClick, onEventClick }
}

describe('MonthView — Eintägige Termine (Regression)', () => {
  it('zeigt einen eintägigen ganztägigen Termin nur an einem Tag', () => {
    renderMonthView([makeEvent()])
    expect(screen.getAllByText('Ferien')).toHaveLength(1)
  })

  it('zeigt einen nicht-ganztägigen Termin mit abweichendem End-Datum trotzdem nur an seinem Starttag', () => {
    const ev = makeEvent({
      allDay: false,
      startDt: '2026-07-05T22:00:00',
      endDt: '2026-07-06T01:00:00',
    })
    renderMonthView([ev])
    expect(screen.getAllByText('Ferien')).toHaveLength(1)
  })
})

describe('MonthView — Mehrtägige ganztägige Termine', () => {
  it('zeigt einen 3-tägigen ganztägigen Termin an allen 3 Tagen', () => {
    const ev = makeEvent({ startDt: '2026-07-05T00:00:00', endDt: '2026-07-07T23:59:00' })
    renderMonthView([ev])
    expect(screen.getAllByText('Ferien')).toHaveLength(3)
  })

  it('ruft onEventClick mit dem Termin auf, wenn eine Pill an einem der mehreren Tage angeklickt wird', async () => {
    const user = userEvent.setup()
    const ev = makeEvent({ startDt: '2026-07-05T00:00:00', endDt: '2026-07-06T23:59:00' })
    const { onEventClick } = renderMonthView([ev])
    const pills = screen.getAllByText('Ferien')
    await user.click(pills[1])
    expect(onEventClick).toHaveBeenCalledWith(ev)
  })

  it('respektiert das "+N weitere"-Limit pro Tag auch mit einem mehrtägigen Termin', () => {
    const multiDay = makeEvent({
      id: 'multi',
      startDt: '2026-07-05T00:00:00',
      endDt: '2026-07-06T23:59:00',
    })
    const extras = [
      makeEvent({ id: 'e1', title: 'A', startDt: '2026-07-05T00:00:00', endDt: '2026-07-05T23:59:00' }),
      makeEvent({ id: 'e2', title: 'B', startDt: '2026-07-05T00:00:00', endDt: '2026-07-05T23:59:00' }),
      makeEvent({ id: 'e3', title: 'C', startDt: '2026-07-05T00:00:00', endDt: '2026-07-05T23:59:00' }),
    ]
    renderMonthView([multiDay, ...extras])
    // Tag 5: multiDay + A + B + C = 4 Termine -> 3 sichtbar + "+1 weitere"
    // Tag 6: nur der mehrtägige Termin -> kein "weitere"-Label
    expect(screen.getAllByText(/weitere/)).toHaveLength(1)
    expect(screen.getByText('+1 weitere')).toBeInTheDocument()
  })
})
