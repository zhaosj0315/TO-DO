# 报告中心页面层级与返回手势审查报告

## 审查时间
2026-03-08 08:18

## 页面层级结构

### 当前层级关系

```
首页 (z-index: 默认)
  └─ 个人主页 (z-index: 默认)
      └─ 报告中心 (z-index: 10008)
          ├─ 一级：报告类型选择页
          ├─ 二级：报告详情页（可视化/文本）
          │   └─ 三级：AI汇报弹窗 (z-index: 100001)
          └─ 报告历史按钮 (右上角📚)
              └─ 报告历史列表 (z-index: 10009)
                  └─ 历史报告详情 (z-index: 10010)
                      └─ AI汇报弹窗 (z-index: 100001)
```

### z-index分配

| 页面 | z-index | 说明 |
|------|---------|------|
| 报告中心（普通） | 10008 | 一级页面 |
| 报告历史列表 | 10009 | 二级页面 |
| 历史报告详情 | 10010 | 三级页面 |
| AI汇报弹窗 | 100001 | 最上层 |

---

## 返回手势逻辑审查

### ✅ 已实现的返回逻辑

#### 1. 报告中心内部返回（UnifiedReportModal.handleBackButton）
```javascript
handleBackButton: () => {
  // 第一层：AI汇报弹窗
  if (showAIReportModal.value) {
    showAIReportModal.value = false
    return true  // 已处理
  }
  // 第二层：报告详情
  if (reportGenerated.value) {
    reportGenerated.value = false
    visualData.value = null
    textData.value = null
    return true  // 已处理
  }
  return false  // 关闭整个弹窗
}
```

**返回路径**：
- AI汇报 → 报告详情 → 报告类型选择 → 关闭

#### 2. TodoView返回手势处理
```javascript
else if (showUnifiedReport.value) {
  console.log('✅ 关闭统一报告中心')
  // 检查内部状态
  if (unifiedReportModalRef.value && unifiedReportModalRef.value.handleBackButton) {
    const handled = unifiedReportModalRef.value.handleBackButton()
    if (handled) {
      return  // 内部已处理
    }
  }
  // 关闭整个弹窗
  showUnifiedReport.value = false
  historyReportData.value = null
}
```

#### 3. 报告历史返回
```javascript
else if (showReportHistoryModal.value) {
  console.log('✅ 关闭报告历史')
  showReportHistoryModal.value = false
  return
}
```

---

## ❌ 发现的问题

### 问题1：报告历史的返回逻辑不完整

**当前状态**：
- 报告历史列表 → 直接关闭（正确）
- 历史报告详情 → ？（未处理）

**问题**：
从报告历史打开历史报告后，返回手势应该：
1. 历史报告详情 → 报告历史列表
2. 报告历史列表 → 关闭

**当前行为**：
返回手势会先关闭报告历史列表，历史报告详情还在显示（因为z-index更高）

### 问题2：返回手势优先级错误

**当前顺序**（TodoView.vue 第13178-13377行）：
```javascript
if (showReportHistoryModal.value) {        // 第N层
  ...
} else if (showUnifiedReport.value) {      // 第N+1层
  ...
}
```

**问题**：
- `showReportHistoryModal` 在 `showUnifiedReport` 之前判断
- 但实际上历史报告详情（showUnifiedReport + historyReportData）应该优先处理

---

## 🔧 需要修复的逻辑

### 修复1：调整返回手势优先级

**正确顺序**：
```javascript
// 第三层：历史报告详情（最高优先级）
if (showUnifiedReport.value && historyReportData.value) {
  // 处理历史报告内部返回
  if (unifiedReportModalRef.value && unifiedReportModalRef.value.handleBackButton) {
    const handled = unifiedReportModalRef.value.handleBackButton()
    if (handled) return
  }
  // 关闭历史报告详情，返回报告历史列表
  showUnifiedReport.value = false
  historyReportData.value = null
  return
}

// 第二层：报告历史列表
else if (showReportHistoryModal.value) {
  showReportHistoryModal.value = false
  return
}

// 第一层：报告中心（普通模式）
else if (showUnifiedReport.value) {
  // 处理报告中心内部返回
  if (unifiedReportModalRef.value && unifiedReportModalRef.value.handleBackButton) {
    const handled = unifiedReportModalRef.value.handleBackButton()
    if (handled) return
  }
  // 关闭报告中心
  showUnifiedReport.value = false
  return
}
```

### 修复2：添加状态标识

**建议**：
使用 `historyReportData.value` 来区分：
- `showUnifiedReport && historyReportData` → 历史报告详情
- `showUnifiedReport && !historyReportData` → 普通报告中心

---

## 完整返回路径

### 路径1：普通报告中心
```
首页
  → 个人主页
    → 报告中心（选择类型）
      → 报告详情（可视化/文本）
        → AI汇报
          ↓ 返回
        报告详情
          ↓ 返回
      报告类型选择
          ↓ 返回
    个人主页
```

### 路径2：报告历史
```
首页
  → 个人主页
    → 报告中心（选择类型）
      → 点击右上角📚
        → 报告历史列表
          → 点击某个历史报告
            → 历史报告详情（只读）
              → AI汇报
                ↓ 返回
              历史报告详情
                ↓ 返回
            报告历史列表
                ↓ 返回
          报告中心（选择类型）
```

---

## 返回手势优先级（从高到低）

1. **AI汇报弹窗** (z-index: 100001)
2. **历史报告详情** (z-index: 10010) - `showUnifiedReport && historyReportData`
3. **报告历史列表** (z-index: 10009) - `showReportHistoryModal`
4. **报告中心详情** (z-index: 10008) - `showUnifiedReport && reportGenerated`
5. **报告中心选择** (z-index: 10008) - `showUnifiedReport`

---

## 建议修复方案

### 方案A：调整判断顺序（推荐）

**优点**：
- 最小改动
- 逻辑清晰
- 符合z-index层级

**实现**：
在 TodoView.vue 的返回手势处理中，将历史报告详情的判断提前到报告历史列表之前。

### 方案B：统一状态管理

**优点**：
- 更易维护
- 状态清晰

**缺点**：
- 改动较大

---

## 总结

### 当前问题
1. ❌ 返回手势优先级错误（报告历史在历史报告详情之前）
2. ❌ 历史报告详情返回时会跳过报告历史列表

### 需要修复
1. 调整返回手势判断顺序
2. 添加 `historyReportData` 状态判断
3. 确保返回路径：历史报告详情 → 报告历史列表 → 报告中心

### 预期效果
- ✅ 所有返回手势按正确层级逐级关闭
- ✅ 历史报告详情返回到报告历史列表
- ✅ 报告历史列表返回到报告中心
- ✅ 符合Android返回手势规范
