<template>
  <div class="gantt-overlay" @click.self="$emit('close')">
    <div class="gantt-sheet">
      <!-- 头部 -->
      <div class="gantt-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h2>📊 甘特图</h2>
        <div class="gantt-stats">
          <span class="stat-item">{{ totalTasks }} 个任务</span>
          <span class="stat-item">{{ inProgressTasks }} 进行中</span>
        </div>
      </div>

      <!-- 控制栏 -->
      <div class="gantt-controls">
        <div class="mobile-hint">💡 左右滑动查看完整时间轴 · 自动适配任务时间范围</div>
      </div>

      <!-- 图表容器 -->
      <div class="gantt-wrapper">
        <div ref="chartRef" class="gantt-container"></div>
        
        <!-- 🆕 显示更多按钮 -->
        <div v-if="hasMoreTasks" class="load-more">
          <button @click="showMoreTasks" class="load-more-btn">
            显示更多任务 (还有 {{ remainingTasks }} 个)
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="allGanttData.length === 0" class="empty-state">
        <span class="icon">📊</span>
        <p>暂无任务数据</p>
        <p class="hint">请为任务设置截止时间以显示在甘特图中</p>
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

const viewMode = ref('week') // week, month, quarter
const displayLimit = ref(8) // 🆕 默认只显示8个任务

// 统计
const totalTasks = computed(() => allGanttData.value.length) // 🆕 改为统计全部任务
const inProgressTasks = computed(() => 
  allGanttData.value.filter(t => t.status === 'pending').length
)

// 计算时间范围
const timeRange = computed(() => {
  // 🔧 修复：根据实际任务的时间范围自动调整
  if (ganttData.value.length === 0) {
    const now = new Date()
    return { 
      start: now.getTime(), 
      end: now.getTime() + 7 * 24 * 60 * 60 * 1000 
    }
  }
  
  // 找出所有任务的最早开始时间和最晚结束时间
  let minTime = Infinity
  let maxTime = -Infinity
  
  ganttData.value.forEach(task => {
    if (task.value[0] < minTime) minTime = task.value[0]
    if (task.value[1] > maxTime) maxTime = task.value[1]
  })
  
  // 添加一些边距（前后各加10%）
  const timeSpan = maxTime - minTime
  const padding = timeSpan * 0.1
  
  console.log('📊 自动计算时间范围:')
  console.log('  最早:', new Date(minTime))
  console.log('  最晚:', new Date(maxTime))
  console.log('  时间跨度:', Math.round(timeSpan / (24 * 60 * 60 * 1000)), '天')
  
  return { 
    start: minTime - padding, 
    end: maxTime + padding 
  }
})

// 构建甘特图数据（全部任务）
const allGanttData = computed(() => {
  const data = taskStore.tasks
    .filter(t => t.customDate) // 只显示有截止时间的任务
    .map(task => {
      const startTime = new Date(task.created_at)
      
      // 🔧 修复：正确解析日期
      let endTime
      if (task.customTime) {
        // 有时间：2026-03-12 14:30
        endTime = new Date(`${task.customDate} ${task.customTime}`)
      } else {
        // 无时间：2026-03-12 23:59
        endTime = new Date(`${task.customDate} 23:59:59`)
      }
      
      console.log('📊 任务:', task.text)
      console.log('  开始时间:', startTime, startTime.getTime())
      console.log('  结束时间:', endTime, endTime.getTime())
      
      return {
        name: task.text || '未命名任务',
        value: [
          startTime.getTime(),
          endTime.getTime()
        ],
        itemStyle: {
          color: getPriorityColor(task.priority),
          opacity: task.status === 'completed' ? 0.5 : 1
        },
        status: task.status,
        priority: task.priority,
        taskId: task.id,
        deadline: endTime.getTime()
      }
    })
    .filter(task => {
      // 🔧 过滤掉无效的时间数据
      return !isNaN(task.value[0]) && !isNaN(task.value[1]) && task.value[1] > task.value[0]
    })
    .sort((a, b) => {
      // 🆕 优先显示：高优先级 + 即将到期
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority]
      }
      return a.deadline - b.deadline
    })
  
  console.log('📊 甘特图全部数据:', data.length, '个任务')
  return data
})

// 🆕 显示的任务数据（限制数量）
const ganttData = computed(() => {
  return allGanttData.value.slice(0, displayLimit.value)
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

  // 🆕 设置容器高度
  const chartHeight = Math.max(ganttData.value.length * 50 + 150, 400)
  chartRef.value.style.height = `${chartHeight}px`

  chartInstance = echarts.init(chartRef.value)

  // 移动端优化：任务名称截断
  const isMobile = window.innerWidth < 768
  const maxNameLength = isMobile ? 8 : 15
  const taskNames = ganttData.value.map(t => 
    t.name.substring(0, maxNameLength) + (t.name.length > maxNameLength ? '...' : '')
  )

  const option = {
    tooltip: {
      formatter: (params) => {
        const task = params.data
        const start = new Date(task.value[0])
        const end = new Date(task.value[1])
        return `
          <strong>${task.name}</strong><br/>
          开始：${start.toLocaleDateString()}<br/>
          结束：${end.toLocaleDateString()}<br/>
          状态：${task.status === 'completed' ? '已完成' : '进行中'}
        `
      }
    },
    grid: {
      left: isMobile ? 20 : 20,  // ✨ 与返回按钮左对齐
      right: isMobile ? 20 : 40,
      top: 80,
      bottom: 50,
      height: Math.max(ganttData.value.length * 50, 300),
      containLabel: true
    },
    xAxis: {
      type: 'time',
      min: timeRange.value.start,
      max: timeRange.value.end,
      splitLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb',
          type: 'solid',
          width: 1
        }
      },
      axisLine: {
        lineStyle: {
          color: '#d1d5db',
          width: 1
        }
      },
      axisLabel: {
        fontSize: isMobile ? 11 : 12,
        color: '#6b7280',
        formatter: (value) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'category',
      data: taskNames,
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f3f4f6',
          type: 'solid',
          width: 1
        }
      },
      axisLine: {
        show: true,  // ✨ 显示Y轴线作为分隔线
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
        align: 'left',
        padding: [0, 8, 0, 20],  // ✨ 左边距20px，与返回按钮对齐
        overflow: 'truncate',
        ellipsis: '...'
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
          x: [0, 1],
          y: 0
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
  min-height: 400px; /* 🆕 确保有最小高度 */
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
.load-more {
  padding: 20px;
  text-align: center;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.95));
}

.load-more-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.load-more-btn:active {
  transform: translateY(0);
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
