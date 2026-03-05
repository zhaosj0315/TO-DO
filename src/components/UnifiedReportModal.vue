<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="unified-report-sheet">
      <div class="modal-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h3>📊 智能报告中心</h3>
        <div style="width: 80px;"></div>
      </div>

      <div class="modal-body">
        <!-- 历史报告提示条 -->
        <div v-if="isHistoryMode" class="history-notice">
          📜 这是 {{ formatHistoryDate(props.historyReport.createdAt) }} 生成的历史报告（只读）
        </div>

        <!-- 报告类型选择 -->
        <div class="report-type-selector">
          <button 
            v-for="type in reportTypes" 
            :key="type.value"
            :class="['type-btn', { active: selectedType === type.value }]"
            :disabled="isHistoryMode"
            @click="selectType(type.value)"
          >
            {{ type.icon }} {{ type.label }}
          </button>
        </div>

        <!-- 自定义日期范围 -->
        <div v-if="selectedType === 'custom'" class="date-range-selector">
          <input v-model="customStartDate" type="date" class="date-input" />
          <span>至</span>
          <input v-model="customEndDate" type="date" class="date-input" />
          <button class="btn btn-primary" @click="generateReport">生成</button>
        </div>

        <!-- 视图切换 -->
        <div v-if="reportGenerated" class="view-switcher">
          <button 
            :class="{ active: viewMode === 'visual' }"
            @click="viewMode = 'visual'"
          >
            📈 可视化
          </button>
          <button 
            :class="{ active: viewMode === 'text' }"
            @click="viewMode = 'text'"
          >
            📝 文本
          </button>
        </div>

        <!-- 加载动画 -->
        <LoadingSpinner
          v-if="generating"
          :visible="generating"
          text="正在生成报告..."
          subText="分析任务数据中"
        />

        <!-- 报告内容 -->
        <div v-if="reportGenerated && !generating" class="report-content-wrapper">
          <!-- 可视化视图 -->
          <div v-show="viewMode === 'visual'" class="visual-view">
            <VisualReportView :reportData="visualData" :reportType="selectedType" />
          </div>

          <!-- 文本视图 -->
          <div v-show="viewMode === 'text'" class="text-view">
            <TextReportView :report="textData" :reportType="selectedType" />
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="reportGenerated && !generating" class="modal-footer">
        <button v-if="!isHistoryMode" class="btn btn-secondary" @click="saveToHistory">💾 保存</button>
        <button v-if="isHistoryMode" class="btn btn-secondary" @click="saveAsNew">📋 另存为</button>
        <button class="btn btn-secondary" @click="exportHTML">📄 导出</button>
        <button class="btn btn-secondary" @click="copyText">📋 复制</button>
        <button v-if="!isHistoryMode" class="btn btn-secondary" @click="showHistory">📚 历史</button>
        <button class="btn btn-primary" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import LoadingSpinner from './LoadingSpinner.vue'
import VisualReportView from './VisualReportView.vue'
import TextReportView from './TextReportView.vue'

const props = defineProps({
  visible: Boolean,
  tasks: {
    type: Array,
    default: () => []
  },
  currentUsername: String,
  historyReport: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'show-history', 'report-saved'])

// 报告类型
const reportTypes = [
  { value: 'daily', label: '日报', icon: '📝' },
  { value: 'weekly', label: '周报', icon: '📅' },
  { value: 'monthly', label: '月报', icon: '📊' },
  { value: 'quarterly', label: '季报', icon: '📈' },
  { value: 'halfyearly', label: '半年报', icon: '📆' },
  { value: 'yearly', label: '年报', icon: '🎯' },
  { value: 'custom', label: '自定义', icon: '🔍' }
]

const selectedType = ref('weekly')
const customStartDate = ref('')
const customEndDate = ref('')
const viewMode = ref('visual')
const generating = ref(false)
const reportGenerated = ref(false)
const visualData = ref(null)
const textData = ref(null)

// 是否为历史报告模式（只读）
const isHistoryMode = computed(() => !!props.historyReport)

// 暴露内部状态和方法给父组件（必须在变量定义之后）
defineExpose({
  reportGenerated,
  handleBackButton: () => {
    if (reportGenerated.value) {
      // 返回到报告类型选择
      reportGenerated.value = false
      visualData.value = null
      textData.value = null
      return true // 表示已处理
    }
    return false // 表示应该关闭弹窗
  }
})

// 选择报告类型
const selectType = (type) => {
  selectedType.value = type
  if (type !== 'custom') {
    generateReport()
  }
}

// 生成报告
const generateReport = async () => {
  // 验证自定义日期
  if (selectedType.value === 'custom') {
    if (!customStartDate.value || !customEndDate.value) {
      alert('请选择开始和结束日期')
      return
    }
    if (new Date(customStartDate.value) > new Date(customEndDate.value)) {
      alert('开始日期不能晚于结束日期')
      return
    }
  }

  generating.value = true
  reportGenerated.value = false

  try {
    // 计算日期范围
    const { startDate, endDate } = calculateDateRange()
    
    // 生成报告数据
    const reportData = await generateUnifiedReport(startDate, endDate)
    
    visualData.value = reportData.visualData
    textData.value = reportData.textData
    reportGenerated.value = true
  } catch (error) {
    console.error('生成报告失败:', error)
    alert('生成报告失败，请重试')
  } finally {
    generating.value = false
  }
}

// 计算日期范围
const calculateDateRange = () => {
  const now = new Date()
  let startDate, endDate

  switch (selectedType.value) {
    case 'daily':
      // 今天 00:00 - 23:59
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'weekly':
      // 本周一 00:00 - 本周日 23:59
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay())
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'monthly':
      // 本月1号 00:00 - 本月最后一天 23:59
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'quarterly':
      // 本季度第一天 - 本季度最后一天
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'halfyearly':
      // 本半年第一天 - 本半年最后一天
      const halfStartMonth = now.getMonth() < 6 ? 0 : 6
      startDate = new Date(now.getFullYear(), halfStartMonth, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), halfStartMonth + 6, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'yearly':
      // 今年1月1号 00:00 - 今年12月31号 23:59
      startDate = new Date(now.getFullYear(), 0, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 11, 31)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'custom':
      startDate = new Date(customStartDate.value)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(customEndDate.value)
      endDate.setHours(23, 59, 59, 999)
      break
  }

  return { startDate, endDate }
}

// 生成统一报告数据
const generateUnifiedReport = async (startDate, endDate) => {
  // 筛选时间范围内的任务
  const filteredTasks = props.tasks.filter(task => {
    const completedAt = task.completed_at ? new Date(task.completed_at) : null
    return completedAt && completedAt >= startDate && completedAt <= endDate
  })

  // 生成基础数据
  const baseData = calculateBaseData(filteredTasks, startDate, endDate)
  
  // 生成可视化数据
  const visualData = generateVisualData(baseData, filteredTasks)
  
  // 生成文本数据
  const textData = generateTextData(baseData, filteredTasks, startDate, endDate)

  return { visualData, textData }
}

// 计算基础数据
const calculateBaseData = (tasks, startDate, endDate) => {
  const completed = tasks.filter(t => t.status === 'completed')
  const totalPomodoros = completed.reduce((sum, t) => sum + (t.estimatedPomodoros || 0), 0)
  
  return {
    totalTasks: tasks.length,
    completedTasks: completed.length,
    completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
    totalPomodoros,
    period: {
      start: startDate.toLocaleDateString('zh-CN'),
      end: endDate.toLocaleDateString('zh-CN')
    }
  }
}

// 生成可视化数据
const generateVisualData = (baseData, tasks) => {
  // 分类统计
  const categories = ['work', 'study', 'life'].map(cat => {
    const catTasks = tasks.filter(t => t.category === cat)
    const completed = catTasks.filter(t => t.status === 'completed')
    return {
      name: cat === 'work' ? '工作' : cat === 'study' ? '学习' : '生活',
      icon: cat === 'work' ? '💼' : cat === 'study' ? '📚' : '🏠',
      total: catTasks.length,
      completed: completed.length,
      rate: catTasks.length > 0 ? Math.round((completed.length / catTasks.length) * 100) : 0,
      pomodoros: completed.reduce((sum, t) => sum + (t.estimatedPomodoros || 0), 0),
      color: cat === 'work' ? '#667eea' : cat === 'study' ? '#f093fb' : '#4facfe'
    }
  })

  // 优先级统计
  const priorities = ['high', 'medium', 'low'].map(pri => {
    const priTasks = tasks.filter(t => t.priority === pri)
    return {
      name: pri === 'high' ? '高优先级' : pri === 'medium' ? '中优先级' : '低优先级',
      total: priTasks.length,
      percentage: tasks.length > 0 ? Math.round((priTasks.length / tasks.length) * 100) : 0,
      color: pri === 'high' ? '#ef4444' : pri === 'medium' ? '#f59e0b' : '#3b82f6'
    }
  })

  return {
    ...baseData,
    categories,
    priorities,
    executiveSummary: `本期共完成 ${baseData.completedTasks} 个任务，完成率 ${baseData.completionRate}%，累计获得 ${baseData.totalPomodoros} 个番茄钟。`
  }
}

// 生成文本数据
const generateTextData = (baseData, tasks, startDate, endDate) => {
  const completed = tasks.filter(t => t.status === 'completed')
  const now = new Date()
  
  // 重点任务（按番茄钟数排序，Top 10）
  const keyTasks = completed
    .sort((a, b) => (b.estimatedPomodoros || 0) - (a.estimatedPomodoros || 0))
    .slice(0, 10)
    .map(task => ({
      id: task.id,
      text: task.text,
      categoryIcon: task.category === 'work' ? '💼' : task.category === 'study' ? '📚' : '🏠',
      categoryText: task.category === 'work' ? '工作' : task.category === 'study' ? '学习' : '生活',
      priorityText: task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低',
      pomodoros: task.estimatedPomodoros || 0,
      time: task.completed_at ? new Date(task.completed_at).toLocaleDateString('zh-CN') : '',
      description: task.description || ''
    }))

  // 获取下期计划（待办任务）
  const pendingTasks = props.tasks.filter(t => t.status === 'pending')
  const nextPlanTasks = pendingTasks
    .sort((a, b) => {
      // 优先级排序：高 > 中 > 低
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 10)
    .map(task => ({
      id: task.id,
      text: task.text,
      categoryIcon: task.category === 'work' ? '💼' : task.category === 'study' ? '📚' : '🏠',
      categoryText: task.category === 'work' ? '工作' : task.category === 'study' ? '学习' : '生活',
      priorityText: task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低',
      pomodoros: task.estimatedPomodoros || 0,
      description: task.description || ''
    }))

  // 风险与问题（逾期任务）
  const overdueTasks = props.tasks.filter(t => t.status === 'overdue')
  const issues = overdueTasks
    .slice(0, 10)
    .map(task => ({
      id: task.id,
      text: task.text,
      categoryIcon: task.category === 'work' ? '💼' : task.category === 'study' ? '📚' : '🏠',
      categoryText: task.category === 'work' ? '工作' : task.category === 'study' ? '学习' : '生活',
      priorityText: task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低',
      description: task.description || ''
    }))

  // 本期目标（高优先级任务）
  const highPriorityCompleted = completed.filter(t => t.priority === 'high')
  const goals = highPriorityCompleted
    .slice(0, 5)
    .map(task => ({
      id: task.id,
      text: task.text,
      categoryIcon: task.category === 'work' ? '💼' : task.category === 'study' ? '📚' : '🏠',
      categoryText: task.category === 'work' ? '工作' : task.category === 'study' ? '学习' : '生活',
      pomodoros: task.estimatedPomodoros || 0,
      description: task.description || ''
    }))

  return {
    period: baseData.period,
    summary: baseData.executiveSummary || `本期共完成 ${baseData.completedTasks} 个任务，完成率 ${baseData.completionRate}%。`,
    overview: {
      totalTasks: baseData.completedTasks,
      highPriority: completed.filter(t => t.priority === 'high').length,
      pomodoros: baseData.totalPomodoros,
      workTasks: completed.filter(t => t.category === 'work').length,
      studyTasks: completed.filter(t => t.category === 'study').length,
      lifeTasks: completed.filter(t => t.category === 'life').length
    },
    keyTasks,
    // 新增章节
    goals: {
      total: highPriorityCompleted.length,
      tasks: goals
    },
    nextPlan: {
      total: pendingTasks.length,
      highPriority: pendingTasks.filter(t => t.priority === 'high').length,
      tasks: nextPlanTasks
    },
    issues: {
      total: overdueTasks.length,
      tasks: issues,
      suggestions: overdueTasks.length > 0 ? [
        '建议优先处理逾期任务，避免影响整体进度',
        '可以考虑将大任务拆分为小任务，提高完成率',
        '合理安排时间，避免任务堆积'
      ] : []
    }
  }
}

// 保存到历史
const saveToHistory = () => {
  const report = {
    id: Date.now(),
    type: selectedType.value,
    period: visualData.value.period,
    visualData: visualData.value,
    textData: textData.value,
    createdAt: new Date().toISOString()
  }
  
  emit('report-saved', report)
  alert('报告已保存到历史')
}

// 另存为新报告（历史模式）
const saveAsNew = () => {
  const report = {
    id: Date.now(),
    type: selectedType.value,
    period: visualData.value.period,
    visualData: visualData.value,
    textData: textData.value,
    createdAt: new Date().toISOString()
  }
  
  emit('report-saved', report)
  alert('已另存为新报告')
}

// 格式化历史日期
const formatHistoryDate = (isoString) => {
  const date = new Date(isoString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 导出HTML
const exportHTML = () => {
  // 复用原有的导出逻辑
  alert('导出功能开发中...')
}

// 复制文本
const copyText = () => {
  const text = formatReportAsText()
  navigator.clipboard.writeText(text).then(() => {
    alert('报告已复制到剪贴板')
  })
}

// 格式化为文本
const formatReportAsText = () => {
  if (!textData.value) return ''
  
  let text = `【${getReportTitle()}】\n`
  text += `报告周期：${textData.value.period.start} 至 ${textData.value.period.end}\n\n`
  
  text += `【智能总结】\n${textData.value.summary}\n\n`
  
  text += `【数据概览】\n`
  text += `完成任务：${textData.value.overview.totalTasks}个\n`
  text += `高优先级：${textData.value.overview.highPriority}个\n`
  text += `番茄钟：${textData.value.overview.pomodoros}个\n`
  text += `💼 工作：${textData.value.overview.workTasks}个\n`
  text += `📚 学习：${textData.value.overview.studyTasks}个\n`
  text += `🏠 生活：${textData.value.overview.lifeTasks}个\n\n`
  
  if (textData.value.goals && textData.value.goals.total > 0) {
    text += `【本期目标】\n`
    text += `高优先级任务：${textData.value.goals.total}个\n`
    textData.value.goals.tasks.forEach((task, index) => {
      text += `${index + 1}. ${task.text} (${task.categoryText}, 🍅${task.pomodoros})\n`
    })
    text += `\n`
  }
  
  if (textData.value.keyTasks && textData.value.keyTasks.length > 0) {
    text += `【重点任务】\n`
    textData.value.keyTasks.forEach((task, index) => {
      text += `${index + 1}. ${task.text} (${task.categoryText}, ⚡${task.priorityText}, 🍅${task.pomodoros})\n`
      if (task.description) {
        text += `   ${task.description}\n`
      }
    })
    text += `\n`
  }
  
  if (textData.value.issues && textData.value.issues.total > 0) {
    text += `【风险与问题】\n`
    text += `共有 ${textData.value.issues.total} 个任务逾期\n`
    if (textData.value.issues.tasks && textData.value.issues.tasks.length > 0) {
      textData.value.issues.tasks.forEach((task, index) => {
        text += `${index + 1}. ${task.text} (${task.categoryText}, ⚡${task.priorityText})\n`
      })
    }
    if (textData.value.issues.suggestions && textData.value.issues.suggestions.length > 0) {
      text += `\n💡 建议：\n`
      textData.value.issues.suggestions.forEach(s => {
        text += `• ${s}\n`
      })
    }
    text += `\n`
  }
  
  if (textData.value.nextPlan && textData.value.nextPlan.total > 0) {
    text += `【下期计划】\n`
    text += `待办任务：${textData.value.nextPlan.total}个 | 高优先级：${textData.value.nextPlan.highPriority}个\n`
    if (textData.value.nextPlan.tasks && textData.value.nextPlan.tasks.length > 0) {
      textData.value.nextPlan.tasks.forEach((task, index) => {
        text += `${index + 1}. ${task.text} (${task.categoryText}, ⚡${task.priorityText}, 🍅${task.pomodoros})\n`
      })
    }
  }
  
  return text
}

// 获取报告标题
const getReportTitle = () => {
  const titles = {
    daily: '日报',
    weekly: '周报',
    monthly: '月报',
    quarterly: '季报',
    halfyearly: '半年报',
    yearly: '年报',
    custom: '自定义报告'
  }
  return titles[selectedType.value] || '报告'
}

// 显示历史
const showHistory = () => {
  emit('show-history')
}

// 监听弹窗显示
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 如果有历史报告数据，加载它
    if (props.historyReport) {
      selectedType.value = props.historyReport.type
      visualData.value = props.historyReport.visualData
      textData.value = props.historyReport.textData
      reportGenerated.value = true
      generating.value = false
    } else if (!reportGenerated.value) {
      // 否则生成新报告
      generateReport()
    }
  }
})
</script>

<style scoped>
/* Modal Overlay */
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
  animation: fadeIn 0.2s ease-out;
  padding: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Bottom Sheet */
.unified-report-sheet {
  width: 100%;
  max-height: 92vh;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  flex-shrink: 0;
  position: relative;
}

/* 顶部小横条 */
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
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: white;
  padding: 0.5rem;
}

.back-btn:hover {
  opacity: 0.8;
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

/* 历史报告提示条 */
.history-notice {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 4px solid #f59e0b;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #92400e;
  font-weight: 500;
}

/* 报告类型选择器 */
.report-type-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.type-btn {
  flex: 1;
  min-width: 80px;
  padding: 0.75rem 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.type-btn:hover:not(:disabled) {
  border-color: #667eea;
  transform: translateY(-2px);
}

.type-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.type-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 日期范围选择器 */
.date-range-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.date-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* 视图切换器 */
.view-switcher {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.view-switcher button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.view-switcher button:hover {
  transform: translateY(-2px);
}

.view-switcher button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 报告内容 */
.report-content-wrapper {
  min-height: 300px;
}

.visual-view,
.text-view {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 底部操作栏 */
.modal-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 70px;
  padding: 0.75rem 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
