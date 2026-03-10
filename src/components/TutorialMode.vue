<template>
  <div v-if="isActive" class="tutorial-overlay">
    <!-- 遮罩层 -->
    <div class="tutorial-mask" @click="skipTutorial"></div>
    
    <!-- 高亮区域（通过 CSS 实现镂空效果） -->
    <div 
      v-if="currentStep.target" 
      class="tutorial-highlight"
      :style="highlightStyle"
    ></div>
    
    <!-- 提示卡片 -->
    <div class="tutorial-card" :style="cardStyle">
      <div class="tutorial-header">
        <div class="tutorial-step-info">
          <span class="tutorial-step">步骤 {{ currentStepIndex + 1 }} / {{ steps.length }}</span>
          <span class="tutorial-category" :class="'category-' + currentStep.category">
            {{ currentStep.category === 'intro' ? '介绍' : currentStep.category === 'basic' ? '基础' : '进阶' }}
          </span>
        </div>
        <button class="tutorial-close" @click="skipTutorial">✕</button>
      </div>
      
      <!-- 进度条 -->
      <div class="tutorial-progress">
        <div class="tutorial-progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>
      
      <div class="tutorial-content">
        <div class="tutorial-icon">{{ currentStep.icon }}</div>
        <h3 class="tutorial-title">{{ currentStep.title }}</h3>
        <div class="tutorial-description" v-html="currentStep.description"></div>
      </div>
      
      <div class="tutorial-actions">
        <button 
          v-if="currentStepIndex > 0" 
          class="tutorial-btn tutorial-btn-prev" 
          @click="prevStep"
        >
          ← 上一步
        </button>
        <button 
          v-if="currentStepIndex < steps.length - 1" 
          class="tutorial-btn tutorial-btn-next" 
          @click="nextStep"
        >
          下一步 →
        </button>
        <button 
          v-else 
          class="tutorial-btn tutorial-btn-finish" 
          @click="finishTutorial"
        >
          ✓ 完成教程
        </button>
      </div>
      
      <div class="tutorial-skip">
        <button @click="skipTutorial">跳过教程</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'finish'])

const isActive = ref(props.active)
const currentStepIndex = ref(0)

// 教程步骤配置（精简版：12步）
const steps = [
  // 1. 欢迎页
  {
    target: null,
    icon: '👋',
    title: '欢迎使用 TO-DO App！',
    description: '这是一个功能强大的<strong>离线任务管理应用</strong>。<br>让我们用 <strong>3-4 分钟</strong>，快速掌握核心功能。',
    position: 'center',
    category: 'intro'
  },
  
  // 2. 任务树成长系统
  {
    target: '.growth-tree',
    icon: '🌳',
    title: '任务树成长系统',
    description: `
      <strong>蚂蚁森林式激励</strong>：完成任务让树持续生长！<br>
      <strong>成长值</strong>：完成任务+1分，高优先级+2分<br>
      <strong>10级体系</strong>：🌱种子 → 🌿幼苗 → ... → 🎋神树<br>
      <br>
      💡 点击树图标查看详细成长信息
    `,
    position: 'bottom-right',
    category: 'intro'
  },
  
  // 3. 笔记本 + 统计栏
  {
    target: '.collection-quick-bar',
    icon: '📁',
    title: '笔记本分类 & 统计栏',
    description: `
      <strong>笔记本</strong>：按项目组织任务<br>
      <strong>统计栏</strong>：已完成/待办/已逾期快速查看<br>
      <strong>🎛️ 筛选</strong>：打开高级筛选面板<br>
      <br>
      💡 点击统计按钮可快速筛选对应任务
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 4. 创建任务
  {
    target: '.unified-input-container',
    icon: '➕',
    title: '创建新任务',
    description: `
      <strong>输入任务标题</strong> → 按回车快速创建<br>
      <strong>📷 拍照</strong>：拍照识别文字（OCR）<br>
      <strong>🎤 语音</strong>：语音输入任务<br>
      <br>
      💡 创建后可调整分类、优先级等属性
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 5. 任务卡片操作
  {
    target: '.task-list',
    icon: '📝',
    title: '任务卡片操作',
    description: `
      <strong>☑️</strong> 标记完成 | <strong>🍅</strong> 番茄钟 | <strong>📌</strong> 置顶 | <strong>🗑️</strong> 删除<br>
      <strong>点击标题</strong> → 打开任务详情<br>
      <strong>徽章</strong>：💬日志数、📊进度%、🔒等待中<br>
      <br>
      💡 详情页可查看执行日志、时间轴、统计数据
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 6. 执行日志系统
  {
    target: '.task-list',
    icon: '💬',
    title: '执行日志系统',
    description: `
      <strong>6种日志类型</strong>：<br>
      🚀 开始 | 📈 进展 | 🚧 阻碍 | 💡 方案 | 🎯 里程碑 | ✅ 完成<br>
      <br>
      <strong>记录</strong>：内容、耗时、进度%、标签、心情<br>
      💡 在任务详情页点击"添加日志"
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 7. 番茄钟 + 高级筛选
  {
    target: '.btn-refresh-icon',
    icon: '🍅',
    title: '番茄钟 & 高级筛选',
    description: `
      <strong>番茄钟</strong>：25分钟专注 + 休息模式<br>
      <strong>高级筛选</strong>：日期、分类、优先级、关键字<br>
      <strong>🔄 刷新</strong>：重置所有筛选条件<br>
      <br>
      💡 点击任务卡片的🍅启动番茄钟
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  
  // 8. AI智能助手
  {
    target: '.btn-ai',
    icon: '🤖',
    title: 'AI智能助手',
    description: `
      <strong>AI问答</strong>：自然语言询问任务相关问题<br>
      <strong>快捷问题</strong>：今天完成了什么？本周情况？<br>
      <strong>AI拆分</strong>：大任务拆分为子任务<br>
      <br>
      💡 AI可访问所有任务数据，提供智能分析
    `,
    position: 'bottom-left',
    category: 'advanced'
  },
  
  // 9. 回收站 + 个人主页
  {
    target: '.btn-trash',
    icon: '🗑️',
    title: '回收站 & 个人主页',
    description: `
      <strong>回收站</strong>：删除的任务可恢复或永久删除<br>
      <strong>个人主页</strong>：修改密码、绑定手机、数据管理<br>
      <strong>数据报告</strong>：日/周/月/季/年报生成<br>
      <br>
      💡 点击右上角头像进入个人主页
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  
  // 10. 数据管理
  {
    target: '.btn-avatar',
    icon: '💾',
    title: '数据管理 & 备份',
    description: `
      <strong>导出任务</strong>：备份到Excel文件<br>
      <strong>导入任务</strong>：从Excel导入任务<br>
      <strong>数据库配置</strong>：本地 + SQLite/MySQL备份<br>
      <br>
      💡 建议每周备份一次数据
    `,
    position: 'bottom-left',
    category: 'advanced'
  },
  
  // 11. 更多功能
  {
    target: null,
    icon: '🎁',
    title: '更多实用功能',
    description: `
      <strong>智能提醒</strong>：逾期提醒、1小时预警<br>
      <strong>任务依赖</strong>：设置任务之间的依赖关系<br>
      <strong>Markdown编辑</strong>：富文本编辑和预览<br>
      <strong>文件附件</strong>：支持图片、PDF、视频等<br>
      <br>
      💡 更多功能等你探索！
    `,
    position: 'center',
    category: 'intro'
  },
  
  // 12. 完成页
  {
    target: null,
    icon: '🎉',
    title: '教程完成！',
    description: `
      <strong>恭喜！您已掌握 TO-DO App 核心功能！</strong><br>
      <br>
      <strong>核心功能</strong>：<br>
      ✅ 任务树成长 | ✅ 笔记本分类 | ✅ 执行日志<br>
      ✅ 番茄钟计时 | ✅ AI智能助手 | ✅ 数据备份<br>
      <br>
      <strong>下一步</strong>：<br>
      💡 创建第一个任务，开始你的成长之旅<br>
      💡 导入模板数据，快速体验完整功能<br>
      <br>
      祝您使用愉快！🎊
    `,
    position: 'center',
    category: 'intro'
  }
]


const currentStep = computed(() => steps[currentStepIndex.value])

// 计算进度百分比
const progressPercent = computed(() => {
  return Math.round(((currentStepIndex.value + 1) / steps.length) * 100)
})

// 计算高亮区域位置
const highlightStyle = ref({})
const cardStyle = ref({
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
})

const updatePositions = async () => {
  await nextTick()
  
  if (!currentStep.value.target) {
    // 居中显示
    // 居中显示
    cardStyle.value = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
    return
  }
  
  const targetEl = document.querySelector(currentStep.value.target)
  if (!targetEl) {
    console.warn('Target element not found:', currentStep.value.target)
    return
  }
  
  const rect = targetEl.getBoundingClientRect()
  const padding = 8
  
  // 高亮区域
  highlightStyle.value = {
    top: `${rect.top - padding}px`,
    left: `${rect.left - padding}px`,
    width: `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`
  }
  
  // 提示卡片位置
  const maxCardWidth = 400
  const actualCardWidth = Math.min(maxCardWidth, window.innerWidth - 40)
  const gap = 20
  const margin = 20  // 屏幕边距
  
  let top, left
  
  switch (currentStep.value.position) {
    case 'bottom':
      top = rect.bottom + gap
      left = rect.left + rect.width / 2 - actualCardWidth / 2
      break
    case 'top':
      top = rect.top - gap
      left = rect.left + rect.width / 2 - actualCardWidth / 2
      break
    case 'bottom-left':
      top = rect.bottom + gap
      left = rect.right - actualCardWidth
      break
    case 'bottom-right':
      top = rect.bottom + gap
      left = rect.left
      break
    default:
      top = window.innerHeight / 2
      left = window.innerWidth / 2 - actualCardWidth / 2
  }
  
  // 水平边界检查
  if (left < margin) {
    left = margin
  }
  if (left + actualCardWidth > window.innerWidth - margin) {
    left = window.innerWidth - actualCardWidth - margin
  }
  
  // 垂直边界检查
  if (top < margin) {
    top = margin
  }
  // 卡片最大高度 90vh，确保不超出底部
  const maxCardHeight = window.innerHeight * 0.9
  if (top + maxCardHeight > window.innerHeight - margin) {
    top = window.innerHeight - maxCardHeight - margin
  }
  
  cardStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  }
}

const nextStep = () => {
  if (currentStepIndex.value < steps.length - 1) {
    currentStepIndex.value++
    updatePositions()
  }
}

const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    updatePositions()
  }
}

const skipTutorial = () => {
  isActive.value = false
  emit('close')
}

const finishTutorial = () => {
  isActive.value = false
  emit('finish')
}

// 监听 active 变化
watch(() => props.active, (newVal) => {
  isActive.value = newVal
  if (newVal) {
    currentStepIndex.value = 0
    updatePositions()
  }
})

// 监听步骤变化
watch(currentStepIndex, () => {
  updatePositions()
})

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updatePositions)
}
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
}

.tutorial-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  pointer-events: auto;
}

.tutorial-highlight {
  position: absolute;
  border: 3px solid #667eea;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(102, 126, 234, 0.8);
  pointer-events: none;
  z-index: 10000;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(102, 126, 234, 0.8);
  }
  50% {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(102, 126, 234, 1);
  }
}

.tutorial-card {
  position: absolute;
  width: min(420px, calc(100vw - 40px));
  max-width: 420px;
  max-height: 85vh;
  overflow-y: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  z-index: 10001;
  opacity: 1;
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.tutorial-step-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tutorial-step {
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 600;
}

.tutorial-category {
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-weight: 500;
}

.category-intro {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.category-basic {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.category-advanced {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.tutorial-progress {
  height: 3px;
  background: #e0e0e0;
  margin: 0.5rem 1.5rem 0;
  border-radius: 2px;
  overflow: hidden;
}

.tutorial-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.tutorial-close {
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
}

.tutorial-close:hover {
  background: #f0f0f0;
  color: #333;
}

.tutorial-content {
  padding: 1.5rem;
  text-align: center;
}

.tutorial-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.tutorial-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.tutorial-description {
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.8;
  margin: 0;
}

.tutorial-description strong {
  color: #333;
  font-weight: 600;
}

.tutorial-description br {
  display: block;
  content: "";
  margin-top: 0.3rem;
}

.tutorial-actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem 1rem 1.5rem;
}

.tutorial-btn {
  flex: 1;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tutorial-btn-prev {
  background: #f0f0f0;
  color: #666;
}

.tutorial-btn-prev:hover {
  background: #e0e0e0;
  color: #333;
}

.tutorial-btn-next {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tutorial-btn-next:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.tutorial-btn-finish {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
}

.tutorial-btn-finish:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.tutorial-skip {
  text-align: center;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.tutorial-skip button {
  background: none;
  border: none;
  color: #999;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.5rem;
}

.tutorial-skip button:hover {
  color: #666;
}
</style>
