<template>
  <div v-if="visible" class="report-overlay" @click.self="$emit('close')">
    <div class="report-container">
      <div class="report-header">
        <h3>{{ reportTitle }}</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="report-body" ref="reportContent">
        <!-- 报告类型选择 -->
        <div class="report-type-selector">
          <button 
            :class="['type-btn', { active: reportType === 'weekly' }]"
            @click="reportType = 'weekly'; generateReport()"
          >
            周报
          </button>
          <button 
            :class="['type-btn', { active: reportType === 'monthly' }]"
            @click="reportType = 'monthly'; generateReport()"
          >
            月报
          </button>
        </div>

        <div v-if="report" class="report-content">
          <!-- 时间范围 -->
          <div class="report-section">
            <div class="section-title">📅 报告周期</div>
            <div class="period-text">{{ report.period.start }} 至 {{ report.period.end }}</div>
          </div>

          <!-- 完成情况统计 -->
          <div class="report-section">
            <div class="section-title">📊 完成情况</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ report.completionStats.total }}</div>
                <div class="stat-label">总任务数</div>
              </div>
              <div class="stat-card completed">
                <div class="stat-value">{{ report.completionStats.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-card pending">
                <div class="stat-value">{{ report.completionStats.pending }}</div>
                <div class="stat-label">进行中</div>
              </div>
              <div class="stat-card overdue">
                <div class="stat-value">{{ report.completionStats.overdue }}</div>
                <div class="stat-label">已逾期</div>
              </div>
            </div>
            <div class="completion-rate">
              完成率：<strong>{{ report.completionStats.completionRate }}%</strong>
              &nbsp;|&nbsp;
              专注时长：<strong>{{ report.completionStats.focusHours }}h</strong>
            </div>
          </div>

          <!-- 关键工作 -->
          <div v-if="report.keyWorks.length > 0" class="report-section">
            <div class="section-title">⭐ 关键工作</div>
            <ul class="work-list">
              <li v-for="work in report.keyWorks" :key="work.id">
                <span class="work-text">{{ work.text }}</span>
                <span :class="['work-category', work.category]">
                  {{ getCategoryText(work.category) }}
                </span>
              </li>
            </ul>
          </div>

          <!-- 问题分析 -->
          <div v-if="report.issues.total > 0" class="report-section">
            <div class="section-title">⚠️ 问题分析</div>
            <div class="issue-summary">
              共有 <strong>{{ report.issues.total }}</strong> 个任务逾期
            </div>
            <ul v-if="report.issues.suggestions.length > 0" class="suggestion-list">
              <li v-for="(suggestion, index) in report.issues.suggestions" :key="index">
                💡 {{ suggestion }}
              </li>
            </ul>
          </div>

          <!-- 下周计划 -->
          <div class="report-section">
            <div class="section-title">🎯 {{ reportType === 'weekly' ? '下周计划' : '下月计划' }}</div>
            <div class="plan-summary">
              待办任务：<strong>{{ report.nextPlan.total }}</strong> 个
              &nbsp;|&nbsp;
              高优先级：<strong>{{ report.nextPlan.highPriority }}</strong> 个
            </div>
            <ul v-if="report.nextPlan.tasks.length > 0" class="plan-list">
              <li v-for="task in report.nextPlan.tasks" :key="task.id">
                <span class="priority-badge high">高</span>
                {{ task.text }}
              </li>
            </ul>
            <div class="recommendations">
              <div class="rec-title">💡 建议</div>
              <ul>
                <li v-for="(rec, index) in report.nextPlan.recommendations" :key="index">
                  {{ rec }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="report-footer">
        <button @click="copyReport" class="btn btn-secondary">📋 复制</button>
        <button @click="exportPDF" class="btn btn-secondary">📄 导出PDF</button>
        <button @click="$emit('close')" class="btn btn-primary">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { AIReportGenerator } from '@/services/aiReportGenerator'

const props = defineProps({
  visible: Boolean,
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const reportType = ref('weekly')
const report = ref(null)
const reportContent = ref(null)

const reportTitle = computed(() => {
  return reportType.value === 'weekly' ? '📊 周报' : '📊 月报'
})

// 生成报告
const generateReport = () => {
  const generator = new AIReportGenerator(props.tasks)
  
  if (reportType.value === 'weekly') {
    report.value = generator.generateWeeklyReport()
  } else {
    report.value = generator.generateMonthlyReport()
  }
}

// 获取分类文本
const getCategoryText = (category) => {
  const map = {
    work: '💼 工作',
    study: '📚 学习',
    life: '🏠 生活'
  }
  return map[category] || category
}

// 复制报告
const copyReport = () => {
  if (!report.value) return
  
  const text = formatReportAsText(report.value)
  navigator.clipboard.writeText(text).then(() => {
    alert('报告已复制到剪贴板')
  })
}

// 格式化报告为纯文本
const formatReportAsText = (report) => {
  let text = `${reportType.value === 'weekly' ? '周报' : '月报'}\n`
  text += `报告周期：${report.period.start} 至 ${report.period.end}\n\n`
  
  text += `【完成情况】\n`
  text += `总任务数：${report.completionStats.total}\n`
  text += `已完成：${report.completionStats.completed}\n`
  text += `进行中：${report.completionStats.pending}\n`
  text += `已逾期：${report.completionStats.overdue}\n`
  text += `完成率：${report.completionStats.completionRate}%\n`
  text += `专注时长：${report.completionStats.focusHours}h\n\n`
  
  if (report.keyWorks.length > 0) {
    text += `【关键工作】\n`
    report.keyWorks.forEach((work, index) => {
      text += `${index + 1}. ${work.text}\n`
    })
    text += `\n`
  }
  
  if (report.issues.total > 0) {
    text += `【问题分析】\n`
    text += `逾期任务：${report.issues.total} 个\n`
    report.issues.suggestions.forEach(s => {
      text += `💡 ${s}\n`
    })
    text += `\n`
  }
  
  text += `【${reportType.value === 'weekly' ? '下周计划' : '下月计划'}】\n`
  text += `待办任务：${report.nextPlan.total} 个\n`
  text += `高优先级：${report.nextPlan.highPriority} 个\n`
  report.nextPlan.recommendations.forEach(r => {
    text += `💡 ${r}\n`
  })
  
  return text
}

// 导出PDF（使用浏览器打印功能）
const exportPDF = () => {
  window.print()
}

// 监听弹窗显示，自动生成报告
watch(() => props.visible, (newVal) => {
  if (newVal) {
    generateReport()
  }
})
</script>

<style scoped>
.report-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10004;
  backdrop-filter: blur(8px);
}

.report-container {
  background: white;
  border-radius: 16px;
  width: 96%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.report-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.report-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.report-type-selector {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.type-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: #667eea;
}

.type-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.report-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.75rem;
}

.period-text {
  color: #666;
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.stat-card {
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid #667eea;
}

.stat-card.completed {
  border-left-color: #00b894;
}

.stat-card.pending {
  border-left-color: #0984e3;
}

.stat-card.overdue {
  border-left-color: #d63031;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.completion-rate {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.completion-rate strong {
  color: #667eea;
}

.work-list, .plan-list, .suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.work-list li, .plan-list li {
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.work-text {
  flex: 1;
  color: #333;
  font-size: 0.9rem;
}

.work-category {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.work-category.work {
  background: #e3f2fd;
  color: #1976d2;
}

.work-category.study {
  background: #f3e5f5;
  color: #7b1fa2;
}

.work-category.life {
  background: #e8f5e9;
  color: #388e3c;
}

.issue-summary, .plan-summary {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.issue-summary strong, .plan-summary strong {
  color: #d63031;
}

.suggestion-list li {
  padding: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.5rem;
}

.priority-badge.high {
  background: #fee;
  color: #c33;
}

.recommendations {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
}

.rec-title {
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.recommendations ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendations li {
  padding: 0.25rem 0;
  color: #666;
  font-size: 0.85rem;
}

.report-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

@media print {
  .report-overlay {
    position: static;
    background: white;
  }
  
  .report-header, .report-footer {
    display: none;
  }
  
  .report-type-selector {
    display: none;
  }
}
</style>
