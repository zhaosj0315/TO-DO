<template>
  <div class="dependency-section">
    <!-- 依赖状态提示 -->
    <div v-if="task.dependencyStatus === 'blocked'" class="dependency-alert blocked">
      <span class="alert-icon">🔒</span>
      <div class="alert-content">
        <strong>任务被阻塞</strong>
        <p>需要先完成 {{ blockedByTasks.length }} 个前置任务</p>
      </div>
    </div>

    <div v-if="task.blockingCount && task.blockingCount > 0" class="dependency-alert blocking">
      <span class="alert-icon">🔗</span>
      <div class="alert-content">
        <strong>阻塞其他任务</strong>
        <p>完成后将解锁 {{ task.blockingCount }} 个任务</p>
      </div>
    </div>

    <!-- 前置任务列表 -->
    <div v-if="blockedByTasks.length > 0" class="dependency-list">
      <h4 class="dependency-title">⬆️ 依赖于（前置任务）</h4>
      <div 
        v-for="depTask in blockedByTasks" 
        :key="depTask.id"
        class="dependency-item"
        :class="{ 'dependency-completed': depTask.status === 'completed' }"
        @click="$emit('open-task', depTask)"
      >
        <span class="dependency-status">
          {{ depTask.status === 'completed' ? '✅' : '⏳' }}
        </span>
        <span class="dependency-text">{{ depTask.text }}</span>
        <button 
          class="btn-remove-dependency" 
          @click.stop="$emit('remove-dependency', task.id, depTask.id)"
          title="移除依赖"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 后置任务列表 -->
    <div v-if="blockingTasks.length > 0" class="dependency-list">
      <h4 class="dependency-title">⬇️ 阻塞（后置任务）</h4>
      <div 
        v-for="blockTask in blockingTasks" 
        :key="blockTask.id"
        class="dependency-item"
        @click="$emit('open-task', blockTask)"
      >
        <span class="dependency-status">🔒</span>
        <span class="dependency-text">{{ blockTask.text }}</span>
      </div>
    </div>

    <!-- 添加依赖按钮 -->
    <button class="btn-add-dependency" @click="$emit('add-dependency', task.id)">
      🔗 添加依赖关系
    </button>
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
  }
})

defineEmits(['open-task', 'remove-dependency', 'add-dependency'])

// 前置任务列表
const blockedByTasks = computed(() => {
  if (!props.task.dependencies || !props.task.dependencies.blockedBy) return []
  return props.allTasks.filter(t => props.task.dependencies.blockedBy.includes(t.id))
})

// 后置任务列表
const blockingTasks = computed(() => {
  if (!props.task.dependencies || !props.task.dependencies.blocking) return []
  return props.allTasks.filter(t => props.task.dependencies.blocking.includes(t.id))
})
</script>

<style scoped>
.dependency-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

/* 依赖状态提示 */
.dependency-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.dependency-alert.blocked {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.dependency-alert.blocking {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.alert-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #333;
}

.alert-content p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

/* 依赖列表 */
.dependency-list {
  margin-bottom: 1rem;
}

.dependency-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
}

.dependency-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem;
  margin-bottom: 0.4rem;
  background: rgba(139, 92, 246, 0.03);
  border-left: 3px solid #8b5cf6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.dependency-item:hover {
  background: rgba(139, 92, 246, 0.08);
  transform: translateX(2px);
}

.dependency-completed {
  border-left-color: #10b981;
  opacity: 0.7;
}

.dependency-status {
  flex-shrink: 0;
  font-size: 1rem;
}

.dependency-text {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-remove-dependency {
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

.btn-remove-dependency:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
}

/* 添加依赖按钮 */
.btn-add-dependency {
  width: 100%;
  padding: 0.6rem;
  border: 1px dashed rgba(139, 92, 246, 0.3);
  background: white;
  color: #8b5cf6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-add-dependency:hover {
  background: rgba(139, 92, 246, 0.05);
  border-color: #8b5cf6;
  transform: translateY(-1px);
}
</style>
