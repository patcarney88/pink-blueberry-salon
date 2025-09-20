import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  locale: string

  // User Preferences
  preferences: {
    notifications: boolean
    emailUpdates: boolean
    smsReminders: boolean
    language: string
    currency: string
    timezone: string
  }

  // Application State
  isLoading: boolean
  error: string | null

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLocale: (locale: string) => void
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  sidebarOpen: false,
  theme: 'system' as const,
  locale: 'en',
  preferences: {
    notifications: true,
    emailUpdates: true,
    smsReminders: true,
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
  },
  isLoading: false,
  error: null,
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen
          }),

        setSidebarOpen: (open) =>
          set((state) => {
            state.sidebarOpen = open
          }),

        setTheme: (theme) =>
          set((state) => {
            state.theme = theme
          }),

        setLocale: (locale) =>
          set((state) => {
            state.locale = locale
          }),

        updatePreferences: (preferences) =>
          set((state) => {
            state.preferences = { ...state.preferences, ...preferences }
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        setError: (error) =>
          set((state) => {
            state.error = error
          }),

        reset: () => set(() => initialState),
      })),
      {
        name: 'app-store',
        partialize: (state) => ({
          theme: state.theme,
          locale: state.locale,
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'AppStore',
    }
  )
)