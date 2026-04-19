import { formatDateRange, useBookingStore } from '../store/bookingStore'
import type { BookingDraft, BookingRecord } from '../store/bookingStore'

type BookingContextValue = {
  draft: BookingDraft | null
  bookings: BookingRecord[]
  startDraft: (draft: BookingDraft) => void
  clearDraft: () => void
  updateDraft: (partial: Partial<BookingDraft>) => void
  finalizeBooking: (userEmail: string) => BookingRecord | null
  getUserBookings: (userEmail: string) => BookingRecord[]
}

export const useBooking = (): BookingContextValue => {
  const draft = useBookingStore((state) => state.draft)
  const bookings = useBookingStore((state) => state.bookings)
  const startDraft = useBookingStore((state) => state.startDraft)
  const clearDraft = useBookingStore((state) => state.clearDraft)
  const updateDraft = useBookingStore((state) => state.updateDraft)
  const finalizeBooking = useBookingStore((state) => state.finalizeBooking)
  const getUserBookings = useBookingStore((state) => state.getUserBookings)

  return {
    draft,
    bookings,
    startDraft,
    clearDraft,
    updateDraft,
    finalizeBooking,
    getUserBookings,
  }
}

export { formatDateRange }
export type { BookingDraft, BookingRecord }
