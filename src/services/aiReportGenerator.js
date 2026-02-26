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

    const taskList = tasks.slice(0, 20).map((t, i) => 
      `${i + 1}. [${this.getCategoryLabel(t.category)}] ${t.text}${t.description ? ` - ${t.description}` : ''}`
    ).join('\n')

    return `你是一个专业的工作总结助手。请为以下任务生成工作周报：

时间范围：${startDate} 至 ${endDate}
完成任务数：${tasks.length}
分类统计：工作${categoryStats.work}个、学习${categoryStats.study}个、生活${categoryStats.life}个

任务列表：
${taskList}
${tasks.length > 20 ? `\n...还有${tasks.length - 20}个任务` : ''}

请按照以下格式输出JSON：
{
  "summary": "本周工作总结（2-3句话，突出成果和亮点）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "suggestions": "下周建议（1-2句话）"
}

要求：
1. 总结要具体、有数据支撑
2. 亮点要提炼关键成果
3. 建议要有针对性`
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
          summary: parsed.summary || '本周完成多项任务',
          highlights: parsed.highlights || [],
          suggestions: parsed.suggestions || '',
          tasks: tasks
        }
      }
    } catch (e) {
      console.error('解析AI响应失败:', e)
    }

    return {
      summary: `本周完成${tasks.length}个任务，涵盖工作、学习、生活多个方面。`,
      highlights: [
        `完成${tasks.length}个任务`,
        '保持良好的执行力',
        '时间管理有序'
      ],
      suggestions: '继续保持，注意劳逸结合',
      tasks: tasks
    }
  }
}
