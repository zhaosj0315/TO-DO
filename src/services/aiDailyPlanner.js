// AI 日程规划服务
export class AIDailyPlanner {
  /**
   * 生成每日规划
   * @param {Array} tasks - 任务列表（包含deadline字段）
   * @returns {Promise<{summary: string, schedule: Array}>} 规划结果
   */
  static async generateDailyPlan(tasks) {
    console.log('AIDailyPlanner.generateDailyPlan called with:', tasks)
    
    if (!tasks || tasks.length === 0) {
      return {
        summary: '今天没有待办任务',
        schedule: []
      }
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = this.buildPrompt(tasks)
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

  static buildPrompt(tasks) {
    const taskList = tasks.map((t, i) => 
      `${i + 1}. ${t.text}${t.description ? ` - ${t.description}` : ''} (截止: ${t.deadline || '未设置'})`
    ).join('\n')

    return `你是一个专业的时间管理助手。请为以下任务生成今日执行计划：

任务列表：
${taskList}

请按照以下格式输出JSON：
{
  "summary": "今日规划总结（1-2句话）",
  "schedule": [
    {"time": "09:00-10:00", "task": "任务名称", "reason": "安排理由"}
  ]
}

要求：
1. 优先安排截止时间近的任务
2. 考虑任务的优先级和复杂度
3. 合理分配时间段
4. 给出简短的安排理由`
  }

  static parseResponse(text, tasks) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          summary: parsed.summary || '已生成今日规划',
          schedule: parsed.schedule || []
        }
      }
    } catch (e) {
      console.error('解析AI响应失败:', e)
    }

    return {
      summary: text.split('\n')[0] || '已生成今日规划',
      schedule: tasks.slice(0, 5).map((t, i) => ({
        time: `${9 + i * 2}:00-${11 + i * 2}:00`,
        task: t.text,
        reason: '按优先级排序'
      }))
    }
  }
}
