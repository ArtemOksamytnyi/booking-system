export type HighlightCard = {
  name: string
  location: string
  price: string
  image: string
  tall?: boolean
}

export type HotelCategory = 'Beach' | 'Mountain' | 'City' | 'Family' | 'Business' | 'Luxury'

export type Hotel = {
  slug: string
  name: string
  location: string
  city: string
  category: HotelCategory
  image: string
  gallery: string[]
  pricePerNight: number
  rating: number
  reviews: number
  description: string
  amenities: string[]
  rooms: HotelRoom[]
  tag?: string
}

export type HotelRoomType = 'звичайна' | 'люкс' | 'супер люкс'

export type HotelRoom = {
  id: string
  name: HotelRoomType
  capacity: number
  pricePerNight: number
  isActive: boolean
  unavailableRanges: Array<{
    start: string
    end: string
  }>
}

export type RoomCard = {
  name: string
  type: string
  guests: string
  image: string
  price: string
}

const createRooms = (hotelSlug: string, basePrice: number, seed = 0): HotelRoom[] => [
  {
    id: `${hotelSlug}-standard`,
    name: 'звичайна',
    capacity: 2,
    pricePerNight: basePrice,
    isActive: true,
    unavailableRanges: [
      { start: '2026-05-14', end: '2026-05-17' },
      { start: `2026-06-${String(6 + seed).padStart(2, '0')}`, end: `2026-06-${String(8 + seed).padStart(2, '0')}` },
    ],
  },
  {
    id: `${hotelSlug}-lux`,
    name: 'люкс',
    capacity: 3,
    pricePerNight: basePrice + 35,
    isActive: true,
    unavailableRanges: [{ start: `2026-06-${String(12 + seed).padStart(2, '0')}`, end: `2026-06-${String(15 + seed).padStart(2, '0')}` }],
  },
  {
    id: `${hotelSlug}-super-lux`,
    name: 'супер люкс',
    capacity: 5,
    pricePerNight: basePrice + 80,
    isActive: true,
    unavailableRanges: [{ start: `2026-05-${String(21 + seed).padStart(2, '0')}`, end: `2026-05-${String(24 + seed).padStart(2, '0')}` }],
  },
]

export const highlights: HighlightCard[] = [
  {
    name: 'Blue Origin Fams',
    location: 'Galle, Sri Lanka',
    price: '$50 per night',
    image:
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80',
    tall: true,
  },
  {
    name: 'Ocean Land',
    location: 'Trincomalee, Sri Lanka',
    price: '$22 per night',
    image:
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Stark House',
    location: 'Dehiwala, Sri Lanka',
    price: '$856 per night',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Vinna Vill',
    location: 'Beruwala, Sri Lanka',
    price: '$62 per night',
    image:
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Bobox',
    location: 'Kandy, Sri Lanka',
    price: '$72 per night',
    image:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
  },
]

export const hotels: Hotel[] = [
  {
    slug: 'shangri-la-colombo',
    name: 'Shangri-La',
    location: 'Colombo, Sri Lanka',
    city: 'Colombo',
    category: 'Luxury',
    tag: 'Popular Choice',
    image:
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 180,
    rating: 4.9,
    reviews: 348,
    description:
      'A premium city hotel with skyline views, spa facilities, and quick access to business districts.',
    amenities: ['Infinity Pool', 'Airport Transfer', 'Free Breakfast', 'Spa', 'Wi-Fi'],
    rooms: createRooms('shangri-la-colombo', 180, 0),
  },
  {
    slug: 'top-view-hikkaduwa',
    name: 'Top View',
    location: 'Hikkaduwa, Sri Lanka',
    city: 'Hikkaduwa',
    category: 'Beach',
    image:
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501117716987-c8e1ecb21066?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 120,
    rating: 4.7,
    reviews: 214,
    description: 'A bright coastal resort with ocean-facing suites and direct beach access.',
    amenities: ['Beachfront', 'Surf Lessons', 'Restaurant', 'Wi-Fi'],
    rooms: createRooms('top-view-hikkaduwa', 120, 1),
  },
  {
    slug: 'green-villa-kandy',
    name: 'Green Villa',
    location: 'Kandy, Sri Lanka',
    city: 'Kandy',
    category: 'Mountain',
    image:
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445991842772-097fea258e7b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 94,
    rating: 4.6,
    reviews: 167,
    description: 'A quiet garden villa in the hills with panoramic terraces and local cuisine.',
    amenities: ['Mountain View', 'Garden', 'Room Service', 'Free Parking'],
    rooms: createRooms('green-villa-kandy', 94, 2),
  },
  {
    slug: 'wodden-pit-ambalangode',
    name: 'Wodden Pit',
    location: 'Ambalangode, Sri Lanka',
    city: 'Ambalangode',
    category: 'Family',
    image:
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1464890100898-a385f744067f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 136,
    rating: 4.8,
    reviews: 283,
    description: 'Family-focused villas with wide living spaces, kid-safe zones, and private kitchens.',
    amenities: ['Family Rooms', 'Kids Area', 'Kitchen', 'Pool'],
    rooms: createRooms('wodden-pit-ambalangode', 136, 3),
  },
  {
    slug: 'boutiqe-kandy',
    name: 'Boutiqe',
    location: 'Kandy, Sri Lanka',
    city: 'Kandy',
    category: 'Business',
    image:
      'https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 110,
    rating: 4.5,
    reviews: 122,
    description: 'A boutique stay with modern interiors, dedicated work lounge, and fast internet.',
    amenities: ['Cowork Area', 'Coffee Bar', 'Fast Wi-Fi', 'Meeting Room'],
    rooms: createRooms('boutiqe-kandy', 110, 4),
  },
  {
    slug: 'modern-nuwerliya',
    name: 'Modern',
    location: 'Nuwerliya, Sri Lanka',
    city: 'Nuwerliya',
    category: 'Mountain',
    image:
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 102,
    rating: 4.4,
    reviews: 98,
    description: 'Minimalist apartments with strong heating and scenic tea-country views.',
    amenities: ['Heated Rooms', 'Mountain Deck', 'Laundry', 'Wi-Fi'],
    rooms: createRooms('modern-nuwerliya', 102, 5),
  },
  {
    slug: 'silver-rain-dehiwala',
    name: 'Silver Rain',
    location: 'Dehiwala, Sri Lanka',
    city: 'Dehiwala',
    category: 'City',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 86,
    rating: 4.3,
    reviews: 74,
    description: 'City apartments with smooth check-in and excellent access to restaurants and transit.',
    amenities: ['Self Check-in', 'Balcony', 'Kitchenette', 'Wi-Fi'],
    rooms: createRooms('silver-rain-dehiwala', 86, 6),
  },
  {
    slug: 'cashville-ampara',
    name: 'Cashville',
    location: 'Ampara, Sri Lanka',
    city: 'Ampara',
    category: 'Luxury',
    tag: 'Popular Choice',
    image:
      'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566669437685-e6f5c3f18608?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 165,
    rating: 4.8,
    reviews: 190,
    description:
      'Signature villa complex with private courtyards, chef service, and high-end interiors.',
    amenities: ['Private Chef', 'Concierge', 'Pool', 'Airport Pickup'],
    rooms: createRooms('cashville-ampara', 165, 7),
  },
  {
    slug: 'ocean-land-trincomalee',
    name: 'Ocean Land',
    location: 'Trincomalee, Sri Lanka',
    city: 'Trincomalee',
    category: 'Beach',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 132,
    rating: 4.7,
    reviews: 201,
    description: 'Oceanfront suites with private decks and sunset dining.',
    amenities: ['Beachfront', 'Sunset Deck', 'Breakfast', 'Wi-Fi'],
    rooms: createRooms('ocean-land-trincomalee', 132, 8),
  },
  {
    slug: 'stark-house-dehiwala',
    name: 'Stark House',
    location: 'Dehiwala, Sri Lanka',
    city: 'Dehiwala',
    category: 'City',
    image:
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 145,
    rating: 4.6,
    reviews: 133,
    description: 'Elegant city house with conference zones and premium dining.',
    amenities: ['Conference Room', 'Restaurant', 'Gym', 'Wi-Fi'],
    rooms: createRooms('stark-house-dehiwala', 145, 9),
  },
  {
    slug: 'vinna-vill-beruwala',
    name: 'Vinna Vill',
    location: 'Beruwala, Sri Lanka',
    city: 'Beruwala',
    category: 'Family',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613977257593-487ecd136cc3?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 98,
    rating: 4.4,
    reviews: 84,
    description: 'Relaxed family villas with tropical gardens and game spaces.',
    amenities: ['Family Zone', 'Garden', 'Breakfast', 'Pool'],
    rooms: createRooms('vinna-vill-beruwala', 98, 10),
  },
  {
    slug: 'sunrise-reef-galle',
    name: 'Sunrise Reef',
    location: 'Galle, Sri Lanka',
    city: 'Galle',
    category: 'Beach',
    image:
      'https://images.unsplash.com/photo-1470214203634-e436a8848e23?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1470214203634-e436a8848e23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1468824357306-a439d58ccb1c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 154,
    rating: 4.8,
    reviews: 277,
    description: 'Modern reef-view hotel with private beach service.',
    amenities: ['Private Beach', 'Spa', 'Pool Bar', 'Wi-Fi'],
    rooms: createRooms('sunrise-reef-galle', 154, 11),
  },
  {
    slug: 'harbor-one-colombo',
    name: 'Harbor One',
    location: 'Colombo, Sri Lanka',
    city: 'Colombo',
    category: 'Business',
    image:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 127,
    rating: 4.5,
    reviews: 152,
    description: 'Business-friendly hotel with harbor views and fast check-in.',
    amenities: ['Meeting Room', 'Airport Shuttle', 'Breakfast', 'Wi-Fi'],
    rooms: createRooms('harbor-one-colombo', 127, 12),
  },
  {
    slug: 'hill-crown-ella',
    name: 'Hill Crown',
    location: 'Ella, Sri Lanka',
    city: 'Ella',
    category: 'Mountain',
    image:
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 115,
    rating: 4.7,
    reviews: 171,
    description: 'Mountain property with iconic valley viewpoints.',
    amenities: ['Valley View', 'Hiking Tours', 'Breakfast', 'Fireplace'],
    rooms: createRooms('hill-crown-ella', 115, 13),
  },
  {
    slug: 'azure-retreat-matara',
    name: 'Azure Retreat',
    location: 'Matara, Sri Lanka',
    city: 'Matara',
    category: 'Luxury',
    image:
      'https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 198,
    rating: 4.9,
    reviews: 325,
    description: 'Luxury retreat with private butler and signature experiences.',
    amenities: ['Butler Service', 'Private Pool', 'Fine Dining', 'Spa'],
    rooms: createRooms('azure-retreat-matara', 198, 14),
  },
  {
    slug: 'city-nest-kotte',
    name: 'City Nest',
    location: 'Kotte, Sri Lanka',
    city: 'Kotte',
    category: 'City',
    image:
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613575831056-0acd5da8f085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566669437685-e6f5c3f18608?auto=format&fit=crop&w=1200&q=80',
    ],
    pricePerNight: 92,
    rating: 4.2,
    reviews: 65,
    description: 'Compact modern rooms for short city stays and work trips.',
    amenities: ['Smart Lock', 'Fast Wi-Fi', 'Workspace', 'Laundry'],
    rooms: createRooms('city-nest-kotte', 92, 15),
  },
]

export const rooms: RoomCard[] = [
  {
    name: 'Honeymoon Suite',
    type: 'Ocean view suite',
    guests: '2 Guests',
    price: '$120 / night',
    image:
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Family Deluxe',
    type: '2 Bedroom villa',
    guests: '4 Guests',
    price: '$210 / night',
    image:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'City Minimal',
    type: 'Modern apartment',
    guests: '2 Guests',
    price: '$88 / night',
    image:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Forest Cabin',
    type: 'Nature retreat',
    guests: '3 Guests',
    price: '$95 / night',
    image:
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Skyline Loft',
    type: 'High-rise studio',
    guests: '2 Guests',
    price: '$115 / night',
    image:
      'https://images.unsplash.com/photo-1486304873000-235643847519?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Pool Bungalow',
    type: 'Private pool villa',
    guests: '5 Guests',
    price: '$260 / night',
    image:
      'https://images.unsplash.com/photo-1613553428499-0eaae883f0f8?auto=format&fit=crop&w=1200&q=80',
  },
]
