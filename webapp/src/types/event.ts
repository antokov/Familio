export interface Attendee {
  initials: string
  color: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDt: string
  endDt: string
  attendees: Attendee[]
  allDay: boolean
  createdAt: string
}

export interface CreateEventInput {
  title: string
  description?: string
  startDt: string
  endDt: string
  attendees: Attendee[]
  allDay: boolean
}
