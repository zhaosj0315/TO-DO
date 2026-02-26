/**
 * AI 报告生成服务
 * 支持周报、月报生成
 */

export class AIReportGenerator {
  constructor(tasks) {
    this.tasks = tasks
  }

  /**
   * 生成周报
   */
  generateWeeklyReport() {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    return this.generateReport(weekAgo, now, 'weekly')
  }

  /**
   * 生成月报
   */
  generateMonthlyReport() {
    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    return this.generateReport(monthAgo, now, 'monthly')
  }

  /**
   * 生成报告核心逻辑
   */
  generateReport(startDate, endDate, type) {
    const periodTasks = this.getTasksInPeriod(startDate, endDate)
    
    // 1. 完成情况统计
    const completionStats = this.calculateCompletionStats(periodTasks)
    
    // 2. 关键工作提取
    const keyWorks = this.extractKeyWorks(periodTasks)
    
    // 3. 问题分析
    const issues = this.analyzeIssues(periodTasks)
    
    // 4. 下周计划
    const nextPlan = this.generateNextPlan()
    
    return {
      type,
      period: {
        start: startDate.toLocaleDateString('zh-CN'),
        end: endDate.toLocaleDateString('zh-CN')
      },
      completionStats,
      keyWorks,
      issues,
      nextPlan,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * 获取时间段内的任务
   */
  getTasksInPeriod(startDate, endDate) {
    return this.tasks.filter(task => {
      const createdAt = new Date(task.created_at)
      return createdAt >= startDate && createdAt <= endDate
    })
  }

  /**
   * 计算完成情况统计
   */
  calculateCompletionStats(tasks) {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const overdue = tasks.filter(t => t.status === 'overdue').length
    const pending = tasks.filter(t => t.status === 'pending').length
    
    // 按分类统计
    const byCategory = {
      work: tasks.filter(t => t.category === 'work').length,
      study: tasks.filter(t => t.category === 'study').length,
      life: tasks.filter(t => t.category === 'life').length
    }
    
    // 按优先级统计
    const byPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    }
    
    // 专注时长统计
    let totalPomodoros = 0
    tasks.forEach(task => {
      if (task.pomodoroHistory) {
        totalPomodoros += task.pomodoroHistory.filter(p => p.completed).length
      }
    })
    
    return {
      total,
      completed,
      overdue,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory,
      byPriority,
      focusHours: (totalPomodoros * 25 / 60).toFixed(1)
    }
  }

  /**
   * 提取关键工作（高优先级已完成任务）
   */
  extractKeyWorks(tasks) {
    return tasks
      .filter(t => t.status === 'completed' && t.priority === 'high')
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        text: t.text,
        category: t.category,
        completedAt: t.completed_at
      }))
  }

  /**
   * 分析问题（逾期任务）
   */
  analyzeIssues(tasks) {
    const overdueTasks = tasks.filter(t => t.status === 'overdue')
    
    // 按分类分组
    const issuesByCategory = {
      work: overdueTasks.filter(t => t.category === 'work').length,
      study: overdueTasks.filter(t => t.category === 'study').length,
      life: overdueTasks.filter(t => t.category === 'life').length
    }
    
    // 生成建议
    let suggestions = []
    if (overdueTasks.length > 5) {
      suggestions.push('逾期任务较多，建议优化时间管理')
    }
    if (issuesByCategory.work > 3) {
      suggestions.push('工作类任务逾期较多，需要重新评估工作量')
    }
    
    return {
      total: overdueTasks.length,
      byCategory: issuesByCategory,
      suggestions,
      tasks: overdueTasks.slice(0, 5).map(t => ({
        id: t.id,
        text: t.text,
        category: t.category
      }))
    }
  }

  /**
   * 生成下周计划
   */
  generateNextPlan() {
    const pendingTasks = this.tasks.filter(t => t.status === 'pending')
    const highPriority = pendingTasks.filter(t => t.priority === 'high')
    
    return {
      total: pendingTasks.length,
      highPriority: highPriority.length,
      recommendations: [
        '优先处理高优先级任务',
        '合理安排工作与生活平衡',
        '保持专注，使用番茄钟提高效率'
      ],
      tasks: highPriority.slice(0, 5).map(t => ({
        id: t.id,
        text: t.text,
        category: t.category,
        priority: t.priority
      }))
    }
  }
}
