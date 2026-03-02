<template>
  <!-- AI生成预览弹窗 - Bottom Sheet -->
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="preview-sheet">
      <div class="preview-header">
        <h3>{{ title }}</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>
      
      <div class="preview-content">
        <textarea 
          v-model="editableContent"
          class="preview-textarea"
          placeholder="AI生成的内容..."
          rows="10"
        ></textarea>
      </div>
      
      <div class="preview-actions">
        <button @click="handleRegenerate" class="btn-action btn-regenerate" :disabled="loading">
          {{ loading ? '⏳ 生成中...' : '🔄 重新生成' }}
        </button>
        <button @click="handleAdopt" class="btn-action btn-adopt">
          ✅ 采纳
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  content: String,
  title: {
    type: String,
    default: '✨ AI生成预览'
  },
  loading: Boolean
})

const emit = defineEmits(['close', 'adopt', 'regenerate'])

const editableContent = ref('')

// 监听content变化，更新可编辑内容
watch(() => props.content, (newContent) => {
  editableContent.value = newContent
}, { immediate: true })

const handleAdopt = () => {
  emit('adopt', editableContent.value)
}

const handleRegenerate = () => {
  emit('regenerate')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  align-items: flex-end !important;
  justify-content: center !important;
  z-index: 99999 !important;
  animation: fadeIn 0.2s ease-out;
}

.preview-sheet {
  background: white !important;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUpFromBottom 0.3s ease-out;
  position: relative;
  z-index: 100000 !important;
}

@keyframes slideUpFromBottom {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.preview-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.preview-textarea {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}

.preview-textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-action {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-regenerate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-regenerate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-regenerate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-adopt {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-adopt:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
