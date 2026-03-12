<template>
  <div class="calendar-modal" @click.self="$emit('close')">
    <div class="calendar-container">
      <!-- 关闭按钮 -->
      <button class="close-btn-top" @click="$emit('close')">✕</button>
      
      <div class="calendar-view">
    <!-- 头部：月份切换 -->
    <div class="calendar-header">
      <button @click="prevMonth" class="nav-btn">◀</button>
      <div class="month-title">{{ currentMonthText }}</div>
      <button @click="nextMonth" class="nav-btn">▶</button>
      <button @click="goToday" class="today-btn">今天</button>
    </div>

    <!-- 星期标题 -->
    <div class="weekdays">
      <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
    </div>

    <!-- 日期网格 -->
    <div class="calendar-grid">
      <div
        v-for="day in calendarDays"
        :key="day.dateStr"
        class="day-cell"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'selected': day.dateStr === selectedDateStr
        }"
        @click="selectDate(day)"
      >
        <div class="day-number">{{ day.date.getDate() }}</div>
        <div v-if="day.tasks.length > 0" class="task-indicators">
          <span v-if="day.highCount > 0" class="dot high">🔴</span>
          <span v-if="day.mediumCount > 0" class="dot medium">🟡</span>
          <span v-if="day.lowCount > 0" class="dot low">🟢</span>
          <div class="task-count">{{ day.tasks.length }}</div>
        </div>
      </div>
    </div>

    <!-- 底部弹窗：显示选中日期的任务 -->
    <div v-if="showDayTasks" class="day-tasks-modal" @click.self="closeDayTasks">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📅 {{ selectedDateText }}</h3>
          <button @click="closeDayTasks" class="close-btn">✕</button>
        </div>
        
        <div class="tasks-list">
          <!-- 已完成 -->
          <div v-if="completedTasks.length > 0" class="task-section">
            <div class="section-title">✅ 已完成 ({{ completedTasks.length }})</div>
            <div v-for="task in completedTasks" :key="task.id" class="task-item completed">
              <span class="task-text">{{ task.text }}</span>
            </div>
          </div>

          <!-- 待办 -->
          <div v-if="pendingTasks.length > 0" class="task-section">
            <div class="section-title">⏳ 待办 ({{ pendingTasks.length }})</div>
            <div
              v-for="task in pendingTasks"
              :key="task.id"
              class="task-item"
              @click="openTaskDetail(task)"
            >
              <span class="priority-dot" :class="task.priority">
                {{ task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢' }}
              </span>
              <span class="task-text">{{ task.text }}</span>
            </div>
          </div>

          <!-- 无任务 -->
          <div v-if="selectedDayTasks.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">这天没有任务</div>
          </div>
        </div>

        <!-- 快速创建按钮 -->
        <button @click="quickCreateTask" class="quick-create-btn">
          ➕ 快速创建任务
        </button>
      </div>
    </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'

// 定义 emit
const emit = defineEmits(['close'])

const taskStore = useOfflineTaskStore()

// 当前显示的年月
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

// 选中的日期
const selectedDateStr = ref('')
const showDayTasks = ref(false)

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 当前月份文本
const currentMonthText = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

// 选中日期文本
const selectedDateText = computed(() => {
  if (!selectedDateStr.value) return ''
  const date = new Date(selectedDateStr.value)
  const today = new Date()
  const isToday = isSameDay(date, today)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${isToday ? '（今天）' : ''}`
})

// 生成日历天数（42天 = 6周）
const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const startDay = firstDay.getDay() // 0-6
  
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDay)
  
  const days = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    const dateStr = formatDate(date)
    const tasks = getTasksOnDate(date)
    
    days.push({
      date,
      dateStr,
      isCurrentMonth: date.getMonth() === currentMonth.value,
      isToday: isSameDay(date, new Date()),
      tasks,
      highCount: tasks.filter(t => t.priority === 'high').length,
      mediumCount: tasks.filter(t => t.priority === 'medium').length,
      lowCount: tasks.filter(t => t.priority === 'low').length
    })
  }
  
  return days
})

// 选中日期的任务
const selectedDayTasks = computed(() => {
  if (!selectedDateStr.value) return []
  const date = new Date(selectedDateStr.value)
  return getTasksOnDate(date)
})

const completedTasks = computed(() => {
  return selectedDayTasks.value.filter(t => t.status === 'completed')
})

const pendingTasks = computed(() => {
  return selectedDayTasks.value.filter(t => t.status !== 'completed')
})

// 获取指定日期的任务
function getTasksOnDate(date) {
  const allTasks = taskStore.filteredTasks || taskStore.tasks || []
  return allTasks.filter(task => {
    const deadline = getTaskDeadline(task)
    return deadline && isSameDay(deadline, date)
  })
}

// 获取任务截止日期
function getTaskDeadline(task) {
  if (task.type === 'today') {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59)
  } else if (task.type === 'tomorrow') {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59)
  } else if (task.type === 'custom_date' && task.customDate) {
    const [year, month, day] = task.customDate.split('-').map(Number)
    const hour = task.customTime ? parseInt(task.customTime.split(':')[0]) : 23
    const minute = task.customTime ? parseInt(task.customTime.split(':')[1]) : 59
    return new Date(year, month - 1, day, hour, minute)
  }
  return null
}

// 判断是否同一天
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 上一月
function prevMonth() {
  if (currentMonth.value === 0) {
    currentYear.value--
    currentMonth.value = 11
  } else {
    currentMonth.value--
  }
}

// 下一月
function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++
    currentMonth.value = 0
  } else {
    currentMonth.value++
  }
}

// 回到今天
function goToday() {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth()
}

// 选择日期
function selectDate(day) {
  selectedDateStr.value = day.dateStr
  showDayTasks.value = true
}

// 关闭日期任务弹窗
function closeDayTasks() {
  showDayTasks.value = false
}

// 打开任务详情
function openTaskDetail(task) {
  // 触发父组件的任务详情事件
  // 这里需要通过 emit 或者直接调用 taskStore 的方法
  closeDayTasks()
}

// 快速创建任务
function quickCreateTask() {
  // 预填选中的日期
  const date = new Date(selectedDateStr.value)
  // 触发父组件的创建任务事件，传入预填日期
  closeDayTasks()
}
</script>

<style scoped>
/* 全屏弹窗 */
.calendar-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s;
}

.calendar-container {
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  overflow-y: auto;
  position: relative;
  animation: slideIn 0.3s;
}

.close-btn-top {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f3f4f6;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  z-index: 10;
  transition: all 0.2s;
}

.close-btn-top:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.calendar-view {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

/* 头部 */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.month-title {
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.nav-btn, .today-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.nav-btn:hover, .today-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* 星期标题 */
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
  font-weight: 600;
  color: #666;
  text-align: center;
}

.weekday {
  padding: 0.5rem;
}

/* 日期网格 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  min-height: 80px;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.day-cell:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.today {
  border: 2px solid #8b5cf6;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
}

.day-cell.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.day-number {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.task-indicators {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dot {
  font-size: 0.6rem;
}

.task-count {
  font-size: 0.75rem;
  color: #666;
  margin-top: 2px;
}

.day-cell.selected .task-count {
  color: white;
}

/* 底部弹窗 */
.day-tasks-modal {
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

.modal-content {
  width: 100%;
  max-height: 70vh;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 1.5rem;
  animation: slideUp 0.3s;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.close-btn {
  background: #f3f4f6;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
}

.tasks-list {
  margin-bottom: 1rem;
}

.task-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-text {
  text-decoration: line-through;
}

.priority-dot {
  font-size: 0.8rem;
}

.task-text {
  flex: 1;
  font-size: 0.95rem;
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

.empty-text {
  font-size: 1rem;
}

.quick-create-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .calendar-view {
    padding: 0.5rem;
  }

  .day-cell {
    min-height: 60px;
    padding: 0.25rem;
  }

  .day-number {
    font-size: 0.85rem;
  }

  .task-count {
    font-size: 0.7rem;
  }
}
</style>
