import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskItem } from './TaskItem'
import type { Task } from '../../types/task'

const baseTask: Task = {
  id: 'task-1',
  title: 'Milch kaufen',
  completed: false,
  recurrence: 'none',
  createdAt: '2024-01-01T00:00:00',
}

const TODAY = '2024-01-15'

function renderTaskItem(overrides: Partial<Task> = {}) {
  const task = { ...baseTask, ...overrides }
  const onToggle = vi.fn()
  const onDelete = vi.fn()
  const onEdit   = vi.fn()
  render(
    <ul>
      <TaskItem task={task} today={TODAY} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
    </ul>
  )
  return { task, onToggle, onDelete, onEdit }
}

describe('TaskItem — Render', () => {
  it('zeigt den Aufgabentitel an', () => {
    renderTaskItem()
    expect(screen.getByText('Milch kaufen')).toBeInTheDocument()
  })

  it('Checkbox-Button hat aria-label "Aufgabe erledigen" wenn nicht erledigt', () => {
    renderTaskItem()
    expect(screen.getByRole('button', { name: 'Aufgabe erledigen' })).toBeInTheDocument()
  })

  it('Checkbox-Button hat aria-label "Aufgabe als offen markieren" wenn erledigt', () => {
    renderTaskItem({ completed: true })
    expect(screen.getByRole('button', { name: 'Aufgabe als offen markieren' })).toBeInTheDocument()
  })

  it('Checkbox ist nicht disabled wenn Aufgabe erledigt ist', () => {
    renderTaskItem({ completed: true })
    expect(screen.getByRole('button', { name: 'Aufgabe als offen markieren' })).not.toBeDisabled()
  })
})

describe('TaskItem — Checkbox-Click', () => {
  it('ruft onToggle mit der Task-ID auf wenn Checkbox geklickt (offen → erledigt)', async () => {
    const user = userEvent.setup()
    const { onToggle } = renderTaskItem()
    await user.click(screen.getByRole('button', { name: 'Aufgabe erledigen' }))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith('task-1')
  })

  it('ruft onToggle mit der Task-ID auf wenn Checkbox geklickt (erledigt → offen)', async () => {
    const user = userEvent.setup()
    const { onToggle } = renderTaskItem({ completed: true })
    await user.click(screen.getByRole('button', { name: 'Aufgabe als offen markieren' }))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith('task-1')
  })
})

describe('TaskItem — Inline-Delete-Confirm', () => {
  it('zeigt nach Klick auf Löschen-Button den Bestätigungs-Dialog', async () => {
    const user = userEvent.setup()
    renderTaskItem()
    await user.click(screen.getByRole('button', { name: 'Aufgabe löschen' }))
    expect(screen.getByText('Löschen?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ja' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nein' })).toBeInTheDocument()
  })

  it('ruft onDelete mit Task-ID auf nach Bestätigung', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderTaskItem()
    await user.click(screen.getByRole('button', { name: 'Aufgabe löschen' }))
    await user.click(screen.getByRole('button', { name: 'Ja' }))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith('task-1')
  })

  it('ruft onDelete NICHT auf wenn Bestätigung abgebrochen wird', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderTaskItem()
    await user.click(screen.getByRole('button', { name: 'Aufgabe löschen' }))
    await user.click(screen.getByRole('button', { name: 'Nein' }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('zeigt Actions-Buttons wieder nach Cancel', async () => {
    const user = userEvent.setup()
    renderTaskItem()
    await user.click(screen.getByRole('button', { name: 'Aufgabe löschen' }))
    await user.click(screen.getByRole('button', { name: 'Nein' }))
    expect(screen.getByRole('button', { name: 'Aufgabe löschen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aufgabe bearbeiten' })).toBeInTheDocument()
  })
})

describe('TaskItem — Edit-Button', () => {
  it('ruft onEdit mit dem gesamten Task-Objekt auf', async () => {
    const user = userEvent.setup()
    const { onEdit, task } = renderTaskItem()
    await user.click(screen.getByRole('button', { name: 'Aufgabe bearbeiten' }))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(task)
  })
})
