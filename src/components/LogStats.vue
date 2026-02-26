<template>
  <div class="log-stats">
    <h4>📊 日志统计</h4>
    
    <!-- 核心指标 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总日志数</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">{{ stats.avgDuration }}</div>
        <div class="stat-label">平均耗时</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🚧</div>
        <div class="stat-value">{{ stats.blockResolveRate }}%</div>
        <div class="stat-label">阻碍解决率</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value">{{ stats.avgProgress }}%</div>
        <div class="stat-label">平均进度</div>
      </div>
    </div>
    
    <!-- 类型分布 -->
    <div class="type-distribution">
      <h5>📋 类型分布</h5>
      <div class="type-list">
        <div 
          v-for="type in typeStats" 
          :key="type.type"
          class="type-item"
        >
          <span class="type-label">
            {{ type.icon }} {{ type.label }}
          </span>
          <div class="type-bar-container">
            <div 
              class="type-bar" 
              :style="{ 
                width: type.percentage + '%',
                background: type.color 
              }"
            ></div>
          </div>
          <span class="type-count">{{ type.count }}</span>
        </div>
      </div>
    </div>
    
    <!-- 标签统计 -->
    <div v-if="topTags.length > 0" class="tag-stats">
      <h5>🏷️ 常用标签 Top 5</h5>
      <div class="tag-cloud">
        <span 
          v-for="tag in topTags" 
          :key="tag.name"
          class="tag-item"
          :style="{ fontSize: getTagSize(tag.count) }"
        >
          #{{ tag.name }} ({{ tag.count }})
        </span>
      </div>
    </div>
    
    <!-- 心情分布 -->
    <div v-if="moodStats.length > 0" class="mood-stats">
      <h5>😊 心情分布</h5>
      <div class="mood-list">
        <div 
          v-for="mood in moodStats" 
          :key="mood.mood"
          class="mood-item"
        >
          <span class="mood-icon">{{ mood.icon }}</span>
          <span class="mood-label">{{ mood.label }}</span>
          <span class="mood-count">{{ mood.count }}次 ({{ mood.percentage }}%)</span>
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

// 计算统计数据
const stats = computed(() => {
  const logs = props.logs || []
  
  // 总日志数
  const total = logs.length
  
  // 平均耗时
  const logsWithDuration = logs.filter(log => log.duration)
  const avgDuration = logsWithDuration.length > 0
    ? Math.round(logsWithDuration.reduce((sum, log) => sum + log.duration, 0) / logsWithDuration.length)
    : 0
  const avgDurationText = avgDuration >= 60 
    ? `${(avgDuration / 60).toFixed(1)}h` 
    : `${avgDuration}min`
  
  // 阻碍解决率
  const blocks = logs.filter(log => log.type === 'block')
  const resolvedBlocks = blocks.filter(log => log.resolved)
  const blockResolveRate = blocks.length > 0
    ? Math.round((resolvedBlocks.length / blocks.length) * 100)
    : 0
  
  // 平均进度
  const logsWithProgress = logs.filter(log => log.progress !== null && log.progress !== undefined)
  const avgProgress = logsWithProgress.length > 0
    ? Math.round(logsWithProgress.reduce((sum, log) => sum + log.progress, 0) / logsWithProgress.length)
    : 0
  
  return {
    total,
    avgDuration: avgDurationText,
    blockResolveRate,
    avgProgress
  }
})

// 类型统计
const typeStats = computed(() => {
  const logs = props.logs || []
  const total = logs.length
  
  const types = [
    { type: 'start', label: '开始', icon: '🚀', color: '#667eea', count: 0 },
    { type: 'progress', label: '进展', icon: '📝', color: '#0984e3', count: 0 },
    { type: 'block', label: '阻碍', icon: '🚧', color: '#d63031', count: 0 },
    { type: 'solution', label: '方案', icon: '💡', color: '#fdcb6e', count: 0 },
    { type: 'milestone', label: '里程碑', icon: '🎯', color: '#00b894', count: 0 },
    { type: 'complete', label: '完成', icon: '✅', color: '#00cec9', count: 0 }
  ]
  
  logs.forEach(log => {
    const typeItem = types.find(t => t.type === log.type)
    if (typeItem) {
      typeItem.count++
    }
  })
  
  return types
    .filter(t => t.count > 0)
    .map(t => ({
      ...t,
      percentage: total > 0 ? Math.round((t.count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
})

// 标签统计
const topTags = computed(() => {
  const logs = props.logs || []
  const tagMap = new Map()
  
  logs.forEach(log => {
    if (log.tags && log.tags.length > 0) {
      log.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    }
  })
  
  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

// 心情统计
const moodStats = computed(() => {
  const logs = props.logs || []
  const moodMap = {
    good: { mood: 'good', label: '顺利', icon: '😊', count: 0 },
    neutral: { mood: 'neutral', label: '一般', icon: '😐', count: 0 },
    bad: { mood: 'bad', label: '困难', icon: '😔', count: 0 }
  }
  
  logs.forEach(log => {
    if (log.mood && moodMap[log.mood]) {
      moodMap[log.mood].count++
    }
  })
  
  const total = Object.values(moodMap).reduce((sum, m) => sum + m.count, 0)
  
  return Object.values(moodMap)
    .filter(m => m.count > 0)
    .map(m => ({
      ...m,
      percentage: total > 0 ? Math.round((m.count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
})

// 获取标签字体大小
const getTagSize = (count) => {
  const max = Math.max(...topTags.value.map(t => t.count))
  const ratio = count / max
  return `${0.85 + ratio * 0.4}rem`
}
</script>

<style scoped>
.log-stats {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.log-stats h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
}

.log-stats h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
}

.type-distribution,
.tag-stats,
.mood-stats {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.type-item {
  display: grid;
  grid-template-columns: 80px 1fr 40px;
  align-items: center;
  gap: 0.5rem;
}

.type-label {
  font-size: 0.85rem;
  color: #333;
}

.type-bar-container {
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.type-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.type-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  text-align: right;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-item {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 12px;
  color: #667eea;
  font-weight: 600;
  transition: all 0.2s;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.mood-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mood-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.mood-icon {
  font-size: 1.2rem;
}

.mood-label {
  flex: 1;
  font-size: 0.85rem;
  color: #333;
}

.mood-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
