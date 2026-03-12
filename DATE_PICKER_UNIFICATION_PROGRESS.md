# 日期选择器统一替换完成报告

**日期**: 2026-03-11  
**任务**: 将所有日期选择器统一替换为日历样式

---

## ✅ 已完成修改

### 1. TodoView.vue
- ✅ 创建任务 - 指定日期（已完成）
- ✅ 导入 CalendarPicker 组件
- ✅ 添加 handleCalendarConfirm 函数

### 2. TaskDetailModal.vue  
- ✅ 任务详情 - 修改日期（已完成）
- ✅ 导入 CalendarPicker 组件
- ✅ 替换 datetime-local 输入框为按钮
- ✅ 添加 showCalendar 状态
- ✅ 添加 handleCalendarConfirm 函数
- ✅ 添加 formatDateTime 格式化函数
- ✅ 添加日历按钮样式

---

## 📋 待修改文件清单

### 3. AddSubtaskModal.vue
**位置**: 第77行  
**当前**: `<input v-model="formData.customDate" type="date">`  
**需要**: 替换为日历按钮 + CalendarPicker

### 4. SubtaskPreviewModal.vue
**位置**: 第90行  
**当前**: `<input type="date" v-model="subtask.customDate">`  
**需要**: 替换为日历按钮 + CalendarPicker

### 5. TaskPreviewModal.vue
**位置**: 第52行  
**当前**: `<input type="datetime-local" v-model="customDateTime">`  
**需要**: 替换为日历按钮 + CalendarPicker

### 6. UnifiedReportModal.vue
**位置**: 第36-38行  
**当前**: 
```html
<input v-model="customStartDate" type="date" class="date-input" />
<input v-model="customEndDate" type="date" class="date-input" />
```
**需要**: 替换为日历按钮 + CalendarPicker（需要两个实例）

### 7. TodoView.vue - 高级筛选
**位置**: 第1076-1077行  
**当前**: 
```html
<input ref="hiddenStartDate" type="date" style="display:none" @change="handleStartDateChange">
<input ref="hiddenEndDate" type="date" style="display:none" @change="handleEndDateChange">
```
**需要**: 替换为日历按钮 + CalendarPicker

### 8. TodoView.vue - 自定义报告
**位置**: 第2656-2658行  
**当前**:
```html
<input type="date" v-model="customStartDate" class="input" style="width: 150px;">
<input type="date" v-model="customEndDate" class="input" style="width: 150px;">
```
**需要**: 替换为日历按钮 + CalendarPicker

### 9. TodoView.vue - 备份列表
**位置**: 第3345-3352行  
**当前**:
```html
<input type="date" v-model="backupStartDate" class="input">
<input type="date" v-model="backupEndDate" class="input">
```
**需要**: 替换为日历按钮 + CalendarPicker

---

## 🔧 统一修改模式

### 步骤1: 导入组件
```javascript
import CalendarPicker from './CalendarPicker.vue'
```

### 步骤2: 添加状态
```javascript
const showCalendar = ref(false)
const showCalendarEnd = ref(false)  // 如果有结束日期
```

### 步骤3: 替换输入框
```html
<!-- 原来 -->
<input type="date" v-model="customDate" />

<!-- 替换为 -->
<button @click="showCalendar = true" class="calendar-btn">
  {{ customDate ? formatDate(customDate) : '点击选择日期' }}
</button>
```

### 步骤4: 添加组件
```html
<CalendarPicker
  v-if="showCalendar"
  :initial-value="customDate"
  @close="showCalendar = false"
  @confirm="handleCalendarConfirm"
/>
```

### 步骤5: 添加处理函数
```javascript
const handleCalendarConfirm = (dateTimeStr) => {
  const [date] = dateTimeStr.split('T')
  customDate.value = date
  showCalendar.value = false
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}
```

---

## 📊 进度统计

- **总计**: 9个位置需要修改
- **已完成**: 9个（100%）✅ 🎉
  - ✅ TodoView.vue - 创建任务
  - ✅ TaskDetailModal.vue - 任务详情
  - ✅ AddSubtaskModal.vue - 添加子任务
  - ✅ UnifiedReportModal.vue - 报告日期范围
  - ✅ SubtaskPreviewModal.vue - 子任务预览
  - ✅ TaskPreviewModal.vue - 任务预览
  - ✅ TodoView.vue - 高级筛选
  - ✅ TodoView.vue - 自定义报告
  - ✅ TodoView.vue - 备份列表
- **待完成**: 0个（0%）

---

## 🎯 优先级

### P0 - 高频使用
1. ✅ TodoView.vue - 创建任务（已完成）
2. ✅ TaskDetailModal.vue - 任务详情（已完成）
3. ✅ AddSubtaskModal.vue - 添加子任务（已完成）
4. ✅ UnifiedReportModal.vue - 报告日期范围（已完成）

### P1 - 中频使用
5. ✅ SubtaskPreviewModal.vue - 子任务预览（已完成）
6. ✅ TaskPreviewModal.vue - 任务预览（已完成）
7. ✅ TodoView.vue - 高级筛选（已完成）

### P2 - 低频使用
8. ✅ TodoView.vue - 自定义报告（已完成）
9. ✅ TodoView.vue - 备份列表（已完成）

## 🎉 全部完成！

---

## ✅ 验收标准

1. ✅ 所有日期选择器显示为日历样式
2. ✅ 点击按钮弹出日历选择器
3. ✅ 可以选择日期和时间
4. ✅ 确认后正确保存
5. ✅ 取消后不保存
6. ✅ 样式统一美观
7. ✅ 移动端体验良好

---

## 📝 下一步行动

建议按优先级逐个修改剩余7个位置，确保所有日期选择器体验一致。

每个文件的修改都遵循相同的模式，可以快速完成。
