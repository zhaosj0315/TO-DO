import { ref, onMounted, onUnmounted } from 'vue'

export function useTextSelection(containerRef) {
  const showMenu = ref(false)
  const menuPosition = ref({ top: 0, left: 0 })
  const selectedText = ref('')
  const selectionRange = ref(null)
  const frozenText = ref('') // 冻结的文本，不会因为选择变化而改变

  const handleMouseUp = (event) => {
    // 延迟执行，确保选择完成
    setTimeout(() => {
      const selection = window.getSelection()
      const text = selection.toString().trim()

      console.log('useTextSelection - selected text:', text)

      // 如果没有选中文本，隐藏菜单
      if (!text) {
        showMenu.value = false
        return
      }

      // ✅ 优化1: 最小字数限制（10个字符）
      if (text.length < 10) {
        console.log('useTextSelection - text too short (<10 chars)')
        return
      }

      // ✅ 优化2: 过滤纯数字
      if (/^\d+$/.test(text)) {
        console.log('useTextSelection - pure number, skipped')
        return
      }

      // ✅ 优化3: 过滤单个单词（无空格、无标点，且长度<20）
      if (!/[\s\p{P}]/u.test(text) && text.length < 20) {
        console.log('useTextSelection - single word, skipped')
        return
      }

      // ✅ 优化4: 限制触发区域（只在可编辑区域）
      // 检查是否在textarea或可编辑元素内
      let isInAllowedContainer = false
      
      // 方法1: 检查anchorNode是否是textarea或其父元素
      let currentNode = selection.anchorNode
      
      while (currentNode) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const element = currentNode
          
          // 检查是否是textarea或可编辑元素
          if (element.tagName === 'TEXTAREA' || 
              element.contentEditable === 'true' ||
              element.classList.contains('editable-content')) {
            isInAllowedContainer = true
            break
          }
          
          // ✅ 检查该元素内是否包含textarea（解决跨元素选择问题）
          if (element.querySelector && element.querySelector('textarea')) {
            isInAllowedContainer = true
            break
          }
        }
        currentNode = currentNode.parentNode
      }
      
      if (!isInAllowedContainer) {
        console.log('useTextSelection - not in allowed container')
        return
      }

      // ✅ 优化5: 过滤按钮、链接内的文字
      const element = selection.anchorNode.parentElement
      if (element && (element.closest('button') || element.closest('a'))) {
        console.log('useTextSelection - in button or link, skipped')
        return
      }

      // 检查选中的文本是否在容器内（保留原有逻辑）
      if (containerRef?.value && !containerRef.value.contains(selection.anchorNode)) {
        console.log('useTextSelection - text not in container')
        return
      }

      selectedText.value = text
      frozenText.value = text // 冻结文本
      selectionRange.value = selection.getRangeAt(0).cloneRange() // 克隆 range

      console.log('useTextSelection - selectedText.value set to:', selectedText.value)
      console.log('useTextSelection - frozenText.value set to:', frozenText.value)

      // 计算菜单位置（选中文本下方居中）
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      // 菜单尺寸（估算）
      const menuWidth = 320
      const menuHeight = 150
      
      // 使用视口坐标（fixed定位）
      let left = rect.left + (rect.width / 2) - (menuWidth / 2)
      let top = rect.bottom + 5
      
      // 边界检测 - 左边界
      if (left < 10) {
        left = 10
      }
      
      // 边界检测 - 右边界
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10
      }
      
      // 边界检测 - 下边界（如果超出，显示在选中文本上方）
      if (top + menuHeight > window.innerHeight - 10) {
        top = rect.top - menuHeight - 5
      }
      
      // 边界检测 - 上边界
      if (top < 10) {
        top = 10
      }

      menuPosition.value = {
        top: top,
        left: left
      }

      showMenu.value = true
      console.log('useTextSelection - menu shown, frozenText:', frozenText.value)
    }, 10)
  }

  const handleClickOutside = (event) => {
    // 点击菜单本身不关闭（检查新的类名）
    if (event.target.closest('.modal-overlay') || 
        event.target.closest('.bottom-sheet') ||
        event.target.closest('.ai-text-menu')) {
      return
    }
    
    // 点击菜单外部时关闭
    if (showMenu.value) {
      showMenu.value = false
      // 延迟清空
      setTimeout(() => {
        frozenText.value = ''
      }, 100)
    }
  }

  const closeMenu = () => {
    showMenu.value = false
    // 延迟清空，确保 action 处理完成
    setTimeout(() => {
      frozenText.value = ''
    }, 100)
  }

  const replaceSelectedText = (newText) => {
    if (selectionRange.value) {
      selectionRange.value.deleteContents()
      selectionRange.value.insertNode(document.createTextNode(newText))
      showMenu.value = false
      // 延迟清空，确保替换完成
      setTimeout(() => {
        frozenText.value = ''
      }, 100)
    }
  }

  onMounted(() => {
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('mousedown', handleClickOutside)
  })

  return {
    showMenu,
    menuPosition,
    selectedText: frozenText, // 返回冻结的文本
    closeTextMenu: closeMenu,
    replaceSelectedText
  }
}
