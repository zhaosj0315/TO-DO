# TaskDetailModal Monthly 修复报告

**日期**: 2026-03-11  
**修复内容**: 任务详情页面添加 monthly 支持

---

## ✅ 修复内容

### 1. 添加 monthly 日期输入框

**位置**: 第60-70行（在 custom_date 输入框后面）

**代码**:
```html
<div v-if="localTask.type === 'monthly'" class="overview-item">
  <span class="label">每月几号</span>
  <input 
    type="number" 
    v-model.number="localTask.monthDay" 
    min="1" 
    max="31" 
    placeholder="1-31"
    class="field-input"
    style="width: 80px; text-align: center;"
    @blur="saveField('monthDay')"
  />
</div>
```

---

### 2. 修改 handleTypeChange

**位置**: 第905行

**新增代码**:
```javascript
// 处理每月重复
if (localTask.value.type === 'monthly') {
  if (!localTask.value.monthDay) {
    localTask.value.monthDay = 1
  }
}
```

**功能**: 切换到 monthly 时自动设置默认值为 1 号

---

### 3. 自动保存

**机制**: 
- 输入框失焦时自动调用 `saveField('monthDay')`
- `saveField` 函数会调用 `taskStore.updateTask` 保存数据

---

## 🧪 测试场景

### 测试1: 切换到 monthly 类型
1. 打开任意任务详情
2. 修改时间安排为"每月重复"
3. **验证**: 显示"每月几号"输入框，默认值为 1 ✅

### 测试2: 修改 monthly 日期
1. 打开 monthly 类型任务详情
2. 修改日期为 15 号
3. 点击输入框外部（失焦）
4. 关闭详情页
5. 重新打开
6. **验证**: 日期保存为 15 号 ✅

### 测试3: 从其他类型切换到 monthly
1. 打开"今天"类型任务
2. 修改为"每月重复"
3. **验证**: 自动显示输入框，默认值 1 ✅
4. 修改为 20 号
5. 保存
6. **验证**: 任务类型和日期都正确保存 ✅

---

## ✅ 验收标准

1. ✅ monthly 类型显示日期输入框
2. ✅ 切换到 monthly 时自动设置默认值 1
3. ✅ 输入框失焦自动保存
4. ✅ 日期范围限制 1-31
5. ✅ 样式与其他输入框统一

---

## 📝 修改文件

- ✅ `src/components/TaskDetailModal.vue`
  - 添加 monthly 日期输入框 UI
  - 修改 handleTypeChange 函数
  - 添加 @blur 保存逻辑

---

## 🎯 下一步

修复 SubtaskPreviewModal（子任务预览）
