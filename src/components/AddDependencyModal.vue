<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content bottom-sheet">
      <div class="modal-header">
        <h3>🔗 添加依赖关系</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- 当前任务信息 -->
        <div class="current-task-info">
          <span class="info-label">当前任务：</span>
          <span class="info-value">{{ currentTask.text }}</span>
        </div>

        <!-- 说明 -->
        <div class="help-text">
          <span class="help-icon">💡</span>
          <span>选择必须先完成的任务（前置任务）。前置任务完成后，当前任务才能开始。</span>
        </div>

        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="🔍 搜索任务..."
          >
        </div>

        <!-- 可选任务列表 -->
        <div class="task-list">
          <div v-if="filteredTasks.length === 0" class="empty-state">
            <p>没有可选的任务</p>
          </div>
          <div 
            v-for="task in filteredTasks" 
            :key="task.id"
            class="task-item"
            :class="{ 
              'task-selected': selectedTaskIds.includes(task.id),
              'task-disabled': !canAddDependency(task)
            }"
            @click="toggleTask(task)"
          >
            <label class="task-checkbox">
              <input 
                type="checkbox" 
                :checked="selectedTaskIds.includes(task.id)"
                :disabled="!canAddDependency(task)"
                @click.stop="toggleTask(task)"
              >
            </label>
            <div class="task-info">
              <div class="task-title">{{ task.text }}</div>
              <div class="task-meta">
                <span class="badge" :class="`priority-${task.priority}`">⚡{{ getPriorityText(task.priority) }}</span>
                <span class="badge" :class="`category-${task.category}`">🏷️{{ getCategoryText(task.category) }}</span>
                <span v-if="task.status === 'completed'" class="badge badge-completed">✓ 已完成</span>
              </div>
              <div v-if="!canAddDependency(task)" class="warning-text">
                {{ getWarningText(task) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 已选择的任务 -->
        <div v-if="selectedTaskIds.length > 0" class="selected-tasks">
          <h4>已选择 {{ selectedTaskIds.length }} 个前置任务</h4>
          <div class="selected-list">
            <span 
              v-for="taskId in selectedTaskIds" 
              :key="taskId"
              class="selected-tag"
            >
              {{ getTaskById(taskId)?.text }}
              <button @click="removeTask(taskId)">✕</button>
            </span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">取消</button>
        <button 
          class="btn-primary" 
          @click="handleSubmit" 
          :disabled="selectedTaskIds.length === 0"
        >
          ✓ 添加依赖 ({{ selectedTaskIds.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'

const props = defineProps({
  visible: Boolean,
  currentTask: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])
const taskStore = useOfflineTaskStore()

const searchKeyword = ref('')
const selectedTaskIds = ref([])

// 可选任务列表（排除当前任务、子任务、已有依赖）
const availableTasks = computed(() => {
  return taskStore.tasks.filter(t => {
    // 排除当前任务
    if (t.id === props.currentTask.id) return false
    
    // 排除已删除任务
    if (t.status === 'deleted') return false
    
    // 排除当前任务的子任务
    if (t.parentId === props.currentTask.id) return false
    
    // 排除已有的依赖
    if (props.currentTask.dependencies.blockedBy.includes(t.id)) return false
    
    return true
  })
})

// 搜索过滤
const filteredTasks = computed(() => {
  if (!searchKeyword.value.trim()) return availableTasks.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return availableTasks.value.filter(t => 
    t.text.toLowerCase().includes(keyword) ||
    t.description?.toLowerCase().includes(keyword)
  )
})

// 检查是否可以添加依赖
const canAddDependency = (task) => {
  // 检查循环依赖
  return !taskStore.checkCircularDependency(props.currentTask.id, task.id)
}

// 获取警告文本
const getWarningText = (task) => {
  if (taskStore.checkCircularDependency(props.currentTask.id, task.id)) {
    return '⚠️ 会形成循环依赖'
  }
  return ''
}

// 切换任务选择
const toggleTask = (task) => {
  if (!canAddDependency(task)) return
  
  const index = selectedTaskIds.value.indexOf(task.id)
  if (index > -1) {
    selectedTaskIds.value.splice(index, 1)
  } else {
    selectedTaskIds.value.push(task.id)
  }
}

// 移除任务
const removeTask = (taskId) => {
  const index = selectedTaskIds.value.indexOf(taskId)
  if (index > -1) {
    selectedTaskIds.value.splice(index, 1)
  }
}

// 根据 ID 获取任务
const getTaskById = (taskId) => {
  return taskStore.tasks.find(t => t.id === taskId)
}

// 提交
const handleSubmit = () => {
  if (selectedTaskIds.value.length === 0) return
  emit('submit', selectedTaskIds.value)
}

// 重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    searchKeyword.value = ''
    selectedTaskIds.value = []
  }
})

const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

const getCategoryText = (category) => {
  const map = { work: '工作', study: '学习', life: '生活' }
  return map[category] || category
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
  z-index: 2000;
  animation: fadeIn 0.2s;
}

.bottom-sheet {
  width: 96%;
  max-width: 600px;
  max-height: 85vh;
  background: white;
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

/* 当前任务信息 */
.current-task-info {
  padding: 0.75rem;
  background: rgba(139, 92, 246, 0.05);
  border-left: 3px solid #8b5cf6;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-weight: 600;
}

/* 帮助文本 */
.help-text {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.help-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* 搜索框 */
.search-box {
  margin-bottom: 1rem;
}

.search-box input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.search-box input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* 任务列表 */
.task-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover:not(.task-disabled) {
  background: rgba(139, 92, 246, 0.05);
  border-color: #8b5cf6;
}

.task-selected {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.task-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.warning-text {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: #ef4444;
}

/* 已选择的任务 */
.selected-tasks {
  padding: 1rem;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 8px;
}

.selected-tasks h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #666;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  background: white;
  border: 1px solid #8b5cf6;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #333;
}

.selected-tag button {
  border: none;
  background: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.selected-tag button:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* 徽章 */
.badge {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.priority-high {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.priority-medium {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.priority-low {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.category-work {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.category-study {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.category-life {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.badge-completed {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #666;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
