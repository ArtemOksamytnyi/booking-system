import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type BookingDraft = {
  propertyId: number
  hotelSlug: string
  hotelName: string
  location: string
  image: string
  roomId: number
  roomName: string
  roomPricePerNight: number
  checkIn: string
  checkOut: string
  guests: number
}

export type BookingRecord = {
  id: string
  userEmail: string
  propertyId: number
  hotelSlug: string
  roomId: number
  roomName: string
  hotelName: string
  location: string
  image: string
  checkIn: string
  checkOut: string
  guests: number
  days: number
  roomPricePerNight: number
  total: number
  initialPayment: number
  createdAt: string
}

type BookingState = {
  draft: BookingDraft | null
  bookings: BookingRecord[]
  startDraft: (draft: BookingDraft) => void
  clearDraft: () => void
  updateDraft: (partial: Partial<BookingDraft>) => void
  finalizeBooking: (userEmail: string) => BookingRecord | null
  getUserBookings: (userEmail: string) => BookingRecord[]
  getAllBookings: () => BookingRecord[]
}

const parseDate = (date: string) => new Date(`${date}T00:00:00`)

const daysBetween = (checkIn: string, checkOut: string) => {
  const start = parseDate(checkIn)
  const end = parseDate(checkOut)
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 1)
}

export const formatDateRange = (checkIn: string, checkOut: string) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  })

  return `${formatter.format(parseDate(checkIn))} - ${formatter.format(parseDate(checkOut))}`
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      draft: null,
      bookings: [],
      startDraft: (draft) => {
        set({ draft })
      },
      clearDraft: () => {
        set({ draft: null })
      },
      updateDraft: (partial) => {
        set((state) => {
          if (!state.draft) {
            return state
          }

          return {
            draft: { ...state.draft, ...partial },
          }
        })
      },
      finalizeBooking: (userEmail) => {
        const { draft, bookings } = get()
        if (!draft) {
          return null
        }

        const days = daysBetween(draft.checkIn, draft.checkOut)
        const total = days * draft.roomPricePerNight
        const initialPayment = Math.round(total / 2)

        const bookingRecord: BookingRecord = {
          id: `booking_${Date.now()}`,
          userEmail,
          propertyId: draft.propertyId,
          hotelSlug: draft.hotelSlug,
          roomId: draft.roomId,
          roomName: draft.roomName,
          hotelName: draft.hotelName,
          location: draft.location,
          image: draft.image,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          guests: draft.guests,
          days,
          roomPricePerNight: draft.roomPricePerNight,
          total,
          initialPayment,
          createdAt: new Date().toISOString(),
        }

        set({
          bookings: [bookingRecord, ...bookings],
          draft: null,
        })

        return bookingRecord
      },
      getUserBookings: (userEmail) =>
        get().bookings.filter((item) => item.userEmail.toLowerCase() === userEmail.toLowerCase()),
      getAllBookings: () => get().bookings,
    }),
    {
      name: 'lankastay_booking_store_v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        draft: state.draft,
        bookings: state.bookings,
      }),
    },
  ),
)
