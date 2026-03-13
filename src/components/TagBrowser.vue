<template>
  <div class="tag-browser-overlay" @click.self="$emit('close')">
    <div class="tag-browser-sheet">
      <!-- 头部 -->
      <div class="browser-header">
        <button class="back-btn" @click="selectedTag ? (selectedTag = null) : $emit('close')">
          <span>{{ selectedTag ? '← 返回标签列表' : '← 返回' }}</span>
        </button>
        <h2>{{ selectedTag ? `🏷️ ${selectedTag}` : '🏷️ 标签浏览器' }}</h2>
        <div class="tag-stats">
          <span class="stat-item">{{ totalTags }} 个标签</span>
          <span class="stat-item">{{ totalTasks }} 个任务</span>
        </div>
      </div>

      <!-- 标签列表视图 -->
      <div v-if="!selectedTag" class="tag-tree">
        <div v-if="tagTreeArray.length === 0" class="empty-state">
          <span class="icon">🏷️</span>
          <p>暂无标签</p>
          <p class="hint">在任务描述中使用 #标签 来创建标签</p>
        </div>

        <TagTreeNode
          v-for="node in tagTreeArray"
          :key="node.path"
          :node="node"
          :level="0"
          :expandedPaths="expandedPaths"
          @toggle="toggleExpand"
          @select="handleSelect"
          @manage="handleManage"
          @migrateIn="handleMigrateIn"
          @migrateOut="handleMigrateOut"
        />
      </div>

      <!-- 标签管理视图 -->
      <div v-else class="tag-manage-view">
        <!-- 任务列表 -->
        <div class="task-list">
          <div v-if="tagTasks.length === 0" class="empty-state">
            <span class="icon">📝</span>
            <p>该标签下暂无任务</p>
            <p class="hint">点击"➕ 迁入任务"添加任务到此标签</p>
          </div>

          <div 
            v-for="task in tagTasks" 
            :key="task.id" 
            class="task-item"
            @click="openTaskDetail(task.id)"
          >
            <div class="task-header">
              <span :class="['status-icon', task.status]">
                {{ task.status === 'completed' ? '✅' : task.status === 'overdue' ? '⚠️' : '⬜' }}
              </span>
              <span class="task-name">{{ task.text }}</span>
            </div>
            <div class="task-meta">
              <span class="task-category">{{ getCategoryIcon(task.category) }}</span>
              <span class="task-priority" :class="task.priority">{{ getPriorityText(task.priority) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 🆕 迁入任务弹窗 -->
      <div v-if="showMigrateIn" class="migrate-modal" @click.self="showMigrateIn = false">
        <div class="migrate-content">
          <div class="migrate-header">
            <h3>➕ 迁入任务到 #{{ selectedTag }}</h3>
            <button class="btn-close" @click="showMigrateIn = false">✕</button>
          </div>
          
          <div class="search-box">
            <input 
              v-model="migrateSearchKeyword" 
              type="text" 
              placeholder="搜索任务..."
              class="search-input"
            >
          </div>

          <div class="migrate-list">
            <div v-if="availableTasksForMigrate.length === 0" class="empty-hint">
              暂无可迁入的任务
            </div>
            <div 
              v-for="task in availableTasksForMigrate" 
              :key="task.id"
              class="migrate-item"
              @click="migrateTaskIn(task.id)"
            >
              <span class="task-text">{{ task.text }}</span>
              <span class="task-category-small">{{ getCategoryIcon(task.category) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 🆕 迁出任务弹窗 -->
      <div v-if="showMigrateOut" class="migrate-modal" @click.self="showMigrateOut = false">
        <div class="migrate-content">
          <div class="migrate-header">
            <h3>➖ 从 #{{ selectedTag }} 迁出任务</h3>
            <button class="btn-close" @click="showMigrateOut = false">✕</button>
          </div>

          <div class="migrate-list">
            <div v-if="tagTasks.length === 0" class="empty-hint">
              该标签下暂无任务
            </div>
            <div 
              v-for="task in tagTasks" 
              :key="task.id"
              class="migrate-item"
              @click="migrateTaskOut(task.id)"
            >
              <span class="task-text">{{ task.text }}</span>
              <span class="task-category-small">{{ getCategoryIcon(task.category) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'
import TagTreeNode from './TagTreeNode.vue'

const emit = defineEmits(['close', 'filter', 'openTask'])

const taskStore = useOfflineTaskStore()
const expandedPaths = ref(new Set())
const selectedTag = ref(null) // 🆕 当前选中的标签
const showMigrateIn = ref(false) // 🆕 迁入弹窗
const showMigrateOut = ref(false) // 🆕 迁出弹窗
const migrateSearchKeyword = ref('') // 🆕 迁入搜索关键词

// 🆕 构建标签树
const tagTree = computed(() => {
  const tree = {}
  
  taskStore.tasks.forEach(task => {
    task.tags?.forEach(tag => {
      const parts = tag.split('/')
      let current = tree
      let currentPath = ''
      
      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        
        if (!current[part]) {
          current[part] = {
            name: part,
            path: currentPath,
            count: 0,
            children: {}
          }
        }
        
        current[part].count++
        current = current[part].children
      })
    })
  })
  
  return tree
})

// 🆕 转换为数组（用于渲染）
const tagTreeArray = computed(() => {
  return Object.values(tagTree.value).sort((a, b) => b.count - a.count)
})

// 🆕 统计
const totalTags = computed(() => {
  let count = 0
  const countTags = (tree) => {
    Object.values(tree).forEach(node => {
      count++
      if (Object.keys(node.children).length > 0) {
        countTags(node.children)
      }
    })
  }
  countTags(tagTree.value)
  return count
})

const totalTasks = computed(() => {
  const uniqueTasks = new Set()
  taskStore.tasks.forEach(task => {
    if (task.tags?.length > 0) {
      uniqueTasks.add(task.id)
    }
  })
  return uniqueTasks.size
})

// 🆕 展开/折叠
function toggleExpand(path) {
  if (expandedPaths.value.has(path)) {
    expandedPaths.value.delete(path)
  } else {
    expandedPaths.value.add(path)
  }
}

// 🆕 选择标签（过滤任务）
function handleSelect(path) {
  emit('filter', path)
  emit('close')
}

// 🆕 管理标签（查看标签下的任务）
function handleManage(path) {
  selectedTag.value = path
}

// 🆕 迁入任务
function handleMigrateIn(path) {
  selectedTag.value = path
  showMigrateIn.value = true
}

// 🆕 迁出任务
function handleMigrateOut(path) {
  selectedTag.value = path
  showMigrateOut.value = true
}

// 🆕 获取标签下的所有任务
const tagTasks = computed(() => {
  if (!selectedTag.value) return []
  
  return taskStore.tasks.filter(task => 
    task.tags?.includes(selectedTag.value)
  ).sort((a, b) => {
    // 按状态排序：待办 > 逾期 > 已完成
    const statusOrder = { pending: 0, overdue: 1, completed: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })
})

// 🆕 打开任务详情
function openTaskDetail(taskId) {
  emit('openTask', taskId)
}

// 🆕 可迁入的任务（不包含当前标签的任务）
const availableTasksForMigrate = computed(() => {
  const tasks = taskStore.tasks.filter(task => 
    !task.tags?.includes(selectedTag.value)
  )
  
  // 搜索过滤
  if (migrateSearchKeyword.value.trim()) {
    const keyword = migrateSearchKeyword.value.toLowerCase()
    return tasks.filter(task => 
      task.text.toLowerCase().includes(keyword) ||
      task.description?.toLowerCase().includes(keyword)
    )
  }
  
  return tasks
})

// 🆕 迁入任务（添加标签）
async function migrateTaskIn(taskId) {
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (!task) return
  
  // 在描述末尾添加标签
  const newDescription = task.description 
    ? `${task.description} #${selectedTag.value}`
    : `#${selectedTag.value}`
  
  await taskStore.updateTask(taskId, { description: newDescription })
  showMigrateIn.value = false
  migrateSearchKeyword.value = ''
}

// 🆕 迁出任务（移除标签）
async function migrateTaskOut(taskId) {
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (!task) return
  
  // 从描述中移除标签
  const tagPattern = new RegExp(`#${selectedTag.value.replace(/\//g, '\\/')}(?!\\w)`, 'g')
  const newDescription = task.description.replace(tagPattern, '').trim()
  
  await taskStore.updateTask(taskId, { description: newDescription })
  showMigrateOut.value = false
}

// 🆕 辅助函数
function getCategoryIcon(category) {
  const icons = { work: '💼', study: '📚', life: '🏠' }
  return icons[category] || '📝'
}

function getPriorityText(priority) {
  const texts = { high: '高', medium: '中', low: '低' }
  return texts[priority] || '中'
}

</script>

<style scoped>
.tag-browser-overlay {
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

.tag-browser-sheet {
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

/* 🆕 顶部小横条 */
.tag-browser-sheet::before {
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

.browser-header {
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

.browser-header h2 {
  flex: 1;
  margin: 0;
  font-size: 1.2rem;
  color: white;
  font-weight: 600;
}

.tag-stats {
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

.tag-tree {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
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

/* 🆕 标签管理视图 */
.tag-manage-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
}

.task-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-icon {
  font-size: 1.2rem;
}

.status-icon.completed {
  opacity: 0.5;
}

.status-icon.overdue {
  animation: pulse 2s infinite;
}

.task-name {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  color: #666;
}

.task-category {
  font-size: 1rem;
}

.task-priority {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.task-priority.high {
  background: #fee;
  color: #c00;
}

.task-priority.medium {
  background: #ffeaa7;
  color: #d63031;
}

.task-priority.low {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-remove-tag {
  background: #fee;
  border: none;
  color: #c00;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-remove-tag:hover {
  background: #fcc;
  transform: scale(1.1);
}

/* 🆕 迁入迁出弹窗 */
.migrate-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2100;
}

.migrate-content {
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.migrate-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.migrate-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.search-box {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.migrate-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-hint {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 0.95rem;
}

.migrate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.migrate-item:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: translateX(4px);
}

.task-text {
  flex: 1;
  font-size: 0.95rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-category-small {
  font-size: 1.1rem;
  margin-left: 8px;
}

/* 批量操作 */
.batch-actions {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
}

.btn-batch {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  color: white;
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
