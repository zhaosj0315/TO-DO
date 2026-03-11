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
  
  // 同步媒体文件到服务器
  async syncMediaFiles(config, username, tasks) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const baseUrl = 'http://192.168.31.159:3000'
      
      // 收集所有任务中的媒体文件
      const mediaFiles = []
      for (const task of tasks) {
        if (task.media && Array.isArray(task.media)) {
          mediaFiles.push(...task.media)
        }
      }
      
      console.log(`📤 准备上传 ${mediaFiles.length} 个媒体文件`)
      
      // 逐个上传文件
      for (const media of mediaFiles) {
        try {
          // 读取文件内容
          const fileData = await Filesystem.readFile({
            path: media.path,
            directory: Directory.Data
          })
          
          // 上传到服务器
          await fetch(`${baseUrl}/api/mysql/upload-media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config: {
                host: config.host,
                port: config.port,
                user: config.user || config.username,
                password: config.password,
                database: config.database
              },
              username,
              fileId: media.id,
              fileName: media.name,
              filePath: media.path,
              fileData: fileData.data, // base64
              fileType: media.type
            })
          })
          
          console.log(`✅ 上传成功: ${media.name}`)
        } catch (err) {
          console.warn(`⚠️ 上传失败: ${media.name}`, err)
        }
      }
    } catch (error) {
      console.error('媒体文件同步失败:', error)
    }
  },
  
  // 从服务器下载媒体文件
  async downloadMediaFiles(config, username, tasks) {
    try {
      const { Capacitor } = await import('@capacitor/core')
      const isWeb = Capacitor.getPlatform() === 'web'
      const baseUrl = 'http://192.168.31.159:3000'
      
      // 收集所有任务中的媒体文件
      const mediaFiles = []
      for (const task of tasks) {
        if (task.media && Array.isArray(task.media)) {
          for (const media of task.media) {
            mediaFiles.push({ media, taskId: task.id })
          }
        }
      }
      
      console.log(`📥 准备下载 ${mediaFiles.length} 个媒体文件`)
      
      if (isWeb) {
        // Web端：将base64数据直接存储到media对象中
        for (const { media, taskId } of mediaFiles) {
          try {
            // 跳过已有base64数据的文件
            if (media.base64Data) {
              console.log(`⏭️ 文件已有数据，跳过: ${media.name}`)
              continue
            }
            
            // 从服务器下载
            const response = await fetch(`${baseUrl}/api/mysql/download-media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                config: {
                  host: config.host,
                  port: config.port,
                  user: config.user || config.username,
                  password: config.password,
                  database: config.database
                },
                username,
                fileId: media.id
              })
            })
            
            const result = await response.json()
            if (result.success && result.fileData) {
              // 直接存储base64到media对象
              media.base64Data = result.fileData
              console.log(`✅ 下载成功: ${media.name}`)
            }
          } catch (err) {
            console.warn(`⚠️ 下载失败: ${media.name}`, err)
          }
        }
        
        // 保存更新后的任务数据
        const { Preferences } = await import('@capacitor/preferences')
        await Preferences.set({
          key: `tasks_${username}`,
          value: JSON.stringify(tasks)
        })
      } else {
        // 原生端：保存到文件系统
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        
        for (const { media } of mediaFiles) {
          try {
            // 检查本地是否已存在
            try {
              await Filesystem.stat({
                path: media.path,
                directory: Directory.Data
              })
              console.log(`⏭️ 文件已存在，跳过: ${media.name}`)
              continue
            } catch {
              // 文件不存在，继续下载
            }
            
            // 从服务器下载
            const response = await fetch(`${baseUrl}/api/mysql/download-media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                config: {
                  host: config.host,
                  port: config.port,
                  user: config.user || config.username,
                  password: config.password,
                  database: config.database
                },
                username,
                fileId: media.id
              })
            })
            
            const result = await response.json()
            if (result.success && result.fileData) {
              // 保存到本地文件系统
              await Filesystem.writeFile({
                path: media.path,
                data: result.fileData,
                directory: Directory.Data
              })
              console.log(`✅ 下载成功: ${media.name}`)
            }
          } catch (err) {
            console.warn(`⚠️ 下载失败: ${media.name}`, err)
          }
        }
      }
    } catch (error) {
      console.error('媒体文件下载失败:', error)
    }
  },

  // 同步所有数据到MySQL
  async syncToMySQL(config, userData) {
    try {
      // Android需要使用局域网IP
      const baseUrl = 'http://192.168.31.159:3000'
      
      // 收集localStorage数据（按用户隔离）
      const username = userData.username
      
      console.log('🔍 syncToMySQL 收到的数据:')
      console.log('  - username:', username)
      console.log('  - tasks:', userData.tasks?.length || 0)
      console.log('  - deletedTasks:', userData.deletedTasks?.length || 0)
      console.log('  - collections:', userData.collections?.length || 0)
      
      // 🆕 同步媒体文件
      await this.syncMediaFiles(config, username, userData.tasks || [])
      
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
      
      const requestBody = {
        config: {
          host: config.host,
          port: config.port,
          user: config.user || config.username,  // 字段映射：username → user
          password: config.password,
          database: config.database
        },
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
      }
      
      console.log('📤 即将发送的请求体:')
      console.log('  - data.tasks.length:', requestBody.data.tasks?.length)
      console.log('  - data.deletedTasks.length:', requestBody.data.deletedTasks?.length)
      console.log('  - data.collections.length:', requestBody.data.collections?.length)
      
      const response = await fetch(`${baseUrl}/api/mysql/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
        body: JSON.stringify({ 
          config: {
            host: config.host,
            port: config.port,
            user: config.user || config.username,  // 字段映射：username → user
            password: config.password,
            database: config.database
          }, 
          username 
        })
      })
      const result = await response.json()
      
      console.log('🔍 restoreFromMySQL - 后端响应:', result)
      
      if (result.success && result.data) {
        console.log('📊 restoreFromMySQL - 数据统计:')
        console.log('  - tasks:', result.data.tasks?.length || 0)
        console.log('  - deletedTasks:', result.data.deletedTasks?.length || 0)
        console.log('  - collections:', result.data.collections?.length || 0)
        
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
        
        // 🆕 7. 下载媒体文件
        await this.downloadMediaFiles(config, username, result.data.tasks || [])
      }
      
      return result
    } catch (error) {
      console.error('恢复失败:', error)
      return { success: false, error: error.message }
    }
  }
}
