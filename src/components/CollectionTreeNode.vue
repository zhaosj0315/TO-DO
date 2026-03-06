<template>
  <div class="tree-node">
    <!-- 当前节点 -->
    <div 
      class="collection-item"
      :class="{ selected: selectedIds.includes(collection.id) }"
    >
      <!-- 第一行：笔记本信息 -->
      <div class="first-row">
        <!-- 展开/折叠按钮（绝对定位） -->
        <button 
          v-if="hasChildren"
          class="expand-btn"
          @click.stop="$emit('toggle-expand', collection.id)"
        >
          {{ isExpanded ? '▼' : '▶' }}
        </button>
        
        <!-- 笔记本信息 -->
        <div 
          class="collection-info" 
          @click="handleClick"
          :style="{ cursor: 'pointer' }"
        >
          <span class="icon">{{ collection.icon }}</span>
          <span v-if="collection.isPrivate" class="lock">🔒</span>
          <span class="name">{{ collection.name }}</span>
          <span class="count">({{ getTaskCount(collection.id) }})</span>
        </div>
      </div>
      
      <!-- 第二行：操作按钮 -->
      <div v-if="!batchMode" class="second-row">
        <div class="actions">
          <button @click.stop="$emit('create-child', collection.id)" title="新建子笔记本">➕</button>
          <button @click.stop="$emit('rename', collection)" title="重命名">📝</button>
          <button v-if="!collection.isPrivate" @click.stop="$emit('setPrivate', collection)" title="设为私密">🔒</button>
          <button v-if="collection.isPrivate" @click.stop="$emit('changePassword', collection)" title="修改密码">🔑</button>
          <button @click.stop="$emit('moveCollection', collection)" title="移动笔记本">📦</button>
          <button @click.stop="$emit('moveIn', collection)" title="迁入任务">⬇️</button>
          <button @click.stop="$emit('moveOut', collection)" title="迁出任务">⬆️</button>
          <button @click.stop="$emit('delete', collection)" title="删除" class="delete-btn">🗑️</button>
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
</script>

<style scoped>
.tree-node {
  width: 100%;
}

.collection-item {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 16px 12px 8px; /* 左边距改为8px */
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
  margin-bottom: 4px;
  position: relative;
}

.collection-item:hover {
  background: #f3f4f6;
}

.collection-item.selected {
  background: #fef3c7; /* 改为黄色背景 */
  border: 2px solid #f59e0b; /* 改为橙色边框 */
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

/* 展开/折叠按钮 */
.expand-btn {
  position: absolute;
  left: -8px; /* 放在卡片左边缘外侧 */
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  font-size: 0.75rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  flex-shrink: 0;
  padding: 0;
  margin: 0;
  z-index: 1;
}

.expand-btn:hover {
  color: #667eea;
  transform: translateY(-50%) scale(1.2);
}

.expand-placeholder {
  display: none; /* 不再需要占位符 */
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
  padding: 4px 0; /* 删除左右内边距 */
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 0;
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

/* 操作按钮 */
.actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.actions button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
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
