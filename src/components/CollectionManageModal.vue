<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>📓 笔记本管理</h3>
        <div class="header-actions">
          <button v-if="!batchMode" class="expand-all-btn" @click="toggleExpandAll" :title="allExpanded ? '折叠全部' : '展开全部'">
            {{ allExpanded ? '📁' : '📂' }}
          </button>
          <button v-if="!batchMode" class="batch-btn" @click="enterBatchMode">多选</button>
          <button v-else class="batch-btn cancel" @click="exitBatchMode">取消</button>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>
      </div>
      
      <div class="modal-body">
        <!-- 全部笔记本 -->
        <div class="all-notebook" @click="!batchMode && $emit('select', null)" :style="{ cursor: batchMode ? 'default' : 'pointer' }">
          <div class="notebook-info">
            <span class="icon">📚</span>
            <span class="name">全部笔记本</span>
            <span class="count">({{ totalTaskCount }})</span>
          </div>
          <div class="description">所有笔记本的任务汇总</div>
        </div>
        
        <!-- 新建笔记本按钮 -->
        <button v-if="!batchMode" class="create-btn" @click="$emit('create', null)">
          ➕ 新建笔记本
        </button>

        <!-- AI 智能归类按钮 -->
        <button v-if="!batchMode && uncategorizedCount > 0" class="ai-classify-btn" @click="$emit('aiClassify')">
          🤖 AI 智能归类未分类任务 ({{ uncategorizedCount }})
        </button>
        
        <!-- 🆕 树形笔记本列表 -->
        <div class="collection-tree">
          <CollectionTreeNode
            v-for="collection in rootCollections"
            :key="collection.id"
            :collection="collection"
            :level="0"
            :batchMode="batchMode"
            :selectedIds="selectedIds"
            :expandedIds="expandedIds"
            :getTaskCount="getTaskCount"
            :getChildCollections="getChildCollections"
            @toggle-expand="toggleExpand"
            @toggle-select="toggleSelect"
            @select="$emit('select', $event)"
            @create-child="$emit('create', $event)"
            @rename="$emit('rename', $event)"
            @setPrivate="$emit('setPrivate', $event)"
            @changePassword="$emit('changePassword', $event)"
            @moveCollection="$emit('moveCollection', $event)"
            @moveIn="$emit('moveIn', $event)"
            @moveOut="$emit('moveOut', $event)"
            @delete="$emit('delete', $event)"
          />
          
          <div v-if="rootCollections.length === 0" class="empty-state">
            <p>📂 还没有笔记本</p>
            <p class="tip">点击上方按钮创建第一个笔记本</p>
          </div>
          
          <!-- 🆕 未分类（永远在最下面） -->
          <div class="uncategorized-item" @click="!batchMode && $emit('select', 'uncategorized')" :style="{ cursor: batchMode ? 'default' : 'pointer' }">
            <div class="notebook-info">
              <span class="icon">📂</span>
              <span class="name">未分类</span>
              <span class="count">({{ uncategorizedCount }})</span>
            </div>
          </div>
        </div>
        
        <!-- 批量操作按钮 -->
        <div v-if="batchMode && selectedIds.length > 0" class="batch-actions">
          <div class="selected-count">已选择 {{ selectedIds.length }} 个笔记本</div>
          <div class="action-buttons">
            <button @click="handleBatchEncrypt" class="action-btn encrypt">🔒 批量加密</button>
            <button @click="handleBatchDelete" class="action-btn delete">🗑️ 批量删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CollectionTreeNode from './CollectionTreeNode.vue'

const props = defineProps(['collections', 'getTaskCount', 'totalTaskCount', 'getChildCollections', 'uncategorizedCount'])
const emit = defineEmits(['close', 'create', 'select', 'rename', 'setPrivate', 'changePassword', 'moveIn', 'moveOut', 'moveCollection', 'delete', 'batchEncrypt', 'batchDelete', 'aiClassify'])

const batchMode = ref(false)
const selectedIds = ref([])
const expandedIds = ref([]) // 🆕 展开的笔记本ID列表

// 🆕 获取根级笔记本（按order排序，与首页一致）
const rootCollections = computed(() => {
  return props.collections
    .filter(c => c.parentId === null)
    .sort((a, b) => a.order - b.order) // 按order升序排序
})

// 🆕 切换展开/折叠
const toggleExpand = (id) => {
  const index = expandedIds.value.indexOf(id)
  if (index > -1) {
    expandedIds.value.splice(index, 1)
  } else {
    expandedIds.value.push(id)
  }
}

// 🆕 一键展开/折叠所有层级
const allExpanded = computed(() => {
  const allIds = getAllCollectionIds(props.collections)
  return allIds.length > 0 && allIds.every(id => expandedIds.value.includes(id))
})

const getAllCollectionIds = (collections) => {
  const ids = []
  const traverse = (items) => {
    items.forEach(item => {
      ids.push(item.id)
      const children = props.getChildCollections(item.id)
      if (children.length > 0) {
        traverse(children)
      }
    })
  }
  traverse(collections.filter(c => c.parentId === null))
  return ids
}

const toggleExpandAll = () => {
  if (allExpanded.value) {
    // 折叠全部
    expandedIds.value = []
  } else {
    // 展开全部
    expandedIds.value = getAllCollectionIds(props.collections)
  }
}

const enterBatchMode = () => {
  batchMode.value = true
  selectedIds.value = []
}

const exitBatchMode = () => {
  batchMode.value = false
  selectedIds.value = []
}

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const handleBatchEncrypt = () => {
  emit('batchEncrypt', selectedIds.value)
  exitBatchMode()
}

const handleBatchDelete = () => {
  emit('batchDelete', selectedIds.value)
  exitBatchMode()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 10000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  width: 100%;
  max-height: 92vh;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.modal-header::before {
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

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.batch-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.batch-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.batch-btn.cancel {
  background: rgba(239, 68, 68, 0.8);
}

.batch-btn.cancel:hover {
  background: rgba(239, 68, 68, 1);
}

.expand-all-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 10px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
}

.expand-all-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.expand-all-btn:active {
  transform: scale(0.95);
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.all-notebook {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.all-notebook:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #0284c7;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
}

.all-notebook .notebook-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.all-notebook .icon {
  font-size: 1.5rem;
}

.all-notebook .name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #0369a1;
}

.all-notebook .count {
  color: #0284c7;
  font-weight: 500;
}

.all-notebook .description {
  color: #0369a1;
  font-size: 0.9rem;
  opacity: 0.8;
  margin-left: 32px;
}

/* 🆕 未分类样式（灰色系，永远在最下面） */
.uncategorized-item {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 2px solid #9ca3af;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  transition: all 0.2s;
}

.uncategorized-item:hover {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-color: #6b7280;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 163, 175, 0.2);
}

.uncategorized-item .notebook-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.uncategorized-item .icon {
  font-size: 1.5rem;
}

.uncategorized-item .name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #4b5563;
}

.uncategorized-item .count {
  color: #6b7280;
  font-weight: 500;
}

.create-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-classify-btn {
  width: 100%;
  padding: 11px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.ai-classify-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

/* 🆕 树形列表容器 */
.collection-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 8px 0;
}

.empty-state .tip {
  font-size: 0.9rem;
  color: #bbb;
}

/* 批量选择模式 */
/* 批量操作按钮 */
.batch-actions {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 2px solid #e0e0e0;
  padding: 16px;
  margin: -1rem -1rem 0;
}

.selected-count {
  text-align: center;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn.encrypt {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.action-btn.encrypt:hover {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  transform: translateY(-1px);
}

.action-btn.merge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.action-btn.merge:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  transform: translateY(-1px);
}

.action-btn.merge:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
}

.action-btn.delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.action-btn.delete:hover {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  transform: translateY(-1px);
}
</style>
