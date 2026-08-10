import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExtractEventsModal } from './ExtractEventsModal'
import type { ExtractedEventCandidate } from '../../types/document'
import type { FamilyMember } from '../../types/family'

const MOCK_FAMILY: FamilyMember[] = [
  { id: 'fm-1', name: 'Anton', initials: 'A', color: '#5B6AF0', online: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'fm-2', name: 'Mira', initials: 'M', color: '#4CAF82', online: false, createdAt: '2024-01-01T00:00:00' },
]

const candidates: ExtractedEventCandidate[] = [
  { id: 'candidate-0', title: 'Sommerfest', startDt: '2026-06-20T10:00:00', endDt: '2026-06-20T14:00:00', allDay: false, attendees: [{ initials: 'M', color: '#4CAF82' }] },
  { id: 'candidate-1', title: 'Elternabend', startDt: '2026-03-15T00:00:00', endDt: '2026-03-15T23:59:00', allDay: true, attendees: [] },
]

function renderModal(overrides: { candidates?: ExtractedEventCandidate[]; familyMembers?: FamilyMember[] } = {}) {
  const createEvent = vi.fn().mockResolvedValue(true)
  const onDone = vi.fn()
  const onClose = vi.fn()
  render(
    <ExtractEventsModal
      filename="quartalsplan.pdf"
      candidates={overrides.candidates ?? candidates}
      familyMembers={overrides.familyMembers ?? MOCK_FAMILY}
      createEvent={createEvent}
      onDone={onDone}
      onClose={onClose}
    />
  )
  return { createEvent, onDone, onClose }
}

describe('ExtractEventsModal — Leerer Zustand', () => {
  it('zeigt Hinweistext, wenn keine Termine gefunden wurden', () => {
    renderModal({ candidates: [] })
    expect(screen.getByText('Keine Termine im Dokument gefunden.')).toBeInTheDocument()
  })

  it('zeigt keine Übernehmen-Aktion, nur Schließen', () => {
    renderModal({ candidates: [] })
    expect(screen.queryByRole('button', { name: 'Termine übernehmen' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Schließen' }).length).toBeGreaterThan(0)
  })
})

describe('ExtractEventsModal — Vorschläge anzeigen', () => {
  it('zeigt alle Vorschläge mit vorausgewählten Checkboxen', () => {
    renderModal()
    expect(screen.getByDisplayValue('Sommerfest')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Elternabend')).toBeInTheDocument()
    const checkboxes = screen.getAllByLabelText(/übernehmen$/)
    expect(checkboxes).toHaveLength(2)
    checkboxes.forEach(cb => expect(cb).toBeChecked())
  })

  it('zeigt die Auswahl-Anzahl im Footer', () => {
    renderModal()
    expect(screen.getByText('2 von 2 ausgewählt')).toBeInTheDocument()
  })

  it('Abwählen einer Checkbox reduziert die Auswahl-Anzahl', async () => {
    const user = userEvent.setup()
    renderModal()
    const [firstCheckbox] = screen.getAllByLabelText(/übernehmen$/)
    await user.click(firstCheckbox)
    expect(screen.getByText('1 von 2 ausgewählt')).toBeInTheDocument()
  })
})

describe('ExtractEventsModal — Ganztägig-Erkennung', () => {
  it('zeigt bei erkannten ganztägigen Terminen keine Zeit-Eingaben und einen aktivierten Toggle', () => {
    renderModal({ candidates: [candidates[1]] })
    expect(screen.queryByLabelText('Startzeit')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Ganztägig' })).toBeChecked()
  })

  it('zeigt bei Terminen mit Uhrzeit die Zeit-Eingaben und einen deaktivierten Toggle', () => {
    renderModal({ candidates: [candidates[0]] })
    expect(screen.getByLabelText('Startzeit')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Ganztägig' })).not.toBeChecked()
  })

  it('legt einen als ganztägig erkannten Termin mit allDay: true und 00:00-23:59 an', async () => {
    const user = userEvent.setup()
    const { createEvent } = renderModal({ candidates: [candidates[1]] })

    await user.click(screen.getByRole('button', { name: 'Termine übernehmen' }))

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Elternabend',
        startDt: '2026-03-15T00:00:00',
        endDt: '2026-03-15T23:59:00',
        allDay: true,
      })
    )
  })

  it('Umschalten des Ganztägig-Toggles blendet die Zeit-Eingaben ein/aus', async () => {
    const user = userEvent.setup()
    renderModal({ candidates: [candidates[0]] })

    expect(screen.getByLabelText('Startzeit')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Ganztägig' }))
    expect(screen.queryByLabelText('Startzeit')).not.toBeInTheDocument()
  })
})

describe('ExtractEventsModal — Zugewiesene Person', () => {
  it('zeigt die vom Dokument übernommene Person bereits ausgewählt', () => {
    renderModal({ candidates: [candidates[0]] })
    expect(screen.getByRole('button', { name: 'Mira' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Anton' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('zeigt keine vorausgewählte Person, wenn das Dokument niemandem zugewiesen war', () => {
    renderModal({ candidates: [candidates[1]] })
    expect(screen.getByRole('button', { name: 'Mira' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Anton' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('erlaubt das Hinzufügen einer weiteren Person pro Termin', async () => {
    const user = userEvent.setup()
    renderModal({ candidates: [candidates[0]] })

    await user.click(screen.getByRole('button', { name: 'Anton' }))

    expect(screen.getByRole('button', { name: 'Anton' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Mira' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('erlaubt das Entfernen der vorausgewählten Person', async () => {
    const user = userEvent.setup()
    renderModal({ candidates: [candidates[0]] })

    await user.click(screen.getByRole('button', { name: 'Mira' }))

    expect(screen.getByRole('button', { name: 'Mira' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('legt den Termin ohne Person an, wenn die vorausgewählte Person entfernt wurde', async () => {
    const user = userEvent.setup()
    const { createEvent } = renderModal({ candidates: [candidates[0]] })

    await user.click(screen.getByRole('button', { name: 'Mira' }))
    await user.click(screen.getByRole('button', { name: 'Termine übernehmen' }))

    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ attendees: [] }))
  })

  it('behandelt die Personen-Auswahl pro Termin unabhängig voneinander', async () => {
    const user = userEvent.setup()
    renderModal({ candidates: [candidates[0], candidates[1]] })

    const antonBtns = screen.getAllByRole('button', { name: 'Anton' })
    await user.click(antonBtns[0])

    expect(antonBtns[0]).toHaveAttribute('aria-pressed', 'true')
    expect(antonBtns[1]).toHaveAttribute('aria-pressed', 'false')
    const miraBtns = screen.getAllByRole('button', { name: 'Mira' })
    expect(miraBtns[0]).toHaveAttribute('aria-pressed', 'true')
    expect(miraBtns[1]).toHaveAttribute('aria-pressed', 'false')
  })

  it('legt den Termin mit der vorausgewählten Person an, wenn nichts geändert wird', async () => {
    const user = userEvent.setup()
    const { createEvent } = renderModal({ candidates: [candidates[0]] })

    await user.click(screen.getByRole('button', { name: 'Termine übernehmen' }))

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ attendees: [{ initials: 'M', color: '#4CAF82' }] })
    )
  })

  it('legt den Termin mit der geänderten Personen-Auswahl an, nicht mit der ursprünglichen', async () => {
    const user = userEvent.setup()
    const { createEvent } = renderModal({ candidates: [candidates[0]] })

    await user.click(screen.getByRole('button', { name: 'Mira' }))
    await user.click(screen.getByRole('button', { name: 'Anton' }))
    await user.click(screen.getByRole('button', { name: 'Termine übernehmen' }))

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ attendees: [{ initials: 'A', color: '#5B6AF0' }] })
    )
  })
})

describe('ExtractEventsModal — Termine übernehmen', () => {
  it('ruft createEvent für jeden ausgewählten Termin auf und schließt danach', async () => {
    const user = userEvent.setup()
    const { createEvent, onDone, onClose } = renderModal()

    await user.click(screen.getByRole('button', { name: 'Termine übernehmen' }))

    expect(createEvent).toHaveBeenCalledTimes(2)
    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Sommerfest', startDt: '2026-06-20T10:00:00', endDt: '2026-06-20T14:00:00' })
    )
    expect(onDone).toHaveBeenCalledWith(2)
    expect(onClose).toHaveBeenCalled()
  })

  it('legt abgewählte Termine nicht an', async () => {
    const user = userEvent.setup()
    const { createEvent, onDone } = renderModal()

    const [firstCheckbox] = screen.getAllByRole('checkbox')
    await user.click(firstCheckbox)
    await user.click(screen.getByRole('button', { name: 'Termine übernehmen' }))

    expect(createEvent).toHaveBeenCalledTimes(1)
    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Elternabend' }))
    expect(onDone).toHaveBeenCalledWith(1)
  })

  it('Button ist disabled, wenn keine Termine ausgewählt sind', async () => {
    const user = userEvent.setup()
    renderModal({ candidates: [candidates[0]] })

    const [checkbox] = screen.getAllByRole('checkbox')
    await user.click(checkbox)

    expect(screen.getByRole('button', { name: 'Termine übernehmen' })).toBeDisabled()
  })
})
