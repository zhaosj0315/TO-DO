import { ref, computed } from 'vue'
import { useOfflineTaskStore } from '@/stores/offlineTaskStore'

export function useAutocomplete(textareaRef) {
  const taskStore = useOfflineTaskStore()
  
  const showAutocomplete = ref(false)
  const autocompleteType = ref(null) // 'tag' | 'link'
  const autocompleteQuery = ref('')
  const autocompletePosition = ref({ top: 0, left: 0 })
  const triggerStart = ref(0) // 触发位置

  // 🏷️ 标签建议
  const tagSuggestions = computed(() => {
    if (autocompleteType.value !== 'tag') return []
    
    const query = autocompleteQuery.value.toLowerCase()
    const allTags = new Set()
    
    // 收集所有标签
    taskStore.tasks.forEach(task => {
      task.tags?.forEach(tag => allTags.add(tag))
    })
    
    // 过滤和排序
    return Array.from(allTags)
      .filter(tag => tag.toLowerCase().includes(query))
      .sort((a, b) => {
        // 优先显示以查询开头的
        const aStarts = a.toLowerCase().startsWith(query)
        const bStarts = b.toLowerCase().startsWith(query)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        return a.localeCompare(b)
      })
      .slice(0, 10)
      .map(tag => {
        // 统计使用次数
        const count = taskStore.tasks.filter(t => t.tags?.includes(tag)).length
        return {
          icon: '🏷️',
          text: `#${tag}`,
          value: tag,
          count
        }
      })
  })

  // 🔗 任务链接建议
  const linkSuggestions = computed(() => {
    if (autocompleteType.value !== 'link') return []
    
    const query = autocompleteQuery.value.toLowerCase()
    
    return taskStore.tasks
      .filter(task => task.text.toLowerCase().includes(query))
      .sort((a, b) => {
        // 优先显示以查询开头的
        const aStarts = a.text.toLowerCase().startsWith(query)
        const bStarts = b.text.toLowerCase().startsWith(query)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        return a.text.localeCompare(b.text)
      })
      .slice(0, 10)
      .map(task => ({
        icon: task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🔵',
        text: task.text,
        value: task.text,
        taskId: task.id
      }))
  })

  // 合并建议
  const suggestions = computed(() => {
    const result = autocompleteType.value === 'tag' ? tagSuggestions.value 
      : autocompleteType.value === 'link' ? linkSuggestions.value 
      : []
    console.log('💡 生成建议', { type: autocompleteType.value, count: result.length, suggestions: result })
    return result
  })

  // 🔍 检测触发器
  function handleInput(event) {
    // 支持多个 textarea：优先使用事件目标，否则使用 ref
    const textarea = event?.target || textareaRef.value
    if (!textarea) {
      console.log('🔍 自动补全 - textarea 不存在')
      return
    }

    const text = textarea.value
    const cursorPos = textarea.selectionStart
    
    console.log('🔍 自动补全 - 输入检测', { text, cursorPos })

    // 获取光标前的文本
    const textBeforeCursor = text.substring(0, cursorPos)

    // 检测标签触发 #
    const tagMatch = textBeforeCursor.match(/#([\w\u4e00-\u9fa5/]*)$/)
    if (tagMatch) {
      console.log('🏷️ 检测到标签触发', { query: tagMatch[1] })
      autocompleteType.value = 'tag'
      autocompleteQuery.value = tagMatch[1]
      triggerStart.value = cursorPos - tagMatch[0].length
      updatePosition(textarea, cursorPos)
      showAutocomplete.value = true
      return
    }

    // 检测链接触发 [[
    const linkMatch = textBeforeCursor.match(/\[\[([^\]]*?)$/)
    if (linkMatch) {
      console.log('🔗 检测到链接触发', { query: linkMatch[1] })
      autocompleteType.value = 'link'
      autocompleteQuery.value = linkMatch[1]
      triggerStart.value = cursorPos - linkMatch[0].length
      updatePosition(textarea, cursorPos)
      showAutocomplete.value = true
      return
    }

    // 没有匹配，关闭自动补全
    console.log('❌ 无匹配，关闭自动补全')
    showAutocomplete.value = false
  }

  // 📍 更新下拉位置
  function updatePosition(textarea, cursorPos) {
    // 创建临时元素来计算光标位置
    const div = document.createElement('div')
    const style = window.getComputedStyle(textarea)
    
    // 复制样式
    div.style.position = 'absolute'
    div.style.visibility = 'hidden'
    div.style.whiteSpace = 'pre-wrap'
    div.style.wordWrap = 'break-word'
    div.style.font = style.font
    div.style.padding = style.padding
    div.style.border = style.border
    div.style.width = style.width
    div.style.lineHeight = style.lineHeight
    
    // 复制文本到光标位置
    div.textContent = textarea.value.substring(0, cursorPos)
    document.body.appendChild(div)
    
    // 获取 textarea 的位置
    const textareaRect = textarea.getBoundingClientRect()
    const divRect = div.getBoundingClientRect()
    
    // 计算下拉位置
    autocompletePosition.value = {
      top: textareaRect.top + divRect.height + window.scrollY + 5,
      left: textareaRect.left + window.scrollX
    }
    
    document.body.removeChild(div)
  }

  // ✅ 选择建议
  function selectSuggestion(item) {
    // 查找当前聚焦的 textarea
    const textarea = document.activeElement?.tagName === 'TEXTAREA' 
      ? document.activeElement 
      : textareaRef.value
    if (!textarea) return

    const text = textarea.value
    const cursorPos = textarea.selectionStart

    let replacement = ''
    let newCursorPos = 0

    if (autocompleteType.value === 'tag') {
      // 替换 #xxx 为 #完整标签
      const before = text.substring(0, triggerStart.value)
      const after = text.substring(cursorPos)
      replacement = `${before}#${item.value} ${after}`
      newCursorPos = before.length + item.value.length + 2
    } else if (autocompleteType.value === 'link') {
      // 替换 [[xxx 为 [[完整任务名]]
      const before = text.substring(0, triggerStart.value)
      const after = text.substring(cursorPos)
      replacement = `${before}[[${item.value}]] ${after}`
      newCursorPos = before.length + item.value.length + 5
    }

    // 更新文本
    textarea.value = replacement
    
    // 触发 input 事件（让 v-model 更新）
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    
    // 设置光标位置
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()

    // 关闭自动补全
    showAutocomplete.value = false
  }

  // ❌ 关闭自动补全
  function closeAutocomplete() {
    showAutocomplete.value = false
  }

  return {
    showAutocomplete,
    suggestions,
    autocompletePosition,
    handleInput,
    selectSuggestion,
    closeAutocomplete
  }
}
