<template>
  <div class="login-container">
    <!-- 调试日志面板 -->
    <div class="debug-panel">
      <div class="debug-title">调试日志</div>
      <div class="debug-logs">
        <div v-for="(log, index) in debugLogs" :key="index" class="debug-log" :class="log.type">
          {{ log.time }} - {{ log.message }}
        </div>
      </div>
    </div>
    
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

const emit = defineEmits(['notify'])

const username = ref('')
const password = ref('')
const error = ref('')
const debugLogs = ref([])

const addLog = (message, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  debugLogs.value.push({ time, message, type })
  console.log(`[${time}] ${message}`)
}

addLog('页面加载完成', 'success')

const handleLogin = () => {
  addLog('点击登录按钮', 'info')
  error.value = ''
  
  addLog(`输入的用户名: ${username.value}`, 'info')
  addLog(`输入的密码: ${password.value ? '****' : '(空)'}`, 'info')
  
  if (!username.value.trim() || !password.value.trim()) {
    addLog('验证失败: 用户名或密码为空', 'error')
    error.value = '请输入用户名和密码'
    emit('notify', { message: '请输入用户名和密码', type: 'error' })
    return
  }
  
  if (username.value === 'user' && password.value === 'user') {
    addLog('验证成功: 用户名密码正确', 'success')
    emit('notify', { message: '登录成功！', type: 'success' })
    addLog('准备跳转到任务页面...', 'info')
    
    setTimeout(() => {
      addLog('执行跳转: window.location.hash = #/todo', 'info')
      const oldHash = window.location.hash
      window.location.hash = '#/todo'
      addLog(`跳转前hash: ${oldHash}, 跳转后hash: ${window.location.hash}`, 'info')
      
      setTimeout(() => {
        addLog(`当前URL: ${window.location.href}`, 'info')
        addLog(`当前hash: ${window.location.hash}`, 'info')
      }, 100)
    }, 500)
  } else {
    addLog('验证失败: 用户名或密码错误', 'error')
    error.value = '用户名或密码错误'
    emit('notify', { message: '用户名或密码错误', type: 'error' })
  }
}
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 10px;
  left: 10px;
  right: 10px;
  max-height: 200px;
  background: rgba(0, 0, 0, 0.9);
  color: #0f0;
  padding: 10px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 11px;
  overflow-y: auto;
  z-index: 9999;
  border: 2px solid #0f0;
}

.debug-title {
  color: #ff0;
  font-weight: bold;
  margin-bottom: 5px;
  border-bottom: 1px solid #0f0;
  padding-bottom: 5px;
}

.debug-logs {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.debug-log {
  padding: 3px 5px;
  border-radius: 3px;
}

.debug-log.info {
  color: #0ff;
}

.debug-log.success {
  color: #0f0;
  font-weight: bold;
}

.debug-log.error {
  color: #f00;
  font-weight: bold;
}

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