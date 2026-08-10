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

function renderModal(event?: CalendarEvent, onDelete?: (id: string) => Promise<boolean>) {
  const onSave = vi.fn().mockResolvedValue(true)
  const onClose = vi.fn()
  render(
    <EventFormModal
      editEvent={event}
      familyMembers={MOCK_FAMILY}
      onSave={onSave}
      onDelete={onDelete}
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

  it('ersetzt Zeit-Felder durch Von/Bis-Datumsfelder, wenn Ganztägig aktiviert wird', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByLabelText('Ganztägig'))
    expect(screen.queryByLabelText('Datum')).not.toBeInTheDocument()
    expect((screen.getByLabelText('Von') as HTMLInputElement).type).toBe('date')
    expect((screen.getByLabelText('Bis') as HTMLInputElement).type).toBe('date')
  })

  it('Checkbox ist bei ganztägigem editEvent bereits aktiviert, Von/Bis sind Datumsfelder', () => {
    renderModal({ ...baseEvent, allDay: true })
    expect(screen.getByLabelText('Ganztägig')).toBeChecked()
    expect((screen.getByLabelText('Von') as HTMLInputElement).type).toBe('date')
  })

  it('zeigt Zeit-Felder wieder, wenn Ganztägig bei bestehendem Termin deaktiviert wird', async () => {
    const user = userEvent.setup()
    renderModal({ ...baseEvent, allDay: true })
    await user.click(screen.getByLabelText('Ganztägig'))
    expect((screen.getByLabelText('Von') as HTMLInputElement).type).toBe('time')
    expect((screen.getByLabelText('Bis') as HTMLInputElement).type).toBe('time')
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

describe('EventFormModal — Mehrtägig', () => {
  it('füllt Von/Bis bei mehrtägigem editEvent korrekt vor', () => {
    const event: CalendarEvent = {
      ...baseEvent,
      allDay: true,
      startDt: '2026-07-20T00:00:00',
      endDt: '2026-07-31T23:59:00',
    }
    renderModal(event)
    expect((screen.getByLabelText('Von') as HTMLInputElement).value).toBe('2026-07-20')
    expect((screen.getByLabelText('Bis') as HTMLInputElement).value).toBe('2026-07-31')
  })

  it('speichert Von/Bis als Zeitraum mit allDay:true', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()
    await user.type(screen.getByLabelText('Titel *'), 'Ferien')
    await user.click(screen.getByLabelText('Ganztägig'))
    await user.clear(screen.getByLabelText('Bis'))
    await user.type(screen.getByLabelText('Bis'), '2099-12-31')
    await user.click(screen.getByRole('button', { name: 'Erstellen' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        allDay: true,
        endDt: expect.stringMatching(/^2099-12-31T23:59:00$/),
      })
    )
  })

  it('deaktiviert Speichern-Button, wenn Bis vor Von liegt', async () => {
    const event: CalendarEvent = {
      ...baseEvent,
      allDay: true,
      startDt: '2026-07-20T00:00:00',
      endDt: '2026-07-20T23:59:00',
    }
    const user = userEvent.setup()
    renderModal(event)
    await user.clear(screen.getByLabelText('Bis'))
    await user.type(screen.getByLabelText('Bis'), '2026-07-19')
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled()
    expect(screen.getByText('Enddatum muss am oder nach dem Startdatum liegen')).toBeInTheDocument()
  })

  it('zieht Bis automatisch nach, wenn Von auf ein späteres Datum als Bis verschoben wird', async () => {
    const event: CalendarEvent = {
      ...baseEvent,
      allDay: true,
      startDt: '2026-07-20T00:00:00',
      endDt: '2026-07-20T23:59:00',
    }
    const user = userEvent.setup()
    renderModal(event)
    await user.clear(screen.getByLabelText('Von'))
    await user.type(screen.getByLabelText('Von'), '2026-07-25')
    expect((screen.getByLabelText('Bis') as HTMLInputElement).value).toBe('2026-07-25')
    expect(screen.getByRole('button', { name: 'Speichern' })).not.toBeDisabled()
  })

  it('Von == Bis (eintägiger ganztägiger Termin) bleibt gültig', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText('Titel *'), 'Feiertag')
    await user.click(screen.getByLabelText('Ganztägig'))
    expect(screen.getByRole('button', { name: 'Erstellen' })).not.toBeDisabled()
  })
})

describe('EventFormModal — Termin löschen', () => {
  it('zeigt keinen Löschen-Button bei neuem Termin', () => {
    renderModal(undefined, vi.fn())
    expect(screen.queryByLabelText('Termin löschen')).not.toBeInTheDocument()
  })

  it('zeigt keinen Löschen-Button, wenn kein onDelete übergeben wird', () => {
    renderModal(baseEvent)
    expect(screen.queryByLabelText('Termin löschen')).not.toBeInTheDocument()
  })

  it('zeigt den Löschen-Button bei bestehendem Termin mit onDelete', () => {
    renderModal(baseEvent, vi.fn())
    expect(screen.getByLabelText('Termin löschen')).toBeInTheDocument()
  })

  it('fragt nach Bestätigung, bevor gelöscht wird', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(true)
    renderModal(baseEvent, onDelete)

    await user.click(screen.getByLabelText('Termin löschen'))

    expect(screen.getByText('Termin löschen?')).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('löscht nichts und zeigt den Löschen-Button wieder, wenn die Bestätigung abgebrochen wird', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(true)
    renderModal(baseEvent, onDelete)

    await user.click(screen.getByLabelText('Termin löschen'))
    await user.click(screen.getByRole('button', { name: 'Löschen abbrechen' }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Termin löschen')).toBeInTheDocument()
  })

  it('ruft onDelete mit der Termin-ID auf und schließt danach, wenn bestätigt wird', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(true)
    const { onClose } = renderModal(baseEvent, onDelete)

    await user.click(screen.getByLabelText('Termin löschen'))
    await user.click(screen.getByRole('button', { name: 'Ja, löschen' }))

    expect(onDelete).toHaveBeenCalledWith('1')
    expect(onClose).toHaveBeenCalled()
  })

  it('zeigt eine Fehlermeldung und schließt nicht, wenn das Löschen fehlschlägt', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(false)
    const { onClose } = renderModal(baseEvent, onDelete)

    await user.click(screen.getByLabelText('Termin löschen'))
    await user.click(screen.getByRole('button', { name: 'Ja, löschen' }))

    expect(screen.getByText('Löschen fehlgeschlagen. Bitte erneut versuchen.')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('deaktiviert die Bestätigungs-Buttons während des Löschens, sodass ein Doppel-Klick keinen zweiten Aufruf auslöst', async () => {
    const user = userEvent.setup()
    let resolveDelete: (ok: boolean) => void = () => {}
    const onDelete = vi.fn(() => new Promise<boolean>(resolve => { resolveDelete = resolve }))
    renderModal(baseEvent, onDelete)

    await user.click(screen.getByLabelText('Termin löschen'))
    const confirmBtn = screen.getByRole('button', { name: 'Ja, löschen' })
    await user.click(confirmBtn)

    expect(confirmBtn).toBeDisabled()
    await user.click(confirmBtn)
    expect(onDelete).toHaveBeenCalledTimes(1)

    resolveDelete(true)
  })

  it('schließt das gesamte Modal ohne zu löschen, wenn während der Bestätigung "Abbrechen" (Formular) geklickt wird', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(true)
    const { onClose } = renderModal(baseEvent, onDelete)

    await user.click(screen.getByLabelText('Termin löschen'))
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
