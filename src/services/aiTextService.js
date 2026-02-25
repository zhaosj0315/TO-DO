// AI 文本处理服务
export class AITextService {
  static async processText(action, text, options = {}) {
    console.log('AITextService.processText called with:', { action, text, options })
    
    if (!text || text.trim() === '') {
      throw new Error('请先选中要处理的文本')
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = this.buildPrompt(action, text, options)
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
      if (response.status === 403 && model.url.includes('ngrok')) {
        throw new Error(`Ngrok访问被拒绝\n\n请先在浏览器中访问：\n${model.url.split('/api')[0]}\n\n点击"Visit Site"后再试`)
      }
      throw new Error(`API错误: ${response.status}`)
    }

    const result = await response.json()
    const generatedText = model.type === 'openai' 
      ? result.choices[0].message.content 
      : result.response

    return generatedText.trim()
  }

  static buildPrompt(action, text, options = {}) {
    const prompts = {
      improve: `请改进以下文本，使其更清晰、更专业、更易读。只返回改进后的文本，不要添加任何解释：\n\n${text}`,
      
      shorter: `请将以下文本精简，保留核心信息，使其更简洁。只返回精简后的文本：\n\n${text}`,
      
      longer: `请扩展以下文本，添加更多细节和说明，使其更详细。只返回扩展后的文本：\n\n${text}`,
      
      tone: `请将以下文本改写为${this.getToneDescription(options.tone)}的语气。只返回改写后的文本：\n\n${text}`,
      
      translate: `请将以下文本翻译为${this.detectLanguage(text) === 'zh' ? '英文' : '中文'}。只返回翻译结果：\n\n${text}`,
      
      fix: `请修正以下文本的拼写和语法错误。只返回修正后的文本：\n\n${text}`,
      
      explain: `请用简单易懂的语言解释以下内容：\n\n${text}`,
      
      summary: `请提取以下文本的关键要点，用简洁的列表形式呈现：\n\n${text}`,
      
      continue: `请基于以下内容继续写作，保持风格一致：\n\n${text}`
    }

    return prompts[action] || prompts.improve
  }

  static getToneDescription(tone) {
    const tones = {
      professional: '专业',
      friendly: '友好',
      formal: '正式',
      casual: '随意'
    }
    return tones[tone] || '专业'
  }

  static detectLanguage(text) {
    // 简单的语言检测：如果包含中文字符，则为中文
    return /[\u4e00-\u9fa5]/.test(text) ? 'zh' : 'en'
  }
}
