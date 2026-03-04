<template>
  <div v-if="notificationState.visible" class="modal-overlay" @click.self="close">
    <div class="notification-sheet">
      <div class="modal-header">
        <button class="back-btn" @click="close">
          <span>← 返回</span>
        </button>
        <h3>{{ notificationState.title }}</h3>
        <div style="width: 80px;"></div>
      </div>

      <div class="modal-body">
        <div class="notification-icon">
          {{ icon }}
        </div>
        <div class="notification-message">
          {{ notificationState.message }}
        </div>
        <div v-if="notificationState.details" class="notification-details">
          {{ notificationState.details }}
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="notificationState.showCancel" class="btn btn-secondary" @click="handleCancel">
          {{ notificationState.cancelText }}
        </button>
        <button class="btn btn-primary" @click="handleConfirm">
          {{ notificationState.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { notificationState } from '@/services/notificationService'

const icon = computed(() => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    confirm: '❓'
  }
  return icons[notificationState.value.type] || 'ℹ️'
})

const close = () => {
  notificationState.value.visible = false
}

const handleConfirm = () => {
  if (notificationState.value.onConfirm) {
    notificationState.value.onConfirm()
  }
  close()
}

const handleCancel = () => {
  if (notificationState.value.onCancel) {
    notificationState.value.onCancel()
  }
  close()
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Bottom Sheet */
.notification-sheet {
  width: 100%;
  max-height: 70vh;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  flex-shrink: 0;
  position: relative;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: white;
  padding: 0.5rem;
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  text-align: center;
}

.notification-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.notification-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.notification-details {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.6;
  white-space: pre-wrap;
  text-align: left;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
}

.btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
