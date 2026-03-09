<template>
  <transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <div class="drag-indicator"></div>
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
                  <div class="option-desc">本地数据库备份（仅Android/iOS）</div>
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
              仅支持Android/iOS原生应用<br>
              数据库位置: Documents/TODO-App-backups/
            </div>
          </div>
          <div class="info-card" style="background: #fff3cd; border-left-color: #ffc107;">
            <div class="info-icon">💡</div>
            <div class="info-text">
              <strong>网页端提示</strong><br>
              网页端不支持SQLite，请使用MySQL远程备份
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
          
          <!-- 自动初始化说明 -->
          <div class="info-card" style="background: #f0f9ff; border-left-color: #3b82f6; margin-top: 1rem;">
            <div class="info-icon">💡</div>
            <div class="info-text" style="color: #1e40af;">
              <strong>自动初始化</strong><br>
              点击"测试连接"后，应用会自动创建数据库和所有表<br>
              无需手动操作，开箱即用
            </div>
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
          <div class="button-group">
            <button v-if="!isConnected" @click="testConnection" class="btn-test">
              🔍 测试连接
            </button>
            <button v-if="isConnected" @click="saveConfig" class="btn-save">
              💾 保存配置
            </button>
            <button v-if="isConnected" @click="syncNow" class="btn-sync">
              ⬆️ 立即同步
            </button>
            <button v-if="isConnected" @click="restoreData" class="btn-restore">
              ⬇️ 恢复数据
            </button>
            <button v-if="isConnected" @click="toggleTakeover" class="btn-takeover" :class="{ active: isTakeover }">
              <span v-if="isTakeover">✅ 已接管</span>
              <span v-else>🔄 接管模式</span>
            </button>
          </div>
          
          <!-- 操作提示 -->
          <div v-if="!isConnected" class="step-hint">
            👆 第1步：先测试连接
          </div>
          <div v-else-if="!isTakeover" class="step-hint">
            💡 提示：点击"🔄 接管模式"开启实时同步
          </div>
        </template>
      </div>
    </div>
    </div>
  </transition>
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
    const isTakeover = ref(false)

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
          // 加载接管状态
          isTakeover.value = await sqliteConfigService.getTakeover()
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
          // 加载接管状态
          isTakeover.value = await mysqlConfigService.getTakeover()
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
          statusMessage.value = '✅ 连接成功！数据库和表已自动创建'
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
        deletedTasks: taskStore.deletedTasks,  // ✅ 添加回收站
        collections: taskStore.collections
      }

      try {
        if (dbType.value === 'sqlite') {
          const result = await sqliteService.sync(
            userData.username, 
            userData.tasks, 
            userData.collections
          )
          statusMessage.value = result.message
          statusType.value = result.success ? 'success' : 'error'
        } else if (dbType.value === 'mysql') {
          const result = await mysqlSyncService.syncToMySQL(mysqlConfig.value, userData)
          statusMessage.value = result.message || '✅ 同步成功'
          statusType.value = result.success ? 'success' : 'error'
        }
      } catch (error) {
        statusMessage.value = `❌ 同步失败: ${error.message}`
        statusType.value = 'error'
      }
    }
    
    const restoreData = async () => {
      if (!confirm('确定要从数据库恢复数据吗？\n\n⚠️ 这将覆盖本地所有数据！')) {
        return
      }
      
      statusMessage.value = '正在恢复数据...'
      statusType.value = 'info'
      
      try {
        const result = await mysqlSyncService.restoreFromMySQL(
          mysqlConfig.value, 
          taskStore.currentUser
        )
        
        if (result.success) {
          statusMessage.value = '✅ 数据恢复成功！请刷新页面查看'
          statusType.value = 'success'
          
          // 3秒后自动刷新页面
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        } else {
          statusMessage.value = `❌ 恢复失败: ${result.error}`
          statusType.value = 'error'
        }
      } catch (error) {
        statusMessage.value = `❌ 恢复失败: ${error.message}`
        statusType.value = 'error'
      }
    }

    const toggleTakeover = async () => {
      // 检查是否已保存配置
      if (!isConnected.value) {
        statusMessage.value = '❌ 请先测试连接并保存配置'
        statusType.value = 'error'
        return
      }
      
      isTakeover.value = !isTakeover.value
      
      if (dbType.value === 'sqlite') {
        await sqliteConfigService.setTakeover(isTakeover.value)
      } else if (dbType.value === 'mysql') {
        await mysqlConfigService.setTakeover(isTakeover.value)
      }
      
      statusMessage.value = isTakeover.value 
        ? '✅ 已开启接管模式，数据将实时同步到数据库' 
        : '✅ 已关闭接管模式，仅手动同步'
      statusType.value = 'success'
      
      console.log('🔄 接管状态已切换:', isTakeover.value)
    }

    return {
      dbType,
      mysqlConfig,
      sqliteConfig,
      statusMessage,
      statusType,
      isConnected,
      isTakeover,
      testConnection,
      saveConfig,
      syncNow,
      restoreData,
      toggleTakeover
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

/* 选中状态：整个卡片高亮 */
.db-type-option:has(input[type="radio"]:checked) {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
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
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Transition动画 */
.modal-enter-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container {
  animation: slideUp 0.3s ease-out;
}

.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-leave-active .modal-container {
  animation: slideDown 0.3s ease-in;
}

@keyframes slideDown {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-header {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

.drag-indicator {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
  margin-bottom: 0.5rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  position: absolute;
  right: 1rem;
  top: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
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
  transition: all 0.2s;
}

.btn-test:active {
  transform: scale(0.95);
}

.btn-save {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  transition: all 0.2s;
}

.btn-save:active {
  transform: scale(0.95);
}

.btn-sync {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  transition: all 0.2s;
}

.btn-sync:active {
  transform: scale(0.95);
}

.btn-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-takeover {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.btn-takeover:active {
  transform: scale(0.95);
}

.btn-takeover.active {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: white;
  font-weight: 600;
  border: 2px solid #4ade80;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.step-hint {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f0f9ff;
  border-left: 3px solid #667eea;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #667eea;
}
</style>
