import { buildTaskExtractionPrompt, parseAIResponse, normalizeTaskData } from './aiPromptConfig'

// AI 智能分类服务
export class AIClassifier {
  static async classifyTask(title, description = '') {
    console.log('AIClassifier.classifyTask called with:', { title, description })
    
    if (!title || title.trim() === '') {
      throw new Error('任务标题不能为空')
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const text = `标题：${title}\n描述：${description}`
    const prompt = buildTaskExtractionPrompt(text, { mode: 'classify', includeReason: true })
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
              temperature: 0.3
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

    try {
      const classification = parseAIResponse(generatedText, 'object')
      return {
        category: classification.category || 'life',
        priority: classification.priority || 'medium',
        type: classification.type || 'today',
        customDate: classification.customDate,
        customTime: classification.customTime,
        deadline: classification.deadline,
        startTime: classification.startTime,
        reason: classification.reason || ''
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      // 返回默认值
      return {
        category: 'life',
        priority: 'medium',
        type: 'today',
        reason: 'AI 分析失败，使用默认分类'
      }
    }
  }
}
