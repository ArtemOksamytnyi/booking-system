import type { Hotel, HotelRoom } from '../data/hotels'

const parseDate = (value: string) => new Date(`${value}T00:00:00`)

const rangesOverlap = (
  checkIn: string,
  checkOut: string,
  blockedStart: string,
  blockedEnd: string,
) => {
  const start = parseDate(checkIn).getTime()
  const end = parseDate(checkOut).getTime()
  const blockedRangeStart = parseDate(blockedStart).getTime()
  const blockedRangeEnd = parseDate(blockedEnd).getTime()

  return start < blockedRangeEnd && end > blockedRangeStart
}

export const isRoomAvailable = (
  room: HotelRoom,
  checkIn: string,
  checkOut: string,
  guests: number,
) => {
  if (!room.isActive || guests > room.capacity || !checkIn || !checkOut) {
    return false
  }

  return !room.unavailableRanges.some((range) =>
    rangesOverlap(checkIn, checkOut, range.start, range.end),
  )
}

export const getAvailableRooms = (
  hotel: Hotel,
  checkIn: string,
  checkOut: string,
  guests: number,
) => hotel.rooms.filter((room) => isRoomAvailable(room, checkIn, checkOut, guests))

export const hotelHasAvailability = (
  hotel: Hotel,
  checkIn: string,
  checkOut: string,
  guests: number,
) => {
  if (!checkIn || !checkOut) {
    return true
  }

  return getAvailableRooms(hotel, checkIn, checkOut, guests).length > 0
}
