<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="ai-config-modal">
      <div class="modal-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h3>🤖 AI模型配置</h3>
        <div style="width: 80px;"></div>
      </div>
    
    <!-- 加载动画 -->
    <LoadingSpinner
      :visible="fetchingModels || testing || testingAll"
      :text="loadingText"
      :subText="loadingSubText"
    />

      <div class="modal-body">
        <!-- 1. 添加新模型（新用户第一步） -->
        <div class="section add-section">
          <h4>1️⃣ 选择已有厂商 或 添加新模型</h4>
          <div v-if="models.length === 0" class="welcome-hint">
            👋 欢迎使用！请先配置一个AI模型
          </div>
          
          <div class="add-model-form">
            <!-- 选择厂商（预设 + 已保存） -->
            <select 
              v-model="selectedProviderOption" 
              @change="handleProviderSelect" 
              class="form-select-large"
              :key="'provider-select-' + selectedProviderOption"
            >
              <option value="">请选择厂商...</option>
              <optgroup label="📦 已保存的厂商配置" v-if="providerConfigs.length > 0">
                  <option v-for="config in providerConfigs" :key="'saved-' + config.id" :value="'saved:' + config.id">
                    {{ getProviderLabel(config) }}
                  </option>
                </optgroup>
                <optgroup label="🏠 本地模型">
                  <option v-for="p in PRESET_PROVIDERS.filter(x => x.type === 'local')" :key="'preset-' + p.id" :value="'preset:' + p.id">
                    {{ p.name }}
                  </option>
                </optgroup>
                <optgroup label="🌐 OpenAI 官方">
                  <option v-for="p in PRESET_PROVIDERS.filter(x => x.id === 'openai')" :key="'preset-' + p.id" :value="'preset:' + p.id">
                    {{ p.name }}
                  </option>
                </optgroup>
                <optgroup label="🇨🇳 国内中转站">
                  <option v-for="p in PRESET_PROVIDERS.filter(x => ['gptapi', 'api2d', 'closeai'].includes(x.id))" :key="'preset-' + p.id" :value="'preset:' + p.id">
                    {{ p.name }}
                  </option>
                </optgroup>
                <optgroup label="🤖 国产大模型">
                  <option v-for="p in PRESET_PROVIDERS.filter(x => ['zhipu', 'moonshot', 'baichuan', 'minimax', 'deepseek', 'yi', 'stepfun'].includes(x.id))" :key="'preset-' + p.id" :value="'preset:' + p.id">
                    {{ p.name }}
                  </option>
                </optgroup>
                <optgroup label="☁️ 云服务商">
                  <option v-for="p in PRESET_PROVIDERS.filter(x => ['aliyun', 'tencent'].includes(x.id))" :key="'preset-' + p.id" :value="'preset:' + p.id">
                    {{ p.name }}
                  </option>
                </optgroup>
                <optgroup label="🔗 开源平台">
                  <option v-for="p in PRESET_PROVIDERS.filter(x => ['together', 'longcat'].includes(x.id))" :key="'preset-' + p.id" :value="'preset:' + p.id">
                    {{ p.name }}
                  </option>
                </optgroup>
                <optgroup label="🔧 其他">
                  <option value="preset:custom">🔧 自定义厂商</option>
                </optgroup>
              </select>
            
            <!-- 显示选中的厂商信息（已保存的配置） -->
            <div v-if="selectedProviderOption && selectedProviderOption.startsWith('saved:')" class="selected-provider-card">
              <div class="provider-info-row">
                <span class="info-label">📍 厂商地址:</span>
                <span class="info-value">{{ newModel.url }}</span>
              </div>
              <div v-if="newModel.apiKey" class="provider-info-row">
                <span class="info-label">🔑 API Key:</span>
                <span class="info-value">{{ '•'.repeat(20) }}</span>
              </div>
              <div class="provider-info-row">
                <span class="info-label">🏷️ 类型:</span>
                <span class="info-value">{{ newModel.type === 'local' ? 'Ollama 本地' : 'OpenAI 兼容' }}</span>
              </div>
            </div>
            
            <!-- 厂商地址（自定义时可编辑） -->
            <div v-else-if="selectedProviderOption === 'preset:custom'" class="input-group">
              <input 
                v-model="newModel.url" 
                placeholder="输入厂商地址（如：https://api.example.com）"
                class="form-input"
              />
            </div>
            
            <!-- 显示选中的厂商地址（预设厂商） -->
            <div v-else-if="newModel.url && selectedProviderOption.startsWith('preset:')" class="url-display">
              <span class="url-label">📍 厂商地址:</span>
              <span class="url-value">{{ newModel.url }}</span>
            </div>
            
            <!-- API Key（预设厂商需要输入） -->
            <input 
              v-if="newModel.url && needApiKey && !selectedProviderOption.startsWith('saved:')"
              v-model="newModel.apiKey" 
              type="password"
              placeholder="输入 API Key"
              class="form-input"
              @blur="onApiKeyBlur"
            />
            
            <!-- 获取模型按钮 -->
            <button 
              v-if="newModel.url && (!needApiKey || newModel.apiKey)"
              @click="fetchAvailableModels" 
              class="btn-fetch-models" 
              :disabled="fetchingModels"
            >
              {{ fetchingModels ? '⏳ 获取中...' : '🔄 获取可用模型' }}
            </button>
            
            <!-- 选择模型 -->
            <select 
              v-if="availableModels.length > 0"
              v-model="newModel.modelName"
              class="form-select"
            >
              <option value="">选择模型...</option>
              <option v-for="model in availableModels" :key="model" :value="model">
                {{ model }}
              </option>
            </select>
            
            <!-- 手动输入模型名称（当获取失败时） -->
            <input
              v-if="availableModels.length === 0 && fetchError"
              v-model="newModel.modelName"
              placeholder="手动输入模型名称（如：gpt-4o-mini）"
              class="form-input"
            />
            
            <!-- 加载/错误/测试结果 -->
            <div v-if="fetchingModels" class="status-hint loading">🔄 正在获取可用模型...</div>
            <div v-if="fetchError && !fetchingModels" class="status-hint error">⚠️ {{ fetchError }}</div>
            <div v-if="testResult && !testing && !fetchingModels" :class="['status-hint', testResult.success ? 'success' : 'error']">
              {{ testResult.message }}
            </div>
            
            <!-- 操作按钮 -->
            <div v-if="newModel.modelName" class="action-buttons">
              <button @click="testConnection" :disabled="testing" class="btn-secondary">
                {{ testing ? '⏳ 测试中...' : '🔍 测试连接' }}
              </button>
              <button @click="addModel" class="btn-primary">
                ➕ 添加模型
              </button>
              <button @click="clearForm" class="btn-clear-inline">
                🔄
              </button>
            </div>
          </div>
        </div>

        <!-- 2. 默认模型选择（配置完后选择） -->
        <div v-if="models.length > 0" class="section default-section">
          <h4>2️⃣ 选择默认使用的模型</h4>
          <select v-model="defaultModelId" class="form-select-large">
            <option v-for="model in models" :key="model.id" :value="model.id">
              {{ model.name }}
            </option>
          </select>
          <div class="hint-text">
            💡 AI问答、任务总结、报告生成等功能将使用此模型
          </div>
        </div>

        <!-- 3. 已配置模型列表（查看和管理） -->
        <div v-if="models.length > 0" class="section">
          <div class="section-header">
            <h4>3️⃣ 所有已配置的模型 ({{ models.length }}个)</h4>
            <div class="section-actions">
              <button @click="testAllModels" class="btn-icon" :disabled="testingAll" title="测试全部">
                {{ testingAll ? '⏳ 测试中' : '🔍 测试全部' }}
              </button>
              <button @click="exportConfig" class="btn-icon" title="导出配置">
                📤 导出
              </button>
              <button @click="importConfig" class="btn-icon" title="导入配置">
                📥 导入
              </button>
            </div>
          </div>
          <div class="models-list">
            <div 
              v-for="(model, index) in models" 
              :key="index"
              class="model-item"
              :class="{ 
                active: model.id === defaultModelId,
                online: model.status === 'online',
                offline: model.status === 'offline',
                testing: model.status === 'testing'
              }"
            >
              <div class="model-status-indicator" :title="getStatusText(model.status)">
                {{ getStatusIcon(model.status) }}
              </div>
              <div class="model-info">
                <div class="model-name">
                  {{ model.name }}
                  <span v-if="model.id === defaultModelId" class="badge-default">默认</span>
                  <span v-if="model.recommended" class="badge-recommended">推荐</span>
                </div>
                <div class="model-url">{{ model.url }}</div>
                <div v-if="model.stats" class="model-stats">
                  📊 调用 {{ model.stats.calls || 0 }} 次 | 成功率 {{ model.stats.successRate || 0 }}%
                </div>
              </div>
              <div class="model-actions">
                <button @click="testSingleModel(index)" class="btn-small btn-test" :disabled="model.status === 'testing'">
                  {{ model.status === 'testing' ? '⏳' : '🔍' }}
                </button>
                <button @click="editModel(index)" class="btn-small btn-edit">编辑</button>
                <button @click="deleteModel(index)" class="btn-small btn-delete">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 厂商配置管理弹窗（删除，已合并到主界面） -->
    <div v-if="showProviderManager" class="modal-overlay" @click.self="showProviderManager = false">
      <div class="provider-manager-modal">
        <div class="modal-header">
          <button class="back-btn" @click="showProviderManager = false">
            <span>← 返回</span>
          </button>
          <h3>⚙️ 厂商配置管理</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body">
          <div v-if="providerConfigs.length === 0" class="empty-hint">
            暂无厂商配置
          </div>
          <div v-else class="provider-list">
            <div v-for="(config, index) in providerConfigs" :key="config.id" class="provider-item">
              <div class="provider-info">
                <div class="provider-type">
                  {{ { 'local': '🏠 本地Ollama', 'openai': '🌐 OpenAI', 'custom': '🔧 自定义' }[config.type] }}
                </div>
                <div class="provider-url">{{ config.url }}</div>
                <div class="provider-meta">
                  创建于 {{ new Date(config.createdAt).toLocaleString('zh-CN') }}
                </div>
              </div>
              <div class="provider-actions">
                <button @click="editProviderConfig(index)" class="btn-small btn-edit">编辑</button>
                <button @click="deleteProviderConfig(index)" class="btn-small btn-delete">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { showSuccess, showError, showConfirm, showInfo, showWarning } from '@/services/notificationService'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'update'])

// 获取当前用户
const taskStore = useOfflineTaskStore()
const getCurrentUsername = () => taskStore.currentUser || 'guest'

// ==================== 预设厂商配置 ====================
const PRESET_PROVIDERS = [
  // 本地模型
  { id: 'ollama', name: '🏠 Ollama (本地)', type: 'local', url: 'http://localhost:11434', needApiKey: false },
  
  // OpenAI 官方
  { id: 'openai', name: '🌐 OpenAI 官方', type: 'openai', url: 'https://api.openai.com', needApiKey: true },
  
  // 国内中转站
  { id: 'gptapi', name: '🇨🇳 GPTApi.asia (国内可用)', type: 'openai', url: 'https://cn.gptapi.asia', needApiKey: true },
  { id: 'api2d', name: '🇨🇳 API2D (国内可用)', type: 'openai', url: 'https://api.api2d.com', needApiKey: true },
  { id: 'closeai', name: '🇨🇳 CloseAI (国内可用)', type: 'openai', url: 'https://api.closeai-proxy.xyz', needApiKey: true },
  
  // 国产大模型
  { id: 'zhipu', name: '🤖 智谱AI (GLM)', type: 'openai', url: 'https://open.bigmodel.cn', needApiKey: true },
  { id: 'moonshot', name: '🌙 月之暗面 (Kimi)', type: 'openai', url: 'https://api.moonshot.cn', needApiKey: true },
  { id: 'baichuan', name: '🏔️ 百川智能', type: 'openai', url: 'https://api.baichuan-ai.com', needApiKey: true },
  { id: 'minimax', name: '🎯 MiniMax', type: 'openai', url: 'https://api.minimax.chat', needApiKey: true },
  { id: 'deepseek', name: '🔍 DeepSeek', type: 'openai', url: 'https://api.deepseek.com', needApiKey: true },
  { id: 'yi', name: '🎨 零一万物 (Yi)', type: 'openai', url: 'https://api.lingyiwanwu.com', needApiKey: true },
  { id: 'stepfun', name: '⭐ 阶跃星辰', type: 'openai', url: 'https://api.stepfun.com', needApiKey: true },
  
  // 云服务商
  { id: 'aliyun', name: '☁️ 阿里云 (通义千问)', type: 'openai', url: 'https://dashscope.aliyuncs.com', needApiKey: true },
  { id: 'tencent', name: '☁️ 腾讯云 (混元)', type: 'openai', url: 'https://api.hunyuan.cloud.tencent.com', needApiKey: true },
  
  // 开源平台
  { id: 'together', name: '🔗 Together AI', type: 'openai', url: 'https://api.together.xyz', needApiKey: true },
  { id: 'longcat', name: '🐱 LongCat', type: 'openai', url: 'https://api.longcat.chat/openai', needApiKey: true },
  
  // 自定义
  { id: 'custom', name: '🔧 自定义厂商', type: 'custom', url: '', needApiKey: true }
]

// ==================== URL处理工具函数 ====================
/**
 * 规范化基础URL：移除标准API路径，保留自定义路径前缀
 * @param {string} url - 原始URL
 * @param {string} type - 模型类型 ('local' | 'openai' | 'custom')
 * @returns {string} 基础URL
 * 
 * 示例:
 * - https://cn.gptapi.asia/v1/chat/completions → https://cn.gptapi.asia
 * - https://api.longcat.chat/openai/v1/models → https://api.longcat.chat/openai
 * - http://localhost:11434/api/generate → http://localhost:11434
 */
const normalizeBaseUrl = (url, type) => {
  if (!url) return ''
  
  let baseUrl = url.trim()
  
  if (type === 'local') {
    // Ollama: 移除 /api/xxx
    baseUrl = baseUrl.replace(/\/api\/.*$/, '')
  } else {
    // OpenAI: 只移除 /v1 及之后的标准路径，保留自定义前缀（如 /openai）
    // 匹配 /v1 或 /v1/ 或 /v1/xxx，但不匹配 /openai/v1
    baseUrl = baseUrl.replace(/\/v1(\/.*)?$/, '')
  }
  
  // 移除末尾斜杠
  baseUrl = baseUrl.replace(/\/$/, '')
  
  return baseUrl
}

/**
 * 根据场景获取完整API URL
 * @param {string} baseUrl - 基础URL
 * @param {string} type - 模型类型
 * @param {string} endpoint - API端点 ('models' | 'chat' | 'generate')
 * @returns {string} 完整API URL
 */
const getApiUrl = (baseUrl, type, endpoint) => {
  if (!baseUrl) return ''
  
  // 确保baseUrl没有末尾斜杠
  baseUrl = baseUrl.replace(/\/$/, '')
  
  if (type === 'local') {
    // Ollama API
    if (endpoint === 'models') {
      return `${baseUrl}/api/tags`
    } else if (endpoint === 'generate' || endpoint === 'chat') {
      return `${baseUrl}/api/generate`
    }
  } else {
    // OpenAI 兼容 API
    // 检查是否已包含 /v1，避免重复
    const hasV1 = baseUrl.endsWith('/v1')
    
    if (endpoint === 'models') {
      return hasV1 ? `${baseUrl}/models` : `${baseUrl}/v1/models`
    } else if (endpoint === 'chat' || endpoint === 'generate') {
      return hasV1 ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`
    }
  }
  
  return baseUrl
}

// 从localStorage加载配置（全局，不按用户隔离）
// ⚠️ AI配置是全局的，所有用户共享（因为其他服务使用 ai_models 而非 ai_models_${username}）
const models = ref(JSON.parse(localStorage.getItem('ai_models') || '[]'))
const defaultModelId = ref(localStorage.getItem('ai_default_model') || '')

// 厂商配置（持久化，全局）
const providerConfigs = ref(JSON.parse(localStorage.getItem('ai_provider_configs') || '[]'))
const selectedProviderId = ref('')
const showProviderManager = ref(false)

// 新模型表单
const newModel = ref({
  type: 'local',
  name: '',
  url: '',
  apiKey: '',
  modelName: '',
  providerId: ''
})

// 厂商选择（统一入口：预设 + 已保存）
const selectedProviderOption = ref('')

// 是否需要API Key
const needApiKey = computed(() => {
  if (!selectedProviderOption.value) return false
  
  const [type, id] = selectedProviderOption.value.split(':')
  
  if (type === 'preset') {
    const preset = PRESET_PROVIDERS.find(p => p.id === id)
    return preset?.needApiKey || false
  } else if (type === 'saved') {
    // 已保存的配置，根据type判断
    const config = providerConfigs.value.find(p => p.id === id)
    return config?.type !== 'local'
  }
  
  return false
})

// 处理厂商选择
const handleProviderSelect = () => {
  if (!selectedProviderOption.value) return
  
  const [type, id] = selectedProviderOption.value.split(':')
  
  if (type === 'preset') {
    // 选择预设厂商
    selectPresetProvider(id)
  } else if (type === 'saved') {
    // 选择已保存的配置
    loadProviderConfig(id)
  }
}

// 选择预设厂商
const selectPresetProvider = (presetId) => {
  const preset = PRESET_PROVIDERS.find(p => p.id === presetId)
  if (!preset) return
  
  newModel.value.type = preset.type
  newModel.value.url = preset.url
  
  // 如果是自定义，清空URL让用户输入
  if (presetId === 'custom') {
    newModel.value.url = ''
  }
  
  // 自动获取模型列表（如果不需要API Key）
  if (!preset.needApiKey && newModel.value.url) {
    fetchAvailableModels()
  }
}

// 加载已保存的厂商配置
const loadProviderConfig = (configId) => {
  const config = providerConfigs.value.find(p => p.id === configId)
  if (config) {
    newModel.value.type = config.type
    newModel.value.url = config.url
    newModel.value.apiKey = config.apiKey || ''
    newModel.value.providerId = config.id
    
    // 自动获取模型列表
    if (config.type === 'local' || config.apiKey) {
      fetchAvailableModels()
    }
  }
}

// API Key失焦时自动获取模型
const onApiKeyBlur = () => {
  if (newModel.value.apiKey && newModel.value.url) {
    fetchAvailableModels()
  }
}

// 编辑厂商配置
const editProviderConfig = (index) => {
  const config = providerConfigs.value[index]
  
  // 填充到表单
  newModel.value.type = config.type
  newModel.value.url = config.url
  newModel.value.apiKey = config.apiKey
  newModel.value.providerId = config.id
  
  // 设置选择器
  selectedProviderOption.value = `saved:${config.id}`
  
  // 关闭管理弹窗
  showProviderManager.value = false
  
  // 自动获取模型列表
  if (config.type === 'local' || config.apiKey) {
    fetchAvailableModels()
  }
}

// 删除厂商配置（保留原逻辑）
const deleteProviderConfig = (index) => {
  const config = providerConfigs.value[index]
  
  // 检查是否有模型在使用此配置
  const usedByModels = models.value.filter(m => m.providerId === config.id)
  
  if (usedByModels.length > 0) {
    if (!confirm(`此配置被 ${usedByModels.length} 个模型使用，删除后这些模型将无法正常工作。确定删除？`)) {
      return
    }
  } else {
    if (!confirm('确定删除此厂商配置？')) {
      return
    }
  }
  
  providerConfigs.value.splice(index, 1)
  showSuccess('配置已删除')
}

// 获取厂商配置标签
const getProviderLabel = (config) => {
  const typeLabel = {
    'local': 'Ollama',
    'openai': 'OpenAI',
    'custom': '自定义'
  }[config.type] || '未知'
  
  const urlShort = config.url.length > 40 ? config.url.substring(0, 40) + '...' : config.url
  return `${typeLabel} - ${urlShort}`
}

// 可用模型列表
const availableModels = ref([])
const fetchingModels = ref(false)
const fetchError = ref('')

// 测试状态
const testing = ref(false)
const testResult = ref(null)
const testingAll = ref(false)

// 加载文本
const loadingText = computed(() => {
  if (fetchingModels.value) return '正在获取模型列表...'
  if (testing.value) return '正在测试连接...'
  if (testingAll.value) return '正在测试所有模型...'
  return 'AI 处理中...'
})

const loadingSubText = computed(() => {
  if (fetchingModels.value) return '请稍候'
  if (testing.value) return '验证API可用性'
  if (testingAll.value) return '这可能需要一些时间'
  return ''
})

// 监听模型选择，自动填充名称（格式：厂商 - 模型名）
watch(() => newModel.value.modelName, (modelName) => {
  if (modelName) {
    // 自动生成显示名称：厂商 + 模型名
    const typeLabel = {
      'local': 'Ollama',
      'openai': 'OpenAI',
      'custom': '自定义'
    }[newModel.value.type] || '未知'
    
    newModel.value.name = `${typeLabel} - ${modelName}`
  }
})

// 保存到localStorage（全局）
watch([models, defaultModelId, providerConfigs], () => {
  localStorage.setItem('ai_models', JSON.stringify(models.value))
  localStorage.setItem('ai_default_model', defaultModelId.value)
  localStorage.setItem('ai_provider_configs', JSON.stringify(providerConfigs.value))
  emit('update', { models: models.value, defaultModelId: defaultModelId.value })
}, { deep: true })

// 初始化默认模型
if (models.value.length === 0) {
  models.value = [{
    id: 'default-local',
    type: 'local',
    name: '本地Ollama',
    url: 'http://192.168.31.159:11434/api/generate'
  }]
  defaultModelId.value = 'default-local'
}

const getUrlPlaceholder = () => {
  if (newModel.value.type === 'local') {
    return 'http://192.168.31.159:11434/api/generate'
  } else if (newModel.value.type === 'openai') {
    return 'https://api.openai.com/v1/chat/completions'
  } else {
    return 'https://your-api.com/generate'
  }
}

// 获取可用模型列表
const fetchAvailableModels = async () => {
  if (!newModel.value.url) {
    showError('请先输入厂商地址')
    return
  }
  
  fetchingModels.value = true
  fetchError.value = ''
  availableModels.value = []
  
  try {
    // 1. 规范化基础URL
    const baseUrl = normalizeBaseUrl(newModel.value.url, newModel.value.type)
    
    // 2. 获取模型列表的API URL
    const apiUrl = getApiUrl(baseUrl, newModel.value.type, 'models')
    
    console.log('获取模型列表 - 基础URL:', baseUrl, '完整URL:', apiUrl)
    
    const headers = {
      'Content-Type': 'application/json'
    }
    if (newModel.value.apiKey) {
      headers['Authorization'] = `Bearer ${newModel.value.apiKey}`
    }
    
    const response = await fetch(apiUrl, { 
      method: 'GET',
      headers 
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('模型列表响应:', data)
    
    // 解析不同API的响应格式
    if (newModel.value.type === 'local') {
      // Ollama: { models: [{ name: "gemma2:2b" }] }
      availableModels.value = data.models?.map(m => m.name) || []
    } else {
      // OpenAI 兼容: { data: [{ id: "gpt-4o-mini" }] }
      availableModels.value = data.data?.map(m => m.id) || []
    }
    
    if (availableModels.value.length === 0) {
      fetchError.value = '未找到可用模型'
    } else {
      console.log(`成功获取 ${availableModels.value.length} 个模型`)
      
      // 3. 保存厂商配置（保存规范化后的基础URL）
      // 如果已经有 providerId，说明是加载已保存的配置，保持原有ID
      if (!newModel.value.providerId) {
        const providerId = Date.now().toString()
        const providerConfig = {
          id: providerId,
          type: newModel.value.type,
          url: baseUrl, // 保存基础URL
          apiKey: newModel.value.apiKey || '',
          createdAt: new Date().toISOString()
        }
        
        console.log('保存厂商配置 - 基础URL:', baseUrl)
        
        // 检查是否已存在相同配置
        const existingIndex = providerConfigs.value.findIndex(
          p => p.type === providerConfig.type && p.url === providerConfig.url
        )
        
        if (existingIndex >= 0) {
          // 更新现有配置
          providerConfigs.value[existingIndex].apiKey = providerConfig.apiKey
          newModel.value.providerId = providerConfigs.value[existingIndex].id
          // 更新 selectedProviderOption 以匹配现有配置
          selectedProviderOption.value = `saved:${providerConfigs.value[existingIndex].id}`
        } else {
          // 添加新配置
          providerConfigs.value.push(providerConfig)
          newModel.value.providerId = providerId
          selectedProviderOption.value = `saved:${providerId}`
        }
      }
      // 如果已有 providerId，说明是从已保存配置加载的，不需要重新保存
    }
    
  } catch (error) {
    console.error('获取模型列表失败:', error)
    fetchError.value = `${error.message}。请检查地址和API Key是否正确`
  } finally {
    fetchingModels.value = false
  }
}

// 获取状态图标
const getStatusIcon = (status) => {
  const icons = {
    online: '🟢',
    offline: '🔴',
    testing: '🟡',
    unknown: '⚪'
  }
  return icons[status] || icons.unknown
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    online: '在线',
    offline: '离线',
    testing: '测试中',
    unknown: '未知'
  }
  return texts[status] || texts.unknown
}

// 测试单个模型
const testSingleModel = async (index) => {
  const model = models.value[index]
  model.status = 'testing'
  
  try {
    const result = await testModelConnection(model)
    model.status = result.success ? 'online' : 'offline'
    
    // 更新统计
    if (!model.stats) {
      model.stats = { calls: 0, successRate: 0, successes: 0 }
    }
    model.stats.calls++
    if (result.success) {
      model.stats.successes++
    }
    model.stats.successRate = Math.round((model.stats.successes / model.stats.calls) * 100)
    
    // 显示测试结果（Toast提示）
    if (result.success) {
      showSuccess(`✅ ${model.name} 连接成功`)
    } else {
      showError(`❌ ${model.name} 连接失败`)
    }
    
  } catch (error) {
    model.status = 'offline'
    showError(`❌ ${model.name} 连接失败`)
  }
}

// 测试所有模型
const testAllModels = async () => {
  if (models.value.length === 0) {
    showInfo('暂无模型配置')
    return
  }
  
  testingAll.value = true
  const results = []
  
  for (let i = 0; i < models.value.length; i++) {
    const model = models.value[i]
    model.status = 'testing'
    
    try {
      const result = await testModelConnection(model)
      model.status = result.success ? 'online' : 'offline'
      
      // 更新统计
      if (!model.stats) {
        model.stats = { calls: 0, successRate: 0, successes: 0 }
      }
      model.stats.calls++
      if (result.success) {
        model.stats.successes++
      }
      model.stats.successRate = Math.round((model.stats.successes / model.stats.calls) * 100)
      
      results.push({
        name: model.name,
        success: result.success
      })
    } catch (error) {
      model.status = 'offline'
      results.push({
        name: model.name,
        success: false
      })
    }
  }
  
  testingAll.value = false
  
  // 显示汇总结果（Toast提示）
  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount
  
  if (failCount === 0) {
    showSuccess(`✅ 全部成功 (${successCount}/${results.length})`)
  } else if (successCount === 0) {
    showError(`❌ 全部失败 (0/${results.length})`)
  } else {
    showWarning(`⚠️ 部分成功 (${successCount}/${results.length})`)
  }
}

// 测试模型连接（通用方法）
const testModelConnection = async (model) => {
  try {
    // 从厂商配置获取完整信息
    const providerConfig = providerConfigs.value.find(p => p.id === model.providerId)
    
    const baseUrl = providerConfig?.url || model.url
    const apiKey = providerConfig?.apiKey || model.apiKey
    const modelName = model.modelName || model.name
    const modelType = model.type
    
    console.log('测试模型:', modelName, '基础URL:', baseUrl, '类型:', modelType)
    
    if (modelType === 'local') {
      // Ollama API
      const apiUrl = getApiUrl(baseUrl, 'local', 'generate')
      
      console.log('最终URL (Ollama):', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: 'test',
          stream: false
        })
      })
      
      console.log('测试结果:', response.ok, response.status)
      return { success: response.ok }
    } else {
      // OpenAI 兼容 API
      const apiUrl = getApiUrl(baseUrl, modelType, 'chat')
      
      console.log('最终URL (OpenAI):', apiUrl)
      
      const headers = { 'Content-Type': 'application/json' }
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      })
      
      console.log('测试结果:', response.ok, response.status)
      
      return { success: response.ok }
    }
  } catch (error) {
    console.error('测试失败:', error)
    return { success: false, error: error.message }
  }
}

// 导出配置
const exportConfig = () => {
  const config = {
    models: models.value,
    defaultModelId: defaultModelId.value,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-models-config-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入配置
const importConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const config = JSON.parse(text)
      
      if (config.models && Array.isArray(config.models)) {
        models.value = config.models
        if (config.defaultModelId) {
          defaultModelId.value = config.defaultModelId
        }
        showSuccess('配置导入成功', '所有模型配置已成功导入')
      } else {
        showError('配置文件格式错误', '请确保导入的是正确的配置文件')
      }
    } catch (error) {
      showError('导入失败', error.message)
    }
  }
  input.click()
}

const testConnection = async () => {
  if (!newModel.value.url || !newModel.value.modelName) {
    showWarning('请先填写地址并选择模型')
    return
  }
  
  testing.value = true
  testResult.value = null
  
  try {
    // 1. 规范化基础URL
    const baseUrl = normalizeBaseUrl(newModel.value.url, newModel.value.type)
    const modelName = newModel.value.modelName
    
    console.log('测试连接 - 基础URL:', baseUrl, '模型:', modelName)
    
    if (newModel.value.type === 'local') {
      // Ollama 测试
      const apiUrl = getApiUrl(baseUrl, 'local', 'generate')
      
      console.log('最终URL (Ollama):', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: 'Hello',
          stream: false
        })
      })
      
      if (response.ok) {
        testResult.value = { success: true, message: '✅ 连接成功！模型响应正常' }
        showSuccess('✅ 连接成功')
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } else {
      // OpenAI 兼容 API 测试
      const apiUrl = getApiUrl(baseUrl, newModel.value.type, 'chat')
      
      console.log('最终URL (OpenAI):', apiUrl)
      
      const headers = {
        'Content-Type': 'application/json'
      }
      if (newModel.value.apiKey) {
        headers['Authorization'] = `Bearer ${newModel.value.apiKey}`
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      })
      
      if (response.ok) {
        testResult.value = { success: true, message: '✅ 连接成功！模型响应正常' }
        showSuccess('✅ 连接成功')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }
    }
  } catch (error) {
    testResult.value = { success: false, message: `❌ 连接失败: ${error.message}` }
    showError(`❌ 连接失败: ${error.message}`)
  } finally {
    testing.value = false
  }
}

const addModel = () => {
  if (!newModel.value.name || !newModel.value.url || !newModel.value.modelName) {
    showWarning('信息不完整', '请填写完整信息并选择模型')
    return
  }

  // 获取或创建厂商配置
  let providerConfig = providerConfigs.value.find(p => p.id === newModel.value.providerId)
  
  // 如果没有厂商配置（手动输入模型时），创建一个
  if (!providerConfig) {
    const providerId = Date.now().toString()
    
    // 规范化基础URL
    const baseUrl = normalizeBaseUrl(newModel.value.url, newModel.value.type)
    
    providerConfig = {
      id: providerId,
      type: newModel.value.type,
      url: baseUrl, // 保存基础URL
      apiKey: newModel.value.apiKey || '',
      createdAt: new Date().toISOString()
    }
    
    providerConfigs.value.push(providerConfig)
    newModel.value.providerId = providerId
    
    console.log('创建新厂商配置 - 基础URL:', baseUrl)
  }

  const model = {
    id: Date.now().toString(),
    type: newModel.value.type,
    name: newModel.value.name,
    url: providerConfig.url, // 保存基础URL
    apiKey: providerConfig.apiKey || '',
    modelName: newModel.value.modelName,
    providerId: newModel.value.providerId
  }

  models.value.push(model)
  
  // 如果是第一个模型，设为默认
  if (models.value.length === 1) {
    defaultModelId.value = model.id
  }

  // 重置表单（保留厂商配置，允许继续添加其他模型）
  const currentProviderId = newModel.value.providerId
  const currentType = newModel.value.type
  const currentUrl = newModel.value.url
  const currentApiKey = newModel.value.apiKey
  const currentOption = selectedProviderOption.value
  
  newModel.value = { 
    type: currentType, 
    name: '', 
    url: currentUrl, 
    apiKey: currentApiKey, 
    modelName: '',
    providerId: currentProviderId
  }
  selectedProviderOption.value = currentOption
  // 不清空 availableModels，允许继续选择
  
  showSuccess('模型添加成功！', '可继续选择其他模型')
}

// 清空表单
const clearForm = () => {
  newModel.value = { 
    type: 'local', 
    name: '', 
    url: '', 
    apiKey: '', 
    modelName: '', 
    providerId: ''
  }
  selectedProviderOption.value = ''
  availableModels.value = []
  fetchError.value = ''
  testResult.value = null
}

const setDefault = (id) => {
  defaultModelId.value = id
}

const editModel = (index) => {
  const model = models.value[index]
  
  // 从厂商配置恢复地址和API Key
  const providerConfig = providerConfigs.value.find(p => p.id === model.providerId)
  
  newModel.value = { 
    ...model,
    url: providerConfig?.url || model.url,
    apiKey: providerConfig?.apiKey || model.apiKey
  }
  
  // 重新获取模型列表
  if (providerConfig) {
    fetchAvailableModels()
  }
  
  models.value.splice(index, 1)
}

const deleteModel = (index) => {
  if (confirm('确定删除此模型？')) {
    const model = models.value[index]
    models.value.splice(index, 1)
    
    // 如果删除的是默认模型，重新设置默认
    if (model.id === defaultModelId.value && models.value.length > 0) {
      defaultModelId.value = models.value[0].id
    }
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

.ai-config-modal {
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
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
}

.back-btn {
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0 1rem;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.hint-text {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
}

.hint-text code {
  background: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  color: #667eea;
}

.section {
  margin-bottom: 1.5rem;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
}

.section:hover {
  border-color: #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section:last-child {
  margin-bottom: 0;
}

.add-section {
  border-left: 4px solid #667eea;
}

.default-section {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%);
  padding: 1.5rem;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-left: 4px solid #4caf50;
}

.section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-select-large {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.form-select-large:hover {
  border-color: #667eea;
}

.form-select-large:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.hint-text {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.empty-hint {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
  border-radius: 12px;
  border: 2px dashed #ddd;
}

.models-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.model-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.model-item.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.model-item.online {
  border-left: 4px solid #4caf50;
}

.model-item.offline {
  border-left: 4px solid #f44336;
}

.model-item.testing {
  border-left: 4px solid #ff9800;
}

.model-status-indicator {
  font-size: 1.3rem;
  margin-right: 0.75rem;
  cursor: help;
}

.model-info {
  flex: 1;
}

.model-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.model-url {
  font-size: 0.85rem;
  color: #888;
  word-break: break-all;
  margin-bottom: 0.25rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.model-stats {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

.model-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-test {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-test:hover {
  background: #1976d2;
  color: white;
}

.btn-default {
  background: #667eea;
  color: white;
}

.btn-edit {
  background: #f0f0f0;
  color: #333;
}

.btn-edit:hover {
  background: #e0e0e0;
}

.btn-delete {
  background: #fee;
  color: #c33;
}

.btn-delete:hover {
  background: #fdd;
}

.badge-default {
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-recommended {
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
  color: #333;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.section-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-test-all,
.btn-export,
.btn-import {
  padding: 0.4rem 0.8rem;
  border: 1.5px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-test-all:hover,
.btn-export:hover,
.btn-import:hover {
  background: #667eea;
  color: white;
}

.btn-test-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-model-form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.form-select, .form-input {
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  font-weight: 500;
}

.form-select:hover, .form-input:hover {
  border-color: #667eea;
}

.form-select:focus, .form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.btn-add {
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-clear {
  padding: 0.875rem 1.25rem;
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-clear:hover {
  background: #f8f9fa;
  border-color: #667eea;
  color: #667eea;
}

.loading-hint {
  padding: 0.5rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: center;
}

.error-hint {
  padding: 0.5rem;
  background: #ffebee;
  color: #d32f2f;
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: center;
}

.api-hint {
  font-size: 0.85rem;
  color: #666;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.api-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.api-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.model-name-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.model-name-preview label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.test-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.btn-test {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-test:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-result {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  animation: fadeIn 0.3s;
}

.test-result.success {
  color: #10b981;
  background: #d1fae5;
}

.test-result.error {
  color: #ef4444;
  background: #fee2e2;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.provider-configs {
  margin-bottom: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 8px;
  border: 1.5px solid rgba(102, 126, 234, 0.2);
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.add-section {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border: 2px solid rgba(102, 126, 234, 0.3);
}

.welcome-hint {
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.provider-selector {
  margin-bottom: 1rem;
}

.url-display {
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.url-label {
  color: #666;
  font-weight: 700;
  font-size: 0.875rem;
}

.url-value {
  color: #667eea;
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
}

/* 已保存配置信息卡片 */
.selected-provider-card {
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 2px solid #667eea;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.provider-info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.provider-info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #666;
  font-weight: 700;
  min-width: 100px;
  font-size: 0.875rem;
}

.info-value {
  color: #333;
  font-family: 'Monaco', 'Menlo', monospace;
  flex: 1;
  word-break: break-all;
  font-weight: 600;
}

.btn-fetch-models {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-fetch-models:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-fetch-models:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.provider-configs-compact {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.provider-configs-compact .form-select {
  flex: 1;
}

.btn-manage-inline {
  padding: 0.75rem 1rem;
  background: white;
  border: 1.5px solid #667eea;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-manage-inline:hover {
  background: #667eea;
  color: white;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-group .form-input {
  flex: 1;
}

.btn-action {
  padding: 0.75rem 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-hint {
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  text-align: center;
  margin: 0.5rem 0;
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
  border: 2px solid;
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

.status-hint.loading {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  border-color: #90caf9;
}

.status-hint.error {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #d32f2f;
  border-color: #ef5350;
}

.status-hint.success {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
  border-color: #4caf50;
  font-weight: 700;
}

.welcome-hint {
  padding: 1.25rem;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 2px solid #ffb74d;
  border-radius: 12px;
  color: #e65100;
  font-weight: 700;
  font-size: 1rem;
  text-align: center;
  margin-bottom: 1rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-primary {
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  padding: 0.875rem 1.5rem;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear-inline {
  padding: 0.875rem;
  width: 48px;
  background: white;
  border: 2px solid #e0e0e0;
  color: #666;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-clear-inline:hover {
  background: #f8f9fa;
  border-color: #667eea;
  color: #667eea;
  transform: rotate(180deg);
}

.btn-icon {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-manage {
  padding: 0.4rem 0.8rem;
  background: white;
  border: 1.5px solid #667eea;
  color: #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-manage:hover {
  background: #667eea;
  color: white;
}

.provider-manager-modal {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.provider-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.provider-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
}

.provider-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.provider-info {
  flex: 1;
}

.provider-type {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.provider-url {
  font-size: 0.85rem;
  color: #666;
  word-break: break-all;
  margin-bottom: 0.25rem;
}

.provider-meta {
  font-size: 0.75rem;
  color: #999;
}

.provider-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
