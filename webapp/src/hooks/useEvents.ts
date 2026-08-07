import { useState, useCallback } from 'react'
import type { CalendarEvent, CreateEventInput } from '../types/event'
import { API_BASE } from '../api/config'

function toSnakeCase(input: Partial<CreateEventInput>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (input.title !== undefined) result['title'] = input.title
  if (input.description !== undefined) result['description'] = input.description ?? null
  if (input.startDt !== undefined) result['start_dt'] = input.startDt
  if (input.endDt !== undefined) result['end_dt'] = input.endDt
  if (input.attendees !== undefined) result['attendees'] = input.attendees
  return result
}

function fromApi(raw: Record<string, unknown>): CalendarEvent {
  return {
    id: raw['id'] as string,
    title: raw['title'] as string,
    description: raw['description'] as string | undefined,
    startDt: raw['start_dt'] as string,
    endDt: raw['end_dt'] as string,
    attendees: (raw['attendees'] as CalendarEvent['attendees']) ?? [],
    createdAt: raw['created_at'] as string,
  }
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async (from: string, to: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/events?from=${from}&to=${to}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Record<string, unknown>[]
      setEvents(data.map(fromApi))
    } catch {
      setError('Kalender konnte nicht geladen werden')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createEvent = useCallback(async (input: CreateEventInput): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(input)),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      setEvents(prev => [...prev, fromApi(raw)])
      return true
    } catch {
      return false
    }
  }, [])

  const updateEvent = useCallback(async (id: string, input: CreateEventInput): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(input)),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      const updated = fromApi(raw)
      setEvents(prev => prev.map(ev => ev.id === id ? updated : ev))
      return true
    } catch {
      return false
    }
  }, [])

  return { events, loading, error, fetchEvents, createEvent, updateEvent }
}
