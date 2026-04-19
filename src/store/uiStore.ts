import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { hotels } from '../data/hotels'
import type { Hotel, HotelCategory } from '../data/hotels'

export type AuthModalMode = 'login' | 'register'
export type UserDashboardTab = 'dashboard' | 'bookings' | 'refunds' | 'messages' | 'help' | 'settings'
export type AdminDashboardTab =
  | 'dashboard'
  | 'users'
  | 'owners'
  | 'bookings'
  | 'refunds'
  | 'messages'
  | 'help'
  | 'settings'
export type OwnerDashboardTab = 'dashboard' | 'hotels' | 'bookings' | 'messages' | 'settings'

type HotelFilters = {
  search: string
  isAdvancedOpen: boolean
  category: 'All' | HotelCategory
  city: string
  maxNightPrice: number
  minRating: number
  sortBy: 'recommended' | 'rating' | 'price-asc' | 'price-desc'
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
  addOwnedHotel: () => void
  removeOwnedHotel: (slug: string) => void
}

const defaultHotelFilters: HotelFilters = {
  search: '',
  isAdvancedOpen: false,
  category: 'All',
  city: 'All',
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
      ownedHotels: hotels.slice(0, 4),
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
      addOwnedHotel: () => {
        const { ownerHotelNameDraft } = get()
        if (!ownerHotelNameDraft.trim()) {
          return
        }

        const sample = hotels[Math.floor(Math.random() * hotels.length)]
        set((state) => ({
          ownedHotels: [
            {
              ...sample,
              slug: `${sample.slug}-${Date.now()}`,
              name: ownerHotelNameDraft.trim(),
            },
            ...state.ownedHotels,
          ],
          ownerHotelNameDraft: '',
        }))
      },
      removeOwnedHotel: (slug) => {
        set((state) => ({
          ownedHotels: state.ownedHotels.filter((item) => item.slug !== slug),
        }))
      },
    }),
    {
      name: 'lankastay_ui_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hotelFilters: state.hotelFilters,
        userDashboardTab: state.userDashboardTab,
        adminDashboardTab: state.adminDashboardTab,
        adminSearch: state.adminSearch,
        ownerDashboardTab: state.ownerDashboardTab,
        ownerHotelNameDraft: state.ownerHotelNameDraft,
        ownedHotels: state.ownedHotels,
      }),
    },
  ),
)
