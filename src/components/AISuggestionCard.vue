<template>
  <div v-if="visible" class="ai-suggestion-card">
    <div class="card-header">
      <div class="header-left">
        <span class="ai-icon">🤖</span>
        <span class="ai-title">AI 助手建议</span>
      </div>
      <button class="close-btn" @click="dismiss">✕</button>
    </div>
    
    <div class="card-body">
      <div v-if="suggestion.type === 'overdue'" class="suggestion-content">
        <div class="alert-icon">⚠️</div>
        <div class="alert-text">
          <strong>你有 {{ suggestion.count }} 个任务即将逾期</strong>
          <p>建议今天优先完成：</p>
          <ul class="task-list">
            <li v-for="task in suggestion.tasks" :key="task.id">
              {{ task.text }} 
              <span class="deadline">({{ formatDeadline(task) }})</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div v-else-if="suggestion.type === 'pending'" class="suggestion-content">
        <div class="alert-icon">📋</div>
        <div class="alert-text">
          <strong>你有 {{ suggestion.count }} 个待办任务</strong>
          <p>{{ suggestion.message }}</p>
        </div>
      </div>
      
      <div v-else-if="suggestion.type === 'motivation'" class="suggestion-content">
        <div class="alert-icon">✨</div>
        <div class="alert-text">
          <strong>{{ suggestion.message }}</strong>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <button @click="viewDetails" class="btn btn-primary">查看详情</button>
      <button @click="snooze" class="btn btn-secondary">稍后提醒</button>
      <button @click="dismiss" class="btn btn-text">忽略</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'view-details'])

const taskStore = useOfflineTaskStore()
const suggestion = ref({})

// 生成智能建议
const generateSuggestion = () => {
  const tasks = taskStore.tasks
  const now = new Date()
  
  // 检查即将逾期的任务（24小时内）
  const upcomingOverdue = tasks.filter(task => {
    if (task.status !== 'pending') return false
    const deadline = getTaskDeadline(task)
    if (!deadline) return false
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60)
    return hoursUntilDeadline > 0 && hoursUntilDeadline <= 24
  }).sort((a, b) => {
    const deadlineA = getTaskDeadline(a)
    const deadlineB = getTaskDeadline(b)
    return deadlineA - deadlineB
  })
  
  if (upcomingOverdue.length > 0) {
    suggestion.value = {
      type: 'overdue',
      count: upcomingOverdue.length,
      tasks: upcomingOverdue.slice(0, 3),
      message: '这些任务即将逾期，建议优先处理'
    }
    return
  }
  
  // 检查高优先级待办任务
  const highPriorityPending = tasks.filter(task => 
    task.status === 'pending' && task.priority === 'high'
  )
  
  if (highPriorityPending.length > 0) {
    suggestion.value = {
      type: 'pending',
      count: highPriorityPending.length,
      message: '建议今天完成这些高优先级任务'
    }
    return
  }
  
  // 激励消息
  const completedToday = tasks.filter(task => {
    if (task.status !== 'completed' || !task.completed_at) return false
    const completedDate = new Date(task.completed_at)
    return completedDate.toDateString() === now.toDateString()
  })
  
  if (completedToday.length > 0) {
    suggestion.value = {
      type: 'motivation',
      message: `太棒了！今天已完成 ${completedToday.length} 个任务，继续保持！`
    }
    return
  }
  
  // 默认建议
  const pendingCount = tasks.filter(t => t.status === 'pending').length
  if (pendingCount > 0) {
    suggestion.value = {
      type: 'pending',
      count: pendingCount,
      message: '开始今天的任务吧！'
    }
  }
}

// 获取任务截止时间
const getTaskDeadline = (task) => {
  const now = new Date()
  
  if (task.type === 'today') {
    const deadline = new Date(now)
    deadline.setHours(23, 59, 59, 999)
    return deadline
  }
  
  if (task.type === 'tomorrow') {
    const deadline = new Date(now)
    deadline.setDate(deadline.getDate() + 1)
    deadline.setHours(23, 59, 59, 999)
    return deadline
  }
  
  if (task.type === 'custom_date' && task.customDate) {
    const [year, month, day] = task.customDate.split('-')
    const time = task.customTime || '23:59'
    const [hour, minute] = time.split(':')
    return new Date(year, month - 1, day, hour, minute)
  }
  
  return null
}

// 格式化截止时间
const formatDeadline = (task) => {
  const deadline = getTaskDeadline(task)
  if (!deadline) return ''
  
  const now = new Date()
  const hours = Math.floor((deadline - now) / (1000 * 60 * 60))
  
  if (hours < 2) return '即将逾期'
  if (hours < 24) return `${hours}小时后`
  
  const days = Math.floor(hours / 24)
  return `${days}天后`
}

// 查看详情
const viewDetails = () => {
  emit('view-details', suggestion.value)
  dismiss()
}

// 稍后提醒
const snooze = () => {
  localStorage.setItem('ai_suggestion_snooze', Date.now().toString())
  dismiss()
}

// 忽略
const dismiss = () => {
  emit('close')
}

onMounted(() => {
  generateSuggestion()
})
</script>

<style scoped>
.ai-suggestion-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ai-icon {
  font-size: 1.2rem;
}

.ai-title {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.card-body {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.suggestion-content {
  display: flex;
  gap: 0.75rem;
}

.alert-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.alert-text {
  flex: 1;
}

.alert-text strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.95rem;
}

.alert-text p {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.85rem;
}

.task-list {
  margin: 0.5rem 0 0 0;
  padding-left: 1.2rem;
  list-style: none;
}

.task-list li {
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.85rem;
  position: relative;
}

.task-list li::before {
  content: '•';
  position: absolute;
  left: -1rem;
  color: #667eea;
  font-weight: bold;
}

.deadline {
  color: #ff6b6b;
  font-size: 0.8rem;
  font-weight: 500;
}

.card-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover {
  background: #f0f0f0;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-text {
  background: transparent;
  color: white;
}

.btn-text:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
