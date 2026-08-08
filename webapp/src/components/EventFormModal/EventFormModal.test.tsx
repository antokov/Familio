import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  allDay: false,
  createdAt: '2024-01-01T00:00:00',
}

function renderModal(event?: CalendarEvent) {
  const onSave = vi.fn().mockResolvedValue(true)
  const onClose = vi.fn()
  render(
    <EventFormModal
      editEvent={event}
      familyMembers={MOCK_FAMILY}
      onSave={onSave}
      onClose={onClose}
    />
  )
  return { onSave, onClose }
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

describe('EventFormModal — Ganztägig', () => {
  it('Checkbox ist bei neuem Termin standardmäßig nicht aktiviert', () => {
    renderModal()
    expect(screen.getByLabelText('Ganztägig')).not.toBeChecked()
    expect(screen.getByLabelText('Von')).toBeInTheDocument()
  })

  it('blendet Zeit-Felder aus, wenn Ganztägig aktiviert wird', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByLabelText('Ganztägig'))
    expect(screen.queryByLabelText('Von')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Bis')).not.toBeInTheDocument()
  })

  it('Checkbox ist bei ganztägigem editEvent bereits aktiviert und Zeit-Felder ausgeblendet', () => {
    renderModal({ ...baseEvent, allDay: true })
    expect(screen.getByLabelText('Ganztägig')).toBeChecked()
    expect(screen.queryByLabelText('Von')).not.toBeInTheDocument()
  })

  it('zeigt Zeit-Felder wieder, wenn Ganztägig bei bestehendem Termin deaktiviert wird', async () => {
    const user = userEvent.setup()
    renderModal({ ...baseEvent, allDay: true })
    await user.click(screen.getByLabelText('Ganztägig'))
    expect(screen.getByLabelText('Von')).toBeInTheDocument()
    expect(screen.getByLabelText('Bis')).toBeInTheDocument()
  })

  it('speichert mit 00:00–23:59 und allDay:true, wenn Ganztägig aktiviert ist', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()
    await user.type(screen.getByLabelText('Titel *'), 'Geburtstag')
    await user.click(screen.getByLabelText('Ganztägig'))
    await user.click(screen.getByRole('button', { name: 'Erstellen' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Geburtstag',
        allDay: true,
        startDt: expect.stringMatching(/T00:00:00$/),
        endDt: expect.stringMatching(/T23:59:00$/),
      })
    )
  })

  it('Submit-Button ist bei Ganztägig unabhängig von Zeitwerten aktiv', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText('Titel *'), 'Ferienbeginn')
    await user.click(screen.getByLabelText('Ganztägig'))
    expect(screen.getByRole('button', { name: 'Erstellen' })).not.toBeDisabled()
  })
})
