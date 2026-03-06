<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h3>📁 新建文件夹</h3>
      
      <div class="form-group">
        <label>文件夹名称</label>
        <input 
          ref="nameInput"
          v-model="formData.name" 
          type="text" 
          placeholder="输入文件夹名称"
          maxlength="50"
          @keyup.enter="handleCreate"
        />
      </div>
      
      <div class="form-group">
        <label>描述（可选）</label>
        <textarea 
          v-model="formData.description" 
          placeholder="输入描述信息"
          maxlength="200"
          rows="3"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label>图标</label>
        <div class="icon-selector">
          <button 
            v-for="icon in iconOptions" 
            :key="icon"
            class="icon-btn"
            :class="{ active: formData.icon === icon }"
            @click="formData.icon = icon"
          >
            {{ icon }}
          </button>
        </div>
      </div>
      
      <div class="form-group">
        <label>颜色</label>
        <div class="color-selector">
          <button 
            v-for="color in colorOptions" 
            :key="color"
            class="color-btn"
            :class="{ active: formData.color === color }"
            :style="{ background: color }"
            @click="formData.color = color"
          ></button>
        </div>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.isPrivate" />
          <span>🔒 设为私密文件夹</span>
        </label>
      </div>
      
      <div v-if="formData.isPrivate" class="password-section">
        <div class="form-group">
          <label>设置密码</label>
          <input 
            v-model="formData.password" 
            type="password" 
            placeholder="至少4位密码"
            maxlength="20"
          />
        </div>
        
        <div class="form-group">
          <label>确认密码</label>
          <input 
            v-model="formData.confirmPassword" 
            type="password" 
            placeholder="再次输入密码"
            maxlength="20"
          />
        </div>
      </div>
      
      <div class="buttons">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" @click="handleCreate" :disabled="!canCreate">
          创建
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const emit = defineEmits(['close', 'created'])
const store = useOfflineTaskStore()

const nameInput = ref(null)

const formData = ref({
  name: '',
  description: '',
  icon: '📁',
  color: '#8b5cf6',
  isPrivate: false,
  password: '',
  confirmPassword: ''
})

const iconOptions = ['📁', '📚', '💼', '🏠', '🎯', '💡', '🎨', '🔧', '📊', '🌟', '🎮', '🏃']
const colorOptions = ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

const canCreate = computed(() => {
  if (!formData.value.name.trim()) return false
  if (formData.value.isPrivate) {
    if (!formData.value.password || formData.value.password.length < 4) return false
    if (formData.value.password !== formData.value.confirmPassword) return false
  }
  return true
})

const handleCreate = async () => {
  if (!canCreate.value) return
  
  const collection = await store.createCollection(formData.value)
  emit('created', collection)
  emit('close')
}

onMounted(() => {
  nameInput.value?.focus()
})
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
  margin: 0 0 20px 0;
  font-size: 1.3rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.icon-selector,
.color-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.icon-btn {
  width: 48px;
  height: 48px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  transform: scale(1.1);
}

.icon-btn.active {
  border-color: #8b5cf6;
  background: #f3f0ff;
}

.color-btn {
  width: 48px;
  height: 48px;
  border: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #333;
}

.buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
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

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label span {
  font-size: 0.95rem;
  color: #333;
  font-weight: 500;
}

.password-section {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
}
</style>
