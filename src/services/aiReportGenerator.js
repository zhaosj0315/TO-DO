// AI 报告生成服务
export class AIReportGenerator {
  /**
   * 生成周报
   * @param {Array} tasks - 已完成的任务列表
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<{summary: string, highlights: Array, stats: Object}>} 周报内容
   */
  static async generateWeeklyReport(tasks, startDate, endDate) {
    console.log('AIReportGenerator.generateWeeklyReport called with:', { tasks, startDate, endDate })
    
    if (!tasks || tasks.length === 0) {
      return {
        summary: '本周暂无完成任务',
        highlights: [],
        stats: { total: 0, work: 0, study: 0, life: 0 }
      }
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = this.buildPrompt(tasks, startDate, endDate)
    console.log('Generated prompt:', prompt)
    
    let apiUrl = model.url
    if (model.type === 'openai' && !apiUrl.includes('/chat/completions')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions'
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(model.apiKey ? { 'Authorization': `Bearer ${model.apiKey}` } : {})
      },
      body: JSON.stringify(
        model.type === 'openai' 
          ? {
              model: model.modelName || 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7
            }
          : {
              model: model.modelName || 'gemma2:2b',
              prompt: prompt,
              stream: false
            }
      )
    })

    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }

    const result = await response.json()
    const generatedText = model.type === 'openai' 
      ? result.choices[0].message.content 
      : result.response

    return this.parseResponse(generatedText, tasks)
  }

  static buildPrompt(tasks, startDate, endDate) {
    const categoryStats = {
      work: tasks.filter(t => t.category === 'work').length,
      study: tasks.filter(t => t.category === 'study').length,
      life: tasks.filter(t => t.category === 'life').length
    }

    const highPriorityTasks = tasks.filter(t => t.priority === 'high')
    const totalPomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)

    const taskList = tasks.slice(0, 20).map((t, i) => 
      `${i + 1}. [${this.getCategoryLabel(t.category)}] ${t.text}${t.description ? ` - ${t.description}` : ''}`
    ).join('\n')

    return `你是一个专业的工作总结助手。请为以下任务生成工作周报：

时间范围：${startDate} 至 ${endDate}
完成任务数：${tasks.length}
分类统计：工作${categoryStats.work}个、学习${categoryStats.study}个、生活${categoryStats.life}个
高优先级：${highPriorityTasks.length}个
完成番茄钟：${totalPomodoros}个

任务列表：
${taskList}
${tasks.length > 20 ? `\n...还有${tasks.length - 20}个任务` : ''}

请按照以下格式输出JSON（标准工作周报格式）：
{
  "overview": {
    "totalTasks": ${tasks.length},
    "workTasks": ${categoryStats.work},
    "studyTasks": ${categoryStats.study},
    "lifeTasks": ${categoryStats.life},
    "highPriority": ${highPriorityTasks.length},
    "completionRate": "计算完成率",
    "pomodoros": ${totalPomodoros}
  },
  "previousCompleted": ["上期已完成事项1", "上期已完成事项2"],
  "monthlyGoals": ["本月目标1", "本月目标2"],
  "monthlyProgress": ["本月进展1", "本月进展2"],
  "weeklyProgress": ["本周进展1", "本周进展2"],
  "nextWeekPlan": ["下周计划1", "下周计划2"],
  "risks": ["风险或问题1（可选）"],
  "summary": "整体总结（可选）"
}

要求：
1. overview: 数据概览（任务数、分类、优先级、番茄钟）
2. previousCompleted: 上期已完成情况（2-3项）
3. monthlyGoals: 本月目标（2-3项）
4. monthlyProgress: 本月进展（截止当前，2-3项）
5. weeklyProgress: 本周进展（本周具体完成的工作，3-5项）
6. nextWeekPlan: 下周计划（2-3项）
7. risks: 风险与问题（1-2项，如无则为空数组）
8. summary: 整体总结（可选）
9. 内容要具体、有数据支撑、符合工作汇报标准`
  }

  static getCategoryLabel(category) {
    const labels = { work: '💼工作', study: '📚学习', life: '🏠生活' }
    return labels[category] || '其他'
  }

  static parseResponse(text, tasks) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          overview: parsed.overview || {},
          previousCompleted: parsed.previousCompleted || [],
          monthlyGoals: parsed.monthlyGoals || [],
          monthlyProgress: parsed.monthlyProgress || [],
          weeklyProgress: parsed.weeklyProgress || [],
          nextWeekPlan: parsed.nextWeekPlan || [],
          risks: parsed.risks || [],
          summary: parsed.summary || '',
          tasks: tasks
        }
      }
    } catch (e) {
      console.error('解析AI响应失败:', e)
    }

    // 降级方案
    const categoryStats = {
      work: tasks.filter(t => t.category === 'work').length,
      study: tasks.filter(t => t.category === 'study').length,
      life: tasks.filter(t => t.category === 'life').length
    }
    const highPriority = tasks.filter(t => t.priority === 'high').length
    const totalPomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)

    return {
      overview: {
        totalTasks: tasks.length,
        workTasks: categoryStats.work,
        studyTasks: categoryStats.study,
        lifeTasks: categoryStats.life,
        highPriority: highPriority,
        completionRate: '100%',
        pomodoros: totalPomodoros
      },
      previousCompleted: ['上期工作已按计划完成'],
      monthlyGoals: ['完成核心项目开发', '提升工作效率'],
      monthlyProgress: [`本月已完成${tasks.length}个任务`, '各项工作稳步推进'],
      weeklyProgress: tasks.slice(0, 5).map(t => t.text),
      nextWeekPlan: ['继续推进重点项目', '优化工作流程'],
      risks: [],
      summary: `本周完成${tasks.length}个任务，涵盖工作、学习、生活多个方面。`,
      tasks: tasks
    }
  }
}
