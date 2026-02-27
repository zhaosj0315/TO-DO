<template>
  <div v-if="showGuide" class="permission-guide-overlay" @click="closeGuide">
    <div class="permission-guide-card" @click.stop>
      <div class="guide-header">
        <h2>⚠️ 需要开启后台权限</h2>
        <button class="close-btn" @click="closeGuide">✕</button>
      </div>
      
      <div class="guide-content">
        <p class="guide-intro">为了确保任务提醒准时送达，请按以下步骤设置：</p>
        
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>允许自启动</h3>
            <p>设置 → 应用管理 → TODO App → 自启动 → <strong>开启</strong></p>
          </div>
        </div>
        
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>允许后台运行</h3>
            <p>设置 → 电池 → 应用耗电管理 → TODO App → <strong>允许后台运行</strong></p>
          </div>
        </div>
        
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>锁定后台</h3>
            <p>最近任务 → 下拉 TODO App → 点击<strong>锁定图标🔒</strong></p>
          </div>
        </div>
      </div>
      
      <div class="guide-footer">
        <button class="btn-primary" @click="openSettings">🚀 一键跳转设置</button>
        <button class="btn-secondary" @click="dontShowAgain">不再提示</button>
      </div>
      
      <div class="guide-tip">
        <p>💡 跳转后请依次开启：<strong>自启动</strong> → <strong>后台运行</strong></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Preferences } from '@capacitor/preferences'
import { App } from '@capacitor/app'

const showGuide = ref(false)

onMounted(async () => {
  const { value } = await Preferences.get({ key: 'hidePermissionGuide' })
  if (!value) {
    showGuide.value = true
  }
})

const closeGuide = () => {
  showGuide.value = false
}

const openSettings = async () => {
  try {
    await App.openUrl({ url: 'app-settings:' })
  } catch (error) {
    console.error('无法打开设置', error)
    alert('请手动前往：设置 → 应用管理 → TODO App')
  }
}

const dontShowAgain = async () => {
  await Preferences.set({ key: 'hidePermissionGuide', value: 'true' })
  showGuide.value = false
}
</script>

<style scoped>
.permission-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.permission-guide-card {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.guide-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #ff6b6b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
}

.guide-content {
  padding: 20px;
}

.guide-intro {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.step-card {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #7c3aed;
}

.step-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.step-content h3 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #333;
}

.step-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.step-content strong {
  color: #7c3aed;
  font-weight: 600;
}

.guide-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-secondary {
  background: #f1f3f5;
  color: #666;
}

.btn-secondary:active {
  background: #e9ecef;
}

.guide-tip {
  padding: 0 20px 20px 20px;
  text-align: center;
}

.guide-tip p {
  margin: 0;
  color: #7c3aed;
  font-size: 0.9rem;
  background: #f3f0ff;
  padding: 10px;
  border-radius: 8px;
}

.guide-tip strong {
  color: #5b21b6;
}
</style>
