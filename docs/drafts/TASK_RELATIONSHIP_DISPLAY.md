# 任务关系显示优化总结

## 修改内容

### TaskDetailModal.vue

优化了任务关系的显示逻辑，确保4种关系清晰分离，无重复显示。

#### 修改前的问题
- **前置任务（waitForTasks）**：包含父任务，导致父任务重复显示

#### 修改后的逻辑

```javascript
// 1. 父任务（如果当前任务是子任务）
const parentTask = computed(() => {
  if (props.task.parentTaskId) {
    return taskStore.tasks.find(t => t.id === props.task.parentTaskId)
  }
  return null
})

// 2. 前置任务（排除父任务）
const waitForTasks = computed(() => {
  const allWaitFor = taskStore.getWaitForTasks(props.task.id)
  // 排除父任务，避免重复显示
  return allWaitFor.filter(t => t.id !== props.task.parentTaskId)
})

// 3. 子任务（基于 parentTaskId）
const realSubtasks = computed(() => {
  return taskStore.tasks.filter(t => t.parentTaskId === props.task.id)
})

// 4. 后续任务（排除子任务）
const dependentTasks = computed(() => {
  const allWaiting = taskStore.getWaitingTasks(props.task.id)
  // 排除子任务，避免重复显示
  return allWaiting.filter(t => !t.parentTaskId || t.parentTaskId !== props.task.id)
})
```

## UI显示顺序

```
🔗 任务关系
├─ 📂 父任务（如果是子任务）
├─ 🔗 前置任务（手动添加的依赖，排除父任务）
├─ 🧩 子任务（AI拆解的子任务）
└─ 🔗 后续任务（等待当前任务的任务，排除子任务）
```

## 关系说明

### 1. 📂 父任务
- **定义**：当前任务的父任务（通过 `parentTaskId` 关联）
- **来源**：AI拆分时自动创建
- **显示条件**：`props.task.parentTaskId` 存在

### 2. 🔗 前置任务
- **定义**：需要先完成的任务（通过 `waitFor` 关联，排除父任务）
- **来源**：手动添加的依赖关系
- **显示条件**：`waitForTasks.length > 0`

### 3. 🧩 子任务
- **定义**：AI拆解的子任务（通过 `parentTaskId` 关联）
- **来源**：AI拆分功能自动创建
- **显示条件**：`realSubtasks.length > 0`

### 4. 🔗 后续任务
- **定义**：等待当前任务完成的任务（通过 `waitFor` 关联，排除子任务）
- **来源**：其他任务手动添加的依赖关系
- **显示条件**：`dependentTasks.length > 0`

## 使用场景示例

### 场景1：AI拆分的子任务

```
父任务: "开发新功能"
├─ 📂 父任务: 无
├─ 🔗 前置任务: 无
├─ 🧩 子任务 (3): "设计数据库"、"实现API"、"编写测试"
└─ 🔗 后续任务: 无

子任务: "设计数据库"
├─ 📂 父任务: "开发新功能"
├─ 🔗 前置任务: 无（父任务不显示在这里）
├─ 🧩 子任务: 无
└─ 🔗 后续任务: 无
```

### 场景2：复杂组合

```
任务: "开发阶段"（父任务）
├─ 📂 父任务: 无
├─ 🔗 前置任务: "需求分析"（手动添加）
├─ 🧩 子任务 (3): "功能A"、"功能B"、"功能C"
└─ 🔗 后续任务: "测试阶段"（手动添加，不是子任务）
```

## 优势

1. **清晰分离**：4种关系各司其职，无重复显示
2. **语义明确**：
   - 📂 父任务 = 层级关系（组织结构）
   - 🔗 前置任务 = 时序关系（执行顺序）
   - 🧩 子任务 = 拆解关系（任务分解）
   - 🔗 后续任务 = 影响关系（依赖链）
3. **易于理解**：用户一眼就能看懂任务的完整关系网
4. **灵活组合**：支持复杂的工作流场景

## 总结

通过优化计算属性的过滤逻辑，成功实现了4种任务关系的清晰分离，既保持了数据的完整性（子任务仍然依赖父任务），又避免了UI上的重复显示。
