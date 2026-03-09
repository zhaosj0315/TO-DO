<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="db-config-modal">
        <div class="modal-header">
          <button class="back-btn" @click="$emit('close')">
            <span>← 返回</span>
          </button>
          <h3>🗄️ 数据库配置</h3>
          <div style="width: 80px;"></div>
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
              数据库位置: 应用私有目录 (/data/data/com.todo.app/databases/)
            </div>
          </div>
          <div class="info-card" style="background: #fff3cd; border-left-color: #ffc107;">
            <div class="info-icon">💡</div>
            <div class="info-text">
              <strong>重要提示</strong><br>
              • 网页端不支持SQLite，请使用MySQL<br>
              • Android数据库在应用私有目录，需root权限访问<br>
              • 建议使用MySQL实现多设备同步
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
          <div class="status-card" :class="statusType">
            <div class="status-icon">
              <span v-if="statusType === 'success'">✅</span>
              <span v-else-if="statusType === 'error'">❌</span>
              <span v-else>⏳</span>
            </div>
            <div class="status-text">{{ statusMessage }}</div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <!-- 本地存储：无需任何按钮 -->
        <div v-if="dbType === 'none'" class="footer-tip">
          💡 本地存储无需配置，数据已实时保存
        </div>
        
        <!-- SQLite/MySQL：显示操作按钮 -->
        <template v-else>
          <!-- 主要操作 -->
          <div v-if="!isConnected" class="button-row">
            <button @click="testConnection" class="btn-primary btn-full">
              🔍 测试连接
            </button>
          </div>
          
          <template v-else>
            <!-- 配置操作 -->
            <div class="button-row">
              <button @click="saveConfig" class="btn-secondary">
                💾 保存配置
              </button>
            </div>
            
            <!-- 数据操作 -->
            <div class="button-row">
              <button @click="syncNow" class="btn-primary">
                ⬆️ 立即同步
              </button>
              <button @click="restoreData" class="btn-secondary">
                ⬇️ 恢复数据
              </button>
            </div>
            
            <!-- 接管模式 -->
            <div class="button-row">
              <button @click="toggleTakeover" class="btn-takeover btn-full" :class="{ active: isTakeover }">
                <span v-if="isTakeover">✅ 接管模式：已开启</span>
                <span v-else>🔄 接管模式：已关闭</span>
              </button>
            </div>
            
            <!-- 接管模式说明 -->
            <div v-if="isTakeover" class="takeover-info">
              <div class="info-card" style="background: #f0fdf4; border-left-color: #10b981;">
                <div class="info-icon">💡</div>
                <div class="info-text" style="color: #065f46;">
                  <strong>实时同步已开启</strong><br>
                  • 创建任务 → 自动上传<br>
                  • 修改任务 → 自动更新<br>
                  • 删除任务 → 自动删除
                </div>
              </div>
            </div>
          </template>
          
          <!-- 操作提示 -->
          <div v-if="!isConnected" class="step-hint">
            👆 第1步：先测试连接
          </div>
          <div v-else-if="!isTakeover" class="step-hint">
            💡 提示：开启接管模式后，数据将实时同步
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
      } else {
        // 如果没有保存的db_type，尝试加载MySQL配置（用于显示）
        const savedMysql = await mysqlConfigService.getConfig()
        if (savedMysql) {
          mysqlConfig.value = savedMysql
        }
      }

      // 加载SQLite配置
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
            userData.deletedTasks,  // ✅ 添加回收站
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
        let result
        
        if (dbType.value === 'sqlite') {
          // SQLite恢复（从本地数据库读取）
          // 注意：SQLite的恢复需要先实现查询功能
          statusMessage.value = '❌ SQLite恢复功能开发中'
          statusType.value = 'error'
          return
        } else if (dbType.value === 'mysql') {
          // MySQL恢复
          result = await mysqlSyncService.restoreFromMySQL(
            mysqlConfig.value, 
            taskStore.currentUser
          )
        }
        
        if (result && result.success) {
          statusMessage.value = '✅ 数据恢复成功！请刷新页面查看'
          statusType.value = 'success'
          
          // 3秒后自动刷新页面
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        } else {
          statusMessage.value = `❌ 恢复失败: ${result?.error || '未知错误'}`
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
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: stretch;
  z-index: 10002;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.db-config-modal {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  margin: 0;
  padding: 0;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

/* Transition动画 */
.modal-fade-enter-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .db-config-modal {
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-leave-active .db-config-modal {
  animation: slideDown 0.2s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes slideDown {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
  flex-shrink: 0;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.back-btn:active {
  transform: scale(0.95);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
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
  background: linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%);
  color: #374151;
  transition: all 0.2s;
  border: 2px solid #d1d5db;
  font-weight: 500;
}

.btn-takeover:active {
  transform: scale(0.95);
}

.btn-takeover.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 600;
  border: 2px solid #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}

/* 按钮行布局 */
.button-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.button-row button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.button-row button:active {
  transform: scale(0.98);
}

.btn-full {
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-secondary:hover {
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
}

/* 状态卡片 */
.status-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  animation: slideIn 0.3s ease;
}

.status-card.success {
  background: #f0fdf4;
  border-left: 4px solid #10b981;
  color: #065f46;
}

.status-card.error {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  color: #991b1b;
}

.status-card.info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  color: #1e40af;
}

.status-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.status-text {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-line;
}

/* 接管模式说明 */
.takeover-info {
  margin-top: 0.5rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
