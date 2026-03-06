<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h3>📁 移动到文件夹</h3>
      <p class="task-name">任务：<strong>{{ task.text }}</strong></p>
      
      <div class="collection-list">
        <label 
          class="collection-option"
          :class="{ active: selectedId === null }"
        >
          <input type="radio" :value="null" v-model="selectedId" />
          <span class="collection-info">
            <span class="collection-icon">📂</span>
            <span class="collection-name">未分类</span>
          </span>
        </label>
        
        <label 
          v-for="collection in collections" 
          :key="collection.id"
          class="collection-option"
          :class="{ active: selectedId === collection.id }"
        >
          <input type="radio" :value="collection.id" v-model="selectedId" />
          <span class="collection-info">
            <span class="collection-icon">{{ collection.icon }}</span>
            <span class="collection-name">{{ collection.name }}</span>
          </span>
        </label>
      </div>
      
      <div class="buttons">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" @click="handleMove">确认移动</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const props = defineProps(['task', 'collections'])
const emit = defineEmits(['close', 'moved'])

const store = useOfflineTaskStore()
const selectedId = ref(props.task.collectionId)

const handleMove = async () => {
  await store.setTaskCollection(props.task.id, selectedId.value)
  emit('moved', selectedId.value)
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
}

.task-name {
  margin-bottom: 20px;
  color: #666;
  font-size: 0.9rem;
}

.collection-list {
  margin-bottom: 20px;
}

.collection-option {
  display: block;
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.collection-option:hover {
  border-color: #8b5cf6;
  background: #f9f9f9;
}

.collection-option.active {
  border-color: #8b5cf6;
  background: #f3f0ff;
}

.collection-option input[type="radio"] {
  display: none;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collection-icon {
  font-size: 1.2rem;
}

.collection-name {
  font-weight: 500;
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

.btn-confirm {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}
</style>
