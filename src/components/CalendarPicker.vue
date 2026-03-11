<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="calendar-modal" @click.stop>
      <!-- 头部 -->
      <div class="calendar-header">
        <button class="nav-btn" @click="prevMonth">◀</button>
        <div class="month-year">{{ currentYear }}年{{ currentMonth }}月</div>
        <button class="nav-btn" @click="nextMonth">▶</button>
      </div>

      <!-- 星期标题 -->
      <div class="weekdays">
        <div class="weekday">日</div>
        <div class="weekday">一</div>
        <div class="weekday">二</div>
        <div class="weekday">三</div>
        <div class="weekday">四</div>
        <div class="weekday">五</div>
        <div class="weekday">六</div>
      </div>

      <!-- 日期网格 -->
      <div class="days-grid">
        <div
          v-for="day in calendarDays"
          :key="day.key"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'selected': day.isSelected,
            'disabled': day.isPast
          }"
          @click="selectDate(day)"
        >
          {{ day.date }}
        </div>
      </div>

      <!-- 时间选择 -->
      <div class="time-picker">
        <label>时间：</label>
        <select v-model="selectedHour" class="time-select">
          <option v-for="h in 24" :key="h" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}</option>
        </select>
        <span>:</span>
        <select v-model="selectedMinute" class="time-select">
          <option v-for="m in 12" :key="m" :value="(m - 1) * 5">{{ String((m - 1) * 5).padStart(2, '0') }}</option>
        </select>
      </div>

      <!-- 底部按钮 -->
      <div class="calendar-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" @click="confirm">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  initialValue: String  // YYYY-MM-DDTHH:mm 格式
})

const emit = defineEmits(['close', 'confirm'])

// 当前显示的年月
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

// 选中的日期和时间
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedDay = ref(new Date().getDate())
const selectedHour = ref(new Date().getHours())
const selectedMinute = ref(0)

// 初始化
onMounted(() => {
  if (props.initialValue) {
    const date = new Date(props.initialValue)
    selectedYear.value = date.getFullYear()
    selectedMonth.value = date.getMonth() + 1
    selectedDay.value = date.getDate()
    selectedHour.value = date.getHours()
    selectedMinute.value = date.getMinutes()
    currentYear.value = date.getFullYear()
    currentMonth.value = date.getMonth() + 1
  }
})

// 生成日历数据
const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)
  const prevLastDay = new Date(currentYear.value, currentMonth.value - 1, 0)
  
  const firstDayWeek = firstDay.getDay()
  const lastDayDate = lastDay.getDate()
  const prevLastDayDate = prevLastDay.getDate()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 上个月的日期
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const date = prevLastDayDate - i
    const dayDate = new Date(currentYear.value, currentMonth.value - 2, date)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isPast: dayDate < today,
      key: `prev-${date}`
    })
  }
  
  // 当前月的日期
  for (let date = 1; date <= lastDayDate; date++) {
    const dayDate = new Date(currentYear.value, currentMonth.value - 1, date)
    dayDate.setHours(0, 0, 0, 0)
    
    days.push({
      date,
      isCurrentMonth: true,
      isToday: dayDate.getTime() === today.getTime(),
      isSelected: 
        selectedYear.value === currentYear.value &&
        selectedMonth.value === currentMonth.value &&
        selectedDay.value === date,
      isPast: dayDate < today,
      key: `current-${date}`,
      fullDate: dayDate
    })
  }
  
  // 下个月的日期（补齐6行）
  const remainingDays = 42 - days.length
  for (let date = 1; date <= remainingDays; date++) {
    const dayDate = new Date(currentYear.value, currentMonth.value, date)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isPast: dayDate < today,
      key: `next-${date}`
    })
  }
  
  return days
})

// 上一月
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

// 下一月
const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// 选择日期
const selectDate = (day) => {
  if (!day.isCurrentMonth || day.isPast) return
  
  selectedYear.value = currentYear.value
  selectedMonth.value = currentMonth.value
  selectedDay.value = day.date
}

// 确认
const confirm = () => {
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`
  const timeStr = `${String(selectedHour.value).padStart(2, '0')}:${String(selectedMinute.value).padStart(2, '0')}`
  const dateTimeStr = `${dateStr}T${timeStr}`
  
  emit('confirm', dateTimeStr)
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
  align-items: center;
  justify-content: center;
  z-index: 100002;
  animation: fadeIn 0.2s;
}

.calendar-modal {
  background: white;
  border-radius: 16px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 头部 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.month-year {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.nav-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.nav-btn:active {
  transform: scale(0.95);
}

/* 星期标题 */
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  padding: 8px 0;
}

/* 日期网格 */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 16px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
  color: #1f2937;
}

.day-cell:active {
  transform: scale(0.95);
}

.day-cell.other-month {
  color: #d1d5db;
  background: transparent;
}

.day-cell.today {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  font-weight: 600;
}

.day-cell.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.day-cell.disabled {
  color: #d1d5db;
  cursor: not-allowed;
  opacity: 0.5;
}

.day-cell:not(.other-month):not(.disabled):not(.selected):not(.today):hover {
  background: #e5e7eb;
}

/* 时间选择 */
.time-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.time-picker label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #4b5563;
}

.time-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
}

.time-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* 底部按钮 */
.calendar-footer {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:active {
  background: #e5e7eb;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-confirm:active {
  transform: scale(0.98);
}
</style>
