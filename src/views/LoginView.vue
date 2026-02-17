<template>
  <div class="login-container">
    <div class="glass-card login-box">
      <h2>Welcome Back</h2>
      <div class="input-group">
        <label for="username">用户名</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          class="input"
          placeholder="请输入用户名"
          @keyup.enter="handleLogin"
        >
      </div>
      <div class="input-group">
        <label for="password">密码</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          class="input"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        >
      </div>
      <button id="login-btn" class="btn btn-primary" @click="handleLogin">登录</button>
      <p class="error-message" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const emit = defineEmits(['notify'])

const username = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  
  if (!username.value.trim()) {
    error.value = '请输入用户名'
    return
  }
  
  const success = await userStore.login(username.value.trim(), password.value)
  if (success) {
    emit('notify', { message: '登录成功！', type: 'success' })
    router.push('/todo')
  } else {
    error.value = '登录失败'
    emit('notify', { message: '用户名或密码错误', type: 'error' })
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.login-box {
  padding: 3rem;
  width: 100%;
  max-width: 450px;
}

.login-box h2 {
  text-align: center;
  margin-bottom: 2.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 2.2rem;
  font-weight: 800;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--text-light);
  font-size: 0.9rem;
}

#login-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  margin-top: 1.5rem;
  border-radius: 12px;
}

.error-message {
  color: var(--error-color);
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>