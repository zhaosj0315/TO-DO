# Markdown编辑器集成方案评估

**需求**: 在任务创建的全屏输入框中嵌入Markdown编辑器，支持编辑时语法高亮和阅读时渲染

**评估日期**: 2026-03-10  
**评估人**: AI Assistant

---

## 📋 需求分析

### **用户场景**
1. **编辑场景**: 全屏输入框中编写任务描述，支持Markdown语法
2. **预览场景**: 任务详情页查看时，Markdown内容渲染为富文本
3. **双模式**: 编辑时可切换"源码"和"预览"模式

### **当前实现**
- **编辑器**: 原生 `<textarea>` 纯文本输入
- **显示**: 原生 `<textarea>` 或 `<div>` 纯文本显示
- **位置**: 
  - 全屏编辑: `TodoView.vue` 第2216-2450行
  - 任务详情: `TaskDetailModal.vue` 第121行

---

## 🎯 技术方案对比

### **方案1: 轻量级 - marked.js + textarea**

**实现方式**:
- 编辑: 保持原生 `<textarea>`
- 预览: 使用 `marked.js` 渲染Markdown
- 切换: 添加"预览/编辑"切换按钮

**优点**:
- ✅ 极简实现（~5KB gzipped）
- ✅ 零学习成本（textarea原生体验）
- ✅ 性能优秀
- ✅ 移动端友好

**缺点**:
- ❌ 编辑时无语法高亮
- ❌ 无实时预览
- ❌ 需要手动切换模式

**适用场景**: 
- 用户主要写纯文本，偶尔用Markdown
- 移动端为主

**依赖**:
```json
{
  "marked": "^12.0.0"  // 5KB
}
```

---

### **方案2: 中量级 - Toast UI Editor**

**实现方式**:
- 使用 `@toast-ui/vue-editor`
- 所见即所得（WYSIWYG）+ Markdown模式
- 工具栏支持快捷操作

**优点**:
- ✅ 双模式编辑（Markdown/WYSIWYG）
- ✅ 实时预览
- ✅ 工具栏快捷操作
- ✅ 移动端适配良好
- ✅ 中文支持

**缺点**:
- ⚠️ 体积较大（~200KB gzipped）
- ⚠️ 需要额外CSS
- ⚠️ 配置复杂度中等

**适用场景**:
- 用户经常使用Markdown
- 需要富文本编辑体验

**依赖**:
```json
{
  "@toast-ui/vue-editor": "^3.2.2",  // 200KB
  "@toast-ui/editor": "^3.2.2"
}
```

---

### **方案3: 重量级 - TinyMCE / Quill**

**实现方式**:
- 完整的富文本编辑器
- Markdown作为输入/输出格式

**优点**:
- ✅ 功能最强大
- ✅ 所见即所得
- ✅ 插件生态丰富

**缺点**:
- ❌ 体积巨大（500KB+）
- ❌ 移动端体验一般
- ❌ 配置复杂
- ❌ 过度设计（任务描述不需要这么复杂）

**适用场景**:
- 不适合本项目

---

### **方案4: 极简 - 纯CSS语法高亮**

**实现方式**:
- 编辑: `<textarea>` + CSS伪元素语法高亮
- 预览: `marked.js` 渲染

**优点**:
- ✅ 体积最小（~5KB）
- ✅ 无额外依赖
- ✅ 性能最优
- ✅ 移动端完美

**缺点**:
- ❌ 语法高亮效果有限
- ❌ 需要自定义实现

**适用场景**:
- 追求极致性能
- 简单Markdown需求

---

## 🎨 推荐方案：方案1（marked.js）

### **理由**
1. **项目定位**: 离线待办应用，任务描述以纯文本为主
2. **用户习惯**: 移动端用户更习惯简单输入
3. **性能优先**: 5KB vs 200KB，加载速度快10倍
4. **渐进增强**: 先实现基础功能，后续可升级

### **实现步骤**

#### **Step 1: 安装依赖**
```bash
npm install marked
```

#### **Step 2: 创建Markdown渲染组件**
```vue
<!-- src/components/MarkdownRenderer.vue -->
<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  content: String
})

const renderedHtml = computed(() => {
  if (!props.content) return ''
  return marked.parse(props.content)
})
</script>

<style scoped>
.markdown-body {
  line-height: 1.6;
  word-wrap: break-word;
}

.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-body code {
  background: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-body pre {
  background: #f6f8fa;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-body ul, .markdown-body ol {
  padding-left: 2em;
}

.markdown-body blockquote {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  color: #666;
}
</style>
```

#### **Step 3: 修改全屏编辑器（添加预览模式）**
```vue
<!-- TodoView.vue 修改 -->
<div class="fullscreen-desc-overlay">
  <!-- 导航栏添加预览切换 -->
  <div class="nav-bar">
    <div class="mode-toggle">
      <button 
        :class="['mode-btn', { active: editMode === 'edit' }]"
        @click="editMode = 'edit'"
      >
        ✏️ 编辑
      </button>
      <button 
        :class="['mode-btn', { active: editMode === 'preview' }]"
        @click="editMode = 'preview'"
      >
        👁️ 预览
      </button>
    </div>
  </div>
  
  <!-- 编辑模式 -->
  <textarea 
    v-show="editMode === 'edit'"
    v-model="newTaskDescription"
    class="fullscreen-desc-textarea"
  ></textarea>
  
  <!-- 预览模式 -->
  <MarkdownRenderer 
    v-show="editMode === 'preview'"
    :content="newTaskDescription"
    class="markdown-preview"
  />
</div>
```

#### **Step 4: 修改任务详情页（渲染Markdown）**
```vue
<!-- TaskDetailModal.vue 修改 -->
<section class="description-section">
  <h3>📝 任务描述</h3>
  
  <!-- 编辑模式 -->
  <textarea 
    v-if="isEditingDescription"
    v-model="localTask.description"
    @blur="saveDescription"
  ></textarea>
  
  <!-- 预览模式 -->
  <MarkdownRenderer 
    v-else
    :content="localTask.description"
    @click="isEditingDescription = true"
  />
</section>
```

---

## 📊 工作量评估

| 任务 | 预计时间 | 难度 |
|------|---------|------|
| 安装marked.js | 5分钟 | ⭐ |
| 创建MarkdownRenderer组件 | 30分钟 | ⭐⭐ |
| 修改全屏编辑器 | 1小时 | ⭐⭐⭐ |
| 修改任务详情页 | 30分钟 | ⭐⭐ |
| 样式调整 | 1小时 | ⭐⭐ |
| 测试 | 1小时 | ⭐⭐ |
| **总计** | **4小时** | **⭐⭐⭐** |

---

## ⚠️ 注意事项

### **安全性**
- ⚠️ `v-html` 存在XSS风险
- ✅ 解决方案: 使用 `DOMPurify` 清理HTML
```bash
npm install dompurify
```

### **性能**
- ⚠️ 大文本渲染可能卡顿
- ✅ 解决方案: 添加防抖，延迟渲染

### **兼容性**
- ✅ marked.js 支持所有现代浏览器
- ✅ 移动端完美支持

---

## 🚀 升级路径

### **阶段1: MVP（推荐）**
- 使用 marked.js
- 编辑/预览双模式
- 基础Markdown语法

### **阶段2: 增强**
- 添加工具栏（加粗、斜体、列表）
- 快捷键支持（Ctrl+B等）
- 语法提示

### **阶段3: 高级**
- 升级到 Toast UI Editor
- 图片上传
- 表格编辑

---

## ✅ 可行性结论

**可行性**: ⭐⭐⭐⭐⭐ (5/5)

**推荐指数**: ⭐⭐⭐⭐ (4/5)

**理由**:
1. ✅ 技术成熟，实现简单
2. ✅ 体积小，性能好
3. ✅ 用户体验提升明显
4. ✅ 不影响现有功能
5. ⚠️ 需要注意XSS安全

**建议**: 
- 立即实施方案1（marked.js）
- 4小时可完成MVP
- 后续根据用户反馈决定是否升级

---

## 📝 实施检查清单

- [ ] 安装 marked 和 dompurify
- [ ] 创建 MarkdownRenderer 组件
- [ ] 修改全屏编辑器（添加预览模式）
- [ ] 修改任务详情页（渲染Markdown）
- [ ] 添加Markdown工具栏（可选）
- [ ] 样式调整（GitHub风格）
- [ ] XSS防护测试
- [ ] 移动端适配测试
- [ ] 性能测试（大文本）
- [ ] 用户文档更新

---

**评估完成！建议立即实施方案1。**
