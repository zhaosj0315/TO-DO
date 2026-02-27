<template>
  <div class="subtask-section">
    <!-- 子任务进度条 -->
    <div v-if="task.hasChildren && task.progress" class="subtask-progress-bar">
      <div class="progress-info">
        <span class="progress-label">📊 子任务进度</span>
        <span class="progress-text">{{ task.progress.subtaskCompleted || 0 }}/{{ task.progress.subtaskTotal || 0 }} ({{ task.progress.subtaskPercentage || 0 }}%)</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: (task.progress.subtaskPercentage || 0) + '%' }"></div>
      </div>
    </div>

    <!-- 子任务列表 -->
    <div v-if="task.hasChildren && task.isExpanded" class="subtask-list">
      <div 
        v-for="subtask in subtasks" 
        :key="subtask.id"
        class="subtask-item"
        :class="{ 'subtask-completed': subtask.status === 'completed' }"
      >
        <label class="subtask-checkbox-wrapper">
          <input 
            type="checkbox" 
            :checked="subtask.status === 'completed'"
            @change="$emit('toggle-subtask', subtask.id)"
          >
        </label>
        <div class="subtask-content" @click="$emit('open-subtask', subtask)">
          <span class="subtask-title">{{ subtask.text }}</span>
          <div class="subtask-meta">
            <span class="badge badge-icon" :class="`priority-${subtask.priority}`">⚡{{ getPriorityText(subtask.priority) }}</span>
            <span v-if="subtask.dependencyStatus === 'blocked'" class="badge badge-blocked">🔒 被阻塞</span>
          </div>
        </div>
        <button class="btn-subtask-delete" @click.stop="$emit('delete-subtask', subtask.id)" title="删除子任务">
          ✕
        </button>
      </div>
    </div>

    <!-- 添加子任务按钮 -->
    <div class="subtask-actions">
      <button 
        v-if="task.hasChildren"
        class="btn-subtask-toggle" 
        @click="$emit('toggle-expand', task.id)"
      >
        <span class="toggle-icon" :class="{ rotated: task.isExpanded }">▶</span>
        {{ task.isExpanded ? '收起' : '展开' }}子任务
      </button>
      <button class="btn-add-subtask" @click="$emit('add-subtask', task.id)">
        ➕ 添加子任务
      </button>
      <button 
        v-if="aiEnabled"
        class="btn-ai-split" 
        @click="$emit('ai-split', task)"
        title="AI 智能分解任务"
      >
        🤖 AI 分解
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  allTasks: {
    type: Array,
    required: true
  },
  aiEnabled: {
    type: Boolean,
    default: true
  }
})

defineEmits(['toggle-subtask', 'open-subtask', 'delete-subtask', 'toggle-expand', 'add-subtask', 'ai-split'])

// 获取子任务列表
const subtasks = computed(() => {
  if (!props.task.childrenIds || !Array.isArray(props.task.childrenIds)) return []
  return props.allTasks.filter(t => props.task.childrenIds.includes(t.id))
})

// 优先级文本
const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}
</script>

<style scoped>
.subtask-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

/* 子任务进度条 */
.subtask-progress-bar {
  margin-bottom: 0.75rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.progress-label {
  color: #8b5cf6;
  font-weight: 600;
}

.progress-text {
  color: #666;
  font-weight: 500;
}

.progress-track {
  height: 6px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 子任务列表 */
.subtask-list {
  margin-bottom: 0.75rem;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.4rem;
  background: rgba(139, 92, 246, 0.03);
  border-left: 3px solid #8b5cf6;
  border-radius: 4px;
  transition: all 0.2s;
}

.subtask-item:hover {
  background: rgba(139, 92, 246, 0.08);
  transform: translateX(2px);
}

.subtask-completed {
  opacity: 0.6;
  border-left-color: #10b981;
}

.subtask-checkbox-wrapper {
  flex-shrink: 0;
  cursor: pointer;
}

.subtask-checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.subtask-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.subtask-title {
  display: block;
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtask-completed .subtask-title {
  text-decoration: line-through;
  color: #999;
}

.subtask-meta {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-subtask-delete {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-subtask-delete:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
}

/* 子任务操作按钮 */
.subtask-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-subtask-toggle,
.btn-add-subtask,
.btn-ai-split {
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(139, 92, 246, 0.3);
  background: white;
  color: #8b5cf6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.btn-subtask-toggle:hover,
.btn-add-subtask:hover,
.btn-ai-split:hover {
  background: #8b5cf6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.toggle-icon {
  display: inline-block;
  transition: transform 0.3s;
  font-size: 0.75rem;
}

.toggle-icon.rotated {
  transform: rotate(90deg);
}

/* 徽章样式 */
.badge {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.badge-blocked {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.priority-high {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.priority-medium {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.priority-low {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}
</style>
