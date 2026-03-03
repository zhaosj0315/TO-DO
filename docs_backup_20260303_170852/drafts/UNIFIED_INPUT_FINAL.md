# 统一输入框设计方案（最终版）

## 🎯 最终理解

### UI结构
```
┌─────────────────────────────────────────────┐
│ 输入任务...              🤖  📷  ⛶         │ ← 只有一个输入框（单行）
└─────────────────────────────────────────────┘
```

### 核心要点

1. **只有一个输入框**
   - 默认显示为**单行输入框**（类似input）
   - 用户在这里输入任务标题

2. **三个功能按钮**
   - 🤖 AI分析（AI分类建议）
   - 📷 拍照识别
   - ⛶ 放大编辑（全屏）

3. **输入描述的方式**
   - 默认：只输入标题（单行）
   - 需要描述：点击 ⛶ 按钮 → 全屏编辑器 → 输入多行内容

## 🔧 实现方案

### 1. UI结构
```vue
<!-- 只保留一个输入框 -->
<div class="unified-input-container">
  <input 
    type="text"
    :value="displayInputValue"
    @input="handleInputChange"
    class="quick-task-input"
    :class="{ 'has-description': tempDescription }"
    placeholder="输入任务..."
    @keyup.enter="addTask"
  />
  <div class="quick-buttons">
    <button class="btn-ai" @click="triggerAIAssist" title="AI分析">🤖</button>
    <button class="btn-camera" @click="scanTextFromCamera" title="拍照识别">📷</button>
    <button class="btn-expand" @click="openFullEditor" title="展开编辑">⛶</button>
  </div>
</div>
```

### 2. CSS样式
```css
.unified-input-container {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 单行输入框 */
.quick-task-input {
  flex: 1;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

/* 有描述时的样式（三个点提示） */
.quick-task-input.has-description {
  color: #667eea;
  font-weight: 500;
}

.quick-task-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 功能按钮 */
.quick-buttons {
  display: flex;
  gap: 4px;
}

.quick-buttons button {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.quick-buttons button:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.1);
}
```

### 3. JavaScript逻辑
```javascript
// 快速输入框内容（单行）
const quickTaskInput = ref('')

// 全屏编辑器内容（多行）
const fullEditorContent = ref('')
const showFullEditor = ref(false)

// 临时保存的描述
const tempDescription = ref('')

// 计算属性：显示的输入框内容（带...提示）
const displayInputValue = computed(() => {
  if (tempDescription.value) {
    return `${quickTaskInput.value}...`  // 有描述时显示 "标题..."
  }
  return quickTaskInput.value  // 无描述时只显示标题
})

// 打开全屏编辑器
const openFullEditor = () => {
  // 将单行内容和描述组合
  if (tempDescription.value) {
    fullEditorContent.value = `${quickTaskInput.value}\n${tempDescription.value}`
  } else {
    fullEditorContent.value = quickTaskInput.value
  }
  showFullEditor.value = true
}

// 保存全屏编辑器内容
const saveFullEditor = () => {
  const { title, description } = parseUnifiedInput(fullEditorContent.value)
  
  // 更新单行输入框（只显示标题）
  quickTaskInput.value = title
  
  // 保存描述到临时变量
  tempDescription.value = description
  
  showFullEditor.value = false
}

// 解析输入内容
const parseUnifiedInput = (text) => {
  if (!text) return { title: '', description: '' }
  
  const lines = text.split('\n')
  const title = lines[0]?.trim() || ''
  const description = lines.slice(1).join('\n').trim()
  
  return { title, description }
}

// 添加任务
const addTask = async () => {
  const title = quickTaskInput.value.trim()
  
  if (!title) {
    alert('请输入任务标题')
    return
  }
  
  await taskStore.addTask({
    text: title,
    description: tempDescription.value || '',  // 使用临时保存的描述
    type: newTaskType.value,
    category: newTaskCategory.value,
    priority: newTaskPriority.value,
    // ... 其他字段
  })
  
  // 清空输入
  quickTaskInput.value = ''
  tempDescription.value = ''
  
  showNotification('✅ 任务已添加', 'success')
}

// AI分析（基于单行输入）
const triggerAIAssist = async () => {
  const title = quickTaskInput.value.trim()
  
  if (!title || title.length < 3) {
    alert('请先输入任务标题（至少3个字符）')
    return
  }
  
  aiLoading.value = true
  try {
    const classification = await AIClassifier.classifyTask(title, tempDescription.value)
    aiSuggestion.value = classification
  } catch (error) {
    console.error('AI分类失败:', error)
  } finally {
    aiLoading.value = false
  }
}

// 拍照识别
const scanTextFromCamera = async () => {
  try {
    const text = await captureAndRecognize()
    quickTaskInput.value = text
    tempDescription.value = ''  // 清空描述
  } catch (error) {
    alert('拍照识别失败')
  }
}
```

### 4. 全屏编辑器弹窗
```vue
<!-- 全屏编辑器 -->
<div v-if="showFullEditor" class="fullscreen-editor-overlay">
  <div class="fullscreen-editor">
    <div class="editor-header">
      <h3>编辑任务</h3>
      <button @click="showFullEditor = false">✕</button>
    </div>
    
    <div class="editor-body">
      <textarea 
        v-model="fullEditorContent"
        class="editor-textarea"
        placeholder="第一行：任务标题&#10;后续行：任务描述（可选）"
        rows="15"
        autofocus
      ></textarea>
      
      <div class="editor-hint">
        💡 第一行会自动识别为任务标题，后续行为任务描述
      </div>
    </div>
    
    <div class="editor-footer">
      <button @click="showFullEditor = false" class="btn-cancel">取消</button>
      <button @click="saveFullEditor" class="btn-save">保存</button>
    </div>
  </div>
</div>
```

```css
/* 全屏编辑器样式 */
.fullscreen-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.fullscreen-editor {
  width: 90%;
  max-width: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.editor-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.editor-textarea {
  width: 100%;
  min-height: 300px;
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
      rgba(102, 126, 234, 0.08) 0%,
      rgba(102, 126, 234, 0.08) 1.6em,
      transparent 1.6em
    );
}

.editor-hint {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 6px;
  font-size: 0.85rem;
  color: #666;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn-cancel, .btn-save {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

## 📊 使用流程

### 场景1：快速添加任务（只有标题）
```
1. 在单行输入框输入："完成项目报告"
2. 输入框显示："完成项目报告"（无...）
3. 按回车或点击添加按钮
4. 任务创建成功（无描述）
```

### 场景2：添加详细任务（标题+描述）
```
1. 在单行输入框输入："完成项目报告"
2. 点击 ⛶ 按钮
3. 全屏编辑器打开，显示：
   完成项目报告
   
4. 继续输入描述：
   完成项目报告
   整理Q1季度数据，制作图表，撰写报告。
   
5. 点击"保存"按钮
6. 返回主界面，单行输入框显示："完成项目报告..."（有...提示）
7. 按回车或点击添加按钮
8. 任务创建成功（包含描述）
```

### 场景3：修改已有描述
```
1. 输入框显示："完成项目报告..."（有描述）
2. 点击 ⛶ 按钮
3. 全屏编辑器打开，显示完整内容：
   完成项目报告
   整理Q1季度数据，制作图表，撰写报告。
4. 修改内容后点击"保存"
5. 返回主界面，输入框继续显示："完成项目报告..."
```

### 场景4：删除描述
```
1. 输入框显示："完成项目报告..."（有描述）
2. 点击 ⛶ 按钮
3. 全屏编辑器中删除第二行及以后的内容，只保留：
   完成项目报告
4. 点击"保存"
5. 返回主界面，输入框显示："完成项目报告"（无...）
```

### 场景3：使用AI功能
```
1. 在单行输入框输入："完成项目报告"
2. 点击 🤖 按钮
3. AI分析并显示分类建议
4. 点击"采纳"应用建议
5. 按回车添加任务
```

### 场景4：使用拍照识别
```
1. 点击 📷 按钮
2. 拍照识别文字
3. 识别结果自动填充到单行输入框
4. 按回车添加任务
```

## ✨ 核心优势

1. **极简UI**: 只有一个单行输入框 + 3个按钮
2. **快速输入**: 默认单行，适合快速添加任务
3. **灵活扩展**: 需要描述时点击 ⛶ 展开全屏编辑
4. **功能完整**: AI分析、拍照识别、全屏编辑全部保留
5. **用户友好**: 
   - 默认简洁（单行）
   - 需要时展开（全屏）
   - 保存后自动收起

## 🎯 总结

**最终方案**:
- ✅ 只有一个单行输入框（默认状态）
- ✅ 三个功能按钮：🤖 AI分析、📷 拍照、⛶ 展开
- ✅ 点击 ⛶ 打开全屏编辑器输入详细内容
- ✅ 全屏编辑器中第一行=标题，后续行=描述
- ✅ 保存后返回单行输入框，只显示标题
- ✅ 添加任务时自动包含标题和描述
