import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskFormModal } from './TaskFormModal'
import type { Task } from '../../types/task'
import type { FamilyMember } from '../../types/family'

const MOCK_FAMILY: FamilyMember[] = [
  { id: '1', name: 'Anton', initials: 'A', color: '#5B6AF0', online: true, createdAt: '2024-01-01T00:00:00' },
]

const editTask: Task = {
  id: 'task-1',
  title: 'Arzt Termin',
  dueDate: '2024-02-10',
  completed: false,
  recurrence: 'none',
  createdAt: '2024-01-01T00:00:00',
}

function renderModal(props: { editTask?: Task } = {}) {
  const onSave  = vi.fn()
  const onClose = vi.fn()
  render(<TaskFormModal {...props} familyMembers={MOCK_FAMILY} onSave={onSave} onClose={onClose} />)
  return { onSave, onClose }
}

describe('TaskFormModal — Create-Modus', () => {
  it('zeigt leeres Titel-Feld', () => {
    renderModal()
    expect((screen.getByLabelText('Titel *') as HTMLInputElement).value).toBe('')
  })

  it('Submit-Button heißt "Erstellen"', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Erstellen' })).toBeInTheDocument()
  })

  it('Submit-Button ist disabled wenn Titel leer', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Erstellen' })).toBeDisabled()
  })

  it('ruft onSave mit korrektem Payload auf nach Titel-Eingabe und Submit', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()
    await user.type(screen.getByLabelText('Titel *'), 'Einkaufen')
    await user.click(screen.getByRole('button', { name: 'Erstellen' }))
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Einkaufen', recurrence: 'none' })
    )
  })

  it('ruft onSave NICHT auf wenn Titel nur Leerzeichen enthält', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()
    await user.type(screen.getByLabelText('Titel *'), '   ')
    // Submit-Button bleibt disabled — direkter fireEvent-Versuch auf Formular
    const form = screen.getByRole('dialog').querySelector('form')!
    form.dispatchEvent(new Event('submit', { bubbles: true }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('ruft onClose auf bei Klick auf Abbrechen-Button', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('TaskFormModal — Edit-Modus', () => {
  it('füllt Titel-Feld mit editTask.title vor', () => {
    renderModal({ editTask })
    expect((screen.getByLabelText('Titel *') as HTMLInputElement).value).toBe('Arzt Termin')
  })

  it('füllt Fälligkeitsdatum vor', () => {
    renderModal({ editTask })
    expect((screen.getByLabelText('Fälligkeitsdatum') as HTMLInputElement).value).toBe('2024-02-10')
  })

  it('Submit-Button heißt "Speichern"', () => {
    renderModal({ editTask })
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument()
  })

  it('ruft onSave mit geändertem Titel auf', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal({ editTask })
    const titleInput = screen.getByLabelText('Titel *')
    await user.clear(titleInput)
    await user.type(titleInput, 'Zahnarzt Termin')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Zahnarzt Termin' })
    )
  })
})
