<template>
  <div v-if="visible" class="modal-overlay" @click="handleClose">
    <div class="modal-content bottom-sheet" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <div class="drag-handle"></div>
        <h2>💬 AI 对话创建任务</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <!-- 对话内容 -->
      <div class="modal-body">
        <!-- 说明 -->
        <div class="info-card">
          <div class="info-icon">💡</div>
          <div class="info-text">
            <strong>用自然语言描述你的待办事项</strong>
            <p>AI 会自动提取任务、判断分类和优先级</p>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="input-section">
          <div class="section-title">
            📝 描述你的待办事项
            <label class="parser-toggle">
              <input type="checkbox" v-model="useSmartParser" />
              <span>⚡ 智能解析（离线、快速）</span>
            </label>
          </div>
          <textarea
            v-model="userInput"
            class="chat-input"
            placeholder="例如：明天上午9点开会，下午3点写报告（紧急），晚上学习英语..."
            rows="6"
            @keydown.ctrl.enter="handleExtract"
          ></textarea>
          <div class="input-hint">
            <span>{{ userInput.length }} / 500</span>
            <span>Ctrl + Enter 快速提取</span>
          </div>
        </div>

        <!-- 提取结果 -->
        <div v-if="extractedTasks.length > 0" class="result-section">
          <div class="section-title">
            ✨ AI 提取的任务
            <span class="task-count">{{ extractedTasks.length }} 个</span>
          </div>
          <div class="task-list">
            <div v-for="(task, index) in extractedTasks" :key="index" class="task-preview">
              <div class="task-header">
                <span class="task-number">{{ index + 1 }}</span>
                <span class="task-title">{{ task.text }}</span>
                <button @click="removeTask(index)" class="remove-btn">🗑️</button>
              </div>
              <div class="task-meta">
                <span class="meta-badge" :class="`category-${task.category}`">
                  {{ getCategoryLabel(task.category) }}
                </span>
                <span class="meta-badge" :class="`priority-${task.priority}`">
                  {{ getPriorityLabel(task.priority) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>AI 正在分析中...</p>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <button @click="handleClose" class="btn-secondary">
          取消
        </button>
        <button 
          v-if="extractedTasks.length === 0"
          @click="handleExtract" 
          class="btn-primary"
          :disabled="!userInput.trim() || isLoading"
        >
          {{ isLoading ? '分析中...' : '🤖 AI 提取任务' }}
        </button>
        <button 
          v-else
          @click="handleCreate" 
          class="btn-primary"
        >
          ✅ 创建全部 ({{ extractedTasks.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { AIChatService } from '../services/aiChatService'
import { SmartTaskParser } from '../services/smartTaskParser'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'create'])

const userInput = ref('')
const extractedTasks = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const useSmartParser = ref(true) // 默认使用智能解析

watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 重置状态
    userInput.value = ''
    extractedTasks.value = []
    errorMessage.value = ''
  }
})

const handleExtract = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    let tasks = []
    
    if (useSmartParser.value) {
      // 使用本地智能解析（快速、离线）
      const parsed = SmartTaskParser.parse(userInput.value)
      tasks = parsed.tasks.map(t => ({
        text: t.title,
        description: t.description,
        type: t.type,
        customDate: t.customDate,
        customTime: t.customTime,
        priority: t.priority,
        category: t.category
      }))
    } else {
      // 使用AI解析（需要网络）
      tasks = await AIChatService.extractTasksFromChat(userInput.value)
    }
    
    extractedTasks.value = tasks
    
    if (tasks.length === 0) {
      errorMessage.value = '未识别到任务，请尝试更明确的描述'
    }
  } catch (error) {
    console.error('提取任务失败:', error)
    errorMessage.value = error.message || '提取失败，请检查AI配置'
  } finally {
    isLoading.value = false
  }
}

const removeTask = (index) => {
  extractedTasks.value.splice(index, 1)
}

const handleCreate = () => {
  if (extractedTasks.value.length === 0) return
  emit('create', extractedTasks.value)
  handleClose()
}

const handleClose = () => {
  emit('close')
}

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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 100%;
  max-height: 90vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.drag-handle {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  flex: 1;
  text-align: center;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.info-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 3px solid #667eea;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.info-icon {
  font-size: 1.5rem;
}

.info-text strong {
  display: block;
  color: #333;
  margin-bottom: 0.25rem;
}

.info-text p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.section-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-count {
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 500;
}

.input-section {
  margin-bottom: 1.5rem;
}

.chat-input {
  width: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.chat-input:focus {
  outline: none;
  border-color: #667eea;
}

.input-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #999;
}

.result-section {
  margin-bottom: 1rem;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-preview {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.task-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}

.task-title {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.remove-btn {
  background: #ff4444;
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  gap: 0.5rem;
}

.meta-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.category-work { background: #e3f2fd; color: #1976d2; }
.category-study { background: #f3e5f5; color: #7b1fa2; }
.category-life { background: #e8f5e9; color: #388e3c; }

.priority-high { background: #ffebee; color: #c62828; }
.priority-medium { background: #fff3e0; color: #ef6c00; }
.priority-low { background: #e3f2fd; color: #1976d2; }

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.75rem;
  background: white;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
