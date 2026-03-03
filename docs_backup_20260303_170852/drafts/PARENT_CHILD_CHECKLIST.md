# 父子任务系统验证清单

## 功能验证

### 1. AI拆分创建父子关系 ✅

**测试步骤**：
1. 创建一个任务："开发新功能"
2. 打开任务详情页
3. 点击"AI拆分"按钮
4. 输入拆分数量（如5）
5. 等待AI生成子任务
6. 点击"创建子任务"

**预期结果**：
- ✅ 父任务的 `subtasks` 数组包含所有子任务ID
- ✅ 每个子任务的 `parentTaskId` 等于父任务ID
- ✅ 每个子任务的 `waitFor` 包含父任务ID
- ✅ 控制台输出正确的日志

**验证命令**（浏览器控制台）：
```javascript
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
const parentTask = taskStore.tasks.find(t => t.text === "开发新功能")
console.log('父任务:', parentTask)
console.log('subtasks:', parentTask.subtasks)
console.log('子任务:', parentTask.subtasks.map(id => taskStore.tasks.find(t => t.id === id)))
```

---

### 2. 查询方法正常工作 ✅

**测试步骤**：
1. 使用上面创建的父子任务
2. 在控制台运行查询方法

**验证命令**：
```javascript
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
const parentTask = taskStore.tasks.find(t => t.text === "开发新功能")
const subtask = taskStore.tasks.find(t => t.parentTaskId === parentTask.id)

// 测试 getParentTask
console.log('getParentTask:', taskStore.getParentTask(subtask.id))

// 测试 getSubtasks
console.log('getSubtasks:', taskStore.getSubtasks(parentTask.id))

// 测试 isParentTask
console.log('isParentTask(父任务):', taskStore.isParentTask(parentTask.id))
console.log('isParentTask(子任务):', taskStore.isParentTask(subtask.id))

// 测试 isSubtask
console.log('isSubtask(父任务):', taskStore.isSubtask(parentTask.id))
console.log('isSubtask(子任务):', taskStore.isSubtask(subtask.id))
```

**预期结果**：
- ✅ `getParentTask` 返回正确的父任务对象
- ✅ `getSubtasks` 返回所有子任务对象数组
- ✅ `isParentTask` 对父任务返回 true，对子任务返回 false
- ✅ `isSubtask` 对子任务返回 true，对父任务返回 false

---

### 3. 删除父任务自动清理 ✅

**测试步骤**：
1. 删除父任务
2. 检查子任务的 `parentTaskId` 是否被清除

**验证命令**：
```javascript
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
const parentTask = taskStore.tasks.find(t => t.text === "开发新功能")
const subtaskIds = [...parentTask.subtasks]

// 删除父任务
await taskStore.deleteTask(parentTask.id)

// 检查子任务
subtaskIds.forEach(id => {
  const subtask = taskStore.tasks.find(t => t.id === id)
  console.log(`子任务 ${subtask.text} 的 parentTaskId:`, subtask.parentTaskId)
})
```

**预期结果**：
- ✅ 所有子任务的 `parentTaskId` 变为 `null`
- ✅ 子任务仍然存在（未被删除）

---

### 4. 删除子任务自动清理 ✅

**测试步骤**：
1. 删除一个子任务
2. 检查父任务的 `subtasks` 数组

**验证命令**：
```javascript
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
const parentTask = taskStore.tasks.find(t => t.text === "开发新功能")
const subtask = taskStore.tasks.find(t => t.parentTaskId === parentTask.id)
const subtaskId = subtask.id

console.log('删除前 subtasks:', parentTask.subtasks)

// 删除子任务
await taskStore.deleteTask(subtaskId)

console.log('删除后 subtasks:', parentTask.subtasks)
console.log('是否包含已删除的子任务:', parentTask.subtasks.includes(subtaskId))
```

**预期结果**：
- ✅ 父任务的 `subtasks` 数组中不再包含已删除的子任务ID
- ✅ 其他子任务不受影响

---

### 5. 数据迁移正常工作 ✅

**测试步骤**：
1. 手动创建一个旧格式的任务（不含 `parentTaskId` 和 `subtasks`）
2. 刷新页面
3. 检查任务是否自动添加了新字段

**验证命令**：
```javascript
// 1. 创建旧格式任务
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
const oldTask = {
  id: Date.now(),
  text: "旧格式任务",
  type: "today",
  category: "work",
  priority: "medium",
  status: "pending",
  created_at: new Date().toISOString()
}
taskStore.tasks.push(oldTask)
await taskStore.saveTasks()

// 2. 刷新页面（手动操作）

// 3. 检查任务
const migratedTask = taskStore.tasks.find(t => t.text === "旧格式任务")
console.log('parentTaskId:', migratedTask.parentTaskId)
console.log('subtasks:', migratedTask.subtasks)
```

**预期结果**：
- ✅ `parentTaskId` 为 `null`
- ✅ `subtasks` 为空数组 `[]`

---

### 6. 运行完整测试脚本 ✅

**测试步骤**：
1. 在浏览器控制台中运行测试脚本

**验证命令**：
```javascript
// 复制 scripts/test-parent-child.js 的内容到控制台运行
```

**预期结果**：
- ✅ 找到所有父任务和子任务
- ✅ 所有完整性检查通过
- ✅ 辅助方法测试通过
- ✅ 统计信息正确

---

## 代码检查

### 1. offlineTaskStore.js ✅

- ✅ `addTask` 方法包含 `parentTaskId` 和 `subtasks` 字段
- ✅ `loadTasks` 方法包含数据迁移逻辑
- ✅ `deleteTask` 方法包含关系清理逻辑
- ✅ 新增4个查询方法

### 2. TodoView.vue ✅

- ✅ `handleCreateSubtasks` 方法设置 `parentTaskId`
- ✅ 更新父任务的 `subtasks` 数组
- ✅ 移除冗余字段

### 3. 文档 ✅

- ✅ PARENT_CHILD_TASKS.md - 设计文档
- ✅ PARENT_CHILD_IMPLEMENTATION.md - 实现总结
- ✅ README.md - 功能列表和版本历史
- ✅ scripts/test-parent-child.js - 测试脚本

---

## 快速验证命令

在浏览器控制台中运行以下命令进行快速验证：

```javascript
// 获取 taskStore
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore

// 统计父子任务
const parentTasks = taskStore.tasks.filter(t => t.subtasks?.length > 0)
const subtasks = taskStore.tasks.filter(t => t.parentTaskId)

console.log('=== 父子任务统计 ===')
console.log('总任务数:', taskStore.tasks.length)
console.log('父任务数:', parentTasks.length)
console.log('子任务数:', subtasks.length)
console.log('独立任务数:', taskStore.tasks.length - parentTasks.length - subtasks.length)

// 验证完整性
let errors = 0
parentTasks.forEach(p => {
  p.subtasks.forEach(id => {
    const child = taskStore.tasks.find(t => t.id === id)
    if (!child || child.parentTaskId !== p.id) errors++
  })
})
subtasks.forEach(s => {
  const parent = taskStore.tasks.find(t => t.id === s.parentTaskId)
  if (!parent || !parent.subtasks?.includes(s.id)) errors++
})

console.log('完整性错误:', errors === 0 ? '✅ 无' : `❌ ${errors}个`)
```

---

## 验证结果

- [ ] AI拆分创建父子关系
- [ ] 查询方法正常工作
- [ ] 删除父任务自动清理
- [ ] 删除子任务自动清理
- [ ] 数据迁移正常工作
- [ ] 运行完整测试脚本
- [ ] 代码检查通过
- [ ] 文档完整

**全部通过后，父子任务系统即可投入使用！** ✅
