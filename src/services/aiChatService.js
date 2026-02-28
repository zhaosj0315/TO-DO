import { buildTaskExtractionPrompt, parseAIResponse, normalizeTaskData } from './aiPromptConfig'

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

    const prompt = buildTaskExtractionPrompt(userMessage, { mode: 'chat', maxTasks: 10 })
    console.log('Generated prompt:', prompt)
    
    let apiUrl = model.url
    if (model.type === 'openai' && !apiUrl.includes('/v1/chat/completions')) {
      apiUrl = apiUrl.replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
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

    console.log('AI response:', generatedText)

    try {
      const tasks = parseAIResponse(generatedText, 'array')
      return Array.isArray(tasks) ? tasks.map(normalizeTaskData) : []
    } catch (e) {
      console.error('解析AI响应失败:', e)
      // 降级方案：提取前3个句子作为任务
      const sentences = generatedText.split(/[。！？\n]/).filter(s => s.trim().length > 0)
      return sentences.slice(0, 3).map(sentence => {
        const trimmed = sentence.trim()
        return normalizeTaskData({
          title: trimmed.substring(0, 20),
          description: trimmed.length > 20 ? trimmed.substring(20) : '',
          category: 'life',
          priority: 'medium'
        })
      })
    }
  }
}
