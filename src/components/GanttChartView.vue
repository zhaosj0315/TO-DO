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
        <div class="control-group">
          <button 
            :class="['control-btn', { active: viewMode === 'week' }]"
            @click="viewMode = 'week'"
          >
            📅 周视图
          </button>
          <button 
            :class="['control-btn', { active: viewMode === 'month' }]"
            @click="viewMode = 'month'"
          >
            📆 月视图
          </button>
          <button 
            :class="['control-btn', { active: viewMode === 'quarter' }]"
            @click="viewMode = 'quarter'"
          >
            📊 季度视图
          </button>
        </div>
        <div class="mobile-hint">💡 左右滑动查看完整时间轴</div>
      </div>

      <!-- 图表容器 -->
      <div class="gantt-wrapper">
        <div ref="chartRef" class="gantt-container"></div>
      </div>

      <!-- 空状态 -->
      <div v-if="ganttData.length === 0" class="empty-state">
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

// 统计
const totalTasks = computed(() => ganttData.value.length)
const inProgressTasks = computed(() => 
  ganttData.value.filter(t => t.status === 'pending').length
)

// 计算时间范围
const timeRange = computed(() => {
  const now = new Date()
  let start, end
  
  switch (viewMode.value) {
    case 'week':
      // 本周一到周日
      const dayOfWeek = now.getDay() || 7 // 周日为0，改为7
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek))
      end.setHours(23, 59, 59)
      break
    case 'month':
      // 本月1号到月底
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    case 'quarter':
      // 本季度第一天到最后一天
      const currentMonth = now.getMonth()
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3
      start = new Date(now.getFullYear(), quarterStartMonth, 1)
      end = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  }
  
  return { start: start.getTime(), end: end.getTime() }
})

// 构建甘特图数据
const ganttData = computed(() => {
  const data = taskStore.tasks
    .filter(t => t.customDate) // 只显示有截止时间的任务
    .map(task => {
      const startTime = new Date(task.created_at)
      const endTime = new Date(task.customDate + (task.customTime ? ` ${task.customTime}` : ' 23:59'))
      
      return {
        name: task.text,
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
        taskId: task.id
      }
    })
    .sort((a, b) => a.value[0] - b.value[0]) // 按开始时间排序
  
  console.log('📊 甘特图数据:', data.length, '个任务')
  console.log('📊 示例数据:', data[0])
  return data
})

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
      left: isMobile ? 80 : 200,
      right: isMobile ? 20 : 60,
      top: 80,
      bottom: 50,
      containLabel: true
    },
    xAxis: {
      type: 'time',
      min: timeRange.value.start,
      max: timeRange.value.end,
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
        formatter: (value) => {
          const date = new Date(value)
          if (viewMode.value === 'week') {
            return `${date.getMonth() + 1}/${date.getDate()}`
          } else if (viewMode.value === 'month') {
            return `${date.getMonth() + 1}/${date.getDate()}`
          } else {
            return `${date.getMonth() + 1}月`
          }
        }
      }
    },
    yAxis: {
      type: 'category',
      data: taskNames,
      axisLabel: {
        fontSize: isMobile ? 11 : 13
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
          
          // 从 ganttData 中获取数据
          const taskData = ganttData.value[categoryIndex]

          return {
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: end[0] - start[0],
              height: height
            },
            style: {
              fill: taskData.itemStyle.color,
              opacity: taskData.itemStyle.opacity
            }
          }
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

// 监听数据变化和视图模式变化
watch([ganttData, viewMode], () => {
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
  min-width: 100%;
  min-height: 100%;
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
