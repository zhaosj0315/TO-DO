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

  // 测试连接
  async testConnection(config) {
    try {
      // Android需要使用局域网IP
      const baseUrl = config.host === 'localhost' ? 'http://192.168.31.159:3000' : `http://${config.host}:3000`
      
      const response = await fetch(`${baseUrl}/api/mysql/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('测试连接失败:', error)
      return false
    }
  }
}
