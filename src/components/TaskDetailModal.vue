<template>
  <div class="task-detail-overlay" @click.self="$emit('close')">
    <div class="task-detail-sheet">
      <!-- 头部 -->
      <div class="detail-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h2>{{ task.text }}</h2>
        <button class="edit-btn" @click="$emit('edit', task)">
          <span>编辑</span>
        </button>
      </div>

      <!-- 滚动内容区 -->
      <div class="detail-content">
        <!-- 任务概览 -->
        <section class="overview-section">
          <h3>📊 任务概览</h3>
          <div class="overview-card">
            <div class="overview-item">
              <span class="label">状态:</span>
              <span :class="['status-badge', task.status]">
                {{ getStatusText(task.status) }}
                <span v-if="task.status === 'pending' && task.stats?.totalLogs > 0">
                  ({{ task.stats.progressHistory[task.stats.progressHistory.length - 1] || 0 }}%)
                </span>
              </span>
            </div>
            <div class="overview-item">
              <span class="label">优先级:</span>
              <span :class="['priority-badge', task.priority]">
                {{ getPriorityIcon(task.priority) }} {{ getPriorityText(task.priority) }}
              </span>
            </div>
            <div class="overview-item">
              <span class="label">分类:</span>
              <span class="category-badge">
                {{ getCategoryIcon(task.category) }} {{ getCategoryText(task.category) }}
              </span>
            </div>
            <div class="overview-item">
              <span class="label">截止:</span>
              <span :class="['deadline-text', getDeadlineClass(task)]">
                {{ formatDeadline(task) }}
              </span>
            </div>
            <div class="overview-item">
              <span class="label">创建:</span>
              <span>{{ formatDate(task.created_at) }}</span>
            </div>
            <div v-if="task.completed_at" class="overview-item">
              <span class="label">完成:</span>
              <span>{{ formatDate(task.completed_at) }}</span>
            </div>
          </div>
        </section>

        <!-- 时间进度 -->
        <section class="timeline-section">
          <h3>⏰ 时间进度</h3>
          <div class="timeline-container">
            <div class="timeline-item">
              <div class="timeline-dot created"></div>
              <div class="timeline-content">
                <div class="timeline-label">创建时间</div>
                <div class="timeline-value">{{ formatDate(task.created_at) }}</div>
              </div>
            </div>
            <div class="timeline-line"></div>
            <div class="timeline-item">
              <div :class="['timeline-dot', getDeadlineClass(task)]"></div>
              <div class="timeline-content">
                <div class="timeline-label">截止时间</div>
                <div class="timeline-value">{{ formatDeadline(task) }}</div>
              </div>
            </div>
            <div v-if="task.completed_at" class="timeline-line completed"></div>
            <div v-if="task.completed_at" class="timeline-item">
              <div class="timeline-dot completed"></div>
              <div class="timeline-content">
                <div class="timeline-label">完成时间</div>
                <div class="timeline-value">{{ formatDate(task.completed_at) }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 任务描述 -->
        <section v-if="task.description" class="description-section">
          <h3>📝 任务描述</h3>
          <div class="description-card">
            {{ task.description }}
          </div>
        </section>

        <!-- 执行统计 -->
        <section v-if="task.stats && task.stats.totalLogs > 0" class="stats-section">
          <h3>📈 执行统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">🔢</div>
              <div class="stat-value">{{ task.stats.sessionCount }}次</div>
              <div class="stat-label">推进次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⏱️</div>
              <div class="stat-value">{{ formatDuration(task.stats.totalDuration) }}</div>
              <div class="stat-label">总耗时</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⏰</div>
              <div class="stat-value">{{ formatDuration(task.stats.averageSessionDuration) }}</div>
              <div class="stat-label">平均每次</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🚫</div>
              <div class="stat-value">
                {{ task.stats.blockCount }}次
                <span v-if="task.stats.blockCount > 0" class="sub-value">
                  ({{ task.stats.resolvedBlockCount }}已解决)
                </span>
              </div>
              <div class="stat-label">遇到阻碍</div>
            </div>
          </div>
          <div v-if="task.stats.tags.length > 0" class="tags-container">
            <span class="tag-label">🏷️ 标签:</span>
            <span v-for="tag in task.stats.tags" :key="tag" class="tag-item">
              #{{ tag }}
            </span>
          </div>
        </section>

        <!-- 执行日志 -->
        <section class="logs-section">
          <div class="logs-header">
            <h3>💬 执行日志 ({{ task.logs?.length || 0 }}条)</h3>
          </div>

          <div v-if="!task.logs || task.logs.length === 0" class="empty-logs">
            <p>📝 还没有执行日志</p>
            <p class="hint">点击下方"添加日志"开始记录任务执行过程</p>
          </div>

          <div v-else class="logs-list">
            <div
              v-for="log in sortedLogs"
              :key="log.id"
              :class="['log-item', `log-${log.type}`]"
            >
              <div class="log-header">
                <span class="log-type">{{ getLogTypeIcon(log.type) }} {{ getLogTypeText(log.type) }}</span>
                <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
              </div>
              <div class="log-content">{{ log.content }}</div>
              <div v-if="log.duration || log.progress !== null || log.tags?.length" class="log-meta">
                <span v-if="log.duration" class="meta-item">⏱️ 耗时 {{ formatDuration(log.duration) }}</span>
                <span v-if="log.progress !== null" class="meta-item">📊 进度 {{ log.progress }}%</span>
                <span v-if="log.mood" class="meta-item">{{ getMoodIcon(log.mood) }}</span>
                <span v-if="log.rating" class="meta-item">{{ '⭐'.repeat(log.rating) }}</span>
              </div>
              <div v-if="log.tags?.length" class="log-tags">
                <span v-for="tag in log.tags" :key="tag" class="log-tag">#{{ tag }}</span>
              </div>
              <div v-if="log.lessons?.length" class="log-lessons">
                <div class="lessons-title">📚 经验教训:</div>
                <ul>
                  <li v-for="(lesson, idx) in log.lessons" :key="idx">{{ lesson }}</li>
                </ul>
              </div>
              <div v-if="log.type === 'block' && log.resolved" class="log-resolved">
                ✅ 已解决 ({{ formatLogTime(log.resolvedAt) }})
                <span v-if="log.resolvedNote">: {{ log.resolvedNote }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 底部操作栏 -->
      <div class="detail-footer">
        <button class="add-log-btn" @click="showAddLogModal = true">
          📝 添加日志
        </button>
        <button
          v-if="task.status !== 'completed'"
          class="complete-btn"
          @click="handleComplete"
        >
          ✅ 标记完成
        </button>
        <button class="delete-btn" @click="handleDelete">
          🗑️ 删除任务
        </button>
      </div>
    </div>

    <!-- 添加日志弹窗 -->
    <AddLogModal
      v-if="showAddLogModal"
      :task="task"
      @close="showAddLogModal = false"
      @submit="handleAddLog"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'
import AddLogModal from './AddLogModal.vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'edit', 'refresh'])

const taskStore = useOfflineTaskStore()
const showAddLogModal = ref(false)

// 排序后的日志（最新的在上面）
const sortedLogs = computed(() => {
  if (!props.task.logs) return []
  return [...props.task.logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

// 状态文本
const getStatusText = (status) => {
  const map = {
    pending: '⏳ 进行中',
    completed: '✓ 已完成',
    overdue: '⚠️ 已逾期'
  }
  return map[status] || status
}

// 优先级
const getPriorityIcon = (priority) => {
  const map = { high: '⚡', medium: '📌', low: '📋' }
  return map[priority] || ''
}

const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

// 分类
const getCategoryIcon = (category) => {
  const map = { work: '💼', study: '📚', life: '🏠' }
  return map[category] || ''
}

const getCategoryText = (category) => {
  const map = { work: '工作', study: '学习', life: '生活' }
  return map[category] || category
}

// 截止时间
const formatDeadline = (task) => {
  const deadline = taskStore.calculateDeadline(task)
  if (!deadline) return '无截止时间'
  
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 0) return '已逾期'
  if (hours < 24) return `剩余 ${hours} 小时`
  
  const days = Math.floor(hours / 24)
  return `剩余 ${days} 天`
}

const getDeadlineClass = (task) => {
  const deadline = taskStore.calculateDeadline(task)
  if (!deadline) return ''
  
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 0) return 'overdue'
  if (hours < 2) return 'urgent'
  if (hours < 24) return 'warning'
  return 'normal'
}

// 日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatLogTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  // 显示完整日期时间
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  // 今天：显示时间 + 相对时间
  if (hours < 24 && date.getDate() === now.getDate()) {
    if (hours < 1) return `${hour}:${minute} (刚刚)`
    return `${hour}:${minute} (${hours}小时前)`
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) {
    return `昨天 ${hour}:${minute}`
  }
  
  // 其他：显示完整日期
  return `${month}/${day} ${hour}:${minute}`
}

// 时长格式化
const formatDuration = (minutes) => {
  if (!minutes) return '0分钟'
  if (minutes < 60) return `${minutes}分钟`
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}

// 日志类型
const getLogTypeIcon = (type) => {
  const map = {
    start: '🚀',
    progress: '📈',
    block: '🚫',
    solution: '💡',
    milestone: '🎯',
    complete: '✅'
  }
  return map[type] || '📝'
}

const getLogTypeText = (type) => {
  const map = {
    start: '开始执行',
    progress: '进展更新',
    block: '遇到阻碍',
    solution: '解决方案',
    milestone: '里程碑',
    complete: '完成总结'
  }
  return map[type] || type
}

// 心情图标
const getMoodIcon = (mood) => {
  const map = {
    good: '😊 顺利',
    neutral: '😐 一般',
    bad: '😓 困难'
  }
  return map[mood] || ''
}

// 添加日志
const handleAddLog = async (logData) => {
  await taskStore.addTaskLog(props.task.id, logData)
  showAddLogModal.value = false
  emit('refresh')
}

// 完成任务
const handleComplete = () => {
  showAddLogModal.value = true
  // 可以在 AddLogModal 中默认选择 'complete' 类型
}

// 删除任务
const handleDelete = async () => {
  if (confirm('确定要删除这个任务吗？')) {
    await taskStore.deleteTask(props.task.id)
    emit('close')
    emit('refresh')
  }
}
</script>

<style scoped>
.task-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.task-detail-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 96%;
  max-width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 auto;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 头部 */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

/* 添加拖动手柄 */
.detail-header::before {
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

.detail-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
  padding: 0.5rem 1rem 0 1rem;
}

.back-btn,
.edit-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.back-btn:hover,
.edit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 内容区 */
.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

section {
  margin-bottom: 1.5rem;
}

section h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: #333;
}

/* 概览卡片 */
.overview-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
}

.overview-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.overview-item:last-child {
  margin-bottom: 0;
}

.overview-item .label {
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.completed {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.overdue {
  background: #ffebee;
  color: #d32f2f;
}

.priority-badge,
.category-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  background: #f0f0f0;
}

.priority-badge.high {
  background: #ffebee;
  color: #d32f2f;
}

.priority-badge.medium {
  background: #fff3e0;
  color: #f57c00;
}

.priority-badge.low {
  background: #e3f2fd;
  color: #1976d2;
}

.deadline-text.overdue {
  color: #d32f2f;
  font-weight: 600;
}

.deadline-text.urgent {
  color: #d32f2f;
}

.deadline-text.warning {
  color: #f57c00;
}

.deadline-text.normal {
  color: #666;
}

/* 描述卡片 */
.description-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.sub-value {
  font-size: 0.75rem;
  opacity: 0.9;
  display: block;
  margin-top: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

/* 标签 */
.tags-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-label {
  font-weight: 600;
  color: #666;
}

.tag-item {
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #667eea;
  border: 1px solid #667eea;
}

/* 时间进度 */
.timeline-section {
  margin-bottom: 1.5rem;
}

.timeline-container {
  display: flex;
  align-items: center;
  padding: 1.5rem 1rem;
  background: white;
  border-radius: 12px;
  overflow-x: auto;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.timeline-dot.created {
  background: #2196f3;
}

.timeline-dot.normal {
  background: #4caf50;
}

.timeline-dot.warning {
  background: #ff9800;
}

.timeline-dot.urgent {
  background: #f44336;
}

.timeline-dot.overdue {
  background: #9e9e9e;
}

.timeline-dot.completed {
  background: #4caf50;
}

.timeline-content {
  text-align: center;
}

.timeline-label {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.timeline-value {
  font-size: 0.85rem;
  color: #333;
  font-weight: 600;
}

.timeline-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, #2196f3, #4caf50);
  margin: 0 0.5rem;
  min-width: 40px;
  align-self: flex-start;
  margin-top: 8px;
}

.timeline-line.completed {
  background: #4caf50;
}

/* 日志列表 */
.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.empty-logs {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
}

.empty-logs p {
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.85rem;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.log-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid #667eea;
}

.log-item.log-start {
  border-left-color: #4caf50;
}

.log-item.log-progress {
  border-left-color: #2196f3;
}

.log-item.log-block {
  border-left-color: #f44336;
}

.log-item.log-solution {
  border-left-color: #ff9800;
}

.log-item.log-milestone {
  border-left-color: #9c27b0;
}

.log-item.log-complete {
  border-left-color: #4caf50;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.log-type {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.log-time {
  font-size: 0.8rem;
  color: #999;
}

.log-content {
  color: #333;
  line-height: 1.6;
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
}

.log-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.meta-item {
  font-size: 0.85rem;
  color: #666;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
}

.log-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.log-tag {
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #667eea;
  border: 1px solid #667eea;
}

.log-lessons {
  margin-top: 0.75rem;
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
}

.lessons-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.log-lessons ul {
  margin: 0;
  padding-left: 1.5rem;
}

.log-lessons li {
  margin-bottom: 0.25rem;
  color: #666;
}

.log-resolved {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #e8f5e9;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #388e3c;
}

/* 底部操作栏 */
.detail-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.detail-footer button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-log-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.complete-btn {
  background: #4caf50;
  color: white;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.detail-footer button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.detail-footer button:active {
  transform: translateY(0);
}
</style>
