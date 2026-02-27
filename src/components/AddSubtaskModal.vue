<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content bottom-sheet">
      <div class="modal-header">
        <h3>➕ 添加子任务</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- 父任务信息 -->
        <div class="parent-task-info">
          <span class="info-label">父任务：</span>
          <span class="info-value">{{ parentTask.text }}</span>
        </div>

        <!-- 任务名称 -->
        <div class="form-group">
          <label>任务名称 *</label>
          <input 
            v-model="formData.text" 
            type="text" 
            placeholder="输入子任务名称..."
            maxlength="100"
            @keyup.enter="handleSubmit"
          >
          <span class="char-count">{{ formData.text.length }}/100</span>
        </div>

        <!-- 任务描述 -->
        <div class="form-group">
          <label>任务描述</label>
          <textarea 
            v-model="formData.description" 
            placeholder="详细描述子任务..."
            rows="3"
            maxlength="500"
          ></textarea>
          <span class="char-count">{{ formData.description.length }}/500</span>
        </div>

        <!-- 任务属性 -->
        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <select v-model="formData.priority">
              <option value="high">⚡ 高</option>
              <option value="medium">⚡ 中</option>
              <option value="low">⚡ 低</option>
            </select>
          </div>

          <div class="form-group">
            <label>分类</label>
            <select v-model="formData.category">
              <option value="work">💼 工作</option>
              <option value="study">📚 学习</option>
              <option value="life">🏠 生活</option>
            </select>
          </div>
        </div>

        <!-- 任务类型 -->
        <div class="form-group">
          <label>任务类型</label>
          <select v-model="formData.type">
            <option value="today">今天</option>
            <option value="tomorrow">明天</option>
            <option value="this_week">本周内</option>
            <option value="custom_date">指定日期</option>
          </select>
        </div>

        <!-- 自定义日期时间 -->
        <div v-if="formData.type === 'custom_date'" class="form-row">
          <div class="form-group">
            <label>日期</label>
            <input v-model="formData.customDate" type="date">
          </div>
          <div class="form-group">
            <label>时间</label>
            <input v-model="formData.customTime" type="time">
          </div>
        </div>

        <!-- 继承设置提示 -->
        <div class="inherit-info">
          <span class="info-icon">ℹ️</span>
          <span class="info-text">
            子任务将继承父任务的分类和截止时间（可修改）
          </span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn-primary" @click="handleSubmit" :disabled="!formData.text.trim()">
          ✓ 添加子任务
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  parentTask: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  text: '',
  description: '',
  priority: 'medium',
  category: props.parentTask.category || 'work',
  type: 'today',
  customDate: '',
  customTime: ''
})

// 重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value = {
      text: '',
      description: '',
      priority: 'medium',
      category: props.parentTask.category || 'work',
      type: 'today',
      customDate: '',
      customTime: ''
    }
  }
})

const handleSubmit = () => {
  if (!formData.value.text.trim()) return
  emit('submit', formData.value)
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

/* 父任务信息 */
.parent-task-info {
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

/* 表单组 */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* 继承信息提示 */
.inherit-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 6px;
  margin-top: 1rem;
}

.info-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.info-text {
  font-size: 0.85rem;
  color: #666;
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
