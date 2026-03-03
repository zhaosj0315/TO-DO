# 任务关系逻辑说明文档

## 📋 概述

本项目中的任务关系分为**两种独立的关系类型**：

### 1️⃣ 父子任务关系（Parent-Child Relationship）
- **来源**：AI 任务拆分功能
- **特征**：层级关系，表示任务的拆解结构
- **字段**：`parentTaskId`（子任务指向父任务的ID）

### 2️⃣ 依赖关系（Dependency Relationship）
- **来源**：手动添加前置任务
- **特征**：执行顺序约束，表示任务的先后依赖
- **字段**：`waitFor`（数组，存储前置任务的ID列表）

---

## 🔄 关系形成流程

### AI 拆分 → 纯父子关系

```javascript
// 用户操作：任务详情 → AI拆分 → 生成子任务
父任务 (ID: 100)
  ↓ AI拆分
子任务1 {
  parentTaskId: 100,      // 仅父子关系
  waitFor: []             // 不自动依赖
}
子任务2 {
  parentTaskId: 100,
  waitFor: []
}
```

**逻辑规则**：
- 子任务只标记 `parentTaskId`，不设置 `waitFor`
- 子任务可以独立执行，不需要等父任务完成
- 父子关系仅用于UI显示和组织结构

### 手动添加 → 依赖关系

```javascript
// 用户操作：任务详情 → 添加前置任务 → 选择任务
任务A {
  waitFor: [任务B的ID, 任务C的ID]  // 手动依赖
}
```

**逻辑规则**：
- 只修改 `waitFor` 字段
- 不影响 `parentTaskId`
- 可以添加多个前置任务
- 子任务也可以手动添加依赖

---

## 📊 数据结构

### 任务对象字段

```javascript
{
  id: 12345,
  text: "任务标题",
  parentTaskId: null,        // 父任务ID（仅子任务有值）
  waitFor: [],               // 前置任务ID数组
  // ... 其他字段
}
```

### 关系示例

```javascript
// 场景1：纯父子关系（AI拆分）
父任务 (ID: 100, parentTaskId: null, waitFor: [])
  ├─ 子任务1 (ID: 101, parentTaskId: 100, waitFor: [])
  └─ 子任务2 (ID: 102, parentTaskId: 100, waitFor: [])

// 场景2：纯依赖关系（手动添加）
任务A (ID: 200, parentTaskId: null, waitFor: [])
任务B (ID: 201, parentTaskId: null, waitFor: [200])

// 场景3：混合关系（子任务手动添加依赖）
父任务 (ID: 300, parentTaskId: null, waitFor: [])
  └─ 子任务 (ID: 301, parentTaskId: 300, waitFor: [200])
     ↑ 既是子任务，又依赖任务A
```

---

## 🎨 UI 显示规则

### 任务卡片徽章

| 徽章 | 条件 | 含义 |
|------|------|------|
| 👨‍👦 父任务名 | `parentTaskId` 存在 | AI拆分的子任务 |
| 👶 子任务×N | 有子任务 | 已拆分为N个子任务 |
| 🔗 前置×N | `waitFor` 有值（排除父任务） | 手动添加了N个前置任务 |

### 任务详情页

#### 依赖关系区域

```
┌─────────────────────────────────────┐
│ 👨‍👦 父任务（AI拆分来源）  [父子关系] │
│   ✅ 父任务标题                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⬆️ 前置任务（手动依赖）  [依赖关系]  │
│   ⬜ 任务A                           │
│   ⬜ 任务B                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👶 子任务（AI拆分生成）  [父子关系]  │
│   子任务1                            │
│   子任务2                            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⬇️ 后置任务（手动依赖）  [依赖关系]  │
│   任务C                              │
└─────────────────────────────────────┘
```

---

## 🔧 核心方法

### Store 方法

```javascript
// 依赖关系管理
taskStore.setWaitFor(taskId, [id1, id2])     // 设置前置任务
taskStore.addWaitFor(taskId, id)             // 添加单个前置任务
taskStore.removeWaitFor(taskId, id)          // 移除单个前置任务
taskStore.clearWaitFor(taskId)               // 清除所有前置任务
taskStore.canStart(taskId)                   // 检查是否可以开始
taskStore.getWaitForTasks(taskId)            // 获取前置任务列表
taskStore.getWaitingTasks(taskId)            // 获取后置任务列表
```

### 组件方法

```javascript
// 父子关系查询
getParentTaskName(parentTaskId)              // 获取父任务名称
getSubtasksCount(taskId)                     // 获取子任务数量

// 依赖关系查询
getManualDependencyCount(taskId)             // 获取手动依赖数量（排除父任务）

// 详情页计算属性
parentTask                                   // 父任务对象
childTasks                                   // 子任务列表
dependencyTasks                              // 前置任务列表（排除父任务）
blockedTasks                                 // 后置任务列表（排除子任务）
```

---

## ⚠️ 重要规则

### 1. 父子关系与依赖关系完全独立

```javascript
// ✅ 正确：子任务可以独立执行
子任务 {
  parentTaskId: 100,  // 标记父任务
  waitFor: []         // 不依赖任何任务
}

// ✅ 正确：子任务可以手动添加依赖
子任务 {
  parentTaskId: 100,  // 标记父任务
  waitFor: [200]      // 依赖其他任务
}
```

### 2. 清除依赖不影响父子关系

```javascript
// 清除依赖时，parentTaskId 保持不变
handleClearDependencies() {
  task.waitFor = []           // 清空依赖
  // task.parentTaskId 不变   // 父子关系保留
}
```

### 3. 完成任务时只检查依赖关系

```javascript
// 只检查 waitFor，不检查 parentTaskId
canStart(taskId) {
  return task.waitFor.every(id => {
    const depTask = tasks.find(t => t.id === id)
    return depTask?.status === 'completed'
  })
}
```

---

## 🎯 使用场景

### 场景1：项目拆解

```
项目：开发新功能
  ├─ 子任务1：需求分析
  ├─ 子任务2：设计方案
  ├─ 子任务3：编码实现
  └─ 子任务4：测试验收
```

**操作**：任务详情 → AI拆分 → 自动生成4个子任务

### 场景2：任务依赖

```
任务A：准备材料 ──→ 任务B：开始制作
```

**操作**：任务B详情 → 添加前置任务 → 选择任务A

### 场景3：混合使用

```
项目：写论文
  ├─ 子任务1：文献调研
  │   └─ 依赖：任务X（导师审批）← 手动添加
  ├─ 子任务2：撰写初稿
  │   └─ 依赖：子任务1 ← 手动添加
  └─ 子任务3：修改定稿
      └─ 依赖：子任务2 ← 手动添加
```

**操作**：
1. 项目 → AI拆分 → 生成3个子任务（无依赖）
2. 子任务1 → 添加前置任务 → 选择任务X
3. 子任务2 → 添加前置任务 → 选择子任务1
4. 子任务3 → 添加前置任务 → 选择子任务2

---

## 🐛 常见问题

### Q1：为什么子任务有 `parentTaskId` 但没有 `waitFor`？

**A**：两者用途完全不同：
- `parentTaskId`：标记层级关系，用于UI显示（"这是谁的子任务"）
- `waitFor`：控制执行顺序（"必须等谁完成"）
- AI拆分只建立层级关系，不强制执行顺序

### Q2：子任务可以在父任务之前完成吗？

**A**：可以。子任务独立执行，不依赖父任务状态。

### Q3：如何让子任务依赖父任务？

**A**：手动添加依赖：子任务详情 → 添加前置任务 → 选择父任务

### Q4：父任务完成后，子任务会自动完成吗？

**A**：不会。父子关系只是组织结构，不影响执行状态。

---

## 📝 版本历史

- **v1.7.7**：引入依赖关系系统（`waitFor`）
- **v1.7.7**：引入AI任务拆分（`parentTaskId`）
- **v1.7.8**（本次更新）：明确区分父子关系和依赖关系，优化UI显示

---

## 🔗 相关文件

- `/src/stores/offlineTaskStore.js` - 依赖关系核心逻辑
- `/src/components/TaskDetailModal.vue` - 任务详情页
- `/src/components/AddDependencyModal.vue` - 添加依赖弹窗
- `/src/components/SubtaskPreviewModal.vue` - 子任务预览
- `/src/views/TodoView.vue` - 任务列表主页
