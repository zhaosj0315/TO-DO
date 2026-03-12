# 预览模式 AI 拆分分类继承修复报告

**日期**: 2026-03-11  
**问题**: 预览模式（创建任务时点击预览）的 AI 拆分子任务，分类没有继承

---

## 🐛 问题分析

### 两个 AI 拆分入口

#### 入口1: 任务详情中的 AI 拆分 ✅
**流程**:
1. 创建任务后，打开任务详情
2. 点击"🤖 AI拆分"按钮
3. SmartTaskSplitter 弹出
4. 生成子任务，继承父任务分类 ✅

#### 入口2: 预览模式中的 AI 拆分 ❌
**流程**:
1. 创建任务时，点击"预览"按钮
2. TaskDetailModal 以预览模式打开
3. 点击"🤖 AI拆分"按钮
4. SmartTaskSplitter 弹出
5. 生成子任务，分类为空 ❌

---

## 🔍 根本原因

### SmartTaskSplitter 缺少 parent-task 属性

**位置**: `src/views/TodoView.vue` 第2282行

**问题代码**:
```html
<SmartTaskSplitter
  v-if="taskToSplit"
  :visible="showTaskSplitter"
  :task-title="taskToSplit.text"
  :task-description="taskToSplit.description"
  <!-- ❌ 缺少 :parent-task 属性 -->
  @close="showTaskSplitter = false; taskToSplit = null"
  @create="handleSubtaskCreate"
/>
```

**结果**:
- SmartTaskSplitter 的 `props.parentTask` 为 `undefined`
- 生成子任务时 `props.parentTask?.category` 为 `undefined`
- 子任务的 category 默认为 'work'，而不是继承父任务

---

## ✅ 修复方案

### 添加 parent-task 属性

**修改文件**: `src/views/TodoView.vue`

**修复代码**:
```html
<SmartTaskSplitter
  v-if="taskToSplit"
  :visible="showTaskSplitter"
  :task-title="taskToSplit.text"
  :task-description="taskToSplit.description"
  :parent-task="taskToSplit"  <!-- ✅ 添加父任务对象 -->
  @close="showTaskSplitter = false; taskToSplit = null"
  @create="handleSubtaskCreate"
/>
```

**逻辑**:
- 将完整的 `taskToSplit` 对象传递给 SmartTaskSplitter
- SmartTaskSplitter 可以访问 `props.parentTask.category`
- 子任务正确继承父任务的分类

---

## 🧪 测试场景

### 测试1: 预览模式 - 工作类任务拆分
1. 创建任务，标题："完成项目报告"
2. 分类选择："💼 工作"
3. 点击"预览"按钮
4. 在预览中点击"🤖 AI拆分"
5. 生成子任务
6. **验证**: 所有子任务的分类都是"💼 工作" ✅

### 测试2: 预览模式 - 学习类任务拆分
1. 创建任务，标题："学习Vue3"
2. 分类选择："📚 学习"
3. 点击"预览"按钮
4. 在预览中点击"🤖 AI拆分"
5. 生成子任务
6. **验证**: 所有子任务的分类都是"📚 学习" ✅

### 测试3: 任务详情 - 生活类任务拆分
1. 创建任务，标题："周末大扫除"
2. 分类选择："🏠 生活"
3. 提交任务
4. 打开任务详情
5. 点击"🤖 AI拆分"
6. 生成子任务
7. **验证**: 所有子任务的分类都是"🏠 生活" ✅

### 测试4: 对比两个入口的一致性
1. 创建"工作"类任务
2. **入口1**: 提交后打开详情 → AI拆分 → 验证分类 ✅
3. 创建另一个"工作"类任务
4. **入口2**: 点击预览 → AI拆分 → 验证分类 ✅
5. **验证**: 两个入口的子任务分类都正确继承 ✅

---

## ✅ 验收标准

1. ✅ 预览模式的 AI 拆分继承父任务分类
2. ✅ 任务详情的 AI 拆分继承父任务分类
3. ✅ 两个入口的逻辑完全一致
4. ✅ 子任务可以在预览中修改分类
5. ✅ 创建后分类正确保存

---

## 📝 修改文件

- ✅ `src/views/TodoView.vue`
  - 第2286行：添加 `:parent-task="taskToSplit"`

---

## 🎯 两个入口对比

### 入口1: 任务详情（已有任务）
```
创建任务 → 提交 → 打开详情 → 点击"🤖 AI拆分"
↓
SmartTaskSplitter (parent-task = selectedTask)
↓
生成子任务 (category = selectedTask.category)
↓
SubtaskPreviewModal 预览
↓
确认创建 → 保存到数据库
```

### 入口2: 预览模式（未提交任务）
```
创建任务 → 点击"预览" → 打开预览 → 点击"🤖 AI拆分"
↓
SmartTaskSplitter (parent-task = previewTaskData)  ← 修复后
↓
生成子任务 (category = previewTaskData.category)
↓
SubtaskPreviewModal 预览
↓
确认创建 → 先保存父任务 → 再保存子任务
```

---

## 🔄 完整流程（修复后）

### 预览模式创建任务 + AI 拆分
1. 用户输入任务标题和描述
2. 选择分类（如"工作"）
3. 点击"预览"按钮
4. TaskDetailModal 以预览模式打开
5. 用户点击"🤖 AI拆分"
6. `handlePreviewSplit()` 被调用
7. 设置 `taskToSplit.value = previewTaskData.value`
8. 打开 SmartTaskSplitter，传入 `:parent-task="taskToSplit"`
9. SmartTaskSplitter 生成子任务，继承 `props.parentTask.category`
10. SubtaskPreviewModal 显示子任务预览
11. 用户确认创建
12. `handleSubtaskCreate()` 被调用
13. 检测到 `showTaskInputPreview.value === true`
14. 先保存父任务 `await taskStore.addTask(previewTaskData.value)`
15. 再保存子任务，设置 `parentTaskId`
16. 关闭预览，返回首页

---

## 🎉 总结

### 问题
- 预览模式的 AI 拆分子任务，分类没有继承父任务

### 原因
- SmartTaskSplitter 缺少 `:parent-task` 属性
- `props.parentTask` 为 `undefined`
- 无法访问父任务的 category

### 解决
- 添加 `:parent-task="taskToSplit"`
- SmartTaskSplitter 可以访问完整的父任务对象
- 子任务正确继承 `props.parentTask.category`

### 结果
- ✅ 预览模式和任务详情的 AI 拆分逻辑完全一致
- ✅ 两个入口都正确继承父任务分类
- ✅ 用户体验统一
