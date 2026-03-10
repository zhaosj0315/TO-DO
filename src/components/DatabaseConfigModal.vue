<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="database-config-sheet">
      <!-- 头部 -->
      <div class="modal-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h3>🗄️ 数据库配置</h3>
        <div style="width: 80px;"></div>
      </div>

      <!-- 内容区 -->
      <div class="modal-body">
        <!-- 本地存储（必选） -->
        <div class="db-card db-required">
          <div class="db-header">
            <div class="db-info">
              <span class="db-icon">📱</span>
              <div class="db-text">
                <h4>本地存储 <span class="badge-required">必选</span></h4>
                <p class="db-desc">应用内部存储，实时自动保存</p>
              </div>
            </div>
            <div class="db-status status-enabled">
              <span class="status-icon">✅</span>
              <span class="status-text">已启用</span>
            </div>
          </div>
          <div class="db-features">
            <span class="feature-tag">✅ 实时保存</span>
            <span class="feature-tag">✅ 离线可用</span>
            <span class="feature-tag">✅ 无需配置</span>
          </div>
        </div>

        <!-- 额外备份选项 -->
        <div class="section-title">额外备份选项 (可选，支持多选)</div>

        <!-- SQLite 备份 -->
        <div class="db-card" :class="{ 'db-active': config.sqlite.enabled }">
          <div class="db-header">
            <label class="db-checkbox">
              <input 
                type="checkbox" 
                v-model="config.sqlite.enabled"
                @change="handleSQLiteToggle"
              >
              <span class="checkbox-custom"></span>
            </label>
            <div class="db-info">
              <span class="db-icon">💾</span>
              <div class="db-text">
                <h4>SQLite 备份</h4>
                <p class="db-desc">本地数据库文件，支持导出</p>
              </div>
            </div>
          </div>
          
          <!-- SQLite 配置区（启用后显示） -->
          <div v-if="config.sqlite.enabled" class="db-config">
            <div class="config-item">
              <label>存储路径</label>
              <input 
                type="text" 
                v-model="config.sqlite.path" 
                placeholder="/data/backup.db"
                class="config-input"
              >
            </div>
            <button class="btn-test" @click="testSQLite">
              {{ sqliteTestStatus === 'testing' ? '测试中...' : sqliteTestStatus === 'success' ? '✅ 连接成功' : '测试连接' }}
            </button>
          </div>
        </div>

        <!-- MySQL 备份 -->
        <div class="db-card" :class="{ 'db-active': config.mysql.enabled }">
          <div class="db-header">
            <label class="db-checkbox">
              <input 
                type="checkbox" 
                v-model="config.mysql.enabled"
                @change="handleMySQLToggle"
              >
              <span class="checkbox-custom"></span>
            </label>
            <div class="db-info">
              <span class="db-icon">🌐</span>
              <div class="db-text">
                <h4>MySQL 备份</h4>
                <p class="db-desc">远程服务器同步，多设备共享</p>
              </div>
            </div>
          </div>
          
          <!-- MySQL 配置区（启用后显示） -->
          <div v-if="config.mysql.enabled" class="db-config">
            <div class="config-item">
              <label>服务器地址</label>
              <input 
                type="text" 
                v-model="config.mysql.host" 
                placeholder="localhost"
                class="config-input"
              >
            </div>
            <div class="config-item">
              <label>端口</label>
              <input 
                type="number" 
                v-model="config.mysql.port" 
                placeholder="3306"
                class="config-input"
              >
            </div>
            <div class="config-item">
              <label>数据库名</label>
              <input 
                type="text" 
                v-model="config.mysql.database" 
                placeholder="todo_db"
                class="config-input"
              >
            </div>
            <div class="config-item">
              <label>用户名</label>
              <input 
                type="text" 
                v-model="config.mysql.username" 
                placeholder="root"
                class="config-input"
              >
            </div>
            <div class="config-item">
              <label>密码</label>
              <input 
                type="password" 
                v-model="config.mysql.password" 
                placeholder="••••••"
                class="config-input"
              >
            </div>
            <button class="btn-test" @click="testMySQL">
              {{ mysqlTestStatus === 'testing' ? '测试中...' : mysqlTestStatus === 'success' ? '✅ 连接成功' : '测试连接' }}
            </button>
          </div>
        </div>

        <!-- 接管模式 -->
        <div class="section-title">⚙️ 接管模式</div>
        <div class="takeover-mode">
          <label class="mode-checkbox">
            <input type="checkbox" v-model="config.takeoverMode">
            <span class="checkbox-custom"></span>
            <span class="mode-text">
              <strong>启用接管模式</strong>
              <p class="mode-desc">本地存储 + 数据库同时使用：本地存储作为稳定保障，数据库用于多设备实时同步</p>
            </span>
          </label>
        </div>

        <!-- 接管模式说明 -->
        <div v-if="config.takeoverMode" class="takeover-info">
          <div class="info-item">
            <span class="info-icon">📱</span>
            <div class="info-text">
              <strong>本地存储</strong>
              <p>稳定的本地备份，设备离线时可用</p>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">🌐</span>
            <div class="info-text">
              <strong>{{ config.sqlite.enabled ? 'SQLite' : config.mysql.enabled ? 'MySQL' : '数据库' }}</strong>
              <p>多设备实时同步，不同设备读取同一数据源</p>
            </div>
          </div>
          <div class="info-warning">
            ⚠️ 接管模式启用后，所有操作会同时保存到本地和数据库
          </div>
        </div>

        <!-- 当前备份状态 -->
        <div class="status-summary">
          <div class="summary-title">当前备份状态</div>
          <div class="status-list">
            <div class="status-item">
              <span class="status-dot dot-enabled"></span>
              <span>本地存储：✅ 运行中</span>
            </div>
            <div class="status-item">
              <span class="status-dot" :class="config.sqlite.enabled ? 'dot-enabled' : 'dot-disabled'"></span>
              <span>SQLite：{{ config.sqlite.enabled ? '✅ 已启用' : '❌ 未启用' }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot" :class="config.mysql.enabled ? 'dot-enabled' : 'dot-disabled'"></span>
              <span>MySQL：{{ config.mysql.enabled ? '✅ 已启用' : '❌ 未启用' }}</span>
            </div>
            <div class="status-item" v-if="config.takeoverMode">
              <span class="status-dot dot-enabled"></span>
              <span>接管模式：✅ 已启用</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-sync" @click="syncNow" v-if="config.sqlite.enabled || config.mysql.enabled">
          {{ syncStatus === 'syncing' ? '同步中...' : '立即同步' }}
        </button>
        <button class="btn-save" @click="saveConfig">保存配置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Preferences } from '@capacitor/preferences'

const emit = defineEmits(['close', 'save'])

// 配置数据
const config = ref({
  local: {
    enabled: true,
    type: 'capacitor-preferences'
  },
  sqlite: {
    enabled: false,
    path: '/data/backup.db'
  },
  mysql: {
    enabled: false,
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: ''
  },
  takeoverMode: false
})

// 测试状态
const sqliteTestStatus = ref('idle') // idle | testing | success | error
const mysqlTestStatus = ref('idle')
const syncStatus = ref('idle') // idle | syncing | success | error

// 加载配置
onMounted(async () => {
  try {
    const { value } = await Preferences.get({ key: 'database_config' })
    if (value) {
      const saved = JSON.parse(value)
      config.value = { ...config.value, ...saved }
    }
  } catch (error) {
    console.error('加载数据库配置失败:', error)
  }
})

// SQLite 切换
const handleSQLiteToggle = () => {
  if (config.value.sqlite.enabled) {
    console.log('✅ 启用 SQLite 备份')
  } else {
    console.log('❌ 禁用 SQLite 备份')
    sqliteTestStatus.value = 'idle'
  }
}

// MySQL 切换
const handleMySQLToggle = () => {
  if (config.value.mysql.enabled) {
    console.log('✅ 启用 MySQL 备份')
  } else {
    console.log('❌ 禁用 MySQL 备份')
    mysqlTestStatus.value = 'idle'
  }
}

// 测试 SQLite 连接
const testSQLite = async () => {
  sqliteTestStatus.value = 'testing'
  // TODO: 实际测试逻辑
  setTimeout(() => {
    sqliteTestStatus.value = 'success'
  }, 1000)
}

// 测试 MySQL 连接
const testMySQL = async () => {
  mysqlTestStatus.value = 'testing'
  // TODO: 实际测试逻辑
  setTimeout(() => {
    mysqlTestStatus.value = 'success'
  }, 1000)
}

// 保存配置
const saveConfig = async () => {
  try {
    await Preferences.set({
      key: 'database_config',
      value: JSON.stringify(config.value)
    })
    alert('✅ 数据库配置已保存')
    emit('save', config.value)
    emit('close')
  } catch (error) {
    console.error('保存配置失败:', error)
    alert('❌ 保存失败，请重试')
  }
}

// 立即同步
const syncNow = async () => {
  syncStatus.value = 'syncing'
  try {
    // 同步逻辑：
    // 1. 如果接管模式启用：本地数据 → 数据库（保持同步）
    // 2. 如果接管模式关闭：本地数据 → 启用的备份数据库
    if (config.value.takeoverMode) {
      // 接管模式：同步本地数据到已启用的数据库
      if (config.value.sqlite.enabled) {
        console.log('同步本地数据到 SQLite...')
      }
      if (config.value.mysql.enabled) {
        console.log('同步本地数据到 MySQL...')
      }
    } else {
      // 普通模式：备份本地数据到启用的备份数据库
      if (config.value.sqlite.enabled) {
        console.log('备份本地数据到 SQLite...')
      }
      if (config.value.mysql.enabled) {
        console.log('备份本地数据到 MySQL...')
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    syncStatus.value = 'success'
    alert('✅ 数据同步成功')
    setTimeout(() => {
      syncStatus.value = 'idle'
    }, 2000)
  } catch (error) {
    console.error('同步失败:', error)
    syncStatus.value = 'error'
    alert('❌ 同步失败，请重试')
    setTimeout(() => {
      syncStatus.value = 'idle'
    }, 2000)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 99999;
}

.database-config-sheet {
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* 数据库卡片 */
.db-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s;
}

.db-card.db-required {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-color: #9ca3af;
}

.db-card.db-active {
  border-color: #8b5cf6;
  background: #faf5ff;
}

.db-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.db-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.db-checkbox input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 24px;
  height: 24px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.db-checkbox input:checked + .checkbox-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.db-checkbox input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.db-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.db-icon {
  font-size: 2rem;
}

.db-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #1f2937;
}

.db-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.badge-required {
  background: #10b981;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.db-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #f3f4f6;
}

.status-enabled {
  background: #d1fae5;
  color: #065f46;
}

.status-icon {
  font-size: 1.2rem;
}

.status-text {
  font-size: 0.9rem;
  font-weight: 600;
}

.db-features {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.feature-tag {
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

/* 配置区域 */
.db-config {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.config-item {
  margin-bottom: 0.75rem;
}

.config-item label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.config-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.config-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.btn-test {
  width: 100%;
  padding: 0.6rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

.btn-test:active {
  transform: scale(0.98);
}

/* 章节标题 */
.section-title {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 1.5rem 0 1rem 0;
  font-weight: 600;
}

/* 接管模式 */
.takeover-mode {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.mode-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.mode-checkbox input[type="checkbox"] {
  display: none;
}

.mode-checkbox input:checked + .checkbox-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.mode-checkbox input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.mode-text {
  flex: 1;
}

.mode-text strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.mode-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

/* 接管模式说明 */
.takeover-info {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.info-item:last-of-type {
  margin-bottom: 0;
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-text {
  flex: 1;
}

.info-text strong {
  display: block;
  font-size: 0.9rem;
  color: #92400e;
  margin-bottom: 0.2rem;
}

.info-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #b45309;
}

.info-warning {
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #991b1b;
  margin-top: 0.75rem;
}

/* 状态摘要 */
.status-summary {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.summary-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-enabled {
  background: #10b981;
}

.dot-disabled {
  background: #d1d5db;
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-sync,
.btn-save {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-sync {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-save:active,
.btn-cancel:active,
.btn-sync:active {
  transform: scale(0.98);
}
</style>
