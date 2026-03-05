# Dead Code 检测报告

**生成时间**: 2026-03-03 16:58:38

## 📊 摘要

- 总函数数: 271
- 🚨 Dead Code: 103
- ⚠️  可疑函数: 50
- ✅ 安全函数: 118

## 🚨 Dead Code（0引用）

**⚠️ 警告**: 删除前请人工确认！

### `closeMenu`

**定义位置**:
- `src/composables/useTextSelection.js:155`
- `src/composables/useTextSelection.js:155`

### `while`

**定义位置**:
- `src/composables/useTextSelection.js:49`
- `src/components/AIChat.vue:1207`
- `src/components/AIChat.vue:1321`
- `src/views/TodoView.vue:8627`

### `clearAllDeletedTasks`

**定义位置**:
- `src/stores/offlineTaskStore.js:370`
- `src/stores/offlineTaskStore.js:370`

### `updateTaskStatus`

**定义位置**:
- `src/stores/taskStore.js:247`
- `src/stores/taskStore.js:247`

### `loadUser`

**定义位置**:
- `src/stores/userStore.js:39`

### `getTodayDate`

**定义位置**:
- `src/utils/autoBackup.js:15`
- `src/utils/autoBackup.js:15`
- `src/views/TodoView.vue:7289`
- `src/views/TodoView.vue:7289`

### `getAllData`

**定义位置**:
- `src/utils/autoBackup.js:32`
- `src/utils/autoBackup.js:32`
- `src/utils/autoBackup.js:32`

### `listBackups`

**定义位置**:
- `src/utils/autoBackup.js:172`
- `src/utils/autoBackup.js:172`
- `src/utils/autoBackup.js:172`

### `deleteBackup`

**定义位置**:
- `src/utils/autoBackup.js:365`
- `src/utils/autoBackup.js:365`
- `src/utils/autoBackup.js:365`

### `scheduleDailyReminders`

**定义位置**:
- `src/services/smartReminderService.js:28`
- `src/services/smartReminderService.js:28`

### `notifyStuckTasks`

**定义位置**:
- `src/services/smartReminderService.js:173`
- `src/services/smartReminderService.js:173`

### `dailyCheck`

**定义位置**:
- `src/services/smartReminderService.js:288`
- `src/services/smartReminderService.js:288`

### `showNotify`

**定义位置**:
- `src/App.vue:33`
- `src/App.vue:33`

### `getStatusText`

**定义位置**:
- `src/components/TaskDetailModal.vue:885`
- `src/components/TaskDetailModal.vue:885`
- `src/components/AIModelConfig.vue:512`
- `src/components/AIModelConfig.vue:512`

### `getProgressWidth`

**定义位置**:
- `src/components/TaskDetailModal.vue:964`
- `src/components/TaskDetailModal.vue:964`

### `saveAISummary`

**定义位置**:
- `src/components/TaskDetailModal.vue:1070`
- `src/components/TaskDetailModal.vue:1070`

### `toggleTimelineView`

**定义位置**:
- `src/components/TaskDetailModal.vue:1078`
- `src/components/TaskDetailModal.vue:1078`

### `deleteLog`

**定义位置**:
- `src/components/TaskDetailModal.vue:1092`
- `src/components/TaskDetailModal.vue:1092`

### `getLogTypeText`

**定义位置**:
- `src/components/TaskDetailModal.vue:1113`
- `src/components/TaskDetailModal.vue:1113`
- `src/views/TodoView.vue:9390`
- `src/views/TodoView.vue:9390`

### `getTagSize`

**定义位置**:
- `src/components/LogStats.vue:232`
- `src/components/LogStats.vue:232`

### `exportAsText`

**定义位置**:
- `src/components/LogStats.vue:259`
- `src/components/LogStats.vue:259`

### `exportAsMarkdown`

**定义位置**:
- `src/components/LogStats.vue:315`
- `src/components/LogStats.vue:315`

### `generateAIInsight`

**定义位置**:
- `src/components/DailySummaryModal.vue:175`
- `src/components/DailySummaryModal.vue:175`

### `removeTask`

**定义位置**:
- `src/components/AIChatCreate.vue:171`
- `src/components/AIChatCreate.vue:171`
- `src/components/AddDependencyModal.vue:173`
- `src/components/AddDependencyModal.vue:173`
- `src/components/TaskPreviewModal.vue:97`
- `src/components/TaskPreviewModal.vue:97`

### `updateCharts`

**定义位置**:
- `src/components/DataStatsModal.vue:524`
- `src/components/DataStatsModal.vue:524`

### `addTag`

**定义位置**:
- `src/components/AddLogModal.vue:362`
- `src/components/AddLogModal.vue:362`

### `removeTag`

**定义位置**:
- `src/components/AddLogModal.vue:371`
- `src/components/AddLogModal.vue:371`

### `removeSubtask`

**定义位置**:
- `src/components/SubtaskPreviewModal.vue:126`
- `src/components/SubtaskPreviewModal.vue:126`
- `src/components/SmartTaskSplitter.vue:221`
- `src/components/SmartTaskSplitter.vue:221`

### `getWarningText`

**定义位置**:
- `src/components/AddDependencyModal.vue:153`
- `src/components/AddDependencyModal.vue:153`

### `getTaskById`

**定义位置**:
- `src/components/AddDependencyModal.vue:181`
- `src/components/AddDependencyModal.vue:181`

### `copyReport`

**定义位置**:
- `src/components/AIReportModal.vue:284`
- `src/components/AIReportModal.vue:284`

### `formatReportAsText`

**定义位置**:
- `src/components/AIReportModal.vue:294`
- `src/components/AIReportModal.vue:294`

### `exportPDF`

**定义位置**:
- `src/components/AIReportModal.vue:334`
- `src/components/AIReportModal.vue:334`

### `loadModelsFromStorage`

**定义位置**:
- `src/components/AIChat.vue:144`
- `src/components/AIChat.vue:144`

### `highlightText`

**定义位置**:
- `src/components/AIChat.vue:191`
- `src/components/AIChat.vue:191`

### `copyMessage`

**定义位置**:
- `src/components/AIChat.vue:209`
- `src/components/AIChat.vue:209`

### `loadAllChats`

**定义位置**:
- `src/components/AIChat.vue:225`
- `src/components/AIChat.vue:225`

### `deleteChat`

**定义位置**:
- `src/components/AIChat.vue:303`
- `src/components/AIChat.vue:303`

### `clearCurrentChat`

**定义位置**:
- `src/components/AIChat.vue:319`
- `src/components/AIChat.vue:319`

### `formatChatTime`

**定义位置**:
- `src/components/AIChat.vue:328`
- `src/components/AIChat.vue:328`

### `detectIntent`

**定义位置**:
- `src/components/AIChat.vue:806`
- `src/components/AIChat.vue:806`

### `selectTemplate`

**定义位置**:
- `src/components/TemplateSelector.vue:88`
- `src/components/TemplateSelector.vue:88`

### `selectCustom`

**定义位置**:
- `src/components/TemplateSelector.vue:92`
- `src/components/TemplateSelector.vue:92`

### `applyTemplate`

**定义位置**:
- `src/components/SmartTaskSplitter.vue:177`
- `src/components/SmartTaskSplitter.vue:177`

### `viewDetails`

**定义位置**:
- `src/components/AISuggestionCard.vue:177`
- `src/components/AISuggestionCard.vue:177`

### `nextStep`

**定义位置**:
- `src/components/TutorialMode.vue:674`
- `src/components/TutorialMode.vue:674`

### `prevStep`

**定义位置**:
- `src/components/TutorialMode.vue:681`
- `src/components/TutorialMode.vue:681`

### `finishTutorial`

**定义位置**:
- `src/components/TutorialMode.vue:693`
- `src/components/TutorialMode.vue:693`

### `getProviderLabel`

**定义位置**:
- `src/components/AIModelConfig.vue:298`
- `src/components/AIModelConfig.vue:298`

### `getUrlPlaceholder`

**定义位置**:
- `src/components/AIModelConfig.vue:367`
- `src/components/AIModelConfig.vue:367`

### `addModel`

**定义位置**:
- `src/components/AIModelConfig.vue:754`
- `src/components/AIModelConfig.vue:754`

### `clearForm`

**定义位置**:
- `src/components/AIModelConfig.vue:825`
- `src/components/AIModelConfig.vue:825`

### `deleteModel`

**定义位置**:
- `src/components/AIModelConfig.vue:857`
- `src/components/AIModelConfig.vue:857`

### `getLogTypeLabel`

**定义位置**:
- `src/components/LogTimeline.vue:112`
- `src/components/LogTimeline.vue:112`

### `getMoodText`

**定义位置**:
- `src/components/LogTimeline.vue:147`
- `src/components/LogTimeline.vue:147`

### `formatDeleteTime`

**定义位置**:
- `src/components/TrashModal.vue:123`
- `src/components/TrashModal.vue:123`

### `showReportHistory`

**定义位置**:
- `src/views/TodoView.vue:4604`
- `src/views/TodoView.vue:4604`

### `batchDeleteReports`

**定义位置**:
- `src/views/TodoView.vue:4665`
- `src/views/TodoView.vue:4665`

### `getWordCountHint`

**定义位置**:
- `src/views/TodoView.vue:4927`
- `src/views/TodoView.vue:4927`

### `openFullscreenDesc`

**定义位置**:
- `src/views/TodoView.vue:4944`
- `src/views/TodoView.vue:4944`

### `closeFullscreenDesc`

**定义位置**:
- `src/views/TodoView.vue:4962`
- `src/views/TodoView.vue:4962`

### `ignoreDetectedSubtasks`

**定义位置**:
- `src/views/TodoView.vue:5014`
- `src/views/TodoView.vue:5014`

### `previewTask`

**定义位置**:
- `src/views/TodoView.vue:5020`
- `src/views/TodoView.vue:5020`

### `clearClipboardHistory`

**定义位置**:
- `src/views/TodoView.vue:5357`
- `src/views/TodoView.vue:5357`

### `copyAIResult`

**定义位置**:
- `src/views/TodoView.vue:5885`
- `src/views/TodoView.vue:5885`

### `viewTemplateDetail`

**定义位置**:
- `src/views/TodoView.vue:6000`
- `src/views/TodoView.vue:6000`

### `generateCustomReport`

**定义位置**:
- `src/views/TodoView.vue:6022`
- `src/views/TodoView.vue:6022`

### `getCategoryCount`

**定义位置**:
- `src/views/TodoView.vue:6456`
- `src/views/TodoView.vue:6456`

### `getMaxDailyPomodoros`

**定义位置**:
- `src/views/TodoView.vue:6594`
- `src/views/TodoView.vue:6594`

### `getMaxDailyInWeek`

**定义位置**:
- `src/views/TodoView.vue:6645`
- `src/views/TodoView.vue:6645`

### `getTodayFocusMinutes`

**定义位置**:
- `src/views/TodoView.vue:6683`
- `src/views/TodoView.vue:6683`

### `getWeekCompletedPomodoros`

**定义位置**:
- `src/views/TodoView.vue:6689`
- `src/views/TodoView.vue:6689`

### `setCategoryFilter`

**定义位置**:
- `src/views/TodoView.vue:6776`
- `src/views/TodoView.vue:6776`

### `clearSearch`

**定义位置**:
- `src/views/TodoView.vue:6793`
- `src/views/TodoView.vue:6793`

### `resetFilters`

**定义位置**:
- `src/views/TodoView.vue:6799`
- `src/views/TodoView.vue:6799`

### `clearDateFilter`

**定义位置**:
- `src/views/TodoView.vue:6810`
- `src/views/TodoView.vue:6810`

### `showCustomDateTimePicker`

**定义位置**:
- `src/views/TodoView.vue:6954`
- `src/views/TodoView.vue:6954`

### `startPomodoro`

**定义位置**:
- `src/views/TodoView.vue:7344`
- `src/views/TodoView.vue:7344`

### `pausePomodoro`

**定义位置**:
- `src/views/TodoView.vue:7376`
- `src/views/TodoView.vue:7376`

### `skipBreak`

**定义位置**:
- `src/views/TodoView.vue:7390`
- `src/views/TodoView.vue:7390`

### `getColor`

**定义位置**:
- `src/views/TodoView.vue:8594`
- `src/views/TodoView.vue:8594`

### `generateInsights`

**定义位置**:
- `src/views/TodoView.vue:8778`
- `src/views/TodoView.vue:8778`

### `generateSmartSummary`

**定义位置**:
- `src/views/TodoView.vue:8846`
- `src/views/TodoView.vue:8846`

### `formatLogTimeFull`

**定义位置**:
- `src/views/TodoView.vue:9343`
- `src/views/TodoView.vue:9343`

### `formatDeadlineMini`

**定义位置**:
- `src/views/TodoView.vue:9365`
- `src/views/TodoView.vue:9365`

### `sortedLogs`

**定义位置**:
- `src/views/TodoView.vue:9413`
- `src/views/TodoView.vue:9413`

### `openAddLogModal`

**定义位置**:
- `src/views/TodoView.vue:9419`
- `src/views/TodoView.vue:9419`

### `startTutorial`

**定义位置**:
- `src/views/TodoView.vue:9479`
- `src/views/TodoView.vue:9479`

### `triggerRestoreFile`

**定义位置**:
- `src/views/TodoView.vue:9720`
- `src/views/TodoView.vue:9720`

### `formatBackupDate`

**定义位置**:
- `src/views/TodoView.vue:9778`
- `src/views/TodoView.vue:9778`

### `getParentTaskName`

**定义位置**:
- `src/views/TodoView.vue:10035`
- `src/views/TodoView.vue:10035`

### `triggerImport`

**定义位置**:
- `src/views/TodoView.vue:10077`
- `src/views/TodoView.vue:10077`

### `showImportWarning`

**定义位置**:
- `src/views/TodoView.vue:10082`
- `src/views/TodoView.vue:10082`

### `validateTaskData`

**定义位置**:
- `src/views/TodoView.vue:10177`
- `src/views/TodoView.vue:10177`

### `getDeadlineDate`

**定义位置**:
- `src/views/TodoView.vue:10529`
- `src/views/TodoView.vue:10529`

### `getPlannedDeadlineDate`

**定义位置**:
- `src/views/TodoView.vue:10534`
- `src/views/TodoView.vue:10534`

### `getCompactStatus`

**定义位置**:
- `src/views/TodoView.vue:10539`
- `src/views/TodoView.vue:10539`

### `toggleLanguage`

**定义位置**:
- `src/views/TodoView.vue:10688`
- `src/views/TodoView.vue:10688`

### `generateEnergyInsight`

**定义位置**:
- `src/views/TodoView.vue:10702`
- `src/views/TodoView.vue:10702`

### `goToFirstPage`

**定义位置**:
- `src/views/TodoView.vue:10794`
- `src/views/TodoView.vue:10794`

### `goToLastPage`

**定义位置**:
- `src/views/TodoView.vue:10799`
- `src/views/TodoView.vue:10799`

### `changePageSize`

**定义位置**:
- `src/views/TodoView.vue:10804`
- `src/views/TodoView.vue:10804`

### `toggleMode`

**定义位置**:
- `src/views/LoginView.vue:571`
- `src/views/LoginView.vue:571`

## ⚠️  可疑函数（1引用）

**说明**: 仅被引用1次，可能是定义+导出

- `getWeight` - src/stores/offlineTaskStore.js
- `checkOverdueTasks` - src/stores/offlineTaskStore.js
- `checkTaskReminders` - src/stores/offlineTaskStore.js
- `clearUser` - src/stores/offlineTaskStore.js
- `addTaskLog` - src/stores/offlineTaskStore.js
- `getUnresolvedBlocks` - src/stores/offlineTaskStore.js
- `checkLogin` - src/stores/offlineUserStore.js
- `excelRowToTask` - src/utils/excelFormat.js
- `generateTemplateData` - src/utils/excelFormat.js
- `extractTasksFromChat` - src/services/aiChatService.js

... 还有 40 个

## 🛡️ 安全提示

### 不要删除的情况

1. **动态调用**: `this[funcName]()`, `obj[key]()`
2. **字符串引用**: `'functionName'` 作为参数传递
3. **模板引用**: Vue模板中的 `@click="funcName"`
4. **导出函数**: `export { funcName }`
5. **事件处理器**: `addEventListener('click', funcName)`
6. **生命周期钩子**: Vue/React生命周期方法

### 删除步骤

1. 人工确认函数确实未使用
2. 使用Git创建备份分支
3. 删除函数代码
4. 运行测试: `npm test`
5. 手动测试关键功能
6. 提交前Code Review
