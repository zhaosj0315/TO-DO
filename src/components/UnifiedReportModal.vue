<template>
  <!-- 主报告弹窗 -->
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')" :style="{ zIndex: isHistoryMode ? 10010 : 10008 }">
    <div class="unified-report-sheet">
      <div class="modal-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h3>📊 报告中心</h3>
        <button v-if="!isHistoryMode" class="history-btn" @click="$emit('show-history')" title="报告历史">
          📚
        </button>
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
        <button class="btn btn-ai" @click="generateAIReport">🤖 AI汇报</button>
        <button v-if="!isHistoryMode" class="btn btn-secondary" @click="saveToHistory">💾 保存</button>
        <button v-if="isHistoryMode" class="btn btn-secondary" @click="saveAsNew">📋 另存为</button>
        <button class="btn btn-secondary" @click="exportHTML">📄 导出</button>
        <button class="btn btn-secondary" @click="copyText">📋 复制</button>
        <button class="btn btn-primary" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>

  <!-- AI工作汇报弹窗 -->
  <div v-if="showAIReportModal" class="modal-overlay ai-overlay" @click.self="showAIReportModal = false">
    <div class="ai-report-modal">
      <div class="modal-header">
        <button class="back-btn" @click="showAIReportModal = false">
          <span>← 返回</span>
        </button>
        <h3>🤖 AI工作汇报</h3>
        <div style="width: 80px;"></div>
      </div>

      <div class="modal-body">
        <LoadingSpinner
          v-if="generatingAIReport"
          :visible="generatingAIReport"
          text="AI正在生成汇报..."
          subText="请稍候"
        />

        <div v-else class="ai-report-content">
          <pre class="report-text">{{ aiReportText }}</pre>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="copyAIReport">📋 复制</button>
        <button class="btn btn-secondary" @click="exportAIReport">📄 导出</button>
        <button class="btn btn-primary" @click="showAIReportModal = false">关闭</button>
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
import { AIReportGenerator } from '../services/aiReportGenerator.js'
import { AIWorkReportGenerator } from '../services/aiWorkReportGenerator.js'

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

// AI工作汇报相关
const showAIReportModal = ref(false)
const generatingAIReport = ref(false)
const aiReportText = ref('')

// 是否为历史报告模式（只读）
const isHistoryMode = computed(() => !!props.historyReport)

// 暴露内部状态和方法给父组件（必须在变量定义之后）
defineExpose({
  reportGenerated,
  showAIReportModal,
  handleBackButton: () => {
    // 第一层：AI汇报弹窗
    if (showAIReportModal.value) {
      showAIReportModal.value = false
      return true
    }
    // 第二层：报告详情
    if (reportGenerated.value) {
      reportGenerated.value = false
      visualData.value = null
      textData.value = null
      return true
    }
    return false // 关闭整个弹窗
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
      // 本周一 00:00 - 今天 23:59
      const dayOfWeek = now.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 周日算上周，需要回退6天
      
      startDate = new Date(now)
      startDate.setDate(now.getDate() - daysFromMonday)
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'monthly':
      // 本月1号 00:00 - 今天 23:59
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'quarterly':
      // 本季度第一天 - 今天 23:59
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'halfyearly':
      // 本半年第一天 - 今天 23:59
      const halfStartMonth = now.getMonth() < 6 ? 0 : 6
      startDate = new Date(now.getFullYear(), halfStartMonth, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'yearly':
      // 今年1月1号 00:00 - 今天 23:59
      startDate = new Date(now.getFullYear(), 0, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
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
  // 使用 AIReportGenerator 生成完整报告
  const generator = new AIReportGenerator(props.tasks)
  const textData = generator.generateReport(startDate, endDate, selectedType.value)
  
  // 筛选时间范围内的任务（按完成时间筛选）
  const filteredTasks = props.tasks.filter(task => {
    const completedAt = task.completed_at ? new Date(task.completed_at) : null
    return completedAt && completedAt >= startDate && completedAt <= endDate
  })
  
  const completed = filteredTasks.filter(t => t.status === 'completed')
  const totalPomodoros = completed.reduce((sum, t) => {
    if (t.pomodoroHistory) {
      return sum + t.pomodoroHistory.filter(p => p.completed).length
    }
    return sum
  }, 0)
  
  const visualData = {
    period: textData.period,
    totalPomodoros,
    completedTasks: textData.overview.totalTasks,
    completionRate: textData.overview.completionRate,
    executiveSummary: textData.summary,
    categories: [
      {
        name: '工作',
        icon: '💼',
        total: filteredTasks.filter(t => t.category === 'work').length,
        completed: filteredTasks.filter(t => t.category === 'work' && t.status === 'completed').length,
        rate: filteredTasks.filter(t => t.category === 'work').length > 0 
          ? Math.round((filteredTasks.filter(t => t.category === 'work' && t.status === 'completed').length / filteredTasks.filter(t => t.category === 'work').length) * 100) 
          : 0,
        pomodoros: filteredTasks.filter(t => t.category === 'work' && t.status === 'completed').length,
        color: '#667eea'
      },
      {
        name: '学习',
        icon: '📚',
        total: filteredTasks.filter(t => t.category === 'study').length,
        completed: filteredTasks.filter(t => t.category === 'study' && t.status === 'completed').length,
        rate: filteredTasks.filter(t => t.category === 'study').length > 0 
          ? Math.round((filteredTasks.filter(t => t.category === 'study' && t.status === 'completed').length / filteredTasks.filter(t => t.category === 'study').length) * 100) 
          : 0,
        pomodoros: filteredTasks.filter(t => t.category === 'study' && t.status === 'completed').length,
        color: '#f093fb'
      },
      {
        name: '生活',
        icon: '🏠',
        total: filteredTasks.filter(t => t.category === 'life').length,
        completed: filteredTasks.filter(t => t.category === 'life' && t.status === 'completed').length,
        rate: filteredTasks.filter(t => t.category === 'life').length > 0 
          ? Math.round((filteredTasks.filter(t => t.category === 'life' && t.status === 'completed').length / filteredTasks.filter(t => t.category === 'life').length) * 100) 
          : 0,
        pomodoros: filteredTasks.filter(t => t.category === 'life' && t.status === 'completed').length,
        color: '#4facfe'
      }
    ],
    priorities: [
      {
        name: '高优先级',
        total: filteredTasks.filter(t => t.priority === 'high').length,
        percentage: filteredTasks.length > 0 
          ? Math.round((filteredTasks.filter(t => t.priority === 'high').length / filteredTasks.length) * 100) 
          : 0,
        color: '#ef4444'
      },
      {
        name: '中优先级',
        total: filteredTasks.filter(t => t.priority === 'medium').length,
        percentage: filteredTasks.length > 0 
          ? Math.round((filteredTasks.filter(t => t.priority === 'medium').length / filteredTasks.length) * 100) 
          : 0,
        color: '#f59e0b'
      },
      {
        name: '低优先级',
        total: filteredTasks.filter(t => t.priority === 'low').length,
        percentage: filteredTasks.length > 0 
          ? Math.round((filteredTasks.filter(t => t.priority === 'low').length / filteredTasks.length) * 100) 
          : 0,
        color: '#3b82f6'
      }
    ],
    // 趋势数据（根据报告类型调整粒度）
    trendData: generateTrendData(filteredTasks, startDate, endDate, selectedType.value),
    // 热力图数据
    heatmapData: generateHeatmapData(props.tasks),
    // 任务执行质量
    quality: generateQualityData(completed),
    // 效率分析
    efficiency: generateEfficiencyData(filteredTasks, completed),
    // 总任务数
    totalTasks: filteredTasks.length
  }

  return { visualData, textData }
}

// 生成任务执行质量数据
const generateQualityData = (completedTasks) => {
  if (completedTasks.length === 0) {
    return {
      avgLogsPerTask: 0,
      avgBlocksPerTask: 0,
      avgRating: 0,
      avgProgress: 0
    }
  }

  let totalLogs = 0
  let totalBlocks = 0
  let totalRating = 0
  let ratingCount = 0
  let totalProgress = 0

  completedTasks.forEach(task => {
    // 统计日志数
    if (task.logs && Array.isArray(task.logs)) {
      totalLogs += task.logs.length
      
      // 统计阻碍数
      totalBlocks += task.logs.filter(log => log.type === 'block').length
      
      // 统计评分（只统计complete类型的日志）
      const completeLog = task.logs.find(log => log.type === 'complete' && log.rating)
      if (completeLog) {
        totalRating += completeLog.rating
        ratingCount++
      }
    }
    
    // 统计进度（使用stats.progressHistory的最后一个值，与统计中心一致）
    if (task.stats?.progressHistory && task.stats.progressHistory.length > 0) {
      const latestProgress = task.stats.progressHistory[task.stats.progressHistory.length - 1]
      totalProgress += latestProgress
    } else {
      totalProgress += 100 // 已完成任务默认100%
    }
  })

  return {
    avgLogsPerTask: (totalLogs / completedTasks.length).toFixed(1),
    avgBlocksPerTask: (totalBlocks / completedTasks.length).toFixed(1),
    avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0,
    avgProgress: Math.round(totalProgress / completedTasks.length)
  }
}

// 生成效率分析数据
const generateEfficiencyData = (allTasks, completedTasks) => {
  // 计算平均完成时间
  let avgCompletionTime = '0天'
  
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, task) => {
      if (!task.created_at || !task.completed_at) return sum
      const created = new Date(task.created_at)
      const completed = new Date(task.completed_at)
      return sum + (completed - created)
    }, 0)
    
    const avgTimeMs = totalTime / completedTasks.length
    const avgTimeDays = avgTimeMs / (1000 * 60 * 60 * 24)
    
    if (avgTimeDays < 1) {
      const hours = Math.round(avgTimeDays * 24)
      avgCompletionTime = `${hours}小时`
    } else {
      avgCompletionTime = `${avgTimeDays.toFixed(1)}天`
    }
  }
  
  // 计算完成率
  const completionRate = allTasks.length > 0 
    ? Math.round((completedTasks.length / allTasks.length) * 100) 
    : 0
  
  // 计算最高效时段
  let mostProductiveTime = '--:--'
  
  if (completedTasks.length > 0) {
    const hourMap = new Map()
    completedTasks.forEach(task => {
      if (task.completed_at) {
        const hour = new Date(task.completed_at).getHours()
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
      }
    })
    
    if (hourMap.size > 0) {
      const maxHour = Array.from(hourMap.entries()).reduce((max, curr) => 
        curr[1] > max[1] ? curr : max
      )
      mostProductiveTime = `${maxHour[0]}:00-${maxHour[0] + 1}:00`
    }
  }
  
  return {
    avgCompletionTime,
    completionRate,
    mostProductiveTime,
    totalTasks: allTasks.length
  }
}

// 生成趋势数据（根据报告类型调整粒度）
const generateTrendData = (tasks, startDate, endDate, reportType) => {
  const labels = []
  const values = []
  
  // 根据报告类型确定时间粒度
  if (reportType === 'daily') {
    // 日报：按小时统计
    for (let i = 0; i < 24; i++) {
      labels.push(`${i}:00`)
      const count = tasks.filter(t => {
        if (!t.completed_at) return false
        const hour = new Date(t.completed_at).getHours()
        return hour === i
      }).length
      values.push(count)
    }
  } else if (reportType === 'weekly') {
    // 周报：按天统计（7天）
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      labels.push(weekdays[date.getDay()])
      
      const dateStr = date.toISOString().split('T')[0]
      const count = tasks.filter(t => {
        if (!t.completed_at) return false
        const completedDate = new Date(t.completed_at).toISOString().split('T')[0]
        return completedDate === dateStr
      }).length
      values.push(count)
    }
  } else if (reportType === 'monthly') {
    // 月报：按周统计（4-5周）
    const weeks = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7))
    for (let i = 0; i < weeks; i++) {
      labels.push(`第${i + 1}周`)
      
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const count = tasks.filter(t => {
        if (!t.completed_at) return false
        const completedDate = new Date(t.completed_at)
        return completedDate >= weekStart && completedDate <= weekEnd
      }).length
      values.push(count)
    }
  } else if (reportType === 'quarterly') {
    // 季报：按月统计（3个月）
    for (let i = 0; i < 3; i++) {
      const month = new Date(startDate)
      month.setMonth(month.getMonth() + i)
      labels.push(`${month.getMonth() + 1}月`)
      
      const count = tasks.filter(t => {
        if (!t.completed_at) return false
        const completedDate = new Date(t.completed_at)
        return completedDate.getMonth() === month.getMonth() && 
               completedDate.getFullYear() === month.getFullYear()
      }).length
      values.push(count)
    }
  } else if (reportType === 'halfyearly') {
    // 半年报：按月统计（6个月）
    for (let i = 0; i < 6; i++) {
      const month = new Date(startDate)
      month.setMonth(month.getMonth() + i)
      labels.push(`${month.getMonth() + 1}月`)
      
      const count = tasks.filter(t => {
        if (!t.completed_at) return false
        const completedDate = new Date(t.completed_at)
        return completedDate.getMonth() === month.getMonth() && 
               completedDate.getFullYear() === month.getFullYear()
      }).length
      values.push(count)
    }
  } else if (reportType === 'yearly') {
    // 年报：按月统计（12个月）
    for (let i = 0; i < 12; i++) {
      labels.push(`${i + 1}月`)
      
      const count = tasks.filter(t => {
        if (!t.completed_at) return false
        const completedDate = new Date(t.completed_at)
        return completedDate.getMonth() === i && 
               completedDate.getFullYear() === startDate.getFullYear()
      }).length
      values.push(count)
    }
  } else {
    // 自定义：根据天数自动选择粒度
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    
    if (days <= 7) {
      // 7天内：按天
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`)
        
        const dateStr = date.toISOString().split('T')[0]
        const count = tasks.filter(t => {
          if (!t.completed_at) return false
          const completedDate = new Date(t.completed_at).toISOString().split('T')[0]
          return completedDate === dateStr
        }).length
        values.push(count)
      }
    } else if (days <= 60) {
      // 60天内：按周
      const weeks = Math.ceil(days / 7)
      for (let i = 0; i < weeks; i++) {
        labels.push(`第${i + 1}周`)
        
        const weekStart = new Date(startDate)
        weekStart.setDate(weekStart.getDate() + i * 7)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        const count = tasks.filter(t => {
          if (!t.completed_at) return false
          const completedDate = new Date(t.completed_at)
          return completedDate >= weekStart && completedDate <= weekEnd
        }).length
        values.push(count)
      }
    } else {
      // 60天以上：按月
      const months = Math.ceil(days / 30)
      for (let i = 0; i < months; i++) {
        const month = new Date(startDate)
        month.setMonth(month.getMonth() + i)
        labels.push(`${month.getMonth() + 1}月`)
        
        const count = tasks.filter(t => {
          if (!t.completed_at) return false
          const completedDate = new Date(t.completed_at)
          return completedDate.getMonth() === month.getMonth() && 
                 completedDate.getFullYear() === month.getFullYear()
        }).length
        values.push(count)
      }
    }
  }
  
  return { labels, values }
}

// 生成热力图数据
const generateHeatmapData = (tasks) => {
  const data = []
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  
  // 生成365天的数据
  for (let i = 0; i < 365; i++) {
    const date = new Date(yearStart)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    const count = tasks.filter(t => {
      if (!t.completed_at) return false
      const completedDate = new Date(t.completed_at).toISOString().split('T')[0]
      return completedDate === dateStr
    }).length
    
    data.push([dateStr, count])
  }
  
  return data
}

// 生成AI工作汇报
const generateAIReport = async () => {
  showAIReportModal.value = true
  generatingAIReport.value = true
  aiReportText.value = ''

  try {
    // 计算日期范围
    const { startDate, endDate } = calculateDateRange()
    
    // 获取AI配置
    const aiConfig = await getAIConfig()
    console.log('🔍 AI配置:', aiConfig)
    console.log('🔍 是否启用AI:', aiConfig.enabled)
    
    // 生成工作汇报
    const generator = new AIWorkReportGenerator(props.tasks, aiConfig)
    const report = await generator.generateWorkReport(startDate, endDate, selectedType.value)
    
    aiReportText.value = report
  } catch (error) {
    console.error('生成AI汇报失败:', error)
    aiReportText.value = '生成失败，请重试'
  } finally {
    generatingAIReport.value = false
  }
}

// 获取AI配置
const getAIConfig = async () => {
  try {
    // 尝试新格式（ai_models）
    const modelsStr = localStorage.getItem('ai_models')
    const defaultModelId = localStorage.getItem('ai_default_model')
    
    console.log('📦 ai_models:', modelsStr)
    console.log('📦 ai_default_model:', defaultModelId)
    
    if (modelsStr && defaultModelId) {
      const models = JSON.parse(modelsStr)
      const defaultModel = models.find(m => m.id === defaultModelId)
      
      console.log('📦 找到的默认模型:', defaultModel)
      
      if (defaultModel) {
        // 统一URL处理：先规范化基础URL，再根据类型拼接API路径
        const normalizeBaseUrl = (url, type) => {
          if (!url) return ''
          let baseUrl = url.trim()
          if (type === 'local') {
            baseUrl = baseUrl.replace(/\/api\/.*$/, '')
          } else {
            baseUrl = baseUrl.replace(/\/v1(\/.*)?$/, '')
          }
          return baseUrl.replace(/\/$/, '')
        }
        
        let baseUrl = normalizeBaseUrl(defaultModel.url, defaultModel.type)
        let baseURL = defaultModel.type === 'local'
          ? `${baseUrl}/api/generate`
          : `${baseUrl}/v1/chat/completions`
        
        console.log('📦 基础URL:', baseUrl, '完整URL:', baseURL)
        
        return {
          enabled: true,
          baseURL: baseURL,
          apiKey: defaultModel.apiKey,
          model: defaultModel.modelName || defaultModel.name
        }
      }
    }
    
    // 兼容旧格式（ai_model_config）
    const configStr = localStorage.getItem('ai_model_config')
    console.log('📦 ai_model_config (旧格式):', configStr)
    
    if (!configStr) {
      console.warn('⚠️ 未找到任何AI配置')
      return { enabled: false }
    }
    
    const config = JSON.parse(configStr)
    const defaultModel = config.models?.find(m => m.isDefault)
    
    if (!defaultModel) {
      console.warn('⚠️ 未找到默认模型')
      return { enabled: false }
    }
    
    return {
      enabled: true,
      baseURL: defaultModel.baseURL,
      apiKey: defaultModel.apiKey,
      model: defaultModel.modelName || defaultModel.model
    }
  } catch (error) {
    console.error('❌ 获取AI配置失败:', error)
    return { enabled: false }
  }
}

// 复制AI汇报
const copyAIReport = () => {
  navigator.clipboard.writeText(aiReportText.value).then(() => {
    alert('已复制到剪贴板')
  }).catch(err => {
    console.error('复制失败:', err)
    alert('复制失败')
  })
}

// 导出AI汇报
const exportAIReport = () => {
  const blob = new Blob([aiReportText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `工作汇报_${selectedType.value}_${new Date().toLocaleDateString('zh-CN')}.txt`
  a.click()
  URL.revokeObjectURL(url)
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
  /* z-index 通过内联样式动态设置：普通模式10008，历史模式10010 */
  animation: fadeIn 0.2s ease-out;
  padding: 0;
}

/* AI弹窗层级更高 */
.ai-overlay {
  z-index: 100001 !important;
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

.history-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.history-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
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

.btn-ai {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-weight: 600;
}

.btn-ai:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
}

/* AI工作汇报弹窗 */
.ai-report-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.ai-report-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.report-text {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.8;
  color: #1f2937;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
</style>
