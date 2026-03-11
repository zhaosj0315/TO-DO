<template>
  <div class="tag-node">
    <!-- 当前节点 -->
    <div 
      class="tag-item"
      :style="{ paddingLeft: `${level * 20}px` }"
      @click="$emit('select', node.path)"
    >
      <!-- 展开/折叠按钮 -->
      <button 
        v-if="hasChildren"
        class="expand-btn"
        @click.stop="$emit('toggle', node.path)"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </button>
      <span v-else class="expand-placeholder"></span>

      <!-- 标签图标 -->
      <span class="tag-icon">{{ hasChildren ? '📁' : '🏷️' }}</span>

      <!-- 标签名称 -->
      <span class="tag-name">{{ node.name }}</span>

      <!-- 任务数量 -->
      <span class="tag-count">{{ node.count }}</span>
    </div>

    <!-- 子节点（递归） -->
    <template v-if="isExpanded && hasChildren">
      <TagTreeNode
        v-for="child in childrenArray"
        :key="child.path"
        :node="child"
        :level="level + 1"
        :expandedPaths="expandedPaths"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  expandedPaths: {
    type: Set,
    required: true
  }
})

defineEmits(['toggle', 'select'])

const hasChildren = computed(() => {
  return Object.keys(props.node.children).length > 0
})

const isExpanded = computed(() => {
  return props.expandedPaths.has(props.node.path)
})

const childrenArray = computed(() => {
  return Object.values(props.node.children).sort((a, b) => b.count - a.count)
})
</script>

<style scoped>
.tag-node {
  margin: 2px 0;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.tag-item:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: translateX(4px);
}

.expand-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: #999;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.expand-btn:hover {
  color: #8b5cf6;
}

.expand-placeholder {
  width: 20px;
  flex-shrink: 0;
}

.tag-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.tag-name {
  flex: 1;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-count {
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
