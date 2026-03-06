<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h3>🔒 {{ collectionName }}</h3>
      <p class="tip">此文件夹已加密，请输入密码</p>
      
      <input 
        ref="passwordInput"
        type="password" 
        v-model="password" 
        placeholder="请输入密码"
        @keyup.enter="handleVerify"
        class="password-input"
      />
      
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      
      <div class="buttons">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" @click="handleVerify">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['collectionId', 'collectionName'])
const emit = defineEmits(['close', 'verified'])

const password = ref('')
const errorMsg = ref('')
const passwordInput = ref(null)

onMounted(() => {
  passwordInput.value?.focus()
})

const handleVerify = () => {
  if (!password.value.trim()) {
    errorMsg.value = '请输入密码'
    return
  }
  
  emit('verified', password.value)
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

.password-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.password-input:focus {
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
