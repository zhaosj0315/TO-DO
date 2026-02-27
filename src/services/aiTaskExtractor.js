// AI 任务提取服务
export class AITaskExtractor {
  static async extractTasks(text) {
    console.log('AITaskExtractor.extractTasks called with:', text)
    
    if (!text || text.trim() === '') {
      throw new Error('请提供要分析的文本')
    }
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const model = models.find(m => m.id === defaultModelId) || models[0]

    if (!model) {
      throw new Error('请先在个人主页配置AI模型')
    }

    const prompt = this.buildPrompt(text)
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
      
      const tasks = JSON.parse(jsonText)
      return Array.isArray(tasks) ? tasks : []
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      console.error('Raw response:', generatedText)
      throw new Error('AI 返回格式错误，请重试\n\n提示：请确保 AI 模型支持 JSON 输出')
    }
  }

  static buildPrompt(text) {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
    const currentYear = today.getFullYear()
    
    return `你是一个任务提取助手。请分析以下文本，提取任务信息。

当前日期：${todayStr}（${currentYear}年）

重要：你必须只返回一个有效的 JSON 数组，不要添加任何其他文字、解释、markdown 标记或代码块标记。

JSON 格式示例：
[{"title":"完成报告","description":"整理数据并撰写","priority":"high","category":"work","deadline":"${currentYear}-02-27 15:00"}]

如果没有任务，返回：
[]

字段说明：
- title: 任务标题（必填，10-30字）
- description: 任务描述（选填，可为空字符串）
- priority: 优先级（必填，只能是 high/medium/low）
- category: 分类（必填，只能是 work/study/life）
- deadline: 截止时间（选填，格式 YYYY-MM-DD HH:MM 或 null，年份必须是 ${currentYear}）

分析规则：
1. 识别动词短语（完成、准备、学习、联系等）
2. 紧急重要→high，一般→medium，可延后→low
3. 工作相关→work，学习相关→study，生活相关→life
4. 提取明确的时间信息

文本内容：
${text}

记住：只返回 JSON 数组，不要添加任何其他内容。`
  }
}
