# 死代码检测报告

**生成时间**: 2026-03-13 07:12:30  
**项目路径**: /Users/zhaosj/Desktop/TO-DO

---

## 📊 统计摘要

| 指标 | 数量 |
|------|------|
| 总函数数 | 748 |
| 未使用函数 | 384 |
| 低使用率函数 (≤2次) | 96 |
| **建议删除** | **384** |

---

## 🎯 建议删除的函数

以下函数引用次数为0，且不在白名单中，建议删除：

| 函数名 | 文件 | 行号 | 类型 |
|--------|------|------|------|
| `showNotify` | src/App.vue | 53 | const_function |
| `saveAIConfig` | src/components/AIAssistButton.vue | 40 | const_function |
| `callAI` | src/components/AIAssistButton.vue | 90 | const_function |
| `loadModelsFromStorage` | src/components/AIChat.vue | 185 | const_function |
| `toggleGroup` | src/components/AIChat.vue | 226 | const_function |
| `highlightText` | src/components/AIChat.vue | 244 | const_function |
| `copyMessage` | src/components/AIChat.vue | 251 | const_function |
| `regenerateMessage` | src/components/AIChat.vue | 260 | const_function |
| `formatTimestamp` | src/components/AIChat.vue | 319 | const_function |
| `loadAllChats` | src/components/AIChat.vue | 340 | const_function |
| `switchChat` | src/components/AIChat.vue | 417 | const_function |
| `deleteChat` | src/components/AIChat.vue | 425 | const_function |
| `clearCurrentChat` | src/components/AIChat.vue | 441 | const_function |
| `formatChatTime` | src/components/AIChat.vue | 450 | const_function |
| `groupedChats` | src/components/AIChat.vue | 463 | computed |
| `filteredGroupedChats` | src/components/AIChat.vue | 490 | computed |
| `loadChatHistory` | src/components/AIChat.vue | 528 | const_function |
| `clearChatHistory` | src/components/AIChat.vue | 550 | const_function |
| `sendMessage` | src/components/AIChat.vue | 994 | const_function |
| `detectIntent` | src/components/AIChat.vue | 1044 | const_function |
| `callOllama` | src/components/AIChat.vue | 1652 | const_function |
| `callOpenAI` | src/components/AIChat.vue | 1680 | const_function |
| `fetchOllamaModels` | src/components/AIConfigModal.vue | 105 | const_function |
| `fetchAPIModels` | src/components/AIConfigModal.vue | 126 | const_function |
| `save` | src/components/AIConfigModal.vue | 206 | const_function |
| `getCurrentUsername` | src/components/AIModelConfig.vue | 289 | const_function |
| `needApiKey` | src/components/AIModelConfig.vue | 416 | computed |
| `selectPresetProvider` | src/components/AIModelConfig.vue | 449 | const_function |
| `loadProviderConfig` | src/components/AIModelConfig.vue | 468 | const_function |
| `editProviderConfig` | src/components/AIModelConfig.vue | 491 | const_function |
| `deleteProviderConfig` | src/components/AIModelConfig.vue | 513 | const_function |
| `getProviderLabel` | src/components/AIModelConfig.vue | 534 | const_function |
| `loadingText` | src/components/AIModelConfig.vue | 556 | computed |
| `loadingSubText` | src/components/AIModelConfig.vue | 563 | computed |
| `getUrlPlaceholder` | src/components/AIModelConfig.vue | 603 | const_function |
| `getStatusIcon` | src/components/AIModelConfig.vue | 710 | const_function |
| `testSingleModel` | src/components/AIModelConfig.vue | 732 | const_function |
| `testAllModels` | src/components/AIModelConfig.vue | 764 | const_function |
| `exportConfig` | src/components/AIModelConfig.vue | 882 | const_function |
| `importConfig` | src/components/AIModelConfig.vue | 899 | const_function |
| `addModel` | src/components/AIModelConfig.vue | 1004 | const_function |
| `clearForm` | src/components/AIModelConfig.vue | 1073 | const_function |
| `setDefault` | src/components/AIModelConfig.vue | 1088 | const_function |
| `editModel` | src/components/AIModelConfig.vue | 1092 | const_function |
| `deleteModel` | src/components/AIModelConfig.vue | 1112 | const_function |
| `processTable` | src/components/AIPreviewModal.vue | 110 | const_function |
| `renderedMarkdown` | src/components/AIPreviewModal.vue | 196 | computed |
| `reportTitle` | src/components/AIReportModal.vue | 290 | computed |
| `copyReport` | src/components/AIReportModal.vue | 444 | const_function |
| `exportPDF` | src/components/AIReportModal.vue | 494 | const_function |
| `generateSuggestion` | src/components/AISuggestionCard.vue | 67 | const_function |
| `viewDetails` | src/components/AISuggestionCard.vue | 177 | const_function |
| `snooze` | src/components/AISuggestionCard.vue | 183 | const_function |
| `getTitle` | src/components/AITextResultSheet.vue | 67 | const_function |
| `getWarningText` | src/components/AddDependencyModal.vue | 153 | const_function |
| `getTaskById` | src/components/AddDependencyModal.vue | 181 | const_function |
| `contentLines` | src/components/AddLogModal.vue | 336 | computed |
| `unresolvedBlocks` | src/components/AddLogModal.vue | 341 | computed |
| `canSubmit` | src/components/AddLogModal.vue | 346 | computed |
| `addTag` | src/components/AddLogModal.vue | 362 | const_function |
| `removeTag` | src/components/AddLogModal.vue | 371 | const_function |
| `addLesson` | src/components/AddLogModal.vue | 376 | const_function |
| `removeLesson` | src/components/AddLogModal.vue | 385 | const_function |
| `formatWeekdays` | src/components/AddSubtaskModal.vue | 207 | const_function |
| `getTaskCollectionName` | src/components/BatchAddTasksModal.vue | 111 | const_function |
| `currentMonthText` | src/components/CalendarView.vue | 126 | computed |
| `selectedDateText` | src/components/CalendarView.vue | 131 | computed |
| `goToday` | src/components/CalendarView.vue | 248 | function |
| `quickCreateTask` | src/components/CalendarView.vue | 273 | function |
| `focusNewPassword` | src/components/ChangePasswordModal.vue | 80 | const_function |
| `focusConfirmPassword` | src/components/ChangePasswordModal.vue | 84 | const_function |
| `rootCollections` | src/components/CollectionManageModal.vue | 97 | computed |
| `allExpanded` | src/components/CollectionManageModal.vue | 114 | computed |
| `toggleExpandAll` | src/components/CollectionManageModal.vue | 134 | const_function |
| `enterBatchMode` | src/components/CollectionManageModal.vue | 144 | const_function |
| `toggleSelect` | src/components/CollectionManageModal.vue | 154 | const_function |
| `getLevelLabel` | src/components/CollectionTreeNode.vue | 146 | const_function |
| `canCreate` | src/components/CreateCollectionModal.vue | 120 | computed |
| `generateSummary` | src/components/DailySummaryModal.vue | 111 | const_function |
| `generateAIInsight` | src/components/DailySummaryModal.vue | 180 | const_function |
| `testSQLite` | src/components/DatabaseConfigModal.vue | 286 | const_function |
| `testMySQL` | src/components/DatabaseConfigModal.vue | 308 | const_function |
| `taskCount` | src/components/DeleteCollectionModal.vue | 89 | computed |
| `childCount` | src/components/DeleteCollectionModal.vue | 94 | computed |
| `blockingTasks` | src/components/DependencyManager.vue | 88 | computed |
| `resizeChart` | src/components/EChart.vue | 30 | const_function |
| `inProgressTasks` | src/components/GanttChartView.vue | 59 | computed |
| `hasMoreTasks` | src/components/GanttChartView.vue | 158 | computed |
| `remainingTasks` | src/components/GanttChartView.vue | 163 | computed |
| `showMoreTasks` | src/components/GanttChartView.vue | 168 | const_function |
| `getTagSize` | src/components/LogStats.vue | 232 | const_function |
| `exportAsText` | src/components/LogStats.vue | 259 | const_function |
| `exportAsMarkdown` | src/components/LogStats.vue | 315 | const_function |
| `exportAsJson` | src/components/LogStats.vue | 371 | const_function |
| `getLogIcon` | src/components/LogTimeline.vue | 99 | const_function |
| `getLogTypeLabel` | src/components/LogTimeline.vue | 112 | const_function |
| `getMoodText` | src/components/LogTimeline.vue | 147 | const_function |
| `processLocalImages` | src/components/MarkdownRenderer.vue | 68 | const_function |
| `availableTargets` | src/components/MoveCollectionModal.vue | 77 | computed |
| `restoreData` | src/components/MySQLConfigModal.vue | 348 | const_function |
| `toggleTakeover` | src/components/MySQLConfigModal.vue | 391 | const_function |
| `closeGuide` | src/components/PermissionGuide.vue | 63 | const_function |
| `openSettings` | src/components/PermissionGuide.vue | 67 | const_function |
| `dontShowAgain` | src/components/PermissionGuide.vue | 76 | const_function |
| `applyTemplate` | src/components/SmartTaskSplitter.vue | 177 | const_function |
| `generateSubtasks` | src/components/SmartTaskSplitter.vue | 185 | const_function |
| `regenerate` | src/components/SmartTaskSplitter.vue | 216 | const_function |
| `openCalendar` | src/components/SubtaskPreviewModal.vue | 180 | const_function |
| `toggleWeekday` | src/components/SubtaskPreviewModal.vue | 226 | const_function |
| `totalEstimatedTime` | src/components/SubtaskPreviewModal.vue | 257 | computed |
| `tagTreeArray` | src/components/TagBrowser.vue | 80 | computed |
| `totalTags` | src/components/TagBrowser.vue | 85 | computed |
| `childrenArray` | src/components/TagTreeNode.vue | 72 | computed |
| `getBacklinkContext` | src/components/TaskDetailModal.vue | 802 | const_function |
| `hasRelations` | src/components/TaskDetailModal.vue | 831 | computed |
| `filteredLogs` | src/components/TaskDetailModal.vue | 942 | computed |
| `filteredSortedLogs` | src/components/TaskDetailModal.vue | 965 | computed |
| `toggleDescriptionEdit` | src/components/TaskDetailModal.vue | 990 | const_function |
| `formatDateShort` | src/components/TaskDetailModal.vue | 1263 | const_function |
| `getProgressWidth` | src/components/TaskDetailModal.vue | 1270 | const_function |
| `getLatestProgress` | src/components/TaskDetailModal.vue | 1276 | const_function |
| `formatDeadlineShort` | src/components/TaskDetailModal.vue | 1282 | const_function |
| `saveLogContent` | src/components/TaskDetailModal.vue | 1328 | const_function |
| `saveAISummary` | src/components/TaskDetailModal.vue | 1364 | const_function |
| `toggleTimelineView` | src/components/TaskDetailModal.vue | 1372 | const_function |
| `deleteLog` | src/components/TaskDetailModal.vue | 1386 | const_function |
| `confirmDelete` | src/components/TaskDetailModal.vue | 1491 | const_function |
| `isLimited` | src/components/TaskGraphView.vue | 257 | computed |
| `toggleCompleted` | src/components/TaskGraphView.vue | 563 | function |
| `showIsolatedTasks` | src/components/TaskGraphView.vue | 597 | function |
| `exportAsImage` | src/components/TaskGraphView.vue | 815 | function |
| `resetView` | src/components/TaskGraphView.vue | 860 | function |
| `selectTemplate` | src/components/TemplateSelector.vue | 88 | const_function |
| `selectCustom` | src/components/TemplateSelector.vue | 92 | const_function |
| `formatDeleteTime` | src/components/TrashModal.vue | 123 | const_function |
| `progressPercent` | src/components/TutorialMode.vue | 282 | computed |
| `nextStep` | src/components/TutorialMode.vue | 379 | const_function |
| `prevStep` | src/components/TutorialMode.vue | 386 | const_function |
| `skipTutorial` | src/components/TutorialMode.vue | 393 | const_function |
| `finishTutorial` | src/components/TutorialMode.vue | 398 | const_function |
| `isHistoryMode` | src/components/UnifiedReportModal.vue | 226 | computed |
| `selectType` | src/components/UnifiedReportModal.vue | 291 | const_function |
| `generateUnifiedReport` | src/components/UnifiedReportModal.vue | 410 | const_function |
| `generateQualityData` | src/components/UnifiedReportModal.vue | 521 | const_function |
| `generateEfficiencyData` | src/components/UnifiedReportModal.vue | 571 | const_function |
| `generateTrendData` | src/components/UnifiedReportModal.vue | 628 | const_function |
| `generateHeatmapData` | src/components/UnifiedReportModal.vue | 781 | const_function |
| `generateAIReport` | src/components/UnifiedReportModal.vue | 805 | const_function |
| `autoSaveWithAIReport` | src/components/UnifiedReportModal.vue | 851 | const_function |
| `copyAIReport` | src/components/UnifiedReportModal.vue | 943 | const_function |
| `exportAIReport` | src/components/UnifiedReportModal.vue | 953 | const_function |
| `saveToHistory` | src/components/UnifiedReportModal.vue | 964 | const_function |
| `saveAsNew` | src/components/UnifiedReportModal.vue | 980 | const_function |
| `formatHistoryDate` | src/components/UnifiedReportModal.vue | 996 | const_function |
| `copyText` | src/components/UnifiedReportModal.vue | 1008 | const_function |
| `getReportTitle` | src/components/UnifiedReportModal.vue | 1083 | const_function |
| `showHistory` | src/components/UnifiedReportModal.vue | 1097 | const_function |
| `cleanup` | src/components/VisualReportView.vue | 383 | const_function |
| `priorityText` | src/components/WaitForSelector.vue | 123 | const_function |
| `statusText` | src/components/WaitForSelector.vue | 128 | const_function |
| `tagSuggestions` | src/composables/useAutocomplete.js | 14 | computed |
| `linkSuggestions` | src/composables/useAutocomplete.js | 50 | computed |
| `closeAutocomplete` | src/composables/useAutocomplete.js | 206 | function |
| `closeMenu` | src/composables/useTextSelection.js | 155 | const_function |
| `replaceSelectedText` | src/composables/useTextSelection.js | 163 | const_function |
| `getTemplateSections` | src/services/aiReportGenerator.js | 316 | method |
| `getTaskPomodoros` | src/services/aiWorkReportGenerator.js | 363 | method |
| `getEstimatedPomodoros` | src/services/aiWorkReportGenerator.js | 370 | method |
| `calculateOverdueDays` | src/services/aiWorkReportGenerator.js | 380 | method |
| `clearUser` | src/stores/offlineTaskStore.js | 1269 | method |
| `getAllLogRelations` | src/stores/offlineTaskStore.js | 1445 | method |
| `getTasksWithLogRelations` | src/stores/offlineTaskStore.js | 1455 | method |
| `getLogRelationsStats` | src/stores/offlineTaskStore.js | 1462 | method |
| `verifyCollectionPassword` | src/stores/offlineTaskStore.js | 1581 | method |
| `isCollectionLocked` | src/stores/offlineTaskStore.js | 1752 | method |
| `enterCollection` | src/stores/offlineTaskStore.js | 1771 | method |
| `goBackCollection` | src/stores/offlineTaskStore.js | 1776 | method |
| `goToRootCollection` | src/stores/offlineTaskStore.js | 1784 | method |
| `getCollectionStats` | src/stores/offlineTaskStore.js | 1789 | method |
| `loadUser` | src/stores/userStore.js | 39 | method |
| `sendMockSMS` | src/views/LoginView.vue | 252 | const_function |
| `sendRegisterSMS` | src/views/LoginView.vue | 289 | const_function |
| `showForgotPassword` | src/views/LoginView.vue | 506 | const_function |
| `verifySecurityAnswer` | src/views/LoginView.vue | 529 | const_function |
| `resetPassword` | src/views/LoginView.vue | 549 | const_function |
| `backToLogin` | src/views/LoginView.vue | 565 | const_function |
| `checkAISuggestion` | src/views/TodoView.vue | 4711 | const_function |
| `openTaskSplitter` | src/views/TodoView.vue | 4749 | const_function |
| `openTaskSplitterForNew` | src/views/TodoView.vue | 4755 | const_function |
| `showReportHistory` | src/views/TodoView.vue | 5277 | const_function |
| `batchDeleteReports` | src/views/TodoView.vue | 5387 | const_function |
| `toggleAllVersions` | src/views/TodoView.vue | 5828 | const_function |
| `checkVersionUpdate` | src/views/TodoView.vue | 5834 | const_function |
| `showVersionHistory` | src/views/TodoView.vue | 5878 | const_function |
| `markAllVersionsRead` | src/views/TodoView.vue | 5884 | const_function |
| `currentDateTime` | src/views/TodoView.vue | 5910 | computed |
| `displayInputValue` | src/views/TodoView.vue | 5925 | computed |
| `descEditTime` | src/views/TodoView.vue | 5932 | computed |
| `getWordCountHint` | src/views/TodoView.vue | 5949 | const_function |
| `getPlaceholder` | src/views/TodoView.vue | 5958 | const_function |
| `openFullscreenDesc` | src/views/TodoView.vue | 5966 | const_function |
| `closeFullscreenDesc` | src/views/TodoView.vue | 5984 | const_function |
| `toggleMarkdownPreview` | src/views/TodoView.vue | 6008 | const_function |
| `detectSubtasksFromDescription` | src/views/TodoView.vue | 6013 | const_function |
| `ignoreDetectedSubtasks` | src/views/TodoView.vue | 6042 | const_function |
| `previewTask` | src/views/TodoView.vue | 6048 | const_function |
| `saveTaskFromPreview` | src/views/TodoView.vue | 6095 | const_function |
| `storeSubtasksForPreview` | src/views/TodoView.vue | 6259 | const_function |
| `createSubtasksFromPreview` | src/views/TodoView.vue | 6276 | const_function |
| `pasteFromClipboard` | src/views/TodoView.vue | 6365 | const_function |
| `showPasteHistory` | src/views/TodoView.vue | 6406 | const_function |
| `selectClipboardItem` | src/views/TodoView.vue | 6431 | const_function |
| `clearClipboardHistory` | src/views/TodoView.vue | 6438 | const_function |
| `clearDescription` | src/views/TodoView.vue | 6448 | const_function |
| `pickImageForTask` | src/views/TodoView.vue | 6461 | const_function |
| `pickFileForTask` | src/views/TodoView.vue | 6536 | const_function |
| `getFileType` | src/views/TodoView.vue | 6633 | const_function |
| `toggleAIMenu` | src/views/TodoView.vue | 6844 | const_function |
| `generateTitle` | src/views/TodoView.vue | 6974 | const_function |
| `polishDescription` | src/views/TodoView.vue | 7047 | const_function |
| `extractKeyPoints` | src/views/TodoView.vue | 7117 | const_function |
| `rewriteStyle` | src/views/TodoView.vue | 7187 | const_function |
| `generateWeeklyReport` | src/views/TodoView.vue | 7268 | const_function |
| `triggerAIAssist` | src/views/TodoView.vue | 7397 | const_function |
| `applySuggestion` | src/views/TodoView.vue | 7504 | const_function |
| `dismissSuggestion` | src/views/TodoView.vue | 7521 | const_function |
| `copyAIResult` | src/views/TodoView.vue | 7546 | const_function |
| `loadNotificationSettings` | src/views/TodoView.vue | 7569 | const_function |
| `saveNotificationSettings` | src/views/TodoView.vue | 7581 | const_function |
| `closeUnifiedReport` | src/views/TodoView.vue | 7621 | const_function |
| `viewTemplateDetail` | src/views/TodoView.vue | 7708 | const_function |
| `saveTemplateEdit` | src/views/TodoView.vue | 7720 | const_function |
| `generateCustomReport` | src/views/TodoView.vue | 7730 | const_function |
| `monthlyTrendChartOption` | src/views/TodoView.vue | 7832 | computed |
| `pieChartOption` | src/views/TodoView.vue | 7925 | computed |
| `radarChartOption` | src/views/TodoView.vue | 7978 | computed |
| `treeIcon` | src/views/TodoView.vue | 8108 | computed |
| `treeStyle` | src/views/TodoView.vue | 8135 | computed |
| `treeProgress` | src/views/TodoView.vue | 8166 | computed |
| `getNextLevelScore` | src/views/TodoView.vue | 8178 | const_function |
| `quickCollections` | src/views/TodoView.vue | 8230 | computed |
| `moreCollections` | src/views/TodoView.vue | 8235 | computed |
| `uncategorizedTaskCount` | src/views/TodoView.vue | 8239 | computed |
| `currentBreadcrumb` | src/views/TodoView.vue | 8244 | computed |
| `completionPercentage` | src/views/TodoView.vue | 8306 | computed |
| `pendingCount` | src/views/TodoView.vue | 8313 | computed |
| `completedCount` | src/views/TodoView.vue | 8314 | computed |
| `overdueCount` | src/views/TodoView.vue | 8315 | computed |
| `urgentPriorityCount` | src/views/TodoView.vue | 8327 | computed |
| `priorityOptions` | src/views/TodoView.vue | 8330 | computed |
| `getCategoryCount` | src/views/TodoView.vue | 8350 | const_function |
| `filterResultCount` | src/views/TodoView.vue | 8369 | computed |
| `timeDimensionLabel` | src/views/TodoView.vue | 8372 | computed |
| `completionRate` | src/views/TodoView.vue | 8380 | computed |
| `usageDays` | src/views/TodoView.vue | 8387 | computed |
| `pendingPomodoros` | src/views/TodoView.vue | 8413 | computed |
| `lostPomodoros` | src/views/TodoView.vue | 8429 | computed |
| `totalPomodoros` | src/views/TodoView.vue | 8445 | computed |
| `getPomodorosByCategory` | src/views/TodoView.vue | 8451 | const_function |
| `getPomodorosByPriority` | src/views/TodoView.vue | 8468 | const_function |
| `getPomodorosByTime` | src/views/TodoView.vue | 8485 | const_function |
| `getConsecutiveDays` | src/views/TodoView.vue | 8520 | const_function |
| `getMaxDailyPomodoros` | src/views/TodoView.vue | 8555 | const_function |
| `getCompletionRate` | src/views/TodoView.vue | 8572 | const_function |
| `getLast7DaysTrend` | src/views/TodoView.vue | 8580 | const_function |
| `getMaxDailyInWeek` | src/views/TodoView.vue | 8606 | const_function |
| `getCategoryPercent` | src/views/TodoView.vue | 8613 | const_function |
| `getLevelBadge` | src/views/TodoView.vue | 8621 | const_function |
| `getTodayCompletedPomodoros` | src/views/TodoView.vue | 8631 | const_function |
| `getTodayFocusMinutes` | src/views/TodoView.vue | 8644 | const_function |
| `getWeekCompletedPomodoros` | src/views/TodoView.vue | 8650 | const_function |
| `getTotalFocusMinutes` | src/views/TodoView.vue | 8667 | const_function |
| `formatPomodoroTime` | src/views/TodoView.vue | 8673 | const_function |
| `formatPomodoroDate` | src/views/TodoView.vue | 8681 | const_function |
| `getPomodoroMinutes` | src/views/TodoView.vue | 8697 | const_function |
| `totalPages` | src/views/TodoView.vue | 8704 | computed |
| `paginatedTasks` | src/views/TodoView.vue | 8710 | computed |
| `setCategoryFilter` | src/views/TodoView.vue | 8737 | const_function |
| `setPriorityFilter` | src/views/TodoView.vue | 8743 | const_function |
| `resetFilters` | src/views/TodoView.vue | 8760 | const_function |
| `clearDateFilter` | src/views/TodoView.vue | 8771 | const_function |
| `showCustomDateTimePicker` | src/views/TodoView.vue | 8918 | const_function |
| `filterTasks` | src/views/TodoView.vue | 9046 | const_function |
| `addTaskAndClose` | src/views/TodoView.vue | 9051 | const_function |
| `scanTextFromCamera` | src/views/TodoView.vue | 9059 | const_function |
| `startPomodoro` | src/views/TodoView.vue | 9396 | const_function |
| `getTotalSeconds` | src/views/TodoView.vue | 9410 | const_function |
| `startPomodoroTimer` | src/views/TodoView.vue | 9416 | const_function |
| `pausePomodoro` | src/views/TodoView.vue | 9428 | const_function |
| `stopPomodoro` | src/views/TodoView.vue | 9432 | const_function |
| `skipBreak` | src/views/TodoView.vue | 9442 | const_function |
| `continueNextPomodoro` | src/views/TodoView.vue | 9448 | const_function |
| `toggleTaskStatus` | src/views/TodoView.vue | 9509 | const_function |
| `undoDelete` | src/views/TodoView.vue | 9590 | const_function |
| `permanentDelete` | src/views/TodoView.vue | 9611 | const_function |
| `clearAllTrash` | src/views/TodoView.vue | 9619 | const_function |
| `openEditModal` | src/views/TodoView.vue | 9670 | const_function |
| `openTaskFromCalendar` | src/views/TodoView.vue | 9725 | const_function |
| `createTaskFromCalendar` | src/views/TodoView.vue | 9730 | const_function |
| `confirmCustomDate` | src/views/TodoView.vue | 9797 | const_function |
| `confirmWeeklySelect` | src/views/TodoView.vue | 9806 | const_function |
| `saveTaskEdit` | src/views/TodoView.vue | 9815 | const_function |
| `generateReportContent` | src/views/TodoView.vue | 9882 | const_function |
| `getMilestoneTransition` | src/views/TodoView.vue | 10154 | const_function |
| `priorityWeight` | src/views/TodoView.vue | 10506 | const_function |
| `getColor` | src/views/TodoView.vue | 10699 | const_function |
| `generateExecutiveSummary` | src/views/TodoView.vue | 10815 | const_function |
| `generateInsights` | src/views/TodoView.vue | 10883 | const_function |
| `generateSmartSummary` | src/views/TodoView.vue | 10951 | const_function |
| `copyReportText` | src/views/TodoView.vue | 11007 | const_function |
| `copyWeeklyReport` | src/views/TodoView.vue | 11017 | const_function |
| `exportMarkdown` | src/views/TodoView.vue | 11105 | const_function |
| `exportPoster` | src/views/TodoView.vue | 11196 | const_function |
| `loadUserInfo` | src/views/TodoView.vue | 11375 | const_function |
| `formatLogTimeMini` | src/views/TodoView.vue | 11425 | const_function |
| `formatLogTimeFull` | src/views/TodoView.vue | 11451 | const_function |
| `formatDeadlineMini` | src/views/TodoView.vue | 11473 | const_function |
| `openAddLogModal` | src/views/TodoView.vue | 11527 | const_function |
| `deleteLogFromEdit` | src/views/TodoView.vue | 11533 | const_function |
| `startTutorial` | src/views/TodoView.vue | 11588 | const_function |
| `startEditUsername` | src/views/TodoView.vue | 11618 | const_function |
| `saveUsername` | src/views/TodoView.vue | 11626 | const_function |
| `updatePassword` | src/views/TodoView.vue | 11679 | const_function |
| `sendBindSMS` | src/views/TodoView.vue | 11704 | const_function |
| `confirmBindPhone` | src/views/TodoView.vue | 11743 | const_function |
| `unbindPhone` | src/views/TodoView.vue | 11776 | const_function |
| `triggerRestoreFile` | src/views/TodoView.vue | 11829 | const_function |
| `loadBackupList` | src/views/TodoView.vue | 11963 | const_function |
| `formatBackupDate` | src/views/TodoView.vue | 11974 | const_function |
| `exportToExcel` | src/views/TodoView.vue | 12035 | const_function |
| `getTaskTypeText` | src/views/TodoView.vue | 12115 | const_function |
| `getParentTaskName` | src/views/TodoView.vue | 12217 | const_function |
| `getHabitTitle` | src/views/TodoView.vue | 12245 | const_function |
| `triggerImport` | src/views/TodoView.vue | 12259 | const_function |
| `showImportWarning` | src/views/TodoView.vue | 12264 | const_function |
| `showClearWarning` | src/views/TodoView.vue | 12282 | const_function |
| `downloadTemplate` | src/views/TodoView.vue | 12326 | const_function |
| `validateTaskData` | src/views/TodoView.vue | 12359 | const_function |
| `isValidDate` | src/views/TodoView.vue | 12424 | const_function |
| `importFromExcel` | src/views/TodoView.vue | 12432 | const_function |
| `confirmImport` | src/views/TodoView.vue | 12535 | const_function |
| `cancelImport` | src/views/TodoView.vue | 12570 | const_function |
| `parseCategoryText` | src/views/TodoView.vue | 12576 | const_function |
| `parsePriorityText` | src/views/TodoView.vue | 12582 | const_function |
| `parseTypeText` | src/views/TodoView.vue | 12588 | const_function |
| `parseStatusText` | src/views/TodoView.vue | 12597 | const_function |
| `parseWeekdays` | src/views/TodoView.vue | 12604 | const_function |
| `parseDateTime` | src/views/TodoView.vue | 12615 | const_function |
| `getDeadlineDate` | src/views/TodoView.vue | 12711 | const_function |
| `getPlannedDeadlineDate` | src/views/TodoView.vue | 12716 | const_function |
| `getCompactStatus` | src/views/TodoView.vue | 12721 | const_function |
| `getPlannedDeadlineText` | src/views/TodoView.vue | 12731 | const_function |
| `getDeadlineText` | src/views/TodoView.vue | 12746 | const_function |
| `toggleLanguage` | src/views/TodoView.vue | 12870 | const_function |
| `togglePriorityMode` | src/views/TodoView.vue | 12877 | const_function |
| `generateEnergyInsight` | src/views/TodoView.vue | 12884 | const_function |
| `toggleCollectionList` | src/views/TodoView.vue | 12978 | const_function |
| `startEditCollectionName` | src/views/TodoView.vue | 13032 | const_function |
| `saveCollectionName` | src/views/TodoView.vue | 13050 | const_function |
| `cancelEditCollectionName` | src/views/TodoView.vue | 13062 | const_function |
| `openBatchAddForCollection` | src/views/TodoView.vue | 13076 | const_function |
| `openBatchMoveIn` | src/views/TodoView.vue | 13082 | const_function |
| `openBatchMoveOut` | src/views/TodoView.vue | 13089 | const_function |
| `openChangePassword` | src/views/TodoView.vue | 13134 | const_function |
| `showCollectionMenu` | src/views/TodoView.vue | 13144 | const_function |
| `openDeleteCollection` | src/views/TodoView.vue | 13150 | const_function |
| `openSetPrivate` | src/views/TodoView.vue | 13159 | const_function |
| `collectChildren` | src/views/TodoView.vue | 13211 | const_function |
| `openMoveToCollection` | src/views/TodoView.vue | 13264 | const_function |
| `goToFirstPage` | src/views/TodoView.vue | 13278 | const_function |
| `goToLastPage` | src/views/TodoView.vue | 13283 | const_function |
| `changePageSize` | src/views/TodoView.vue | 13288 | const_function |
| `jumpToPageNumber` | src/views/TodoView.vue | 13294 | const_function |
| `checkBackupReminder` | src/views/TodoView.vue | 13305 | const_function |
| `recordBackupTime` | src/views/TodoView.vue | 13322 | const_function |
| `disableBackupReminder` | src/views/TodoView.vue | 13327 | const_function |
| `cleanupExpiredNotifications` | src/views/TodoView.vue | 13394 | const_function |
| `checkNotificationPermission` | src/views/TodoView.vue | 13429 | const_function |
| `generateNotificationId` | src/views/TodoView.vue | 13461 | const_function |
| `checkAndNotifyDeadline` | src/views/TodoView.vue | 13470 | const_function |
| `testNotification` | src/views/TodoView.vue | 13644 | const_function |
| `openNotificationSettings` | src/views/TodoView.vue | 13745 | const_function |
| `autoGenerateReports` | src/views/TodoView.vue | 13789 | const_function |
| `cleanupOldReports` | src/views/TodoView.vue | 14153 | const_function |

---

## ⚠️ 低使用率函数

以下函数引用次数≤2次，建议review是否需要保留：

| 函数名 | 文件 | 行号 | 引用次数 | 引用位置 |
|--------|------|------|----------|----------|
| `isWeb` | src/App.vue | 34 | 1 | src/App.vue |
| `waitForTasks` | src/components/TaskDetailModal.vue | 788 | 1 | src/stores/offlineTaskStore.js |
| `blockedTasks` | src/components/TaskDetailModal.vue | 885 | 1 | src/components/TaskDetailModal.vue |
| `formatLogTime` | src/components/TaskDetailModal.vue | 1289 | 1 | src/components/TaskDetailModal.vue |
| `formatDuration` | src/components/TaskDetailModal.vue | 1304 | 1 | src/components/TaskDetailModal.vue |
| `moodStats` | src/components/LogStats.vue | 206 | 1 | src/components/LogStats.vue |
| `graphData` | src/components/TaskGraphView.vue | 290 | 1 | src/components/TaskGraphView.vue |
| `getRelatedTasks` | src/components/TaskGraphView.vue | 618 | 1 | src/components/TaskGraphView.vue |
| `getCategoryIndex` | src/components/TaskGraphView.vue | 676 | 1 | src/components/TaskGraphView.vue |
| `getCategoryColor` | src/components/TaskGraphView.vue | 684 | 1 | src/components/TaskGraphView.vue |
| `getCollectionDepth` | src/components/TaskGraphView.vue | 694 | 1 | src/components/TaskGraphView.vue |
| `blockedByTasks` | src/components/DependencyManager.vue | 82 | 1 | src/components/DependencyManager.vue |
| `tagTree` | src/components/TagBrowser.vue | 49 | 1 | src/components/TagBrowser.vue |
| `countTags` | src/components/TagBrowser.vue | 87 | 1 | src/components/TagBrowser.vue |
| `createNewChat` | src/components/AIChat.vue | 400 | 1 | src/components/AIChat.vue |
| `buildSmartContext` | src/components/AIChat.vue | 766 | 1 | src/components/AIChat.vue |
| `buildContext` | src/components/AIChat.vue | 867 | 1 | src/components/AIChat.vue |
| `callOllamaStream` | src/components/AIChat.vue | 1426 | 1 | src/components/AIChat.vue |
| `callOpenAIStream` | src/components/AIChat.vue | 1492 | 1 | src/components/AIChat.vue |
| `bindFileCardEvents` | src/components/MarkdownRenderer.vue | 351 | 1 | src/components/MarkdownRenderer.vue |
| `timeRange` | src/components/GanttChartView.vue | 64 | 1 | src/components/GanttChartView.vue |
| `close` | src/components/NotificationSheet.vue | 51 | 1 | src/components/NotificationSheet.vue |
| `updateTrendChart` | src/components/VisualReportView.vue | 166 | 1 | src/components/VisualReportView.vue |
| `updateCategoryChart` | src/components/VisualReportView.vue | 212 | 1 | src/components/VisualReportView.vue |
| `updatePriorityChart` | src/components/VisualReportView.vue | 263 | 1 | src/components/VisualReportView.vue |
| `updateHeatmapChart` | src/components/VisualReportView.vue | 312 | 1 | src/components/VisualReportView.vue |
| `dismiss` | src/components/AISuggestionCard.vue | 189 | 1 | src/components/AISuggestionCard.vue |
| `getAllCollectionIds` | src/components/CollectionManageModal.vue | 119 | 1 | src/components/CollectionManageModal.vue |
| `traverse` | src/components/CollectionManageModal.vue | 121 | 1 | src/components/CollectionManageModal.vue |
| `exitBatchMode` | src/components/CollectionManageModal.vue | 149 | 1 | src/components/CollectionManageModal.vue |
| `isSetMode` | src/components/ChangePasswordModal.vue | 67 | 1 | src/components/ChangePasswordModal.vue |
| `testModelConnection` | src/components/AIModelConfig.vue | 820 | 1 | src/components/AIModelConfig.vue |
| `addWithLevel` | src/components/MoveCollectionModal.vue | 80 | 1 | src/components/MoveCollectionModal.vue |
| `getLogTypeClass` | src/components/LogTimeline.vue | 86 | 1 | src/components/LogTimeline.vue |
| `calculateDateRange` | src/components/UnifiedReportModal.vue | 338 | 1 | src/components/UnifiedReportModal.vue |
| `updateCurrentDateTime` | src/views/TodoView.vue | 5913 | 1 | src/views/TodoView.vue |
| `generateAISuggestions` | src/views/TodoView.vue | 6656 | 1 | src/views/TodoView.vue |
| `generateAISuggestionsWithTemplate` | src/views/TodoView.vue | 6677 | 1 | src/views/TodoView.vue |
| `continueDescription` | src/views/TodoView.vue | 6789 | 1 | src/views/TodoView.vue |
| `generateDescription` | src/views/TodoView.vue | 7452 | 1 | src/services/aiTaskGenerator.js |
| `editTemplate` | src/views/TodoView.vue | 7714 | 1 | src/views/TodoView.vue |
| `currentUsername` | src/views/TodoView.vue | 8066 | 1 | src/views/TodoView.vue |
| `highPriorityCount` | src/views/TodoView.vue | 8318 | 1 | src/views/TodoView.vue |
| `mediumPriorityCount` | src/views/TodoView.vue | 8325 | 1 | src/views/TodoView.vue |
| `lowPriorityCount` | src/views/TodoView.vue | 8326 | 1 | src/views/TodoView.vue |
| `getTodayDateTime` | src/views/TodoView.vue | 8934 | 1 | src/views/TodoView.vue |
| `formatSelectedWeekdays` | src/views/TodoView.vue | 9312 | 1 | src/views/TodoView.vue |
| `togglePin` | src/views/TodoView.vue | 9381 | 1 | src/stores/offlineTaskStore.js |
| `clearAllTasks` | src/views/TodoView.vue | 9628 | 1 | src/stores/offlineTaskStore.js |
| `formatTimelineMini` | src/views/TodoView.vue | 11466 | 1 | src/views/TodoView.vue |

---

## 🛡️ 安全策略

### 白名单机制
以下类型的函数即使引用为0也不会被标记为删除：
- Vue生命周期钩子（onMounted、onUnmounted等）
- 事件处理器（handleXxx、onXxx等）
- Composables（useXxx）
- 导出函数（default、main、init等）
- 测试相关函数

### 动态调用检测
以下情况可能导致误判，需要人工review：
- 模板中的事件绑定（@click、v-on等）
- 动态属性访问（obj[funcName]）
- 全局对象挂载（window.xxx）
- eval或new Function动态调用

### 删除建议
1. ✅ **先注释，后删除**：注释掉函数，测试无误后再删除
2. ✅ **Git保护**：确保代码已提交，方便回滚
3. ✅ **分批删除**：每次删除5-10个函数，逐步验证
4. ✅ **运行测试**：删除后运行完整测试套件
5. ✅ **检查模板**：手动检查Vue模板中是否使用

---

## 📝 使用说明

### 查看详细报告
```bash
cat dead_code_report.json
```

### 搜索特定函数
```bash
grep -r "functionName" src/
```

### 删除函数前的检查清单
- [ ] 确认函数引用次数为0
- [ ] 检查Vue模板中是否使用（@click等）
- [ ] 检查是否有动态调用
- [ ] 先注释掉函数代码
- [ ] 运行项目，测试相关功能
- [ ] 运行测试套件
- [ ] 确认无误后删除

---

**⚠️ 重要提示**: 本报告由自动化工具生成，可能存在误判。删除前请务必人工review！
