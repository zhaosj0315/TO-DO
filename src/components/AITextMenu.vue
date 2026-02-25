<template>
  <div 
    v-if="visible" 
    class="ai-text-menu"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
    @mousedown.prevent.stop
    @mouseup.stop
  >
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
  }
  if (!newVal) {
    showToneMenu.value = false
  }
})

const handleAction = (action) => {
  // 使用内部存储的文本，而不是直接从 props 读取
  const textToProcess = internalText.value
  console.log('AITextMenu handleAction:', action, 'props.selectedText:', props.selectedText, 'textToProcess:', textToProcess)
  
  if (action === 'tone') {
    showToneMenu.value = !showToneMenu.value
    return
  }
  
  // 先发送 action，再关闭菜单
  emit('action', {
    action,
    text: textToProcess
  })
  
  // 延迟关闭，确保 action 处理完成
  setTimeout(() => {
    emit('close')
  }, 0)
}

const handleTone = (tone) => {
  // 使用内部存储的文本
  const textToProcess = internalText.value
  console.log('AITextMenu handleTone:', tone, 'props.selectedText:', props.selectedText, 'textToProcess:', textToProcess)
  
  // 先发送 action，再关闭菜单
  emit('action', {
    action: 'tone',
    tone,
    text: textToProcess
  })
  
  // 延迟关闭
  setTimeout(() => {
    emit('close')
  }, 0)
}
</script>

<style scoped>
.ai-text-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  z-index: 10000;
  animation: menuFadeIn 0.15s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-row {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.menu-row:last-child {
  margin-bottom: 0;
}

.menu-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.menu-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-1px);
}

.menu-btn-highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.menu-btn-highlight:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.tone-submenu {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.25rem;
}

.submenu-btn {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.submenu-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}
</style>
