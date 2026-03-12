# 无用代码检测与清理方案

**检测时间**: 2026-03-12 15:05  
**检测工具**: Python Dead Code Detector  
**项目规模**: 106个文件，2911个函数

---

## 📊 检测结果统计

| 类别 | 数量 | 占比 |
|------|------|------|
| **总函数数** | 2911 | 100% |
| **零引用函数** | 78 | 2.7% |
| **低使用率函数** | 463 | 15.9% |
| **正常使用函数** | 2370 | 81.4% |

---

## 🚨 零引用函数分析（78个）

### ⚠️ 高风险 - 不建议删除（需人工确认）

#### 1. Vue 组件方法（可能被模板调用）
```
AIChat.vue:
- loadChatHistory (可能被 @click 调用)
- clearChatHistory (可能被 @click 调用)

AIModelConfig.vue:
- getCurrentUsername (可能被模板使用)
- getUrlPlaceholder (可能被模板使用)
- setDefault (可能被 @click 调用)

TaskDetailModal.vue:
- formatDateShort (可能被模板使用)
- formatDeadlineShort (可能被模板使用)

UnifiedReportModal.vue:
- showHistory (可能被 @click 调用)
```

#### 2. Store 方法（可能被外部调用）
```
offlineTaskStore.js:
- addWaitFor (可能被组件调用)
- removeWaitFor (可能被组件调用)
- updateTaskLog (可能被组件调用)
- deleteTaskLog (可能被组件调用)
- resolveBlock (可能被组件调用)
- reorderCollections (可能被组件调用)
- isCollectionLocked (可能被组件调用)
- enterCollection (可能被组件调用)
- goBackCollection (可能被组件调用)
- goToRootCollection (可能被组件调用)
- getCollectionStats (可能被组件调用)
```

#### 3. Service 方法（可能被动态调用）
```
notificationService.js:
- hideNotification (可能被定时器调用)

sqliteService.js:
- exportDatabase (可能被菜单调用)

aiReportGenerator.js:
- getTemplateSections (可能被动态调用)

aiWorkReportGenerator.js:
- getTaskPomodoros (可能被动态调用)
- getEstimatedPomodoros (可能被动态调用)
- calculateOverdueDays (可能被动态调用)
```

#### 4. Utils 方法（可能被多处调用）
```
userLocalStorage.js:
- getUserLocalStorage (可能被动态调用)
- setUserLocalStorage (可能被动态调用)
- removeUserLocalStorage (可能被动态调用)
- getUserLocalStorageSync (可能被动态调用)
- setUserLocalStorageSync (可能被动态调用)
```

### ✅ 低风险 - 可能是真正的无用代码

#### 1. TodoView.vue 中的废弃函数
```javascript
// 这些函数可能是旧版本遗留
- openTaskSplitter (line 4731)
- openTaskSplitterForNew (line 4737)
- getPlaceholder (line 5947)
- handleTaskInputBlur (line 7466)
- getPomodorosByPriority (line 8457)
- getPomodorosByTime (line 8474)
- getConsecutiveDays (line 8509)
- getMaxDailyPomodoros (line 8544)
- getCompletionRate (line 8561)
- getMaxDailyInWeek (line 8595)
- getCategoryPercent (line 8602)
- getLevelBadge (line 8610)
- getTodayFocusMinutes (line 8633)
- getWeekCompletedPomodoros (line 8639)
- getTotalFocusMinutes (line 8656)
- formatPomodoroTime (line 8662)
- formatPomodoroDate (line 8670)
- getPomodoroMinutes (line 8686)
- filterTasks (line 9035)
- openEditModal (line 9659)
- confirmCustomDate (line 9753)
- formatLogTimeMini (line 11381)
- getTaskTypeText (line 12071)
```

#### 2. 导入/导出相关（可能已废弃）
```javascript
TodoView.vue:
- parseCategoryText (line 12532)
- parsePriorityText (line 12538)
- parseTypeText (line 12544)
- parseStatusText (line 12553)
- parseWeekdays (line 12560)
- parseDateTime (line 12571)
- getPlannedDeadlineText (line 12687)
- getDeadlineText (line 12702)
```

#### 3. 笔记本管理相关（可能已废弃）
```javascript
TodoView.vue:
- toggleCollectionList (line 12934)
- cancelEditCollectionName (line 13014)
- openBatchAddForCollection (line 13028)
- showCollectionMenu (line 13096)
```

#### 4. 计算属性（可能未使用）
```javascript
TodoView.vue:
- descEditTime (line 5921)
- completionPercentage (line 8295)
- pendingPomodoros (line 8402)
```

---

## 🎯 清理建议

### 阶段1：安全清理（立即执行）

**目标**: 删除明确无用的函数（约10-15个）

#### 可以安全删除的函数：
1. **GanttChartView.vue**:
   - `renderGanttItem` (line 242) - 重复定义

2. **TodoView.vue** - 旧版本遗留：
   - `openTaskSplitter` (line 4731)
   - `openTaskSplitterForNew` (line 4737)
   - `getPlaceholder` (line 5947)

#### 删除步骤：
```bash
# 1. 创建备份分支
git checkout -b cleanup/dead-code-phase1

# 2. 注释掉函数（不删除）
# 手动编辑文件，将函数注释掉

# 3. 测试所有功能
npm run dev
# 手动测试所有页面和功能

# 4. 确认无问题后提交
git add .
git commit -m "refactor: 注释无用函数（Phase 1）"

# 5. 观察1-2天，确认无问题后再删除
```

### 阶段2：谨慎清理（1周后执行）

**目标**: 删除可能无用的函数（约20-30个）

#### 需要人工确认的函数：
1. **TodoView.vue** - 番茄钟统计相关：
   - `getPomodorosByPriority`
   - `getPomodorosByTime`
   - `getConsecutiveDays`
   - `getMaxDailyPomodoros`
   - `getCompletionRate`
   - `getTodayFocusMinutes`
   - `getWeekCompletedPomodoros`
   - `getTotalFocusMinutes`

2. **TodoView.vue** - 导入导出相关：
   - `parseCategoryText`
   - `parsePriorityText`
   - `parseTypeText`
   - `parseStatusText`
   - `parseWeekdays`
   - `parseDateTime`

#### 确认方法：
```bash
# 1. 全局搜索函数名
grep -r "functionName" src/

# 2. 检查模板中是否使用
grep -r "@click=\"functionName\"" src/
grep -r "v-on:click=\"functionName\"" src/
grep -r "{{.*functionName.*}}" src/

# 3. 检查是否在 computed/watch 中使用
grep -r "computed.*functionName" src/
grep -r "watch.*functionName" src/
```

### 阶段3：深度清理（1个月后执行）

**目标**: 清理低使用率函数（引用≤2次）

#### 重点检查：
1. **只在定义文件中被引用1次的函数**
2. **只在测试文件中被引用的函数**
3. **只在已废弃文件中被引用的函数**

---

## 🛡️ 安全策略

### 1. 动态调用检测

#### Vue 模板调用：
```javascript
// 脚本检测不到这些调用
<button @click="functionName">
<div v-if="functionName()">
{{ functionName() }}
```

#### 对象动态调用：
```javascript
// 脚本检测不到这些调用
const methods = { functionName }
methods['functionName']()
this[methodName]()
```

#### 字符串调用：
```javascript
// 脚本检测不到这些调用
eval('functionName()')
window['functionName']()
```

### 2. 误判防范

#### 检查清单：
- [ ] 函数是否在 Vue 模板中使用？
- [ ] 函数是否是生命周期钩子？
- [ ] 函数是否被 watch/computed 使用？
- [ ] 函数是否被动态调用？
- [ ] 函数是否是 API 接口（被外部调用）？
- [ ] 函数是否是事件处理器？
- [ ] 函数是否在注释中标注为"保留"？

### 3. 回滚方案

```bash
# 如果删除后出现问题，立即回滚
git revert HEAD

# 或者恢复到删除前的提交
git reset --hard <commit-hash>

# 查看被删除的函数
git show HEAD
```

---

## 📝 清理执行记录

### Phase 1（计划执行日期：2026-03-12）
- [ ] 注释 `renderGanttItem` 重复定义
- [ ] 注释 `openTaskSplitter` 系列函数
- [ ] 注释 `getPlaceholder` 函数
- [ ] 测试所有功能
- [ ] 提交到 Git

### Phase 2（计划执行日期：2026-03-19）
- [ ] 确认 Phase 1 无问题
- [ ] 删除 Phase 1 注释的函数
- [ ] 注释番茄钟统计相关函数
- [ ] 注释导入导出相关函数
- [ ] 测试所有功能
- [ ] 提交到 Git

### Phase 3（计划执行日期：2026-04-12）
- [ ] 确认 Phase 2 无问题
- [ ] 删除 Phase 2 注释的函数
- [ ] 分析低使用率函数
- [ ] 制定深度清理计划
- [ ] 提交到 Git

---

## 📊 预期效果

### 代码量减少：
- Phase 1: 约 50-100 行
- Phase 2: 约 200-300 行
- Phase 3: 约 500-1000 行
- **总计**: 约 750-1400 行（占总代码量的 1-2%）

### 维护成本降低：
- 减少代码复杂度
- 提升代码可读性
- 降低维护难度
- 减少潜在 bug

---

## ⚠️ 重要提醒

1. **不要一次性删除所有零引用函数**
2. **每次清理后必须完整测试**
3. **使用 Git 分支进行清理**
4. **保留详细的清理记录**
5. **遇到问题立即回滚**

---

## ✅ 结论

本项目代码质量良好，零引用函数占比仅 2.7%，远低于行业平均水平（通常 10-20%）。建议采用**渐进式清理**策略，分3个阶段逐步清理，确保零风险。
