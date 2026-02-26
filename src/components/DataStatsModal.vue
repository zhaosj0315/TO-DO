<template>
  <div v-if="visible" class="stats-overlay" @click.self="$emit('close')">
    <div class="stats-container">
      <div class="stats-header">
        <h3>📊 数据统计</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="stats-body">
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
import { ref, watch, onMounted, nextTick } from 'vue'
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

const selectedRange = ref('week')
const timeRanges = [
  { label: '最近7天', value: 'week' },
  { label: '最近30天', value: 'month' },
  { label: '最近90天', value: 'quarter' }
]

const avgCompletionTime = ref('0天')
const completionRate = ref(0)
const mostProductiveTime = ref('--:--')
const totalTasks = ref(0)

let trendChartInstance = null
let categoryChartInstance = null
let priorityChartInstance = null

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
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'M', day: 'D' })
    dateMap.set(dateStr, { completed: 0, created: 0 })
  }
  
  // 统计每天的任务
  tasks.forEach(task => {
    const createdDate = new Date(task.created_at).toLocaleDateString('zh-CN', { month: 'M', day: 'D' })
    if (dateMap.has(createdDate)) {
      dateMap.get(createdDate).created++
    }
    
    if (task.status === 'completed' && task.completed_at) {
      const completedDate = new Date(task.completed_at).toLocaleDateString('zh-CN', { month: 'M', day: 'D' })
      if (dateMap.has(completedDate)) {
        dateMap.get(completedDate).completed++
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
}

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChart.value) return
  
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
}

// 监听弹窗显示
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await nextTick()
    initTrendChart()
    initCategoryChart()
    initPriorityChart()
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
  align-items: center;
  justify-content: center;
  z-index: 10006;
  backdrop-filter: blur(8px);
}

.stats-container {
  background: white;
  border-radius: 16px;
  width: 96%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
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
  border-radius: 16px 16px 0 0;
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
  padding: 1.5rem;
}

.time-range-selector {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
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
  margin-bottom: 2rem;
}

.chart-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
}

.chart-container {
  width: 100%;
  height: 300px;
  background: #f8f9fa;
  border-radius: 12px;
}

.efficiency-section {
  margin-top: 2rem;
}

.efficiency-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
}

.efficiency-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.efficiency-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 12px;
  padding: 1.5rem;
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

@media (max-width: 768px) {
  .efficiency-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>
