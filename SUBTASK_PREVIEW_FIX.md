# SubtaskPreviewModal 修复报告

**日期**: 2026-03-11  
**修复内容**: z-index 层级 + monthly 支持 + 返回手势

---

## ✅ 修复1: z-index 层级问题

### 问题
- SubtaskPreviewModal z-index: 1000
- TaskDetailModal z-index: 10010
- **结果**: 子任务预览被任务详情遮挡 ❌

### 解决方案
```css
.modal-overlay {
  z-index: 10020;  /* 从 1000 提升到 10020 */
}
```

### 层级关系（修复后）
```
SubtaskPreviewModal: 10020  ← 最上层
TaskDetailModal: 10010
其他弹窗: < 10000
```

---

## ✅ 修复2: monthly 支持

### 1. 添加 @change 处理
```html
<select v-model="subtask.type" @change="handleTypeChange(subtask)">
```

### 2. 添加 monthly 日期输入框
```html
<div v-if="subtask.type === 'monthly'" class="subtask-monthday">
  <label>每月几号：</label>
  <input 
    type="number" 
    v-model.number="subtask.monthDay" 
    min="1" 
    max="31" 
    placeholder="1-31"
    class="attr-input"
    style="width: 80px; text-align: center;"
  />
</div>
```

### 3. 添加 handleTypeChange 函数
```javascript
const handleTypeChange = (subtask) => {
  if (subtask.type === 'monthly' && !subtask.monthDay) {
    subtask.monthDay = 1
  }
}
```

### 4. 添加样式
```css
.subtask-monthday {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}
```

---

## ✅ 修复3: 返回手势支持

### 现状
- TodoView 的返回手势监听器已包含 `showSubtaskPreview` 处理
- 位置：第14285行
- 逻辑：`showSubtaskPreview.value = false`

### 验证
```javascript
else if (showSubtaskPreview.value) {
  console.log('✅ 关闭子任务预览')
  showSubtaskPreview.value = false
  return
}
```

**结论**: 返回手势已支持，无需额外修改 ✅

---

## 🧪 测试场景

### 测试1: z-index 层级
1. 打开任务详情
2. 点击"🤖 AI拆分"
3. 拆分完成后显示子任务预览
4. **验证**: 子任务预览在任务详情上方，不被遮挡 ✅

### 测试2: monthly 支持
1. 打开任务详情
2. 点击"🤖 AI拆分"
3. 在子任务预览中修改某个子任务类型为"每月重复"
4. **验证**: 显示"每月几号"输入框，默认值为 1 ✅
5. 修改为 15 号
6. 点击"确认创建"
7. **验证**: 子任务正确创建，类型和日期都正确 ✅

### 测试3: 返回手势
1. 打开任务详情
2. 点击"🤖 AI拆分"
3. 拆分完成后显示子任务预览
4. **滑动返回手势**（左右边缘向中间滑动）
5. **验证**: 子任务预览关闭，返回任务详情 ✅
6. **再次滑动返回**
7. **验证**: 任务详情关闭，返回首页 ✅

---

## ✅ 验收标准

1. ✅ SubtaskPreviewModal z-index 高于 TaskDetailModal
2. ✅ monthly 类型显示日期输入框
3. ✅ 切换到 monthly 时自动设置默认值 1
4. ✅ 返回手势正确关闭子任务预览
5. ✅ 样式与其他输入框统一

---

## 📝 修改文件

- ✅ `src/components/SubtaskPreviewModal.vue`
  - 提升 z-index 到 10020
  - 添加 @change="handleTypeChange(subtask)"
  - 添加 monthly 日期输入框 UI
  - 添加 handleTypeChange 函数
  - 添加 monthly 样式

---

## 🎯 层级关系总结

```
CalendarPicker: 100002        ← 日历选择器（最高）
UnifiedReportModal: 100001    ← AI汇报弹窗
SubtaskPreviewModal: 10020    ← 子任务预览（新）
TaskDetailModal: 10010        ← 任务详情
UnifiedReportModal: 10008     ← 报告中心
其他弹窗: < 10000
```

---

## 🎉 总结

### 核心问题
1. ❌ z-index 太低，被任务详情遮挡
2. ❌ 缺少 monthly 支持
3. ✅ 返回手势已支持（无需修改）

### 解决方案
1. ✅ 提升 z-index 到 10020
2. ✅ 添加 monthly 日期输入框和处理逻辑
3. ✅ 验证返回手势正常工作

### 影响范围
- 修改文件：1个组件
- 新增代码：约30行
- 功能提升：层级正确 + monthly 支持
