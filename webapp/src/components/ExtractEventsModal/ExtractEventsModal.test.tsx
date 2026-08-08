import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExtractEventsModal } from './ExtractEventsModal'
import type { ExtractedEventCandidate } from '../../types/document'

const candidates: ExtractedEventCandidate[] = [
  { id: 'candidate-0', title: 'Sommerfest', startDt: '2026-06-20T10:00:00', endDt: '2026-06-20T14:00:00' },
  { id: 'candidate-1', title: 'Elternabend', startDt: '2026-03-15T00:00:00', endDt: '2026-03-15T23:59:00' },
]

function renderModal(overrides: { candidates?: ExtractedEventCandidate[] } = {}) {
  const createEvent = vi.fn().mockResolvedValue(true)
  const onDone = vi.fn()
  const onClose = vi.fn()
  render(
    <ExtractEventsModal
      filename="quartalsplan.pdf"
      candidates={overrides.candidates ?? candidates}
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
    const checkboxes = screen.getAllByRole('checkbox')
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
    const [firstCheckbox] = screen.getAllByRole('checkbox')
    await user.click(firstCheckbox)
    expect(screen.getByText('1 von 2 ausgewählt')).toBeInTheDocument()
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
