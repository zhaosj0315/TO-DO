<template>
  <div class="graph-overlay" @click.self="$emit('close')">
    <!-- 🆕 加载动画 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>🕸️ 正在生成关系图谱...</p>
      </div>
    </div>

    <div class="graph-sheet">
      <!-- 头部 -->
      <div class="graph-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h2>🕸️</h2>
        <div class="graph-stats">
          <span class="stat-item">{{ nodes.length }} 个任务</span>
          <span class="stat-item">{{ relationStats.total }} 个关系</span>
          <span v-if="relationStats.links > 0" class="stat-detail">🔗{{ relationStats.links }}</span>
          <span v-if="relationStats.deps > 0" class="stat-detail">🔒{{ relationStats.deps }}</span>
          <span v-if="relationStats.subtasks > 0" class="stat-detail">🌳{{ relationStats.subtasks }}</span>
          <span v-if="relationStats.logs > 0" class="stat-detail">💡{{ relationStats.logs }}</span>
          <span v-if="relationStats.tags > 0" class="stat-detail">🏷️{{ relationStats.tags }}</span>
          <span v-if="isLimited" class="stat-item warning">
            已限制显示
          </span>
        </div>
      </div>

      <!-- 控制栏 -->
      <div class="graph-controls" :class="{ collapsed: controlsCollapsed }">
        <button class="toggle-controls-btn" @click="controlsCollapsed = !controlsCollapsed" :title="controlsCollapsed ? '展开筛选' : '收起筛选'">
          {{ controlsCollapsed ? '▼ 展开筛选' : '▲ 收起筛选' }}
        </button>
        
        <div v-show="!controlsCollapsed" class="controls-content">
        <!-- 任务选择器 + 搜索框合并 -->
        <select v-model="selectedTaskId" class="task-selector">
          <option :value="null">🌐 全部任务</option>
          <option value="search">🔍 搜索任务...</option>
          <option 
            v-for="task in availableTasks" 
            :key="task.id"
            :value="task.id"
          >
            {{ (task.text || '未命名任务').substring(0, 20) }}{{ (task.text || '').length > 20 ? '...' : '' }}
          </option>
        </select>
        
        <!-- 搜索输入框（选择搜索时显示） -->
        <input 
          v-if="selectedTaskId === 'search'"
          v-model="searchKeyword" 
          type="text" 
          placeholder="输入关键词搜索..."
          @input="handleSearch"
          class="search-input"
          autofocus
        />
        
        <!-- 🆕 层级控制 -->
        <div class="limit-control">
          <label>层级: {{ relationDepth }}</label>
          <input 
            v-model.number="relationDepth" 
            type="range" 
            min="1" 
            max="5" 
            step="1"
            class="limit-slider"
          />
        </div>
        
        <!-- 🆕 数量控制 -->
        <div class="limit-control">
          <label>数量: {{ displayLimit }}</label>
          <input 
            v-model.number="displayLimit" 
            type="range" 
            min="10" 
            max="200" 
            step="10"
            class="limit-slider"
          />
        </div>
        
        <!-- 笔记本筛选 -->
        <select v-model="selectedCollectionId" class="collection-filter">
          <option :value="null">📚 全部笔记本</option>
          <option 
            v-for="collection in taskStore.sortedCollections" 
            :key="collection.id"
            :value="collection.id"
          >
            {{ '　'.repeat(getCollectionDepth(collection)) }}📁 {{ collection.name }}
          </option>
        </select>
        
        <button 
          :class="['control-btn', { active: showCompleted }]"
          @click="toggleCompleted"
        >
          <span class="checkbox">{{ showCompleted ? '☑' : '☐' }}</span> ✅<span> 已完成</span>
        </button>
        <button 
          :class="['control-btn', { active: hideIsolated }]"
          @click="hideIsolated = !hideIsolated"
        >
          <span class="checkbox">{{ hideIsolated ? '☑' : '☐' }}</span> 🚫<span> 隐藏孤立</span>
        </button>
        <button 
          :class="['control-btn', { active: showLinks }]"
          @click="showLinks = !showLinks"
        >
          <span class="checkbox">{{ showLinks ? '☑' : '☐' }}</span> 🔗<span> 引用</span>
        </button>
        <button 
          :class="['control-btn', { active: showDependencies }]"
          @click="showDependencies = !showDependencies"
        >
          <span class="checkbox">{{ showDependencies ? '☑' : '☐' }}</span> 🔒<span> 依赖</span>
        </button>
        <button 
          :class="['control-btn', { active: showSubtasks }]"
          @click="showSubtasks = !showSubtasks"
        >
          <span class="checkbox">{{ showSubtasks ? '☑' : '☐' }}</span> 🌳<span> 父子</span>
        </button>
        <button 
          :class="['control-btn', { active: showLogRelations }]"
          @click="showLogRelations = !showLogRelations"
        >
          <span class="checkbox">{{ showLogRelations ? '☑' : '☐' }}</span> 💡<span> 阻碍方案</span>
        </button>
        <button 
          :class="['control-btn', { active: showTagRelations }]"
          @click="showTagRelations = !showTagRelations"
        >
          <span class="checkbox">{{ showTagRelations ? '☑' : '☐' }}</span> 🏷️<span> 标签关系</span>
        </button>
        <button class="control-btn" @click="resetView">
          🔄<span> 重置</span>
        </button>
        </div>
      </div>

      <!-- 图谱容器 -->
      <div ref="chartRef" class="graph-container"></div>

      <!-- 🆕 孤立任务提示（3秒后自动消失） -->
      <transition name="fade">
        <div v-if="showIsolatedHint && isolatedTasks.length > 0 && !hideIsolated" class="isolated-hint">
          ⚠️ 发现 {{ isolatedTasks.length }} 个孤立任务（无任何关系）
          <button @click="showIsolatedTasks" class="hint-btn">查看</button>
        </div>
      </transition>
      
      <!-- 🆕 隐藏孤立提示（3秒后自动消失） -->
      <transition name="fade">
        <div v-if="showHideIsolatedHint && hideIsolated" class="isolated-hint success">
          ✅ 已隐藏 {{ isolatedTasks.length }} 个孤立任务
          <button @click="hideIsolated = false" class="hint-btn">显示</button>
        </div>
      </transition>

      <!-- 🆕 导出按钮 -->
      <button class="export-btn" @click="exportAsImage" title="导出为图片">
        📸
      </button>

      <!-- 关系类型图例 -->
      <div class="graph-legend">
        <div class="legend-item">
          <span class="line-sample solid purple"></span>
          <span>🔗 引用链接</span>
        </div>
        <div class="legend-item">
          <span class="line-sample dashed red"></span>
          <span>🔒 依赖关系</span>
        </div>
        <div class="legend-item">
          <span class="line-sample dotted green"></span>
          <span>🌳 父子关系</span>
        </div>
        <div class="legend-item">
          <span class="line-sample solid orange"></span>
          <span>💡 阻碍方案</span>
        </div>
        <div class="legend-item">
          <span class="line-sample dotted gray"></span>
          <span>🏷️ 标签关系</span>
        </div>
      </div>

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
  },
  maxNodes: {
    type: Number,
    default: 50  // 默认最多显示50个节点
  }
})

const emit = defineEmits(['close', 'navigate'])

const taskStore = useOfflineTaskStore()
const chartRef = ref(null)
const isLoading = ref(true)  // 🆕 加载状态
let chartInstance = null

const showCompleted = ref(false)   // 显示已完成任务（默认隐藏）
const hideIsolated = ref(true)     // 🆕 隐藏孤立任务（默认开启）
const showLinks = ref(true)        // 引用链接（默认开启）
const showDependencies = ref(true) // 依赖关系（默认开启）
const showSubtasks = ref(true)     // 父子关系（默认开启）
const showLogRelations = ref(false) // 🆕 阻碍-方案关系（默认关闭，避免自环边过多）
const showTagRelations = ref(false) // 🆕 标签关系（默认关闭，避免连线过多）
const selectedCollectionId = ref(null) // 🆕 笔记本筛选（v0.9.2）
const searchKeyword = ref('')      // 搜索关键字
const selectedTaskId = ref(props.centerTaskId) // 选中的任务ID
const displayLimit = ref(20)       // 🔧 显示数量限制（50 → 20，减少初始加载）
const relationDepth = ref(2)       // 🆕 关系层级深度
const showIsolatedHint = ref(true) // 🆕 显示孤立任务提示
const showHideIsolatedHint = ref(false) // 🆕 显示隐藏孤立提示
const controlsCollapsed = ref(false) // 🆕 控制栏收起状态

// 可选择的任务列表
const availableTasks = computed(() => {
  return taskStore.tasks
    .filter(t => showCompleted.value || t.status !== 'completed')
    .sort((a, b) => {
      // 按关系数量排序
      const aCount = (a.linkedTasks?.length || 0) + (a.waitFor?.length || 0) + (a.subtasks?.length || 0)
      const bCount = (b.linkedTasks?.length || 0) + (b.waitFor?.length || 0) + (b.subtasks?.length || 0)
      return bCount - aCount
    })
})

// 监听选择变化
watch(selectedTaskId, () => {
  updateChart()
})

// 是否触发了节点数量限制
const isLimited = computed(() => {
  if (selectedTaskId.value) return false
  const totalTasks = taskStore.tasks.filter(t => showCompleted.value || t.status !== 'completed').length
  return totalTasks > displayLimit.value  // 🆕 使用动态限制
})

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

  // 获取要显示的任务
  let tasksToShow = selectedTaskId.value 
    ? getRelatedTasks(selectedTaskId.value)
    : taskStore.tasks.filter(t => showCompleted.value || t.status !== 'completed')

  // 🆕 笔记本筛选（v0.9.2）
  if (selectedCollectionId.value !== null) {
    tasksToShow = tasksToShow.filter(t => t.collectionId === selectedCollectionId.value)
  }

  // 如果任务数量超过限制，按关系数量排序并截取
  if (tasksToShow.length > displayLimit.value) {
    tasksToShow = tasksToShow
      .map(t => ({
        ...t,
        relationCount: (t.linkedTasks?.length || 0) + 
                      (t.waitFor?.length || 0) + 
                      (t.subtasks?.length || 0) +
                      (taskStore.getBacklinks(t.id)?.length || 0)
      }))
      .sort((a, b) => b.relationCount - a.relationCount)
      .slice(0, displayLimit.value)
  }

  // 🆕 过滤孤立任务（在截取之后）
  if (hideIsolated.value) {
    const beforeCount = tasksToShow.length
    tasksToShow = tasksToShow.filter(t => !isTaskIsolated(t))
    console.log('🚫 隐藏孤立任务:', beforeCount, '→', tasksToShow.length)
  }

  tasksToShow.forEach(task => {
    // 添加节点
    if (!nodeMap.has(task.id)) {
      // ✨ 节点状态标识
      let opacity = 1
      let borderWidth = 0
      let borderColor = '#999'
      
      if (task.status === 'completed') {
        opacity = 0.5  // 已完成半透明
      } else if (task.status === 'overdue') {
        borderWidth = 3
        borderColor = '#ef4444'  // 逾期红色边框
      }

      // 🆕 检查是否有日志关系（v0.9.1）
      const logRelations = taskStore.getLogRelations(task.id)
      const hasUnresolvedBlocks = taskStore.getUnresolvedBlocks(task.id).length > 0
      
      if (showLogRelations.value && logRelations.length > 0) {
        borderWidth = 3
        borderColor = '#f97316'  // 橙色边框：有阻碍-方案关系
      } else if (showLogRelations.value && hasUnresolvedBlocks) {
        borderWidth = 3
        borderColor = '#ef4444'  // 红色边框：有未解决阻碍
      }

      nodes.push({
        id: String(task.id),
        name: task.text || '未命名任务',
        value: task.priority === 'high' ? 100 : task.priority === 'medium' ? 60 : 30,
        category: getCategoryIndex(task),
        symbolSize: task.id === selectedTaskId.value ? 60 : 40,
        itemStyle: {
          color: task.id === selectedTaskId.value ? '#f59e0b' : getCategoryColor(task.category),
          opacity: opacity,  // ✨ 状态透明度
          borderWidth: task.id === selectedTaskId.value ? 3 : borderWidth,  // ✨ 状态边框
          borderColor: task.id === selectedTaskId.value ? '#f59e0b' : borderColor
        },
        // 🆕 存储日志关系信息用于tooltip
        logRelationsCount: logRelations.length,
        unresolvedBlocksCount: hasUnresolvedBlocks ? taskStore.getUnresolvedBlocks(task.id).length : 0
      })
      nodeMap.add(task.id)
    }

    // 添加引用链接
    if (showLinks.value && task.linkedTasks?.length) {
      task.linkedTasks.forEach(linkedId => {
        if (nodeMap.has(linkedId) || tasksToShow.find(t => t.id === linkedId)) {
          const linkedTask = taskStore.tasks.find(t => t.id === linkedId)
          edges.push({
            source: String(task.id),
            target: String(linkedId),
            label: { show: false },
            lineStyle: { 
              color: '#8b5cf6',
              width: 3,  // 🔧 引用链接加粗（强关联）
              type: 'solid'
            },
            // 🆕 边线tooltip
            tooltip: {
              formatter: `🔗 引用链接<br/>${task.text} → ${linkedTask?.text || '未知任务'}`
            }
          })
        }
      })
    }

    // 添加依赖关系
    if (showDependencies.value && task.waitFor?.length) {
      task.waitFor.forEach(waitId => {
        if (nodeMap.has(waitId) || tasksToShow.find(t => t.id === waitId)) {
          const waitTask = taskStore.tasks.find(t => t.id === waitId)
          edges.push({
            source: String(task.id),
            target: String(waitId),
            label: { show: false },
            lineStyle: { 
              color: '#ef4444',
              width: 3,  // 🔧 依赖关系加粗（强关联）
              type: 'dashed'
            },
            // 🆕 边线tooltip
            tooltip: {
              formatter: `🔒 依赖关系<br/>${task.text} 等待 ${waitTask?.text || '未知任务'}`
            }
          })
        }
      })
    }

    // 添加父子关系
    if (showSubtasks.value && task.parentTaskId) {
      if (nodeMap.has(task.parentTaskId) || tasksToShow.find(t => t.id === task.parentTaskId)) {
        const parentTask = taskStore.tasks.find(t => t.id === task.parentTaskId)
        edges.push({
          source: String(task.parentTaskId),
          target: String(task.id),
          label: { show: false },
          lineStyle: { 
            color: '#10b981',
            width: 2,  // 父子关系保持中等粗细
            type: 'dotted'
          },
          // 🆕 边线tooltip
          tooltip: {
            formatter: `🌳 父子关系<br/>${parentTask?.text || '未知任务'} → ${task.text}`
          }
        })
      }
    }

    // 🆕 添加日志关系标记（自环边）（v0.9.1）
    if (showLogRelations.value) {
      const logRelations = taskStore.getLogRelations(task.id)
      if (logRelations.length > 0) {
        // 添加自环边表示任务内部有阻碍-方案关系
        edges.push({
          source: String(task.id),
          target: String(task.id),
          label: { 
            show: true,
            formatter: `💡${logRelations.length}`,
            fontSize: 10,
            color: '#f97316'
          },
          lineStyle: { 
            color: '#f97316',
            width: 2,
            type: 'solid',
            curveness: 0.5
          }
        })
      }
    }

    // 🆕 添加标签关系（v0.9.2）
    if (showTagRelations.value && task.tags?.length > 0) {
      // 查找有相同标签的其他任务
      task.tags.forEach(tag => {
        tasksToShow.forEach(otherTask => {
          if (otherTask.id !== task.id && 
              otherTask.tags?.includes(tag) && 
              nodeMap.has(otherTask.id)) {
            // 避免重复边（只添加 id 小的指向 id 大的）
            if (task.id < otherTask.id) {
              edges.push({
                source: String(task.id),
                target: String(otherTask.id),
                label: { show: false },
                lineStyle: { 
                  color: '#94a3b8',
                  width: 1,  // 标签关系最细（弱关联）
                  type: 'dotted',
                  opacity: 0.3
                },
                // 🆕 边线tooltip
                tooltip: {
                  formatter: `🏷️ 标签关系<br/>${task.text} ⇄ ${otherTask.text}<br/>共同标签: #${tag}`
                }
              })
            }
          }
        })
      })
    }
  })

  return { nodes, edges }
})

const nodes = computed(() => graphData.value.nodes)
const edges = computed(() => graphData.value.edges)

// 🆕 关系统计（v0.9.2）
const relationStats = computed(() => {
  const stats = {
    total: edges.value.length,
    links: 0,    // 引用链接
    deps: 0,     // 依赖关系
    subtasks: 0, // 父子关系
    logs: 0,     // 阻碍方案
    tags: 0      // 标签关系
  }
  
  edges.value.forEach(edge => {
    // 自环边 = 阻碍方案
    if (edge.source === edge.target) {
      stats.logs++
    }
    // 根据线条样式判断类型
    else if (edge.lineStyle.color === '#8b5cf6') {
      stats.links++  // 紫色 = 引用
    } else if (edge.lineStyle.color === '#ef4444') {
      stats.deps++   // 红色 = 依赖
    } else if (edge.lineStyle.color === '#10b981') {
      stats.subtasks++ // 绿色 = 父子
    } else if (edge.lineStyle.color === '#94a3b8') {
      stats.tags++   // 灰色 = 标签
    }
  })
  
  return stats
})

// 🆕 孤立任务（无任何关系）
const isolatedTasks = computed(() => {
  const tasksToCheck = showCompleted.value 
    ? taskStore.tasks 
    : taskStore.tasks.filter(t => t.status !== 'completed')
  
  return tasksToCheck.filter(task => {
    const hasLinks = task.linkedTasks?.length > 0
    const hasDeps = task.waitFor?.length > 0
    const hasParent = !!task.parentTaskId
    const hasSubtasks = task.subtasks?.length > 0
    const hasBacklinks = taskStore.getBacklinks(task.id)?.length > 0
    
    return !hasLinks && !hasDeps && !hasParent && !hasSubtasks && !hasBacklinks
  })
})

// 🆕 判断任务是否孤立（v0.9.2 更新：包含日志关系和标签关系）
function isTaskIsolated(task) {
  const hasLinks = task.linkedTasks?.length > 0
  const hasDeps = task.waitFor?.length > 0
  const hasParent = !!task.parentTaskId
  const hasSubtasks = task.subtasks?.length > 0
  const hasBacklinks = taskStore.getBacklinks(task.id)?.length > 0
  const hasLogRelations = taskStore.getLogRelations(task.id).length > 0
  const hasTags = task.tags?.length > 0  // 🆕 标签关系
  
  return !hasLinks && !hasDeps && !hasParent && !hasSubtasks && !hasBacklinks && !hasLogRelations && !hasTags
}

// 🆕 切换显示已完成任务
function toggleCompleted() {
  showCompleted.value = !showCompleted.value
  console.log('✅ 切换已完成任务显示:', showCompleted.value)
}

// 🆕 监听 hideIsolated 变化，显示提示3秒
watch(hideIsolated, (newVal) => {
  if (newVal) {
    showHideIsolatedHint.value = true
    setTimeout(() => {
      showHideIsolatedHint.value = false
    }, 3000)
  }
})

// 🆕 初始化时显示孤立任务提示3秒
onMounted(() => {
  // 🔧 延迟渲染，避免阻塞UI
  setTimeout(() => {
    initChart()
    // 🆕 图表初始化完成后隐藏加载动画
    setTimeout(() => {
      isLoading.value = false
    }, 300)
  }, 50)
  
  if (isolatedTasks.value.length > 0) {
    setTimeout(() => {
      showIsolatedHint.value = false
    }, 3000)
  }
})

// 🆕 显示孤立任务
function showIsolatedTasks() {
  if (isolatedTasks.value.length === 0) return
  
  // 高亮孤立任务
  const isolatedIds = isolatedTasks.value.map(t => String(t.id))
  chartInstance.setOption({
    series: [{
      data: nodes.value.map(node => ({
        ...node,
        symbolSize: isolatedIds.includes(node.id) ? 60 : 40,
        itemStyle: {
          ...node.itemStyle,
          borderWidth: isolatedIds.includes(node.id) ? 4 : node.itemStyle.borderWidth,
          borderColor: isolatedIds.includes(node.id) ? '#f59e0b' : node.itemStyle.borderColor
        }
      }))
    }]
  })
}

// 🆕 获取相关任务（可配置层级深度）
function getRelatedTasks(taskId) {
  const related = new Set()
  const queue = [taskId]
  const visited = new Set()
  let depth = 0

  while (queue.length > 0 && depth < relationDepth.value) {  // 🆕 使用动态层级
    const levelSize = queue.length
    for (let i = 0; i < levelSize; i++) {
      const currentId = queue.shift()
      if (visited.has(currentId)) continue
      visited.add(currentId)

      const task = taskStore.tasks.find(t => t.id === currentId)
      if (task) {
        // 🆕 过滤孤立任务
        if (hideIsolated.value && isTaskIsolated(task)) {
          continue
        }
        
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
  return colors[category] || '#94a3b8'
}

// 🆕 获取笔记本层级深度（v0.9.2）
function getCollectionDepth(collection) {
  let depth = 0
  let current = collection
  while (current.parentId) {
    depth++
    current = taskStore.collections.find(c => c.id === current.parentId)
    if (!current) break
  }
  return depth
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
          const logRelations = params.data.logRelationsCount || 0
          const unresolvedBlocks = params.data.unresolvedBlocksCount || 0
          
          let tooltip = `
            <strong>${params.data.name}</strong><br/>
            分类：${task?.category === 'work' ? '工作' : task?.category === 'study' ? '学习' : '生活'}<br/>
            优先级：${task?.priority === 'high' ? '高' : task?.priority === 'medium' ? '中' : '低'}
          `
          
          // 🆕 添加日志关系信息（v0.9.1）
          if (logRelations > 0) {
            tooltip += `<br/>💡 阻碍-方案：${logRelations}个`
          }
          if (unresolvedBlocks > 0) {
            tooltip += `<br/>🚫 未解决阻碍：${unresolvedBlocks}个`
          }
          
          return tooltip
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
        initLayout: 'circular',  // 🔧 圆形初始布局，更快
        repulsion: 80,           // 🔧 降低斥力（200 → 80）
        edgeLength: 100,         // 🔧 缩短边长（150 → 100）
        gravity: 0.1,
        friction: 0.6            // 🔧 增加摩擦力，快速稳定
        // 移除 layoutAnimation: false，保留拖动功能
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
    console.log('🖱️ 图谱节点点击:', params)
    if (params.dataType === 'node') {
      const taskId = parseInt(params.data.id)
      console.log('📍 跳转到任务:', taskId)
      emit('navigate', taskId)
    }
  })

  // 🆕 双击节点展开关系网络
  chartInstance.on('dblclick', (params) => {
    if (params.dataType === 'node') {
      const taskId = parseInt(params.data.id)
      selectedTaskId.value = taskId
      console.log('🔍 展开任务关系网络:', taskId)
    }
  })
}

// 🆕 导出为图片
async function exportAsImage() {
  if (!chartInstance) return
  
  try {
    const url = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = `任务关系图谱_${new Date().toLocaleDateString()}.png`
    link.href = url
    link.click()
    
    console.log('✅ 图片导出成功')
  } catch (error) {
    console.error('❌ 图片导出失败:', error)
    alert('导出失败，请重试')
  }
}

// 🆕 更新图谱
function updateChart() {
  if (!chartInstance) return

  console.log('🔄 更新图谱')
  console.log('  hideIsolated:', hideIsolated.value)
  console.log('  showCompleted:', showCompleted.value)
  console.log('  showLinks:', showLinks.value)
  console.log('  showDependencies:', showDependencies.value)
  console.log('  showSubtasks:', showSubtasks.value)
  console.log('  nodes:', nodes.value.length)
  console.log('  edges:', edges.value.length)
  
  chartInstance.setOption({
    legend: [{
      data: categoryStats.value.map(s => ({ name: s.name, icon: 'circle', itemStyle: { color: s.color } })),
      formatter: (name) => {
        const stat = categoryStats.value.find(s => s.name === name)
        return `${name} (${stat?.count || 0})`
      }
    }],
    series: [{
      type: 'graph',  // 🔧 必须包含 type
      data: nodes.value,
      links: edges.value,
      categories: [
        { name: '工作', itemStyle: { color: '#8b5cf6' } },
        { name: '学习', itemStyle: { color: '#3b82f6' } },
        { name: '生活', itemStyle: { color: '#10b981' } }
      ]
    }]
  }, { notMerge: false, lazyUpdate: false }) // 🔧 使用合并模式
}

// 🆕 重置视图
function resetView() {
  selectedTaskId.value = null
  searchKeyword.value = ''
  if (chartInstance) {
    chartInstance.dispatchAction({
      type: 'restore'
    })
  }
}

// 监听数据变化
watch([
  showLinks, 
  showDependencies, 
  showSubtasks, 
  showLogRelations,      // 🆕 添加
  showTagRelations,      // 🆕 添加
  showCompleted, 
  displayLimit, 
  hideIsolated, 
  relationDepth,
  selectedCollectionId   // 🆕 添加笔记本筛选
], () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  // 🆕 3秒后隐藏孤立任务提示
  if (isolatedTasks.value.length > 0) {
    setTimeout(() => {
      showIsolatedHint.value = false
    }, 3000)
  }
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

/* 🆕 加载动画 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  color: #8b5cf6;
  font-size: 1rem;
  font-weight: 500;
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

.stat-detail {
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 8px;
  color: #666;
  font-size: 0.85rem;
  font-weight: 400;
}

.stat-item.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  font-size: 0.85rem;
}

.graph-controls {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.graph-controls.collapsed {
  padding: 8px 20px;
}

.toggle-controls-btn {
  align-self: flex-start;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.toggle-controls-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.controls-content {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.task-selector,
.collection-filter {
  flex: 1;
  min-width: 200px;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.collection-filter:hover {
  border-color: #8b5cf6;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 6px 12px;
  border: 1px solid #8b5cf6;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

@media (max-width: 768px) {
  .task-selector,
  .search-input {
    width: 100%;
    flex: none;
    font-size: 0.85rem;
  }
}

/* 🆕 数量控制 */
.limit-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 150px;
}

.limit-control label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.limit-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #e5e7eb 0%, #8b5cf6 100%);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.limit-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.limit-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.limit-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

@media (max-width: 768px) {
  .limit-control {
    width: 100%;
    flex: none;
  }
}

@media (max-width: 768px) {
  .task-selector {
    width: 100%;
    flex: none;
    font-size: 0.85rem;
  }
}

.task-selector:focus,
.search-input:focus {
  outline: none;
  border-color: #8b5cf6;
}

.task-selector option {
  padding: 8px;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

@media (max-width: 768px) {
  .search-box {
    width: 100%;
    flex: none;
  }
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
  white-space: nowrap;
}

@media (max-width: 768px) {
  .control-btn {
    flex: 1;
    padding: 8px 6px;
    font-size: 1.1rem;
  }
  
  .control-btn span {
    display: none;
  }
}

.control-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.control-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.control-btn .checkbox {
  font-size: 1.2rem;
  margin-right: 4px;
}

.graph-container {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
}

/* 🆕 孤立任务提示 */
.isolated-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(245, 158, 11, 0.95);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
  animation: slideDown 0.3s ease-out;
}

/* 🆕 淡入淡出动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.isolated-hint.success {
  background: rgba(16, 185, 129, 0.95);
}

@keyframes slideDown {
  from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

.hint-btn {
  background: white;
  color: #f59e0b;
  border: none;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.hint-btn:hover {
  transform: scale(1.05);
}

/* 🆕 导出按钮 */
.export-btn {
  position: absolute;
  bottom: 80px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  z-index: 10;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.export-btn:active {
  transform: translateY(0);
}

.graph-legend {
  display: flex;
  gap: 20px;
  padding: 12px 20px;
  background: white;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #666;
}

.line-sample {
  width: 30px;
  height: 2px;
  display: inline-block;
}

.line-sample.solid.purple {
  background: #8b5cf6;
}

.line-sample.dashed.red {
  background: linear-gradient(to right, #ef4444 0%, #ef4444 50%, transparent 50%, transparent 100%);
  background-size: 8px 2px;
  background-repeat: repeat-x;
}

.line-sample.dotted.green {
  background: linear-gradient(to right, #10b981 0%, #10b981 33%, transparent 33%, transparent 100%);
  background-size: 6px 2px;
  background-repeat: repeat-x;
}

.line-sample.solid.orange {
  background: #f97316;
}

.line-sample.dotted.gray {
  background: linear-gradient(to right, #94a3b8 0%, #94a3b8 33%, transparent 33%, transparent 100%);
  background-size: 6px 2px;
  background-repeat: repeat-x;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .graph-legend {
    flex-direction: column;
    gap: 8px;
    padding: 8px 12px;
  }
  
  .legend-item {
    font-size: 0.75rem;
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
