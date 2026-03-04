<template>
  <div class="visual-report">
    <!-- Hero Section -->
    <div class="report-hero">
      <h1 class="hero-title">{{ reportData.period?.start }} - {{ reportData.period?.end }}</h1>
      <p class="hero-subtitle">你的时间，看得见。</p>
    </div>

    <!-- AI智能摘要 -->
    <div v-if="reportData.executiveSummary" class="executive-summary">
      <div class="summary-badge">🤖 AI 智能摘要</div>
      <p class="summary-text">{{ reportData.executiveSummary }}</p>
    </div>

    <!-- 核心数字 -->
    <div class="hero-stats">
      <div class="hero-stat-card">
        <div class="hero-stat-icon">🍅</div>
        <div class="hero-stat-value">{{ reportData.totalPomodoros || 0 }}</div>
        <div class="hero-stat-label">番茄钟</div>
      </div>
      <div class="hero-stat-card">
        <div class="hero-stat-icon">✅</div>
        <div class="hero-stat-value">{{ reportData.completedTasks || 0 }}</div>
        <div class="hero-stat-label">已完成</div>
      </div>
      <div class="hero-stat-card">
        <div class="hero-stat-icon">📈</div>
        <div class="hero-stat-value">{{ reportData.completionRate || 0 }}%</div>
        <div class="hero-stat-label">完成率</div>
      </div>
    </div>

    <!-- 分类统计 -->
    <div v-if="reportData.categories" class="report-section">
      <h3 class="section-title">📊 分类统计</h3>
      <div class="category-stats">
        <div v-for="cat in reportData.categories" :key="cat.name" class="category-item">
          <div class="category-header">
            <span class="category-name">{{ cat.icon }} {{ cat.name }}</span>
            <span class="category-value">{{ cat.completed }}/{{ cat.total }} ({{ cat.rate }}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: cat.rate + '%', background: cat.color }"></div>
          </div>
          <div class="category-detail">
            <span>🍅 {{ cat.pomodoros }}个</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 优先级分布 -->
    <div v-if="reportData.priorities" class="report-section">
      <h3 class="section-title">⚡ 优先级分布</h3>
      <div class="priority-stats">
        <div v-for="pri in reportData.priorities" :key="pri.name" class="priority-item">
          <div class="priority-header">
            <span class="priority-name">{{ pri.name }}</span>
            <span class="priority-value">{{ pri.total }}项 ({{ pri.percentage }}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: pri.percentage + '%', background: pri.color }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  reportData: {
    type: Object,
    required: true
  },
  reportType: String
})
</script>

<style scoped>
.visual-report {
  padding: 1rem 0;
}

/* Hero Section */
.report-hero {
  text-align: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* AI摘要 */
.executive-summary {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 4px solid #667eea;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.summary-badge {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.summary-text {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

/* 核心数字 */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.hero-stat-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.2s;
}

.hero-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.hero-stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.hero-stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.hero-stat-label {
  font-size: 0.85rem;
  color: #6b7280;
}

/* 报告区块 */
.report-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

/* 分类统计 */
.category-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.category-name {
  font-weight: 600;
  color: #374151;
}

.category-value {
  font-size: 0.9rem;
  color: #6b7280;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.category-detail {
  font-size: 0.85rem;
  color: #6b7280;
}

/* 优先级统计 */
.priority-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.priority-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.priority-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.priority-name {
  font-weight: 600;
  color: #374151;
}

.priority-value {
  font-size: 0.9rem;
  color: #6b7280;
}
</style>
