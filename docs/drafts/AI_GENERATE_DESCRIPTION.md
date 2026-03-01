# AI生成任务描述功能说明

## ✅ 功能已实现

### 📍 位置
任务创建区域 → 任务描述输入框右侧 → 🤖 按钮

### 🎯 功能流程

1. **用户输入任务标题**
   - 在第一行输入框输入任务名称
   - 例如："完成Q1季度项目总结报告"

2. **点击描述区域的AI按钮**
   - 任务描述输入框右侧的 🤖 按钮
   - 按钮会显示加载状态（⏳）

3. **AI自动生成描述**
   - 基于任务标题智能生成详细描述
   - 自动填充到描述输入框
   - 显示成功提示："✨ AI 已生成任务描述"

### 💡 AI生成规则

**Prompt设计**:
```
请为以下任务生成一个详细的描述。

任务标题：${title}

要求：
1. 描述要具体、可执行
2. 包含关键步骤或注意事项
3. 长度控制在50-100字
4. 只返回描述内容，不要添加标题或其他文字
```

**示例**:
- 输入标题："完成Q1季度项目总结报告"
- 生成描述："整理Q1季度项目数据，包括进度、成果、问题和改进建议。制作数据图表，撰写报告初稿，提交给团队审阅。"

### 🔧 技术实现

**文件**: `src/views/TodoView.vue`

**UI组件**:
```vue
<div class="textarea-with-ai">
  <textarea 
    v-model="newTaskDescription" 
    class="task-textarea-desc"
    placeholder="📝 任务描述（可选）..."
    rows="2"
  ></textarea>
  <button 
    class="btn-ai-desc" 
    @click="generateDescription" 
    :title="t('aiGenerateDesc')" 
    :disabled="aiLoading"
  >
    {{ aiLoading ? '⏳' : '🤖' }}
  </button>
</div>
```

**函数实现**:
```javascript
const generateDescription = async () => {
  const title = newTaskText.value.trim()
  
  if (!title) {
    alert('请先输入任务标题')
    return
  }
  
  aiLoading.value = true
  aiLoadingText.value = 'AI 正在生成任务描述...'
  aiLoadingSubText.value = '基于任务标题智能生成'
  
  try {
    const generatedDesc = await AITaskGenerator.generateDescription(title)
    newTaskDescription.value = generatedDesc
    showNotification('✨ AI 已生成任务描述', 'success')
  } catch (error) {
    console.error('AI生成失败:', error)
    alert(`AI生成失败：${error.message}`)
  } finally {
    aiLoading.value = false
  }
}
```

**服务层**: `src/services/aiTaskGenerator.js`
```javascript
static async generateDescription(title) {
  // 1. 获取AI模型配置
  const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
  const defaultModelId = localStorage.getItem('ai_default_model')
  const model = models.find(m => m.id === defaultModelId) || models[0]
  
  // 2. 构建Prompt
  const prompt = this.buildDescriptionPrompt(title)
  
  // 3. 调用AI API
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`
    },
    body: JSON.stringify({
      model: model.modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  })
  
  // 4. 返回生成的描述
  return result.choices[0].message.content.trim()
}
```

### 🎨 UI设计

**按钮样式**:
- 位置：描述输入框右上角
- 图标：🤖（正常）/ ⏳（加载中）
- 禁用状态：AI加载时不可点击
- 悬停提示："AI生成描述"

**加载状态**:
- 主文本："AI 正在生成任务描述..."
- 副文本："基于任务标题智能生成"
- 按钮图标变为 ⏳

### ✅ 功能特点

1. **智能生成**: 基于任务标题自动生成详细描述
2. **可执行性**: 描述包含关键步骤和注意事项
3. **长度适中**: 50-100字，不会太长或太短
4. **用户友好**: 
   - 一键生成，无需手动输入
   - 加载状态清晰
   - 成功提示明确
5. **容错处理**:
   - 未输入标题时提示
   - AI调用失败时显示错误信息
   - 未配置模型时提示配置

### 🔄 与其他功能的联动

1. **与AI分类建议联动**:
   - 标题输入框旁的 🤖 按钮：AI分类建议（分类+优先级）
   - 描述输入框旁的 🤖 按钮：AI生成描述

2. **与拍照OCR联动**:
   - 拍照识别后自动填充标题
   - 可继续点击AI按钮生成描述

3. **与全屏编辑联动**:
   - AI生成描述后可点击 ⛶ 按钮全屏编辑
   - 支持进一步修改和完善

### 📊 使用场景

1. **快速创建任务**: 只输入标题，AI自动补充描述
2. **标准化描述**: 确保任务描述格式统一、内容完整
3. **提高效率**: 减少手动输入时间，提升创建速度
4. **灵感启发**: AI生成的描述可以作为参考，激发思路

### 🎯 总结

AI生成任务描述功能已完整实现，用户只需：
1. 输入任务标题
2. 点击描述区域的 🤖 按钮
3. AI自动生成并填充描述

功能完善、交互流畅、用户体验良好！✨
