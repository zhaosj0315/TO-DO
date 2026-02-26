<template>
  <div v-if="visible" class="ai-chat-overlay" @click.self="$emit('close')">
    <div class="ai-chat-container">
      <!-- 左侧历史记录 -->
      <div class="chat-sidebar" :class="{ 'sidebar-collapsed': !showSidebar }">
        <div class="sidebar-header">
          <button class="btn-new-chat" @click="createNewChat">
            ➕ 新对话
          </button>
        </div>
        <div class="sidebar-list">
          <div 
            v-for="chat in chatHistoryList" 
            :key="chat.id"
            :class="['chat-item', { active: chat.id === currentChatId }]"
            @click="switchChat(chat.id)"
          >
            <div class="chat-item-title">{{ chat.title }}</div>
            <div class="chat-item-time">{{ formatChatTime(chat.updatedAt) }}</div>
            <button class="btn-delete-chat" @click.stop="deleteChat(chat.id)" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧对话区域 -->
      <div class="chat-main">
        <div class="ai-chat-header">
          <button class="toggle-sidebar-btn" @click="showSidebar = !showSidebar">
            {{ showSidebar ? '◀' : '▶' }}
          </button>
          <button class="back-btn" @click="$emit('close')">
            <span>← 返回</span>
          </button>
          <h3>🤖 AI 任务助手</h3>
          <button class="clear-btn" @click="clearCurrentChat" title="清空当前对话">
            🗑️
          </button>
        </div>

        <div class="ai-chat-messages" ref="messagesContainer">
          <div v-for="(msg, idx) in messages" :key="idx" :class="['message', msg.role]">
            <div class="message-content">{{ msg.content }}</div>
            <div v-if="msg.role === 'assistant' && msg.modelName" class="message-meta">
              🤖 {{ msg.modelName }}
            </div>
          </div>
        <div v-if="loading" class="message assistant">
          <div class="message-content loading-message">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="loading-text">AI 正在思考...</span>
          </div>
        </div>
        
        <!-- 快捷问题 - 始终显示在底部 -->
        <div class="quick-questions">
          <div class="quick-label">💡 继续提问：</div>
          <div class="quick-categories-compact">
            <button @click="askQuick('今天完成了什么？')" class="quick-btn-small">📊 今日完成</button>
            <button @click="askQuick('本周情况如何？')" class="quick-btn-small">📅 本周情况</button>
            <button @click="askQuick('效率分析')" class="quick-btn-small">⚡ 效率分析</button>
            <button @click="askQuick('高优先级待办')" class="quick-btn-small">🎯 高优先级</button>
            <button @click="askQuick('即将逾期的任务')" class="quick-btn-small">⏰ 即将逾期</button>
            <button @click="askQuick('管理建议')" class="quick-btn-small">💡 管理建议</button>
          </div>
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
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  visible: Boolean,
  tasksData: Object
})

const emit = defineEmits(['close'])

// 从localStorage加载模型配置和历史记录
const models = ref(JSON.parse(localStorage.getItem('ai_models') || '[{"id":"default","name":"本地Ollama","url":"http://192.168.31.159:11434/api/generate","type":"local"}]'))
const selectedModelId = ref(localStorage.getItem('ai_default_model') || models.value[0]?.id)
const messages = ref([])
const userInput = ref('')
const loading = ref(false)
const messagesContainer = ref(null)

// 侧边栏状态
const showSidebar = ref(true)
const chatHistoryList = ref([])
const currentChatId = ref(null)

// 加载所有对话历史
const loadAllChats = () => {
  const chats = localStorage.getItem('ai_chat_list')
  if (chats) {
    try {
      chatHistoryList.value = JSON.parse(chats)
    } catch (e) {
      console.error('加载对话列表失败:', e)
      chatHistoryList.value = []
    }
  }
}

// 保存所有对话历史
const saveAllChats = () => {
  try {
    localStorage.setItem('ai_chat_list', JSON.stringify(chatHistoryList.value))
  } catch (e) {
    console.error('保存对话列表失败:', e)
  }
}

// 加载指定对话
const loadChat = (chatId) => {
  const chat = chatHistoryList.value.find(c => c.id === chatId)
  if (chat) {
    messages.value = chat.messages || []
    currentChatId.value = chatId
    nextTick(() => {
      messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
    })
  }
}

// 保存当前对话
const saveCurrentChat = () => {
  if (!currentChatId.value) return
  
  const chatIndex = chatHistoryList.value.findIndex(c => c.id === currentChatId.value)
  if (chatIndex !== -1) {
    chatHistoryList.value[chatIndex].messages = messages.value
    chatHistoryList.value[chatIndex].updatedAt = new Date().toISOString()
    
    // 更新标题（使用第一条用户消息）
    const firstUserMsg = messages.value.find(m => m.role === 'user')
    if (firstUserMsg) {
      chatHistoryList.value[chatIndex].title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
    }
    
    saveAllChats()
  }
}

// 创建新对话
const createNewChat = () => {
  const newChat = {
    id: Date.now(),
    title: '新对话',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  chatHistoryList.value.unshift(newChat)
  currentChatId.value = newChat.id
  messages.value = []
  showWelcomeMessage()
  saveAllChats()
}

// 切换对话
const switchChat = (chatId) => {
  if (currentChatId.value) {
    saveCurrentChat()
  }
  loadChat(chatId)
}

// 删除对话
const deleteChat = (chatId) => {
  if (confirm('确定要删除这个对话吗？')) {
    chatHistoryList.value = chatHistoryList.value.filter(c => c.id !== chatId)
    saveAllChats()
    
    if (currentChatId.value === chatId) {
      if (chatHistoryList.value.length > 0) {
        loadChat(chatHistoryList.value[0].id)
      } else {
        createNewChat()
      }
    }
  }
}

// 清空当前对话
const clearCurrentChat = () => {
  if (confirm('确定要清空当前对话吗？')) {
    messages.value = []
    showWelcomeMessage()
    saveCurrentChat()
  }
}

// 格式化时间
const formatChatTime = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// 旧的加载/保存方法（兼容）
const loadChatHistory = () => {
  const history = localStorage.getItem('ai_chat_history')
  if (history) {
    try {
      const parsed = JSON.parse(history)
      if (Array.isArray(parsed) && parsed.length > 0) {
        messages.value = parsed
        return true
      }
    } catch (e) {
      console.error('加载聊天历史失败:', e)
    }
  }
  return false
}

// 保存聊天记录（更新为保存当前对话）
const saveChatHistory = () => {
  saveCurrentChat()
}

// 清空聊天记录
const clearChatHistory = () => {
  if (confirm('确定要清空所有聊天记录吗？')) {
    messages.value = []
    localStorage.removeItem('ai_chat_history')
    // 重新显示欢迎消息
    showWelcomeMessage()
  }
}

// 显示欢迎消息
const showWelcomeMessage = () => {
  const modelName = currentModel.value?.name || '默认模型'
  messages.value = [{
    role: 'assistant',
    content: `你好！我是你的AI任务助手 🤖\n\n当前使用模型：${modelName}\n\n我已经读取了你的所有任务数据，包括：\n• 任务详情（标题、描述、状态）\n• 执行日志和进度\n• 番茄钟记录\n• 时间统计\n\n你可以问我任何关于任务的问题，比如：\n"今天完成了什么？"\n"本周效率如何？"\n"有哪些逾期任务？"\n\n💡 点击右上角⚙️可以更换模型`
  }]
  saveChatHistory()
}

// 监听配置变化
watch(selectedModelId, (val) => {
  localStorage.setItem('ai_default_model', val)
})

const currentModel = computed(() => {
  return models.value.find(m => m.id === selectedModelId.value) || models.value[0]
})

watch(() => props.visible, (val) => {
  if (val) {
    // 加载所有对话列表
    loadAllChats()
    
    // 如果有对话列表，加载最近的对话
    if (chatHistoryList.value.length > 0) {
      loadChat(chatHistoryList.value[0].id)
    } else {
      // 没有对话，创建新对话
      createNewChat()
    }
    
    // 滚动到底部
    nextTick(() => {
      messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
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

  // 保存用户消息
  saveChatHistory()

  // 创建一个空的助手消息用于流式更新
  const assistantMsgIndex = messages.value.length
  messages.value.push({ 
    role: 'assistant', 
    content: '',
    modelName: currentModel.value?.name
  })

  try {
    const context = buildContext()
    const model = currentModel.value

    if (model.type === 'openai') {
      await callOpenAIStream(context, question, model, assistantMsgIndex)
    } else {
      await callOllamaStream(context, question, model, assistantMsgIndex)
    }
    
    // 保存 AI 回复
    saveChatHistory()
  } catch (error) {
    messages.value[assistantMsgIndex] = { 
      role: 'error', 
      content: error.message 
    }
    saveChatHistory()
  } finally {
    loading.value = false
    nextTick(() => {
      messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
    })
  }
}

// Ollama 流式调用
const callOllamaStream = async (context, question, model, msgIndex) => {
  try {
    const res = await fetch(model.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.modelName || 'gemma2:2b',
        prompt: `${context}\n\n用户问题：${question}\n\n回答：`,
        stream: true
      })
    })

    if (!res.ok) {
      if (res.status === 403 && model.url.includes('ngrok')) {
        throw new Error(`Ngrok访问被拒绝\n\n请先在浏览器中访问：\n${model.url.split('/api')[0]}\n\n点击"Visit Site"后再试`)
      }
      throw new Error(`API错误 (${res.status})`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            if (data.response) {
              messages.value[msgIndex].content += data.response
              // 自动滚动到底部
              nextTick(() => {
                messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
              })
            }
          } catch (e) {
            console.warn('解析流式数据失败:', line)
          }
        }
      }
    }
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`无法连接到 ${model.name}\n请检查：\n1. 模型服务是否运行\n2. 地址是否正确\n3. 网络是否通畅`)
    }
    throw error
  }
}

// OpenAI 流式调用
const callOpenAIStream = async (context, question, model, msgIndex) => {
  if (!model.apiKey) throw new Error('请在配置中填写API Key')
  
  try {
    let apiUrl = model.url
    if (!apiUrl.includes('/chat/completions')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions'
    }
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.modelName || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: question }
        ],
        stream: true
      })
    })

    if (!res.ok) throw new Error(`OpenAI错误 (${res.status})`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) {
              messages.value[msgIndex].content += content
              nextTick(() => {
                messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
              })
            }
          } catch (e) {
            console.warn('解析流式数据失败:', line)
          }
        }
      }
    }
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到OpenAI，请检查网络')
    }
    throw error
  }
}

// 保留非流式版本作为降级方案
const callOllama = async (context, question, model) => {
  try {
    const res = await fetch(model.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.modelName || 'gemma2:2b',
        prompt: `${context}\n\n用户问题：${question}\n\n回答：`,
        stream: false
      })
    })

    if (!res.ok) {
      if (res.status === 403 && model.url.includes('ngrok')) {
        throw new Error(`Ngrok访问被拒绝\n\n请先在浏览器中访问：\n${model.url.split('/api')[0]}\n\n点击"Visit Site"后再试`)
      }
      throw new Error(`API错误 (${res.status})`)
    }
    const data = await res.json()
    return data.response || '无响应'
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`无法连接到 ${model.name}\n请检查：\n1. 模型服务是否运行\n2. 地址是否正确\n3. 网络是否通畅`)
    }
    throw error
  }
}

const callOpenAI = async (context, question, model) => {
  if (!model.apiKey) throw new Error('请在配置中填写API Key')
  
  try {
    let apiUrl = model.url
    if (!apiUrl.includes('/chat/completions')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions'
    }
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.modelName || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: question }
        ]
      })
    })

    if (!res.ok) throw new Error(`OpenAI错误 (${res.status})`)
    const data = await res.json()
    return data.choices[0].message.content
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到OpenAI，请检查网络')
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
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
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

.ai-chat-container {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  margin: 0;
  max-height: 92vh;
  display: flex;
  flex-direction: row;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

/* 左侧历史记录 */
.chat-sidebar {
  width: 260px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.chat-sidebar.sidebar-collapsed {
  width: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.btn-new-chat {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-new-chat:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.chat-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 2px solid transparent;
}

.chat-item:hover {
  background: #f0f0f0;
}

.chat-item.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.chat-item-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 24px;
}

.chat-item-time {
  font-size: 0.75rem;
  color: #999;
}

.btn-delete-chat {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-item:hover .btn-delete-chat {
  opacity: 1;
}

.btn-delete-chat:hover {
  transform: scale(1.1);
}

/* 右侧对话区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toggle-sidebar-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

.ai-chat-header::before {
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

.ai-chat-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
}

.back-btn,
.clear-btn {
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

.clear-btn {
  width: 44px;
  padding: 0;
  font-size: 1.2rem;
}

.back-btn:hover,
.clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.api-input {
  flex: 1;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.8rem;
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

.message-meta {
  font-size: 0.7rem;
  color: #999;
  margin-top: 0.25rem;
  text-align: right;
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
  padding: 0.8rem;
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
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-top: 1px solid #e0e0e0;
}

.quick-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
}

.quick-categories-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-btn-small {
  padding: 0.4rem 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
  white-space: nowrap;
}

.quick-btn-small:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 保留旧样式以防其他地方使用 */
.quick-categories {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category {
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.category-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.quick-btn {
  display: inline-block;
  margin: 0.25rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1.5px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.quick-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 加载动画 */
.loading-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.loading-text {
  font-size: 0.85rem;
  color: #666;
}
</style>
