<template>
  <div class="tag-browser-overlay" @click.self="$emit('close')">
    <div class="tag-browser-sheet">
      <!-- 头部 -->
      <div class="browser-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h2>🏷️ 标签浏览器</h2>
        <div class="tag-stats">
          <span class="stat-item">{{ totalTags }} 个标签</span>
          <span class="stat-item">{{ totalTasks }} 个任务</span>
        </div>
      </div>

      <!-- 标签树 -->
      <div class="tag-tree">
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
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'
import TagTreeNode from './TagTreeNode.vue'

const emit = defineEmits(['close', 'filter'])

const taskStore = useOfflineTaskStore()
const expandedPaths = ref(new Set())

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
</style>
