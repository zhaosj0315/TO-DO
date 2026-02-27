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
   * @param {string} startDate - 周开始日期
   * @param {string} endDate - 周结束日期
   * @param {Array} weekCompletedTasks - 本周完成的任务（用于统计）
   */
  generateWeeklyReport(startDate, endDate, weekCompletedTasks) {
    const now = new Date(endDate)
    const weekStart = new Date(startDate)
    
    // 计算上月末
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // 计算本月初
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // 1. 已完成情况（截止上月末）- 高优先级里程碑
    const previousCompleted = this.tasks
      .filter(t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) <= lastMonthEnd)
      .filter(t => t.priority === 'high')
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)) // 最新的在前
      .slice(0, 10)
      .map(t => {
        const date = new Date(t.completed_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
        return `${this.getCategoryIcon(t.category)} ${t.text} (${date})`
      })
    
    // 2. 本月目标 - 高优先级待办 + 进度提示
    const monthlyGoals = this.tasks
      .filter(t => t.status === 'pending' && t.priority === 'high')
      .slice(0, 8)
      .map(t => {
        const progress = t.stats?.progressHistory?.[t.stats.progressHistory.length - 1] || 0
        const progressText = progress > 0 ? ` [${progress}%]` : ''
        return `${this.getCategoryIcon(t.category)} ${t.text}${progressText}`
      })
    
    // 3. 本月进展 - 高/中优先级已完成 + 完成日期
    const monthlyProgress = this.tasks
      .filter(t => {
        if (t.status !== 'completed' || !t.completed_at) return false
        const completedDate = new Date(t.completed_at)
        return completedDate >= thisMonthStart && completedDate <= now
      })
      .filter(t => t.priority === 'high' || t.priority === 'medium')
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .slice(0, 15)
      .map(t => {
        const date = new Date(t.completed_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
        const priorityIcon = t.priority === 'high' ? '⚡' : '🔸'
        return `${this.getCategoryIcon(t.category)} ${priorityIcon} ${t.text} (${date})`
      })
    
    // 4. 本周进展 - 按分类分组
    const weeklyByCategory = {
      work: weekCompletedTasks.filter(t => t.category === 'work'),
      study: weekCompletedTasks.filter(t => t.category === 'study'),
      life: weekCompletedTasks.filter(t => t.category === 'life')
    }
    
    const weeklyProgress = []
    if (weeklyByCategory.work.length > 0) {
      weeklyProgress.push(`💼 工作 (${weeklyByCategory.work.length}个)`)
      weeklyByCategory.work.slice(0, 5).forEach(t => {
        weeklyProgress.push(`  • ${t.text}`)
      })
    }
    if (weeklyByCategory.study.length > 0) {
      weeklyProgress.push(`📚 学习 (${weeklyByCategory.study.length}个)`)
      weeklyByCategory.study.slice(0, 5).forEach(t => {
        weeklyProgress.push(`  • ${t.text}`)
      })
    }
    if (weeklyByCategory.life.length > 0) {
      weeklyProgress.push(`🏠 生活 (${weeklyByCategory.life.length}个)`)
      weeklyByCategory.life.slice(0, 5).forEach(t => {
        weeklyProgress.push(`  • ${t.text}`)
      })
    }
    
    // 5. 下周计划 - 按优先级分组 + 截止时间提示
    const nextWeekPlan = this.tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      .slice(0, 10)
      .map(t => {
        const priorityIcon = t.priority === 'high' ? '⚡' : t.priority === 'medium' ? '🔸' : '🔹'
        let deadlineText = ''
        
        // 计算截止时间
        if (t.customDate) {
          const deadline = new Date(t.customDate)
          const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
          if (daysLeft <= 3 && daysLeft >= 0) {
            deadlineText = ` [${daysLeft}天后]`
          }
        }
        
        return `${this.getCategoryIcon(t.category)} ${priorityIcon} ${t.text}${deadlineText}`
      })
    
    // 6. 风险与问题 - 逾期任务 + 逾期天数
    const risks = this.tasks
      .filter(t => t.status === 'overdue')
      .slice(0, 8)
      .map(t => {
        let overdueText = '已逾期'
        if (t.customDate) {
          const deadline = new Date(t.customDate)
          const daysOverdue = Math.ceil((now - deadline) / (1000 * 60 * 60 * 24))
          overdueText = `逾期${daysOverdue}天`
        }
        return `${this.getCategoryIcon(t.category)} ${t.text} - ${overdueText}`
      })
    
    // 计算番茄钟总数
    let totalPomodoros = 0
    weekCompletedTasks.forEach(task => {
      if (task.pomodoroHistory) {
        totalPomodoros += task.pomodoroHistory.filter(p => p.completed).length
      }
    })
    
    // 按分类统计
    const workTasks = weekCompletedTasks.filter(t => t.category === 'work').length
    const studyTasks = weekCompletedTasks.filter(t => t.category === 'study').length
    const lifeTasks = weekCompletedTasks.filter(t => t.category === 'life').length
    
    // 高优先级任务数
    const highPriority = weekCompletedTasks.filter(t => t.priority === 'high').length
    
    // 智能总结
    const focusHours = (totalPomodoros * 25 / 60).toFixed(1)
    const avgPomodoroPerTask = weekCompletedTasks.length > 0 ? (totalPomodoros / weekCompletedTasks.length).toFixed(1) : 0
    
    let summary = `本周共完成 ${weekCompletedTasks.length} 个任务，其中高优先级 ${highPriority} 个。`
    summary += `专注时长 ${focusHours} 小时（${totalPomodoros}个番茄钟）。`
    
    if (totalPomodoros > 0) {
      summary += `平均每个任务投入 ${avgPomodoroPerTask} 个番茄钟。`
    }
    
    // 分类分析
    const maxCategory = workTasks >= studyTasks && workTasks >= lifeTasks ? '工作' : 
                        studyTasks >= lifeTasks ? '学习' : '生活'
    summary += `本周重点在${maxCategory}领域。`
    
    // 风险提示
    if (risks.length > 0) {
      summary += `⚠️ 当前有 ${risks.length} 个任务逾期，需要重点关注。`
    } else if (nextWeekPlan.length === 0) {
      summary += `✅ 所有任务进展顺利，建议规划新的目标。`
    } else {
      summary += `✅ 所有任务进展顺利。`
    }
    
    return {
      period: {
        start: startDate.toLocaleDateString('zh-CN'),
        end: endDate.toLocaleDateString('zh-CN')
      },
      completionStats: {
        total: this.tasks.length,
        completed: weekCompletedTasks.length,
        pending: this.tasks.filter(t => t.status === 'pending').length,
        overdue: this.tasks.filter(t => t.status === 'overdue').length
      },
      overview: {
        totalTasks: weekCompletedTasks.length,
        completionRate: '100%',
        highPriority,
        pomodoros: totalPomodoros,
        workTasks,
        studyTasks,
        lifeTasks
      },
      tasks: weekCompletedTasks,
      previousCompleted,
      monthlyGoals,
      monthlyProgress,
      weeklyProgress,
      nextWeekPlan,
      nextPlan: {
        total: this.tasks.filter(t => t.status === 'pending').length,
        highPriority: this.tasks.filter(t => t.status === 'pending' && t.priority === 'high').length,
        recommendations: nextWeekPlan,
        tasks: this.tasks.filter(t => t.status === 'pending' && t.priority === 'high').slice(0, 5)
      },
      keyWorks: weekCompletedTasks.filter(t => t.priority === 'high').slice(0, 10),
      risks,
      issues: {
        total: this.tasks.filter(t => t.status === 'overdue').length,
        overdue: this.tasks.filter(t => t.status === 'overdue'),
        suggestions: risks
      },
      summary
    }
  }
  
  /**
   * 获取分类图标
   */
  getCategoryIcon(category) {
    const icons = {
      work: '💼',
      study: '📚',
      life: '🏠'
    }
    return icons[category] || '📌'
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
