<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet" @click.stop>
      <!-- 头部 -->
      <div class="sheet-header">
        <h3>🗑️ 回收站</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 统计信息 -->
      <div class="trash-stats" v-if="sortedTasks.length > 0">
        <div class="stat-item">
          <span class="stat-label">已删除任务</span>
          <span class="stat-value">{{ sortedTasks.length }}</span>
        </div>
        <button class="btn-clear-all" @click="handleClearAll">
          🗑️ 清空回收站
        </button>
      </div>

      <!-- 任务列表 -->
      <div class="sheet-body">
        <div v-if="sortedTasks.length === 0" class="empty-state">
          <div class="empty-icon">🎉</div>
          <p>回收站空空如也</p>
        </div>

        <div v-else class="trash-list">
          <div v-for="task in sortedTasks" :key="task.id" class="trash-card">
            <!-- 任务信息 -->
            <div class="trash-info">
              <div class="trash-title">{{ task.text }}</div>
              <div class="trash-meta">
                <span class="meta-item">
                  {{ getCategoryIcon(task.category) }} {{ getCategoryText(task.category) }}
                </span>
                <span class="meta-item">
                  {{ getPriorityIcon(task.priority) }} {{ getPriorityText(task.priority) }}
                </span>
                <span class="meta-item meta-time">
                  🕒 {{ formatDeleteTime(task.deleted_at) }}
                </span>
              </div>
              <div v-if="task.description" class="trash-desc">
                {{ task.description }}
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="trash-actions">
              <button class="btn-restore" @click="handleRestore(task.id)">
                ↩️ 恢复
              </button>
              <button class="btn-delete" @click="handlePermanentDelete(task.id)">
                🗑️ 彻底删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'restore', 'permanentDelete', 'clearAll'])

// 按删除时间倒序排序（最新删除的在最上面）
const sortedTasks = computed(() => {
  return [...props.tasks].sort((a, b) => {
    const timeA = new Date(a.deleted_at || a.created_at).getTime()
    const timeB = new Date(b.deleted_at || b.created_at).getTime()
    return timeB - timeA // 倒序
  })
})

const getCategoryIcon = (category) => {
  const icons = {
    work: '💼',
    study: '📚',
    life: '🏠'
  }
  return icons[category] || '📋'
}

const getCategoryText = (category) => {
  const texts = {
    work: '工作',
    study: '学习',
    life: '生活'
  }
  return texts[category] || '其他'
}

const getPriorityIcon = (priority) => {
  const icons = {
    high: '⚡',
    medium: '📌',
    low: '📋'
  }
  return icons[priority] || '📋'
}

const getPriorityText = (priority) => {
  const texts = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return texts[priority] || '普通'
}

const formatDeleteTime = (deletedAt) => {
  if (!deletedAt) return '未知时间'
  
  const now = new Date()
  const deleteTime = new Date(deletedAt)
  const diffMs = now - deleteTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚删除'
  if (diffMins < 60) return `${diffMins}分钟前删除`
  if (diffHours < 24) return `${diffHours}小时前删除`
  if (diffDays < 7) return `${diffDays}天前删除`
  
  // 超过7天显示具体日期
  const year = deleteTime.getFullYear()
  const month = String(deleteTime.getMonth() + 1).padStart(2, '0')
  const day = String(deleteTime.getDate()).padStart(2, '0')
  const hour = String(deleteTime.getHours()).padStart(2, '0')
  const minute = String(deleteTime.getMinutes()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hour}:${minute}`
}

const handleRestore = (taskId) => {
  emit('restore', taskId)
}

const handlePermanentDelete = (taskId) => {
  if (confirm('确定要彻底删除这个任务吗？\n\n此操作不可撤销！')) {
    emit('permanentDelete', taskId)
  }
}

const handleClearAll = () => {
  const count = props.tasks.length
  if (confirm(`确定要清空回收站吗？\n\n将永久删除 ${count} 个任务，此操作不可撤销！`)) {
    emit('clearAll')
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
  background: rgba(0, 0, 0, 0.5);
  z-index: 10002;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px 20px 0 0;
}

.sheet-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.trash-stats {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.btn-clear-all {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear-all:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.trash-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trash-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s;
}

.trash-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.trash-info {
  margin-bottom: 0.75rem;
}

.trash-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.trash-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-time {
  color: #999;
  font-style: italic;
}

.trash-desc {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.trash-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-restore,
.btn-delete {
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-restore {
  background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
  color: white;
}

.btn-restore:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(81, 207, 102, 0.3);
}

.btn-delete {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
}

.btn-delete:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}
</style>
