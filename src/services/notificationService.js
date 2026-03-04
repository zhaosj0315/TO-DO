// 统一的通知服务
// 使用方法：
// import { showNotification } from '@/services/notificationService'
// showNotification({ type: 'success', message: '操作成功' })

import { ref } from 'vue'

export const notificationState = ref({
  visible: false,
  type: 'info',
  title: '提示',
  message: '',
  details: '',
  showCancel: false,
  confirmText: '确定',
  cancelText: '取消',
  onConfirm: null,
  onCancel: null
})

export function showNotification(options) {
  console.log('🔔 showNotification 被调用:', options)
  return new Promise((resolve) => {
    notificationState.value = {
      visible: true,
      type: options.type || 'info',
      title: options.title || getDefaultTitle(options.type),
      message: options.message || '',
      details: options.details || '',
      showCancel: options.showCancel || false,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      onConfirm: () => {
        notificationState.value.visible = false
        resolve(true)
      },
      onCancel: () => {
        notificationState.value.visible = false
        resolve(false)
      }
    }
    console.log('🔔 notificationState 已更新:', notificationState.value)
  })
}

export function hideNotification() {
  notificationState.value.visible = false
}

function getDefaultTitle(type) {
  const titles = {
    success: '✅ 成功',
    error: '❌ 错误',
    warning: '⚠️ 警告',
    info: 'ℹ️ 提示',
    confirm: '❓ 确认'
  }
  return titles[type] || '提示'
}

// 快捷方法
export function showSuccess(message, details) {
  return showNotification({ type: 'success', message, details })
}

export function showError(message, details) {
  return showNotification({ type: 'error', message, details })
}

export function showWarning(message, details) {
  return showNotification({ type: 'warning', message, details })
}

export function showInfo(message, details) {
  return showNotification({ type: 'info', message, details })
}

export function showConfirm(message, details) {
  return showNotification({ 
    type: 'confirm', 
    message, 
    details,
    showCancel: true 
  })
}
