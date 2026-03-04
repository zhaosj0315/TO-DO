<template>
  <div v-if="visible" class="stats-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet">
      <div class="stats-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h3>📊 统计中心</h3>
        <div style="width: 80px;"></div>
      </div>

      <!-- 标签页切换 -->
      <div class="tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'pomodoro' }]"
          @click="activeTab = 'pomodoro'"
        >
          🍅 番茄钟
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'data' }]"
          @click="activeTab = 'data'"
        >
          📊 数据统计
        </button>
      </div>

      <!-- 番茄钟统计内容 -->
      <div class="stats-body" v-show="activeTab === 'pomodoro'">
        <!-- 今日专注统计 -->
        <div class="today-focus-stats">
          <div class="focus-stat-card">
            <div class="focus-icon">⏱️</div>
            <div class="focus-data">
              <div class="focus-value">{{ getTodayFocusMinutes() }}</div>
              <div class="focus-label">今日专注（分钟）</div>
            </div>
          </div>
          <div class="focus-stat-card">
            <div class="focus-icon">🍅</div>
            <div class="focus-data">
              <div class="focus-value">{{ getTodayCompletedPomodoros() }}</div>
              <div class="focus-label">今日完成（个）</div>
            </div>
          </div>
          <div class="focus-stat-card">
            <div class="focus-icon">📊</div>
            <div class="focus-data">
              <div class="focus-value">{{ getWeekCompletedPomodoros() }}</div>
              <div class="focus-label">本周完成（个）</div>
            </div>
          </div>
        </div>

        <!-- 番茄钟总览 -->
        <div class="pomodoro-overview">
          <div class="overview-item earned">
            <div class="overview-icon">✅</div>
            <div class="overview-value">{{ earnedPomodoros }}</div>
            <div class="overview-label">已获得</div>
          </div>
          <div class="overview-item pending">
            <div class="overview-icon">⏳</div>
            <div class="overview-value">{{ pendingPomodoros }}</div>
            <div class="overview-label">待获得</div>
          </div>
          <div class="overview-item lost">
            <div class="overview-icon">❌</div>
            <div class="overview-value">{{ lostPomodoros }}</div>
            <div class="overview-label">逾期扣除</div>
          </div>
          <div class="overview-item total">
            <div class="overview-icon">🏆</div>
            <div class="overview-value">{{ totalPomodoros }}</div>
            <div class="overview-label">净获得</div>
          </div>
        </div>

        <!-- 近7天趋势 -->
        <div class="stats-section">
          <h4 class="section-title">📈 近7天趋势</h4>
          <div class="trend-chart">
            <div v-for="(day, index) in getLast7DaysTrend()" :key="index" class="trend-bar-wrapper">
              <div class="trend-bar" :style="{ height: (day.count / getMaxDailyInWeek() * 100) + '%' }">
                <span class="trend-value">{{ day.count }}</span>
              </div>
              <div class="trend-label">{{ day.label }}</div>
            </div>
          </div>
        </div>

        <!-- 分类占比 -->
        <div class="stats-section">
          <h4 class="section-title">📊 分类占比</h4>
          <div class="category-bars">
            <div class="category-bar-item">
              <div class="category-bar-header">
                <span>💼 工作</span>
                <span class="category-bar-value">{{ getPomodorosByCategory('work') }} ({{ getCategoryPercent('work') }}%)</span>
              </div>
              <div class="category-bar-bg">
                <div class="category-bar-fill work" :style="{ width: getCategoryPercent('work') + '%' }"></div>
              </div>
            </div>
            <div class="category-bar-item">
              <div class="category-bar-header">
                <span>📚 学习</span>
                <span class="category-bar-value">{{ getPomodorosByCategory('study') }} ({{ getCategoryPercent('study') }}%)</span>
              </div>
              <div class="category-bar-bg">
                <div class="category-bar-fill study" :style="{ width: getCategoryPercent('study') + '%' }"></div>
              </div>
            </div>
            <div class="category-bar-item">
              <div class="category-bar-header">
                <span>🏠 生活</span>
                <span class="category-bar-value">{{ getPomodorosByCategory('life') }} ({{ getCategoryPercent('life') }}%)</span>
              </div>
              <div class="category-bar-bg">
                <div class="category-bar-fill life" :style="{ width: getCategoryPercent('life') + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 番茄钟历史记录 -->
        <div class="stats-section">
          <h4 class="section-title">📜 番茄钟历史记录</h4>
          <div v-if="pomodoroHistoryByDate.length === 0" class="empty-state">
            <div class="empty-icon">🍅</div>
            <div class="empty-text">暂无番茄钟记录</div>
          </div>
          <div v-else class="history-list">
            <div v-for="(group, index) in pomodoroHistoryByDate" :key="index" class="history-group">
              <div class="history-date" @click="group.expanded = !group.expanded">
                <span class="date-text">{{ group.date }}</span>
                <span class="date-count">{{ group.records.length }}个番茄钟</span>
                <span class="expand-icon">{{ group.expanded ? '▼' : '▶' }}</span>
              </div>
              <div v-show="group.expanded" class="history-records">
                <div v-for="record in group.records" :key="record.id" class="history-record" @click="openTaskDetail(record.taskId)">
                  <div class="record-header">
                    <span class="record-task">{{ record.taskName }}</span>
                    <span :class="['record-status', record.completed ? 'completed' : 'abandoned']">
                      {{ record.completed ? '✅ 完成' : '❌ 放弃' }}
                    </span>
                  </div>
                  <div class="record-meta">
                    <span class="record-time">⏱️ {{ formatTime(record.startTime) }} - {{ formatTime(record.endTime) }}</span>
                    <span class="record-duration">⏳ {{ record.duration }}分钟</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="stats-body" v-show="activeTab === 'data'">
        <!-- 时间范围选择 -->
        <div class="time-range-selector">
          <button 
            v-for="range in timeRanges" 
            :key="range.value"
            :class="['range-btn', { active: selectedRange === range.value }]"
            @click="selectedRange = range.value; updateCharts()"
          >
            {{ range.label }}
          </button>
        </div>

        <!-- 任务完成趋势图 -->
        <div class="chart-section">
          <h4>📈 任务完成趋势</h4>
          <div ref="trendChart" class="chart-container"></div>
        </div>

        <!-- 分类占比饼图 -->
        <div class="chart-section">
          <h4>🥧 任务分类占比</h4>
          <div ref="categoryChart" class="chart-container"></div>
        </div>

        <!-- 优先级分布 -->
        <div class="chart-section">
          <h4>⚡ 优先级分布</h4>
          <div ref="priorityChart" class="chart-container"></div>
        </div>

        <!-- 时间热力图 -->
        <div class="chart-section">
          <h4>🗓️ 365天完成热力图</h4>
          <div ref="heatmapChart" class="heatmap-container"></div>
        </div>

        <!-- 任务执行质量分析 -->
        <div class="quality-section">
          <h4>⭐ 任务执行质量</h4>
          <div class="quality-grid">
            <div class="quality-card">
              <div class="card-icon">💬</div>
              <div class="card-value">{{ avgLogsPerTask }}</div>
              <div class="card-label">平均日志数</div>
              <div class="card-desc">任务推进频率</div>
            </div>
            <div class="quality-card">
              <div class="card-icon">⚠️</div>
              <div class="card-value">{{ avgBlocksPerTask }}</div>
              <div class="card-label">平均阻碍数</div>
              <div class="card-desc">任务难度指标</div>
            </div>
            <div class="quality-card">
              <div class="card-icon">⭐</div>
              <div class="card-value">{{ avgRating }}/5</div>
              <div class="card-label">平均完成评分</div>
              <div class="card-desc">任务质量指标</div>
            </div>
            <div class="quality-card">
              <div class="card-icon">📊</div>
              <div class="card-value">{{ avgProgress }}%</div>
              <div class="card-label">平均进度</div>
              <div class="card-desc">任务完成度</div>
            </div>
          </div>
        </div>

        <!-- 效率分析 -->
        <div class="efficiency-section">
          <h4>💡 效率分析</h4>
          <div class="efficiency-grid">
            <div class="efficiency-card">
              <div class="card-icon">⏱️</div>
              <div class="card-value">{{ avgCompletionTime }}</div>
              <div class="card-label">平均完成时间</div>
            </div>
            <div class="efficiency-card">
              <div class="card-icon">🎯</div>
              <div class="card-value">{{ completionRate }}%</div>
              <div class="card-label">完成率</div>
            </div>
            <div class="efficiency-card">
              <div class="card-icon">🔥</div>
              <div class="card-value">{{ mostProductiveTime }}</div>
              <div class="card-label">最高效时段</div>
            </div>
            <div class="efficiency-card">
              <div class="card-icon">📊</div>
              <div class="card-value">{{ totalTasks }}</div>
              <div class="card-label">总任务数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close'])

const taskStore = useOfflineTaskStore()

const trendChart = ref(null)
const categoryChart = ref(null)
const priorityChart = ref(null)
const heatmapChart = ref(null)

const selectedRange = ref('week')
const activeTab = ref('pomodoro') // 默认显示番茄钟统计
const timeRanges = [
  { label: '最近7天', value: 'week' },
  { label: '最近30天', value: 'month' },
  { label: '最近90天', value: 'quarter' }
]

const avgCompletionTime = ref('0天')
const completionRate = ref(0)
const mostProductiveTime = ref('--:--')
const totalTasks = ref(0)

// 任务执行质量指标
const avgLogsPerTask = ref(0)
const avgBlocksPerTask = ref(0)
const avgRating = ref(0)
const avgProgress = ref(0)

let trendChartInstance = null
let categoryChartInstance = null
let priorityChartInstance = null
let heatmapChartInstance = null

// 获取时间范围的任务
const getTasksInRange = (days) => {
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  return taskStore.tasks.filter(task => {
    const createdAt = new Date(task.created_at)
    return createdAt >= startDate && createdAt <= now
  })
}

// 生成趋势图数据
const generateTrendData = (days) => {
  const tasks = getTasksInRange(days)
  const dateMap = new Map()
  
  // 初始化日期
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    dateMap.set(dateStr, { completed: 0, created: 0 })
  }
  
  // 统计每天的任务
  tasks.forEach(task => {
    const createdDate = new Date(task.created_at)
    const createdStr = `${createdDate.getMonth() + 1}/${createdDate.getDate()}`
    if (dateMap.has(createdStr)) {
      dateMap.get(createdStr).created++
    }
    
    if (task.status === 'completed' && task.completed_at) {
      const completedDate = new Date(task.completed_at)
      const completedStr = `${completedDate.getMonth() + 1}/${completedDate.getDate()}`
      if (dateMap.has(completedStr)) {
        dateMap.get(completedStr).completed++
      }
    }
  })
  
  const dates = Array.from(dateMap.keys())
  const completed = Array.from(dateMap.values()).map(v => v.completed)
  const created = Array.from(dateMap.values()).map(v => v.created)
  
  return { dates, completed, created }
}

// 生成分类数据
const generateCategoryData = (days) => {
  const tasks = getTasksInRange(days)
  const categoryMap = {
    work: { name: '💼 工作', value: 0 },
    study: { name: '📚 学习', value: 0 },
    life: { name: '🏠 生活', value: 0 }
  }
  
  tasks.forEach(task => {
    if (categoryMap[task.category]) {
      categoryMap[task.category].value++
    }
  })
  
  return Object.values(categoryMap).filter(item => item.value > 0)
}

// 生成优先级数据
const generatePriorityData = (days) => {
  const tasks = getTasksInRange(days)
  const priorityMap = {
    high: { name: '高优先级', value: 0 },
    medium: { name: '中优先级', value: 0 },
    low: { name: '低优先级', value: 0 }
  }
  
  tasks.forEach(task => {
    if (priorityMap[task.priority]) {
      priorityMap[task.priority].value++
    }
  })
  
  return Object.values(priorityMap)
}

// 计算效率指标
const calculateEfficiency = (days) => {
  const tasks = getTasksInRange(days)
  totalTasks.value = tasks.length
  
  // 完成率
  const completed = tasks.filter(t => t.status === 'completed').length
  completionRate.value = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  
  // 平均完成时间
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at)
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.created_at)
      const completed = new Date(task.completed_at)
      return sum + (completed - created)
    }, 0)
    const avgTime = totalTime / completedTasks.length / (1000 * 60 * 60 * 24)
    avgCompletionTime.value = avgTime < 1 ? `${Math.round(avgTime * 24)}小时` : `${avgTime.toFixed(1)}天`
  }
  
  // 最高效时段
  const hourMap = new Map()
  completedTasks.forEach(task => {
    const hour = new Date(task.completed_at).getHours()
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
  })
  
  if (hourMap.size > 0) {
    const maxHour = Array.from(hourMap.entries()).reduce((max, curr) => 
      curr[1] > max[1] ? curr : max
    )
    mostProductiveTime.value = `${maxHour[0]}:00-${maxHour[0] + 1}:00`
  }
  
  // 任务执行质量分析
  if (completedTasks.length > 0) {
    // 平均日志数
    const totalLogs = completedTasks.reduce((sum, task) => 
      sum + (task.logs?.length || 0), 0)
    avgLogsPerTask.value = (totalLogs / completedTasks.length).toFixed(1)
    
    // 平均阻碍数
    const totalBlocks = completedTasks.reduce((sum, task) => {
      const blocks = task.logs?.filter(log => log.type === 'block').length || 0
      return sum + blocks
    }, 0)
    avgBlocksPerTask.value = (totalBlocks / completedTasks.length).toFixed(1)
    
    // 平均完成评分
    const tasksWithRating = completedTasks.filter(task => 
      task.logs?.some(log => log.type === 'complete' && log.rating))
    if (tasksWithRating.length > 0) {
      const totalRating = tasksWithRating.reduce((sum, task) => {
        const completeLog = task.logs.find(log => log.type === 'complete')
        return sum + (completeLog?.rating || 0)
      }, 0)
      avgRating.value = (totalRating / tasksWithRating.length).toFixed(1)
    } else {
      avgRating.value = 0
    }
    
    // 平均进度
    const totalProgress = completedTasks.reduce((sum, task) => 
      sum + (task.stats?.latestProgress || 100), 0)
    avgProgress.value = Math.round(totalProgress / completedTasks.length)
  } else {
    avgLogsPerTask.value = 0
    avgBlocksPerTask.value = 0
    avgRating.value = 0
    avgProgress.value = 0
  }
}

// 生成热力图数据（365天）
const generateHeatmapData = () => {
  const data = []
  const now = new Date()
  
  // 生成过去365天的数据
  for (let i = 364; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // 统计当天完成的任务数
    const count = taskStore.tasks.filter(task => {
      if (task.status !== 'completed' || !task.completed_at) return false
      const completedDate = new Date(task.completed_at).toISOString().split('T')[0]
      return completedDate === dateStr
    }).length
    
    data.push([dateStr, count])
  }
  
  return data
}

// 初始化热力图
const initHeatmapChart = () => {
  if (!heatmapChart.value) return
  
  // 先销毁已存在的实例
  if (heatmapChartInstance) {
    heatmapChartInstance.dispose()
    heatmapChartInstance = null
  }
  
  heatmapChartInstance = echarts.init(heatmapChart.value)
  
  const data = generateHeatmapData()
  const maxValue = Math.max(...data.map(d => d[1]), 1)
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        return `${params.data[0]}<br/>完成 ${params.data[1]} 个任务`
      }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0',
      inRange: {
        color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
      },
      text: ['多', '少']
    },
    calendar: {
      top: 50,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      range: [
        new Date(new Date().getTime() - 364 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ],
      itemStyle: {
        borderWidth: 0.5
      },
      yearLabel: { show: false },
      dayLabel: {
        nameMap: ['日', '一', '二', '三', '四', '五', '六']
      },
      monthLabel: {
        nameMap: 'cn'
      }
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: data
    }
  }
  
  heatmapChartInstance.setOption(option)
}

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChart.value) return
  
  // 先销毁已存在的实例
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
  
  trendChartInstance = echarts.init(trendChart.value)
  
  const days = selectedRange.value === 'week' ? 7 : (selectedRange.value === 'month' ? 30 : 90)
  const { dates, completed, created } = generateTrendData(days)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['已完成', '已创建']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '已完成',
        type: 'line',
        data: completed,
        smooth: true,
        itemStyle: { color: '#00b894' },
        areaStyle: { color: 'rgba(0, 184, 148, 0.1)' }
      },
      {
        name: '已创建',
        type: 'line',
        data: created,
        smooth: true,
        itemStyle: { color: '#0984e3' },
        areaStyle: { color: 'rgba(9, 132, 227, 0.1)' }
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

// 初始化分类图
const initCategoryChart = () => {
  if (!categoryChart.value) return
  
  // 先销毁已存在的实例
  if (categoryChartInstance) {
    categoryChartInstance.dispose()
    categoryChartInstance = null
  }
  
  categoryChartInstance = echarts.init(categoryChart.value)
  
  const days = selectedRange.value === 'week' ? 7 : (selectedRange.value === 'month' ? 30 : 90)
  const data = generateCategoryData(days)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c} ({d}%)'
        },
        data: data,
        color: ['#667eea', '#764ba2', '#f093fb']
      }
    ]
  }
  
  categoryChartInstance.setOption(option)
}

// 初始化优先级图
const initPriorityChart = () => {
  if (!priorityChart.value) return
  
  // 先销毁已存在的实例
  if (priorityChartInstance) {
    priorityChartInstance.dispose()
    priorityChartInstance = null
  }
  
  priorityChartInstance = echarts.init(priorityChart.value)
  
  const days = selectedRange.value === 'week' ? 7 : (selectedRange.value === 'month' ? 30 : 90)
  const data = generatePriorityData(days)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        type: 'bar',
        data: data.map(item => item.value),
        itemStyle: {
          color: (params) => {
            const colors = ['#d63031', '#fdcb6e', '#74b9ff']
            return colors[params.dataIndex]
          },
          borderRadius: [8, 8, 0, 0]
        },
        barWidth: '50%'
      }
    ]
  }
  
  priorityChartInstance.setOption(option)
}

// 更新所有图表
const updateCharts = () => {
  const days = selectedRange.value === 'week' ? 7 : (selectedRange.value === 'month' ? 30 : 90)
  
  calculateEfficiency(days)
  
  if (trendChartInstance) {
    const { dates, completed, created } = generateTrendData(days)
    trendChartInstance.setOption({
      xAxis: { data: dates },
      series: [
        { data: completed },
        { data: created }
      ]
    })
  }
  
  if (categoryChartInstance) {
    const data = generateCategoryData(days)
    categoryChartInstance.setOption({
      series: [{ data }]
    })
  }
  
  if (priorityChartInstance) {
    const data = generatePriorityData(days)
    priorityChartInstance.setOption({
      xAxis: { data: data.map(item => item.name) },
      series: [{ data: data.map(item => item.value) }]
    })
  }
  
  // 热力图不受时间范围影响，始终显示365天
  if (heatmapChartInstance) {
    const data = generateHeatmapData()
    heatmapChartInstance.setOption({
      series: [{ data }]
    })
  }
}

// 监听弹窗显示
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await nextTick()
    initTrendChart()
    initCategoryChart()
    initPriorityChart()
    initHeatmapChart()
    calculateEfficiency(7)
  } else {
    // 销毁图表实例
    if (trendChartInstance) {
      trendChartInstance.dispose()
      trendChartInstance = null
    }
    if (categoryChartInstance) {
      categoryChartInstance.dispose()
      categoryChartInstance = null
    }
    if (priorityChartInstance) {
      priorityChartInstance.dispose()
      priorityChartInstance = null
    }
    if (heatmapChartInstance) {
      heatmapChartInstance.dispose()
      heatmapChartInstance = null
    }
  }
})

// ========== 番茄钟统计相关方法 ==========

// 计算番茄钟数量（复制自TodoView）
const getPomodoroCount = (task) => {
  if (typeof task === 'string') {
    const pomodoroMap = { high: 4, medium: 2, low: 1 }
    return pomodoroMap[task] || 2
  }

  const priorityMultiplier = { high: 1.5, medium: 1.0, low: 0.75 }
  const multiplier = priorityMultiplier[task.priority] || 1.0
  let basePomodoros = 2

  if (task.status === 'completed' && task.completed_at && task.created_at) {
    const createdTime = new Date(task.created_at).getTime()
    const completedTime = new Date(task.completed_at).getTime()
    const daySpan = (completedTime - createdTime) / (1000 * 60 * 60 * 24)
    
    if (daySpan > 1) {
      basePomodoros = Math.min(Math.round(daySpan * 2), 200)
      return Math.round(basePomodoros * multiplier)
    }
  }

  if (['today', 'tomorrow', 'this_week'].includes(task.type)) {
    const durationMap = { quick: 0.5, normal: 2, long: 4 }
    const hours = durationMap[task.duration || 'normal']
    basePomodoros = hours * 2
  } else if (task.type === 'custom_date') {
    const scaleMap = { small: 10, medium: 30, large: 100 }
    basePomodoros = scaleMap[task.scale || 'small']
  } else if (['daily', 'weekday', 'weekly'].includes(task.type)) {
    basePomodoros = 2
  }

  return Math.round(basePomodoros * multiplier)
}

// 使用computed而不是ref
const earnedPomodoros = computed(() => {
  return taskStore.tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const pendingPomodoros = computed(() => {
  return taskStore.tasks
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const lostPomodoros = computed(() => {
  return taskStore.tasks
    .filter(t => t.status === 'overdue')
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const totalPomodoros = computed(() => {
  return earnedPomodoros.value - lostPomodoros.value
})

// 今日专注时长（分钟）- 改为基于今日完成任务的番茄钟数
const getTodayFocusMinutes = () => {
  const today = new Date().toDateString()
  const todayPomodoros = taskStore.tasks
    .filter(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      return new Date(t.completed_at).toDateString() === today
    })
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
  
  return todayPomodoros * 25  // 每个番茄钟25分钟
}

// 今日完成番茄钟数
const getTodayCompletedPomodoros = () => {
  const today = new Date().toDateString()
  return taskStore.tasks
    .filter(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      return new Date(t.completed_at).toDateString() === today
    })
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
}

// 本周完成番茄钟数
const getWeekCompletedPomodoros = () => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return taskStore.tasks
    .filter(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      return new Date(t.completed_at) >= weekAgo
    })
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
}

// 近7天趋势（改为统计每天完成任务获得的番茄钟数）
const getLast7DaysTrend = () => {
  const trend = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toDateString()
    
    // 统计当天完成的任务获得的番茄钟数
    const count = taskStore.tasks
      .filter(t => {
        if (t.status !== 'completed' || !t.completed_at) return false
        return new Date(t.completed_at).toDateString() === dateStr
      })
      .reduce((sum, t) => sum + getPomodoroCount(t), 0)
    
    trend.push({
      label: i === 0 ? '今天' : `${date.getMonth() + 1}/${date.getDate()}`,
      count
    })
  }
  
  return trend
}

// 获取一周内最大值（用于柱状图高度）
const getMaxDailyInWeek = () => {
  const trend = getLast7DaysTrend()
  return Math.max(...trend.map(d => d.count), 1)
}

// 按分类统计番茄钟
const getPomodorosByCategory = (category) => {
  return taskStore.tasks
    .filter(t => t.category === category && t.status === 'completed')
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
}

// 分类百分比
const getCategoryPercent = (category) => {
  const total = earnedPomodoros.value
  if (total === 0) return 0
  const count = getPomodorosByCategory(category)
  return Math.round((count / total) * 100)
}

// 番茄钟历史记录（按日期分组）
const pomodoroHistoryByDate = computed(() => {
  const historyMap = new Map()
  
  // 遍历所有任务的番茄钟历史
  taskStore.tasks.forEach(task => {
    if (!task.pomodoroHistory || task.pomodoroHistory.length === 0) return
    
    task.pomodoroHistory.forEach(record => {
      const date = new Date(record.startTime)
      const dateKey = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      
      if (!historyMap.has(dateKey)) {
        historyMap.set(dateKey, {
          date: dateKey,
          timestamp: date.getTime(),
          records: [],
          expanded: false
        })
      }
      
      const duration = Math.round((new Date(record.endTime) - new Date(record.startTime)) / 60000)
      
      historyMap.get(dateKey).records.push({
        id: `${task.id}-${record.startTime}`,
        taskId: task.id,
        taskName: task.text,
        startTime: record.startTime,
        endTime: record.endTime,
        duration,
        completed: record.completed
      })
    })
  })
  
  // 转换为数组并按日期倒序排序
  const result = Array.from(historyMap.values())
    .sort((a, b) => b.timestamp - a.timestamp)
  
  // 默认展开最近3天
  result.slice(0, 3).forEach(group => group.expanded = true)
  
  return result
})

// 格式化时间（HH:MM）
const formatTime = (isoString) => {
  const date = new Date(isoString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 打开任务详情
const openTaskDetail = (taskId) => {
  emit('close')
  // 需要在父组件中处理打开任务详情
  setTimeout(() => {
    const event = new CustomEvent('open-task-detail', { detail: { taskId } })
    window.dispatchEvent(event)
  }, 300)
}

// 监听弹窗显示
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await nextTick()
    if (activeTab.value === 'data') {
      // 增加延迟确保DOM完全渲染
      setTimeout(() => {
        initTrendChart()
        initCategoryChart()
        initPriorityChart()
        initHeatmapChart()
        calculateEfficiency(7)
      }, 100)
    }
  } else {
    // 销毁图表实例
    if (trendChartInstance) {
      trendChartInstance.dispose()
      trendChartInstance = null
    }
    if (categoryChartInstance) {
      categoryChartInstance.dispose()
      categoryChartInstance = null
    }
    if (priorityChartInstance) {
      priorityChartInstance.dispose()
      priorityChartInstance = null
    }
    if (heatmapChartInstance) {
      heatmapChartInstance.dispose()
      heatmapChartInstance = null
    }
  }
})

// 监听标签页切换
watch(activeTab, async (newVal) => {
  if (newVal === 'data' && props.visible) {
    await nextTick()
    // 增加延迟确保DOM完全渲染
    setTimeout(() => {
      initTrendChart()
      initCategoryChart()
      initPriorityChart()
      initHeatmapChart()
      calculateEfficiency(7)
    }, 100)
  }
})
</script>

<style scoped>
.stats-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10006;
  backdrop-filter: blur(8px);
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  background: white;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
  overflow-y: auto;
  z-index: 10007;
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  flex-shrink: 0;
}

.stats-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.stats-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;  /* 减少左右内边距 */
}

.time-range-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0 0.5rem;  /* 添加少量内边距 */
}

.range-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.range-btn:hover {
  border-color: #667eea;
}

.range-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.chart-section {
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;  /* 添加少量左右内边距 */
}

.chart-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.chart-container {
  width: 100%;
  height: 300px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0.5rem;  /* 减少内边距 */
}

.efficiency-section {
  margin-top: 1.5rem;
  padding: 0 0.5rem;
}

.efficiency-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #333;
}

.efficiency-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.efficiency-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.card-label {
  font-size: 0.85rem;
  color: #666;
}

/* 热力图容器 */
.heatmap-container {
  height: 200px;
  margin-top: 0.75rem;
  padding: 0.5rem;
}

/* 任务执行质量分析 */
.quality-section {
  margin-top: 1.5rem;
  padding: 0 0.5rem;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.quality-card {
  background: linear-gradient(135deg, #00b89415 0%, #0984e315 100%);
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
}

.quality-card .card-desc {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .efficiency-grid,
  .quality-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .heatmap-container {
    height: 180px;
  }
}

/* ========== 标签页样式 ========== */
.tabs {
  display: flex;
  background: #f5f5f5;
  padding: 8px;
  gap: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
}

.tab-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
}

/* ========== 番茄钟统计样式 ========== */
.today-focus-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 0.5rem;
}

.focus-stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px;
  border-radius: 12px;
  color: white;
  text-align: center;
}

.focus-icon {
  font-size: 1.8rem;
  margin-bottom: 6px;
}

.focus-value {
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.focus-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

.pomodoro-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 0.5rem;
}

.overview-item {
  background: white;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.overview-label {
  font-size: 0.85rem;
  color: #666;
}

.stats-section {
  margin-bottom: 20px;
  padding: 0 0.5rem;
}

.section-title {
  margin-bottom: 10px;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 150px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trend-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.trend-bar {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  min-height: 20px;
  position: relative;
  margin-bottom: 8px;
}

.trend-value {
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
}

.trend-label {
  font-size: 0.75rem;
  color: #666;
  margin-top: auto;
}

.category-bars {
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-bar-item {
  margin-bottom: 12px;
}

.category-bar-item:last-child {
  margin-bottom: 0;
}

.category-bar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.9rem;
}

.category-bar-value {
  color: #666;
  font-weight: 500;
}

.category-bar-bg {
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.category-bar-fill.work {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.category-bar-fill.study {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

.category-bar-fill.life {
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

/* 番茄钟历史记录 */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 0.9rem;
}

.history-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-group {
  border-bottom: 1px solid #f0f0f0;
}

.history-group:last-child {
  border-bottom: none;
}

.history-date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.history-date:hover {
  background: #f5f5f5;
}

.date-text {
  font-weight: 600;
  color: #333;
}

.date-count {
  font-size: 0.85rem;
  color: #666;
}

.expand-icon {
  color: #999;
  font-size: 0.75rem;
  transition: transform 0.2s;
}

.history-records {
  padding: 8px 0;
}

.history-record {
  padding: 12px 16px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.history-record:hover {
  background: #f9f9f9;
  border-left-color: #667eea;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.record-task {
  font-weight: 500;
  color: #333;
  flex: 1;
  margin-right: 12px;
}

.record-status {
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.record-status.completed {
  background: #e8f5e9;
  color: #2e7d32;
}

.record-status.abandoned {
  background: #ffebee;
  color: #c62828;
}

.record-meta {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: #666;
}

.record-time,
.record-duration {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .today-focus-stats {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  
  .pomodoro-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .trend-bar {
    max-width: 30px;
  }
  
  .stats-body {
    padding: 0.75rem;
  }
  
  .chart-section,
  .stats-section,
  .quality-section,
  .efficiency-section {
    padding: 0 0.25rem;
  }
}
</style>
