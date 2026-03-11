<template>
  <!-- AI生成预览弹窗 - Bottom Sheet -->
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="preview-sheet">
      <div class="preview-header">
        <h3>{{ title }}</h3>
        <button @click="toggleMode" class="btn-mode">
          {{ isMarkdownMode ? '✏️ 编辑' : '👁️ 预览' }}
        </button>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>
      
      <div class="preview-content">
        <textarea 
          v-if="!isMarkdownMode"
          v-model="editableContent"
          class="preview-textarea"
          placeholder="AI生成的内容..."
          rows="10"
        ></textarea>
        <div 
          v-else
          class="markdown-preview"
          v-html="renderedMarkdown"
        ></div>
      </div>
      
      <div class="preview-actions">
        <button @click="handleRegenerate" class="btn-action btn-regenerate" :disabled="loading">
          {{ loading ? '⏳ 生成中...' : '🔄 重新生成' }}
        </button>
        <button @click="handleAdopt" class="btn-action btn-adopt">
          ✅ 采纳
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import * as markedLib from 'marked'
import DOMPurify from 'dompurify'

// 兼容不同版本的 marked
const parseMarkdown = (text) => {
  // 预处理文本：确保正确的换行格式
  const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  
  console.log('📐 预处理后的文本:', JSON.stringify(cleanText))
  
  // 检测是否为一加设备或类似问题设备
  const isProblematicDevice = navigator.userAgent.includes('OnePlus') || 
                             navigator.userAgent.includes('ONEPLUS') ||
                             navigator.userAgent.includes('OxygenOS')
  
  console.log('📐 是否为问题设备:', isProblematicDevice)
  
  // 如果是问题设备，直接使用降级方案
  if (isProblematicDevice) {
    console.log('📐 使用降级方案处理一加设备')
    return simpleMarkdownFallback(cleanText)
  }
  
  // 配置 marked（如果可用）
  if (markedLib.marked && markedLib.marked.setOptions) {
    markedLib.marked.setOptions({
      gfm: true,
      breaks: true,
      pedantic: false,
      sanitize: false
    })
  }
  
  // 检查各种可能的导出方式
  let result
  if (typeof markedLib.marked === 'function') {
    result = markedLib.marked(cleanText)
  } else if (typeof markedLib.parse === 'function') {
    result = markedLib.parse(cleanText)
  } else if (typeof markedLib.default === 'function') {
    result = markedLib.default(cleanText)
  } else if (typeof markedLib === 'function') {
    result = markedLib(cleanText)
  } else {
    console.warn('⚠️ marked 库不可用，使用简单文本转换')
    return simpleMarkdownFallback(cleanText)
  }
  
  // 检查结果是否被错误识别为代码块
  if (result && result.includes('<pre><code class="language-markdown">')) {
    console.log('📐 检测到代码块错误，使用降级方案')
    return simpleMarkdownFallback(cleanText)
  }
  
  return result
}

// 简单的 Markdown 降级方案
const simpleMarkdownFallback = (text) => {
  // 移除代码块包装（如果存在）
  let cleanText = text
  if (text.startsWith('```markdown\n') && text.endsWith('\n```')) {
    cleanText = text.slice(12, -4) // 移除开头的 ```markdown\n 和结尾的 \n```
  } else if (text.startsWith('```\n') && text.endsWith('\n```')) {
    cleanText = text.slice(4, -4) // 移除开头的 ```\n 和结尾的 \n```
  }
  
  // 处理表格
  const processTable = (text) => {
    const lines = text.split('\n')
    let result = []
    let inTable = false
    let tableRows = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 检测表格行（包含 | 符号）
      if (line.includes('|') && line.length > 2) {
        if (!inTable) {
          inTable = true
          tableRows = []
        }
        
        // 跳过分隔行（如 |---|---|）
        if (line.match(/^\|[\s\-\|:]+\|$/)) {
          continue
        }
        
        // 处理表格行
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)
        if (cells.length > 0) {
          const isHeader = tableRows.length === 0
          const tag = isHeader ? 'th' : 'td'
          const rowHtml = `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`
          tableRows.push(rowHtml)
        }
      } else {
        // 非表格行，如果之前在表格中，先输出表格
        if (inTable) {
          result.push(`<table>${tableRows.join('')}</table>`)
          tableRows = []
          inTable = false
        }
        result.push(line)
      }
    }
    
    // 处理最后的表格
    if (inTable && tableRows.length > 0) {
      result.push(`<table>${tableRows.join('')}</table>`)
    }
    
    return result.join('\n')
  }
  
  // 先处理表格
  let processedText = processTable(cleanText)
  
  // 然后处理其他 Markdown 语法
  return processedText
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n/g, '<br>')
}

const props = defineProps({
  visible: Boolean,
  content: String,
  title: {
    type: String,
    default: '✨ AI生成预览'
  },
  loading: Boolean
})

const emit = defineEmits(['close', 'adopt', 'regenerate'])

const editableContent = ref('')
const isMarkdownMode = ref(true) // 默认预览模式

// 监听content变化，更新可编辑内容
watch(() => props.content, (newContent) => {
  editableContent.value = newContent
}, { immediate: true })

// 渲染 Markdown
const renderedMarkdown = computed(() => {
  if (!editableContent.value) return ''
  
  try {
    console.log('📐 开始渲染 Markdown, 内容长度:', editableContent.value.length)
    console.log('📐 设备信息:', {
      userAgent: navigator.userAgent,
      webkitVersion: window.webkit ? 'webkit available' : 'no webkit',
      androidVersion: navigator.userAgent.match(/Android (\d+\.\d+)/)?.[1] || 'unknown'
    })
    console.log('📐 markedLib 对象:', Object.keys(markedLib))
    console.log('📐 markedLib.marked 类型:', typeof markedLib.marked)
    console.log('📐 markedLib.parse 类型:', typeof markedLib.parse)
    console.log('📐 markedLib.default 类型:', typeof markedLib.default)
    console.log('📐 markedLib 本身类型:', typeof markedLib)
    
    const rawHtml = parseMarkdown(editableContent.value)
    console.log('📐 parseMarkdown 成功, HTML长度:', rawHtml.length)
    console.log('📐 生成的HTML片段:', rawHtml.substring(0, 200))
    
    const sanitized = DOMPurify.sanitize(rawHtml)
    console.log('📐 DOMPurify 清理成功, 最终长度:', sanitized.length)
    
    return sanitized
  } catch (error) {
    console.error('❌ Markdown 渲染失败:', error)
    console.error('❌ 错误堆栈:', error.stack)
    // 降级：返回纯文本（保留换行）
    return editableContent.value.replace(/\n/g, '<br>')
  }
})

const toggleMode = () => {
  isMarkdownMode.value = !isMarkdownMode.value
}

const handleAdopt = () => {
  emit('adopt', editableContent.value)
}

const handleRegenerate = () => {
  emit('regenerate')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  align-items: flex-end !important;
  justify-content: center !important;
  z-index: 99999 !important;
  animation: fadeIn 0.2s ease-out;
}

.preview-sheet {
  background: white !important;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUpFromBottom 0.3s ease-out;
  position: relative;
  z-index: 100000 !important;
}

@keyframes slideUpFromBottom {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  gap: 0.5rem;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  flex: 1;
}

.btn-mode {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-mode:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.preview-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.preview-textarea {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}

.preview-textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.markdown-preview {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
  background: #fafafa;
  overflow-y: auto;
  max-height: 50vh;
}

/* GitHub 风格 Markdown 样式 */
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
  color: #1a1a1a;
}

.markdown-preview :deep(h1) { font-size: 1.8em; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.3em; }
.markdown-preview :deep(h2) { font-size: 1.5em; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3em; }
.markdown-preview :deep(h3) { font-size: 1.25em; }
.markdown-preview :deep(h4) { font-size: 1.1em; }

.markdown-preview :deep(p) {
  margin-top: 0;
  margin-bottom: 1em;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 2em;
  margin-bottom: 1em;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.25em;
}

.markdown-preview :deep(code) {
  background: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-preview :deep(pre) {
  background: #f6f8fa;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #7c3aed;
  padding-left: 1em;
  margin-left: 0;
  color: #666;
  font-style: italic;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #e0e0e0;
  padding: 0.5em;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: #f6f8fa;
  font-weight: 600;
}

.markdown-preview :deep(a) {
  color: #7c3aed;
  text-decoration: none;
}

.markdown-preview :deep(a:hover) {
  text-decoration: underline;
}

.markdown-preview :deep(strong) {
  font-weight: 600;
  color: #1a1a1a;
}

.markdown-preview :deep(em) {
  font-style: italic;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 1.5em 0;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
  border: 1px solid #e0e0e0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #e0e0e0;
  padding: 0.5em;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: #f6f8fa;
  font-weight: 600;
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-action {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-regenerate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-regenerate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-regenerate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-adopt {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-adopt:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
