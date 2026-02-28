<template>
  <!-- AI 文本菜单 Bottom Sheet -->
  <div v-if="visible" class="modal-overlay" @click.self="handleOverlayClick">
    <div class="bottom-sheet" @click.stop>
      <div class="sheet-header">
        <h3>✨ AI 文本处理</h3>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>
      
      <div class="sheet-body">
        <div class="menu-row">
          <button @click="handleAction('improve')" class="menu-btn" title="改进写作">
            ✨ 改进
          </button>
          <button @click="handleAction('shorter')" class="menu-btn" title="使其更短">
            📏 精简
          </button>
          <button @click="handleAction('longer')" class="menu-btn" title="使其更长">
            📐 扩展
          </button>
        </div>
        <div class="menu-row">
          <button @click="handleAction('tone')" class="menu-btn" title="改变语气">
            🔄 语气
          </button>
          <button @click="handleAction('translate')" class="menu-btn" title="翻译">
            🌐 翻译
          </button>
          <button @click="handleAction('fix')" class="menu-btn" title="修正拼写和语法">
            📝 修正
          </button>
        </div>
        <div class="menu-row">
          <button @click="handleAction('explain')" class="menu-btn" title="解释说明">
            💡 解释
          </button>
          <button @click="handleAction('summary')" class="menu-btn" title="提取要点">
            🎯 要点
          </button>
          <button @click="handleAction('continue')" class="menu-btn" title="继续写作">
            🤖 续写
          </button>
        </div>
        <div class="menu-row">
          <button @click="handleAction('extract_tasks')" class="menu-btn menu-btn-highlight" title="AI提取任务">
            📋 提取任务
          </button>
        </div>
        
        <!-- 语气子菜单 -->
        <div v-if="showToneMenu" class="tone-submenu">
          <button @click="handleTone('professional')" class="submenu-btn">💼 专业</button>
          <button @click="handleTone('friendly')" class="submenu-btn">😊 友好</button>
          <button @click="handleTone('formal')" class="submenu-btn">🎩 正式</button>
          <button @click="handleTone('casual')" class="submenu-btn">😎 随意</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  },
  selectedText: String
})

const emit = defineEmits(['close', 'action'])

const showToneMenu = ref(false)
const internalText = ref('') // 内部存储的文本

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  console.log('AITextMenu - visible changed to:', newVal, 'selectedText:', props.selectedText)
  if (newVal) {
    // 当菜单显示时，立即捕获并存储 selectedText
    internalText.value = props.selectedText
    console.log('AITextMenu - internalText stored:', internalText.value)
  }
  if (!newVal) {
    showToneMenu.value = false
  }
})

const handleOverlayClick = () => {
  console.log('AITextMenu - overlay clicked, closing')
  emit('close')
}

const handleClose = () => {
  console.log('AITextMenu - close button clicked')
  emit('close')
}

const handleAction = (action) => {
  // 使用内部存储的文本，而不是直接从 props 读取
  const textToProcess = internalText.value
  console.log('AITextMenu handleAction:', action, 'textToProcess:', textToProcess)
  
  if (action === 'tone') {
    showToneMenu.value = !showToneMenu.value
    return
  }
  
  // 发送 action 事件
  console.log('AITextMenu - emitting action:', { action, text: textToProcess })
  emit('action', {
    action,
    text: textToProcess
  })
}

const handleTone = (tone) => {
  // 使用内部存储的文本
  const textToProcess = internalText.value
  console.log('AITextMenu handleTone:', tone, 'textToProcess:', textToProcess)
  
  // 发送 action 事件
  console.log('AITextMenu - emitting tone action:', { action: 'tone', tone, text: textToProcess })
  emit('action', {
    action: 'tone',
    tone,
    text: textToProcess
  })
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
  z-index: 10000;
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
  border-radius: 20px 20px 0 0;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 1.5rem;
}

.menu-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.menu-row:last-child {
  margin-bottom: 0;
}

.menu-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-weight: 500;
}

.menu-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.menu-btn-highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.menu-btn-highlight:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.tone-submenu {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.5rem;
}

.submenu-btn {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.submenu-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}
</style>
