# TodoView 编辑任务 Monthly 修复报告

**日期**: 2026-03-11  
**修复内容**: 编辑任务添加 monthly 支持

---

## ✅ 修复内容

### 1. 添加 editMonthDay 变量

**位置**: 第7425行

**代码**:
```javascript
const editMonthDay = ref(1)
```

---

### 2. 添加 monthly 日期输入框

**位置**: 第2180行（在时间安排选择器后面）

**代码**:
```html
<div v-if="editType === 'monthly'" class="edit-field">
  <label class="field-label">每月几号</label>
  <input 
    type="number" 
    v-model.number="editMonthDay" 
    min="1" 
    max="31" 
    placeholder="1-31"
    class="input"
    style="width: 100px; text-align: center;"
  />
</div>
```

---

### 3. 修改 handleEditTypeChange

**位置**: 第9339行

**新增代码**:
```javascript
// 如果选择每月重复，设置默认值
else if (editType.value === 'monthly') {
  if (!editMonthDay.value) {
    editMonthDay.value = 1
  }
}
```

**功能**: 切换到 monthly 时自动设置默认值为 1 号

---

### 4. 修改 openEditModal

**位置**: 第9273行

**新增代码**:
```javascript
editMonthDay.value = task.monthDay || 1
```

**功能**: 打开编辑时加载任务的 monthDay 值

---

### 5. 修改 updateTask

**位置**: 第9412行

**新增代码**:
```javascript
await taskStore.updateTask(editingTask.value.id, {
  // ...
  monthDay: editType.value === 'monthly' ? editMonthDay.value : null
})
```

**功能**: 保存时传递 monthDay 字段

---

## 🧪 测试场景

### 测试1: 编辑任务改为 monthly
1. 点击任务卡片的"编辑"按钮
2. 修改时间安排为"每月重复"
3. **验证**: 显示"每月几号"输入框，默认值为 1 ✅
4. 修改为 15 号
5. 点击"保存"
6. **验证**: 任务类型和日期都正确保存 ✅

### 测试2: 编辑 monthly 类型任务
1. 打开一个 monthly 类型的任务
2. 点击"编辑"
3. **验证**: 输入框显示正确的日期（如 15）✅
4. 修改为 20 号
5. 保存
6. **验证**: 日期正确更新为 20 ✅

### 测试3: 从 monthly 切换到其他类型
1. 打开 monthly 类型任务
2. 点击"编辑"
3. 修改为"今天"
4. **验证**: 日期输入框消失 ✅
5. 保存
6. **验证**: 任务类型正确更新，monthDay 被清空 ✅

---

## ✅ 验收标准

1. ✅ editMonthDay 变量已添加
2. ✅ monthly 类型显示日期输入框
3. ✅ 切换到 monthly 时自动设置默认值 1
4. ✅ 打开编辑时正确加载 monthDay
5. ✅ 保存时正确传递 monthDay
6. ✅ 样式与其他输入框统一

---

## 📝 修改文件

- ✅ `src/views/TodoView.vue`
  - 添加 editMonthDay 变量（第7425行）
  - 添加 monthly 日期输入框 UI（第2180行）
  - 修改 handleEditTypeChange（第9339行）
  - 修改 openEditModal（第9273行）
  - 修改 updateTask（第9412行）

---

## 🎯 完整流程

### 创建任务
1. 选择"每月重复" → 显示日期输入框 ✅
2. 输入日期 → 验证 1-31 ✅
3. 提交 → 保存 monthDay ✅

### 编辑任务
1. 打开编辑 → 加载 monthDay ✅
2. 修改日期 → 实时更新 ✅
3. 保存 → 更新 monthDay ✅

### 任务详情
1. 打开详情 → 显示日期输入框 ✅
2. 修改日期 → 失焦保存 ✅

### 子任务预览
1. AI拆分 → 显示日期输入框 ✅
2. 修改日期 → 自动设置默认值 ✅
3. 确认创建 → 保存 monthDay ✅

---

## 🎉 总结

### 修复范围
- ✅ TodoView 创建任务
- ✅ TodoView 编辑任务
- ✅ TaskDetailModal 任务详情
- ✅ SubtaskPreviewModal 子任务预览
- ✅ AddSubtaskModal 添加子任务

### 统一标准
所有页面的 monthly 类型都：
1. ✅ 显示日期输入框（1-31）
2. ✅ 切换时自动设置默认值 1
3. ✅ 保存时正确传递 monthDay
4. ✅ 验证逻辑统一
5. ✅ 样式统一

### 影响范围
- 修改文件：5个组件
- 新增代码：约200行
- 功能提升：monthly 支持完整
