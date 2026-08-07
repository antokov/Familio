import { useState, useCallback, useEffect } from 'react'
import type { Task, CreateTaskInput, RecurrenceType } from '../types/task'
import { getNextDueDate } from './useTasks'
import { API_BASE } from '../api/config'

function fromApi(raw: Record<string, unknown>): Task {
  return {
    id: raw['id'] as string,
    title: raw['title'] as string,
    dueDate: (raw['due_date'] as string | null) ?? undefined,
    assigneeInitials: (raw['assignee_initials'] as string | null) ?? undefined,
    assigneeColor: (raw['assignee_color'] as string | null) ?? undefined,
    recurrence: ((raw['recurrence'] as string) ?? 'none') as RecurrenceType,
    completed: raw['completed'] as boolean,
    createdAt: raw['created_at'] as string,
  }
}

function toApi(input: CreateTaskInput): Record<string, unknown> {
  return {
    title: input.title,
    due_date: input.dueDate ?? null,
    assignee_initials: input.assigneeInitials ?? null,
    assignee_color: input.assigneeColor ?? null,
    recurrence: input.recurrence,
  }
}

export function useTasksApi() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/tasks`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Record<string, unknown>[]
      setTasks(data.map(fromApi))
    } catch {
      setError('Aufgaben konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const addTask = useCallback(async (input: CreateTaskInput): Promise<void> => {
    const trimmed = input.title.trim()
    if (!trimmed) return
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApi({ ...input, title: trimmed })),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      setTasks(prev => [fromApi(raw), ...prev])
    } catch {
      setError('Aufgabe konnte nicht erstellt werden')
    }
  }, [])

  const toggleTask = useCallback(async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newCompleted = !task.completed
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      setTasks(prev => prev.map(t => t.id === id ? fromApi(raw) : t))

      // Neue Instanz nur beim Abh­aken (false → true), nicht beim Wiedereröffnen
      if (newCompleted && task.recurrence !== 'none') {
        const nextInput: CreateTaskInput = {
          title: task.title,
          dueDate: getNextDueDate(task.dueDate, task.recurrence),
          assigneeInitials: task.assigneeInitials,
          assigneeColor: task.assigneeColor,
          recurrence: task.recurrence,
        }
        const nextRes = await fetch(`${API_BASE}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toApi(nextInput)),
        })
        if (nextRes.ok) {
          const nextRaw = (await nextRes.json()) as Record<string, unknown>
          setTasks(prev => [fromApi(nextRaw), ...prev])
        }
      }
    } catch {
      setError('Aufgabe konnte nicht aktualisiert werden')
    }
  }, [tasks])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch {
      setError('Aufgabe konnte nicht gelöscht werden')
    }
  }, [])

  const editTask = useCallback(async (id: string, updates: Partial<CreateTaskInput>): Promise<void> => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    try {
      const body: Record<string, unknown> = {}
      if (updates.title !== undefined) body['title'] = updates.title.trim()
      if (updates.dueDate !== undefined) body['due_date'] = updates.dueDate ?? null
      if (updates.assigneeInitials !== undefined) body['assignee_initials'] = updates.assigneeInitials ?? null
      if (updates.assigneeColor !== undefined) body['assignee_color'] = updates.assigneeColor ?? null
      if (updates.recurrence !== undefined) body['recurrence'] = updates.recurrence
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      setTasks(prev => prev.map(t => t.id === id ? fromApi(raw) : t))
    } catch {
      setError('Aufgabe konnte nicht bearbeitet werden')
    }
  }, [tasks])

  const openTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })

  const doneTasks = tasks
    .filter(t => t.completed)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return { openTasks, doneTasks, today, loading, error, addTask, toggleTask, deleteTask, editTask }
}
