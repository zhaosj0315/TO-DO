<template>
  <div v-if="visible" class="report-overlay" @click.self="$emit('close')">
    <div class="report-container">
      <div class="report-header">
        <h3>{{ reportTitle }}</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <!-- 加载动画 -->
      <LoadingSpinner
        :visible="generating"
        text="正在生成报告..."
        subText="分析任务数据中"
      />
      
      <div class="report-body" ref="reportContent">
        <!-- 报告类型选择（仅在未指定类型时显示） -->
        <div v-if="!initialReportType" class="report-type-selector">
          <button 
            :class="['type-btn', { active: reportType === 'daily' }]"
            @click="reportType = 'daily'; generateReport()"
          >
            日报
          </button>
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
          <button 
            :class="['type-btn', { active: reportType === 'quarterly' }]"
            @click="reportType = 'quarterly'; generateReport()"
          >
            季报
          </button>
          <button 
            :class="['type-btn', { active: reportType === 'halfyearly' }]"
            @click="reportType = 'halfyearly'; generateReport()"
          >
            半年报
          </button>
          <button 
            :class="['type-btn', { active: reportType === 'yearly' }]"
            @click="reportType = 'yearly'; generateReport()"
          >
            年报
          </button>
        </div>

        <div v-if="report" class="report-content">
          <!-- 时间范围 -->
          <div class="report-section">
            <div class="section-title">📅 报告周期</div>
            <div class="period-text">{{ report.period.start }} 至 {{ report.period.end }}</div>
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

          <!-- 完成情况统计 -->
          <div v-if="report.completionStats" class="report-section">
            <div class="section-title">📊 完成情况</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ report.completionStats.total || 0 }}</div>
                <div class="stat-label">总任务数</div>
              </div>
              <div class="stat-card completed">
                <div class="stat-value">{{ report.completionStats.completed || 0 }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-card pending">
                <div class="stat-value">{{ report.completionStats.pending || 0 }}</div>
                <div class="stat-label">进行中</div>
              </div>
              <div class="stat-card overdue">
                <div class="stat-value">{{ report.completionStats.overdue || 0 }}</div>
                <div class="stat-label">已逾期</div>
              </div>
            </div>
            <div class="completion-rate">
              完成率：<strong>{{ report.completionStats.completionRate || 0 }}%</strong>
              &nbsp;|&nbsp;
              专注时长：<strong>{{ report.completionStats.focusHours || 0 }}h</strong>
            </div>
          </div>

          <!-- 完成任务明细 -->
          <div v-if="report.completedTasks && report.completedTasks.length > 0" class="report-section">
            <div class="section-title">✅ 完成任务明细</div>
            <div class="task-cards">
              <div v-for="task in report.completedTasks" :key="task.id" class="task-card">
                <div class="task-card-header">
                  <span :class="['task-category-badge', task.category]">
                    {{ getCategoryText(task.category) }}
                  </span>
                  <span :class="['task-priority-badge', task.priority]">
                    {{ task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低' }}
                  </span>
                </div>
                <div class="task-card-title">{{ task.text }}</div>
              </div>
            </div>
          </div>

          <!-- 已完成情况（截止上期末） -->
          <div v-if="report.previousCompleted && report.previousCompleted.length > 0" class="report-section">
            <div class="section-title">✅ 已完成情况（截止{{ getPeriodLabel('上期末') }}）</div>
            <ul class="work-list">
              <li v-for="item in report.previousCompleted" :key="item.id">
                {{ item.displayText }}
              </li>
            </ul>
          </div>

          <!-- 本期目标 -->
          <div v-if="report.periodGoals && report.periodGoals.length > 0" class="report-section">
            <div class="section-title">🎯 {{ getPeriodLabel('本期') }}目标</div>
            <ul class="work-list">
              <li v-for="item in report.periodGoals" :key="item.id">
                {{ item.displayText }}
              </li>
            </ul>
          </div>

          <!-- 本期进展 -->
          <div v-if="report.periodProgress && report.periodProgress.length > 0" class="report-section">
            <div class="section-title">📈 {{ getPeriodLabel('本期') }}进展（截止当前）</div>
            <ul class="work-list">
              <li v-for="item in report.periodProgress" :key="item.id">
                {{ item.displayText }}
              </li>
            </ul>
          </div>

          <!-- 本周进展 -->
          <div v-if="report.weeklyProgress && report.weeklyProgress.length > 0" class="report-section">
            <div class="section-title">📅 {{ getPeriodLabel('本周') }}进展</div>
            <ul class="weekly-list">
              <li v-for="(item, index) in report.weeklyProgress" :key="index" :class="item.type">
                <span v-if="item.type === 'header'" class="category-header">{{ item.text }}</span>
                <span v-else class="task-item">• {{ item.text }}</span>
              </li>
            </ul>
          </div>

          <!-- 关键工作 -->
          <div v-if="report.keyWorks && report.keyWorks.length > 0" class="report-section">
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

          <!-- 风险与问题 -->
          <div v-if="report.issues && report.issues.total > 0" class="report-section">
            <div class="section-title">⚠️ 风险与问题</div>
            <div class="issue-summary">
              共有 <strong>{{ report.issues.total }}</strong> 个任务逾期
            </div>
            <ul v-if="report.issues.tasks && report.issues.tasks.length > 0" class="work-list">
              <li v-for="item in report.issues.tasks" :key="item.id">
                {{ item.displayText }}
              </li>
            </ul>
            <ul v-if="report.issues.suggestions && report.issues.suggestions.length > 0" class="suggestion-list">
              <li v-for="(suggestion, index) in report.issues.suggestions" :key="index">
                💡 {{ suggestion }}
              </li>
            </ul>
          </div>

          <!-- 下期计划 -->
          <div v-if="report.nextPlan" class="report-section">
            <div class="section-title">🎯 {{ getPeriodLabel('下期') }}计划</div>
            <div class="plan-summary">
              待办任务：<strong>{{ report.nextPlan.total }}</strong> 个
              &nbsp;|&nbsp;
              高优先级：<strong>{{ report.nextPlan.highPriority }}</strong> 个
            </div>
            <ul v-if="report.nextPlan.tasks && report.nextPlan.tasks.length > 0" class="work-list">
              <li v-for="task in report.nextPlan.tasks" :key="task.id">
                {{ task.displayText }}
              </li>
            </ul>
            <div v-if="report.nextPlan.recommendations" class="recommendations">
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
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  visible: Boolean,
  tasks: {
    type: Array,
    default: () => []
  },
  initialReportType: {
    type: String,
    default: 'weekly'
  },
  customDateRange: {
    type: Object,
    default: null
  },
  template: {
    type: String,
    default: 'standard'
  }
})

const emit = defineEmits(['close', 'report-generated'])

const reportType = ref('weekly')
const report = ref(null)
const reportContent = ref(null)
const generating = ref(false)

const reportTitle = computed(() => {
  const titles = {
    daily: '📝 日报',
    weekly: '📅 周报',
    monthly: '📊 月报',
    quarterly: '📈 季报',
    halfyearly: '📆 半年报',
    yearly: '🎯 年报',
    custom: '🔍 区间报告'
  }
  return titles[reportType.value] || '📊 报告'
})

// 获取期间标签（根据报告类型动态显示）
const getPeriodLabel = (type) => {
  const labels = {
    daily: {
      '上期末': '昨天',
      '本期': '今日',
      '本周': '今日',
      '下期': '明日'
    },
    weekly: {
      '上期末': '上周末',
      '本期': '本周',
      '本周': '本周',
      '下期': '下周'
    },
    monthly: {
      '上期末': '上月末',
      '本期': '本月',
      '本周': '本月',
      '下期': '下月'
    },
    quarterly: {
      '上期末': '上季度末',
      '本期': '本季度',
      '本周': '本季度',
      '下期': '下季度'
    },
    halfyearly: {
      '上期末': '上半年末',
      '本期': '本半年',
      '本周': '本半年',
      '下期': '下半年'
    },
    yearly: {
      '上期末': '去年末',
      '本期': '今年',
      '本周': '今年',
      '下期': '明年'
    },
    custom: {
      '上期末': '上期末',
      '本期': '本期',
      '本周': '本期',
      '下期': '下期'
    }
  }
  
  return labels[reportType.value]?.[type] || type
}

// 生成报告
const generateReport = async () => {
  generating.value = true
  
  // 让UI有时间显示loading
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    const generator = new AIReportGenerator(props.tasks)
    const now = new Date()
    
    if (reportType.value === 'daily') {
      // 日报：今天
      const dayStart = new Date(now)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(now)
      dayEnd.setHours(23, 59, 59, 999)
      
      report.value = generator.generateReport(dayStart, dayEnd, 'daily', props.template)
    } else if (reportType.value === 'weekly') {
      // 周报：本周
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      report.value = generator.generateReport(weekStart, weekEnd, 'weekly', props.template)
    } else if (reportType.value === 'monthly') {
      // 月报：最近30天
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      monthStart.setHours(0, 0, 0, 0)
      const monthEnd = new Date(now)
      monthEnd.setHours(23, 59, 59, 999)
      
      report.value = generator.generateReport(monthStart, monthEnd, 'monthly', props.template)
    } else if (reportType.value === 'quarterly') {
      // 季报：最近3个月
      const quarterStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      quarterStart.setHours(0, 0, 0, 0)
      const quarterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      quarterEnd.setHours(23, 59, 59, 999)
      report.value = generator.generateReport(quarterStart, quarterEnd, 'quarterly', props.template)
    } else if (reportType.value === 'halfyearly') {
      // 半年报：最近6个月
      const halfYearStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      halfYearStart.setHours(0, 0, 0, 0)
      const halfYearEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      halfYearEnd.setHours(23, 59, 59, 999)
      report.value = generator.generateReport(halfYearStart, halfYearEnd, 'halfyearly', props.template)
    } else if (reportType.value === 'yearly') {
      // 年报：今年1月1日到现在
      const yearStart = new Date(now.getFullYear(), 0, 1)
      yearStart.setHours(0, 0, 0, 0)
      const yearEnd = new Date(now)
      yearEnd.setHours(23, 59, 59, 999)
      report.value = generator.generateReport(yearStart, yearEnd, 'yearly', props.template)
    } else if (reportType.value === 'custom' && props.customDateRange) {
      // 自定义日期范围
      const customStart = new Date(props.customDateRange.startDate)
      customStart.setHours(0, 0, 0, 0)
      const customEnd = new Date(props.customDateRange.endDate)
      customEnd.setHours(23, 59, 59, 999)
      report.value = generator.generateReport(customStart, customEnd, 'custom', props.template)
    }
    
    // 触发保存事件
    if (report.value) {
      emit('report-generated', {
        reportType: reportType.value,
        report: report.value,
        createdAt: new Date().toISOString()
      })
    }
  } finally {
    generating.value = false
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
    // 使用传入的报告类型
    reportType.value = props.initialReportType || 'weekly'
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
  z-index: 10004;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.report-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.report-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
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

.summary-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-section .section-title {
  color: white;
}

.summary-text {
  color: white;
  line-height: 1.8;
  font-size: 0.95rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
}

.overview-label {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.overview-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #667eea;
}

.task-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid #667eea;
  transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-card-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.task-category-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.task-category-badge.work {
  background: #e3f2fd;
  color: #1976d2;
}

.task-category-badge.study {
  background: #f3e5f5;
  color: #7b1fa2;
}

.task-category-badge.life {
  background: #e8f5e9;
  color: #388e3c;
}

.task-priority-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.task-priority-badge.high {
  background: #ffebee;
  color: #c62828;
}

.task-priority-badge.medium {
  background: #fff3e0;
  color: #ef6c00;
}

.task-priority-badge.low {
  background: #e3f2fd;
  color: #1976d2;
}

.task-card-title {
  color: #333;
  font-size: 0.9rem;
  line-height: 1.5;
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
  color: #333;
  font-size: 0.9rem;
  line-height: 1.5;
}

.weekly-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.weekly-list li.header {
  font-weight: 700;
  color: #667eea;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.weekly-list li.header:first-child {
  margin-top: 0;
}

.weekly-list li.item {
  padding-left: 1rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.category-header {
  font-weight: 700;
  color: #667eea;
}

.task-item {
  color: #666;
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
