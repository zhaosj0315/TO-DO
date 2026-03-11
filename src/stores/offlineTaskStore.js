import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'
import { LocalNotifications } from '@capacitor/local-notifications'
import { performBackup } from '../utils/autoBackup'
import { Capacitor } from '@capacitor/core'

export const useOfflineTaskStore = defineStore('offlineTask', {
  state: () => ({
    tasks: [],
    deletedTasks: [],
    collections: [],      // 🆕 文件夹/合集数组
    currentCollectionId: null, // 🆕 当前查看的文件夹ID（null=全部笔记本）
    currentUser: null
  }),

  getters: {
    // 🆕 获取未分类任务
    uncategorizedTasks: (state) => {
      return state.tasks.filter(t => !t.collectionId)
    },
    
    // 🆕 获取所有文件夹（按order排序）
    sortedCollections: (state) => {
      return [...state.collections].sort((a, b) => a.order - b.order)
    },

    // 🆕 获取当前层级的子文件夹
    currentLevelCollections: (state) => {
      return state.collections
        .filter(c => c.parentId === state.currentCollectionId)
        .sort((a, b) => a.order - b.order)
    },

    // 🆕 获取当前文件夹的直接任务（不包括子文件夹）
    currentCollectionDirectTasks: (state) => {
      if (state.currentCollectionId === null) {
        // 全部笔记本：显示所有任务
        return state.tasks
      }
      return state.tasks.filter(t => t.collectionId === state.currentCollectionId)
    }
  },

  actions: {
    async loadTasks() {
      if (!this.currentUser) return
      
      // 🔄 只有在接管模式开启时，才从数据库拉取
      // ⚠️ 修复：避免未勾选接管时仍然从数据库读取
      const shouldPullFromDB = await this.checkDatabaseTakeover()
      console.log('🔍 loadTasks - 是否从数据库拉取:', shouldPullFromDB)
      if (shouldPullFromDB) {
        console.log('🔽 开始从数据库拉取数据...')
        await this.pullFromDatabase()
      } else {
        console.log('✅ 跳过数据库拉取，直接从本地 Preferences 加载')
      }
      
      // 按用户加载任务（支持分批加载）
      const tasksKey = `tasks_${this.currentUser}`
      
      // 检查是否有分批数据
      const { value: metaValue } = await Preferences.get({ key: `${tasksKey}_meta` })
      
      if (metaValue) {
        // 分批加载
        console.log('📦 loadTasks - 检测到分批数据，开始分批加载')
        const meta = JSON.parse(metaValue)
        console.log('📦 loadTasks - 分批元数据:', meta)
        const allTasks = []
        
        for (let i = 0; i < meta.batches; i++) {
          const { value: batchValue } = await Preferences.get({ key: `${tasksKey}_batch_${i}` })
          if (batchValue) {
            const batch = JSON.parse(batchValue)
            allTasks.push(...batch)
            console.log(`📦 loadTasks - 加载批次 ${i}: ${batch.length} 个任务`)
          }
        }
        
        this.tasks = allTasks
        console.log('📦 loadTasks - 分批加载完成，总任务数:', this.tasks.length)
        console.log('📦 loadTasks - 已完成任务数量:', this.tasks.filter(t => t.status === 'completed').length)
      } else {
        // 正常加载
        const { value } = await Preferences.get({ key: tasksKey })
        if (value) {
          this.tasks = JSON.parse(value)
          console.log('📖 loadTasks - 从 Preferences 加载任务数量:', this.tasks.length)
          console.log('📖 loadTasks - 已完成任务数量:', this.tasks.filter(t => t.status === 'completed').length)
        } else {
          this.tasks = []
          console.log('📖 loadTasks - Preferences 中无数据，初始化为空数组')
        }
      }
      
      // 数据迁移：为旧任务添加 logs、stats、waitFor、collectionId 和 media 字段
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
          waitFor,
          collectionId: task.collectionId !== undefined ? task.collectionId : null,  // 🆕 文件夹ID
          media: task.media || []  // 🆕 媒体资源数组
        }
      })
      
      // 加载回收站数据（支持分批加载）
      const deletedKey = `deletedTasks_${this.currentUser}`
      const { value: deletedMetaValue } = await Preferences.get({ key: `${deletedKey}_meta` })
      
      if (deletedMetaValue) {
        // 分批加载
        const meta = JSON.parse(deletedMetaValue)
        const allDeleted = []
        
        for (let i = 0; i < meta.batches; i++) {
          const { value: batchValue } = await Preferences.get({ key: `${deletedKey}_batch_${i}` })
          if (batchValue) {
            const batch = JSON.parse(batchValue)
            allDeleted.push(...batch)
          }
        }
        
        this.deletedTasks = allDeleted
      } else {
        // 正常加载
        const { value: deleted } = await Preferences.get({ key: deletedKey })
        if (deleted) {
          this.deletedTasks = JSON.parse(deleted)
        } else {
          this.deletedTasks = []
        }
      }
      
      // 数据迁移：为旧任务添加 logs、stats、waitFor 和 collectionId 字段
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
          waitFor,
          collectionId: task.collectionId !== undefined ? task.collectionId : null
        }
      })
      
      // 🆕 加载文件夹
      await this.loadCollections()
    },

    async saveTasks() {
      if (!this.currentUser) return
      
      console.log('💾 saveTasks - 开始保存任务到本地 Preferences')
      console.log('💾 saveTasks - 任务数量:', this.tasks.length)
      console.log('💾 saveTasks - 已完成任务数量:', this.tasks.filter(t => t.status === 'completed').length)
      
      const tasksKey = `tasks_${this.currentUser}`
      
      // 🔧 修复：清除旧的分批数据，避免加载时读取旧数据
      const { value: metaValue } = await Preferences.get({ key: `${tasksKey}_meta` })
      if (metaValue) {
        console.log('🧹 saveTasks - 检测到旧的分批数据，开始清理')
        const meta = JSON.parse(metaValue)
        for (let i = 0; i < meta.batches; i++) {
          await Preferences.remove({ key: `${tasksKey}_batch_${i}` })
        }
        await Preferences.remove({ key: `${tasksKey}_meta` })
        console.log('✅ saveTasks - 旧分批数据已清理')
      }
      
      // 1. 本地存储（主数据源，优先保存）
      await Preferences.set({ key: tasksKey, value: JSON.stringify(this.tasks) })
      await Preferences.set({ key: `deletedTasks_${this.currentUser}`, value: JSON.stringify(this.deletedTasks) })
      
      console.log('✅ saveTasks - 本地 Preferences 保存完成')
      
      // 2. 自动备份（每天首次变动时）
      await performBackup()
      
      // 3. 数据库接管模式（异步，不阻塞）
      this.syncToDatabase()
    },

    async syncToDatabase() {
      try {
        // 🔧 修复：只有勾选接管时才同步到数据库
        const shouldSync = await this.checkDatabaseTakeover()
        if (!shouldSync) {
          console.log('⏭️ 数据库接管未开启，跳过同步')
          return
        }
        
        // 动态导入，避免循环依赖
        const { mysqlConfigService } = await import('../services/mysqlConfig')
        const { sqliteConfigService } = await import('../services/sqliteConfig')
        const { Preferences } = await import('@capacitor/preferences')
        
        // 获取数据库类型
        const { value: dbType } = await Preferences.get({ key: 'db_type' })
        console.log('🔄 syncToDatabase - dbType:', dbType)
        
        if (dbType === 'mysql') {
          const { mysqlSyncService } = await import('../services/mysqlSync')
          const config = await mysqlConfigService.getConfig()
          if (config) {
            console.log('🔄 开始同步到MySQL...')
            const result = await mysqlSyncService.syncToMySQL(config, {
              username: this.currentUser,
              tasks: this.tasks,
              deletedTasks: this.deletedTasks,
              collections: this.collections
            })
            console.log('✅ MySQL同步结果:', result)
          }
        } else if (dbType === 'sqlite') {
          const { sqliteService } = await import('../services/sqliteService')
          console.log('🔄 开始同步到SQLite...')
          const result = await sqliteService.sync(this.currentUser, this.tasks, this.collections)
          console.log('✅ SQLite同步结果:', result)
        }
      } catch (error) {
        // 数据库同步失败不影响应用使用
        console.error('❌ 数据库同步失败:', error)
      }
    },
    
    // 🆕 检查数据库接管状态（统一判断逻辑）
    async checkDatabaseTakeover() {
      try {
        const { Preferences } = await import('@capacitor/preferences')
        const { value: dbType } = await Preferences.get({ key: 'db_type' })
        
        console.log('🔍 checkDatabaseTakeover - db_type:', dbType)
        
        if (dbType === 'mysql') {
          const { mysqlConfigService } = await import('../services/mysqlConfig')
          const isTakeover = await mysqlConfigService.getTakeover()
          console.log('🔍 checkDatabaseTakeover - MySQL接管状态:', isTakeover)
          return isTakeover
        } else if (dbType === 'sqlite') {
          const { sqliteConfigService } = await import('../services/sqliteConfig')
          const isTakeover = await sqliteConfigService.getTakeover()
          console.log('🔍 checkDatabaseTakeover - SQLite接管状态:', isTakeover)
          return isTakeover
        }
        
        console.log('🔍 checkDatabaseTakeover - 无数据库类型，返回 false')
        return false  // 没有设置数据库类型，默认不接管
      } catch (error) {
        console.error('❌ 检查数据库接管状态失败:', error)
        return false
      }
    },
    
    // 🆕 从数据库拉取最新数据（接管模式自动同步）
    async pullFromDatabase() {
      try {
        const { mysqlConfigService } = await import('../services/mysqlConfig')
        const { Preferences } = await import('@capacitor/preferences')
        
        // 获取数据库类型
        const { value: dbType } = await Preferences.get({ key: 'db_type' })
        
        if (dbType === 'mysql') {
          const { mysqlSyncService } = await import('../services/mysqlSync')
          const config = await mysqlConfigService.getConfig()
          if (config) {
            console.log('🔽 从MySQL拉取最新数据...')
            const result = await mysqlSyncService.restoreFromMySQL(config, this.currentUser)
            if (result.success) {
              console.log('✅ 数据拉取成功，已自动合并到本地')
              // restoreFromMySQL 已经将数据合并并保存到 Preferences
              // loadTasks() 后续会读取 Preferences，这里不需要重复读取
              
              // 🔧 修复孤儿任务（文件夹被删除但任务仍引用）
              this.fixOrphanTasks()
            }
          }
        } else if (dbType === 'sqlite') {
          const { sqliteService } = await import('../services/sqliteService')
          console.log('🔽 从SQLite拉取最新数据...')
          const result = await sqliteService.restore(this.currentUser)
          if (result.success) {
            console.log('✅ 数据拉取成功')
            this.fixOrphanTasks()
          }
        }
      } catch (error) {
        console.error('❌ 从数据库拉取数据失败:', error)
      }
    },
    
    // 🆕 修复孤儿任务
    fixOrphanTasks() {
      const collectionIds = new Set(this.collections.map(c => c.id))
      let fixedCount = 0
      
      this.tasks.forEach(task => {
        if (task.collectionId && !collectionIds.has(task.collectionId)) {
          console.log(`🔧 修复孤儿任务: ${task.text} (collectionId: ${task.collectionId} 不存在)`)
          task.collectionId = null
          fixedCount++
        }
      })
      
      if (fixedCount > 0) {
        console.log(`✅ 已修复 ${fixedCount} 个孤儿任务`)
        this.saveTasks() // 保存修复后的数据
      }
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
        logs: taskData.logs || [], // 任务执行日志
        stats: taskData.stats || this.calculateTaskStats([]), // 统计数据
        waitFor: taskData.waitFor || [], // 等待的任务ID数组
        parentTaskId: taskData.parentTaskId || null, // 父任务ID（AI拆分）
        subtasks: taskData.subtasks || [], // 子任务ID列表
        aiSummary: taskData.aiSummary || null, // AI生成的任务总结
        collectionId: taskData.collectionId !== undefined ? taskData.collectionId : null,  // 🆕 所属文件夹ID
        media: taskData.media || []  // 🆕 媒体资源
      }
      this.tasks.push(task)
      
      // 🔧 修复：如果是子任务，自动更新父任务的subtasks字段
      if (task.parentTaskId) {
        const parentTask = this.tasks.find(t => t.id === task.parentTaskId)
        if (parentTask) {
          if (!parentTask.subtasks) parentTask.subtasks = []
          if (!parentTask.subtasks.includes(task.id)) {
            parentTask.subtasks.push(task.id)
            console.log(`✅ 已将子任务 ${task.id} 添加到父任务 ${parentTask.id} 的subtasks`)
          }
        }
      }
      
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
        
        // 🔧 修复：如果是子任务，从父任务的subtasks中移除
        if (task.parentTaskId) {
          const parentTask = this.tasks.find(t => t.id === task.parentTaskId)
          if (parentTask && Array.isArray(parentTask.subtasks)) {
            parentTask.subtasks = parentTask.subtasks.filter(id => id !== taskId)
            console.log(`✅ 已从父任务 ${parentTask.id} 的subtasks中移除子任务 ${taskId}`)
          }
        }
        
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
      // 1. 清空任务数据
      this.tasks = []
      this.deletedTasks = []
      
      // 2. 清空笔记本数据
      this.collections = []
      
      // 3. 保存到 Preferences
      await this.saveTasks()
      await this.saveCollections()  // 🔧 修复：保存笔记本清空状态
      
      // 4. 清空 localStorage 中的用户数据
      if (this.currentUser) {
        const username = this.currentUser
        
        // 清空 AI 报告历史
        localStorage.removeItem(`unified_reports_${username}`)
        localStorage.removeItem(`weekly_reports_${username}`)
        
        // 清空 AI 对话历史
        localStorage.removeItem(`ai_chat_list_${username}`)
        
        // 清空番茄钟通知记录
        await Preferences.remove({ key: `notified_reminders_${username}` })
        
        console.log(`✅ 已清空用户 ${username} 的所有数据`)
      }
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
      const tasksToResetReminders = [] // 记录需要取消提醒的任务
      
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
            tasksToResetReminders.push(task.id)
          }
          
          // 工作日重复：如果今天是工作日且完成日期不是今天，重置为待办
          if (task.type === 'weekday') {
            const dayOfWeek = now.getDay()
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
            if (isWeekday && completedDay < today) {
              task.status = 'pending'
              task.completed_at = null
              hasChanges = true
              tasksToResetReminders.push(task.id)
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
              tasksToResetReminders.push(task.id)
            }
          }
        }
      })
      
      if (hasChanges) {
        this.saveTasks()
        // 取消重置任务的旧提醒
        this.cancelRemindersForTasks(tasksToResetReminders)
      }
    },

    // 取消指定任务的提醒
    async cancelRemindersForTasks(taskIds) {
      try {
        if (taskIds.length === 0) return
        
        const notificationsToCancel = taskIds.map(taskId => ({
          id: (Math.abs(taskId) % 100000) * 10 + 3 // 使用 reminder 类型的 ID
        }))
        
        await LocalNotifications.cancel({ notifications: notificationsToCancel })
        console.log('✅ 已取消重复任务的提醒:', taskIds)
      } catch (error) {
        console.error('取消提醒失败:', error)
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
          // 已完成任务：权重最低
          if (task.status === 'completed') return 10000
          
          // 置顶任务：基础权重 0-2（按优先级细分）
          if (task.is_pinned) {
            const pinPriority = { high: 0, medium: 1, low: 2 }
            return pinPriority[task.priority]
          }
          
          // 计算距离截止时间（小时）
          const deadline = this.calculateDeadline(task)
          const hoursUntilDeadline = deadline ? (new Date(deadline) - new Date()) / 3600000 : null
          
          // 逾期任务：权重 100-399（时间越久权重越大）
          if (task.status === 'overdue') {
            const daysOverdue = Math.abs(hoursUntilDeadline) / 24
            
            // 基础权重：按优先级分层
            const baseOverdue = { high: 100, medium: 150, low: 200 }
            let weight = baseOverdue[task.priority] || 200
            
            // 衰减惩罚：每天+5分，上限+150分（30天封顶）
            const decayPenalty = Math.min(daysOverdue * 5, 150)
            weight += decayPenalty
            
            return weight
          }
          
          // 待办任务：权重 400-9999
          // 核心逻辑：时间紧迫性 > 优先级
          
          if (hoursUntilDeadline !== null) {
            // 有截止时间的任务：按时间远近排序
            let weight = 400
            
            // 时间权重：0-24小时内每小时+10分，24小时后每天+20分
            if (hoursUntilDeadline <= 24) {
              // 24小时内：400-640（每小时+10分）
              weight += Math.floor(hoursUntilDeadline * 10)
            } else {
              // 24小时后：640+（每天+20分，上限+2000分）
              const daysUntilDeadline = hoursUntilDeadline / 24
              weight += 240 + Math.min(Math.floor(daysUntilDeadline * 20), 2000)
            }
            
            // 优先级微调：在时间权重基础上微调（不改变时间顺序）
            const priorityAdjust = { high: -3, medium: 0, low: 3 }
            weight += priorityAdjust[task.priority] || 0
            
            return weight
          } else {
            // 无截止时间的任务：权重 3000-3200（只按优先级排序）
            const noDuePriority = { high: 3000, medium: 3100, low: 3200 }
            return noDuePriority[task.priority] || 3200
          }
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
        
        case 'day_after_tomorrow':
          // 后天：后天23:59:59截止
          const dayAfterTomorrow = new Date(now)
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
          return new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 23, 59, 59)
        
        case 'this_week':
          const endOfWeek = new Date(now)
          const dayOfWeek = now.getDay()
          const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
          endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday)
          return new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59)
        
        case 'next_week':
          // 下周：下周日23:59:59截止
          const nextWeekEnd = new Date(now)
          const currentDay = now.getDay()
          const daysUntilNextSunday = currentDay === 0 ? 7 : 14 - currentDay
          nextWeekEnd.setDate(nextWeekEnd.getDate() + daysUntilNextSunday)
          return new Date(nextWeekEnd.getFullYear(), nextWeekEnd.getMonth(), nextWeekEnd.getDate(), 23, 59, 59)
        
        case 'this_month':
          // 本月内：本月最后一天23:59:59截止
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          return new Date(endOfMonth.getFullYear(), endOfMonth.getMonth(), endOfMonth.getDate(), 23, 59, 59)
        
        case 'monthly':
          // 每月重复：每月指定日期23:59:59截止（必须设置monthDay）
          if (task.monthDay) {
            const targetDay = Math.min(task.monthDay, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
            if (now.getDate() <= targetDay) {
              // 本月还没到指定日期
              return new Date(now.getFullYear(), now.getMonth(), targetDay, 23, 59, 59)
            } else {
              // 本月已过，下月指定日期
              const nextMonthDay = Math.min(task.monthDay, new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate())
              return new Date(now.getFullYear(), now.getMonth() + 1, nextMonthDay, 23, 59, 59)
            }
          }
          // 如果没有设置日期，返回null（静默处理，避免日志刷屏）
          return null
        
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
    },

    // ========== 🆕 文件夹/合集管理方法 ==========
    
    // 加载文件夹
    async loadCollections() {
      if (!this.currentUser) return
      const { value } = await Preferences.get({ 
        key: `collections_${this.currentUser}` 
      })
      this.collections = value ? JSON.parse(value) : []
      
      // 🆕 数据迁移：为旧数据添加parentId字段
      this.collections.forEach(c => {
        if (c.parentId === undefined) {
          c.parentId = null
        }
      })
      
      // 🐛 修复孤儿笔记本：如果parentId指向的笔记本不存在，提升为根级
      const validIds = new Set(this.collections.map(c => c.id))
      this.collections.forEach(c => {
        if (c.parentId !== null && !validIds.has(c.parentId)) {
          console.warn(`🔧 修复孤儿笔记本: "${c.name}" (parentId: ${c.parentId} 不存在) → 提升为根级`)
          c.parentId = null
        }
      })
      
      // 🆕 数据迁移：为旧数据添加时间戳字段
      const now = new Date().toISOString()
      this.collections.forEach(c => {
        if (!c.createdAt) {
          c.createdAt = c.created_at || now
        }
        if (!c.updatedAt) {
          c.updatedAt = c.created_at || now
        }
      })
      
      // 保存修复后的数据
      await this.saveCollections()
    },

    // 保存文件夹
    async saveCollections() {
      if (!this.currentUser) return
      await Preferences.set({ 
        key: `collections_${this.currentUser}`, 
        value: JSON.stringify(this.collections) 
      })
    },

    // 创建文件夹
    async createCollection({ name, description = '', color = '#8b5cf6', icon = '📁', isPrivate = false, password = '', parentId = null }) {
      const now = new Date().toISOString()
      const collection = {
        id: Date.now(),
        name,
        description,
        color,
        icon,
        isPrivate,
        password: isPrivate ? btoa(password) : '', // Base64简单加密
        parentId, // 🆕 父文件夹ID（null表示根级）
        order: this.collections.length,
        created_at: now,
        createdAt: now, // 🆕 创建时间
        updatedAt: now, // 🆕 更新时间
        user_id: this.currentUser
      }
      this.collections.push(collection)
      await this.saveCollections()
      return collection
    },

    // 更新文件夹
    async updateCollection(id, updates) {
      const collection = this.collections.find(c => c.id === id)
      if (collection) {
        Object.assign(collection, updates, { updatedAt: new Date().toISOString() }) // 🆕 更新时间
        await this.saveCollections()
      }
    },

    // 验证文件夹密码
    verifyCollectionPassword(id, password) {
      const collection = this.collections.find(c => c.id === id)
      if (!collection || !collection.isPrivate) return true
      return collection.password === btoa(password)
    },

    // 修改文件夹密码
    async changeCollectionPassword(id, oldPassword, newPassword) {
      const collection = this.collections.find(c => c.id === id)
      if (!collection || !collection.isPrivate) return false
      
      if (collection.password !== btoa(oldPassword)) {
        return false // 旧密码错误
      }
      
      collection.password = btoa(newPassword)
      await this.saveCollections()
      return true
    },

    // 删除文件夹
    async deleteCollection(id, action = 'uncategorize') {
      // action: 'delete' | 'uncategorize' | 'promote' | { moveTo: collectionId }
      const tasksInCollection = this.tasks.filter(t => t.collectionId === id)
      const childCollections = this.collections.filter(c => c.parentId === id)
      
      if (action === 'delete') {
        // 级联删除：删除所有任务和子文件夹
        tasksInCollection.forEach(task => {
          this.deletedTasks.push(task)
        })
        this.tasks = this.tasks.filter(t => t.collectionId !== id)
        
        // 递归删除子文件夹
        for (const child of childCollections) {
          await this.deleteCollection(child.id, 'delete')
        }
      } else if (action === 'promote') {
        // 提升到根级：子文件夹提升到父级
        const parentCollection = this.collections.find(c => c.id === id)
        const parentId = parentCollection?.parentId || null
        
        childCollections.forEach(child => {
          child.parentId = parentId
        })
        
        // 任务移到未分类
        tasksInCollection.forEach(task => {
          task.collectionId = null
        })
      } else if (action === 'uncategorize') {
        // 移到未分类
        tasksInCollection.forEach(task => {
          task.collectionId = null
        })
        
        // 子文件夹提升到根级
        childCollections.forEach(child => {
          child.parentId = null
        })
      } else if (action.moveTo) {
        // 移到其他文件夹
        tasksInCollection.forEach(task => {
          task.collectionId = action.moveTo
        })
        
        // 子文件夹也移动
        childCollections.forEach(child => {
          child.parentId = action.moveTo
        })
      }
      
      // 删除文件夹
      this.collections = this.collections.filter(c => c.id !== id)
      
      await this.saveTasks()
      await this.saveCollections()
    },

    // 文件夹排序
    async reorderCollections(newOrder) {
      // newOrder: [id1, id2, id3, ...]
      newOrder.forEach((id, index) => {
        const collection = this.collections.find(c => c.id === id)
        if (collection) collection.order = index
      })
      await this.saveCollections()
    },

    // 任务设置文件夹
    async setTaskCollection(taskId, collectionId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        task.collectionId = collectionId  // null = 未分类
        await this.saveTasks()
      }
    },

    // 批量设置任务文件夹
    async batchSetTaskCollection(taskIds, collectionId) {
      taskIds.forEach(id => {
        const task = this.tasks.find(t => t.id === id)
        if (task) task.collectionId = collectionId
      })
      await this.saveTasks()
    },

    // 获取文件夹内的任务
    getCollectionTasks(collectionId) {
      return this.tasks.filter(t => t.collectionId === collectionId)
    },

    // 🆕 递归获取文件夹及其所有子文件夹的任务
    getCollectionTasksRecursive(collectionId) {
      const directTasks = this.tasks.filter(t => t.collectionId === collectionId)
      const childCollections = this.collections.filter(c => c.parentId === collectionId)
      
      const childTasks = childCollections.flatMap(child => 
        this.getCollectionTasksRecursive(child.id)
      )
      
      return [...directTasks, ...childTasks]
    },

    // 🆕 递归统计任务数量
    getCollectionTaskCount(collectionId) {
      return this.getCollectionTasksRecursive(collectionId).length
    },

    // 🆕 获取面包屑路径
    getCollectionBreadcrumb(collectionId) {
      const path = []
      let current = this.collections.find(c => c.id === collectionId)
      
      while (current) {
        path.unshift(current)
        current = this.collections.find(c => c.id === current.parentId)
      }
      
      return path
    },

    // 🆕 检查是否可以移动到目标文件夹（防止循环）
    canMoveCollectionTo(sourceId, targetId) {
      if (sourceId === targetId) return false
      
      let current = this.collections.find(c => c.id === targetId)
      while (current) {
        if (current.id === sourceId) return false
        current = this.collections.find(c => c.id === current.parentId)
      }
      
      return true
    },

    // 🆕 移动文件夹到新位置
    async moveCollection(collectionId, newParentId) {
      if (!this.canMoveCollectionTo(collectionId, newParentId)) {
        throw new Error('无法移动：会造成循环依赖')
      }
      
      const collection = this.collections.find(c => c.id === collectionId)
      if (collection) {
        collection.parentId = newParentId
        await this.saveCollections()
      }
    },

    // 🆕 检查文件夹是否被加密（包括父级）
    isCollectionLocked(collectionId) {
      let current = this.collections.find(c => c.id === collectionId)
      
      while (current) {
        if (current.isPrivate && current.password) return true
        current = this.collections.find(c => c.id === current.parentId)
      }
      
      return false
    },

    // 🆕 获取子文件夹列表
    getChildCollections(parentId) {
      return this.collections
        .filter(c => c.parentId === parentId)
        .sort((a, b) => b.id - a.id) // 最新创建的在前
    },

    // 🆕 进入文件夹
    enterCollection(collectionId) {
      this.currentCollectionId = collectionId
    },

    // 🆕 返回上一级
    goBackCollection() {
      if (this.currentCollectionId === null) return
      
      const current = this.collections.find(c => c.id === this.currentCollectionId)
      this.currentCollectionId = current?.parentId || null
    },

    // 🆕 返回根级（全部笔记本）
    goToRootCollection() {
      this.currentCollectionId = null
    },

    // 获取文件夹统计
    getCollectionStats(collectionId) {
      const tasks = this.getCollectionTasks(collectionId)
      return {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        overdue: tasks.filter(t => t.status === 'overdue').length
      }
    }
  }
})
