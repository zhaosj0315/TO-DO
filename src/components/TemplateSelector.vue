<template>
  <!-- 快捷模板选择器 - Bottom Sheet -->
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="template-sheet">
      <div class="template-header">
        <h3>📋 选择快捷模板</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>
      
      <div class="template-list">
        <button 
          v-for="template in templates" 
          :key="template.id"
          @click="selectTemplate(template)"
          class="template-item"
        >
          <div class="template-icon">{{ template.icon }}</div>
          <div class="template-info">
            <div class="template-name">{{ template.name }}</div>
            <div class="template-desc">{{ template.description }}</div>
          </div>
        </button>
        
        <button @click="selectCustom" class="template-item template-custom">
          <div class="template-icon">✨</div>
          <div class="template-info">
            <div class="template-name">自定义生成</div>
            <div class="template-desc">基于任务标题自由生成</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'select'])

const templates = [
  {
    id: 'weekly_report',
    name: '周报',
    icon: '📊',
    description: '工作周报结构',
    prompt: '生成工作周报结构，包括：本周完成、进行中、下周计划'
  },
  {
    id: 'monthly_report',
    name: '月报',
    icon: '📈',
    description: '月度总结报告',
    prompt: '生成月度总结报告，包括：月度成果、数据统计、下月目标'
  },
  {
    id: 'meeting_notes',
    name: '会议纪要',
    icon: '📝',
    description: '会议记录模板',
    prompt: '生成会议纪要结构，包括：会议主题、参会人员、讨论要点、行动项'
  },
  {
    id: 'study_plan',
    name: '学习计划',
    icon: '📚',
    description: '学习计划安排',
    prompt: '生成学习计划，包括：学习目标、时间安排、学习资源、检验方式'
  },
  {
    id: 'shopping_list',
    name: '购物清单',
    icon: '🛒',
    description: '购物清单分类',
    prompt: '生成购物清单，按类别分组：食品、日用品、其他'
  },
  {
    id: 'project_plan',
    name: '项目计划',
    icon: '🎯',
    description: '项目执行计划',
    prompt: '生成项目计划，包括：项目目标、关键里程碑、资源需求、风险预案'
  }
]

const selectTemplate = (template) => {
  emit('select', template)
}

const selectCustom = () => {
  emit('select', null)
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

.template-sheet {
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

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.template-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
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
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.template-list {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.template-item:hover {
  background: #f0f0f0;
  border-color: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
}

.template-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.template-custom:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.template-custom .template-desc {
  color: rgba(255, 255, 255, 0.9);
}

.template-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
}

.template-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
}

.template-custom .template-name {
  color: white;
}

.template-desc {
  font-size: 0.85rem;
  color: #666;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
