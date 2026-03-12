# 任务类型选项对比报告

**日期**: 2026-03-11  
**审查范围**: 所有任务创建/编辑页面的类型选项

---

## 📊 任务类型对比

### 标准任务类型（7种）
根据 README.md 定义：
1. `today` - 今天
2. `tomorrow` - 明天
3. `this_week` - 本周内
4. `custom_date` - 指定日期
5. `daily` - 每天重复
6. `weekday` - 工作日重复
7. `weekly` - 每周重复

---

## 🔍 各页面实现对比

### 1. TodoView.vue - 创建任务（首页）
**位置**: 第270-277行

**选项**:
- ✅ today - 今天
- ✅ tomorrow - 明天
- ✅ this_week - 本周内
- ✅ daily - 每天重复
- ✅ weekday - 工作日重复
- ✅ custom_date - 指定日期
- ✅ weekly - 每周重复

**完整性**: ✅ **7/7（100%）**

---

### 2. TaskDetailModal.vue - 任务详情
**位置**: 第47-53行

**选项**:
- ✅ today - 📅 今天
- ✅ tomorrow - 📆 明天
- ✅ this_week - 📋 本周内
- ✅ custom_date - 🗓️ 指定日期
- ✅ daily - 🔄 每天重复
- ✅ weekday - 💼 工作日重复
- ✅ weekly - 📆 每周重复

**完整性**: ✅ **7/7（100%）**

---

### 3. SubtaskPreviewModal.vue - 子任务预览
**位置**: 第67-73行

**选项**:
- ✅ today - 📅 今天
- ✅ tomorrow - 📆 明天
- ✅ this_week - 📋 本周内
- ✅ custom_date - 🗓️ 指定日期
- ✅ daily - 🔄 每天重复
- ✅ weekday - 💼 工作日重复
- ✅ weekly - 📆 每周重复

**完整性**: ✅ **7/7（100%）**

---

### 4. AddSubtaskModal.vue - 添加子任务
**位置**: 第66-69行

**选项**:
- ✅ today - 今天
- ✅ tomorrow - 明天
- ✅ this_week - 本周内
- ✅ custom_date - 指定日期
- ❌ daily - 每天重复（缺失）
- ❌ weekday - 工作日重复（缺失）
- ❌ weekly - 每周重复（缺失）

**完整性**: ⚠️ **4/7（57%）** - 缺少3个重复类型

---

## 📋 问题总结

### ✅ 一致的页面（3个）
1. TodoView.vue - 创建任务（7/7）
2. TaskDetailModal.vue - 任务详情（7/7）
3. SubtaskPreviewModal.vue - 子任务预览（7/7）

### ❌ 不一致的页面（1个）
4. **AddSubtaskModal.vue** - 添加子任务（4/7）⚠️

**缺少的类型**：
- ❌ `daily` - 每天重复
- ❌ `weekday` - 工作日重复
- ❌ `weekly` - 每周重复

---

## 🛠️ 修复方案

### 方案1：补全选项（推荐）⭐

**修改文件**: `src/components/AddSubtaskModal.vue`  
**位置**: 第66-69行

**修复代码**:
```html
<div class="form-group">
  <label>任务类型</label>
  <select v-model="formData.type">
    <option value="today">今天</option>
    <option value="tomorrow">明天</option>
    <option value="this_week">本周内</option>
    <option value="custom_date">指定日期</option>
    <option value="daily">每天重复</option>
    <option value="weekday">工作日重复</option>
    <option value="weekly">每周重复</option>
  </select>
</div>
```

**优点**:
- ✅ 与其他页面保持一致
- ✅ 功能完整
- ✅ 用户体验统一

**缺点**:
- ⚠️ 需要添加周期选择逻辑（weekly类型）

---

### 方案2：保持简化（当前）

**理由**:
- 子任务通常是短期任务
- 重复类型较少使用
- 简化用户选择

**优点**:
- ✅ 界面简洁
- ✅ 减少用户选择负担

**缺点**:
- ❌ 功能不完整
- ❌ 与其他页面不一致

---

## 🎯 建议

### 推荐方案1：补全选项

**原因**:
1. **功能完整性**：用户可能需要创建重复类型的子任务
2. **一致性**：与其他页面保持统一
3. **灵活性**：给用户更多选择

**需要额外处理**:
- 添加 `weekly` 类型的周期选择逻辑
- 参考 TodoView.vue 的实现

---

## 📝 详细对比表

| 页面 | today | tomorrow | this_week | custom_date | daily | weekday | weekly | 完整性 |
|------|-------|----------|-----------|-------------|-------|---------|--------|--------|
| TodoView.vue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| TaskDetailModal.vue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| SubtaskPreviewModal.vue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| **AddSubtaskModal.vue** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **57%** ⚠️ |

---

## 🔄 如果选择修复

### 修改步骤

#### 1. 添加选项
```html
<option value="daily">每天重复</option>
<option value="weekday">工作日重复</option>
<option value="weekly">每周重复</option>
```

#### 2. 添加周期选择（weekly类型）
参考 TodoView.vue 的实现，添加星期选择器

#### 3. 更新表单数据
```javascript
const formData = ref({
  text: '',
  description: '',
  priority: 'medium',
  category: 'work',
  type: 'today',
  customDate: '',
  customTime: '',
  weekdays: []  // 新增：周期数组
})
```

---

## ✅ 验收标准

如果修复：
1. ✅ AddSubtaskModal 包含所有7种任务类型
2. ✅ weekly 类型支持周期选择
3. ✅ 与其他页面保持一致
4. ✅ 功能正常工作

---

## 📚 相关文档

- [README.md](README.md) - 任务类型定义（7种）
- [src/views/TodoView.vue](src/views/TodoView.vue) - 完整实现参考
