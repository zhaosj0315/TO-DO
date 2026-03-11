<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content bottom-sheet">
      <div class="modal-header">
        <h3>➕ 添加子任务</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- 父任务信息 -->
        <div v-if="parentTask?.text" class="parent-task-info">
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

        <!-- 时间安排 -->
        <div class="form-group">
          <label>时间安排</label>
          <select v-model="formData.type" @change="handleTypeChange">
            <option value="today">今天</option>
            <option value="tomorrow">明天</option>
            <option value="day_after_tomorrow">后天</option>
            <option value="this_week">本周内</option>
            <option value="next_week">下周</option>
            <option value="this_month">本月内</option>
            <option value="custom_date">指定日期</option>
            <option value="daily">每天重复</option>
            <option value="weekday">工作日重复</option>
            <option value="weekly">每周重复</option>
            <option value="monthly">每月重复</option>
          </select>
        </div>

        <!-- 自定义日期时间 -->
        <div v-if="formData.type === 'custom_date'" class="form-group">
          <label>截止时间</label>
          <button 
            @click="showCalendar = true"
            class="calendar-btn"
          >
            {{ formatDateTime(formData.customDate, formData.customTime) }}
          </button>
        </div>

        <!-- 每周重复 - 选择星期 -->
        <div v-if="formData.type === 'weekly'" class="form-group">
          <label>重复周期</label>
          <button 
            @click="showWeekdaySelector = true"
            class="calendar-btn"
          >
            {{ formatWeekdays(formData.weekdays) }}
          </button>
        </div>

        <!-- 每月重复 - 选择日期 -->
        <div v-if="formData.type === 'monthly'" class="form-group">
          <label>每月几号</label>
          <input 
            type="number" 
            v-model.number="formData.monthDay" 
            min="1" 
            max="31" 
            placeholder="1-31"
            class="month-day-input"
          />
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

    <!-- 日历选择器 -->
    <CalendarPicker
      v-if="showCalendar"
      :initial-value="getInitialDateTime()"
      @close="showCalendar = false"
      @confirm="handleCalendarConfirm"
    />

    <!-- 星期选择器 -->
    <div v-if="showWeekdaySelector" class="modal-overlay" @click.self="showWeekdaySelector = false">
      <div class="weekday-selector-modal">
        <div class="modal-header">
          <h3>选择重复周期</h3>
          <button class="btn-close" @click="showWeekdaySelector = false">✕</button>
        </div>
        <div class="weekday-grid">
          <label v-for="(day, index) in weekdayOptions" :key="index" class="weekday-item">
            <input type="checkbox" :value="index" v-model="formData.weekdays">
            <span>{{ day }}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="showWeekdaySelector = false">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import CalendarPicker from './CalendarPicker.vue'

const props = defineProps({
  visible: Boolean,
  parentTask: {
    type: Object,
    default: () => ({ category: 'work' })
  },
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const showCalendar = ref(false)
const showWeekdaySelector = ref(false)
const weekdayOptions = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const formData = ref({
  text: '',
  description: '',
  priority: 'medium',
  category: props.parentTask.category || 'work',
  type: 'today',
  customDate: '',
  customTime: '',
  weekdays: [],
  monthDay: 1
})

// 处理类型变化
const handleTypeChange = () => {
  if (formData.value.type === 'weekly' && formData.value.weekdays.length === 0) {
    showWeekdaySelector.value = true
  }
  // monthly类型切换时，如果没有设置日期，设置默认值为1号
  if (formData.value.type === 'monthly' && !formData.value.monthDay) {
    formData.value.monthDay = 1
  }
}

// 格式化星期显示
const formatWeekdays = (weekdays) => {
  if (!weekdays || weekdays.length === 0) return '点击选择星期'
  return weekdays.map(i => weekdayOptions[i]).join('、')
}

// 获取初始日期时间
const getInitialDateTime = () => {
  if (formData.value.customDate && formData.value.customTime) {
    return `${formData.value.customDate}T${formData.value.customTime}`
  }
  return ''
}

// 处理日历确认
const handleCalendarConfirm = (dateTimeStr) => {
  const [date, time] = dateTimeStr.split('T')
  formData.value.customDate = date
  formData.value.customTime = time
  showCalendar.value = false
}

// 格式化日期时间显示
const formatDateTime = (date, time) => {
  if (!date) return '点击选择日期时间'
  const d = new Date(`${date}T${time || '23:59'}`)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
}

// 重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value = {
      text: props.initialData?.text || '',
      description: props.initialData?.description || '',
      priority: props.initialData?.priority || 'medium',
      category: props.initialData?.category || props.parentTask?.category || 'work',
      type: 'today',
      customDate: '',
      customTime: '',
      weekdays: [],
      monthDay: 1,
      estimatedDuration: props.initialData?.estimatedDuration || 60
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
  z-index: 9999;
  animation: fadeIn 0.3s ease;
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
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
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
  padding: 1.5rem 1rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  flex-shrink: 0;
}

.modal-header::before {
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

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  flex: 1;
  text-align: center;
}

.btn-close {
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
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
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

/* 日历按钮 */
.calendar-btn {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: #1f2937;
}

.calendar-btn:hover {
  background: #f9fafb;
  border-color: #8b5cf6;
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

/* 星期选择器 */
.weekday-selector-modal {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 500px;
  animation: slideUp 0.3s ease-out;
}

.weekday-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1.25rem;
}

.weekday-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.weekday-item input[type="checkbox"] {
  display: none;
}

.weekday-item input[type="checkbox"]:checked + span {
  color: white;
}

.weekday-item:has(input:checked) {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border-color: #8b5cf6;
}

.weekday-item span {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  transition: color 0.2s;
}

/* 每月重复日期输入 */
.month-day-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.month-day-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
</style>
