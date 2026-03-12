<template>
  <div class="markdown-renderer" v-html="renderedHtml"></div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import * as markedLib from 'marked'
import DOMPurify from 'dompurify'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

const taskStore = useOfflineTaskStore()

// 兼容不同版本的 marked
const parseMarkdown = (text) => {
  // 检查各种可能的导出方式
  if (typeof markedLib.marked === 'function') {
    return markedLib.marked(text)
  } else if (typeof markedLib.parse === 'function') {
    return markedLib.parse(text)
  } else if (typeof markedLib.default === 'function') {
    return markedLib.default(text)
  } else if (typeof markedLib === 'function') {
    return markedLib(text)
  } else {
    // 最后的降级方案：简单的文本转换
    console.warn('⚠️ marked 库不可用，使用简单文本转换')
    return simpleMarkdownFallback(text)
  }
}

// 简单的 Markdown 降级方案
const simpleMarkdownFallback = (text) => {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/g, '<br>')
}

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  media: {
    type: Array,
    default: () => []
  }
})

// 配置 marked
if (markedLib.marked && markedLib.marked.setOptions) {
  markedLib.marked.setOptions({
    breaks: true, // 支持换行
    gfm: true, // GitHub Flavored Markdown
  })
}

const renderedHtml = ref('')

// 处理本地媒体文件（图片、文档、视频等）
const processLocalImages = async (html) => {
  if (!html) return ''
  
  console.log('🖼️ processLocalImages - 输入HTML:', html)
  console.log('🖼️ processLocalImages - media数组:', props.media)
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // 🆕 处理 [[任务链接]]（v0.9.0 Obsidian 风格）
  const textNodes = []
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false)
  let node
  while (node = walker.nextNode()) {
    textNodes.push(node)
  }
  
  textNodes.forEach(textNode => {
    const text = textNode.textContent
    if (text.includes('[[')) {
      const span = doc.createElement('span')
      span.innerHTML = text.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
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
      textNode.replaceWith(span)
    }
  })
  
  // 🆕 处理层级标签（v0.9.0 Obsidian 风格）
  const allTextNodes = []
  const walker2 = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false)
  let node2
  while (node2 = walker2.nextNode()) {
    allTextNodes.push(node2)
  }
  
  allTextNodes.forEach(textNode => {
    const text = textNode.textContent
    if (text.includes('#')) {
      const span = doc.createElement('span')
      span.innerHTML = text.replace(/#([\w\u4e00-\u9fa5]+(?:\/[\w\u4e00-\u9fa5]+)*)/g, (match, tag) => {
        return `<span class="tag-badge" data-tag="${tag}">#${tag}</span>`
      })
      textNode.replaceWith(span)
    }
  })
  
  // 处理图片
  const images = doc.querySelectorAll('img[src^="local://"]')
  console.log('🖼️ 找到的local://图片数量:', images.length)
  
  for (const img of images) {
    const mediaId = img.src.replace('local://', '')
    console.log('🖼️ 处理图片ID:', mediaId)
    
    const media = props.media?.find(m => m.id === mediaId)
    console.log('🖼️ 找到的media对象:', media)
    
    if (media) {
      try {
        let base64Data
        
        // 优先使用base64Data（Web端）
        if (media.base64Data) {
          console.log('🖼️ 使用base64Data（Web端）')
          base64Data = media.base64Data
        } else {
          // 原生端：从文件系统读取
          console.log('🖼️ 从文件系统读取（原生端）')
          const file = await Filesystem.readFile({
            path: media.path,
            directory: Directory.Data
          })
          base64Data = file.data
        }
        
        console.log('🖼️ 文件读取成功，数据长度:', base64Data?.length)
        img.src = `data:image/jpeg;base64,${base64Data}`
        img.setAttribute('data-media-id', media.id) // 添加 media ID
        img.style.maxWidth = '300px'  // 默认最大宽度300px
        img.style.width = 'auto'
        img.style.height = 'auto'
        img.style.borderRadius = '8px'
        img.style.margin = '0.5rem 0'
        img.style.cursor = 'pointer'  // 鼠标悬停显示可点击
        img.style.transition = 'transform 0.2s'
        
        // 点击事件会在 renderMarkdown 后重新绑定
        
        
        // 悬停效果
        img.onmouseenter = () => {
          img.style.transform = 'scale(1.02)'
        }
        img.onmouseleave = () => {
          img.style.transform = 'scale(1)'
        }
      } catch (e) {
        console.error('🖼️ 图片加载失败:', e)
        img.src = ''
        img.alt = '图片加载失败'
        img.style.color = '#999'
      }
    } else {
      console.warn('🖼️ 未找到对应的media对象，mediaId:', mediaId)
    }
  }
  
  // 处理文件链接（PDF、文档、视频等）
  const links = doc.querySelectorAll('a[href^="local://"]')
  console.log('📎 找到的local://文件链接数量:', links.length)
  
  for (const link of links) {
    const mediaId = link.href.replace('local://', '')
    const media = props.media?.find(m => m.id === mediaId)
    
    if (media) {
      // 创建文件卡片
      const fileCard = doc.createElement('div')
      fileCard.className = 'file-card'
      fileCard.setAttribute('data-media-id', media.id) // 添加 media ID
      fileCard.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 8px;
        margin: 0.5rem 0;
        cursor: pointer;
        transition: all 0.2s;
      `
      // 文件图标
      const icon = doc.createElement('div')
      icon.className = 'file-icon'
      icon.style.cssText = `
        font-size: 32px;
        flex-shrink: 0;
      `
      icon.textContent = getFileIcon(media.type)
      
      // 文件信息
      const info = doc.createElement('div')
      info.className = 'file-info'
      info.style.cssText = `
        flex: 1;
        min-width: 0;
      `
      
      const fileName = doc.createElement('div')
      fileName.className = 'file-name'
      fileName.style.cssText = `
        font-weight: 500;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `
      fileName.textContent = media.originalName || media.name
      
      const fileSize = doc.createElement('div')
      fileSize.className = 'file-size'
      fileSize.style.cssText = `
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      `
      fileSize.textContent = formatFileSize(media.size)
      
      info.appendChild(fileName)
      info.appendChild(fileSize)
      
      // 下载按钮
      const downloadBtn = doc.createElement('div')
      downloadBtn.className = 'file-download'
      downloadBtn.style.cssText = `
        font-size: 20px;
        color: #8b5cf6;
        flex-shrink: 0;
      `
      downloadBtn.textContent = '⬇️'
      
      fileCard.appendChild(icon)
      fileCard.appendChild(info)
      fileCard.appendChild(downloadBtn)
      
      // 替换原链接（事件会在 renderMarkdown 后重新绑定）
      link.replaceWith(fileCard)
    }
  }
  
  return doc.body.innerHTML
}

// 获取文件图标
const getFileIcon = (type) => {
  const icons = {
    pdf: '📕',
    document: '📄',
    excel: '📊',
    powerpoint: '📽️',
    video: '🎬',
    archive: '📦',
    file: '📎'
  }
  return icons[type] || '📎'
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 获取 MIME 类型
const getMimeType = (ext) => {
  const mimeTypes = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    zip: 'application/zip',
    txt: 'text/plain'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// Base64 转 Blob
const base64ToBlob = (base64, mimeType) => {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

// 渲染 Markdown
const renderMarkdown = async () => {
  if (!props.content) {
    renderedHtml.value = ''
    return
  }
  
  try {
    const rawHtml = parseMarkdown(props.content)
    const processedHtml = await processLocalImages(rawHtml)
    // DOMPurify 会移除事件处理器，所以我们需要在渲染后重新绑定
    renderedHtml.value = DOMPurify.sanitize(processedHtml)
    
    // 等待 DOM 更新后重新绑定事件（多次尝试确保绑定成功）
    await nextTick()
    bindFileCardEvents()
    
    // 再次延迟绑定（确保任务卡片也能绑定）
    setTimeout(() => {
      bindFileCardEvents()
    }, 100)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    // 降级：返回纯文本（保留换行）
    renderedHtml.value = props.content.replace(/\n/g, '<br>')
  }
}

// 重新绑定文件卡片和图片事件
const bindFileCardEvents = () => {
  // 🆕 绑定任务链接点击事件（v0.9.0）
  const taskLinks = document.querySelectorAll('.task-link')
  taskLinks.forEach(link => {
    link.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const taskId = parseInt(link.getAttribute('data-task-id'))
      console.log('🔗 任务链接被点击:', taskId)
      window.dispatchEvent(new CustomEvent('open-task-detail', { 
        detail: { taskId } 
      }))
    }
  })
  
  // 绑定文件卡片事件
  const fileCards = document.querySelectorAll('.file-card')
  fileCards.forEach(card => {
    const mediaId = card.getAttribute('data-media-id')
    if (mediaId) {
      const media = props.media?.find(m => m.id === mediaId)
      if (media) {
        card.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('📎 文件卡片被点击:', media)
          window.dispatchEvent(new CustomEvent('preview-file', { 
            detail: media 
          }))
        }
        
        // 悬停效果
        card.onmouseenter = () => {
          card.style.background = '#ebebeb'
          card.style.transform = 'translateY(-2px)'
        }
        card.onmouseleave = () => {
          card.style.background = '#f5f5f5'
          card.style.transform = 'translateY(0)'
        }
      }
    }
  })
  
  // 绑定图片点击事件
  const images = document.querySelectorAll('.markdown-renderer img[data-media-id]')
  images.forEach(img => {
    const mediaId = img.getAttribute('data-media-id')
    if (mediaId) {
      const media = props.media?.find(m => m.id === mediaId)
      if (media) {
        img.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('🖼️ 图片被点击:', media)
          window.dispatchEvent(new CustomEvent('preview-file', { 
            detail: media 
          }))
        }
      }
    }
  })
}

// 监听内容和媒体变化
watch(() => [props.content, props.media], () => {
  renderMarkdown()
}, { immediate: true, deep: true })
</script>

<style scoped>
.markdown-renderer {
  line-height: 1.6;
  color: #333;
}

/* 标题 */
.markdown-renderer :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem;
  padding-bottom: 0.3rem;
  border-bottom: 2px solid #eee;
}

.markdown-renderer :deep(h2) {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0.8rem 0 0.4rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid #eee;
}

.markdown-renderer :deep(h3) {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0.6rem 0 0.3rem;
}

.markdown-renderer :deep(h4),
.markdown-renderer :deep(h5),
.markdown-renderer :deep(h6) {
  font-size: 1rem;
  font-weight: 700;
  margin: 0.5rem 0 0.2rem;
}

/* 段落 */
.markdown-renderer :deep(p) {
  margin: 0.5rem 0;
}

/* 列表 */
.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.markdown-renderer :deep(li) {
  margin: 0.2rem 0;
}

/* 代码块 */
.markdown-renderer :deep(code) {
  background: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #d63384;
}

.markdown-renderer :deep(pre) {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.markdown-renderer :deep(pre code) {
  background: none;
  padding: 0;
  color: #333;
}

/* 引用 */
.markdown-renderer :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #666;
  font-style: italic;
}

/* 链接 */
.markdown-renderer :deep(a) {
  color: #8b5cf6;
  text-decoration: none;
}

.markdown-renderer :deep(a:hover) {
  text-decoration: underline;
}

/* 分割线 */
.markdown-renderer :deep(hr) {
  border: none;
  border-top: 2px solid #eee;
  margin: 1rem 0;
}

/* 表格 */
.markdown-renderer :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
}

.markdown-renderer :deep(th),
.markdown-renderer :deep(td) {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

.markdown-renderer :deep(th) {
  background: #f5f5f5;
  font-weight: 700;
}

/* 图片 */
.markdown-renderer :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
  margin: 0.5rem 0;
}

/* 任务列表 */
.markdown-renderer :deep(input[type="checkbox"]) {
  margin-right: 0.5rem;
}

/* 🆕 Obsidian 风格样式（v0.9.0）*/
.markdown-renderer :deep(.task-link) {
  color: #8b5cf6;
  text-decoration: none;
  border-bottom: 1px dashed #8b5cf6;
  cursor: pointer;
  transition: all 0.2s;
}

.markdown-renderer :deep(.task-link:hover) {
  background: rgba(139, 92, 246, 0.1);
  border-bottom-style: solid;
}

.markdown-renderer :deep(.link-icon) {
  font-size: 0.85em;
  margin-right: 2px;
}

.markdown-renderer :deep(.broken-link) {
  color: #999;
  text-decoration: line-through;
}

.markdown-renderer :deep(.tag-badge) {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.85em;
  margin: 0 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.markdown-renderer :deep(.tag-badge:hover) {
  opacity: 0.8;
}
</style>
