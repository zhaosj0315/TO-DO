import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'

export const useOfflineUserStore = defineStore('offlineUser', {
  state: () => ({
    currentUser: null,
    isLoggedIn: false
  }),

  actions: {
    async login(username) {
      this.currentUser = username
      this.isLoggedIn = true
      await Preferences.set({ key: 'currentUser', value: username })
    },

    async logout() {
      this.currentUser = null
      this.isLoggedIn = false
      await Preferences.remove({ key: 'currentUser' })
    },

    async checkLogin() {
      const { value } = await Preferences.get({ key: 'currentUser' })
      if (value) {
        this.currentUser = value
        this.isLoggedIn = true
      }
    }
  }
})
