<template>
  <div class="login-container">
    <div class="login-box">
      <h2>用户登录</h2>
      <div class="input-group">
        <label for="username">用户名</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
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
    router.push('/todo')
  } else {
    error.value = '登录失败'
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
  background: white;
  padding: 2.5rem;
  border-radius: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 450px;
  backdrop-filter: blur(10px);
}

.login-box h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--primary-color);
  font-size: 2rem;
  font-weight: 600;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--text-light);
  font-size: 0.95rem;
}

.input-group input {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: all 0.3s;
  background: var(--background-light);
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

#login-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.error-message {
  color: var(--error-color);
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>