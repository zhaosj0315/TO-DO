<template>
  <div v-if="visible" class="modal-overlay" @click="handleClose">
    <div class="modal-content bottom-sheet" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <div class="drag-handle"></div>
        <h2>🔀 子任务预览</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <!-- 原始任务 -->
      <div class="original-task">
        <div class="section-title">📌 原始任务</div>
        <div class="task-info">
          <strong>{{ originalTask?.text || '未命名任务' }}</strong>
          <p v-if="originalTask?.description">{{ originalTask.description }}</p>
        </div>
      </div>

      <!-- 子任务列表 -->
      <div class="modal-body">
        <div class="section-title">
          🔀 拆分为 {{ localSubtasks.length }} 个子任务
          <span class="total-time">预计总时长: {{ totalEstimatedTime }}分钟</span>
        </div>

        <div v-if="localSubtasks.length === 0" class="empty-state">
          <div class="empty-icon">🤔</div>
          <p>暂无子任务</p>
        </div>

        <div v-else class="subtask-list">
          <div v-for="(subtask, index) in localSubtasks" :key="index" class="subtask-card">
            <div class="subtask-header">
              <span class="subtask-number">{{ index + 1 }}</span>
              <input 
                v-model="subtask.title" 
                class="subtask-title-input" 
                placeholder="子任务标题"
              />
              <button @click="removeSubtask(index)" class="remove-btn" title="删除">
                🗑️
              </button>
            </div>

            <textarea 
              v-model="subtask.description" 
              class="subtask-desc-input" 
              placeholder="子任务描述（可选）"
              rows="2"
            ></textarea>

            <div class="subtask-attrs">
              <select v-model="subtask.priority" class="attr-select">
                <option value="high">⚡ 高</option>
                <option value="medium">📌 中</option>
                <option value="low">📋 低</option>
              </select>

              <select v-model="subtask.category" class="attr-select">
                <option value="work">💼 工作</option>
                <option value="study">📚 学习</option>
                <option value="life">🏠 生活</option>
              </select>

              <input 
                v-model.number="subtask.estimatedMinutes" 
                type="number" 
                class="attr-input"
                placeholder="预计时长(分钟)"
                min="5"
                max="480"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <button @click="handleClose" class="btn-secondary">
          取消
        </button>
        <button 
          @click="handleCreate" 
          class="btn-primary"
          :disabled="localSubtasks.length === 0"
        >
          ✅ 创建全部子任务 ({{ localSubtasks.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  originalTask: {
    type: Object,
    default: () => null
  },
  subtasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'create'])

const localSubtasks = ref([])

watch(() => props.subtasks, (newSubtasks) => {
  localSubtasks.value = JSON.parse(JSON.stringify(newSubtasks)).map(task => ({
    ...task,
    estimatedMinutes: task.estimatedHours ? Math.round(task.estimatedHours * 60) : 30
  }))
}, { immediate: true, deep: true })

const totalEstimatedTime = computed(() => {
  return localSubtasks.value.reduce((sum, task) => sum + (task.estimatedMinutes || 30), 0)
})

const removeSubtask = (index) => {
  console.log('删除子任务:', index)
  localSubtasks.value.splice(index, 1)
}

const handleClose = () => {
  emit('close')
}

const handleCreate = () => {
  if (localSubtasks.value.length === 0) return
  emit('create', localSubtasks.value)
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
  margin-bottom: 0;
  position: relative;
  bottom: 0;
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

.original-task {
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.section-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-time {
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 500;
}

.task-info {
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.task-info strong {
  display: block;
  margin-bottom: 0.25rem;
}

.task-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.subtask-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
}

.subtask-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.subtask-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.subtask-title-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.95rem;
}

.remove-btn {
  background: #ff4444;
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  flex-shrink: 0;
}

.subtask-desc-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  resize: vertical;
}

.subtask-attrs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}

.attr-select,
.attr-input {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.4rem;
  font-size: 0.85rem;
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
