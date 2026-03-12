# AI 拆分子任务分类继承修复报告

**日期**: 2026-03-11  
**问题**: AI 拆分子任务后，分类（工作/学习/生活）为空

---

## 🐛 问题分析

### 问题现象
- 在任务详情中点击"🤖 AI拆分"
- AI 生成子任务后，分类字段为空
- 应该继承父任务的分类

### 根本原因

#### 1. SmartTaskSplitter 生成子任务时缺少 category
**位置**: `src/components/SmartTaskSplitter.vue` 第200行

**问题代码**:
```javascript
subtasks.value = result.map(item => ({
  title: item.title || item.text || '',
  description: item.description || '',
  priority: item.priority || 'medium',
  estimatedHours: item.estimatedHours || 1
  // ❌ 缺少 category 字段
}))
```

#### 2. SubtaskPreviewModal 初始化时缺少默认值
**位置**: `src/components/SubtaskPreviewModal.vue` 第245行

**问题代码**:
```javascript
localSubtasks.value = JSON.parse(JSON.stringify(newSubtasks)).map(task => ({
  ...task,
  type: task.type || 'today',
  // ❌ 缺少 category 默认值
  weekdays: task.weekdays || [],
  // ...
}))
```

---

## ✅ 修复方案

### 修复1: SmartTaskSplitter 继承父任务分类

**修改文件**: `src/components/SmartTaskSplitter.vue`

**修复代码**:
```javascript
subtasks.value = result.map(item => ({
  title: item.title || item.text || '',
  description: item.description || '',
  priority: item.priority || 'medium',
  estimatedHours: item.estimatedHours || 1,
  category: props.parentTask?.category || 'work'  // ✅ 继承父任务的分类
}))
```

**逻辑**:
- 优先使用父任务的 category
- 如果父任务没有 category，默认为 'work'

---

### 修复2: SubtaskPreviewModal 添加默认分类

**修改文件**: `src/components/SubtaskPreviewModal.vue`

**修复代码**:
```javascript
localSubtasks.value = JSON.parse(JSON.stringify(newSubtasks)).map(task => ({
  ...task,
  type: task.type || 'today',
  category: task.category || 'work',  // ✅ 确保有默认分类
  weekdays: task.weekdays || [],
  // ...
}))
```

**逻辑**:
- 如果子任务已有 category，保持不变
- 如果没有，默认为 'work'

---

## 🧪 测试场景

### 测试1: 工作类任务拆分
1. 创建一个"工作"分类的任务
2. 打开任务详情
3. 点击"🤖 AI拆分"
4. 生成子任务
5. **验证**: 所有子任务的分类都是"💼 工作" ✅

### 测试2: 学习类任务拆分
1. 创建一个"学习"分类的任务
2. 打开任务详情
3. 点击"🤖 AI拆分"
4. 生成子任务
5. **验证**: 所有子任务的分类都是"📚 学习" ✅

### 测试3: 生活类任务拆分
1. 创建一个"生活"分类的任务
2. 打开任务详情
3. 点击"🤖 AI拆分"
4. 生成子任务
5. **验证**: 所有子任务的分类都是"🏠 生活" ✅

### 测试4: 修改子任务分类
1. AI 拆分后，在预览中修改某个子任务的分类
2. 从"工作"改为"学习"
3. 点击"确认创建"
4. **验证**: 该子任务的分类正确保存为"学习" ✅

---

## ✅ 验收标准

1. ✅ AI 拆分时子任务继承父任务的分类
2. ✅ 如果父任务没有分类，默认为"工作"
3. ✅ 子任务预览中分类选择器显示正确
4. ✅ 可以在预览中修改子任务分类
5. ✅ 创建后分类正确保存

---

## 📝 修改文件

1. ✅ `src/components/SmartTaskSplitter.vue`
   - 第200行：添加 `category: props.parentTask?.category || 'work'`

2. ✅ `src/components/SubtaskPreviewModal.vue`
   - 第247行：添加 `category: task.category || 'work'`

---

## 🎯 继承逻辑总结

### 子任务继承的属性

#### 从父任务继承
- ✅ **category** (分类) - 工作/学习/生活
- ✅ **collectionId** (笔记本) - 自动继承
- ✅ **parentTaskId** (父任务ID) - 自动设置

#### AI 生成
- ✅ **title** (标题) - AI 生成
- ✅ **description** (描述) - AI 生成
- ✅ **priority** (优先级) - AI 生成或默认"中"
- ✅ **estimatedHours** (预计时长) - AI 生成或默认1小时

#### 用户设置
- ✅ **type** (时间安排) - 默认"今天"，可修改
- ✅ **weekdays** (周期) - 仅 weekly 类型
- ✅ **monthDay** (每月几号) - 仅 monthly 类型
- ✅ **customDate/customTime** (指定日期) - 仅 custom_date 类型

---

## 🎉 总结

### 问题
- AI 拆分子任务时，分类字段为空

### 原因
1. SmartTaskSplitter 生成子任务时没有设置 category
2. SubtaskPreviewModal 初始化时没有默认值

### 解决
1. SmartTaskSplitter 继承父任务的 category
2. SubtaskPreviewModal 添加默认值 'work'

### 结果
- ✅ 子任务正确继承父任务的分类
- ✅ 用户可以在预览中修改分类
- ✅ 分类正确保存到数据库
