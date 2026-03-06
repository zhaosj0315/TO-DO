<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>📚 更多文件夹</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="collection-list">
        <button 
          v-for="collection in collections" 
          :key="collection.id"
          class="collection-item"
          :class="{ active: selectedCollectionId === collection.id }"
          @click="handleSelect(collection.id)"
        >
          <div class="collection-info">
            <span class="icon">{{ collection.icon }}</span>
            <span v-if="collection.isPrivate" class="lock">🔒</span>
            <span class="name">{{ collection.name }}</span>
          </div>
          <span class="count">({{ getTaskCount(collection.id) }})</span>
        </button>
        
        <div v-if="collections.length === 0" class="empty-state">
          <p>📂 没有更多文件夹了</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['collections', 'getTaskCount', 'selectedCollectionId'])
const emit = defineEmits(['close', 'select'])

const handleSelect = (collectionId) => {
  emit('select', collectionId)
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
  width: 100%;
  max-height: 70vh;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
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
  font-size: 1.2rem;
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

.collection-list {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.collection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: #f9fafb;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.collection-item:hover {
  background: #f3f4f6;
  border-color: #8b5cf6;
  transform: translateX(4px);
}

.collection-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collection-info .icon {
  font-size: 1.3rem;
}

.collection-info .lock {
  font-size: 0.85rem;
  opacity: 0.7;
}

.collection-info .name {
  font-weight: 500;
  font-size: 1rem;
}

.count {
  color: #666;
  font-size: 0.9rem;
}

.collection-item.active .count {
  color: rgba(255, 255, 255, 0.9);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}
</style>
