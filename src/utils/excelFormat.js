/**
 * 统一的Excel格式定义
 * 用于导出、备份、模板生成
 */

// 标准Excel列定义（按顺序）
export const EXCEL_COLUMNS = [
  { key: 'text', label: '任务名称', required: true },
  { key: 'description', label: '详细描述', required: false },
  { key: 'type', label: '任务类型', required: true },
  { key: 'category', label: '分类', required: true },
  { key: 'priority', label: '优先级', required: true },
  { key: 'status', label: '状态', required: false },
  { key: 'created_at', label: '创建时间', required: false },
  { key: 'customDate', label: '指定日期', required: false },
  { key: 'customTime', label: '指定时间', required: false },
  { key: 'weekdays', label: '重复周期', required: false },
  { key: 'completed_at', label: '完成时间', required: false },
  { key: 'is_pinned', label: '是否置顶', required: false },
  { key: 'enableReminder', label: '启用提醒', required: false },
  { key: 'reminderTime', label: '提醒时间', required: false },
  { key: 'forceReminder', label: '强制提醒', required: false },
  // 新增字段
  { key: 'completedPomodoros', label: '已完成番茄钟', required: false },
  { key: 'estimatedPomodoros', label: '预估番茄钟', required: false },
  { key: 'logCount', label: '执行日志数', required: false },
  { key: 'latestProgress', label: '最新进度', required: false },
  { key: 'hasAISummary', label: '有AI总结', required: false }
]

// 任务类型映射
export const TASK_TYPE_MAP = {
  'today': '今天',
  'tomorrow': '明天',
  'this_week': '本周内',
  'custom_date': '指定日期',
  'daily': '每天重复',
  'weekday': '工作日重复',
  'weekly': '每周重复'
}

// 反向映射
export const TASK_TYPE_REVERSE = Object.fromEntries(
  Object.entries(TASK_TYPE_MAP).map(([k, v]) => [v, k])
)

// 分类映射
export const CATEGORY_MAP = {
  'work': '工作',
  'study': '学习',
  'life': '生活'
}

export const CATEGORY_REVERSE = Object.fromEntries(
  Object.entries(CATEGORY_MAP).map(([k, v]) => [v, k])
)

// 优先级映射
export const PRIORITY_MAP = {
  'high': '高',
  'medium': '中',
  'low': '低'
}

export const PRIORITY_REVERSE = Object.fromEntries(
  Object.entries(PRIORITY_MAP).map(([k, v]) => [v, k])
)

// 状态映射
export const STATUS_MAP = {
  'pending': '待办',
  'completed': '已完成',
  'overdue': '已逾期'
}

export const STATUS_REVERSE = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([k, v]) => [v, k])
)

// 转换任务为Excel行数据
export function taskToExcelRow(task, includeUser = false) {
  const row = {
    '任务名称': task.text || '',
    '详细描述': task.description || '',
    '任务类型': TASK_TYPE_MAP[task.type] || task.type || '',
    '分类': CATEGORY_MAP[task.category] || task.category || '',
    '优先级': PRIORITY_MAP[task.priority] || task.priority || '',
    '状态': STATUS_MAP[task.status] || task.status || '',
    '创建时间': task.created_at || '',
    '指定日期': task.customDate || '',
    '指定时间': task.customTime || '',
    '重复周期': Array.isArray(task.weekdays) ? task.weekdays.join(',') : '',
    '完成时间': task.completed_at || '',
    '是否置顶': task.is_pinned ? '是' : '否',
    '启用提醒': task.enableReminder ? '是' : '否',
    '提醒时间': task.reminderTime || '',
    '强制提醒': task.forceReminder ? '是' : '否',
    // 新增字段
    '已完成番茄钟': task.completedPomodoros || 0,
    '预估番茄钟': task.estimatedPomodoros || 0,
    '执行日志数': task.logs?.length || 0,
    '最新进度': task.stats?.progressHistory?.[task.stats.progressHistory.length - 1] || 0,
    '有AI总结': task.aiSummary ? '是' : '否'
  }
  
  // 多用户备份时添加用户字段
  if (includeUser && task.user_id) {
    return { '用户': task.user_id, ...row }
  }
  
  return row
}

// 从Excel行数据转换为任务对象
export function excelRowToTask(row, userId) {
  const task = {
    text: row['任务名称'] || '',
    description: row['详细描述'] || '',
    type: TASK_TYPE_REVERSE[row['任务类型']] || 'today',
    category: CATEGORY_REVERSE[row['分类']] || 'work',
    priority: PRIORITY_REVERSE[row['优先级']] || 'medium',
    status: STATUS_REVERSE[row['状态']] || 'pending',
    created_at: row['创建时间'] || new Date().toISOString(),
    customDate: row['指定日期'] || null,
    customTime: row['指定时间'] || null,
    weekdays: row['重复周期'] ? row['重复周期'].split(',').map(d => d.trim()).filter(Boolean) : [],
    completed_at: row['完成时间'] || null,
    is_pinned: row['是否置顶'] === '是',
    enableReminder: row['启用提醒'] === '是',
    reminderTime: row['提醒时间'] || null,
    forceReminder: row['强制提醒'] === '是',
    user_id: userId,
    // 初始化新字段（Excel导入时为空）
    logs: [],
    stats: {
      sessionCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      progressHistory: [],
      tags: [],
      blocksResolved: 0
    },
    pomodoroHistory: [],
    completedPomodoros: 0,
    estimatedPomodoros: row['预估番茄钟'] || (
      row['优先级'] === '高' ? 4 : row['优先级'] === '中' ? 2 : 1
    )
  }
  
  return task
}

// 生成空模板数据（示例行）
export function generateTemplateData() {
  return [
    {
      '任务名称': '完成项目报告',
      '详细描述': '整理本周工作进展，撰写周报',
      '任务类型': '今天',
      '分类': '工作',
      '优先级': '高',
      '状态': '待办',
      '创建时间': new Date().toISOString(),
      '指定日期': '',
      '指定时间': '',
      '重复周期': '',
      '完成时间': '',
      '是否置顶': '否',
      '启用提醒': '否',
      '提醒时间': '',
      '强制提醒': '否',
      '已完成番茄钟': 0,
      '预估番茄钟': 4,
      '执行日志数': 0,
      '最新进度': 0,
      '有AI总结': '否'
    },
    {
      '任务名称': '学习Vue3新特性',
      '详细描述': '阅读官方文档，练习Composition API',
      '任务类型': '每天重复',
      '分类': '学习',
      '优先级': '中',
      '状态': '待办',
      '创建时间': new Date().toISOString(),
      '指定日期': '',
      '指定时间': '',
      '重复周期': '',
      '完成时间': '',
      '是否置顶': '否',
      '启用提醒': '是',
      '提醒时间': '09:00',
      '强制提醒': '否',
      '已完成番茄钟': 0,
      '预估番茄钟': 2,
      '执行日志数': 0,
      '最新进度': 0,
      '有AI总结': '否'
    },
    {
      '任务名称': '周末聚餐',
      '详细描述': '和朋友约饭，预定餐厅',
      '任务类型': '指定日期',
      '分类': '生活',
      '优先级': '低',
      '状态': '待办',
      '创建时间': new Date().toISOString(),
      '指定日期': '2026-02-28',
      '指定时间': '18:00',
      '重复周期': '',
      '完成时间': '',
      '是否置顶': '否',
      '启用提醒': '是',
      '提醒时间': '17:00',
      '强制提醒': '是',
      '已完成番茄钟': 0,
      '预估番茄钟': 1,
      '执行日志数': 0,
      '最新进度': 0,
      '有AI总结': '否'
    }
  ]
}
