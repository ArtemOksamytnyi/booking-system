import { apiFetch } from './client'
import { buildHotelSlug } from './properties'

type ApiBooking = {
  id: number
  startDatetime: string
  endDatetime: string
  totalPrice: string | number
  serviceFee: string | number
  ownerIncome: string | number
  bookingStatus: string
  paymentStatus: string
  createdAt: string
  payments: Array<{
    id: number
    amount: string | number
    paymentStatus: string
  }>
  room: {
    id: number
    name: string
    pricePerUnit: string | number
    property: {
      id: number
      name: string
      address: string
      photoUrl?: string | null
      ownerId: number
    }
  }
  renter?: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
}

export type DashboardBooking = {
  id: string
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
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded'
  isInactive: boolean
  paidAmount: number
  remainingAmount: number
  renterName?: string
  renterEmail?: string
}

const statusOrder = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: 3,
} as const

const daysBetween = (checkIn: string, checkOut: string) => {
  const start = new Date(`${checkIn}T00:00:00`).getTime()
  const end = new Date(`${checkOut}T00:00:00`).getTime()
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

const mapBooking = (booking: ApiBooking): DashboardBooking => {
  const checkIn = booking.startDatetime.slice(0, 10)
  const checkOut = booking.endDatetime.slice(0, 10)
  const days = daysBetween(checkIn, checkOut)
  const total = Number(booking.totalPrice)
  const paidAmount = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const remainingAmount = Math.max(total - paidAmount, 0)

  return {
    id: String(booking.id),
    propertyId: booking.room.property.id,
    hotelSlug: buildHotelSlug(booking.room.property.id, booking.room.property.name),
    roomId: booking.room.id,
    roomName: booking.room.name,
    hotelName: booking.room.property.name,
    location: booking.room.property.address,
    image:
      booking.room.property.photoUrl ??
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
    checkIn,
    checkOut,
    guests: 1,
    days,
    roomPricePerNight: Number(booking.room.pricePerUnit),
    total,
    initialPayment: Math.round(total / 2),
    createdAt: booking.createdAt,
    bookingStatus: booking.bookingStatus.toLowerCase() as DashboardBooking['bookingStatus'],
    paymentStatus: booking.paymentStatus.toLowerCase() as DashboardBooking['paymentStatus'],
    isInactive: ['completed', 'cancelled'].includes(booking.bookingStatus.toLowerCase()),
    paidAmount,
    remainingAmount,
    renterName: booking.renter ? `${booking.renter.firstName} ${booking.renter.lastName}`.trim() : undefined,
    renterEmail: booking.renter?.email,
  }
}

export const sortDashboardBookings = (bookings: DashboardBooking[]) =>
  bookings
    .slice()
    .sort((left, right) => {
      if (left.isInactive !== right.isInactive) {
        return left.isInactive ? 1 : -1
      }

      const leftStatusOrder = statusOrder[left.bookingStatus]
      const rightStatusOrder = statusOrder[right.bookingStatus]

      if (leftStatusOrder !== rightStatusOrder) {
        return leftStatusOrder - rightStatusOrder
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })

export const getMyBookings = async () => {
  const bookings = await apiFetch<ApiBooking[]>('/bookings')
  return sortDashboardBookings(bookings.map(mapBooking))
}

export const getOwnerBookings = async () => {
  const bookings = await apiFetch<ApiBooking[]>('/bookings?scope=owner')
  return sortDashboardBookings(bookings.map(mapBooking))
}

export const getAllBookings = async () => {
  const bookings = await apiFetch<ApiBooking[]>('/bookings?scope=all')
  return sortDashboardBookings(bookings.map(mapBooking))
}

export const createBookingRequest = async (payload: {
  roomId: number
  startDatetime: string
  endDatetime: string
}) =>
  apiFetch<ApiBooking>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateBookingStatusRequest = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED') =>
  apiFetch<ApiBooking>(`/bookings/${bookingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
