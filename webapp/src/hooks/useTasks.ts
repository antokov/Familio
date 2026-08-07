import { useState, useEffect } from 'react'
import type { Task, CreateTaskInput, RecurrenceType } from '../types/task'

const STORAGE_KEY = 'kovacevic-tasks'

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Task[]
  } catch {
    return []
  }
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getNextDueDate(dueDate: string | undefined, recurrence: RecurrenceType): string {
  const base = dueDate ? new Date(`${dueDate}T12:00:00`) : new Date()
  switch (recurrence) {
    case 'daily':   base.setDate(base.getDate() + 1); break
    case 'weekly':  base.setDate(base.getDate() + 7); break
    case 'monthly': base.setMonth(base.getMonth() + 1); break
    case 'yearly':  base.setFullYear(base.getFullYear() + 1); break
    default: return dueDate ?? ''
  }
  return base.toISOString().slice(0, 10)
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // localStorage not available
    }
  }, [tasks])

  function addTask(input: CreateTaskInput): void {
    const trimmed = input.title.trim()
    if (!trimmed) return
    const task: Task = {
      id: generateId(),
      title: trimmed,
      dueDate: input.dueDate || undefined,
      assigneeInitials: input.assigneeInitials,
      assigneeColor: input.assigneeColor,
      recurrence: input.recurrence,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTasks(prev => [task, ...prev])
  }

  function completeTask(id: string): void {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      if (!task || task.completed) return prev

      const updated = prev.map(t => t.id === id ? { ...t, completed: true } : t)

      if (task.recurrence !== 'none') {
        const next: Task = {
          id: generateId(),
          title: task.title,
          dueDate: getNextDueDate(task.dueDate, task.recurrence),
          assigneeInitials: task.assigneeInitials,
          assigneeColor: task.assigneeColor,
          recurrence: task.recurrence,
          completed: false,
          createdAt: new Date().toISOString(),
        }
        return [next, ...updated]
      }

      return updated
    })
  }

  function deleteTask(id: string): void {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function editTask(id: string, updates: Partial<CreateTaskInput>): void {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      return {
        ...t,
        title: updates.title !== undefined ? updates.title.trim() : t.title,
        dueDate: updates.dueDate !== undefined ? (updates.dueDate || undefined) : t.dueDate,
        assigneeInitials: updates.assigneeInitials !== undefined ? updates.assigneeInitials : t.assigneeInitials,
        assigneeColor: updates.assigneeColor !== undefined ? updates.assigneeColor : t.assigneeColor,
        recurrence: updates.recurrence !== undefined ? updates.recurrence : t.recurrence,
      }
    }))
  }

  const today = new Date().toISOString().slice(0, 10)

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

  return { tasks, openTasks, doneTasks, today, addTask, completeTask, deleteTask, editTask }
}
