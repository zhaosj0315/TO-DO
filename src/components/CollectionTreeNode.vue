<template>
  <div class="tree-node" :data-level="level">
    <!-- 当前节点 -->
    <div 
      class="collection-item"
      :class="{ selected: selectedIds.includes(collection.id) }"
    >
      <!-- 第一行：笔记本信息 -->
      <div class="first-row">
        <!-- 笔记本信息 -->
        <div 
          class="collection-info" 
          @click="handleClick"
          :style="{ cursor: 'pointer', paddingLeft: `${level * 24}px` }"
        >
          <span class="level-badge">{{ getLevelLabel(level) }}</span>
          <span class="icon">{{ collection.icon }}</span>
          <span v-if="collection.isPrivate" class="lock">🔒</span>
          <span class="name">{{ collection.name }}</span>
          <span class="count">({{ getTaskCount(collection.id) }})</span>
          
          <!-- 展开/折叠按钮（放在数量后面） -->
          <button 
            v-if="hasChildren"
            class="expand-btn"
            @click.stop="$emit('toggle-expand', collection.id)"
          >
            {{ isExpanded ? '▼' : '▶' }}
          </button>
          
          <span class="time-info">
            <span class="time-label">创建: {{ formatTime(collection.createdAt) }}</span>
            <span class="time-label">更新: {{ formatTime(collection.updatedAt) }}</span>
          </span>
        </div>
      </div>
      
      <!-- 第二行：操作按钮 -->
      <div v-if="!batchMode" class="second-row" :style="{ paddingLeft: `${level * 24}px` }">
        <div class="actions">
          <button @click.stop="$emit('create-child', collection.id)" title="新建子笔记本">➕ 新建</button>
          <button @click.stop="$emit('rename', collection)" title="重命名">✏️ 改名</button>
          <button v-if="!collection.isPrivate" @click.stop="$emit('setPrivate', collection)" title="设为私密">🔒 加密</button>
          <button v-if="collection.isPrivate" @click.stop="$emit('changePassword', collection)" title="修改密码">🔑 密码</button>
          <button @click.stop="$emit('moveCollection', collection)" title="移动笔记本">📂 移动</button>
          <button @click.stop="$emit('moveIn', collection)" title="迁入任务">⬇️ 迁入</button>
          <button @click.stop="$emit('moveOut', collection)" title="迁出任务">⬆️ 迁出</button>
          <button @click.stop="$emit('delete', collection)" title="删除" class="delete-btn">🗑️ 删除</button>
        </div>
      </div>
    </div>

    <!-- 子节点（递归） -->
    <template v-if="isExpanded && hasChildren">
      <CollectionTreeNode
        v-for="child in children"
        :key="child.id"
        :collection="child"
        :level="level + 1"
        :batchMode="batchMode"
        :selectedIds="selectedIds"
        :expandedIds="expandedIds"
        :getTaskCount="getTaskCount"
        :getChildCollections="getChildCollections"
        @toggle-expand="$emit('toggle-expand', $event)"
        @toggle-select="$emit('toggle-select', $event)"
        @select="$emit('select', $event)"
        @create-child="$emit('create-child', $event)"
        @rename="$emit('rename', $event)"
        @setPrivate="$emit('setPrivate', $event)"
        @changePassword="$emit('changePassword', $event)"
        @moveCollection="$emit('moveCollection', $event)"
        @moveIn="$emit('moveIn', $event)"
        @moveOut="$emit('moveOut', $event)"
        @delete="$emit('delete', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  collection: Object,
  level: Number,
  batchMode: Boolean,
  selectedIds: Array,
  expandedIds: Array,
  getTaskCount: Function,
  getChildCollections: Function
})

const emit = defineEmits([
  'toggle-expand',
  'toggle-select',
  'select',
  'create-child',
  'rename',
  'setPrivate',
  'changePassword',
  'moveCollection',
  'moveIn',
  'moveOut',
  'delete'
])

// 处理点击事件：批量模式切换选中，普通模式选择笔记本
const handleClick = () => {
  if (props.batchMode) {
    emit('toggle-select', props.collection.id)
  } else {
    emit('select', props.collection.id)
  }
}

// 获取子节点
const children = computed(() => {
  return props.getChildCollections(props.collection.id)
})

// 是否有子节点
const hasChildren = computed(() => {
  return children.value.length > 0
})

// 是否展开
const isExpanded = computed(() => {
  return props.expandedIds.includes(props.collection.id)
})

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

// 获取层级标签
const getLevelLabel = (level) => {
  const labels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9']
  return labels[level] || `L${level + 1}`
}
</script>

<style scoped>
.tree-node {
  width: 100%;
}

.collection-item {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
  margin-bottom: 4px;
  position: relative;
  border-left: 3px solid transparent;
}

/* 🆕 层级视觉效果 */
.tree-node[data-level="0"] .collection-item {
  border-left-color: #667eea;
  background: #f9fafb;
}

.tree-node[data-level="1"] .collection-item {
  border-left-color: #f59e0b;
  background: #fef3c7;
}

.tree-node[data-level="2"] .collection-item {
  border-left-color: #10b981;
  background: #d1fae5;
}

.tree-node[data-level="3"] .collection-item {
  border-left-color: #ef4444;
  background: #fee2e2;
}

.collection-item:hover {
  background: #f3f4f6;
}

.collection-item.selected {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

/* 第一行：笔记本信息 */
.first-row {
  display: flex;
  align-items: center;
  width: 100%;
}

/* 第二行：操作按钮 */
.second-row {
  display: flex;
  align-items: center;
}

/* 展开/折叠按钮（内联在第一行） */
.expand-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #667eea;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-left: 4px;
  flex-shrink: 0;
}

.expand-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.15);
}

.expand-btn:active {
  transform: scale(0.9);
}

/* 复选框 */
.checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  display: none; /* 隐藏复选框 */
}

/* 笔记本信息 */
.collection-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 4px 0;
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 0;
  flex-wrap: wrap;
}

.collection-info:hover {
  background: rgba(102, 126, 234, 0.1);
}

.collection-info .icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.collection-info .lock {
  font-size: 0.85rem;
  opacity: 0.7;
  flex-shrink: 0;
}

.collection-info .name {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-info .count {
  color: #666;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.collection-info .time-info {
  display: flex;
  gap: 12px;
  margin-left: auto;
  flex-shrink: 0;
}

.collection-info .time-label {
  font-size: 0.75rem;
  color: #999;
  white-space: nowrap;
}

.collection-info .level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
}

/* 不同层级的徽章颜色 */
.tree-node[data-level="0"] .level-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tree-node[data-level="1"] .level-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.tree-node[data-level="2"] .level-badge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.tree-node[data-level="3"] .level-badge {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

/* 第二行：操作按钮 */
.second-row {
  display: flex;
  align-items: center;
  padding-left: 32px; /* 与展开按钮区域对齐 */
}

/* 操作按钮 */
.actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex-shrink: 0;
  width: 100%;
}

.actions button {
  width: auto;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  border: none;
  background: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
}

.actions .move-in-btn,
.actions .move-out-btn {
  width: auto;
  padding: 0 8px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.actions button:hover {
  transform: scale(1.1);
}

.actions button:nth-child(1):hover {
  background: #d1fae5;
}

.actions button:nth-child(2):hover {
  background: #e0e7ff;
}

.actions button:nth-child(3):hover,
.actions button:nth-child(4):hover {
  background: #fef3c7;
}

.actions button:nth-child(5):hover {
  background: #ddd6fe;
}

.actions button:nth-child(6):hover,
.actions button:nth-child(7):hover {
  background: #bfdbfe;
}

.delete-btn:hover {
  background: #fee !important;
  color: #dc2626;
}
</style>
