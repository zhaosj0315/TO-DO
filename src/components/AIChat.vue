<template>
  <div v-if="visible" class="ai-chat-overlay" @click.self="$emit('close')">
    <div class="ai-chat-container">
      <!-- 左侧历史记录 -->
      <div class="chat-sidebar" :class="{ 'sidebar-collapsed': !showSidebar }">
        <div class="sidebar-header">
          <div class="sidebar-header-top">
            <button class="btn-new-chat" @click="createNewChat">
              <span class="btn-icon">➕</span>
              <span class="btn-text">新对话</span>
            </button>
          </div>
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text"
              placeholder="🔍 搜索对话..."
              @input="handleSearch"
            />
          </div>
        </div>
        <div class="sidebar-list">
          <template v-for="(group, groupName) in filteredGroupedChats" :key="groupName">
            <div class="chat-group-title" @click="toggleGroup(groupName)">
              <span>{{ expandedGroups.has(groupName) ? '▼' : '▶' }}</span>
              {{ groupName }}
              <span class="group-count">({{ group.length }})</span>
            </div>
            <template v-if="expandedGroups.has(groupName)">
              <div 
                v-for="chat in group" 
                :key="chat.id"
                :class="['chat-item', { active: chat.id === currentChatId }]"
                @click="switchChat(chat.id)"
              >
                <div class="chat-item-content">
                  <div class="chat-item-title" v-html="highlightText(chat.title)"></div>
                  <div class="chat-item-time">{{ formatChatTime(chat.updatedAt) }}</div>
                </div>
                <button class="btn-delete-chat" @click.stop="deleteChat(chat.id)" title="删除">
                  🗑️
                </button>
              </div>
            </template>
          </template>
          <div v-if="Object.keys(filteredGroupedChats).length === 0" class="no-results">
            😕 未找到匹配的对话
          </div>
        </div>
      </div>

      <!-- 右侧对话区域 -->
      <div class="chat-main">
        <div class="ai-chat-header">
          <button class="toggle-sidebar-btn-main" @click="showSidebar = !showSidebar" :title="showSidebar ? '收起历史记录' : '展开历史记录'">
            {{ showSidebar ? '◀' : '▶' }}
          </button>
          <h3>🤖 AI 任务助手</h3>
          <button class="clear-btn" @click="clearCurrentChat" title="清空当前对话">
            🗑️
          </button>
        </div>

        <div class="ai-chat-messages" ref="messagesContainer">
          <div v-for="(msg, idx) in messages" :key="idx" :class="['message', msg.role]">
            <div 
              class="message-content" 
              v-html="msg.role === 'assistant' ? renderMarkdown(msg.content) : escapeHtml(msg.content)"
            ></div>
            <div v-if="msg.role === 'assistant'" class="message-meta">
              <div class="meta-left">
                <button class="action-btn" @click="copyMessage(msg.content)" title="复制">
                  📋
                </button>
                <button class="action-btn" @click="regenerateMessage(idx)" title="重新生成">
                  🔄
                </button>
                <span v-if="msg.modelName" class="model-name" :title="msg.modelDisplayName">
                  🤖 {{ msg.modelName }}
                </span>
              </div>
              <div class="meta-right">
                <span v-if="msg.timestamp" class="timestamp">🕐 {{ formatTimestamp(msg.timestamp) }}</span>
                <span v-if="msg.tokens && msg.tokens.total > 0" class="tokens">
                  💬 {{ msg.tokens.input }}↑ / {{ msg.tokens.output }}↓
                </span>
              </div>
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
          <div class="quick-label">💡 快捷操作：</div>
          <div class="quick-grid">
            <button @click="generateDailyPlan" class="quick-btn">
              <span class="btn-icon">📅</span>
              <span class="btn-text">今日规划</span>
            </button>
            <button @click="askQuick('今天完成了什么？')" class="quick-btn">
              <span class="btn-icon">✅</span>
              <span class="btn-text">今日完成</span>
            </button>
            <button @click="askQuick('本周情况如何？')" class="quick-btn">
              <span class="btn-icon">📊</span>
              <span class="btn-text">本周情况</span>
            </button>
            <button @click="askQuick('分析我的效率')" class="quick-btn">
              <span class="btn-icon">📈</span>
              <span class="btn-text">效率分析</span>
            </button>
            <button @click="askQuick('有哪些高优先级待办？')" class="quick-btn">
              <span class="btn-icon">⚡</span>
              <span class="btn-text">重要待办</span>
            </button>
            <button @click="askQuick('哪些任务即将逾期？')" class="quick-btn">
              <span class="btn-icon">⏰</span>
              <span class="btn-text">逾期预警</span>
            </button>
            <button @click="askQuick('给我一些任务管理建议')" class="quick-btn">
              <span class="btn-icon">💡</span>
              <span class="btn-text">优化建议</span>
            </button>
            <button @click="askQuick('本月完成了多少任务？')" class="quick-btn">
              <span class="btn-icon">📆</span>
              <span class="btn-text">本月统计</span>
            </button>
            <button @click="askQuick('最近有什么阻碍？')" class="quick-btn">
              <span class="btn-icon">🚧</span>
              <span class="btn-text">阻碍分析</span>
            </button>
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
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { AIChatService } from '../services/aiChatService'
import { AIDailyPlanner } from '../services/aiDailyPlanner'

// 配置 marked 支持 GFM 表格
marked.setOptions({
  gfm: true,
  breaks: true,
  tables: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
})

const props = defineProps({
  visible: Boolean,
  tasksData: Object
})

const emit = defineEmits(['close', 'createTasks'])

// 创建任务相关状态
const extractedTasks = ref([])
const isExtracting = ref(false)

// 从localStorage加载模型配置和历史记录
const loadModelsFromStorage = () => {
  try {
    const stored = localStorage.getItem('ai_models')
    const parsed = stored ? JSON.parse(stored) : []
    // 如果解析结果是空数组，返回默认配置
    return parsed.length > 0 ? parsed : [{
      id: 'default',
      name: '本地Ollama',
      url: 'http://localhost:11434/api/generate',
      type: 'local',
      modelName: 'gemma2:2b'
    }]
  } catch (e) {
    console.error('加载模型配置失败:', e)
    return [{
      id: 'default',
      name: '本地Ollama',
      url: 'http://localhost:11434/api/generate',
      type: 'local',
      modelName: 'gemma2:2b'
    }]
  }
}

const models = ref(loadModelsFromStorage())
const selectedModelId = ref(localStorage.getItem('ai_default_model') || models.value[0]?.id)
const messages = ref([])
const userInput = ref('')
const loading = ref(false)
const messagesContainer = ref(null)

// 侧边栏状态
const showSidebar = ref(false) // 默认收起历史记录侧边栏
const chatHistoryList = ref([])
const currentChatId = ref(null)
const searchQuery = ref('')

// 分组展开状态（默认全部收起）
const expandedGroups = ref(new Set())

// 切换分组展开/收起
const toggleGroup = (groupName) => {
  if (expandedGroups.value.has(groupName)) {
    expandedGroups.value.delete(groupName)
  } else {
    expandedGroups.value.add(groupName)
  }
}

// 搜索处理（防抖）
let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // 搜索逻辑在 computed 中处理
  }, 300)
}

// 高亮搜索关键词
const highlightText = (text) => {
  if (!searchQuery.value.trim()) return text
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Markdown 渲染函数
const renderMarkdown = (content) => {
  try {
    // 直接使用 marked 渲染，不做额外处理
    return marked.parse(content)
  } catch (e) {
    console.error('Markdown 渲染失败:', e)
    return escapeHtml(content)
  }
}

// 复制消息内容
const copyMessage = (content) => {
  navigator.clipboard.writeText(content).then(() => {
    alert('✓ 已复制到剪贴板')
  }).catch(err => {
    console.error('复制失败:', err)
  })
}

// 重新生成回复
const regenerateMessage = async (msgIndex) => {
  if (loading.value) return
  
  // 找到对应的用户消息
  let userMsgIndex = msgIndex - 1
  while (userMsgIndex >= 0 && messages.value[userMsgIndex].role !== 'user') {
    userMsgIndex--
  }
  
  if (userMsgIndex < 0) {
    alert('无法找到对应的用户消息')
    return
  }
  
  const userQuestion = messages.value[userMsgIndex].content
  
  // 删除当前AI回复
  messages.value.splice(msgIndex, 1)
  
  // 重新发送
  loading.value = true
  
  try {
    // 创建新的助手消息
    const assistantMsgIndex = messages.value.length
    messages.value.push({ 
      role: 'assistant', 
      content: '',
      modelName: currentModel.value?.modelName || currentModel.value?.name,
      modelDisplayName: currentModel.value?.name,
      timestamp: new Date().toISOString(),
      tokens: { input: 0, output: 0, total: 0 }
    })
    
    // 调用AI
    const analysis = analyzeQuestion(userQuestion)
    const context = analysis.isSimple ? buildSmartContext(userQuestion) : buildContext()
    const model = currentModel.value
    
    if (model.type === 'openai') {
      await callOpenAIStream(context, userQuestion, model, assistantMsgIndex)
    } else {
      await callOllamaStream(context, userQuestion, model, assistantMsgIndex)
    }
    
    saveCurrentChat()
    scrollToBottom()
  } catch (error) {
    console.error('重新生成失败:', error)
    messages.value.push({ 
      role: 'error', 
      content: `重新生成失败：${error.message}` 
    })
  } finally {
    loading.value = false
  }
}

// 格式化时间戳
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// HTML 转义函数（用户消息）
const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML.replace(/\n/g, '<br>')
}

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

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
  })
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
  
  if (days === 0) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// 分组聊天记录
const groupedChats = computed(() => {
  const groups = {
    '今天': [],
    '昨天': [],
    '最近7天': [],
    '更早': []
  }
  
  const now = new Date()
  chatHistoryList.value.forEach(chat => {
    const date = new Date(chat.updatedAt)
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) groups['今天'].push(chat)
    else if (days === 1) groups['昨天'].push(chat)
    else if (days < 7) groups['最近7天'].push(chat)
    else groups['更早'].push(chat)
  })
  
  // 只返回非空分组
  return Object.fromEntries(
    Object.entries(groups).filter(([_, chats]) => chats.length > 0)
  )
})

// 过滤后的分组聊天记录（支持搜索）
const filteredGroupedChats = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return groupedChats.value
  
  const groups = {
    '今天': [],
    '昨天': [],
    '最近7天': [],
    '更早': []
  }
  
  const now = new Date()
  chatHistoryList.value.forEach(chat => {
    // 搜索标题和消息内容
    const titleMatch = chat.title.toLowerCase().includes(query)
    const messageMatch = chat.messages.some(msg => 
      msg.content.toLowerCase().includes(query)
    )
    
    if (titleMatch || messageMatch) {
      const date = new Date(chat.updatedAt)
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) groups['今天'].push(chat)
      else if (days === 1) groups['昨天'].push(chat)
      else if (days < 7) groups['最近7天'].push(chat)
      else groups['更早'].push(chat)
    }
  })
  
  // 只返回非空分组
  return Object.fromEntries(
    Object.entries(groups).filter(([_, chats]) => chats.length > 0)
  )
})

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
    content: `你好！我是你的AI任务助手 🤖\n\n当前使用模型：${modelName}\n\n**我可以帮你：**\n\n📊 **查询任务** - "今天完成了什么？"\n✨ **创建任务** - "明天上午开会，下午写报告"\n🧩 **分解任务** - "分解任务：开发用户管理模块"\n🌅 **今日规划** - "生成今日规划"\n📝 **今日总结** - "今日总结"\n\n💡 点击右上角⚙️可以更换模型`
  }]
  saveChatHistory()
}

// 监听配置变化
watch(selectedModelId, (val) => {
  localStorage.setItem('ai_default_model', val)
})

const currentModel = computed(() => {
  const model = models.value.find(m => m.id === selectedModelId.value) || models.value[0]
  // 如果没有配置任何模型，返回默认模型
  if (!model) {
    return {
      id: 'default',
      name: '默认模型',
      url: 'http://localhost:11434/api/generate',
      type: 'local',
      modelName: 'gemma2:2b'
    }
  }
  return model
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

// 生成今日规划
const generateDailyPlan = async () => {
  if (loading.value) return
  
  loading.value = true
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: '📅 生成今日规划'
  })
  
  try {
    // 获取待办任务（只要pending状态）
    const { tasks = [] } = props.tasksData
    const pendingTasks = tasks.filter(t => t.status === 'pending')
    
    if (pendingTasks.length === 0) {
      messages.value.push({
        role: 'assistant',
        content: '## 📅 今日规划\n\n今天没有待办任务，好好休息吧！🎉',
        modelName: currentModel.value.modelName || currentModel.value.name,
        modelDisplayName: currentModel.value.name,
        timestamp: new Date().toISOString()
      })
      loading.value = false
      saveCurrentChat()
      scrollToBottom()
      return
    }
    
    // 为任务添加截止时间信息（复用原有逻辑）
    const tasksWithDeadline = pendingTasks.map(task => ({
      ...task,
      deadline: task.customDate && task.customTime 
        ? `${task.customDate} ${task.customTime}` 
        : task.deadline || '未设置'
    }))
    
    // 调用今日规划API（传入所有pending任务，让AI决定优先级）
    const plan = await AIDailyPlanner.generateDailyPlan(tasksWithDeadline)
    
    // 格式化为Markdown
    let markdown = '## 📅 今日规划\n\n'
    markdown += `### 💡 AI 建议\n${plan.summary}\n\n`
    
    if (plan.schedule && plan.schedule.length > 0) {
      markdown += `### 📋 执行计划（共 ${plan.schedule.length} 项）\n\n`
      markdown += '| 时间 | 任务 | 安排理由 |\n'
      markdown += '|------|------|----------|\n'
      plan.schedule.forEach(item => {
        markdown += `| ${item.time} | ${item.task} | ${item.reason} |\n`
      })
      markdown += '\n'
    }
    
    // 只显示今天和明天需要完成的任务
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    
    const urgentTasks = tasksWithDeadline.filter(task => {
      if (!task.customDate) return false
      const taskDate = new Date(task.customDate)
      return taskDate <= tomorrow
    })
    
    if (urgentTasks.length > 0) {
      markdown += `### 📌 今明两天任务（共 ${urgentTasks.length} 个）\n\n`
      urgentTasks.slice(0, 15).forEach((task, index) => {
        const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🔵'
        markdown += `${index + 1}. ${priorityIcon} **${task.text}**`
        if (task.description) {
          markdown += ` - ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}`
        }
        markdown += `\n   ⏰ ${task.customDate} ${task.customTime || ''}\n`
      })
      if (urgentTasks.length > 15) {
        markdown += `\n*还有 ${urgentTasks.length - 15} 个任务未显示*\n`
      }
    }
    
    markdown += `\n---\n💡 *共有 ${tasksWithDeadline.length} 个待办任务，AI已为你优先安排今明两天的重要事项*`
    
    messages.value.push({
      role: 'assistant',
      content: markdown,
      modelName: currentModel.value.modelName || currentModel.value.name,
      modelDisplayName: currentModel.value.name,
      timestamp: new Date().toISOString()
    })
    
    saveCurrentChat()
    scrollToBottom()
  } catch (error) {
    console.error('生成今日规划失败:', error)
    messages.value.push({
      role: 'assistant',
      content: `❌ 生成今日规划失败：${error.message}\n\n请检查AI模型配置是否正确。`,
      modelName: currentModel.value.modelName || currentModel.value.name,
      modelDisplayName: currentModel.value.name,
      timestamp: new Date().toISOString()
    })
  } finally {
    loading.value = false
  }
}

// 智能上下文分析
const analyzeQuestion = (question) => {
  const q = question.toLowerCase()
  
  // 时间维度检测
  const isToday = /今天|今日|当天/.test(q)
  const isWeek = /本周|这周|这星期|week/.test(q)
  const isMonth = /本月|这月|这个月|month/.test(q)
  
  // 状态检测
  const needCompleted = /完成|已完成|做完|finished|completed/.test(q)
  const needPending = /待办|未完成|进行中|pending|todo/.test(q)
  const needOverdue = /逾期|过期|超时|overdue/.test(q)
  
  // 分类检测
  const needWork = /工作|work|job/.test(q)
  const needStudy = /学习|study|learn/.test(q)
  const needLife = /生活|life|daily/.test(q)
  
  // 优先级检测
  const needHigh = /高优先级|重要|紧急|high/.test(q)
  const needMedium = /中优先级|一般|medium/.test(q)
  const needLow = /低优先级|不急|low/.test(q)
  
  // 特殊功能检测
  const needLogs = /日志|记录|执行|log|progress/.test(q)
  const needPomodoro = /番茄|专注|pomodoro/.test(q)
  const needStats = /统计|数据|分析|stat|report/.test(q)
  
  return {
    timeScope: isToday ? 'today' : isWeek ? 'week' : isMonth ? 'month' : 'all',
    status: needCompleted ? 'completed' : needPending ? 'pending' : needOverdue ? 'overdue' : null,
    category: needWork ? 'work' : needStudy ? 'study' : needLife ? 'life' : null,
    priority: needHigh ? 'high' : needMedium ? 'medium' : needLow ? 'low' : null,
    needLogs,
    needPomodoro,
    needStats,
    isSimple: isToday || isWeek || needCompleted || needPending // 简单查询
  }
}

// 智能构建上下文
const buildSmartContext = (question) => {
  const analysis = analyzeQuestion(question)
  const { tasks = [], deletedTasks = [] } = props.tasksData
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // 根据时间范围过滤
  let filteredTasks = tasks
  if (analysis.timeScope === 'today') {
    filteredTasks = tasks.filter(t => {
      const date = new Date(t.completed_at || t.created_at)
      return date >= today
    })
  } else if (analysis.timeScope === 'week') {
    filteredTasks = tasks.filter(t => {
      const date = new Date(t.completed_at || t.created_at)
      return date >= weekStart
    })
  } else if (analysis.timeScope === 'month') {
    filteredTasks = tasks.filter(t => {
      const date = new Date(t.completed_at || t.created_at)
      return date >= monthStart
    })
  }

  // 根据状态过滤
  if (analysis.status) {
    filteredTasks = filteredTasks.filter(t => t.status === analysis.status)
  }

  // 根据分类过滤
  if (analysis.category) {
    filteredTasks = filteredTasks.filter(t => t.category === analysis.category)
  }

  // 根据优先级过滤
  if (analysis.priority) {
    filteredTasks = filteredTasks.filter(t => t.priority === analysis.priority)
  }

  // 构建精简上下文
  const timeLabel = analysis.timeScope === 'today' ? '今日' : 
                    analysis.timeScope === 'week' ? '本周' : 
                    analysis.timeScope === 'month' ? '本月' : '全部'

  let context = `# ${timeLabel}任务数据（${now.toLocaleString('zh-CN')}）\n\n`
  context += `## 📊 统计\n`
  context += `- 任务数：${filteredTasks.length}\n`
  context += `- 已完成：${filteredTasks.filter(t => t.status === 'completed').length}\n`
  context += `- 待办中：${filteredTasks.filter(t => t.status === 'pending').length}\n`
  context += `- 已逾期：${filteredTasks.filter(t => t.status === 'overdue').length}\n\n`

  // 如果需要统计信息
  if (analysis.needStats || analysis.needPomodoro) {
    const totalPomodoros = filteredTasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)
    context += `- 番茄钟：${totalPomodoros}个\n`
  }

  if (analysis.needStats || analysis.needLogs) {
    const totalLogs = filteredTasks.reduce((sum, t) => sum + (t.logs?.length || 0), 0)
    context += `- 执行日志：${totalLogs}条\n`
  }

  context += `\n## 📋 任务列表\n`
  
  // 只包含必要的任务详情
  filteredTasks.forEach(t => {
    context += `\n### ${t.text}\n`
    context += `- 状态：${t.status === 'completed' ? '✅' : t.status === 'pending' ? '⏳' : '⚠️'}\n`
    context += `- 分类：${t.category} | 优先级：${t.priority}\n`
    
    if (t.description) {
      context += `- 描述：${t.description.slice(0, 100)}${t.description.length > 100 ? '...' : ''}\n`
    }
    
    if (analysis.needLogs && t.logs?.length > 0) {
      context += `- 日志：${t.logs.length}条，进度${t.stats?.progress || 0}%\n`
      t.logs.slice(-3).forEach(log => {
        context += `  [${log.type}] ${log.content.slice(0, 50)}\n`
      })
    }
    
    if (analysis.needPomodoro && t.completedPomodoros) {
      context += `- 番茄钟：${t.completedPomodoros}个\n`
    }
  })

  context += `\n---\n你是任务管理AI助手，基于以上数据回答问题。`
  
  return context
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

  try {
    // 智能意图识别
    const intent = detectIntent(question)
    
    if (intent === 'create_task') {
      // 创建任务意图
      await handleTaskCreation(question)
    } else if (intent === 'daily_plan') {
      // 今日规划意图
      await handleDailyPlan()
    } else if (intent === 'split_task') {
      // 任务分解意图
      await handleTaskSplit(question)
    } else if (intent === 'daily_summary') {
      // 每日总结意图
      await handleDailySummary()
    } else {
      // 普通问答意图
      await handleNormalChat(question)
    }
    
    // 保存 AI 回复
    saveChatHistory()
  } catch (error) {
    console.error('❌ AI问答错误:', error)
    messages.value.push({ 
      role: 'error', 
      content: error.message 
    })
    saveChatHistory()
  } finally {
    loading.value = false
    nextTick(() => {
      messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
    })
  }
}

// 意图识别
const detectIntent = (text) => {
  const createKeywords = [
    '创建任务', '添加任务', '新建任务', '帮我创建', '帮我添加',
    '明天要', '今天要', '本周要', '需要完成', '要做',
    '开会', '写报告', '复习', '学习', '工作'
  ]
  
  const planKeywords = [
    '今日规划', '今天规划', '每日规划', '生成规划',
    '安排今天', '今天怎么安排', '今日计划', '今天计划'
  ]
  
  const splitKeywords = [
    '分解任务', '拆解任务', '任务分解', '任务拆解',
    '帮我分解', '帮我拆解', '细化任务', '拆分任务'
  ]
  
  const summaryKeywords = [
    '今日总结', '今天总结', '每日总结', '工作总结',
    '今日汇报', '今天汇报', '总结今天', '今日复盘'
  ]
  
  const lowerText = text.toLowerCase()
  
  // 检测每日总结意图
  const hasSummaryKeyword = summaryKeywords.some(keyword => 
    lowerText.includes(keyword)
  )
  
  if (hasSummaryKeyword) {
    return 'daily_summary'
  }
  
  // 检测任务分解意图
  const hasSplitKeyword = splitKeywords.some(keyword => 
    lowerText.includes(keyword)
  )
  
  if (hasSplitKeyword) {
    return 'split_task'
  }
  
  // 检测规划意图
  const hasPlanKeyword = planKeywords.some(keyword => 
    lowerText.includes(keyword)
  )
  
  if (hasPlanKeyword) {
    return 'daily_plan'
  }
  
  // 检测是否包含多个任务描述（逗号、顿号、分号分隔）
  const hasMultipleTasks = /[，,、；;]/.test(text) && text.length > 20
  
  // 检测是否包含创建任务关键词
  const hasCreateKeyword = createKeywords.some(keyword => 
    lowerText.includes(keyword)
  )
  
  if (hasCreateKeyword || hasMultipleTasks) {
    return 'create_task'
  }
  
  return 'chat'
}

// 处理任务创建
const handleTaskCreation = async (text) => {
  isExtracting.value = true
  
  // 添加提示消息
  const assistantMsgIndex = messages.value.length
  messages.value.push({ 
    role: 'assistant', 
    content: '🤖 正在分析并提取任务...',
    modelName: currentModel.value?.modelName || currentModel.value?.name,
    modelDisplayName: currentModel.value?.name,
    timestamp: new Date().toISOString()
  })
  
  try {
    // 使用智能解析器（快速、离线）
    const { SmartTaskParser } = await import('../services/smartTaskParser')
    const parsed = SmartTaskParser.parse(text)
    const tasks = parsed.tasks.map(t => ({
      text: t.title,
      description: t.description,
      type: t.type,
      customDate: t.customDate,
      customTime: t.customTime,
      priority: t.priority,
      category: t.category
    }))
    
    if (tasks.length === 0) {
      messages.value[assistantMsgIndex].content = '❌ 未识别到任务，请尝试更明确的描述。\n\n例如："明天上午开会，下午写报告"'
    } else {
      // 显示提取结果
      let resultText = `✨ 已提取 ${tasks.length} 个任务：\n\n`
      tasks.forEach((task, index) => {
        resultText += `${index + 1}. **${task.text}**\n`
        resultText += `   - 分类：${getCategoryLabel(task.category)}\n`
        resultText += `   - 优先级：${getPriorityLabel(task.priority)}\n`
        if (task.customDate) resultText += `   - 日期：${task.customDate}\n`
        if (task.customTime) resultText += `   - 时间：${task.customTime}\n`
        resultText += '\n'
      })
      resultText += '💡 正在打开任务预览...'
      
      messages.value[assistantMsgIndex].content = resultText
      
      // 直接触发创建任务弹窗
      emit('createTasks', tasks)
    }
  } catch (error) {
    messages.value[assistantMsgIndex].content = `❌ 提取失败：${error.message}`
  } finally {
    isExtracting.value = false
  }
}

// 处理每日总结
const handleDailySummary = async () => {
  const assistantMsgIndex = messages.value.length
  messages.value.push({ 
    role: 'assistant', 
    content: '📊 正在生成今日总结...',
    modelName: currentModel.value?.name
  })
  
  try {
    const { tasks = [] } = props.tasksData
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 今日完成的任务
    const completedToday = tasks.filter(task => {
      if (task.status !== 'completed' || !task.completed_at) return false
      const completedDate = new Date(task.completed_at)
      completedDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === today.getTime()
    })
    
    // 今日逾期的任务
    const overdueToday = tasks.filter(task => task.status === 'overdue')
    
    // 今日专注时长（番茄钟）
    const todayPomodoros = completedToday.reduce((sum, task) => 
      sum + (task.completedPomodoros || 0), 0
    )
    
    // 完成率
    const totalToday = tasks.filter(task => {
      const created = new Date(task.created_at)
      created.setHours(0, 0, 0, 0)
      return created.getTime() === today.getTime()
    }).length
    
    const completionRate = totalToday > 0 
      ? Math.round((completedToday.length / totalToday) * 100) 
      : 0
    
    // 格式化总结
    let resultText = `📊 **今日工作总结**\n\n`
    resultText += `📈 **核心数据**\n`
    resultText += `• 完成任务：${completedToday.length} 个\n`
    resultText += `• 逾期任务：${overdueToday.length} 个\n`
    resultText += `• 专注时长：${todayPomodoros * 25} 分钟 (${todayPomodoros}🍅)\n`
    resultText += `• 完成率：${completionRate}%\n\n`
    
    if (completedToday.length > 0) {
      resultText += `✅ **今日完成**\n`
      completedToday.forEach((task, i) => {
        resultText += `${i + 1}. ${task.text} (${task.priority === 'high' ? '⚡高' : task.priority === 'medium' ? '📌中' : '📋低'})\n`
      })
      resultText += `\n`
    }
    
    // AI 建议
    resultText += `💡 **AI 建议**\n`
    if (completedToday.length === 0) {
      resultText += `今天还没有完成任何任务，建议从高优先级任务开始！`
    } else if (completionRate >= 80) {
      resultText += `完成率很高！保持这个节奏，继续加油！`
    } else if (overdueToday.length > 0) {
      resultText += `有 ${overdueToday.length} 个任务逾期，建议优先处理逾期任务。`
    } else {
      resultText += `今天表现不错，明天继续努力！`
    }
    
    messages.value[assistantMsgIndex].content = resultText
  } catch (error) {
    messages.value[assistantMsgIndex].content = `❌ 生成总结失败：${error.message}`
  }
}

// 处理任务分解
const handleTaskSplit = async (text) => {
  const assistantMsgIndex = messages.value.length
  messages.value.push({ 
    role: 'assistant', 
    content: '🧩 正在分解任务...',
    modelName: currentModel.value?.name
  })
  
  try {
    // 提取任务标题（去掉"分解任务"等关键词）
    let taskTitle = text
      .replace(/分解任务|拆解任务|任务分解|任务拆解|帮我分解|帮我拆解|细化任务|拆分任务/g, '')
      .replace(/[:：]/g, '')
      .trim()
    
    if (!taskTitle) {
      messages.value[assistantMsgIndex].content = '❌ 请提供要分解的任务标题\n\n例如："分解任务：开发用户管理模块"'
      return
    }
    
    // 动态导入 AITaskSplitter
    const { AITaskSplitter } = await import('../services/aiTaskSplitter')
    
    // 调用 AI 分解任务
    const subtasks = await AITaskSplitter.splitTask({
      text: taskTitle,
      description: '',
      category: 'work',
      priority: 'medium'
    }, 5) // 默认分解为 5 个子任务
    
    if (!subtasks || subtasks.length === 0) {
      messages.value[assistantMsgIndex].content = '❌ 任务分解失败，请重试'
      return
    }
    
    // 格式化分解结果
    let resultText = `🧩 **任务分解结果**\n\n`
    resultText += `📋 **主任务**: ${taskTitle}\n\n`
    resultText += `✨ **已分解为 ${subtasks.length} 个子任务**：\n\n`
    
    subtasks.forEach((subtask, index) => {
      resultText += `**${index + 1}. ${subtask.title}**\n`
      if (subtask.description) {
        resultText += `   ${subtask.description}\n`
      }
      resultText += `   ⏱️ 预计 ${subtask.estimatedTime || '1'}小时 | `
      resultText += `${subtask.priority === 'high' ? '⚡高' : subtask.priority === 'medium' ? '📌中' : '📋低'}优先级\n\n`
    })
    
    resultText += `💡 回复 "创建这些子任务" 来添加到任务列表`
    
    messages.value[assistantMsgIndex].content = resultText
    
    // 保存分解结果供后续创建
    extractedTasks.value = subtasks.map(subtask => ({
      text: subtask.title,
      description: subtask.description || '',
      category: 'work',
      priority: subtask.priority || 'medium'
    }))
  } catch (error) {
    messages.value[assistantMsgIndex].content = `❌ 分解失败：${error.message}`
  }
}

// 处理今日规划
const handleDailyPlan = async () => {
  const assistantMsgIndex = messages.value.length
  messages.value.push({ 
    role: 'assistant', 
    content: '🌅 正在生成今日规划...',
    modelName: currentModel.value?.name
  })
  
  try {
    const { tasks = [] } = props.tasksData
    const pendingTasks = tasks.filter(task => task.status === 'pending')
    
    if (pendingTasks.length === 0) {
      messages.value[assistantMsgIndex].content = '❌ 没有待办任务，无法生成规划'
      return
    }
    
    // 为任务添加截止时间信息
    const tasksWithDeadline = pendingTasks.map(task => ({
      ...task,
      deadline: task.customDate && task.customTime 
        ? `${task.customDate} ${task.customTime}` 
        : null
    }))
    
    // 动态导入 AIDailyPlanner
    const { AIDailyPlanner } = await import('../services/aiDailyPlanner')
    const plan = await AIDailyPlanner.generateDailyPlan(tasksWithDeadline)
    
    // 格式化规划结果
    let resultText = `🌅 **今日规划**\n\n`
    resultText += `📊 **任务概览**\n`
    resultText += `- 待办任务：${pendingTasks.length} 个\n`
    resultText += `- 高优先级：${pendingTasks.filter(t => t.priority === 'high').length} 个\n\n`
    
    if (plan.morning && plan.morning.length > 0) {
      resultText += `🌄 **上午安排**\n`
      plan.morning.forEach((task, i) => {
        resultText += `${i + 1}. ${task.text} (${task.priority === 'high' ? '⚡高' : task.priority === 'medium' ? '📌中' : '📋低'})\n`
      })
      resultText += `\n`
    }
    
    if (plan.afternoon && plan.afternoon.length > 0) {
      resultText += `☀️ **下午安排**\n`
      plan.afternoon.forEach((task, i) => {
        resultText += `${i + 1}. ${task.text} (${task.priority === 'high' ? '⚡高' : task.priority === 'medium' ? '📌中' : '📋低'})\n`
      })
      resultText += `\n`
    }
    
    if (plan.evening && plan.evening.length > 0) {
      resultText += `🌙 **晚上安排**\n`
      plan.evening.forEach((task, i) => {
        resultText += `${i + 1}. ${task.text} (${task.priority === 'high' ? '⚡高' : task.priority === 'medium' ? '📌中' : '📋低'})\n`
      })
      resultText += `\n`
    }
    
    if (plan.suggestions) {
      resultText += `💡 **AI 建议**\n${plan.suggestions}`
    }
    
    messages.value[assistantMsgIndex].content = resultText
  } catch (error) {
    messages.value[assistantMsgIndex].content = `❌ 生成规划失败：${error.message}`
  }
}

// 处理普通对话
const handleNormalChat = async (question) => {
  // 检查是否是确认创建任务或子任务
  if (extractedTasks.value.length > 0 && /^(确认|创建|好的|是的|yes|ok|创建这些子任务)$/i.test(question)) {
    emit('createTasks', extractedTasks.value)
    messages.value.push({ 
      role: 'assistant', 
      content: `✅ 已成功创建 ${extractedTasks.value.length} 个任务！`,
      modelName: currentModel.value?.name
    })
    extractedTasks.value = []
    return
  }
  
  // 创建一个空的助手消息用于流式更新
  const assistantMsgIndex = messages.value.length
  messages.value.push({ 
    role: 'assistant', 
    content: '',
    modelName: currentModel.value?.name,
    timestamp: new Date().toISOString(),
    tokens: { input: 0, output: 0, total: 0 }
  })

  try {
    // 使用智能上下文（简单查询）或完整上下文（复杂查询）
    const analysis = analyzeQuestion(question)
    const context = analysis.isSimple ? buildSmartContext(question) : buildContext()
    
    console.log(`📊 上下文大小: ${(context.length / 1024).toFixed(2)} KB (${analysis.isSimple ? '智能' : '完整'})`)
    
    const model = currentModel.value
    console.log('🤖 使用模型:', model.name, model.type, model.modelName)

    if (model.type === 'openai') {
      await callOpenAIStream(context, question, model, assistantMsgIndex)
    } else {
      await callOllamaStream(context, question, model, assistantMsgIndex)
    }
  } catch (error) {
    console.error('❌ handleNormalChat错误:', error)
    messages.value[assistantMsgIndex] = { 
      role: 'error', 
      content: error.message 
    }
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
    
    // Ollama流式结束后，估算token（Ollama不返回token信息）
    const inputTokens = Math.ceil((context.length + question.length) / 4)
    const outputTokens = Math.ceil(messages.value[msgIndex].content.length / 4)
    messages.value[msgIndex].tokens = {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
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
  console.log('🚀 callOpenAIStream 开始')
  if (!model.apiKey) throw new Error('请在配置中填写API Key')
  
  try {
    // 统一URL处理：先规范化基础URL，再拼接API路径
    const normalizeBaseUrl = (url) => {
      if (!url) return ''
      let baseUrl = url.trim().replace(/\/v1(\/.*)?$/, '').replace(/\/$/, '')
      return baseUrl
    }
    
    let baseUrl = normalizeBaseUrl(model.url)
    let apiUrl = `${baseUrl}/v1/chat/completions`
    
    console.log('📡 基础URL:', baseUrl, '完整URL:', apiUrl)
    console.log('🔑 Model Name:', model.modelName)
    
    // 先尝试流式响应
    let res = await fetch(apiUrl, {
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

    console.log('📊 流式响应状态:', res.status)

    // 如果流式失败（400错误），尝试非流式
    if (!res.ok && res.status === 400) {
      console.log('🔄 流式响应失败，尝试非流式模式...')
      res = await fetch(apiUrl, {
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
          stream: false
        })
      })
      
      console.log('📡 非流式响应状态:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('❌ 非流式响应失败:', errorData)
        throw new Error(`OpenAI错误 (${res.status}): ${errorData.error?.message || ''}`)
      }
      
      // 非流式响应：一次性返回
      const data = await res.json()
      console.log('✅ 非流式响应数据:', data)
      const content = data.choices[0]?.message?.content || ''
      console.log('📝 提取的内容:', content)
      messages.value[msgIndex].content = content
      
      // 提取token信息
      if (data.usage) {
        messages.value[msgIndex].tokens = {
          input: data.usage.prompt_tokens || 0,
          output: data.usage.completion_tokens || 0,
          total: data.usage.total_tokens || 0
        }
      }
      
      nextTick(() => {
        messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
      })
      return
    }

    if (!res.ok) throw new Error(`OpenAI错误 (${res.status})`)

    // 流式响应处理
    console.log('📖 开始读取流式数据...')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let chunkCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('✅ 流式数据读取完成，共', chunkCount, '个chunk')
        break
      }

      chunkCount++
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 按 "data:" 分割，处理完整的数据块
      const parts = buffer.split(/\n\ndata:/)
      buffer = parts.pop() || '' // 保留最后一个不完整的部分

      for (let part of parts) {
        // 清理前缀
        part = part.replace(/^data:/, '').trim()
        
        if (!part || part === '[DONE]') continue
        
        try {
          const parsed = JSON.parse(part)
          const content = parsed.choices[0]?.delta?.content
          if (content) {
            messages.value[msgIndex].content += content
            nextTick(() => {
              messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
            })
          }
          
          // 提取token信息（流式响应的最后一个chunk可能包含usage）
          if (parsed.usage) {
            messages.value[msgIndex].tokens = {
              input: parsed.usage.prompt_tokens || 0,
              output: parsed.usage.completion_tokens || 0,
              total: parsed.usage.total_tokens || 0
            }
          }
        } catch (e) {
          // 忽略解析错误，可能是不完整的数据
        }
      }
    }
    
    // 流式结束后，如果没有token信息，尝试估算
    if (!messages.value[msgIndex].tokens || messages.value[msgIndex].tokens.total === 0) {
      const inputTokens = Math.ceil((context.length + question.length) / 4)
      const outputTokens = Math.ceil(messages.value[msgIndex].content.length / 4)
      messages.value[msgIndex].tokens = {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      }
    }
  } catch (error) {
    console.error('❌ callOpenAIStream错误:', error)
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
    // 统一URL处理：先规范化基础URL，再拼接API路径
    const normalizeBaseUrl = (url) => {
      if (!url) return ''
      let baseUrl = url.trim().replace(/\/v1(\/.*)?$/, '').replace(/\/$/, '')
      return baseUrl
    }
    
    let baseUrl = normalizeBaseUrl(model.url)
    let apiUrl = `${baseUrl}/v1/chat/completions`
    
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

// 创建任务相关方法
const getCategoryLabel = (category) => {
  const labels = { work: '💼 工作', study: '📚 学习', life: '🏠 生活' }
  return labels[category] || '其他'
}

const getPriorityLabel = (priority) => {
  const labels = { high: '⚡ 高', medium: '📌 中', low: '📋 低' }
  return labels[priority] || '中'
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
  width: 20%;
  min-width: 180px;
  max-width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.chat-sidebar.sidebar-collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
  overflow: hidden;
}

.chat-sidebar.sidebar-collapsed .search-box,
.chat-sidebar.sidebar-collapsed .sidebar-list,
.chat-sidebar.sidebar-collapsed .sidebar-header {
  display: none;
}

/* 收起状态下，按钮垂直排列 */
.chat-sidebar.sidebar-collapsed .sidebar-header-top {
  flex-direction: column;
  gap: 0.75rem;
}

.chat-sidebar.sidebar-collapsed .sidebar-header {
  padding: 1rem 0.5rem;
}

/* 收起状态下，新对话按钮只显示图标 */
.chat-sidebar.sidebar-collapsed .btn-new-chat {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 1.2rem;
}

.chat-sidebar.sidebar-collapsed .btn-new-chat .btn-text {
  display: none;
}

.chat-sidebar.sidebar-collapsed .btn-new-chat .btn-icon {
  display: block;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header-top {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

/* 收起状态下，按钮居中显示 */
.chat-sidebar.sidebar-collapsed .sidebar-header-top {
  justify-content: center;
  margin-bottom: 0;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-sidebar.sidebar-collapsed .sidebar-header {
  padding: 0.75rem 0.5rem;
}

.btn-new-chat {
  flex: 1;
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

.search-box {
  width: 100%;
}

.search-box input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-box input::placeholder {
  color: #999;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.no-results {
  padding: 2rem 1rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

.chat-item-title mark {
  background: #fff59d;
  color: #333;
  padding: 0 2px;
  border-radius: 2px;
}

.chat-group-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.75rem 0.5rem 0.5rem;
  margin-top: 0.5rem;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
}

.chat-group-title:hover {
  color: #667eea;
}

.chat-group-title span:first-child {
  font-size: 0.6rem;
  transition: transform 0.2s;
}

.chat-group-title .group-count {
  font-size: 0.65rem;
  color: #bbb;
  font-weight: 400;
}

.chat-group-title:first-child {
  margin-top: 0;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-item:hover {
  background: #f0f0f0;
  transform: translateX(2px);
}

.chat-item.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.chat-item-content {
  flex: 1;
  min-width: 0;
}

.chat-item-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item.active .chat-item-title {
  color: #667eea;
  font-weight: 600;
}

.chat-item-time {
  font-size: 0.7rem;
  color: #999;
}

.btn-delete-chat {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 0, 0, 0.05);
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.chat-item:hover .btn-delete-chat {
  opacity: 1;
}

.btn-delete-chat:hover {
  background: rgba(255, 0, 0, 0.1);
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
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toggle-sidebar-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 对话区域的展开/收起按钮 */
.toggle-sidebar-btn-main {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toggle-sidebar-btn-main:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
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
  flex-direction: column;
  width: 100%;
}

.message.user {
  align-items: stretch;
}

.message.assistant {
  align-items: stretch;
}

.message-content {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  word-wrap: break-word;
  line-height: 1.6;
}

/* Markdown 样式 */
.message.assistant .message-content {
  background: #f8f9fa;
  color: #333;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* emoji 统一样式 */
.message.assistant .message-content img.emoji {
  display: inline-block;
  width: 1.2em;
  height: 1.2em;
  vertical-align: -0.2em;
  margin: 0 0.1em;
}

.message.assistant .message-content * {
  max-width: 100%;
}

/* 标题 */
.message.assistant .message-content h1,
.message.assistant .message-content h2,
.message.assistant .message-content h3 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.message.assistant .message-content h1 { 
  font-size: 1.5rem; 
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.3rem;
}
.message.assistant .message-content h2 { 
  font-size: 1.3rem; 
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.2rem;
}
.message.assistant .message-content h3 { font-size: 1.1rem; }

/* 段落和列表 */
.message.assistant .message-content p {
  margin: 0.75rem 0;
  line-height: 1.7;
}

.message.assistant .message-content ul,
.message.assistant .message-content ol {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.message.assistant .message-content li {
  margin: 0.3rem 0;
  line-height: 1.7;
  padding-left: 0.5rem;
}

/* 嵌套列表 */
.message.assistant .message-content li > ul,
.message.assistant .message-content li > ol {
  margin: 0.3rem 0;
  padding-left: 1.5rem;
}

/* 列表项内的段落 */
.message.assistant .message-content li > p {
  margin: 0.2rem 0;
}

/* 行内代码 */
.message.assistant .message-content code {
  background: #e8eaf6;
  color: #5e35b1;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  font-weight: 500;
}

/* 代码块 */
.message.assistant .message-content pre {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin: 1rem 0;
  padding: 1rem;
  overflow-x: auto;
}

.message.assistant .message-content pre code {
  display: block;
  background: transparent;
  color: #333;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1.6;
}

/* 代码高亮颜色覆盖（浅色主题） */
.message.assistant .message-content pre code .hljs-keyword { color: #d73a49; }
.message.assistant .message-content pre code .hljs-string { color: #22863a; }
.message.assistant .message-content pre code .hljs-function { color: #6f42c1; }
.message.assistant .message-content pre code .hljs-number { color: #005cc5; }
.message.assistant .message-content pre code .hljs-comment { color: #6a737d; font-style: italic; }
.message.assistant .message-content pre code .hljs-attr { color: #005cc5; }
.message.assistant .message-content pre code .hljs-tag { color: #22863a; }
.message.assistant .message-content pre code .hljs-name { color: #22863a; }

/* 引用 */
.message.assistant .message-content blockquote {
  border-left: 4px solid #667eea;
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  color: #666;
  font-style: italic;
  background: #f5f5f5;
  border-radius: 0 4px 4px 0;
}

/* 表格 */
.message.assistant .message-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  font-size: 0.85rem;
  display: table;
  table-layout: auto;
}

.message.assistant .message-content thead {
  display: table-header-group;
}

.message.assistant .message-content tbody {
  display: table-row-group;
}

.message.assistant .message-content tr {
  display: table-row;
}

.message.assistant .message-content th,
.message.assistant .message-content td {
  border: 1px solid #ddd;
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: middle;
  display: table-cell;
  word-wrap: break-word;
  max-width: 200px;
}

.message.assistant .message-content th {
  background: #667eea;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
}

.message.assistant .message-content td {
  font-size: 0.85rem;
  background: white;
}

.message.assistant .message-content tr:nth-child(even) td {
  background: #f9f9f9;
}

/* 表格容器（支持横向滚动） */
.message.assistant .message-content {
  overflow-x: auto;
}

/* 链接 */
.message.assistant .message-content a {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.message.assistant .message-content a:hover {
  border-bottom-color: #667eea;
}

/* 分隔线 */
.message.assistant .message-content hr {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 1.5rem 0;
}

/* 强调 */
.message.assistant .message-content strong {
  font-weight: 600;
  color: #222;
}

.message.assistant .message-content em {
  font-style: italic;
  color: #555;
}

/* 消息元数据栏 */
.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: #999;
}

.action-btn {
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  opacity: 0.6;
}

.action-btn:hover {
  opacity: 1;
  background: #f5f5f5;
  border-color: #667eea;
}

.model-name {
  font-size: 0.7rem;
  color: #999;
}

.timestamp {
  font-size: 0.7rem;
  color: #999;
}

.tokens {
  font-size: 0.7rem;
  color: #667eea;
  cursor: help;
  padding: 2px 6px;
  background: #f0f4ff;
  border-radius: 4px;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  white-space: pre-wrap;
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
}

.quick-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.8rem 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  text-align: center;
  min-height: 70px;
  font-weight: 500;
}

.quick-btn .btn-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.quick-btn .btn-text {
  font-size: 0.75rem;
  line-height: 1.2;
  white-space: nowrap;
}

.quick-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.quick-btn:active {
  transform: translateY(0);
}

.quick-btn-primary:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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
