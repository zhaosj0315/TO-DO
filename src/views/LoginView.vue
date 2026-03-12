<template>
  <div class="login-container">
    <!-- 离线应用提示 -->
    <div class="offline-notice">
      <div class="notice-icon">⚠️</div>
      <div class="notice-content">
        <div class="notice-title">重要提示</div>
        <div class="notice-text">
          本应用为纯离线应用，所有数据存储在设备本地。<br>
          <strong>请定期导出数据备份，卸载应用将导致数据永久丢失！</strong><br>
          <span class="backup-hint">💡 备份方法：登录后点击右上角头像 → 数据管理 → 导出Excel</span>
        </div>
      </div>
    </div>

    <div class="glass-card login-box">
      <!-- 登录模式切换 -->
      <div class="login-tabs" v-if="!isRegister && !isForgotPassword">
        <div 
          class="tab" 
          :class="{ active: loginMethod === 'username' }" 
          @click="loginMethod = 'username'"
        >账号登录</div>
        <div 
          class="tab" 
          :class="{ active: loginMethod === 'phone' }" 
          @click="loginMethod = 'phone'"
        >手机登录</div>
      </div>

      <h2>{{ isRegister ? '注册账号' : isForgotPassword ? '找回密码' : (loginMethod === 'username' ? 'Welcome Back' : '短信登录') }}</h2>
      
      <!-- 账号登录/注册模式 -->
      <template v-if="loginMethod === 'username' || isRegister || isForgotPassword">
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
      </template>

      <!-- 手机登录模式 -->
      <template v-else>
        <div class="input-group">
          <label for="phone">手机号</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="phoneNumber" 
            class="input"
            placeholder="请输入手机号"
            maxlength="11"
          >
        </div>
        <div class="input-group code-group">
          <label for="code">验证码</label>
          <div class="code-input-wrapper">
            <input 
              type="text" 
              id="code" 
              v-model="verificationCode" 
              class="input"
              placeholder="6位验证码"
              maxlength="6"
              @keyup.enter="handleSubmit"
            >
            <button 
              class="btn-send-code" 
              :disabled="countdown > 0" 
              @click="sendMockSMS"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </div>
          <p class="sms-hint">💡 模拟短信，验证码将通过系统通知发送</p>
        </div>
      </template>
      
      <!-- 注册特有字段 -->
      <template v-if="isRegister">
        <div class="input-group">
          <label for="registerPhone">绑定手机号（可选）</label>
          <input 
            type="tel" 
            id="registerPhone" 
            v-model="registerPhoneNumber" 
            class="input"
            placeholder="可选，绑定后可用手机号登录"
            maxlength="11"
          >
        </div>
        <div v-if="registerPhoneNumber" class="input-group code-group">
          <label for="registerCode">验证码</label>
          <div class="code-input-wrapper">
            <input 
              type="text" 
              id="registerCode" 
              v-model="registerVerificationCode" 
              class="input"
              placeholder="6位验证码"
              maxlength="6"
            >
            <button 
              class="btn-send-code" 
              :disabled="registerCountdown > 0" 
              @click="sendRegisterSMS"
            >
              {{ registerCountdown > 0 ? `${registerCountdown}s` : '获取验证码' }}
            </button>
          </div>
          <p class="sms-hint">💡 模拟短信，验证码将通过系统通知发送</p>
        </div>
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
      
      <!-- 找回密码步骤 -->
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
        {{ isRegister ? '注册' : isForgotPassword ? (forgotStep === 1 ? '验证' : '重置密码') : '进入应用' }}
      </button>
      
      <p class="error-message" v-if="error">{{ error }}</p>
      
      <p class="switch-mode" @click="toggleMode" v-if="!isForgotPassword">
        {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
      </p>
      
      <p class="switch-mode" @click="showForgotPassword" v-if="!isRegister && !isForgotPassword && loginMethod === 'username'">
        忘记密码？
      </p>
      
      <p class="switch-mode" @click="backToLogin" v-if="isForgotPassword">
        返回登录
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Preferences } from '@capacitor/preferences'
import { LocalNotifications } from '@capacitor/local-notifications'

const emit = defineEmits(['notify'])

// 基础状态
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

// 手机登录特有状态
const loginMethod = ref('username') // 'username' or 'phone'
const phoneNumber = ref('')
const verificationCode = ref('')
const generatedCode = ref('')
const countdown = ref(0)
let timer = null

// 注册时绑定手机号
const registerPhoneNumber = ref('')
const registerVerificationCode = ref('')
const registerGeneratedCode = ref('')
const registerCountdown = ref(0)
let registerTimer = null

const securityQuestions = {
  pet: '你的第一只宠物叫什么？',
  city: '你出生在哪个城市？',
  school: '你的小学名称是什么？',
  food: '你最喜欢的食物是什么？'
}

onMounted(async () => {
  // 请求通知权限
  await LocalNotifications.requestPermissions()
})

const sendMockSMS = async () => {
  if (!/^1[3-9]\d{9}$/.test(phoneNumber.value)) {
    error.value = '请输入正确的手机号'
    return
  }

  // 生成6位随机验证码
  generatedCode.value = Math.floor(100000 + Math.random() * 900000).toString()
  
  // 模拟发送通知（短信弹窗）
  await LocalNotifications.schedule({
    notifications: [
      {
        title: '【TO-DO 验证码】',
        body: `您的登录验证码为：${generatedCode.value}，请在5分钟内完成验证。`,
        id: 1,
        schedule: { at: new Date(Date.now() + 1000) },
        sound: null,
        attachments: null,
        actionTypeId: '',
        extra: null
      }
    ]
  })

  emit('notify', { message: '验证码已通过系统通知发送', type: 'info' })
  
  // 倒计时逻辑
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const sendRegisterSMS = async () => {
  if (!/^1[3-9]\d{9}$/.test(registerPhoneNumber.value)) {
    error.value = '请输入正确的手机号'
    return
  }

  // 检查手机号是否已被使用
  const { value: phoneMappingData } = await Preferences.get({ key: 'phoneMapping' })
  const phoneMapping = phoneMappingData ? JSON.parse(phoneMappingData) : {}
  
  if (phoneMapping[registerPhoneNumber.value]) {
    error.value = '该手机号已被绑定'
    return
  }

  registerGeneratedCode.value = Math.floor(100000 + Math.random() * 900000).toString()
  
  await LocalNotifications.schedule({
    notifications: [{
      title: '【TO-DO 注册验证码】',
      body: `您的注册验证码为：${registerGeneratedCode.value}，请在5分钟内完成验证。`,
      id: 3,
      schedule: { at: new Date(Date.now() + 1000) }
    }]
  })

  emit('notify', { message: '验证码已通过系统通知发送', type: 'info' })
  
  registerCountdown.value = 60
  registerTimer = setInterval(() => {
    registerCountdown.value--
    if (registerCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
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
  } else if (loginMethod.value === 'phone') {
    await handlePhoneLogin()
  } else {
    await handleLogin()
  }
}

const handlePhoneLogin = async () => {
  if (!phoneNumber.value) {
    error.value = '请输入手机号'
    return
  }
  // 统一转为字符串比较
  if (String(verificationCode.value) !== String(generatedCode.value) || !generatedCode.value) {
    error.value = '验证码错误或已失效'
    return
  }

  // 检查手机号是否已绑定到某个账号
  const { value: phoneMappingData } = await Preferences.get({ key: 'phoneMapping' })
  const phoneMapping = phoneMappingData ? JSON.parse(phoneMappingData) : {}
  
  let userKey
  if (phoneMapping[phoneNumber.value]) {
    // 手机号已绑定，登录到绑定的账号
    userKey = phoneMapping[phoneNumber.value]
  } else {
    // 手机号未绑定，创建新的手机号账号
    userKey = `phone_${phoneNumber.value}`
    
    const { value } = await Preferences.get({ key: 'users' })
    const users = value ? JSON.parse(value) : {}
    
    if (!users[userKey]) {
      users[userKey] = 'phone_user_no_pwd'
      await Preferences.set({ key: 'users', value: JSON.stringify(users) })
      
      const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
      const userInfo = userInfoData ? JSON.parse(userInfoData) : {}
      userInfo[userKey] = {
        username: phoneNumber.value,
        registerTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString()
      }
      await Preferences.set({ key: 'userInfo', value: JSON.stringify(userInfo) })
    }
  }

  // 执行登录
  await Preferences.set({ key: 'currentUser', value: userKey })
  emit('notify', { message: '登录成功！', type: 'success' })
  setTimeout(() => {
    window.location.hash = '#/todo'
  }, 300)
}

const handleRegister = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入用户名和密码'
    emit('notify', { message: '请输入用户名和密码', type: 'error' })
    return
  }
  
  // 如果填写了手机号，必须验证
  if (registerPhoneNumber.value) {
    if (!/^1[3-9]\d{9}$/.test(registerPhoneNumber.value)) {
      error.value = '请输入正确的手机号'
      return
    }
    if (String(registerVerificationCode.value) !== String(registerGeneratedCode.value) || !registerGeneratedCode.value) {
      error.value = '验证码错误或已失效'
      return
    }
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
  
  // 如果绑定了手机号
  if (registerPhoneNumber.value && registerVerificationCode.value) {
    userInfo[username.value].boundPhone = registerPhoneNumber.value
    
    // 创建手机号映射
    const { value: phoneMappingData } = await Preferences.get({ key: 'phoneMapping' })
    const phoneMapping = phoneMappingData ? JSON.parse(phoneMappingData) : {}
    phoneMapping[registerPhoneNumber.value] = username.value
    await Preferences.set({ key: 'phoneMapping', value: JSON.stringify(phoneMapping) })
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
    
    // 检查是否首次登录
    const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
    const userInfo = userInfoData ? JSON.parse(userInfoData) : {}
    const isFirstLogin = !userInfo[username.value]?.lastLoginTime
    
    if (userInfo[username.value]) {
      userInfo[username.value].lastLoginTime = new Date().toISOString()
      await Preferences.set({ key: 'userInfo', value: JSON.stringify(userInfo) })
    }
    
    // 标记首次登录状态（按用户隔离）
    if (isFirstLogin) {
      await Preferences.set({ key: `showBackupReminder_${username.value}`, value: 'true' })
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
  phoneNumber.value = ''
  verificationCode.value = ''
  generatedCode.value = ''
  registerPhoneNumber.value = ''
  registerVerificationCode.value = ''
  registerGeneratedCode.value = ''
  if (timer) clearInterval(timer)
  if (registerTimer) clearInterval(registerTimer)
  countdown.value = 0
  registerCountdown.value = 0
}
</script>

<style scoped>
.debug-panel {
  display: none;
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  gap: 1rem;
}

.offline-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 1rem;
  background: rgba(255, 193, 7, 0.15);
  border: 2px solid rgba(255, 193, 7, 0.5);
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  backdrop-filter: blur(10px);
}

.notice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #f57c00;
  margin-bottom: 0.3rem;
}

.notice-text {
  font-size: 0.75rem;
  color: #333;
  line-height: 1.5;
}

.notice-text strong {
  color: #d32f2f;
}

.backup-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: #555;
  font-weight: 600;
}

.login-box {
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.login-tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.tab {
  flex: 1;
  text-align: center;
  padding: 0.8rem;
  cursor: pointer;
  color: var(--text-light);
  font-weight: 600;
  transition: all 0.3s;
}

.tab.active {
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
  margin-bottom: -2px;
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

.code-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.code-input-wrapper .input {
  flex: 1;
}

.btn-send-code {
  padding: 0 1rem;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.3s;
}

.btn-send-code:disabled {
  border-color: #ccc;
  color: #999;
  cursor: not-allowed;
}

.sms-hint {
  margin: 0.3rem 0 0 0;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.2;
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

/* 数据备份提醒弹窗样式 */
.backup-reminder-modal {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

.reminder-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 1rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.backup-reminder-modal h2 {
  text-align: center;
  color: #ff6b6b;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.reminder-content {
  text-align: left;
  line-height: 1.8;
}

.highlight-text {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 1rem;
}

.warning-text {
  font-size: 1.05rem;
  color: #ff6b6b;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.backup-guide {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #2196f3;
}

.guide-title {
  font-weight: 600;
  color: #1565c0;
  margin-bottom: 0.5rem;
}

.backup-guide ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.backup-guide li {
  margin: 0.3rem 0;
  color: #1976d2;
}

.tips-box {
  background: #f3e5f5;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #9c27b0;
}

.tips-box p {
  margin: 0.5rem 0;
  color: #6a1b9a;
  font-size: 0.95rem;
}

.confirm-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all 0.3s;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.confirm-btn:active {
  transform: translateY(0);
}
</style>