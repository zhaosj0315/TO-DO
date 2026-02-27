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

      <div class="modal-body">
        <!-- 默认模型选择 -->
        <div class="section default-section">
          <h4>⭐ 默认使用模型</h4>
          <div v-if="models.length === 0" class="empty-hint">
            请先添加模型配置
          </div>
          <select v-else v-model="defaultModelId" class="form-select-large">
            <option v-for="model in models" :key="model.id" :value="model.id">
              {{ model.name }} ({{ model.type === 'local' ? '本地' : model.type === 'openai' ? 'OpenAI' : '自定义' }})
            </option>
          </select>
          <div class="hint-text">
            💡 问答和总结功能将使用此模型
          </div>
        </div>

        <!-- 模型列表 -->
        <div class="section">
          <div class="section-header">
            <h4>📋 已配置模型 ({{ models.length }})</h4>
            <div class="section-actions">
              <button @click="testAllModels" class="btn-test-all" :disabled="testingAll">
                {{ testingAll ? '⏳ 测试中...' : '🔍 测试全部' }}
              </button>
              <button @click="exportConfig" class="btn-export">
                📤 导出配置
              </button>
              <button @click="importConfig" class="btn-import">
                📥 导入配置
              </button>
            </div>
          </div>
          <div v-if="models.length === 0" class="empty-hint">
            暂无模型配置，请添加
          </div>
          <div v-else class="models-list">
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

        <!-- 添加模型 -->
        <div class="section">
          <h4>➕ 添加新模型</h4>
          <div class="add-model-form">
            <!-- 1. 模型类型 -->
            <select v-model="newModel.type" class="form-select">
              <option value="local">本地Ollama</option>
              <option value="openai">OpenAI</option>
              <option value="custom">自定义</option>
            </select>
            
            <!-- 2. 厂商地址 + 测试连接 -->
            <div style="display: flex; gap: 0.5rem;">
              <input 
                v-model="newModel.url" 
                :placeholder="getUrlPlaceholder()"
                class="form-input"
                style="flex: 1;"
              />
              <button @click="fetchAvailableModels" class="btn-fetch" title="获取模型列表">
                🔄 获取模型
              </button>
              <button 
                v-if="newModel.modelName"
                @click="testConnection" 
                :disabled="testing"
                class="btn-test-inline"
              >
                {{ testing ? '测试中...' : '🔍 测试连接' }}
              </button>
            </div>
            
            <!-- 3. API Key（如果需要） -->
            <input 
              v-if="newModel.type === 'openai' || newModel.type === 'custom'"
              v-model="newModel.apiKey" 
              type="password"
              placeholder="API Key"
              class="form-input"
            />
            <div v-if="newModel.type === 'openai' || newModel.type === 'custom'" class="api-hint">
              💡 没有 API Key？我用的是 <a href="https://cn.gptapi.asia/register?aff=Okck" target="_blank" class="api-link">这个服务</a>，你也可以试试
            </div>
            
            <!-- 4. 选择模型 -->
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
            
            <!-- 加载和错误提示 -->
            <div v-if="fetchingModels" class="loading-hint">
              🔄 正在获取可用模型...
            </div>
            <div v-if="fetchError" class="error-hint">
              ⚠️ {{ fetchError }}
            </div>
            
            <!-- 测试结果提示 -->
            <div v-if="testResult" :class="['test-result-box', testResult.success ? 'success' : 'error']">
              {{ testResult.message }}
            </div>
            
            <!-- 添加按钮 -->
            <button 
              v-if="newModel.modelName"
              @click="addModel" 
              class="btn-add"
              :disabled="testing"
            >
              ➕ 添加模型 ({{ newModel.name || '自动生成名称' }})
            </button>
          </div>
        </div>

        <!-- 快速配置 -->
        <div class="section">
          <h4>⚡ 快速配置</h4>
          <div class="quick-configs">
            <button @click="addQuickConfig('local')" class="btn-quick">
              🏠 本地Ollama
            </button>
            <button @click="addQuickConfig('openai')" class="btn-quick">
              🌐 OpenAI
            </button>
            <button @click="addQuickConfig('ngrok')" class="btn-quick">
              🔗 Ngrok隧道
            </button>
          </div>
          
          <!-- 智能推荐 -->
          <div class="recommendation-box">
            <div class="recommendation-title">💡 智能推荐</div>
            <div class="recommendation-list">
              <div class="recommendation-item">
                <div class="rec-icon">🏠</div>
                <div class="rec-content">
                  <div class="rec-name">本地Ollama</div>
                  <div class="rec-desc">隐私安全，完全离线，适合敏感数据处理</div>
                  <div class="rec-tags">
                    <span class="tag-free">免费</span>
                    <span class="tag-fast">快速</span>
                    <span class="tag-privacy">隐私</span>
                  </div>
                </div>
              </div>
              <div class="recommendation-item">
                <div class="rec-icon">🌐</div>
                <div class="rec-content">
                  <div class="rec-name">OpenAI API</div>
                  <div class="rec-desc">效果最佳，响应快速，适合高质量内容生成</div>
                  <div class="rec-tags">
                    <span class="tag-quality">高质量</span>
                    <span class="tag-stable">稳定</span>
                  </div>
                </div>
              </div>
              <div class="recommendation-item">
                <div class="rec-icon">🔗</div>
                <div class="rec-content">
                  <div class="rec-name">Ngrok隧道</div>
                  <div class="rec-desc">远程访问本地模型，兼顾隐私和便利</div>
                  <div class="rec-tags">
                    <span class="tag-flexible">灵活</span>
                    <span class="tag-remote">远程</span>
                  </div>
                </div>
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

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'update'])

// 从localStorage加载配置
const models = ref(JSON.parse(localStorage.getItem('ai_models') || '[]'))
const defaultModelId = ref(localStorage.getItem('ai_default_model') || '')

// 新模型表单
const newModel = ref({
  type: 'local',
  name: '',
  url: '',
  apiKey: '',
  modelName: ''
})

// 可用模型列表
const availableModels = ref([])
const fetchingModels = ref(false)
const fetchError = ref('')

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

// 保存到localStorage
watch([models, defaultModelId], () => {
  localStorage.setItem('ai_models', JSON.stringify(models.value))
  localStorage.setItem('ai_default_model', defaultModelId.value)
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
    alert('请先输入厂商地址')
    return
  }
  
  fetchingModels.value = true
  fetchError.value = ''
  availableModels.value = []
  
  try {
    let apiUrl = newModel.value.url
    
    // 根据类型构造正确的API端点
    if (newModel.value.type === 'local') {
      // Ollama: http://host:11434/api/tags
      if (apiUrl.includes('/api/generate')) {
        apiUrl = apiUrl.replace('/api/generate', '/api/tags')
      } else if (apiUrl.includes('/api/')) {
        apiUrl = apiUrl.replace(/\/api\/.*/, '/api/tags')
      } else {
        // 如果只是 http://localhost:11434，自动添加 /api/tags
        apiUrl = apiUrl.replace(/\/$/, '') + '/api/tags'
      }
    } else if (newModel.value.type === 'openai' || newModel.value.type === 'custom') {
      // OpenAI 兼容: /v1/models
      if (apiUrl.includes('/v1/chat/completions')) {
        apiUrl = apiUrl.replace('/v1/chat/completions', '/v1/models')
      } else if (apiUrl.includes('/v1')) {
        apiUrl = apiUrl.replace(/\/v1.*/, '/v1/models')
      } else {
        apiUrl = apiUrl + '/v1/models'
      }
    }
    
    console.log('获取模型列表:', apiUrl)
    
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
    }
    
  } catch (error) {
    console.error('获取模型列表失败:', error)
    fetchError.value = `${error.message}。请检查地址和API Key是否正确`
  } finally {
    fetchingModels.value = false
  }
}

// 测试连接
const testing = ref(false)
const testResult = ref(null)
const testingAll = ref(false)

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
    
  } catch (error) {
    model.status = 'offline'
  }
}

// 测试所有模型
const testAllModels = async () => {
  testingAll.value = true
  
  for (let i = 0; i < models.value.length; i++) {
    await testSingleModel(i)
  }
  
  testingAll.value = false
  alert('✅ 所有模型测试完成')
}

// 测试模型连接（通用方法）
const testModelConnection = async (model) => {
  try {
    let apiUrl = model.url
    const modelName = model.modelName || model.name
    
    if (model.type === 'local') {
      if (!apiUrl.includes('/api/generate')) {
        apiUrl = apiUrl.replace(/\/$/, '') + '/api/generate'
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: 'test',
          stream: false
        })
      })
      
      return { success: response.ok }
    } else {
      if (!apiUrl.includes('/chat/completions')) {
        apiUrl = apiUrl.replace(/\/$/, '') + '/v1/chat/completions'
      }
      
      const headers = { 'Content-Type': 'application/json' }
      if (model.apiKey) {
        headers['Authorization'] = `Bearer ${model.apiKey}`
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
      
      return { success: response.ok }
    }
  } catch (error) {
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
        alert('✅ 配置导入成功')
      } else {
        alert('❌ 配置文件格式错误')
      }
    } catch (error) {
      alert('❌ 导入失败: ' + error.message)
    }
  }
  input.click()
}

const testConnection = async () => {
  if (!newModel.value.url || !newModel.value.modelName) {
    alert('请先填写地址并选择模型')
    return
  }
  
  testing.value = true
  testResult.value = null
  
  try {
    let apiUrl = newModel.value.url
    const modelName = newModel.value.modelName
    
    if (newModel.value.type === 'local') {
      // Ollama 测试
      if (!apiUrl.includes('/api/generate')) {
        apiUrl = apiUrl.replace(/\/$/, '') + '/api/generate'
      }
      
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
        const data = await response.json()
        testResult.value = { success: true, message: '✅ 连接成功！模型响应正常' }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } else {
      // OpenAI 兼容 API 测试
      if (!apiUrl.includes('/chat/completions')) {
        apiUrl = apiUrl.replace(/\/$/, '') + '/v1/chat/completions'
      }
      
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
        const data = await response.json()
        testResult.value = { success: true, message: '✅ 连接成功！模型响应正常' }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }
    }
  } catch (error) {
    console.error('测试连接失败:', error)
    testResult.value = { success: false, message: `❌ 连接失败: ${error.message}` }
  } finally {
    testing.value = false
  }
}

const addModel = () => {
  if (!newModel.value.name || !newModel.value.url) {
    alert('请填写模型名称和地址')
    return
  }

  const model = {
    id: Date.now().toString(),
    type: newModel.value.type,
    name: newModel.value.name,
    url: newModel.value.url,
    apiKey: newModel.value.apiKey || '',
    modelName: newModel.value.modelName || newModel.value.name
  }

  models.value.push(model)
  
  // 如果是第一个模型，设为默认
  if (models.value.length === 1) {
    defaultModelId.value = model.id
  }

  // 重置表单
  newModel.value = { type: 'local', name: '', url: '', apiKey: '', modelName: '' }
  availableModels.value = []
  fetchError.value = ''
}

const setDefault = (id) => {
  defaultModelId.value = id
}

const editModel = (index) => {
  const model = models.value[index]
  newModel.value = { ...model }
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

const addQuickConfig = (type) => {
  if (type === 'local') {
    newModel.value = {
      type: 'local',
      name: '本地Ollama',
      url: 'http://192.168.31.159:11434/api/generate',
      apiKey: ''
    }
  } else if (type === 'openai') {
    newModel.value = {
      type: 'openai',
      name: 'OpenAI GPT-3.5',
      url: 'https://api.openai.com/v1/chat/completions',
      apiKey: ''
    }
  } else if (type === 'ngrok') {
    newModel.value = {
      type: 'custom',
      name: 'Ngrok隧道',
      url: 'https://xxx.ngrok-free.dev/ollama/api/generate',
      apiKey: ''
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
}

.section:last-child {
  margin-bottom: 0;
}

.default-section {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  padding: 1rem;
  border-radius: 10px;
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  color: #333;
  font-weight: 600;
}

.form-select-large {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #d0d0d0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.form-select-large:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.hint-text {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #667eea;
  text-align: center;
}

.empty-hint {
  text-align: center;
  padding: 1.5rem;
  color: #999;
  font-size: 0.9rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.models-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
}

.model-item.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
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
  font-size: 1.2rem;
  margin-right: 0.5rem;
  cursor: help;
}

.model-info {
  flex: 1;
}

.model-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.model-url {
  font-size: 0.85rem;
  color: #666;
  word-break: break-all;
  margin-bottom: 0.25rem;
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
  gap: 0.75rem;
}

.form-select, .form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
}

.btn-add {
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
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

.quick-configs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-quick {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-quick:hover {
  background: #667eea;
  color: white;
}

/* 智能推荐样式 */
.recommendation-box {
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff8f0 100%);
  border-radius: 12px;
  border: 2px solid #e8e8ff;
}

.recommendation-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recommendation-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1.5px solid #e8e8ff;
  transition: all 0.2s;
}

.recommendation-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.rec-icon {
  font-size: 2rem;
  line-height: 1;
}

.rec-content {
  flex: 1;
}

.rec-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.rec-desc {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.rec-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.rec-tags span {
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-free {
  background: #e8f5e9;
  color: #2e7d32;
}

.tag-fast {
  background: #e3f2fd;
  color: #1976d2;
}

.tag-privacy {
  background: #f3e5f5;
  color: #7b1fa2;
}

.tag-quality {
  background: #fff3e0;
  color: #e65100;
}

.tag-stable {
  background: #e0f2f1;
  color: #00695c;
}

.tag-flexible {
  background: #fce4ec;
  color: #c2185b;
}

.tag-remote {
  background: #e8eaf6;
  color: #3f51b5;
}

.btn-fetch {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-fetch:hover {
  transform: scale(1.05);
}

.btn-fetch:active {
  transform: scale(0.95);
}

.btn-test-inline {
  padding: 0.75rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-test-inline:hover {
  background: #218838;
  transform: scale(1.05);
}

.btn-test-inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-result-box {
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.test-result-box.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.test-result-box.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
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
</style>
