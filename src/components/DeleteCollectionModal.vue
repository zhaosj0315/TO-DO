<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h3>⚠️ 删除文件夹</h3>
      <p class="warning-text">
        文件夹"<strong>{{ collection.name }}</strong>"中有 <strong>{{ taskCount }}</strong> 个任务
        <span v-if="childCount > 0">和 <strong>{{ childCount }}</strong> 个子文件夹</span>
      </p>
      
      <div class="options">
        <label v-if="childCount > 0" class="option-item">
          <input type="radio" v-model="action" value="promote" />
          <div class="option-content">
            <span class="option-icon">⬆️</span>
            <div>
              <div class="option-title">提升子文件夹到上一级</div>
              <div class="option-desc">子文件夹保留，任务移到未分类</div>
            </div>
          </div>
        </label>

        <label class="option-item">
          <input type="radio" v-model="action" value="uncategorize" />
          <div class="option-content">
            <span class="option-icon">📂</span>
            <div>
              <div class="option-title">移到未分类</div>
              <div class="option-desc">任务保留，移到未分类{{ childCount > 0 ? '，子文件夹提升到根级' : '' }}</div>
            </div>
          </div>
        </label>
        
        <label v-if="otherCollections.length > 0" class="option-item">
          <input type="radio" v-model="action" value="move" />
          <div class="option-content">
            <span class="option-icon">📁</span>
            <div>
              <div class="option-title">移到其他文件夹</div>
              <div class="option-desc">任务和子文件夹都移动到目标文件夹</div>
            </div>
          </div>
        </label>
        
        <label class="option-item option-danger">
          <input type="radio" v-model="action" value="delete" />
          <div class="option-content">
            <span class="option-icon">🗑️</span>
            <div>
              <div class="option-title">级联删除</div>
              <div class="option-desc">删除所有任务{{ childCount > 0 ? '和子文件夹' : '' }}（移到回收站）</div>
            </div>
          </div>
        </label>
      </div>
      
      <!-- 选择目标文件夹 -->
      <select v-if="action === 'move'" v-model="targetCollectionId" class="target-selector">
        <option value="">请选择目标文件夹</option>
        <option v-for="c in otherCollections" :key="c.id" :value="c.id">
          {{ c.icon }} {{ c.name }}
        </option>
      </select>
      
      <div class="buttons">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button 
          class="btn-confirm btn-danger" 
          @click="handleDelete"
          :disabled="action === 'move' && !targetCollectionId"
        >
          确认删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const props = defineProps(['collection'])
const emit = defineEmits(['close', 'confirm'])

const store = useOfflineTaskStore()
const action = ref('promote')  // 🆕 默认提升子文件夹
const targetCollectionId = ref('')

const taskCount = computed(() => 
  store.getCollectionTasks(props.collection.id).length
)

// 🆕 计算子文件夹数量
const childCount = computed(() => 
  store.getChildCollections(props.collection.id).length
)

const otherCollections = computed(() => 
  store.collections.filter(c => c.id !== props.collection.id)
)

const handleDelete = async () => {
  let deleteAction = action.value
  if (action.value === 'move') {
    if (!targetCollectionId.value) return
    deleteAction = { moveTo: targetCollectionId.value }
  }
  
  await store.deleteCollection(props.collection.id, deleteAction)
  emit('confirm')
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
  z-index: 10000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

h3 {
  margin: 0 0 16px 0;
  font-size: 1.3rem;
  color: #ef4444;
}

.warning-text {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.options {
  margin-bottom: 20px;
}

.option-item {
  display: block;
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #8b5cf6;
  background: #f9f9f9;
}

.option-item:has(input:checked) {
  border-color: #8b5cf6;
  background: #f3f0ff;
}

.option-item.option-danger:has(input:checked) {
  border-color: #ef4444;
  background: #fef2f2;
}

.option-item input[type="radio"] {
  display: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon {
  font-size: 1.8rem;
}

.option-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 0.85rem;
  color: #888;
}

.target-selector {
  width: 100%;
  padding: 12px;
  border: 2px solid #8b5cf6;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 20px;
  background: #f3f0ff;
}

.buttons {
  display: flex;
  gap: 12px;
}

.buttons button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
