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
    "text": "任务标题",
    "description": "任务描述（可选）",
    "category": "work/study/life",
    "priority": "high/medium/low"
  }
]

要求：
1. 提取所有明确的待办事项
2. 自动判断分类和优先级
3. 如果没有任务，返回空数组 []
4. 任务标题要简洁明确`
  }

  static parseResponse(text) {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.map(task => ({
          text: task.text || '未命名任务',
          description: task.description || '',
          category: ['work', 'study', 'life'].includes(task.category) ? task.category : 'work',
          priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
          type: 'today',
          status: 'pending'
        }))
      }
    } catch (e) {
      console.error('解析AI响应失败:', e)
    }

    // 降级方案：简单分句
    const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 0)
    return sentences.slice(0, 3).map(sentence => ({
      text: sentence.trim().substring(0, 50),
      description: '',
      category: 'work',
      priority: 'medium',
      type: 'today',
      status: 'pending'
    }))
  }
}
