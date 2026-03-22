export type EventColor = 'amber' | 'sage' | 'sky' | 'rose' | 'violet' | 'orange'

export type CalendarView = 'year' | 'month' | 'day'

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  is_all_day: boolean
  color: EventColor
  location: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  username: string
  avatar_url: string | null
  bio: string | null
  timezone: string
  is_public: boolean
  created_at: string
}

export interface EventFormData {
  title: string
  description: string
  start_time: string
  end_time: string
  is_all_day: boolean
  color: EventColor
  location: string
  is_public: boolean
}

export interface CalendarDate {
  year: number
  month: number
  day: number
}

export interface EventAttachment {
  id: string
  event_id: string
  file_url: string
  file_name: string
  signed_url?: string | null
}
