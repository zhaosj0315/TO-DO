# Dead Code 清理指南 v0.7.12

**创建日期**: 2026-03-05  
**检测结果**: 98个潜在未使用函数

---

## ⚠️ 重要提示

**不要立即删除！** 本指南提供安全的清理流程。

---

## 📋 清理流程

### 步骤1: 人工确认（预计4小时）

对每个函数执行以下检查：

```bash
# 1. 全局搜索函数名
grep -r "functionName" src/

# 2. 检查Vue模板调用
grep -r "@functionName\|:functionName" src/

# 3. 检查动态调用
grep -r "this\[.*functionName" src/

# 4. 检查字符串引用
grep -r "'functionName'\|\"functionName\"" src/
```

### 步骤2: 标记待删除（预计30分钟）

确认无用后，添加注释：

```javascript
// TODO: Dead Code - 待删除 (2026-03-12)
// 原因：未被调用，已确认无用
// function xxx() { ... }
```

### 步骤3: 测试（1周）

- 完整功能测试
- 构建测试（APK/Windows/Mac）
- 用户测试

### 步骤4: 删除（预计1小时）

测试无问题后，删除注释的代码。

---

## 📊 待确认函数列表

### TodoView.vue (45个)

#### 任务管理相关（15个）
- [ ] filterTasks
- [ ] resetFilters
- [ ] clearSearch
- [ ] clearDateFilter
- [ ] openEditModal
- [ ] previewTask
- [ ] openTaskSplitter
- [ ] openTaskSplitterForNew
- [ ] confirmCustomDate
- [ ] confirmWeeklySelect
- [ ] ignoreDetectedSubtasks
- [ ] parseCategoryText
- [ ] parseDateTime
- [ ] parsePriorityText
- [ ] parseStatusText

#### 番茄钟相关（10个）
- [ ] pausePomodoro
- [ ] continueNextPomodoro
- [ ] skipBreak
- [ ] formatPomodoroDate
- [ ] formatPomodoroTime
- [ ] getPomodorosByPriority
- [ ] getPomodorosByTime
- [ ] getPomodoroMinutes
- [ ] getTotalFocusMinutes
- [ ] getMaxDailyPomodoros

#### 报告相关（5个）
- [ ] generateCustomReport
- [ ] batchDeleteReports
- [ ] closeUnifiedReport
- [ ] exportMarkdown
- [ ] getCompletionRate

#### AI相关（5个）
- [ ] applySuggestion
- [ ] dismissSuggestion
- [ ] copyAIResult
- [ ] clearDescription
- [ ] saveTemplateEdit

#### 导入导出（3个）
- [ ] cancelImport
- [ ] showImportWarning
- [ ] triggerRestoreFile

#### 用户界面（5个）
- [ ] openFullscreenDesc
- [ ] closeFullscreenDesc
- [ ] startEditUsername
- [ ] toggleLanguage
- [ ] togglePriorityMode

#### 教程相关（3个）
- [ ] startTutorial
- [ ] showVersionHistory
- [ ] markAllVersionsRead

#### 分页相关（3个）
- [ ] goToFirstPage
- [ ] goToLastPage
- [ ] jumpToPageNumber

#### 其他（6个）
- [ ] clearClipboardHistory
- [ ] openNotificationSettings
- [ ] getPlaceholder
- [ ] getDeadlineText
- [ ] getPlannedDeadlineText
- [ ] getLevelBadge

### AIModelConfig.vue (5个)
- [ ] addModel
- [ ] clearForm
- [ ] setDefault
- [ ] exportConfig
- [ ] importConfig

### 其他组件 (48个)

详见：`AUDIT_REPORT_v0.7.12.json`

---

## 🔧 自动化工具

### 批量搜索脚本

```bash
#!/bin/bash
# 批量检查函数调用

FUNCTIONS=(
    "filterTasks"
    "resetFilters"
    "clearSearch"
    # ... 添加更多函数
)

for func in "${FUNCTIONS[@]}"; do
    echo "检查: $func"
    count=$(grep -r "$func" src/ | wc -l)
    if [ $count -eq 1 ]; then
        echo "  ⚠️  可能未使用（仅1次引用）"
    else
        echo "  ✓ 被调用 $count 次"
    fi
done
```

---

## 📝 确认记录

### 已确认无用（示例）

```
✅ functionName1 - 已确认无用，已注释
✅ functionName2 - 已确认无用，已注释
```

### 已确认有用（示例）

```
❌ functionName3 - Vue模板中使用
❌ functionName4 - 动态调用
```

---

## ⏰ 时间安排

- **Week 1**: 人工确认（每天1小时，共4小时）
- **Week 2**: 标记待删除 + 开始测试
- **Week 3**: 继续测试
- **Week 4**: 删除代码 + 最终测试

---

**创建日期**: 2026-03-05  
**预计完成**: 2026-04-05  
**负责人**: 待指定
