export const mysqlSyncService = {
  // 合并数据：按id去重，保留最新的（根据created_at或updated_at）
  mergeByIdKeepLatest(localData, remoteData) {
    const map = new Map()
    
    // 先添加本地数据
    localData.forEach(item => {
      map.set(item.id, item)
    })
    
    // 再添加远程数据，如果id相同则比较时间戳
    remoteData.forEach(item => {
      const existing = map.get(item.id)
      if (!existing) {
        // 不存在，直接添加
        map.set(item.id, item)
      } else {
        // 存在，比较时间戳，保留最新的
        const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime()
        const remoteTime = new Date(item.updated_at || item.created_at || 0).getTime()
        
        if (remoteTime > existingTime) {
          map.set(item.id, item)
        }
      }
    })
    
    return Array.from(map.values())
  },
  
  // 同步所有数据到MySQL
  async syncToMySQL(config, userData) {
    try {
      // Android需要使用局域网IP
      const baseUrl = 'http://192.168.31.159:3000'
      
      // 收集localStorage数据（按用户隔离）
      const username = userData.username
      
      // 数据迁移：检查旧key并迁移到新key
      const migrateData = (oldKey, newKey) => {
        const oldData = localStorage.getItem(oldKey)
        const newData = localStorage.getItem(newKey)
        if (oldData && !newData) {
          console.log(`🔄 迁移数据: ${oldKey} → ${newKey}`)
          localStorage.setItem(newKey, oldData)
          return oldData
        }
        return newData
      }
      
      // 迁移AI对话
      migrateData('ai_chat_list', `ai_chat_list_${username}`)
      
      // 迁移报告
      migrateData('weekly_reports', `weekly_reports_${username}`)
      migrateData('unified_reports', `unified_reports_${username}`)
      
      const aiModels = JSON.parse(localStorage.getItem(`ai_models_${username}`) || '[]')
      const aiDefaultModel = localStorage.getItem(`ai_default_model_${username}`) || ''
      const aiProviderConfigs = JSON.parse(localStorage.getItem(`ai_provider_configs_${username}`) || '[]')
      const lastVersion = localStorage.getItem(`last_app_version_${username}`) || ''
      
      // AI对话历史
      const aiChatList = JSON.parse(localStorage.getItem(`ai_chat_list_${username}`) || '[]')
      const aiChatHistory = aiChatList.map(chat => ({
        id: chat.id,
        chatId: chat.id,
        messages: chat.messages || [],
        createdAt: chat.createdAt || new Date().toISOString()
      }))
      
      // 报告历史
      const weeklyReports = JSON.parse(localStorage.getItem(`weekly_reports_${username}`) || '[]')
      const unifiedReports = JSON.parse(localStorage.getItem(`unified_reports_${username}`) || '[]')
      const allReports = [...weeklyReports, ...unifiedReports].map(report => ({
        id: report.id || Date.now(),
        type: report.type || 'weekly',
        data: report,
        createdAt: report.createdAt || report.date || new Date().toISOString()
      }))
      
      // 调试日志
      console.log('📊 同步数据统计:')
      console.log('  - 任务:', userData.tasks?.length || 0)
      console.log('  - 回收站:', userData.deletedTasks?.length || 0)
      console.log('  - 文件夹:', userData.collections?.length || 0)
      console.log('  - AI对话:', aiChatHistory.length)
      console.log('  - 报告:', allReports.length)
      console.log('  - AI模型:', aiModels.length)
      
      const response = await fetch(`${baseUrl}/api/mysql/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          data: {
            username: userData.username,
            tasks: userData.tasks,
            deletedTasks: userData.deletedTasks,
            collections: userData.collections,
            userSettings: {
              aiModels,
              aiDefaultModel,
              aiProviderConfigs,
              lastVersion,
              settings: {
                aiDefaultModel
              }
            },
            aiChatHistory,
            reports: allReports
          }
        })
      })
      const result = await response.json()
      return result
    } catch (error) {
      console.error('同步失败:', error)
      return { success: false, error: error.message }
    }
  },

  // 从MySQL恢复数据
  async restoreFromMySQL(config, userData) {
    // 兼容旧调用方式（只传username字符串）
    const username = typeof userData === 'string' ? userData : userData.username
    
    try {
      const baseUrl = 'http://192.168.31.159:3000'
      
      const response = await fetch(`${baseUrl}/api/mysql/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, username })
      })
      const result = await response.json()
      
      if (result.success && result.data) {
        // 恢复到本地存储（合并策略，不覆盖）
        const { Preferences } = await import('@capacitor/preferences')
        
        // 1. 合并任务数据
        const localTasksStr = await Preferences.get({ key: `tasks_${username}` })
        const localTasks = localTasksStr.value ? JSON.parse(localTasksStr.value) : []
        const mergedTasks = this.mergeByIdKeepLatest(localTasks, result.data.tasks)
        await Preferences.set({ 
          key: `tasks_${username}`, 
          value: JSON.stringify(mergedTasks) 
        })
        
        // 2. 合并回收站数据
        const localDeletedStr = await Preferences.get({ key: `deletedTasks_${username}` })
        const localDeleted = localDeletedStr.value ? JSON.parse(localDeletedStr.value) : []
        const mergedDeleted = this.mergeByIdKeepLatest(localDeleted, result.data.deletedTasks)
        await Preferences.set({ 
          key: `deletedTasks_${username}`, 
          value: JSON.stringify(mergedDeleted) 
        })
        
        // 3. 合并文件夹数据
        const localCollectionsStr = await Preferences.get({ key: `collections_${username}` })
        const localCollections = localCollectionsStr.value ? JSON.parse(localCollectionsStr.value) : []
        const mergedCollections = this.mergeByIdKeepLatest(localCollections, result.data.collections)
        await Preferences.set({ 
          key: `collections_${username}`, 
          value: JSON.stringify(mergedCollections) 
        })
        
        // 4. 恢复用户配置到localStorage（按用户隔离）
        if (result.data.userSettings) {
          localStorage.setItem(`ai_models_${username}`, JSON.stringify(result.data.userSettings.aiModels))
          localStorage.setItem(`ai_default_model_${username}`, result.data.userSettings.settings.aiDefaultModel || '')
          localStorage.setItem(`last_app_version_${username}`, result.data.userSettings.lastVersion)
        }
        
        // 5. 合并AI对话历史（按用户隔离）
        if (result.data.aiChatHistory) {
          const localChats = JSON.parse(localStorage.getItem(`ai_chat_list_${username}`) || '[]')
          const mergedChats = this.mergeByIdKeepLatest(localChats, result.data.aiChatHistory)
          localStorage.setItem(`ai_chat_list_${username}`, JSON.stringify(mergedChats))
        }
        
        // 6. 合并报告历史（按用户隔离）
        if (result.data.reports) {
          const localWeekly = JSON.parse(localStorage.getItem(`weekly_reports_${username}`) || '[]')
          const localUnified = JSON.parse(localStorage.getItem(`unified_reports_${username}`) || '[]')
          
          const dbWeekly = result.data.reports.filter(r => r.type === 'weekly')
          const dbUnified = result.data.reports.filter(r => r.type !== 'weekly')
          
          const mergedWeekly = this.mergeByIdKeepLatest(localWeekly, dbWeekly)
          const mergedUnified = this.mergeByIdKeepLatest(localUnified, dbUnified)
          
          localStorage.setItem(`weekly_reports_${username}`, JSON.stringify(mergedWeekly))
          localStorage.setItem(`unified_reports_${username}`, JSON.stringify(mergedUnified))
        }
      }
      
      return result
    } catch (error) {
      console.error('恢复失败:', error)
      return { success: false, error: error.message }
    }
  }
}
