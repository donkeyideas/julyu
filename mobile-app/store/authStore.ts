import { create } from 'zustand'
import { User } from '@/types'
import { supabase, signIn, signUp, signOut, getCurrentUser } from '@/lib/supabase'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true })

    const { data, error } = await signIn(email, password)

    if (error) {
      set({ isLoading: false })
      return { error: error.message }
    }

    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || '',
          created_at: data.user.created_at,
        },
        isAuthenticated: true,
        isLoading: false,
      })
    }

    return {}
  },

  register: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true })

    const { data, error } = await signUp(email, password, fullName)

    if (error) {
      set({ isLoading: false })
      return { error: error.message }
    }

    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          created_at: data.user.created_at,
        },
        isAuthenticated: true,
        isLoading: false,
      })
    }

    return {}
  },

  logout: async () => {
    await signOut()
    set({
      user: null,
      isAuthenticated: false,
    })
  },

  checkAuth: async () => {
    set({ isLoading: true })

    const { user, error } = await getCurrentUser()

    if (user && !error) {
      set({
        user: {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || '',
          created_at: user.created_at,
        },
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      set({
        user: { ...currentUser, ...updates },
      })
    }
  },
}))
