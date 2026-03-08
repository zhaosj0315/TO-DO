/**
 * AI 工作汇报生成器
 * 基于任务数据生成符合工作汇报格式的文本
 */

export class AIWorkReportGenerator {
  constructor(tasks, aiConfig) {
    this.tasks = tasks
    this.aiConfig = aiConfig
  }

  /**
   * 生成工作汇报
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @param {String} type - 报告类型（daily/weekly/monthly/quarterly/yearly）
   * @returns {String} - 格式化的工作汇报文本
   */
  async generateWorkReport(startDate, endDate, type) {
    const reportData = this.collectReportData(startDate, endDate, type)
    
    // 优先使用AI生成（如果配置了AI）
    if (this.aiConfig?.enabled) {
      return await this.generateWithAI(reportData, type)
    }
    
    // 否则使用简化总结
    return this.generateSimpleSummary(reportData, type)
  }

  /**
   * 收集报告数据
   */
  collectReportData(startDate, endDate, type) {
    const now = new Date(endDate)
    const periodStart = new Date(startDate)
    
    // 1. 已完成情况（截止当前）- 按分类分组
    const allCompleted = this.tasks.filter(t => t.status === 'completed' && t.completed_at)
    const completedByCategory = this.groupByCategory(allCompleted)
    
    // 2. 本期目标（高优先级待办）
    const periodGoals = this.tasks
      .filter(t => t.status === 'pending' && t.priority === 'high')
      .slice(0, 10)
    
    // 3. 本期进展（时间范围内完成的任务）
    const periodCompleted = allCompleted.filter(t => {
      const completedDate = new Date(t.completed_at)
      return completedDate >= periodStart && completedDate <= now
    })
    const progressByCategory = this.groupByCategory(periodCompleted)
    
    // 添加进行中的任务（有进度但未完成）
    const inProgress = this.tasks.filter(t => {
      return t.status === 'pending' && t.stats?.progressHistory?.length > 0
    }).map(t => {
      const latestProgress = t.stats.progressHistory[t.stats.progressHistory.length - 1]
      return { ...t, currentProgress: latestProgress }
    })
    
    // 4. 下期计划（待办任务）
    const nextPlan = this.tasks.filter(t => t.status === 'pending')
    const nextPlanByCategory = this.groupByCategory(nextPlan)
    
    // 5. 风险与问题（逾期任务）
    const risks = this.tasks.filter(t => t.status === 'overdue')
    const risksByCategory = this.groupByCategory(risks)
    
    // 6. 统计数据
    const stats = {
      totalCompleted: periodCompleted.length,
      totalPomodoros: this.calculatePomodoros(periodCompleted),
      highPriorityCompleted: periodCompleted.filter(t => t.priority === 'high').length,
      overdueCount: risks.length
    }
    
    return {
      type,
      period: {
        start: this.formatDate(periodStart),
        end: this.formatDate(now)
      },
      completedByCategory,
      periodGoals,
      progressByCategory,
      inProgress,
      nextPlanByCategory,
      risksByCategory,
      stats
    }
  }

  /**
   * 使用AI生成报告（调用AI接口优化语言）
   */
  async generateWithAI(data, type) {
    console.log('🤖 开始调用AI生成报告...')
    console.log('🤖 AI配置:', this.aiConfig)
    
    const typeLabels = {
      daily: '日报',
      weekly: '周报',
      monthly: '月报',
      quarterly: '季报',
      yearly: '年报'
    }
    
    // 构建结构化数据摘要（给AI的上下文）
    const dataSummary = `
报告类型：${typeLabels[type] || '报告'}
报告周期：${data.period.start} - ${data.period.end}

【数据统计】
- 本期完成任务：${data.stats.totalCompleted}个
- 高优先级完成：${data.stats.highPriorityCompleted}个
- 投入番茄钟：${data.stats.totalPomodoros}个
- 逾期任务：${data.stats.overdueCount}个

【分类分布】
- 工作：${data.progressByCategory.work?.length || 0}个
- 学习：${data.progressByCategory.study?.length || 0}个
- 生活：${data.progressByCategory.life?.length || 0}个

【重点完成任务】（前10项）
${data.progressByCategory.work?.slice(0, 5).map(t => `- ${t.text}`).join('\n') || '无'}

【本期目标】（高优先级待办）
${data.periodGoals.slice(0, 5).map(t => `- ${t.text}`).join('\n')}

【进行中任务】
${data.inProgress.slice(0, 3).map(t => `- ${t.text}（进度${t.currentProgress}%）`).join('\n') || '无'}

【下期计划】（待办任务）
- 工作：${data.nextPlanByCategory.work?.length || 0}项
- 学习：${data.nextPlanByCategory.study?.length || 0}项
- 生活：${data.nextPlanByCategory.life?.length || 0}项

【风险问题】
${data.stats.overdueCount > 0 ? `- 逾期任务${data.stats.overdueCount}个，需要重点关注` : '- 无逾期任务'}
`

    // 构建AI提示词
    const prompt = `请根据以下任务数据，生成一份专业、简洁的工作汇报。

${dataSummary}

要求：
1. 使用专业的工作汇报语言，避免简单罗列
2. 突出重点成果和关键进展
3. 分析工作亮点和存在的问题
4. 给出具体的改进建议
5. 结构清晰，分为5个部分：
   - 一、工作概述（整体完成情况的总结性描述）
   - 二、重点成果（本期最重要的3-5项成果，说明价值和影响）
   - 三、进展情况（按工作/学习/生活分类，用段落描述而非列表）
   - 四、下期计划（重点工作方向和目标）
   - 五、问题与建议（风险分析和改进措施）

注意：
- 不要简单罗列任务清单
- 要有总结性和分析性的语言
- 突出工作价值和成果
- 字数控制在800-1200字`

    try {
      console.log('🌐 发送AI请求到:', this.aiConfig.baseURL)
      console.log('🌐 使用模型:', this.aiConfig.model)
      
      // 判断是否为 Ollama 本地模型
      const isOllama = this.aiConfig.baseURL.includes('/api/generate')
      
      let requestBody
      if (isOllama) {
        // Ollama 格式
        const systemPrompt = '你是一个专业的工作汇报助手，擅长将任务数据总结成高质量的工作汇报。你的汇报风格专业、简洁、有洞察力，能够突出重点和价值。'
        requestBody = {
          model: this.aiConfig.model,
          prompt: `${systemPrompt}\n\n${prompt}`,
          stream: false
        }
      } else {
        // OpenAI 格式
        requestBody = {
          model: this.aiConfig.model,
          messages: [
            { 
              role: 'system', 
              content: '你是一个专业的工作汇报助手，擅长将任务数据总结成高质量的工作汇报。你的汇报风格专业、简洁、有洞察力，能够突出重点和价值。' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        }
      }
      
      const response = await fetch(this.aiConfig.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.aiConfig.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`AI请求失败: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ AI响应成功', result)
      
      // 兼容不同AI模型的响应格式
      let content = null
      
      // OpenAI格式: { choices: [{ message: { content: "..." } }] }
      if (result.choices && result.choices[0]?.message?.content) {
        content = result.choices[0].message.content
      }
      // Ollama格式: { response: "..." }
      else if (result.response) {
        content = result.response
      }
      // 其他格式
      else if (result.content) {
        content = result.content
      }
      
      // 检查内容是否有效（非空字符串）
      if (!content || content.trim() === '') {
        throw new Error('AI响应内容为空')
      }
      
      return content
    } catch (error) {
      console.error('❌ AI生成失败:', error)
      console.log('⚠️ 降级使用规则生成')
      // 降级：返回简化的模板报告
      return this.generateSimpleSummary(data, type)
    }
  }

  /**
   * 生成简化总结（AI失败时的降级方案）
   */
  generateSimpleSummary(data, type) {
    const typeLabels = {
      daily: '日报',
      weekly: '周报',
      monthly: '月报',
      quarterly: '季报',
      yearly: '年报'
    }
    
    let report = `【工作汇报】${typeLabels[type] || '报告'}（${data.period.start} - ${data.period.end}）\n\n`
    
    // 一、工作概述
    report += `一、工作概述\n\n`
    report += `本期共完成${data.stats.totalCompleted}项任务，其中高优先级任务${data.stats.highPriorityCompleted}项，累计投入${data.stats.totalPomodoros}个番茄钟。`
    
    const workCount = data.progressByCategory.work?.length || 0
    const studyCount = data.progressByCategory.study?.length || 0
    const lifeCount = data.progressByCategory.life?.length || 0
    
    report += `工作任务完成${workCount}项，学习任务${studyCount}项，生活任务${lifeCount}项。`
    
    if (data.stats.overdueCount > 0) {
      report += `当前有${data.stats.overdueCount}项任务逾期，需要重点关注。`
    } else {
      report += `所有任务进展顺利，无逾期情况。`
    }
    report += `\n\n`
    
    // 二、重点成果
    report += `二、重点成果\n\n`
    const topTasks = [
      ...(data.progressByCategory.work?.slice(0, 3) || []),
      ...(data.progressByCategory.study?.slice(0, 2) || [])
    ]
    
    if (topTasks.length > 0) {
      topTasks.forEach((task, index) => {
        const category = task.category === 'work' ? '工作' : task.category === 'study' ? '学习' : '生活'
        report += `${index + 1}. ${task.text}（${category}领域）\n`
      })
    } else {
      report += `本期暂无重点成果记录。\n`
    }
    report += `\n`
    
    // 三、进展情况
    report += `三、进展情况\n\n`
    
    if (workCount > 0) {
      report += `工作方面：完成${workCount}项任务，主要集中在核心业务推进和技术优化方面。`
    }
    
    if (studyCount > 0) {
      report += `学习方面：完成${studyCount}项学习任务，持续提升专业技能。`
    }
    
    if (lifeCount > 0) {
      report += `生活方面：完成${lifeCount}项生活任务，保持工作生活平衡。`
    }
    
    if (data.inProgress.length > 0) {
      report += `\n\n当前有${data.inProgress.length}项任务正在推进中：\n`
      data.inProgress.slice(0, 3).forEach(task => {
        report += `- ${task.text}（进度${task.currentProgress}%）\n`
      })
    }
    report += `\n`
    
    // 四、下期计划
    report += `四、下期计划\n\n`
    const nextWorkCount = data.nextPlanByCategory.work?.length || 0
    const nextStudyCount = data.nextPlanByCategory.study?.length || 0
    const nextLifeCount = data.nextPlanByCategory.life?.length || 0
    
    report += `下期计划推进${nextWorkCount + nextStudyCount + nextLifeCount}项任务，`
    report += `其中工作任务${nextWorkCount}项，学习任务${nextStudyCount}项，生活任务${nextLifeCount}项。`
    report += `重点关注高优先级任务的按时完成，确保关键目标达成。\n\n`
    
    // 五、问题与建议
    report += `五、问题与建议\n\n`
    
    if (data.stats.overdueCount > 0) {
      report += `当前存在${data.stats.overdueCount}项逾期任务，建议：\n`
      report += `1. 优先处理逾期任务，避免影响整体进度\n`
      report += `2. 分析逾期原因，优化时间管理策略\n`
      report += `3. 合理评估任务难度，避免过度承诺\n`
    } else {
      report += `本期任务执行顺利，建议：\n`
      report += `1. 保持当前工作节奏，继续提升效率\n`
      report += `2. 适当增加挑战性任务，促进能力提升\n`
      report += `3. 注意工作生活平衡，保持可持续发展\n`
    }
    
    return report
  }

  /**
   * 辅助方法
   */
  groupByCategory(tasks) {
    return {
      work: tasks.filter(t => t.category === 'work'),
      study: tasks.filter(t => t.category === 'study'),
      life: tasks.filter(t => t.category === 'life')
    }
  }

  calculatePomodoros(tasks) {
    return tasks.reduce((sum, t) => {
      if (t.pomodoroHistory) {
        return sum + t.pomodoroHistory.filter(p => p.completed).length
      }
      return sum
    }, 0)
  }

  getTaskPomodoros(task) {
    if (task.pomodoroHistory) {
      return task.pomodoroHistory.filter(p => p.completed).length
    }
    return 0
  }

  getEstimatedPomodoros(priority) {
    const map = { high: 4, medium: 2, low: 1 }
    return map[priority] || 2
  }

  getPriorityText(priority) {
    const map = { high: '高优先级', medium: '中优先级', low: '低优先级' }
    return map[priority] || '中优先级'
  }

  calculateOverdueDays(task) {
    if (!task.customDate) return 0
    const deadline = new Date(task.customDate)
    const now = new Date()
    return Math.ceil((now - deadline) / (1000 * 60 * 60 * 24))
  }

  formatDate(date, format = 'full') {
    if (format === 'short') {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}
