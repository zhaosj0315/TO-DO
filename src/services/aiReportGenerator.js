/**
 * AI 报告生成服务
 * 支持所有类型报告生成（日报、周报、月报、季报、半年报、年报、自定义）
 */

export class AIReportGenerator {
  constructor(tasks) {
    this.tasks = tasks
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
   * 生成报告核心逻辑（丰富结构）
   */
  generateReport(startDate, endDate, type, template = 'work') {
    const now = new Date(endDate)
    const periodStart = new Date(startDate)
    
    // 根据报告类型计算时间节点
    let lastPeriodEnd, thisPeriodStart
    
    if (type === 'daily') {
      // 日报：昨天 vs 今天
      lastPeriodEnd = new Date(now)
      lastPeriodEnd.setDate(now.getDate() - 1)
      lastPeriodEnd.setHours(23, 59, 59, 999)
      thisPeriodStart = new Date(now)
      thisPeriodStart.setHours(0, 0, 0, 0)
    } else if (type === 'weekly') {
      // 周报：上周 vs 本周
      lastPeriodEnd = new Date(periodStart)
      lastPeriodEnd.setDate(periodStart.getDate() - 1)
      lastPeriodEnd.setHours(23, 59, 59, 999)
      thisPeriodStart = new Date(periodStart)
    } else if (type === 'monthly') {
      // 月报：上月 vs 本月
      lastPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      thisPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (type === 'quarterly') {
      // 季报：上季度 vs 本季度
      const currentQuarter = Math.floor(now.getMonth() / 3)
      lastPeriodEnd = new Date(now.getFullYear(), currentQuarter * 3, 0)
      thisPeriodStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
    } else if (type === 'halfyearly') {
      // 半年报：上半年 vs 本半年
      const isSecondHalf = now.getMonth() >= 6
      lastPeriodEnd = isSecondHalf ? new Date(now.getFullYear(), 6, 0) : new Date(now.getFullYear(), 0, 0)
      thisPeriodStart = isSecondHalf ? new Date(now.getFullYear(), 6, 1) : new Date(now.getFullYear(), 0, 1)
    } else if (type === 'yearly') {
      // 年报：去年 vs 今年
      lastPeriodEnd = new Date(now.getFullYear(), 0, 0)
      thisPeriodStart = new Date(now.getFullYear(), 0, 1)
    } else {
      // 自定义：使用传入的时间范围
      const periodDays = Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24))
      lastPeriodEnd = new Date(periodStart)
      lastPeriodEnd.setDate(periodStart.getDate() - 1)
      thisPeriodStart = new Date(periodStart)
    }
    
    // 获取本期完成的任务
    const periodCompletedTasks = this.tasks.filter(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      const completedDate = new Date(t.completed_at)
      return completedDate >= periodStart && completedDate <= now
    })
    
    // 计算番茄钟统计
    let totalPomodoros = 0
    periodCompletedTasks.forEach(task => {
      if (task.pomodoroHistory) {
        totalPomodoros += task.pomodoroHistory.filter(p => p.completed).length
      }
    })
    
    const focusHours = (totalPomodoros * 25 / 60).toFixed(1)
    
    // 按分类统计
    const workTasks = periodCompletedTasks.filter(t => t.category === 'work').length
    const studyTasks = periodCompletedTasks.filter(t => t.category === 'study').length
    const lifeTasks = periodCompletedTasks.filter(t => t.category === 'life').length
    const highPriority = periodCompletedTasks.filter(t => t.priority === 'high').length
    
    // 生成智能总结
    const avgPomodoroPerTask = periodCompletedTasks.length > 0 ? (totalPomodoros / periodCompletedTasks.length).toFixed(1) : 0
    let summary = `本期共完成 ${periodCompletedTasks.length} 个任务，其中高优先级 ${highPriority} 个。`
    summary += `专注时长 ${focusHours} 小时（${totalPomodoros}个番茄钟）。`
    
    if (totalPomodoros > 0) {
      summary += `平均每个任务投入 ${avgPomodoroPerTask} 个番茄钟。`
    }
    
    const maxCategory = workTasks >= studyTasks && workTasks >= lifeTasks ? '工作' : 
                        studyTasks >= lifeTasks ? '学习' : '生活'
    summary += `本期重点在${maxCategory}领域。`
    
    const overdueCount = this.tasks.filter(t => t.status === 'overdue').length
    if (overdueCount > 0) {
      summary += `⚠️ 当前有 ${overdueCount} 个任务逾期，需要重点关注。`
    } else {
      const pendingCount = this.tasks.filter(t => t.status === 'pending').length
      if (pendingCount === 0) {
        summary += `✅ 所有任务进展顺利，建议规划新的目标。`
      } else {
        summary += `✅ 所有任务进展顺利。`
      }
    }
    
    // 1. 已完成情况（截止上期末）- 高优先级里程碑
    const previousCompleted = this.tasks
      .filter(t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) <= lastPeriodEnd)
      .filter(t => t.priority === 'high')
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .slice(0, 10)
      .map(t => {
        const date = new Date(t.completed_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
        return {
          id: t.id,
          text: t.text,
          category: t.category,
          completedAt: t.completed_at,
          displayText: `${this.getCategoryIcon(t.category)} ${t.text} (${date})`
        }
      })
    
    // 2. 本期目标 - 高优先级待办 + 进度提示
    const periodGoals = this.tasks
      .filter(t => t.status === 'pending' && t.priority === 'high')
      .slice(0, 8)
      .map(t => {
        const progress = t.stats?.progressHistory?.[t.stats.progressHistory.length - 1] || 0
        const progressText = progress > 0 ? ` [${progress}%]` : ''
        return {
          id: t.id,
          text: t.text,
          category: t.category,
          progress,
          displayText: `${this.getCategoryIcon(t.category)} ${t.text}${progressText}`
        }
      })
    
    // 3. 本期进展 - 高/中优先级已完成 + 完成日期
    const periodProgress = this.tasks
      .filter(t => {
        if (t.status !== 'completed' || !t.completed_at) return false
        const completedDate = new Date(t.completed_at)
        return completedDate >= thisPeriodStart && completedDate <= now
      })
      .filter(t => t.priority === 'high' || t.priority === 'medium')
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .slice(0, 15)
      .map(t => {
        const date = new Date(t.completed_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
        const priorityIcon = t.priority === 'high' ? '⚡' : '🔸'
        return {
          id: t.id,
          text: t.text,
          category: t.category,
          priority: t.priority,
          completedAt: t.completed_at,
          displayText: `${this.getCategoryIcon(t.category)} ${priorityIcon} ${t.text} (${date})`
        }
      })
    
    // 4. 本周进展 - 按分类分组
    const weeklyByCategory = {
      work: periodCompletedTasks.filter(t => t.category === 'work'),
      study: periodCompletedTasks.filter(t => t.category === 'study'),
      life: periodCompletedTasks.filter(t => t.category === 'life')
    }
    
    const weeklyProgress = []
    if (weeklyByCategory.work.length > 0) {
      weeklyProgress.push({ type: 'header', text: `💼 工作 (${weeklyByCategory.work.length}个)` })
      weeklyByCategory.work.slice(0, 5).forEach(t => {
        weeklyProgress.push({ type: 'item', text: t.text, id: t.id })
      })
    }
    if (weeklyByCategory.study.length > 0) {
      weeklyProgress.push({ type: 'header', text: `📚 学习 (${weeklyByCategory.study.length}个)` })
      weeklyByCategory.study.slice(0, 5).forEach(t => {
        weeklyProgress.push({ type: 'item', text: t.text, id: t.id })
      })
    }
    if (weeklyByCategory.life.length > 0) {
      weeklyProgress.push({ type: 'header', text: `🏠 生活 (${weeklyByCategory.life.length}个)` })
      weeklyByCategory.life.slice(0, 5).forEach(t => {
        weeklyProgress.push({ type: 'item', text: t.text, id: t.id })
      })
    }
    
    // 5. 下周计划 - 按优先级分组 + 截止时间提示
    const nextPlanTasks = this.tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      .slice(0, 10)
      .map(t => {
        const priorityIcon = t.priority === 'high' ? '⚡' : t.priority === 'medium' ? '🔸' : '🔹'
        let deadlineText = ''
        
        if (t.customDate) {
          const deadline = new Date(t.customDate)
          const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
          if (daysLeft <= 3 && daysLeft >= 0) {
            deadlineText = ` [${daysLeft}天后]`
          }
        }
        
        return {
          id: t.id,
          text: t.text,
          category: t.category,
          priority: t.priority,
          displayText: `${this.getCategoryIcon(t.category)} ${priorityIcon} ${t.text}${deadlineText}`
        }
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
        return {
          id: t.id,
          text: t.text,
          category: t.category,
          displayText: `${this.getCategoryIcon(t.category)} ${t.text} - ${overdueText}`
        }
      })
    
    // 返回丰富结构的报告
    return {
      type,
      period: {
        start: startDate.toLocaleDateString('zh-CN'),
        end: endDate.toLocaleDateString('zh-CN')
      },
      generatedAt: new Date().toISOString(),
      
      // 智能总结
      summary,
      
      // 数据概览
      overview: {
        totalTasks: periodCompletedTasks.length,
        completionRate: '100%',
        highPriority,
        pomodoros: totalPomodoros,
        workTasks,
        studyTasks,
        lifeTasks
      },
      
      // 完成情况统计
      completionStats: {
        total: this.tasks.length,
        completed: periodCompletedTasks.length,
        pending: this.tasks.filter(t => t.status === 'pending').length,
        overdue: this.tasks.filter(t => t.status === 'overdue').length,
        completionRate: this.tasks.length > 0 ? Math.round((periodCompletedTasks.length / this.tasks.length) * 100) : 0,
        focusHours
      },
      
      // 完成任务明细
      completedTasks: periodCompletedTasks.map(t => ({
        id: t.id,
        text: t.text,
        category: t.category,
        priority: t.priority,
        completedAt: t.completed_at
      })),
      
      // 已完成情况（截止上期末）
      previousCompleted,
      
      // 本期目标
      periodGoals,
      
      // 本期进展
      periodProgress,
      
      // 本周进展
      weeklyProgress,
      
      // 关键工作（高优先级已完成）
      keyWorks: periodCompletedTasks.filter(t => t.priority === 'high').slice(0, 10).map(t => ({
        id: t.id,
        text: t.text,
        category: t.category,
        completedAt: t.completed_at
      })),
      
      // 下周计划
      nextPlan: {
        total: this.tasks.filter(t => t.status === 'pending').length,
        highPriority: this.tasks.filter(t => t.status === 'pending' && t.priority === 'high').length,
        tasks: nextPlanTasks,
        recommendations: [
          '优先处理高优先级任务',
          '合理安排工作与生活平衡',
          '保持专注，使用番茄钟提高效率'
        ]
      },
      
      // 风险与问题
      issues: {
        total: risks.length,
        tasks: risks,
        suggestions: risks.length > 5 ? ['逾期任务较多，建议优化时间管理'] : []
      }
    }
  }
  
  /**
   * 获取模板对应的章节（固定使用work模板）
   */
  getTemplateSections(template) {
    // 统一使用最完整的work模板
    return ['completionStats', 'previousCompleted', 'periodGoals', 'periodProgress', 'weeklyProgress', 'keyWorks', 'issues', 'nextPlan']
  }

}
