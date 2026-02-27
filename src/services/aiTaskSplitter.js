// AI 任务拆解服务
export class AITaskSplitter {
  static async splitTask(taskTitle, taskDescription = '', subtaskCount = 5) {
    console.log('AITaskSplitter.splitTask called with:', { taskTitle, taskDescription, subtaskCount })
    
    if (!taskTitle || taskTitle.trim() === '') {
      throw new Error('任务标题不能为空')
    }
    
    // 验证拆分数量
    const count = Math.max(2, Math.min(10, parseInt(subtaskCount) || 5))
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = this.buildPrompt(taskTitle, taskDescription, count)
    console.log('Generated prompt:', prompt)
    
    let apiUrl = model.url
    if (model.type === 'openai' && !apiUrl.includes('/v1/chat/completions')) {
      // 规范化URL：移除末尾斜杠和已有路径
      apiUrl = apiUrl.replace(/\/v1.*$/, '').replace(/\/$/, '')
      apiUrl = apiUrl + '/v1/chat/completions'
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
      if (response.status === 403 && model.url.includes('ngrok')) {
        throw new Error(`Ngrok访问被拒绝\n\n请先在浏览器中访问：\n${model.url.split('/api')[0]}\n\n点击"Visit Site"后再试`)
      }
      throw new Error(`API错误: ${response.status}`)
    }

    const result = await response.json()
    const generatedText = model.type === 'openai' 
      ? result.choices[0].message.content 
      : result.response

    console.log('AI response:', generatedText)

    // 解析 JSON 结果（增强容错）
    try {
      let jsonText = generatedText.trim()
      
      // 移除可能的 markdown 代码块标记
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      // 移除开头和结尾的非 JSON 字符
      const jsonStart = jsonText.indexOf('[')
      const jsonEnd = jsonText.lastIndexOf(']')
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1)
      }
      
      const subtasks = JSON.parse(jsonText)
      return Array.isArray(subtasks) ? subtasks : []
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      console.error('Raw response:', generatedText)
      throw new Error('AI 返回格式错误，请重试')
    }
  }

  static buildPrompt(taskTitle, taskDescription, subtaskCount = 5) {
    return `你是一个任务拆解助手。请将以下大任务拆解为 ${subtaskCount} 个可执行的子任务。

重要：你必须只返回一个有效的 JSON 数组，不要添加任何其他文字、解释、markdown 标记或代码块标记。

JSON 格式示例：
[
  {"title":"收集数据和资料","description":"整理项目相关数据","priority":"high","estimatedHours":1},
  {"title":"撰写初稿","description":"根据数据撰写报告初稿","priority":"medium","estimatedHours":2}
]

字段说明：
- title: 子任务标题（必填，10-20字）
- description: 子任务描述（必填，简短说明）
- priority: 优先级（必填，只能是 high/medium/low）
- estimatedHours: 预估时长（必填，单位：小时，0.5-8）

拆解规则：
1. 按执行顺序排列（先做什么，后做什么）
2. 每个子任务要具体、可执行
3. 合理分配优先级（前置任务 → high，后续任务 → medium/low）
4. 预估时长要合理（简单任务 0.5-1h，复杂任务 2-4h）
5. 必须拆解为 ${subtaskCount} 个子任务

原任务：
标题：${taskTitle}
${taskDescription ? `描述：${taskDescription}` : ''}

记住：只返回 JSON 数组，不要添加任何其他内容。`
  }
}
