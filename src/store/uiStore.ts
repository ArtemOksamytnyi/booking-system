import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Hotel, PropertyCategory } from '../types/hotel'

export type AuthModalMode = 'login' | 'register'
export type UserDashboardTab = 'dashboard' | 'bookings' | 'reminders' | 'refunds' | 'messages' | 'help' | 'settings'
export type AdminDashboardTab =
  | 'dashboard'
  | 'users'
  | 'owners'
  | 'bookings'
  | 'reminders'
  | 'refunds'
  | 'messages'
  | 'help'
  | 'settings'
export type OwnerDashboardTab = 'dashboard' | 'hotels' | 'bookings' | 'reminders' | 'messages' | 'settings'

type HotelFilters = {
  search: string
  isAdvancedOpen: boolean
  category: 'All' | PropertyCategory
  city: string
  checkIn: string
  checkOut: string
  guests: number
  maxNightPrice: number
  minRating: number
  sortBy: 'recommended' | 'rating' | 'price-asc' | 'price-desc'
}

const getDateOffset = (offset: number) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

type UiState = {
  authModalMode: AuthModalMode | null
  successMessage: string | null
  isProfileMenuOpen: boolean
  hotelFilters: HotelFilters
  userDashboardTab: UserDashboardTab
  adminDashboardTab: AdminDashboardTab
  adminSearch: string
  ownerDashboardTab: OwnerDashboardTab
  ownerHotelNameDraft: string
  ownerHotelLocationDraft: string
  ownedHotels: Hotel[]
  openAuthModal: (mode: AuthModalMode) => void
  closeAuthModal: () => void
  setSuccessMessage: (message: string | null) => void
  setProfileMenuOpen: (isOpen: boolean) => void
  toggleProfileMenuOpen: () => void
  updateHotelFilters: (partial: Partial<HotelFilters>) => void
  resetHotelFilters: () => void
  setUserDashboardTab: (tab: UserDashboardTab) => void
  setAdminDashboardTab: (tab: AdminDashboardTab) => void
  setAdminSearch: (value: string) => void
  setOwnerDashboardTab: (tab: OwnerDashboardTab) => void
  setOwnerHotelNameDraft: (value: string) => void
  setOwnerHotelLocationDraft: (value: string) => void
  addOwnedHotel: () => void
  removeOwnedHotel: (slug: string) => void
}

const defaultHotelFilters: HotelFilters = {
  search: '',
  isAdvancedOpen: false,
  category: 'All',
  city: 'All',
  checkIn: getDateOffset(1),
  checkOut: getDateOffset(3),
  guests: 2,
  maxNightPrice: 300,
  minRating: 0,
  sortBy: 'recommended',
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      authModalMode: null,
      successMessage: null,
      isProfileMenuOpen: false,
      hotelFilters: defaultHotelFilters,
      userDashboardTab: 'bookings',
      adminDashboardTab: 'dashboard',
      adminSearch: '',
      ownerDashboardTab: 'hotels',
      ownerHotelNameDraft: '',
      ownerHotelLocationDraft: '',
      ownedHotels: [],
      openAuthModal: (mode) => {
        set({ authModalMode: mode })
      },
      closeAuthModal: () => {
        set({ authModalMode: null })
      },
      setSuccessMessage: (message) => {
        set({ successMessage: message })
      },
      setProfileMenuOpen: (isOpen) => {
        set({ isProfileMenuOpen: isOpen })
      },
      toggleProfileMenuOpen: () => {
        set((state) => ({ isProfileMenuOpen: !state.isProfileMenuOpen }))
      },
      updateHotelFilters: (partial) => {
        set((state) => ({
          hotelFilters: { ...state.hotelFilters, ...partial },
        }))
      },
      resetHotelFilters: () => {
        set({ hotelFilters: defaultHotelFilters })
      },
      setUserDashboardTab: (tab) => {
        set({ userDashboardTab: tab })
      },
      setAdminDashboardTab: (tab) => {
        set({ adminDashboardTab: tab })
      },
      setAdminSearch: (value) => {
        set({ adminSearch: value })
      },
      setOwnerDashboardTab: (tab) => {
        set({ ownerDashboardTab: tab })
      },
      setOwnerHotelNameDraft: (value) => {
        set({ ownerHotelNameDraft: value })
      },
      setOwnerHotelLocationDraft: (value) => {
        set({ ownerHotelLocationDraft: value })
      },
      addOwnedHotel: () => {
        const { ownerHotelNameDraft, ownerHotelLocationDraft } = get()
        if (!ownerHotelNameDraft.trim() || !ownerHotelLocationDraft.trim()) {
          return
        }

        set((state) => ({
          ownedHotels: [
            {
              id: Date.now(),
              slug: `owner-${Date.now()}`,
              name: ownerHotelNameDraft.trim(),
              location: ownerHotelLocationDraft.trim(),
              city: ownerHotelLocationDraft.trim().split(',')[0] ?? ownerHotelLocationDraft.trim(),
              category: 'hotel',
              image:
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
              gallery: [],
              pricePerNight: 120,
              rating: 0,
              reviews: 0,
              description: 'Owner-created draft property.',
              amenities: [],
              rooms: [],
            },
            ...state.ownedHotels,
          ],
          ownerHotelNameDraft: '',
          ownerHotelLocationDraft: '',
        }))
      },
      removeOwnedHotel: (slug) => {
        set((state) => ({
          ownedHotels: state.ownedHotels.filter((item) => item.slug !== slug),
        }))
      },
    }),
    {
      name: 'lankastay_ui_store_v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hotelFilters: state.hotelFilters,
        userDashboardTab: state.userDashboardTab,
        adminDashboardTab: state.adminDashboardTab,
        adminSearch: state.adminSearch,
        ownerDashboardTab: state.ownerDashboardTab,
        ownerHotelNameDraft: state.ownerHotelNameDraft,
        ownerHotelLocationDraft: state.ownerHotelLocationDraft,
        ownedHotels: state.ownedHotels,
      }),
    },
  ),
)
