import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { AvatarBadge } from '../AvatarBadge/AvatarBadge'
import type { Task } from '../../types/task'
import styles from './TaskItem.module.css'

interface TaskItemProps {
  task: Task
  today: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

function formatDueDate(dueDate: string): string {
  const date = new Date(`${dueDate}T12:00:00`)
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

export function TaskItem({ task, today, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isOverdue = !task.completed && !!task.dueDate && task.dueDate < today
  const isDueToday = !task.completed && task.dueDate === today

  function handleToggle() {
    onToggle(task.id)
  }

  function handleDeleteClick() {
    setConfirmDelete(true)
  }

  function handleDeleteConfirm() {
    onDelete(task.id)
  }

  function handleDeleteCancel() {
    setConfirmDelete(false)
  }

  return (
    <li
      className={`${styles.item} ${task.completed ? styles.done : ''} ${isOverdue ? styles.overdue : ''}`}
    >
      <button
        className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}
        onClick={handleToggle}
        aria-label={task.completed ? 'Aufgabe als offen markieren' : 'Aufgabe erledigen'}
      >
        {task.completed && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
            <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className={styles.content}>
        <span className={styles.title}>{task.title}</span>
        {task.dueDate && (
          <span
            className={`${styles.dueDate} ${isOverdue ? styles.dueDateOverdue : ''} ${isDueToday ? styles.dueDateToday : ''}`}
          >
            {isDueToday ? 'Heute' : formatDueDate(task.dueDate)}
            {isOverdue && ' · überfällig'}
          </span>
        )}
      </div>

      {task.assigneeInitials && task.assigneeColor && (
        <AvatarBadge initials={task.assigneeInitials} color={task.assigneeColor} size="sm" />
      )}

      {confirmDelete ? (
        <div className={styles.confirmRow}>
          <span className={styles.confirmText}>Löschen?</span>
          <button className={styles.confirmBtn} onClick={handleDeleteConfirm}>Ja</button>
          <button className={styles.cancelBtn} onClick={handleDeleteCancel}>Nein</button>
        </div>
      ) : (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(task)}
            aria-label="Aufgabe bearbeiten"
          >
            <Pencil size={15} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDeleteClick}
            aria-label="Aufgabe löschen"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </li>
  )
}
