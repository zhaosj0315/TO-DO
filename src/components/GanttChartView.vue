<template>
  <div class="gantt-overlay" @click.self="$emit('close')">
    <div class="gantt-sheet">
      <!-- 头部 -->
      <div class="gantt-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h2>📊 甘特图</h2>
        <!-- 视图切换 -->
        <div class="view-switcher">
          <button v-for="v in viewOptions" :key="v.key"
            :class="['view-btn', { active: viewMode === v.key }]"
            @click="setViewMode(v.key)">{{ v.label }}</button>
        </div>
        <div class="gantt-stats">
          <span class="stat-item">{{ totalTasks }} 个任务</span>
          <span class="stat-item">{{ inProgressTasks }} 进行中</span>
          <button v-if="hasMoreTasks" @click="showMoreTasks" class="load-more-inline-btn">
            +{{ remainingTasks }} 更多
          </button>
        </div>
      </div>

      <!-- 图表容器 -->
      <div class="gantt-wrapper">
        <div ref="chartRef" class="gantt-container"></div>
      </div>

      <!-- 空状态 -->
      <div v-if="allGanttData.length === 0" class="empty-state">
        <span class="icon">📊</span>
        <p>暂无任务数据</p>
        <p class="hint">暂无任务数据，请先创建任务</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'
import * as echarts from 'echarts'

const emit = defineEmits(['close', 'navigate'])

const taskStore = useOfflineTaskStore()
const chartRef = ref(null)
let chartInstance = null

const viewMode = ref('month') // day, week, month, quarter, year

const viewOptions = [
  { key: 'day',     label: '日' },
  { key: 'week',    label: '周' },
  { key: 'month',   label: '月' },
  { key: 'quarter', label: '季' },
  { key: 'year',    label: '年' },
]

const setViewMode = (mode) => {
  viewMode.value = mode
  if (chartInstance) { chartInstance.dispose(); chartInstance = null }
  initChart()
}
const displayLimit = ref(8) // 🆕 默认只显示8个任务

// 统计
const totalTasks = computed(() => allGanttData.value.length) // 🆕 改为统计全部任务
const inProgressTasks = computed(() => 
  allGanttData.value.filter(t => t.status === 'pending').length
)

// 计算时间范围：自动包含所有任务，同时保证每个视图至少有足够宽度
const timeRange = computed(() => {
  const DAY = 86400000
  const now = Date.now()

  // 每个视图的最小宽度（保证至少有多个周期可见）
  const minSpan = {
    day:     DAY * 14,       // 至少2周
    week:    DAY * 21,       // 至少3周
    month:   DAY * 90,       // 至少3个月
    quarter: DAY * 270,      // 至少3个季度
    year:    DAY * 365 * 3,  // 至少3年
  }[viewMode.value] ?? DAY * 21

  if (ganttData.value.length === 0) {
    return { start: now - minSpan / 2, end: now + minSpan / 2 }
  }

  let minTime = Infinity, maxTime = -Infinity
  ganttData.value.forEach(task => {
    if (task.value[0] < minTime) minTime = task.value[0]
    if (task.value[1] > maxTime) maxTime = task.value[1]
  })

  // 左右各加一个刻度单位的边距
  const padding = {
    day:     DAY,
    week:    DAY * 7,
    month:   DAY * 15,
    quarter: DAY * 30,
    year:    DAY * 60,
  }[viewMode.value] ?? DAY * 15

  const start = minTime - padding
  const end = maxTime + padding

  // 如果任务跨度不足最小宽度，以今天为中心扩展
  if (end - start < minSpan) {
    const center = (start + end) / 2
    return { start: center - minSpan / 2, end: center + minSpan / 2 }
  }

  return { start, end }
})

// 构建甘特图数据（全部任务）
// 根据任务类型推算截止时间（以任务创建时间为基准，而非今天）
function getTaskDeadline(task) {
  // 以任务创建时间为基准，推算当时的计划完成时间
  const base = task.created_at ? new Date(task.created_at) : new Date()
  const baseEnd = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59)

  switch (task.type) {
    case 'custom_date': {
      if (!task.customDate) return null
      const str = task.customTime ? `${task.customDate} ${task.customTime}` : `${task.customDate} 23:59:59`
      const d = new Date(str)
      return isNaN(d) ? null : d
    }
    case 'today':
    case 'daily':
      // 创建当天 23:59
      return baseEnd
    case 'tomorrow': {
      // 创建次日 23:59
      const d = new Date(baseEnd)
      d.setDate(d.getDate() + 1)
      return d
    }
    case 'this_week': {
      // 创建时所在周的周日 23:59
      const d = new Date(baseEnd)
      const day = d.getDay() // 0=周日
      d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day))
      return d
    }
    case 'weekday': {
      // 创建时当天若是工作日则当天，否则下个工作日
      const d = new Date(baseEnd)
      const day = d.getDay()
      if (day === 0) d.setDate(d.getDate() + 1) // 周日→周一
      else if (day === 6) d.setDate(d.getDate() + 2) // 周六→周一
      return d
    }
    case 'weekly': {
      // 创建时所在周的指定星期几
      if (!task.weekdays || task.weekdays.length === 0) return baseEnd
      const d = new Date(baseEnd)
      const currentDay = d.getDay()
      const targets = task.weekdays.map(w => {
        const diff = (w - currentDay + 7) % 7
        return diff === 0 ? 0 : diff
      })
      const minDiff = Math.min(...targets)
      d.setDate(d.getDate() + minDiff)
      return d
    }
    default:
      return null
  }
}

const allGanttData = computed(() => {
  const data = taskStore.tasks
    .map(task => {
      const startTime = new Date(task.created_at)
      // 已完成任务：右端用实际完成时间；未完成：用计划完成时间
      let endTime
      if (task.status === 'completed' && task.completed_at) {
        endTime = new Date(task.completed_at)
      } else {
        endTime = getTaskDeadline(task)
      }
      if (!endTime) return null

      return {
        name: task.text || '未命名任务',
        value: [startTime.getTime(), endTime.getTime()],
        itemStyle: {
          color: getPriorityColor(task.priority),
          opacity: task.status === 'completed' ? 0.5 : 1
        },
        status: task.status,
        priority: task.priority,
        taskId: task.id,
        deadline: endTime.getTime(),
        taskType: task.type,
        plannedEnd: getTaskDeadline(task)?.getTime() || null,  // 保留计划时间用于 tooltip
        completedAt: task.completed_at || null
      }
    })
    .filter(task => {
      if (!task) return false
      return !isNaN(task.value[0]) && !isNaN(task.value[1]) && task.value[1] > task.value[0]
    })
    // 升序：截止时间最近的排在数组末尾 → ECharts Y轴从下到上，最近的显示在顶部
    .sort((a, b) => a.deadline - b.deadline)

  console.log('📊 甘特图全部数据:', data.length, '个任务')
  return data
})

// 显示的任务数据（取截止时间最近的前N个，即数组末尾）
const ganttData = computed(() => {
  const all = allGanttData.value
  return all.slice(Math.max(0, all.length - displayLimit.value))
})

// 🆕 是否还有更多任务
const hasMoreTasks = computed(() => {
  return allGanttData.value.length > displayLimit.value
})

// 🆕 剩余任务数量
const remainingTasks = computed(() => {
  return allGanttData.value.length - displayLimit.value
})

// 🆕 显示更多任务
const showMoreTasks = () => {
  displayLimit.value += 8
}

// 优先级颜色
function getPriorityColor(priority) {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6'
  }
  return colors[priority] || colors.medium
}

// 初始化图表
function initChart() {
  if (!chartRef.value || ganttData.value.length === 0) return

  // 高度：撑满 gantt-wrapper 容器，最小保证每行40px
  const wrapperHeight = chartRef.value.parentElement?.clientHeight || 0
  const minHeight = ganttData.value.length * 40 + 80
  chartRef.value.style.height = `${Math.max(wrapperHeight, minHeight)}px`

  chartInstance = echarts.init(chartRef.value)

  // 移动端优化：任务名称截断
  const isMobile = window.innerWidth < 768
  const maxNameLength = isMobile ? 8 : 15
  // 用 taskId 作为唯一 key，避免同名任务合并到同一行
  const taskKeys = ganttData.value.map(t => String(t.taskId))
  const taskNameMap = {}
  ganttData.value.forEach(t => {
    const name = t.name.substring(0, maxNameLength) + (t.name.length > maxNameLength ? '...' : '')
    taskNameMap[String(t.taskId)] = name
  })

  const option = {
    tooltip: {
      formatter: (params) => {
        const task = params.data
        const start = new Date(task.value[0])
        const end = new Date(task.value[1])
        const isCompleted = task.status === 'completed'
        let html = `<strong>${task.name}</strong><br/>
          创建：${start.toLocaleDateString()}<br/>`
        if (isCompleted) {
          if (task.plannedEnd) {
            html += `计划完成：${new Date(task.plannedEnd).toLocaleDateString()}<br/>`
          }
          html += `实际完成：${end.toLocaleDateString()}<br/>`
          html += `状态：✅ 已完成`
        } else {
          html += `计划完成：${end.toLocaleDateString()}<br/>`
          html += `状态：${task.status === 'overdue' ? '⚠️ 已逾期' : '⏳ 进行中'}`
        }
        return html
      }
    },
    grid: {
      left: isMobile ? 100 : 130,
      right: isMobile ? 20 : 40,
      top: 40,
      bottom: 20,
      height: Math.max(ganttData.value.length * 40, chartRef.value.clientHeight - 80),
      containLabel: false
    },
    xAxis: {
      type: 'time',
      position: 'top',
      min: timeRange.value.start,
      max: timeRange.value.end,
      splitLine: {
        show: true,
        lineStyle: { color: '#e5e7eb', type: 'solid', width: 1 }
      },
      axisLine: {
        lineStyle: { color: '#d1d5db', width: 1 }
      },
      axisLabel: {
        fontSize: isMobile ? 11 : 12,
        color: '#6b7280',
        formatter: (value) => {
          const d = new Date(value)
          const m = d.getMonth() + 1
          const day = d.getDate()
          if (viewMode.value === 'day') return `${m}/${day}`
          if (viewMode.value === 'week') return `${m}/${day}`
          if (viewMode.value === 'month') return `${m}月`
          if (viewMode.value === 'quarter') {
            // 季度标签：Q1/Q2/Q3/Q4
            const q = Math.ceil(m / 3)
            return day <= 7 ? `Q${q}` : ''
          }
          if (viewMode.value === 'year') return `${d.getFullYear()}/${m}`
          return `${m}/${day}`
        }
      },
      minInterval: (() => {
        const DAY = 86400000
        if (viewMode.value === 'day') return DAY
        if (viewMode.value === 'week') return DAY * 7
        if (viewMode.value === 'month') return DAY * 28
        if (viewMode.value === 'quarter') return DAY * 85
        if (viewMode.value === 'year') return DAY * 365
        return DAY * 7
      })()
    },
    yAxis: {
      type: 'category',
      data: taskKeys,
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f3f4f6',
          type: 'solid',
          width: 1
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#d1d5db',
          width: 2
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        fontSize: isMobile ? 12 : 14,
        color: '#1f2937',
        fontWeight: 500,
        align: 'right',
        padding: [0, 8, 0, 0],
        overflow: 'truncate',
        ellipsis: '...',
        formatter: (value) => taskNameMap[value] || value
      }
    },
    series: [
      {
        type: 'custom',
        renderItem: (params, api) => {
          const categoryIndex = params.dataIndex
          const start = api.coord([api.value(0), categoryIndex])
          const end = api.coord([api.value(1), categoryIndex])
          const height = api.size([0, 1])[1] * 0.6
          
          const taskData = ganttData.value[categoryIndex]
          
          // ✨ 优先级渐变色
          let gradient
          if (taskData.priority === 'high') {
            gradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#ef4444' },
              { offset: 1, color: '#dc2626' }
            ])
          } else if (taskData.priority === 'medium') {
            gradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#d97706' }
            ])
          } else {
            gradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#2563eb' }
            ])
          }

          return {
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: Math.max(end[0] - start[0], 2),
              height: height,
              r: 6  // ✨ 圆角
            },
            style: {
              fill: gradient,
              opacity: taskData.status === 'completed' ? 0.5 : 0.85,  // ✨ 半透明效果
              shadowBlur: 4,
              shadowColor: 'rgba(0,0,0,0.15)',
              shadowOffsetY: 2
            }
          }
        },
        markLine: {
          symbol: 'none',
          lineStyle: {
            color: '#ef4444',  // 红色
            width: 2,
            type: 'solid'
          },
          label: {
            show: true,
            formatter: '今天',
            position: 'insideEndTop',
            color: '#ef4444',
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: [4, 8],
            borderRadius: 4
          },
          data: [{ xAxis: new Date().getTime() }]
        },
        encode: {
          x: [0, 1]
        },
        data: ganttData.value
      }
    ]
  }

  chartInstance.setOption(option)

  // 点击事件
  chartInstance.on('click', (params) => {
    if (params.data && params.data.taskId) {
      emit('navigate', params.data.taskId)
    }
  })
}

// 监听数据变化
watch(ganttData, () => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  initChart()
})

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

onUnmounted(() => {
  chartInstance?.dispose()
})
</script>

<style scoped>
.gantt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 2000;
}

.gantt-sheet {
  width: 100%;
  height: 85vh;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.gantt-sheet::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
}

.gantt-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border-radius: 20px 20px 0 0;
}

@media (max-width: 768px) {
  .gantt-header {
    padding: 20px 12px 12px;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 1rem;
  color: white;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

@media (max-width: 768px) {
  .back-btn {
    padding: 6px 10px;
    font-size: 0.9rem;
  }
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.gantt-header h2 {
  flex: 1;
  margin: 0;
  font-size: 1.2rem;
  color: white;
  font-weight: 600;
}

@media (max-width: 768px) {
  .gantt-header h2 {
    font-size: 1rem;
    width: 100%;
    order: -1;
  }
}

.view-switcher {
  display: flex;
  gap: 4px;
  background: rgba(0,0,0,0.15);
  border-radius: 20px;
  padding: 3px;
}

.view-btn {
  padding: 3px 10px;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: rgba(255,255,255,0.7);
  background: transparent;
  transition: all 0.2s;
}

.view-btn.active {
  background: rgba(255,255,255,0.9);
  color: #6d28d9;
}

.gantt-stats {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .gantt-stats {
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
  }
}

.stat-item {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stat-item {
    padding: 2px 8px;
    font-size: 0.75rem;
  }
}

.gantt-controls {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

@media (max-width: 768px) {
  .gantt-controls {
    padding: 8px 12px;
  }
}

.control-group {
  display: flex;
  gap: 8px;
  justify-content: center;
}

@media (max-width: 768px) {
  .control-group {
    gap: 4px;
  }
}

.mobile-hint {
  display: none;
  text-align: center;
  font-size: 0.75rem;
  color: #666;
  margin-top: 6px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .mobile-hint {
    display: block;
  }
}

.control-btn {
  padding: 6px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .control-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
    flex: 1;
  }
}

.control-btn:hover {
  background: #f5f5f5;
}

.control-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border-color: transparent;
}

.gantt-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  background: #fafafa;
}

.gantt-container {
  width: 100%;
  height: 100%;
  background: #fafafa;
  padding: 0 10px;
}

@media (max-width: 768px) {
  .gantt-wrapper {
    /* 移动端支持横向滚动 */
    -webkit-overflow-scrolling: touch;
  }
  
  .gantt-container {
    /* 移动端最小宽度，确保图表不会太挤 */
    min-width: 600px;
    padding: 0 5px;
  }
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
}

@media (max-width: 768px) {
  .empty-state {
    width: 80%;
  }
}

.empty-state .icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
  opacity: 0.3;
}

@media (max-width: 768px) {
  .empty-state .icon {
    font-size: 3rem;
  }
}

/* 🆕 显示更多按钮 */
.load-more-inline-btn {
  padding: 4px 12px;
  background: rgba(255,255,255,0.25);
  color: white;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.load-more-inline-btn:hover {
  background: rgba(255,255,255,0.4);
}

.empty-state p {
  margin: 8px 0;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .empty-state p {
    font-size: 0.9rem;
  }
}

.empty-state .hint {
  font-size: 0.85rem;
  color: #bbb;
}

@media (max-width: 768px) {
  .empty-state .hint {
    font-size: 0.75rem;
  }
}

.empty-state .hint {
  font-size: 0.9rem;
  color: #bbb;
}
</style>
