<template>
  <div class="add-log-overlay" @click.self="$emit('close')">
    <div class="add-log-container">
      <!-- 头部 -->
      <div class="log-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h3>添加执行日志</h3>
        <div style="width: 80px;"></div>
      </div>

      <!-- 表单内容 -->
      <div class="log-form" ref="logFormRef">
        <!-- 日志类型 -->
        <div class="form-group">
          <label class="required">📋 日志类型</label>
          <div class="type-buttons">
            <button
              v-for="type in logTypes"
              :key="type.value"
              :class="['type-btn', { active: formData.type === type.value }]"
              @click="formData.type = type.value"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          </div>
        </div>

        <!-- 日志内容 -->
        <div class="form-group">
          <label class="required">
            💬 日志内容 ({{ formData.content.length }}/2000 · {{ contentLines }}行)
          </label>
          <textarea
            v-model="formData.content"
            placeholder="详细描述本次执行的内容..."
            maxlength="2000"
            rows="6"
            ref="contentTextarea"
            class="auto-resize-textarea"
          ></textarea>
        </div>

        <!-- 本次耗时 -->
        <div class="form-group">
          <label>⏱️ 本次耗时 (分钟)</label>
          <div class="duration-buttons">
            <button
              v-for="duration in quickDurations"
              :key="duration"
              :class="['duration-btn', { active: formData.duration === duration }]"
              @click="formData.duration = duration"
            >
              {{ duration }}
            </button>
            <input
              v-model.number="customDuration"
              type="number"
              placeholder="自定义"
              min="1"
              @input="formData.duration = customDuration"
            />
          </div>
        </div>

        <!-- 当前进度 -->
        <div v-if="formData.type !== 'start'" class="form-group">
          <label>📊 当前进度 ({{ formData.progress }}%)</label>
          <input
            v-model.number="formData.progress"
            type="range"
            min="0"
            max="100"
            step="5"
            class="progress-slider"
          />
          <div class="progress-labels">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <!-- 标签 -->
        <div class="form-group">
          <label>🏷️ 标签 (可选)</label>
          <div class="tags-input">
            <span
              v-for="(tag, index) in formData.tags"
              :key="index"
              class="tag-chip"
            >
              #{{ tag }}
              <button @click="removeTag(index)">×</button>
            </span>
            <input
              v-model="newTag"
              type="text"
              placeholder="输入标签后按回车"
              @keyup.enter="addTag"
            />
          </div>
        </div>

        <!-- 心情 -->
        <div class="form-group">
          <label>😊 心情 (可选)</label>
          <div class="mood-buttons">
            <button
              v-for="mood in moods"
              :key="mood.value"
              :class="['mood-btn', { active: formData.mood === mood.value }]"
              @click="formData.mood = formData.mood === mood.value ? null : mood.value"
            >
              {{ mood.icon }} {{ mood.label }}
            </button>
          </div>
        </div>

        <!-- 完成类型特有字段 -->
        <template v-if="formData.type === 'complete'">
          <!-- 完成质量自评 -->
          <div class="form-group">
            <label>⭐ 完成质量自评</label>
            <div class="rating-buttons">
              <button
                v-for="rating in [1, 2, 3, 4, 5]"
                :key="rating"
                :class="['rating-btn', { active: formData.rating >= rating }]"
                @click="formData.rating = rating"
              >
                ⭐
              </button>
            </div>
          </div>

          <!-- 经验教训 -->
          <div class="form-group">
            <label>📚 经验教训 (可选)</label>
            <div class="lessons-list">
              <div
                v-for="(lesson, index) in formData.lessons"
                :key="index"
                class="lesson-item"
              >
                <span>• {{ lesson }}</span>
                <button @click="removeLesson(index)">×</button>
              </div>
              <input
                v-model="newLesson"
                type="text"
                placeholder="输入一条经验后按回车"
                @keyup.enter="addLesson"
              />
            </div>
          </div>
        </template>

        <!-- 解决方案类型：关联阻碍 -->
        <div v-if="formData.type === 'solution' && unresolvedBlocks.length > 0" class="form-group">
          <label>🔗 关联之前的阻碍 (可选)</label>
          <select v-model="formData.relatedLogId">
            <option :value="null">不关联</option>
            <option
              v-for="block in unresolvedBlocks"
              :key="block.id"
              :value="block.id"
            >
              {{ block.content.substring(0, 30) }}... ({{ formatDate(block.timestamp) }})
            </option>
          </select>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="log-footer">
        <button class="cancel-btn" @click="$emit('close')">取消</button>
        <button
          class="submit-btn"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          💾 保存日志
        </button>
      </div>
    </div>

    <!-- AI 文本选择菜单 -->
    <AITextMenu
      :visible="showTextMenu"
      :position="menuPosition"
      :selected-text="selectedText"
      @close="closeTextMenu"
      @action="handleTextAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'
import AITextMenu from './AITextMenu.vue'
import { useTextSelection } from '../composables/useTextSelection'
import { AITextService } from '../services/aiTextService'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  defaultType: {
    type: String,
    default: 'progress'
  }
})

const emit = defineEmits(['close', 'submit'])

const taskStore = useOfflineTaskStore()

// 文本选择菜单
const logFormRef = ref(null)
const { showMenu: showTextMenu, menuPosition, selectedText, closeTextMenu, replaceSelectedText } = useTextSelection(logFormRef)

// 处理 AI 文本操作
const handleTextAction = async ({ action, text, tone }) => {
  console.log('AddLogModal handleTextAction:', { action, text, tone })
  
  if (!text || text.trim() === '') {
    alert('未检测到选中的文本，请重新选择')
    return
  }
  
  try {
    const result = await AITextService.processText(action, text, { tone })
    replaceSelectedText(result)
  } catch (error) {
    console.error('AI处理失败:', error)
    alert(`AI处理失败：${error.message}`)
  }
}

// 表单数据
const formData = ref({
  type: props.defaultType,
  content: '',
  duration: null,
  progress: props.task.stats?.progressHistory[props.task.stats.progressHistory.length - 1] || 0,
  tags: [],
  mood: null,
  rating: null,
  lessons: [],
  relatedLogId: null
})

const customDuration = ref(null)
const newTag = ref('')
const newLesson = ref('')

// 日志类型
const logTypes = [
  { value: 'start', icon: '🚀', label: '开始' },
  { value: 'progress', icon: '📈', label: '进展' },
  { value: 'block', icon: '🚫', label: '阻碍' },
  { value: 'solution', icon: '💡', label: '方案' },
  { value: 'milestone', icon: '🎯', label: '里程碑' },
  { value: 'complete', icon: '✅', label: '完成' }
]

// 日志类型标签映射
const logTypeLabels = {
  start: '开始执行',
  progress: '进展更新',
  block: '遇到阻碍',
  solution: '解决方案',
  milestone: '里程碑',
  complete: '完成总结'
}

// 快速时长选项
const quickDurations = [15, 30, 60, 120]

// 心情选项
const moods = [
  { value: 'good', icon: '😊', label: '顺利' },
  { value: 'neutral', icon: '😐', label: '一般' },
  { value: 'bad', icon: '😓', label: '困难' }
]

// 内容行数
const contentLines = computed(() => {
  return formData.value.content.split('\n').length
})

// 未解决的阻碍
const unresolvedBlocks = computed(() => {
  return taskStore.getUnresolvedBlocks(props.task.id)
})

// 是否可以提交
const canSubmit = computed(() => {
  return formData.value.type && formData.value.content.trim().length > 0
})

// 自动调整textarea高度
watch(() => formData.value.content, () => {
  nextTick(() => {
    const textarea = contentTextarea.value
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px'
    }
  })
})

// 添加标签
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

// 移除标签
const removeTag = (index) => {
  formData.value.tags.splice(index, 1)
}

// 添加经验
const addLesson = () => {
  const lesson = newLesson.value.trim()
  if (lesson) {
    formData.value.lessons.push(lesson)
    newLesson.value = ''
  }
}

// 移除经验
const removeLesson = (index) => {
  formData.value.lessons.splice(index, 1)
}

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 提交
const handleSubmit = () => {
  if (!canSubmit.value) return

  const logData = {
    type: formData.value.type,
    content: formData.value.content.trim(),
    duration: formData.value.duration,
    progress: formData.value.type === 'start' ? 0 : formData.value.progress,
    tags: formData.value.tags,
    mood: formData.value.mood,
    rating: formData.value.rating,
    lessons: formData.value.lessons,
    relatedLogId: formData.value.relatedLogId
  }

  emit('submit', logData)
}
</script>

<style scoped>
.add-log-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 3000;
}

.add-log-container {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 头部 */
.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

/* 拖动手柄 */
.log-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.log-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
}

.back-btn {
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0 1rem;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 表单 */
.log-form {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  max-width: 100%;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.9rem;
}

.form-group label.required::after {
  content: ' *';
  color: #f44336;
}

/* 类型按钮 */
.type-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.type-btn {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: #667eea;
}

.type-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

/* 文本域 */
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
  min-height: 100px;
  max-height: 400px;
}

textarea.auto-resize-textarea {
  overflow-y: auto;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 时长按钮 */
.duration-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.duration-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.duration-btn:hover {
  border-color: #667eea;
}

.duration-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.duration-buttons input {
  flex: 1;
  min-width: 100px;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.85rem;
}

.duration-buttons input:focus {
  outline: none;
  border-color: #667eea;
}

/* 进度滑块 */
.progress-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.progress-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #999;
}

/* 标签输入 */
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  min-height: 44px;
}

.tags-input:focus-within {
  border-color: #667eea;
}

.tag-chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #667eea;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
}

.tag-chip button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
}

.tags-input input {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  font-size: 0.85rem;
}

/* 心情按钮 */
.mood-buttons {
  display: flex;
  gap: 0.5rem;
}

.mood-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.mood-btn:hover {
  border-color: #667eea;
}

.mood-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 评分按钮 */
.rating-buttons {
  display: flex;
  gap: 0.5rem;
}

.rating-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.2s;
}

.rating-btn:hover {
  border-color: #667eea;
}

.rating-btn.active {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-color: #ffd700;
}

/* 经验列表 */
.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lesson-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.lesson-item button {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
}

.lessons-list input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.85rem;
}

.lessons-list input:focus {
  outline: none;
  border-color: #667eea;
}

/* 下拉选择 */
select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
}

select:focus {
  outline: none;
  border-color: #667eea;
}

/* 底部按钮 */
.log-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.log-footer button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.log-footer button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.log-footer button:active:not(:disabled) {
  transform: translateY(0);
}
</style>
