<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>➕ 批量迁入任务到"{{ collectionName }}"</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <p class="tip">从其他地方选择要迁入的任务</p>
      
      <!-- 🆕 搜索框 -->
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="🔍 搜索任务标题或描述..."
          class="search-input"
        />
        <span v-if="searchKeyword" class="clear-btn" @click="searchKeyword = ''">✕</span>
      </div>
      
      <div class="task-list">
        <label 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="task-item"
          :class="{ selected: selectedTaskIds.includes(task.id) }"
        >
          <input 
            type="checkbox" 
            :value="task.id" 
            v-model="selectedTaskIds"
          />
          <div class="task-info">
            <div class="task-title">{{ task.text }}</div>
            <div class="task-meta">
              <span class="badge badge-collection">{{ getTaskCollectionName(task) }}</span>
              <span class="badge">{{ getCategoryText(task.category) }}</span>
              <span class="badge">{{ getPriorityText(task.priority) }}</span>
            </div>
          </div>
        </label>
        
        <div v-if="filteredTasks.length === 0" class="empty-state">
          <p v-if="searchKeyword">🔍 没有找到匹配的任务</p>
          <p v-else>📂 没有可迁入的任务</p>
        </div>
      </div>
      
      <div class="buttons">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button 
          class="btn-confirm" 
          @click="handleAdd"
          :disabled="selectedTaskIds.length === 0"
        >
          迁入 {{ selectedTaskIds.length > 0 ? `(${selectedTaskIds.length})` : '' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const props = defineProps(['collectionId', 'collectionName', 'allTasks', 'allCollections'])
const emit = defineEmits(['close', 'added'])

const store = useOfflineTaskStore()
const selectedTaskIds = ref([])
const searchKeyword = ref('')

// 🆕 可迁入的任务：只显示未分类的任务（collectionId === null）
const availableTasks = computed(() => {
  return props.allTasks.filter(t => t.collectionId === null)
})

// 🆕 搜索过滤
const filteredTasks = computed(() => {
  if (!searchKeyword.value.trim()) {
    return availableTasks.value
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  return availableTasks.value.filter(task => 
    task.text.toLowerCase().includes(keyword) || 
    (task.description && task.description.toLowerCase().includes(keyword))
  )
})

const getTaskCollectionName = (task) => {
  if (!task.collectionId) return '📂未分类'
  const collection = props.allCollections.find(c => c.id === task.collectionId)
  return collection ? `${collection.icon}${collection.name}` : '未知'
}

const getCategoryText = (category) => {
  const map = { work: '💼工作', study: '📚学习', life: '🏠生活' }
  return map[category] || category
}

const getPriorityText = (priority) => {
  const map = { high: '⚡高', medium: '⚡中', low: '⚡低' }
  return map[priority] || priority
}

const handleAdd = async () => {
  await store.batchSetTaskCollection(selectedTaskIds.value, props.collectionId)
  emit('added', selectedTaskIds.value.length)
  emit('close')
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
  z-index: 10000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  flex: 1;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.tip {
  margin: 0 0 16px 0;
  color: #666;
}

.search-box {
  position: relative;
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #8b5cf6;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #d1d5db;
  color: white;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #9ca3af;
  transform: translateY(-50%) scale(1.1);
}

.task-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  max-height: 400px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: #8b5cf6;
  background: #f9f9f9;
}

.task-item.selected {
  border-color: #8b5cf6;
  background: #f3f0ff;
}

.task-item input[type="checkbox"] {
  margin-top: 2px;
  cursor: pointer;
}

.task-info {
  flex: 1;
}

.task-title {
  font-weight: 500;
  margin-bottom: 6px;
}

.task-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f0f0f0;
}

.badge-collection {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.buttons {
  display: flex;
  gap: 12px;
}

.buttons button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
