/**
 * 智能任务解析服务
 * 从自然语言中提取任务信息（时间、优先级、分类）
 */

/**
 * 检测文本中的列表项
 * @param {string} text - 输入文本
 * @returns {Array<string>} 检测到的列表项
 */
export function detectListItems(text) {
  if (!text || typeof text !== 'string') return []

  const items = []
  const lines = text.split('\n')

  // 支持的列表格式
  const patterns = [
    /^\s*(\d+)[.、]\s*(.+)$/,  // 1. 或 1、
    /^\s*[-*]\s*(.+)$/,        // - 或 *
    /^\s*[•·]\s*(.+)$/,        // • 或 ·
    /^\s*[①②③④⑤⑥⑦⑧⑨⑩]\s*(.+)$/  // 圆圈数字
  ]

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    for (const pattern of patterns) {
      const match = trimmed.match(pattern)
      if (match) {
        const content = match[2] || match[1]
        if (content && content.trim()) {
          items.push(content.trim())
        }
        break
      }
    }
  }

  // 至少需要2个项目才算列表
  return items.length >= 2 ? items : []
}

export class SmartTaskParser {
  /**
   * 解析自然语言任务描述
   * @param {string} text - 用户输入的文本
   * @returns {Object} 解析结果
   */
  static parse(text) {
    const result = {
      tasks: [],
      rawText: text
    }

    // 1. 批量任务分割（逗号、顿号、换行）
    const segments = text.split(/[,，、\n]/).filter(s => s.trim())
    
    if (segments.length > 1) {
      // 多个任务
      result.tasks = segments.map(seg => this.parseSegment(seg.trim()))
    } else {
      // 单个任务
      result.tasks = [this.parseSegment(text)]
    }

    return result
  }

  /**
   * 解析单个任务片段
   */
  static parseSegment(text) {
    return {
      title: this.extractTitle(text),
      type: this.extractType(text),
      customDate: this.extractDate(text),
      customTime: this.extractTime(text),
      priority: this.extractPriority(text),
      category: this.extractCategory(text),
      description: text
    }
  }

  /**
   * 提取任务标题（去除时间、优先级等修饰词）
   */
  static extractTitle(text) {
    let title = text
    // 移除时间词
    title = title.replace(/(明天|后天|下周|今天|本周|下午|上午|晚上|早上|中午|\d{1,2}[点:：]\d{0,2})/g, '')
    // 移除优先级词
    title = title.replace(/(紧急|重要|普通|不急)/g, '')
    // 清理空格
    title = title.trim()
    return title || text
  }

  /**
   * 提取任务类型和日期
   */
  static extractType(text) {
    if (/明天/.test(text)) return 'tomorrow'
    if (/后天/.test(text)) return 'custom_date'
    if (/下周|本周/.test(text)) return 'this_week'
    if (/每天|每日/.test(text)) return 'daily'
    if (/工作日/.test(text)) return 'weekday'
    return 'today'
  }

  /**
   * 提取具体日期
   */
  static extractDate(text) {
    const now = new Date()
    
    if (/明天/.test(text)) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return this.formatDate(tomorrow)
    }
    
    if (/后天/.test(text)) {
      const dayAfter = new Date(now)
      dayAfter.setDate(dayAfter.getDate() + 2)
      return this.formatDate(dayAfter)
    }

    // 匹配 "3月5日" 或 "3-5" 或 "3/5"
    const dateMatch = text.match(/(\d{1,2})[月\-\/](\d{1,2})[日]?/)
    if (dateMatch) {
      const month = parseInt(dateMatch[1])
      const day = parseInt(dateMatch[2])
      const year = now.getFullYear()
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }

    return null
  }

  /**
   * 提取时间
   */
  static extractTime(text) {
    // 匹配 "3点" "15:30" "3:30" "下午3点"
    const timeMatch = text.match(/(\d{1,2})[点:：](\d{0,2})/)
    if (timeMatch) {
      let hour = parseInt(timeMatch[1])
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      
      // 处理下午/晚上（12小时制转24小时制）
      if (/下午|晚上/.test(text) && hour < 12) {
        hour += 12
      }
      
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }

    // 时间段默认值
    if (/早上|上午/.test(text)) return '09:00'
    if (/中午/.test(text)) return '12:00'
    if (/下午/.test(text)) return '15:00'
    if (/晚上/.test(text)) return '19:00'

    return null
  }

  /**
   * 提取优先级
   */
  static extractPriority(text) {
    if (/紧急|重要|高优先级/.test(text)) return 'high'
    if (/普通|一般/.test(text)) return 'medium'
    if (/不急|低优先级/.test(text)) return 'low'
    return 'medium' // 默认中等
  }

  /**
   * 提取分类
   */
  static extractCategory(text) {
    // 工作关键词
    const workKeywords = ['开会', '会议', '报告', '项目', '代码', '编程', '开发', '设计', '文档', '邮件', '客户', '汇报']
    // 学习关键词
    const studyKeywords = ['学习', '看书', '阅读', '课程', '作业', '考试', '复习', '背单词', '练习']
    // 生活关键词
    const lifeKeywords = ['买菜', '做饭', '健身', '运动', '跑步', '洗衣', '打扫', '购物', '看电影', '约会', '理发']

    for (const keyword of workKeywords) {
      if (text.includes(keyword)) return 'work'
    }
    for (const keyword of studyKeywords) {
      if (text.includes(keyword)) return 'study'
    }
    for (const keyword of lifeKeywords) {
      if (text.includes(keyword)) return 'life'
    }

    return 'life' // 默认生活
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  static formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
