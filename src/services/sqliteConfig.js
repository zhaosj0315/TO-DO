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
  }
}
