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
      <!-- 控制栏 -->
      <div class="graph-controls">
        <div class="controls-main">
          <div class="search-wrap">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="🔍 搜索任务名称..."
              @input="handleSearch"
              list="task-list"
              class="search-input"
            />
            <datalist id="task-list">
              <option
                v-for="task in availableTasks"
                :key="task.id"
                :value="task.text + (task._relCount > 0 ? '（' + task._relCount + '条关系）' : '')"
              ></option>
            </datalist>
            <button v-if="searchKeyword" class="search-clear" @click="resetView">✕</button>
          </div>
          <button class="ctrl-tag reset" @click="resetView">🔄 重置</button>
        </div>
      </div>

      <!-- 图谱容器 -->
      <!-- 图谱容器（包裹层统一坐标系） -->
      <div class="graph-wrapper">
        <div ref="chartRef" class="graph-container"></div>
        
        <!-- 🆕 拖拽连线层 -->
        <svg v-if="isDragging" class="drag-line-layer">
          <line
            :x1="dragStart.x" :y1="dragStart.y"
            :x2="dragEnd.x" :y2="dragEnd.y"
            stroke="#8b5cf6" stroke-width="3"
            stroke-dasharray="5,5" stroke-linecap="round"
          />
          <circle :cx="dragEnd.x" :cy="dragEnd.y" r="8" fill="#8b5cf6" opacity="0.6" />
        </svg>
        
        <!-- 🆕 连接点 -->
        <div 
          v-for="anchor in visibleAnchors" 
          :key="`anchor-${anchor.nodeId}-${anchor.position}`"
          class="anchor-point"
          :style="{ left: anchor.x + 'px', top: anchor.y + 'px' }"
          @mousedown.stop="startDrag(anchor)"
        ></div>
        
        <!-- 🆕 新任务快速创建弹窗 -->
        <div v-if="showQuickCreate" class="quick-create-modal"
          :style="{ left: quickCreatePos.x + 'px', top: quickCreatePos.y + 'px' }"
        >
          <input ref="quickInputRef" v-model="quickTaskName" type="text"
            placeholder="输入新任务名称..."
            @keyup.enter="createTaskAndLink" @keyup.esc="cancelQuickCreate"
            class="quick-input"
          />
          <div class="quick-actions">
            <button @click="createTaskAndLink" class="btn-create">✓ 创建</button>
            <button @click="cancelQuickCreate" class="btn-cancel">✕ 取消</button>
          </div>
        </div>
        
        <!-- 🆕 关系类型选择菜单 -->
        <div v-if="showRelationMenu" class="relation-menu"
          :style="{ left: relationMenuPos.x + 'px', top: relationMenuPos.y + 'px' }"
        >
          <div class="menu-title">选择关系类型</div>
          <button @click="createRelation('link')" class="menu-item">
            <span class="icon">📎</span><span>引用关系</span><span class="desc">[[任务名]]</span>
          </button>
          <button @click="createRelation('dependency')" class="menu-item">
            <span class="icon">🔗</span><span>依赖关系</span><span class="desc">等待完成</span>
          </button>
          <button @click="createRelation('subtask')" class="menu-item">
            <span class="icon">👨‍👧</span><span>父子关系</span><span class="desc">子任务</span>
          </button>
          <button @click="createRelation('log')" class="menu-item">
            <span class="icon">💬</span><span>日志关联</span><span class="desc">阻碍-方案</span>
          </button>
          <button @click="cancelRelationMenu" class="menu-item cancel">
            <span class="icon">✕</span><span>取消</span>
          </button>
        </div>
      </div>

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
        <!-- 默认模式：层级统计 -->
        <template v-if="!selectedTaskId && Object.keys(levelStatsRef).length > 0">
          <div class="legend-item">
            <span class="node-sample" style="background:#f59e0b; border: 2px solid #d97706;"></span>
            <span>⭐ 核心节点 {{ levelStatsRef[0] || 0 }}个</span>
          </div>
          <div v-if="levelStatsRef[1]" class="legend-item">
            <span class="node-sample" style="background:#8b5cf6;"></span>
            <span>一级关联 {{ levelStatsRef[1] }}个</span>
          </div>
          <div v-if="levelStatsRef[2]" class="legend-item">
            <span class="node-sample" style="background:#a78bfa; opacity:0.8"></span>
            <span>二级关联 {{ levelStatsRef[2] }}个</span>
          </div>
          <div v-if="Object.keys(levelStatsRef).filter(k => k >= 3).length > 0" class="legend-item">
            <span class="node-sample" style="background:#c4b5fd; opacity:0.6"></span>
            <span>三级+ {{ Object.entries(levelStatsRef).filter(([k]) => k >= 3).reduce((s,[,v]) => s+v, 0) }}个</span>
          </div>
          <div class="legend-sep"></div>
        </template>
        <div class="legend-item">
          <span class="node-sample" style="background:#9ca3af;"></span>
          <span>✅ 已完成</span>
        </div>
        <div class="legend-item">
          <span class="line-sample solid purple"></span>
          <span>🔗 引用</span>
        </div>
        <div class="legend-item">
          <span class="line-sample dashed red"></span>
          <span>🔒 依赖</span>
        </div>
        <div class="legend-item">
          <span class="line-sample dotted green"></span>
          <span>🌳 父子</span>
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

const showCompleted = ref(true)   // 显示已完成任务（默认开启）
const hideIsolated = ref(true)     // 🆕 隐藏孤立任务（默认开启 - 只显示有关系的）
const showLinks = ref(true)        // 引用链接（默认开启 - 显示连线）
const showDependencies = ref(true) // 依赖关系（默认开启 - 显示连线）
const showSubtasks = ref(true)     // 父子关系（默认开启 - 显示连线）
const showLogRelations = ref(false) // 🆕 阻碍-方案关系（默认关闭）
const showTagRelations = ref(false) // 🆕 标签关系（默认关闭）
const selectedCollectionId = ref(null) // 🆕 笔记本筛选（v0.9.2）
const searchKeyword = ref('')      // 搜索关键字
const selectedTaskId = ref(props.centerTaskId) // 选中的任务ID
const displayLimit = ref(50)       // 🔧 显示数量限制（默认50）
const relationDepth = ref(2)       // 🆕 关系层级深度（默认2）
const showIsolatedHint = ref(true) // 🆕 显示孤立任务提示
const showHideIsolatedHint = ref(false) // 🆕 显示隐藏孤立提示
const controlsCollapsed = ref(false)
const focusedTaskId = ref(null)
const minRelationCount = ref(1)
const showAdvanced = ref(false)
const showEdgeLabels = ref(false) // 边线标签（默认关闭）

// 🆕 拖拽连线功能状态
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, nodeId: null })
const dragEnd = ref({ x: 0, y: 0 })
const hoveredNodeId = ref(null)
const visibleAnchors = ref([])
const showQuickCreate = ref(false)
const quickCreatePos = ref({ x: 0, y: 0 })
const quickTaskName = ref('')
const quickInputRef = ref(null)
const showRelationMenu = ref(false)
const relationMenuPos = ref({ x: 0, y: 0 })
const pendingRelation = ref({ sourceId: null, targetId: null, isNewTask: false })
const levelStatsRef = ref({}) // 各层级节点数统计（默认模式）
const totalRelCountMapRef = ref(new Map()) // 全量关系数（BFS所有层级）

// 统一的关系数量计算（潜在关系数，用于排序和下拉框显示）
function calcRelCount(task) {
  let cnt = 0
  if (showLinks.value) {
    cnt += (task.linkedTasks?.length || 0)
    cnt += (taskStore.getBacklinks(task.id)?.length || 0)
  }
  if (showDependencies.value) cnt += (task.waitFor?.length || 0)
  if (showSubtasks.value) {
    cnt += task.parentTaskId ? 1 : 0
    cnt += taskStore.tasks.filter(t => t.parentTaskId === task.id).length
  }
  if (showTagRelations.value) cnt += (task.tags?.length || 0)
  return cnt
}

// 可选择的任务列表（按关系数量倒序）
const availableTasks = computed(() => {
  return taskStore.tasks
    .filter(t => showCompleted.value || t.status !== 'completed')
    .map(t => ({
      ...t,
      _relCount: calcRelCount(t),
      _totalRelCount: totalRelCountMapRef.value.get(String(t.id)) ?? calcRelCount(t)
    }))
    .sort((a, b) => b._relCount - a._relCount) // 有关系的排前面，无关系的排后面
})

// 监听选择变化
watch(selectedTaskId, () => {
  updateChart()
})

// 是否触发了节点数量限制
const isLimited = computed(() => {
  if (!selectedTaskId.value) return false
  return graphData.value.nodes.length >= displayLimit.value
})

// 搜索处理：匹配到任务名则切换视图，否则高亮节点
function handleSearch() {
  if (!chartInstance) return
  const keyword = searchKeyword.value.trim()
  
  if (!keyword) {
    selectedTaskId.value = null
    updateChart()
    return
  }

  // 从候选列表选中时，value 格式是 "任务名（直接X条 全量Y条）"，提取任务名
  const nameMatch = keyword.match(/^(.+?)（\d+条关系）$/)
  const taskName = nameMatch ? nameMatch[1] : keyword

  // 精确匹配任务名 → 切换到该任务的关联网络
  const matched = taskStore.tasks.find(t => t.text === taskName)
  if (matched) {
    selectedTaskId.value = matched.id
    return
  }

  // 模糊匹配 → 高亮节点，不切换视图
  selectedTaskId.value = null
  const kw = taskName.toLowerCase()
  chartInstance.setOption({
    series: [{
      data: nodes.value.map(node => ({
        ...node,
        itemStyle: {
          ...node.itemStyle,
          borderWidth: node.name.toLowerCase().includes(kw) ? 4 : node.itemStyle.borderWidth,
          borderColor: node.name.toLowerCase().includes(kw) ? '#f59e0b' : node.itemStyle.borderColor
        }
      }))
    }]
  })
}

// 构建图谱数据
const graphData = computed(() => {
  const nodes = []
  const edges = []
  const nodeMap = new Set()

  // ── Step 1: 确定候选任务集 ──
  let tasksToShow
  if (focusedTaskId.value) {
    // 双击聚焦：只显示该任务及其直接关系
    tasksToShow = getDirectRelatedTasks(focusedTaskId.value)
  } else if (selectedTaskId.value) {
    // 选中某任务：BFS 全量展开，选中任务为0层（主节点）
    const taskSet = new Set([selectedTaskId.value])
    const nodeLevelMap = new Map([[selectedTaskId.value, 0]])
    const queue = [{ id: selectedTaskId.value, level: 0 }]
    while (queue.length > 0) {
      const { id, level } = queue.shift()
      const t = taskStore.tasks.find(x => x.id === id)
      if (!t) continue
      const neighbors = [
        ...(t.linkedTasks || []),
        ...(t.waitFor || []),
        ...(t.parentTaskId ? [t.parentTaskId] : []),
        ...taskStore.tasks.filter(x => x.parentTaskId === t.id).map(x => x.id),
        ...taskStore.getBacklinks(t.id).map(x => x.id)
      ]
      neighbors.forEach(nid => {
        if (!taskSet.has(nid)) {
          taskSet.add(nid)
          nodeLevelMap.set(nid, level + 1)
          queue.push({ id: nid, level: level + 1 })
        }
      })
    }
    tasksToShow = taskStore.tasks
      .filter(t => taskSet.has(t.id))
      .map(t => ({ ...t, _level: nodeLevelMap.get(t.id) ?? 99 }))
  } else {
    // 默认：关系最多的前5个任务 + 它们的所有直接关联任务
    const allTasks = taskStore.tasks.filter(t => showCompleted.value || t.status !== 'completed')
    
    const top5 = allTasks
      .map(t => ({ ...t, _cnt: calcRelCount(t) }))
      .filter(t => t._cnt > 0)
      .sort((a, b) => b._cnt - a._cnt)
      .slice(0, 5)

    const taskSet = new Set(top5.map(t => t.id))
    // BFS 记录每个节点的层级（top5 = 0层）
    const nodeLevelMap = new Map()
    top5.forEach(t => nodeLevelMap.set(t.id, 0))
    const queue = top5.map(t => ({ id: t.id, level: 0 }))
    while (queue.length > 0) {
      const { id, level } = queue.shift()
      const t = taskStore.tasks.find(x => x.id === id)
      if (!t) continue
      const neighbors = [
        ...(t.linkedTasks || []),
        ...(t.waitFor || []),
        ...(t.parentTaskId ? [t.parentTaskId] : []),
        ...taskStore.tasks.filter(x => x.parentTaskId === t.id).map(x => x.id),
        ...taskStore.getBacklinks(t.id).map(x => x.id)
      ]
      neighbors.forEach(nid => {
        if (!taskSet.has(nid)) {
          taskSet.add(nid)
          nodeLevelMap.set(nid, level + 1)
          queue.push({ id: nid, level: level + 1 })
        }
      })
    }

    tasksToShow = taskStore.tasks.filter(t => taskSet.has(t.id))
    // 把层级信息挂到任务上，供节点构建时使用
    tasksToShow = tasksToShow.map(t => ({ ...t, _level: nodeLevelMap.get(t.id) ?? 99 }))
    
    // 统计各层节点数，存到 graphData 外部供图例使用
    const levelStats = {}
    nodeLevelMap.forEach(level => { levelStats[level] = (levelStats[level] || 0) + 1 })
    levelStatsRef.value = levelStats
    console.log(`📊 Top5: ${top5.map(t => `${t.text}(${t._cnt})`).join(', ')}`)
    console.log(`📊 展开后节点: ${tasksToShow.length}个`)
  }

  // ── Step 2: 笔记本筛选 ──
  if (selectedCollectionId.value !== null) {
    tasksToShow = tasksToShow.filter(t => t.collectionId === selectedCollectionId.value)
  }

  // ── Step 3: 数量限制（选中任务模式下限制数量，默认模式已在Step1控制）──
  if (!focusedTaskId.value && selectedTaskId.value && tasksToShow.length > displayLimit.value) {
    tasksToShow = tasksToShow
      .map(t => ({ ...t, _preCount: calcRelCount(t) }))
      .sort((a, b) => b._preCount - a._preCount)
      .slice(0, displayLimit.value)
  }

  // ── Step 4: 占位（全量关系数在 filteredEdges 建好后计算）──
  const totalRelCountMap = new Map()
  totalRelCountMapRef.value = totalRelCountMap

  // ── Step 5: 建节点 ──
  tasksToShow.forEach(task => {
    if (nodeMap.has(task.id)) return
      // ✨ 节点状态标识
      let opacity = 1
      let borderWidth = 0
      let borderColor = '#999'
      const taskLevel = task._level ?? null // 层级（仅默认模式有值）
      
      if (task.status === 'completed') {
        opacity = 0.6
      } else if (task.status === 'overdue') {
        borderWidth = 3
        borderColor = '#ef4444'
      }

      // 核心节点（Top5，0层）加金色粗边框
      if (taskLevel === 0) {
        borderWidth = 4
        borderColor = '#f59e0b'
      }

      const logRelations = taskStore.getLogRelations(task.id)
      const hasUnresolvedBlocks = taskStore.getUnresolvedBlocks(task.id).length > 0
      
      if (showLogRelations.value && logRelations.length > 0) {
        borderWidth = 3
        borderColor = '#f97316'
      } else if (showLogRelations.value && hasUnresolvedBlocks) {
        borderWidth = 3
        borderColor = '#ef4444'
      }

      const relationCount = calcRelCount(task)

      // 过滤最小关系数在后面基于实际边数处理，这里不过滤

      nodes.push({
        id: String(task.id),
        name: task.text || '未命名任务',
        value: relationCount,
        _relationCount: relationCount,
        category: getCategoryIndex(task),
        symbolSize: 30,
        label: {
          show: true,
          position: 'bottom',
          formatter: (params) => {
            const isCore = taskLevel === 0
            const maxLen = isCore ? 12 : 10
            const taskName = params.data.name.length > maxLen ? params.data.name.substring(0, maxLen) + '...' : params.data.name
            const totalRel = totalRelCountMap.get(task.id) ?? 0
            return `${taskName}\n(直接${relationCount} 全量${totalRel})`
          },
          fontSize: taskLevel === 0 ? 13 : 11,
          fontWeight: taskLevel === 0 ? 'bold' : 'normal',
          color: taskLevel === 0 ? '#1a1a1a' : '#555',
          distance: 5,
          lineHeight: 16
        },
        itemStyle: {
          color: task.status === 'completed' 
            ? '#9ca3af'
            : task.id === selectedTaskId.value 
              ? '#f59e0b' 
              : getCategoryColor(task.category),
          opacity: opacity,
          borderWidth: task.id === selectedTaskId.value ? 3 : borderWidth,
          borderColor: task.id === selectedTaskId.value ? '#f59e0b' : borderColor
        },
        relationCount: relationCount,
        logRelationsCount: logRelations.length,
        unresolvedBlocksCount: hasUnresolvedBlocks ? taskStore.getUnresolvedBlocks(task.id).length : 0
      })
      nodeMap.add(task.id)

    // ── Step 5: 建边（只连接已在 nodeMap 里的节点）──
    // 添加引用链接
    if (showLinks.value && task.linkedTasks?.length) {
      task.linkedTasks.forEach(linkedId => {
        if (nodeMap.has(linkedId)) {
          const linkedTask = taskStore.tasks.find(t => t.id === linkedId)
          edges.push({
            source: String(task.id),
            target: String(linkedId),
            lineStyle: { 
              color: '#8b5cf6',
              width: 3,
              type: 'solid'
            },
            // 🆕 边线tooltip
tooltipText: `🔗 引用  ${task.text} → ${linkedTask?.text || '?'}`
          })
        }
      })
    }

    // 添加依赖关系
    if (showDependencies.value && task.waitFor?.length) {
      task.waitFor.forEach(waitId => {
        if (nodeMap.has(waitId)) {
          const waitTask = taskStore.tasks.find(t => t.id === waitId)
          edges.push({
            source: String(task.id),
            target: String(waitId),
            lineStyle: { 
              color: '#ef4444',
              width: 3,
              type: 'dashed'
            },
            // 🆕 边线tooltip
tooltipText: `🔒 依赖  ${task.text} 等待 ${waitTask?.text || '?'}`
          })
        }
      })
    }

    // 添加父子关系
    if (showSubtasks.value && task.parentTaskId) {
      if (nodeMap.has(task.parentTaskId)) {
        const parentTask = taskStore.tasks.find(t => t.id === task.parentTaskId)
        edges.push({
          source: String(task.parentTaskId),
          target: String(task.id),
          lineStyle: { 
            color: '#10b981',
            width: 2,
            type: 'dotted'
          },
          // 🆕 边线tooltip
tooltipText: `🌳 父子  ${parentTask?.text || '?'} → ${task.text}`
        })
      }
    }

    // 标签关系：两个任务之间只建一条边，合并所有共同标签
    if (showTagRelations.value && task.tags?.length > 0) {
      tasksToShow.forEach(otherTask => {
        if (otherTask.id <= task.id || !nodeMap.has(otherTask.id)) return
        const commonTags = task.tags.filter(tag => otherTask.tags?.includes(tag))
        if (commonTags.length === 0) return
        edges.push({
          source: String(task.id),
          target: String(otherTask.id),
          lineStyle: { color: '#94a3b8', width: 1, type: 'dotted', opacity: 0.3 },
          tooltipText: `🏷️ 共同标签 ${commonTags.map(t => '#'+t).join(' ')}  ${task.text} ⇄ ${otherTask.text}`
        })
      })
    }
  })

  // 第二遍：统计每个节点实际画出来的边数
  const edgeCountMap = {}
  edges.forEach(e => {
    edgeCountMap[e.source] = (edgeCountMap[e.source] || 0) + 1
    edgeCountMap[e.target] = (edgeCountMap[e.target] || 0) + 1
  })

  // 过滤掉实际边数不足 minRelationCount 的节点（只在选中任务模式下过滤，默认/聚焦模式跳过）
  const filteredNodes = (focusedTaskId.value || !selectedTaskId.value)
    ? nodes
    : nodes.filter(n => (edgeCountMap[n.id] || 0) >= minRelationCount.value)

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id))

  // 同步过滤边（两端节点都必须在过滤后的节点集里）
  const filteredEdges = edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))

  // 建有向邻接表，统计出度和入度
  const outAdj = {}
  const outDegree = {}
  const inDegree = {}
  filteredEdges.forEach(e => {
    if (!outAdj[e.source]) outAdj[e.source] = []
    outAdj[e.source].push(e.target)
    outDegree[e.source] = (outDegree[e.source] || 0) + 1
    inDegree[e.target] = (inDegree[e.target] || 0) + 1
  })

  // BFS 沿出度方向统计子孙节点数（不含自身）
  const descendantCountMap = {}
  filteredNodes.forEach(n => {
    const visited = new Set([n.id])
    const queue = [n.id]
    while (queue.length > 0) {
      const cur = queue.shift()
      ;(outAdj[cur] || []).forEach(target => {
        if (!visited.has(target)) {
          visited.add(target)
          queue.push(target)
        }
      })
    }
    descendantCountMap[n.id] = visited.size - 1
  })

  // 同步到 ref 供搜索下拉框使用（出度+入度总和）
  const newMap = new Map()
  filteredNodes.forEach(n => {
    newMap.set(n.id, (outDegree[n.id] || 0) + (inDegree[n.id] || 0))
  })
  totalRelCountMapRef.value = newMap

  filteredNodes.forEach(n => {
    const out = outDegree[n.id] || 0
    const inn = inDegree[n.id] || 0
    const desc = descendantCountMap[n.id] || 0
    n.label.formatter = (params) => {
      const taskName = params.data.name.length > 10 ? params.data.name.substring(0, 10) + '...' : params.data.name
      return `${taskName}\n(出${out} 入${inn} 子孙${desc})`
    }
  })

  // 归一化节点大小：最小30，最大45（1.5倍上限）
  const MIN_SIZE = 30
  const MAX_SIZE = 45
  const counts = filteredNodes.map(n => n._relationCount)
  const minCount = Math.min(...counts)
  const maxCount = Math.max(...counts)
  const range = maxCount - minCount || 1

  filteredNodes.forEach(n => {
    n.symbolSize = Math.round(MIN_SIZE + ((n._relationCount - minCount) / range) * (MAX_SIZE - MIN_SIZE))
    delete n._relationCount
  })

  console.log(`📊 最终渲染: ${filteredNodes.length}个节点, ${filteredEdges.length}条边`)
  return { nodes: filteredNodes, edges: filteredEdges }
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

// 🆕 切换显示已完成任务

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

// 🆕 获取直接关系任务（双击聚焦用）
function getDirectRelatedTasks(taskId) {
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (!task) return []
  
  const related = new Set([task])
  
  // 添加所有直接关系的任务
  task.linkedTasks?.forEach(id => {
    const t = taskStore.tasks.find(t => t.id === id)
    if (t) related.add(t)
  })
  
  task.waitFor?.forEach(id => {
    const t = taskStore.tasks.find(t => t.id === id)
    if (t) related.add(t)
  })
  
  if (task.parentTaskId) {
    const t = taskStore.tasks.find(t => t.id === task.parentTaskId)
    if (t) related.add(t)
  }
  
  task.subtasks?.forEach(id => {
    const t = taskStore.tasks.find(t => t.id === id)
    if (t) related.add(t)
  })
  
  // 添加反向链接
  const backlinks = taskStore.getBacklinks(taskId)
  backlinks.forEach(t => related.add(t))
  
  console.log('🔍 直接关系任务:', Array.from(related).map(t => t.text))
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
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      formatter: (params) => {
        if (params.dataType === 'node') {
          const task = taskStore.tasks.find(t => t.id === parseInt(params.data.id))
          const logRelations = params.data.logRelationsCount || 0
          const unresolvedBlocks = params.data.unresolvedBlocksCount || 0
          
          const collection = task?.collectionId 
            ? taskStore.collections.find(c => c.id === task.collectionId)
            : null
          const statusText = task?.status === 'completed' ? '✅ 已完成' : task?.status === 'overdue' ? '⚠️ 已逾期' : '⏳ 待办'
          
          let tooltip = `<strong>${params.data.name}</strong><br/>
            ${statusText} · ${task?.priority === 'high' ? '高优先级' : task?.priority === 'medium' ? '中优先级' : '低优先级'}`
          
          if (collection) tooltip += `<br/>📁 ${collection.name}`
          if (logRelations > 0) tooltip += `<br/>💡 阻碍-方案：${logRelations}个`
          if (unresolvedBlocks > 0) tooltip += `<br/>🚫 未解决阻碍：${unresolvedBlocks}个`
          
          return tooltip
        }
        if (params.dataType === 'edge') {
          return params.data?.tooltipText || ''
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
      edgeSymbol: ['none', 'arrow'],  // source端无符号，target端箭头
      edgeSymbolSize: [0, 8],
      label: {
        show: true,
        position: 'bottom',
        formatter: '{b}',
        fontSize: 11,
        color: '#333',
        distance: 5
      },
      force: {
        initLayout: 'circular',  // 🔧 圆形初始布局，更快
        repulsion: 80,           // 🔧 降低斥力（200 → 80）
        edgeLength: 100,         // 🔧 缩短边长（150 → 100）
        gravity: 0.02,
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

  // 🔧 延迟单击，避免与双击冲突
  let clickTimer = null
  
  // 点击节点跳转（延迟执行）
  chartInstance.on('click', (params) => {
    if (params.dataType === 'node') {
      const taskId = parseInt(params.data.id)
      
      // 清除之前的定时器
      if (clickTimer) {
        clearTimeout(clickTimer)
      }
      
      // 延迟300ms执行，如果期间有双击则取消
      clickTimer = setTimeout(() => {
        console.log('🖱️ 单击跳转到任务:', taskId)
        emit('navigate', taskId)
        clickTimer = null
      }, 300)
    }
  })

  // 🆕 双击节点展开关系网络
  chartInstance.on('dblclick', (params) => {
    if (params.dataType === 'node') {
      // 取消单击事件
      if (clickTimer) {
        clearTimeout(clickTimer)
        clickTimer = null
      }
      
      const taskId = parseInt(params.data.id)
      if (focusedTaskId.value === taskId) {
        // 再次双击取消聚焦
        focusedTaskId.value = null
        console.log('🔍 取消聚焦')
      } else {
        // 聚焦到该任务
        focusedTaskId.value = taskId
        selectedTaskId.value = taskId
        console.log('🔍 聚焦任务关系网络:', taskId)
      }
    }
  })
  
  // 🆕 鼠标悬浮显示连接点
  chartInstance.on('mouseover', (params) => {
    if (params.dataType === 'node') {
      const taskId = parseInt(params.data.id)
      showAnchorsForNode(taskId, params.event.event)
    }
  })
  
  // 🆕 鼠标移出隐藏连接点
  chartInstance.on('mouseout', (params) => {
    if (params.dataType === 'node') {
      setTimeout(hideAnchors, 200) // 延迟隐藏，避免移动到连接点时消失
    }
  })

  // 🔧 拖动节点后固定位置，防止 force 引力把节点吸回中心
  chartInstance.on('mouseup', (params) => {
    if (params.dataType === 'node') {
      const nodeId = params.data.id
      const pos = chartInstance.getOption().series[0].data.find(n => n.id === nodeId)
      if (pos) {
        const updatedData = nodes.value.map(n =>
          n.id === nodeId ? { ...n, fixed: true, x: pos.x, y: pos.y } : n
        )
        chartInstance.setOption({ series: [{ data: updatedData }] }, { notMerge: false })
      }
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
      type: 'graph',
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
  updateChart()
}

// 🆕 ========== 拖拽连线功能 ==========

// 鼠标移动到节点时显示连接点
function showAnchorsForNode(nodeId, event) {
  if (isDragging.value) return
  if (!chartRef.value || !chartInstance) return
  
  // event.offsetX/Y 是相对于 ECharts canvas 的坐标
  // graph-wrapper 和 graph-container 完全重叠，坐标系一致
  const x = event.offsetX
  const y = event.offsetY
  
  const d = 35 // 连接点距节点中心距离
  visibleAnchors.value = [
    { nodeId, position: 'top',    x: x,   y: y-d },
    { nodeId, position: 'right',  x: x+d, y: y   },
    { nodeId, position: 'bottom', x: x,   y: y+d },
    { nodeId, position: 'left',   x: x-d, y: y   }
  ]
  hoveredNodeId.value = nodeId
}

// 隐藏连接点
function hideAnchors() {
  if (!isDragging.value) {
    visibleAnchors.value = []
    hoveredNodeId.value = null
  }
}

// 开始拖拽
function startDrag(anchor) {
  isDragging.value = true
  dragStart.value = { x: anchor.x, y: anchor.y, nodeId: anchor.nodeId }
  dragEnd.value = { x: anchor.x, y: anchor.y }
  
  // 添加全局鼠标监听
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

// 拖拽移动
function onDragMove(event) {
  if (!isDragging.value) return
  const rect = chartRef.value.getBoundingClientRect()
  dragEnd.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

// 结束拖拽
function onDragEnd(event) {
  if (!isDragging.value) return
  
  const rect = chartRef.value.getBoundingClientRect()
  const endX = event.clientX - rect.left
  const endY = event.clientY - rect.top
  
  // 检测是否落在节点上
  const targetNode = detectNodeAtPosition(endX, endY)
  
  if (targetNode && targetNode.id !== dragStart.value.nodeId) {
    // 连接到现有节点
    pendingRelation.value = {
      sourceId: dragStart.value.nodeId,
      targetId: targetNode.id,
      isNewTask: false
    }
    showRelationMenu.value = true
    relationMenuPos.value = { x: endX, y: endY }
  } else if (!targetNode) {
    // 创建新任务
    quickCreatePos.value = { x: endX, y: endY }
    showQuickCreate.value = true
    pendingRelation.value = {
      sourceId: dragStart.value.nodeId,
      targetId: null,
      isNewTask: true
    }
    
    // 聚焦输入框
    setTimeout(() => {
      quickInputRef.value?.focus()
    }, 100)
  }
  
  // 清理状态
  isDragging.value = false
  visibleAnchors.value = []
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

// 检测位置上的节点
function detectNodeAtPosition(x, y) {
  if (!chartInstance) return null
  
  // 将像素坐标转换为图表坐标
  const point = chartInstance.convertFromPixel('grid', [x, y])
  if (!point) return null
  
  // 查找最近的节点
  const threshold = 40 // 检测半径
  for (const node of nodes.value) {
    const nodePos = chartInstance.convertToPixel('grid', [node.x, node.y])
    if (!nodePos) continue
    
    const distance = Math.sqrt(
      Math.pow(nodePos[0] - x, 2) + Math.pow(nodePos[1] - y, 2)
    )
    
    if (distance < threshold) {
      return { id: parseInt(node.id), name: node.name }
    }
  }
  
  return null
}

// 创建任务并建立关系
async function createTaskAndLink() {
  if (!quickTaskName.value.trim()) return
  
  try {
    // 创建新任务
    const newTask = {
      text: quickTaskName.value.trim(),
      description: '',
      type: 'today',
      category: 'work',
      priority: 'medium',
      status: 'pending',
      created_at: new Date().toISOString()
    }
    
    await taskStore.addTask(newTask)
    
    // 获取新创建的任务ID
    const createdTask = taskStore.tasks[taskStore.tasks.length - 1]
    pendingRelation.value.targetId = createdTask.id
    
    // 显示关系类型选择菜单
    showQuickCreate.value = false
    showRelationMenu.value = true
    relationMenuPos.value = quickCreatePos.value
    quickTaskName.value = ''
    
  } catch (error) {
    console.error('创建任务失败:', error)
    alert('创建任务失败，请重试')
  }
}

// 取消快速创建
function cancelQuickCreate() {
  showQuickCreate.value = false
  quickTaskName.value = ''
  pendingRelation.value = { sourceId: null, targetId: null, isNewTask: false }
}

// 创建关系
async function createRelation(type) {
  const { sourceId, targetId } = pendingRelation.value
  if (!sourceId || !targetId) return
  
  try {
    const sourceTask = taskStore.tasks.find(t => t.id === sourceId)
    const targetTask = taskStore.tasks.find(t => t.id === targetId)
    
    if (!sourceTask || !targetTask) {
      throw new Error('任务不存在')
    }
    
    switch (type) {
      case 'link':
        // 引用关系：在源任务描述中添加 [[目标任务名]]
        if (!sourceTask.linkedTasks) sourceTask.linkedTasks = []
        if (!sourceTask.linkedTasks.includes(targetId)) {
          sourceTask.linkedTasks.push(targetId)
          sourceTask.description += `\n[[${targetTask.text}]]`
        }
        break
        
      case 'dependency':
        // 依赖关系：源任务等待目标任务完成
        if (!sourceTask.waitFor) sourceTask.waitFor = []
        if (!sourceTask.waitFor.includes(targetId)) {
          sourceTask.waitFor.push(targetId)
        }
        break
        
      case 'subtask':
        // 父子关系：目标任务成为源任务的子任务
        targetTask.parentTaskId = sourceId
        if (!sourceTask.subtasks) sourceTask.subtasks = []
        if (!sourceTask.subtasks.includes(targetId)) {
          sourceTask.subtasks.push(targetId)
        }
        break
        
      case 'log':
        // 日志关联：在目标任务的日志中添加关联
        if (!targetTask.logs) targetTask.logs = []
        targetTask.logs.push({
          type: 'progress',
          content: `关联任务：${sourceTask.text}`,
          timestamp: new Date().toISOString()
        })
        break
    }
    
    await taskStore.saveTasks()
    updateChart()
    
    console.log(`✅ 创建${type}关系成功:`, sourceId, '→', targetId)
    
  } catch (error) {
    console.error('创建关系失败:', error)
    alert('创建关系失败，请重试')
  } finally {
    cancelRelationMenu()
  }
}

// 取消关系菜单
function cancelRelationMenu() {
  showRelationMenu.value = false
  pendingRelation.value = { sourceId: null, targetId: null, isNewTask: false }
}

// 🆕 ========== 拖拽连线功能结束 ==========

// 监听数据变化
watch([
  showLinks, showDependencies, showSubtasks, showLogRelations,
  showTagRelations, showCompleted, displayLimit, hideIsolated,
  relationDepth, selectedCollectionId, focusedTaskId,
  minRelationCount, showEdgeLabels
], () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  // 延迟渲染，避免阻塞UI
  setTimeout(() => {
    initChart()
    setTimeout(() => { isLoading.value = false }, 300)
  }, 50)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', () => chartInstance?.resize())
})

// 高级选项展开时触发 ECharts resize
watch(showAdvanced, () => {
  setTimeout(() => chartInstance?.resize(), 350)
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
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.controls-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 160px;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #8b5cf6;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
}

.search-wrap .search-input {
  width: 100%;
  padding-right: 28px;
}

.search-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  line-height: 1;
}

.search-clear:hover { color: #333; }

.ctrl-tag {
  padding: 5px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  color: #555;
}

.ctrl-tag:hover {
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.ctrl-tag.active {
  background: #8b5cf6;
  border-color: #8b5cf6;
  color: white;
}

.ctrl-tag.reset {
  padding: 5px 10px;
  color: #999;
}

.controls-advanced {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed #f0f0f0;
}

.adv-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.adv-label {
  font-size: 0.8rem;
  color: #999;
  white-space: nowrap;
}

.adv-val {
  font-size: 0.8rem;
  color: #8b5cf6;
  font-weight: 600;
  min-width: 24px;
}

.adv-input {
  width: 60px;
  padding: 3px 6px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: center;
  outline: none;
  color: #333;
}

.adv-input:focus {
  border-color: #8b5cf6;
}

.limit-slider {
  width: 80px;
  height: 4px;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
  accent-color: #8b5cf6;
}

.graph-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.node-sample {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.legend-sep {
  width: 1px;
  height: 16px;
  background: #e5e7eb;
  margin: 0 4px;
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

/* 🆕 拖拽连线样式 */
.drag-line-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.anchor-point {
  position: absolute;
  width: 16px;
  height: 16px;
  background: rgba(139, 92, 246, 0.3);
  border: 2px solid #8b5cf6;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: crosshair;
  z-index: 999;
  transition: all 0.2s;
}

.anchor-point:hover {
  background: rgba(139, 92, 246, 0.6);
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
}

.quick-create-modal {
  position: absolute;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 16px;
  min-width: 280px;
  z-index: 1001;
  transform: translate(-50%, -50%);
  animation: popIn 0.2s ease-out;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.quick-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.quick-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-create,
.btn-cancel {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.btn-cancel {
  background: #f3f4f6;
  color: #666;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.relation-menu {
  position: absolute;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 8px;
  min-width: 240px;
  z-index: 1001;
  transform: translate(-50%, -50%);
  animation: popIn 0.2s ease-out;
}

.menu-title {
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #999;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.menu-item:hover {
  background: rgba(139, 92, 246, 0.1);
}

.menu-item.cancel:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.menu-item .icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.menu-item .desc {
  margin-left: auto;
  font-size: 0.75rem;
  color: #999;
}
</style>
