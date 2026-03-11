import { Preferences } from '@capacitor/preferences'

const MYSQL_CONFIG_KEY = 'mysql_config'

export const mysqlConfigService = {
  // 保存MySQL配置
  async saveConfig(config) {
    await Preferences.set({
      key: MYSQL_CONFIG_KEY,
      value: JSON.stringify(config)
    })
  },

  // 获取MySQL配置
  async getConfig() {
    const { value } = await Preferences.get({ key: MYSQL_CONFIG_KEY })
    return value ? JSON.parse(value) : null
  },

  // 删除配置
  async removeConfig() {
    await Preferences.remove({ key: MYSQL_CONFIG_KEY })
  },

  // 设置接管状态（按用户隔离）
  async setTakeover(enabled, username) {
    if (!username) {
      // 兼容旧调用，从Preferences获取当前用户
      const { value } = await Preferences.get({ key: 'currentUser' })
      username = value || 'guest'
    }
    await Preferences.set({
      key: `mysql_takeover_${username}`,
      value: enabled ? 'true' : 'false'
    })
  },

  // 获取接管状态（按用户隔离）
  async getTakeover(username) {
    if (!username) {
      // 兼容旧调用，从Preferences获取当前用户
      const { value } = await Preferences.get({ key: 'currentUser' })
      username = value || 'guest'
    }
    const { value } = await Preferences.get({ key: `mysql_takeover_${username}` })
    return value === 'true'
  },

  // 测试连接
  async testConnection(config) {
    try {
      console.log('🔍 开始测试 MySQL 连接:', { 
        host: config.host, 
        port: config.port, 
        user: config.user, 
        database: config.database 
      })
      
      // Android需要使用局域网IP
      const baseUrl = config.host === 'localhost' ? 'http://192.168.31.159:3000' : `http://${config.host}:3000`
      
      const response = await fetch(`${baseUrl}/api/mysql/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (!response.ok) {
        console.error('❌ HTTP 请求失败:', response.status, response.statusText)
        return false
      }
      
      const result = await response.json()
      console.log('🔍 服务器响应:', result)
      
      if (result.success) {
        console.log('✅ MySQL 连接测试成功')
        return true
      } else {
        console.error('❌ MySQL 连接失败:', result.error)
        return false
      }
    } catch (error) {
      console.error('❌ 测试连接异常:', error)
      return false
    }
  }
}
