<template>
  <div v-if="visible" class="file-preview-overlay" @click="handleOverlayClick">
    <div class="file-preview-modal" @click.stop>
      <!-- 头部 -->
      <div class="preview-header">
        <div class="file-info">
          <span class="file-icon">{{ getFileIcon(file?.type) }}</span>
          <span class="file-name">{{ file?.originalName || file?.name }}</span>
        </div>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>
      
      <!-- 预览内容 -->
      <div class="preview-content">
        <!-- 图片预览 -->
        <img
          v-if="file?.type === 'image' && fileUrl"
          :src="fileUrl"
          class="image-viewer"
          alt="图片预览"
        />
        
        <!-- PDF 预览 -->
        <div v-else-if="file?.type === 'pdf' && pdfData" class="pdf-container">
          <VuePdfEmbed :source="pdfData" class="pdf-viewer" />
        </div>
        
        <!-- 视频预览 -->
        <video
          v-else-if="file?.type === 'video' && fileUrl"
          :src="fileUrl"
          controls
          class="video-player"
        ></video>
        
        <!-- 文本预览 -->
        <pre
          v-else-if="file?.type === 'document' && textContent"
          class="text-viewer"
        >{{ textContent }}</pre>
        
        <!-- 不支持预览 -->
        <div v-else class="no-preview">
          <div class="no-preview-icon">{{ getFileIcon(file?.type) }}</div>
          <div class="no-preview-text">此文件类型不支持预览</div>
          <button class="btn-download" @click="handleDownload">
            ⬇️ 下载文件
          </button>
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="preview-footer">
        <div class="file-size">{{ formatFileSize(file?.size) }}</div>
        <button class="btn-download-footer" @click="handleDownload">
          ⬇️ 下载
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Filesystem, Directory } from '@capacitor/filesystem'
import VuePdfEmbed from 'vue-pdf-embed'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'download'])

const fileUrl = ref('')
const textContent = ref('')
const pdfData = ref(null)

// 🆕 Android 返回手势监听
let backButtonListener = null

onMounted(() => {
  if (Capacitor.isNativePlatform()) {
    App.addListener('backButton', handleBackButton)
  }
})

onUnmounted(() => {
  if (Capacitor.isNativePlatform()) {
    App.removeAllListeners()
  }
})

const handleBackButton = () => {
  if (props.visible) {
    emit('close')
  }
}

// 监听弹窗显示状态，重新加载文件
watch(() => [props.visible, props.file], async ([visible, newFile]) => {
  // 清理旧数据
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
  }
  fileUrl.value = ''
  textContent.value = ''
  pdfData.value = null
  
  if (!visible || !newFile) return
  
  try {
    let base64Data
    
    // 优先使用 base64Data（Web端）
    if (newFile.base64Data) {
      console.log('📎 使用 base64Data（Web端）')
      base64Data = newFile.base64Data
    } else {
      // 原生端：从文件系统读取
      console.log('📎 从文件系统读取（原生端）')
      const file = await Filesystem.readFile({
        path: newFile.path,
        directory: Directory.Data
      })
      base64Data = file.data
    }
    
    // PDF：转换为Uint8Array
    if (newFile.type === 'pdf') {
      const binary = atob(base64Data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      pdfData.value = bytes
    }
    
    // 图片和视频：转换为 Blob URL
    if (newFile.type === 'image' || newFile.type === 'video') {
      const mimeType = getMimeType(newFile.ext)
      const blob = base64ToBlob(base64Data, mimeType)
      fileUrl.value = URL.createObjectURL(blob)
    }
    
    // 文本文件：直接显示
    if (newFile.type === 'document' && ['txt', 'rtf'].includes(newFile.ext)) {
      const text = atob(base64Data)
      textContent.value = text
    }
  } catch (e) {
    console.error('文件加载失败:', e)
  }
}, { immediate: true })

// 点击遮罩关闭
const handleOverlayClick = () => {
  emit('close')
}

// 下载文件
const handleDownload = async () => {
  try {
    const file = await Filesystem.readFile({
      path: props.file.path,
      directory: Directory.Data
    })
    
    const mimeType = getMimeType(props.file.ext)
    const blob = base64ToBlob(file.data, mimeType)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.file.originalName || props.file.name
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('文件下载失败:', e)
    alert('文件下载失败: ' + e.message)
  }
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
  if (!bytes) return '0 B'
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
</script>

<style scoped>
.file-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.file-preview-modal {
  background: #ffffff;
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e8e8e8;
  background: #f9f9f9;
  position: relative;
}

/* 顶部小横条 */
.preview-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: #d0d0d0;
  border-radius: 2px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 24px;
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
}

.btn-close:hover {
  background: #e8e8e8;
  color: #333;
}

.preview-content {
  flex: 1;
  overflow: auto;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #525659;
}

.pdf-viewer {
  width: 100%;
  min-height: 500px;
}

.image-viewer {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  background: #000;
}

.image-viewer {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  background: #000;
}

.video-player {
  width: 100%;
  max-height: 70vh;
  background: #000;
}

.text-viewer {
  padding: 1.5rem;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #ffffff;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  min-height: 300px;
}

.no-preview-icon {
  font-size: 64px;
  margin-bottom: 1rem;
}

.no-preview-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 1.5rem;
}

.btn-download {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e8e8e8;
  background: #f9f9f9;
}

.file-size {
  font-size: 14px;
  color: #999;
}

.btn-download-footer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download-footer:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
