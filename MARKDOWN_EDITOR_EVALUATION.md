# Markdown 编辑器集成评估

**评估日期**: 2026-02-26  
**评估人员**: 技术顾问

---

## 📊 方案对比

### 方案 1: 轻量级 Markdown 编辑器（推荐）⭐

**库**: `@toast-ui/editor` 或 `v-md-editor`

**优点**:
- ✅ 开箱即用，集成简单
- ✅ 支持实时预览
- ✅ 工具栏完善（加粗、斜体、列表等）
- ✅ 体积适中（~200KB gzipped）
- ✅ 中文文档完善

**缺点**:
- ⚠️ 增加包体积
- ⚠️ 需要学习 API

**实现成本**: 🟢 低（2-3 小时）

**代码示例**:
```bash
npm install @toast-ui/vue-editor
```

```vue
<template>
  <Editor
    v-model="newTaskDescription"
    :options="editorOptions"
    height="100%"
  />
</template>

<script setup>
import { Editor } from '@toast-ui/vue-editor'
import '@toast-ui/editor/dist/toastui-editor.css'

const editorOptions = {
  minHeight: '500px',
  language: 'zh-CN',
  toolbarItems: [
    ['heading', 'bold', 'italic'],
    ['ul', 'ol', 'task'],
    ['table', 'link']
  ]
}
</script>
```

---

### 方案 2: 简化版 Markdown 支持（最推荐）⭐⭐⭐

**库**: `marked` + 自定义工具栏

**优点**:
- ✅ 极轻量（~20KB）
- ✅ 只渲染，不编辑
- ✅ 完全自定义
- ✅ 学习成本低

**缺点**:
- ⚠️ 需要自己实现工具栏
- ⚠️ 无实时预览

**实现成本**: 🟢 低（1-2 小时）

**代码示例**:
```bash
npm install marked
```

```vue
<template>
  <div class="markdown-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="insertMarkdown('**', '**')">B</button>
      <button @click="insertMarkdown('*', '*')">I</button>
      <button @click="insertMarkdown('- ')">列表</button>
    </div>
    
    <!-- 编辑区 -->
    <textarea v-model="text" />
    
    <!-- 预览区（可选） -->
    <div v-html="renderMarkdown(text)" />
  </div>
</template>

<script setup>
import { marked } from 'marked'

const insertMarkdown = (before, after = '') => {
  // 在光标位置插入 Markdown 语法
}

const renderMarkdown = (text) => {
  return marked(text)
}
</script>
```

---

### 方案 3: 纯文本 + Markdown 渲染（最简单）⭐⭐

**库**: 只用 `marked`

**优点**:
- ✅ 最轻量
- ✅ 实现最简单
- ✅ 不改变现有编辑体验

**缺点**:
- ⚠️ 用户需要手写 Markdown
- ⚠️ 无工具栏辅助

**实现成本**: 🟢 极低（30 分钟）

**代码示例**:
```vue
<!-- 编辑时：纯文本 -->
<textarea v-model="description" />

<!-- 显示时：渲染 Markdown -->
<div v-html="marked(description)" />
```

---

## 💰 成本分析

| 方案 | 开发时间 | 包体积增加 | 维护成本 | 用户体验 | 推荐度 |
|------|---------|-----------|---------|---------|--------|
| 方案1 | 2-3h | +200KB | 低 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 方案2 | 1-2h | +20KB | 中 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 方案3 | 0.5h | +20KB | 低 | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 推荐方案

### 最佳选择：方案 2（简化版 Markdown）

**理由**:
1. 体积小（只增加 20KB）
2. 开发快（1-2 小时）
3. 体验好（工具栏辅助）
4. 可控性强（完全自定义）

**实施步骤**:
1. 安装 `marked`（5 分钟）
2. 创建工具栏组件（30 分钟）
3. 实现插入逻辑（30 分钟）
4. 添加预览功能（30 分钟）
5. 样式优化（30 分钟）

---

## 🚀 快速实现（方案 3）

如果想最快上线，推荐方案 3：

**步骤 1**: 安装依赖
```bash
npm install marked
```

**步骤 2**: 修改显示逻辑
```vue
<!-- TodoView.vue 任务卡片 -->
<div 
  class="task-description" 
  v-html="renderMarkdown(task.description)"
/>

<script setup>
import { marked } from 'marked'

const renderMarkdown = (text) => {
  if (!text) return ''
  return marked(text)
}
</script>
```

**步骤 3**: 添加样式
```css
.task-description {
  /* Markdown 渲染样式 */
}

.task-description h1 { font-size: 1.5em; }
.task-description h2 { font-size: 1.3em; }
.task-description code { 
  background: #f5f5f5; 
  padding: 2px 4px; 
}
```

**完成！** 用户可以在描述中使用 Markdown 语法，显示时自动渲染。

---

## 📝 总结

### 成本评估
- **开发成本**: 🟢 低（0.5-3 小时）
- **维护成本**: 🟢 低
- **性能影响**: 🟢 极小（+20-200KB）
- **用户体验**: 🟢 显著提升

### 建议
1. **立即实施**: 方案 3（30 分钟）
2. **后续优化**: 方案 2（1-2 小时）
3. **长期考虑**: 方案 1（如需更多功能）

---

**结论**: 成本不高，建议实施！✅
