export const mysqlSyncService = {
  // 同步所有数据到MySQL
  async syncToMySQL(config, userData) {
    try {
      // Android需要使用局域网IP
      const baseUrl = 'http://192.168.31.159:3000'
      
      const response = await fetch(`${baseUrl}/api/mysql/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          data: {
            username: userData.username,
            tasks: userData.tasks,
            deletedTasks: userData.deletedTasks,
            collections: userData.collections
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
  async restoreFromMySQL(config, username) {
    try {
      const baseUrl = 'http://192.168.31.159:3000'
      
      const response = await fetch(`${baseUrl}/api/mysql/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, username })
      })
      const result = await response.json()
      return result
    } catch (error) {
      console.error('恢复失败:', error)
      return { success: false, error: error.message }
    }
  }
}
