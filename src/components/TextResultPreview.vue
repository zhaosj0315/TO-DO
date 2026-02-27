<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="text-result-modal">
      <div class="modal-header">
        <h3>✨ {{ actionName }}</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>
      
      <div class="result-content">
        <div class="result-section">
          <div class="section-label">📝 原文</div>
          <div class="text-box original">{{ originalText }}</div>
        </div>
        
        <div class="result-arrow">↓</div>
        
        <div class="result-section">
          <div class="section-label">✨ 处理结果</div>
          <div class="text-box processed">{{ processedText }}</div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn-secondary" @click="$emit('close')">
          ✕ 关闭
        </button>
        <button class="btn-primary" @click="handleCopy">
          📋 复制结果
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  originalText: String,
  processedText: String,
  actionName: String
})

const emit = defineEmits(['close', 'copy'])

const handleCopy = () => {
  emit('copy')
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
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.text-result-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.result-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
}

.text-box {
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.text-box.original {
  background: #fff9f0;
  border-color: #ffd89b;
}

.text-box.processed {
  background: #f0f9ff;
  border-color: #a8daff;
}

.result-arrow {
  text-align: center;
  font-size: 1.5rem;
  color: #667eea;
  margin: 0.5rem 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 2px solid #f0f0f0;
  background: #fafafa;
}

.btn-secondary {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  background: white;
  color: #666;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.btn-primary {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
