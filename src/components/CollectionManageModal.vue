<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>📁 文件夹管理</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- 新建文件夹按钮 -->
        <button class="create-btn" @click="$emit('create')">
          ➕ 新建文件夹
        </button>
        
        <!-- 文件夹列表 -->
        <div class="collection-list">
          <div 
            v-for="collection in collections" 
            :key="collection.id"
            class="collection-item"
          >
            <div class="collection-info">
              <span class="icon">{{ collection.icon }}</span>
              <span v-if="collection.isPrivate" class="lock">🔒</span>
              <span class="name">{{ collection.name }}</span>
              <span class="count">({{ getTaskCount(collection.id) }})</span>
            </div>
            
            <div class="actions">
              <button @click="$emit('rename', collection)" title="重命名">📝</button>
              <button v-if="collection.isPrivate" @click="$emit('changePassword', collection)" title="修改密码">🔑</button>
              <button @click="$emit('moveIn', collection)" title="迁入任务">➕</button>
              <button @click="$emit('moveOut', collection)" title="迁出任务">➖</button>
              <button @click="$emit('delete', collection)" title="删除" class="delete-btn">🗑️</button>
            </div>
          </div>
          
          <div v-if="collections.length === 0" class="empty-state">
            <p>📂 还没有文件夹</p>
            <p class="tip">点击上方按钮创建第一个文件夹</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['collections', 'getTaskCount'])
defineEmits(['close', 'create', 'rename', 'changePassword', 'moveIn', 'moveOut', 'delete'])
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
  max-height: 85vh;
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

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
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
  margin-bottom: 20px;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.collection-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.collection-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
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
  color: #333;
}

.collection-info .count {
  color: #666;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: 6px;
}

.actions button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.actions button:hover {
  transform: scale(1.1);
}

.actions button:nth-child(1):hover {
  background: #e0e7ff;
}

.actions button:nth-child(2):hover {
  background: #fef3c7;
}

.actions button:nth-child(3):hover,
.actions button:nth-child(4):hover {
  background: #d1fae5;
}

.actions button:nth-child(5):hover,
.actions button:nth-child(6):hover {
  background: #fed7aa;
}

.delete-btn:hover {
  background: #fee !important;
  color: #dc2626;
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
</style>
