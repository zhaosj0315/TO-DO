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
    description: '这是一个功能强大的离线任务管理应用。<br>让我们用 <strong>8-10 分钟</strong>，快速掌握所有核心功能。',
    position: 'center',
    category: 'intro'
  },
  // 2. 界面总览
  {
    target: 'body',
    icon: '🗺️',
    title: '界面总览',
    description: `
      <strong>顶部</strong>：任务统计面板<br>
      <strong>中间</strong>：任务列表区域<br>
      <strong>右上角</strong>：刷新、回收站、个人中心<br>
      <br>
      💡 所有功能都在这一个页面上！
    `,
    position: 'center',
    category: 'intro'
  },
  // 3. 任务统计
  {
    target: '.stats-grid',
    icon: '📊',
    title: '任务统计面板',
    description: `
      <strong>完成占比</strong>：显示任务完成率<br>
      <strong>全部/已完成/待办/已逾期</strong>：快速查看任务状态<br>
      <br>
      💡 <strong>点击任何统计卡片</strong>可以快速筛选对应的任务！
    `,
    position: 'bottom',
    category: 'basic'
  },
  // 4. 创建任务
  {
    target: '.add-form-row-main',
    icon: '➕',
    title: '创建新任务',
    description: `
      <strong>方式1 - 手动创建</strong>：<br>
      1. 在输入框中输入任务名称<br>
      2. 按 <strong>回车键</strong> 或点击右侧 <strong>✓</strong> 按钮<br>
      <br>
      <strong>方式2 - 导入模板（推荐）</strong>：<br>
      点击右上角头像 → 数据管理 → 下载模板 → 导入模板<br>
      <br>
      💡 模板包含100条示例任务，快速体验完整功能
    `,
    position: 'bottom',
    category: 'basic'
  },
  // 5. 快速体验：导入模板数据
  {
    target: '.btn-avatar',
    icon: '📦',
    title: '快速体验：导入模板数据',
    description: `
      <strong>推荐新用户操作</strong>：<br>
      1. 点击右上角头像打开个人中心<br>
      2. 找到"数据管理"区域<br>
      3. 点击"📥 下载导入模板"<br>
      4. 点击"📂 导入任务"选择刚下载的文件<br>
      <br>
      💡 导入后可以看到完整的任务列表，包含各种类型、分类、优先级的任务示例
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  // 6. 任务属性
  {
    target: '.add-form-container',
    icon: '⚙️',
    title: '设置任务属性',
    description: `
      <strong>任务类型</strong>：今天、明天、本周、指定日期、重复任务等<br>
      <strong>分类</strong>：💼工作、📚学习、🏠生活<br>
      <strong>优先级</strong>：⚡高、中、低<br>
      <br>
      💡 不同优先级对应不同的番茄钟数量（高4/中2/低1）
    `,
    position: 'bottom',
    category: 'basic'
  },
  // 7. 搜索功能
  {
    target: '.search-bar',
    icon: '🔍',
    title: '搜索任务',
    description: `
      <strong>功能</strong>：快速查找任务<br>
      <strong>支持</strong>：模糊匹配任务名称和描述<br>
      <br>
      💡 输入关键字后，列表会实时过滤
    `,
    position: 'bottom',
    category: 'basic'
  },
  // 8. 任务卡片
  {
    target: '.task-list',
    icon: '📝',
    title: '任务卡片操作',
    description: `
      <strong>点击标题/描述</strong> → 打开任务详情页<br>
      <strong>点击复选框 ☑️</strong> → 标记完成/取消完成<br>
      <strong>点击 🍅</strong> → 开始番茄钟计时<br>
      <strong>点击 📌</strong> → 置顶/取消置顶<br>
      <strong>点击 🗑️</strong> → 删除任务（移入回收站）<br>
      <br>
      💡 徽章显示：💬 日志数量、📊 进度百分比
    `,
    position: 'bottom',
    category: 'basic'
  },
  // 9. 任务详情页
  {
    target: '.task-list',
    icon: '📋',
    title: '任务详情页（Bottom Sheet）',
    description: `
      <strong>点击任务标题或描述</strong>打开详情页，包含：<br>
      • 任务概览（状态、优先级、分类、截止时间）<br>
      • 执行统计（推进次数、总耗时、平均时长、阻碍统计）<br>
      • 时间轴（创建 → 截止 → 完成）<br>
      • 执行日志列表<br>
      <br>
      💡 这是查看任务全貌的统一入口
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 10. 执行日志系统
  {
    target: '.task-list',
    icon: '💬',
    title: '执行日志系统（v1.7.0 核心功能）',
    description: `
      <strong>6 种日志类型</strong>：<br>
      🚀 <strong>开始</strong>：记录任务启动<br>
      📈 <strong>进展</strong>：记录推进情况<br>
      🚧 <strong>阻碍</strong>：记录遇到的问题<br>
      💡 <strong>方案</strong>：记录解决方案<br>
      🎯 <strong>里程碑</strong>：记录重要节点<br>
      ✅ <strong>完成</strong>：记录完成总结<br>
      <br>
      💡 每条日志自动记录时间戳
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 11. 添加日志
  {
    target: '.task-list',
    icon: '✍️',
    title: '如何添加执行日志',
    description: `
      <strong>操作步骤</strong>：<br>
      1. 点击任务标题打开详情页<br>
      2. 点击"添加日志"按钮<br>
      3. 选择日志类型<br>
      4. 填写内容、耗时、进度等信息<br>
      5. 点击"保存"<br>
      <br>
      💡 可以添加标签、记录心情、关联阻碍
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 12. 进度追踪
  {
    target: '.task-list',
    icon: '📊',
    title: '进度追踪',
    description: `
      <strong>进度显示</strong>：任务卡片上显示 📊 X%<br>
      <strong>进度设置</strong>：添加日志时可以设置当前进度（0-100%）<br>
      <strong>统计数据</strong>：详情页显示推进次数、总耗时、平均时长<br>
      <br>
      💡 通过日志追踪任务的完整执行过程
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 13. 完成任务
  {
    target: '.task-list',
    icon: '✅',
    title: '完成任务',
    description: `
      <strong>方式 1</strong>：点击任务卡片左侧的复选框<br>
      <strong>方式 2</strong>：在详情页点击"完成任务"按钮<br>
      <strong>方式 3</strong>：添加"完成"类型的日志<br>
      <br>
      💡 完成时可以添加质量评分（1-5星）和经验教训
    `,
    position: 'top',
    category: 'basic'
  },
  // 14. 番茄钟计时
  {
    target: '.task-list',
    icon: '🍅',
    title: '番茄钟计时器',
    description: `
      <strong>专注模式</strong>：25 分钟专注计时<br>
      <strong>休息模式</strong>：5 分钟短休息 / 15 分钟长休息<br>
      <strong>操作</strong>：暂停、继续、放弃、跳过休息<br>
      <br>
      💡 完成番茄钟后会自动记录到任务历史中
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 15. 置顶任务
  {
    target: '.task-list',
    icon: '📌',
    title: '置顶重要任务',
    description: `
      <strong>功能</strong>：将重要任务固定在列表最前面<br>
      <strong>操作</strong>：点击 📌 按钮切换置顶状态<br>
      <strong>排序</strong>：置顶任务内部按优先级排序<br>
      <br>
      💡 置顶任务会显示 📌 图标
    `,
    position: 'top',
    category: 'basic'
  },
  // 16. 高级筛选
  {
    target: '.filter-card',
    icon: '🎛️',
    title: '高级筛选功能',
    description: `
      <strong>筛选条件</strong>：<br>
      • 日期范围（创建时间/截止时间/完成时间）<br>
      • 分类（工作/学习/生活）<br>
      • 优先级（高/中/低）<br>
      • 关键字搜索<br>
      <br>
      💡 所有条件可以组合使用
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 17. 刷新按钮
  {
    target: '.btn-refresh-icon',
    icon: '🔄',
    title: '刷新按钮',
    description: `
      <strong>功能</strong>：重置所有筛选条件到初始状态<br>
      <strong>操作</strong>：点击右上角的紫色刷新按钮<br>
      <br>
      💡 当筛选条件太多时，一键清空很方便
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  // 18. 回收站
  {
    target: '.btn-trash',
    icon: '🗑️',
    title: '回收站（逻辑删除）',
    description: `
      <strong>功能</strong>：删除的任务会先移到回收站<br>
      <strong>操作</strong>：<br>
      • 恢复任务：点击"恢复"按钮<br>
      • 永久删除：点击"彻底删除"按钮<br>
      • 清空回收站：删除所有回收站任务<br>
      <br>
      💡 回收站右上角显示任务数量
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  // 19. 数据管理
  {
    target: '.btn-avatar',
    icon: '💾',
    title: '数据导入导出',
    description: `
      <strong>导出</strong>：将任务导出为 Excel 文件备份<br>
      <strong>导入</strong>：从 Excel 批量导入任务<br>
      <strong>模板</strong>：下载官方导入模板（含 100 条示例）<br>
      <br>
      💡 定期导出数据，防止数据丢失
    `,
    position: 'bottom-left',
    category: 'advanced'
  },
  // 20. 个人中心
  {
    target: '.btn-avatar',
    icon: '👤',
    title: '个人中心',
    description: `
      <strong>功能</strong>：<br>
      • 查看个人信息（用户名、注册时间、绑定手机）<br>
      • 番茄钟统计（已获得/待获得/逾期扣除/净获得）<br>
      • 数据管理（导入/导出/备份）<br>
      • 修改密码、绑定手机号<br>
      <br>
      💡 点击头像打开个人中心
    `,
    position: 'bottom-left',
    category: 'basic'
  },
  // 21. 其他功能
  {
    target: null,
    icon: '🎁',
    title: '更多实用功能',
    description: `
      <strong>智能提醒</strong>：逾期提醒、1小时预警<br>
      <strong>自动备份</strong>：定期自动备份数据<br>
      <strong>离线运行</strong>：无需网络，数据本地存储<br>
      <strong>多用户隔离</strong>：每个用户的数据完全独立<br>
      <br>
      💡 接下来介绍更多高级功能！
    `,
    position: 'center',
    category: 'intro'
  },
  // 22. AI智能助手
  {
    target: '.btn-ai',
    icon: '🤖',
    title: 'AI智能助手（统一入口）',
    description: `
      <strong>AI问答</strong>：用自然语言询问任务相关问题<br>
      <strong>今日规划</strong>：点击"📅 今日规划"按钮生成智能规划<br>
      <strong>快捷问题</strong>：<br>
      • 今天完成了哪些任务？<br>
      • 本周工作情况如何？<br>
      • 有哪些高优先级任务？<br>
      <br>
      💡 AI可以访问所有任务数据，提供智能分析和建议
    `,
    position: 'bottom-left',
    category: 'advanced'
  },
  // 23. AI报告生成
  {
    target: '.btn-avatar',
    icon: '📊',
    title: 'AI报告生成器',
    description: `
      <strong>7种报告类型</strong>：日报/周报/月报/季报/半年报/年报/区间报告<br>
      <strong>完整11章节</strong>：智能总结、数据概览、完成任务明细、关键工作等<br>
      <strong>报告历史</strong>：自动保存所有生成的报告<br>
      <br>
      💡 点击个人中心 → 区间报告/报告历史
    `,
    position: 'bottom-left',
    category: 'advanced'
  },
  // 24. 任务依赖关系
  {
    target: '.task-list',
    icon: '🔗',
    title: '任务依赖关系',
    description: `
      <strong>功能</strong>：设置任务之间的依赖关系<br>
      <strong>操作</strong>：<br>
      1. 打开任务详情页<br>
      2. 点击"设置等待任务"<br>
      3. 选择需要等待的任务<br>
      <br>
      💡 等待中的任务会显示 🔒 徽章
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 25. 拍照OCR识别
  {
    target: '.btn-camera',
    icon: '📷',
    title: '拍照识别文字（OCR）',
    description: `
      <strong>功能</strong>：拍照识别文字，自动创建任务<br>
      <strong>操作</strong>：<br>
      1. 点击任务输入框旁的 📷 按钮<br>
      2. 拍摄包含文字的照片<br>
      3. AI自动识别并填充任务信息<br>
      <br>
      💡 支持中英文混合识别，离线运行
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 26. 文本选中提取
  {
    target: 'body',
    icon: '🎯',
    title: '文本选中提取任务',
    description: `
      <strong>功能</strong>：从任意文本中提取任务<br>
      <strong>操作</strong>：<br>
      1. 选中任意文本（任务描述、邮件内容等）<br>
      2. 点击弹出菜单中的"提取任务"<br>
      3. AI自动分析并提取任务信息<br>
      <br>
      💡 支持批量提取多个任务
    `,
    position: 'center',
    category: 'advanced'
  },
  // 27. 高级筛选优化
  {
    target: '.filter-card',
    icon: '🎛️',
    title: '高级筛选功能（全面升级）',
    description: `
      <strong>快捷场景</strong>（一键直达）：<br>
      • 今日待办、本周待办、今日逾期<br>
      • 高优先级、工作任务、学习任务<br>
      <br>
      <strong>快捷日期</strong>（12个选项）：<br>
      • 今天、昨天、本周、上周、本月、上月<br>
      • 全部逾期、最近7天、最近30天<br>
      <br>
      <strong>时间维度</strong>：创建时间/截止时间/完成时间<br>
      <br>
      💡 操作步骤减少50%，筛选效率提升60%
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 28. 报告功能
  {
    target: '.btn-avatar',
    icon: '📊',
    title: '数据报告功能（全面整合）',
    description: `
      <strong>7种报告类型</strong>：<br>
      • 日报、周报、月报、季报、半年报、年报、区间报告<br>
      <br>
      <strong>完整11章节结构</strong>：<br>
      • 智能总结、数据概览、完成任务明细<br>
      • 已完成情况、本期目标、本期进展<br>
      • 本周进展、关键工作、风险与问题、下期计划<br>
      <br>
      <strong>报告历史</strong>：自动保存所有生成的报告<br>
      <br>
      💡 点击个人中心 → 区间报告/报告历史
    `,
    position: 'bottom-left',
    category: 'advanced'
  },
  // 29. AI任务拆分
  {
    target: '.task-list',
    icon: '✂️',
    title: 'AI智能任务拆分',
    description: `
      <strong>功能</strong>：将大任务拆分为可执行的子任务<br>
      <strong>操作</strong>：<br>
      1. 打开任务详情页<br>
      2. 点击"AI拆分任务"<br>
      3. 选择拆分模板（快速/详细/时间优先/优先级优先）<br>
      4. AI自动生成子任务列表<br>
      <br>
      💡 子任务自动设置依赖关系和预估时长
    `,
    position: 'bottom',
    category: 'advanced'
  },
  // 30. 完成页
  {
    target: null,
    icon: '🎉',
    title: '教程完成！',
    description: `
      <strong>恭喜您已经掌握了 TO-DO App 的所有核心功能！</strong><br>
      <br>
      <strong>核心功能回顾</strong>：<br>
      ✅ 任务管理：创建、编辑、完成、删除<br>
      ✅ 执行日志：6种日志类型，完整记录执行过程<br>
      ✅ 番茄钟：25分钟专注计时<br>
      ✅ AI助手：智能问答、今日规划、报告生成<br>
      ✅ 高级筛选：快捷场景、快捷日期、时间维度<br>
      ✅ 数据报告：7种类型、11章节结构、报告历史<br>
      <br>
      💡 随时点击右上角 💡 按钮重新查看教程
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
