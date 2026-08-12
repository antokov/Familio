import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthView, getMonthGridRange } from './MonthView'
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

function findCellByDay(container: HTMLElement, day: string, otherMonth: boolean): HTMLElement {
  const selector = otherMonth ? '.cellOtherMonth' : '.cell:not(.cellOtherMonth)'
  const cells = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
  const match = cells.find(c => c.querySelector('.dayNumber')?.textContent === day)
  if (!match) throw new Error(`Zelle für Tag ${day} (otherMonth=${otherMonth}) nicht gefunden`)
  return match
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

describe('MonthView — getMonthGridRange', () => {
  it('inkludiert die Vor-/Nachlauftage aus dem Nachbarmonat für August 2026', () => {
    const { start, end } = getMonthGridRange(2026, 7)
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 6, 27])
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([2026, 8, 6])
  })

  it('beginnt immer auf einem Montag und endet immer auf einem Sonntag', () => {
    const { start, end } = getMonthGridRange(2027, 1)
    expect(start.getDay()).toBe(1)
    expect(end.getDay()).toBe(0)
  })
})

describe('MonthView — Monatsgrenze: Klick-Navigation', () => {
  it('ruft onDayClick mit isCurrentMonth=true für einen Tag im gerahmten Monat auf', async () => {
    const user = userEvent.setup()
    const onDayClick = vi.fn()
    const { container } = render(
      <MonthView year={2026} month={7} events={[]} today="2026-08-01" onDayClick={onDayClick} onEventClick={vi.fn()} />
    )
    await user.click(findCellByDay(container, '5', false))
    expect(onDayClick).toHaveBeenCalledWith('2026-08-05', true)
  })

  it('ruft onDayClick mit isCurrentMonth=false für einen Spillover-Tag aus dem Folgemonat auf', async () => {
    const user = userEvent.setup()
    const onDayClick = vi.fn()
    const { container } = render(
      <MonthView year={2026} month={7} events={[]} today="2026-08-01" onDayClick={onDayClick} onEventClick={vi.fn()} />
    )
    await user.click(findCellByDay(container, '2', true))
    expect(onDayClick).toHaveBeenCalledWith('2026-09-02', false)
  })

  it('ruft onDayClick mit isCurrentMonth=false für einen Spillover-Tag aus dem Vormonat auf', async () => {
    const user = userEvent.setup()
    const onDayClick = vi.fn()
    const { container } = render(
      <MonthView year={2026} month={7} events={[]} today="2026-08-01" onDayClick={onDayClick} onEventClick={vi.fn()} />
    )
    await user.click(findCellByDay(container, '27', true))
    expect(onDayClick).toHaveBeenCalledWith('2026-07-27', false)
  })

  it('liefert für einen Nachlauftag über den Jahreswechsel (Dezember→Januar) das korrekte Folgejahr im dateStr', async () => {
    const user = userEvent.setup()
    const onDayClick = vi.fn()
    const { container } = render(
      <MonthView year={2026} month={11} events={[]} today="2026-12-01" onDayClick={onDayClick} onEventClick={vi.fn()} />
    )
    await user.click(findCellByDay(container, '3', true))
    expect(onDayClick).toHaveBeenCalledWith('2027-01-03', false)
  })

  it('liefert für einen Vorlauftag über den Jahreswechsel (Januar→Dezember) das korrekte Vorjahr im dateStr', async () => {
    const user = userEvent.setup()
    const onDayClick = vi.fn()
    const { container } = render(
      <MonthView year={2027} month={0} events={[]} today="2027-01-01" onDayClick={onDayClick} onEventClick={vi.fn()} />
    )
    await user.click(findCellByDay(container, '28', true))
    expect(onDayClick).toHaveBeenCalledWith('2026-12-28', false)
  })
})

describe('MonthView — Termine an Spillover-Tagen', () => {
  it('zeigt einen Termin am 2. September auch als Nachlauftag in der August-Ansicht', () => {
    const ev = makeEvent({
      title: 'Zahnarzt',
      allDay: false,
      startDt: '2026-09-02T10:00:00',
      endDt: '2026-09-02T11:00:00',
    })
    render(
      <MonthView year={2026} month={7} events={[ev]} today="2026-08-01" onDayClick={vi.fn()} onEventClick={vi.fn()} />
    )
    expect(screen.getByText('Zahnarzt')).toBeInTheDocument()
  })
})
