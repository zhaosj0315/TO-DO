<template>
  <div 
    v-if="visible" 
    class="text-ai-menu"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
  >
    <div class="menu-item" @click="handleAction('summarize')">
      📝 总结
    </div>
    <div class="menu-item" @click="handleAction('expand')">
      📖 扩写
    </div>
    <div class="menu-item" @click="handleAction('shorten')">
      ✂️ 缩短
    </div>
    <div class="menu-item" @click="handleAction('improve')">
      ✨ 改进
    </div>
    <div class="menu-item" @click="handleAction('translate')">
      🌐 翻译
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  visible: Boolean,
  position: Object,
  selectedText: String
})

const emit = defineEmits(['action', 'close'])

const handleAction = (action) => {
  console.log('TextAIMenu handleAction:', action, props.selectedText)
  emit('action', { action, text: props.selectedText })
  emit('close')
}
</script>

<style scoped>
.text-ai-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  z-index: 10001;
  min-width: 120px;
  pointer-events: auto;
}

.menu-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;
  pointer-events: auto;
}

.menu-item:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
</style>
