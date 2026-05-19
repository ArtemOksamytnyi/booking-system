import { apiFetch } from './client'
import type { HighlightCard, Hotel, HotelRoom, PropertyCategory } from '../types/hotel'

type ApiProperty = {
  id: number
  name: string
  address: string
  description: string | null
  rating: string | number | null
  photoUrl: string | null
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  propertyType: {
    name: PropertyCategory
  }
  rooms: Array<{
    id: number
    name: string
    capacity: number
    pricePerUnit: string | number
    isActive: boolean
  }>
  reviews?: Array<{
    rating: number
  }>
}

type ApiAvailableRooms = {
  property: {
    id: number
    name: string
    address: string
    photoUrl?: string | null
  }
  rooms: Array<{
    id: number
    name: string
    capacity: number
    pricePerUnit: string | number
    isActive: boolean
  }>
}

export type PropertyFilters = {
  search?: string
  category?: string
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  ownerEmail?: string
}

export type OwnerProperty = Hotel & {
  verificationStatus: 'pending' | 'approved' | 'rejected'
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const extractCityFromAddress = (address: string) => address.split(',')[0]?.trim() || address

const mapRoom = (room: ApiProperty['rooms'][number] | ApiAvailableRooms['rooms'][number]): HotelRoom => ({
  id: room.id,
  name: room.name,
  capacity: room.capacity,
  pricePerNight: Number(room.pricePerUnit),
  isActive: room.isActive,
})

export const buildHotelSlug = (id: number, name: string) => `${id}-${slugify(name)}`

export const getPropertyIdFromSlug = (slug: string) => {
  const id = Number(slug.split('-')[0])
  return Number.isFinite(id) ? id : null
}

export const mapPropertyToHotel = (property: ApiProperty): Hotel => {
  const rooms = property.rooms.map(mapRoom)
  const cheapestRoom = rooms.reduce((lowest, room) => {
    if (!lowest || room.pricePerNight < lowest.pricePerNight) {
      return room
    }

    return lowest
  }, rooms[0])

  return {
    id: property.id,
    slug: buildHotelSlug(property.id, property.name),
    name: property.name,
    location: property.address,
    city: extractCityFromAddress(property.address),
    category: property.propertyType.name,
    image:
      property.photoUrl ??
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
    gallery: property.photoUrl ? [property.photoUrl] : [],
    pricePerNight: cheapestRoom?.pricePerNight ?? 0,
    rating: Number(property.rating ?? 0),
    reviews: property.reviews?.length ?? 0,
    description: property.description ?? 'No description provided yet.',
    amenities: [],
    rooms,
  }
}

export const mapPropertyToOwnerHotel = (property: ApiProperty): OwnerProperty => ({
  ...mapPropertyToHotel(property),
  verificationStatus: (property.verificationStatus ?? 'PENDING').toLowerCase() as OwnerProperty['verificationStatus'],
})

export const getHighlightsFromHotels = (hotels: Hotel[]): HighlightCard[] =>
  hotels
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map((hotel, index) => ({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      price: `$${hotel.pricePerNight} per night`,
      image: hotel.image,
      tall: index === 0,
    }))

const buildQueryString = (filters: PropertyFilters) => {
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'All') {
      return
    }

    searchParams.set(key, String(value))
  })

  const serialized = searchParams.toString()
  return serialized ? `?${serialized}` : ''
}

export const getProperties = async (filters: PropertyFilters = {}) => {
  const properties = await apiFetch<ApiProperty[]>(`/properties${buildQueryString(filters)}`)
  return properties.map(mapPropertyToHotel)
}

export const getPropertyById = async (id: number) => {
  const property = await apiFetch<ApiProperty>(`/properties/${id}`)
  return mapPropertyToHotel(property)
}

export const getOwnerProperties = async (ownerEmail: string) => {
  const properties = await apiFetch<ApiProperty[]>(
    `/properties${buildQueryString({
      ownerEmail,
    })}`,
  )

  return properties.map(mapPropertyToOwnerHotel)
}

export const createOwnerProperty = async (payload: {
  name: string
  address: string
  description?: string
  photoUrl?: string
  propertyTypeName?: 'hotel' | 'villa' | 'apartment' | 'resort'
}) => {
  const property = await apiFetch<ApiProperty>('/properties/owner', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      propertyTypeName: payload.propertyTypeName ?? 'hotel',
    }),
  })

  return mapPropertyToOwnerHotel(property)
}

export const createRoomForProperty = async (
  propertyId: number,
  payload: {
    name: string
    capacity: number
    pricePerUnit: number
    isActive: boolean
  },
) =>
  apiFetch(`/properties/${propertyId}/rooms`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const reviewPropertyVerificationStatus = async (payload: {
  ownerEmail: string
  propertyName: string
  propertyId?: number
  status: 'APPROVED' | 'REJECTED'
}) =>
  apiFetch('/properties/verification-status', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

export const getAvailableRooms = async (
  propertyId: number,
  filters: Required<Pick<PropertyFilters, 'checkIn' | 'checkOut' | 'guests'>>,
) => {
  const searchParams = new URLSearchParams({
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
    guests: String(filters.guests),
  })

  const response = await apiFetch<ApiAvailableRooms>(
    `/properties/${propertyId}/available-rooms?${searchParams.toString()}`,
  )

  return {
    property: response.property,
    rooms: response.rooms.map(mapRoom),
  }
}
