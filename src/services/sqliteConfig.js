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

  // 设置接管状态
  async setTakeover(enabled) {
    const config = await this.getConfig()
    config.takeover = enabled
    await this.saveConfig(config)
    console.log('✅ SQLite接管状态已保存:', enabled, '完整配置:', config)
  },

  // 获取接管状态
  async getTakeover() {
    const config = await this.getConfig()
    const takeover = config?.takeover || false
    console.log('📖 SQLite读取接管状态:', takeover, '完整配置:', config)
    return takeover
  }
}
