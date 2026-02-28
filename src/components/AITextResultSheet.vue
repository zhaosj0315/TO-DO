<template>
  <!-- 结果展示 Bottom Sheet -->
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet" @click.stop>
      <div class="sheet-header">
        <h3>{{ getTitle() }}</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="sheet-body">
        <!-- 原文 -->
        <div class="section">
          <div class="section-title">📄 原文</div>
          <div class="original-content">
            {{ originalText }}
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider">
          <span class="divider-icon">↓</span>
        </div>
        
        <!-- 处理结果 -->
        <div class="section">
          <div class="section-title">✨ 处理结果</div>
          <div class="result-content">
            {{ result }}
          </div>
        </div>
      </div>
      
      <div class="sheet-footer">
        <button @click="$emit('close')" class="btn btn-secondary">
          关闭
        </button>
        <button @click="handleCopy" class="btn btn-primary">
          📋 复制结果
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  result: String,
  action: String,
  originalText: String
})

const emit = defineEmits(['close'])

const actionTitles = {
  improve: '✨ 改进结果',
  shorter: '📏 精简结果',
  longer: '📐 扩展结果',
  tone: '🔄 语气调整结果',
  translate: '🌐 翻译结果',
  fix: '📝 修正结果',
  explain: '💡 解释说明',
  summary: '🎯 要点提取',
  continue: '🤖 续写结果'
}

const getTitle = () => {
  return actionTitles[props.action] || '处理结果'
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.result)
    alert('✅ 已复制到剪贴板')
    emit('close')
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = props.result
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('✅ 已复制到剪贴板')
    emit('close')
  }
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
  z-index: 10006;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.sheet-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.section {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.original-content {
  background: #fff3cd;
  border-left: 3px solid #ffc107;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
}

.divider-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.result-content {
  background: #d4edda;
  border-left: 3px solid #28a745;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.sheet-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
