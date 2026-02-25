<template>
  <button @click="handleClick" class="ai-assist-btn" :disabled="loading" :title="tooltip">
    <span v-if="!loading">✨</span>
    <span v-else class="loading-spinner">⏳</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'

const props = defineProps({
  context: String,  // 上下文信息（用于生成更好的提示词）
  placeholder: String,  // 输入框的占位符提示
  tooltip: { type: String, default: 'AI辅助生成' }
})

const emit = defineEmits(['generated'])

const loading = ref(false)

// 获取AI配置
const getAIConfig = async () => {
  const { value } = await Preferences.get({ key: 'aiConfig' })
  if (value) {
    return JSON.parse(value)
  }
  // 默认配置
  return {
    provider: 'ollama',  // ollama | openai | custom
    ollamaUrl: 'http://192.168.31.159:11434',
    ollamaModel: 'gemma2:2b',
    apiKey: '',
    apiUrl: '',
    apiModel: ''
  }
}

// 保存AI配置
const saveAIConfig = async (config) => {
  await Preferences.set({
    key: 'aiConfig',
    value: JSON.stringify(config)
  })
}

const handleClick = async () => {
  loading.value = true
  try {
    const config = await getAIConfig()
    
    // 如果是首次使用，弹出配置窗口
    if (!config.ollamaUrl && !config.apiUrl) {
      const url = prompt('请输入AI服务地址：\n\n本地Ollama: http://192.168.31.159:11434\nOpenAI兼容API: https://api.openai.com/v1', 'http://192.168.31.159:11434')
      if (!url) {
        loading.value = false
        return
      }
      config.ollamaUrl = url
      await saveAIConfig(config)
    }
    
    // 构建提示词
    const prompt = buildPrompt(props.context, props.placeholder)
    
    // 调用AI
    const result = await callAI(config, prompt)
    
    // 返回生成的文本
    emit('generated', result)
  } catch (error) {
    alert('AI生成失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const buildPrompt = (context, placeholder) => {
  let prompt = '请根据以下信息生成简洁的文本（50字以内）：\n\n'
  if (context) {
    prompt += `上下文：${context}\n\n`
  }
  if (placeholder) {
    prompt += `要求：${placeholder}\n\n`
  }
  prompt += '只返回生成的文本内容，不要有任何解释或额外说明。'
  return prompt
}

const callAI = async (config, prompt) => {
  const url = config.ollamaUrl || config.apiUrl
  const model = config.ollamaModel || config.apiModel || 'gemma2:2b'
  
  // Ollama格式
  if (url.includes('11434') || config.provider === 'ollama') {
    const response = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    })
    const data = await response.json()
    return data.response.trim()
  }
  
  // OpenAI兼容格式
  const response = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100
    })
  })
  const data = await response.json()
  return data.choices[0].message.content.trim()
}
</script>

<style scoped>
.ai-assist-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.ai-assist-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-assist-btn:active:not(:disabled) {
  transform: translateY(0);
}

.ai-assist-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
