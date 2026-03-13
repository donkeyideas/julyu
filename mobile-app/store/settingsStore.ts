import { create } from 'zustand'
import { UserSettings, getSettings, updateSettings } from '@/services/settings'

interface SettingsState {
  settings: UserSettings | null
  isLoading: boolean

  // Actions
  fetchSettings: () => Promise<void>
  updateNotification: (key: keyof UserSettings['notifications'], value: boolean) => Promise<void>
  updatePreferredStores: (stores: string[]) => Promise<void>
  updateZipCode: (zip: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const settings = await getSettings()
      set({ settings, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  updateNotification: async (key, value) => {
    const current = get().settings
    if (!current) return

    const updated = {
      ...current,
      notifications: {
        ...current.notifications,
        [key]: value,
      },
    }

    set({ settings: updated })

    try {
      const result = await updateSettings({ notifications: updated.notifications })
      set({ settings: result })
    } catch (error) {
      // Revert on failure
      set({ settings: current })
    }
  },

  updatePreferredStores: async (stores) => {
    const current = get().settings
    if (!current) return

    const updated = { ...current, preferred_stores: stores }
    set({ settings: updated })

    try {
      const result = await updateSettings({ preferred_stores: stores })
      set({ settings: result })
    } catch (error) {
      set({ settings: current })
    }
  },

  updateZipCode: async (zip) => {
    const current = get().settings
    if (!current) return

    const updated = { ...current, zip_code: zip }
    set({ settings: updated })

    try {
      const result = await updateSettings({ zip_code: zip })
      set({ settings: result })
    } catch (error) {
      set({ settings: current })
    }
  },
}))
