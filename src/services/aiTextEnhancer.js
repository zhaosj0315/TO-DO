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

    const prompt = this.buildPrompt(rawText)
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

    // 解析 JSON 结果
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
      
      const enhanced = JSON.parse(jsonText)
      
      // 验证返回格式
      if (!enhanced.title || !enhanced.description) {
        throw new Error('AI 返回格式不完整')
      }
      
      return {
        title: enhanced.title.trim(),
        description: enhanced.description.trim()
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      console.error('Raw response:', generatedText)
      
      // 降级方案：使用原始文本
      const lines = rawText.split('\n').filter(l => l.trim())
      return {
        title: lines[0] || rawText.substring(0, 50),
        description: rawText
      }
    }
  }

  static buildPrompt(rawText) {
    return `你是一个文本增强助手。用户通过拍照OCR识别了一段文字，可能包含错别字、格式混乱等问题。请将这段文字整理成一个清晰的任务。

重要：你必须只返回一个有效的 JSON 对象，不要添加任何其他文字、解释、markdown 标记或代码块标记。

JSON 格式：
{
  "title": "任务标题（10-30字，简洁明了）",
  "description": "任务描述（详细说明，保留关键信息）"
}

处理规则：
1. 纠正明显的错别字和OCR识别错误
2. 提取核心内容作为标题
3. 保留所有关键信息到描述中
4. 如果文本很短，标题和描述可以相同
5. 如果文本包含多个要点，在描述中分点列出

原始OCR文本：
${rawText}

记住：只返回 JSON 对象，不要添加任何其他内容。`
  }
}
