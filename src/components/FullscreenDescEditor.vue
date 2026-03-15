<template>
  <div class="fde-overlay">
    <!-- 顶部导航栏 -->
    <div class="fde-header">
      <div class="fde-nav">
        <div class="fde-title-area">
          <input v-if="titleEditable" v-model="localTitle" class="fde-title-input" placeholder="任务标题" @keydown.enter.prevent />
          <span v-else class="fde-title-text">{{ title }}</span>
        </div>
        <div class="fde-nav-btns">
          <button class="fde-btn-secondary" @click="handleClose">完成</button>
          <button v-if="showPreviewBtn" class="fde-btn-primary" @click="$emit('preview')">预览</button>
        </div>
      </div>
      <!-- 状态栏 -->
      <div class="fde-status-bar">
        <div class="fde-status-left">
          <span v-if="editDuration > 0" class="fde-status-text">编辑 {{ editDuration }} 秒</span>
          <span v-if="localValue.length > 0" class="fde-status-text">{{ localValue.length }} 字</span>
          <button v-if="localValue.length > 0" class="fde-md-toggle" :class="{ active: isPreview }" @click="isPreview = !isPreview">
            {{ isPreview ? '✏️ 编辑' : '👁️ 预览' }}
          </button>
        </div>
        <span class="fde-status-text">{{ currentTime }}</span>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="fde-body">
      <!-- 剪贴板历史 -->
      <div v-if="showClipHistory" class="fde-sheet">
        <div class="fde-sheet-header">
          <span>📋 最近粘贴</span>
          <button @click="showClipHistory = false" class="fde-close-btn">✕</button>
        </div>
        <div class="fde-sheet-list">
          <div v-for="(item, i) in clipHistory" :key="i" class="fde-sheet-item" @click="insertText(item.text); showClipHistory = false">
            <div class="fde-item-text">{{ item.text.substring(0, 100) }}{{ item.text.length > 100 ? '...' : '' }}</div>
            <div class="fde-item-time">{{ item.time }}</div>
          </div>
        </div>
        <div class="fde-sheet-footer">
          <button @click="clearClipHistory" class="fde-danger-btn">🗑️ 清空历史</button>
        </div>
      </div>

      <!-- AI 菜单 -->
      <div v-if="showAIMenu" class="fde-sheet">
        <div class="fde-sheet-header fde-sheet-header-purple">
          <span>🤖 AI 助手</span>
          <button @click="showAIMenu = false" class="fde-close-btn fde-close-btn-white">✕</button>
        </div>
        <div class="fde-sheet-list">
          <button class="fde-menu-item" @click="runAI('generateTitle')" :disabled="!localValue.trim()">
            <span class="fde-menu-icon">✨</span>
            <div><div class="fde-menu-title">生成标题</div><div class="fde-menu-desc">根据描述智能生成标题</div></div>
          </button>
          <button class="fde-menu-item" @click="runAI('suggestion')" :disabled="!localTitle.trim()">
            <span class="fde-menu-icon">💡</span>
            <div><div class="fde-menu-title">生成描述</div><div class="fde-menu-desc">基于标题生成任务描述</div></div>
          </button>
          <button class="fde-menu-item" @click="runAI('continue')" :disabled="!localValue.trim()">
            <span class="fde-menu-icon">📝</span>
            <div><div class="fde-menu-title">续写内容</div><div class="fde-menu-desc">智能补充当前描述</div></div>
          </button>
          <button class="fde-menu-item" @click="runAI('polish')" :disabled="!localValue.trim()">
            <span class="fde-menu-icon">🎯</span>
            <div><div class="fde-menu-title">优化润色</div><div class="fde-menu-desc">改善表达和结构</div></div>
          </button>
          <button class="fde-menu-item" @click="runAI('extract')" :disabled="!localValue.trim() || localValue.length < 50">
            <span class="fde-menu-icon">📋</span>
            <div><div class="fde-menu-title">提取要点</div><div class="fde-menu-desc">从长文本提取关键步骤</div></div>
          </button>
          <button class="fde-menu-item" @click="runAI('rewrite')" :disabled="!localValue.trim()">
            <span class="fde-menu-icon">🔄</span>
            <div><div class="fde-menu-title">改写风格</div><div class="fde-menu-desc">正式/口语/简洁风格切换</div></div>
          </button>
          <button class="fde-menu-item" @click="runAI('markdown')" :disabled="!localValue.trim()">
            <span class="fde-menu-icon">📐</span>
            <div><div class="fde-menu-title">Markdown 渲染</div><div class="fde-menu-desc">一键格式化为 Markdown</div></div>
          </button>
          <button class="fde-menu-item" @click="runAI('autoTag')" :disabled="!localTitle.trim() && !localValue.trim()">
            <span class="fde-menu-icon">🏷️</span>
            <div><div class="fde-menu-title">自动打标签</div><div class="fde-menu-desc">AI 推荐 #标签，采纳后插入描述</div></div>
          </button>
        </div>
      </div>

      <!-- AI 预览结果 -->
      <div v-if="showAIResult" class="fde-sheet">
        <div class="fde-sheet-header fde-sheet-header-purple">
          <span>{{ aiResultTitle }}</span>
          <button @click="showAIResult = false" class="fde-close-btn fde-close-btn-white">✕</button>
        </div>
        <div class="fde-ai-result-body">
          <div v-if="aiLoading" class="fde-ai-loading">⏳ AI 思考中...</div>
          <div v-else class="fde-ai-result-text">{{ aiResultContent }}</div>
        </div>
        <div v-if="!aiLoading" class="fde-sheet-footer fde-ai-actions">
          <button @click="adoptAIResult" class="fde-adopt-btn">✓ 采纳</button>
          <button @click="showAIResult = false" class="fde-ignore-btn">✕ 忽略</button>
        </div>
      </div>

      <!-- 字数提示 -->
      <div v-if="localValue.length < 50 && !isPreview" class="fde-hint">
        {{ localValue.length === 0 ? '建议 50-200 字' : `已输入 ${localValue.length} 字` }}
      </div>

      <!-- Markdown 预览 -->
      <div v-if="isPreview" class="fde-md-preview">
        <MarkdownRenderer :content="localValue" :media="localMedia" />
      </div>

      <!-- 编辑模式 -->
      <textarea
        v-else
        ref="textareaRef"
        v-model="localValue"
        class="fde-textarea"
        placeholder="输入任务描述（可选）... 提示：输入 # 添加标签，输入 [[ 链接任务"
        autofocus
      ></textarea>
    </div>

    <!-- 底部工具栏 -->
    <div class="fde-toolbar">
      <button class="fde-tool-btn" @click="paste" @touchstart="handlePasteLongPressStart" @touchend="handlePasteLongPressEnd" @contextmenu.prevent="openClipHistory">
        📋 粘贴
      </button>
      <button class="fde-tool-btn" @click="clearContent">🔄 清空</button>
      <button class="fde-tool-btn" @click="pickImage" :disabled="aiLoading">🖼️ 图片</button>
      <button class="fde-tool-btn" @click="pickFile" :disabled="aiLoading">📎 文件</button>
      <button class="fde-tool-btn" @click="showAIMenu = !showAIMenu" :disabled="aiLoading">
        {{ aiLoading ? '⏳ 思考中...' : '🤖 AI 助手' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Clipboard } from '@capacitor/clipboard'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  title: { type: String, default: '' },
  titleEditable: { type: Boolean, default: false },
  showPreviewBtn: { type: Boolean, default: false },
  taskId: { type: [String, Number], default: 'temp' },
  media: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'update:title', 'update:media', 'close', 'preview'])

const localValue = ref(props.modelValue)
const localTitle = ref(props.title)
const localMedia = ref([...props.media])
const isPreview = ref(false)
const showClipHistory = ref(false)
const clipHistory = ref([])
const showAIMenu = ref(false)
const showAIResult = ref(false)
const aiResultTitle = ref('')
const aiResultContent = ref('')
const aiResultMode = ref('')
const aiLoading = ref(false)
const textareaRef = ref(null)
const currentTime = ref('')
const editDuration = ref(0)
let timer = null
let pasteLongPressTimer = null

watch(() => props.modelValue, v => { localValue.value = v })
watch(() => props.title, v => { localTitle.value = v })
watch(localValue, v => emit('update:modelValue', v))
watch(localTitle, v => emit('update:title', v))

onMounted(() => {
  updateTime()
  timer = setInterval(() => {
    editDuration.value++
    updateTime()
  }, 1000)
})

onUnmounted(() => { if (timer) clearInterval(timer) })

const updateTime = () => {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  currentTime.value = `${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const handleClose = () => {
  emit('update:modelValue', localValue.value)
  emit('update:title', localTitle.value)
  emit('update:media', localMedia.value)
  emit('close')
}

// 插入文本到光标位置
const insertText = (text) => {
  const ta = textareaRef.value
  if (ta) {
    const s = ta.selectionStart, e = ta.selectionEnd
    localValue.value = localValue.value.substring(0, s) + text + localValue.value.substring(e)
  } else {
    localValue.value += text
  }
}

// 📋 粘贴
const paste = async () => {
  try {
    const { value } = await Clipboard.read()
    if (value?.trim()) {
      insertText(value)
      const history = JSON.parse(localStorage.getItem('clipboard_history') || '[]')
      if (!history.some(i => i.text === value)) {
        history.unshift({ text: value, time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) })
        if (history.length > 10) history.pop()
        localStorage.setItem('clipboard_history', JSON.stringify(history))
      }
    }
  } catch (e) { console.error(e) }
}

const openClipHistory = () => {
  const history = JSON.parse(localStorage.getItem('clipboard_history') || '[]')
  if (history.length) { clipHistory.value = history; showClipHistory.value = true }
}

const handlePasteLongPressStart = () => { pasteLongPressTimer = setTimeout(openClipHistory, 500) }
const handlePasteLongPressEnd = () => { if (pasteLongPressTimer) { clearTimeout(pasteLongPressTimer); pasteLongPressTimer = null } }

const clearClipHistory = () => {
  if (confirm('确定要清空剪贴板历史吗？')) {
    localStorage.removeItem('clipboard_history')
    clipHistory.value = []
    showClipHistory.value = false
  }
}

// 🔄 清空
const clearContent = () => {
  if (!localValue.value.trim()) return
  if (confirm('确定要清空描述吗？')) localValue.value = ''
}

// 🖼️ 图片
const pickImage = async () => {
  try {
    const photo = await Camera.getPhoto({ quality: 80, allowEditing: false, resultType: CameraResultType.Base64, source: CameraSource.Photos })
    if (!photo.base64String) return
    const mediaId = `img_${Date.now()}`
    const fileName = `${mediaId}.jpg`
    const taskId = props.taskId || 'temp'
    try { await Filesystem.mkdir({ path: `media/${taskId}`, directory: Directory.Data, recursive: true }) } catch (e) {}
    await Filesystem.writeFile({ path: `media/${taskId}/${fileName}`, data: photo.base64String, directory: Directory.Data })
    const newMedia = [...localMedia.value, { id: mediaId, type: 'image', name: fileName, path: `media/${taskId}/${fileName}`, size: photo.base64String.length, uploadedAt: new Date().toISOString() }]
    localMedia.value = newMedia
    emit('update:media', newMedia)
    insertText(`\n![图片](local://${mediaId})\n`)
  } catch (e) { console.error('图片上传失败:', e) }
}

// 📎 文件
const pickFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov,.avi,.zip,.txt'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('文件大小不能超过 10MB'); return }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const base64Data = ev.target.result.split(',')[1]
        const mediaId = `file_${Date.now()}`
        const ext = file.name.split('.').pop()
        const fileName = `${mediaId}.${ext}`
        const taskId = props.taskId || 'temp'
        try { await Filesystem.mkdir({ path: `media/${taskId}`, directory: Directory.Data, recursive: true }) } catch (e) {}
        await Filesystem.writeFile({ path: `media/${taskId}/${fileName}`, data: base64Data, directory: Directory.Data })
        const newMedia = [...localMedia.value, { id: mediaId, type: getFileType(ext), name: file.name, originalName: file.name, path: `media/${taskId}/${fileName}`, size: file.size, ext, uploadedAt: new Date().toISOString() }]
        localMedia.value = newMedia
        emit('update:media', newMedia)
        insertText(`\n[📎 ${file.name}](local://${mediaId})\n`)
      } catch (e) { console.error('文件上传失败:', e) }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

const getFileType = (ext) => {
  ext = ext.toLowerCase()
  if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) return 'image'
  if (['mp4','mov','avi','mkv'].includes(ext)) return 'video'
  if (['pdf'].includes(ext)) return 'pdf'
  if (['xls','xlsx','csv'].includes(ext)) return 'excel'
  if (['ppt','pptx'].includes(ext)) return 'powerpoint'
  if (['zip','rar','7z'].includes(ext)) return 'archive'
  return 'document'
}

// 🤖 AI
const getDefaultModel = () => {
  const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
  const defaultId = localStorage.getItem('ai_default_model')
  return models.find(m => m.id === defaultId) || models[0]
}

const getApiUrl = (model) => {
  let url = model.url
  if (!url.includes('/v1/chat/completions')) {
    url = url.replace(/\/api\/.*$/, '').replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
  }
  return url
}

const callAI = async (prompt, maxTokens = 1000) => {
  const model = getDefaultModel()
  if (!model) throw new Error('请先配置 AI 模型')
  const res = await fetch(getApiUrl(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${model.apiKey || 'dummy'}` },
    body: JSON.stringify({ model: model.modelName || model.model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: maxTokens })
  })
  if (!res.ok) throw new Error(`AI 请求失败: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || data.response || ''
}

const AI_PROMPTS = {
  generateTitle: (desc) => `请根据以下任务描述，生成一个简洁的任务标题（10-20字），只返回标题文本：\n\n${desc}`,
  suggestion: (title) => `请根据任务标题"${title}"，生成3-5个执行步骤，每行一条以"- "开头，只返回列表：`,
  continue: (desc) => `请续写以下任务描述，保持风格一致，直接返回续写内容：\n\n${desc}`,
  polish: (desc) => `请优化以下任务描述，使其更清晰专业，直接返回优化后内容：\n\n${desc}`,
  extract: (desc) => `请从以下内容提取3-5个关键要点，每行一条以"- "开头，只返回列表：\n\n${desc}`,
  rewrite: (desc) => `请用简洁口语化方式改写以下内容，直接返回改写结果：\n\n${desc}`,
  markdown: (desc) => `请将以下内容转换为格式良好的Markdown，直接返回Markdown内容：\n\n${desc}`,
  autoTag: (input) => `请根据以下任务信息，推荐3-6个合适的标签（中文或英文均可）。
标签应简洁（2-6字），能反映任务的主题、领域或类型。
只返回标签列表，每行一个，以"#"开头，不要其他内容。

任务信息：${input}`
}

const AI_TITLES = {
  generateTitle: '✨ 生成标题', suggestion: '💡 生成描述', continue: '📝 续写内容',
  polish: '🎯 优化润色', extract: '📋 提取要点', rewrite: '🔄 改写风格', markdown: '📐 Markdown 渲染',
  autoTag: '🏷️ 自动打标签'
}

const runAI = async (action) => {
  showAIMenu.value = false
  const model = getDefaultModel()
  if (!model) { alert('请先配置 AI 模型'); return }

  aiLoading.value = true
  aiResultMode.value = action
  aiResultTitle.value = AI_TITLES[action]
  aiResultContent.value = ''
  showAIResult.value = true

  try {
    let input
    if (action === 'suggestion') {
      input = localTitle.value
    } else if (action === 'autoTag') {
      input = `标题：${localTitle.value}${localValue.value ? '\n描述：' + localValue.value.slice(0, 200) : ''}`
    } else {
      input = localValue.value
    }
    const content = await callAI(AI_PROMPTS[action](input))
    aiResultContent.value = content
    // generateTitle 直接应用，不走预览
    if (action === 'generateTitle') {
      localTitle.value = content.trim()
      showAIResult.value = false
    }
  } catch (e) {
    aiResultContent.value = '❌ ' + e.message
  } finally {
    aiLoading.value = false
  }
}

const adoptAIResult = () => {
  const mode = aiResultMode.value
  const content = aiResultContent.value
  if (mode === 'suggestion') {
    localValue.value = content + '\n\n' + localValue.value
  } else if (mode === 'continue') {
    localValue.value += '\n\n' + content
  } else if (mode === 'markdown') {
    localValue.value = content
    isPreview.value = true
  } else if (mode === 'autoTag') {
    // 提取 #标签 并追加到描述末尾
    const tags = content.split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('#'))
      .join(' ')
    if (tags) {
      localValue.value = (localValue.value ? localValue.value + '\n\n' : '') + tags
    }
  } else {
    localValue.value = content
  }
  showAIResult.value = false
}
</script>

<style scoped>
.fde-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: #fff; z-index: 10002;
  display: flex; flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px);
  overflow: hidden;
}
.fde-header {
  flex-shrink: 0;
  background: #fff;
  border-bottom: 0.5px solid #e8e8e8;
  margin-top: env(safe-area-inset-top, 20px);
}
.fde-nav {
  display: flex; justify-content: space-between; align-items: center;
  height: 44px; padding: 0 1rem;
}
.fde-title-area { flex: 1; padding: 0 1rem; }
.fde-title-input {
  width: 100%; font-size: 17px; font-weight: 600; color: #000;
  border: none; background: transparent; outline: none; padding: 0;
}
.fde-title-input::placeholder { color: #999; font-weight: 500; }
.fde-title-text { font-size: 17px; font-weight: 600; color: #000; }
.fde-nav-btns { display: flex; gap: 1rem; align-items: center; }
.fde-btn-primary { background: transparent; border: none; color: #007aff; font-size: 17px; font-weight: 600; cursor: pointer; padding: 0; min-width: 50px; text-align: right; }
.fde-btn-secondary { background: transparent; border: none; color: #666; font-size: 17px; font-weight: 500; cursor: pointer; padding: 0; min-width: 50px; text-align: right; }
.fde-btn-primary:active, .fde-btn-secondary:active { opacity: 0.4; }
.fde-status-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; }
.fde-status-left { display: flex; gap: 1rem; align-items: center; }
.fde-status-text { font-size: 12px; color: #8e8e93; }
.fde-md-toggle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none; color: white; font-size: 12px; font-weight: 600;
  padding: 4px 12px; border-radius: 12px; cursor: pointer;
}
.fde-md-toggle.active { background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); }
.fde-body {
  position: relative; flex: 1; display: flex; flex-direction: column;
  min-height: 0; overflow: hidden;
}
.fde-textarea {
  flex: 1; width: 100%; padding: 1.5rem; border: none;
  font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  resize: none; line-height: 1.6; background: white; color: #1a1a1a;
}
.fde-textarea:focus { outline: none; }
.fde-textarea::placeholder { color: #c7c7cc; }
.fde-md-preview { flex: 1; overflow-y: auto; padding: 1.5rem; }
.fde-hint {
  position: absolute; top: 1rem; right: 1rem;
  font-size: 12px; color: #ff9500;
  background: rgba(255,149,0,0.1); padding: 4px 10px; border-radius: 12px;
  pointer-events: none; z-index: 1;
}
/* Sheet 通用 */
.fde-sheet {
  position: absolute; bottom: 0; left: 0; right: 0; max-height: 70%;
  background: white; border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.15); z-index: 10;
  display: flex; flex-direction: column;
  animation: fde-slide-up 0.3s ease;
}
@keyframes fde-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.fde-sheet-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem; border-bottom: 1px solid #e8e8e8;
  font-weight: 600; font-size: 15px; border-radius: 16px 16px 0 0;
}
.fde-sheet-header-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.fde-close-btn {
  background: #f0f0f0; border: none; width: 28px; height: 28px;
  border-radius: 50%; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.fde-close-btn-white { background: rgba(255,255,255,0.2); color: white; }
.fde-sheet-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
.fde-sheet-item {
  padding: 0.75rem; margin-bottom: 0.5rem;
  background: #f8f8f8; border-radius: 8px; cursor: pointer;
}
.fde-sheet-item:active { background: #e8e8e8; }
.fde-item-text { font-size: 14px; color: #333; line-height: 1.4; margin-bottom: 0.25rem; }
.fde-item-time { font-size: 11px; color: #999; }
.fde-sheet-footer { padding: 0.75rem; border-top: 1px solid #e8e8e8; }
.fde-danger-btn { width: 100%; padding: 0.6rem; background: #ff3b30; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
/* AI 菜单 */
.fde-menu-item {
  display: flex; align-items: center; padding: 1rem; margin-bottom: 0.5rem;
  background: #f8f8f8; border: none; border-radius: 12px; cursor: pointer;
  width: 100%; text-align: left; transition: all 0.2s;
}
.fde-menu-item:active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.fde-menu-item:active .fde-menu-title, .fde-menu-item:active .fde-menu-desc { color: white; }
.fde-menu-item:disabled { opacity: 0.4; cursor: not-allowed; }
.fde-menu-icon { font-size: 24px; margin-right: 1rem; flex-shrink: 0; }
.fde-menu-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 0.25rem; }
.fde-menu-desc { font-size: 12px; color: #999; }
/* AI 结果 */
.fde-ai-result-body { flex: 1; overflow-y: auto; padding: 1rem; }
.fde-ai-loading { text-align: center; color: #999; padding: 2rem; }
.fde-ai-result-text { font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap; }
.fde-ai-actions { display: flex; gap: 0.5rem; }
.fde-adopt-btn { flex: 1; padding: 0.6rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
.fde-ignore-btn { flex: 1; padding: 0.6rem; background: #f0f0f0; color: #666; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
/* 工具栏 */
.fde-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 0.5rem; padding: 0.75rem 1rem;
  background: #f8f8f8; border-top: 0.5px solid #e8e8e8;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  overflow-x: auto; flex-shrink: 0;
}
.fde-tool-btn {
  padding: 0.5rem 0.75rem; background: #007aff; color: white;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 500;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
}
.fde-tool-btn:active { opacity: 0.8; transform: scale(0.98); }
.fde-tool-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
