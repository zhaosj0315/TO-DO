import { buildTaskExtractionPrompt, parseAIResponse, normalizeTaskData } from './aiPromptConfig'

// AI 文本增强服务
export class AITextEnhancer {
  /**
   * 增强OCR识别的文本
   * @param {string} rawText - OCR识别的原始文本
   * @returns {Promise<{title: string, description: string}>} 增强后的标题和描述
   */
  static async enhanceText(rawText) {
    console.log('AITextEnhancer.enhanceText called with:', rawText)
    
    if (!rawText || rawText.trim() === '') {
      throw new Error('文本不能为空')
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = buildTaskExtractionPrompt(rawText, { mode: 'enhance' })
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
      const enhanced = parseAIResponse(generatedText, 'object')
      const normalized = normalizeTaskData(enhanced)
      
      return {
        title: normalized.text,
        description: normalized.description,
        category: normalized.category,
        priority: normalized.priority,
        type: normalized.type,
        customDate: normalized.customDate,
        customTime: normalized.customTime
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      console.error('Raw response:', generatedText)
      
      // 降级方案：使用原始文本
      const lines = rawText.split('\n').filter(l => l.trim())
      return {
        title: lines[0] || rawText.substring(0, 50),
        description: rawText,
        category: 'life',
        priority: 'medium',
        type: 'today'
      }
    }
  }
}

