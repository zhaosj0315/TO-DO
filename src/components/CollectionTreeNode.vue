<template>
  <div class="tree-node">
    <!-- 当前节点 -->
    <div 
      class="collection-item"
      :class="{ selected: selectedIds.includes(collection.id) }"
      :style="{ paddingLeft: `${level * 20 + 16}px` }"
    >
      <!-- 展开/折叠按钮 -->
      <button 
        v-if="hasChildren"
        class="expand-btn"
        @click="$emit('toggle-expand', collection.id)"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </button>
      <span v-else class="expand-placeholder"></span>

      <!-- 批量选择复选框 -->
      <input 
        v-if="batchMode" 
        type="checkbox" 
        :checked="selectedIds.includes(collection.id)"
        @change="$emit('toggle-select', collection.id)"
        class="checkbox"
      />
      
      <!-- 笔记本信息 -->
      <div 
        class="collection-info" 
        @click="!batchMode && $emit('select', collection.id)" 
        :style="{ cursor: batchMode ? 'default' : 'pointer' }"
      >
        <span class="icon">{{ collection.icon }}</span>
        <span v-if="collection.isPrivate" class="lock">🔒</span>
        <span class="name">{{ collection.name }}</span>
        <span class="count">({{ getTaskCount(collection.id) }})</span>
      </div>
      
      <!-- 操作按钮 -->
      <div v-if="!batchMode" class="actions">
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

defineEmits([
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
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.collection-item:hover {
  background: #f3f4f6;
}

.collection-item.selected {
  background: #f0f9ff;
  border: 2px solid #0ea5e9;
}

/* 展开/折叠按钮 */
.expand-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  flex-shrink: 0;
}

.expand-btn:hover {
  color: #667eea;
  transform: scale(1.2);
}

.expand-placeholder {
  width: 24px;
  flex-shrink: 0;
}

/* 复选框 */
.checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

/* 笔记本信息 */
.collection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding: 4px 8px;
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
