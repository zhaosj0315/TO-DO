<template>
  <div 
    v-if="show && suggestions.length > 0" 
    class="autocomplete-dropdown"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
  >
    <div 
      v-for="(item, index) in suggestions" 
      :key="index"
      :class="['suggestion-item', { active: index === activeIndex }]"
      @click="selectSuggestion(item)"
      @mouseenter="activeIndex = index"
    >
      <span class="icon">{{ item.icon }}</span>
      <span class="text">{{ item.text }}</span>
      <span v-if="item.count" class="count">{{ item.count }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: Boolean,
  suggestions: {
    type: Array,
    default: () => []
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  }
})

const emit = defineEmits(['select', 'close'])

const activeIndex = ref(0)

// 键盘导航
function handleKeydown(e) {
  if (!props.show || props.suggestions.length === 0) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % props.suggestions.length
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = activeIndex.value === 0 
        ? props.suggestions.length - 1 
        : activeIndex.value - 1
      break
    case 'Enter':
      e.preventDefault()
      if (props.suggestions[activeIndex.value]) {
        selectSuggestion(props.suggestions[activeIndex.value])
      }
      break
    case 'Escape':
      e.preventDefault()
      emit('close')
      break
  }
}

function selectSuggestion(item) {
  emit('select', item)
  activeIndex.value = 0
}

// 重置激活索引
watch(() => props.suggestions, () => {
  activeIndex.value = 0
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.autocomplete-dropdown {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10020;  /* 🔧 提高到最高层级，高于所有弹窗 */
  min-width: 200px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: rgba(139, 92, 246, 0.1);
}

.suggestion-item .icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.suggestion-item .text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
}

.suggestion-item .count {
  padding: 2px 6px;
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
