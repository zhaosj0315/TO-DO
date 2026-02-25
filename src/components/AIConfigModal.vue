<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>⚙️ AI配置</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>服务类型</label>
          <select v-model="config.provider">
            <option value="ollama">本地Ollama</option>
            <option value="openai">OpenAI兼容API</option>
          </select>
        </div>

        <template v-if="config.provider === 'ollama'">
          <div class="form-group">
            <label>Ollama地址</label>
            <input v-model="config.ollamaUrl" placeholder="http://192.168.31.159:11434" @blur="fetchOllamaModels" />
          </div>
          <div class="form-group">
            <label>模型名称</label>
            <select v-model="config.ollamaModel" :disabled="loadingModels">
              <option v-if="loadingModels" value="">加载中...</option>
              <option v-else-if="ollamaModels.length === 0" value="">请先输入地址</option>
              <option v-for="model in ollamaModels" :key="model" :value="model">{{ model }}</option>
            </select>
          </div>
        </template>

        <template v-else>
          <div class="form-group">
            <label>API地址</label>
            <input v-model="config.apiUrl" placeholder="https://api.openai.com/v1" />
          </div>
          <div class="form-group">
            <label>API Key</label>
            <input v-model="config.apiKey" type="password" placeholder="sk-..." @blur="fetchAPIModels" />
          </div>
          <div class="form-group">
            <label>模型名称</label>
            <select v-model="config.apiModel" :disabled="loadingModels">
              <option v-if="loadingModels" value="">加载中...</option>
              <option v-else-if="apiModels.length === 0" value="">请先输入API Key</option>
              <option v-for="model in apiModels" :key="model" :value="model">{{ model }}</option>
            </select>
          </div>
        </template>

        <div class="test-section">
          <button @click="testConnection" :disabled="testing" class="test-btn">
            {{ testing ? '测试中...' : '🔍 测试连接' }}
          </button>
          <span v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
            {{ testResult.message }}
          </span>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-secondary">取消</button>
        <button @click="save" class="btn-primary">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Preferences } from '@capacitor/preferences'

const emit = defineEmits(['close', 'saved'])

const config = ref({
  provider: 'ollama',
  ollamaUrl: 'http://192.168.31.159:11434',
  ollamaModel: 'gemma2:2b',
  apiKey: '',
  apiUrl: '',
  apiModel: ''
})

const testing = ref(false)
const testResult = ref(null)
const loadingModels = ref(false)
const ollamaModels = ref([])
const apiModels = ref([])

onMounted(async () => {
  const { value } = await Preferences.get({ key: 'aiConfig' })
  if (value) {
    config.value = JSON.parse(value)
    // 自动加载模型列表
    if (config.value.provider === 'ollama' && config.value.ollamaUrl) {
      await fetchOllamaModels()
    } else if (config.value.provider === 'openai' && config.value.apiKey) {
      await fetchAPIModels()
    }
  }
})

// 获取Ollama模型列表
const fetchOllamaModels = async () => {
  if (!config.value.ollamaUrl) return
  
  loadingModels.value = true
  try {
    const response = await fetch(`${config.value.ollamaUrl}/api/tags`)
    const data = await response.json()
    ollamaModels.value = data.models.map(m => m.name)
    // 如果当前没有选中模型，自动选择第一个
    if (!config.value.ollamaModel && ollamaModels.value.length > 0) {
      config.value.ollamaModel = ollamaModels.value[0]
    }
  } catch (error) {
    console.error('获取Ollama模型失败:', error)
    ollamaModels.value = []
  } finally {
    loadingModels.value = false
  }
}

// 获取OpenAI兼容API模型列表
const fetchAPIModels = async () => {
  if (!config.value.apiUrl || !config.value.apiKey) return
  
  loadingModels.value = true
  try {
    const response = await fetch(`${config.value.apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.value.apiKey}`
      }
    })
    const data = await response.json()
    apiModels.value = data.data.map(m => m.id)
    // 如果当前没有选中模型，自动选择第一个
    if (!config.value.apiModel && apiModels.value.length > 0) {
      config.value.apiModel = apiModels.value[0]
    }
  } catch (error) {
    console.error('获取API模型失败:', error)
    apiModels.value = []
  } finally {
    loadingModels.value = false
  }
}

const testConnection = async () => {
  testing.value = true
  testResult.value = null
  
  try {
    const url = config.value.provider === 'ollama' 
      ? config.value.ollamaUrl 
      : config.value.apiUrl
    const model = config.value.provider === 'ollama'
      ? config.value.ollamaModel
      : config.value.apiModel
    
    if (config.value.provider === 'ollama') {
      const response = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: 'Hello',
          stream: false
        })
      })
      if (response.ok) {
        testResult.value = { success: true, message: '✅ 连接成功' }
      } else {
        throw new Error('连接失败')
      }
    } else {
      const response = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.value.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      })
      if (response.ok) {
        testResult.value = { success: true, message: '✅ 连接成功' }
      } else {
        throw new Error('连接失败')
      }
    }
  } catch (error) {
    testResult.value = { success: false, message: '❌ ' + error.message }
  } finally {
    testing.value = false
  }
}

const save = async () => {
  await Preferences.set({
    key: 'aiConfig',
    value: JSON.stringify(config.value)
  })
  emit('saved')
  emit('close')
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
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  overflow-y: auto;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
}

.test-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.test-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-result {
  font-size: 0.9rem;
}

.test-result.success {
  color: #10b981;
}

.test-result.error {
  color: #ef4444;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary,
.btn-primary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #666;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
</style>
