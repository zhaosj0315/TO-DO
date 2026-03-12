<template>
  <div class="graph-overlay" @click.self="$emit('close')">
    <div class="graph-sheet">
      <!-- 头部 -->
      <div class="graph-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h2>🕸️ 任务关系图谱</h2>
        <div class="graph-stats">
          <span class="stat-item">{{ nodes.length }} 个任务</span>
          <span class="stat-item">{{ edges.length }} 个关系</span>
        </div>
      </div>

      <!-- 控制栏 -->
      <div class="graph-controls">
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="🔍 搜索任务..."
            @input="handleSearch"
          />
        </div>
        
        <button 
          :class="['control-btn', { active: showLinks }]"
          @click="showLinks = !showLinks"
        >
          🔗 引用链接
        </button>
        <button 
          :class="['control-btn', { active: showDependencies }]"
          @click="showDependencies = !showDependencies"
        >
          🔒 依赖关系
        </button>
        <button 
          :class="['control-btn', { active: showSubtasks }]"
          @click="showSubtasks = !showSubtasks"
        >
          🌳 父子关系
        </button>
        <button class="control-btn" @click="resetView">
          🔄 重置视图
        </button>
      </div>

      <!-- 图谱容器 -->
      <div ref="chartRef" class="graph-container"></div>

      <!-- 空状态 -->
      <div v-if="nodes.length === 0" class="empty-state">
        <span class="icon">🕸️</span>
        <p>暂无任务关系</p>
        <p class="hint">使用 [[链接]] 或设置依赖关系来建立任务关联</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'
import * as echarts from 'echarts'

const props = defineProps({
  centerTaskId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close', 'navigate'])

const taskStore = useOfflineTaskStore()
const chartRef = ref(null)
let chartInstance = null

// 控制显示的关系类型
const showLinks = ref(true)        // 引用链接
const showDependencies = ref(true) // 依赖关系
const showSubtasks = ref(true)     // 父子关系
const searchKeyword = ref('')      // 搜索关键字

// 🆕 搜索处理
function handleSearch() {
  if (!chartInstance) return
  
  if (searchKeyword.value.trim()) {
    // 高亮匹配的节点
    const keyword = searchKeyword.value.toLowerCase()
    chartInstance.setOption({
      series: [{
        data: nodes.value.map(node => ({
          ...node,
          symbolSize: node.name.toLowerCase().includes(keyword) ? 60 : 40,
          itemStyle: {
            ...node.itemStyle,
            borderWidth: node.name.toLowerCase().includes(keyword) ? 4 : 0,
            borderColor: '#f59e0b'
          }
        }))
      }]
    })
  } else {
    // 重置
    updateChart()
  }
}

// 🆕 构建图谱数据
const graphData = computed(() => {
  const nodes = []
  const edges = []
  const nodeMap = new Set()

  // 如果指定了中心任务，只显示相关任务
  const tasksToShow = props.centerTaskId 
    ? getRelatedTasks(props.centerTaskId)
    : taskStore.tasks.filter(t => t.status !== 'completed') // 只显示未完成任务

  tasksToShow.forEach(task => {
    // 添加节点
    if (!nodeMap.has(task.id)) {
      nodes.push({
        id: String(task.id),
        name: task.text,
        value: task.priority === 'high' ? 100 : task.priority === 'medium' ? 60 : 30,
        category: getCategoryIndex(task),
        symbolSize: task.id === props.centerTaskId ? 60 : 40,
        itemStyle: {
          color: task.id === props.centerTaskId ? '#f59e0b' : getCategoryColor(task.category)
        }
      })
      nodeMap.add(task.id)
    }

    // 添加引用链接
    if (showLinks.value && task.linkedTasks?.length) {
      task.linkedTasks.forEach(linkedId => {
        if (nodeMap.has(linkedId) || tasksToShow.find(t => t.id === linkedId)) {
          edges.push({
            source: String(task.id),
            target: String(linkedId),
            label: { show: false },
            lineStyle: { 
              color: '#8b5cf6',
              width: 2,
              type: 'solid'
            }
          })
        }
      })
    }

    // 添加依赖关系
    if (showDependencies.value && task.waitFor?.length) {
      task.waitFor.forEach(waitId => {
        if (nodeMap.has(waitId) || tasksToShow.find(t => t.id === waitId)) {
          edges.push({
            source: String(task.id),
            target: String(waitId),
            label: { show: false },
            lineStyle: { 
              color: '#ef4444',
              width: 2,
              type: 'dashed'
            }
          })
        }
      })
    }

    // 添加父子关系
    if (showSubtasks.value && task.parentTaskId) {
      if (nodeMap.has(task.parentTaskId) || tasksToShow.find(t => t.id === task.parentTaskId)) {
        edges.push({
          source: String(task.parentTaskId),
          target: String(task.id),
          label: { show: false },
          lineStyle: { 
            color: '#10b981',
            width: 2,
            type: 'dotted'
          }
        })
      }
    }
  })

  return { nodes, edges }
})

const nodes = computed(() => graphData.value.nodes)
const edges = computed(() => graphData.value.edges)

// 🆕 获取相关任务（2层深度）
function getRelatedTasks(taskId) {
  const related = new Set()
  const queue = [taskId]
  const visited = new Set()
  let depth = 0

  while (queue.length > 0 && depth < 2) {
    const levelSize = queue.length
    for (let i = 0; i < levelSize; i++) {
      const currentId = queue.shift()
      if (visited.has(currentId)) continue
      visited.add(currentId)

      const task = taskStore.tasks.find(t => t.id === currentId)
      if (task) {
        related.add(task)

        // 添加相关任务到队列
        task.linkedTasks?.forEach(id => queue.push(id))
        task.waitFor?.forEach(id => queue.push(id))
        if (task.parentTaskId) queue.push(task.parentTaskId)
        task.subtasks?.forEach(id => queue.push(id))
        
        // 添加反向链接
        const backlinks = taskStore.getBacklinks(currentId)
        backlinks.forEach(t => queue.push(t.id))
      }
    }
    depth++
  }

  return Array.from(related)
}

// 🆕 分类统计
const categoryStats = computed(() => {
  const stats = {
    work: { name: '工作', color: '#8b5cf6', count: 0 },
    study: { name: '学习', color: '#3b82f6', count: 0 },
    life: { name: '生活', color: '#10b981', count: 0 }
  }
  
  nodes.value.forEach(node => {
    const task = taskStore.tasks.find(t => t.id === parseInt(node.id))
    if (task && stats[task.category]) {
      stats[task.category].count++
    }
  })
  
  return Object.values(stats).filter(s => s.count > 0)
})

// 🆕 获取分类索引
function getCategoryIndex(task) {
  if (task.category === 'work') return 0
  if (task.category === 'study') return 1
  if (task.category === 'life') return 2
  return 0
}

// 🆕 获取分类颜色
function getCategoryColor(category) {
  const colors = {
    work: '#8b5cf6',
    study: '#3b82f6',
    life: '#10b981'
  }
  return colors[category] || '#999'
}

// 🆕 获取优先级颜色
function getPriorityColor(priority) {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6'
  }
  return colors[priority] || '#999'
}

// 🆕 初始化图谱
function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      formatter: (params) => {
        if (params.dataType === 'node') {
          const task = taskStore.tasks.find(t => t.id === parseInt(params.data.id))
          return `
            <strong>${params.data.name}</strong><br/>
            分类：${task?.category === 'work' ? '工作' : task?.category === 'study' ? '学习' : '生活'}<br/>
            优先级：${task?.priority === 'high' ? '高' : task?.priority === 'medium' ? '中' : '低'}
          `
        }
        return ''
      }
    },
    legend: [{
      data: categoryStats.value.map(s => ({ name: s.name, icon: 'circle', itemStyle: { color: s.color } })),
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      textStyle: { color: '#666' },
      formatter: (name) => {
        const stat = categoryStats.value.find(s => s.name === name)
        return `${name} (${stat?.count || 0})`
      }
    }],
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes.value,
      links: edges.value,
      categories: [
        { name: '工作', itemStyle: { color: '#8b5cf6' } },
        { name: '学习', itemStyle: { color: '#3b82f6' } },
        { name: '生活', itemStyle: { color: '#10b981' } }
      ],
      roam: true,
      draggable: true,
      label: {
        show: true,
        position: 'bottom',
        formatter: '{b}',
        fontSize: 12
      },
      force: {
        repulsion: 200,
        edgeLength: 150,
        gravity: 0.1
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 4 }
      }
    }]
  }

  chartInstance.setOption(option)

  // 点击节点跳转
  chartInstance.on('click', (params) => {
    if (params.dataType === 'node') {
      const taskId = parseInt(params.data.id)
      emit('navigate', taskId)
    }
  })
}

// 🆕 更新图谱
function updateChart() {
  if (!chartInstance) return

  chartInstance.setOption({
    series: [{
      data: nodes.value,
      links: edges.value
    }]
  })
}

// 🆕 重置视图
function resetView() {
  if (chartInstance) {
    chartInstance.dispatchAction({
      type: 'restore'
    })
  }
}

// 监听数据变化
watch([showLinks, showDependencies, showSubtasks], () => {
  updateChart()
})

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})
</script>

<style scoped>
.graph-overlay {
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

.graph-sheet {
  width: 100%;
  max-width: 100%;
  height: 90vh;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.graph-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: #8b5cf6;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.back-btn:hover {
  background: rgba(139, 92, 246, 0.1);
}

.graph-header h2 {
  flex: 1;
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.graph-stats {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
}

.stat-item {
  padding: 4px 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  color: #8b5cf6;
  font-weight: 500;
}

.graph-controls {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-box input:focus {
  border-color: #8b5cf6;
}

.control-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.control-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.graph-container {
  flex: 1;
  width: 100%;
  min-height: 0;
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
