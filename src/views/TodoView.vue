<template>
  <div class="container">
    <!-- 顶部栏 -->
    <header class="header">
      <div class="user-info">
        <h1>待办事项</h1>
        <p>{{ currentDate }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-info" @click="showTrash = true">回收站 ({{ taskStore.deletedTasks.length }})</button>
        <button class="btn btn-danger" @click="handleLogout">退出登录</button>
      </div>
    </header>

    <!-- 回收站模态框 -->
    <div v-if="showTrash" class="modal-overlay" @click.self="showTrash = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>回收站</h3>
          <button class="close-btn" @click="showTrash = false">&times;</button>
        </div>
        <div class="modal-body">
          <ul v-if="taskStore.deletedTasks.length > 0">
            <li v-for="task in taskStore.deletedTasks" :key="task.id" class="trash-item">
              <div class="trash-info">
                <span class="trash-title">{{ task.text }}</span>
                <span class="trash-meta">原分类: {{ getCategoryText(task.category) }}</span>
              </div>
              <div class="trash-actions">
                <button class="btn btn-success btn-sm" @click="restoreTask(task.id)">恢复</button>
                <button class="btn btn-danger btn-sm" @click="permanentDelete(task.id)">彻底删除</button>
              </div>
            </li>
          </ul>
          <p v-else class="empty-state">回收站空空如也</p>
        </div>
      </div>
    </div>

    <!-- 任务分类导航 -->
    <nav class="task-filters">
      <div class="filter-group">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          class="filter-btn" 
          :class="{ active: currentFilter === filter.value }"
          @click="setFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </div>
      <div class="category-filter">
        <select v-model="currentCategoryFilter" class="select" @change="filterTasks">
          <option value="all">全部分类</option>
          <option value="work">工作</option>
          <option value="study">学习</option>
          <option value="life">生活</option>
        </select>
      </div>
    </nav>

    <!-- 任务添加区域 -->
    <div class="task-input-section">
      <input 
        type="text" 
        v-model="newTaskText" 
        placeholder="输入新的待办事项..."
        @keyup.enter="addTask"
      >
      <select v-model="newTaskType" class="select">
        <option value="today">仅今天</option>
        <option value="daily">每天</option>
        <option value="weekly">自定义</option>
      </select>
      <select v-model="newTaskCategory" class="select">
        <option value="work">工作</option>
        <option value="study">学习</option>
        <option value="life">生活</option>
      </select>
      <select v-model="newTaskPriority" class="select">
        <option value="medium">中</option>
        <option value="high">高</option>
        <option value="low">低</option>
      </select>
      <div v-if="newTaskType === 'weekly'" class="weekday-select">
        <label>选择星期几 (可多选):</label>
        <div class="weekday-checkboxes">
          <label 
            v-for="(day, index) in weekdays" 
            :key="index"
            class="weekday-checkbox-item"
          >
            <input 
              type="checkbox" 
              :value="index" 
              v-model="selectedWeekdays"
            > {{ day }}
          </label>
        </div>
      </div>
      <button class="btn btn-primary" @click="addTask">添加</button>
    </div>

    <!-- 任务列表 -->
    <div class="task-list">
      <ul v-if="filteredTasks.length > 0">
        <li 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="task-item"
          :class="{
            'task-completed': task.status === TaskStatus.COMPLETED,
            'task-overdue': task.status === TaskStatus.OVERDUE
          }"
        >
          <input 
            type="checkbox" 
            class="task-checkbox" 
            :checked="task.status === TaskStatus.COMPLETED"
            @change="toggleTaskCompletion(task.id)"
          >
          <div class="task-content">
            <span class="task-title">{{ task.text }}</span>
            <div class="task-meta">
              <span class="task-type">{{ getTaskTypeText(task) }}</span>
              <span class="badge" :class="`priority-${task.priority}`">{{ getPriorityText(task.priority) }}</span>
              <span class="badge" :class="`category-${task.category}`">{{ getCategoryText(task.category) }}</span>
              <span v-if="task.type === 'today' && task.status !== TaskStatus.COMPLETED" class="task-countdown">
                {{ getCountdown(task) }}
              </span>
            </div>
          </div>
          <button class="btn btn-danger" style="width: 35px; height: 35px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;" @click="deleteTask(task.id)">
            ×
          </button>
        </li>
      </ul>
      <p v-else class="empty-state">暂无任务</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useTaskStore } from '../stores/taskStore'

const router = useRouter()
const userStore = useUserStore()
const taskStore = useTaskStore()

// 任务状态枚举
const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue'
}

// 响应式数据
const newTaskText = ref('')
const newTaskType = ref('today')
const newTaskCategory = ref('work')
const newTaskPriority = ref('medium')
const selectedWeekdays = ref([])
const currentFilter = ref('all')
const currentCategoryFilter = ref('all')
const countdownInterval = ref(null)
const showTrash = ref(false)

// 筛选选项
const filters = [
  { label: '全部任务', value: 'all' },
  { label: '未完成', value: 'pending' },
  { label: '已完成', value: 'completed' }
]

// 星期几选项
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 计算属性：当前日期
const currentDate = computed(() => {
  const now = new Date()
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
  return now.toLocaleDateString('zh-CN', options)
})

// 计算属性：筛选后的任务
const filteredTasks = computed(() => {
  return taskStore.getFilteredTasks(currentFilter.value, currentCategoryFilter.value)
})

// 方法：设置筛选条件
const setFilter = (filter) => {
  currentFilter.value = filter
  filterTasks()
}

// 方法：筛选任务
const filterTasks = () => {
  // 筛选逻辑已在taskStore中实现
}

// 方法：添加任务
const addTask = async () => {
  if (!newTaskText.value.trim()) return
  
  if (newTaskType.value === 'weekly' && selectedWeekdays.value.length === 0) {
    showNotification('请至少选择一个星期几！', 'error')
    return
  }
  
  const task = {
    text: newTaskText.value.trim(),
    type: newTaskType.value,
    category: newTaskCategory.value,
    priority: newTaskPriority.value,
    weekdays: newTaskType.value === 'weekly' ? selectedWeekdays.value : null
  }
  
  await taskStore.addTask(task)
  
  // 清空输入
  newTaskText.value = ''
  newTaskType.value = 'today'
  newTaskCategory.value = 'work'
  newTaskPriority.value = 'medium'
  selectedWeekdays.value = []
  
  showNotification('任务添加成功！', 'success')
}

// 方法：切换任务完成状态
const toggleTaskCompletion = async (taskId) => {
  await taskStore.toggleTaskCompletion(taskId)
}

// 方法：删除任务
const deleteTask = async (taskId) => {
  await taskStore.deleteTask(taskId)
  showNotification('任务已移至回收站！', 'info')
}

// 方法：恢复任务
const restoreTask = async (taskId) => {
  await taskStore.restoreTask(taskId)
  showNotification('任务已恢复！', 'success')
}

// 方法：彻底删除
const permanentDelete = async (taskId) => {
  if (confirm('确定要永久删除此任务吗？此操作不可撤销。')) {
    await taskStore.permanentDeleteTask(taskId)
    showNotification('任务已永久删除！', 'error')
  }
}

// 方法：退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

// 方法：获取任务类型文本
const getTaskTypeText = (task) => {
  switch (task.type) {
    case 'today':
      return '仅今天'
    case 'daily':
      return '每天'
    case 'weekly':
      if (task.weekdays) {
        const selectedDays = task.weekdays.map(day => weekdays[day]).join(', ')
        return `每周: ${selectedDays}`
      }
      return '每周'
    default:
      return ''
  }
}

// 方法：获取优先级文本
const getPriorityText = (priority) => {
  const priorityMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return priorityMap[priority] || priority
}

// 方法：获取分类文本
const getCategoryText = (category) => {
  const categoryMap = {
    work: '工作',
    study: '学习',
    life: '生活'
  }
  return categoryMap[category] || category
}

// 方法：获取倒计时
const getCountdown = (task) => {
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const remainingTime = endOfDay - now
  
  if (remainingTime > 0) {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60))
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000)
    return `剩余时间: ${hours}小时${minutes}分钟${seconds}秒`
  } else {
    return '已过期'
  }
}

// 方法：显示通知
const showNotification = (message, type = 'info') => {
  // 这里可以使用Element Plus的Notification组件
  console.log(`${type}: ${message}`)
}

// 生命周期钩子：组件挂载时
onMounted(() => {
  // 加载任务
  taskStore.loadTasks()
  
  // 启动倒计时定时器
  countdownInterval.value = setInterval(() => {
    // 触发任务列表更新
    taskStore.checkOverdueTasks()
  }, 1000)
})

// 生命周期钩子：组件卸载时
onUnmounted(() => {
  // 清除定时器
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
})
</script>

<style scoped>
.task-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 1rem;
}

.category-filter {
  display: flex;
  align-items: center;
}

.weekday-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.8rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: white;
}

.weekday-select label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-light);
}

.weekday-checkboxes {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.weekday-checkbox-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.8rem;
  background: var(--background-light);
  border: 2px solid var(--border-color);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.weekday-checkbox-item:hover {
  background: #e9ecef;
  border-color: var(--primary-color);
}

.weekday-checkbox-item input[type="checkbox"] {
  margin-right: 0.3rem;
  transform: scale(1.1);
}

.weekday-checkbox-item:has(input:checked) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.task-checkbox {
  margin-right: 1.25rem;
  transform: scale(1.3);
  cursor: pointer;
  accent-color: var(--primary-color);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-title {
  font-size: 1.15rem;
  font-weight: 600;
  transition: color 0.3s;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
}

.trash-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f5f5f5;
}

.trash-info {
  display: flex;
  flex-direction: column;
}

.trash-title {
  font-weight: 600;
  color: #333;
}

.trash-meta {
  font-size: 0.85rem;
  color: #888;
}

.trash-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}
</style>