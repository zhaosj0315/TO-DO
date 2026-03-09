# 任务关联逻辑审查报告

## 审查时间
2026-03-09 13:03

## 审查范围
1. 父子任务关系（parentTaskId + subtasks）
2. 前置任务关系（waitFor）
3. 任务完成/删除时的关联处理

---

## 一、数据结构定义

### 1.1 任务对象字段
```javascript
{
  id: Number,              // 任务ID
  parentTaskId: Number,    // 父任务ID（子任务专用）
  subtasks: Array,         // 子任务ID列表（父任务专用）
  waitFor: Array,          // 前置任务ID列表（依赖关系）
  // ... 其他字段
}
```

### 1.2 关系类型
- **父子关系**：`parentTaskId` ↔ `subtasks`（双向引用）
- **依赖关系**：`waitFor`（单向引用，A等待B完成）

---

## 二、逻辑审查

### 2.1 父子任务关系 ✅

#### 创建子任务
```javascript
// 位置：offlineTaskStore.js - addTask()
const task = {
  id: taskData.id || Math.floor(Math.random() * 2147483647),
  parentTaskId: taskData.parentTaskId || null,  // ✅ 正确设置父任务ID
  subtasks: taskData.subtasks || [],            // ✅ 初始化子任务列表
  // ...
}
```

**问题1：父任务的subtasks字段未自动更新** ❌
- 创建子任务时，只设置了子任务的`parentTaskId`
- 但父任务的`subtasks`数组没有自动添加子任务ID
- **影响**：父任务无法通过`subtasks`字段查询子任务

**建议修复**：
```javascript
// 在addTask()中添加
if (taskData.parentTaskId) {
  const parentTask = this.tasks.find(t => t.id === taskData.parentTaskId)
  if (parentTask) {
    if (!parentTask.subtasks) parentTask.subtasks = []
    if (!parentTask.subtasks.includes(task.id)) {
      parentTask.subtasks.push(task.id)
    }
  }
}
```

#### 删除任务时的子任务处理
```javascript
// 位置：offlineTaskStore.js - deleteTask()
const childTasks = this.tasks.filter(t => t.parentTaskId === taskId)
if (childTasks.length > 0) {
  // 递归删除所有子任务
  for (const child of childTasks) {
    await this.deleteTask(child.id)
  }
}
```
✅ **正确**：递归删除所有子任务

#### 完成任务时的子任务处理
```javascript
// 位置：offlineTaskStore.js - toggleTaskStatus()
const childTasks = this.tasks.filter(t => t.parentTaskId === taskId)
if (childTasks.length > 0 && childTasks.some(t => t.status !== 'completed')) {
  return { 
    success: false, 
    message: '请先完成所有子任务' 
  }
}
```
✅ **正确**：父任务必须等所有子任务完成才能完成

---

### 2.2 前置任务关系（waitFor）✅

#### 数据迁移
```javascript
// 位置：offlineTaskStore.js - loadTasks()
let waitFor = task.waitFor
if (waitFor === null || waitFor === undefined) {
  waitFor = []
} else if (typeof waitFor === 'number') {
  waitFor = [waitFor]  // ✅ 兼容旧数据（单个ID转数组）
}
```
✅ **正确**：兼容旧数据格式

#### 完成任务时的通知
```javascript
// 位置：offlineTaskStore.js - toggleTaskStatus()
if (task.status === 'completed') {
  // 通知等待此任务的其他任务
  const waitingTasks = this.tasks.filter(t => 
    t.waitFor && t.waitFor.includes(taskId)
  )
  // ... 发送通知
}
```
✅ **正确**：完成任务时通知所有等待它的任务

#### 删除任务时的依赖清理
```javascript
// 位置：offlineTaskStore.js - deleteTask()
this.tasks.forEach(t => {
  if (t.waitFor && t.waitFor.includes(taskId)) {
    t.waitFor = t.waitFor.filter(id => id !== taskId)
  }
})
```
✅ **正确**：删除任务时自动清理所有依赖关系

---

## 三、发现的问题

### 🔴 严重问题

#### 问题1：父任务的subtasks字段未自动维护
**位置**：`offlineTaskStore.js - addTask()`
**现象**：
- 创建子任务时，子任务的`parentTaskId`正确设置
- 但父任务的`subtasks`数组没有自动添加子任务ID
- 导致父任务无法通过`subtasks`字段查询子任务

**影响**：
- 父任务显示子任务数量可能不准确
- 删除父任务时可能遗漏子任务

**修复优先级**：⭐⭐⭐⭐⭐ 高

---

### 🟡 中等问题

#### 问题2：完成父任务后，子任务状态未联动
**位置**：`offlineTaskStore.js - toggleTaskStatus()`
**现象**：
- 父任务完成后，子任务仍然是待办状态
- 用户可能期望父任务完成后，子任务也自动完成

**建议**：
- 添加选项：完成父任务时，是否自动完成所有子任务
- 或者：父任务完成后，子任务自动标记为"已取消"

**修复优先级**：⭐⭐⭐ 中

---

### 🟢 轻微问题

#### 问题3：循环依赖检测缺失
**位置**：前置任务添加逻辑
**现象**：
- 用户可以设置 A等待B，B等待A（循环依赖）
- 导致两个任务永远无法开始

**建议**：
- 添加循环依赖检测
- 添加依赖时，检查是否会形成环

**修复优先级**：⭐⭐ 低

---

## 四、测试场景

### 场景1：创建父子任务
1. 创建父任务A
2. 为A创建子任务B、C
3. **预期**：A.subtasks = [B.id, C.id]
4. **实际**：A.subtasks = [] ❌

### 场景2：删除父任务
1. 创建父任务A，子任务B、C
2. 删除A
3. **预期**：B、C也被删除
4. **实际**：✅ 正确

### 场景3：完成父任务
1. 创建父任务A，子任务B、C
2. 尝试完成A（B、C未完成）
3. **预期**：提示"请先完成所有子任务"
4. **实际**：✅ 正确

### 场景4：前置任务依赖
1. 创建任务A、B
2. 设置B等待A
3. 完成A
4. **预期**：B收到通知"前置任务已完成"
5. **实际**：✅ 正确

### 场景5：删除被依赖的任务
1. 创建任务A、B
2. 设置B等待A
3. 删除A
4. **预期**：B的waitFor清空
5. **实际**：✅ 正确

---

## 五、修复建议

### 修复1：自动维护父任务的subtasks字段
```javascript
// 在 addTask() 中添加
if (taskData.parentTaskId) {
  const parentTask = this.tasks.find(t => t.id === taskData.parentTaskId)
  if (parentTask) {
    if (!parentTask.subtasks) parentTask.subtasks = []
    if (!parentTask.subtasks.includes(task.id)) {
      parentTask.subtasks.push(task.id)
    }
    await this.saveTasks()  // 保存父任务更新
  }
}
```

### 修复2：删除子任务时，从父任务的subtasks中移除
```javascript
// 在 deleteTask() 中添加
if (task.parentTaskId) {
  const parentTask = this.tasks.find(t => t.id === task.parentTaskId)
  if (parentTask && parentTask.subtasks) {
    parentTask.subtasks = parentTask.subtasks.filter(id => id !== taskId)
  }
}
```

### 修复3：添加循环依赖检测
```javascript
// 新增方法
hasCircularDependency(taskId, waitForId) {
  const visited = new Set()
  const check = (currentId) => {
    if (currentId === taskId) return true
    if (visited.has(currentId)) return false
    visited.add(currentId)
    
    const task = this.tasks.find(t => t.id === currentId)
    if (!task || !task.waitFor) return false
    
    return task.waitFor.some(id => check(id))
  }
  return check(waitForId)
}
```

---

## 六、总结

### ✅ 正确的逻辑
1. 子任务的`parentTaskId`正确设置
2. 删除父任务时递归删除子任务
3. 完成父任务前检查子任务状态
4. 前置任务完成时通知等待任务
5. 删除任务时清理依赖关系

### ❌ 需要修复的问题
1. **高优先级**：父任务的`subtasks`字段未自动维护
2. **中优先级**：完成父任务后子任务状态未联动
3. **低优先级**：缺少循环依赖检测

### 建议
立即修复问题1，确保父子关系的双向引用一致性。
