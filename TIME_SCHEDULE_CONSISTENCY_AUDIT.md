# 时间安排一致性审查报告

**日期**: 2026-03-11  
**审查范围**: 所有涉及时间安排选择的页面

---

## 📋 审查清单

### 1. TodoView.vue - 创建任务 ✅
**位置**: 第270行

**功能**:
- ✅ 11种类型完整
- ✅ monthly显示日期输入框
- ✅ 验证逻辑完整
- ✅ monthDay字段传递

**状态**: ✅ 已完善

---

### 2. TodoView.vue - 编辑任务 ⚠️
**位置**: 第2165行

**问题**:
- ❌ 缺少monthly日期输入框
- ❌ 缺少monthDay变量
- ❌ 缺少验证逻辑

**需要修复**:
1. 添加editMonthDay变量
2. 添加monthly日期输入框UI
3. 添加handleEditTypeChange中的monthly处理
4. 保存时传递monthDay

---

### 3. TaskDetailModal.vue - 任务详情 ⚠️
**位置**: 第46行

**问题**:
- ❌ 缺少monthly日期输入框
- ❌ 缺少handleTypeChange中的monthly处理
- ❌ 保存时可能丢失monthDay

**需要修复**:
1. 添加monthly日期输入框UI
2. 添加handleTypeChange中的monthly处理
3. 确保保存时传递monthDay

---

### 4. AddSubtaskModal.vue - 添加子任务 ✅
**位置**: 第65行

**功能**:
- ✅ 11种类型完整
- ✅ monthly显示日期输入框
- ✅ handleTypeChange自动设置默认值
- ✅ monthDay字段传递

**状态**: ✅ 已完善

---

### 5. SubtaskPreviewModal.vue - 子任务预览 ⚠️
**位置**: 第66行

**问题**:
- ❌ 缺少monthly日期输入框
- ❌ 缺少@change处理
- ❌ 保存时可能丢失monthDay

**需要修复**:
1. 添加monthly日期输入框UI
2. 添加@change="handleTypeChange"
3. 添加handleTypeChange函数
4. 确保保存时传递monthDay

---

## 📊 问题汇总

### 需要修复的页面（3个）

#### 1. TodoView.vue - 编辑任务 ⚠️⚠️⚠️
**优先级**: P0（高频使用）

**缺失功能**:
- ❌ editMonthDay变量
- ❌ monthly日期输入框
- ❌ handleEditTypeChange中的monthly处理
- ❌ 保存时传递monthDay

---

#### 2. TaskDetailModal.vue - 任务详情 ⚠️⚠️
**优先级**: P0（高频使用）

**缺失功能**:
- ❌ monthly日期输入框
- ❌ handleTypeChange中的monthly处理
- ❌ 确保monthDay正确保存

---

#### 3. SubtaskPreviewModal.vue - 子任务预览 ⚠️
**优先级**: P1（中频使用）

**缺失功能**:
- ❌ monthly日期输入框
- ❌ handleTypeChange函数
- ❌ 确保monthDay正确保存

---

## 🎯 修复计划

### Phase 1: TodoView编辑任务（P0）⭐⭐⭐
1. 添加editMonthDay变量
2. 添加monthly日期输入框UI
3. 修改handleEditTypeChange
4. 修改saveEditedTask传递monthDay

### Phase 2: TaskDetailModal（P0）⭐⭐⭐
1. 添加monthly日期输入框UI
2. 修改handleTypeChange
3. 确保updateTask传递monthDay

### Phase 3: SubtaskPreviewModal（P1）⭐⭐
1. 添加monthly日期输入框UI
2. 添加handleTypeChange函数
3. 确保保存时传递monthDay

---

## ✅ 统一标准

### 必须包含的功能

#### 1. UI显示
```html
<!-- 每月重复日期选择 -->
<div v-if="type === 'monthly'" class="form-group">
  <label>每月几号</label>
  <input 
    type="number" 
    v-model.number="monthDay" 
    min="1" 
    max="31" 
    placeholder="1-31"
  />
</div>
```

#### 2. 类型切换处理
```javascript
const handleTypeChange = () => {
  if (type === 'monthly' && !monthDay) {
    monthDay = 1
  }
}
```

#### 3. 验证逻辑
```javascript
if (type === 'monthly' && (!monthDay || monthDay < 1 || monthDay > 31)) {
  showNotification('请选择每月几号（1-31）！', 'error')
  return
}
```

#### 4. 数据传递
```javascript
const task = {
  type: type,
  monthDay: type === 'monthly' ? monthDay : null,
  // ...
}
```

---

## 📝 详细修复步骤

### 修复1: TodoView编辑任务

#### 步骤1: 添加变量
```javascript
const editMonthDay = ref(1)
```

#### 步骤2: 添加UI
```html
<div v-if="editType === 'monthly'" class="edit-field">
  <label class="field-label">每月几号</label>
  <input 
    type="number" 
    v-model.number="editMonthDay" 
    min="1" 
    max="31" 
    class="input"
  />
</div>
```

#### 步骤3: 修改handleEditTypeChange
```javascript
const handleEditTypeChange = () => {
  // ...
  if (editType.value === 'monthly' && !editMonthDay.value) {
    editMonthDay.value = 1
  }
}
```

#### 步骤4: 修改saveEditedTask
```javascript
const updatedTask = {
  ...editingTask.value,
  type: editType.value,
  monthDay: editType.value === 'monthly' ? editMonthDay.value : null,
  // ...
}
```

---

### 修复2: TaskDetailModal

#### 步骤1: 添加UI
```html
<div v-if="localTask.type === 'monthly'" class="overview-item">
  <span class="label">每月几号</span>
  <input 
    type="number" 
    v-model.number="localTask.monthDay" 
    min="1" 
    max="31" 
    class="field-input"
  />
</div>
```

#### 步骤2: 修改handleTypeChange
```javascript
const handleTypeChange = () => {
  // ...
  if (localTask.value.type === 'monthly' && !localTask.value.monthDay) {
    localTask.value.monthDay = 1
  }
}
```

---

### 修复3: SubtaskPreviewModal

#### 步骤1: 添加UI
```html
<div v-if="subtask.type === 'monthly'" class="subtask-field">
  <label>每月几号</label>
  <input 
    type="number" 
    v-model.number="subtask.monthDay" 
    min="1" 
    max="31" 
    class="attr-input"
  />
</div>
```

#### 步骤2: 添加handleTypeChange
```javascript
const handleTypeChange = (subtask) => {
  if (subtask.type === 'monthly' && !subtask.monthDay) {
    subtask.monthDay = 1
  }
}
```

#### 步骤3: 添加@change
```html
<select v-model="subtask.type" @change="handleTypeChange(subtask)">
```

---

## 🧪 测试场景

### 测试1: 编辑任务改为monthly
1. 打开任务详情
2. 点击编辑
3. 修改类型为"每月重复"
4. 验证：显示日期输入框，默认值为1 ✅
5. 修改为15号
6. 保存
7. 验证：任务类型和日期正确保存 ✅

### 测试2: 任务详情修改monthly日期
1. 打开monthly类型任务详情
2. 修改日期为20号
3. 保存
4. 验证：日期正确更新 ✅

### 测试3: 子任务预览修改为monthly
1. 创建任务并AI拆分
2. 在预览中修改子任务类型为"每月重复"
3. 验证：显示日期输入框 ✅
4. 设置日期为10号
5. 保存
6. 验证：子任务正确创建 ✅

---

## ✅ 验收标准

1. ✅ 所有页面的monthly类型都显示日期输入框
2. ✅ 切换到monthly时自动设置默认值1号
3. ✅ 保存时正确传递monthDay字段
4. ✅ 验证逻辑统一（1-31）
5. ✅ UI样式统一

---

## 📚 相关文档

- [MONTHLY_LOGIC_FIX.md](MONTHLY_LOGIC_FIX.md) - 每月重复逻辑修复
- [PHASE1_IMPLEMENTATION_REPORT.md](PHASE1_IMPLEMENTATION_REPORT.md) - Phase1实施报告
