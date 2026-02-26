<template>
  <div class="log-stats">
    <div class="stats-header">
      <h4>📊 日志统计</h4>
      <button class="export-btn" @click="showExportMenu = !showExportMenu">
        📤 导出
      </button>
      
      <!-- 导出菜单 -->
      <div v-if="showExportMenu" class="export-menu">
        <button @click="exportAsText">📋 纯文本</button>
        <button @click="exportAsMarkdown">📄 Markdown</button>
        <button @click="exportAsJson">📊 JSON</button>
      </div>
    </div>
    
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
import { computed, ref } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  taskTitle: {
    type: String,
    default: '任务'
  }
})

const showExportMenu = ref(false)

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

// 导出功能
const logTypeLabels = {
  start: '🚀 开始',
  progress: '📝 进展',
  block: '🚧 阻碍',
  solution: '💡 方案',
  milestone: '🎯 里程碑',
  complete: '✅ 完成'
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportAsText = () => {
  const logs = props.logs || []
  let text = `# ${props.taskTitle} - 执行日志\n\n`
  text += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  
  // 统计摘要
  text += `## 📊 统计摘要\n\n`
  text += `- 总日志数: ${stats.value.total}条\n`
  text += `- 平均耗时: ${stats.value.avgDuration}\n`
  text += `- 阻碍解决率: ${stats.value.blockResolveRate}%\n`
  text += `- 平均进度: ${stats.value.avgProgress}%\n\n`
  
  // 类型分布
  if (typeStats.value.length > 0) {
    text += `## 📋 类型分布\n\n`
    typeStats.value.forEach(type => {
      text += `- ${type.icon} ${type.label}: ${type.count}条 (${type.percentage}%)\n`
    })
    text += `\n`
  }
  
  // 详细日志
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  text += `## 📝 详细记录\n\n`
  
  logs.forEach((log, index) => {
    text += `### ${index + 1}. ${logTypeLabels[log.type] || log.type}\n`
    text += `时间: ${formatTime(log.timestamp)}\n`
    text += `内容: ${log.content}\n`
    
    if (log.duration) {
      text += `耗时: ${log.duration}分钟\n`
    }
    if (log.progress !== null && log.progress !== undefined) {
      text += `进度: ${log.progress}%\n`
    }
    if (log.tags && log.tags.length > 0) {
      text += `标签: ${log.tags.map(t => '#' + t).join(' ')}\n`
    }
    if (log.mood) {
      const moodMap = { good: '😊 顺利', neutral: '😐 一般', bad: '😔 困难' }
      text += `心情: ${moodMap[log.mood]}\n`
    }
    text += `\n`
  })
  
  // 复制到剪贴板
  navigator.clipboard.writeText(text).then(() => {
    alert('✅ 已复制到剪贴板！')
    showExportMenu.value = false
  }).catch(() => {
    alert('❌ 复制失败，请手动复制')
  })
}

const exportAsMarkdown = () => {
  const logs = props.logs || []
  let md = `# ${props.taskTitle} - 执行日志\n\n`
  md += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`
  
  // 统计摘要
  md += `## 📊 统计摘要\n\n`
  md += `| 指标 | 数值 |\n`
  md += `|------|------|\n`
  md += `| 总日志数 | ${stats.value.total}条 |\n`
  md += `| 平均耗时 | ${stats.value.avgDuration} |\n`
  md += `| 阻碍解决率 | ${stats.value.blockResolveRate}% |\n`
  md += `| 平均进度 | ${stats.value.avgProgress}% |\n\n`
  
  // 类型分布
  if (typeStats.value.length > 0) {
    md += `## 📋 类型分布\n\n`
    typeStats.value.forEach(type => {
      const bar = '█'.repeat(Math.round(type.percentage / 5))
      md += `- ${type.icon} **${type.label}**: ${type.count}条 (${type.percentage}%) ${bar}\n`
    })
    md += `\n`
  }
  
  // 详细日志
  md += `## 📝 详细记录\n\n`
  
  logs.forEach((log, index) => {
    md += `### ${index + 1}. ${logTypeLabels[log.type] || log.type}\n\n`
    md += `**时间**: ${formatTime(log.timestamp)}\n\n`
    md += `**内容**: ${log.content}\n\n`
    
    if (log.duration || log.progress !== null || log.tags?.length || log.mood) {
      md += `**详情**:\n`
      if (log.duration) md += `- 耗时: ${log.duration}分钟\n`
      if (log.progress !== null && log.progress !== undefined) md += `- 进度: ${log.progress}%\n`
      if (log.tags && log.tags.length > 0) md += `- 标签: ${log.tags.map(t => '`#' + t + '`').join(' ')}\n`
      if (log.mood) {
        const moodMap = { good: '😊 顺利', neutral: '😐 一般', bad: '😔 困难' }
        md += `- 心情: ${moodMap[log.mood]}\n`
      }
      md += `\n`
    }
    
    md += `---\n\n`
  })
  
  // 复制到剪贴板
  navigator.clipboard.writeText(md).then(() => {
    alert('✅ Markdown已复制到剪贴板！')
    showExportMenu.value = false
  }).catch(() => {
    alert('❌ 复制失败，请手动复制')
  })
}

const exportAsJson = () => {
  const exportData = {
    taskTitle: props.taskTitle,
    exportTime: new Date().toISOString(),
    statistics: {
      total: stats.value.total,
      avgDuration: stats.value.avgDuration,
      blockResolveRate: stats.value.blockResolveRate,
      avgProgress: stats.value.avgProgress
    },
    typeDistribution: typeStats.value,
    topTags: topTags.value,
    moodStats: moodStats.value,
    logs: props.logs
  }
  
  const json = JSON.stringify(exportData, null, 2)
  
  navigator.clipboard.writeText(json).then(() => {
    alert('✅ JSON已复制到剪贴板！')
    showExportMenu.value = false
  }).catch(() => {
    alert('❌ 复制失败，请手动复制')
  })
}

</script>

<style scoped>
.log-stats {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
}

.log-stats h4 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.export-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
  min-width: 120px;
}

.export-menu button {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: none;
  text-align: left;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.export-menu button:hover {
  background: #f8f9fa;
}

.export-menu button:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
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
