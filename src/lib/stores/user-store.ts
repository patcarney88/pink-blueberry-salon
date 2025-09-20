import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'staff' | 'admin' | 'owner'
  avatar?: string
  phone?: string
  createdAt: Date
  updatedAt: Date
}

interface UserState {
  // User Data
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Session
  sessionId: string | null
  lastActivity: Date | null

  // Actions
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  login: (user: User, sessionId: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateActivity: () => void
  clearError: () => void
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionId: null,
  lastActivity: null,
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setUser: (user) =>
          set((state) => {
            state.user = user
            state.isAuthenticated = !!user
          }),

        updateUser: (updates) =>
          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...updates, updatedAt: new Date() }
            }
          }),

        login: (user, sessionId) =>
          set((state) => {
            state.user = user
            state.isAuthenticated = true
            state.sessionId = sessionId
            state.lastActivity = new Date()
            state.error = null
          }),

        logout: () =>
          set(() => initialState),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        setError: (error) =>
          set((state) => {
            state.error = error
            state.isLoading = false
          }),

        updateActivity: () =>
          set((state) => {
            state.lastActivity = new Date()
          }),

        clearError: () =>
          set((state) => {
            state.error = null
          }),
      })),
      {
        name: 'user-store',
        partialize: (state) => ({
          user: state.user,
          sessionId: state.sessionId,
          lastActivity: state.lastActivity,
        }),
      }
    ),
    {
      name: 'UserStore',
    }
  )
)