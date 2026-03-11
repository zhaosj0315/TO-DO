<template>
  <div v-if="visible" class="modal-overlay" @click="handleClose">
    <div class="modal-content bottom-sheet" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <div class="drag-handle"></div>
        <h2>🌅 今日规划</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <!-- 规划内容 -->
      <div class="modal-body">
        <!-- AI 总结 -->
        <div class="summary-section">
          <div class="section-title">💡 AI 建议</div>
          <div class="summary-card">
            <MarkdownRenderer 
              v-if="plan?.summary" 
              :content="plan.summary" 
              :media="[]" 
            />
            <div v-else class="empty-text">暂无规划</div>
          </div>
        </div>

        <!-- 时间表 -->
        <div class="schedule-section">
          <div class="section-title">
            📅 执行计划
            <span class="task-count">共 {{ schedule.length }} 项</span>
          </div>

          <div v-if="schedule.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>暂无计划安排</p>
          </div>

          <div v-else class="schedule-list">
            <div v-for="(item, index) in schedule" :key="index" class="schedule-item">
              <div class="time-badge">{{ item.time }}</div>
              <div class="schedule-content">
                <div class="task-name">{{ item.task }}</div>
                <div class="task-reason">{{ item.reason }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 任务列表 -->
        <div v-if="tasks && tasks.length > 0" class="tasks-section">
          <div class="section-title">
            📋 相关任务
            <span class="task-count">{{ tasks.length }} 个</span>
          </div>
          <div class="task-chips">
            <div v-for="(task, index) in tasks" :key="index" class="task-chip">
              {{ task.text }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <button @click="handleClose" class="btn-primary">
          知道了
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps({
  visible: Boolean,
  plan: {
    type: Object,
    default: () => ({ summary: '', schedule: [] })
  },
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const schedule = computed(() => props.plan?.schedule || [])

const handleClose = () => {
  emit('close')
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
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 100%;
  max-height: 90vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.drag-handle {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  flex: 1;
  text-align: center;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.section-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-count {
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 500;
}

.summary-section {
  margin-bottom: 1.5rem;
}

.summary-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 3px solid #667eea;
  padding: 1rem;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
}

.schedule-section {
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  display: flex;
  gap: 0.75rem;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.time-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  height: fit-content;
}

.schedule-content {
  flex: 1;
}

.task-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.task-reason {
  font-size: 0.85rem;
  color: #666;
}

.tasks-section {
  margin-bottom: 1rem;
}

.task-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.task-chip {
  background: white;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
</style>
