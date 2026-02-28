// AI Prompt 统一配置
// 所有AI任务提取服务共用的规则和格式

/**
 * 获取当前时间信息
 */
export function getCurrentTimeInfo() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[today.getDay()]
  
  return {
    today,
    currentYear,
    currentMonth,
    currentDay,
    todayStr,
    weekday,
    displayDate: `${currentYear}年${currentMonth}月${currentDay}日 星期${weekday}`
  }
}

/**
 * 统一的时间提取规则
 */
export const TIME_EXTRACTION_RULES = `
时间提取规则（重要）：
1. 识别明确的日期时间表达：
   - 绝对时间：2月28日、3月1日、2026-02-28
   - 相对时间：今天、明天、后天、下周一、3天后、一周后
   - 时间点：上午9点、下午3点、15:00、晚上8点
2. 识别截止时间关键词：截止、deadline、due、before、之前
3. 识别开始时间关键词：开始、start、from、明天开始、下周开始
4. 时间格式要求：
   - 完整格式：YYYY-MM-DD HH:MM（如 2026-02-28 15:00）
   - 只有日期没有时间：默认 23:59
   - 只有时间没有日期：使用今天日期
5. 年份必须是当前年份（{currentYear}）
6. 如果没有明确时间信息，返回 null
7. 开始时间早于截止时间（如果两者都存在）
`

/**
 * 统一的分类规则
 */
export const CATEGORY_RULES = `
分类规则（category）：
- work（工作）：工作、会议、报告、项目、客户、合同、邮件、文档、汇报
- study（学习）：学习、考试、作业、课程、阅读、研究、复习、预习、论文
- life（生活）：生活、购物、健身、娱乐、家务、社交、约会、旅行、休闲
`

/**
 * 统一的优先级规则
 */
export const PRIORITY_RULES = `
优先级规则（priority）：
- high（高）：紧急重要、有明确deadline且时间紧迫、影响重大、领导要求
- medium（中）：一般任务、可延后1-3天、常规工作
- low（低）：不紧急、可随时处理、琐事、可选任务
`

/**
 * 统一的任务类型推断规则
 */
export const TASK_TYPE_RULES = `
任务类型推断（type）：
- today：今天截止（deadline是今天）
- tomorrow：明天截止（deadline是明天）
- this_week：本周内截止（deadline在本周内）
- custom_date：指定日期（有明确的deadline）
- daily：每天重复（明确提到"每天"）
- weekday：工作日重复（明确提到"每个工作日"）
- weekly：每周重复（明确提到"每周"）
`

/**
 * 标准任务JSON格式
 */
export const TASK_JSON_FORMAT = `
{
  "title": "任务标题（必填，10-30字，简洁明了）",
  "description": "任务描述（选填，详细说明，可为空字符串）",
  "priority": "high/medium/low（必填）",
  "category": "work/study/life（必填）",
  "type": "today/tomorrow/this_week/custom_date/daily/weekday/weekly（必填）",
  "deadline": "YYYY-MM-DD HH:MM 或 null（选填）",
  "startTime": "YYYY-MM-DD HH:MM 或 null（选填）",
  "customDate": "YYYY-MM-DD（当type为custom_date时必填）",
  "customTime": "HH:MM（当type为custom_date时必填）"
}
`

/**
 * 构建统一的任务提取Prompt
 * @param {string} text - 要分析的文本
 * @param {object} options - 可选配置
 * @returns {string} 完整的Prompt
 */
export function buildTaskExtractionPrompt(text, options = {}) {
  const timeInfo = getCurrentTimeInfo()
  const {
    mode = 'extract', // extract | enhance | classify | chat
    maxTasks = 10,
    includeReason = false
  } = options
  
  const timeRules = TIME_EXTRACTION_RULES.replace('{currentYear}', timeInfo.currentYear)
  
  let prompt = `你是一个专业的任务提取助手。当前时间：${timeInfo.displayDate}（${timeInfo.todayStr}）

${timeRules}

${CATEGORY_RULES}

${PRIORITY_RULES}

${TASK_TYPE_RULES}

`

  // 根据不同模式定制Prompt
  switch (mode) {
    case 'extract':
      prompt += `请从以下文本中提取所有任务信息，返回JSON数组格式：

${TASK_JSON_FORMAT}

示例输出：
[
  {
    "title": "完成项目报告",
    "description": "整理数据并撰写分析报告",
    "priority": "high",
    "category": "work",
    "type": "custom_date",
    "deadline": "${timeInfo.currentYear}-02-28 18:00",
    "startTime": "${timeInfo.currentYear}-02-27 09:00",
    "customDate": "${timeInfo.currentYear}-02-28",
    "customTime": "18:00"
  }
]

如果没有任务，返回：[]

要分析的文本：
${text}

重要：只返回JSON数组，不要添加任何其他文字、解释或markdown标记。`
      break
      
    case 'enhance':
      prompt += `请将以下OCR识别的文本整理成清晰的任务信息，返回JSON格式：

${TASK_JSON_FORMAT}

处理要求：
1. 纠正OCR识别错误和错别字
2. 提取核心内容作为标题（10-30字）
3. 保留所有关键信息到描述中
4. 尽量提取时间信息（开始时间和截止时间）
5. 智能判断分类和优先级

OCR识别的文本：
${text}

重要：只返回JSON对象，不要添加任何其他文字、解释或markdown标记。`
      break
      
    case 'classify':
      prompt += `请分析以下任务，判断其分类、优先级和时间信息，返回JSON格式：

{
  "category": "work/study/life（必填）",
  "priority": "high/medium/low（必填）",
  "deadline": "YYYY-MM-DD HH:MM 或 null（选填）",
  "startTime": "YYYY-MM-DD HH:MM 或 null（选填）",
  "type": "today/tomorrow/this_week/custom_date（必填）",
  "customDate": "YYYY-MM-DD（当type为custom_date时）",
  "customTime": "HH:MM（当type为custom_date时）"${includeReason ? ',\n  "reason": "判断理由（简短说明）"' : ''}
}

任务信息：
${text}

重要：只返回JSON对象，不要添加任何其他文字、解释或markdown标记。`
      break
      
    case 'chat':
      prompt += `请从用户的对话中提取待办任务，返回JSON数组格式：

${TASK_JSON_FORMAT}

提取要求：
1. title必须简短（10-20字），description包含详细信息
2. 提取所有明确的待办事项（最多${maxTasks}个）
3. 自动判断分类、优先级和任务类型
4. 识别时间表达并转换为标准格式
5. 如果用户提到提醒时间，设置为deadline

用户说：
"${text}"

如果没有任务，返回：[]

重要：只返回JSON数组，不要添加任何其他文字、解释或markdown标记。`
      break
  }
  
  return prompt
}

/**
 * 解析AI返回的JSON（统一容错处理）
 * @param {string} text - AI返回的文本
 * @param {string} expectedType - 期望的类型：'array' | 'object'
 * @returns {any} 解析后的数据
 */
export function parseAIResponse(text, expectedType = 'array') {
  try {
    let jsonText = text.trim()
    
    // 移除markdown代码块标记
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // 移除开头和结尾的非JSON字符
    if (expectedType === 'array') {
      const jsonStart = jsonText.indexOf('[')
      const jsonEnd = jsonText.lastIndexOf(']')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1)
      }
    } else {
      const jsonStart = jsonText.indexOf('{')
      const jsonEnd = jsonText.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1)
      }
    }
    
    const parsed = JSON.parse(jsonText)
    return parsed
  } catch (e) {
    console.error('Failed to parse AI response:', e)
    console.error('Raw response:', text)
    throw new Error('AI返回格式错误，请重试')
  }
}

/**
 * 标准化任务数据（确保所有字段符合要求）
 * @param {object} task - 原始任务数据
 * @returns {object} 标准化后的任务数据
 */
export function normalizeTaskData(task) {
  const timeInfo = getCurrentTimeInfo()
  
  // 基础字段验证
  const normalized = {
    text: (task.title || task.text || '未命名任务').substring(0, 50),
    description: (task.description || '').substring(0, 500),
    category: ['work', 'study', 'life'].includes(task.category) ? task.category : 'life',
    priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
    type: task.type || 'today',
    status: 'pending'
  }
  
  // 处理时间字段
  if (task.deadline) {
    const deadline = new Date(task.deadline)
    if (!isNaN(deadline.getTime())) {
      // 如果有deadline，设置为custom_date类型
      normalized.type = 'custom_date'
      normalized.customDate = deadline.toISOString().split('T')[0]
      normalized.customTime = deadline.toTimeString().substring(0, 5)
      
      // 智能推断type
      const deadlineDate = deadline.toISOString().split('T')[0]
      const todayDate = timeInfo.todayStr
      const tomorrow = new Date(timeInfo.today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowDate = tomorrow.toISOString().split('T')[0]
      
      if (deadlineDate === todayDate) {
        normalized.type = 'today'
      } else if (deadlineDate === tomorrowDate) {
        normalized.type = 'tomorrow'
      } else {
        // 检查是否在本周内
        const weekEnd = new Date(timeInfo.today)
        weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
        if (deadline <= weekEnd) {
          normalized.type = 'this_week'
        }
      }
    }
  } else if (task.customDate) {
    // 如果只有customDate，使用它
    normalized.type = 'custom_date'
    normalized.customDate = task.customDate
    normalized.customTime = task.customTime || '23:59'
  }
  
  // 处理开始时间
  if (task.startTime) {
    const startTime = new Date(task.startTime)
    if (!isNaN(startTime.getTime())) {
      normalized.startTime = startTime.toISOString()
    }
  }
  
  // 处理重复任务类型
  if (['daily', 'weekday', 'weekly'].includes(task.type)) {
    normalized.type = task.type
    if (task.type === 'weekly' && task.weekdays) {
      normalized.weekdays = task.weekdays
    }
  }
  
  return normalized
}
