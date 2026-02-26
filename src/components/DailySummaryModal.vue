<template>
  <div v-if="visible" class="daily-summary-overlay" @click.self="$emit('close')">
    <div class="daily-summary-container">
      <div class="summary-header">
        <h3>📊 今日工作总结</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="summary-body">
        <!-- 数据统计 -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ summary.completed }}</div>
            <div class="stat-label">完成任务</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">⏰</div>
            <div class="stat-value">{{ summary.overdue }}</div>
            <div class="stat-label">逾期任务</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">🍅</div>
            <div class="stat-value">{{ summary.pomodoros }}</div>
            <div class="stat-label">专注时长</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">📈</div>
            <div class="stat-value">{{ summary.completionRate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
        
        <!-- 完成的任务列表 -->
        <div v-if="summary.completedTasks.length > 0" class="section">
          <h4>✅ 今日完成</h4>
          <ul class="task-list">
            <li v-for="task in summary.completedTasks" :key="task.id">
              <span class="task-name">{{ task.text }}</span>
              <span :class="['task-priority', task.priority]">
                {{ getPriorityText(task.priority) }}
              </span>
            </li>
          </ul>
        </div>
        
        <!-- AI 建议 -->
        <div class="ai-insight">
          <div class="insight-icon">💡</div>
          <div class="insight-content">
            <strong>AI 建议：</strong>
            <p>{{ summary.aiInsight }}</p>
          </div>
        </div>
        
        <!-- 明日计划 -->
        <div v-if="summary.tomorrowTasks.length > 0" class="section">
          <h4>📅 明日计划</h4>
          <ul class="task-list">
            <li v-for="task in summary.tomorrowTasks.slice(0, 3)" :key="task.id">
              {{ task.text }}
            </li>
          </ul>
        </div>
      </div>
      
      <div class="summary-footer">
        <button @click="generateWeeklyReport" class="btn btn-primary">生成周报</button>
        <button @click="$emit('close')" class="btn btn-secondary">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'generate-report'])

const taskStore = useOfflineTaskStore()
const summary = ref({
  completed: 0,
  overdue: 0,
  pomodoros: 0,
  completionRate: 0,
  completedTasks: [],
  tomorrowTasks: [],
  aiInsight: ''
})

// 生成每日总结
const generateSummary = () => {
  const tasks = taskStore.tasks
  const now = new Date()
  const today = now.toDateString()
  
  // 今日完成的任务
  const completedToday = tasks.filter(task => {
    if (task.status !== 'completed' || !task.completed_at) return false
    const completedDate = new Date(task.completed_at)
    return completedDate.toDateString() === today
  })
  
  // 今日逾期的任务
  const overdueToday = tasks.filter(task => task.status === 'overdue')
  
  // 今日创建的任务
  const createdToday = tasks.filter(task => {
    const createdDate = new Date(task.created_at)
    return createdDate.toDateString() === today
  })
  
  // 计算完成率
  const totalToday = createdToday.length
  const completionRate = totalToday > 0 
    ? Math.round((completedToday.length / totalToday) * 100) 
    : 0
  
  // 计算今日专注时长（番茄钟）
  let totalPomodoros = 0
  completedToday.forEach(task => {
    if (task.pomodoroHistory) {
      const todayPomodoros = task.pomodoroHistory.filter(p => {
        const pomodoroDate = new Date(p.startTime)
        return pomodoroDate.toDateString() === today && p.completed
      })
      totalPomodoros += todayPomodoros.length
    }
  })
  const focusHours = (totalPomodoros * 25 / 60).toFixed(1)
  
  // 明日任务
  const tomorrowTasks = tasks.filter(task => 
    task.status === 'pending' && task.type === 'tomorrow'
  )
  
  // 生成 AI 建议
  const aiInsight = generateAIInsight(completedToday, overdueToday, totalPomodoros)
  
  summary.value = {
    completed: completedToday.length,
    overdue: overdueToday.length,
    pomodoros: focusHours + 'h',
    completionRate,
    completedTasks: completedToday,
    tomorrowTasks,
    aiInsight
  }
}

// 生成 AI 建议
const generateAIInsight = (completed, overdue, pomodoros) => {
  if (completed.length === 0) {
    return '今天还没有完成任务，明天加油！建议从简单的任务开始。'
  }
  
  if (overdue.length > 0) {
    return `今天完成了 ${completed.length} 个任务，但有 ${overdue.length} 个任务逾期了。建议明天优先处理逾期任务。`
  }
  
  if (pomodoros >= 4) {
    return `太棒了！今天完成了 ${completed.length} 个任务，专注时长达到 ${(pomodoros * 25 / 60).toFixed(1)} 小时。你的效率很高，继续保持！`
  }
  
  if (completed.length >= 5) {
    return `今天完成了 ${completed.length} 个任务，效率不错！建议明天继续保持这个节奏。`
  }
  
  return `今天完成了 ${completed.length} 个任务。建议明天设定更具体的目标，提高完成率。`
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || '中'
}

// 生成周报
const generateWeeklyReport = () => {
  emit('generate-report')
  emit('close')
}

onMounted(() => {
  generateSummary()
})
</script>

<style scoped>
.daily-summary-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10003;
  backdrop-filter: blur(8px);
}

.daily-summary-container {
  background: white;
  border-radius: 16px;
  width: 96%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.summary-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.summary-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.section {
  margin-bottom: 1.5rem;
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #333;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-list li {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-name {
  flex: 1;
  color: #333;
  font-size: 0.9rem;
}

.task-priority {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.task-priority.high {
  background: #fee;
  color: #c33;
}

.task-priority.medium {
  background: #ffeaa7;
  color: #d63031;
}

.task-priority.low {
  background: #dfe6e9;
  color: #636e72;
}

.ai-insight {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 4px solid #667eea;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.insight-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
}

.insight-content strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #667eea;
  font-size: 0.95rem;
}

.insight-content p {
  margin: 0;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.6;
}

.summary-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
