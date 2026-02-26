// AI 对话服务
export class AIChatService {
  /**
   * 从对话中提取任务
   * @param {string} userMessage - 用户输入的对话内容
   * @returns {Promise<Array>} 提取的任务列表
   */
  static async extractTasksFromChat(userMessage) {
    console.log('AIChatService.extractTasksFromChat called with:', userMessage)
    
    if (!userMessage || userMessage.trim() === '') {
      throw new Error('对话内容不能为空')
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = this.buildPrompt(userMessage)
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

    return this.parseResponse(generatedText)
  }

  static buildPrompt(userMessage) {
    return `你是一个任务提取助手。请从用户的对话中提取出待办任务。

用户说：
"${userMessage}"

请按照以下格式输出JSON数组：
[
  {
    "text": "任务标题（简短，5-15字）",
    "description": "任务详细描述（可选）",
    "category": "work/study/life",
    "priority": "high/medium/low",
    "needReminder": true/false,
    "reminderTime": "2026-02-26 14:00"（如果需要提醒）
  }
]

要求：
1. text 必须是简短的标题，不超过15字
2. description 包含详细信息和上下文
3. 如果用户提到具体时间，设置 needReminder=true 并提取时间
4. 提取所有明确的待办事项
5. 自动判断分类和优先级
6. 如果没有任务，返回空数组 []`
  }

  static parseResponse(text) {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.map(task => {
          const result = {
            text: (task.text || '未命名任务').substring(0, 50),
            description: task.description || '',
            category: ['work', 'study', 'life'].includes(task.category) ? task.category : 'work',
            priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
            type: 'today',
            status: 'pending'
          }
          
          // 如果有提醒时间，设置为自定义日期类型并启用提醒
          if (task.needReminder && task.reminderTime) {
            result.needReminder = true
            const reminderDate = new Date(task.reminderTime)
            if (!isNaN(reminderDate.getTime())) {
              result.type = 'custom_date'
              result.customDate = reminderDate.toISOString().split('T')[0]
              result.customTime = reminderDate.toTimeString().substring(0, 5)
              result.reminderTime = reminderDate.toISOString()
            }
          }
          
          return result
        })
      }
    } catch (e) {
      console.error('解析AI响应失败:', e)
    }

    // 降级方案：提取前10个字作为标题，剩余作为描述
    const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 0)
    return sentences.slice(0, 3).map(sentence => {
      const trimmed = sentence.trim()
      const title = trimmed.substring(0, 15)
      const desc = trimmed.length > 15 ? trimmed.substring(15) : ''
      
      return {
        text: title,
        description: desc,
        category: 'work',
        priority: 'medium',
        type: 'today',
        status: 'pending'
      }
    })
  }
}
