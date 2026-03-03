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

              <select v-model="subtask.type" class="attr-select">
                <option value="today">📅 今天</option>
                <option value="tomorrow">📆 明天</option>
                <option value="this_week">📋 本周内</option>
                <option value="custom_date">🗓️ 指定日期</option>
                <option value="daily">🔄 每天重复</option>
                <option value="weekday">💼 工作日重复</option>
                <option value="weekly">📆 每周重复</option>
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

            <!-- 指定日期时间 -->
            <div v-if="subtask.type === 'custom_date'" class="subtask-datetime">
              <input 
                v-model="subtask.customDate" 
                type="date" 
                class="attr-input"
              />
              <input 
                v-model="subtask.customTime" 
                type="time" 
                class="attr-input"
              />
            </div>

            <!-- 每周重复选择星期 -->
            <div v-if="subtask.type === 'weekly'" class="subtask-weekdays">
              <label class="weekday-label">选择星期：</label>
              <div class="weekday-buttons">
                <button 
                  v-for="day in weekdayOptions" 
                  :key="day.value"
                  :class="['weekday-btn', { active: subtask.weekdays?.includes(day.value) }]"
                  @click="toggleWeekday(subtask, day.value)"
                >
                  {{ day.label }}
                </button>
              </div>
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

// 星期选项
const weekdayOptions = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 0 }
]

// 切换星期选择
const toggleWeekday = (subtask, day) => {
  if (!subtask.weekdays) {
    subtask.weekdays = []
  }
  const index = subtask.weekdays.indexOf(day)
  if (index > -1) {
    subtask.weekdays.splice(index, 1)
  } else {
    subtask.weekdays.push(day)
  }
}

watch(() => props.subtasks, (newSubtasks) => {
  localSubtasks.value = JSON.parse(JSON.stringify(newSubtasks)).map(task => ({
    ...task,
    type: task.type || 'today',
    weekdays: task.weekdays || [],
    customDate: task.customDate || '',
    customTime: task.customTime || '',
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
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
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

/* 日期时间选择 */
.subtask-datetime {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.subtask-datetime .attr-input {
  flex: 1;
}

/* 星期选择 */
.subtask-weekdays {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.weekday-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.weekday-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.weekday-btn {
  width: 36px;
  height: 36px;
  border: 1.5px solid #ddd;
  background: white;
  border-radius: 50%;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.weekday-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.weekday-btn:hover {
  transform: scale(1.1);
}

.modal-footer {
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
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
