<template>
  <div class="login-container">
    <div class="glass-card login-box">
      <h2>{{ isRegister ? '注册账号' : isForgotPassword ? '找回密码' : 'Welcome Back' }}</h2>
      
      <div class="input-group">
        <label for="username">用户名</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          class="input"
          placeholder="请输入用户名"
          @keyup.enter="handleSubmit"
        >
      </div>
      
      <div class="input-group" v-if="!isForgotPassword">
        <label for="password">密码</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          class="input"
          placeholder="请输入密码"
          @keyup.enter="handleSubmit"
        >
      </div>
      
      <template v-if="isRegister">
        <div class="input-group">
          <label for="securityQuestion">安全问题（可选）</label>
          <select v-model="securityQuestion" class="input">
            <option value="">不设置安全问题</option>
            <option value="pet">你的第一只宠物叫什么？</option>
            <option value="city">你出生在哪个城市？</option>
            <option value="school">你的小学名称是什么？</option>
            <option value="food">你最喜欢的食物是什么？</option>
          </select>
        </div>
        <div v-if="securityQuestion" class="input-group">
          <label for="securityAnswer">安全问题答案</label>
          <input 
            type="text" 
            id="securityAnswer" 
            v-model="securityAnswer" 
            class="input"
            placeholder="请输入答案"
            @keyup.enter="handleSubmit"
          >
        </div>
        <div v-if="!securityQuestion" class="security-tip">
          💡 提示：不设置安全问题将无法通过安全问题找回密码
        </div>
      </template>
      
      <template v-if="isForgotPassword && forgotStep === 1">
        <div class="input-group">
          <label>安全问题：{{ currentSecurityQuestion }}</label>
          <input 
            type="text" 
            v-model="securityAnswer" 
            class="input"
            placeholder="请输入答案"
            @keyup.enter="handleSubmit"
          >
        </div>
      </template>
      
      <template v-if="isForgotPassword && forgotStep === 2">
        <div class="input-group">
          <label for="newPassword">新密码</label>
          <input 
            type="password" 
            id="newPassword" 
            v-model="newPassword" 
            class="input"
            placeholder="请输入新密码"
            @keyup.enter="handleSubmit"
          >
        </div>
      </template>
      
      <button class="btn btn-primary" @click="handleSubmit">
        {{ isRegister ? '注册' : isForgotPassword ? (forgotStep === 1 ? '验证' : '重置密码') : '登录' }}
      </button>
      
      <p class="error-message" v-if="error">{{ error }}</p>
      
      <p class="switch-mode" @click="toggleMode" v-if="!isForgotPassword">
        {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
      </p>
      
      <p class="switch-mode" @click="showForgotPassword" v-if="!isRegister && !isForgotPassword">
        忘记密码？
      </p>
      
      <p class="switch-mode" @click="backToLogin" v-if="isForgotPassword">
        返回登录
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'

const emit = defineEmits(['notify'])

const username = ref('')
const password = ref('')
const error = ref('')
const isRegister = ref(false)
const isForgotPassword = ref(false)
const forgotStep = ref(1)
const securityQuestion = ref('')
const securityAnswer = ref('')
const newPassword = ref('')
const currentSecurityQuestion = ref('')

const securityQuestions = {
  pet: '你的第一只宠物叫什么？',
  city: '你出生在哪个城市？',
  school: '你的小学名称是什么？',
  food: '你最喜欢的食物是什么？'
}

const handleSubmit = async () => {
  error.value = ''
  
  if (isRegister.value) {
    await handleRegister()
  } else if (isForgotPassword.value) {
    if (forgotStep.value === 1) {
      await verifySecurityAnswer()
    } else {
      await resetPassword()
    }
  } else {
    await handleLogin()
  }
}

const handleRegister = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入用户名和密码'
    emit('notify', { message: '请输入用户名和密码', type: 'error' })
    return
  }
  
  // 如果选择了安全问题，必须填写答案
  if (securityQuestion.value && !securityAnswer.value.trim()) {
    error.value = '请填写安全问题答案'
    emit('notify', { message: '请填写安全问题答案', type: 'error' })
    return
  }
  
  const { value } = await Preferences.get({ key: 'users' })
  const users = value ? JSON.parse(value) : {}
  
  if (users[username.value]) {
    error.value = '用户名已存在'
    emit('notify', { message: '用户名已存在', type: 'error' })
    return
  }
  
  users[username.value] = password.value
  await Preferences.set({ key: 'users', value: JSON.stringify(users) })
  
  const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
  const userInfo = userInfoData ? JSON.parse(userInfoData) : {}
  userInfo[username.value] = {
    username: username.value,
    registerTime: new Date().toISOString(),
    lastLoginTime: new Date().toISOString()
  }
  await Preferences.set({ key: 'userInfo', value: JSON.stringify(userInfo) })
  
  // 只有设置了安全问题才保存
  if (securityQuestion.value && securityAnswer.value.trim()) {
    const { value: securityData } = await Preferences.get({ key: 'security' })
    const security = securityData ? JSON.parse(securityData) : {}
    security[username.value] = {
      question: securityQuestion.value,
      answer: securityAnswer.value.toLowerCase().trim()
    }
    await Preferences.set({ key: 'security', value: JSON.stringify(security) })
  }
  
  emit('notify', { message: '注册成功！', type: 'success' })
  resetForm()
  isRegister.value = false
}

const handleLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入用户名和密码'
    emit('notify', { message: '请输入用户名和密码', type: 'error' })
    return
  }
  
  const { value } = await Preferences.get({ key: 'users' })
  const users = value ? JSON.parse(value) : {}
  
  if (users[username.value] === password.value) {
    await Preferences.set({ key: 'currentUser', value: username.value })
    
    const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
    const userInfo = userInfoData ? JSON.parse(userInfoData) : {}
    if (userInfo[username.value]) {
      userInfo[username.value].lastLoginTime = new Date().toISOString()
      await Preferences.set({ key: 'userInfo', value: JSON.stringify(userInfo) })
    }
    
    emit('notify', { message: '登录成功！', type: 'success' })
    setTimeout(() => {
      window.location.hash = '#/todo'
    }, 300)
  } else {
    error.value = '用户名或密码错误'
    emit('notify', { message: '用户名或密码错误', type: 'error' })
  }
}

const showForgotPassword = async () => {
  if (!username.value.trim()) {
    error.value = '请先输入用户名'
    emit('notify', { message: '请先输入用户名', type: 'error' })
    return
  }
  
  const { value: securityData } = await Preferences.get({ key: 'security' })
  const security = securityData ? JSON.parse(securityData) : {}
  
  if (!security[username.value]) {
    error.value = '该用户未设置安全问题'
    emit('notify', { message: '该用户未设置安全问题', type: 'error' })
    return
  }
  
  currentSecurityQuestion.value = securityQuestions[security[username.value].question]
  isForgotPassword.value = true
  forgotStep.value = 1
  password.value = ''
  securityAnswer.value = ''
}

const verifySecurityAnswer = async () => {
  if (!securityAnswer.value.trim()) {
    error.value = '请输入安全问题答案'
    emit('notify', { message: '请输入安全问题答案', type: 'error' })
    return
  }
  
  const { value: securityData } = await Preferences.get({ key: 'security' })
  const security = securityData ? JSON.parse(securityData) : {}
  
  if (security[username.value].answer === securityAnswer.value.toLowerCase().trim()) {
    forgotStep.value = 2
    securityAnswer.value = ''
    emit('notify', { message: '验证成功，请设置新密码', type: 'success' })
  } else {
    error.value = '安全问题答案错误'
    emit('notify', { message: '安全问题答案错误', type: 'error' })
  }
}

const resetPassword = async () => {
  if (!newPassword.value.trim()) {
    error.value = '请输入新密码'
    emit('notify', { message: '请输入新密码', type: 'error' })
    return
  }
  
  const { value } = await Preferences.get({ key: 'users' })
  const users = value ? JSON.parse(value) : {}
  users[username.value] = newPassword.value
  await Preferences.set({ key: 'users', value: JSON.stringify(users) })
  
  emit('notify', { message: '密码重置成功！', type: 'success' })
  backToLogin()
}

const backToLogin = () => {
  resetForm()
  isForgotPassword.value = false
  forgotStep.value = 1
}

const toggleMode = () => {
  resetForm()
  isRegister.value = !isRegister.value
}

const resetForm = () => {
  password.value = ''
  securityQuestion.value = ''
  securityAnswer.value = ''
  newPassword.value = ''
  error.value = ''
}
</script>

<style scoped>
.debug-panel {
  display: none;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

.login-box {
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.login-box h2 {
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.8rem;
  font-weight: 800;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-light);
  font-size: 0.9rem;
}

.btn-primary {
  width: 100%;
  padding: 0.9rem;
  font-size: 1rem;
  margin-top: 1rem;
  border-radius: 12px;
}

.security-tip {
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #ffc107;
  padding: 0.75rem;
  margin-top: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #856404;
}

.error-message {
  color: var(--error-color);
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.switch-mode {
  text-align: center;
  margin-top: 1rem;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
}

.switch-mode:hover {
  opacity: 0.8;
}
</style>