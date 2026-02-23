import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'

export const useOfflineTaskStore = defineStore('offlineTask', {
  state: () => ({
    tasks: [],
    deletedTasks: [],
    currentUser: null
  }),

  actions: {
    async loadTasks() {
      if (!this.currentUser) return
      
      // 按用户加载任务
      const { value } = await Preferences.get({ key: `tasks_${this.currentUser}` })
      if (value) this.tasks = JSON.parse(value)
      else this.tasks = []
      
      const { value: deleted } = await Preferences.get({ key: `deletedTasks_${this.currentUser}` })
      if (deleted) this.deletedTasks = JSON.parse(deleted)
      else this.deletedTasks = []
    },

    async saveTasks() {
      if (!this.currentUser) return
      
      // 按用户保存任务
      await Preferences.set({ key: `tasks_${this.currentUser}`, value: JSON.stringify(this.tasks) })
      await Preferences.set({ key: `deletedTasks_${this.currentUser}`, value: JSON.stringify(this.deletedTasks) })
    },

    async addTask(taskData) {
      const task = {
        id: taskData.id || Date.now(),
        text: taskData.text,
        type: taskData.type,
        category: taskData.category,
        priority: taskData.priority,
        weekdays: taskData.weekdays || [],
        customDate: taskData.customDate || null,
        customTime: taskData.customTime || null,
        description: taskData.description || '',
        status: taskData.status || 'pending',
        created_at: taskData.created_at || new Date().toISOString(),
        user_id: taskData.user_id || this.currentUser,
        is_pinned: taskData.is_pinned || false
      }
      this.tasks.push(task)
      await this.saveTasks()
    },

    async toggleTaskCompletion(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        const wasCompleted = task.status === 'completed'
        task.status = wasCompleted ? 'pending' : 'completed'
        
        // 记录完成时间戳
        if (!wasCompleted) {
          task.completed_at = new Date().toISOString()
        } else {
          // 取消完成时清除时间戳
          delete task.completed_at
        }
        
        await this.saveTasks()
      }
    },

    async updateTask(taskId, updates) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        Object.assign(task, updates)
        await this.saveTasks()
      }
    },

    async togglePin(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        task.is_pinned = !task.is_pinned
        await this.saveTasks()
      }
    },

    async deleteTask(taskId) {
      const index = this.tasks.findIndex(t => t.id === taskId)
      if (index !== -1) {
        const task = this.tasks.splice(index, 1)[0]
        this.deletedTasks.push(task)
        await this.saveTasks()
      }
    },

    async restoreTask(taskId) {
      const index = this.deletedTasks.findIndex(t => t.id === taskId)
      if (index !== -1) {
        const task = this.deletedTasks.splice(index, 1)[0]
        this.tasks.push(task)
        await this.saveTasks()
      }
    },

    async permanentDeleteTask(taskId) {
      const index = this.deletedTasks.findIndex(t => t.id === taskId)
      if (index !== -1) {
        this.deletedTasks.splice(index, 1)
        await this.saveTasks()
      }
    },

    checkOverdueTasks() {
      const now = new Date()
      let hasChanges = false
      this.tasks.forEach(task => {
        if (task.type === 'today' && task.status !== 'completed') {
          const created = new Date(task.created_at)
          const endOfDay = new Date(created.getFullYear(), created.getMonth(), created.getDate(), 23, 59, 59)
          if (now > endOfDay && task.status !== 'overdue') {
            task.status = 'overdue'
            hasChanges = true
          }
        }
      })
      if (hasChanges) {
        this.saveTasks()
      }
    },

    getFilteredTasks(statusFilter, categoryFilter, dateRange) {
      let filtered = [...this.tasks]

      if (statusFilter === 'pending') {
        filtered = filtered.filter(t => t.status === 'pending')
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter(t => t.status === 'completed')
      } else if (statusFilter === 'overdue') {
        filtered = filtered.filter(t => t.status === 'overdue')
      }

      if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter)
      }

      // 根据时间维度筛选
      const dimension = dateRange.dimension || 'created'
      
      if (dateRange.start) {
        const start = new Date(dateRange.start)
        start.setHours(0, 0, 0, 0)
        filtered = filtered.filter(t => {
          let taskDate
          if (dimension === 'created') {
            taskDate = new Date(t.created_at)
          } else if (dimension === 'deadline') {
            const deadline = this.calculateDeadline(t)
            if (!deadline) return false
            taskDate = new Date(deadline)
          } else if (dimension === 'completed') {
            if (!t.completed_at) return false
            taskDate = new Date(t.completed_at)
          }
          return taskDate >= start
        })
      }

      if (dateRange.end) {
        const end = new Date(dateRange.end)
        end.setHours(23, 59, 59, 999)
        filtered = filtered.filter(t => {
          let taskDate
          if (dimension === 'created') {
            taskDate = new Date(t.created_at)
          } else if (dimension === 'deadline') {
            const deadline = this.calculateDeadline(t)
            if (!deadline) return false
            taskDate = new Date(deadline)
          } else if (dimension === 'completed') {
            if (!t.completed_at) return false
            taskDate = new Date(t.completed_at)
          }
          return taskDate <= end
        })
      }

      return filtered.sort((a, b) => {
        // 计算任务权重（数字越小越靠前）
        const getWeight = (task) => {
          let weight = 0
          
          // 已完成任务：权重最低
          if (task.status === 'completed') return 10000
          
          // 置顶任务：基础权重 0-2（按优先级细分）
          if (task.is_pinned) {
            const pinPriority = { high: 0, medium: 1, low: 2 }
            return pinPriority[task.priority]
          }
          
          // 计算距离截止时间（小时）
          const deadline = this.calculateDeadline(task)
          const hoursUntilDeadline = deadline ? (new Date(deadline) - new Date()) / 3600000 : 999999
          
          // 逾期任务：权重 100-500
          if (task.status === 'overdue') {
            const daysOverdue = Math.abs(hoursUntilDeadline) / 24
            // 逾期3天内：100-200（高危区）
            // 逾期3天以上：200-500（衰减区）
            if (daysOverdue <= 3) {
              weight = 100 + (task.priority === 'high' ? 0 : task.priority === 'medium' ? 30 : 60)
            } else {
              weight = 200 + Math.min(daysOverdue * 10, 300) + (task.priority === 'low' ? 100 : 0)
            }
            return weight
          }
          
          // 待办任务：权重 600-900
          // 2小时内到期：紧急预警区（600-650）
          if (hoursUntilDeadline <= 2) {
            weight = 600 + (task.priority === 'high' ? 0 : task.priority === 'medium' ? 20 : 40)
            return weight
          }
          
          // 正常待办：按优先级（700-900）
          weight = 700 + (task.priority === 'high' ? 0 : task.priority === 'medium' ? 100 : 200)
          return weight
        }
        
        const weightA = getWeight(a)
        const weightB = getWeight(b)
        
        if (weightA !== weightB) return weightA - weightB
        
        // 权重相同：已完成按完成时间倒序，其他按创建时间倒序
        if (a.status === 'completed' && b.status === 'completed') {
          const aTime = a.completed_at ? new Date(a.completed_at) : new Date(a.created_at)
          const bTime = b.completed_at ? new Date(b.completed_at) : new Date(b.created_at)
          return bTime - aTime
        }
        return new Date(b.created_at) - new Date(a.created_at)
      })
    },

    calculateDeadline(task) {
      const now = new Date()
      
      switch (task.type) {
        case 'today':
        case 'daily':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        
        case 'tomorrow':
          const tomorrow = new Date(now)
          tomorrow.setDate(tomorrow.getDate() + 1)
          return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)
        
        case 'this_week':
          const endOfWeek = new Date(now)
          const dayOfWeek = now.getDay()
          const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
          endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday)
          return new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59)
        
        case 'custom_date':
          if (task.customDate) {
            const date = new Date(task.customDate)
            if (task.customTime) {
              const [hours, minutes] = task.customTime.split(':')
              date.setHours(parseInt(hours), parseInt(minutes), 0)
            } else {
              date.setHours(23, 59, 59)
            }
            return date
          }
          return null
        
        default:
          return null
      }
    },

    async setCurrentUser(username) {
      this.currentUser = username
      await this.loadTasks()
    },

    clearUser() {
      this.currentUser = null
      this.tasks = []
      this.deletedTasks = []
    }
  }
})
