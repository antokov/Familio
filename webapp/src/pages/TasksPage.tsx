import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasksApi } from '../hooks/useTasksApi'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import { TaskItem } from '../components/TaskItem/TaskItem'
import { TaskFormModal } from '../components/TaskFormModal/TaskFormModal'
import type { Task, CreateTaskInput } from '../types/task'
import styles from './TasksPage.module.css'

export default function TasksPage() {
  const { openTasks, doneTasks, today, loading, error, addTask, toggleTask, deleteTask, editTask } = useTasksApi()
  const { members: familyMembers } = useFamilyMembers()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  function handleNewTask() {
    setEditingTask(undefined)
    setModalOpen(true)
  }

  function handleEditTask(task: Task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  async function handleSave(input: CreateTaskInput) {
    if (editingTask) {
      await editTask(editingTask.id, input)
    } else {
      await addTask(input)
    }
    setModalOpen(false)
    setEditingTask(undefined)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingTask(undefined)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Aufgaben</h2>
        <button className={styles.newBtn} onClick={handleNewTask} disabled={loading}>
          <Plus size={16} />
          Neue Aufgabe
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading && <p className={styles.loadingText}>Lädt…</p>}

      {!loading && openTasks.length === 0 && doneTasks.length === 0 && !error && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Keine Aufgaben</p>
          <p className={styles.emptyHint}>Erstell deine erste Aufgabe mit dem Button oben.</p>
        </div>
      )}

      {openTasks.length > 0 && (
        <ul className={styles.list}>
          {openTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              today={today}
              onToggle={id => void toggleTask(id)}
              onDelete={id => void deleteTask(id)}
              onEdit={handleEditTask}
            />
          ))}
        </ul>
      )}

      {doneTasks.length > 0 && (
        <details className={styles.doneSection}>
          <summary className={styles.doneSummary}>
            <span>Erledigt</span>
            <span className={styles.doneCount}>{doneTasks.length}</span>
          </summary>
          <ul className={`${styles.list} ${styles.doneList}`}>
            {doneTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                today={today}
                onToggle={id => void toggleTask(id)}
                onDelete={id => void deleteTask(id)}
                onEdit={handleEditTask}
              />
            ))}
          </ul>
        </details>
      )}

      {modalOpen && (
        <TaskFormModal
          editTask={editingTask}
          familyMembers={familyMembers}
          onSave={input => void handleSave(input)}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
