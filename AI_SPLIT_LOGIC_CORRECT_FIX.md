# AI 拆分逻辑统一修复报告（正确版本）

**日期**: 2026-03-11  
**问题**: 预览模式的 AI 拆分应该复用任务详情的逻辑

---

## 🎯 正确理解

### 模板（你满意的）✅
**任务详情中的 AI 拆分**:
- 使用 prompt 询问数量
- 直接调用 AITaskSplitter.splitTask()
- 显示 SubtaskPreviewModal 预览
- 简单直接，逻辑清晰

### 需要修改的 ❌
**预览模式中的 AI 拆分**:
- 之前使用 SmartTaskSplitter 组件
- 应该改为复用任务详情的逻辑

---

## ✅ 修复方案

### 1. 保持任务详情的逻辑不变（模板）

**handleSplitTask** - 保持原样，只添加 category 继承:
```javascript
const handleSplitTask = async (task) => {
  currentSplittingTask.value = task
  
  // 询问用户想拆分成几个子任务
  const countInput = prompt('请输入要拆分的子任务数量（2-10个）：', '5')
  
  if (countInput === null) return
  
  const subtaskCount = parseInt(countInput)
  
  if (isNaN(subtaskCount) || subtaskCount < 2 || subtaskCount > 10) {
    showNotification('请输入2-10之间的数字', 'error')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = `AI 正在拆解为 ${subtaskCount} 个子任务...`
    
    const splitResult = await AITaskSplitter.splitTask(task.text, task.description, subtaskCount)
    
    if (splitResult.length > 0) {
      // ✅ 添加 category 继承
      const subtasksWithCategory = splitResult.map(item => ({
        ...item,
        category: task.category || 'work'
      }))
      subtasks.value = subtasksWithCategory
      showSubtaskPreview.value = true
      showNotification(`✨ AI 已拆解为 ${splitResult.length} 个子任务`, 'success')
    }
  } catch (error) {
    showNotification(`AI拆解失败：${error.message}`, 'error')
  } finally {
    aiLoading.value = false
  }
}
```

---

### 2. 修改预览模式，复用任务详情的逻辑

**handlePreviewSplit** - 完全复用 handleSplitTask 的逻辑:
```javascript
const handlePreviewSplit = async () => {
  if (!previewTaskData.value) return
  
  // 复用 handleSplitTask 的逻辑
  currentSplittingTask.value = previewTaskData.value
  
  // 询问用户想拆分成几个子任务
  const countInput = prompt('请输入要拆分的子任务数量（2-10个）：', '5')
  
  if (countInput === null) return
  
  const subtaskCount = parseInt(countInput)
  
  if (isNaN(subtaskCount) || subtaskCount < 2 || subtaskCount > 10) {
    showNotification('请输入2-10之间的数字', 'error')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = `AI 正在拆解为 ${subtaskCount} 个子任务...`
    
    const splitResult = await AITaskSplitter.splitTask(
      previewTaskData.value.text, 
      previewTaskData.value.description, 
      subtaskCount
    )
    
    if (splitResult.length > 0) {
      // ✅ 添加 category 继承
      const subtasksWithCategory = splitResult.map(item => ({
        ...item,
        category: previewTaskData.value.category || 'work'
      }))
      subtasks.value = subtasksWithCategory
      showSubtaskPreview.value = true
      showNotification(`✨ AI 已拆解为 ${splitResult.length} 个子任务`, 'success')
    }
  } catch (error) {
    showNotification(`AI拆解失败：${error.message}`, 'error')
  } finally {
    aiLoading.value = false
  }
}
```

---

## 📊 统一后的流程

### 入口1: 任务详情中的 AI 拆分 ✅
```
打开任务详情
  ↓
点击"🤖 AI拆解任务"
  ↓
handleSplitTask(task)
  ↓
prompt 询问数量（2-10个）
  ↓
显示 loading
  ↓
调用 AITaskSplitter.splitTask()
  ↓
添加 category 继承
  ↓
SubtaskPreviewModal 预览
  ↓
编辑子任务（可选）
  ↓
点击"确认创建"
  ↓
保存子任务到数据库
```

### 入口2: 预览模式中的 AI 拆分 ✅
```
创建任务 → 点击预览
  ↓
打开预览模式
  ↓
点击"🤖 AI拆解任务"
  ↓
handlePreviewSplit()
  ↓
prompt 询问数量（2-10个）
  ↓
显示 loading
  ↓
调用 AITaskSplitter.splitTask()
  ↓
添加 category 继承
  ↓
SubtaskPreviewModal 预览
  ↓
编辑子任务（可选）
  ↓
点击"确认创建"
  ↓
先保存父任务 → 再保存子任务
```

**结论**: 两个入口的逻辑完全一致 ✅

---

## 🎯 关键改进

### 1. 添加 category 继承
**修改前**:
```javascript
subtasks.value = splitResult
```

**修改后**:
```javascript
const subtasksWithCategory = splitResult.map(item => ({
  ...item,
  category: task.category || 'work'  // 继承父任务分类
}))
subtasks.value = subtasksWithCategory
```

### 2. 预览模式复用逻辑
**修改前**:
```javascript
const handlePreviewSplit = () => {
  taskToSplit.value = previewTaskData.value
  showTaskSplitter.value = true  // 使用 SmartTaskSplitter
}
```

**修改后**:
```javascript
const handlePreviewSplit = async () => {
  // 完全复用 handleSplitTask 的逻辑
  const countInput = prompt('请输入要拆分的子任务数量（2-10个）：', '5')
  // ... 相同的逻辑
  const splitResult = await AITaskSplitter.splitTask(...)
  // ... 相同的处理
}
```

---

## 🧪 测试场景

### 测试1: 任务详情中的 AI 拆分
1. 创建任务："完成项目报告"，分类："工作"
2. 提交任务
3. 打开任务详情
4. 点击"🤖 AI拆解任务"
5. **验证**: 弹出 prompt 询问数量 ✅
6. 输入"5"
7. **验证**: 显示 loading，生成5个子任务 ✅
8. **验证**: 所有子任务分类都是"工作" ✅
9. 在 SubtaskPreviewModal 中编辑
10. 点击"确认创建"
11. **验证**: 子任务正确保存 ✅

### 测试2: 预览模式中的 AI 拆分
1. 创建任务："学习Vue3"，分类："学习"
2. 点击"预览"按钮
3. 在预览中点击"🤖 AI拆解任务"
4. **验证**: 弹出 prompt 询问数量 ✅
5. 输入"3"
6. **验证**: 显示 loading，生成3个子任务 ✅
7. **验证**: 所有子任务分类都是"学习" ✅
8. 点击"确认创建"
9. **验证**: 父任务和子任务都正确保存 ✅

### 测试3: 对比两个入口
1. 使用入口1拆分任务
2. 使用入口2拆分任务
3. **验证**: 两个入口的交互、逻辑、结果完全一致 ✅

---

## ✅ 验收标准

1. ✅ 两个入口都使用 prompt 询问数量
2. ✅ 两个入口都直接调用 AITaskSplitter.splitTask()
3. ✅ 两个入口都显示 SubtaskPreviewModal
4. ✅ 两个入口都正确继承父任务分类
5. ✅ 逻辑完全一致

---

## 📝 修改文件

- ✅ `src/views/TodoView.vue`
  - 第4805行：`handleSplitTask` 添加 category 继承
  - 第6000行：`handlePreviewSplit` 复用 handleSplitTask 的逻辑

---

## 🎉 总结

### 问题
- 预览模式使用 SmartTaskSplitter 组件
- 任务详情使用 prompt + AITaskSplitter
- 两个入口逻辑不一致

### 解决
- 以任务详情的逻辑为模板
- 预览模式完全复用这套逻辑
- 两个入口都添加 category 继承

### 结果
- ✅ 两个入口逻辑完全一致
- ✅ 都使用 prompt 询问数量
- ✅ 都使用 SubtaskPreviewModal 预览
- ✅ 都正确继承父任务分类
- ✅ 用户体验统一
