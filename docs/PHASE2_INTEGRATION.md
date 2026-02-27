# Phase 2 集成指南

## 已创建的组件

1. ✅ `SubtaskManager.vue` - 子任务管理组件
2. ✅ `DependencyManager.vue` - 依赖关系管理组件
3. ✅ `AddSubtaskModal.vue` - 添加子任务弹窗
4. ✅ `AddDependencyModal.vue` - 添加依赖关系弹窗

---

## 集成步骤

### Step 1: 在 TodoView.vue 中导入组件

在 `<script setup>` 部分添加：

```javascript
import SubtaskManager from '../components/SubtaskManager.vue'
import DependencyManager from '../components/DependencyManager.vue'
import AddSubtaskModal from '../components/AddSubtaskModal.vue'
import AddDependencyModal from '../components/AddDependencyModal.vue'
```

### Step 2: 添加状态变量

在 `<script setup>` 中添加：

```javascript
// 子任务和依赖关系相关状态
const showAddSubtaskModal = ref(false)
const showAddDependencyModal = ref(false)
const currentParentTask = ref(null)
const currentDependencyTask = ref(null)
```

### Step 3: 修改任务列表渲染

将 `paginatedTasks` 改为使用扁平化列表：

```javascript
// 使用扁平化任务列表（支持层级显示）
const flattenedTasks = computed(() => {
  return taskStore.getFlattenedTasks()
})

// 分页后的扁平化任务
const paginatedTasks = computed(() => {
  const filtered = flattenedTasks.value.filter(t => {
    // 应用现有的筛选逻辑
    let match = true
    
    // 状态筛选
    if (currentFilter.value !== 'all') {
      match = match && t.status === currentFilter.value
    }
    
    // 分类筛选
    if (currentCategoryFilter.value !== 'all') {
      match = match && t.category === currentCategoryFilter.value
    }
    
    // 优先级筛选
    if (currentPriorityFilter.value !== 'all') {
      match = match && t.priority === currentPriorityFilter.value
    }
    
    // 关键字搜索
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase().trim()
      match = match && (
        t.text.toLowerCase().includes(keyword) || 
        (t.description && t.description.toLowerCase().includes(keyword))
      )
    }
    
    return match
  })
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})
```

### Step 4: 修改任务卡片样式（添加缩进）

在任务列表的 `<li>` 标签中添加缩进样式：

```vue
<li 
  v-for="task in paginatedTasks" 
  :key="task.id"
  class="task-item"
  :class="{
    'task-completed': task.status === TaskStatus.COMPLETED,
    'task-overdue': task.status === TaskStatus.OVERDUE
  }"
  :style="{ paddingLeft: (task.renderLevel * 20 + 16) + 'px' }"
>
  <!-- 层级指示器 -->
  <div v-if="task.renderLevel > 0" class="level-indicator">
    <span class="level-line"></span>
    <span class="level-dot"></span>
  </div>
  
  <!-- 原有的任务内容 -->
  <!-- ... -->
</li>
```

### Step 5: 在任务详情弹窗中集成组件

在 `TaskDetailModal.vue` 或任务详情区域添加：

```vue
<template>
  <div class="task-detail-modal">
    <!-- 原有的任务信息 -->
    <!-- ... -->
    
    <!-- 子任务管理 -->
    <SubtaskManager
      :task="editingTask"
      :all-tasks="taskStore.tasks"
      @toggle-subtask="handleToggleSubtask"
      @open-subtask="openTaskDetail"
      @delete-subtask="handleDeleteSubtask"
      @toggle-expand="handleToggleExpand"
      @add-subtask="handleAddSubtask"
      @ai-split="handleAISplit"
    />
    
    <!-- 依赖关系管理 -->
    <DependencyManager
      :task="editingTask"
      :all-tasks="taskStore.tasks"
      @open-task="openTaskDetail"
      @remove-dependency="handleRemoveDependency"
      @add-dependency="handleAddDependency"
    />
  </div>
</template>
```

### Step 6: 添加事件处理方法

```javascript
// 切换子任务完成状态
const handleToggleSubtask = async (subtaskId) => {
  await taskStore.toggleTaskCompletion(subtaskId)
}

// 删除子任务
const handleDeleteSubtask = async (subtaskId) => {
  if (confirm('确定删除这个子任务吗？')) {
    await taskStore.deleteTask(subtaskId)
  }
}

// 切换子任务展开/折叠
const handleToggleExpand = async (taskId) => {
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (task) {
    task.isExpanded = !task.isExpanded
    await taskStore.saveTasks()
  }
}

// 打开添加子任务弹窗
const handleAddSubtask = (parentId) => {
  currentParentTask.value = taskStore.tasks.find(t => t.id === parentId)
  showAddSubtaskModal.value = true
}

// 提交添加子任务
const handleSubmitSubtask = async (formData) => {
  try {
    await taskStore.addSubtask(currentParentTask.value.id, formData)
    showAddSubtaskModal.value = false
    // 显示成功提示
    alert('子任务添加成功！')
  } catch (error) {
    alert(error.message)
  }
}

// AI 分解任务
const handleAISplit = async (task) => {
  // 调用现有的 AI 任务分解功能
  // 这里可以复用 SmartTaskSplitter 组件的逻辑
  console.log('AI 分解任务:', task)
}

// 打开添加依赖关系弹窗
const handleAddDependency = (taskId) => {
  currentDependencyTask.value = taskStore.tasks.find(t => t.id === taskId)
  showAddDependencyModal.value = true
}

// 提交添加依赖关系
const handleSubmitDependency = async (selectedTaskIds) => {
  try {
    for (const depId of selectedTaskIds) {
      await taskStore.addDependency(currentDependencyTask.value.id, depId)
    }
    showAddDependencyModal.value = false
    alert(`成功添加 ${selectedTaskIds.length} 个依赖关系！`)
  } catch (error) {
    alert(error.message)
  }
}

// 移除依赖关系
const handleRemoveDependency = async (taskId, depId) => {
  if (confirm('确定移除这个依赖关系吗？')) {
    await taskStore.removeDependency(taskId, depId)
  }
}
```

### Step 7: 添加弹窗组件到模板

在 `<template>` 的底部添加：

```vue
<!-- 添加子任务弹窗 -->
<AddSubtaskModal
  v-if="currentParentTask"
  :visible="showAddSubtaskModal"
  :parent-task="currentParentTask"
  @close="showAddSubtaskModal = false"
  @submit="handleSubmitSubtask"
/>

<!-- 添加依赖关系弹窗 -->
<AddDependencyModal
  v-if="currentDependencyTask"
  :visible="showAddDependencyModal"
  :current-task="currentDependencyTask"
  @close="showAddDependencyModal = false"
  @submit="handleSubmitDependency"
/>
```

### Step 8: 添加 CSS 样式

在 `<style scoped>` 中添加：

```css
/* 层级指示器 */
.level-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-line {
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 50%;
  width: 1px;
  background: rgba(139, 92, 246, 0.3);
}

.level-dot {
  width: 6px;
  height: 6px;
  background: #8b5cf6;
  border-radius: 50%;
  z-index: 1;
}

/* 子任务样式 */
.task-item[style*="paddingLeft"] {
  position: relative;
  border-left: 2px solid rgba(139, 92, 246, 0.1);
}

.task-item[style*="paddingLeft"]:hover {
  border-left-color: rgba(139, 92, 246, 0.3);
}
```

---

## 快速测试

### 测试 1：添加子任务
1. 打开任意任务详情
2. 点击"➕ 添加子任务"按钮
3. 填写子任务信息并提交
4. 查看任务列表，子任务应该显示在父任务下方（带缩进）

### 测试 2：添加依赖关系
1. 打开任意任务详情
2. 点击"🔗 添加依赖关系"按钮
3. 选择前置任务并提交
4. 查看依赖状态提示（🔒 被阻塞）

### 测试 3：完成前置任务
1. 完成前置任务
2. 查看后置任务的依赖状态（应该变为 ✅ 可以开始）

---

## 注意事项

1. **性能优化**：如果任务数量超过 1000，考虑使用虚拟滚动
2. **数据一致性**：所有操作都会自动保存到本地存储
3. **错误处理**：循环依赖会自动检测并阻止
4. **UI 反馈**：建议使用 Toast 提示替代 alert

---

## 下一步优化

1. **拖拽排序**：支持拖拽调整任务顺序和层级
2. **批量操作**：支持批量添加子任务
3. **快捷键**：支持键盘快捷键操作
4. **动画效果**：添加展开/折叠动画

---

需要我帮你实际集成到 TodoView.vue 中吗？
