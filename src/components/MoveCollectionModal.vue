<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>📦 移动笔记本</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="current-info">
          <p class="label">当前笔记本：</p>
          <div class="collection-card">
            <span class="icon">{{ collection.icon }}</span>
            <span class="name">{{ collection.name }}</span>
          </div>
        </div>

        <div class="target-section">
          <p class="label">移动到：</p>
          
          <!-- 根级选项 -->
          <div 
            class="target-item" 
            :class="{ selected: selectedTarget === null }"
            @click="selectedTarget = null"
          >
            <span class="icon">📚</span>
            <span class="name">根级（顶层）</span>
          </div>

          <!-- 其他笔记本 -->
          <div 
            v-for="target in availableTargets" 
            :key="target.id"
            class="target-item"
            :class="{ 
              selected: selectedTarget === target.id,
              disabled: !canMoveTo(target.id)
            }"
            @click="canMoveTo(target.id) && (selectedTarget = target.id)"
          >
            <span class="indent" v-for="n in target.level" :key="n"></span>
            <span class="icon">{{ target.icon }}</span>
            <span class="name">{{ target.name }}</span>
            <span v-if="!canMoveTo(target.id)" class="warning">⚠️ 不可移动</span>
          </div>
        </div>

        <div class="warning-box" v-if="selectedTarget !== null && selectedTarget !== collection.parentId">
          <p>⚠️ 移动后，此笔记本将成为目标笔记本的子笔记本</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('close')">取消</button>
        <button 
          class="confirm-btn" 
          @click="handleMove"
          :disabled="selectedTarget === collection.parentId"
        >
          确认移动
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps(['collection', 'collections', 'canMoveCollectionTo', 'getBreadcrumb'])
const emit = defineEmits(['close', 'move'])

const selectedTarget = ref(props.collection.parentId)

// 计算可用的目标笔记本（带层级缩进）
const availableTargets = computed(() => {
  const result = []
  
  const addWithLevel = (parentId, level) => {
    const children = props.collections
      .filter(c => c.parentId === parentId && c.id !== props.collection.id)
      .sort((a, b) => a.order - b.order)
    
    children.forEach(child => {
      result.push({ ...child, level })
      addWithLevel(child.id, level + 1)
    })
  }
  
  addWithLevel(null, 0)
  return result
})

// 检查是否可以移动到目标
const canMoveTo = (targetId) => {
  if (targetId === props.collection.id) return false
  return props.canMoveCollectionTo(props.collection.id, targetId)
}

const handleMove = () => {
  if (selectedTarget.value === props.collection.parentId) return
  emit('move', props.collection.id, selectedTarget.value)
  emit('close')
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
  z-index: 10001;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: white;
  width: 100%;
  max-height: 85vh;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

.current-info {
  margin-bottom: 20px;
}

.label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.collection-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.collection-card .icon {
  font-size: 1.3rem;
}

.collection-card .name {
  font-weight: 600;
  color: #0369a1;
}

.target-section {
  margin-bottom: 16px;
}

.target-item {
  background: #f9fafb;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.target-item:hover:not(.disabled) {
  background: #f3f4f6;
  border-color: #667eea;
}

.target-item.selected {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #0ea5e9;
}

.target-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #fef2f2;
}

.target-item .indent {
  width: 20px;
  display: inline-block;
}

.target-item .icon {
  font-size: 1.2rem;
}

.target-item .name {
  flex: 1;
  font-weight: 500;
}

.target-item .warning {
  font-size: 0.85rem;
  color: #dc2626;
}

.warning-box {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 10px;
  padding: 12px 16px;
  margin-top: 16px;
}

.warning-box p {
  margin: 0;
  color: #92400e;
  font-size: 0.9rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f3f4f6;
  color: #666;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.confirm-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
}
</style>
