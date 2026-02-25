<template>
  <div v-if="visible" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <div class="drag-handle"></div>
        <h2>📋 AI 提取的任务</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <!-- 任务列表 -->
      <div class="modal-body">
        <div v-if="tasks.length === 0" class="empty-state">
          <div class="empty-icon">🤔</div>
          <p>未识别到任务</p>
        </div>

        <div v-else class="task-list">
          <div v-for="(task, index) in tasks" :key="index" class="task-preview-card">
            <div class="task-header">
              <input 
                v-model="task.title" 
                class="task-title-input" 
                placeholder="任务标题"
              />
              <button @click="removeTask(index)" class="remove-btn" title="删除">
                🗑️
              </button>
            </div>

            <textarea 
              v-model="task.description" 
              class="task-desc-input" 
              placeholder="任务描述（可选）"
              rows="2"
            ></textarea>

            <div class="task-attrs">
              <select v-model="task.priority" class="attr-select">
                <option value="high">⚡ 高优先级</option>
                <option value="medium">📌 中优先级</option>
                <option value="low">📋 低优先级</option>
              </select>

              <select v-model="task.category" class="attr-select">
                <option value="work">💼 工作</option>
                <option value="study">📚 学习</option>
                <option value="life">🏠 生活</option>
              </select>

              <input 
                v-model="task.deadline" 
                type="datetime-local" 
                class="attr-input"
                placeholder="截止时间"
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
          @click="handleCreateAll" 
          class="btn-primary"
          :disabled="tasks.length === 0"
        >
          ✅ 创建全部 ({{ tasks.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  extractedTasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'create'])

const tasks = ref([])

watch(() => props.extractedTasks, (newTasks) => {
  tasks.value = JSON.parse(JSON.stringify(newTasks))
}, { immediate: true })

const removeTask = (index) => {
  tasks.value.splice(index, 1)
}

const handleClose = () => {
  emit('close')
}

const handleCreateAll = () => {
  if (tasks.value.length === 0) return
  emit('create', tasks.value)
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
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.drag-handle {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.modal-header h2 {
  flex: 1;
  margin: 0;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-preview-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  transition: all 0.2s;
}

.task-preview-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.task-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.task-title-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
}

.task-title-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.remove-btn {
  background: #fee;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #fcc;
}

.task-desc-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  resize: vertical;
  font-family: inherit;
}

.task-desc-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.task-attrs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.attr-select,
.attr-input {
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
}

.attr-input {
  grid-column: 1 / -1;
}

.attr-select:focus,
.attr-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.75rem;
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
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
