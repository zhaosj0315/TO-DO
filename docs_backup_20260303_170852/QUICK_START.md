# 父子任务系统 - 快速开始指南

## 🚀 Phase 1 已完成！

核心架构已经就绪，现在可以开始使用父子任务和依赖关系功能了。

---

## 📦 立即体验

### 方式 1：自动数据迁移（推荐）
你的现有任务会在下次登录时自动迁移到新数据结构，无需手动操作。

**验证迁移是否成功**：
```javascript
// 在浏览器控制台执行
const taskStore = useOfflineTaskStore()
const firstTask = taskStore.tasks[0]
console.log('新字段检查:', {
  parentId: firstTask.parentId,
  childrenIds: firstTask.childrenIds,
  dependencies: firstTask.dependencies,
  progress: firstTask.progress
})
```

### 方式 2：手动运行迁移脚本
如果需要立即迁移，可以在控制台执行：
```javascript
// 1. 加载迁移脚本（在 HTML 中添加）
<script src="/scripts/migrate-to-hierarchy.js"></script>

// 2. 执行迁移
await migrateToHierarchy()

// 3. 刷新页面
location.reload()
```

---

## 🎯 核心功能演示

### 1️⃣ 创建父子任务

```javascript
// 获取 store
const taskStore = useOfflineTaskStore()

// 创建父任务
const parent = await taskStore.addTask({
  text: '开发新功能',
  type: 'custom_date',
  category: 'work',
  priority: 'high',
  customDate: '2026-03-01',
  description: '完整的功能开发流程'
})

// 添加子任务
const subtask1 = await taskStore.addSubtask(parent.id, {
  text: '需求分析',
  type: 'today',
  category: 'work',
  priority: 'medium'
})

const subtask2 = await taskStore.addSubtask(parent.id, {
  text: '编码实现',
  type: 'tomorrow',
  category: 'work',
  priority: 'high'
})

console.log('✅ 父任务创建成功，包含 2 个子任务')
```

### 2️⃣ 设置任务依赖

```javascript
// 创建两个任务
const designTask = await taskStore.addTask({
  text: '设计数据库',
  type: 'today',
  category: 'work',
  priority: 'high'
})

const codeTask = await taskStore.addTask({
  text: '编写代码',
  type: 'tomorrow',
  category: 'work',
  priority: 'high'
})

// 设置依赖：编写代码依赖于设计数据库
await taskStore.addDependency(codeTask.id, designTask.id)

console.log('✅ 依赖关系设置成功')
console.log('编写代码任务状态:', taskStore.tasks.find(t => t.id === codeTask.id).dependencyStatus)
// 输出: "blocked"（因为设计数据库还未完成）
```

### 3️⃣ 完成任务并自动更新

```javascript
// 完成设计数据库任务
await taskStore.toggleTaskCompletion(designTask.id)

// 检查编写代码任务的状态
const updatedCodeTask = taskStore.tasks.find(t => t.id === codeTask.id)
console.log('编写代码任务状态:', updatedCodeTask.dependencyStatus)
// 输出: "ready"（前置任务已完成，可以开始了）
console.log('可以开始:', updatedCodeTask.canStart)
// 输出: true
```

### 4️⃣ 批量操作

```javascript
// 完成父任务及所有子任务
await taskStore.completeTaskWithChildren(parent.id)

// 删除任务及所有子任务
await taskStore.deleteTaskWithChildren(parent.id)
```

---

## 🎨 UI 集成建议

虽然 Phase 1 只完成了数据层，但你可以在现有 UI 中临时展示这些信息：

### 在任务卡片中显示子任务数量
```vue
<template>
  <div class="task-card">
    <h3>{{ task.text }}</h3>
    
    <!-- 显示子任务进度 -->
    <div v-if="task.hasChildren" class="subtask-info">
      📊 子任务: {{ task.progress.subtaskCompleted }}/{{ task.progress.subtaskTotal }}
      ({{ task.progress.subtaskPercentage }}%)
    </div>
    
    <!-- 显示依赖状态 -->
    <div v-if="task.dependencyStatus === 'blocked'" class="dependency-warning">
      🔒 等待前置任务完成
    </div>
    
    <div v-if="task.blockingCount > 0" class="blocking-info">
      🔗 阻塞 {{ task.blockingCount }} 个任务
    </div>
  </div>
</template>
```

### 在任务详情中显示依赖关系
```vue
<template>
  <div class="task-detail">
    <!-- 前置任务 -->
    <div v-if="task.dependencies.blockedBy.length > 0">
      <h4>⬆️ 依赖于</h4>
      <ul>
        <li v-for="depId in task.dependencies.blockedBy" :key="depId">
          {{ getTaskById(depId)?.text }}
        </li>
      </ul>
    </div>
    
    <!-- 后置任务 -->
    <div v-if="task.dependencies.blocking.length > 0">
      <h4>⬇️ 阻塞</h4>
      <ul>
        <li v-for="blockId in task.dependencies.blocking" :key="blockId">
          {{ getTaskById(blockId)?.text }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

---

## 🔧 API 参考

### 父子任务管理

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `addSubtask(parentId, subtaskData)` | 父任务ID, 子任务数据 | Promise\<Task\> | 添加子任务 |
| `removeSubtask(parentId, subtaskId)` | 父任务ID, 子任务ID | Promise\<void\> | 移除子任务 |
| `moveSubtask(subtaskId, newParentId)` | 子任务ID, 新父任务ID | Promise\<void\> | 移动子任务 |
| `updateSubtaskProgress(taskId)` | 任务ID | Promise\<void\> | 更新子任务进度 |
| `getSubtasksRecursive(taskId)` | 任务ID | Task[] | 递归获取所有子任务 |

### 依赖关系管理

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `addDependency(taskId, blockedByTaskId)` | 任务ID, 前置任务ID | Promise\<void\> | 添加依赖 |
| `removeDependency(taskId, blockedByTaskId)` | 任务ID, 前置任务ID | Promise\<void\> | 移除依赖 |
| `checkCircularDependency(taskId, targetId)` | 任务ID, 目标ID | Boolean | 检查循环依赖 |
| `updateDependencyStatus(taskId)` | 任务ID | Promise\<void\> | 更新依赖状态 |

### 批量操作

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `completeTaskWithChildren(taskId)` | 任务ID | Promise\<void\> | 完成任务及所有子任务 |
| `deleteTaskWithChildren(taskId)` | 任务ID | Promise\<void\> | 删除任务及所有子任务 |

### 可视化

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `findCriticalPath(taskIds)` | 任务ID数组（可选） | Number[] | 计算关键路径 |
| `getFlattenedTasks()` | 无 | Task[] | 获取扁平化任务列表 |

---

## 📊 数据结构说明

### Task 对象新增字段

```typescript
interface Task {
  // ... 现有字段 ...
  
  // 层级关系
  parentId: number | null          // 父任务ID
  childrenIds: number[]            // 子任务ID列表
  taskLevel: number                // 层级深度（0-2）
  hasChildren: boolean             // 是否有子任务
  isExpanded: boolean              // 是否展开
  
  // 依赖关系
  dependencies: {
    blockedBy: number[]            // 前置任务
    blocking: number[]             // 后置任务
    relatedTo: number[]            // 相关任务
  }
  dependencyStatus: 'independent' | 'blocked' | 'ready'
  canStart: boolean                // 是否可以开始
  blockingCount: number            // 阻塞任务数量
  
  // 进度追踪
  progress: {
    subtaskTotal: number           // 子任务总数
    subtaskCompleted: number       // 已完成子任务数
    subtaskPercentage: number      // 子任务完成百分比
    executionPercentage: number    // 执行进度
    overallPercentage: number      // 综合进度
  }
  
  // 可视化数据
  visualization: {
    gantt: {
      startDate: string            // 开始日期
      endDate: string              // 结束日期
      duration: number             // 时长（天）
      criticalPath: boolean        // 是否在关键路径上
    }
    flowchart: {
      x: number                    // X坐标
      y: number                    // Y坐标
      collapsed: boolean           // 是否折叠
    }
  }
  
  // 智能标签
  tags: string[]                   // 自定义标签
  aiSuggestions: {
    estimatedDuration: number      // AI预估时长
    riskLevel: string              // 风险等级
    suggestedSubtasks: any[]       // 建议的子任务
  }
}
```

---

## ⚠️ 注意事项

1. **层级限制**：最多支持 3 层嵌套（根任务 → 子任务 → 孙任务）
2. **循环依赖**：系统会自动检测并阻止循环依赖
3. **数据一致性**：完成/删除父任务会自动处理所有子任务
4. **性能考虑**：大量任务（>1000）时，关键路径计算可能较慢

---

## 🎉 下一步

Phase 1 的核心功能已经可以使用了！接下来我们将开发：

- **Phase 2**：列表视图增强（缩进显示、展开折叠、子任务 UI）
- **Phase 3**：甘特图视图（项目管理可视化）
- **Phase 4**：流程图视图（团队协作）

现在可以先在控制台测试这些功能，确保一切正常后再进入 Phase 2！

---

## 🐛 遇到问题？

1. 检查控制台是否有错误信息
2. 确认数据迁移是否成功
3. 尝试刷新页面
4. 查看 `docs/PHASE1_IMPLEMENTATION.md` 中的详细测试用例

需要帮助？随时告诉我！
