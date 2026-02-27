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

    const prompt = this.buildPrompt(title, description)
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

    // 解析 JSON 结果（增强容错）
    try {
      let jsonText = generatedText.trim()
      
      // 移除可能的 markdown 代码块标记
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      // 移除开头和结尾的非 JSON 字符
      const jsonStart = jsonText.indexOf('{')
      const jsonEnd = jsonText.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1)
      }
      
      const classification = JSON.parse(jsonText)
      return {
        category: classification.category || 'life',
        priority: classification.priority || 'medium',
        reason: classification.reason || ''
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      // 返回默认值
      return {
        category: 'life',
        priority: 'medium',
        reason: 'AI 分析失败，使用默认分类'
      }
    }
  }

  static buildPrompt(title, description) {
    return `请分析以下任务，判断其分类和优先级。返回 JSON 格式，不要添加任何其他文字：

{
  "category": "work/study/life",
  "priority": "high/medium/low",
  "reason": "判断理由（简短说明）"
}

分类规则：
- work（工作）：与工作、项目、会议、报告相关
- study（学习）：与学习、培训、阅读、研究相关
- life（生活）：与日常生活、家务、娱乐、健康相关

优先级规则：
- high（高）：紧急重要、有明确截止时间、影响重大
- medium（中）：重要但不紧急、常规任务
- low（低）：可延后、不紧急、琐碎事务

任务标题：${title}
${description ? `任务描述：${description}` : ''}

请只返回 JSON 对象，不要添加任何解释文字。`
  }
}
