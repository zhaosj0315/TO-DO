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
      </div>

      <!-- 图表容器 -->
      <div ref="chartRef" class="gantt-container"></div>

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

  const taskNames = ganttData.value.map(t => t.name.substring(0, 15) + (t.name.length > 15 ? '...' : ''))

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
      left: 200,
      right: 60,
      top: 80,
      bottom: 50,
      containLabel: true
    },
    xAxis: {
      type: 'time',
      min: timeRange.value.start,
      max: timeRange.value.end,
      axisLabel: {
        formatter: (value) => {
          const date = new Date(value)
          if (viewMode.value === 'week') {
            return `${date.getMonth() + 1}/${date.getDate()}`
          } else if (viewMode.value === 'month') {
            return `${date.getMonth() + 1}/${date.getDate()}`
          } else {
            // 季度视图：显示月/日
            return `${date.getMonth() + 1}月`
          }
        }
      }
    },
    yAxis: {
      type: 'category',
      data: taskNames
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

.gantt-stats {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
}

.stat-item {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-weight: 500;
}

.gantt-controls {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.control-group {
  display: flex;
  gap: 8px;
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

.control-btn:hover {
  background: #f5f5f5;
}

.control-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border-color: transparent;
}

.gantt-container {
  flex: 1;
  width: 100%;
  background: #fafafa;
  padding: 0 10px;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
}

.empty-state .icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-state p {
  margin: 8px 0;
  font-size: 1rem;
}

.empty-state .hint {
  font-size: 0.9rem;
  color: #bbb;
}
</style>
