import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

// 任务状态枚举
const TaskStatus = {
  PENDING: 'pending',      // 未完成
  IN_PROGRESS: 'in_progress',  // 进行中
  COMPLETED: 'completed',  // 已完成
  CANCELLED: 'cancelled',  // 已取消
  OVERDUE: 'overdue'       // 已逾期
}

// 任务分类枚举
const TaskCategory = {
  WORK: 'work',           // 工作
  STUDY: 'study',         // 学习
  LIFE: 'life'            // 生活
}

// 任务优先级枚举
const TaskPriority = {
  HIGH: 'high',           // 高
  MEDIUM: 'medium',       // 中
  LOW: 'low'              // 低
}

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    deletedTasks: []
  }),
  
  getters: {
    // 获取筛选后的任务
    getFilteredTasks: (state) => (filter, categoryFilter) => {
      return state.tasks.filter(task => {
        // 按完成状态筛选
        if (filter === 'pending' && task.status === TaskStatus.COMPLETED) return false
        if (filter === 'completed' && task.status !== TaskStatus.COMPLETED) return false
        
        // 按分类筛选
        if (categoryFilter && categoryFilter !== 'all' && task.category !== categoryFilter) return false
        
        return true
      }).sort((a, b) => {
        // 按优先级排序
        const priorityOrder = {
          [TaskPriority.HIGH]: 3,
          [TaskPriority.MEDIUM]: 2,
          [TaskPriority.LOW]: 1
        }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
    }
  },
  
  actions: {
    // 加载任务
    async loadTasks() {
      const userStore = useUserStore()
      if (userStore.currentUser && userStore.currentUser.id) {
        try {
          const response = await axios.get(`${API_URL}/tasks/${userStore.currentUser.id}`)
          this.tasks = response.data
          
          // 加载回收站任务
          const deletedResponse = await axios.get(`${API_URL}/tasks/${userStore.currentUser.id}/deleted`)
          this.deletedTasks = deletedResponse.data
          
          // 检查任务类型并重置每日/每周任务的完成状态
          const today = new Date()
          const todayDay = today.getDay()
          let hasChanges = false
          
          this.tasks.forEach(task => {
            if (task.type === 'daily' && task.status === TaskStatus.COMPLETED) {
              const lastCompletedDate = new Date(task.last_completed)
              if (lastCompletedDate.toDateString() !== today.toDateString()) {
                task.status = TaskStatus.PENDING
                task.completed_at = null
                task.last_completed = null
                hasChanges = true
              }
            } else if (task.type === 'weekly' && task.status === TaskStatus.COMPLETED) {
              const lastCompletedDate = new Date(task.last_completed)
              if (task.weekdays) {
                if (!task.weekdays.includes(todayDay) || 
                    lastCompletedDate.toDateString() !== today.toDateString()) {
                  task.status = TaskStatus.PENDING
                  task.completed_at = null
                  task.last_completed = null
                  hasChanges = true
                }
              }
            }
          })
          
          if (hasChanges) {
            for (const task of this.tasks) {
              if (task.status === TaskStatus.PENDING && !task.completed_at) {
                await this.updateTask(task.id, { 
                  status: task.status, 
                  completed_at: task.completed_at, 
                  last_completed: task.last_completed 
                })
              }
            }
          }
        } catch (error) {
          console.error('Error loading tasks:', error)
        }
      }
    },
    
    // 添加任务
    async addTask(taskData) {
      const userStore = useUserStore()
      if (!userStore.currentUser) return

      try {
        const response = await axios.post(`${API_URL}/tasks`, {
          user_id: userStore.currentUser.id,
          text: taskData.text,
          category: taskData.category,
          priority: taskData.priority,
          type: taskData.type,
          weekdays: taskData.weekdays
        })
        this.tasks.push(response.data)
      } catch (error) {
        console.error('Error adding task:', error)
      }
    },
    
    // 更新任务
    async updateTask(taskId, updates) {
      try {
        const response = await axios.put(`${API_URL}/tasks/${taskId}`, updates)
        const taskIndex = this.tasks.findIndex(t => t.id === taskId)
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = response.data
        }
      } catch (error) {
        console.error('Error updating task:', error)
      }
    },
    
    // 逻辑删除任务 (移至回收站)
    async deleteTask(taskId) {
      try {
        await axios.delete(`${API_URL}/tasks/${taskId}`)
        const taskIndex = this.tasks.findIndex(t => t.id === taskId)
        if (taskIndex !== -1) {
          const deletedTask = this.tasks.splice(taskIndex, 1)[0]
          this.deletedTasks.push({ ...deletedTask, is_deleted: true })
        }
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    },

    // 恢复任务
    async restoreTask(taskId) {
      try {
        await axios.post(`${API_URL}/tasks/${taskId}/restore`)
        const taskIndex = this.deletedTasks.findIndex(t => t.id === taskId)
        if (taskIndex !== -1) {
          const restoredTask = this.deletedTasks.splice(taskIndex, 1)[0]
          this.tasks.push({ ...restoredTask, is_deleted: false })
        }
      } catch (error) {
        console.error('Error restoring task:', error)
      }
    },

    // 彻底删除
    async permanentDeleteTask(taskId) {
      try {
        await axios.delete(`${API_URL}/tasks/${taskId}/permanent`)
        const taskIndex = this.deletedTasks.findIndex(t => t.id === taskId)
        if (taskIndex !== -1) {
          this.deletedTasks.splice(taskIndex, 1)
        }
      } catch (error) {
        console.error('Error permanent deleting task:', error)
      }
    },
    
    // 切换任务状态
    async toggleTaskCompletion(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        const isCurrentlyCompleted = task.status === TaskStatus.COMPLETED
        const newStatus = isCurrentlyCompleted ? TaskStatus.PENDING : TaskStatus.COMPLETED
        
        // 准备更新数据
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ') // 转换为 MySQL TIMESTAMP 格式
        
        const updates = {
          status: newStatus,
          completed_at: newStatus === TaskStatus.COMPLETED ? now : null,
          last_completed: newStatus === TaskStatus.COMPLETED ? now : task.last_completed
        }
        
        await this.updateTask(taskId, updates)
      }
    },
    
    // 更新任务状态
    async updateTaskStatus(taskId, newStatus) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        const now = new Date().toISOString()
        const updates = {
          status: newStatus,
          completed_at: newStatus === TaskStatus.COMPLETED ? now : null,
          last_completed: newStatus === TaskStatus.COMPLETED ? now : task.last_completed
        }
        await this.updateTask(taskId, updates)
      }
    },
    
    // 检查逾期任务
    async checkOverdueTasks() {
      const now = new Date()
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      
      for (const task of this.tasks) {
        if (task.type === 'today' && task.status !== TaskStatus.COMPLETED) {
          if (now > endOfDay && task.status !== TaskStatus.OVERDUE) {
            await this.updateTaskStatus(task.id, TaskStatus.OVERDUE)
          }
        }
      }
    }
  }
})