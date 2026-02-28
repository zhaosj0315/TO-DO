<template>
  <!-- 任务拆分弹窗 -->
  <div v-if="visible" class="splitter-overlay" @click.self="$emit('close')">
    <div class="splitter-container">
      <div class="splitter-header">
        <h3>🧩 智能任务分解</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="splitter-body">
        <!-- 任务信息 -->
        <div class="task-info">
          <div class="info-label">原任务</div>
          <div class="info-value">{{ taskTitle }}</div>
          <div v-if="taskDescription" class="info-desc">{{ taskDescription }}</div>
        </div>

        <!-- 分解选项 -->
        <div class="split-options">
          <div class="option-group">
            <label>子任务数量</label>
            <select v-model="subtaskCount">
              <option :value="3">3个</option>
              <option :value="5">5个</option>
              <option :value="7">7个</option>
              <option :value="10">10个</option>
            </select>
          </div>
          
          <div class="option-group">
            <label>使用模板</label>
            <select v-model="selectedTemplate" @change="applyTemplate">
              <option value="">无模板</option>
              <option value="project">项目开发</option>
              <option value="report">报告撰写</option>
              <option value="study">学习计划</option>
              <option value="event">活动策划</option>
            </select>
          </div>
        </div>

        <!-- 生成按钮 -->
        <button 
          v-if="!subtasks.length" 
          @click="generateSubtasks" 
          :disabled="isGenerating"
          class="btn-generate"
        >
          {{ isGenerating ? '🤖 AI 分解中...' : '🚀 开始分解' }}
        </button>

        <!-- 子任务列表 -->
        <div v-if="subtasks.length > 0" class="subtasks-list">
          <div class="list-header">
            <h4>子任务列表（{{ subtasks.length }}个）</h4>
            <button @click="regenerate" class="btn-regenerate">🔄 重新生成</button>
          </div>
          
          <div v-for="(subtask, index) in subtasks" :key="index" class="subtask-card">
            <div class="subtask-header">
              <span class="subtask-number">{{ index + 1 }}</span>
              <input 
                v-model="subtask.title" 
                class="subtask-title"
                placeholder="子任务标题"
              />
              <span :class="['priority-badge', subtask.priority]">
                {{ getPriorityText(subtask.priority) }}
              </span>
            </div>
            <textarea 
              v-model="subtask.description" 
              class="subtask-desc"
              placeholder="子任务描述"
              rows="2"
            />
            <div class="subtask-footer">
              <div class="time-estimate">
                ⏱️ 预计 
                <input 
                  v-model.number="subtask.estimatedHours" 
                  type="number" 
                  step="0.5" 
                  min="0.5"
                  class="time-input"
                /> 小时
              </div>
              <button @click="removeSubtask(index)" class="btn-remove">删除</button>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          ⚠️ {{ error }}
        </div>
      </div>
      
      <div class="splitter-footer">
        <button @click="$emit('close')" class="btn btn-secondary">取消</button>
        <button 
          v-if="subtasks.length > 0"
          @click="createSubtasks" 
          class="btn btn-primary"
        >
          ✅ 创建 {{ subtasks.length }} 个子任务
        </button>
      </div>
    </div>
  </div>
  
  <!-- 全局加载动画（独立于弹窗外） -->
  <div v-if="visible && isGenerating" class="loading-overlay">
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <div class="spinner-text">🤖 AI 正在分解任务...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { AITaskSplitter } from '@/services/aiTaskSplitter'

const props = defineProps({
  visible: Boolean,
  taskTitle: String,
  taskDescription: String
})

const emit = defineEmits(['close', 'create'])

const subtaskCount = ref(5)
const selectedTemplate = ref('')
const subtasks = ref([])
const isGenerating = ref(false)
const error = ref('')

// 任务模板
const templates = {
  project: [
    { title: '需求分析', description: '明确项目需求和目标', priority: 'high', estimatedHours: 2 },
    { title: '技术选型', description: '选择合适的技术栈', priority: 'high', estimatedHours: 1 },
    { title: '架构设计', description: '设计系统架构', priority: 'high', estimatedHours: 3 },
    { title: '编码实现', description: '核心功能开发', priority: 'medium', estimatedHours: 8 },
    { title: '测试部署', description: '测试和上线', priority: 'medium', estimatedHours: 2 }
  ],
  report: [
    { title: '收集资料', description: '整理相关数据和文献', priority: 'high', estimatedHours: 1 },
    { title: '撰写大纲', description: '确定报告结构', priority: 'high', estimatedHours: 0.5 },
    { title: '撰写初稿', description: '完成主要内容', priority: 'medium', estimatedHours: 3 },
    { title: '修改润色', description: '优化文字和格式', priority: 'medium', estimatedHours: 1 },
    { title: '最终审核', description: '检查并定稿', priority: 'low', estimatedHours: 0.5 }
  ],
  study: [
    { title: '制定计划', description: '明确学习目标和时间表', priority: 'high', estimatedHours: 0.5 },
    { title: '基础学习', description: '学习基础知识', priority: 'high', estimatedHours: 4 },
    { title: '实践练习', description: '动手实践', priority: 'medium', estimatedHours: 4 },
    { title: '总结复习', description: '整理笔记和复习', priority: 'medium', estimatedHours: 2 },
    { title: '测试评估', description: '自我测试', priority: 'low', estimatedHours: 1 }
  ],
  event: [
    { title: '确定主题', description: '明确活动主题和目标', priority: 'high', estimatedHours: 1 },
    { title: '预算规划', description: '制定预算方案', priority: 'high', estimatedHours: 1 },
    { title: '场地预订', description: '预订活动场地', priority: 'high', estimatedHours: 2 },
    { title: '宣传推广', description: '制作宣传物料', priority: 'medium', estimatedHours: 3 },
    { title: '现场执行', description: '活动现场管理', priority: 'medium', estimatedHours: 4 }
  ]
}

// 应用模板
const applyTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value]) {
    subtasks.value = JSON.parse(JSON.stringify(templates[selectedTemplate.value]))
    error.value = ''
  }
}

// 生成子任务
const generateSubtasks = async () => {
  if (!props.taskTitle) {
    error.value = '任务标题不能为空'
    return
  }
  
  isGenerating.value = true
  error.value = ''
  
  try {
    const result = await AITaskSplitter.splitTask(
      props.taskTitle,
      props.taskDescription,
      subtaskCount.value
    )
    
    subtasks.value = result.map(item => ({
      title: item.title || item.text || '',
      description: item.description || '',
      priority: item.priority || 'medium',
      estimatedHours: item.estimatedHours || 1
    }))
  } catch (err) {
    error.value = err.message
  } finally {
    isGenerating.value = false
  }
}

// 重新生成
const regenerate = () => {
  subtasks.value = []
  generateSubtasks()
}

// 删除子任务
const removeSubtask = (index) => {
  subtasks.value.splice(index, 1)
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || '中'
}

// 创建子任务
const createSubtasks = () => {
  if (subtasks.value.length === 0) return
  
  emit('create', subtasks.value)
  emit('close')
}

// 重置状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    subtasks.value = []
    selectedTemplate.value = ''
    error.value = ''
  }
})
</script>

<style scoped>
.splitter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10005;
  padding: 0;
  animation: fadeIn 0.2s;
}

.splitter-container {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  margin: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.splitter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.splitter-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.splitter-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.task-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.info-desc {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
}

.split-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.option-group label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.option-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.option-group select:focus {
  outline: none;
  border-color: #667eea;
}

.btn-generate {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.subtasks-list {
  margin-top: 1.5rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.list-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.btn-regenerate {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-regenerate:hover {
  background: #e0e0e0;
}

.subtask-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-left: 4px solid #667eea;
}

.subtask-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.subtask-number {
  background: #667eea;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.subtask-title {
  flex: 1;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  width: 100%;
}

.subtask-title:focus {
  outline: none;
  border-color: #667eea;
}

.priority-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.priority-badge.high {
  background: #fee;
  color: #c33;
}

.priority-badge.medium {
  background: #ffeaa7;
  color: #d63031;
}

.priority-badge.low {
  background: #dfe6e9;
  color: #636e72;
}

.subtask-desc {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 0.5rem;
}

.subtask-desc:focus {
  outline: none;
  border-color: #667eea;
}

.subtask-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-estimate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.time-input {
  width: 60px;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-remove {
  padding: 0.25rem 0.75rem;
  background: #fee;
  color: #c33;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fdd;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.splitter-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* 全局加载动画 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.spinner-ring {
  width: 80px;
  height: 80px;
  border: 6px solid rgba(255, 255, 255, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-text {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
