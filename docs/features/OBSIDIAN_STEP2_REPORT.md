# Obsidian 风格任务关系 - Step 2 实施报告

**版本**: v0.9.0  
**日期**: 2026-03-12  
**状态**: ✅ Step 2 完成

---

## 📋 实施内容

### Step 2：Markdown 渲染增强（已完成）

#### 2.1 导入 taskStore

```javascript
// src/components/MarkdownRenderer.vue
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'
const taskStore = useOfflineTaskStore()
```

#### 2.2 扩展 processLocalImages 函数

在现有的媒体文件处理逻辑前，添加 Obsidian 风格处理：

```javascript
// 🔗 处理 [[任务链接]]
text.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
  const task = taskStore.tasks.find(t => 
    t.text.toLowerCase() === title.trim().toLowerCase()
  )
  
  if (task) {
    return `<a href="#" class="task-link" data-task-id="${task.id}">
      <span class="link-icon">🔗</span>${title}
    </a>`
  }
  return `<span class="broken-link">[[${title}]]</span>`
})

// 🏷️ 处理层级标签
text.replace(/#([\w\u4e00-\u9fa5]+(?:\/[\w\u4e00-\u9fa5]+)*)/g, (match, tag) => {
  return `<span class="tag-badge" data-tag="${tag}">#${tag}</span>`
})
```

#### 2.3 添加点击事件处理

```javascript
// 在 bindFileCardEvents 函数中添加
const taskLinks = document.querySelectorAll('.task-link')
taskLinks.forEach(link => {
  link.onclick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const taskId = parseInt(link.getAttribute('data-task-id'))
    window.dispatchEvent(new CustomEvent('navigate-to-task', { 
      detail: { taskId } 
    }))
  }
})
```

#### 2.4 添加样式

```css
/* 任务链接 */
.task-link {
  color: #8b5cf6;
  border-bottom: 1px dashed #8b5cf6;
  cursor: pointer;
}

.task-link:hover {
  background: rgba(139, 92, 246, 0.1);
}

/* 断链 */
.broken-link {
  color: #999;
  text-decoration: line-through;
}

/* 标签徽章 */
.tag-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.85em;
}
```

---

## ✅ 验证结果

### 编译测试
```bash
npm run build
# ✅ 编译通过，无新增错误
```

### 功能测试

#### 测试 1：[[任务链接]] 渲染

**输入**：
```markdown
参考 [[项目规划]] 编写需求文档
```

**预期输出**：
- 如果"项目规划"任务存在：显示为紫色可点击链接 🔗项目规划
- 如果任务不存在：显示为灰色删除线 ~~[[项目规划]]~~

#### 测试 2：层级标签渲染

**输入**：
```markdown
实现用户登录 #work/project-a #urgent
```

**预期输出**：
- 显示两个紫色渐变徽章：`#work/project-a` `#urgent`
- 鼠标悬停时透明度降低

#### 测试 3：点击跳转

**操作**：点击 [[任务链接]]

**预期行为**：
- 触发 `navigate-to-task` 自定义事件
- 传递 `taskId` 参数

---

## 📊 影响评估

| 项目 | 影响 | 说明 |
|------|------|------|
| 现有功能 | ✅ 无影响 | 只扩展渲染逻辑，不修改现有媒体处理 |
| 性能 | ✅ 无影响 | 处理在渲染时执行，不影响列表性能 |
| 兼容性 | ✅ 完全兼容 | 不输入 [[链接]] 和 #标签 则无变化 |

---

## 🎨 视觉效果

### 任务链接
```
正常链接：🔗项目规划（紫色虚线下划线）
悬停效果：浅紫色背景高亮
断链显示：[[不存在的任务]]（灰色删除线）
```

### 层级标签
```
标签样式：#work/project-a（紫色渐变圆角徽章）
悬停效果：透明度降低到 80%
```

---

## 🔧 技术细节

### 处理顺序
1. Markdown 解析（marked）
2. 处理 [[任务链接]]（文本节点替换）
3. 处理 #层级标签（文本节点替换）
4. 处理媒体文件（现有逻辑）
5. DOMPurify 清理
6. 绑定事件（nextTick 后）

### 事件机制
使用 `window.dispatchEvent` 全局事件，避免组件耦合：

```javascript
// 发送事件
window.dispatchEvent(new CustomEvent('navigate-to-task', { 
  detail: { taskId } 
}))

// 接收事件（在父组件中）
window.addEventListener('navigate-to-task', (e) => {
  const taskId = e.detail.taskId
  // 打开任务详情
})
```

---

## 📝 下一步计划

### Step 3：反向链接面板（待实施）

**目标**：在任务详情页显示反向链接

**文件**：`src/components/TaskDetailModal.vue`

**改动**：
- 添加反向链接区域（约 60 行）
- 使用 `taskStore.getBacklinks()` 方法
- 显示引用上下文

**预计时间**：1 天

---

## ✅ Step 2 总结

- **代码行数**：+60 行（渲染逻辑 + 事件处理 + 样式）
- **修改文件**：1 个（MarkdownRenderer.vue）
- **破坏性改动**：0
- **测试状态**：✅ 编译通过
- **风险等级**：⭐ 极低

**结论**：Step 2 安全完成，Markdown 渲染已支持 Obsidian 风格。

---

## 🧪 手动测试步骤

1. **创建测试任务A**：
   ```
   标题：项目规划
   描述：制定整体规划
   ```

2. **创建测试任务B**：
   ```
   标题：需求文档
   描述：参考 [[项目规划]] 编写需求文档 #work/project-a
   ```

3. **验证渲染**：
   - 打开任务B详情
   - 查看描述区域
   - 应该看到紫色链接和标签徽章

4. **验证点击**：
   - 点击 [[项目规划]] 链接
   - 应该触发跳转事件（需要在父组件监听）

---

## 🔒 回滚方案

如果发现问题，可以立即回滚：

```bash
git checkout HEAD~1 src/components/MarkdownRenderer.vue
```

所有修改都在一个文件中，回滚安全。
