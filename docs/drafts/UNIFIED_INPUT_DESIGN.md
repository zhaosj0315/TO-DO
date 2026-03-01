# 统一输入框设计方案（修订版）

## 🎯 核心理解

**使用描述输入框（textarea）作为统一输入框**，因为：
- ✅ 支持多行输入
- ✅ 已有全屏放大功能（⛶按钮）
- ✅ 可以灵活调整大小

**删除标题输入框**，只保留一个textarea。

## 📝 设计方案

### 方案：基于现有描述输入框改造

#### 1. UI结构
```vue
<!-- 删除原来的标题输入框 -->
<!-- <input v-model="newTaskText" class="task-input-main"> -->

<!-- 只保留描述输入框，改造为统一输入框 -->
<div class="unified-input-wrapper">
  <textarea 
    v-model="unifiedInput"
    class="unified-task-input"
    placeholder="第一行：任务标题&#10;后续行：任务描述（可选）&#10;&#10;💡 点击 ⛶ 可全屏编辑"
    rows="3"
    @input="handleUnifiedInput"
  ></textarea>
  <div class="input-buttons">
    <button class="btn-ai-assist" @click="triggerAIAssist" title="AI分类建议">🤖</button>
    <button class="btn-ai-desc" @click="generateDescription" title="AI生成描述">✨</button>
    <button class="btn-camera" @click="scanTextFromCamera" title="拍照识别">📷</button>
    <button class="btn-fullscreen" @click="openFullscreenInput" title="全屏编辑">⛶</button>
  </div>
</div>
```

#### 2. CSS样式（第一行视觉区分）
```css
.unified-task-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  
  /* 第一行浅紫色背景 */
  background: 
    linear-gradient(
      to bottom,
      rgba(102, 126, 234, 0.06) 0%,
      rgba(102, 126, 234, 0.06) 1.6em,
      transparent 1.6em
    );
}

.unified-task-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  
  /* 聚焦时第一行背景加深 */
  background: 
    linear-gradient(
      to bottom,
      rgba(102, 126, 234, 0.1) 0%,
      rgba(102, 126, 234, 0.1) 1.6em,
      transparent 1.6em
    );
}

/* 按钮组 */
.input-buttons {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.input-buttons button {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.input-buttons button:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.1);
}
```

#### 3. JavaScript逻辑
```javascript
// 统一输入框内容
const unifiedInput = ref('')

// 实时解析输入内容
const handleUnifiedInput = () => {
  const { title, description } = parseUnifiedInput(unifiedInput.value)
  
  // 同步到原有变量（保持兼容性）
  newTaskText.value = title
  newTaskDescription.value = description
}

// 解析函数
const parseUnifiedInput = (text) => {
  if (!text) return { title: '', description: '' }
  
  const lines = text.split('\n')
  const title = lines[0]?.trim() || ''
  const description = lines.slice(1).join('\n').trim()
  
  return { title, description }
}

// 全屏编辑（保留原有功能）
const openFullscreenInput = () => {
  showFullscreenDesc.value = true
  fullscreenDescContent.value = unifiedInput.value
}

// 全屏编辑保存
const saveFullscreenDesc = () => {
  unifiedInput.value = fullscreenDescContent.value
  handleUnifiedInput() // 重新解析
  showFullscreenDesc.value = false
}

// AI生成描述（基于第一行标题）
const generateDescription = async () => {
  const { title } = parseUnifiedInput(unifiedInput.value)
  
  if (!title) {
    alert('请先输入任务标题（第一行）')
    return
  }
  
  aiLoading.value = true
  try {
    const generatedDesc = await AITaskGenerator.generateDescription(title)
    
    // 将生成的描述追加到第一行后面
    unifiedInput.value = `${title}\n${generatedDesc}`
    handleUnifiedInput()
    
    showNotification('✨ AI 已生成任务描述', 'success')
  } catch (error) {
    alert(`AI生成失败：${error.message}`)
  } finally {
    aiLoading.value = false
  }
}

// AI分类建议（基于第一行标题）
const triggerAIAssist = async () => {
  const { title, description } = parseUnifiedInput(unifiedInput.value)
  
  if (!title || title.length < 3) {
    alert('请先输入任务标题（至少3个字符）')
    return
  }
  
  aiLoading.value = true
  try {
    const classification = await AIClassifier.classifyTask(title, description)
    aiSuggestion.value = classification
  } catch (error) {
    console.error('AI分类失败:', error)
  } finally {
    aiLoading.value = false
  }
}

// 拍照OCR（识别结果作为第一行）
const scanTextFromCamera = async () => {
  try {
    const text = await captureAndRecognize()
    
    // 如果已有内容，追加到后面；否则作为第一行
    if (unifiedInput.value.trim()) {
      unifiedInput.value = `${text}\n${unifiedInput.value}`
    } else {
      unifiedInput.value = text
    }
    
    handleUnifiedInput()
  } catch (error) {
    alert('拍照识别失败')
  }
}

// 添加任务
const addTask = async () => {
  const { title, description } = parseUnifiedInput(unifiedInput.value)
  
  if (!title) {
    alert('请输入任务标题（第一行）')
    return
  }
  
  await taskStore.addTask({
    text: title,
    description: description,
    type: newTaskType.value,
    category: newTaskCategory.value,
    priority: newTaskPriority.value,
    // ... 其他字段
  })
  
  // 清空输入框
  unifiedInput.value = ''
  newTaskText.value = ''
  newTaskDescription.value = ''
  
  showNotification('✅ 任务已添加', 'success')
}
```

## 📊 使用场景

### 场景1：快速输入（只输入标题）
```
用户输入：
完成项目报告

解析结果：
title: "完成项目报告"
description: ""
```

### 场景2：详细输入（标题+描述）
```
用户输入：
完成项目报告
整理Q1季度数据，制作图表，撰写报告。

解析结果：
title: "完成项目报告"
description: "整理Q1季度数据，制作图表，撰写报告。"
```

### 场景3：全屏编辑（点击⛶按钮）
```
1. 点击 ⛶ 按钮
2. 全屏编辑器打开
3. 输入多行内容：
   完成项目报告
   整理Q1季度数据，包括：
   - 项目进度
   - 成果展示
   - 问题分析
   制作数据图表，撰写报告初稿。
4. 保存后自动解析
```

## ✨ 功能保留

### 1. 全屏编辑（⛶按钮）
- ✅ 保留原有全屏编辑功能
- ✅ 全屏编辑器显示完整内容
- ✅ 保存后自动解析标题和描述

### 2. AI功能
- ✅ AI分类建议（🤖）：基于第一行标题
- ✅ AI生成描述（✨）：基于第一行标题生成描述
- ✅ 拍照OCR（📷）：识别结果作为第一行

### 3. 视觉提示
- ✅ 第一行浅紫色背景
- ✅ 聚焦时背景加深
- ✅ 占位符提示用法

## 🎯 优势总结

1. **简化UI**: 删除标题输入框，只保留一个textarea
2. **保留功能**: 全屏编辑、AI功能、OCR功能全部保留
3. **直观清晰**: 第一行自动识别为标题（浅紫色背景）
4. **灵活输入**: 
   - 快速输入：只输入一行（标题）
   - 详细输入：输入多行（标题+描述）
   - 全屏编辑：点击⛶按钮展开编辑
5. **兼容性好**: 保持所有现有功能不变

## 🚀 实施步骤

1. ✅ 删除标题输入框（`<input class="task-input-main">`）
2. ✅ 改造描述输入框为统一输入框
3. ✅ 添加第一行背景色样式
4. ✅ 实现解析逻辑（第一行=标题）
5. ✅ 更新所有相关函数（AI、OCR、添加任务等）
6. ✅ 保留全屏编辑功能
7. ✅ 测试所有功能

## 💡 用户引导

**占位符文字**:
```
第一行：任务标题
后续行：任务描述（可选）

💡 点击 ⛶ 可全屏编辑
```

**首次使用提示**:
```
💡 小贴士：
• 第一行会自动识别为任务标题
• 后续行为任务描述（可选）
• 点击 ⛶ 按钮可全屏编辑
```

## 🎨 设计方案

### 方案A：纯CSS样式（推荐）⭐

**实现方式**:
- 使用 `contenteditable` div 替代 textarea
- 用 CSS `::first-line` 伪元素加粗第一行
- JavaScript 解析第一行为标题，其余为描述

**优点**:
- ✅ 实现简单，无需复杂逻辑
- ✅ 用户体验流畅
- ✅ 视觉效果清晰

**缺点**:
- ❌ `::first-line` 只支持部分CSS属性
- ❌ 需要手动处理换行和光标

### 方案B：动态渲染（备选）

**实现方式**:
- 使用 textarea，监听输入事件
- 实时解析第一行，动态添加样式标记
- 保存时拆分为标题和描述

**优点**:
- ✅ 完全控制样式
- ✅ 兼容性好

**缺点**:
- ❌ 实现复杂
- ❌ 性能开销大

### 方案C：Markdown风格（最优）⭐⭐⭐

**实现方式**:
- 使用 textarea
- 第一行自动识别为标题（加粗显示）
- 用 CSS 实现第一行加粗效果
- 保存时自动拆分

**优点**:
- ✅ 简单直观
- ✅ 符合用户习惯
- ✅ 易于实现

**缺点**:
- ❌ 需要自定义CSS

## 🔧 推荐实现方案（方案C）

### 1. UI结构
```vue
<div class="unified-input-wrapper">
  <textarea 
    v-model="unifiedInput"
    class="unified-task-input"
    placeholder="第一行：任务标题（加粗）&#10;后续行：任务描述（可选）"
    rows="3"
    @input="handleUnifiedInput"
  ></textarea>
  <div class="input-buttons">
    <button class="btn-ai-assist" @click="triggerAIAssist">🤖</button>
    <button class="btn-camera" @click="scanTextFromCamera">📷</button>
    <button class="btn-fullscreen" @click="openFullscreenInput">⛶</button>
  </div>
</div>
```

### 2. CSS样式
```css
.unified-task-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}

/* 第一行加粗效果（通过背景渐变模拟） */
.unified-task-input {
  background: linear-gradient(
    to bottom,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(102, 126, 234, 0.05) 1.6em,
    transparent 1.6em
  );
  font-weight: 400;
}

/* 占位符样式 */
.unified-task-input::placeholder {
  color: #999;
  font-weight: 400;
}

/* 聚焦效果 */
.unified-task-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

### 3. JavaScript逻辑
```javascript
// 统一输入框内容
const unifiedInput = ref('')

// 解析输入内容
const parseUnifiedInput = (text) => {
  const lines = text.split('\n')
  const title = lines[0]?.trim() || ''
  const description = lines.slice(1).join('\n').trim()
  
  return { title, description }
}

// 处理输入事件
const handleUnifiedInput = () => {
  const { title, description } = parseUnifiedInput(unifiedInput.value)
  
  // 实时更新到原有变量（保持兼容性）
  newTaskText.value = title
  newTaskDescription.value = description
}

// 添加任务时使用解析后的数据
const addTask = async () => {
  const { title, description } = parseUnifiedInput(unifiedInput.value)
  
  if (!title) {
    alert('请输入任务标题')
    return
  }
  
  // 使用解析后的标题和描述
  await taskStore.addTask({
    text: title,
    description: description,
    // ... 其他字段
  })
  
  // 清空输入框
  unifiedInput.value = ''
}
```

### 4. 视觉增强（可选）
```javascript
// 动态添加第一行加粗效果
const enhanceFirstLine = () => {
  const textarea = document.querySelector('.unified-task-input')
  const text = textarea.value
  const lines = text.split('\n')
  
  if (lines.length > 0 && lines[0].trim()) {
    // 第一行有内容时，添加视觉提示
    textarea.classList.add('has-title')
  } else {
    textarea.classList.remove('has-title')
  }
}
```

```css
/* 有标题时的样式 */
.unified-task-input.has-title {
  background: linear-gradient(
    to bottom,
    rgba(102, 126, 234, 0.08) 0%,
    rgba(102, 126, 234, 0.08) 1.6em,
    transparent 1.6em
  );
}
```

## 📊 实现效果

### 输入示例
```
完成项目报告
整理Q1季度项目数据，包括进度、成果、问题和改进建议。
制作数据图表，撰写报告初稿，提交给团队审阅。
```

### 解析结果
```javascript
{
  title: "完成项目报告",
  description: "整理Q1季度项目数据，包括进度、成果、问题和改进建议。\n制作数据图表，撰写报告初稿，提交给团队审阅。"
}
```

### 视觉效果
```
┌─────────────────────────────────────┐
│ 完成项目报告 ← 第一行（浅紫色背景） │
│ 整理Q1季度项目数据，包括进度、成果、│
│ 问题和改进建议。制作数据图表，撰写  │
│ 报告初稿，提交给团队审阅。          │
└─────────────────────────────────────┘
```

## 🔄 兼容性处理

### 保持现有功能
```javascript
// AI分类建议
const triggerAIAssist = async () => {
  const { title } = parseUnifiedInput(unifiedInput.value)
  if (!title) {
    alert('请先输入任务标题')
    return
  }
  // 使用 title 调用AI分类
}

// AI生成描述
const generateDescription = async () => {
  const { title } = parseUnifiedInput(unifiedInput.value)
  if (!title) {
    alert('请先输入任务标题')
    return
  }
  
  const generatedDesc = await AITaskGenerator.generateDescription(title)
  
  // 将生成的描述追加到输入框
  unifiedInput.value = `${title}\n${generatedDesc}`
}

// 拍照OCR
const scanTextFromCamera = async () => {
  const text = await captureAndRecognize()
  
  // 识别结果作为标题
  unifiedInput.value = text
}
```

## ✅ 优势总结

1. **简化UI**: 两个输入框 → 一个输入框
2. **直观清晰**: 第一行自动识别为标题
3. **流畅体验**: 无需切换输入框
4. **兼容性好**: 保持所有现有功能
5. **易于实现**: 只需修改UI和解析逻辑

## 🚀 实施步骤

1. ✅ 设计统一输入框UI
2. ✅ 实现解析逻辑（第一行=标题）
3. ✅ 添加视觉增强（第一行背景色）
4. ✅ 更新所有相关功能（AI、OCR等）
5. ✅ 测试兼容性
6. ✅ 优化用户体验

## 💡 用户引导

**占位符文字**:
```
第一行：任务标题（加粗）
后续行：任务描述（可选）
```

**首次使用提示**:
```
💡 小贴士：
第一行会自动识别为任务标题
后续行为任务描述（可选）
```

## 🎯 总结

采用方案C（Markdown风格），通过第一行背景色区分标题和描述，实现简单、体验流畅、兼容性好。
