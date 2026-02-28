<template>
  <div class="task-detail-overlay" @click.self="$emit('close')">
    <div class="task-detail-sheet">
      <!-- 头部 -->
      <div class="detail-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <input 
          v-model="localTask.text"
          @blur="saveField('text')"
          class="title-input"
          placeholder="任务标题"
        />
        <button class="ai-summary-btn-header" @click="handleAISummary" title="AI智能总结">
          ✨
        </button>
      </div>

      <!-- 滚动内容区 -->
      <div class="detail-content" ref="detailContentRef">
        <!-- 任务概览（紧凑版） -->
        <section class="overview-section">
          <h3>📊 任务信息</h3>
          <div class="overview-grid">
            <div class="overview-item">
              <span class="label">优先级</span>
              <select v-model="localTask.priority" @change="saveField('priority')" class="field-select">
                <option value="high">⚡ 高</option>
                <option value="medium">📊 中</option>
                <option value="low">📉 低</option>
              </select>
            </div>
            
            <div class="overview-item">
              <span class="label">分类</span>
              <select v-model="localTask.category" @change="saveField('category')" class="field-select">
                <option value="work">💼 工作</option>
                <option value="study">📚 学习</option>
                <option value="life">🏠 生活</option>
              </select>
            </div>
            
            <div class="overview-item">
              <span class="label">类型</span>
              <select v-model="localTask.type" @change="handleTypeChange" class="field-select">
                <option value="today">📅 今天</option>
                <option value="tomorrow">📆 明天</option>
                <option value="this_week">📋 本周内</option>
                <option value="custom_date">🗓️ 指定日期</option>
                <option value="daily">🔄 每天重复</option>
                <option value="weekday">💼 工作日重复</option>
                <option value="weekly">📆 每周重复</option>
              </select>
            </div>
            
            <div v-if="localTask.type === 'custom_date'" class="overview-item overview-item-full">
              <span class="label">截止时间</span>
              <input 
                type="datetime-local" 
                v-model="customDateTime"
                @change="handleDateTimeChange"
                class="field-input"
              />
            </div>
            
            <div class="overview-item">
              <span class="label">状态</span>
              <span :class="['status-badge', task.status]">
                {{ getStatusText(task.status) }}
                <span v-if="task.status === 'pending' && task.stats?.totalLogs > 0">
                  ({{ task.stats.progressHistory[task.stats.progressHistory.length - 1] || 0 }}%)
                </span>
              </span>
            </div>
          </div>
          
          <!-- 时间轴（增强版） -->
          <div class="timeline-horizontal">
            <div class="timeline-item">
              <div class="timeline-label">📅 创建</div>
              <div class="timeline-dot created"></div>
              <div class="timeline-time">{{ formatDate(task.created_at) }}</div>
            </div>
            
            <div class="timeline-connector">
              <div v-if="task.logs && task.logs.length > 0" class="timeline-progress-bar" :style="{ width: getProgressWidth() }"></div>
            </div>
            
            <div v-if="task.logs && task.logs.length > 0" class="timeline-item timeline-logs">
              <div class="timeline-label">💬 {{ task.logs.length }}条日志</div>
              <div class="timeline-dot progress"></div>
              <div class="timeline-time">{{ getLatestProgress() }}</div>
            </div>
            
            <div class="timeline-connector">
              <div v-if="task.completed_at" class="timeline-progress-bar" style="width: 100%"></div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-label">⏰ 截止</div>
              <div :class="['timeline-dot', getDeadlineClass(task)]"></div>
              <div class="timeline-time">{{ formatDeadline(task) }}</div>
            </div>
            
            <template v-if="task.completed_at">
              <div class="timeline-connector completed-line"></div>
              <div class="timeline-item">
                <div class="timeline-label">✅ 完成</div>
                <div class="timeline-dot completed"></div>
                <div class="timeline-time">{{ formatDate(task.completed_at) }}</div>
              </div>
            </template>
          </div>
        </section>

        <!-- 任务描述 -->
        <section class="description-section">
          <h3>📝 任务描述</h3>
          <textarea 
            v-model="localTask.description"
            @blur="saveField('description')"
            class="description-textarea"
            placeholder="输入任务描述..."
            rows="3"
          ></textarea>
        </section>

        <!-- 依赖关系 -->
        <section class="dependency-section">
          
          <!-- 当前状态 -->
          <div v-if="dependencyTasks.length > 0" class="dependency-status blocked">
            <div class="status-icon">🔒</div>
            <div class="status-text">
              <div class="status-title">等待中</div>
              <div class="status-desc">等待 {{ dependencyTasks.length }} 个前置任务完成</div>
            </div>
          </div>
          <div v-else-if="childTasks.length === 0 && blockedTasks.length === 0 && !parentTask" class="dependency-status free">
            <div class="status-icon">✅</div>
            <div class="status-text">
              <div class="status-title">无关系</div>
              <div class="status-desc">此任务独立执行</div>
            </div>
          </div>

          <!-- 父任务（AI拆分来源） -->
          <div v-if="parentTask" class="parent-task-card">
            <div class="card-header">
              <span class="card-title">👨‍👦 父任务（AI拆分来源）</span>
              <span class="relation-badge parent">父子关系</span>
            </div>
            <div 
              class="task-card"
              @click="openTaskDetail(parentTask.id)"
            >
              <div class="task-card-header">
                <span :class="['status-icon', parentTask.status]">
                  {{ parentTask.status === 'completed' ? '✅' : '⬜' }}
                </span>
                <span class="task-name">{{ parentTask.text }}</span>
              </div>
              <div class="task-card-meta">
                <span class="task-category">{{ getCategoryIcon(parentTask.category) }} {{ getCategoryText(parentTask.category) }}</span>
                <span v-if="parentTask.completed_at" class="task-time">
                  完成于 {{ formatDateTime(parentTask.completed_at) }}
                </span>
                <span v-else class="task-time">
                  {{ formatDeadline(parentTask) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 前置任务（手动依赖） -->
          <div v-if="dependencyTasks.length > 0" class="wait-for-card">
            <div class="card-header">
              <span class="card-title">⬆️ 前置任务（手动依赖）</span>
              <span class="relation-badge dependency">依赖关系</span>
            </div>
            <div class="waiting-tasks-list">
              <div 
                v-for="depTask in dependencyTasks" 
                :key="depTask.id"
                class="task-card"
                @click="openTaskDetail(depTask.id)"
              >
                <div class="task-card-header">
                  <span :class="['status-icon', depTask.status]">
                    {{ depTask.status === 'completed' ? '✅' : '⬜' }}
                  </span>
                  <span class="task-name">{{ depTask.text }}</span>
                </div>
                <div class="task-card-meta">
                  <span class="task-category">{{ getCategoryIcon(depTask.category) }} {{ getCategoryText(depTask.category) }}</span>
                  <span v-if="depTask.completed_at" class="task-time">
                    完成于 {{ formatDateTime(depTask.completed_at) }}
                  </span>
                  <span v-else class="task-time">
                    {{ formatDeadline(depTask) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 子任务（AI拆分生成） -->
          <div v-if="childTasks.length > 0" class="child-tasks-card">
            <div class="card-header">
              <span class="card-title">👶 子任务（AI拆分生成）</span>
              <span class="relation-badge parent">父子关系</span>
            </div>
            <div class="waiting-tasks-list">
              <div 
                v-for="childTask in childTasks" 
                :key="childTask.id"
                class="task-card mini"
                @click="openTaskDetail(childTask.id)"
              >
                <span class="task-name">{{ childTask.text }}</span>
                <span :class="['priority-badge', childTask.priority]">
                  {{ getPriorityText(childTask.priority) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 后置任务（手动依赖） -->
          <div v-if="blockedTasks.length > 0" class="blocked-tasks-card">
            <div class="card-header">
              <span class="card-title">⬇️ 后置任务（手动依赖）</span>
              <span class="relation-badge dependency">依赖关系</span>
            </div>
            <div class="waiting-tasks-list">
              <div 
                v-for="blockedTask in blockedTasks" 
                :key="blockedTask.id"
                class="task-card mini"
                @click="openTaskDetail(blockedTask.id)"
              >
                <span class="task-name">{{ blockedTask.text }}</span>
                <span :class="['priority-badge', blockedTask.priority]">
                  {{ getPriorityText(blockedTask.priority) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="dependency-actions">
            <button 
              @click="showWaitForSelector = true" 
              class="btn-set-wait"
            >
              {{ dependencyTasks.length > 0 ? '✏️ 编辑前置任务' : '🔗 添加前置任务' }}
            </button>
            <button 
              v-if="dependencyTasks.length > 0"
              @click="handleClearDependencies" 
              class="btn-clear-wait"
            >
              ✕ 清除前置任务
            </button>
          </div>
        </section>

        <!-- 执行统计 -->
        <section v-if="task.stats && task.stats.totalLogs > 0" class="stats-section">
          <h3>📈 执行统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">🔢</div>
              <div class="stat-value">{{ task.stats.sessionCount }}次</div>
              <div class="stat-label">推进次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⏱️</div>
              <div class="stat-value">{{ formatDuration(task.stats.totalDuration) }}</div>
              <div class="stat-label">总耗时</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⏰</div>
              <div class="stat-value">{{ formatDuration(task.stats.averageSessionDuration) }}</div>
              <div class="stat-label">平均每次</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🚫</div>
              <div class="stat-value">
                {{ task.stats.blockCount }}次
                <span v-if="task.stats.blockCount > 0" class="sub-value">
                  ({{ task.stats.resolvedBlockCount }}已解决)
                </span>
              </div>
              <div class="stat-label">遇到阻碍</div>
            </div>
          </div>
          <div v-if="task.stats && task.stats.tags && task.stats.tags.length > 0" class="tags-container">
            <span class="tag-label">🏷️ 标签:</span>
            <span v-for="tag in task.stats.tags" :key="tag" class="tag-item">
              #{{ tag }}
            </span>
          </div>
        </section>

        <!-- AI总结 -->
        <section v-if="task.aiSummary && localTask.aiSummary" class="ai-summary-section">
          <div class="summary-header">
            <h3>✨ AI智能总结</h3>
            <span class="summary-time">{{ formatDateTime(task.aiSummary.createdAt) }}</span>
          </div>
          <div class="summary-content">
            <textarea 
              v-model="localTask.aiSummary.content"
              @blur="saveAISummary"
              class="summary-textarea"
              placeholder="AI总结内容..."
              rows="3"
            ></textarea>
          </div>
          <div class="summary-meta">
            <span>📊 分析了 {{ task.aiSummary.logsCount }} 条日志</span>
            <span>🤖 模型: {{ task.aiSummary.modelName }}</span>
          </div>
        </section>

        <!-- 执行日志 -->
        <section class="logs-section">
          <div class="logs-header">
            <h3>💬 执行日志 ({{ task.logs?.length || 0 }}条)</h3>
            <button 
              v-if="task.logs && task.logs.length > 0"
              @click="toggleTimelineView" 
              class="view-toggle-btn"
            >
              {{ showTimeline ? '📋 列表视图' : '📈 时间轴视图' }}
            </button>
          </div>

          <div v-if="!task.logs || task.logs.length === 0" class="empty-logs">
            <p>📝 还没有执行日志</p>
            <p class="hint">点击下方"添加日志"开始记录任务执行过程</p>
          </div>

          <div v-else>
            <!-- 搜索过滤栏 -->
            <div class="log-filters">
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="🔍 搜索日志内容..."
                class="search-input"
              >
              <div class="filter-buttons">
                <button 
                  v-for="type in logTypes" 
                  :key="type.value"
                  :class="['filter-btn', { active: filterType === type.value }]"
                  @click="filterType = filterType === type.value ? '' : type.value"
                  :title="type.label"
                >
                  {{ type.icon }}
                </button>
              </div>
            </div>

            <!-- 日志统计 -->
            <LogStats :logs="filteredLogs" :task-title="task.text" />

            <!-- 时间轴视图 -->
            <LogTimeline 
              v-if="showTimeline" 
              :logs="filteredLogs" 
              @update-log="handleUpdateLog"
            />

            <!-- 列表视图 -->
            <div v-else class="logs-list">
            <div
              v-for="log in filteredSortedLogs"
              :key="log.id"
              :class="['log-item', `log-${log.type}`]"
            >
              <!-- 日志头部：类型+时间+删除 -->
              <div class="log-header-compact">
                <div class="log-type-line">
                  <span class="log-type">
                    {{ getLogTypeIcon(log.type) }} {{ getLogTypeText(log.type) }}
                  </span>
                  <div class="log-actions">
                    <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
                    <button class="log-delete-btn" @click="deleteLog(log.id)" title="删除">🗑️</button>
                  </div>
                </div>
              </div>
              
              <!-- 可编辑属性 -->
              <div class="log-editable-fields">
                <!-- 进度 -->
                <div v-if="log.progress !== null" class="edit-field-inline">
                  <label>📊 进度:</label>
                  <input 
                    type="number" 
                    v-model.number="log.progress"
                    @blur="saveLogField(log, 'progress')"
                    min="0" 
                    max="100"
                    class="input-inline"
                  />
                  <span>%</span>
                </div>
                
                <!-- 耗时 -->
                <div v-if="log.duration" class="edit-field-inline">
                  <label>⏱️ 耗时:</label>
                  <input 
                    type="number" 
                    v-model.number="log.duration"
                    @blur="saveLogField(log, 'duration')"
                    min="0"
                    class="input-inline"
                  />
                  <span>分钟</span>
                </div>
                
                <!-- 心情 -->
                <div v-if="log.mood" class="edit-field-inline">
                  <label>心情:</label>
                  <select 
                    v-model="log.mood"
                    @change="saveLogField(log, 'mood')"
                    class="select-inline"
                  >
                    <option value="good">😊 顺利</option>
                    <option value="neutral">😐 一般</option>
                    <option value="bad">😓 困难</option>
                  </select>
                </div>
                
                <!-- 评分 -->
                <div v-if="log.rating" class="edit-field-inline">
                  <label>⭐ 评分:</label>
                  <input 
                    type="number" 
                    v-model.number="log.rating"
                    @blur="saveLogField(log, 'rating')"
                    min="1" 
                    max="5"
                    class="input-inline"
                  />
                  <span>/ 5</span>
                </div>
              </div>
              
              <!-- 日志内容 -->
              <div class="log-content-edit">
                <textarea 
                  v-model="log.content"
                  @blur="saveLogContent(log)"
                  @input="autoResizeTextarea($event); updateLogContent(log)"
                  class="input textarea log-content-textarea" 
                  placeholder="输入日志内容..."
                  rows="1"
                  maxlength="500"
                ></textarea>
              </div>
              
              <!-- 标签（如果有） -->
              <div v-if="log.tags?.length" class="log-meta-compact">
                <span class="meta-tags">
                  <span v-for="tag in log.tags" :key="tag" class="tag-inline">#{{ tag }}</span>
                </span>
              </div>
              
              <div v-if="log.lessons?.length" class="log-lessons">
                <div class="lessons-title">📚 经验教训:</div>
                <ul>
                  <li v-for="(lesson, idx) in log.lessons" :key="idx">{{ lesson }}</li>
                </ul>
              </div>
              <div v-if="log.type === 'block' && log.resolved" class="log-resolved">
                ✅ 已解决 ({{ formatLogTime(log.resolvedAt) }})
                <span v-if="log.resolvedNote">: {{ log.resolvedNote }}</span>
              </div>
            </div>
          </div>
          </div>
        </section>
      </div>

      <!-- 底部操作栏 -->
      <div class="detail-footer">
        <button class="add-log-btn" @click="handleAddLogClick">
          📝 添加日志
        </button>
        <button
          v-if="task.status !== 'completed'"
          class="split-btn"
          @click="handleSplitTask"
        >
          🔨 AI拆解任务
        </button>
        <button
          v-if="task.status !== 'completed'"
          class="complete-btn"
          @click="handleComplete"
        >
          ✅ 标记完成
        </button>
        <button class="delete-btn" @click="handleDelete">
          🗑️ 删除任务
        </button>
      </div>
    </div>

    <!-- 添加日志弹窗 -->
    <AddLogModal
      v-if="showAddLogModal"
      :task="task"
      @close="showAddLogModal = false"
      @submit="handleAddLog"
    />

    <!-- 等待任务选择器 -->
    <WaitForSelector
      :show="showWaitForSelector"
      :task-id="task.id"
      @close="showWaitForSelector = false"
      @confirm="handleSetWaitFor"
    />

    <!-- AI 文本选择菜单 -->
    <AITextMenu
      :visible="showTextMenu"
      :position="menuPosition"
      :selected-text="selectedText"
      @close="closeTextMenu"
      @action="handleTextAction"
    />

    <!-- AI文本处理结果展示 -->
    <AITextResultSheet
      :visible="showTextResult"
      :result="textResult"
      :action="currentTextAction"
      @close="showTextResult = false"
    />

    <!-- AI总结结果展示 -->
    <AITextResultSheet
      :visible="showAISummaryResult"
      :result="aiSummaryContent"
      action="summary"
      @close="showAISummaryResult = false"
    />

    <!-- 加载动画 -->
    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-text">🤖 AI 处理中...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'
import LogTimeline from './LogTimeline.vue'
import LogStats from './LogStats.vue'
import AddLogModal from './AddLogModal.vue'
import AITextMenu from './AITextMenu.vue'
import AITextResultSheet from './AITextResultSheet.vue'
import WaitForSelector from './WaitForSelector.vue'
import { useTextSelection } from '../composables/useTextSelection'
import { AITextService } from '../services/aiTextService'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { registerPlugin } from '@capacitor/core'

const AIAssistant = registerPlugin('AIAssistant')

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'edit', 'refresh', 'split', 'show-loading', 'hide-loading'])

const taskStore = useOfflineTaskStore()
const showAddLogModal = ref(false)
const showTimeline = ref(false)
const showWaitForSelector = ref(false)

// 暴露内部状态给父组件
defineExpose({
  showAddLogModal,
  showWaitForSelector
})

// 依赖关系相关
const waitForTasks = computed(() => {
  return taskStore.getWaitForTasks(props.task.id)
})

const waitingTasks = computed(() => {
  return taskStore.getWaitingTasks(props.task.id)
})

// 父任务（AI拆分来源）
const parentTask = computed(() => {
  if (!props.task.parentTaskId) {
    console.log('TaskDetailModal - parentTask: null (无父任务)')
    return null
  }
  const parent = taskStore.tasks.find(t => t.id === props.task.parentTaskId)
  console.log('TaskDetailModal - parentTask:', {
    taskId: props.task.id,
    taskText: props.task.text,
    parentTaskId: props.task.parentTaskId,
    parentFound: !!parent,
    parentText: parent?.text
  })
  return parent
})

// 子任务（AI拆分生成）
const childTasks = computed(() => {
  const children = taskStore.tasks.filter(t => t.parentTaskId === props.task.id)
  console.log('TaskDetailModal - childTasks:', {
    taskId: props.task.id,
    taskText: props.task.text,
    childrenCount: children.length,
    children: children.map(c => ({ id: c.id, text: c.text, parentTaskId: c.parentTaskId }))
  })
  return children
})

// 前置任务（手动依赖）
const dependencyTasks = computed(() => {
  return taskStore.getWaitForTasks(props.task.id)
})

// 后置任务（手动依赖）
const blockedTasks = computed(() => {
  return taskStore.getWaitingTasks(props.task.id)
})

const handleClearWaitFor = async () => {
  await taskStore.clearWaitFor(props.task.id)
  emit('refresh')
}

// 清除手动依赖（不影响父子关系）
const handleClearDependencies = async () => {
  // 直接清除所有依赖
  await taskStore.clearWaitFor(props.task.id)
  emit('refresh')
}

const handleSetWaitFor = async (waitForTaskIds) => {
  // 直接设置依赖，不自动添加父任务
  await taskStore.setWaitFor(props.task.id, waitForTaskIds)
  showWaitForSelector.value = false
  emit('refresh')
}

const openTaskDetail = (taskId) => {
  // 关闭当前详情，打开新的任务详情
  emit('close')
  // 需要在父组件中处理打开新任务详情
  setTimeout(() => {
    const task = taskStore.tasks.find(t => t.id === taskId)
    if (task) {
      // 触发父组件的打开详情事件
      window.dispatchEvent(new CustomEvent('open-task-detail', { detail: { task } }))
    }
  }, 300)
}

// 搜索过滤
const searchKeyword = ref('')
const filterType = ref('')

const logTypes = [
  { value: 'start', icon: '🚀', label: '开始' },
  { value: 'progress', icon: '📝', label: '进展' },
  { value: 'block', icon: '🚧', label: '阻碍' },
  { value: 'solution', icon: '💡', label: '方案' },
  { value: 'milestone', icon: '🎯', label: '里程碑' },
  { value: 'complete', icon: '✅', label: '完成' }
]

// 过滤后的日志
const filteredLogs = computed(() => {
  if (!props.task?.logs) return []
  
  let logs = props.task.logs
  
  // 按类型过滤
  if (filterType.value) {
    logs = logs.filter(log => log.type === filterType.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    logs = logs.filter(log => 
      log.content.toLowerCase().includes(keyword) ||
      log.tags?.some(tag => tag.toLowerCase().includes(keyword))
    )
  }
  
  return logs
})

// 过滤后的排序日志
const filteredSortedLogs = computed(() => {
  return [...filteredLogs.value].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
})

// 本地任务副本（用于编辑）
const localTask = ref({ 
  ...props.task,
  aiSummary: props.task.aiSummary ? { ...props.task.aiSummary } : null
})

// 监听props.task变化，同步更新localTask
watch(() => props.task, (newTask) => {
  localTask.value = { 
    ...newTask,
    aiSummary: newTask.aiSummary ? { ...newTask.aiSummary } : null
  }
}, { deep: true })

// 自定义日期时间
const customDateTime = ref('')

// 初始化自定义日期时间
if (props.task.type === 'custom_date' && props.task.customDate) {
  const dateStr = props.task.customDate
  const timeStr = props.task.customTime || '23:59'
  customDateTime.value = `${dateStr}T${timeStr}`
}

// 处理任务类型变更
const handleTypeChange = () => {
  if (localTask.value.type === 'custom_date') {
    // 如果切换到指定日期，设置默认时间为今天 23:59
    if (!customDateTime.value) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      customDateTime.value = `${dateStr}T23:59`
      localTask.value.customDate = dateStr
      localTask.value.customTime = '23:59'
    }
  } else {
    // 清除自定义日期时间
    localTask.value.customDate = null
    localTask.value.customTime = null
  }
  saveField('type')
}

// 处理日期时间变更
const handleDateTimeChange = () => {
  if (customDateTime.value) {
    const [date, time] = customDateTime.value.split('T')
    localTask.value.customDate = date
    localTask.value.customTime = time
    saveField('customDate')
    saveField('customTime')
  }
}

// 文本选择菜单
const detailContentRef = ref(null)
const { showMenu: showTextMenu, menuPosition, selectedText, closeTextMenu, replaceSelectedText } = useTextSelection(detailContentRef)

// AI文本处理结果
const showTextResult = ref(false)
const textResult = ref('')
const currentTextAction = ref('')
const isProcessing = ref(false)

// AI 拆解任务
const handleSplitTask = () => {
  emit('split', props.task)
}

// 处理 AI 文本操作
const handleTextAction = async ({ action, text, tone }) => {
  console.log('TaskDetailModal handleTextAction:', { action, text, tone })
  
  if (!text || text.trim() === '') {
    alert('未检测到选中的文本，请重新选择')
    return
  }
  
  try {
    closeTextMenu()
    isProcessing.value = true
    
    const result = await AITextService.processText(action, text, { tone })
    console.log('AI result:', result)
    
    isProcessing.value = false
    
    // 显示结果
    currentTextAction.value = action
    textResult.value = result
    showTextResult.value = true
  } catch (error) {
    isProcessing.value = false
    console.error('AI处理失败:', error)
    alert(`AI处理失败：${error.message}`)
  }
}

// 初始化所有textarea的自适应高度
onMounted(() => {
  nextTick(() => {
    const textareas = document.querySelectorAll('.log-content-textarea')
    textareas.forEach(textarea => {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    })
  })
})

// 排序后的日志（最新的在上面）

// 排序后的日志（最新的在上面）
const sortedLogs = computed(() => {
  if (!localTask.value.logs) return []
  return [...localTask.value.logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
})

// 状态文本
const getStatusText = (status) => {
  const map = {
    pending: '⏳ 进行中',
    completed: '✓ 已完成',
    overdue: '⚠️ 已逾期'
  }
  return map[status] || status
}

// 优先级
const getPriorityIcon = (priority) => {
  const map = { high: '⚡', medium: '📌', low: '📋' }
  return map[priority] || ''
}

const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

// 分类
const getCategoryIcon = (category) => {
  const map = { work: '💼', study: '📚', life: '🏠' }
  return map[category] || ''
}

const getCategoryText = (category) => {
  const map = { work: '工作', study: '学习', life: '生活' }
  return map[category] || category
}

// 截止时间
const formatDeadline = (task) => {
  const deadline = taskStore.calculateDeadline(task)
  if (!deadline) return '无截止时间'
  
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 0) return '已逾期'
  if (hours < 24) return `剩余 ${hours} 小时`
  
  const days = Math.floor(hours / 24)
  return `剩余 ${days} 天`
}

const getDeadlineClass = (task) => {
  const deadline = taskStore.calculateDeadline(task)
  if (!deadline) return ''
  
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 0) return 'overdue'
  if (hours < 2) return 'urgent'
  if (hours < 24) return 'warning'
  return 'normal'
}

// 日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}


// 日期格式化（简短版，用于时间轴）
const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 获取进度宽度
const getProgressWidth = () => {
  const progress = localTask.value.stats?.progressHistory?.[localTask.value.stats.progressHistory.length - 1] || 0
  return `${progress}%`
}

// 获取最新进度
const getLatestProgress = () => {
  const progress = localTask.value.stats?.progressHistory?.[localTask.value.stats.progressHistory.length - 1] || 0
  return `进度 ${progress}%`
}

// 截止时间格式化（简短版）
const formatDeadlineShort = (task) => {
  const deadline = getTaskDeadline(task)
  if (!deadline) return '无'
  const date = new Date(deadline)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatLogTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  // 始终显示完整的 年/月/日 时:分
  return `${year}/${month}/${day} ${hour}:${minute}`
}

// 时长格式化
const formatDuration = (minutes) => {
  if (!minutes) return '0分钟'
  if (minutes < 60) return `${minutes}分钟`
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

// 自适应textarea高度
const autoResizeTextarea = (event) => {
  const textarea = event.target
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

// 更新日志内容（实时）
const updateLogContent = (log) => {
  // 实时更新，不需要额外操作
}

// 保存日志内容（失焦时）
const saveLogContent = (log) => {
  if (log.content && log.content.trim()) {
    const logIndex = localTask.value.logs.findIndex(l => l.id === log.id)
    if (logIndex !== -1) {
      localTask.value.logs[logIndex].content = log.content.trim()
      taskStore.updateTask(props.task.id, { logs: localTask.value.logs })
      emit('refresh')
    }
  }
}

// 保存日志字段（进度、耗时、心情、评分等）
const saveLogField = (log, field) => {
  const logIndex = localTask.value.logs.findIndex(l => l.id === log.id)
  if (logIndex !== -1) {
    localTask.value.logs[logIndex][field] = log[field]
    taskStore.updateTask(props.task.id, { logs: localTask.value.logs })
    emit('refresh')
  }
}

// 保存字段
const saveField = (field) => {
  const updates = {}
  if (field === 'text') {
    updates.text = localTask.value.text
  } else if (field === 'description') {
    updates.description = localTask.value.description
  } else {
    updates[field] = localTask.value[field]
  }
  taskStore.updateTask(props.task.id, updates)
  emit('refresh')
}

// 保存AI总结
const saveAISummary = () => {
  if (localTask.value.aiSummary) {
    taskStore.updateTask(props.task.id, { aiSummary: localTask.value.aiSummary })
    emit('refresh')
  }
}

// 切换时间轴视图
const toggleTimelineView = () => {
  showTimeline.value = !showTimeline.value
}

// 更新日志内容
const handleUpdateLog = (updatedLog) => {
  const logIndex = localTask.value.logs.findIndex(l => l.id === updatedLog.id)
  if (logIndex !== -1) {
    localTask.value.logs[logIndex] = updatedLog
    taskStore.updateTask(localTask.value)
  }
}

// 删除日志
const deleteLog = (logId) => {
  if (confirm('确定要删除这条日志吗？')) {
    localTask.value.logs = localTask.value.logs.filter(l => l.id !== logId)
    taskStore.updateTask(props.task.id, { logs: localTask.value.logs })
    emit('refresh')
  }
}

// 日志类型
const getLogTypeIcon = (type) => {
  const map = {
    start: '🚀',
    progress: '📈',
    block: '🚫',
    solution: '💡',
    milestone: '🎯',
    complete: '✅'
  }
  return map[type] || '📝'
}

const getLogTypeText = (type) => {
  const map = {
    start: '开始执行',
    progress: '进展更新',
    block: '遇到阻碍',
    solution: '解决方案',
    milestone: '里程碑',
    complete: '完成总结'
  }
  return map[type] || type
}

// 心情图标
const getMoodIcon = (mood) => {
  const map = {
    good: '😊 顺利',
    neutral: '😐 一般',
    bad: '😓 困难'
  }
  return map[mood] || ''
}

// 添加日志点击
const handleAddLogClick = () => {
  console.log('添加日志按钮被点击')
  showAddLogModal.value = true
}

// 添加日志
const handleAddLog = async (logData) => {
  console.log('handleAddLog called', logData)
  await taskStore.addTaskLog(props.task.id, logData)
  showAddLogModal.value = false
  emit('refresh')
}

// 完成任务
const handleComplete = async () => {
  console.log('handleComplete called')
  
  // 检查是否可以完成
  if (!taskStore.canStart(props.task.id)) {
    const waitForTasks = taskStore.getWaitForTasks(props.task.id)
    const unfinishedTasks = waitForTasks.filter(t => t.status !== 'completed')
    const taskNames = unfinishedTasks.map(t => t.text).join('、')
    alert(`⚠️ 无法完成任务\n\n请先完成依赖任务：\n${taskNames}`)
    return
  }
  
  if (confirm('确定要标记任务为已完成吗？')) {
    await taskStore.updateTask(props.task.id, { 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    emit('close')
    emit('refresh')
  }
}

// 删除任务
const handleDelete = async () => {
  console.log('handleDelete called')
  if (confirm('确定要删除这个任务吗？')) {
    const taskId = props.task.id
    emit('close') // 先关闭弹窗
    await taskStore.deleteTask(taskId) // 再删除任务
    emit('refresh')
  }
}

// AI总结功能
const showAISummaryResult = ref(false)
const aiSummaryContent = ref('')

const handleAISummary = async () => {
  try {
    // 准备总结文本
    const logs = localTask.value.logs || []
    const logsText = logs.map(log => 
      `[${log.type}] ${log.content} (进度:${log.progress}%, 耗时:${log.duration}分钟)`
    ).join('\n')
    
    const summaryText = `任务名称：${localTask.value.text}
任务描述：${localTask.value.description || '无'}
优先级：${localTask.value.priority}
分类：${localTask.value.category}
执行日志数量：${logs.length}条

执行日志详情：
${logsText || '暂无日志'}

请根据以上信息，生成一份简洁的任务执行总结（100字以内）。`
    
    // 获取默认模型配置
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]
    
    if (!model) {
      alert('请先在个人主页配置AI模型')
      return
    }
    
    // 显示loading
    isProcessing.value = true
    
    console.log('使用模型:', model.name, model.url)
    
    // 确保 OpenAI URL 包含完整路径
    let apiUrl = model.url
    if (model.type === 'openai' && !apiUrl.includes('/v1/chat/completions')) {
      apiUrl = apiUrl.replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(model.apiKey ? { 'Authorization': `Bearer ${model.apiKey}` } : {})
      },
      body: JSON.stringify(
        model.type === 'openai' 
          ? {
              model: model.modelName || 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: summaryText }]
            }
          : {
              model: model.modelName || 'gemma2:2b',
              prompt: summaryText,
              stream: false
            }
      )
    })
    
    console.log('API响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API错误响应:', errorText)
      
      // 特殊处理 ngrok 403 错误
      if (response.status === 403 && model.url.includes('ngrok')) {
        throw new Error(`Ngrok访问被拒绝\n\n请先在浏览器中访问：\n${model.url.split('/api')[0]}\n\n点击"Visit Site"后再试`)
      }
      
      throw new Error(`API错误: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('API返回结果:', result)
    
    const summary = model.type === 'openai' 
      ? result.choices[0].message.content 
      : result.response
    
    // 保存总结到任务
    const aiSummary = {
      content: summary,
      createdAt: new Date().toISOString(),
      logsCount: logs.length,
      modelName: model.name
    }
    
    await taskStore.updateTask(props.task.id, { aiSummary })
    
    // 刷新页面
    emit('refresh')
    
    isProcessing.value = false
    
    // 显示总结结果弹窗
    aiSummaryContent.value = summary
    showAISummaryResult.value = true
    
  } catch (error) {
    isProcessing.value = false
    console.error('AI总结失败:', error)
    alert(`AI总结失败：${error.message}\n\n请确保：\n1. Mac上运行了 ollama serve\n2. 手机和Mac在同一WiFi\n3. 输入了正确的Mac IP地址\n4. 查看控制台日志了解详情`)
  }
}

</script>

<style scoped>
.task-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.task-detail-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 头部 */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

/* 添加拖动手柄 */
.detail-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.detail-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
  padding: 0.5rem 1rem 0 1rem;
}

.title-input {
  flex: 1;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0 1rem;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0.5rem;
}

.title-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.title-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.back-btn,
.edit-btn,
.ai-summary-btn-header {
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0 1rem;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-summary-btn-header {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 165, 0, 0.3));
  font-size: 1.2rem;
  padding: 0 0.8rem;
  animation: glow-ai 2s ease-in-out infinite;
}

@keyframes glow-ai {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
  }
}

.back-btn:hover,
.edit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.ai-summary-btn-header:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.5), rgba(255, 165, 0, 0.5));
  animation: none;
}

/* 内容区 */
.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.log-filters {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

section {
  margin-bottom: 1.5rem;
}

section h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: #333;
}

/* AI总结区域 */
.ai-summary-section {
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
  border-radius: 12px;
  padding: 1rem;
  border: 2px solid #ffd700;
  margin-bottom: 1.5rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.summary-header h3 {
  margin: 0;
  color: #d97706;
}

.summary-time {
  font-size: 0.75rem;
  color: #92400e;
}

.summary-content {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.summary-textarea {
  width: 100%;
  background: white;
  border: 1px solid rgba(217, 119, 6, 0.3);
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.summary-textarea:focus {
  outline: none;
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
}

.summary-content p {
  margin: 0;
  color: #333;
}

.summary-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #92400e;
}

.summary-meta span {
  background: rgba(255, 255, 255, 0.6);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}


/* 概览卡片 */
.overview-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
}

/* 概览网格（紧凑版） */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.overview-item-full {
  grid-column: 1 / -1;
}

.field-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.field-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 时间轴（横向版） */
.timeline-horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  padding: 1.5rem 1rem;
  position: relative;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
  z-index: 2;
}

.timeline-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
}

.timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.timeline-dot.created {
  background: #4caf50;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
}

.timeline-dot.completed {
  background: #2196f3;
  box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.2);
}

.timeline-dot.normal {
  background: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
}

.timeline-dot.warning {
  background: #ff9800;
  box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.2);
}

.timeline-dot.urgent {
  background: #f44336;
  box-shadow: 0 0 0 4px rgba(244, 67, 54, 0.2);
}

.timeline-dot.overdue {
  background: #d32f2f;
  box-shadow: 0 0 0 4px rgba(211, 47, 47, 0.2);
}

.timeline-time {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.timeline-connector {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, rgba(102, 126, 234, 0.3), rgba(102, 126, 234, 0.1));
  margin: 0 0.5rem;
  position: relative;
  top: -12px;
}

.overview-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.overview-item:last-child {
  margin-bottom: 0;
}

.overview-item .label {
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.field-select {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
}

.field-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.completed {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.overdue {
  background: #ffebee;
  color: #d32f2f;
}

.priority-badge,
.category-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  background: #f0f0f0;
}

.priority-badge.high {
  background: #ffebee;
  color: #d32f2f;
}

.priority-badge.medium {
  background: #fff3e0;
  color: #f57c00;
}

.priority-badge.low {
  background: #e3f2fd;
  color: #1976d2;
}

.deadline-text.overdue {
  color: #d32f2f;
  font-weight: 600;
}

.deadline-text.urgent {
  color: #d32f2f;
}

.deadline-text.warning {
  color: #f57c00;
}

.deadline-text.normal {
  color: #666;
}

/* 描述卡片 */
.description-section {
  margin-bottom: 1.5rem;
}

.description-textarea {
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.description-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.description-textarea::placeholder {
  color: #999;
}

/* 依赖关系 */
.dependency-section {
  margin-bottom: 1.5rem;
}

.dependency-status {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.dependency-status.blocked {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.dependency-status.blocking {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.dependency-status.free {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.dependency-status .status-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.dependency-status .status-text {
  flex: 1;
}

.dependency-status .status-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.2rem;
}

.dependency-status .status-desc {
  font-size: 0.85rem;
  color: #666;
}

.wait-for-card, .waiting-tasks-card, .parent-task-card, .child-tasks-card, .blocked-tasks-card {
  margin-bottom: 1rem;
}

.card-header {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
}

.relation-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.relation-badge.parent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.relation-badge.dependency {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.task-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.task-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.task-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.task-card .status-icon {
  font-size: 1.2rem;
}

.task-card .status-icon.completed {
  color: #10b981;
}

.task-card .task-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.task-card-meta {
  display: flex;
  gap: 0.8rem;
  font-size: 0.8rem;
  color: #666;
}

.task-card .task-category {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.waiting-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-card.mini {
  padding: 0.7rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-card.mini .task-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.priority-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.priority-badge.high {
  background: #fee;
  color: #c33;
}

.priority-badge.medium {
  background: #ffefd5;
  color: #d97706;
}

.priority-badge.low {
  background: #e0f2fe;
  color: #0284c7;
}

.dependency-actions {
  display: flex;
  gap: 0.8rem;
}

.btn-set-wait, .btn-clear-wait {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-set-wait {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-set-wait:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-clear-wait {
  background: #f5f5f5;
  color: #666;
}

.btn-clear-wait:hover {
  background: #e5e5e5;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  padding: 0.6rem;
  text-align: center;
}

.stat-icon {
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.sub-value {
  font-size: 0.7rem;
  opacity: 0.9;
  display: block;
  margin-top: 0.2rem;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.9;
}

/* 标签 */
.tags-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-label {
  font-weight: 600;
  color: #666;
}

.tag-item {
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #667eea;
  border: 1px solid #667eea;
}

/* 时间进度 */
.timeline-section {
  margin-bottom: 1.5rem;
}

.timeline-container {
  display: flex;
  align-items: center;
  padding: 1.5rem 1rem;
  background: white;
  border-radius: 12px;
  overflow-x: auto;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.timeline-dot.created {
  background: #2196f3;
}

.timeline-dot.normal {
  background: #4caf50;
}

.timeline-dot.warning {
  background: #ff9800;
}

.timeline-dot.urgent {
  background: #f44336;
}

.timeline-dot.overdue {
  background: #9e9e9e;
}

.timeline-dot.completed {
  background: #4caf50;
}

.timeline-content {
  text-align: center;
}

.timeline-label {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.timeline-value {
  font-size: 0.85rem;
  color: #333;
  font-weight: 600;
}

.timeline-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, #2196f3, #4caf50);
  margin: 0 0.5rem;
  min-width: 40px;
  align-self: flex-start;
  margin-top: 8px;
}

.timeline-line.completed {
  background: #4caf50;
}

/* 日志列表 */
.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.empty-logs {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
}

.empty-logs p {
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.85rem;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.log-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid #667eea;
  margin-bottom: 0.75rem;
}

.log-item.log-start {
  border-left-color: #4caf50;
}

.log-item.log-progress {
  border-left-color: #2196f3;
}

.log-item.log-block {
  border-left-color: #f44336;
}

.log-item.log-solution {
  border-left-color: #ff9800;
}

.log-item.log-milestone {
  border-left-color: #9c27b0;
}

.log-item.log-complete {
  border-left-color: #4caf50;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

/* 日志头部（紧凑版） */
.log-header-compact {
  margin-bottom: 0.4rem;
}

.log-type-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
}

.log-header-compact .log-type {
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
  flex: 1;
}

.log-header-compact .log-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.log-header-compact .progress-inline,
.log-header-compact .duration-inline,
.log-header-compact .char-count-inline,
.log-header-compact .mood-inline,
.log-header-compact .rating-inline {
  margin-left: 0.5rem;
  font-size: 0.7rem;
  color: #999;
  font-weight: 400;
}

.log-delete-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.log-delete-btn:hover {
  opacity: 1;
}

.log-type {
  font-weight: 600;
  flex: 1;
}
  font-size: 0.9rem;
  color: #333;

.log-time {
  font-size: 0.8rem;
  color: #999;
}

.log-content {
  color: #333;
  line-height: 1.8;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 0.5rem 0;
}

/* 可编辑字段（内联） */
.log-editable-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

.edit-field-inline {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
}

.edit-field-inline label {
  color: #666;
  font-weight: 500;
}

.input-inline {
  width: 60px;
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
}

.input-inline:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.select-inline {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
}

.select-inline:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.log-content-edit {
  margin: 0.4rem 0;
}

.log-content-edit .edit-field {
  margin-bottom: 0;
}

.log-content-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: none;
  min-height: 80px;
  max-height: 300px;
  overflow-y: auto;
  transition: border-color 0.2s;
  line-height: 1.6;
}

.log-content-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.char-count {
  font-size: 0.7rem;
  color: #999;
  text-align: right;
  margin-top: 0.2rem;
}
  white-space: pre-wrap;

.log-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

/* 元数据（紧凑版） */
.log-meta-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  margin-top: 0.4rem;
}

.log-meta-compact .meta-item {
  font-size: 0.75rem;
  color: #666;
  background: #f8f9fa;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.log-meta-compact .meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.log-meta-compact .tag-inline {
  display: inline-block;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.meta-item {
  font-size: 0.85rem;
  color: #666;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
}

.log-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.log-tag {
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #667eea;
  border: 1px solid #667eea;
}

.log-lessons {
  margin-top: 0.75rem;
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
}

.lessons-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.log-lessons ul {
  margin: 0;
  padding-left: 1.5rem;
}

.log-lessons li {
  margin-bottom: 0.25rem;
  color: #666;
}

.log-resolved {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #e8f5e9;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #388e3c;
}

/* 底部操作栏 */
.detail-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.detail-footer button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-log-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.split-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.complete-btn {
  background: #4caf50;
  color: white;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.detail-footer button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.detail-footer button:active {
  transform: translateY(0);
}

.view-toggle-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.view-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 加载动画 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10010;
  backdrop-filter: blur(8px);
}

.loading-spinner {
  text-align: center;
}

.spinner-ring {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-text {
  color: white;
  font-size: 1rem;
  font-weight: 600;
}
</style>
