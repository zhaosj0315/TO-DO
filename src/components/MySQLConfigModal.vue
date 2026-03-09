<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>🗄️ 数据库配置</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <!-- 数据库类型选择 -->
        <div class="form-group">
          <label>数据库类型</label>
          <div class="db-type-selector">
            <label class="db-type-option">
              <input type="radio" v-model="dbType" value="none" />
              <div class="option-content">
                <div class="option-icon">📱</div>
                <div class="option-text">
                  <div class="option-title">本地存储 <span class="badge">默认</span></div>
                  <div class="option-desc">仅使用应用内存储</div>
                </div>
              </div>
            </label>

            <label class="db-type-option">
              <input type="radio" v-model="dbType" value="sqlite" />
              <div class="option-content">
                <div class="option-icon">💾</div>
                <div class="option-text">
                  <div class="option-title">SQLite</div>
                  <div class="option-desc">本地数据库备份</div>
                </div>
              </div>
            </label>

            <label class="db-type-option">
              <input type="radio" v-model="dbType" value="mysql" />
              <div class="option-content">
                <div class="option-icon">🌐</div>
                <div class="option-text">
                  <div class="option-title">MySQL</div>
                  <div class="option-desc">远程服务器备份</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- 本地存储说明 -->
        <div v-if="dbType === 'none'" class="sqlite-info">
          <div class="info-card" style="border-left-color: #667eea; background: #f0f4ff;">
            <div class="info-icon">✅</div>
            <div class="info-text" style="color: #4a5568;">
              <strong>实时自动保存</strong><br>
              数据存储在应用内部<br>
              无需手动同步，每次操作自动保存
            </div>
          </div>
        </div>

        <!-- SQLite配置（自动） -->
        <div v-if="dbType === 'sqlite'" class="sqlite-info">
          <div class="info-card">
            <div class="info-icon">✅</div>
            <div class="info-text">
              <strong>本地数据库备份</strong><br>
              数据库位置: Documents/TODO-App-backups/<br>
              与完整备份保存在同一目录
            </div>
          </div>
        </div>

        <!-- MySQL配置 -->
        <div v-if="dbType === 'mysql'" class="mysql-config">
          <div class="form-group">
            <label>主机地址</label>
            <input v-model="mysqlConfig.host" placeholder="localhost" />
          </div>

          <div class="form-group">
            <label>端口</label>
            <input v-model.number="mysqlConfig.port" type="number" placeholder="3306" />
          </div>

          <div class="form-group">
            <label>用户名</label>
            <input v-model="mysqlConfig.user" placeholder="root" />
          </div>

          <div class="form-group">
            <label>密码</label>
            <input v-model="mysqlConfig.password" type="password" placeholder="数据库密码" />
          </div>

          <div class="form-group">
            <label>数据库名</label>
            <input v-model="mysqlConfig.database" placeholder="todo_app" />
          </div>
        </div>

        <div class="status-info" v-if="statusMessage">
          <span :class="statusType">{{ statusMessage }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <!-- 本地存储：无需任何按钮 -->
        <div v-if="dbType === 'none'" class="footer-tip">
          💡 本地存储无需配置，数据已实时保存
        </div>
        
        <!-- SQLite/MySQL：显示操作按钮 -->
        <template v-else>
          <button v-if="!isConnected" @click="testConnection" class="btn-test">
            🔍 测试连接
          </button>
          <button v-if="isConnected" @click="saveConfig" class="btn-save">💾 保存配置</button>
          <button v-if="isConnected" @click="syncNow" class="btn-sync">
            ⬆️ 立即同步
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Preferences } from '@capacitor/preferences'
import { mysqlConfigService } from '../services/mysqlConfig'
import { mysqlSyncService } from '../services/mysqlSync'
import { sqliteConfigService } from '../services/sqliteConfig'
import { sqliteService } from '../services/sqliteService'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'

export default {
  props: ['show'],
  emits: ['close'],
  setup(props, { emit }) {
    const taskStore = useOfflineTaskStore()
    const dbType = ref('none')
    const mysqlConfig = ref({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'todo_app'
    })
    const sqliteConfig = ref({
      enabled: false
    })
    const statusMessage = ref('')
    const statusType = ref('')
    const isConnected = ref(false)

    onMounted(async () => {
      // 加载保存的配置
      const { value } = await Preferences.get({ key: 'db_type' })
      if (value) {
        dbType.value = value
        
        // 如果已保存配置，自动测试连接
        if (value === 'sqlite') {
          const result = await sqliteService.init()
          if (result.success) {
            isConnected.value = true
            statusMessage.value = '✅ SQLite已就绪'
            statusType.value = 'success'
          }
        } else if (value === 'mysql') {
          const savedMysql = await mysqlConfigService.getConfig()
          if (savedMysql) {
            mysqlConfig.value = savedMysql
            const success = await mysqlConfigService.testConnection(savedMysql)
            if (success) {
              isConnected.value = true
              statusMessage.value = '✅ MySQL已就绪'
              statusType.value = 'success'
            }
          }
        }
      }

      const savedMysql = await mysqlConfigService.getConfig()
      if (savedMysql) {
        mysqlConfig.value = savedMysql
      }

      const savedSqlite = await sqliteConfigService.getConfig()
      if (savedSqlite) {
        sqliteConfig.value = savedSqlite
      }
    })

    const testConnection = async () => {
      statusMessage.value = '正在测试连接...'
      statusType.value = 'info'
      
      if (dbType.value === 'sqlite') {
        const result = await sqliteService.init()
        statusMessage.value = result.message
        statusType.value = result.success ? 'success' : 'error'
        isConnected.value = result.success
      } else if (dbType.value === 'mysql') {
        const success = await mysqlConfigService.testConnection(mysqlConfig.value)
        if (success) {
          statusMessage.value = '✅ MySQL连接成功！'
          statusType.value = 'success'
          isConnected.value = true
        } else {
          statusMessage.value = '❌ MySQL连接失败，请检查配置'
          statusType.value = 'error'
          isConnected.value = false
        }
      }
    }

    const saveConfig = async () => {
      await Preferences.set({ key: 'db_type', value: dbType.value })
      
      if (dbType.value === 'mysql') {
        await mysqlConfigService.saveConfig(mysqlConfig.value)
      } else if (dbType.value === 'sqlite') {
        await sqliteConfigService.saveConfig({ enabled: true })
      }
      
      statusMessage.value = '✅ 配置已保存，下次打开自动连接'
      statusType.value = 'success'
    }

    const syncNow = async () => {
      statusMessage.value = '正在同步数据...'
      statusType.value = 'info'

      const userData = {
        username: taskStore.currentUser,
        tasks: taskStore.tasks,
        collections: taskStore.collections
      }

      try {
        if (dbType.value === 'sqlite') {
          const result = await sqliteService.sync(
            userData.username, 
            userData.tasks, 
            userData.collections
          )
          statusMessage.value = result.success ? `✅ ${result.message}` : `❌ ${result.message}`
          statusType.value = result.success ? 'success' : 'error'
        } else if (dbType.value === 'mysql') {
          const result = await mysqlSyncService.syncToMySQL(mysqlConfig.value, userData)
          statusMessage.value = result.success ? `✅ ${result.message}` : `❌ 同步失败: ${result.error}`
          statusType.value = result.success ? 'success' : 'error'
        }
      } catch (error) {
        statusMessage.value = `❌ 同步失败: ${error.message}`
        statusType.value = 'error'
      }
    }

    return {
      dbType,
      mysqlConfig,
      sqliteConfig,
      statusMessage,
      statusType,
      isConnected,
      testConnection,
      saveConfig,
      syncNow
    }
  }
}
</script>

<style scoped>
.db-type-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.db-type-option {
  display: block;
  cursor: pointer;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s;
}

.db-type-option:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.db-type-option input[type="radio"] {
  display: none;
}

.db-type-option input[type="radio"]:checked + .option-content {
  border-left: 4px solid #667eea;
}

.db-type-option.recommended {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
}

.db-type-option:first-child {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
}

.option-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 0.5rem;
}

.option-icon {
  font-size: 2rem;
}

.option-text {
  flex: 1;
}

.option-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.option-desc {
  font-size: 0.85rem;
  color: #666;
}

.badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.sqlite-info {
  margin-top: 1rem;
}

.info-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #e8f5e9;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.info-icon {
  font-size: 1.5rem;
}

.info-text {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #2e7d32;
}

.mysql-config {
  margin-top: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.status-info {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
}

.info {
  background: #e3f2fd;
  color: #1976d2;
}

.success {
  background: #e8f5e9;
  color: #388e3c;
}

.error {
  background: #ffebee;
  color: #d32f2f;
}

.modal-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.modal-footer button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 500;
}

.footer-tip {
  width: 100%;
  text-align: center;
  padding: 0.75rem;
  color: #667eea;
  font-size: 0.9rem;
  background: #f0f4ff;
  border-radius: 8px;
}

.btn-test {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-save {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-sync {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.btn-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
