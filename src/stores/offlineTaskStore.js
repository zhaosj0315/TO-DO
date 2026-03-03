import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'
import { LocalNotifications } from '@capacitor/local-notifications'
import { performBackup } from '../utils/autoBackup'
import { Capacitor } from '@capacitor/core'

export const useOfflineTaskStore = defineStore('offlineTask', {
  state: () => ({
    tasks: [],
    deletedTasks: [],
    currentUser: null
  }),

  actions: {
    // 根据优先级获取预估番茄钟数
    getEstimatedPomodoros(priority) {
      const pomodoroMap = {
        high: 4,
        medium: 2,
        low: 1
      }
      return pomodoroMap[priority] || 2
    },

    async loadTasks() {
      if (!this.currentUser) return
      
      // 按用户加载任务
      const { value } = await Preferences.get({ key: `tasks_${this.currentUser}` })
      if (value) {
        this.tasks = JSON.parse(value)
        // 数据迁移：为旧任务添加 logs、stats 和 waitFor 字段
        this.tasks = this.tasks.map(task => {
          let waitFor = task.waitFor
          // 兼容旧数据：null → []，单个ID → [ID]
          if (waitFor === null || waitFor === undefined) {
            waitFor = []
          } else if (typeof waitFor === 'number') {
            waitFor = [waitFor]
          }
          
          return {
            ...task,
            logs: task.logs || [],
            stats: task.stats || this.calculateTaskStats([]),
            waitFor
          }
        })
      } else {
        this.tasks = []
      }
      
      const { value: deleted } = await Preferences.get({ key: `deletedTasks_${this.currentUser}` })
      if (deleted) {
        this.deletedTasks = JSON.parse(deleted)
        // 数据迁移：为旧任务添加 logs、stats 和 waitFor 字段
        this.deletedTasks = this.deletedTasks.map(task => {
          let waitFor = task.waitFor
          if (waitFor === null || waitFor === undefined) {
            waitFor = []
          } else if (typeof waitFor === 'number') {
            waitFor = [waitFor]
          }
          
          return {
            ...task,
            logs: task.logs || [],
            stats: task.stats || this.calculateTaskStats([]),
            waitFor
          }
        })
      } else {
        this.deletedTasks = []
      }
    },

    async saveTasks() {
      if (!this.currentUser) return
      
      // 按用户保存任务
      await Preferences.set({ key: `tasks_${this.currentUser}`, value: JSON.stringify(this.tasks) })
      await Preferences.set({ key: `deletedTasks_${this.currentUser}`, value: JSON.stringify(this.deletedTasks) })
      
      // 自动备份（每天首次变动时）
      await performBackup()
    },

    async addTask(taskData) {
      const task = {
        id: taskData.id || Math.floor(Math.random() * 2147483647), // Java int范围内的随机ID
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
        is_pinned: taskData.is_pinned || false,
        enableReminder: taskData.enableReminder || false,
        reminderTime: taskData.reminderTime || null,
        forceReminder: taskData.forceReminder || false, // 强制提醒
        completedPomodoros: taskData.completedPomodoros || 0, // 已完成的番茄钟数
        estimatedPomodoros: taskData.estimatedPomodoros || this.getEstimatedPomodoros(taskData.priority), // 预估番茄钟数
        pomodoroHistory: taskData.pomodoroHistory || [], // 番茄钟历史记录
        logs: taskData.logs || [], // 任务执行日志
        stats: taskData.stats || this.calculateTaskStats([]), // 统计数据
        waitFor: taskData.waitFor || [], // 等待的任务ID数组
        parentTaskId: taskData.parentTaskId || null, // 父任务ID（AI拆分）
        aiSummary: taskData.aiSummary || null // AI生成的任务总结
      }
      this.tasks.push(task)
      await this.saveTasks()
      
      // 如果启用了提醒，安排通知
      if (task.enableReminder && task.reminderTime) {
        await this.scheduleTaskReminder(task)
      }
      
      return task // 返回创建的任务（包含ID）
    },

    async toggleTaskCompletion(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        const wasCompleted = task.status === 'completed'
        
        // 如果要标记为完成，检查是否可以开始
        if (!wasCompleted && !this.canStart(taskId)) {
          // 获取未完成的依赖任务
          const waitForTasks = this.getWaitForTasks(taskId)
          const unfinishedTasks = waitForTasks.filter(t => t.status !== 'completed')
          const taskNames = unfinishedTasks.map(t => t.text).join('、')
          
          // 提示用户
          if (Capacitor.isNativePlatform()) {
            try {
              await LocalNotifications.schedule({
                notifications: [{
                  id: Math.floor(Math.random() * 1000000),
                  title: '⚠️ 无法完成任务',
                  body: `请先完成依赖任务：${taskNames}`,
                  schedule: { at: new Date(Date.now() + 100) }
                }]
              })
            } catch (error) {
              console.error('发送提醒失败:', error)
            }
          }
          return // 阻止完成
        }
        
        task.status = wasCompleted ? 'pending' : 'completed'
        
        // 记录完成时间戳
        if (!wasCompleted) {
          task.completed_at = new Date().toISOString()
          // 完成任务时取消提醒
          if (task.enableReminder) {
            await this.cancelTaskReminder(taskId)
          }
          
          // 🆕 如果是父任务，自动完成所有子任务
          const childTasks = this.tasks.filter(t => t.parentTaskId === taskId)
          if (childTasks.length > 0) {
            console.log(`父任务完成，自动完成 ${childTasks.length} 个子任务`)
            for (const child of childTasks) {
              if (child.status !== 'completed') {
                child.status = 'completed'
                child.completed_at = new Date().toISOString()
                if (child.enableReminder) {
                  await this.cancelTaskReminder(child.id)
                }
              }
            }
          }
          
          // 检查是否有任务在等待此任务
          const waitingTasks = this.getWaitingTasks(taskId)
          if (waitingTasks.length > 0) {
            // 发送通知：任务解锁
            if (Capacitor.isNativePlatform()) {
              try {
                await LocalNotifications.schedule({
                  notifications: [{
                    id: Math.floor(Math.random() * 1000000),
                    title: '✅ 任务解锁',
                    body: `"${task.text}"已完成，${waitingTasks.length}个等待任务现在可以开始了！`,
                    schedule: { at: new Date(Date.now() + 1000) }
                  }]
                })
              } catch (error) {
                console.error('发送任务解锁通知失败:', error)
              }
            }
          }
        } else {
          // 取消完成时清除时间戳
          delete task.completed_at
          
          // 🆕 如果是父任务，同时取消所有子任务的完成状态
          const childTasks = this.tasks.filter(t => t.parentTaskId === taskId)
          if (childTasks.length > 0) {
            console.log(`父任务取消完成，同时取消 ${childTasks.length} 个子任务`)
            for (const child of childTasks) {
              if (child.status === 'completed') {
                child.status = 'pending'
                delete child.completed_at
                if (child.enableReminder && child.reminderTime) {
                  await this.scheduleTaskReminder(child)
                }
              }
            }
          }
          
          // 重新安排提醒
          if (task.enableReminder && task.reminderTime) {
            await this.scheduleTaskReminder(task)
          }
        }
        
        await this.saveTasks()
      }
    },

    async updateTask(taskId, updates) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        const oldReminder = { enableReminder: task.enableReminder, reminderTime: task.reminderTime }
        Object.assign(task, updates)
        
        // 🔧 如果修改了任务类型、日期或时间，重新评估任务状态
        if (updates.type || updates.customDate || updates.customTime || updates.weekdays) {
          // 只有待办和逾期状态的任务需要重新评估（已完成的不变）
          if (task.status === 'pending' || task.status === 'overdue') {
            const deadline = this.calculateDeadline(task)
            const now = new Date()
            
            if (deadline) {
              // 如果截止时间还没到，改为待办
              if (now <= deadline) {
                task.status = 'pending'
              } else {
                // 如果截止时间已过，改为逾期
                task.status = 'overdue'
              }
            }
          }
        }
        
        // 如果提醒设置有变化，重新安排
        if (oldReminder.enableReminder !== task.enableReminder || oldReminder.reminderTime !== task.reminderTime) {
          await this.cancelTaskReminder(taskId)
          if (task.enableReminder && task.reminderTime && task.status !== 'completed') {
            await this.scheduleTaskReminder(task)
          }
        }
        
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
        const task = this.tasks[index]
        
        // 🆕 检查是否有子任务
        const childTasks = this.tasks.filter(t => t.parentTaskId === taskId)
        
        // 🆕 如果是父任务，显示确认提示
        if (childTasks.length > 0) {
          const childNames = childTasks.map(c => `  • ${c.text}`).join('\n')
          const confirmed = confirm(
            `⚠️ 删除父任务确认\n\n` +
            `父任务：${task.text}\n\n` +
            `将同时删除以下 ${childTasks.length} 个子任务：\n${childNames}\n\n` +
            `确定要删除吗？`
          )
          
          if (!confirmed) {
            console.log('用户取消删除父任务')
            return // 用户取消
          }
        } else {
          // 🆕 普通任务或子任务也需要确认
          const confirmed = confirm(
            `⚠️ 删除任务确认\n\n` +
            `任务：${task.text}\n\n` +
            `确定要删除吗？`
          )
          
          if (!confirmed) {
            console.log('用户取消删除任务')
            return // 用户取消
          }
        }
        
        // 执行删除
        this.tasks.splice(index, 1)
        
        // 添加删除时间戳
        task.deleted_at = new Date().toISOString()
        
        this.deletedTasks.push(task)
        
        // 取消提醒
        if (task.enableReminder) {
          await this.cancelTaskReminder(taskId)
        }
        
        // 如果是父任务，同时删除所有子任务
        if (childTasks.length > 0) {
          console.log(`删除父任务，同时删除 ${childTasks.length} 个子任务`)
          for (const child of childTasks) {
            const childIndex = this.tasks.findIndex(t => t.id === child.id)
            if (childIndex !== -1) {
              const deletedChild = this.tasks.splice(childIndex, 1)[0]
              
              // 为子任务也添加删除时间戳
              deletedChild.deleted_at = new Date().toISOString()
              
              this.deletedTasks.push(deletedChild)
              if (deletedChild.enableReminder) {
                await this.cancelTaskReminder(deletedChild.id)
              }
            }
          }
        }
        
        // 清除其他任务对此任务的依赖
        this.tasks.forEach(t => {
          if (Array.isArray(t.waitFor)) {
            t.waitFor = t.waitFor.filter(id => id !== taskId)
          }
        })
        
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

    async clearAllDeletedTasks() {
      this.deletedTasks = []
      await this.saveTasks()
    },

    async clearAllTasks() {
      this.tasks = []
      this.deletedTasks = []
      await this.saveTasks()
    },

    // ========== 依赖关系管理 ==========
    
    // 设置等待任务（支持多个）
    async setWaitFor(taskId, waitForTaskIds) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task) return
      
      // 确保是数组
      const idsArray = Array.isArray(waitForTaskIds) ? waitForTaskIds : [waitForTaskIds]
      task.waitFor = idsArray
      await this.saveTasks()
    },

    // 添加单个等待任务
    async addWaitFor(taskId, waitForTaskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task) return
      
      if (!Array.isArray(task.waitFor)) {
        task.waitFor = []
      }
      
      if (!task.waitFor.includes(waitForTaskId)) {
        task.waitFor.push(waitForTaskId)
        await this.saveTasks()
      }
    },

    // 移除单个等待任务
    async removeWaitFor(taskId, waitForTaskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task || !Array.isArray(task.waitFor)) return
      
      task.waitFor = task.waitFor.filter(id => id !== waitForTaskId)
      await this.saveTasks()
    },

    // 取消所有等待
    async clearWaitFor(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task) return
      
      task.waitFor = []
      await this.saveTasks()
    },

    // 检查任务是否可以开始（所有等待的任务都已完成）
    canStart(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task || !Array.isArray(task.waitFor) || task.waitFor.length === 0) return true
      
      // 检查所有等待的任务是否都已完成
      return task.waitFor.every(waitForId => {
        const waitForTask = this.tasks.find(t => t.id === waitForId)
        return !waitForTask || waitForTask.status === 'completed'
      })
    },

    // 获取等待的任务对象数组
    getWaitForTasks(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task || !Array.isArray(task.waitFor) || task.waitFor.length === 0) return []
      
      return task.waitFor
        .map(id => this.tasks.find(t => t.id === id))
        .filter(t => t !== undefined)
    },

    // 获取等待当前任务的所有任务
    getWaitingTasks(taskId) {
      return this.tasks.filter(t => 
        Array.isArray(t.waitFor) && t.waitFor.includes(taskId)
      )
    },


    checkOverdueTasks() {
      const now = new Date()
      let hasChanges = false
      
      this.tasks.forEach(task => {
        // 🔧 检查所有未完成任务是否逾期（不仅仅是"今天"类型）
        if (task.status !== 'completed') {
          const deadline = this.calculateDeadline(task)
          
          if (deadline) {
            // 如果截止时间已过，标记为逾期
            if (now > deadline && task.status !== 'overdue') {
              task.status = 'overdue'
              hasChanges = true
            }
            // 如果截止时间还没到，但状态是逾期，改为待办
            else if (now <= deadline && task.status === 'overdue') {
              task.status = 'pending'
              hasChanges = true
            }
          }
        }
        
        // 处理重复任务的自动重置
        if (task.status === 'completed') {
          const completedDate = task.completed_at ? new Date(task.completed_at) : null
          if (!completedDate) return
          
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const completedDay = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate())
          
          // 每天重复：如果完成日期不是今天，重置为待办
          if (task.type === 'daily' && completedDay < today) {
            task.status = 'pending'
            task.completed_at = null
            hasChanges = true
          }
          
          // 工作日重复：如果今天是工作日且完成日期不是今天，重置为待办
          if (task.type === 'weekday') {
            const dayOfWeek = now.getDay()
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
            if (isWeekday && completedDay < today) {
              task.status = 'pending'
              task.completed_at = null
              hasChanges = true
            }
          }
          
          // 每周重复：如果今天是指定的星期几且完成日期不是今天，重置为待办
          if (task.type === 'weekly' && task.weekdays && task.weekdays.length > 0) {
            const dayOfWeek = now.getDay()
            const shouldRepeatToday = task.weekdays.includes(dayOfWeek)
            if (shouldRepeatToday && completedDay < today) {
              task.status = 'pending'
              task.completed_at = null
              hasChanges = true
            }
          }
        }
      })
      
      if (hasChanges) {
        this.saveTasks()
      }
    },

    // 检查并触发任务提醒
    async checkTaskReminders() {
      const now = new Date()
      const notifiedKey = `notified_reminders_${this.currentUser}`
      const { value } = await Preferences.get({ key: notifiedKey })
      const notifiedIds = value ? JSON.parse(value) : []

      for (const task of this.tasks) {
        if (!task.enableReminder || !task.reminderTime || task.status === 'completed') continue
        if (notifiedIds.includes(task.id)) continue

        const reminderTime = new Date(task.reminderTime)
        if (now >= reminderTime) {
          await this.triggerReminderNotification(task)
          notifiedIds.push(task.id)
        }
      }

      await Preferences.set({ key: notifiedKey, value: JSON.stringify(notifiedIds) })
    },

    // 触发响铃提醒
    async triggerReminderNotification(task) {
      try {
        // 如果是强制提醒，使用原生全屏通知
        if (task.forceReminder && Capacitor.isPluginAvailable('FullScreenNotification')) {
          const FullScreenNotification = Capacitor.Plugins.FullScreenNotification
          await FullScreenNotification.showFullScreenNotification({
            id: task.id,
            title: '🚨 紧急任务提醒',
            body: task.text
          })
        } else {
          // 普通提醒
          await LocalNotifications.schedule({
            notifications: [{
              id: task.id,
              title: '⏰ 任务提醒',
              body: `${task.text}`,
              schedule: { at: new Date() },
              channelId: 'task-reminders-v3',
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#FF6B6B',
              extra: { taskId: task.id }
            }]
          })
        }
      } catch (error) {
        console.error('提醒通知失败:', error)
      }
    },

    // 为任务安排提醒
    async scheduleTaskReminder(task) {
      if (!task.enableReminder || !task.reminderTime) return

      try {
        const reminderTime = new Date(task.reminderTime)
        if (reminderTime <= new Date()) return

        const notification = {
          id: task.id,
          title: task.forceReminder ? '🚨 紧急任务提醒' : '⏰ 任务提醒',
          body: task.text,
          schedule: { at: reminderTime },
          channelId: task.forceReminder ? 'task-urgent-alarm' : 'task-reminders-v3',
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: task.forceReminder ? '#FF0000' : '#FF6B6B',
          extra: { 
            taskId: task.id,
            forceReminder: task.forceReminder || false,
            taskText: task.text
          }
        }

        // 强制提醒：全屏配置
        if (task.forceReminder) {
          notification.ongoing = true // 不可滑动关闭
          notification.autoCancel = false // 点击不消失
          notification.priority = 5 // 最高优先级
          notification.importance = 5
          notification.vibrate = [0, 500, 300, 500, 300, 500, 300, 500] // 持续震动
          notification.actions = [
            {
              id: 'complete',
              title: '✅ 完成任务',
              foreground: true
            },
            {
              id: 'snooze',
              title: '⏰ 10分钟后提醒',
              foreground: false
            },
            {
              id: 'dismiss',
              title: '❌ 关闭',
              foreground: true,
              destructive: true
            }
          ]
        }

        await LocalNotifications.schedule({
          notifications: [notification]
        })
      } catch (error) {
        console.error('安排提醒失败:', error)
      }
    },

    // 取消任务提醒
    async cancelTaskReminder(taskId) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
      } catch (error) {
        console.error('取消提醒失败:', error)
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
        case 'weekday':
          // 今天、每天重复、工作日重复：都是当天23:59:59截止
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
        
        case 'weekly':
          // 每周重复：找到下一个指定的星期几
          if (task.weekdays && task.weekdays.length > 0) {
            const today = now.getDay()
            const sortedWeekdays = [...task.weekdays].sort((a, b) => a - b)
            
            // 找到今天或之后最近的一个星期几
            let nextWeekday = sortedWeekdays.find(day => day >= today)
            
            // 如果没找到，说明要到下周，取第一个
            if (nextWeekday === undefined) {
              nextWeekday = sortedWeekdays[0]
            }
            
            const daysUntilNext = nextWeekday >= today 
              ? nextWeekday - today 
              : 7 - today + nextWeekday
            
            const nextDate = new Date(now)
            nextDate.setDate(nextDate.getDate() + daysUntilNext)
            return new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), 23, 59, 59)
          }
          // 如果没有设置星期几，默认当天截止
          return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        
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
      // 如果传入的是对象，提取username
      if (typeof username === 'object' && username !== null) {
        this.currentUser = username.username || username
      } else {
        this.currentUser = username
      }
      console.log('TaskStore - setCurrentUser:', this.currentUser)
      await this.loadTasks()
    },

    clearUser() {
      this.currentUser = null
      this.tasks = []
      this.deletedTasks = []
    },

    // ===== 任务日志系统 =====
    
    // 计算任务统计数据
    calculateTaskStats(logs) {
      const stats = {
        totalLogs: logs.length,
        totalDuration: 0,
        sessionCount: logs.length,
        blockCount: 0,
        resolvedBlockCount: 0,
        averageSessionDuration: 0,
        progressHistory: [],
        tags: []
      }

      const tagSet = new Set()
      
      logs.forEach(log => {
        if (log.duration) {
          stats.totalDuration += log.duration
        }
        if (log.type === 'block') {
          stats.blockCount++
          if (log.resolved) {
            stats.resolvedBlockCount++
          }
        }
        if (log.progress !== undefined && log.progress !== null) {
          stats.progressHistory.push(log.progress)
        }
        if (log.tags && Array.isArray(log.tags)) {
          log.tags.forEach(tag => tagSet.add(tag))
        }
      })

      stats.averageSessionDuration = stats.sessionCount > 0 
        ? Math.round(stats.totalDuration / stats.sessionCount * 10) / 10 
        : 0
      stats.tags = Array.from(tagSet)

      return stats
    },

    // 添加任务日志
    async addTaskLog(taskId, logData) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task) return null

      const log = {
        id: Date.now(),
        type: logData.type, // start/progress/block/solution/milestone/complete
        content: logData.content,
        timestamp: new Date().toISOString(),
        duration: logData.duration || null,
        progress: logData.progress !== undefined ? logData.progress : null,
        tags: logData.tags || [],
        mood: logData.mood || null,
        resolved: logData.resolved || false,
        resolvedAt: logData.resolvedAt || null,
        resolvedNote: logData.resolvedNote || null,
        relatedLogId: logData.relatedLogId || null,
        rating: logData.rating || null,
        lessons: logData.lessons || []
      }

      if (!task.logs) {
        task.logs = []
      }
      task.logs.push(log)

      // 重新计算统计数据
      task.stats = this.calculateTaskStats(task.logs)

      // 如果是完成类型的日志，自动标记任务为完成
      if (logData.type === 'complete' && task.status !== 'completed') {
        task.status = 'completed'
        task.completed_at = log.timestamp
      }

      await this.saveTasks()
      return log
    },

    // 更新任务日志
    async updateTaskLog(taskId, logId, updates) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task || !task.logs) return false

      const log = task.logs.find(l => l.id === logId)
      if (!log) return false

      Object.assign(log, updates)

      // 重新计算统计数据
      task.stats = this.calculateTaskStats(task.logs)

      await this.saveTasks()
      return true
    },

    // 删除任务日志
    async deleteTaskLog(taskId, logId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task || !task.logs) return false

      const index = task.logs.findIndex(l => l.id === logId)
      if (index === -1) return false

      task.logs.splice(index, 1)

      // 重新计算统计数据
      task.stats = this.calculateTaskStats(task.logs)

      await this.saveTasks()
      return true
    },

    // 标记阻碍为已解决
    async resolveBlock(taskId, logId, resolvedNote) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task || !task.logs) return false

      const log = task.logs.find(l => l.id === logId && l.type === 'block')
      if (!log) return false

      log.resolved = true
      log.resolvedAt = new Date().toISOString()
      log.resolvedNote = resolvedNote

      // 重新计算统计数据
      task.stats = this.calculateTaskStats(task.logs)

      await this.saveTasks()
      return true
    },

    // 获取任务的所有未解决阻碍
    getUnresolvedBlocks(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task || !task.logs) return []

      return task.logs.filter(log => log.type === 'block' && !log.resolved)
    }
  }
})
