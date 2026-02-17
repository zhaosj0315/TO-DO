import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.currentUser
  },
  
  actions: {
    // 登录
    async login(username) {
      if (username.trim()) {
        try {
          const response = await axios.post(`${API_URL}/login`, { username: username.trim() })
          this.currentUser = response.data
          this.saveUser()
          return true
        } catch (error) {
          console.error('Login error:', error)
          return false
        }
      }
      return false
    },
    
    // 退出登录
    logout() {
      this.currentUser = null
      this.saveUser()
    },
    
    // 加载用户信息
    loadUser() {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser)
      }
    },
    
    // 保存用户信息
    saveUser() {
      if (this.currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      } else {
        localStorage.removeItem('currentUser')
      }
    }
  }
})