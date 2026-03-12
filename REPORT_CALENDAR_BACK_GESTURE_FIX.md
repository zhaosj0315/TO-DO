# 报告中心日历选择器返回手势修复

**日期**: 2026-03-11  
**问题**: 报告中心的日历选择器返回手势逻辑混乱

---

## 🔍 问题描述

### 用户反馈的问题
1. **返回手势跳过日历**：点击返回时，日历选择器没有关闭，直接关闭了报告弹窗和个人中心
2. **状态残留**：关闭报告后重新打开，日历选择器仍然显示
3. **z-index 遮挡**：日历选择器被报告弹窗遮挡（已在之前修复）

### 正常逻辑流程
```
打开报告中心
  ↓
选择报告类型（日报/周报/月报/自定义）
  ↓
选择"自定义" → 点击日期按钮
  ↓
弹出日历选择器
  ↓
选择日期 → 确认
  ↓
日历关闭 → 返回报告中心
  ↓
生成报告
  ↓
返回手势：报告详情 → 报告选择 → 关闭报告
```

### 返回手势层级
```
第1层（最上层）：日历选择器（开始/结束）
第2层：AI汇报弹窗
第3层：报告详情
第4层：报告选择页
第5层：关闭整个报告弹窗
```

---

## 🐛 根本原因

### 1. 返回手势未处理日历选择器
**问题代码**：
```javascript
handleBackButton: () => {
  // 第一层：AI汇报弹窗
  if (showAIReportModal.value) {
    showAIReportModal.value = false
    return true
  }
  // 第二层：报告详情
  if (reportGenerated.value) {
    reportGenerated.value = false
    return true
  }
  return false // 关闭整个弹窗
}
```

**问题**：缺少日历选择器的判断，导致返回手势跳过日历

### 2. 关闭时未清理状态
**问题**：直接使用 `$emit('close')`，没有清理日历选择器状态

**后果**：
- 日历选择器状态残留（`showStartCalendar` / `showEndCalendar` 仍为 true）
- 重新打开报告时，日历选择器仍然显示

---

## ✅ 修复方案

### 1. 添加日历选择器返回手势处理

**修复代码**：
```javascript
handleBackButton: () => {
  // 第一层：日历选择器（最上层）
  if (showStartCalendar.value) {
    showStartCalendar.value = false
    return true
  }
  if (showEndCalendar.value) {
    showEndCalendar.value = false
    return true
  }
  // 第二层：AI汇报弹窗
  if (showAIReportModal.value) {
    showAIReportModal.value = false
    return true
  }
  // 第三层：报告详情
  if (reportGenerated.value) {
    reportGenerated.value = false
    visualData.value = null
    textData.value = null
    return true
  }
  return false // 关闭整个弹窗
}
```

### 2. 添加关闭处理函数

**新增函数**：
```javascript
const handleClose = () => {
  // 清理日历选择器状态
  showStartCalendar.value = false
  showEndCalendar.value = false
  // 清理报告状态
  showAIReportModal.value = false
  reportGenerated.value = false
  visualData.value = null
  textData.value = null
  // 触发关闭事件
  emit('close')
}
```

### 3. 替换所有关闭事件

**修改位置**：
- 模板顶部：`@click.self="handleClose"`
- 返回按钮：`@click="handleClose"`
- 关闭按钮：`@click="handleClose"`

---

## 🧪 测试场景

### 场景1：正常流程
1. 打开报告中心
2. 选择"自定义"
3. 点击"开始日期"
4. 选择日期 → 确认
5. 日历关闭 ✅
6. 点击"结束日期"
7. 选择日期 → 确认
8. 日历关闭 ✅
9. 点击"生成"
10. 查看报告 ✅

### 场景2：返回手势（日历打开）
1. 打开报告中心
2. 选择"自定义"
3. 点击"开始日期"
4. **滑动返回**
5. 验证：日历关闭，报告中心仍打开 ✅

### 场景3：返回手势（报告详情）
1. 打开报告中心
2. 选择"周报"（自动生成）
3. **滑动返回**
4. 验证：报告详情关闭，返回报告选择页 ✅
5. **再次滑动返回**
6. 验证：报告中心关闭 ✅

### 场景4：状态清理
1. 打开报告中心
2. 选择"自定义"
3. 点击"开始日期"
4. **不选择日期，直接点击返回按钮**
5. 验证：报告中心关闭 ✅
6. **重新打开报告中心**
7. 验证：日历选择器未显示 ✅

### 场景5：多层返回
1. 打开报告中心
2. 选择"周报"
3. 点击"🤖 AI汇报"
4. **滑动返回**
5. 验证：AI汇报关闭，报告详情仍显示 ✅
6. **再次滑动返回**
7. 验证：报告详情关闭，返回报告选择页 ✅
8. **再次滑动返回**
9. 验证：报告中心关闭 ✅

---

## 📊 返回手势层级图

```
┌─────────────────────────────────────┐
│  日历选择器（z-index: 100002）      │ ← 第1层（最上层）
│  - showStartCalendar                │
│  - showEndCalendar                  │
└─────────────────────────────────────┘
              ↓ 返回
┌─────────────────────────────────────┐
│  AI汇报弹窗（z-index: 100001）      │ ← 第2层
│  - showAIReportModal                │
└─────────────────────────────────────┘
              ↓ 返回
┌─────────────────────────────────────┐
│  报告详情（reportGenerated）        │ ← 第3层
│  - visualData                       │
│  - textData                         │
└─────────────────────────────────────┘
              ↓ 返回
┌─────────────────────────────────────┐
│  报告选择页（selectedType）         │ ← 第4层
│  - 日报/周报/月报/自定义            │
└─────────────────────────────────────┘
              ↓ 返回
┌─────────────────────────────────────┐
│  关闭报告中心                       │ ← 第5层
│  - emit('close')                    │
└─────────────────────────────────────┘
```

---

## ✅ 验收标准

1. ✅ 日历选择器打开时，返回手势优先关闭日历
2. ✅ 日历关闭后，报告中心仍然打开
3. ✅ 关闭报告中心时，自动清理日历选择器状态
4. ✅ 重新打开报告中心时，日历选择器不会残留
5. ✅ 多层返回手势按正确顺序执行
6. ✅ z-index 层级正确（日历 > AI汇报 > 报告详情）

---

## 🔄 相关修复

### 之前的修复（2026-03-11 11:48）
- ✅ 提升日历选择器 z-index 到 100002
- ✅ 解决日历被报告弹窗遮挡的问题

### 本次修复（2026-03-11 12:15）
- ✅ 添加日历选择器返回手势处理
- ✅ 添加关闭时状态清理
- ✅ 修复返回手势跳过日历的问题
- ✅ 修复状态残留问题

---

## 📚 相关文档

- [DATE_PICKER_UNIFICATION_PROGRESS.md](DATE_PICKER_UNIFICATION_PROGRESS.md) - 日期选择器统一进度
- [CALENDAR_PICKER_OPTIMIZATION.md](CALENDAR_PICKER_OPTIMIZATION.md) - 日历选择器优化报告
