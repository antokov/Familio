import { render, screen } from '@testing-library/react'
import { EventFormModal } from './EventFormModal'
import type { CalendarEvent } from '../../types/event'
import type { FamilyMember } from '../../types/family'

const MOCK_FAMILY: FamilyMember[] = []

const baseEvent: CalendarEvent = {
  id: '1',
  title: 'Testevent',
  startDt: '2024-01-15T10:30:00',
  endDt: '2024-01-15T11:45:00',
  attendees: [],
  createdAt: '2024-01-01T00:00:00',
}

function renderModal(event?: CalendarEvent) {
  return render(
    <EventFormModal
      editEvent={event}
      familyMembers={MOCK_FAMILY}
      onSave={vi.fn().mockResolvedValue(true)}
      onClose={vi.fn()}
    />
  )
}

describe('EventFormModal — Edit-Modus Vorausfüllen', () => {
  it('füllt Datum aus naivem ISO-String vor', () => {
    renderModal(baseEvent)
    const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
    expect(dateInput.value).toBe('2024-01-15')
  })

  it('füllt Startzeit aus naivem ISO-String vor', () => {
    renderModal(baseEvent)
    const startInput = screen.getByLabelText('Von') as HTMLInputElement
    expect(startInput.value).toBe('10:30')
  })

  it('füllt Endzeit aus naivem ISO-String vor', () => {
    renderModal(baseEvent)
    const endInput = screen.getByLabelText('Bis') as HTMLInputElement
    expect(endInput.value).toBe('11:45')
  })

  it('parst ISO-String mit Mikrosekunden korrekt', () => {
    const event: CalendarEvent = {
      ...baseEvent,
      startDt: '2024-01-15T10:30:00.123456',
      endDt: '2024-01-15T11:45:00.999999',
    }
    renderModal(event)
    expect((screen.getByLabelText('Von') as HTMLInputElement).value).toBe('10:30')
    expect((screen.getByLabelText('Bis') as HTMLInputElement).value).toBe('11:45')
  })

  it('parst Mitternacht korrekt zu 00:00', () => {
    const event: CalendarEvent = {
      ...baseEvent,
      startDt: '2024-01-15T00:00:00',
      endDt: '2024-01-15T01:00:00',
    }
    renderModal(event)
    expect((screen.getByLabelText('Von') as HTMLInputElement).value).toBe('00:00')
  })

  it('parst einstellige Stunde korrekt mit führender Null', () => {
    const event: CalendarEvent = {
      ...baseEvent,
      startDt: '2024-01-15T08:05:00',
      endDt: '2024-01-15T09:05:00',
    }
    renderModal(event)
    expect((screen.getByLabelText('Von') as HTMLInputElement).value).toBe('08:05')
  })
})

describe('EventFormModal — Neuer Termin (kein editEvent)', () => {
  it('zeigt leeres Titel-Feld', () => {
    renderModal()
    const titleInput = screen.getByLabelText('Titel *') as HTMLInputElement
    expect(titleInput.value).toBe('')
  })

  it('füllt Startzeit mit 09:00 vor wenn kein initialTime übergeben', () => {
    renderModal()
    expect((screen.getByLabelText('Von') as HTMLInputElement).value).toBe('09:00')
  })
})
