import { Preferences } from '@capacitor/preferences'

const SQLITE_CONFIG_KEY = 'sqlite_config'

export const sqliteConfigService = {
  // 保存SQLite配置
  async saveConfig(config) {
    await Preferences.set({
      key: SQLITE_CONFIG_KEY,
      value: JSON.stringify(config)
    })
  },

  // 获取SQLite配置
  async getConfig() {
    const { value } = await Preferences.get({ key: SQLITE_CONFIG_KEY })
    return value ? JSON.parse(value) : { enabled: false }
  },

  // 删除配置
  async removeConfig() {
    await Preferences.remove({ key: SQLITE_CONFIG_KEY })
  },

  // 设置接管状态（按用户隔离）
  async setTakeover(enabled, username) {
    if (!username) {
      // 兼容旧调用，从Preferences获取当前用户
      const { value } = await Preferences.get({ key: 'currentUser' })
      username = value || 'guest'
    }
    await Preferences.set({
      key: `sqlite_takeover_${username}`,
      value: enabled ? 'true' : 'false'
    })
    console.log('✅ SQLite接管状态已保存:', enabled, 'username:', username)
  },

  // 获取接管状态（按用户隔离）
  async getTakeover(username) {
    if (!username) {
      // 兼容旧调用，从Preferences获取当前用户
      const { value } = await Preferences.get({ key: 'currentUser' })
      username = value || 'guest'
    }
    const { value } = await Preferences.get({ key: `sqlite_takeover_${username}` })
    const takeover = value === 'true'
    console.log('📖 SQLite读取接管状态:', takeover, 'username:', username)
    return takeover
  }
}
