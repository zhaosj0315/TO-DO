# API 参考文档 | API Reference

**版本**: v1.7.8  
**更新日期**: 2026-03-01

---

## 📋 概述

TO-DO App 是一个完全离线的应用，所有数据存储在本地设备。本文档描述应用内部使用的数据存储 API 和组件接口。

---

## 🗄️ 数据存储 API

### Capacitor Preferences API

应用使用 Capacitor Preferences API 进行本地数据存储。

#### 基本操作

**保存数据**:
```javascript
import { Preferences } from '@capacitor/preferences'

await Preferences.set({
  key: 'tasks_username',
  value: JSON.stringify(tasks)
})
```

**读取数据**:
```javascript
const { value } = await Preferences.get({ key: 'tasks_username' })
const tasks = JSON.parse(value || '[]')
```

**删除数据**:
```javascript
await Preferences.remove({ key: 'tasks_username' })
```

**清空所有数据**:
```javascript
await Preferences.clear()
```

---

## 📦 Store API (Pinia)

### offlineTaskStore

任务管理核心 Store。

#### State

```javascript
{
  tasks: Array,           // 任务列表
  deletedTasks: Array,    // 回收站任务
  currentUser: String     // 当前用户
}
```

#### Actions

**addTask(taskData)**

创建新任务。

参数:
```javascript
{
  text: String,              // 任务标题（必需）
  description: String,       // 任务描述
  type: String,              // 类型: 'today' | 'tomorrow' | 'this_week' | 'custom_date' | 'daily' | 'weekday' | 'weekly'
  category: String,          // 分类: 'work' | 'study' | 'life'
  priority: String,          // 优先级: 'high' | 'medium' | 'low'
  customDate: String,        // 自定义日期 (YYYY-MM-DD)
  customTime: String,        // 自定义时间 (HH:MM)
  weekdays: Array,           // 周期 [0-6]，仅 weekly 类型
  enableReminder: Boolean,   // 是否启用提醒
  reminderTime: String,      // 提醒时间 (ISO格式)
  waitFor: Array,            // 依赖的任务ID数组
  parentTaskId: Number       // 父任务ID（AI拆分）
}
```

返回: `Task` 对象

示例:
```javascript
const task = await taskStore.addTask({
  text: '完成项目报告',
  description: '包含数据分析和结论',
  type: 'today',
  category: 'work',
  priority: 'high'
})
```

---

**toggleTaskCompletion(taskId)**

切换任务完成状态。

参数:
- `taskId`: Number - 任务ID

返回: void

示例:
```javascript
await taskStore.toggleTaskCompletion(123456)
```

---

**deleteTask(taskId)**

删除任务（移至回收站）。

参数:
- `taskId`: Number - 任务ID

返回: void

示例:
```javascript
await taskStore.deleteTask(123456)
```

---

**restoreTask(taskId)**

从回收站恢复任务。

参数:
- `taskId`: Number - 任务ID

返回: void

---

**permanentlyDeleteTask(taskId)**

永久删除任务。

参数:
- `taskId`: Number - 任务ID

返回: void

---

**getFilteredTasks(statusFilter, categoryFilter, dateRange)**

获取筛选后的任务列表。

参数:
```javascript
{
  statusFilter: String,      // 'all' | 'pending' | 'completed' | 'overdue'
  categoryFilter: String,    // 'all' | 'work' | 'study' | 'life'
  dateRange: {
    start: String,           // 开始日期 (YYYY-MM-DD)
    end: String,             // 结束日期 (YYYY-MM-DD)
    dimension: String        // 'created' | 'deadline' | 'completed'
  }
}
```

返回: `Array<Task>`

示例:
```javascript
const tasks = taskStore.getFilteredTasks('pending', 'work', {
  start: '2026-03-01',
  end: '2026-03-31',
  dimension: 'deadline'
})
```

---

**calculateDeadline(task)**

计算任务截止时间。

参数:
- `task`: Task - 任务对象

返回: `Date | null`

示例:
```javascript
const deadline = taskStore.calculateDeadline(task)
```

---

**addTaskLog(taskId, logData)**

添加任务执行日志。

参数:
```javascript
{
  taskId: Number,           // 任务ID
  logData: {
    type: String,           // 'start' | 'progress' | 'block' | 'solution' | 'milestone' | 'complete'
    content: String,        // 日志内容（必需）
    duration: Number,       // 耗时（分钟）
    progress: Number,       // 进度 (0-100)
    tags: Array,            // 标签数组
    mood: String,           // 心情: 'good' | 'neutral' | 'bad'
    rating: Number,         // 评分 (1-5)，仅 complete 类型
    lessons: String,        // 经验教训，仅 complete 类型
    relatedBlockId: Number  // 关联的阻碍ID，仅 solution 类型
  }
}
```

返回: void

示例:
```javascript
await taskStore.addTaskLog(123456, {
  type: 'progress',
  content: '完成数据收集',
  duration: 60,
  progress: 50,
  tags: ['数据分析'],
  mood: 'good'
})
```

---

**setDependency(taskId, dependsOnIds)**

设置任务依赖关系。

参数:
- `taskId`: Number - 任务ID
- `dependsOnIds`: Array<Number> - 依赖的任务ID数组

返回: void

示例:
```javascript
await taskStore.setDependency(123456, [123455])
```

---

**canStart(taskId)**

检查任务是否可以开始（依赖检查）。

参数:
- `taskId`: Number - 任务ID

返回: Boolean

示例:
```javascript
const canStart = taskStore.canStart(123456)
```

---

**checkOverdueTasks()**

检查并更新逾期任务状态，重置重复任务。

参数: 无

返回: void

---

### offlineUserStore

用户管理 Store。

#### State

```javascript
{
  currentUser: String,    // 当前登录用户
  isLoggedIn: Boolean     // 是否已登录
}
```

#### Actions

**register(username, password, securityQA, phone)**

注册新用户。

参数:
```javascript
{
  username: String,       // 用户名（必需）
  password: String,       // 密码（必需）
  securityQA: Object,     // 密保问题（可选）
  phone: String           // 手机号（可选）
}
```

返回: `{ success: Boolean, message: String }`

---

**login(username, password)**

用户登录。

参数:
- `username`: String - 用户名
- `password`: String - 密码

返回: `{ success: Boolean, message: String }`

---

**logout()**

用户登出。

参数: 无

返回: void

---

## 🧩 组件 API

### LoadingSpinner

AI 加载动画组件。

#### Props

```javascript
{
  visible: Boolean,       // 是否显示（必需）
  text: String,           // 主提示文本（默认: "AI 思考中..."）
  subText: String,        // 副提示文本（可选）
  transparent: Boolean    // 是否使用透明背景（默认: false）
}
```

#### 使用示例

```vue
<LoadingSpinner
  :visible="aiLoading"
  text="AI 正在分析..."
  sub-text="请稍候"
/>
```

---

### TaskDetailModal

任务详情 Bottom Sheet 组件。

#### Props

```javascript
{
  task: Object,           // 任务对象（必需）
  visible: Boolean        // 是否显示（必需）
}
```

#### Events

```javascript
{
  close: void,            // 关闭 Bottom Sheet
  update: Task            // 任务更新
}
```

---

### AddLogModal

添加日志 Bottom Sheet 组件。

#### Props

```javascript
{
  visible: Boolean,       // 是否显示（必需）
  taskId: Number          // 任务ID（必需）
}
```

#### Events

```javascript
{
  close: void,            // 关闭 Bottom Sheet
  submit: LogData         // 提交日志
}
```

---

## 📱 Capacitor 插件 API

### LocalNotifications

本地通知插件。

**请求权限**:
```javascript
await LocalNotifications.requestPermissions()
```

**创建通知渠道**:
```javascript
await LocalNotifications.createChannel({
  id: 'task-reminders',
  name: '任务提醒',
  importance: 5,
  visibility: 1,
  vibration: true
})
```

**调度通知**:
```javascript
await LocalNotifications.schedule({
  notifications: [{
    id: 123456,
    title: '任务提醒',
    body: '完成项目报告',
    schedule: { at: new Date(Date.now() + 3600000) },
    channelId: 'task-reminders'
  }]
})
```

**取消通知**:
```javascript
await LocalNotifications.cancel({
  notifications: [{ id: 123456 }]
})
```

---

### Camera

相机插件（拍照识别）。

**拍照**:
```javascript
import { Camera, CameraResultType } from '@capacitor/camera'

const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri
})
```

---

## 🔧 工具函数

### 日期格式化

**formatDisplayDateTime(isoString)**

格式化显示日期时间。

参数:
- `isoString`: String - ISO格式日期字符串

返回: String - 格式化后的日期时间

示例:
```javascript
formatDisplayDateTime('2026-03-01T10:30:00Z')
// 返回: "2026/3/1 10:30"
```

---

### 时间计算

**getTimeRemaining(deadline)**

计算剩余时间。

参数:
- `deadline`: Date - 截止时间

返回: Object
```javascript
{
  hours: Number,
  minutes: Number,
  isUrgent: Boolean,
  isOverdue: Boolean
}
```

---

## 📊 数据模型

### Task 对象

```javascript
{
  id: Number,                    // 任务ID（时间戳）
  text: String,                  // 任务标题
  description: String,           // 任务描述
  type: String,                  // 类型
  category: String,              // 分类
  priority: String,              // 优先级
  status: String,                // 状态: 'pending' | 'completed' | 'overdue'
  created_at: String,            // 创建时间（ISO格式）
  completed_at: String,          // 完成时间（ISO格式）
  customDate: String,            // 自定义日期
  customTime: String,            // 自定义时间
  weekdays: Array,               // 周期
  is_pinned: Boolean,            // 是否置顶
  enableReminder: Boolean,       // 是否启用提醒
  reminderTime: String,          // 提醒时间
  completedPomodoros: Number,    // 已完成番茄钟
  estimatedPomodoros: Number,    // 预估番茄钟
  pomodoroHistory: Array,        // 番茄钟历史
  logs: Array,                   // 执行日志
  stats: Object,                 // 统计数据
  waitFor: Array,                // 依赖的任务ID
  parentTaskId: Number,          // 父任务ID
  aiSummary: String,             // AI总结
  user_id: String                // 所属用户
}
```

---

### Log 对象

```javascript
{
  id: Number,              // 日志ID（时间戳）
  type: String,            // 类型
  content: String,         // 内容
  timestamp: String,       // 时间戳（ISO格式）
  duration: Number,        // 耗时（分钟）
  progress: Number,        // 进度 (0-100)
  tags: Array,             // 标签
  mood: String,            // 心情
  rating: Number,          // 评分 (1-5)
  lessons: String,         // 经验教训
  relatedBlockId: Number,  // 关联阻碍ID
  resolved: Boolean        // 是否已解决（阻碍类型）
}
```

---

## 🔐 错误处理

### 常见错误

**存储错误**:
```javascript
try {
  await Preferences.set({ key, value })
} catch (error) {
  console.error('存储失败:', error)
  // 处理错误
}
```

**任务不存在**:
```javascript
const task = taskStore.tasks.find(t => t.id === taskId)
if (!task) {
  console.error('任务不存在')
  return
}
```

**依赖循环检测**:
```javascript
const hasCircular = taskStore.checkCircularDependency(taskId, dependsOnId)
if (hasCircular) {
  console.error('检测到循环依赖')
  return
}
```

---

## 📝 最佳实践

1. **始终使用 try-catch** 包裹异步操作
2. **验证输入数据** 在调用 API 前
3. **检查任务存在性** 在操作任务前
4. **使用类型检查** 确保数据类型正确
5. **处理边界情况** 如空数组、null 值等

---

## 🔗 相关文档

- [开发者文档](./DEVELOPER.md)
- [用户手册](./USER_MANUAL.md)
- [架构文档](./ARCHITECTURE.md)

---

**版本**: v1.7.8  
**更新日期**: 2026-03-01  
**维护**: 开发团队
