// AI 任务生成服务
export class AITaskGenerator {
  static async generateTask(keywords) {
    console.log('AITaskGenerator.generateTask called with:', keywords)
    
    if (!keywords || keywords.trim() === '') {
      throw new Error('请输入关键词')
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = this.buildPrompt(keywords)
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

  static async generateDescription(title) {
    console.log('AITaskGenerator.generateDescription called with:', title)
    
    if (!title || title.trim() === '') {
      throw new Error('请先输入任务标题')
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = this.buildDescriptionPrompt(title)
    
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

    return generatedText.trim()
  }

  static buildPrompt(keywords) {
    return `请根据以下关键词，生成一个清晰、具体的任务标题。

关键词：${keywords}

要求：
1. 任务标题要简短明确（10-20字）
2. 使用动词开头（如：完成、准备、学习、联系等）
3. 包含具体的行动内容
4. 只返回任务标题，不要添加任何解释

示例：
关键词：项目报告
任务标题：完成Q1季度项目总结报告

关键词：学习Vue
任务标题：学习Vue3 Composition API基础

现在请生成任务标题：`
  }

  static buildDescriptionPrompt(title) {
    return `请为以下任务生成一个详细的描述。

任务标题：${title}

要求：
1. 描述要具体、可执行
2. 包含关键步骤或注意事项
3. 长度控制在50-100字
4. 只返回描述内容，不要添加标题或其他文字

示例：
任务：完成Q1季度项目总结报告
描述：整理Q1季度项目数据，包括进度、成果、问题和改进建议。制作数据图表，撰写报告初稿，提交给团队审阅。

现在请生成任务描述：`
  }

  static async continueText(currentText) {
    console.log('AITaskGenerator.continueText called with:', currentText)
    
    if (!currentText || currentText.trim() === '') {
      return { success: false, error: '请先输入一些内容' }
    }
    
    try {
      const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
      const defaultModelId = localStorage.getItem('ai_default_model')
      const model = models.find(m => m.id === defaultModelId) || models[0]

      if (!model) {
        return { success: false, error: '请先在个人主页配置AI模型' }
      }

      const prompt = `请根据以下内容，自然地续写下去。保持风格一致，内容连贯。

已有内容：
${currentText}

要求：
1. 续写50-100字
2. 保持语气和风格一致
3. 内容要有逻辑性和连贯性
4. 只返回续写的内容，不要重复已有内容

续写内容：`
      
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
                temperature: 0.8
              }
            : {
                model: model.modelName || 'gemma2:2b',
                prompt: prompt,
                stream: false
              }
        )
      })

      if (!response.ok) {
        return { success: false, error: `API错误: ${response.status}` }
      }

      const result = await response.json()
      const generatedText = model.type === 'openai' 
        ? result.choices[0].message.content 
        : result.response

      return { success: true, text: '\n' + generatedText.trim() }
    } catch (error) {
      console.error('AI续写失败:', error)
      return { success: false, error: error.message }
    }
  }
}
