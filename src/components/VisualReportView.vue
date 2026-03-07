<template>
  <div class="visual-report">
    <!-- Hero Section -->
    <div class="report-hero">
      <h1 class="hero-title">{{ reportData.period?.start }} - {{ reportData.period?.end }}</h1>
      <p class="hero-subtitle">你的时间，看得见。</p>
    </div>

    <!-- AI智能摘要 -->
    <div v-if="reportData.executiveSummary" class="executive-summary">
      <div class="summary-badge">🤖 AI 智能摘要</div>
      <p class="summary-text">{{ reportData.executiveSummary }}</p>
    </div>

    <!-- 核心数字 -->
    <div class="hero-stats">
      <div class="hero-stat-card">
        <div class="hero-stat-icon">✅</div>
        <div class="hero-stat-value">{{ reportData.completedTasks || 0 }}</div>
        <div class="hero-stat-label">已完成</div>
      </div>
      <div class="hero-stat-card">
        <div class="hero-stat-icon">📈</div>
        <div class="hero-stat-value">{{ reportData.completionRate || 0 }}%</div>
        <div class="hero-stat-label">完成率</div>
      </div>
      <div class="hero-stat-card">
        <div class="hero-stat-icon">📊</div>
        <div class="hero-stat-value">{{ reportData.totalTasks || 0 }}</div>
        <div class="hero-stat-label">总任务数</div>
      </div>
    </div>

    <!-- 任务完成趋势图 -->
    <div class="report-section">
      <h3 class="section-title">📈 任务完成趋势</h3>
      <div ref="trendChartRef" class="chart-container"></div>
    </div>

    <!-- 分类占比饼图 -->
    <div class="report-section">
      <h3 class="section-title">🥧 任务分类占比</h3>
      <div ref="categoryChartRef" class="chart-container"></div>
    </div>

    <!-- 优先级分布 -->
    <div class="report-section">
      <h3 class="section-title">⚡ 优先级分布</h3>
      <div ref="priorityChartRef" class="chart-container"></div>
    </div>

    <!-- 365天完成热力图 -->
    <div class="report-section">
      <h3 class="section-title">🗓️ 365天完成热力图</h3>
      <div ref="heatmapChartRef" class="heatmap-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  reportData: {
    type: Object,
    required: true
  },
  reportType: String
})

const trendChartRef = ref(null)
const categoryChartRef = ref(null)
const priorityChartRef = ref(null)
const heatmapChartRef = ref(null)

let trendChart = null
let categoryChart = null
let priorityChart = null
let heatmapChart = null

// 初始化图表
const initCharts = async () => {
  await nextTick()
  
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    updateTrendChart()
  }
  
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value)
    updateCategoryChart()
  }
  
  if (priorityChartRef.value) {
    priorityChart = echarts.init(priorityChartRef.value)
    updatePriorityChart()
  }
  
  if (heatmapChartRef.value) {
    heatmapChart = echarts.init(heatmapChartRef.value)
    updateHeatmapChart()
  }
}

// 更新趋势图
const updateTrendChart = () => {
  if (!trendChart || !props.reportData.trendData) {
    console.log('趋势图数据缺失:', props.reportData.trendData)
    return
  }
  
  console.log('更新趋势图:', props.reportData.trendData)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.reportData.trendData?.labels || [],
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [{
      data: props.reportData.trendData?.values || [],
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(102, 126, 234, 0.2)'
      },
      itemStyle: {
        color: '#667eea'
      }
    }]
  }
  
  trendChart.setOption(option)
}

// 更新分类饼图
const updateCategoryChart = () => {
  if (!categoryChart || !props.reportData.categories) {
    console.log('分类图数据缺失:', props.reportData.categories)
    return
  }
  
  const data = props.reportData.categories.map(cat => ({
    name: cat.name,
    value: cat.completed
  }))
  
  console.log('更新分类图:', data)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [{
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
        formatter: '{b}: {c}'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: data,
      color: props.reportData.categories.map(c => c.color)
    }]
  }
  
  categoryChart.setOption(option)
}

// 更新优先级分布图
const updatePriorityChart = () => {
  if (!priorityChart || !props.reportData.priorities) {
    console.log('优先级图数据缺失:', props.reportData.priorities)
    return
  }
  
  console.log('更新优先级图:', props.reportData.priorities)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}个任务'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.reportData.priorities.map(p => p.name)
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [{
      data: props.reportData.priorities.map(p => ({
        value: p.total,
        itemStyle: { color: p.color }
      })),
      type: 'bar',
      barWidth: '60%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}'
      }
    }]
  }
  
  priorityChart.setOption(option)
}

// 更新热力图
const updateHeatmapChart = () => {
  if (!heatmapChart || !props.reportData.heatmapData) {
    console.log('热力图数据缺失:', props.reportData.heatmapData)
    return
  }
  
  console.log('更新热力图，数据量:', props.reportData.heatmapData.length)
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        return `${params.value[0]}<br/>完成 ${params.value[1]} 个任务`
      }
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
      },
      text: ['多', '少']
    },
    calendar: {
      range: new Date().getFullYear(),
      cellSize: ['auto', 13],
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 1,
        nameMap: ['日', '一', '二', '三', '四', '五', '六']
      },
      monthLabel: {
        nameMap: 'cn'
      }
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: props.reportData.heatmapData || []
    }]
  }
  
  heatmapChart.setOption(option)
}

// 监听数据变化
watch(() => props.reportData, () => {
  if (trendChart) updateTrendChart()
  if (categoryChart) updateCategoryChart()
  if (priorityChart) updatePriorityChart()
  if (heatmapChart) updateHeatmapChart()
}, { deep: true })

// 窗口resize时重新调整图表大小
const handleResize = () => {
  if (trendChart) trendChart.resize()
  if (categoryChart) categoryChart.resize()
  if (priorityChart) priorityChart.resize()
  if (heatmapChart) heatmapChart.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 清理
const cleanup = () => {
  window.removeEventListener('resize', handleResize)
  if (trendChart) trendChart.dispose()
  if (categoryChart) categoryChart.dispose()
  if (priorityChart) priorityChart.dispose()
  if (heatmapChart) heatmapChart.dispose()
}

// 组件卸载时清理
onUnmounted(cleanup)
</script>

<style scoped>
.visual-report {
  padding: 1rem 0;
}

/* Hero Section */
.report-hero {
  text-align: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* AI摘要 */
.executive-summary {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 4px solid #667eea;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.summary-badge {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.summary-text {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

/* 核心数字 */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.hero-stat-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.2s;
}

.hero-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.hero-stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.hero-stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.hero-stat-label {
  font-size: 0.85rem;
  color: #6b7280;
}

/* 报告区块 */
.report-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

/* 分类统计 */
.category-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.category-name {
  font-weight: 600;
  color: #374151;
}

.category-value {
  font-size: 0.9rem;
  color: #6b7280;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.category-detail {
  font-size: 0.85rem;
  color: #6b7280;
}

/* 优先级统计 */
.priority-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.priority-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.priority-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.priority-name {
  font-weight: 600;
  color: #374151;
}

.priority-value {
  font-size: 0.9rem;
  color: #6b7280;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 300px;
  margin-top: 1rem;
}

.heatmap-container {
  width: 100%;
  height: 200px;
  margin-top: 1rem;
}
</style>
