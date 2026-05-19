export type PropertyCategory = string

export type HotelRoom = {
  id: number
  name: string
  capacity: number
  pricePerNight: number
  isActive: boolean
}

export type Hotel = {
  id: number
  slug: string
  name: string
  location: string
  city: string
  category: PropertyCategory
  image: string
  gallery: string[]
  pricePerNight: number
  rating: number
  reviews: number
  description: string
  amenities: string[]
  rooms: HotelRoom[]
  reviewItems?: Array<{
    id: number
    rating: number
    comment: string
    authorName: string
    createdAt?: string
  }>
}

export type HighlightCard = {
  id: number
  name: string
  location: string
  price: string
  image: string
  tall?: boolean
}
