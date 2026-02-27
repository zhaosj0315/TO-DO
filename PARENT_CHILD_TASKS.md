# 父子任务系统设计文档

## 概述

父子任务系统允许将一个大任务拆分为多个子任务，形成层级结构。这与依赖关系系统（waitFor）是互补的：

- **依赖关系 (waitFor)**: 任务A等待任务B完成（顺序执行）
- **父子关系 (parentTaskId/subtasks)**: 任务A是任务B的子任务（层级结构）

## 数据结构

### 任务对象新增字段

```javascript
{
  // ... 其他字段
  parentTaskId: Number | null,  // 父任务ID（子任务专用）
  subtasks: Array<Number>       // 子任务ID数组（父任务专用）
}
```

### 关系示例

```
父任务: "开发新功能" (ID: 1001)
├── subtasks: [2001, 2002, 2003]
├── parentTaskId: null
│
├─ 子任务1: "设计数据库" (ID: 2001)
│  ├── parentTaskId: 1001
│  ├── waitFor: [1001]  // 等待父任务完成
│  └── subtasks: []
│
├─ 子任务2: "实现API" (ID: 2002)
│  ├── parentTaskId: 1001
│  ├── waitFor: [1001]
│  └── subtasks: []
│
└─ 子任务3: "编写测试" (ID: 2003)
   ├── parentTaskId: 1001
   ├── waitFor: [1001]
   └── subtasks: []
```

## 核心特性

### 1. AI自动拆分

当用户使用AI拆分功能时：
1. 原任务自动成为父任务
2. AI生成的子任务自动设置 `parentTaskId`
3. 子任务自动依赖父任务（`waitFor: [parentTaskId]`）

### 2. 双向关系

- **父 → 子**: 通过 `subtasks` 数组记录所有子任务ID
- **子 → 父**: 通过 `parentTaskId` 记录父任务ID

### 3. 自动清理

删除任务时自动清理关系：
- 删除父任务 → 清除所有子任务的 `parentTaskId`
- 删除子任务 → 从父任务的 `subtasks` 中移除

### 4. 灵活组合

一个任务可以同时：
- 是父任务（有 `subtasks`）
- 是子任务（有 `parentTaskId`）
- 依赖其他任务（有 `waitFor`）
- 被其他任务依赖

示例：
```
任务A (父任务)
├── 子任务B
│   └── 子任务B1 (B是父任务，也是A的子任务)
└── 子任务C
    └── waitFor: [任务D]  (C既是子任务，也依赖D)
```

## API方法

### Store方法

```javascript
// 查询方法
taskStore.getParentTask(taskId)      // 获取父任务对象
taskStore.getSubtasks(taskId)        // 获取所有子任务对象数组
taskStore.isParentTask(taskId)       // 检查是否为父任务
taskStore.isSubtask(taskId)          // 检查是否为子任务

// 创建方法
taskStore.addTask({
  ...taskData,
  parentTaskId: 1001,  // 设置父任务
  waitFor: [1001]      // 同时设置依赖
})

// 更新方法
taskStore.updateTask({
  ...task,
  subtasks: [2001, 2002, 2003]  // 更新子任务列表
})

// 删除方法（自动清理关系）
taskStore.deleteTask(taskId)
```

## 使用场景

### 场景1：AI拆分大任务

```javascript
// 用户点击"AI拆分"按钮
const parentTask = { id: 1001, text: "开发新功能" }
const subtasks = await AITaskSplitter.splitTask(parentTask.text, parentTask.description)

// 创建子任务
subtasks.forEach(subtask => {
  taskStore.addTask({
    ...subtask,
    parentTaskId: parentTask.id,
    waitFor: [parentTask.id]
  })
})

// 更新父任务
parentTask.subtasks = subtasks.map(s => s.id)
taskStore.updateTask(parentTask)
```

### 场景2：手动创建子任务

```javascript
// 用户在任务详情页点击"添加子任务"
const subtask = {
  text: "子任务名称",
  parentTaskId: parentTask.id,
  waitFor: [parentTask.id]  // 可选
}
taskStore.addTask(subtask)

// 更新父任务
parentTask.subtasks.push(subtask.id)
taskStore.updateTask(parentTask)
```

### 场景3：查询任务层级

```javascript
// 显示任务的完整层级
function displayTaskHierarchy(taskId) {
  const task = taskStore.tasks.find(t => t.id === taskId)
  
  // 显示父任务
  const parent = taskStore.getParentTask(taskId)
  if (parent) {
    console.log(`父任务: ${parent.text}`)
  }
  
  // 显示当前任务
  console.log(`当前任务: ${task.text}`)
  
  // 显示子任务
  const children = taskStore.getSubtasks(taskId)
  if (children.length > 0) {
    console.log('子任务:')
    children.forEach(child => {
      console.log(`  - ${child.text}`)
    })
  }
}
```

## 数据迁移

系统会自动为旧任务添加新字段：

```javascript
// loadTasks() 中的迁移逻辑
this.tasks = this.tasks.map(task => ({
  ...task,
  parentTaskId: task.parentTaskId || null,
  subtasks: task.subtasks || []
}))
```

## UI展示建议

### 任务卡片

```
┌─────────────────────────────────┐
│ 📋 开发新功能                    │
│ 🔗 3个子任务                     │  ← 显示子任务数量
│ ⏰ 2026-02-28 18:00             │
└─────────────────────────────────┘
```

### 任务详情页

```
┌─────────────────────────────────┐
│ 任务详情                         │
├─────────────────────────────────┤
│ 📋 开发新功能                    │
│                                  │
│ 父任务: 无                       │
│                                  │
│ 子任务 (3):                      │
│   ✓ 设计数据库                   │
│   ⏳ 实现API                     │
│   ⏳ 编写测试                    │
│                                  │
│ [添加子任务] [AI拆分]            │
└─────────────────────────────────┘
```

### 任务列表（缩进显示）

```
📋 开发新功能
  ├─ ✓ 设计数据库
  ├─ ⏳ 实现API
  └─ ⏳ 编写测试

📋 修复Bug
  └─ ⏳ 定位问题
```

## 注意事项

1. **循环引用检查**: 目前未实现，需要避免 A → B → A 的情况
2. **深度限制**: 建议最多2-3层，避免过于复杂
3. **性能考虑**: 大量子任务时，查询可能较慢
4. **数据一致性**: 删除任务时必须清理关系，避免孤儿任务

## 测试

运行测试脚本：

```bash
# 在浏览器控制台中运行
node scripts/test-parent-child.js
```

测试内容：
- 查找所有父任务和子任务
- 验证父子关系完整性
- 测试辅助方法
- 统计信息

## 版本历史

- **v1.7.7** (2026-02-27): 初始实现父子任务系统
  - 添加 `parentTaskId` 和 `subtasks` 字段
  - 实现自动清理逻辑
  - 添加查询辅助方法
  - 集成AI拆分功能
