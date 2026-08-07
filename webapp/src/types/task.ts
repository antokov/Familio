export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Task {
  id: string
  title: string
  dueDate?: string
  assigneeInitials?: string
  assigneeColor?: string
  recurrence: RecurrenceType
  completed: boolean
  createdAt: string
}

export interface CreateTaskInput {
  title: string
  dueDate?: string
  assigneeInitials?: string
  assigneeColor?: string
  recurrence: RecurrenceType
}
