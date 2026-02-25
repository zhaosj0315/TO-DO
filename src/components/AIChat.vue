<template>
  <div v-if="visible" class="ai-chat-overlay" @click.self="$emit('close')">
    <div class="ai-chat-container">
      <div class="ai-chat-header">
        <h3>🤖 AI 任务助手</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <div class="ai-chat-settings">
        <select v-model="apiType" class="api-select">
          <option value="pangu">盘古大模型</option>
          <option value="openai">OpenAI</option>
          <option value="local">本地模型</option>
        </select>
        <input 
          v-if="apiType === 'openai'" 
          v-model="apiKey" 
          type="password" 
          placeholder="OpenAI API Key"
          class="api-input"
        />
        <input 
          v-else-if="apiType === 'pangu'"
          v-model="panguUrl" 
          type="text" 
          placeholder="本地: http://192.168.31.159:11434/api/generate"
          class="api-input"
        />
        <input 
          v-else
          v-model="localUrl" 
          type="text" 
          placeholder="http://192.168.31.159:11434"
          class="api-input"
        />
      </div>

      <div class="ai-chat-messages" ref="messagesContainer">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['message', msg.role]">
          <div class="message-content">{{ msg.content }}</div>
        </div>
        <div v-if="loading" class="message assistant">
          <div class="message-content">思考中...</div>
        </div>
        
        <!-- 快捷问题 -->
        <div v-if="messages.length === 1" class="quick-questions">
          <div class="quick-label">💡 试试问我：</div>
          <button @click="askQuick('今天我完成了哪些任务？')" class="quick-btn">今天完成了什么？</button>
          <button @click="askQuick('本周我的任务完成情况如何？')" class="quick-btn">本周完成情况</button>
          <button @click="askQuick('我有哪些高优先级的待办任务？')" class="quick-btn">高优先级待办</button>
          <button @click="askQuick('分析一下我的任务执行效率')" class="quick-btn">效率分析</button>
          <button @click="askQuick('我遇到了哪些阻碍？')" class="quick-btn">阻碍统计</button>
          <button @click="askQuick('给我一些任务管理建议')" class="quick-btn">管理建议</button>
        </div>
      </div>

      <div class="ai-chat-input">
        <textarea 
          v-model="userInput" 
          @keydown.enter.prevent="sendMessage"
          placeholder="问我关于你的任务..."
          rows="2"
        ></textarea>
        <button @click="sendMessage" :disabled="loading || !userInput.trim()" class="btn-send">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: Boolean,
  tasksData: Object
})

const emit = defineEmits(['close'])

const apiType = ref(localStorage.getItem('ai_api_type') || 'local')
const apiKey = ref(localStorage.getItem('ai_api_key') || '')
const panguUrl = ref(localStorage.getItem('ai_pangu_url') || 'http://192.168.31.159:11434/api/generate')
const localUrl = ref(localStorage.getItem('ai_local_url') || 'http://192.168.31.159:11434')
const messages = ref([])
const userInput = ref('')
const loading = ref(false)
const messagesContainer = ref(null)

watch([apiType, apiKey, panguUrl, localUrl], () => {
  localStorage.setItem('ai_api_type', apiType.value)
  localStorage.setItem('ai_api_key', apiKey.value)
  localStorage.setItem('ai_pangu_url', panguUrl.value)
  localStorage.setItem('ai_local_url', localUrl.value)
})

watch(() => props.visible, (val) => {
  if (val && messages.value.length === 0) {
    messages.value.push({
      role: 'assistant',
      content: '你好！我是你的AI任务助手 🤖\n\n我已经读取了你的所有任务数据，包括：\n• 任务详情（标题、描述、状态）\n• 执行日志和进度\n• 番茄钟记录\n• 时间统计\n\n你可以问我任何关于任务的问题，比如：\n"今天完成了什么？"\n"本周效率如何？"\n"有哪些逾期任务？"'
    })
  }
})

const askQuick = (question) => {
  userInput.value = question
  sendMessage()
}

const buildContext = () => {
  const { tasks = [], deletedTasks = [] } = props.tasksData
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // 统计数据
  const completed = tasks.filter(t => t.status === 'completed')
  const pending = tasks.filter(t => t.status === 'pending')
  const overdue = tasks.filter(t => t.status === 'overdue')
  
  // 今日任务
  const todayTasks = tasks.filter(t => {
    const created = new Date(t.created_at)
    return created >= today
  })
  
  // 本周任务
  const weekTasks = tasks.filter(t => {
    const created = new Date(t.created_at)
    return created >= weekStart
  })
  
  // 本月任务
  const monthTasks = tasks.filter(t => {
    const created = new Date(t.created_at)
    return created >= monthStart
  })

  // 今日完成
  const todayCompleted = completed.filter(t => {
    if (!t.completed_at) return false
    const completedDate = new Date(t.completed_at)
    return completedDate >= today
  })

  // 本周完成
  const weekCompleted = completed.filter(t => {
    if (!t.completed_at) return false
    const completedDate = new Date(t.completed_at)
    return completedDate >= weekStart
  })

  // 本月完成
  const monthCompleted = completed.filter(t => {
    if (!t.completed_at) return false
    const completedDate = new Date(t.completed_at)
    return completedDate >= monthStart
  })

  // 番茄钟统计
  const totalPomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)
  const todayPomodoros = todayCompleted.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)

  // 执行日志统计
  const totalLogs = tasks.reduce((sum, t) => sum + (t.logs?.length || 0), 0)
  const blocksCount = tasks.reduce((sum, t) => 
    sum + (t.logs?.filter(log => log.type === 'block').length || 0), 0)
  const solutionsCount = tasks.reduce((sum, t) => 
    sum + (t.logs?.filter(log => log.type === 'solution').length || 0), 0)

  return `# 用户任务数据总览（当前时间：${now.toLocaleString('zh-CN')}）

## 📊 整体统计
- 总任务数：${tasks.length}
- 已完成：${completed.length}（完成率 ${tasks.length > 0 ? Math.round(completed.length / tasks.length * 100) : 0}%）
- 待办中：${pending.length}
- 已逾期：${overdue.length}
- 回收站：${deletedTasks.length}
- 总番茄钟：${totalPomodoros}个
- 总执行日志：${totalLogs}条
- 遇到阻碍：${blocksCount}次，已解决：${solutionsCount}次

## 📅 今日数据（${today.toLocaleDateString('zh-CN')}）
- 今日创建：${todayTasks.length}个任务
- 今日完成：${todayCompleted.length}个任务
- 今日番茄钟：${todayPomodoros}个
${todayCompleted.length > 0 ? '\n今日完成的任务：\n' + todayCompleted.map(t => 
  `  • ${t.text}（${t.category}/${t.priority}优先级）${t.description ? ' - ' + t.description : ''}`
).join('\n') : ''}

## 📆 本周数据（${weekStart.toLocaleDateString('zh-CN')} 至今）
- 本周创建：${weekTasks.length}个任务
- 本周完成：${weekCompleted.length}个任务
${weekCompleted.length > 0 ? '\n本周完成的任务：\n' + weekCompleted.map(t => 
  `  • ${t.text}（完成于${new Date(t.completed_at).toLocaleDateString('zh-CN')}）`
).join('\n') : ''}

## 📈 本月数据（${monthStart.toLocaleDateString('zh-CN')} 至今）
- 本月创建：${monthTasks.length}个任务
- 本月完成：${monthCompleted.length}个任务

## 📋 所有任务详情
${tasks.map(t => {
  const logs = t.logs || []
  const progress = t.stats?.progress || 0
  return `
### ${t.text}
- 状态：${t.status === 'completed' ? '✅已完成' : t.status === 'pending' ? '⏳待办' : '⚠️已逾期'}
- 分类：${t.category === 'work' ? '💼工作' : t.category === 'study' ? '📚学习' : '🏠生活'}
- 优先级：${t.priority === 'high' ? '🔴高' : t.priority === 'medium' ? '🟡中' : '🔵低'}
- 创建时间：${new Date(t.created_at).toLocaleString('zh-CN')}
${t.completed_at ? `- 完成时间：${new Date(t.completed_at).toLocaleString('zh-CN')}` : ''}
${t.description ? `- 描述：${t.description}` : ''}
${t.completedPomodoros ? `- 已完成番茄钟：${t.completedPomodoros}个` : ''}
${logs.length > 0 ? `- 执行日志：${logs.length}条，进度${progress}%` : ''}
${logs.length > 0 ? logs.map(log => 
  `  [${log.type}] ${log.content}（${new Date(log.timestamp).toLocaleString('zh-CN')}）`
).join('\n') : ''}`
}).join('\n')}

## 🗑️ 回收站任务
${deletedTasks.length > 0 ? deletedTasks.map(t => 
  `- ${t.text}（${t.category}，删除前状态：${t.status}）`
).join('\n') : '无'}

---
你是一个任务管理AI助手，请基于以上数据回答用户的问题。
回答要求：
1. 准确引用数据中的信息
2. 提供有洞察力的分析
3. 给出实用的建议
4. 语言简洁友好`
}

const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value) return

  const question = userInput.value.trim()
  messages.value.push({ role: 'user', content: question })
  userInput.value = ''
  loading.value = true

  try {
    const context = buildContext()
    let response

    if (apiType.value === 'pangu') {
      response = await callPangu(context, question)
    } else if (apiType.value === 'openai') {
      response = await callOpenAI(context, question)
    } else {
      response = await callLocalModel(context, question)
    }

    messages.value.push({ role: 'assistant', content: response })
  } catch (error) {
    messages.value.push({ 
      role: 'error', 
      content: error.message 
    })
  } finally {
    loading.value = false
    nextTick(() => {
      messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
    })
  }
}

const callPangu = async (context, question) => {
  if (!panguUrl.value) throw new Error('请先配置盘古API地址')
  
  try {
    // 检测是否是Ollama格式（包含/api/generate）
    const isOllama = panguUrl.value.includes('/api/generate')
    
    if (isOllama) {
      // 使用Ollama格式
      const res = await fetch(panguUrl.value, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b',
          prompt: `${context}\n\n用户问题：${question}\n\n回答：`,
          stream: false
        })
      })
      
      if (!res.ok) throw new Error(`API错误 (${res.status}): ${res.statusText}`)
      const data = await res.json()
      return data.response || '无响应'
    } else {
      // 使用标准聊天格式
      const res = await fetch(panguUrl.value, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: question }
          ],
          stream: false
        })
      })

      if (!res.ok) throw new Error(`API错误 (${res.status}): ${res.statusText}`)
      const data = await res.json()
      return data.response || data.message || data.content || '无响应'
    }
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_FAILED')) {
      throw new Error(`无法连接到API (${panguUrl.value})，请检查：\n1. 代理服务是否运行: ./start-ollama-proxy.sh\n2. 公网隧道是否建立\n3. 地址是否正确`)
    }
    throw error
  }
}

const callOpenAI = async (context, question) => {
  if (!apiKey.value) throw new Error('请先配置 OpenAI API Key')
  
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.value}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: question }
        ]
      })
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(`OpenAI API错误 (${res.status}): ${error.error?.message || res.statusText}`)
    }
    const data = await res.json()
    return data.choices[0].message.content
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到OpenAI，请检查网络连接')
    }
    throw error
  }
}

const callLocalModel = async (context, question) => {
  try {
    const res = await fetch(`${localUrl.value}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma2:2b',
        prompt: `${context}\n\n用户问题：${question}\n\n回答：`,
        stream: false
      })
    })

    if (!res.ok) throw new Error(`本地模型错误 (${res.status}): ${res.statusText}`)
    const data = await res.json()
    return data.response
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
      throw new Error(`无法连接到本地模型 (${localUrl.value})，请检查：\n1. Ollama是否已安装并运行\n2. 运行命令: ollama serve\n3. 确认gemma2:2b模型已下载: ollama pull gemma2:2b`)
    }
    throw error
  }
}
</script>

<style scoped>
.ai-chat-overlay {
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

.ai-chat-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.ai-chat-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.ai-chat-settings {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.api-select, .api-input {
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
}

.api-select {
  width: 120px;
}

.api-input {
  flex: 1;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message.assistant .message-content {
  background: #f0f0f0;
  color: #333;
}

.message.error .message-content {
  background: #fee;
  color: #c33;
  border-left: 3px solid #c33;
}

.ai-chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.ai-chat-input textarea {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  font-size: 0.9rem;
}

.btn-send {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-questions {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.quick-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.quick-btn {
  display: inline-block;
  margin: 0.25rem;
  padding: 0.4rem 0.8rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 16px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-1px);
}
</style>
