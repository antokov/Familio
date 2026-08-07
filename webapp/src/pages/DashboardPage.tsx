import { useState, useEffect } from 'react'
import { Calendar, CheckSquare, ShoppingCart } from 'lucide-react'
import { DashboardWidget } from '../components/DashboardWidget/DashboardWidget'
import { AvatarBadge } from '../components/AvatarBadge/AvatarBadge'
import styles from './DashboardPage.module.css'
import { API_BASE } from '../api/config'

interface ApiTask {
  id: string
  title: string
  due_date?: string
  assignee_initials?: string
  assignee_color?: string
}

interface ApiEvent {
  id: string
  title: string
  start_dt: string
  end_dt: string
  attendees: { initials: string; color: string }[]
}

interface ApiShoppingItem {
  id: string
  name: string
  checked: boolean
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Gute Nacht'
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

function formatDate() {
  return new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatEventDate(startDt: string): string {
  const date = startDt.slice(0, 10)
  const today = toLocalDateStr(new Date())
  const tomorrow = toLocalDateStr(new Date(Date.now() + 86400000))
  if (date === today) return 'Heute'
  if (date === tomorrow) return 'Morgen'
  const d = new Date(startDt)
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatEventTime(startDt: string): string {
  return new Date(startDt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardPage() {
  const today = toLocalDateStr(new Date())
  const to = toLocalDateStr(new Date(Date.now() + 90 * 86400000))

  const [tasks,         setTasks]         = useState<ApiTask[]>([])
  const [events,        setEvents]        = useState<ApiEvent[]>([])
  const [shoppingItems, setShoppingItems] = useState<ApiShoppingItem[]>([])
  const [tasksError,    setTasksError]    = useState(false)
  const [eventsError,   setEventsError]   = useState(false)
  const [shoppingError, setShoppingError] = useState(false)
  const [tasksLoading,    setTasksLoading]    = useState(true)
  const [eventsLoading,   setEventsLoading]   = useState(true)
  const [shoppingLoading, setShoppingLoading] = useState(true)

  useEffect(() => {
    setTasksLoading(true)
    fetch(`${API_BASE}/api/tasks?completed=false`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: ApiTask[]) => setTasks(data.slice(0, 3)))
      .catch(() => setTasksError(true))
      .finally(() => setTasksLoading(false))
  }, [])

  useEffect(() => {
    setEventsLoading(true)
    fetch(`${API_BASE}/api/events?from=${today}&to=${to}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: ApiEvent[]) => setEvents(data.slice(0, 3)))
      .catch(() => setEventsError(true))
      .finally(() => setEventsLoading(false))
  }, [today, to])

  useEffect(() => {
    setShoppingLoading(true)
    fetch(`${API_BASE}/api/shopping`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: ApiShoppingItem[]) => setShoppingItems(data))
      .catch(() => setShoppingError(true))
      .finally(() => setShoppingLoading(false))
  }, [])

  const totalCount   = shoppingItems.length
  const checkedCount = shoppingItems.filter(i => i.checked).length
  const displayItems = [
    ...shoppingItems.filter(i => !i.checked),
    ...shoppingItems.filter(i =>  i.checked),
  ].slice(0, 6)

  const isOverdue = (dueDate?: string) => !!dueDate && dueDate < today

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h2 className={styles.greeting}>{getGreeting()}, Anton</h2>
          <p className={styles.date}>{formatDate()}</p>
        </div>
        <AvatarBadge initials="A" color="#5B6AF0" online size="lg" />
      </header>

      <div className={styles.grid}>
        <DashboardWidget
          icon={<Calendar size={18} />}
          title="Kalender"
          viewAllTo="/kalender"
        >
          {eventsLoading ? (
            <p className={styles.loadingText}>Lädt…</p>
          ) : eventsError ? (
            <p className={styles.errorText}>Termine konnten nicht geladen werden</p>
          ) : events.length === 0 ? (
            <p className={styles.emptyWidget}>Keine anstehenden Termine</p>
          ) : (
            <ul className={styles.eventList}>
              {events.map(ev => (
                <li key={ev.id} className={styles.eventItem}>
                  <div className={styles.eventMeta}>
                    <span className={styles.eventDate}>{formatEventDate(ev.start_dt)}</span>
                    <span className={styles.eventTime}>{formatEventTime(ev.start_dt)}</span>
                  </div>
                  <span className={styles.eventTitle}>{ev.title}</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>

        <DashboardWidget
          icon={<CheckSquare size={18} />}
          title="Aufgaben"
          viewAllTo="/aufgaben"
        >
          {tasksLoading ? (
            <p className={styles.loadingText}>Lädt…</p>
          ) : tasksError ? (
            <p className={styles.errorText}>Aufgaben konnten nicht geladen werden</p>
          ) : tasks.length === 0 ? (
            <p className={styles.emptyWidget}>Keine offenen Aufgaben</p>
          ) : (
            <ul className={styles.taskList}>
              {tasks.map(task => (
                <li key={task.id} className={styles.taskItem}>
                  {task.assignee_initials && task.assignee_color && (
                    <AvatarBadge
                      initials={task.assignee_initials}
                      color={task.assignee_color}
                      size="sm"
                    />
                  )}
                  <span className={`${styles.taskTitle} ${isOverdue(task.due_date) ? styles.taskOverdue : ''}`}>
                    {task.title}
                  </span>
                  {isOverdue(task.due_date) && (
                    <span className={styles.urgentBadge}>Überfällig</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>

        <DashboardWidget
          icon={<ShoppingCart size={18} />}
          title="Wocheneinkauf"
          viewAllTo="/einkauf"
          className={styles.wideWidget}
        >
          {shoppingLoading ? (
            <p className={styles.loadingText}>Lädt…</p>
          ) : shoppingError ? (
            <p className={styles.errorText}>Einkaufsliste konnte nicht geladen werden</p>
          ) : totalCount === 0 ? (
            <p className={styles.emptyWidget}>Keine Artikel in der Einkaufsliste</p>
          ) : (
            <>
              <div className={styles.progress}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                />
              </div>
              <p className={styles.progressLabel}>
                {checkedCount} von {totalCount} erledigt
              </p>
              <ul className={styles.shoppingList}>
                {displayItems.map(item => (
                  <li key={item.id} className={`${styles.shoppingItem} ${item.checked ? styles.itemChecked : ''}`}>
                    <span className={styles.checkbox}>{item.checked ? '✓' : ''}</span>
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DashboardWidget>
      </div>
    </div>
  )
}
