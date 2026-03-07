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

// 教程步骤配置
const steps = [
  // 1. 欢迎页
  {
    target: null,
    icon: '👋',
    title: '欢迎使用 TO-DO App！',
    description: '这是一个功能强大的<strong>离线任务管理应用</strong>。<br>让我们用 <strong>5-6 分钟</strong>，快速掌握核心功能。',
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
      <br>
      <strong>成长值</strong>：完成任务+1分，高优先级+2分，番茄钟+0.5分<br>
      <strong>10级体系</strong>：🌱种子 → 🌿幼苗 → ... → 🎋神树（10000分）<br>
      <strong>连续生长</strong>：30个细分状态，平滑过渡<br>
      <br>
      💡 点击树图标查看详细成长信息
    `,
    position: 'bottom-right',
    category: 'intro'
  },
  
  // 3. 笔记本分类系统
  {
    target: '.collection-quick-bar',
    icon: '📁',
    title: '笔记本分类系统',
    description: `
      <strong>我的笔记本</strong>：查看全部任务<br>
      <strong>文件夹</strong>：按项目/类别组织任务<br>
      <strong>未分类</strong>：新建任务的默认位置<br>
      <br>
      💡 点击📁管理按钮可创建/编辑/删除笔记本
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 4. 统计筛选栏
  {
    target: '.stats-quick-bar',
    icon: '📊',
    title: '统计筛选栏（NEW）',
    description: `
      <strong>已完成/待办/已逾期</strong>：快速查看任务状态<br>
      <strong>🎛️ 筛选</strong>：打开高级筛选面板<br>
      <strong>↓ 展开</strong>：显示/隐藏任务输入框<br>
      <br>
      💡 点击任何统计按钮可快速筛选对应任务
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 5. 创建任务
  {
    target: '.unified-input-container',
    icon: '➕',
    title: '创建新任务',
    description: `
      <strong>输入任务标题</strong> → 按回车快速创建<br>
      <strong>📷 拍照</strong>：拍照识别文字（OCR）<br>
      <strong>⛶ 展开</strong>：打开全屏编辑器，添加详细描述<br>
      <br>
      💡 创建后可在任务卡片上调整分类、优先级等属性
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 6. 任务卡片操作
  {
    target: '.task-list',
    icon: '📝',
    title: '任务卡片操作',
    description: `
      <strong>点击标题</strong> → 打开任务详情<br>
      <strong>☑️</strong> → 标记完成/取消完成<br>
      <strong>🍅</strong> → 开始番茄钟计时<br>
      <strong>📌</strong> → 置顶/取消置顶<br>
      <strong>🗑️</strong> → 删除（移入回收站）<br>
      <br>
      💡 徽章：💬日志数、📊进度%、🔒等待中
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 7. 任务详情页
  {
    target: '.task-list',
    icon: '📋',
    title: '任务详情页',
    description: `
      <strong>点击任务标题</strong>打开详情页，包含：<br>
      • 任务概览（状态、优先级、分类、截止时间）<br>
      • 执行统计（推进次数、总耗时、阻碍统计）<br>
      • 时间轴（创建 → 截止 → 完成）<br>
      • 执行日志列表<br>
      <br>
      💡 这是查看任务全貌的统一入口
    `,
    position: 'bottom',
    category: 'basic'
  },
  
  // 8. 执行日志系统
  {
    target: '.task-list',
    icon: '💬',
    title: '执行日志系统',
    description: `
      <strong>6种日志类型</strong>：<br>
      🚀 开始 | 📈 进展 | 🚧 阻碍 | 💡 方案 | 🎯 里程碑 | ✅ 完成<br>
      <br>
      <strong>记录内容</strong>：日志内容、耗时、进度%、标签、心情<br>
      <br>
      💡 在任务详情页点击"添加日志"按钮
    `,
    position: 'bottom',
    category: 'advanced'
  },
  
  // 9. 番茄钟计时
  {
    target: '.task-list',
    icon: '🍅',
    title: '番茄钟计时器',
    description: `
      <strong>专注模式</strong>：25分钟专注计时<br>
      <strong>休息模式</strong>：5分钟短休息/15分钟长休息<br>
      <strong>操作</strong>：暂停、继续、放弃、跳过休息<br>
      <br>
      💡 点击任务卡片上的🍅按钮启动番茄钟
    `,
    position: 'bottom',
    category: 'advanced'
  },
  
  // 10. 高级筛选
  {
    target: '.stats-chip.chip-filter',
    icon: '🎛️',
    title: '高级筛选功能',
    description: `
      <strong>筛选条件</strong>：<br>
      • 日期范围（创建/截止/完成时间）<br>
      • 分类（工作/学习/生活）<br>
      • 优先级（高/中/低）<br>
      • 关键字搜索<br>
      <br>
      💡 所有条件可以组合使用
    `,
    position: 'bottom',
    category: 'advanced'
  },
  
  // 11. 刷新按钮
  {
    target: '.btn-refresh-icon',
    icon: '🔄',
    title: '刷新按钮',
    description: `
      <strong>功能</strong>：重置所有筛选条件到初始状态<br>
      <strong>操作</strong>：点击右上角的刷新按钮<br>
      <br>
      💡 当筛选条件太多时，一键清空很方便
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  
  // 12. AI智能助手
  {
    target: '.btn-ai',
    icon: '🤖',
    title: 'AI智能助手',
    description: `
      <strong>AI问答</strong>：用自然语言询问任务相关问题<br>
      <strong>今日规划</strong>：生成智能规划<br>
      <strong>快捷问题</strong>：<br>
      • 今天完成了哪些任务？<br>
      • 本周工作情况如何？<br>
      • 有哪些高优先级任务？<br>
      <br>
      💡 AI可访问所有任务数据，提供智能分析
    `,
    position: 'bottom-left',
    category: 'advanced'
  },
  
  // 13. 回收站
  {
    target: '.btn-trash',
    icon: '🗑️',
    title: '回收站（逻辑删除）',
    description: `
      <strong>功能</strong>：删除的任务会先移到回收站<br>
      <strong>操作</strong>：<br>
      • 恢复任务：点击"恢复"按钮<br>
      • 永久删除：点击"彻底删除"按钮<br>
      <br>
      💡 回收站右上角显示任务数量
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  
  // 14. 快速开始：导入模板
  {
    target: '.btn-avatar',
    icon: '📦',
    title: '快速开始：导入模板数据',
    description: `
      <strong>推荐新用户操作</strong>：<br>
      1. 点击右上角"我的主页"<br>
      2. 找到"数据管理"区域<br>
      3. 点击"📥 下载导入模板"<br>
      4. 点击"📂 导入任务"选择文件<br>
      <br>
      💡 模板包含100条示例任务，快速体验完整功能
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  
  // 15. AI任务拆分
  {
    target: '.task-list',
    icon: '✂️',
    title: 'AI智能任务拆分',
    description: `
      <strong>功能</strong>：将大任务拆分为可执行的子任务<br>
      <strong>操作</strong>：<br>
      1. 打开任务详情页<br>
      2. 点击"AI拆分任务"<br>
      3. 选择拆分模板<br>
      4. AI自动生成子任务列表<br>
      <br>
      💡 子任务自动设置依赖关系和预估时长
    `,
    position: 'bottom',
    category: 'advanced'
  },
  
  // 16. 数据报告
  {
    target: '.btn-avatar',
    icon: '📊',
    title: '数据报告生成',
    description: `
      <strong>7种报告类型</strong>：<br>
      日报/周报/月报/季报/半年报/年报/自定义<br>
      <br>
      <strong>完整结构</strong>：<br>
      智能总结、数据概览、完成任务明细、<br>
      关键工作、风险与问题、下期计划<br>
      <br>
      💡 点击"我的主页" → 区间报告/报告历史
    `,
    position: 'bottom-left',
    category: 'advanced'
  },
  
  // 17. 其他实用功能
  {
    target: null,
    icon: '🎁',
    title: '更多实用功能',
    description: `
      <strong>智能提醒</strong>：逾期提醒、1小时预警<br>
      <strong>语音输入</strong>：点击🎤按钮语音创建任务<br>
      <strong>拍照OCR</strong>：点击📷按钮拍照识别文字<br>
      <strong>任务依赖</strong>：设置任务之间的依赖关系<br>
      <strong>离线运行</strong>：无需网络，数据本地存储<br>
      <br>
      💡 更多功能等你探索！
    `,
    position: 'center',
    category: 'intro'
  },
  
  // 18. 完成页
  {
    target: null,
    icon: '🎉',
    title: '教程完成！',
    description: `
      <strong>恭喜！您已掌握 TO-DO App 核心功能！</strong><br>
      <br>
      <strong>核心功能回顾</strong>：<br>
      ✅ 任务树成长：完成任务让树持续生长<br>
      ✅ 笔记本分类：按项目组织任务<br>
      ✅ 任务管理：创建、编辑、完成、删除<br>
      ✅ 执行日志：6种日志类型，完整记录<br>
      ✅ 番茄钟：25分钟专注计时<br>
      ✅ AI助手：智能问答、任务拆分、报告生成<br>
      <br>
      <strong>下一步</strong>：<br>
      💡 导入模板数据，快速体验完整功能<br>
      💡 创建第一个任务，开始你的成长之旅<br>
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
  width: min(400px, calc(100vw - 40px));
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.75rem 0;
}

.tutorial-description {
  font-size: 0.9rem;
  color: #555;
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
  padding: 0.75rem 1.5rem;
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
