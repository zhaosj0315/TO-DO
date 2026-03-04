<template>
  <div class="text-report">
    <!-- 报告周期 -->
    <div class="report-section">
      <div class="section-title">📅 报告周期</div>
      <div class="period-text">{{ report.period?.start }} 至 {{ report.period?.end }}</div>
    </div>

    <!-- 智能总结 -->
    <div v-if="report.summary" class="report-section summary-section">
      <div class="section-title">📝 智能总结</div>
      <div class="summary-text">{{ report.summary }}</div>
    </div>

    <!-- 数据概览 -->
    <div v-if="report.overview" class="report-section">
      <div class="section-title">📊 数据概览</div>
      <div class="overview-grid">
        <div class="overview-item">
          <span class="overview-label">完成任务</span>
          <span class="overview-value">{{ report.overview.totalTasks }}个</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">高优先级</span>
          <span class="overview-value">{{ report.overview.highPriority }}个</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">番茄钟</span>
          <span class="overview-value">{{ report.overview.pomodoros }}个</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">💼 工作</span>
          <span class="overview-value">{{ report.overview.workTasks }}个</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">📚 学习</span>
          <span class="overview-value">{{ report.overview.studyTasks }}个</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">🏠 生活</span>
          <span class="overview-value">{{ report.overview.lifeTasks }}个</span>
        </div>
      </div>
    </div>

    <!-- 本期目标 -->
    <div v-if="report.goals && report.goals.total > 0" class="report-section">
      <div class="section-title">🎯 本期目标</div>
      <div class="goals-summary">
        高优先级任务：<strong>{{ report.goals.total }}</strong> 个
      </div>
      <div class="key-tasks">
        <div v-for="(task, index) in report.goals.tasks" :key="task.id" class="task-item">
          <div class="task-number">{{ index + 1 }}</div>
          <div class="task-content">
            <div class="task-title">🎯 {{ task.text }}</div>
            <div class="task-meta">
              <span>{{ task.categoryIcon }} {{ task.categoryText }}</span>
              <span>🍅 {{ task.pomodoros }}</span>
            </div>
            <div v-if="task.description" class="task-desc">{{ task.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 重点任务 -->
    <div v-if="report.keyTasks && report.keyTasks.length > 0" class="report-section">
      <div class="section-title">✅ 重点任务 (Top 10)</div>
      <div class="key-tasks">
        <div v-for="(task, index) in report.keyTasks" :key="task.id" class="task-item">
          <div class="task-number">{{ index + 1 }}</div>
          <div class="task-content">
            <div class="task-title">✅ {{ task.text }}</div>
            <div class="task-meta">
              <span>{{ task.categoryIcon }} {{ task.categoryText }}</span>
              <span>⚡ {{ task.priorityText }}</span>
              <span>🍅 {{ task.pomodoros }}</span>
              <span>📅 {{ task.time }}</span>
            </div>
            <div v-if="task.description" class="task-desc">{{ task.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 风险与问题 -->
    <div v-if="report.issues && report.issues.total > 0" class="report-section issues-section">
      <div class="section-title">⚠️ 风险与问题</div>
      <div class="issues-summary">
        共有 <strong>{{ report.issues.total }}</strong> 个任务逾期
      </div>
      <div v-if="report.issues.tasks && report.issues.tasks.length > 0" class="key-tasks">
        <div v-for="(task, index) in report.issues.tasks" :key="task.id" class="task-item issue-item">
          <div class="task-number issue-number">{{ index + 1 }}</div>
          <div class="task-content">
            <div class="task-title">⚠️ {{ task.text }}</div>
            <div class="task-meta">
              <span>{{ task.categoryIcon }} {{ task.categoryText }}</span>
              <span>⚡ {{ task.priorityText }}</span>
            </div>
            <div v-if="task.description" class="task-desc">{{ task.description }}</div>
          </div>
        </div>
      </div>
      <div v-if="report.issues.suggestions && report.issues.suggestions.length > 0" class="suggestions">
        <div class="suggestions-title">💡 建议</div>
        <ul>
          <li v-for="(suggestion, index) in report.issues.suggestions" :key="index">
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>

    <!-- 下期计划 -->
    <div v-if="report.nextPlan && report.nextPlan.total > 0" class="report-section">
      <div class="section-title">📅 下期计划</div>
      <div class="plan-summary">
        待办任务：<strong>{{ report.nextPlan.total }}</strong> 个
        &nbsp;|&nbsp;
        高优先级：<strong>{{ report.nextPlan.highPriority }}</strong> 个
      </div>
      <div v-if="report.nextPlan.tasks && report.nextPlan.tasks.length > 0" class="key-tasks">
        <div v-for="(task, index) in report.nextPlan.tasks" :key="task.id" class="task-item">
          <div class="task-number">{{ index + 1 }}</div>
          <div class="task-content">
            <div class="task-title">📌 {{ task.text }}</div>
            <div class="task-meta">
              <span>{{ task.categoryIcon }} {{ task.categoryText }}</span>
              <span>⚡ {{ task.priorityText }}</span>
              <span>🍅 {{ task.pomodoros }}</span>
            </div>
            <div v-if="task.description" class="task-desc">{{ task.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  report: {
    type: Object,
    required: true
  },
  reportType: String
})
</script>

<style scoped>
.text-report {
  padding: 1rem 0;
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

/* 报告周期 */
.period-text {
  font-size: 1rem;
  color: #374151;
  padding: 0.5rem 0;
}

/* 智能总结 */
.summary-section {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 4px solid #667eea;
}

.summary-text {
  color: #374151;
  line-height: 1.8;
  font-size: 0.95rem;
}

/* 数据概览 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.overview-label {
  font-size: 0.9rem;
  color: #6b7280;
}

.overview-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #667eea;
}

/* 重点任务 */
.key-tasks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  transition: all 0.2s;
}

.task-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.task-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
}

.task-content {
  flex: 1;
}

.task-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.task-meta span {
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.task-desc {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.6;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

/* 目标/计划摘要 */
.goals-summary,
.plan-summary {
  font-size: 0.95rem;
  color: #374151;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 3px solid #667eea;
}

.goals-summary strong,
.plan-summary strong {
  color: #667eea;
  font-weight: 700;
}

/* 风险与问题区块 */
.issues-section {
  background: linear-gradient(135deg, #fef2f215 0%, #fee2e215 100%);
  border-left: 4px solid #ef4444;
}

.issues-summary {
  font-size: 0.95rem;
  color: #991b1b;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 3px solid #ef4444;
}

.issues-summary strong {
  color: #dc2626;
  font-weight: 700;
}

.issue-item {
  border-left-color: #ef4444;
}

.issue-item:hover {
  background: #fef2f2;
}

.issue-number {
  background: #ef4444;
}

/* 建议列表 */
.suggestions {
  margin-top: 1rem;
  padding: 1rem;
  background: #fffbeb;
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
}

.suggestions-title {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.suggestions ul {
  margin: 0;
  padding-left: 1.5rem;
  list-style: none;
}

.suggestions li {
  color: #78350f;
  line-height: 1.8;
  font-size: 0.9rem;
  position: relative;
  padding-left: 0.5rem;
}

.suggestions li:before {
  content: '•';
  position: absolute;
  left: -1rem;
  color: #f59e0b;
  font-weight: 700;
}
</style>
