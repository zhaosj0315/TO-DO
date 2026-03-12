# 每月重复逻辑修复报告

**日期**: 2026-03-11  
**问题**: monthly类型逻辑与daily重复

---

## 🐛 问题描述

### 原设计缺陷
```javascript
case 'monthly':
  if (task.monthDay) {
    // 计算截止时间
  }
  // ❌ 如果没有设置日期，默认当天截止
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
```

**问题**:
- `monthly` 不设置日期 → 默认当天截止
- `daily` 每天重复 → 当天截止
- **逻辑重复** ❌

---

## ✅ 修复方案

### 1. 强制要求设置日期

**修改文件**: `src/stores/offlineTaskStore.js`

```javascript
case 'monthly':
  if (task.monthDay) {
    // 计算截止时间
  }
  // ✅ 如果没有设置日期，返回null表示无效
  console.warn('每月重复任务必须设置monthDay')
  return null
```

---

### 2. 添加验证逻辑

**修改文件**: `src/views/TodoView.vue`

```javascript
// 验证每月重复
if (newTaskType.value === 'monthly' && (!monthDay.value || monthDay.value < 1 || monthDay.value > 31)) {
  showNotification('请选择每月几号（1-31）！', 'error')
  return
}
```

---

### 3. 添加UI输入框

**修改文件**: `src/views/TodoView.vue`

```html
<!-- 每月重复日期选择 -->
<div class="attr-group" v-if="newTaskType === 'monthly'">
  <input 
    type="number" 
    v-model.number="monthDay" 
    min="1" 
    max="31" 
    placeholder="每月几号"
    class="attr-select"
    style="width: 80px; text-align: center;"
  />
</div>
```

---

### 4. 自动设置默认值

**修改文件**: `src/components/AddSubtaskModal.vue`

```javascript
const handleTypeChange = () => {
  // monthly类型切换时，如果没有设置日期，设置默认值为1号
  if (formData.value.type === 'monthly' && !formData.value.monthDay) {
    formData.value.monthDay = 1
  }
}
```

---

## 📊 修复前后对比

### 修复前 ❌
```
monthly（不设置日期）→ 当天23:59截止
daily → 当天23:59截止
逻辑重复！
```

### 修复后 ✅
```
monthly（必须设置日期）→ 每月X号23:59截止
daily → 每天23:59截止
逻辑清晰，不重复！
```

---

## ✅ 验收标准

1. ✅ monthly类型必须设置monthDay（1-31）
2. ✅ 不设置日期时返回null并警告
3. ✅ 创建任务时验证monthDay有效性
4. ✅ UI显示日期输入框
5. ✅ 切换到monthly时自动设置默认值1号

---

## 🧪 测试场景

### 测试1：创建monthly任务不设置日期
1. 选择"每月重复"
2. 不输入日期
3. 点击提交
4. 验证：显示错误提示"请选择每月几号（1-31）！" ✅

### 测试2：创建monthly任务设置日期
1. 选择"每月重复"
2. 输入"15"号
3. 点击提交
4. 验证：任务创建成功，截止时间为每月15号 ✅

### 测试3：切换到monthly自动设置默认值
1. 选择"每月重复"
2. 验证：输入框自动显示"1" ✅

---

## 📝 修改文件

1. ✅ `src/stores/offlineTaskStore.js` - 修复截止时间计算逻辑
2. ✅ `src/views/TodoView.vue` - 添加验证、UI、变量
3. ✅ `src/components/AddSubtaskModal.vue` - 添加自动设置默认值

---

## 🎯 总结

**问题**: monthly和daily逻辑重复  
**原因**: monthly不设置日期时默认当天截止  
**解决**: 强制要求设置日期，不设置返回null  
**结果**: 逻辑清晰，不重复 ✅
