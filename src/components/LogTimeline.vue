<template>
  <div class="log-timeline">
    <div v-if="logs.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无执行日志</div>
    </div>
    
    <div v-else class="timeline-container">
      <div 
        v-for="(log, index) in sortedLogs" 
        :key="index"
        class="timeline-item"
      >
        <!-- 时间轴线 -->
        <div class="timeline-line">
          <div :class="['timeline-dot', getLogTypeClass(log.type)]">
            {{ getLogIcon(log.type) }}
          </div>
          <div v-if="index < sortedLogs.length - 1" class="timeline-connector"></div>
        </div>
        
        <!-- 日志内容 -->
        <div class="timeline-content">
          <div class="log-header">
            <span :class="['log-type', getLogTypeClass(log.type)]">
              {{ getLogTypeLabel(log.type) }}
            </span>
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          </div>
          
          <div class="log-body">
            <p class="log-text">{{ log.content }}</p>
            
            <!-- 进度条 -->
            <div v-if="log.progress !== undefined" class="progress-bar">
              <div class="progress-label">进度: {{ log.progress }}%</div>
              <div class="progress-track">
                <div 
                  class="progress-fill" 
                  :style="{ width: log.progress + '%' }"
                ></div>
              </div>
            </div>
            
            <!-- 耗时 -->
            <div v-if="log.duration" class="log-meta">
              <span class="meta-item">⏱️ 耗时: {{ log.duration }}分钟</span>
            </div>
            
            <!-- 标签 -->
            <div v-if="log.tags && log.tags.length > 0" class="log-tags">
              <span v-for="tag in log.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
            
            <!-- 心情 -->
            <div v-if="log.mood" class="log-mood">
              {{ getMoodIcon(log.mood) }} {{ getMoodText(log.mood) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  }
})

// 按时间排序（最新的在上面）
const sortedLogs = computed(() => {
  return [...props.logs].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  )
})

// 获取日志类型样式类
const getLogTypeClass = (type) => {
  const classMap = {
    start: 'type-start',
    progress: 'type-progress',
    block: 'type-block',
    solution: 'type-solution',
    milestone: 'type-milestone',
    complete: 'type-complete'
  }
  return classMap[type] || 'type-default'
}

// 获取日志类型图标
const getLogIcon = (type) => {
  const iconMap = {
    start: '🚀',
    progress: '📝',
    block: '🚧',
    solution: '💡',
    milestone: '🎯',
    complete: '✅'
  }
  return iconMap[type] || '📌'
}

// 获取日志类型标签
const getLogTypeLabel = (type) => {
  const labelMap = {
    start: '开始',
    progress: '进展',
    block: '阻碍',
    solution: '方案',
    milestone: '里程碑',
    complete: '完成'
  }
  return labelMap[type] || '记录'
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 1分钟内
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  
  // 其他
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取心情图标
const getMoodIcon = (mood) => {
  const iconMap = {
    good: '😊',
    neutral: '😐',
    bad: '😔'
  }
  return iconMap[mood] || '😐'
}

// 获取心情文本
const getMoodText = (mood) => {
  const textMap = {
    good: '顺利',
    neutral: '一般',
    bad: '困难'
  }
  return textMap[mood] || '一般'
}
</script>

<style scoped>
.log-timeline {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 0.9rem;
}

.timeline-container {
  padding: 1rem 0;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  position: relative;
}

.timeline-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  z-index: 1;
}

.timeline-dot.type-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.timeline-dot.type-progress {
  background: linear-gradient(135deg, #0984e3 0%, #74b9ff 100%);
}

.timeline-dot.type-block {
  background: linear-gradient(135deg, #d63031 0%, #ff7675 100%);
}

.timeline-dot.type-solution {
  background: linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%);
}

.timeline-dot.type-milestone {
  background: linear-gradient(135deg, #00b894 0%, #55efc4 100%);
}

.timeline-dot.type-complete {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
}

.timeline-connector {
  width: 2px;
  flex: 1;
  background: linear-gradient(to bottom, #e0e0e0 0%, transparent 100%);
  min-height: 20px;
}

.timeline-content {
  flex: 1;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 3px solid #667eea;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.log-type {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.log-type.type-start {
  background: #667eea;
}

.log-type.type-progress {
  background: #0984e3;
}

.log-type.type-block {
  background: #d63031;
}

.log-type.type-solution {
  background: #fdcb6e;
  color: #333;
}

.log-type.type-milestone {
  background: #00b894;
}

.log-type.type-complete {
  background: #00b894;
}

.log-time {
  font-size: 0.8rem;
  color: #999;
}

.log-body {
  color: #333;
}

.log-text {
  margin: 0 0 0.75rem 0;
  line-height: 1.6;
  font-size: 0.9rem;
}

.progress-bar {
  margin: 0.75rem 0;
}

.progress-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.progress-track {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.log-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.log-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #666;
}

.log-mood {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #666;
  display: inline-block;
}
</style>
