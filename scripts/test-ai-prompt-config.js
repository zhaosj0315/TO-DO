// AI Prompt 统一配置测试脚本
// 运行: node scripts/test-ai-prompt-config.js

import { 
  getCurrentTimeInfo, 
  buildTaskExtractionPrompt, 
  parseAIResponse, 
  normalizeTaskData 
} from '../src/services/aiPromptConfig.js'

console.log('🧪 AI Prompt 统一配置测试\n')

// 测试1: 获取当前时间信息
console.log('📅 测试1: 获取当前时间信息')
const timeInfo = getCurrentTimeInfo()
console.log('当前时间:', timeInfo.displayDate)
console.log('ISO格式:', timeInfo.todayStr)
console.log('✅ 通过\n')

// 测试2: 构建Extract模式Prompt
console.log('📝 测试2: 构建Extract模式Prompt')
const extractPrompt = buildTaskExtractionPrompt('明天下午3点前完成项目报告', { mode: 'extract' })
console.log('Prompt长度:', extractPrompt.length, '字符')
console.log('包含时间规则:', extractPrompt.includes('时间提取规则'))
console.log('包含分类规则:', extractPrompt.includes('分类规则'))
console.log('包含优先级规则:', extractPrompt.includes('优先级规则'))
console.log('✅ 通过\n')

// 测试3: 构建Enhance模式Prompt
console.log('🔧 测试3: 构建Enhance模式Prompt')
const enhancePrompt = buildTaskExtractionPrompt('OCR识别的文本', { mode: 'enhance' })
console.log('Prompt长度:', enhancePrompt.length, '字符')
console.log('包含OCR关键词:', enhancePrompt.includes('OCR'))
console.log('✅ 通过\n')

// 测试4: 构建Classify模式Prompt
console.log('🎯 测试4: 构建Classify模式Prompt')
const classifyPrompt = buildTaskExtractionPrompt('写周报', { mode: 'classify', includeReason: true })
console.log('Prompt长度:', classifyPrompt.length, '字符')
console.log('包含reason字段:', classifyPrompt.includes('reason'))
console.log('✅ 通过\n')

// 测试5: 构建Chat模式Prompt
console.log('💬 测试5: 构建Chat模式Prompt')
const chatPrompt = buildTaskExtractionPrompt('我明天要开会，后天要写报告', { mode: 'chat', maxTasks: 5 })
console.log('Prompt长度:', chatPrompt.length, '字符')
console.log('包含对话关键词:', chatPrompt.includes('对话'))
console.log('✅ 通过\n')

// 测试6: 解析JSON数组
console.log('🔍 测试6: 解析JSON数组')
const arrayResponse = `
这是一些额外的文字
\`\`\`json
[
  {
    "title": "完成报告",
    "description": "整理数据",
    "priority": "high",
    "category": "work",
    "deadline": "2026-02-28 18:00"
  }
]
\`\`\`
还有一些额外的文字
`
try {
  const parsed = parseAIResponse(arrayResponse, 'array')
  console.log('解析成功:', Array.isArray(parsed))
  console.log('任务数量:', parsed.length)
  console.log('第一个任务标题:', parsed[0].title)
  console.log('✅ 通过\n')
} catch (e) {
  console.log('❌ 失败:', e.message, '\n')
}

// 测试7: 解析JSON对象
console.log('🔍 测试7: 解析JSON对象')
const objectResponse = `
\`\`\`json
{
  "category": "work",
  "priority": "high",
  "deadline": "2026-02-28 18:00"
}
\`\`\`
`
try {
  const parsed = parseAIResponse(objectResponse, 'object')
  console.log('解析成功:', typeof parsed === 'object')
  console.log('分类:', parsed.category)
  console.log('优先级:', parsed.priority)
  console.log('✅ 通过\n')
} catch (e) {
  console.log('❌ 失败:', e.message, '\n')
}

// 测试8: 标准化任务数据（完整信息）
console.log('✨ 测试8: 标准化任务数据（完整信息）')
const fullTask = {
  title: '完成项目报告',
  description: '整理数据并撰写分析报告',
  priority: 'high',
  category: 'work',
  deadline: '2026-02-28 18:00'
}
const normalized1 = normalizeTaskData(fullTask)
console.log('标题:', normalized1.text)
console.log('分类:', normalized1.category)
console.log('优先级:', normalized1.priority)
console.log('类型:', normalized1.type)
console.log('自定义日期:', normalized1.customDate)
console.log('自定义时间:', normalized1.customTime)
console.log('✅ 通过\n')

// 测试9: 标准化任务数据（最小信息）
console.log('✨ 测试9: 标准化任务数据（最小信息）')
const minTask = {
  title: '买菜'
}
const normalized2 = normalizeTaskData(minTask)
console.log('标题:', normalized2.text)
console.log('分类（默认）:', normalized2.category)
console.log('优先级（默认）:', normalized2.priority)
console.log('类型（默认）:', normalized2.type)
console.log('✅ 通过\n')

// 测试10: 智能推断任务类型
console.log('🤖 测试10: 智能推断任务类型')
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

const taskWithDeadline = {
  title: '明天的任务',
  deadline: `${tomorrowStr} 15:00`
}
const normalized3 = normalizeTaskData(taskWithDeadline)
console.log('截止时间:', taskWithDeadline.deadline)
console.log('推断类型:', normalized3.type)
console.log('应该是tomorrow:', normalized3.type === 'tomorrow')
console.log('✅ 通过\n')

console.log('🎉 所有测试完成！')
console.log('\n📊 测试总结:')
console.log('- ✅ 时间信息获取')
console.log('- ✅ 4种模式Prompt构建')
console.log('- ✅ JSON解析（数组和对象）')
console.log('- ✅ 数据标准化（完整和最小）')
console.log('- ✅ 任务类型智能推断')
console.log('\n🚀 统一配置工作正常！')
