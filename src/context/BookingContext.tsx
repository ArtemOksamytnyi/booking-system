import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { hotels } from '../data/hotels'

export type BookingDraft = {
  hotelSlug: string
  checkIn: string
  checkOut: string
  guests: number
}

export type BookingRecord = {
  id: string
  userEmail: string
  hotelSlug: string
  hotelName: string
  location: string
  image: string
  checkIn: string
  checkOut: string
  guests: number
  days: number
  total: number
  initialPayment: number
  createdAt: string
}

type BookingContextValue = {
  draft: BookingDraft | null
  bookings: BookingRecord[]
  startDraft: (draft: BookingDraft) => void
  clearDraft: () => void
  updateDraft: (partial: Partial<BookingDraft>) => void
  finalizeBooking: (userEmail: string) => BookingRecord | null
  getUserBookings: (userEmail: string) => BookingRecord[]
}

const DRAFT_KEY = 'lankastay_booking_draft_v1'
const BOOKINGS_KEY = 'lankastay_bookings_v1'

const BookingContext = createContext<BookingContextValue | null>(null)

const parseDate = (date: string) => new Date(`${date}T00:00:00`)

const daysBetween = (checkIn: string, checkOut: string) => {
  const start = parseDate(checkIn)
  const end = parseDate(checkOut)
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 1)
}

function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft | null>(null)
  const [bookings, setBookings] = useState<BookingRecord[]>([])

  useEffect(() => {
    const rawDraft = localStorage.getItem(DRAFT_KEY)
    const rawBookings = localStorage.getItem(BOOKINGS_KEY)

    if (rawDraft) {
      try {
        setDraft(JSON.parse(rawDraft) as BookingDraft)
      } catch {
        setDraft(null)
      }
    }

    if (rawBookings) {
      try {
        setBookings(JSON.parse(rawBookings) as BookingRecord[])
      } catch {
        setBookings([])
      }
    }
  }, [])

  const startDraft = (nextDraft: BookingDraft) => {
    setDraft(nextDraft)
    localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft))
  }

  const clearDraft = () => {
    setDraft(null)
    localStorage.removeItem(DRAFT_KEY)
  }

  const updateDraft = (partial: Partial<BookingDraft>) => {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const next = { ...current, ...partial }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
      return next
    })
  }

  const finalizeBooking = (userEmail: string) => {
    if (!draft) {
      return null
    }

    const hotel = hotels.find((item) => item.slug === draft.hotelSlug)
    if (!hotel) {
      return null
    }

    const days = daysBetween(draft.checkIn, draft.checkOut)
    const total = days * hotel.pricePerNight
    const initialPayment = Math.round(total / 2)

    const bookingRecord: BookingRecord = {
      id: `booking_${Date.now()}`,
      userEmail,
      hotelSlug: hotel.slug,
      hotelName: hotel.name,
      location: hotel.location,
      image: hotel.image,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      guests: draft.guests,
      days,
      total,
      initialPayment,
      createdAt: new Date().toISOString(),
    }

    const nextBookings = [bookingRecord, ...bookings]
    setBookings(nextBookings)
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings))
    clearDraft()
    return bookingRecord
  }

  const getUserBookings = (userEmail: string) =>
    bookings.filter((item) => item.userEmail.toLowerCase() === userEmail.toLowerCase())

  const value = useMemo(
    () => ({
      draft,
      bookings,
      startDraft,
      clearDraft,
      updateDraft,
      finalizeBooking,
      getUserBookings,
    }),
    [draft, bookings],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider')
  }

  return context
}

export const formatDateRange = (checkIn: string, checkOut: string) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  })

  return `${formatter.format(parseDate(checkIn))} - ${formatter.format(parseDate(checkOut))}`
}

export default BookingProvider
