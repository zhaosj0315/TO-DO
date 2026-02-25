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
          <h4>📋 已配置模型 ({{ models.length }})</h4>
          <div v-if="models.length === 0" class="empty-hint">
            暂无模型配置，请添加
          </div>
          <div v-else class="models-list">
            <div 
              v-for="(model, index) in models" 
              :key="index"
              class="model-item"
              :class="{ active: model.id === defaultModelId }"
            >
              <div class="model-info">
                <div class="model-name">
                  {{ model.name }}
                  <span v-if="model.id === defaultModelId" class="badge-default">默认</span>
                </div>
                <div class="model-url">{{ model.url }}</div>
              </div>
              <div class="model-actions">
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
            
            <!-- 2. 厂商地址 -->
            <div style="display: flex; gap: 0.5rem;">
              <input 
                v-model="newModel.url" 
                :placeholder="getUrlPlaceholder()"
                class="form-input"
                style="flex: 1;"
              />
              <button @click="fetchAvailableModels" class="btn-fetch" title="获取模型列表">
                🔄
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
            
            <!-- 4. 选择模型（自动获取） -->
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
            
            <!-- 5. 模型名称（自动填充或手动输入） -->
            <input 
              v-model="newModel.name" 
              :placeholder="availableModels.length > 0 ? '从上方选择模型' : '模型名称（如：gpt-4o-mini）'"
              class="form-input"
            />
            
            <div class="hint-text">
              💡 {{ newModel.type === 'local' ? '本地Ollama: 在终端运行 ollama list 查看模型' : 'OpenAI: 点击🔄获取可用模型列表' }}
            </div>
            
            <button @click="addModel" class="btn-add">添加模型</button>
          </div>
        </div>

        <!-- 快速配置 -->
        <div class="section">
          <h4>⚡ 快速配置</h4>
          <div class="quick-configs">
            <button @click="addQuickConfig('local')" class="btn-quick">
              本地Ollama
            </button>
            <button @click="addQuickConfig('openai')" class="btn-quick">
              OpenAI
            </button>
            <button @click="addQuickConfig('ngrok')" class="btn-quick">
              Ngrok隧道
            </button>
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

// 监听模型选择，自动填充名称
watch(() => newModel.value.modelName, (modelName) => {
  if (modelName && !newModel.value.name) {
    newModel.value.name = modelName
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
  z-index: 10000;
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
}

.model-item.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
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
}

.model-url {
  font-size: 0.85rem;
  color: #666;
  word-break: break-all;
}

.model-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-default {
  background: #667eea;
  color: white;
}

.btn-edit {
  background: #f0f0f0;
  color: #333;
}

.btn-delete {
  background: #fee;
  color: #c33;
}

.badge-default {
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
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

.btn-fetch {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.btn-fetch:hover {
  transform: scale(1.05);
}

.btn-fetch:active {
  transform: scale(0.95);
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
</style>
