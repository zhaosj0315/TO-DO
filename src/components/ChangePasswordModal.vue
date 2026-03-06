<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h3>{{ isSetMode ? '🔒 设为私密' : '🔑 修改密码' }}</h3>
      <p class="tip">{{ collectionName }}</p>
      
      <div v-if="!isSetMode" class="form-group">
        <label>旧密码</label>
        <input 
          ref="oldPasswordInput"
          type="password" 
          v-model="oldPassword" 
          placeholder="请输入旧密码"
          @keyup.enter="focusNewPassword"
        />
      </div>
      
      <div class="form-group">
        <label>{{ isSetMode ? '设置密码' : '新密码' }}</label>
        <input 
          ref="newPasswordInput"
          type="password" 
          v-model="newPassword" 
          placeholder="请输入密码（至少4位）"
          @keyup.enter="focusConfirmPassword"
        />
      </div>
      
      <div class="form-group">
        <label>确认密码</label>
        <input 
          ref="confirmPasswordInput"
          type="password" 
          v-model="confirmPassword" 
          placeholder="再次输入密码"
          @keyup.enter="handleChange"
        />
      </div>
      
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      
      <div class="buttons">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" @click="handleChange">{{ isSetMode ? '设为私密' : '确认修改' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const props = defineProps(['collectionId', 'collectionName'])
const emit = defineEmits(['close', 'changed'])

const store = useOfflineTaskStore()
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const oldPasswordInput = ref(null)
const newPasswordInput = ref(null)
const confirmPasswordInput = ref(null)

// 判断是否为"设置密码"模式（笔记本当前不是私密的）
const isSetMode = computed(() => {
  const collection = store.collections.find(c => c.id === props.collectionId)
  return collection && !collection.isPrivate
})

onMounted(() => {
  if (isSetMode.value) {
    newPasswordInput.value?.focus()
  } else {
    oldPasswordInput.value?.focus()
  }
})

const focusNewPassword = () => {
  newPasswordInput.value?.focus()
}

const focusConfirmPassword = () => {
  confirmPasswordInput.value?.focus()
}

const handleChange = async () => {
  errorMsg.value = ''
  
  // 设置密码模式：不需要旧密码
  if (isSetMode.value) {
    if (!newPassword.value.trim()) {
      errorMsg.value = '请输入密码'
      return
    }
    
    if (newPassword.value.length < 4) {
      errorMsg.value = '密码至少4位'
      return
    }
    
    if (newPassword.value !== confirmPassword.value) {
      errorMsg.value = '两次输入的密码不一致'
      return
    }
    
    // 直接设置为私密
    const collection = store.collections.find(c => c.id === props.collectionId)
    if (collection) {
      collection.isPrivate = true
      collection.password = btoa(newPassword.value) // Base64编码
      await store.saveCollections()
      emit('changed')
      emit('close')
    }
    return
  }
  
  // 修改密码模式：需要旧密码
  if (!oldPassword.value.trim()) {
    errorMsg.value = '请输入旧密码'
    return
  }
  
  if (!newPassword.value.trim()) {
    errorMsg.value = '请输入新密码'
    return
  }
  
  if (newPassword.value.length < 4) {
    errorMsg.value = '新密码至少4位'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的新密码不一致'
    return
  }
  
  const success = await store.changeCollectionPassword(
    props.collectionId,
    oldPassword.value,
    newPassword.value
  )
  
  if (success) {
    emit('changed')
    emit('close')
  } else {
    errorMsg.value = '旧密码错误'
  }
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
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: #333;
}

.tip {
  margin: 0 0 20px 0;
  font-size: 0.9rem;
  color: #666;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #8b5cf6;
}

.error-msg {
  margin: 8px 0 0 0;
  color: #ef4444;
  font-size: 0.85rem;
}

.buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #666;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
