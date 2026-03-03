# 父子任务系统使用示例

## 示例1：AI拆分大任务

### 场景
用户有一个大任务"开发新功能"，想要拆分为多个可执行的子任务。

### 操作步骤
1. 创建任务："开发新功能"
2. 打开任务详情页
3. 点击"AI拆分"按钮
4. 输入拆分数量：5
5. AI生成子任务列表
6. 点击"创建子任务"

### 结果
```
父任务: "开发新功能" (ID: 1001)
├── subtasks: [2001, 2002, 2003, 2004, 2005]
├── parentTaskId: null
│
├─ 子任务1: "需求分析" (ID: 2001)
│  ├── parentTaskId: 1001
│  ├── waitFor: [1001]
│  └── priority: high
│
├─ 子任务2: "设计数据库" (ID: 2002)
│  ├── parentTaskId: 1001
│  ├── waitFor: [1001]
│  └── priority: high
│
├─ 子任务3: "实现API" (ID: 2003)
│  ├── parentTaskId: 1001
│  ├── waitFor: [1001]
│  └── priority: medium
│
├─ 子任务4: "编写测试" (ID: 2004)
│  ├── parentTaskId: 1001
│  ├── waitFor: [1001]
│  └── priority: medium
│
└─ 子任务5: "部署上线" (ID: 2005)
   ├── parentTaskId: 1001
   ├── waitFor: [1001]
   └── priority: low
```

### 代码实现
```javascript
// TodoView.vue - handleCreateSubtasks 方法
const handleCreateSubtasks = (subtaskList) => {
  const parentTask = currentSplittingTask.value
  const subtaskIds = []
  
  subtaskList.forEach((subtask) => {
    const newTask = {
      text: subtask.title,
      description: subtask.description,
      parentTaskId: parentTask.id,  // 设置父任务
      waitFor: [parentTask.id]      // 依赖父任务
    }
    taskStore.addTask(newTask)
    subtaskIds.push(newTask.id)
  })
  
  // 更新父任务
  parentTask.subtasks = subtaskIds
  taskStore.updateTask(parentTask)
}
```

---

## 示例2：复杂项目工作流

### 场景
一个软件发布项目，包含多个阶段，每个阶段有多个子任务。

### 任务结构
```
项目: "发布 v2.0 版本"
│
├─ 阶段1: "开发阶段" (父任务)
│  ├── "功能A开发" (子任务)
│  ├── "功能B开发" (子任务)
│  └── "功能C开发" (子任务)
│
├─ 阶段2: "测试阶段" (父任务，waitFor: [阶段1])
│  ├── "单元测试" (子任务)
│  ├── "集成测试" (子任务)
│  └── "性能测试" (子任务)
│
├─ 阶段3: "文档阶段" (父任务，waitFor: [阶段1])
│  ├── "API文档" (子任务)
│  ├── "用户手册" (子任务)
│  └── "发布说明" (子任务)
│
└─ 阶段4: "部署阶段" (父任务，waitFor: [阶段2, 阶段3])
   ├── "预发布环境" (子任务)
   ├── "生产环境" (子任务)
   └── "监控配置" (子任务)
```

### 特点
- **父子关系**：每个阶段是父任务，包含多个子任务
- **依赖关系**：阶段之间有依赖关系（waitFor）
- **灵活组合**：父子关系 + 依赖关系 = 复杂工作流

---

## 示例3：查询任务层级

### 场景
在任务详情页显示任务的完整层级关系。

### 代码实现
```javascript
// 获取任务的完整层级信息
function getTaskHierarchy(taskId) {
  const task = taskStore.tasks.find(t => t.id === taskId)
  
  // 获取父任务
  const parent = taskStore.getParentTask(taskId)
  
  // 获取子任务
  const children = taskStore.getSubtasks(taskId)
  
  // 获取依赖任务
  const dependencies = taskStore.getWaitForTasks(taskId)
  
  // 获取等待当前任务的任务
  const waitingTasks = taskStore.getWaitingTasks(taskId)
  
  return {
    task,
    parent,
    children,
    dependencies,
    waitingTasks
  }
}

// 使用示例
const hierarchy = getTaskHierarchy(2001)
console.log('当前任务:', hierarchy.task.text)
console.log('父任务:', hierarchy.parent?.text || '无')
console.log('子任务:', hierarchy.children.map(c => c.text).join(', ') || '无')
console.log('依赖任务:', hierarchy.dependencies.map(d => d.text).join(', ') || '无')
console.log('等待任务:', hierarchy.waitingTasks.map(w => w.text).join(', ') || '无')
```

### 输出示例
```
当前任务: 设计数据库
父任务: 开发新功能
子任务: 无
依赖任务: 开发新功能
等待任务: 无
```

---

## 示例4：任务进度聚合

### 场景
计算父任务的完成进度（基于子任务完成情况）。

### 代码实现
```javascript
// 计算父任务的完成进度
function calculateParentProgress(parentTaskId) {
  const subtasks = taskStore.getSubtasks(parentTaskId)
  
  if (subtasks.length === 0) {
    return 0
  }
  
  const completedCount = subtasks.filter(t => t.status === 'completed').length
  const progress = (completedCount / subtasks.length) * 100
  
  return Math.round(progress)
}

// 使用示例
const parentTask = taskStore.tasks.find(t => t.text === "开发新功能")
const progress = calculateParentProgress(parentTask.id)
console.log(`父任务进度: ${progress}%`)

// 输出示例
// 父任务进度: 60% (3/5个子任务已完成)
```

---

## 示例5：批量操作子任务

### 场景
完成父任务时，自动完成所有子任务。

### 代码实现
```javascript
// 完成父任务及其所有子任务
async function completeParentAndChildren(parentTaskId) {
  const subtasks = taskStore.getSubtasks(parentTaskId)
  
  // 完成所有子任务
  for (const subtask of subtasks) {
    if (subtask.status !== 'completed') {
      await taskStore.toggleTaskCompletion(subtask.id)
    }
  }
  
  // 完成父任务
  await taskStore.toggleTaskCompletion(parentTaskId)
  
  console.log(`已完成父任务及其 ${subtasks.length} 个子任务`)
}

// 使用示例
const parentTask = taskStore.tasks.find(t => t.text === "开发新功能")
await completeParentAndChildren(parentTask.id)
```

---

## 示例6：删除父任务的安全检查

### 场景
删除父任务前，提示用户是否同时删除子任务。

### 代码实现
```javascript
// 安全删除父任务
async function safeDeleteParentTask(parentTaskId) {
  const subtasks = taskStore.getSubtasks(parentTaskId)
  
  if (subtasks.length > 0) {
    const confirmed = confirm(
      `此任务有 ${subtasks.length} 个子任务。\n` +
      `删除父任务后，子任务将变为独立任务。\n` +
      `是否继续？`
    )
    
    if (!confirmed) {
      return
    }
  }
  
  // 删除父任务（自动清理关系）
  await taskStore.deleteTask(parentTaskId)
  
  console.log(`已删除父任务，${subtasks.length} 个子任务已变为独立任务`)
}

// 使用示例
const parentTask = taskStore.tasks.find(t => t.text === "开发新功能")
await safeDeleteParentTask(parentTask.id)
```

---

## 示例7：任务类型检查

### 场景
根据任务类型显示不同的UI。

### 代码实现
```javascript
// 获取任务类型标签
function getTaskTypeLabel(taskId) {
  const isParent = taskStore.isParentTask(taskId)
  const isChild = taskStore.isSubtask(taskId)
  
  if (isParent && isChild) {
    return '📋 父任务 + 子任务'
  } else if (isParent) {
    return '📋 父任务'
  } else if (isChild) {
    return '📄 子任务'
  } else {
    return '📝 独立任务'
  }
}

// 使用示例
const task = taskStore.tasks.find(t => t.text === "开发新功能")
console.log(getTaskTypeLabel(task.id))  // 输出: 📋 父任务
```

---

## 示例8：任务树形展示

### 场景
在任务列表中以树形结构展示父子关系。

### 代码实现
```javascript
// 生成任务树
function generateTaskTree() {
  const rootTasks = taskStore.tasks.filter(t => !t.parentTaskId)
  
  function buildTree(task, level = 0) {
    const indent = '  '.repeat(level)
    const icon = task.status === 'completed' ? '✓' : '⏳'
    let tree = `${indent}${icon} ${task.text}\n`
    
    const children = taskStore.getSubtasks(task.id)
    children.forEach(child => {
      tree += buildTree(child, level + 1)
    })
    
    return tree
  }
  
  let result = ''
  rootTasks.forEach(task => {
    result += buildTree(task)
  })
  
  return result
}

// 使用示例
console.log(generateTaskTree())

// 输出示例:
// ⏳ 开发新功能
//   ✓ 需求分析
//   ✓ 设计数据库
//   ⏳ 实现API
//   ⏳ 编写测试
//   ⏳ 部署上线
// ⏳ 修复Bug
//   ⏳ 定位问题
```

---

## 最佳实践

### 1. 合理的层级深度
- ✅ 推荐：1-2层（父任务 → 子任务）
- ⚠️ 谨慎：3层（父任务 → 子任务 → 孙任务）
- ❌ 避免：4层及以上

### 2. 子任务数量
- ✅ 推荐：3-7个子任务
- ⚠️ 谨慎：8-15个子任务
- ❌ 避免：超过15个子任务

### 3. 依赖关系设计
- ✅ 子任务依赖父任务（AI拆分自动设置）
- ✅ 父任务之间的依赖关系（阶段依赖）
- ⚠️ 子任务之间的依赖关系（谨慎使用）

### 4. 删除策略
- ✅ 删除父任务前提示用户
- ✅ 子任务变为独立任务（不删除）
- ⚠️ 批量删除需要确认

### 5. 性能优化
- ✅ 缓存查询结果
- ✅ 批量操作时减少保存次数
- ✅ 大量任务时使用分页

---

## 常见问题

### Q1: 如何创建多层级任务？
A: 子任务也可以成为父任务，只需对子任务使用AI拆分功能即可。

### Q2: 删除父任务后子任务会怎样？
A: 子任务的 `parentTaskId` 会被清除，变为独立任务，但不会被删除。

### Q3: 如何查看任务的完整层级？
A: 使用 `getParentTask` 和 `getSubtasks` 方法递归查询。

### Q4: 父子关系和依赖关系有什么区别？
A: 
- **父子关系**：表示任务的层级结构（组织关系）
- **依赖关系**：表示任务的执行顺序（时序关系）

### Q5: 如何防止循环引用？
A: 目前未实现自动检查，需要手动避免 A → B → A 的情况。

---

## 总结

父子任务系统提供了灵活的任务组织方式，结合依赖关系系统，可以实现复杂的工作流管理。通过AI拆分功能，用户可以轻松将大任务分解为可执行的子任务，提高任务管理效率。
