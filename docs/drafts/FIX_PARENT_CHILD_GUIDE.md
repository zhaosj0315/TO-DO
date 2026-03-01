# 修复任务父子关系指南

## 问题描述

如果你的任务详情页面中：
- ✅ 显示了"🔗 前置任务"和"🔗 后续任务"
- ❌ 但没有显示"📂 父任务"和"🧩 子任务"
- ❌ 后续任务数量很多（如25个）

这说明这些任务是在父子任务系统实现之前创建的，需要手动修复。

## 原因分析

在父子任务系统实现之前，AI拆分的任务只设置了 `waitFor` 依赖关系，没有设置 `parentTaskId` 和 `subtasks` 字段。

### 数据结构对比

**旧数据（需要修复）**：
```javascript
父任务: {
  id: 1001,
  text: "深入学习Composition API",
  waitFor: [],
  parentTaskId: null,     // ❌ 缺失
  subtasks: []            // ❌ 缺失
}

子任务: {
  id: 2001,
  text: "制定学习目标",
  waitFor: [1001],        // ✅ 有依赖关系
  parentTaskId: null,     // ❌ 缺失
  subtasks: []
}
```

**新数据（正确）**：
```javascript
父任务: {
  id: 1001,
  text: "深入学习Composition API",
  waitFor: [],
  parentTaskId: null,
  subtasks: [2001, 2002, ...]  // ✅ 记录子任务
}

子任务: {
  id: 2001,
  text: "制定学习目标",
  waitFor: [1001],
  parentTaskId: 1001,     // ✅ 记录父任务
  subtasks: []
}
```

## 修复方法

### 方法1：使用批量修复脚本（推荐）

1. 打开应用
2. 按 `F12` 打开浏览器控制台
3. 复制以下脚本并粘贴到控制台：

```javascript
// 批量修复所有任务的父子关系
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore

if (taskStore) {
  let fixedCount = 0
  const fixes = []
  
  taskStore.tasks.forEach(task => {
    const waitingTasks = taskStore.getWaitingTasks(task.id)
    const potentialChildren = waitingTasks.filter(t => !t.parentTaskId)
    
    if (potentialChildren.length > 0) {
      fixes.push({ parent: task, children: potentialChildren })
    }
  })
  
  if (fixes.length > 0) {
    console.log(`发现 ${fixes.length} 个任务需要修复`)
    
    fixes.forEach(fix => {
      const subtaskIds = []
      fix.children.forEach(child => {
        child.parentTaskId = fix.parent.id
        subtaskIds.push(child.id)
        fixedCount++
      })
      fix.parent.subtasks = subtaskIds
    })
    
    await taskStore.saveTasks()
    console.log(`✅ 修复完成！共修复 ${fixedCount} 个任务`)
    alert('修复完成！请刷新页面查看效果')
  } else {
    console.log('✅ 所有任务都正确，无需修复')
  }
} else {
  console.error('❌ 无法获取 taskStore')
}
```

4. 按 `Enter` 执行
5. 刷新页面

### 方法2：使用详细修复脚本

如果你想查看详细的修复过程，可以使用：

```bash
# 在浏览器控制台中运行
# 复制 scripts/batch-fix-parent-child.js 的内容到控制台
```

### 方法3：手动修复单个任务

如果只想修复某个特定任务：

```javascript
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore

// 查找任务
const parentTask = taskStore.tasks.find(t => t.text.includes('深入学习Composition API'))
const waitingTasks = taskStore.getWaitingTasks(parentTask.id)
const children = waitingTasks.filter(t => !t.parentTaskId)

// 设置父子关系
const subtaskIds = []
children.forEach(child => {
  child.parentTaskId = parentTask.id
  subtaskIds.push(child.id)
})
parentTask.subtasks = subtaskIds

// 保存
await taskStore.saveTasks()
console.log('✅ 修复完成')
```

## 验证修复结果

修复后，打开任务详情页面，应该看到：

```
🔗 任务关系

📂 父任务
（如果是子任务，显示父任务）

🔗 前置任务 (0)
（手动添加的依赖，排除父任务）

🧩 子任务 (25)
等待本任务完成后才能开始
- 制定学习目标与资料搜集
- 学习并实现Composition API示例
- ...

🔗 后续任务 (0)
（手动添加的依赖，排除子任务）
```

## 注意事项

1. **备份数据**：修复前建议先导出任务数据备份
2. **一次性操作**：修复脚本只需运行一次
3. **刷新页面**：修复后必须刷新页面才能看到效果
4. **不影响功能**：即使不修复，任务的依赖关系仍然有效，只是UI显示不够清晰

## 为什么需要修复？

修复后的好处：

1. **清晰的层级结构**：父子任务分离显示，一目了然
2. **更好的UI体验**：
   - 📂 父任务区域：显示任务来源
   - 🧩 子任务区域：显示任务拆解
   - 🔗 前置/后续任务：只显示手动依赖
3. **避免混淆**：25个后续任务变成25个子任务，语义更准确

## 常见问题

### Q1: 修复后数据会丢失吗？
A: 不会。修复只是添加 `parentTaskId` 和 `subtasks` 字段，不会删除任何数据。

### Q2: 修复失败怎么办？
A: 如果修复失败，可以从备份中恢复数据，或者手动删除错误的任务重新创建。

### Q3: 新创建的任务还需要修复吗？
A: 不需要。新创建的任务（v1.7.7之后）会自动设置正确的父子关系。

### Q4: 可以撤销修复吗？
A: 可以。手动将 `parentTaskId` 设置为 `null`，将 `subtasks` 设置为 `[]` 即可。

## 总结

如果你的任务是在父子任务系统实现之前创建的，使用批量修复脚本可以快速修复所有任务的父子关系，让任务详情页面显示更加清晰。
