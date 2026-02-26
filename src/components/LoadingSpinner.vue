<template>
  <div v-if="visible" class="loading-overlay" :class="{ 'overlay-transparent': transparent }">
    <div class="loading-spinner">
      <div class="spinner-circle"></div>
      <div class="loading-text">{{ text }}</div>
      <div v-if="subText" class="loading-subtext">{{ subText }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: 'AI 思考中...'
  },
  subText: {
    type: String,
    default: ''
  },
  transparent: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.loading-overlay.overlay-transparent {
  background: rgba(0, 0, 0, 0.3);
}

.loading-spinner {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  text-align: center;
  min-width: 200px;
}

.spinner-circle {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.loading-subtext {
  font-size: 0.85rem;
  color: #666;
}
</style>
