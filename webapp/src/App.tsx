import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell/AppShell'

const DashboardPage  = lazy(() => import('./pages/DashboardPage'))
const CalendarPage   = lazy(() => import('./pages/CalendarPage'))
const TasksPage      = lazy(() => import('./pages/TasksPage'))
const ShoppingPage   = lazy(() => import('./pages/ShoppingPage'))
const DocumentsPage  = lazy(() => import('./pages/DocumentsPage'))
const SettingsPage   = lazy(() => import('./pages/SettingsPage'))

export function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tasks"    element={<TasksPage />} />
          <Route path="shopping"  element={<ShoppingPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
