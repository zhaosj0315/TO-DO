#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动删除脚本 - 注释掉已验证的死代码
使用方法: python3 auto_comment_dead_code.py
"""

import re
from pathlib import Path

def comment_function(file_path, func_name, line_num):
    """注释掉指定函数"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # 找到函数定义行
        if line_num > len(lines):
            print(f"  ⚠️  行号超出范围: {line_num}")
            return False
        
        # 找到函数的结束位置（简单的大括号匹配）
        start_line = line_num - 1
        brace_count = 0
        end_line = start_line
        
        for i in range(start_line, len(lines)):
            line = lines[i]
            brace_count += line.count('{') - line.count('}')
            
            if brace_count == 0 and i > start_line:
                end_line = i
                break
        
        # 注释掉整个函数
        for i in range(start_line, end_line + 1):
            if not lines[i].strip().startswith('//'):
                lines[i] = '// [DEAD_CODE] ' + lines[i]
        
        # 写回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        return True
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

def main():
    project_root = Path('/Users/zhaosj/Desktop/TO-DO')
    
    functions_to_comment = [
        ('src/components/AIAssistButton.vue', 'saveAIConfig', 40),
        ('src/components/AIAssistButton.vue', 'callAI', 90),
        ('src/components/AIChat.vue', 'loadModelsFromStorage', 185),
        ('src/components/AIChat.vue', 'formatTimestamp', 319),
        ('src/components/AIChat.vue', 'loadAllChats', 340),
        ('src/components/AIChat.vue', 'groupedChats', 463),
        ('src/components/AIChat.vue', 'loadChatHistory', 528),
        ('src/components/AIChat.vue', 'clearChatHistory', 550),
        ('src/components/AIChat.vue', 'detectIntent', 1044),
        ('src/components/AIChat.vue', 'callOllama', 1652),
        ('src/components/AIModelConfig.vue', 'getCurrentUsername', 289),
        ('src/components/AIModelConfig.vue', 'selectPresetProvider', 449),
        ('src/components/AIModelConfig.vue', 'loadProviderConfig', 468),
        ('src/components/AIModelConfig.vue', 'getUrlPlaceholder', 603),
        ('src/components/AIModelConfig.vue', 'setDefault', 1088),
        ('src/components/AIPreviewModal.vue', 'processTable', 110),
        ('src/components/AISuggestionCard.vue', 'generateSuggestion', 67),
        ('src/components/DailySummaryModal.vue', 'generateSummary', 111),
        ('src/components/DailySummaryModal.vue', 'generateAIInsight', 180),
        ('src/components/EChart.vue', 'resizeChart', 30),
        ('src/components/TaskDetailModal.vue', 'getBacklinkContext', 802),
        ('src/components/TaskDetailModal.vue', 'formatDateShort', 1263),
        ('src/components/TaskDetailModal.vue', 'formatDeadlineShort', 1282),
        ('src/components/UnifiedReportModal.vue', 'generateUnifiedReport', 410),
        ('src/components/UnifiedReportModal.vue', 'generateQualityData', 521),
        ('src/components/UnifiedReportModal.vue', 'generateEfficiencyData', 571),
        ('src/components/UnifiedReportModal.vue', 'generateTrendData', 628),
        ('src/components/UnifiedReportModal.vue', 'generateHeatmapData', 781),
        ('src/components/UnifiedReportModal.vue', 'autoSaveWithAIReport', 851),
        ('src/components/UnifiedReportModal.vue', 'getReportTitle', 1083),
        ('src/components/UnifiedReportModal.vue', 'showHistory', 1097),
        ('src/components/VisualReportView.vue', 'cleanup', 383),
        ('src/composables/useAutocomplete.js', 'tagSuggestions', 14),
        ('src/composables/useAutocomplete.js', 'linkSuggestions', 50),
        ('src/composables/useTextSelection.js', 'closeMenu', 155),
        ('src/services/aiReportGenerator.js', 'getTemplateSections', 316),
        ('src/services/aiWorkReportGenerator.js', 'getTaskPomodoros', 363),
        ('src/services/aiWorkReportGenerator.js', 'getEstimatedPomodoros', 370),
        ('src/services/aiWorkReportGenerator.js', 'calculateOverdueDays', 380),
        ('src/stores/offlineTaskStore.js', 'getAllLogRelations', 1445),
        ('src/stores/offlineTaskStore.js', 'getTasksWithLogRelations', 1455),
        ('src/stores/offlineTaskStore.js', 'getLogRelationsStats', 1462),
        ('src/stores/offlineTaskStore.js', 'isCollectionLocked', 1752),
        ('src/stores/offlineTaskStore.js', 'enterCollection', 1771),
        ('src/stores/offlineTaskStore.js', 'goBackCollection', 1776),
        ('src/stores/offlineTaskStore.js', 'goToRootCollection', 1784),
        ('src/stores/offlineTaskStore.js', 'getCollectionStats', 1789),
        ('src/stores/userStore.js', 'loadUser', 39),
        ('src/views/LoginView.vue', 'verifySecurityAnswer', 529),
        ('src/views/LoginView.vue', 'resetPassword', 549),
        ('src/views/TodoView.vue', 'checkAISuggestion', 4711),
        ('src/views/TodoView.vue', 'openTaskSplitter', 4749),
        ('src/views/TodoView.vue', 'openTaskSplitterForNew', 4755),
        ('src/views/TodoView.vue', 'checkVersionUpdate', 5834),
        ('src/views/TodoView.vue', 'descEditTime', 5932),
        ('src/views/TodoView.vue', 'getWordCountHint', 5949),
        ('src/views/TodoView.vue', 'getPlaceholder', 5958),
        ('src/views/TodoView.vue', 'detectSubtasksFromDescription', 6013),
        ('src/views/TodoView.vue', 'getFileType', 6633),
        ('src/views/TodoView.vue', 'polishDescription', 7047),
        ('src/views/TodoView.vue', 'extractKeyPoints', 7117),
        ('src/views/TodoView.vue', 'rewriteStyle', 7187),
        ('src/views/TodoView.vue', 'generateWeeklyReport', 7268),
        ('src/views/TodoView.vue', 'triggerAIAssist', 7397),
        ('src/views/TodoView.vue', 'loadNotificationSettings', 7569),
        ('src/views/TodoView.vue', 'getNextLevelScore', 8178),
        ('src/views/TodoView.vue', 'completionPercentage', 8306),
        ('src/views/TodoView.vue', 'urgentPriorityCount', 8327),
        ('src/views/TodoView.vue', 'getCategoryCount', 8350),
        ('src/views/TodoView.vue', 'timeDimensionLabel', 8372),
        ('src/views/TodoView.vue', 'pendingPomodoros', 8413),
        ('src/views/TodoView.vue', 'lostPomodoros', 8429),
        ('src/views/TodoView.vue', 'getPomodorosByCategory', 8451),
        ('src/views/TodoView.vue', 'getPomodorosByPriority', 8468),
        ('src/views/TodoView.vue', 'getPomodorosByTime', 8485),
        ('src/views/TodoView.vue', 'getConsecutiveDays', 8520),
        ('src/views/TodoView.vue', 'getMaxDailyPomodoros', 8555),
        ('src/views/TodoView.vue', 'getCompletionRate', 8572),
        ('src/views/TodoView.vue', 'getLast7DaysTrend', 8580),
        ('src/views/TodoView.vue', 'getMaxDailyInWeek', 8606),
        ('src/views/TodoView.vue', 'getCategoryPercent', 8613),
        ('src/views/TodoView.vue', 'getLevelBadge', 8621),
        ('src/views/TodoView.vue', 'getTodayCompletedPomodoros', 8631),
        ('src/views/TodoView.vue', 'getTodayFocusMinutes', 8644),
        ('src/views/TodoView.vue', 'getWeekCompletedPomodoros', 8650),
        ('src/views/TodoView.vue', 'getTotalFocusMinutes', 8667),
        ('src/views/TodoView.vue', 'formatPomodoroTime', 8673),
        ('src/views/TodoView.vue', 'formatPomodoroDate', 8681),
        ('src/views/TodoView.vue', 'getPomodoroMinutes', 8697),
        ('src/views/TodoView.vue', 'showCustomDateTimePicker', 8918),
        ('src/views/TodoView.vue', 'filterTasks', 9046),
        ('src/views/TodoView.vue', 'addTaskAndClose', 9051),
        ('src/views/TodoView.vue', 'getTotalSeconds', 9410),
        ('src/views/TodoView.vue', 'startPomodoroTimer', 9416),
        ('src/views/TodoView.vue', 'openEditModal', 9670),
        ('src/views/TodoView.vue', 'confirmCustomDate', 9797),
        ('src/views/TodoView.vue', 'getMilestoneTransition', 10154),
        ('src/views/TodoView.vue', 'getColor', 10699),
        ('src/views/TodoView.vue', 'generateInsights', 10883),
        ('src/views/TodoView.vue', 'generateSmartSummary', 10951),
        ('src/views/TodoView.vue', 'exportPoster', 11196),
        ('src/views/TodoView.vue', 'loadUserInfo', 11375),
        ('src/views/TodoView.vue', 'formatLogTimeMini', 11425),
        ('src/views/TodoView.vue', 'formatLogTimeFull', 11451),
        ('src/views/TodoView.vue', 'formatDeadlineMini', 11473),
        ('src/views/TodoView.vue', 'loadBackupList', 11963),
        ('src/views/TodoView.vue', 'getTaskTypeText', 12115),
        ('src/views/TodoView.vue', 'triggerImport', 12259),
        ('src/views/TodoView.vue', 'validateTaskData', 12359),
        ('src/views/TodoView.vue', 'isValidDate', 12424),
        ('src/views/TodoView.vue', 'parseCategoryText', 12576),
        ('src/views/TodoView.vue', 'parsePriorityText', 12582),
        ('src/views/TodoView.vue', 'parseTypeText', 12588),
        ('src/views/TodoView.vue', 'parseStatusText', 12597),
        ('src/views/TodoView.vue', 'parseWeekdays', 12604),
        ('src/views/TodoView.vue', 'parseDateTime', 12615),
        ('src/views/TodoView.vue', 'getDeadlineDate', 12711),
        ('src/views/TodoView.vue', 'getPlannedDeadlineDate', 12716),
        ('src/views/TodoView.vue', 'getCompactStatus', 12721),
        ('src/views/TodoView.vue', 'getPlannedDeadlineText', 12731),
        ('src/views/TodoView.vue', 'getDeadlineText', 12746),
        ('src/views/TodoView.vue', 'generateEnergyInsight', 12884),
        ('src/views/TodoView.vue', 'toggleCollectionList', 12978),
        ('src/views/TodoView.vue', 'saveCollectionName', 13050),
        ('src/views/TodoView.vue', 'cancelEditCollectionName', 13062),
        ('src/views/TodoView.vue', 'openBatchAddForCollection', 13076),
        ('src/views/TodoView.vue', 'showCollectionMenu', 13144),
        ('src/views/TodoView.vue', 'collectChildren', 13211),
        ('src/views/TodoView.vue', 'checkBackupReminder', 13305),
        ('src/views/TodoView.vue', 'recordBackupTime', 13322),
        ('src/views/TodoView.vue', 'cleanupExpiredNotifications', 13394),
        ('src/views/TodoView.vue', 'checkNotificationPermission', 13429),
        ('src/views/TodoView.vue', 'generateNotificationId', 13461),
        ('src/views/TodoView.vue', 'checkAndNotifyDeadline', 13470),
        ('src/views/TodoView.vue', 'testNotification', 13644),
        ('src/views/TodoView.vue', 'autoGenerateReports', 13789),
        ('src/views/TodoView.vue', 'cleanupOldReports', 14153),
    ]
    
    print(f"🔧 准备注释 {len(functions_to_comment)} 个函数...")
    print("⚠️  建议先备份代码或确保Git已提交！")
    
    input("按Enter继续，Ctrl+C取消...")
    
    success = 0
    failed = 0
    
    for file_path, func_name, line_num in functions_to_comment:
        full_path = project_root / file_path
        print(f"\n📝 注释: {func_name} ({file_path}:{line_num})")
        
        if comment_function(full_path, func_name, line_num):
            success += 1
            print(f"  ✅ 成功")
        else:
            failed += 1
    
    print(f"\n" + "="*80)
    print(f"📊 完成:")
    print(f"  ✅ 成功: {success}")
    print(f"  ❌ 失败: {failed}")
    print("="*80)
    print("\n⚠️  下一步:")
    print("  1. 运行项目测试所有功能")
    print("  2. 如果有问题，使用 git checkout 恢复")
    print("  3. 确认无误后，手动删除注释的代码")

if __name__ == '__main__':
    main()
