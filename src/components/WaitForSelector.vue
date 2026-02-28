<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔗 设置等待任务</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="current-task">
          <div class="label">当前任务</div>
          <div class="task-name">{{ currentTask?.text }}</div>
        </div>

        <div class="hint">
          💡 选择必须先完成的任务（可多选）
        </div>

        <div class="search-box">
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="🔍 搜索任务..."
            class="search-input"
          />
        </div>

        <div class="task-list">
          <div 
            v-for="task in filteredTasks" 
            :key="task.id"
            class="task-item"
            :class="{ selected: selectedTaskIds.includes(task.id) }"
            @click="toggleTask(task.id)"
          >
            <div class="task-checkbox">
              <span v-if="selectedTaskIds.includes(task.id)">✓</span>
            </div>
            <div class="task-info">
              <div class="task-title">{{ task.text || '未命名任务' }}</div>
              <div class="task-meta">
                <span class="priority" :class="task.priority">{{ priorityText(task.priority) }}</span>
                <span class="status" :class="task.status">{{ statusText(task.status) }}</span>
              </div>
            </div>
          </div>

          <div v-if="filteredTasks.length === 0" class="empty-state">
            暂无可选任务
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" @click="handleConfirm">确定 ({{ selectedTaskIds.length }})</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'

const props = defineProps({
  show: Boolean,
  taskId: Number
})

const emit = defineEmits(['close', 'confirm'])

const taskStore = useOfflineTaskStore()
const searchKeyword = ref('')
const selectedTaskIds = ref([])

const currentTask = computed(() => {
  return taskStore.tasks.find(t => t.id === props.taskId)
})

// 初始化已选中的任务
watch(() => props.show, (newVal) => {
  if (newVal && currentTask.value) {
    selectedTaskIds.value = [...(currentTask.value.waitFor || [])]
    searchKeyword.value = ''
  }
})

const filteredTasks = computed(() => {
  // 排除当前任务和已完成的任务
  let tasks = taskStore.tasks.filter(t => 
    t.id !== props.taskId && 
    t.status !== 'completed'
  )

  // 搜索过滤（模糊匹配）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    tasks = tasks.filter(t => {
      const text = (t.text || '').toLowerCase()
      const desc = (t.description || '').toLowerCase()
      
      // 支持空格分隔的多关键词匹配
      const keywords = keyword.split(/\s+/)
      return keywords.every(kw => 
        text.includes(kw) || desc.includes(kw)
      )
    })
  }

  return tasks
})

const toggleTask = (taskId) => {
  const index = selectedTaskIds.value.indexOf(taskId)
  if (index > -1) {
    selectedTaskIds.value.splice(index, 1)
  } else {
    selectedTaskIds.value.push(taskId)
  }
}

const priorityText = (priority) => {
  const map = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return map[priority] || priority
}

const statusText = (status) => {
  const map = { pending: '待办', completed: '已完成', overdue: '已逾期' }
  return map[status] || status
}

const handleConfirm = () => {
  emit('confirm', selectedTaskIds.value)
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
  z-index: 9999;
  padding: 0;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-content {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  margin: 0;
}

.modal-header {
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.current-task {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.current-task .label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
}

.current-task .task-name {
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.hint {
  background: #f8f9fa;
  padding: 0.8rem;
  border-radius: 8px;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.search-box {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.task-list {
  max-height: 300px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  border: 2px solid #eee;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.task-item.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.task-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #ddd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.8rem;
  flex-shrink: 0;
  transition: all 0.2s;
}

.task-item.selected .task-checkbox {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.task-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.priority, .status {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.priority.high {
  background: #fee;
  color: #c33;
}

.priority.medium {
  background: #ffefd5;
  color: #d97706;
}

.priority.low {
  background: #e0f2fe;
  color: #0284c7;
}

.status.pending {
  background: #e0f2fe;
  color: #0284c7;
}

.status.overdue {
  background: #fee;
  color: #c33;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
}

.btn-cancel, .btn-confirm {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e5e5e5;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
