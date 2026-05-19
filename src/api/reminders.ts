import { apiFetch } from './client'

type ApiReminder = {
  id: number
  remindAt: string
  isSent: boolean
  booking: {
    id: number
    endDatetime: string
    bookingStatus: string
    room: {
      name: string
      property: {
        id: number
        name: string
        address: string
      }
    }
  }
}

export type ReminderDto = {
  id: string
  remindAt: string
  isSent: boolean
  bookingId: string
  bookingStatus: string
  hotelName: string
  roomName: string
  location: string
  checkOut: string
}

const mapReminder = (reminder: ApiReminder): ReminderDto => ({
  id: String(reminder.id),
  remindAt: reminder.remindAt,
  isSent: reminder.isSent,
  bookingId: String(reminder.booking.id),
  bookingStatus: reminder.booking.bookingStatus.toLowerCase(),
  hotelName: reminder.booking.room.property.name,
  roomName: reminder.booking.room.name,
  location: reminder.booking.room.property.address,
  checkOut: reminder.booking.endDatetime.slice(0, 10),
})

export const getMyReminders = async () => {
  const reminders = await apiFetch<ApiReminder[]>('/reminders')
  return reminders.map(mapReminder)
}
