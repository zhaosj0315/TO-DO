<template>
  <div class="todo-layout" ref="todoLayoutRef">
    <!-- 核心内容区 -->
    <main class="main-content glass-card" ref="mainContent">
      <!-- 顶部标题栏 -->
      <header class="header">
        <!-- 第一行：左侧(笔记本+AI助手+刷新+回收站+教程) 右侧(我的主页+更多) -->
        <div class="header-row header-row-1">
          <!-- 左侧靠左 -->
          <div class="header-group">
            <div class="header-item">
              <button class="btn-icon-circle btn-ai" @click="showAIChat = true" :title="t('aiChat')">🤖</button>
              <span class="item-label">AI助手</span>
            </div>
            <div class="header-item">
              <button class="btn-icon-circle btn-manage" @click="showCollectionManage = true" title="管理文件夹">📓</button>
              <span class="item-label">笔记本</span>
            </div>
            <div class="header-item">
              <button class="btn-icon-circle btn-refresh-icon" @click="handleRefresh" :title="t('refresh')">
                <span :class="{ spinning: isRefreshing }">⟳</span>
              </button>
              <span class="item-label">刷新</span>
            </div>
            <div class="header-item">
              <button class="btn-icon-circle btn-trash" @click="showTrash = true" :title="t('trash')">
                🗑️
                <span v-if="taskStore.deletedTasks.length > 0" class="badge-count">{{ taskStore.deletedTasks.length }}</span>
              </button>
              <span class="item-label">回收站</span>
            </div>
          </div>

          <!-- 右侧靠右 -->
          <div class="header-group">
            <div class="header-item">
              <button class="btn-icon-circle btn-tutorial" @click="startTutorial" :title="t('tutorial')">💡</button>
              <span class="item-label">教程</span>
            </div>
            <div class="header-item">
              <button class="btn-icon-circle btn-toggle-row2" @click="headerRow2Expanded = !headerRow2Expanded">
                {{ headerRow2Expanded ? '▲' : '▼' }}
              </button>
              <span class="item-label">{{ headerRow2Expanded ? '收起' : '更多' }}</span>
            </div>
            <div class="header-item">
              <button class="btn-avatar" @click="showProfile = true" :title="t('profile')">
                <span class="username-text">{{ currentUsername }}</span>
              </button>
              <span class="item-label">我的主页</span>
            </div>
          </div>
        </div>

        <!-- 第二行：标签、图谱、甘特图、日历（默认收起） -->
        <div class="header-row header-row-2" v-show="headerRow2Expanded">
          <div class="header-group left-group">
            <!-- 🆕 标签浏览器（v0.9.0）-->
            <div class="header-item">
              <button 
                class="btn-icon-circle btn-tags" 
                @click="showTagBrowser = true" 
                title="标签浏览器"
              >
                🏷️
              </button>
              <span class="item-label">标签</span>
            </div>
            
            <!-- 🆕 关系图谱（v0.9.0）-->
            <div class="header-item">
              <button 
                class="btn-icon-circle btn-graph" 
                @click="handleOpenGraph" 
                title="任务关系图谱"
                :disabled="isLoadingGraph"
              >
                <span v-if="!isLoadingGraph">🕸️</span>
                <span v-else class="loading-spinner-small"></span>
              </button>
              <span class="item-label">{{ isLoadingGraph ? '加载中...' : '图谱' }}</span>
            </div>
            
            <!-- 🆕 甘特图（v0.9.0）-->
            <div class="header-item">
              <button 
                class="btn-icon-circle btn-gantt" 
                @click="showGanttChart = true" 
                title="甘特图"
              >
                📊
              </button>
              <span class="item-label">甘特图</span>
            </div>
            
            <!-- 🆕 日历视图（v0.10.0）-->
            <div class="header-item">
              <button 
                class="btn-icon-circle btn-calendar" 
                @click="showCalendar = true" 
                title="日历视图"
              >
                📅
              </button>
              <span class="item-label">日历</span>
            </div>
          </div>
        </div>
      </header>

      <!-- 🆕 面包屑导航（仅在选中笔记本时显示） -->
      <div v-if="selectedCollectionId && selectedCollectionId !== 'uncategorized'" class="breadcrumb-nav">
        <span class="breadcrumb-item" @click="selectCollection(null)">
          📚 全部
        </span>
        <span 
          v-for="(item, index) in currentBreadcrumb" 
          :key="item.id"
          class="breadcrumb-item"
          @click="selectCollection(item.id)"
        >
          <span class="separator">›</span>
          <span class="crumb-text">{{ item.icon }} {{ item.name }}</span>
        </span>
      </div>

      <!-- 🆕 文件夹快捷栏（独立一行） -->
      <div class="collection-quick-bar">
        <!-- 📓 我的笔记本 -->
        <button 
          class="collection-chip"
          :class="{ active: selectedCollectionId === null }"
          @click="selectCollection(null)"
          title="查看全部任务"
        >
          <span class="chip-name">我的笔记本</span>
          <span class="chip-count">({{ taskStore.tasks.length }})</span>
        </button>
        
        <!-- 前3个文件夹 -->
        <button 
          v-for="collection in quickCollections" 
          :key="collection.id"
          class="collection-chip"
          :class="{ active: selectedCollectionId === collection.id }"
          @click="selectCollection(collection.id)"
          :title="collection.description || '点击查看该文件夹的任务'"
        >
          <span v-if="collection.isPrivate" class="lock-icon">🔒</span>
          <span class="chip-name">{{ collection.name }}</span>
          <span class="chip-count">({{ getCollectionTaskCount(collection.id) }})</span>
        </button>
        
        <!-- 未分类 -->
        <button 
          class="collection-chip"
          :class="{ active: selectedCollectionId === 'uncategorized' }"
          @click="selectCollection('uncategorized')"
          title="未分类任务"
        >
          <span class="chip-name">未分类</span>
          <span class="chip-count">({{ uncategorizedTaskCount }})</span>
        </button>
        
        <!-- 更多按钮 -->
        <button 
          v-if="sortedCollections.length > 3"
          class="collection-chip chip-more"
          @click="showMoreCollections = true"
          title="查看更多文件夹"
        >
          <span>+{{ sortedCollections.length - 3 }}▼</span>
        </button>
      </div>

      <!-- 统计+筛选+添加 - 两行布局 v1.5.2 -->
      <section class="dashboard-area">
        <!-- AI 智能建议卡片 -->
        <AISuggestionCard 
          v-if="showAISuggestion"
          :visible="showAISuggestion"
          @close="showAISuggestion = false"
          @view-details="handleViewSuggestion"
        />
        
        <!-- 统计筛选栏（全部左对齐） -->
        <div class="stats-quick-bar">
          <!-- 已完成 -->
          <button 
            class="stats-chip"
            :class="{ active: currentFilter === 'completed' }"
            @click="setFilter('completed')"
          >
            <span class="chip-name">{{ t('completed') }}</span>
            <span class="chip-count">{{ completedCount }}</span>
          </button>

          <!-- 待办 -->
          <button 
            class="stats-chip"
            :class="{ active: currentFilter === 'pending' }"
            @click="setFilter('pending')"
          >
            <span class="chip-name">{{ t('pending') }}</span>
            <span class="chip-count">{{ pendingCount }}</span>
          </button>

          <!-- 已逾期 -->
          <button 
            class="stats-chip chip-overdue"
            :class="{ active: currentFilter === 'overdue' }"
            @click="setFilter('overdue')"
          >
            <span class="chip-name">{{ t('overdue') }}</span>
            <span class="chip-count">{{ overdueCount }}</span>
          </button>

          <!-- 筛选 -->
          <button 
            class="stats-chip chip-filter"
            @click="showFilterModal = true"
            :title="t('filter')"
          >
            <span class="chip-name">{{ t('filter') }} 🎛️</span>
          </button>

          <!-- 收起/展开 -->
          <button 
            class="stats-chip chip-toggle"
            :class="{ active: showAddForm }"
            @click="showAddForm = !showAddForm"
          >
            <span class="chip-name">{{ showAddForm ? t('collapse') + ' ↑' : t('expand') + ' ↓' }}</span>
          </button>
        </div>

        <!-- 添加任务表单 - 统一输入框 -->
        <div v-if="showAddForm" class="add-form-unified">
          <!-- 统一输入框：单行输入 + 三个按钮 -->
          <div class="unified-input-container">
            <input 
              type="text"
              :value="displayInputValue"
              @input="handleInputChange"
              class="quick-task-input"
              :class="{ 'has-description': tempDescription }"
              placeholder="输入任务标题（点击 ⛶ 可添加详细描述）"
              @keyup.enter="addTask"
            />
            <div class="quick-buttons">
              <button class="btn-camera" @click="scanTextFromCamera" :title="t('scanText')">
                📷
              </button>
              <button class="btn-expand" @click="openFullscreenDesc" title="展开编辑">
                ⛶
              </button>
            </div>
          </div>

          <!-- AI 建议气泡 -->
          <div v-if="aiSuggestion" class="ai-suggestion-bubble">
            <div class="suggestion-content">
              <span class="suggestion-icon">💡</span>
              <span class="suggestion-text">
                AI建议：{{ getCategoryLabel(aiSuggestion.category) }} · {{ getPriorityLabel(aiSuggestion.priority) }}
              </span>
            </div>
            <div class="suggestion-actions">
              <button @click="applySuggestion" class="btn-apply">采纳</button>
              <button @click="dismissSuggestion" class="btn-dismiss">忽略</button>
            </div>
          </div>

          <!-- 🌳 子任务自动识别建议气泡 -->
          <div v-if="showSubtaskSuggestion" class="subtask-suggestion-bubble">
            <div class="suggestion-content">
              <span class="suggestion-icon">🌳</span>
              <span class="suggestion-text">
                检测到 {{ detectedSubtasks.length }} 个子任务，建议使用AI拆分功能
              </span>
            </div>
            <div class="subtask-preview">
              <div v-for="(subtask, index) in detectedSubtasks.slice(0, 3)" :key="index" class="subtask-preview-item">
                {{ index + 1 }}. {{ subtask }}
              </div>
              <div v-if="detectedSubtasks.length > 3" class="subtask-more">
                +{{ detectedSubtasks.length - 3 }} 个子任务
              </div>
            </div>
            <div class="suggestion-actions">
              <button @click="ignoreDetectedSubtasks" class="btn-dismiss">✕ 知道了</button>
            </div>
            <div class="subtask-tip">
              💡 提示：创建任务后，在任务详情页点击"🤖 AI拆分"可以智能拆分子任务
            </div>
          </div>

          <!-- 只有输入任务名称后才显示属性配置 -->
          <template v-if="quickTaskInput.trim()">
            <!-- 属性配置 -->
            <div class="add-form-row-attrs">
              <!-- 时间安排 -->
              <div class="attr-group">
                <select v-model="newTaskType" class="attr-select attr-select-date" @change="handleTaskTypeChange">
                  <option value="today">{{ t('today') }}</option>
                  <option value="tomorrow">{{ t('tomorrow') }}</option>
                  <option value="day_after_tomorrow">{{ t('dayAfterTomorrow') }}</option>
                  <option value="this_week">{{ t('thisWeek') }}</option>
                  <option value="next_week">{{ t('nextWeek') }}</option>
                  <option value="this_month">{{ t('thisMonth') }}</option>
                  <option value="daily">{{ t('daily') }}</option>
                  <option value="weekday">{{ t('weekday') }}</option>
                  <option value="custom_date">{{ customDateTime ? formatDisplayDateTime(customDateTime) : t('customDate') }}</option>
                  <option value="weekly">{{ selectedWeekdays.length > 0 ? formatSelectedWeekdays(selectedWeekdays) : t('weekly') }}</option>
                  <option value="monthly">{{ t('monthly') }}</option>
                </select>
              </div>

              <input ref="hiddenCustomDateTime" type="datetime-local" style="display:none" :min="getTodayDateTime()" @change="handleCustomDateTimeChange">

              <!-- 每月重复日期选择 -->
              <div class="attr-group" v-if="newTaskType === 'monthly'">
                <input 
                  type="number" 
                  v-model.number="monthDay" 
                  min="1" 
                  max="31" 
                  placeholder="每月几号"
                  class="attr-select"
                  style="width: 80px; text-align: center;"
                />
              </div>

              <!-- 🆕 文件夹选择（显示当前选中的文件夹） -->
              <div class="attr-group" v-if="sortedCollections.length > 0">
                <select v-model="newTaskCollectionId" class="attr-select attr-select-collection">
                  <option :value="null">📂 未分类</option>
                  <option v-for="c in sortedCollections" :key="c.id" :value="c.id">
                    {{ c.icon }} {{ c.name }}
                  </option>
                </select>
              </div>

              <!-- 分类 -->
              <div class="attr-group">
                <select v-model="newTaskCategory" class="attr-select attr-select-short">
                  <option value="work">{{ t('work') }}</option>
                  <option value="study">{{ t('study') }}</option>
                  <option value="life">{{ t('life') }}</option>
                </select>
              </div>

              <!-- 优先级 -->
              <div class="attr-group">
                <select v-model="newTaskPriority" class="attr-select attr-select-short">
                  <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- 提交按钮 -->
              <button class="btn-submit-main" @click="addTask" title="添加任务">✓</button>
            </div>

            <!-- 提醒设置区域 -->
            <div class="reminder-section">
              <div class="reminder-toggle">
                <label class="switch-label">
                  <input type="checkbox" v-model="enableReminder" class="reminder-checkbox">
                  <span class="reminder-text">🔔 启用提醒（全屏强制）</span>
                  <input 
                    v-if="enableReminder"
                    type="datetime-local" 
                    v-model="reminderDateTime" 
                    class="reminder-time-input-inline"
                    :min="getTodayDateTime()"
                  >
                  <!-- 快捷时间按钮 -->
                  <div v-if="enableReminder" class="quick-time-buttons">
                    <button @click="setQuickTime(1)" class="quick-time-btn" type="button">1分钟</button>
                    <button @click="setQuickTime(5)" class="quick-time-btn" type="button">5分钟</button>
                    <button @click="setQuickTime(10)" class="quick-time-btn" type="button">10分钟</button>
                    <button @click="setQuickTime(30)" class="quick-time-btn" type="button">30分钟</button>
                    <button @click="setQuickTime(60)" class="quick-time-btn" type="button">1小时</button>
                  </div>
                  <button 
                    v-if="enableReminder"
                    class="guide-link-btn-inline" 
                    @click="showNotificationGuide = true" 
                    title="如何开启悬浮通知"
                  >
                    ❓
                  </button>
                </label>
              </div>
            </div>
          </template>
        </div>
      </section>

    <!-- 任务列表 -->
    <div class="task-list">
        <ul v-if="paginatedTasks.length > 0">
          <li 
            v-for="task in paginatedTasks" 
            :key="task.id"
            class="task-item"
            :class="{
              'task-completed': task.status === TaskStatus.COMPLETED,
              'task-overdue': task.status === TaskStatus.OVERDUE
            }"
          >
            <!-- v1.2: 增大点击热区 -->
            <label class="checkbox-wrapper" :class="{ 'checkbox-disabled': task.status !== 'completed' && !taskStore.canStart(task.id) }">
              <input 
                type="checkbox" 
                class="task-checkbox" 
                :checked="task.status === TaskStatus.COMPLETED"
                :disabled="task.status !== 'completed' && !taskStore.canStart(task.id)"
                @change="toggleTaskCompletion(task.id)"
                :title="task.status !== 'completed' && !taskStore.canStart(task.id) ? '⚠️ 请先完成依赖任务' : ''"
              >
            </label>
            <div class="task-content" @click="openTaskDetail(task)" style="cursor: pointer;">
              <div class="task-title-row">
                <span class="task-title" title="点击查看详情">{{ task.text }}</span>
                <div class="task-actions" @click.stop>
                  <!-- 提醒状态指示器 -->
                  <span v-if="task.enableReminder && task.reminderTime" class="reminder-indicator" :title="`提醒时间: ${formatDisplayDateTime(task.reminderTime)}`">
                    🔔
                  </span>
                  <!-- 番茄钟按钮（仅待办任务显示） -->
                  <button 
                    v-if="task.status === 'pending'"
                    class="btn-pomodoro-inline" 
                    @click.stop="startPomodoro(task)" 
                    title="开始专注"
                  >
                    🍅
                  </button>
                  <!-- 🆕 移动到文件夹按钮 -->
                  <button 
                    v-if="sortedCollections.length > 0"
                    class="btn-move-inline" 
                    @click.stop="openMoveToCollection(task)" 
                    title="移动到文件夹"
                  >
                    📁
                  </button>
                  <button 
                    class="btn-pin-inline" 
                    @click.stop="togglePin(task.id)" 
                    :title="task.is_pinned ? '取消置顶' : '置顶任务'"
                    :class="{ 'pinned': task.is_pinned }"
                  >
                    📌
                  </button>
                  <button class="btn-delete-inline" @click.stop="deleteTask(task.id)" title="删除任务">🗑️</button>
                </div>
              </div>
              <div 
                v-if="task.description" 
                class="task-description"
                :class="{
                  'description-completed': task.status === 'completed',
                  [`description-priority-${task.priority}`]: true
                }"
              >
                <!-- 🆕 Markdown 渲染 -->
                <MarkdownRenderer :content="task.description" :media="task.media" />
              </div>
              <div class="task-meta">
                <!-- 父任务（AI拆分） -->
                <span v-if="task.parentTaskId" class="badge badge-parent" :title="`父任务：${getParentTaskName(task.parentTaskId)}`">
                  👨‍👦 父任务×1
                </span>
                
                <!-- 子任务数量 -->
                <span v-if="getSubtasksCount(task.id) > 0" class="badge badge-children" :title="`已拆分为 ${getSubtasksCount(task.id)} 个子任务`">
                  👶 子任务×{{ getSubtasksCount(task.id) }}
                </span>
                
                <!-- 依赖数量（前置任务） -->
                <span v-if="getDependencyCount(task.id) > 0" 
                      :class="['badge', 'badge-dependency']" 
                      :title="`依赖 ${getDependencyCount(task.id)} 个前置任务`">
                  ⬆️ 依赖×{{ getDependencyCount(task.id) }}
                </span>
                
                <!-- 被依赖数量（后置任务） -->
                <span v-if="getWaitingTasksCount(task.id) > 0" class="badge badge-blocking" :title="`${getWaitingTasksCount(task.id)} 个任务依赖此任务`">
                  ⬇️ 被依赖×{{ getWaitingTasksCount(task.id) }}
                </span>
                
                <!-- 时间信息（压缩格式：去掉年份） -->
                <span class="task-time-compact" title="创建时间">📝 {{ formatCompactDateTime(task.created_at) }}</span>
                
                <!-- 日志统计 -->
                <span v-if="task.logs && task.logs.length > 0" class="badge badge-logs" title="执行日志数量">
                  💬 {{ task.logs.length }}条
                </span>
                
                <!-- 执行进度（如果有日志记录） -->
                <span v-if="task.stats && task.stats.progressHistory && task.stats.progressHistory.length > 0 && task.status !== 'completed'" class="badge badge-progress" title="当前进度">
                  📊 {{ task.stats.progressHistory[task.stats.progressHistory.length - 1] }}%
                </span>
                
                <!-- 提醒时间（如果设置了提醒） -->
                <span v-if="task.enableReminder && task.reminderTime" class="task-time-compact reminder-time" title="提醒时间">🔔 {{ formatCompactDateTime(task.reminderTime) }}</span>
                
                <!-- 已完成任务：计划时间 + 实际时间 + 耗时 + 状态 -->
                <template v-if="task.status === 'completed'">
                  <span class="task-time-compact" title="计划完成">⏰ {{ formatCompactDateTime(getPlannedDeadlineDate(task)) }}</span>
                  <span v-if="task.completed_at" class="task-time-compact" title="实际完成">✅ {{ formatCompactDateTime(task.completed_at) }}<template v-if="calculateActualHours(task)"> ({{ calculateActualHours(task) }})</template></span>
                  <span class="task-status-compact" :class="getDeadlineClass(task)">{{ getCompactStatus(task) }}</span>
                </template>
                <!-- 未完成任务：截止时间 -->
                <template v-else>
                  <span class="task-time-compact" :class="getDeadlineClass(task)" title="截止时间">⏰ {{ formatCompactDateTime(getDeadlineDate(task)) }}</span>
                </template>
                
                <!-- 核心标签 -->
                <span class="badge badge-icon" :class="`priority-${task.priority}`">⚡{{ getPriorityText(task.priority) }}</span>
                <span class="badge badge-icon" :class="`category-${task.category}`">🏷️{{ getCategoryText(task.category) }}</span>
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="empty-state">
          <img src="https://illustrations.popsy.co/purple/taking-notes.svg" alt="empty" style="width: 150px; opacity: 0.5; margin-bottom: 1rem;">
          <p>任务清单空空如也，开启高效的一天吧！</p>
        </div>
        
        <!-- 分页控件 -->
        <div v-if="totalPages > 1 || filteredTasks.length > 6" class="pagination">
          <!-- 上一页 (单击上一页，双击首页) -->
          <button 
            class="page-btn" 
            :disabled="currentPage === 1" 
            @click="currentPage--"
            @dblclick="goToFirstPage"
            title="单击上一页，双击首页"
          >
            ‹
          </button>
          <!-- 页码信息 -->
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <!-- 下一页 (单击下一页，双击末页) -->
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages" 
            @click="currentPage++"
            @dblclick="goToLastPage"
            title="单击下一页，双击末页"
          >
            ›
          </button>
          <!-- 每页条数 -->
          <select v-model.number="pageSize" @change="changePageSize(pageSize)" class="page-size-select">
            <option :value="7">7条/页</option>
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
            <option :value="50">50条/页</option>
            <option :value="0">全部</option>
          </select>
          <!-- 跳转 -->
          <span class="page-jump">
            <input 
              v-model="jumpToPage" 
              type="number" 
              class="jump-input" 
              placeholder="1"
              @keyup.enter="jumpToPageNumber"
              @blur="jumpToPageNumber"
              min="1"
              :max="totalPages"
            >
          </span>
        </div>

        <!-- 页脚版权信息 -->
        <footer class="app-footer">
          <div class="footer-content">
            <p class="footer-main">
              <span class="footer-version">TO-DO App v0.9.4</span>
              <span class="footer-divider">·</span>
              <span class="footer-text">
                {{ currentLanguage === 'zh' ? '完全离线 · 本地存储' : 'Offline · Local Storage' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-copyright">© 2026 TO-DO Team</span>
            </p>
            <p class="footer-links">
              <span class="footer-link" @click="showUserGuide = true">
                {{ currentLanguage === 'zh' ? '📖 使用指南' : '📖 Guide' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="showDataInfo = true">
                {{ currentLanguage === 'zh' ? '📊 数据说明' : '📊 Data Info' }}
              </span>
              <span class="footer-divider">·</span>
              <a href="https://github.com/zhaosj0315/TO-DO/releases" target="_blank" class="footer-link">
                {{ currentLanguage === 'zh' ? '📦 下载' : '📦 Download' }}
              </a>
              <span class="footer-divider">·</span>
              <a href="https://github.com/zhaosj0315/TO-DO" target="_blank" class="footer-link">GitHub</a>
            </p>
            <p class="footer-links">
              <span class="footer-link" @click="showPrivacyPolicy = true">
                {{ currentLanguage === 'zh' ? '🔒 隐私政策' : '🔒 Privacy' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="showSupport = true">
                {{ currentLanguage === 'zh' ? '💬 反馈' : '💬 Feedback' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="toggleLanguage">
                {{ currentLanguage === 'zh' ? '🌐 语言' : '🌐 Language' }}
              </span>
            </p>
          </div>
        </footer>
      </div>
    </main>

    <!-- 隐私政策模态框 -->
    <!-- 隐私政策弹窗 (Bottom Sheet) -->
    <div v-if="showPrivacyPolicy" class="modal-overlay" @click.self="showPrivacyPolicy = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showPrivacyPolicy = false">
            <span>← 返回</span>
          </button>
          <h3>🔒 隐私政策</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body privacy-content">
          <p class="update-date"><strong>更新日期：2026年3月1日</strong></p>
          
          <h4>1. 概述</h4>
          <p>TODO App（以下简称"本应用"）尊重并保护用户隐私。本隐私政策说明我们如何收集、使用和保护您的信息。</p>
          
          <div class="highlight-box">
            <strong>核心承诺：</strong>本应用完全离线运行，<strong>不收集任何用户数据</strong>，所有数据仅存储在您的设备本地。
          </div>
          
          <h4>2. 信息收集</h4>
          <p>本应用完全离线运行，<strong>不收集任何用户数据</strong>。具体包括：</p>
          <ul>
            <li>✓ 不收集个人身份信息（姓名、邮箱、电话等）</li>
            <li>✓ 不收集设备信息</li>
            <li>✓ 不收集位置信息</li>
            <li>✓ 不收集使用行为数据</li>
            <li>✓ 不使用任何分析工具或统计服务</li>
            <li>✓ 不使用任何广告 SDK</li>
          </ul>
          
          <h4>3. 数据存储</h4>
          <p>所有任务数据存储在您的设备本地存储中：</p>
          <ul>
            <li>✓ 数据存储在设备本地（Capacitor Preferences API）</li>
            <li>✓ 数据不会上传到任何服务器</li>
            <li>✓ 数据不会与第三方共享</li>
            <li>✓ 卸载应用会删除所有本地数据</li>
            <li>✓ 您完全控制自己的数据</li>
          </ul>
          
          <h4>4. 权限说明</h4>
          <p>本应用申请的权限及用途：</p>
          <ul>
            <li><strong>存储权限</strong>：用于保存任务数据到设备本地，以及导入导出文件</li>
            <li><strong>通知权限</strong>：用于任务提醒功能（可选，用户可在系统设置中关闭）</li>
            <li><strong>相机权限</strong>：用于拍照识别文字功能（可选，仅在使用时申请）</li>
            <li><strong>网络权限</strong>：仅用于 AI 功能（可选，用户主动配置后才使用）</li>
          </ul>
          
          <h4>5. AI 功能说明</h4>
          <p>本应用提供可选的 AI 功能（任务拆分、智能问答、报告生成）：</p>
          <ul>
            <li>✓ AI 功能完全可选，用户可选择不使用</li>
            <li>✓ 需要用户主动配置 AI 模型（OpenAI/Ollama/自定义）</li>
            <li>✓ 仅在用户主动使用 AI 功能时才会发送数据</li>
            <li>✓ 发送的数据仅包含任务相关信息，不包含个人身份信息</li>
            <li>✓ 支持本地 AI 模型（Ollama），完全离线运行</li>
            <li>✓ 用户可随时删除 AI 配置，停止使用 AI 功能</li>
          </ul>
          
          <h4>6. 数据安全</h4>
          <div class="highlight-box">
            <p><strong>本应用默认完全离线，数据完全在本地，不存在数据泄露风险。</strong></p>
            <p><strong>AI 功能为可选功能，用户可选择使用本地模型或不使用。</strong></p>
          </div>
          
          <h4>7. 第三方服务</h4>
          <p>本应用<strong>不使用任何第三方统计、分析或广告 SDK</strong>。</p>
          <p>AI 功能使用的第三方服务（如 OpenAI）由用户自主选择和配置。</p>
          
          <h4>8. 开源承诺</h4>
          <ul>
            <li>✓ 本应用完全开源（MIT License）</li>
            <li>✓ 源代码可在 GitHub 审计</li>
            <li>✓ 欢迎社区监督和贡献</li>
            <li>✓ 项目地址：https://github.com/zhaosj0315/TO-DO</li>
          </ul>
          
          <h4>9. 联系我们</h4>
          <div class="contact-box">
            <p>如对本隐私政策有任何疑问，请联系：</p>
            <p><strong>📧 邮箱：</strong>17858441076@163.com</p>
            <p><strong>📞 电话：</strong>17858441076</p>
            <p><strong>🐙 GitHub：</strong>https://github.com/zhaosj0315/TO-DO</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据说明弹窗 -->
    <!-- 数据说明弹窗 (Bottom Sheet) -->
    <div v-if="showDataInfo" class="modal-overlay" @click.self="showDataInfo = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showDataInfo = false">
            <span>← 返回</span>
          </button>
          <h3>📊 数据存储说明</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body">
          <h4>💾 存储方式</h4>
          <p>本应用采用 <strong>Capacitor Preferences API</strong> 进行数据持久化，所有数据存储在您的设备本地。</p>
          
          <h4>📍 存储位置</h4>
          <ul>
            <li><strong>Android</strong>: <code>/data/data/com.todo.app/shared_prefs/</code></li>
            <li><strong>iOS</strong>: <code>UserDefaults</code></li>
            <li><strong>Windows/macOS</strong>: <code>localStorage</code></li>
          </ul>
          
          <h4>✅ 优点</h4>
          <div class="pros-box">
            <p>✅ <strong>完全离线</strong>：无需网络连接，随时随地使用</p>
            <p>✅ <strong>数据隔离</strong>：每个用户的数据完全独立</p>
            <p>✅ <strong>隐私保护</strong>：数据不上传，不联网，不泄露</p>
            <p>✅ <strong>快速响应</strong>：本地存储，操作即时生效</p>
          </div>
          
          <h4>⚠️ 限制</h4>
          <div class="cons-box">
            <p>❌ <strong>无云端同步</strong>：数据仅存在当前设备</p>
            <p>❌ <strong>卸载丢失</strong>：卸载应用会清空所有数据</p>
            <p>❌ <strong>无加密存储</strong>：数据以明文存储在本地</p>
            <p>❌ <strong>单设备使用</strong>：无法在多设备间同步</p>
          </div>
          
          <h4>📤 数据导出</h4>
          <div class="export-guide">
            <p><strong>方式1：Excel 导出（基础备份）</strong></p>
            <ol>
              <li>点击右上角 <strong>👤 个人主页</strong></li>
              <li>找到 <strong>数据管理</strong> 区域</li>
              <li>点击 <strong>📥 导出Excel</strong> 按钮</li>
              <li>文件会保存到设备的下载目录</li>
            </ol>
            
            <p><strong>Excel 导出内容</strong>：</p>
            <ul>
              <li>任务标题、描述、分类、优先级</li>
              <li>创建时间、完成时间、截止时间</li>
              <li>任务类型、状态、周期设置</li>
              <li>共 17 个基础字段</li>
            </ul>

            <p><strong>方式2：JSON 完整备份（推荐）⭐</strong></p>
            <ol>
              <li>点击右上角 <strong>👤 个人主页</strong></li>
              <li>找到 <strong>数据管理</strong> 区域</li>
              <li>点击 <strong>📦 导出完整备份</strong> 按钮</li>
              <li>JSON 文件会保存到下载目录</li>
            </ol>

            <p><strong>JSON 完整备份内容（100%数据）</strong>：</p>
            <ul>
              <li>✅ 所有任务数据（包括已删除任务）</li>
              <li>✅ 任务执行日志（所有日志记录）</li>
              <li>✅ 番茄钟历史（所有专注记录）</li>
              <li>✅ 用户信息（注册时间、绑定手机等）</li>
              <li>✅ AI 配置（模型配置、对话历史）</li>
              <li>✅ 个性化设置（语言、优先级模式等）</li>
            </ul>

            <p><strong>导入恢复</strong>：</p>
            <ul>
              <li>Excel 导入：仅恢复任务基础数据</li>
              <li>JSON 导入：恢复 100% 完整数据（推荐）</li>
            </ul>
          </div>
          
          <h4>💡 数据备份建议</h4>
          <div class="backup-tips">
            <p>🔸 <strong>定期导出</strong>：建议每周导出一次 Excel 备份</p>
            <p>🔸 <strong>多处保存</strong>：将备份文件保存到云盘（如百度网盘、iCloud）</p>
            <p>🔸 <strong>更换设备</strong>：通过 Excel 导入功能迁移数据</p>
            <p>🔸 <strong>重装应用</strong>：务必先导出数据再卸载</p>
          </div>
          
          <h4>🔒 数据安全承诺</h4>
          <div class="security-promise">
            <p>✓ 数据永不上传到任何服务器</p>
            <p>✓ 不收集任何个人隐私信息</p>
            <p>✓ 不使用任何第三方统计或广告 SDK</p>
            <p>✓ 完全开源，代码可审计</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 首次登录备份提醒弹窗 -->
    <div v-if="showBackupReminder" class="modal-overlay">
      <div class="backup-reminder-modal">
        <div class="reminder-icon">⚠️</div>
        <h2>重要提示</h2>
        <div class="reminder-content">
          <p class="highlight-text">本应用为<strong>纯离线应用</strong>，所有数据存储在设备本地。</p>
          <p class="warning-text">请定期导出数据备份，<strong>卸载应用将导致数据永久丢失！</strong></p>
          
          <div class="backup-guide">
            <p class="guide-title">💡 备份方法：</p>
            <ol>
              <li>点击右上角 <strong>👤 头像</strong></li>
              <li>找到 <strong>数据管理</strong> 区域</li>
              <li>点击 <strong>📥 导出Excel</strong> 按钮</li>
              <li>建议每周备份一次</li>
            </ol>
          </div>
          
          <div class="tips-box">
            <p>💾 备份文件可保存到云盘（百度网盘、iCloud等）</p>
            <p>🔄 更换设备时可通过导入功能恢复数据</p>
          </div>
        </div>
        
        <button class="confirm-btn" @click="showBackupReminder = false">
          我知道了
        </button>
      </div>
    </div>

    <!-- 通知设置指南弹窗 -->
    <div v-if="showNotificationGuide" class="modal-overlay">
      <div class="notification-guide-modal">
        <div class="guide-header">
          <div class="guide-icon">🚨</div>
          <h2>全屏强制提醒说明</h2>
          <button class="close-btn" @click="showNotificationGuide = false">&times;</button>
        </div>
        
        <div class="guide-content">
          <p class="guide-intro">启用提醒后，将在指定时间弹出全屏提醒界面，确保重要任务不被错过！</p>
          
          <div class="guide-steps">
            <div class="step-item">
              <div class="step-number">✨</div>
              <div class="step-content">
                <h4>全屏提醒特点</h4>
                <p>• 自动点亮屏幕（包括锁屏状态）<br>
                   • 持续播放闹钟铃声<br>
                   • 持续震动提醒<br>
                   • 无法通过返回键关闭</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">⚙️</div>
              <div class="step-content">
                <h4>权限设置（首次使用）</h4>
                <p>设置 → 应用 → TODO App → 权限<br>
                   • 开启"通知"权限<br>
                   • 开启"显示在其他应用上层"<br>
                   • 开启"设置闹钟和提醒"</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">🎯</div>
              <div class="step-content">
                <h4>操作选项</h4>
                <p>全屏提醒弹出后，可以：<br>
                   • ✅ 完成任务<br>
                   • ⏰ 稍后提醒（1/5/10/30/60分钟）<br>
                   • ❌ 关闭提醒</p>
              </div>
            </div>
          </div>
          
          <div class="guide-tips">
            <p class="tip-title">💡 使用建议：</p>
            <ul>
              <li>适合重要任务、紧急事项的提醒</li>
              <li>建议提前1-5分钟设置提醒，留出准备时间</li>
              <li>可使用快捷时间按钮快速设置</li>
              <li>提醒时间到达时，即使应用在后台也会弹出</li>
            </ul>
          </div>
          
          <div class="guide-note">
            <p>⚠️ 部分手机品牌可能需要在"电池优化"中将本应用设为"不限制"，以确保后台提醒正常工作。</p>
          </div>
        </div>
        
        <div class="guide-actions">
          <button class="btn-secondary" @click="showNotificationGuide = false">我知道了</button>
          <button class="btn-primary" @click="openNotificationSettings">前往权限设置</button>
        </div>
      </div>
    </div>

    <!-- 番茄钟计时器全屏界面 -->
    <div v-if="showPomodoroTimer" class="pomodoro-fullscreen">
      <div class="pomodoro-container">
        <!-- 顶部信息 -->
        <div class="pomodoro-header">
          <div class="pomodoro-mode-badge" :class="`mode-${pomodoroState.mode}`">
            {{ pomodoroState.mode === 'focus' ? '🍅 专注模式' : pomodoroState.mode === 'shortBreak' ? '☕ 短休息' : '🌟 长休息' }}
          </div>
          <h2 class="pomodoro-task-name">{{ pomodoroState.currentTask?.text }}</h2>
          <p class="pomodoro-progress">{{ pomodoroState.completedCount }}/{{ pomodoroState.currentTask?.estimatedPomodoros || 4 }} 个番茄钟</p>
        </div>

        <!-- 倒计时显示 -->
        <div class="pomodoro-timer">
          <div class="timer-circle">
            <svg class="timer-svg" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" class="timer-bg"></circle>
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                class="timer-progress"
                :style="{
                  strokeDashoffset: 565.48 * (1 - pomodoroState.remainingSeconds / getTotalSeconds())
                }"
              ></circle>
            </svg>
            <div class="timer-text">
              {{ Math.floor(pomodoroState.remainingSeconds / 60).toString().padStart(2, '0') }}:{{ (pomodoroState.remainingSeconds % 60).toString().padStart(2, '0') }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="pomodoro-actions">
          <!-- 专注模式按钮 -->
          <template v-if="pomodoroState.mode === 'focus'">
            <button class="btn-pomodoro-control" @click="pausePomodoro">
              {{ pomodoroState.isPaused ? '▶️ 继续' : '⏸️ 暂停' }}
            </button>
            <button class="btn-pomodoro-stop" @click="stopPomodoro">
              ❌ 放弃
            </button>
          </template>
          <!-- 休息模式按钮 -->
          <template v-else>
            <button class="btn-pomodoro-control" @click="skipBreak">
              ⏭️ 跳过休息
            </button>
            <button class="btn-pomodoro-primary" @click="continueNextPomodoro">
              🍅 继续下一个
            </button>
          </template>
        </div>

        <!-- 任务详情 -->
        <div class="pomodoro-task-info">
          <p><strong>分类：</strong>{{ getCategoryText(pomodoroState.currentTask?.category) }}</p>
          <p><strong>优先级：</strong>{{ getPriorityText(pomodoroState.currentTask?.priority) }}</p>
          <p v-if="pomodoroState.currentTask?.description"><strong>描述：</strong>{{ pomodoroState.currentTask.description }}</p>
        </div>
      </div>
    </div>

    <!-- 筛选弹窗 (Bottom Sheet) - 优化版 -->
    <div v-if="showFilterModal" class="modal-overlay" @click.self="showFilterModal = false">
      <div class="filter-bottom-sheet">
        <div class="modal-header">
          <h3>🎛️ {{ t('advancedFilter') }}</h3>
          <button class="close-btn" @click="showFilterModal = false">&times;</button>
        </div>
        <div class="modal-body filter-body">
          <!-- 快捷场景 - 置顶 -->
          <div class="filter-section">
            <label class="filter-label">📌 快捷场景</label>
            <div class="scene-buttons">
              <button class="scene-btn" :class="{ active: activeScene === 'todayPending' }" @click="applyScene('todayPending')">
                今日待办
              </button>
              <button class="scene-btn" :class="{ active: activeScene === 'weekPending' }" @click="applyScene('weekPending')">
                本周待办
              </button>
              <button class="scene-btn" :class="{ active: activeScene === 'todayOverdue' }" @click="applyScene('todayOverdue')">
                今日逾期
              </button>
              <button class="scene-btn" :class="{ active: activeScene === 'highPriority' }" @click="applyScene('highPriority')">
                高优先级
              </button>
              <button class="scene-btn" :class="{ active: activeScene === 'workTasks' }" @click="applyScene('workTasks')">
                工作任务
              </button>
              <button class="scene-btn" :class="{ active: activeScene === 'studyTasks' }" @click="applyScene('studyTasks')">
                学习任务
              </button>
            </div>
          </div>

          <!-- 关键字搜索 -->
          <div class="filter-section filter-section-compact">
            <label class="filter-label-inline">🔍 关键字</label>
            <div class="search-input-wrapper-inline">
              <input 
                ref="filterSearchInput"
                v-model="searchKeyword" 
                type="text" 
                class="search-input-modal" 
                :placeholder="t('searchTaskPlaceholder')"
                @input="handleSearch"
              >
              <button v-if="searchKeyword" class="clear-btn-small" @click="clearSearch">{{ t('clear') }}</button>
            </div>
          </div>

          <!-- 分类筛选 -->
          <div class="filter-section filter-section-compact">
            <label class="filter-label-inline">🏷️ 分类</label>
            <div class="filter-buttons-inline">
              <button 
                v-for="cat in categories" 
                :key="cat.value"
                class="filter-chip filter-chip-tag" 
                :class="{ active: currentCategoryFilter === cat.value }"
                @click="setCategoryFilter(cat.value)"
              >
                <span class="chip-label-main">{{ cat.label }}</span>
                <span class="chip-count-badge">{{ getCategoryCount(cat.value) }}</span>
              </button>
            </div>
          </div>

          <!-- 优先级筛选 -->
          <div class="filter-section filter-section-compact">
            <label class="filter-label-inline">⚡ 优先级</label>
            <div class="filter-buttons-inline">
              <button 
                v-for="opt in priorityOptions" 
                :key="opt.value"
                class="filter-chip filter-chip-tag" 
                :class="{ active: currentPriorityFilter === opt.value, [`priority-${opt.value}`]: true }"
                @click="setPriorityFilter(opt.value)"
              >
                <span class="priority-dot" :class="`dot-${opt.value}`"></span>
                <span class="chip-label-main">{{ opt.label }}</span>
                <span class="chip-count-badge">{{ opt.count }}</span>
              </button>
            </div>
          </div>

          <!-- 时间筛选 -->
          <div class="filter-section">
            <div class="time-dimension-header">
              <label class="filter-label-inline">📅 时间</label>
              <select v-model="timeDimension" class="dimension-select">
                <option value="created">按创建时间</option>
                <option value="deadline">按截止时间</option>
                <option value="completed">按完成时间</option>
              </select>
            </div>
            <div class="dimension-hint">
              <span v-if="timeDimension === 'created'">💡 查看某时间段创建的任务</span>
              <span v-else-if="timeDimension === 'deadline'">💡 查看某时间段需要完成的任务</span>
              <span v-else>💡 查看某时间段实际完成的任务</span>
            </div>
            
            <!-- 常用时间 -->
            <div class="quick-date-section">
              <div class="quick-date-label">常用：</div>
              <div class="quick-date-buttons">
                <button class="quick-date-btn" @click="setQuickDate('today')">今天</button>
                <button class="quick-date-btn" @click="setQuickDate('yesterday')">昨天</button>
                <button class="quick-date-btn" @click="setQuickDate('thisWeek')">本周</button>
                <button class="quick-date-btn" @click="setQuickDate('lastWeek')">上周</button>
                <button class="quick-date-btn" @click="setQuickDate('thisMonth')">本月</button>
                <button class="quick-date-btn" @click="setQuickDate('lastMonth')">上月</button>
              </div>
            </div>

            <!-- 特殊场景 -->
            <div class="quick-date-section">
              <div class="quick-date-label">特殊：</div>
              <div class="quick-date-buttons">
                <button class="quick-date-btn" @click="setQuickDate('overdue')">全部逾期</button>
                <button class="quick-date-btn" @click="setQuickDate('recent7')">最近7天</button>
                <button class="quick-date-btn" @click="setQuickDate('recent30')">最近30天</button>
              </div>
            </div>

            <!-- 自定义范围 -->
            <div class="custom-date-section">
              <div class="quick-date-label">自定义：</div>
              <div class="date-range-picker">
                <div 
                  class="date-input-box" 
                  :class="{ 'has-value': startDate }" 
                  @click="showDatePicker('start')"
                >
                  {{ startDate ? formatDisplayDate(startDate) : '开始日期' }}
                </div>
                <span class="date-separator">至</span>
                <div 
                  class="date-input-box" 
                  :class="{ 'has-value': endDate }" 
                  @click="showDatePicker('end')"
                >
                  {{ endDate ? formatDisplayDate(endDate) : '结束日期' }}
                </div>
                <button v-if="startDate || endDate" class="clear-btn-small" @click="clearDateFilter">清除</button>
              </div>
            </div>
            <input ref="hiddenStartDate" type="date" style="display:none" @change="handleStartDateChange">
            <input ref="hiddenEndDate" type="date" style="display:none" @change="handleEndDateChange">
          </div>

          <!-- 筛选结果提示 -->
          <div v-if="filterResultCount > 0" class="filter-result-hint">
            <div class="filter-result-main">
              🎯 当前筛选结果：<span class="filter-result-count">{{ filterResultCount }}</span> 个任务
            </div>
            <div class="filter-result-detail">
              <span v-if="startDate || endDate">
                {{ timeDimensionLabel }}：{{ startDate ? formatDisplayDate(startDate) : '不限' }} ~ {{ endDate ? formatDisplayDate(endDate) : '不限' }}
              </span>
              <span v-if="currentCategoryFilter !== 'all'"> · 分类：{{ getCategoryLabel(currentCategoryFilter) }}</span>
              <span v-if="currentPriorityFilter !== 'all'"> · 优先级：{{ getPriorityLabel(currentPriorityFilter) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-reset" @click="resetFilters">{{ t('reset') }}</button>
          <button class="btn btn-confirm" @click="showFilterModal = false">{{ t('confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 筛选日历 - 开始日期 -->
    <CalendarPicker
      v-if="showFilterStartCalendar"
      :initial-value="startDate ? `${startDate}T00:00` : ''"
      @close="showFilterStartCalendar = false"
      @confirm="handleFilterStartDateConfirm"
    />

    <!-- 筛选日历 - 结束日期 -->
    <CalendarPicker
      v-if="showFilterEndCalendar"
      :initial-value="endDate ? `${endDate}T23:59` : ''"
      @close="showFilterEndCalendar = false"
      @confirm="handleFilterEndDateConfirm"
    />

    <!-- 自定义报告日历 - 开始日期 -->
    <CalendarPicker
      v-if="showReportStartCalendar"
      :initial-value="customStartDate ? `${customStartDate}T00:00` : ''"
      @close="showReportStartCalendar = false"
      @confirm="handleReportStartDateConfirm"
    />

    <!-- 自定义报告日历 - 结束日期 -->
    <CalendarPicker
      v-if="showReportEndCalendar"
      :initial-value="customEndDate ? `${customEndDate}T23:59` : ''"
      @close="showReportEndCalendar = false"
      @confirm="handleReportEndDateConfirm"
    />

    <!-- 自定义报告配置日历 - 开始日期 -->
    <CalendarPicker
      v-if="showCustomReportStartCalendar"
      :initial-value="customReportConfig.startDate ? `${customReportConfig.startDate}T00:00` : ''"
      @close="showCustomReportStartCalendar = false"
      @confirm="handleCustomReportStartDateConfirm"
    />

    <!-- 自定义报告配置日历 - 结束日期 -->
    <CalendarPicker
      v-if="showCustomReportEndCalendar"
      :initial-value="customReportConfig.endDate ? `${customReportConfig.endDate}T23:59` : ''"
      @close="showCustomReportEndCalendar = false"
      @confirm="handleCustomReportEndDateConfirm"
    />

    <!-- 回收站 -->
    <TrashModal
      :visible="showTrash"
      :tasks="taskStore.deletedTasks"
      @close="showTrash = false"
      @restore="restoreTask"
      @permanent-delete="permanentDelete"
      @clear-all="clearAllTrash"
    />

    <!-- 首次登录欢迎弹窗 -->
    <div v-if="showWelcome" class="modal-overlay" @click.self="showWelcome = false">
      <div class="modal-content glass-card" style="background: white; max-width: 500px; width: 96%; padding: 1.5rem;">
        <div class="modal-header">
          <h3>🎉 {{ currentLanguage === 'zh' ? '欢迎使用 TO-DO App！' : 'Welcome to TO-DO App!' }}</h3>
          <button class="close-btn" @click="showWelcome = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="welcome-content">
            <h4>📌 {{ currentLanguage === 'zh' ? '重要提醒' : 'Important Notice' }}</h4>
            <ul class="welcome-list">
              <li>{{ currentLanguage === 'zh' ? '本应用完全离线运行' : 'This app runs completely offline' }}</li>
              <li>{{ currentLanguage === 'zh' ? '数据仅存储在您的设备上' : 'Data is stored only on your device' }}</li>
              <li><strong>{{ currentLanguage === 'zh' ? '请定期导出数据备份' : 'Please export data regularly' }}</strong></li>
            </ul>
            
            <h4>💡 {{ currentLanguage === 'zh' ? '如何备份？' : 'How to Backup?' }}</h4>
            <p class="backup-guide">
              {{ currentLanguage === 'zh' ? '个人主页 → 数据管理 → 导出Excel' : 'Profile → Data Management → Export Excel' }}
            </p>
            
            <div class="welcome-warning">
              <span class="warning-icon">⚠️</span>
              <span class="warning-text">
                {{ currentLanguage === 'zh' ? '卸载应用将导致数据永久丢失！' : 'Uninstalling the app will permanently delete all data!' }}
              </span>
            </div>
          </div>
          
          <button class="btn btn-primary" @click="showWelcome = false" style="width: 100%; margin-top: 1rem;">
            {{ currentLanguage === 'zh' ? '我知道了' : 'Got it' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 定期备份提醒弹窗 -->
    <div v-if="showBackupReminder" class="modal-overlay" @click.self="showBackupReminder = false">
      <div class="modal-content glass-card" style="background: white; max-width: 450px; width: 96%; padding: 1.5rem;">
        <div class="modal-header">
          <h3>💾 {{ currentLanguage === 'zh' ? '数据备份提醒' : 'Backup Reminder' }}</h3>
          <button class="close-btn" @click="showBackupReminder = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="backup-reminder-text">
            {{ currentLanguage === 'zh' ? 
              `您已使用本应用一段时间，累计创建了 ${taskStore.tasks.length} 个任务。建议立即备份数据！` : 
              `You have created ${taskStore.tasks.length} tasks. It's recommended to backup your data now!` 
            }}
          </p>
          
          <div class="backup-reminder-buttons">
            <button class="btn btn-primary" @click="exportToExcel(); showBackupReminder = false">
              {{ currentLanguage === 'zh' ? '立即备份' : 'Backup Now' }}
            </button>
            <button class="btn btn-secondary" @click="showBackupReminder = false">
              {{ currentLanguage === 'zh' ? '稍后提醒' : 'Remind Later' }}
            </button>
            <button class="btn btn-text" @click="disableBackupReminder">
              {{ currentLanguage === 'zh' ? '不再提醒' : 'Don\'t Remind' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 个人主页弹窗 -->
    <!-- 个人主页 (Bottom Sheet) -->
    <div v-if="showProfile" class="modal-overlay" @click.self="showProfile = false">
      <div class="profile-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showProfile = false">
            <span>← 返回</span>
          </button>
          <h3>{{ t('personalProfile') }}</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body">
          <!-- 用户信息展示 -->
          <div class="profile-section">
            <div class="profile-avatar">
              <div class="avatar-circle">{{ currentUsername ? currentUsername.charAt(0).toUpperCase() : 'U' }}</div>
            </div>
            <div class="profile-info">
              <h2>
                {{ editingUsername ? '' : currentUsername }}
                <input 
                  v-if="editingUsername"
                  v-model="newUsername"
                  class="username-edit-input"
                  @blur="saveUsername"
                  @keyup.enter="saveUsername"
                  ref="usernameInput"
                >
                <span class="edit-icon" @click="startEditUsername">✏️</span>
              </h2>
              <div class="profile-details">
                <p class="profile-meta">📅 {{ formatDate(userProfileInfo.registerTime) }}</p>
                <p class="profile-meta" v-if="userProfileInfo.usernameModifiedTime">✏️ {{ formatDate(userProfileInfo.usernameModifiedTime) }}</p>
                <p class="profile-meta">🕐 {{ formatDate(userProfileInfo.lastLoginTime) }}</p>
                <p class="profile-meta">📊 {{ t('usageDays') }}{{ usageDays }}{{ t('days') }}</p>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="profile-stats-compact">
            <div class="stat-item">
              <span class="stat-label">{{ t('totalTasks') }}</span>
              <span class="stat-value">{{ taskStore.tasks.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('completedTasks') }}</span>
              <span class="stat-value">{{ completedCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('pendingTasks') }}</span>
              <span class="stat-value">{{ pendingCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('completionRate') }}</span>
              <span class="stat-value">{{ completionRate }}%</span>
            </div>
          </div>

          <!-- 报告中心入口 -->
          <div class="pomodoro-entry" @click="showUnifiedReport = true">
            <div class="entry-icon">📊</div>
            <div class="entry-content">
              <div class="entry-title">报告中心</div>
              <div class="entry-summary">
                可视化数据看板 + AI结构化报告
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 版本更新入口 -->
          <div class="pomodoro-entry" @click="showVersionHistory">
            <div class="entry-icon">🎉</div>
            <div class="entry-content">
              <div class="entry-title">
                版本更新
                <span v-if="hasUnreadVersions" class="badge-new">NEW</span>
              </div>
              <div class="entry-summary">
                查看版本更新日志
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- AI配置入口 -->
          <div class="pomodoro-entry" @click="showAIConfig = true">
            <div class="entry-icon">🤖</div>
            <div class="entry-content">
              <div class="entry-title">AI模型配置</div>
              <div class="entry-summary">
                配置本地Ollama或云端API
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 数据库配置入口 -->
          <div class="pomodoro-entry" @click="showDatabaseConfig = true">
            <div class="entry-icon">🗄️</div>
            <div class="entry-content">
              <div class="entry-title">数据库配置</div>
              <div class="entry-summary">
                本地存储 + 可选备份（SQLite/MySQL）
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 修改密码入口 -->
          <div class="settings-entry" @click="showPasswordModal = true">
            <div class="entry-icon">🔒</div>
            <div class="entry-content">
              <div class="entry-title">{{ t('changePassword') }}</div>
              <div class="entry-summary">{{ t('modifyPassword') }}</div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 绑定手机号入口 -->
          <div class="settings-entry" @click="showPhoneModal = true">
            <div class="entry-icon">📱</div>
            <div class="entry-content">
              <div class="entry-title">{{ t('bindPhone') }}</div>
              <div class="entry-summary">
                {{ userProfileInfo.boundPhone ? userProfileInfo.boundPhone : t('notBound') }}
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 通知设置入口 -->
          <div class="settings-entry" @click="showNotificationSettings = true">
            <div class="entry-icon">🔔</div>
            <div class="entry-content">
              <div class="entry-title">通知设置</div>
              <div class="entry-summary">
                配置每日摘要通知时间
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 数据导出与导入 -->
          <div class="export-section">
            <h4 class="export-title">📊 {{ t('dataManagement') }}</h4>
            
            <!-- 重要提示 -->
            <div class="backup-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-text">
                <strong>重要：卸载应用前请务必导出数据！</strong><br>
                建议每周备份一次数据
              </div>
            </div>
            
            <p class="export-desc">{{ t('dataManagementDesc') }}</p>
            
            <!-- 完整备份区域 -->
            <div class="backup-group">
              <div class="group-label">🔒 完整备份（推荐）</div>
              <div class="group-desc">
                <strong>✅ 包含所有数据（100%完整）：</strong>
                <ul style="margin: 0.5rem 0 0 1.5rem; font-size: 0.85rem; line-height: 1.6;">
                  <li><strong>任务数据</strong>：标题、描述、分类、优先级、状态、时间、执行日志、番茄钟历史</li>
                  <li><strong>文件夹数据</strong>：所有笔记本及层级关系</li>
                  <li><strong>回收站数据</strong>：已删除任务（可恢复）</li>
                  <li><strong>AI报告历史</strong>：所有生成的报告记录（日/周/月/季/半年/年报）</li>
                  <li><strong>AI对话历史</strong>：所有AI问答记录</li>
                  <li><strong>AI模型配置</strong>：模型列表和默认模型</li>
                  <li><strong>数据库配置</strong>：MySQL/SQLite连接信息、接管模式开关</li>
                  <li><strong>用户信息</strong>：账号、密码、手机号、安全问题</li>
                  <li><strong>任务关系</strong>：依赖关系、父子任务、AI总结</li>
                </ul>
                <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(102, 126, 234, 0.1); border-radius: 6px; font-size: 0.85rem;">
                  💡 <strong>备份说明</strong>：<br>
                  • 执行日志和番茄钟历史存储在任务对象内，会随任务一起备份<br>
                  • Web端：下载JSON文件 + 自动保存到浏览器（最近20个）<br>
                  • 移动端：保存到 Documents/TODO-App-backups/<br>
                  • 建议每周备份一次，重要操作前备份
                </div>
              </div>
              <div class="data-buttons">
                <button class="btn btn-backup-full" @click="handleManualBackup">
                  <span class="export-icon">💾</span>
                  <span class="btn-text">完整备份 (JSON)</span>
                </button>
                <button class="btn btn-restore" @click="triggerRestoreFile">
                  <span class="export-icon">♻️</span>
                  <span class="btn-text">恢复备份</span>
                </button>
                <input 
                  ref="restoreFileInput" 
                  type="file" 
                  accept=".json" 
                  style="display: none" 
                  @change="handleRestoreFile"
                />
              </div>
            </div>
            
            <!-- Excel 导入导出区域 -->
            <div class="backup-group">
              <div class="group-label">📊 Excel 导入导出（基础数据）</div>
              <div class="group-desc warning-text-small">
                ⚠️ 仅包含任务基础字段（标题、描述、分类、优先级、状态、时间）<br>
                ❌ 不含：执行日志、番茄钟历史、标签、心情、进度、AI数据等扩展数据<br>
                💡 适用场景：批量导入任务、与其他工具交换数据
              </div>
              <div class="data-buttons">
                <button class="btn btn-export" @click="exportToExcel">
                  <span class="export-icon">📥</span>
                  <span class="btn-text">导出 Excel</span>
                </button>
                <button class="btn btn-import" @click="showImportWarning">
                  <span class="export-icon">📤</span>
                  <span class="btn-text">导入 Excel</span>
                </button>
                <button class="btn btn-template" @click="downloadTemplate">
                  <span class="export-icon">📋</span>
                  <span class="btn-text">下载模板</span>
                </button>
              </div>
            </div>
            
            <!-- 危险操作区域 -->
            <div class="backup-group danger-group">
              <div class="group-label">⚠️ 危险操作</div>
              <div class="data-buttons">
                <button class="btn btn-clear-all" @click="showClearWarning">
                  <span class="export-icon">🗑️</span>
                  <span class="btn-text">清空所有任务</span>
                </button>
              </div>
            </div>
            
            <input 
              ref="fileInput" 
              type="file" 
              accept=".xlsx,.xls" 
              style="display: none" 
              @change="importFromExcel"
            />
          </div>

          <!-- 优先级模式配置 -->
          <div class="settings-entry" @click="togglePriorityMode">
            <div class="entry-icon">⚡</div>
            <div class="entry-content">
              <div class="entry-title">{{ t('priorityMode') }}</div>
              <div class="entry-summary">
                {{ priorityMode === 'traditional' ? t('traditionalMode') : t('eisenhowerMode') }}
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 联系与支持入口 -->
          <div class="support-entry" @click="showSupport = true">
            <div class="entry-icon">💝</div>
            <div class="entry-content">
              <div class="entry-title">{{ t('contactSupport') }}</div>
              <div class="entry-summary">
                {{ t('contactSupportDesc') }}
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 退出登录按钮 -->
          <div style="margin-top: 1.5rem; text-align: center;">
            <button class="btn btn-danger" @click="handleLogout" style="width: 100%;">
              {{ t('logout') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI配置弹窗 -->
    <AIConfigModal v-if="showAIConfig" @close="showAIConfig = false" @saved="handleAIConfigSaved" />

    <!-- 数据库配置弹窗 -->
    <DatabaseConfigModal v-if="showDatabaseConfig" @close="showDatabaseConfig = false" @save="handleDatabaseConfigSaved" />

    <!-- 通知设置弹窗 -->
    <div v-if="showNotificationSettings" class="modal-overlay" @click.self="showNotificationSettings = false">
      <div class="profile-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showNotificationSettings = false">
            <span>← 返回</span>
          </button>
          <h3>🔔 通知设置</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body">
          <!-- 每日摘要通知 -->
          <div class="settings-section">
            <h4 class="section-title">📅 每日摘要通知</h4>
            
            <div class="setting-item">
              <label class="setting-checkbox">
                <input type="checkbox" v-model="notificationSettings.dailySummaryEnabled">
                <span class="checkbox-visual"></span>
                <span class="setting-text">
                  <strong>启用每日摘要</strong>
                  <p class="setting-desc">每天指定时间发送任务摘要</p>
                </span>
              </label>
            </div>

            <div v-if="notificationSettings.dailySummaryEnabled" class="setting-item">
              <label class="setting-label">通知时间</label>
              <input 
                type="time" 
                v-model="notificationSettings.dailySummaryTime"
                class="time-input"
              >
              <p class="setting-desc">设置每天接收摘要通知的时间</p>
            </div>
          </div>

          <!-- 保存按钮 -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="showNotificationSettings = false">取消</button>
            <button class="btn-save" @click="saveNotificationSettings">保存设置</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 联系与支持详情弹窗 -->
    <!-- 联系与支持 (Bottom Sheet) -->
    <div v-if="showSupport" class="modal-overlay" @click.self="showSupport = false">
      <div class="support-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showSupport = false">
            <span>← 返回</span>
          </button>
          <h3>💬 {{ currentLanguage === 'zh' ? '问题反馈' : 'Feedback' }}</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body">
          <p class="support-desc">{{ currentLanguage === 'zh' ? '遇到bug或有功能建议？欢迎反馈！' : 'Found a bug or have suggestions? Feel free to contact!' }}</p>
          
          <div class="qr-codes">
            <div class="qr-item">
              <img src="../assets/images/wechat-qr.png" alt="微信二维码" class="qr-image">
              <p class="qr-label">💬 {{ currentLanguage === 'zh' ? '添加微信' : 'WeChat' }}</p>
            </div>
            <div class="qr-item">
              <img src="../assets/images/payment-qr.png" alt="打赏二维码" class="qr-image">
              <p class="qr-label">💰 {{ currentLanguage === 'zh' ? '打赏支持' : 'Donate' }}</p>
            </div>
          </div>

          <div class="contact-info">
            <span class="contact-icon">📧</span>
            <span class="contact-text">{{ currentLanguage === 'zh' ? 'GitHub Issues: ' : 'GitHub Issues: ' }}<a href="https://github.com/zhaosj0315/TO-DO/issues" target="_blank">提交反馈</a></span>
          </div>
          
          <div class="contact-info">
            <span class="contact-icon">📞</span>
            <span class="contact-text">{{ currentLanguage === 'zh' ? '联系电话：17858441076' : 'Phone: 17858441076' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用指南弹窗 -->
    <!-- 使用指南弹窗 (Bottom Sheet) -->
    <div v-if="showUserGuide" class="modal-overlay" @click.self="showUserGuide = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showUserGuide = false">
            <span>← 返回</span>
          </button>
          <h3>📖 {{ currentLanguage === 'zh' ? '使用指南' : 'User Guide' }}</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body privacy-content">
          <h4>一、快速开始</h4>
          <p><strong>创建任务</strong></p>
          <ul>
            <li>点击"展开"按钮（▼）显示任务创建表单</li>
            <li>输入任务名称后，自动展开其他属性选项</li>
            <li>选择任务类型、分类、优先级、时长/规模</li>
            <li>点击"✓"按钮完成创建</li>
          </ul>

          <p><strong>任务类型说明</strong></p>
          <ul>
            <li><strong>今天/明天/本周</strong>：短期任务，可选择时长（快速/正常/较长）</li>
            <li><strong>指定日期</strong>：长期任务，可选择规模（小型/中型/大型）</li>
            <li><strong>每天重复</strong>：每天都要完成的习惯任务</li>
            <li><strong>工作日重复</strong>：周一至周五重复</li>
            <li><strong>每周重复</strong>：选择特定星期几重复</li>
          </ul>

          <h4>二、任务管理</h4>
          <ul>
            <li><strong>完成任务</strong>：点击任务前的复选框</li>
            <li><strong>查看详情</strong>：点击任务标题或描述</li>
            <li><strong>编辑任务</strong>：在详情页点击"编辑任务"</li>
            <li><strong>删除任务</strong>：点击任务右侧的🗑️图标</li>
            <li><strong>恢复任务</strong>：在回收站中点击"恢复"</li>
            <li><strong>置顶任务</strong>：点击📌按钮将重要任务置顶</li>
          </ul>

          <h4>三、任务执行日志 💬</h4>
          <ul>
            <li><strong>添加日志</strong>：任务详情页 → 添加日志</li>
            <li><strong>6种日志类型</strong>：开始/进展/阻碍/方案/里程碑/完成</li>
            <li><strong>记录进度</strong>：每次日志可标注进度百分比</li>
            <li><strong>耗时追踪</strong>：记录每次推进的耗时</li>
            <li><strong>心情追踪</strong>：记录执行过程中的心情状态</li>
            <li><strong>查看统计</strong>：任务详情页查看执行统计数据</li>
          </ul>

          <h4>四、番茄钟计时器 🍅</h4>
          <ul>
            <li><strong>启动番茄钟</strong>：任务卡片点击🍅按钮</li>
            <li><strong>专注模式</strong>：25分钟专注 + 5分钟休息</li>
            <li><strong>长休息</strong>：每4个番茄钟后15分钟长休息</li>
            <li><strong>查看历史</strong>：个人主页 → 番茄钟统计</li>
            <li><strong>今日统计</strong>：查看今日专注时长和完成数</li>
          </ul>

          <h4>五、AI 功能 🤖</h4>
          <p><strong>AI 任务拆分</strong></p>
          <ul>
            <li>任务创建区点击"AI拆分"按钮</li>
            <li>输入任务标题和描述</li>
            <li>选择拆分模板（快速/详细/时间优先/优先级优先）</li>
            <li>预览并编辑子任务，一键创建</li>
          </ul>

          <p><strong>AI 智能问答</strong></p>
          <ul>
            <li>点击左下角🤖按钮打开AI问答</li>
            <li>用自然语言询问任务相关问题</li>
            <li>6个快捷问题一键获取洞察</li>
            <li>支持多模型（OpenAI/Ollama/自定义）</li>
          </ul>

          <p><strong>AI 主动助手</strong></p>
          <ul>
            <li><strong>智能提醒</strong>：自动检测逾期和待办任务</li>
            <li><strong>每日总结</strong>：每日工作总结 + AI建议</li>
            <li><strong>报告生成</strong>：周报/月报/季报/年报自动生成</li>
          </ul>

          <h4>六、任务依赖关系 🔗</h4>
          <ul>
            <li><strong>设置依赖</strong>：任务详情页 → 设置依赖关系</li>
            <li><strong>等待任务</strong>：选择需要等待完成的任务</li>
            <li><strong>自动通知</strong>：依赖任务完成后自动通知</li>
            <li><strong>状态显示</strong>：🔒等待中 / 🔓被依赖 / ✅无依赖</li>
          </ul>

          <h4>七、筛选与搜索</h4>
          <ul>
            <li><strong>快速筛选</strong>：点击统计卡片（全部/已完成/待办/已逾期）</li>
            <li><strong>高级筛选</strong>：点击🎛️按钮，可按日期/分类/优先级筛选</li>
            <li><strong>关键字搜索</strong>：在搜索框输入关键词</li>
            <li><strong>重置筛选</strong>：点击⟳刷新按钮</li>
          </ul>

          <h4>八、数据管理</h4>
          <p><strong>Excel 导入导出</strong></p>
          <ul>
            <li>个人主页 → 数据管理 → 导出Excel</li>
            <li>个人主页 → 数据管理 → 导入Excel</li>
            <li>个人主页 → 数据管理 → 下载模板</li>
          </ul>

          <p><strong>完整备份（推荐）</strong></p>
          <ul>
            <li>个人主页 → 数据管理 → 导出完整备份（JSON）</li>
            <li>包含任务+日志+番茄钟+用户信息（100%数据）</li>
            <li>支持一键导入恢复所有数据</li>
          </ul>

          <p><strong>拍照识别</strong></p>
          <ul>
            <li>任务创建区点击📷按钮</li>
            <li>拍照识别文字，自动填充任务标题</li>
            <li>支持中英文混合识别（离线OCR）</li>
          </ul>

          <h4>九、常见问题</h4>
          <p><strong>Q: 如何修改用户名？</strong></p>
          <p>A: 点击右上角头像 → 个人主页 → 修改用户名</p>

          <p><strong>Q: 数据存储在哪里？</strong></p>
          <p>A: 所有数据存储在设备本地，完全离线，不会上传到服务器</p>

          <p><strong>Q: 如何备份数据？</strong></p>
          <p>A: 推荐使用"导出完整备份"功能，包含100%数据</p>

          <p><strong>Q: 卸载应用会丢失数据吗？</strong></p>
          <p>A: 是的，卸载前请先导出数据备份</p>

          <p><strong>Q: 如何配置AI功能？</strong></p>
          <p>A: 个人主页 → AI配置 → 添加模型 → 设置为默认</p>
        </div>
      </div>
    </div>

    <!-- 番茄规则弹窗 -->
    <div v-if="showPomodoroRules" class="modal-overlay" @click.self="showPomodoroRules = false">
      <div class="modal-content privacy-modal">
        <div class="modal-header">
          <h3>🍅 {{ currentLanguage === 'zh' ? '番茄奖励规则' : 'Pomodoro Rules' }}</h3>
          <button class="close-btn" @click="showPomodoroRules = false">&times;</button>
        </div>
        <div class="modal-body privacy-content">
          <h4>一、基础规则</h4>
          <ul>
            <li>1个番茄 = 25分钟工作时间</li>
            <li>番茄数根据任务类型、时长/规模、优先级综合计算</li>
            <li>完成任务获得番茄，逾期任务扣除番茄</li>
          </ul>

          <h4>二、计算公式</h4>
          
          <p><strong>短期任务（今天/明天/本周）</strong></p>
          <ul>
            <li>快速(0.5h) × 2 × 优先级系数 = 0.75-1.5个番茄</li>
            <li>正常(2h) × 2 × 优先级系数 = 3-6个番茄</li>
            <li>较长(4h) × 2 × 优先级系数 = 6-12个番茄</li>
          </ul>

          <p><strong>长期任务（指定日期）</strong></p>
          <ul>
            <li>小型项目 × 优先级系数 = 7.5-15个番茄</li>
            <li>中型项目 × 优先级系数 = 22.5-45个番茄</li>
            <li>大型项目 × 优先级系数 = 75-150个番茄</li>
          </ul>

          <p><strong>重复任务（每天/工作日/每周）</strong></p>
          <ul>
            <li>单次固定 2 × 优先级系数 = 1.5-3个番茄</li>
            <li>累计效应明显（坚持30天 = 45-90个番茄）</li>
          </ul>

          <p><strong>已完成任务（跨度>1天）</strong></p>
          <ul>
            <li>实际天数 × 2 × 优先级系数</li>
            <li>最多300个番茄封顶</li>
            <li>示例：4个月任务(高优先级) = 300个番茄</li>
          </ul>

          <h4>三、优先级系数</h4>
          <ul>
            <li><strong>高优先级</strong>：1.5倍</li>
            <li><strong>中优先级</strong>：1.0倍</li>
            <li><strong>低优先级</strong>：0.75倍</li>
          </ul>

          <h4>四、统计说明</h4>
          <ul>
            <li><strong>已获得</strong>：完成任务获得的番茄总数</li>
            <li><strong>待获得</strong>：待完成任务的预估番茄数</li>
            <li><strong>逾期扣除</strong>：逾期任务扣除的番茄数</li>
            <li><strong>净获得</strong>：已获得 - 逾期扣除</li>
          </ul>

          <h4>五、实际耗时</h4>
          <p>已完成任务会显示实际耗时（完成时间 - 创建时间），帮助你了解真实的时间投入。</p>
        </div>
      </div>
    </div>

    <!-- 更新日志弹窗 -->
    <!-- 更新日志弹窗 (Bottom Sheet) -->
    <div v-if="showChangelog" class="modal-overlay" @click.self="showChangelog = false">
      <div class="bottom-sheet">
        <div class="modal-header">
          <h3>📋 {{ currentLanguage === 'zh' ? '更新日志' : 'Changelog' }}</h3>
          <button class="close-btn" @click="showChangelog = false">&times;</button>
        </div>
        <div class="modal-body privacy-content">
          <div class="changelog-section">
            <h4>v1.6.0 (2026-02-21)</h4>
            <p class="version-tag">{{ currentLanguage === 'zh' ? '当前版本' : 'Current Version' }}</p>
            <ul>
              <li>{{ currentLanguage === 'zh' ? 'UI视觉系统全面升级' : 'Complete UI visual system upgrade' }}</li>
              <li>{{ currentLanguage === 'zh' ? '统计区域主次分明，色彩语义化' : 'Statistics area with clear hierarchy and semantic colors' }}</li>
              <li>{{ currentLanguage === 'zh' ? '创建任务区凹陷感设计' : 'Task creation area with inset design' }}</li>
              <li>{{ currentLanguage === 'zh' ? '右上角胶囊化封装（iOS风格）' : 'Top-right capsule design (iOS style)' }}</li>
              <li>{{ currentLanguage === 'zh' ? '任务列表标签严格对齐' : 'Task list tags strictly aligned' }}</li>
              <li>{{ currentLanguage === 'zh' ? '高级筛选弹窗紧凑化' : 'Advanced filter modal compacted' }}</li>
              <li>{{ currentLanguage === 'zh' ? '筛选和展开按钮添加中文注释' : 'Filter and expand buttons with text labels' }}</li>
            </ul>
          </div>

          <div class="changelog-section">
            <h4>v1.5.9 (2026-02-21)</h4>
            <ul>
              <li>{{ currentLanguage === 'zh' ? '修复待办统计与筛选不一致bug' : 'Fixed pending tasks filter inconsistency' }}</li>
              <li>{{ currentLanguage === 'zh' ? '优化所有弹窗的左右留白' : 'Optimized modal padding' }}</li>
            </ul>
          </div>

          <div class="changelog-section">
            <h4>v1.5.8 (2026-02-21)</h4>
            <ul>
              <li>{{ currentLanguage === 'zh' ? '筛选按钮移至统计栏' : 'Filter button moved to stats bar' }}</li>
              <li>{{ currentLanguage === 'zh' ? '统一按钮高度，视觉更协调' : 'Unified button height' }}</li>
            </ul>
          </div>

          <div class="changelog-link">
            <a href="https://github.com/zhaosj0315/TO-DO/blob/main/CHANGELOG.md" target="_blank" class="footer-link">
              {{ currentLanguage === 'zh' ? '📖 查看完整更新日志' : '📖 View Full Changelog' }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <!-- 修改密码 (Bottom Sheet) -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="settings-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showPasswordModal = false">
            <span>← 返回</span>
          </button>
          <h3>🔒 {{ t('changePassword') }}</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ t('currentPassword') }}</label>
            <input 
              v-model="oldPassword" 
              type="password" 
              class="input" 
              :placeholder="t('currentPasswordPlaceholder')"
            >
          </div>
          <div class="form-group">
            <label>{{ t('newPassword') }}</label>
            <input 
              v-model="newPassword" 
              type="password" 
              class="input" 
              :placeholder="t('newPasswordPlaceholder')"
            >
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" @click="showPasswordModal = false">{{ t('cancel') }}</button>
            <button class="btn btn-primary" @click="updatePassword">{{ t('confirmChange') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 绑定手机号弹窗 -->
    <!-- 绑定手机号 (Bottom Sheet) -->
    <div v-if="showPhoneModal" class="modal-overlay" @click.self="showPhoneModal = false">
      <div class="settings-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showPhoneModal = false">
            <span>← 返回</span>
          </button>
          <h3>📱 {{ t('bindPhone') }}</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body">
          <div v-if="userProfileInfo.boundPhone">
            <div class="bound-phone-display">
              <p class="phone-number">{{ userProfileInfo.boundPhone }}</p>
              <p class="phone-hint">{{ t('boundPhoneHint') }}</p>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" @click="showPhoneModal = false">{{ t('close') }}</button>
              <button class="btn btn-danger" @click="unbindPhone">{{ t('unbind') }}</button>
            </div>
          </div>
          <div v-else>
            <div class="form-group">
              <label>{{ t('phoneNumber') }}</label>
              <input 
                v-model="bindPhoneNumber" 
                type="tel" 
                class="input" 
                :placeholder="t('phoneNumberPlaceholder')"
                maxlength="11"
              >
            </div>
            <div class="form-group">
              <label>{{ t('verificationCode') }}</label>
              <div class="verification-row">
                <input 
                  v-model="bindVerificationCode" 
                  type="text" 
                  class="input" 
                  :placeholder="t('verificationCodePlaceholder')"
                  maxlength="6"
                >
                <button 
                  class="btn btn-secondary" 
                  :disabled="bindCountdown > 0"
                  @click="sendBindSMS"
                >
                  {{ bindCountdown > 0 ? `${bindCountdown}s` : t('getVerificationCode') }}
                </button>
              </div>
            </div>
            <p class="bind-hint">{{ t('bindHint') }}</p>
            <div class="form-actions">
              <button class="btn btn-secondary" @click="showPhoneModal = false">{{ t('cancel') }}</button>
              <button class="btn btn-primary" @click="confirmBindPhone">{{ t('confirmBind') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 星期选择模态框 - 每周重复 -->
    <div v-if="showWeeklyModal" class="modal-overlay" @click.self="showWeeklyModal = false" style="z-index: 10001;">
      <div class="modal-content glass-card" style="background: white; max-width: 450px; width: 96%; padding: 1rem;">
        <div class="modal-header">
          <h3>{{ t('selectRepeatDays') }}</h3>
          <button class="close-btn" @click="showWeeklyModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="weekly-selector-grid">
            <label v-for="(day, index) in weekdays" :key="index" class="weekday-checkbox-item">
              <input type="checkbox" :value="index" v-model="selectedWeekdays">
              <span class="weekday-name">{{ day }}</span>
            </label>
          </div>
          <div class="modal-actions" style="margin-top: 2rem;">
            <button class="btn btn-primary" style="width: 100%;" @click="confirmWeeklySelect">确定</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义日期时间选择器（日历样式） -->
    <CalendarPicker
      v-if="showCustomDateModal"
      :initial-value="customDateTime"
      @close="showCustomDateModal = false"
      @confirm="handleCalendarConfirm"
    />

    <!-- 任务详情 & 编辑 Bottom Sheet（统一入口） -->
    <div v-if="editingTask" class="bottom-sheet-overlay" @click.self="editingTask = null">
      <div class="bottom-sheet edit-bottom-sheet">
        <div class="bottom-sheet-header">
          <div class="sheet-handle"></div>
          <h3>📋 {{ editingTask.text }}</h3>
          <button class="close-btn" @click="editingTask = null">&times;</button>
        </div>
        <div class="bottom-sheet-body edit-sheet-body">
          
          <!-- 时间轴 -->
          <div class="edit-section timeline-section">
            <div class="section-title">⏰ 时间进度</div>
            <div class="timeline-container">
              <div class="timeline-item">
                <div class="timeline-dot created"></div>
                <div class="timeline-content">
                  <div class="timeline-label">创建</div>
                  <div class="timeline-value">{{ formatTimelineMini(editingTask.created_at) }}</div>
                </div>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-item">
                <div :class="['timeline-dot', getDeadlineClass(editingTask)]"></div>
                <div class="timeline-content">
                  <div class="timeline-label">截止</div>
                  <div class="timeline-value">{{ formatDeadlineMini(editingTask) }}</div>
                </div>
              </div>
              <template v-if="editingTask.completed_at">
                <div class="timeline-line completed"></div>
                <div class="timeline-item">
                  <div class="timeline-dot completed"></div>
                  <div class="timeline-content">
                    <div class="timeline-label">完成</div>
                    <div class="timeline-value">{{ formatTimelineMini(editingTask.completed_at) }}</div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 执行统计（如果有日志） -->
          <div v-if="editingTask.stats && editingTask.stats.totalLogs > 0" class="edit-section stats-mini-section">
            <div class="section-title">📈 执行统计</div>
            <div class="stats-mini-grid">
              <div class="stat-mini-item">
                <span class="stat-mini-value">{{ editingTask.stats.sessionCount }}</span>
                <span class="stat-mini-label">推进次数</span>
              </div>
              <div class="stat-mini-item">
                <span class="stat-mini-value">{{ formatDurationMini(editingTask.stats.totalDuration) }}</span>
                <span class="stat-mini-label">总耗时</span>
              </div>
              <div class="stat-mini-item">
                <span class="stat-mini-value">{{ editingTask.stats.blockCount }}</span>
                <span class="stat-mini-label">遇到阻碍</span>
              </div>
              <div class="stat-mini-item">
                <span class="stat-mini-value">{{ editingTask.stats.resolvedBlockCount }}</span>
                <span class="stat-mini-label">已解决</span>
              </div>
            </div>
          </div>

          <!-- 执行日志完整列表 -->
          <div class="edit-section logs-full-section">
            <div class="section-title">💬 执行日志 ({{ editingTask.logs?.length || 0 }}条)</div>
            
            <div v-if="!editingTask.logs || editingTask.logs.length === 0" class="empty-logs-mini">
              <p>📝 还没有执行日志</p>
              <p class="hint-mini">点击下方"添加日志"开始记录</p>
            </div>

            <div v-else class="logs-full-list">
              <div
                v-for="log in sortedLogs(editingTask)"
                :key="log.id"
                :class="['log-full-item', `log-${log.type}`]"
              >
                <!-- 第一行：类型、进度、时间、删除按钮 -->
                <div class="log-full-header">
                  <span class="log-type-full">
                    {{ getLogTypeIcon(log.type) }} {{ getLogTypeText(log.type) }}
                    <span v-if="log.progress !== null" class="progress-inline">📊 {{ log.progress }}%</span>
                  </span>
                  <span class="log-time-full">{{ formatLogTimeFull(log.timestamp) }}</span>
                  <button class="log-delete-btn-mini" @click="deleteLogFromEdit(log.id)" title="删除日志">🗑️</button>
                </div>
                
                <!-- 第二行：日志内容编辑区 -->
                <div class="edit-field" style="margin-top: 0.5rem;">
                  <textarea 
                    v-model="log.content"
                    @blur="saveEditingTask"
                    @input="autoResizeTextarea($event)"
                    class="input textarea log-content-textarea-mini" 
                    placeholder="输入日志内容..."
                    rows="3"
                    maxlength="500"
                  ></textarea>
                  <div class="char-count">{{ (log.content || '').length }}/500 · {{ (log.content || '').split('\n').length }} 行</div>
                </div>
                
                <!-- 第三行：元数据（耗时、心情、标签） -->
                <div v-if="log.duration || log.mood || log.tags?.length" class="log-meta-full">
                  <span v-if="log.duration" class="meta-item-full">⏱️ {{ formatDurationMini(log.duration) }}</span>
                  <span v-if="log.mood" class="meta-item-full">{{ getMoodIcon(log.mood) }}</span>
                  <span v-if="log.tags?.length" class="meta-item-full">
                    <span v-for="tag in log.tags" :key="tag" class="log-tag-inline">#{{ tag }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 添加日志按钮 -->
            <button class="btn-add-log-inline" @click="openAddLogModal(editingTask)">
              📝 添加执行日志
            </button>
          </div>

          <!-- 基本信息组 -->
          <!-- 基本信息组 -->
          <div class="edit-section">
            <div class="section-title">📝 基本信息</div>
            <div class="edit-field">
              <label class="field-label">✏️ 任务名称</label>
              <input 
                v-model="editText" 
                class="input edit-input" 
                :placeholder="currentLanguage === 'zh' ? '输入任务名称...' : 'Task name'"
                maxlength="100"
              >
              <div class="char-count">{{ editText.length }}/100</div>
            </div>
            <div class="edit-field">
              <label class="field-label">📄 详细描述</label>
              <textarea 
                ref="editDescriptionTextarea"
                v-model="editDescription" 
                class="input textarea edit-textarea" 
                :placeholder="currentLanguage === 'zh' ? '添加更多细节描述... 提示：输入 # 添加标签，输入 [[ 链接任务' : 'Add more details... Tip: # for tags, [[ for links'"
                rows="4"
                maxlength="500"
                @input="handleAutocompleteInput"
              ></textarea>
              <div class="char-count">{{ (editDescription || '').length }}/500 · {{ (editDescription || '').split('\n').length }} 行</div>
            </div>
          </div>

          <!-- 任务属性组 -->
          <div class="edit-section">
            <div class="section-title">⚙️ 任务属性</div>
            <div class="edit-row">
              <div class="edit-field edit-field-half">
                <label class="field-label">🏷️ 任务分类</label>
                <select v-model="editCategory" class="input edit-select">
                  <option value="work">💼 {{ t('work') }}</option>
                  <option value="study">📚 {{ t('study') }}</option>
                  <option value="life">🏠 {{ t('life') }}</option>
                </select>
              </div>
              <div class="edit-field edit-field-half">
                <label class="field-label">⚡ 优先级</label>
                <select v-model="editPriority" class="input edit-select">
                  <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="edit-field">
              <label class="field-label">📅 时间安排</label>
              <select v-model="editType" class="input edit-select" @change="handleEditTypeChange">
                <option value="today">📌 {{ t('today') }}</option>
                <option value="tomorrow">🌅 {{ t('tomorrow') }}</option>
                <option value="day_after_tomorrow">📆 {{ t('dayAfterTomorrow') }}</option>
                <option value="this_week">📆 {{ t('thisWeek') }}</option>
                <option value="next_week">📅 {{ t('nextWeek') }}</option>
                <option value="this_month">📅 {{ t('thisMonth') }}</option>
                <option value="daily">🔄 {{ t('daily') }}</option>
                <option value="weekday">💼 {{ t('weekday') }}</option>
                <option value="custom_date">🗓️ {{ editCustomDateTime ? formatDisplayDateTime(editCustomDateTime) : t('customDate') }}</option>
                <option value="weekly">📊 {{ editWeekdays.length > 0 ? formatSelectedWeekdays(editWeekdays) : t('weekly') }}</option>
                <option value="monthly">🔄 {{ t('monthly') }}</option>
              </select>
            </div>
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
          </div>
          <div class="modal-actions edit-actions">
            <button class="btn btn-secondary btn-cancel" @click="editingTask = null">
              ✕ {{ t('cancel') }}
            </button>
            <button class="btn btn-primary btn-save" @click="saveTaskEdit">
              ✓ {{ t('save') }}{{ currentLanguage === 'zh' ? '更改' : ' Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加日志弹窗 -->
    <AddLogModal
      v-if="showAddLogModal && currentLogTask"
      ref="addLogModalRef"
      :task="currentLogTask"
      @close="showAddLogModal = false; currentLogTask = null"
      @submit="handleAddLog"
    />

    <!-- 任务详情弹窗 -->
    <TaskDetailModal
      v-if="showTaskDetail && selectedTask"
      ref="taskDetailModalRef"
      :task="selectedTask"
      @close="showTaskDetail = false; selectedTask = null"
      @refresh="handleTaskDetailRefresh"
      @split="handleSplitTask"
      @show-loading="handleShowLoading"
      @hide-loading="handleHideLoading"
      @notify="handleTaskNotify"
      @showManualSubtask="handleShowManualSubtask"
    />

    <!-- 🆕 任务输入预览弹窗 -->
    <TaskDetailModal
      v-if="showTaskInputPreview && previewTaskData"
      :task="previewTaskData"
      :is-preview="true"
      @close="showTaskInputPreview = false; previewTaskData = null"
      @save="saveTaskFromPreview"
      @split="handlePreviewSplit"
      @notify="handleTaskNotify"
      @showManualSubtask="handleShowManualSubtask"
    />

    <!-- 子任务预览弹窗 -->
    <SubtaskPreviewModal
      :visible="showSubtaskPreview"
      :original-task="currentSplittingTask"
      :subtasks="subtasks"
      @close="showSubtaskPreview = false"
      @create="handleCreateSubtasks"
    />

    <!-- 手动添加子任务弹窗 -->
    <AddSubtaskModal
      v-if="manualSubtaskParent"
      :visible="showManualSubtaskModal"
      :parent-task="manualSubtaskParent"
      :initial-data="manualSubtaskData"
      @close="showManualSubtaskModal = false; manualSubtaskParent = null; manualSubtaskData = null"
      @submit="handleManualSubtaskSubmit"
    />

    <!-- 演示模式 -->
    <TutorialMode
      :active="showTutorial"
      @close="handleTutorialSkip"
      @finish="handleTutorialFinish"
    />

    <!-- 每日总结 -->
    <DailySummaryModal
      :visible="showDailySummary"
      @close="showDailySummary = false"
      @generate-report="handleGenerateWeeklyReport"
    />

    <!-- AI 报告 -->
    <AIReportModal
      :visible="showAIReport"
      :tasks="taskStore.tasks"
      :initialReportType="customReportConfig.type"
      :customDateRange="customReportConfig.type === 'custom' ? { startDate: customReportConfig.startDate, endDate: customReportConfig.endDate } : null"
      @close="showAIReport = false"
      @report-generated="handleReportGenerated"
    />

    <!-- 智能任务分解 -->
    <SmartTaskSplitter
      v-if="taskToSplit"
      :visible="showTaskSplitter"
      :task-title="taskToSplit.text"
      :task-description="taskToSplit.description"
      :parent-task="taskToSplit"
      @close="showTaskSplitter = false; taskToSplit = null"
      @create="handleSubtaskCreate"
    />


    <!-- AI问答 -->
    <AIChat
      :visible="showAIChat"
      :tasks-data="{ tasks: taskStore.tasks, deletedTasks: taskStore.deletedTasks }"
      @close="showAIChat = false"
      @openConfig="showAIConfig = true"
      @createTasks="handleChatCreateTasks"
    />

    <!-- AI提取任务预览（复用SmartTaskSplitter） -->
    <SmartTaskSplitter
      :visible="showAITaskPreview"
      :parent-task="null"
      :initial-subtasks="aiExtractedTasks"
      @close="showAITaskPreview = false"
      @confirm="handleConfirmAITasks"
    />

    <!-- AI模型配置 -->
    <AIModelConfig
      :visible="showAIConfig"
      @close="showAIConfig = false"
    />

    <!-- AI生成预览弹窗 -->
    <AIPreviewModal
      :visible="showAIPreview"
      :content="aiPreviewContent"
      :title="aiPreviewTitle"
      :loading="aiLoading"
      @close="showAIPreview = false"
      @adopt="handleAdoptAIContent"
      @regenerate="handleRegenerateAI"
    />

    <!-- 快捷模板选择器 -->
    <TemplateSelector
      :visible="showTemplateSelector"
      @close="showTemplateSelector = false"
      @select="handleTemplateSelect"
    />

    <!-- 统一加载动画 -->
    <LoadingSpinner
      :visible="aiLoading"
      :text="aiLoadingText"
      :sub-text="aiLoadingSubText"
    />

    <!-- 文件预览弹窗 -->
    <FilePreviewModal
      :visible="showFilePreview"
      :file="previewFile"
      @close="showFilePreview = false"
    />

    <!-- 全屏任务描述编辑 (三段式移动端布局) -->
    <div v-if="showFullscreenDesc" class="fullscreen-desc-overlay">
      <div class="fullscreen-desc-header">
        <!-- 顶层：导航栏 -->
        <div class="nav-bar">
          <div class="task-name-left">
            <input 
              v-model="quickTaskInput" 
              type="text" 
              class="task-name-input"
              placeholder="任务标题"
              @keydown.enter.prevent
            />
          </div>
          <div class="nav-buttons">
            <button class="nav-btn-secondary" @click="closeFullscreenDesc">完成</button>
            <button class="nav-btn-primary" @click="previewTask">预览</button>
          </div>
        </div>
        
        <!-- 中层：状态栏 + Markdown切换 -->
        <div class="status-bar">
          <div class="status-left">
            <span v-if="descEditDuration > 0" class="status-text">编辑 {{ descEditDuration }} 秒</span>
            <span v-if="newTaskDescription.length > 0" class="status-text">{{ newTaskDescription.length }} 字</span>
            <!-- 🆕 Markdown 切换按钮 -->
            <button 
              v-if="newTaskDescription.length > 0"
              class="markdown-toggle-btn" 
              @click="toggleMarkdownPreview"
              :class="{ active: isMarkdownPreview }"
            >
              {{ isMarkdownPreview ? '✏️ 编辑' : '👁️ 预览' }}
            </button>
          </div>
          <div class="status-right">
            <span class="status-text">{{ currentDateTime }}</span>
          </div>
        </div>
      </div>
      
      <!-- 输入区 -->
      <div class="input-wrapper">
        <!-- AI 智能建议卡片 -->
        <div v-if="showAISuggestions && aiSuggestionsList.length > 0" class="ai-suggestions-card">
          <div class="suggestions-header">
            <span>💡 AI 建议</span>
            <button @click="showAISuggestions = false" class="btn-close-suggestions">✕</button>
          </div>
          <ul class="suggestions-list">
            <li v-for="(suggestion, index) in aiSuggestionsList" :key="index">
              {{ suggestion }}
            </li>
          </ul>
          <div class="suggestions-actions">
            <button @click="adoptSuggestions" class="btn-adopt">✓ 采纳建议</button>
            <button @click="showAISuggestions = false" class="btn-ignore">✕ 忽略</button>
          </div>
        </div>
        
        <!-- 剪贴板历史选择器 -->
        <div v-if="showClipboardHistory" class="clipboard-history-sheet">
          <div class="history-header">
            <span>📋 最近粘贴</span>
            <button @click="showClipboardHistory = false" class="btn-close-history">✕</button>
          </div>
          <div class="history-tip">长按"📋 粘贴"按钮可打开此列表</div>
          <div class="history-list">
            <div 
              v-for="(item, index) in clipboardHistory" 
              :key="index"
              class="history-item"
              @click="selectClipboardItem(item.text)"
            >
              <div class="history-text">{{ item.text.substring(0, 100) }}{{ item.text.length > 100 ? '...' : '' }}</div>
              <div class="history-time">{{ item.time }}</div>
            </div>
          </div>
          <div class="history-footer">
            <button @click="clearClipboardHistory" class="btn-clear-history">🗑️ 清空历史</button>
          </div>
        </div>
        
        <!-- AI 功能菜单 -->
        <div v-if="showAIMenu" class="ai-menu-sheet">
          <div class="menu-header">
            <span>🤖 AI 助手</span>
            <button @click="showAIMenu = false" class="btn-close-menu">✕</button>
          </div>
          <div class="menu-list">
            <!-- 第一组：生成内容 -->
            <button 
              class="menu-item" 
              @click="handleAIAction('generateTitle')"
              :disabled="!newTaskDescription.trim()"
            >
              <span class="menu-icon">✨</span>
              <div class="menu-content">
                <div class="menu-title">生成标题</div>
                <div class="menu-desc">根据描述智能生成标题</div>
              </div>
            </button>
            <button 
              class="menu-item" 
              @click="handleAIAction('suggestion')"
              :disabled="!quickTaskInput.trim()"
            >
              <span class="menu-icon">💡</span>
              <div class="menu-content">
                <div class="menu-title">生成描述</div>
                <div class="menu-desc">基于标题生成任务描述</div>
              </div>
            </button>
            <button 
              class="menu-item" 
              @click="handleAIAction('continue')"
              :disabled="!newTaskDescription.trim()"
            >
              <span class="menu-icon">📝</span>
              <div class="menu-content">
                <div class="menu-title">续写内容</div>
                <div class="menu-desc">智能补充当前描述</div>
              </div>
            </button>
            
            <!-- 第二组：优化内容 -->
            <button 
              class="menu-item" 
              @click="handleAIAction('polish')"
              :disabled="!newTaskDescription.trim()"
            >
              <span class="menu-icon">🎯</span>
              <div class="menu-content">
                <div class="menu-title">优化润色</div>
                <div class="menu-desc">改善表达和结构</div>
              </div>
            </button>
            <button 
              class="menu-item" 
              @click="handleAIAction('extract')"
              :disabled="!newTaskDescription.trim() || newTaskDescription.length < 50"
            >
              <span class="menu-icon">📋</span>
              <div class="menu-content">
                <div class="menu-title">提取要点</div>
                <div class="menu-desc">从长文本提取关键步骤</div>
              </div>
            </button>
            <button 
              class="menu-item" 
              @click="handleAIAction('rewrite')"
              :disabled="!newTaskDescription.trim()"
            >
              <span class="menu-icon">🔄</span>
              <div class="menu-content">
                <div class="menu-title">改写风格</div>
                <div class="menu-desc">正式/口语/简洁风格切换</div>
              </div>
            </button>
            
            <!-- 第三组：格式化 -->
            <button 
              class="menu-item" 
              @click="handleAIAction('markdown')"
              :disabled="!newTaskDescription.trim()"
            >
              <span class="menu-icon">📐</span>
              <div class="menu-content">
                <div class="menu-title">Markdown 渲染</div>
                <div class="menu-desc">一键格式化为 Markdown</div>
              </div>
            </button>
          </div>
        </div>
        
        <!-- 悬浮提示标签 -->
        <div v-if="newTaskDescription.length < 50 && !isMarkdownPreview" class="floating-hint">
          {{ getWordCountHint() }}
        </div>
        
        <!-- 🆕 Markdown 预览模式 -->
        <div v-if="isMarkdownPreview" class="markdown-preview-container">
          <MarkdownRenderer :content="newTaskDescription" :media="tempMedia" />
        </div>
        
        <!-- 编辑模式 -->
        <textarea
          v-else
          ref="descriptionTextarea"
          v-model="newTaskDescription"
          class="fullscreen-desc-textarea"
          placeholder="输入任务描述（可选）... 提示：输入 # 添加标签，输入 [[ 链接任务"
          autofocus
          @input="handleAutocompleteInput"
        ></textarea>
      </div>
      
      <!-- 底部工具栏 -->
      <div class="toolbar">
        <button 
          class="toolbar-btn" 
          @click="pasteFromClipboard"
          @contextmenu.prevent="showPasteHistory"
          @touchstart="handlePasteTouchStart"
          @touchend="handlePasteTouchEnd"
        >
          📋 粘贴
        </button>
        <button class="toolbar-btn" @click="clearDescription">
          🔄 清空
        </button>
        <button class="toolbar-btn" @click="pickImageForTask" :disabled="aiLoading">
          🖼️ 图片
        </button>
        <button class="toolbar-btn" @click="pickFileForTask" :disabled="aiLoading">
          📎 文件
        </button>
        <button 
          class="toolbar-btn" 
          @click="toggleAIMenu" 
          @touchstart="handleAITouchStart"
          @touchend="handleAITouchEnd"
          :disabled="aiLoading"
        >
          {{ aiLoading ? '⏳ 思考中...' : '🤖 AI 助手' }}
        </button>
      </div>
    </div>

    <!-- AI结果弹窗 -->
    <div v-if="showAIResult" class="modal-overlay" @click.self="showAIResult = false">
      <div class="modal-content glass-card" style="max-width: 600px; width: 96%;">
        <div class="modal-header">
          <h3>✨ AI{{ aiResultAction }}结果</h3>
          <button class="close-btn" @click="showAIResult = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="ai-result-text">{{ aiResultText }}</div>
          <div class="ai-result-actions">
            <button @click="copyAIResult" class="btn btn-primary">📋 复制</button>
            <button @click="showAIResult = false" class="btn btn-secondary">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 备份管理弹窗 (Bottom Sheet) -->
    <div v-if="showBackupList" class="modal-overlay" @click.self="showBackupList = false">
      <div class="bottom-sheet">
        <div class="modal-header">
          <h3>♻️ {{ t('backupManagement') }}</h3>
          <button class="close-btn" @click="showBackupList = false">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: #666; margin-bottom: 1rem;">{{ t('backupListDesc') }}</p>
          
          <div v-if="backupFiles.length === 0" style="text-align: center; padding: 2rem; color: #999;">
            {{ t('noBackups') }}
          </div>
          
          <div v-else class="backup-list">
            <div v-for="file in backupFiles" :key="file.name" class="backup-item">
              <div class="backup-info">
                <div class="backup-name">{{ file.name }}</div>
                <div class="backup-date">{{ formatBackupDate(file.name) }} · {{ file.taskCount || '?' }} 个任务</div>
              </div>
              <div class="backup-actions">
                <button class="btn-restore-small" @click="handleRestore(file.name)">
                  恢复
                </button>
                <button class="btn-delete-small" @click="handleDeleteBackup(file.name)">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入预览弹窗 -->
    <div v-if="showImportPreview" class="modal-overlay" @click.self="cancelImport">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="cancelImport">
            <span>← 返回</span>
          </button>
          <h3>📋 导入预览</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body" v-if="importPreviewData">
          <!-- 统计摘要 -->
          <div class="import-summary">
            <div class="summary-item">
              <div class="summary-icon">📊</div>
              <div class="summary-content">
                <div class="summary-label">总计</div>
                <div class="summary-value">{{ importPreviewData.analysis.total }} 条</div>
              </div>
            </div>
            <div class="summary-item success">
              <div class="summary-icon">✅</div>
              <div class="summary-content">
                <div class="summary-label">新增</div>
                <div class="summary-value">{{ importPreviewData.analysis.newTasks.length }} 条</div>
              </div>
            </div>
            <div class="summary-item warning">
              <div class="summary-icon">⚠️</div>
              <div class="summary-content">
                <div class="summary-label">重复</div>
                <div class="summary-value">{{ importPreviewData.analysis.duplicates.length }} 条</div>
              </div>
            </div>
            <div class="summary-item error">
              <div class="summary-icon">❌</div>
              <div class="summary-content">
                <div class="summary-label">错误</div>
                <div class="summary-value">{{ importPreviewData.analysis.errors.length }} 条</div>
              </div>
            </div>
          </div>
          
          <!-- 详细列表 -->
          <div class="import-details">
            <!-- 新增任务 -->
            <div v-if="importPreviewData.analysis.newTasks.length > 0" class="detail-section">
              <h4>✅ 新增任务 ({{ importPreviewData.analysis.newTasks.length }})</h4>
              <div class="task-preview-list">
                <div v-for="task in importPreviewData.analysis.newTasks.slice(0, 5)" :key="task.row" class="task-preview-item">
                  <span class="task-name">{{ task.name }}</span>
                  <span class="task-meta">{{ task.category }} · {{ task.priority }}</span>
                </div>
                <div v-if="importPreviewData.analysis.newTasks.length > 5" class="more-hint">
                  还有 {{ importPreviewData.analysis.newTasks.length - 5 }} 条...
                </div>
              </div>
            </div>
            
            <!-- 重复任务 -->
            <div v-if="importPreviewData.analysis.duplicates.length > 0" class="detail-section collapsed">
              <h4>⚠️ 重复任务 (将跳过，{{ importPreviewData.analysis.duplicates.length }})</h4>
              <div class="collapse-hint">已折叠，点击统计卡片查看详情</div>
            </div>
            
            <!-- 错误任务 -->
            <div v-if="importPreviewData.analysis.errors.length > 0" class="detail-section">
              <h4>❌ 错误任务 (将跳过，{{ importPreviewData.analysis.errors.length }})</h4>
              <div class="task-preview-list">
                <div v-for="error in importPreviewData.analysis.errors.slice(0, 3)" :key="error.row" class="task-preview-item error">
                  <div class="error-content">
                    <span class="error-row">第{{ error.row }}行</span>
                    <span class="error-reason">{{ error.reason }}</span>
                  </div>
                </div>
                <div v-if="importPreviewData.analysis.errors.length > 3" class="more-hint">
                  还有 {{ importPreviewData.analysis.errors.length - 3 }} 条错误...
                </div>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="import-actions">
            <button class="btn btn-secondary" @click="cancelImport">
              取消导入
            </button>
            <button 
              class="btn btn-primary" 
              @click="confirmImport"
              :disabled="importPreviewData.analysis.newTasks.length === 0"
            >
              确认导入 ({{ importPreviewData.analysis.newTasks.length }} 条)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据报告弹窗 -->
    <!-- 数据报告 (Bottom Sheet) -->
    <div v-if="showReportModal" class="modal-overlay" @click.self="showReportModal = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showReportModal = false">
            <span>← 返回</span>
          </button>
          <h3>📊 {{ t('dataReport') }}</h3>
          <div style="width: 80px;"></div>
        </div>
        <div class="modal-body">
          <!-- 报告配置 -->
          <div class="report-config">
            <div class="config-row">
              <label>{{ t('reportType') }}:</label>
              <select v-model="reportType" class="input" style="width: 150px;" @change="onReportTypeChange">
                <option value="daily">{{ t('dailyReport') }}</option>
                <option value="weekly">{{ t('weeklyReport') }}</option>
                <option value="monthly">{{ t('monthlyReport') }}</option>
                <option value="quarterly">{{ t('quarterlyReport') }}</option>
                <option value="halfyearly">{{ t('halfyearlyReport') }}</option>
                <option value="yearly">{{ t('yearlyReport') }}</option>
                <option value="custom">{{ t('customReport') }}</option>
              </select>
            </div>
            
            <!-- 自定义日期范围 -->
            <div v-if="reportType === 'custom'" class="config-row" style="margin-top: 0.5rem;">
              <label>{{ currentLanguage === 'zh' ? '开始日期' : 'Start Date' }}:</label>
              <button @click="showReportStartCalendar = true" class="date-btn-inline">
                {{ customStartDate ? formatDate(customStartDate) : '选择日期' }}
              </button>
              <label style="margin-left: 1rem;">{{ currentLanguage === 'zh' ? '结束日期' : 'End Date' }}:</label>
              <button @click="showReportEndCalendar = true" class="date-btn-inline">
                {{ customEndDate ? formatDate(customEndDate) : '选择日期' }}
              </button>
              <button class="btn btn-primary" @click="generateReportContent" style="margin-left: 1rem;">
                {{ currentLanguage === 'zh' ? '生成报告' : 'Generate' }}
              </button>
            </div>
          </div>

          <!-- 报告预览 - 卡片式UI -->
          <div class="report-preview-cards">
            <!-- 🌌 顶部封面页 Hero Section -->
            <div class="report-hero">
              <div class="hero-avatar">{{ currentUsername.charAt(0).toUpperCase() }}</div>
              <h1 class="hero-title">{{ currentUsername }} {{ currentLanguage === 'zh' ? '的' : "'s" }} {{ reportData.title }}</h1>
              <p class="hero-subtitle">{{ currentLanguage === 'zh' ? '你的时间，看得见。' : 'Your time, visualized.' }}</p>
            </div>

            <!-- 执行官摘要（AI智能摘要） -->
            <div class="executive-summary-hero" v-if="reportData.executiveSummary">
              <div class="summary-badge">🤖 {{ currentLanguage === 'zh' ? 'AI 智能摘要' : 'AI Summary' }}</div>
              <p class="summary-text-hero">{{ reportData.executiveSummary }}</p>
            </div>

            <!-- 三大核心数字 -->
            <div class="hero-stats">
              <div class="hero-stat-card">
                <div class="hero-stat-icon">🍅</div>
                <div id="countup-pomodoros" class="hero-stat-value">{{ reportData.totalPomodoros }}</div>
                <div class="hero-stat-label">{{ currentLanguage === 'zh' ? '番茄钟' : 'Pomodoros' }}</div>
              </div>
              <div class="hero-stat-card">
                <div class="hero-stat-icon">✅</div>
                <div id="countup-completed" class="hero-stat-value">{{ reportData.completedTasks }}</div>
                <div class="hero-stat-label">{{ currentLanguage === 'zh' ? '项已完成' : 'Completed' }}</div>
              </div>
              <div class="hero-stat-card">
                <div class="hero-stat-icon">📈</div>
                <div id="countup-rate" class="hero-stat-value">{{ reportData.completionRate }}%</div>
                <div class="hero-stat-label">{{ currentLanguage === 'zh' ? '战胜了拖延' : 'Beat Procrastination' }}</div>
              </div>
            </div>

            <!-- 📊 模块一：精力的天平 -->
            <div class="report-card">
              <h3 class="card-title">⚖️ {{ currentLanguage === 'zh' ? '你的精力去哪了？' : 'Where Did Your Energy Go?' }}</h3>
              <div class="energy-allocation">
                <div class="energy-chart">
                  <EChart :option="pieChartOption" height="280px" />
                </div>
                <div class="energy-insight">
                  <div class="insight-badge">💡 {{ currentLanguage === 'zh' ? '洞察' : 'Insight' }}</div>
                  <p class="insight-text-large" v-if="reportData.categories && reportData.categories.length > 0">
                    {{ generateEnergyInsight() }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 旧的核心数据卡片（删除） -->
            <div class="report-stats-grid" style="display: none;">
              <div class="stat-card-report">
                <div class="stat-icon">📝</div>
                <div class="stat-value">{{ reportData.totalTasks }}</div>
                <div class="stat-label">{{ currentLanguage === 'zh' ? '总任务' : 'Total Tasks' }}</div>
              </div>
              <div class="stat-card-report">
                <div class="stat-icon">✅</div>
                <div class="stat-value">{{ reportData.completedTasks }}</div>
                <div class="stat-label">{{ currentLanguage === 'zh' ? '已完成' : 'Completed' }}</div>
              </div>
              <div class="stat-card-report">
                <div class="stat-icon">🍅</div>
                <div class="stat-value">{{ reportData.totalPomodoros }}</div>
                <div class="stat-label">{{ currentLanguage === 'zh' ? '番茄钟' : 'Pomodoros' }}</div>
              </div>
              <div class="stat-card-report highlight">
                <div class="stat-icon">📈</div>
                <div class="stat-value">{{ reportData.completionRate }}%</div>
                <div class="stat-label">{{ currentLanguage === 'zh' ? '完成率' : 'Completion Rate' }}</div>
              </div>
            </div>

            <!-- 执行官摘要 -->
            <div class="executive-summary" v-if="reportData.executiveSummary">
              <div class="summary-icon">📋</div>
              <div class="summary-content">
                <h4 class="summary-title">{{ currentLanguage === 'zh' ? '执行官摘要' : 'Executive Summary' }}</h4>
                <p class="summary-text">{{ reportData.executiveSummary }}</p>
              </div>
            </div>

            <!-- 新增KPI指标 -->
            <div class="report-kpi-section">
              <div class="kpi-item">
                <span class="kpi-icon">⚡</span>
                <span class="kpi-label">{{ currentLanguage === 'zh' ? '专注力效率' : 'Focus Efficiency' }}</span>
                <span class="kpi-value">{{ reportData.focusEfficiency }} 🍅/{{ currentLanguage === 'zh' ? '天' : 'day' }}</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-icon">🎯</span>
                <span class="kpi-label">{{ currentLanguage === 'zh' ? '高价值任务占比' : 'High-Value Ratio' }}</span>
                <span class="kpi-value">{{ reportData.highValueRatio }}%</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-icon">📅</span>
                <span class="kpi-label">{{ currentLanguage === 'zh' ? '日均完成' : 'Avg Tasks/Day' }}</span>
                <span class="kpi-value">{{ reportData.avgTasksPerDay }} {{ currentLanguage === 'zh' ? '个' : '' }}</span>
              </div>
            </div>

            <!-- 智能洞察 -->
            <div class="report-section" v-if="reportData.insights && reportData.insights.length > 0">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '💡 本期洞察' : '💡 Insights' }}</h3>
              <div class="insights-container">
                <div v-for="(insight, index) in reportData.insights" :key="index" class="insight-card" :class="`insight-${insight.type}`">
                  <div class="insight-icon">{{ insight.icon }}</div>
                  <div class="insight-text">{{ insight.text }}</div>
                </div>
              </div>
            </div>

            <!-- 精力分配雷达图 -->
            <div class="report-section">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '🎯 精力分配' : '🎯 Energy Distribution' }}</h3>
              <EChart :option="radarChartOption" height="320px" />
            </div>

            <!-- 分类统计 -->
            <div class="report-section">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '📊 分类统计' : '📊 By Category' }}</h3>
              <div class="category-stats">
                <div v-for="cat in reportData.categories" :key="cat.name" class="category-item">
                  <div class="category-header">
                    <span class="category-name">{{ cat.icon }} {{ cat.name }}</span>
                    <span class="category-value">{{ cat.completed }}/{{ cat.total }} ({{ cat.rate }}%)</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: cat.rate + '%', background: cat.color }"></div>
                  </div>
                  <div class="category-detail">
                    <span>🍅 {{ cat.pomodoros }}{{ currentLanguage === 'zh' ? '个' : '' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 智能总结 -->
            <div class="report-section" v-if="reportData.summary && reportData.summary.length > 0">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '💡 本期重点事项' : '💡 Key Activities' }}</h3>
              <div class="summary-content">
                <div v-for="(item, index) in reportData.summary" :key="index" class="summary-item">
                  <div class="summary-icon">{{ item.icon }}</div>
                  <div class="summary-text">
                    <div class="summary-title">{{ item.title }}</div>
                    <div class="summary-desc">{{ item.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 优先级分布 -->
            <div class="report-section">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '⚡ 优先级分布' : '⚡ By Priority' }}</h3>
              <div class="priority-stats">
                <div v-for="pri in reportData.priorities" :key="pri.name" class="priority-item">
                  <div class="priority-header">
                    <span class="priority-name">{{ pri.name }}</span>
                    <span class="priority-value">{{ pri.total }}{{ currentLanguage === 'zh' ? '项' : '' }} ({{ pri.percentage }}%)</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: pri.percentage + '%', background: pri.color }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 每日趋势（按完成数降序） -->
            <div class="report-section" v-if="reportData.dailyTrend && reportData.dailyTrend.length > 0" style="display: none;">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '📈 高效工作日排行' : '📈 Most Productive Days' }}</h3>
              <div class="daily-trend">
                <div v-for="day in reportData.dailyTrend" :key="day.date" class="trend-item">
                  <div class="trend-label">{{ day.label }}</div>
                  <div class="trend-bar-container">
                    <div class="trend-bar" :style="{ width: (day.count / reportData.maxDaily * 100) + '%' }">
                      <span class="trend-value">{{ day.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 🏆 模块三：高光习惯（进度条卡片） - 动态标题 -->
            <div class="report-card" v-if="reportData.aggregatedTasks && reportData.aggregatedTasks.length > 0">
              <h3 class="card-title">🔁 {{ currentLanguage === 'zh' ? getHabitTitle() : 'Your Top 5 Habits' }}</h3>
              <div class="habits-hall-of-fame">
                <div v-for="(task, index) in reportData.aggregatedTasks.slice(0, 5)" :key="index" class="habit-card">
                  <div class="habit-header">
                    <div class="habit-rank-badge" :class="`rank-${index + 1}`">
                      {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1 }}
                    </div>
                    <div class="habit-info">
                      <div class="habit-name">{{ task.text }}</div>
                      <div class="habit-category">{{ currentLanguage === 'zh' ? '分类' : 'Category' }}: {{ task.categoryIcon }} {{ getCategoryText(task.category) }}</div>
                    </div>
                    <div class="habit-flame">🔥</div>
                  </div>
                  <div class="habit-progress-bar">
                    <div class="habit-progress-fill" :style="{ width: Math.min(100, (task.pomodoros / (reportData.aggregatedTasks[0]?.pomodoros || 1)) * 100) + '%' }"></div>
                  </div>
                  <div class="habit-stats">
                    <span>{{ currentLanguage === 'zh' ? '开展' : 'Done' }} {{ task.count }} {{ currentLanguage === 'zh' ? '次' : 'times' }}</span>
                    <span>{{ currentLanguage === 'zh' ? '累计' : 'Total' }} {{ task.pomodoros }} 🍅</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 年度习惯 Top 10 -->
            <div class="report-section" v-if="reportData.aggregatedTasks && reportData.aggregatedTasks.length > 0">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '🏆 年度习惯 Top 10' : '🏆 Top 10 Habits' }}</h3>
              <div class="aggregated-tasks">
                <div v-for="(task, index) in reportData.aggregatedTasks" :key="index" class="aggregated-task-item">
                  <div class="task-rank">
                    <span v-if="index === 0">🥇</span>
                    <span v-else-if="index === 1">🥈</span>
                    <span v-else-if="index === 2">🥉</span>
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <div class="task-info">
                    <div class="task-name">
                      {{ task.categoryIcon }} {{ task.text }}
                    </div>
                    <div class="task-stats">
                      <span class="task-frequency">{{ currentLanguage === 'zh' ? '累计' : 'Total' }} {{ task.count }} {{ currentLanguage === 'zh' ? '次' : 'times' }}</span>
                      <span class="task-pomodoros">{{ currentLanguage === 'zh' ? '消耗' : 'Consumed' }} {{ task.pomodoros }} 🍅</span>
                      <span class="task-persistence">{{ currentLanguage === 'zh' ? '坚持度' : 'Persistence' }} {{ task.persistence }}%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: task.persistence + '%', background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 闪光的里程碑 (Milestones) - 月报/季报/半年报/年报显示 -->
            <div class="report-section" v-if="reportData.milestones && reportData.milestones.length > 0 && (reportType === 'yearly' || reportType === 'quarterly' || reportType === 'halfyearly' || reportType === 'monthly')">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '✨ 闪光的里程碑' : '✨ Key Milestones' }}</h3>
              <div class="milestones-timeline">
                <div v-for="(milestone, index) in reportData.milestones" :key="milestone.id" class="milestone-item">
                  <div class="milestone-marker">
                    <div class="milestone-dot"></div>
                    <div class="milestone-line" v-if="index < reportData.milestones.length - 1"></div>
                  </div>
                  <div class="milestone-content">
                    <div class="milestone-date">📅 {{ milestone.date }}</div>
                    <div class="milestone-title">{{ milestone.categoryIcon }} {{ milestone.text }}</div>
                    <div class="milestone-meta">
                      <span>⚡ {{ milestone.priorityText }}</span>
                      <span>🍅 {{ milestone.pomodoros }}</span>
                    </div>
                    <div v-if="milestone.description" class="milestone-description">{{ milestone.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 行为热力图 (Heatmap) - 季报/半年报/年报显示 -->
            <div class="report-section" v-if="reportData.heatmapData && (reportType === 'yearly' || reportType === 'quarterly' || reportType === 'halfyearly')">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '📊 行为热力图' : '📊 Activity Heatmap' }}</h3>
              <div class="heatmap-container">
                <div class="heatmap-legend">
                  <span class="legend-label">{{ currentLanguage === 'zh' ? '少' : 'Less' }}</span>
                  <div class="legend-colors">
                    <div class="legend-box" style="background: #ebedf0;"></div>
                    <div class="legend-box" style="background: #c4b5fd;"></div>
                    <div class="legend-box" style="background: #a78bfa;"></div>
                    <div class="legend-box" style="background: #8b5cf6;"></div>
                    <div class="legend-box" style="background: #6d28d9;"></div>
                  </div>
                  <span class="legend-label">{{ currentLanguage === 'zh' ? '多' : 'More' }}</span>
                </div>
                <div class="heatmap-grid">
                  <div class="heatmap-months">
                    <span v-for="month in reportData.heatmapData.months" :key="month.label" class="month-label">{{ month.label }}</span>
                  </div>
                  <div class="heatmap-weeks">
                    <div class="heatmap-week" v-for="(week, weekIndex) in reportData.heatmapData.weeks" :key="weekIndex">
                      <div 
                        v-for="(day, dayIndex) in week" 
                        :key="dayIndex"
                        class="heatmap-day"
                        :style="{ background: day.color }"
                        :title="`${day.date}: ${day.count} ${currentLanguage === 'zh' ? '个任务' : 'tasks'}`"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="heatmap-stats" v-if="reportData.streakStats">
                  <div class="streak-item">
                    <span class="streak-label">{{ currentLanguage === 'zh' ? '🔥 最长连胜' : '🔥 Longest Streak' }}</span>
                    <span class="streak-value">{{ reportData.streakStats.longest }} {{ currentLanguage === 'zh' ? '天' : 'days' }}</span>
                  </div>
                  <div class="streak-item">
                    <span class="streak-label">{{ currentLanguage === 'zh' ? '⚡ 当前连胜' : '⚡ Current Streak' }}</span>
                    <span class="streak-value">{{ reportData.streakStats.current }} {{ currentLanguage === 'zh' ? '天' : 'days' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 月度趋势图 (Monthly Trend) - 半年报/年报显示 -->
            <div class="report-section" v-if="reportData.monthlyTrend && reportData.monthlyTrend.length > 0 && (reportType === 'yearly' || reportType === 'halfyearly')">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '📈 月度趋势' : '📈 Monthly Trend' }}</h3>
              <div class="trend-chart-container">
                <EChart :option="monthlyTrendChartOption" style="height: 300px;" />
              </div>
            </div>

            <!-- 重点任务 -->
            <div class="report-section" v-if="reportType === 'weekly' || reportType === 'monthly'">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '🎯 重点任务 (Top 10)' : '🎯 Key Tasks (Top 10)' }}</h3>
              <div class="key-tasks">
                <div v-for="(task, index) in reportData.keyTasks" :key="task.id" class="task-item-report">
                  <div class="task-number">{{ index + 1 }}</div>
                  <div class="task-content-report">
                    <div class="task-title-report">✅ {{ task.text }}</div>
                    <div class="task-meta-report">
                      <span>{{ task.categoryIcon }} {{ task.categoryText }}</span>
                      <span>⚡ {{ task.priorityText }}</span>
                      <span>🍅 {{ task.pomodoros }}</span>
                      <span>📅 {{ task.time }}</span>
                    </div>
                    <div v-if="task.description" class="task-desc-report">{{ task.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
          <button class="btn btn-secondary" @click="exportHTML">{{ currentLanguage === 'zh' ? '📄 导出HTML' : '📄 Export HTML' }}</button>
          <button class="btn btn-secondary" @click="copyReportText">{{ t('copyText') }}</button>
          <button class="btn btn-secondary" @click="exportMarkdown">{{ t('exportMarkdown') }}</button>
          <button class="btn btn-primary" @click="showReportModal = false">{{ t('close') }}</button>
        </div>
      </div>
    </div>

    <!-- AI 周报弹窗 (优化格式) -->
    <div v-if="showWeeklyReportModal" class="modal-overlay" @click.self="showWeeklyReportModal = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showWeeklyReportModal = false">
            <span>← 返回</span>
          </button>
          <h3>📝 {{ weeklyReportTitle }}</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body">
          <!-- 周报内容 -->
          <div class="weekly-report-content">
            <!-- 数据概览 -->
            <div v-if="weeklyReportContent.overview" class="report-section overview-section">
              <div class="section-title">📊 数据概览</div>
              <div class="overview-grid">
                <div class="overview-item">
                  <div class="overview-value">{{ weeklyReportContent.overview.totalTasks || 0 }}</div>
                  <div class="overview-label">完成任务</div>
                </div>
                <div class="overview-item">
                  <div class="overview-value">{{ weeklyReportContent.overview.completionRate || '100%' }}</div>
                  <div class="overview-label">完成率</div>
                </div>
                <div class="overview-item">
                  <div class="overview-value">{{ weeklyReportContent.overview.highPriority || 0 }}</div>
                  <div class="overview-label">高优先级</div>
                </div>
                <div class="overview-item">
                  <div class="overview-value">{{ weeklyReportContent.overview.pomodoros || 0 }}</div>
                  <div class="overview-label">番茄钟</div>
                </div>
              </div>
              <div class="category-stats">
                <span>💼 工作 {{ weeklyReportContent.overview.workTasks || 0 }}</span>
                <span>📚 学习 {{ weeklyReportContent.overview.studyTasks || 0 }}</span>
                <span>🏠 生活 {{ weeklyReportContent.overview.lifeTasks || 0 }}</span>
              </div>
            </div>

            <!-- 已完成情况（截止上期） -->
            <div v-if="weeklyReportContent.previousCompleted && weeklyReportContent.previousCompleted.length > 0" class="report-section">
              <div class="section-title">✅ 已完成情况（截止上期）</div>
              <div class="highlights-list">
                <div v-for="(item, index) in weeklyReportContent.previousCompleted" :key="index" class="highlight-item">
                  <span class="highlight-number">{{ index + 1 }}</span>
                  <span class="highlight-text">{{ typeof item === 'string' ? item : item.displayText }}</span>
                </div>
              </div>
            </div>

            <!-- 本月目标 -->
            <div v-if="weeklyReportContent.monthlyGoals && weeklyReportContent.monthlyGoals.length > 0" class="report-section">
              <div class="section-title">🎯 本月目标</div>
              <div class="highlights-list">
                <div v-for="(item, index) in weeklyReportContent.monthlyGoals" :key="index" class="highlight-item highlight-special">
                  <span class="highlight-number">{{ index + 1 }}</span>
                  <span class="highlight-text">{{ typeof item === 'string' ? item : item.displayText }}</span>
                </div>
              </div>
            </div>

            <!-- 本月进展（截止当前） -->
            <div v-if="weeklyReportContent.monthlyProgress && weeklyReportContent.monthlyProgress.length > 0" class="report-section">
              <div class="section-title">📈 本月进展（截止当前）</div>
              <div class="highlights-list">
                <div v-for="(item, index) in weeklyReportContent.monthlyProgress" :key="index" class="highlight-item">
                  <span class="highlight-number">{{ index + 1 }}</span>
                  <span class="highlight-text">{{ typeof item === 'string' ? item : item.displayText }}</span>
                </div>
              </div>
            </div>

            <!-- 本周进展 -->
            <div v-if="weeklyReportContent.weeklyProgress && weeklyReportContent.weeklyProgress.length > 0" class="report-section">
              <div class="section-title">📅 本周进展</div>
              <div class="highlights-list">
                <template v-for="(item, index) in weeklyReportContent.weeklyProgress" :key="index">
                  <!-- 分类标题 -->
                  <div v-if="item.type === 'header'" class="category-header">
                    {{ item.text }}
                  </div>
                  <!-- 任务项 -->
                  <div v-else-if="item.type === 'item'" class="highlight-item">
                    <span class="highlight-number">•</span>
                    <span class="highlight-text">{{ item.text }}</span>
                  </div>
                  <!-- 兼容旧格式 -->
                  <div v-else class="highlight-item">
                    <span class="highlight-number">{{ index + 1 }}</span>
                    <span class="highlight-text">{{ typeof item === 'string' ? item : (item.displayText || item.text) }}</span>
                  </div>
                </template>
              </div>
            </div>

            <!-- 下周计划 -->
            <div v-if="weeklyReportContent.nextWeekPlan && weeklyReportContent.nextWeekPlan.length > 0" class="report-section">
              <div class="section-title">📋 下周计划</div>
              <div class="highlights-list">
                <div v-for="(item, index) in weeklyReportContent.nextWeekPlan" :key="index" class="highlight-item">
                  <span class="highlight-number">{{ index + 1 }}</span>
                  <span class="highlight-text">{{ typeof item === 'string' ? item : item.displayText }}</span>
                </div>
              </div>
            </div>

            <!-- 风险与问题 -->
            <div v-if="weeklyReportContent.risks && weeklyReportContent.risks.length > 0" class="report-section">
              <div class="section-title">⚠️ 风险与问题</div>
              <div class="highlights-list">
                <div v-for="(item, index) in weeklyReportContent.risks" :key="index" class="highlight-item risk-item">
                  <span class="highlight-number">{{ index + 1 }}</span>
                  <span class="highlight-text">{{ typeof item === 'string' ? item : item.displayText }}</span>
                </div>
              </div>
            </div>

            <!-- 整体总结 -->
            <div v-if="weeklyReportContent.summary" class="report-section">
              <div class="section-title">📊 整体总结</div>
              <div class="summary-card">{{ weeklyReportContent.summary }}</div>
            </div>

            <!-- 任务列表 -->
            <div v-if="weeklyReportContent.tasks && weeklyReportContent.tasks.length > 0" class="report-section">
              <div class="section-title">
                📋 完成任务明细
                <span class="task-count">{{ weeklyReportContent.tasks.length }} 个</span>
              </div>
              <div class="task-chips">
                <div v-for="(task, index) in weeklyReportContent.tasks.slice(0, 10)" :key="index" class="task-chip">
                  {{ task.text }}
                </div>
                <div v-if="weeklyReportContent.tasks.length > 10" class="task-chip more">
                  +{{ weeklyReportContent.tasks.length - 10 }} 个任务
                </div>
              </div>
            </div>

            <!-- 降级显示：纯文本 -->
            <div v-if="typeof weeklyReportContent === 'string'" class="report-section">
              <pre class="report-text">{{ weeklyReportContent }}</pre>
            </div>
          </div>
        </div>
        
        <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
          <button class="btn btn-secondary" @click="copyWeeklyReport">📋 复制文本</button>
          <button class="btn btn-primary" @click="showWeeklyReportModal = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 报告历史弹窗 -->
    <div v-if="showReportHistoryModal" class="modal-overlay" @click.self="showReportHistoryModal = false" style="z-index: 10009;">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showReportHistoryModal = false">
            <span>← 返回</span>
          </button>
          <h3>📚 报告历史</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body">
          <div v-if="reportHistoryList.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>暂无历史周报</p>
            <p style="font-size: 0.9rem; color: #999;">生成周报后会自动保存</p>
          </div>

          <div v-else>
            <!-- 搜索和操作栏 -->
            <div class="report-toolbar">
              <input 
                v-model="reportSearchKeyword" 
                type="text" 
                placeholder="🔍 搜索周报..." 
                class="report-search-input"
              />
              <button @click="batchDeleteReports" class="btn-batch-delete" title="清空所有">
                🗑️ 清空
              </button>
            </div>

            <!-- 分组显示 -->
            <div class="report-history-list">
              <!-- 今天 -->
              <div v-if="filteredGroupedReports.today.length > 0" class="report-group">
                <div class="group-title">📅 今天</div>
                <div 
                  v-for="report in filteredGroupedReports.today" 
                  :key="report.id"
                  class="history-item"
                  @click="viewHistoryReport(report)"
                >
                  <div class="history-main">
                    <div class="history-icon">📊</div>
                    <div class="history-info">
                      <div class="history-title-row">
                        <span class="history-type">{{ formatReportType(report.reportType) }}</span>
                        <span class="history-period">{{ report.period }}</span>
                      </div>
                      <div class="history-meta">
                        <span class="meta-item">🕐 {{ formatDate(report.createdAt) }}</span>
                        <span class="meta-item">📋 {{ report.taskCount }} 个任务</span>
                        <span class="meta-item">✅ {{ report.completedCount || 0 }} 已完成</span>
                      </div>
                    </div>
                  </div>
                  <button @click.stop="deleteHistoryReport(report.id)" class="btn-delete-small" title="删除">🗑️</button>
                </div>
              </div>

              <!-- 本周 -->
              <div v-if="filteredGroupedReports.thisWeek.length > 0" class="report-group">
                <div class="group-title">📆 本周</div>
                <div 
                  v-for="report in filteredGroupedReports.thisWeek" 
                  :key="report.id"
                  class="history-item"
                  @click="viewHistoryReport(report)"
                >
                  <div class="history-main">
                    <div class="history-icon">📊</div>
                    <div class="history-info">
                      <div class="history-title-row">
                        <span class="history-type">{{ formatReportType(report.reportType) }}</span>
                        <span class="history-period">{{ report.period }}</span>
                      </div>
                      <div class="history-meta">
                        <span class="meta-item">🕐 {{ formatDate(report.createdAt) }}</span>
                        <span class="meta-item">📋 {{ report.taskCount }} 个任务</span>
                        <span class="meta-item">✅ {{ report.completedCount || 0 }} 已完成</span>
                      </div>
                    </div>
                  </div>
                  <button @click.stop="deleteHistoryReport(report.id)" class="btn-delete-small" title="删除">🗑️</button>
                </div>
              </div>

              <!-- 本月 -->
              <div v-if="filteredGroupedReports.thisMonth.length > 0" class="report-group">
                <div class="group-title">📊 本月</div>
                <div 
                  v-for="report in filteredGroupedReports.thisMonth" 
                  :key="report.id"
                  class="history-item"
                  @click="viewHistoryReport(report)"
                >
                  <div class="history-main">
                    <div class="history-icon">📊</div>
                    <div class="history-info">
                      <div class="history-title-row">
                        <span class="history-type">{{ formatReportType(report.reportType) }}</span>
                        <span class="history-period">{{ report.period }}</span>
                      </div>
                      <div class="history-meta">
                        <span class="meta-item">🕐 {{ formatDate(report.createdAt) }}</span>
                        <span class="meta-item">📋 {{ report.taskCount }} 个任务</span>
                        <span class="meta-item">✅ {{ report.completedCount || 0 }} 已完成</span>
                      </div>
                    </div>
                  </div>
                  <button @click.stop="deleteHistoryReport(report.id)" class="btn-delete-small" title="删除">🗑️</button>
                </div>
              </div>

              <!-- 更早 -->
              <div v-if="filteredGroupedReports.earlier.length > 0" class="report-group">
                <div class="group-title">📂 更早</div>
                <div 
                  v-for="report in filteredGroupedReports.earlier" 
                  :key="report.id"
                  class="history-item"
                  @click="viewHistoryReport(report)"
                >
                  <div class="history-main">
                    <div class="history-icon">📊</div>
                    <div class="history-info">
                      <div class="history-title-row">
                        <span class="history-type">{{ formatReportType(report.reportType) }}</span>
                        <span class="history-period">{{ report.period }}</span>
                      </div>
                      <div class="history-meta">
                        <span class="meta-item">🕐 {{ formatDate(report.createdAt) }}</span>
                        <span class="meta-item">📋 {{ report.taskCount }} 个任务</span>
                        <span class="meta-item">✅ {{ report.completedCount || 0 }} 已完成</span>
                      </div>
                    </div>
                  </div>
                  <button @click.stop="deleteHistoryReport(report.id)" class="btn-delete-small" title="删除">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 区间报告弹窗 -->
    <div v-if="showCustomReportModal" class="modal-overlay" @click.self="showCustomReportModal = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showCustomReportModal = false">
            <span>← 返回</span>
          </button>
          <h3>🎯 区间报告</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <!-- 报告类型 -->
          <div class="form-group">
            <label class="form-label">📊 报告类型</label>
            <div class="report-type-grid">
              <div 
                v-for="type in reportTypes" 
                :key="type.value"
                class="type-card"
                :class="{ active: customReportConfig.type === type.value }"
                @click="customReportConfig.type = type.value"
              >
                <div class="type-icon">{{ type.icon }}</div>
                <div class="type-name">{{ type.label }}</div>
                <div class="type-desc">{{ type.desc }}</div>
              </div>
            </div>
          </div>

          <!-- 时间范围（仅自定义类型显示） -->
          <div v-if="customReportConfig.type === 'custom'" class="form-group">
            <label class="form-label">📅 时间范围</label>
            <div class="date-range-inputs">
              <button 
                @click="showCustomReportStartCalendar = true"
                class="date-btn-inline"
              >
                {{ customReportConfig.startDate ? formatDate(customReportConfig.startDate) : '开始日期' }}
              </button>
              <span style="color: #999;">至</span>
              <button 
                @click="showCustomReportEndCalendar = true"
                class="date-btn-inline"
              >
                {{ customReportConfig.endDate ? formatDate(customReportConfig.endDate) : '结束日期' }}
              </button>
            </div>
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCustomReportModal = false">取消</button>
          <button class="btn btn-primary" @click="generateCustomReport">生成报告</button>
        </div>
      </div>
    </div>

    <!-- 报告模板管理弹窗 -->
    <div v-if="showReportTemplates" class="modal-overlay" @click.self="showReportTemplates = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showReportTemplates = false">
            <span>← 返回</span>
          </button>
          <h3>📋 报告模板</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <div class="template-list">
            <div 
              v-for="template in reportTemplates" 
              :key="template.value"
              class="template-card"
            >
              <div class="template-header">
                <div class="template-icon-large">{{ template.icon }}</div>
                <div class="template-details">
                  <div class="template-name-large">{{ template.label }}</div>
                  <div class="template-desc">{{ template.desc }}</div>
                </div>
              </div>
              <div class="template-features">
                <div class="feature-tag" v-for="feature in template.features" :key="feature">
                  {{ feature }}
                </div>
              </div>
              <div class="template-actions">
                <button class="btn-template-action" @click="viewTemplateDetail(template)">
                  👁️ 查看详情
                </button>
                <button class="btn-template-action" @click="editTemplate(template)">
                  ✏️ 编辑
                </button>
                <button class="btn-template-use" @click="useTemplate(template.value)">
                  使用模板
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模板详情弹窗 -->
    <div v-if="showTemplateDetail && currentTemplate" class="modal-overlay" @click.self="showTemplateDetail = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showTemplateDetail = false">
            <span>← 返回</span>
          </button>
          <h3>{{ currentTemplate.icon }} {{ currentTemplate.label }}</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <!-- 模板描述 -->
          <div class="template-detail-section">
            <div class="detail-label">📝 模板说明</div>
            <div class="detail-value">{{ currentTemplate.desc }}</div>
          </div>

          <!-- 包含模块 -->
          <div class="template-detail-section">
            <div class="detail-label">✨ 包含模块</div>
            <div class="section-list">
              <div 
                v-for="section in currentTemplate.sections" 
                :key="section.key"
                class="section-item"
                :class="{ disabled: !section.enabled }"
              >
                <span class="section-icon">{{ section.enabled ? '✅' : '⬜' }}</span>
                <span class="section-label">{{ section.label }}</span>
              </div>
            </div>
          </div>

          <!-- 适用场景 -->
          <div class="template-detail-section">
            <div class="detail-label">🎯 适用场景</div>
            <div class="detail-value">
              <div v-if="currentTemplate.value === 'standard'">
                适合日常周报、月报等常规汇报场景，包含核心统计数据和AI智能总结。
              </div>
              <div v-else-if="currentTemplate.value === 'detailed'">
                适合季度总结、年度汇报等重要场景，包含完整的数据分析、图表和趋势对比。
              </div>
              <div v-else-if="currentTemplate.value === 'simple'">
                适合快速查看和简要汇报，只展示最核心的完成情况和任务列表。
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editTemplate(currentTemplate)">✏️ 编辑模板</button>
          <button class="btn btn-primary" @click="useTemplate(currentTemplate.value)">使用模板</button>
        </div>
      </div>
    </div>

    <!-- 模板编辑弹窗 -->
    <div v-if="showTemplateEditor && currentTemplate" class="modal-overlay" @click.self="showTemplateEditor = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showTemplateEditor = false">
            <span>← 返回</span>
          </button>
          <h3>✏️ 编辑模板</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <!-- 模板名称 -->
          <div class="form-group">
            <label class="form-label">📝 模板名称</label>
            <input 
              v-model="currentTemplate.label" 
              type="text" 
              class="form-input"
              placeholder="输入模板名称"
            />
          </div>

          <!-- 模板描述 -->
          <div class="form-group">
            <label class="form-label">📄 模板描述</label>
            <input 
              v-model="currentTemplate.desc" 
              type="text" 
              class="form-input"
              placeholder="输入模板描述"
            />
          </div>

          <!-- 包含模块 -->
          <div class="form-group">
            <label class="form-label">✨ 包含模块</label>
            <div class="checkbox-group-vertical">
              <label 
                v-for="section in currentTemplate.sections" 
                :key="section.key"
                class="checkbox-label-large"
              >
                <input type="checkbox" v-model="section.enabled" />
                <span>{{ section.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showTemplateEditor = false">取消</button>
          <button class="btn btn-primary" @click="saveTemplateEdit">💾 保存</button>
        </div>
      </div>
    </div>

    <!-- 任务树成长详情弹窗 -->
    <!-- 版本历史弹窗 -->
    <div v-if="showVersionModal" class="modal-overlay" @click.self="showVersionModal = false">
      <div class="report-bottom-sheet">
        <div class="modal-header">
          <button class="back-btn" @click="showVersionModal = false">
            <span>← 返回</span>
          </button>
          <h3>{{ versionModalTitle }}</h3>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="modal-body">
          <div class="version-list">
            <div 
              v-for="version in versionHistory" 
              :key="version.version"
              class="version-item"
              :class="{ 'version-new': !version.read }"
            >
              <div class="version-header">
                <div class="version-title">
                  <span class="version-number">v{{ version.version }}</span>
                  <span v-if="!version.read" class="badge-new">NEW</span>
                </div>
                <div class="version-date">{{ version.date }}</div>
              </div>
              
              <div class="version-content">
                <div v-if="version.features && version.features.length > 0" class="version-section">
                  <div class="version-section-title">✨ 新增功能</div>
                  <ul>
                    <li v-for="(feature, index) in version.features" :key="index">{{ feature }}</li>
                  </ul>
                </div>
                
                <div v-if="version.improvements && version.improvements.length > 0" class="version-section">
                  <div class="version-section-title">🎨 优化改进</div>
                  <ul>
                    <li v-for="(item, index) in version.improvements" :key="index">{{ item }}</li>
                  </ul>
                </div>
                
                <div v-if="version.fixes && version.fixes.length > 0" class="version-section">
                  <div class="version-section-title">🐛 Bug修复</div>
                  <ul>
                    <li v-for="(fix, index) in version.fixes" :key="index">{{ fix }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="versionHistory.length >= 3" 
            class="btn btn-secondary" 
            @click="toggleAllVersions"
            style="margin-right: 10px;"
          >
            {{ showAllVersions ? '收起历史版本' : '展开全部历史' }}
          </button>
          <button class="btn btn-primary" @click="markAllVersionsRead">
            全部标记为已读
          </button>
        </div>
      </div>
    </div>

    <!-- 撤销Toast -->
    <transition name="toast-slide">
      <div v-if="showUndoToast" class="undo-toast">
        <span class="toast-message">{{ undoToastMessage }}</span>
        <button class="toast-undo-btn" @click="undoDelete">
          {{ currentLanguage === 'zh' ? '撤销' : 'UNDO' }}
        </button>
      </div>
    </transition>

    <!-- 删除确认 Bottom Sheet -->
    <!-- 底部抽屉 - 添加任务 -->

    <!-- AI 文本选择菜单 -->
    <AITextMenu
      :visible="showTextMenu"
      :position="menuPosition"
      :selected-text="selectedTextNew"
      @close="closeTextMenu"
      @action="handleTextAction"
    />

    <!-- AI文本处理结果展示 -->
    <AITextResultSheet
      :visible="showTextResult"
      :result="textResult"
      :action="currentTextAction"
      :original-text="originalTextForResult"
      @close="showTextResult = false"
    />

    <!-- 任务预览弹窗 -->
    <TaskPreviewModal
      :visible="showTaskPreview"
      :extracted-tasks="extractedTasks"
      @close="showTaskPreview = false"
      @create="handleCreateTasks"
    />

    <!-- 统一报告中心 -->
    <UnifiedReportModal
      ref="unifiedReportModalRef"
      :visible="showUnifiedReport"
      :tasks="taskStore.tasks"
      :currentUsername="currentUsername"
      :historyReport="historyReportData"
      @close="closeUnifiedReport"
      @show-history="showReportHistory"
      @report-saved="handleReportSaved"
    />

    <!-- 🆕 创建文件夹弹窗 -->
    <CreateCollectionModal
      v-if="showCreateCollectionModal"
      :parent-id="currentParentId"
      @close="showCreateCollectionModal = false; currentParentId = null"
      @created="handleCollectionCreated"
    />

    <!-- 🆕 删除文件夹弹窗 -->
    <DeleteCollectionModal
      v-if="showDeleteCollectionModal"
      :collection="collectionToDelete"
      @close="showDeleteCollectionModal = false"
      @confirm="handleCollectionDeleted"
    />

    <!-- 🆕 移动任务到文件夹弹窗 -->
    <MoveToCollectionModal
      v-if="showMoveToCollectionModal && taskToMove"
      :task="taskToMove"
      :collections="sortedCollections"
      @close="showMoveToCollectionModal = false"
      @moved="handleTaskMoved"
    />

    <!-- 🆕 批量迁入任务弹窗 -->
    <BatchAddTasksModal
      v-if="showBatchAddModal"
      :collection-id="selectedCollectionId"
      :collection-name="getSelectedCollectionName()"
      :all-tasks="taskStore.tasks"
      :all-collections="sortedCollections"
      @close="showBatchAddModal = false"
      @added="handleBatchAdded"
    />

    <!-- 🆕 批量迁出任务弹窗 -->
    <BatchMoveOutModal
      v-if="showBatchMoveOutModal"
      :collection-id="selectedCollectionId"
      :collection-name="getSelectedCollectionName()"
      :tasks="taskStore.getCollectionTasks(selectedCollectionId)"
      :all-collections="sortedCollections"
      @close="showBatchMoveOutModal = false"
      @moved="handleBatchMovedOut"
    />

    <!-- 🆕 密码验证弹窗 -->
    <VerifyPasswordModal
      v-if="showVerifyPasswordModal"
      :collection-id="pendingCollectionId"
      :collection-name="taskStore.collections.find(c => c.id === pendingCollectionId)?.name || ''"
      @close="showVerifyPasswordModal = false"
      @verified="handlePasswordVerified"
    />

    <!-- 🆕 修改密码弹窗 -->
    <ChangePasswordModal
      v-if="showChangePasswordModal"
      :collection-id="selectedCollectionId"
      :collection-name="getSelectedCollectionName()"
      @close="showChangePasswordModal = false"
      @changed="handlePasswordChanged"
    />

    <!-- 🆕 文件夹管理页面 -->
    <CollectionManageModal
      v-if="showCollectionManage"
      :collections="sortedCollections"
      :get-task-count="(id) => taskStore.getCollectionTaskCount(id)"
      :get-child-collections="(id) => taskStore.getChildCollections(id)"
      :total-task-count="taskStore.tasks.length"
      :uncategorized-count="uncategorizedTaskCount"
      @close="showCollectionManage = false"
      @create="(parentId) => { currentParentId = parentId; fromCollectionManage = true; showCreateCollectionModal = true; showCollectionManage = false }"
      @select="(id) => { selectCollection(id); showCollectionManage = false }"
      @rename="(c) => { fromCollectionManage = true; startEditCollectionName(c); showCollectionManage = false }"
      @setPrivate="(c) => { fromCollectionManage = true; openSetPrivate(c); showCollectionManage = false }"
      @changePassword="(c) => { fromCollectionManage = true; openChangePassword(c.id); showCollectionManage = false }"
      @moveCollection="(c) => { collectionToMove = c; showMoveCollectionModal = true }"
      @moveIn="(c) => { openBatchMoveIn(c.id, true); showCollectionManage = false }"
      @moveOut="(c) => { openBatchMoveOut(c.id, true); showCollectionManage = false }"
      @delete="(c) => { fromCollectionManage = true; openDeleteCollection(c.id); showCollectionManage = false }"
      @batchEncrypt="handleBatchEncrypt"
      @batchDelete="handleBatchDelete"
    />

    <!-- 🆕 标签浏览器（v0.9.0）-->
    <TagBrowser
      v-if="showTagBrowser"
      ref="tagBrowserRef"
      @close="showTagBrowser = false"
      @filter="handleTagFilter"
      @openTask="openTaskDetailById"
    />

    <!-- 🆕 任务关系图谱（v0.9.0）-->
    <TaskGraphView
      v-if="showTaskGraph"
      :center-task-id="graphCenterTaskId"
      :max-nodes="50"
      @close="showTaskGraph = false"
      @navigate="handleGraphNavigate"
    />

    <!-- 🆕 甘特图（v0.9.0）-->
    <GanttChartView
      v-if="showGanttChart"
      @close="showGanttChart = false"
      @navigate="handleGraphNavigate"
    />

    <!-- 🆕 日历视图（v0.10.0）-->
    <CalendarView
      v-if="showCalendar"
      @close="showCalendar = false"
      @openTask="openTaskFromCalendar"
      @createTask="createTaskFromCalendar"
    />

    <!-- 🆕 自动补全下拉（v0.9.0）-->
    <AutocompleteDropdown
      :show="showAutocomplete"
      :suggestions="autocompleteSuggestions"
      :position="autocompletePosition"
      @select="selectAutocompleteSuggestion"
      @close="closeAutocomplete"
    />

    <!-- 🆕 重命名文件夹弹窗 -->
    <RenameCollectionModal
      v-if="showRenameCollectionModal"
      :collection-id="renamingCollection?.id"
      :collection-name="renamingCollection?.name"
      @close="showRenameCollectionModal = false; renamingCollection = null"
      @renamed="handleRenameCollection"
    />

    <!-- 🆕 移动笔记本弹窗 -->
    <MoveCollectionModal
      v-if="showMoveCollectionModal && collectionToMove"
      :collection="collectionToMove"
      :collections="taskStore.collections"
      :can-move-collection-to="(sourceId, targetId) => taskStore.canMoveCollectionTo(sourceId, targetId)"
      :get-breadcrumb="(id) => taskStore.getCollectionBreadcrumb(id)"
      @close="showMoveCollectionModal = false; collectionToMove = null"
      @move="handleConfirmMoveCollection"
    />

    <!-- 🆕 更多文件夹选择弹窗 -->
    <MoreCollectionsModal
      v-if="showMoreCollections"
      :collections="moreCollections"
      :get-task-count="getCollectionTaskCount"
      :selected-collection-id="selectedCollectionId"
      @close="showMoreCollections = false"
      @select="selectCollection"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'
import { useOfflineUserStore } from '../stores/offlineUserStore'
import { Preferences } from '@capacitor/preferences'
import { Clipboard } from '@capacitor/clipboard'
import AIAssistButton from '../components/AIAssistButton.vue'
import AITextMenu from '../components/AITextMenu.vue'
import AITextResultSheet from '../components/AITextResultSheet.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useTextSelection } from '../composables/useTextSelection'
import { useAutocomplete } from '../composables/useAutocomplete'  // 🆕 自动补全（v0.9.0）
import { AITextService } from '../services/aiTextService'
import { AITaskExtractor } from '../services/aiTaskExtractor'
import { AITaskGenerator } from '../services/aiTaskGenerator'
import { AIClassifier } from '../services/aiClassifier'
import { AITaskSplitter } from '../services/aiTaskSplitter'
import { AIDailyPlanner } from '../services/aiDailyPlanner'
import { AIReportGenerator } from '../services/aiReportGenerator'
import { AIChatService } from '../services/aiChatService'
import { AITextEnhancer } from '../services/aiTextEnhancer'
import AIConfigModal from '../components/AIConfigModal.vue'
import DatabaseConfigModal from '../components/DatabaseConfigModal.vue'
import TaskPreviewModal from '../components/TaskPreviewModal.vue'
import SubtaskPreviewModal from '../components/SubtaskPreviewModal.vue'
import AddSubtaskModal from '../components/AddSubtaskModal.vue'
import TrashModal from '../components/TrashModal.vue'
import AISuggestionCard from '../components/AISuggestionCard.vue'
import DailySummaryModal from '../components/DailySummaryModal.vue'
import AIReportModal from '../components/AIReportModal.vue'
import SmartTaskSplitter from '../components/SmartTaskSplitter.vue'
import CalendarPicker from '../components/CalendarPicker.vue'  // 🆕 日历选择器
import TagBrowser from '../components/TagBrowser.vue'  // 🆕 标签浏览器（v0.9.0）
import TaskGraphView from '../components/TaskGraphView.vue'  // 🆕 任务关系图谱（v0.9.0）
import GanttChartView from '../components/GanttChartView.vue'  // 🆕 甘特图（v0.9.0）
import CalendarView from '../components/CalendarView.vue'  // 🆕 日历视图（v0.10.0）
import AutocompleteDropdown from '../components/AutocompleteDropdown.vue'  // 🆕 自动补全（v0.9.0）
import { Filesystem, Directory } from '@capacitor/filesystem'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { App } from '@capacitor/app'

// 注册中文OCR插件（避免重复注册）
let ChineseOcr
try {
  ChineseOcr = Capacitor.registerPlugin('ChineseOcr')
} catch (e) {
  // 插件已注册，直接获取
  ChineseOcr = Capacitor.Plugins.ChineseOcr
}
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import EChart from '../components/EChart.vue'
import AddLogModal from '../components/AddLogModal.vue'
import TaskDetailModal from '../components/TaskDetailModal.vue'
import FilePreviewModal from '../components/FilePreviewModal.vue'
import UnifiedReportModal from '../components/UnifiedReportModal.vue'
import TutorialMode from '../components/TutorialMode.vue'
import AIChat from '../components/AIChat.vue'
import AIModelConfig from '../components/AIModelConfig.vue'
import AIPreviewModal from '../components/AIPreviewModal.vue'
import TemplateSelector from '../components/TemplateSelector.vue'
import CreateCollectionModal from '../components/CreateCollectionModal.vue'  // 🆕
import DeleteCollectionModal from '../components/DeleteCollectionModal.vue'  // 🆕
import MoveToCollectionModal from '../components/MoveToCollectionModal.vue'  // 🆕
import BatchAddTasksModal from '../components/BatchAddTasksModal.vue'  // 🆕
import BatchMoveOutModal from '../components/BatchMoveOutModal.vue'  // 🆕
import VerifyPasswordModal from '../components/VerifyPasswordModal.vue'  // 🆕
import ChangePasswordModal from '../components/ChangePasswordModal.vue'  // 🆕
import RenameCollectionModal from '../components/RenameCollectionModal.vue'  // 🆕
import CollectionManageModal from '../components/CollectionManageModal.vue'  // 🆕
import MoveCollectionModal from '../components/MoveCollectionModal.vue'  // 🆕
import MoreCollectionsModal from '../components/MoreCollectionsModal.vue'  // 🆕
import MarkdownRenderer from '../components/MarkdownRenderer.vue'  // 🆕 Markdown渲染器
import { CountUp } from 'countup.js'
import { manualBackup, listBackups, restoreBackup, deleteBackup } from '../utils/autoBackup'
import { taskToExcelRow, generateTemplateData, excelRowToTask } from '../utils/excelFormat'

const router = useRouter()
const taskStore = useOfflineTaskStore()
const userStore = useOfflineUserStore()

// 语言包配置
const i18n = {
  zh: {
    // 标题
    myTasks: '我的任务',
    tasksSuffix: '的任务',
    // 统计
    all: '全部',
    completed: '完成',
    pending: '待办',
    overdue: '逾期',
    filter: '筛选',
    expand: '展开',
    collapse: '收起',
    // 搜索
    searchPlaceholder: '🔍 搜索任务名称或描述...',
    // 添加任务
    addTaskPlaceholder: '➕ 新建任务：输入任务名称...',
    scanText: '拍照识别文字',
    aiAssist: 'AI 写作助手',
    aiGenerateDesc: 'AI 生成描述',
    descriptionPlaceholder: '📝 添加详细描述（可选）...',
    // 按钮
    add: '添加',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    // 时间安排
    today: '今天',
    tomorrow: '明天',
    dayAfterTomorrow: '后天',
    thisWeek: '本周内',
    nextWeek: '下周',
    thisMonth: '本月内',
    customDate: '指定日期',
    daily: '每天重复',
    weekday: '工作日重复',
    weekly: '每周重复',
    monthly: '每月重复',
    // 分类
    work: '工作',
    study: '学习',
    life: '生活',
    // 优先级
    high: '高',
    medium: '中',
    low: '低',
    // 其他
    aiChat: 'AI问答',
    tutorial: '演示模式',
    refresh: '刷新',
    trash: '回收站',
    profile: '个人主页',
    // 弹窗标题
    changePassword: '修改密码',
    bindPhone: '绑定手机号',
    advancedFilter: '高级筛选',
    recycleBin: '回收站',
    clearAllTrash: '清空回收站',
    personalProfile: '个人主页',
    contactSupport: '联系与支持',
    pomodoroStats: '番茄钟统计',
    // 表单标签
    currentPassword: '当前密码',
    newPassword: '新密码',
    currentPasswordPlaceholder: '请输入当前密码',
    newPasswordPlaceholder: '请输入新密码',
    confirmChange: '确认修改',
    // 筛选相关
    dateRange: '日期范围',
    startDate: '开始日期',
    endDate: '结束日期',
    to: '至',
    clear: '清除',
    category: '分类',
    priority: '优先级',
    keywordSearch: '关键字搜索',
    searchTaskPlaceholder: '搜索任务名称或描述...',
    reset: '重置',
    // 个人主页
    totalTasks: '总任务',
    completedTasks: '已完成',
    pendingTasks: '待完成',
    completionRate: '完成率',
    usageDays: '使用',
    days: '天',
    earnedPomodoros: '已获得',
    netPomodoros: '净获得',
    modifyPassword: '修改账号登录密码',
    notBound: '未绑定',
    dataManagement: '数据管理',
    dataManagementDesc: '导出或导入您的任务数据，轻松备份与迁移',
    manualBackup: '立即备份',
    restoreBackup: '恢复备份',
    backupManagement: '备份管理',
    backupListDesc: '选择一个备份文件进行恢复（仅支持JSON格式）',
    noBackups: '暂无备份文件',
    restore: '恢复',
    exportTasks: '导出任务',
    importTasks: '导入任务',
    downloadTemplate: '下载模板',
    clearAllTasks: '清空任务',
    contactSupportDesc: '遇到bug或想打赏？点击查看联系方式',
    logout: '退出登录',
    // 回收站
    restore: '恢复',
    permanentDelete: '彻底删除',
    originalCategory: '原分类',
    emptyTrash: '回收站空空如也',
    // 番茄钟统计
    pomodoroOverview: '番茄钟统计',
    earned: '已获得',
    pendingEarn: '待获得',
    overdueDeduct: '逾期扣除',
    netEarned: '净获得',
    accumulatedEarned: '累计获得',
    pomodoros: '个番茄',
    last7DaysTrend: '近7天趋势',
    timeStats: '时间统计',
    categoryDistribution: '分类占比',
    categoryDetails: '分类明细',
    priorityStats: '按优先级统计',
    highPriority: '高优先级',
    mediumPriority: '中优先级',
    lowPriority: '低优先级',
    achievementStats: '成就统计',
    consecutiveDays: '连续打卡',
    maxDaily: '单日最高',
    completionRateLabel: '完成率',
    selectRepeatDays: '选择重复日期',
    // 绑定手机号
    phoneNumber: '手机号',
    phoneNumberPlaceholder: '请输入手机号',
    verificationCode: '验证码',
    verificationCodePlaceholder: '请输入验证码',
    getVerificationCode: '获取验证码',
    boundPhoneHint: '已绑定手机号',
    close: '关闭',
    unbind: '解绑',
    bindHint: '绑定后可使用手机号+验证码登录此账号',
    confirmBind: '确认绑定',
    // 优先级模式
    priorityMode: '优先级模式',
    traditionalMode: '传统三级',
    eisenhowerMode: '时间象限法',
    // 时间象限法优先级
    urgentImportant: '重要且紧急',
    important: '重要但不紧急',
    urgent: '紧急但不重要',
    notUrgentNotImportant: '不紧急也不重要',
    // 番茄等级
    pomodoroMaster: '番茄大师',
    pomodoroExpert: '番茄专家',
    pomodoroTalent: '番茄达人',
    pomodoroRising: '番茄新星',
    pomodoroNovice: '番茄新手',
    // 日期标签
    todayLabel: '今天',
    yesterdayLabel: '昨天',
    // 截止时间
    noDeadline: '无截止',
    overdue: '逾期',
    remaining: '还剩',
    onlyRemaining: '仅剩',
    days: '天',
    hours: '小时',
    // 数据报告
    dataReport: '数据报告',
    dataReportDesc: '生成日报、周报、月报、季报、半年报、年报',
    generateReport: '生成报告',
    reportType: '报告类型',
    dailyReport: '日报',
    weeklyReport: '周报',
    monthlyReport: '月报',
    quarterlyReport: '季报',
    halfyearlyReport: '半年报',
    yearlyReport: '年报',
    customReport: '自定义',
    customReport: '自定义',
    reportTitle: '报告标题',
    reporter: '汇报人',
    copyText: '复制文本',
    exportMarkdown: '导出Markdown',
    generateImage: '生成图片',
  },
  en: {
    // 标题
    myTasks: 'My Tasks',
    tasksSuffix: '\'s Tasks',
    // 统计
    all: 'All',
    completed: 'Done',
    pending: 'Todo',
    overdue: 'Overdue',
    filter: 'Filter',
    expand: 'Expand',
    collapse: 'Collapse',
    // 搜索
    searchPlaceholder: '🔍 Search tasks...',
    // 添加任务
    addTaskPlaceholder: '➕ New task: Enter title...',
    scanText: 'Scan text from camera',
    aiAssist: 'AI Writing Assistant',
    aiGenerateDesc: 'AI Generate Description',
    descriptionPlaceholder: '📝 Add description (optional)...',
    // 按钮
    add: 'Add',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    // Schedule
    today: 'Today',
    tomorrow: 'Tomorrow',
    dayAfterTomorrow: 'Day After Tomorrow',
    thisWeek: 'This Week',
    nextWeek: 'Next Week',
    thisMonth: 'This Month',
    customDate: 'Custom Date',
    daily: 'Daily',
    weekday: 'Weekdays',
    weekly: 'Weekly',
    monthly: 'Monthly',
    // 分类
    work: 'Work',
    study: 'Study',
    life: 'Life',
    // 优先级
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    // 其他
    aiChat: 'AI Chat',
    tutorial: 'Tutorial',
    refresh: 'Refresh',
    trash: 'Trash',
    profile: 'Profile',
    // 弹窗标题
    changePassword: 'Change Password',
    bindPhone: 'Bind Phone',
    advancedFilter: 'Advanced Filter',
    recycleBin: 'Recycle Bin',
    clearAllTrash: 'Clear All',
    personalProfile: 'Profile',
    contactSupport: 'Contact & Support',
    pomodoroStats: 'Pomodoro Stats',
    // 表单标签
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    currentPasswordPlaceholder: 'Enter current password',
    newPasswordPlaceholder: 'Enter new password',
    confirmChange: 'Confirm',
    // 筛选相关
    dateRange: 'Date Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    to: 'to',
    clear: 'Clear',
    category: 'Category',
    priority: 'Priority',
    keywordSearch: 'Keyword Search',
    searchTaskPlaceholder: 'Search tasks...',
    reset: 'Reset',
    // 个人主页
    totalTasks: 'Total',
    completedTasks: 'Completed',
    pendingTasks: 'Pending',
    completionRate: 'Rate',
    usageDays: 'Usage',
    days: 'days',
    earnedPomodoros: 'Earned',
    netPomodoros: 'Net',
    modifyPassword: 'Change account password',
    notBound: 'Not bound',
    dataManagement: 'Data Management',
    dataManagementDesc: 'Export or import your tasks for backup and migration',
    manualBackup: 'Backup Now',
    restoreBackup: 'Restore',
    backupManagement: 'Backup Management',
    backupListDesc: 'Select a backup file to restore (JSON only)',
    noBackups: 'No backup files',
    restore: 'Restore',
    exportTasks: 'Export',
    importTasks: 'Import',
    downloadTemplate: 'Template',
    clearAllTasks: 'Clear All',
    contactSupportDesc: 'Found a bug or want to donate? Click for contact info',
    logout: 'Logout',
    // 回收站
    restore: 'Restore',
    permanentDelete: 'Delete',
    originalCategory: 'Category',
    emptyTrash: 'Recycle bin is empty',
    // 番茄钟统计
    pomodoroOverview: 'Pomodoro Stats',
    earned: 'Earned',
    pendingEarn: 'Pending',
    overdueDeduct: 'Lost',
    netEarned: 'Net',
    accumulatedEarned: 'Total earned',
    pomodoros: 'pomodoros',
    last7DaysTrend: 'Last 7 Days',
    timeStats: 'Time Stats',
    categoryDistribution: 'By Category',
    categoryDetails: 'Category Details',
    priorityStats: 'By Priority',
    highPriority: 'High',
    mediumPriority: 'Medium',
    lowPriority: 'Low',
    achievementStats: 'Achievements',
    consecutiveDays: 'Streak',
    maxDaily: 'Max Daily',
    completionRateLabel: 'Rate',
    selectRepeatDays: 'Select Repeat Days',
    // 绑定手机号
    phoneNumber: 'Phone Number',
    phoneNumberPlaceholder: 'Enter phone number',
    verificationCode: 'Verification Code',
    verificationCodePlaceholder: 'Enter code',
    getVerificationCode: 'Get Code',
    boundPhoneHint: 'Phone number bound',
    close: 'Close',
    unbind: 'Unbind',
    bindHint: 'You can login with phone number after binding',
    confirmBind: 'Confirm',
    // 优先级模式
    priorityMode: 'Priority Mode',
    traditionalMode: 'Traditional',
    eisenhowerMode: 'Eisenhower Matrix',
    // 时间象限法优先级
    urgentImportant: 'Urgent & Important',
    important: 'Important',
    urgent: 'Urgent',
    notUrgentNotImportant: 'Low Priority',
    // 番茄等级
    pomodoroMaster: 'Pomodoro Master',
    pomodoroExpert: 'Pomodoro Expert',
    pomodoroTalent: 'Pomodoro Talent',
    pomodoroRising: 'Pomodoro Rising',
    pomodoroNovice: 'Pomodoro Novice',
    // 日期标签
    todayLabel: 'Today',
    yesterdayLabel: 'Yesterday',
    // 截止时间
    noDeadline: 'No deadline',
    overdue: 'Overdue',
    remaining: 'Left',
    onlyRemaining: 'Only',
    days: 'days',
    hours: 'hrs',
    // 数据报告
    dataReport: 'Data Report',
    dataReportDesc: 'Generate weekly, monthly, yearly reports',
    generateReport: 'Generate',
    reportType: 'Report Type',
    dailyReport: 'Daily',
    weeklyReport: 'Weekly',
    monthlyReport: 'Monthly',
    quarterlyReport: 'Quarterly',
    halfyearlyReport: 'Half-Yearly',
    yearlyReport: 'Yearly',
    customReport: 'Custom',
    customReport: 'Custom',
    reportTitle: 'Report Title',
    reporter: 'Reporter',
    copyText: 'Copy Text',
    exportMarkdown: 'Export MD',
    generateImage: 'Generate Image',
  }
}

// 获取翻译文本
const t = (key) => i18n[currentLanguage.value][key] || key

// 任务状态枚举
const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue'
}

// 番茄钟配置（开发模式：改为25秒测试，生产模式：25分钟）
const POMODORO_CONFIG = {
  FOCUS_TIME: 25 * 60,      // 25分钟专注
  SHORT_BREAK: 5 * 60,      // 5分钟短休息
  LONG_BREAK: 15 * 60,      // 15分钟长休息
  // 测试模式（取消注释下面三行）
  // FOCUS_TIME: 25,         // 25秒测试
  // SHORT_BREAK: 5,         // 5秒测试
  // LONG_BREAK: 10,         // 10秒测试
}

// 响应式数据
const newTaskText = ref('')
const newTaskDescription = ref('')

// 🆕 统一输入框相关
const quickTaskInput = ref('')  // 单行输入框内容（标题）
const tempDescription = ref('')  // 临时保存的描述

// 🆕 媒体资源相关
const tempMedia = ref([])  // 临时媒体数组（创建任务前）
const currentTaskId = ref(null)  // 当前编辑的任务ID

// 🆕 自动补全相关（v0.9.0）
const descriptionTextarea = ref(null)
const editDescriptionTextarea = ref(null)  // 编辑弹窗的描述框
const {
  showAutocomplete,
  suggestions: autocompleteSuggestions,
  autocompletePosition,
  handleInput: handleAutocompleteInput,
  selectSuggestion: selectAutocompleteSuggestion,
  closeAutocomplete
} = useAutocomplete(descriptionTextarea)

// 🌳 子任务快速创建相关（仅自动识别）
const showSubtaskSuggestion = ref(false)  // 显示自动识别的子任务建议
const detectedSubtasks = ref([])  // 自动识别的子任务列表

const newTaskType = ref('today')
const customDateTime = ref('')
const newTaskCategory = ref('work')
const newTaskPriority = ref('medium')
const newTaskCollectionId = ref(null)  // 🆕 文件夹ID
const selectedWeekdays = ref([])
const monthDay = ref(1)  // 每月重复的日期（1-31）
const enableReminder = ref(false)
const forceReminder = ref(true) // 启用提醒默认就是强制提醒
const reminderDateTime = ref('')
const currentFilter = ref('all')
const previousFilter = ref('all') // 记录上一次的筛选状态
const currentCategoryFilter = ref('all')
const currentPriorityFilter = ref('all')

// AI 相关状态
const aiLoading = ref(false)
const aiLoadingText = ref('AI 思考中...')
const aiLoadingSubText = ref('')
const aiSuggestion = ref(null)
let suggestionTimeout = null

// AI预览相关状态
const showAIPreview = ref(false)
const aiPreviewContent = ref('')
const aiPreviewTitle = ref('✨ AI生成预览')
const showTemplateSelector = ref(false)

// 🆕 文件预览状态
const showFilePreview = ref(false)
const previewFile = ref(null)
const currentAITemplate = ref(null)
const currentAIMode = ref('') // 'suggestion' 或 'continue'

const searchKeyword = ref('')
const startDate = ref('')
const endDate = ref('')
const showFilterStartCalendar = ref(false)
const showFilterEndCalendar = ref(false)
const timeDimension = ref('created') // 时间维度：created/deadline/completed
const activeScene = ref('') // 当前激活的快捷场景
const countdownInterval = ref(null)
const showTrash = ref(false)
const headerRow2Expanded = ref(false) // 第二行默认收起
const showProfile = ref(false)
const showSupport = ref(false)
const showAIConfig = ref(false)
const showDatabaseConfig = ref(false)
const showAIChat = ref(false)
const showNotificationSettings = ref(false)

// 🆕 文件夹相关状态
const showCollectionList = ref(false)  // 是否展开文件夹列表（已废弃）
const showCollectionManage = ref(false)  // 🆕 文件夹管理页面
const showMoreCollections = ref(false)  // 🆕 更多文件夹选择弹窗
const showRenameCollectionModal = ref(false)  // 🆕 重命名文件夹弹窗
const renamingCollection = ref(null)  // 🆕 正在重命名的文件夹
const fromCollectionManage = ref(false)  // 🆕 标记是否从文件夹管理打开的弹窗
const selectedCollectionId = ref(null)  // 选中的文件夹ID（null=全部，'uncategorized'=未分类）
const showCreateCollectionModal = ref(false)  // 创建文件夹弹窗
const currentParentId = ref(null)  // 🆕 创建子笔记本时的父ID
const showDeleteCollectionModal = ref(false)  // 删除文件夹弹窗
const collectionToDelete = ref(null)  // 待删除的文件夹
const showMoveToCollectionModal = ref(false)  // 🆕 移动任务到文件夹弹窗
const showMoveCollectionModal = ref(false)  // 🆕 移动笔记本弹窗
const taskToMove = ref(null)  // 🆕 待移动的任务

// 🆕 标签浏览器状态（v0.9.0）
const showTagBrowser = ref(false)
const selectedTag = ref(null)  // 当前选中的标签

// 🆕 任务关系图谱状态（v0.9.0）
const showTaskGraph = ref(false)
const graphCenterTaskId = ref(null)  // 图谱中心任务ID
const isLoadingGraph = ref(false)  // 🆕 图谱加载状态
const showGanttChart = ref(false)  // 🆕 甘特图状态（v0.9.0）
const showCalendar = ref(false)  // 🆕 日历视图状态（v0.10.0）
const collectionToMove = ref(null)  // 🆕 待移动的笔记本
const editingCollectionId = ref(null)  // 🆕 正在编辑名称的文件夹ID
const editingCollectionName = ref('')  // 🆕 编辑中的文件夹名称
const showBatchAddModal = ref(false)  // 🆕 批量添加任务弹窗
const showBatchMoveOutModal = ref(false)  // 🆕 批量迁出任务弹窗
const showVerifyPasswordModal = ref(false)  // 🆕 密码验证弹窗
const showChangePasswordModal = ref(false)  // 🆕 修改密码弹窗
const pendingCollectionId = ref(null)  // 🆕 待验证的文件夹ID
const verifiedCollections = ref(new Set())  // 🆕 已验证的文件夹（会话内有效）

const aiExtractedTasks = ref([])
const showAITaskPreview = ref(false)
const showAIResult = ref(false)
const aiResultText = ref('')
const aiResultAction = ref('')
const showAISuggestion = ref(false)
const showDailySummary = ref(false)
const showAIReport = ref(false)
const showTaskSplitter = ref(false)
const taskToSplit = ref(null)
const showTaskInputPreview = ref(false)  // 🆕 任务输入预览弹窗
const previewTaskData = ref(null)  // 🆕 预览的任务数据
const pendingSubtasks = ref([])  // 🆕 待创建的子任务列表（预览模式中AI拆分后暂存）

// 文本选择菜单（使用新的 composable）
const todoLayoutRef = ref(null)
const { showMenu: showTextMenu, menuPosition, selectedText: selectedTextNew, closeTextMenu, replaceSelectedText } = useTextSelection(todoLayoutRef)

// AI文本处理结果
const showTextResult = ref(false)
const textResult = ref('')
const currentTextAction = ref('')
const originalTextForResult = ref('') // 存储原文

// 任务预览弹窗
const showTaskPreview = ref(false)
const extractedTasks = ref([])

// 子任务拆解
const showSubtaskPreview = ref(false)
const subtasks = ref([])
const currentSplittingTask = ref(null)

// 手动添加子任务
const showManualSubtaskModal = ref(false)
const manualSubtaskParent = ref(null)
const manualSubtaskData = ref(null)

// 检查是否显示 AI 建议
const checkAISuggestion = () => {
  // 检查是否在稍后提醒期间（1小时内）
  const snoozeTime = localStorage.getItem('ai_suggestion_snooze')
  if (snoozeTime) {
    const elapsed = Date.now() - parseInt(snoozeTime)
    if (elapsed < 60 * 60 * 1000) { // 1小时内
      return
    }
  }
  
  // 检查今天是否已显示过
  const lastShown = localStorage.getItem('ai_suggestion_last_shown')
  const today = new Date().toDateString()
  if (lastShown === today) {
    return
  }
  
  // 显示建议
  showAISuggestion.value = true
  localStorage.setItem('ai_suggestion_last_shown', today)
}

// 处理查看建议详情
const handleViewSuggestion = (suggestion) => {
  if (suggestion.type === 'overdue') {
    setFilter('overdue')
  } else if (suggestion.type === 'pending') {
    setFilter('pending')
  }
}

// 处理生成周报
const handleGenerateWeeklyReport = () => {
  showDailySummary.value = false
  showAIReport.value = true
}

// 打开任务分解

// 打开任务分解（新任务）

// 创建子任务
const createSubtasks = async (subtasks) => {
  console.log('=== 开始创建子任务 ===')
  console.log('父任务:', taskToSplit.value)
  console.log('子任务数量:', subtasks.length)
  
  if (!taskToSplit.value || subtasks.length === 0) return
  
  const parentTask = taskToSplit.value
  
  const now = new Date()
  const subtaskIds = []
  
  subtasks.forEach((subtask, index) => {
    const newTask = {
      id: Date.now() + index,
      text: subtask.title,
      description: subtask.description || '',
      type: 'today',
      category: parentTask.category,
      priority: subtask.priority || 'medium',
      status: 'pending',
      created_at: now.toISOString(),
      user_id: taskStore.currentUser,
      parentTaskId: Number(parentTask.id),
      estimatedHours: subtask.estimatedHours || 1,
      waitFor: []
    }
    
    console.log(`创建子任务 ${index + 1}:`, newTask.text, 'ID:', newTask.id, 'parentTaskId:', newTask.parentTaskId)
    taskStore.addTask(newTask)
    subtaskIds.push(newTask.id)
  })
  
  console.log('所有子任务ID:', subtaskIds)
  
  // 更新父任务：记录子任务列表
  if (parentTask.id) {
    parentTask.hasSplitted = true
    parentTask.subtaskCount = subtasks.length
    parentTask.subtasks = subtaskIds
    console.log('更新父任务 - subtasks:', parentTask.subtasks)
    taskStore.updateTask(parentTask)
    
    const updatedParent = taskStore.tasks.find(t => t.id === parentTask.id)
    console.log('从store读取的父任务 - subtasks:', updatedParent?.subtasks)
    
    // 如果详情页打开的是这个父任务，关闭并重新打开以刷新
    if (selectedTask.value?.id === parentTask.id) {
      console.log('刷新详情页 - 关闭并重新打开')
      showTaskDetail.value = false
      nextTick(() => {
        selectedTask.value = updatedParent
        showTaskDetail.value = true
      })
    }
  }
  
  console.log('=== 子任务创建完成 ===')
  showTaskSplitter.value = false
  taskToSplit.value = null
  showNotification(`✅ 成功创建 ${subtasks.length} 个子任务！`, 'success')
}

// 处理 AI 文本操作
const handleTextAction = async ({ action, text, tone }) => {
  console.log('TodoView handleTextAction called:', { action, text, tone })
  
  if (!text || text.trim() === '') {
    alert('未检测到选中的文本，请重新选择')
    return
  }
  
  // 特殊处理：提取任务
  if (action === 'extract_tasks') {
    try {
      closeTextMenu()
      aiLoading.value = true
      aiLoadingText.value = 'AI 正在分析文本...'
      aiLoadingSubText.value = '识别任务中'
      
      const tasks = await AITaskExtractor.extractTasks(text)
      console.log('Extracted tasks:', tasks)
      
      aiLoading.value = false
      
      if (tasks.length === 0) {
        showNotification('未识别到任务', 'warning')
        return
      }
      
      extractedTasks.value = tasks
      showTaskPreview.value = true
    } catch (error) {
      aiLoading.value = false
      console.error('AI提取任务失败:', error)
      alert(`AI提取任务失败：${error.message}`)
    }
    return
  }
  
  // 其他文本处理操作（前9个功能）
  try {
    closeTextMenu()
    
    // 保存原文
    originalTextForResult.value = text
    
    aiLoading.value = true
    aiLoadingText.value = 'AI 处理中...'
    aiLoadingSubText.value = '请稍候'
    
    const result = await AITextService.processText(action, text, { tone })
    
    aiLoading.value = false
    
    // 显示结果
    currentTextAction.value = action
    textResult.value = result
    showTextResult.value = true
  } catch (error) {
    aiLoading.value = false
    console.error('AI处理失败:', error)
    alert(`AI处理失败：${error.message}`)
  }
}

// 批量创建任务
const handleCreateTasks = (tasks) => {
  console.log('Creating tasks:', tasks)
  
  tasks.forEach(task => {
    const newTask = {
      id: Date.now() + Math.random(),
      text: task.title,
      description: task.description || '',
      type: task.deadline ? 'custom_date' : 'today',
      category: task.category || 'life',
      priority: task.priority || 'medium',
      customDate: task.deadline ? task.deadline.split(' ')[0] : null,
      customTime: task.deadline ? task.deadline.split(' ')[1] : null,
      status: 'pending',
      created_at: new Date().toISOString(),
      completed_at: null,
      logs: [],
      stats: {
        sessionCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        blockCount: 0,
        resolvedBlockCount: 0,
        latestProgress: 0
      }
    }
    
    taskStore.addTask(newTask)
  })
  
  showNotification(`✅ 已创建 ${tasks.length} 个任务`, 'success')
}

// AI 拆解任务
const handleSplitTask = async (task) => {
  currentSplittingTask.value = task
  
  // 询问用户想拆分成几个子任务
  const countInput = prompt('请输入要拆分的子任务数量（2-10个）：', '5')
  
  if (countInput === null) {
    // 用户取消
    return
  }
  
  const subtaskCount = parseInt(countInput)
  
  if (isNaN(subtaskCount) || subtaskCount < 2 || subtaskCount > 10) {
    showNotification('请输入2-10之间的数字', 'error')
    return
  }
  
  try {
    // 显示loading
    aiLoading.value = true
    aiLoadingText.value = `AI 正在拆解为 ${subtaskCount} 个子任务...`
    aiLoadingSubText.value = '请稍候，正在分析任务内容'
    
    const splitResult = await AITaskSplitter.splitTask(task.text, task.description, subtaskCount)
    
    if (splitResult.length > 0) {
      // 添加 category 继承
      const subtasksWithCategory = splitResult.map(item => ({
        ...item,
        category: task.category || 'work'
      }))
      subtasks.value = subtasksWithCategory
      showSubtaskPreview.value = true
      showNotification(`✨ AI 已拆解为 ${splitResult.length} 个子任务`, 'success')
    } else {
      showNotification('未能拆解任务，请重试', 'warning')
    }
  } catch (error) {
    console.error('AI拆解失败:', error)
    showNotification(`AI拆解失败：${error.message}`, 'error')
  } finally {
    // 关闭loading
    aiLoading.value = false
  }
}

// 创建子任务
const handleCreateSubtasks = async (subtaskList) => {
  console.log('=== 开始创建子任务 ===')
  console.log('父任务:', currentSplittingTask.value)
  console.log('子任务数量:', subtaskList.length)
  
  const parentTask = currentSplittingTask.value
  if (!parentTask) {
    console.error('父任务不存在')
    return
  }
  
  const subtaskIds = []
  
  // 使用 for...of 以支持 await
  for (let index = 0; index < subtaskList.length; index++) {
    const subtask = subtaskList[index]
    const newTask = {
      id: Date.now() + index,  // 使用整数ID
      text: subtask.title,
      description: subtask.description || '',
      type: 'today',
      category: parentTask.category || 'work',
      priority: subtask.priority || 'medium',
      status: 'pending',
      created_at: new Date().toISOString(),
      completed_at: null,
      completedPomodoros: 0,
      estimatedPomodoros: Math.ceil((subtask.estimatedHours || 1) / 0.5),
      pomodoroHistory: [],
      logs: [],
      stats: {
        sessionCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        blockCount: 0,
        resolvedBlockCount: 0,
        latestProgress: 0
      },
      parentTaskId: Number(parentTask.id),  // 确保是数字类型
      waitFor: []  // 明确设置为空数组，子任务独立执行
    }
    
    console.log(`创建子任务 ${index + 1}:`, newTask.text)
    console.log(`  子任务ID: ${newTask.id} (${typeof newTask.id})`)
    console.log(`  父任务ID: ${parentTask.id} (${typeof parentTask.id})`)
    console.log(`  parentTaskId: ${newTask.parentTaskId} (${typeof newTask.parentTaskId})`)
    console.log(`  严格相等: ${newTask.parentTaskId === parentTask.id}`)
    await taskStore.addTask(newTask)  // 等待添加完成
    
    // 验证是否真的添加到了store
    const added = taskStore.tasks.find(t => t.id === newTask.id)
    console.log(`  验证: ${added ? '✅ 已添加到store' : '❌ 未添加到store'}`)
    if (added) {
      console.log(`  store中的parentTaskId: ${added.parentTaskId}`)
    }
    
    subtaskIds.push(newTask.id)
  }
  
  console.log('所有子任务ID:', subtaskIds)
  
  // 更新父任务：记录子任务列表（不设置waitFor）
  if (parentTask.id) {
    parentTask.hasSplitted = true
    parentTask.subtaskCount = subtaskList.length
    parentTask.subtasks = subtaskIds
    console.log('更新父任务 - subtasks:', parentTask.subtasks)
    taskStore.updateTask(parentTask)
    
    // 验证更新是否成功
    const updatedParent = taskStore.tasks.find(t => t.id === parentTask.id)
    console.log('从store读取的父任务 - subtasks:', updatedParent?.subtasks)
    
    // 如果详情页打开的是这个父任务，关闭并重新打开以刷新
    if (selectedTask.value?.id === parentTask.id) {
      console.log('刷新详情页 - 关闭并重新打开')
      showTaskDetail.value = false
      nextTick(() => {
        selectedTask.value = updatedParent
        showTaskDetail.value = true
      })
    }
  }
  
  console.log('=== 子任务创建完成 ===')
  
  // 关闭子任务预览弹窗
  showSubtaskPreview.value = false
  
  // 显示成功提示
  showNotification(`✅ 已创建 ${subtaskList.length} 个子任务`, 'success')
}

// 显示手动添加子任务弹窗
const handleShowManualSubtask = ({ subtask, parentTask }) => {
  manualSubtaskParent.value = parentTask
  manualSubtaskData.value = subtask
  showManualSubtaskModal.value = true
}

// 提交手动添加的子任务
const handleManualSubtaskSubmit = async (subtaskData) => {
  const parentTask = manualSubtaskParent.value
  if (!parentTask) {
    showNotification('父任务不存在', 'error')
    return
  }
  
  const newTask = {
    id: Date.now(),
    text: subtaskData.text,
    description: subtaskData.description || '',
    type: 'today',
    category: subtaskData.category || parentTask.category || 'work',
    priority: subtaskData.priority || 'medium',
    status: 'pending',
    created_at: new Date().toISOString(),
    completed_at: null,
    completedPomodoros: 0,
    estimatedPomodoros: Math.ceil((subtaskData.estimatedDuration || 60) / 25),
    pomodoroHistory: [],
    logs: [],
    stats: {
      sessionCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      blockCount: 0,
      resolvedBlockCount: 0,
      latestProgress: 0
    },
    parentTaskId: Number(parentTask.id),
    waitFor: []
  }
  
  await taskStore.addTask(newTask)
  
  // 更新父任务的子任务列表
  if (!parentTask.subtasks) {
    parentTask.subtasks = []
  }
  parentTask.subtasks.push(newTask.id)
  parentTask.hasSplitted = true
  parentTask.subtaskCount = (parentTask.subtaskCount || 0) + 1
  await taskStore.updateTask(parentTask)
  
  showManualSubtaskModal.value = false
  manualSubtaskParent.value = null
  manualSubtaskData.value = null
  
  showNotification('✅ 子任务添加成功', 'success')
  
  // 刷新任务详情
  if (selectedTask.value && selectedTask.value.id === parentTask.id) {
    selectedTask.value = { ...parentTask }
  }
}

// 处理报告生成完成
const handleReportGenerated = (data) => {
  const { reportType, report, createdAt } = data
  
  // 格式化报告为纯文本
  const formatReportAsText = (report, type) => {
    const typeMap = {
      daily: '日报',
      weekly: '周报',
      monthly: '月报',
      quarterly: '季报',
      halfyearly: '半年报',
      yearly: '年报',
      custom: '自定义报告'
    }
    
    let text = `📝 ${typeMap[type] || '报告'} - ${report.period.start} 至 ${report.period.end}\n\n`
    
    // 智能总结
    if (report.summary) {
      text += `📝 智能总结\n${report.summary}\n\n`
    }
    
    // 数据概览
    if (report.overview) {
      text += `📊 数据概览\n`
      text += `完成任务：${report.overview.totalTasks}个\n`
      text += `高优先级：${report.overview.highPriority}个\n`
      text += `番茄钟：${report.overview.pomodoros}个\n`
      text += `💼 工作：${report.overview.workTasks}个\n`
      text += `📚 学习：${report.overview.studyTasks}个\n`
      text += `🏠 生活：${report.overview.lifeTasks}个\n\n`
    }
    
    // 完成任务明细
    if (report.completedTasks && report.completedTasks.length > 0) {
      text += `✅ 完成任务明细\n`
      report.completedTasks.forEach((task, index) => {
        text += `${index + 1}. ${task.text}`
        if (task.priority === 'high') text += ' ⭐'
        if (task.category) text += ` [${task.category}]`
        text += '\n'
      })
      text += '\n'
    }
    
    // 关键工作
    if (report.keyWorks && report.keyWorks.length > 0) {
      text += `🎯 关键工作\n`
      report.keyWorks.forEach((work, index) => {
        text += `${index + 1}. ${work.text}\n`
      })
      text += '\n'
    }
    
    // 风险与问题
    if (report.issues && report.issues.total > 0) {
      text += `⚠️ 风险与问题\n`
      text += `逾期任务：${report.issues.total} 个\n`
      if (report.issues.suggestions) {
        report.issues.suggestions.forEach(s => {
          text += `💡 ${s}\n`
        })
      }
      text += '\n'
    }
    
    // 下期计划
    if (report.nextPlan) {
      text += `📅 下期计划\n`
      text += `待办任务：${report.nextPlan.total} 个\n`
      text += `高优先级：${report.nextPlan.highPriority} 个\n`
      if (report.nextPlan.recommendations) {
        report.nextPlan.recommendations.forEach(r => {
          text += `💡 ${r}\n`
        })
      }
    }
    
    return text
  }
  
  // 构造历史记录
  const historyItem = {
    id: Date.now(),
    reportType: reportType,
    title: `${formatReportType(reportType)} - ${report.period.start} 至 ${report.period.end}`,
    period: `${report.period.start} 至 ${report.period.end}`,
    content: formatReportAsText(report, reportType), // 保存完整的纯文本内容
    reportData: report, // 保存完整的结构化数据
    taskCount: report.completionStats.total,
    completedCount: report.completionStats.completed,
    createdAt: createdAt
  }
  
  // 保存到localStorage
  const history = JSON.parse(localStorage.getItem('weekly_reports') || '[]')
  history.unshift(historyItem) // 最新的在前面
  
  // 🔧 只保留最近 50 个报告，防止超出配额
  if (history.length > 50) {
    history.splice(50)
  }
  
  localStorage.setItem('weekly_reports', JSON.stringify(history))
  
  console.log('报告已保存到历史', historyItem)
}

// 处理统一报告保存
const handleReportSaved = (report) => {
  // 保存到localStorage
  const savedReports = JSON.parse(localStorage.getItem('unified_reports') || '[]')
  savedReports.unshift(report)
  
  // 只保留最近50个报告
  if (savedReports.length > 50) {
    savedReports.splice(50)
  }
  
  localStorage.setItem('unified_reports', JSON.stringify(savedReports))
  console.log('统一报告已保存', report)
}

// 显示周报历史
const showReportHistory = () => {
  // 读取旧的周报数据
  const oldReports = JSON.parse(localStorage.getItem('weekly_reports') || '[]')
  
  // 读取新的统一报告数据
  const unifiedReports = JSON.parse(localStorage.getItem('unified_reports') || '[]')
  
  // 转换统一报告格式为历史列表格式
  const convertedReports = unifiedReports.map(report => ({
    id: report.id,
    reportType: report.type,
    period: `${report.period.start} - ${report.period.end}`,
    createdAt: report.createdAt,
    taskCount: report.visualData.totalTasks || 0,
    completedCount: report.visualData.completedTasks || 0,
    content: report.textData,
    visualData: report.visualData,
    aiReport: report.aiReport || null, // 🆕 包含AI汇报
    isUnified: true // 标记为统一报告
  }))
  
  // 合并并按时间排序
  reportHistoryList.value = [...convertedReports, ...oldReports]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  setTimeout(() => {
    showReportHistoryModal.value = true
  }, 0)
}

// 分组周报历史
const groupedReportHistory = computed(() => {
  const groups = {
    today: [],
    thisWeek: [],
    thisMonth: [],
    earlier: []
  }
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  reportHistoryList.value.forEach(report => {
    const reportDate = new Date(report.createdAt)
    const reportDay = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate())
    
    if (reportDay.getTime() === today.getTime()) {
      groups.today.push(report)
    } else if (reportDay >= weekStart) {
      groups.thisWeek.push(report)
    } else if (reportDay >= monthStart) {
      groups.thisMonth.push(report)
    } else {
      groups.earlier.push(report)
    }
  })
  
  return groups
})

// 查看历史周报
const viewHistoryReport = (report) => {
  // 判断是否为统一报告
  if (report.isUnified) {
    // 设置历史报告数据
    historyReportData.value = {
      type: report.reportType,
      period: report.period,
      visualData: report.visualData,
      textData: report.content,
      aiReport: report.aiReport || null, // 🆕 包含AI汇报
      createdAt: report.createdAt
    }
    
    // 关闭历史列表，打开统一报告
    showReportHistoryModal.value = false
    showUnifiedReport.value = true
  } else {
    // 旧的周报格式
    weeklyReportContent.value = report.reportData || {}
    weeklyReportTitle.value = report.title
    showReportHistoryModal.value = false
    showWeeklyReportModal.value = true
  }
}

// 删除历史周报
const deleteHistoryReport = (reportId) => {
  if (!confirm('确定要删除这条报告吗？')) return
  
  // 从旧周报中删除
  const oldReports = JSON.parse(localStorage.getItem('weekly_reports') || '[]')
  const filteredOld = oldReports.filter(r => r.id !== reportId)
  localStorage.setItem('weekly_reports', JSON.stringify(filteredOld))
  
  // 从统一报告中删除
  const unifiedReports = JSON.parse(localStorage.getItem('unified_reports') || '[]')
  const filteredUnified = unifiedReports.filter(r => r.id !== reportId)
  localStorage.setItem('unified_reports', JSON.stringify(filteredUnified))
  
  // 重新加载列表
  showReportHistory()
  
  showNotification('报告已删除', 'success')
}

// 批量删除周报
const batchDeleteReports = () => {
  if (!confirm('确定要删除所有报告吗？此操作不可恢复！')) return
  
  localStorage.removeItem('weekly_reports')
  localStorage.removeItem('unified_reports')
  reportHistoryList.value = []
  
  showNotification('所有报告已清空', 'success')
}


// 版本历史相关变量（必须在 initVersionHistory 之前声明）
const showVersionModal = ref(false) // 版本历史弹窗
const versionHistory = ref([]) // 版本历史列表
const hasUnreadVersions = ref(false) // 是否有未读版本
const CURRENT_VERSION = '0.9.4' // 当前应用版本
const versionModalTitle = ref('🎉 版本更新') // 弹窗标题（动态）

// 版本历史数据
const showAllVersions = ref(false) // 是否展开全部历史

const initVersionHistory = () => {
  // 完整版本历史
  const allVersions = [
    {
      version: '0.9.4',
      date: '2026-03-15',
      features: [
        '🛠️ 编辑器工具栏组件化（FullscreenDescEditor）：',
        '  • 抽取全屏描述编辑器为独立组件，支持多场景复用',
        '  • 📋 粘贴（含长按历史）、🔄 清空、🖼️ 图片、📎 文件、🤖 AI助手 5个工具',
        '  • AI助手内置7个功能：生成标题/描述/续写/润色/提取要点/改写/Markdown渲染',
        '📝 任务详情描述区支持全屏编辑：',
        '  • 描述区新增 ⛶ 最大化按钮，点击进入全屏编辑模式',
        '  • 全屏编辑器内可插入图片和文件附件，关闭后自动保存',
        '📋 添加日志支持全屏编辑与 Markdown 预览：',
        '  • 日志内容区新增 ⛶ 最大化按钮和 👁️ 预览切换',
        '  • 日志内容支持 Markdown 渲染，图片和文件附件可正常预览',
        '  • 全屏编辑器关闭后自动切换到预览模式',
      ],
      improvements: [
        '📎 日志附件支持：日志数据结构新增 media 字段，附件随日志持久化保存',
        '🔄 任务详情日志列表：MarkdownRenderer 传入 media，图片和文件正确渲染',
        '💾 添加日志后自动刷新任务详情，确保 logs 和 media 数据同步',
        '🎯 Header 第一行图标顺序优化：按使用频率重排（AI助手→笔记本→刷新→回收站），教程/更多/我的主页靠右',
      ],
      fixes: [
        '🐛 修复任务详情描述区图片/文件保存后无法预览（media 未持久化）',
        '🐛 修复日志附件 media 数据未传入 MarkdownRenderer',
        '🐛 修复 @update:media 模板赋值错误（Vue ref 解包陷阱）',
        '🐛 修复添加日志后任务详情未刷新导致 media 数据不同步',
      ]
    },
    {
      version: '0.9.3',
      date: '2026-03-14',
      features: [
        '🗂️ Header 布局重构：',
        '  • 第一行：笔记本/AI助手/刷新/回收站/教程（左对齐）+ 我的主页/更多（右对齐）',
        '  • 第二行（标签/图谱/甘特图/日历）默认收起，点击"更多"展开',
        '  • 节省屏幕空间，常用功能一行直达',
        '🕸️ 任务图谱节点信息升级：',
        '  • 节点标签显示出度/入度/子孙数（出X 入Y 子孙Z）',
        '  • 出度：直接指向其他任务的关系数',
        '  • 入度：其他任务直接指向自己的关系数',
        '  • 子孙数：沿出度方向 BFS 到底能触达的节点总数',
        '➡️ 图谱箭头方向显示：所有关系边显示箭头，清晰表达方向',
        '  • 引用链接（紫色）：箭头指向被引用任务',
        '  • 依赖关系（红色虚线）：箭头指向被等待任务',
        '  • 父子关系（绿色点线）：箭头从父指向子',
        '📌 拖动节点固定位置：拖动后节点不再被引力吸回中心',
      ],
      improvements: [
        '🕸️ 图谱搜索下拉框：显示任务关系总数，选中后正确跳转到该任务图谱',
        '🧲 降低 force 引力（0.1→0.02）：布局稳定后节点不再漂移',
        '🤖 AI 功能整合：统一入口新增生成标题/描述/续写/润色/提取要点 5 个功能',
        '📱 iOS 打包支持：新增 build-ios.sh 一键打包脚本',
        '🔄 刷新功能增强：完整重置所有状态，强制清空输入框',
        '🧹 代码精简：删除成长树功能（290行代码）',
      ],
      fixes: [
        '🐛 修复图谱搜索选中任务后未跳转到该任务图谱',
        '🐛 修复 AI 菜单按钮点击无反应',
        '🐛 修复 AI 菜单项点击无效（函数调用缺少括号）',
        '🐛 修复刷新时输入框未清空',
        '🐛 删除重复的 steps 数组声明'
      ]
    },
    {
      version: '0.9.2',
      date: '2026-03-13',
      features: [
        '🤖 AI 功能整合：统一入口优化，新增 5 个 AI 功能',
        '📱 iOS 打包支持：新增 build-ios.sh 一键打包脚本',
        '📖 教程模式更新：v0.9.2 全面版（18 步）',
        '🔄 刷新功能增强：完整重置所有状态到初始值'
      ],
      improvements: [
        '🧹 代码精简：删除成长树功能（290行代码）',
        '🗑️ 清理过程性材料和旧版本文件'
      ],
      fixes: [
        '🐛 修复 AI 菜单按钮点击无反应',
        '🐛 修复刷新时输入框未清空'
      ]
    },
    {
      version: '0.9.1',
      date: '2026-03-12',
      features: [
        '🕸️ 任务关系图谱全面升级：',
        '  • 节点状态标识：已完成半透明、逾期红色边框',
        '  • 双击展开：双击节点展开1-5层关系网络',
        '  • 孤立任务提示：橙色警告/绿色成功状态提示',
        '  • 导出图片：右下角紫色按钮，2倍分辨率PNG',
        '  • 显示已完成：开关控制是否显示已完成任务',
        '  • 隐藏孤立：一键过滤无关系的任务',
        '  • 层级控制：1-5层关系深度滑块',
        '  • 数量控制：10-200个任务显示范围',
        '  • 合并搜索：全部任务下拉框集成搜索',
        '📊 甘特图专业化设计：',
        '  • 任务标题左对齐：与返回按钮精确对齐',
        '  • 渐变色任务条：高优先级红色渐变、中橙色、低蓝色',
        '  • 增强阴影：4px模糊+2px偏移，立体感',
        '  • Y轴分隔线：2px垂直线区分信息区和图表区',
        '📅 日历视图优化：',
        '  • 任务下钻：点击任务名称跳转详情',
        '  • 已完成任务也可点击查看',
        '📋 导入预览优化：',
        '  • 重复任务折叠显示（避免1000+条卡顿）',
        '  • 底部滑出布局，左右全屏',
        '💾 备份提醒优化：',
        '  • 按用户隔离：每个用户只提醒一次'
      ],
      improvements: [
        '🎨 UI优化：',
        '  • 甘特图左对齐、关系图谱合并搜索',
        '  • 双滑块控制（层级+数量）',
        '  • 孤立任务提示（橙/绿状态）',
        '  • 导出按钮（紫色圆形）',
        '📊 交互提升：',
        '  • 单击跳转、双击展开',
        '  • 点击提示高亮孤立任务',
        '  • 滑块实时更新图谱',
        '🔧 性能优化：',
        '  • 按关系数排序（优先有关系的）',
        '  • 过滤逻辑优化（先截取再过滤）',
        '  • 导入预览折叠重复任务'
      ],
      fixes: [
        '🐛 已完成按钮点击无效',
        '🐛 隐藏孤立逻辑顺序错误',
        '🐛 日历任务点击跳转失效',
        '🐛 备份提醒多用户混乱',
        '🐛 甘特图标题错位',
        '🐛 关系图谱数据不响应',
        '🐛 导入预览1000+条卡顿'
      ]
    },
    {
      version: '0.8.9',
      date: '2026-03-11',
      features: [
        '🤖 AI 助手菜单重构：按使用流程分组（生成内容 → 优化内容 → 格式化）',
        '✨ 生成标题功能：根据任务描述智能生成简洁标题（10-20字）',
        '📐 Markdown 渲染功能：一键将任务描述格式化为 Markdown',
        '👁️ Markdown 预览模式：编辑/预览双模式切换，完整渲染效果'
      ],
      improvements: [
        '🎯 AI 助手菜单逻辑优化：',
        '  • 第一组：生成内容（生成标题、生成描述、续写内容）',
        '  • 第二组：优化内容（优化润色、提取要点、改写风格）',
        '  • 第三组：格式化（Markdown 渲染）',
        '📝 Markdown 完整支持：',
        '  • 标题（H1-H6，带下划线）',
        '  • 加粗/斜体/代码块/行内代码',
        '  • 列表（有序/无序）',
        '  • 引用块（紫色左边框）',
        '  • 表格（斑马纹）',
        '  • 链接/分隔线',
        '🎨 GitHub 风格样式：熟悉的 Markdown 渲染效果',
        '🔄 采纳后自动预览：Markdown 渲染采纳后自动切换到预览模式',
        '⚡ Ollama API 兼容：智能检测 API 类型，使用正确参数（num_predict/max_tokens）'
      ],
      fixes: [
        '🐛 修复 Ollama API 400 错误：使用 num_predict 而非 max_tokens',
        '🐛 修复 Markdown 渲染后格式丢失：采纳后自动切换到预览模式',
        '🐛 修复 AI 预览弹窗无法渲染 Markdown：新增双模式切换（编辑/预览）'
      ]
    },
    {
      version: '0.8.8',
      date: '2026-03-10',
      features: [
        '🗄️ 数据库接管模式：MySQL/SQLite实时双写，支持多设备数据同步',
        '☁️ 多设备同步：同一数据库+同一账号=数据自动共享',
        '🔄 三种存储方式：本地存储（默认）/ SQLite（本地备份）/ MySQL（远程同步）',
        '📱 使用方法：右上角"数据库配置" → 配置MySQL → 开启"接管模式"'
      ],
      improvements: [
        '🗄️ 数据完整性：任务、日志、文件夹、回收站、AI配置、对话、报告全部同步',
        '👥 用户数据隔离：每个用户独立的数据和接管开关，100%隔离',
        '🔄 数据自动迁移：检测旧localStorage数据并自动迁移到新格式',
        '💾 完整备份优化：修复缺失的文件夹、统一报告、AI配置等数据',
        '🎨 数据库配置UI：参考AI配置样式，← 返回按钮，分组布局，状态卡片',
        '📊 状态信息增强：成功/失败/进行中用不同颜色卡片+图标显示',
        '💡 接管模式说明：开启后显示绿色说明卡片，列出3个自动同步场景',
        '⏰ MySQL时间格式：使用本地时区（北京时间）而非UTC'
      ],
      fixes: [
        '🐛 修复localStorage未按用户隔离：AI配置、对话历史按用户独立存储',
        '🐛 修复接管状态未按用户隔离：每个用户独立的接管开关',
        '🐛 修复手动同步缺少deletedTasks：回收站数据正确同步',
        '🐛 修复SQLite同步缺少deletedTasks：SQLite也正确备份回收站',
        '🐛 修复任务日志未恢复：从数据库恢复时正确组装执行日志',
        '🐛 修复孤儿任务自动修复：文件夹删除后自动修复关联任务',
        '🐛 修复父子任务关联：创建/删除子任务时自动维护父任务subtasks字段',
        '🐛 修复SQLite位置说明错误：正确显示应用私有目录位置',
        '🐛 修复重复配置加载：删除onMounted中的冗余代码',
        '🐛 修复SQLite Web兼容性：禁用Web端SQLite，提示使用MySQL'
      ]
    },
    {
      version: '0.8.4',
      date: '2026-03-08',
      features: [
        '📁 笔记本管理全面优化：一键展开/折叠所有层级、L1/L2/L3/L4彩色徽章、时间信息显示',
        '🔍 批量迁入搜索优化：实时搜索任务标题和描述，显示匹配结果数量',
        '🤖 AI汇报自动保存：生成后自动保存到历史，避免重复生成浪费成本'
      ],
      improvements: [
        '🎨 层级视觉效果：不同层级使用不同颜色边框和背景（紫/橙/绿/红）',
        '🔘 按钮优化：操作按钮增大到32×32px，间距8px，统一"图标+文字"格式',
        '🔙 返回逻辑优化：笔记本管理操作完成后停留在管理页面，不再跳转首页'
      ],
      fixes: [
        '🐛 修复批量迁入搜索功能无效（task.text为undefined导致崩溃）',
        '🐛 修复操作按钮对齐问题：按层级缩进与笔记本名称对齐',
        '🐛 修复AI汇报历史丢失：保存和加载报告时正确处理aiReport字段'
      ]
    },
    {
      version: '0.8.3',
      date: '2026-03-07',
      features: [
        '🤖 AI模型配置全面重构：17个预设厂商（本地/官方/中转/国产/云/开源），零学习成本',
        '⚡ 智能获取模型：输入API Key后自动获取模型列表，支持自定义厂商',
        '📝 新用户引导：首次使用显示"👋 欢迎使用！请先配置一个AI模型"紫色脉动提示'
      ],
      improvements: [
        '🔧 AI模型URL统一处理：所有URL统一为基础URL，使用时动态添加API路径',
        '🎨 UI布局优化：统计栏删除"全部"按钮、胶囊样式统一、间距极致紧凑（2px）'
      ],
      fixes: [
        '🐛 修复Android返回手势失效：删除未定义的showDeleteConfirmCard变量引用',
        '🐛 修复AI模型URL不一致：获取模型列表/测试连接/实际调用URL统一处理',
        '🐛 修复LongCat等特殊路径前缀被错误移除：智能识别并保留自定义路径前缀'
      ]
    },
    {
      version: '0.8.2',
      date: '2026-03-06',
      features: [
        '📁 笔记本树形嵌套系统：支持无限层级嵌套（工作 > 项目A > 子项目A1）',
        '🌳 任务树连续生长效果：30个细分状态，图标/尺寸/颜色平滑变化',
        '🗺️ 面包屑导航：首页显示完整路径（📚 全部 > 📁 工作 > 📁 项目A）',
        '📚 更多文件夹选择：点击"+N▼"快速查看和进入更多文件夹'
      ],
      improvements: [
        '🌲 树形可视化：点击▼/▶展开/折叠子笔记本，缩进显示层级关系',
        '📊 递归统计：笔记本任务数包含所有子笔记本的任务',
        '📦 移动笔记本：支持移动到任意位置，带循环依赖检测',
        '🗑️ 删除选项增强：级联删除/提升子笔记本/移到其他位置'
      ],
      fixes: [
        '修复合并笔记本层级丢失：完整保留子笔记本结构',
        '修复首页返回手势无响应问题'
      ]
    },
    {
      version: '0.8.1',
      date: '2026-03-05',
      features: [
        '📜 报告历史只读模式：查看历史报告时自动进入只读状态，防止误修改',
        '🔙 Android返回手势全面修复：支持48个弹窗的手势导航和按钮导航'
      ],
      improvements: [
      ],
      fixes: [
        '修复返回手势在手势导航设备上不工作',
        '修复统计中心返回时跳过个人主页'
      ]
    },
    {
      version: '0.8.0',
      date: '2026-03-04',
      features: [
        '📊 智能报告中心：整合"数据报告"和"区间报告"为统一入口，双视图切换（📈可视化 + 📝文本）',
        '📋 完整报告结构：6个核心章节（报告周期、智能总结、数据概览、本期目标、重点任务、风险与问题、下期计划）',
        '🎯 PDCA逻辑顺序：目标→完成→问题→计划，符合工作汇报习惯',
        '📚 报告历史整合：统一管理新旧报告，支持查看、删除、搜索',
        '🍅 番茄钟历史记录：按日期分组显示所有专注记录，支持展开/折叠，点击跳转任务详情'
      ],
      improvements: [
        '📅 日期计算修复：月报（本月1号-月底）、季报（本季度）、半年报（本半年）、年报（全年）',
        '🔄 数据源统一：避免重复代码，减少约300行',
        '💾 自动保存：报告保存到localStorage（unified_reports），最多保留50个',
        '🎨 统一UI布局：底部滑出、左右全屏、紫色渐变头部',
        '🗑️ 删除右上角"📊 统计中心"按钮：统一通过个人主页访问',
        '📑 个人中心逻辑优化：数据查看 → 系统功能 → 账号设置'
      ],
      fixes: [
        '修复月报/季报/半年报/年报日期计算错误',
        '修复报告历史查看功能',
        '修复删除报告功能（同时从两个存储中删除）',
        '修复番茄钟历史记录显示为空（新增历史记录列表）'
      ]
    },
    {
      version: '0.7.10',
      date: '2026-03-03',
      features: [
        '📊 报告系统全面优化：恢复完整11章节结构（智能总结、数据概览、完成任务明细、已完成情况、本期目标、本期进展、本周进展、关键工作、风险与问题、下期计划）',
        '📅 动态章节标题：根据报告类型自动调整（日报→今日/周报→本周/月报→本月/季报→本季度/半年报→本半年/年报→今年）',
        '💾 报告自动保存：生成后自动保存到历史，包含完整结构化数据',
        '📈 支持7种报告类型：日报/周报/月报/季报/半年报/年报/自定义报告'
      ],
      improvements: [
        '🔄 今日规划融入AI助手：删除右上角独立的"🌅 今日规划"按钮，统一通过AI助手（🤖）→"📅 今日规划"使用',
        '🗑️ 删除冗余功能：删除"快速生成周报"入口、模板选择系统、无效的"包含内容"配置项',
        '🔧 "周报历史"改名为"报告历史"',
        '⏰ 时间节点计算修复：根据报告类型动态计算',
        '📝 报告生成统一：所有类型使用同一套丰富结构',
        '🧹 代码清理：删除 DailyPlanModal 组件及相关变量、函数、样式（删除约150行重复代码，添加约240行丰富报告生成逻辑）'
      ],
      fixes: [
        '修复日报/周报模板无效（生效率从71.4%提升到100%）',
        '修复月报显示"本周进展"（现在正确显示"本月进展"）',
        '修复时间节点计算错误（所有类型都错误使用"月"概念）',
        '修复模板定义与实现不一致',
        '修复报告历史内容为空：保存时格式化为纯文本',
        '修复查看历史报告显示空白：使用reportData结构化数据',
        '修复报告显示格式：显示displayText而不是原始对象',
        '修复本周进展显示：支持header/item结构'
      ]
    },
    {
      version: '0.7.9',
      date: '2026-03-02',
      features: [
        '✨ 子任务智能识别：自动检测任务描述中的列表项（支持5种格式：数字、破折号、星号、圆点、圆圈数字）',
        '✨ 任务预览模式：全屏编辑新增"预览"按钮，可查看、编辑、AI拆分后原子性保存',
        '🤖 AI拆分优化：默认子任务数量从5个改为3个，预览模式完全集成AI拆分',
        '🎨 智能提示气泡：检测到2个以上列表项时弹出蓝色渐变提示卡片'
      ],
      improvements: [
        '📏 自适应高度优化：任务描述、AI总结、日志描述全部支持自适应高度（输入时实时调整+初始渲染自动适配）',
        '✏️ AI总结可编辑：AI总结内容支持直接编辑，失焦自动保存',
        '🗑️ 代码精简：删除约180行重复代码，优化任务创建流程',
        '📚 文档完善：新增子任务智能识别、任务输入功能审查、实施总结文档',
        '🎯 轻量级设计：不重复造轮子，复用现有AI拆分功能',
        '🎨 统一Bottom Sheet样式：所有弹窗从底部滑出，左右全屏',
        '🔙 Android返回手势全面优化：新增3个弹窗支持（AI建议卡片、AI预览、模板选择器）'
      ],
      fixes: [
        '修复全屏编辑工具栏重复的"🤖 AI拆分"按钮',
        '修复预览模式下父任务和子任务保存不同步的问题',
        '修复任务详情页面长文本显示不全的问题（textarea自适应高度）',
        '修复AI总结原文显示问题',
        '修复弹窗z-index被遮挡问题',
        '修复textarea自适应高度初始化问题',
        '修复任务预览返回逻辑：现在返回到全屏编辑而非首页（逐级返回）',
        '修复AI拆分后跳转问题：创建子任务后保留在父任务详情页',
        '修复任务状态更新逻辑：修改任务时间后自动重新评估状态（待办/逾期）',
        '修复checkOverdueTasks：检查所有类型任务而非仅"今天"类型'
      ]
    },
    {
      version: '0.7.8',
      date: '2026-03-01',
      features: [
        '剪贴板历史记录（最近10次+时间戳+一键选择粘贴）',
        '全屏编辑工具栏增强（📋粘贴+🔄清空+💡AI建议+🤖AI续写）',
        'AI智能建议（基于任务标题生成描述建议+3-5个执行步骤）',
        '全屏编辑支持标题编辑（标题+描述同时编辑）',
        '实时状态栏（编辑时长+字数+年月日时分秒实时更新）',
        '版本更新自动检测（首次打开/版本升级自动弹出通知）',
        '任务依赖关系系统（单向依赖+智能通知+自动清理）',
        'AI任务拆分（智能拆解+4种模板+预估时长）',
        'AI主动式助手（智能提醒+每日总结+周报生成）',
        'AI对话历史记录（多对话管理+时间分组）',
        '完整备份系统（100%数据覆盖+JSON导入导出）',
        '任务执行日志系统（6种日志类型+统计分析）',
        '番茄钟计时器（25分钟专注+自动休息）',
        '拍照OCR + AI文本增强'
      ],
      improvements: [
        '剪贴板粘贴逻辑优化（点击直接粘贴+长按显示历史+右键显示历史）',
        'AI建议卡片（紫色渐变+滑入动画+可采纳或忽略）',
        '全屏编辑导航栏优化（删除取消按钮+标题左对齐）',
        '工具栏横向滚动布局（4个按钮紧凑排列）',
        'Bottom Sheet布局全面统一（使用指南/数据说明/隐私政策）',
        '页脚链接调整（开源协议→隐私政策）',
        '文档全面更新（使用指南新增5章节+隐私政策新增AI说明）',
        '版本号体系调整（v1.x.x→v0.x.x开发版本规范）',
        '搜索功能优化（支持多关键词模糊匹配）',
        'Android返回手势全面支持（38个交互元素）',
        'AI加载可强制中断（返回键取消请求）',
        '子任务预览弹窗完全贴底显示',
        'Excel导入支持中英文字段（大小写不敏感）',
        'AI问答markdown渲染优化（列表、表格、emoji）'
      ],
      fixes: [
        '修复剪贴板粘贴交互问题（点击📋按钮直接粘贴，长按显示历史）',
        '修复showPasteHistory函数重复声明导致构建失败',
        '修复安卓粘贴功能（使用Capacitor Clipboard API）',
        '修复AI建议功能的模型配置获取（直接从localStorage读取）',
        '修复AI建议API路径问题（统一使用/v1/chat/completions）',
        '修复AI建议模型字段名（modelName兼容model）',
        '修复重复任务逻辑（weekday和weekly类型截止时间计算）',
        '修复重复任务自动重置功能（每天/工作日/每周自动重置）',
        '修复3个Bottom Sheet布局问题（AddDependency/SmartTaskSplitter/WaitForSelector）',
        '修复text字段undefined导致的崩溃',
        '修复AI模型配置页面重复区域',
        '修复AI问答流式响应解析失败',
        '修复任务详情白屏崩溃问题',
        '修复README中所有历史版本号（v1.x.x→v0.x.x）',
        '删除重复的currentDateTime声明'
      ]
    },
    {
      version: '0.7.12',
      date: '2026-03-04',
      features: ['语音输入功能（中文优化+实时显示+脉动动画）'],
      improvements: ['集成语音识别插件', '自动权限请求', '视觉反馈优化'],
      fixes: []
    },
    {
      version: '0.7.9',
      date: '2026-03-02',
      features: ['子任务智能识别（5种列表格式）', '任务预览模式（AI拆分集成）'],
      improvements: ['自适应高度优化', 'AI总结可编辑', 'Android返回手势优化'],
      fixes: ['修复任务状态更新逻辑', '修复预览返回逻辑']
    },
    {
      version: '0.7.0',
      date: '2026-02-25',
      features: ['任务执行日志系统（6种日志类型）', '执行统计自动计算', '进度追踪+标签系统+心情追踪'],
      improvements: ['任务详情页面重构', '日志列表时间倒序', '操作按钮优化'],
      fixes: []
    },
    {
      version: '0.6.12',
      date: '2026-02-25',
      features: ['番茄钟计时器（25分钟专注+自动休息）', '番茄钟历史记录', '今日专注统计'],
      improvements: ['任务详情页面全面优化', '编辑弹窗改为Bottom Sheet', '任务描述交互增强'],
      fixes: ['修复任务详情完成按钮无效']
    },
    {
      version: '0.5.0',
      date: '2026-02-19',
      features: ['极简状态栏（两行布局）', '高级筛选弹窗', '顶部刷新按钮'],
      improvements: ['空间优化（筛选区域高度减少72%）', '任务列表可见行数增加75%'],
      fixes: []
    },
    {
      version: '0.3.0',
      date: '2026-02-19',
      features: ['任务批量导入功能', '官方导入模板（100条示例）'],
      improvements: ['智能解析Excel数据', '导入结果统计'],
      fixes: ['修复待办统计逻辑']
    },
    {
      version: '0.1.0',
      date: '2026-02-17',
      features: ['统计数据交互式筛选', '胶囊按钮样式', '内联表单设计'],
      improvements: ['统计和筛选区域融合', '空间优化（节省约130px）'],
      fixes: []
    },
    {
      version: '0.0.0',
      date: '2026-02-17',
      features: [
        '用户注册与登录系统',
        '任务管理（创建/编辑/完成/删除）',
        '7种任务类型（今天/明天/本周/自定义/每天/工作日/每周重复）',
        '任务分类（工作/学习/生活）',
        '优先级设置（高/中/低）',
        '智能排序系统（置顶+逾期+紧急预警）',
        '高级筛选（状态/分类/优先级/日期范围/关键字）',
        '回收站功能（软删除+恢复）',
        '数据导入导出（Excel格式）',
        '完全离线运行（本地存储）'
      ],
      improvements: [
        '移动端优化（全屏宽度布局）',
        '智能提醒（逾期提醒+1小时预警）',
        '任务截止时间系统（颜色分级提醒）',
        '番茄钟激励系统（预估番茄数显示）',
        '统计区域交互式筛选',
        '任务卡片图标化设计'
      ],
      fixes: []
    }
  ]
  
  // 默认只显示最近3个版本
  versionHistory.value = showAllVersions.value ? allVersions : allVersions.slice(0, 3)
  
  // 检查是否有未读版本
  const readVersions = JSON.parse(localStorage.getItem('read_versions') || '[]')
  versionHistory.value.forEach(v => {
    v.read = readVersions.includes(v.version)
  })
  hasUnreadVersions.value = versionHistory.value.some(v => !v.read)
}

// 切换显示全部版本
const toggleAllVersions = () => {
  showAllVersions.value = !showAllVersions.value
  initVersionHistory()
}

// 检查版本更新（首次打开或版本升级时自动弹出）
const checkVersionUpdate = () => {
  const currentUser = taskStore.currentUser || 'guest'
  const lastVersion = localStorage.getItem(`last_app_version_${currentUser}`)
  
  // 首次打开应用 或 版本号变化
  if (!lastVersion || lastVersion !== CURRENT_VERSION) {
    // 延迟1秒弹出，避免与其他弹窗冲突
    setTimeout(() => {
      initVersionHistory()
      
      // 设置弹窗标题
      if (!lastVersion) {
        versionModalTitle.value = '👋 欢迎使用 TO-DO App'
      } else if (lastVersion !== CURRENT_VERSION) {
        versionModalTitle.value = `🎉 版本升级 ${lastVersion} → ${CURRENT_VERSION}`
      }
      
      showVersionModal.value = true
      
      // 保存当前版本号（按用户隔离）
      localStorage.setItem(`last_app_version_${currentUser}`, CURRENT_VERSION)
      
      // 如果是v0.8.6，显示接管模式使用提示
      if (CURRENT_VERSION === '0.8.6' && lastVersion && lastVersion !== CURRENT_VERSION) {
        setTimeout(() => {
          showInfo(
            '💡 接管模式使用提示',
            '1. 点击右上角"数据库配置"\n2. 选择MySQL并配置数据库信息\n3. 点击"接管模式"开启\n4. 其他设备使用相同配置即可同步数据\n\n详见版本更新说明 ↑',
            8000
          )
        }, 2000)
      }
      
      // 日志
      if (lastVersion && lastVersion !== CURRENT_VERSION) {
        console.log(`版本升级: ${lastVersion} → ${CURRENT_VERSION}`)
      } else {
        console.log('首次打开应用，显示版本说明')
      }
    }, 1000)
  }
}

// 显示版本历史
const showVersionHistory = () => {
  initVersionHistory()
  showVersionModal.value = true
}

// 标记所有版本为已读
const markAllVersionsRead = () => {
  const allVersions = versionHistory.value.map(v => v.version)
  localStorage.setItem('read_versions', JSON.stringify(allVersions))
  versionHistory.value.forEach(v => v.read = true)
  hasUnreadVersions.value = false
  showNotification('已标记为已读', 'success')
}

// 初始化时检查未读版本
initVersionHistory()

// 全屏任务描述编辑
const showFullscreenDesc = ref(false)
const isMarkdownPreview = ref(false)  // 🆕 Markdown预览模式
const descEditStartTime = ref(null)
const descEditDuration = ref(0)
let descEditTimer = null
const currentDateTimeValue = ref('')
const showAISuggestions = ref(false)
const aiSuggestionsList = ref([])
const showClipboardHistory = ref(false)
const clipboardHistory = ref([])
const showAIMenu = ref(false)
let aiTouchTimer = null

// 当前日期时间（年月日时分秒）
const currentDateTime = computed(() => currentDateTimeValue.value)

// 更新当前时间
const updateCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  currentDateTimeValue.value = `${year}/${month}/${day} ${hour}:${minute}:${second}`
}

// 🆕 统一输入框计算属性
const displayInputValue = computed(() => {
  if (tempDescription.value) {
    return `${quickTaskInput.value}...`  // 有描述时显示 "标题..."
  }
  return quickTaskInput.value  // 无描述时只显示标题
})

const descEditTime = computed(() => {
  const seconds = descEditDuration.value
  if (seconds < 60) return `编辑 ${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  return `编辑 ${minutes} 分钟`
})

// 🆕 处理输入框变化（用户直接编辑时）
const handleInputChange = (event) => {
  quickTaskInput.value = event.target.value.replace('...', '')  // 移除三个点
  // 如果用户直接编辑，清空描述
  if (tempDescription.value && !event.target.value.endsWith('...')) {
    tempDescription.value = ''
  }
}

// 字数提示
const getWordCountHint = () => {
  const count = newTaskDescription.value.length
  if (count === 0) return '建议 50-200 字'
  if (count < 50) return `已输入 ${count} 字`
  if (count <= 200) return '✓ 字数合适'
  return `已输入 ${count} 字`
}

// 动态占位符

const openFullscreenDesc = () => {
  showFullscreenDesc.value = true
  descEditStartTime.value = Date.now()
  descEditDuration.value = 0
  
  // 🆕 只加载描述到编辑器（标题固定显示，不可编辑）
  newTaskDescription.value = tempDescription.value
  
  // 初始化时间显示
  updateCurrentDateTime()
  
  // 每秒更新编辑时长和当前时间
  descEditTimer = setInterval(() => {
    descEditDuration.value = Math.floor((Date.now() - descEditStartTime.value) / 1000)
    updateCurrentDateTime()
  }, 1000)
}

const closeFullscreenDesc = () => {
  // 🆕 保存描述
  tempDescription.value = newTaskDescription.value.trim()
  
  // 关闭全屏编辑
  showFullscreenDesc.value = false
  showAISuggestions.value = false
  aiSuggestionsList.value = []
  isMarkdownPreview.value = false  // 🆕 重置预览模式
  
  if (descEditTimer) {
    clearInterval(descEditTimer)
    descEditTimer = null
  }
  
  // 🌳 检测子任务（自动识别列表）
  const subtasks = detectSubtasksFromDescription(newTaskDescription.value)
  if (subtasks.length >= 2) {
    detectedSubtasks.value = subtasks
    showSubtaskSuggestion.value = true
  }
}

// 🆕 切换 Markdown 预览模式
const toggleMarkdownPreview = () => {
  isMarkdownPreview.value = !isMarkdownPreview.value
}

// 🌳 从描述中检测子任务列表
const detectSubtasksFromDescription = (description) => {
  if (!description || !description.trim()) return []
  
  const patterns = [
    /^\d+[\.\、]\s*(.+)$/gm,        // 1. 任务名 或 1、任务名
    /^[-\-]\s*(.+)$/gm,             // - 任务名
    /^\*\s*(.+)$/gm,                // * 任务名
    /^[•·]\s*(.+)$/gm,              // • 任务名 或 · 任务名
    /^[①②③④⑤⑥⑦⑧⑨⑩]\s*(.+)$/gm,  // ① 任务名
  ]
  
  let subtasks = []
  patterns.forEach(pattern => {
    const matches = [...description.matchAll(pattern)]
    matches.forEach(match => {
      const taskName = match[1].trim()
      if (taskName && taskName.length > 0 && taskName.length <= 100) {
        subtasks.push(taskName)
      }
    })
  })
  
  // 去重
  subtasks = [...new Set(subtasks)]
  
  return subtasks
}

// 🌳 忽略自动识别的子任务
const ignoreDetectedSubtasks = () => {
  showSubtaskSuggestion.value = false
  detectedSubtasks.value = []
}

// 🆕 预览任务
const previewTask = () => {
  if (!quickTaskInput.value.trim()) {
    showNotification('请输入任务标题', 'warning')
    return
  }
  
  // 解析日期时间
  let customDate = null
  let customTime = null
  if (newTaskType.value === 'custom_date' && customDateTime.value) {
    const dt = new Date(customDateTime.value)
    customDate = customDateTime.value.split('T')[0]
    customTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }
  
  // 创建预览任务对象
  previewTaskData.value = {
    id: Date.now(),  // 临时ID
    text: quickTaskInput.value.trim(),
    description: newTaskDescription.value.trim(),
    type: newTaskType.value,
    category: newTaskCategory.value,
    priority: newTaskPriority.value,
    weekdays: newTaskType.value === 'weekly' ? selectedWeekdays.value : null,
    customDate: customDate,
    customTime: customTime,
    status: 'pending',
    created_at: new Date().toISOString(),
    enableReminder: enableReminder.value,
    reminderTime: enableReminder.value && reminderDateTime.value ? new Date(reminderDateTime.value).toISOString() : null,
    forceReminder: enableReminder.value,
    logs: [],
    stats: {
      sessionCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      blocksResolved: 0
    },
    media: tempMedia.value  // 🆕 添加媒体资源
  }
  
  // 关闭全屏编辑，打开预览
  showFullscreenDesc.value = false
  showTaskInputPreview.value = true
}

// 🆕 从预览保存任务
const saveTaskFromPreview = async () => {
  try {
    console.log('=== 从预览保存任务 ===')
    console.log('待创建子任务数量:', pendingSubtasks.value.length)
    
    if (!previewTaskData.value) {
      console.error('❌ previewTaskData为空')
      showNotification('❌ 预览数据为空', 'error')
      return
    }
    
    // 🆕 如果有待创建的子任务，调用子任务创建逻辑
    if (pendingSubtasks.value.length > 0) {
      console.log('检测到子任务，调用 createSubtasksFromPreview')
      await createSubtasksFromPreview(pendingSubtasks.value)
      return
    }
    
    // 无子任务，正常创建任务
    console.log('无子任务，正常创建任务')
    const task = {
      text: previewTaskData.value.text,
      description: previewTaskData.value.description,
      type: previewTaskData.value.type,
      category: previewTaskData.value.category,
      priority: previewTaskData.value.priority,
      weekdays: previewTaskData.value.weekdays,
      customDate: previewTaskData.value.customDate,
      customTime: previewTaskData.value.customTime,
      enableReminder: previewTaskData.value.enableReminder,
      reminderTime: previewTaskData.value.reminderTime,
      forceReminder: previewTaskData.value.forceReminder,
      media: tempMedia.value  // 🆕 添加媒体资源
    }
    
    console.log('创建任务:', task)
    console.log('📝 tempMedia:', tempMedia.value)
    const createdTask = await taskStore.addTask(task)
    console.log('✅ 任务创建成功，ID:', createdTask.id)
    
    // 如果启用了提醒，调度通知
    if (previewTaskData.value.enableReminder && previewTaskData.value.reminderTime) {
      await scheduleTaskReminder(createdTask)
    }
    
    // 关闭预览
    showTaskInputPreview.value = false
    previewTaskData.value = null
    
    // 清空输入框
    quickTaskInput.value = ''
    tempDescription.value = ''
    newTaskDescription.value = ''
    newTaskType.value = 'today'
    customDateTime.value = ''
    newTaskCategory.value = 'work'
    newTaskPriority.value = 'medium'
    selectedWeekdays.value = []
    enableReminder.value = false
    reminderDateTime.value = ''
    
    // 清空子任务相关状态
    showSubtaskSuggestion.value = false
    detectedSubtasks.value = []
    
    // 🆕 清空媒体资源
    tempMedia.value = []
    currentTaskId.value = null
    
    // 延迟显示成功提示
    setTimeout(() => {
      showNotification('✅ 任务创建成功！', 'success')
    }, 300)
    
    // 更新每日摘要通知
    await scheduleDailySummaryNotification()
    
    console.log('=== 任务保存完成 ===')
  } catch (error) {
    console.error('❌ 保存任务失败:', error)
    showNotification(`❌ 保存失败: ${error.message}`, 'error')
  }
}

// 🆕 处理预览模式的AI拆分（复用任务详情的逻辑）
const handlePreviewSplit = async () => {
  if (!previewTaskData.value) return
  
  // 复用 handleSplitTask 的逻辑
  currentSplittingTask.value = previewTaskData.value
  
  // 询问用户想拆分成几个子任务
  const countInput = prompt('请输入要拆分的子任务数量（2-10个）：', '5')
  
  if (countInput === null) {
    // 用户取消
    return
  }
  
  const subtaskCount = parseInt(countInput)
  
  if (isNaN(subtaskCount) || subtaskCount < 2 || subtaskCount > 10) {
    showNotification('请输入2-10之间的数字', 'error')
    return
  }
  
  try {
    // 显示loading
    aiLoading.value = true
    aiLoadingText.value = `AI 正在拆解为 ${subtaskCount} 个子任务...`
    aiLoadingSubText.value = '请稍候，正在分析任务内容'
    
    const splitResult = await AITaskSplitter.splitTask(
      previewTaskData.value.text, 
      previewTaskData.value.description, 
      subtaskCount
    )
    
    if (splitResult.length > 0) {
      // 添加 category 继承
      const subtasksWithCategory = splitResult.map(item => ({
        ...item,
        category: previewTaskData.value.category || 'work'
      }))
      subtasks.value = subtasksWithCategory
      showSubtaskPreview.value = true
      showNotification(`✨ AI 已拆解为 ${splitResult.length} 个子任务`, 'success')
    } else {
      showNotification('未能拆解任务，请重试', 'warning')
    }
  } catch (error) {
    console.error('AI拆解失败:', error)
    showNotification(`AI拆解失败：${error.message}`, 'error')
  } finally {
    // 关闭loading
    aiLoading.value = false
  }
}

// 🆕 从预览模式创建子任务
// 处理任务详情的通知事件
const handleTaskNotify = (payload) => {
  console.log('handleTaskNotify 被调用:', payload)
  showNotification(payload.message, payload.type)
}

// 🆕 处理子任务创建事件（根据模式选择不同的处理方式）
const handleSubtaskCreate = (subtasks) => {
  console.log('=== handleSubtaskCreate 被调用 ===')
  console.log('showTaskInputPreview:', showTaskInputPreview.value)
  console.log('子任务数量:', subtasks.length)
  
  if (showTaskInputPreview.value) {
    // 预览模式：暂存子任务
    console.log('调用 storeSubtasksForPreview')
    storeSubtasksForPreview(subtasks)
  } else {
    // 正常模式：立即创建子任务
    console.log('调用 createSubtasks')
    createSubtasks(subtasks)
  }
}

// 🆕 预览模式中暂存子任务（不立即创建）
const storeSubtasksForPreview = (subtasks) => {
  console.log('=== 预览模式暂存子任务 ===')
  console.log('子任务数量:', subtasks.length)
  
  // 暂存子任务数据
  pendingSubtasks.value = subtasks
  
  // 关闭AI拆分弹窗
  showTaskSplitter.value = false
  taskToSplit.value = null
  
  // 显示提示
  showNotification(`✅ 已准备 ${subtasks.length} 个子任务，点击"确认保存"创建`, 'success')
  
  console.log('=== 子任务暂存完成，等待用户确认保存 ===')
}

const createSubtasksFromPreview = async (subtasks) => {
  console.log('=== 预览模式创建子任务 ===')
  console.log('子任务数量:', subtasks.length)
  console.log('子任务数据:', subtasks)
  
  if (!previewTaskData.value || subtasks.length === 0) {
    console.error('❌ previewTaskData为空或子任务为空')
    return
  }
  
  try {
    // 1. 先创建父任务
    console.log('1️⃣ 创建父任务')
    const parentTask = {
      text: previewTaskData.value.text,
      description: previewTaskData.value.description,
      type: previewTaskData.value.type,
      category: previewTaskData.value.category,
      priority: previewTaskData.value.priority,
      weekdays: previewTaskData.value.weekdays,
      customDate: previewTaskData.value.customDate,
      customTime: previewTaskData.value.customTime,
      enableReminder: previewTaskData.value.enableReminder,
      reminderTime: previewTaskData.value.reminderTime,
      forceReminder: previewTaskData.value.forceReminder
    }
    
    const createdParent = await taskStore.addTask(parentTask)
    console.log('✅ 父任务创建成功，ID:', createdParent.id)
    
    // 2. 创建所有子任务
    console.log('2️⃣ 创建子任务')
    const now = new Date()
    const subtaskIds = []
    
    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i]
      const newTask = {
        id: Date.now() + i,
        text: subtask.title,
        description: subtask.description || '',
        type: 'today',
        category: createdParent.category,
        priority: subtask.priority || 'medium',
        status: 'pending',
        created_at: now.toISOString(),
        user_id: taskStore.currentUser,
        parentTaskId: Number(createdParent.id),
        estimatedHours: subtask.estimatedHours || 1,
        waitFor: []
      }
      
      await taskStore.addTask(newTask)
      subtaskIds.push(newTask.id)
      console.log(`✅ 子任务 ${i + 1} 创建成功`)
    }
    
    // 3. 更新父任务
    console.log('3️⃣ 更新父任务')
    createdParent.hasSplitted = true
    createdParent.subtaskCount = subtasks.length
    createdParent.subtasks = subtaskIds
    await taskStore.updateTask(createdParent)
    console.log('✅ 父任务更新成功')
    
    // 4. 关闭所有弹窗
    showTaskSplitter.value = false
    taskToSplit.value = null
    showTaskInputPreview.value = false
    previewTaskData.value = null
    
    // 5. 清空输入框和子任务状态
    quickTaskInput.value = ''
    tempDescription.value = ''
    newTaskDescription.value = ''
    pendingSubtasks.value = []  // 🆕 清空待创建子任务列表
    
    // 6. 延迟显示成功提示（等待弹窗关闭动画完成）
    setTimeout(() => {
      showNotification(`✅ 成功创建主任务和 ${subtasks.length} 个子任务！`, 'success')
      console.log('=== 子任务创建完成 ===')
    }, 300)
  } catch (error) {
    console.error('❌ 创建子任务失败:', error)
    showNotification(`❌ 创建失败: ${error.message}`, 'error')
  }
}

// 📋 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    // 读取当前剪贴板
    const { value } = await Clipboard.read()
    
    // 加载历史记录
    const history = JSON.parse(localStorage.getItem('clipboard_history') || '[]')
    
    // 如果当前剪贴板有内容，直接粘贴并记录
    if (value && value.trim()) {
      // 粘贴到输入框
      newTaskDescription.value += value
      
      // 记录到历史（去重）
      const exists = history.some(item => item.text === value)
      if (!exists) {
        history.unshift({
          text: value,
          time: new Date().toLocaleString('zh-CN', { 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        })
        // 只保留最近10条
        if (history.length > 10) history.pop()
        localStorage.setItem('clipboard_history', JSON.stringify(history))
      }
      
      showNotification('✅ 已粘贴', 'success')
    } else {
      showNotification('剪贴板为空', 'info')
    }
  } catch (err) {
    console.error('读取剪贴板失败:', err)
    showNotification('❌ 读取剪贴板失败', 'error')
  }
}

// 📋 显示粘贴历史（长按粘贴按钮）
const showPasteHistory = () => {
  const history = JSON.parse(localStorage.getItem('clipboard_history') || '[]')
  if (history.length > 0) {
    clipboardHistory.value = history
    showClipboardHistory.value = true
  } else {
    showNotification('暂无粘贴历史', 'info')
  }
}

// 长按检测
let pasteLongPressTimer = null
const handlePasteTouchStart = () => {
  pasteLongPressTimer = setTimeout(() => {
    showPasteHistory()
  }, 500) // 长按500ms触发
}
const handlePasteTouchEnd = () => {
  if (pasteLongPressTimer) {
    clearTimeout(pasteLongPressTimer)
    pasteLongPressTimer = null
  }
}

// 选择剪贴板历史项
const selectClipboardItem = (text) => {
  newTaskDescription.value += text
  showClipboardHistory.value = false
  showNotification('✅ 已粘贴', 'success')
}

// 清空剪贴板历史
const clearClipboardHistory = () => {
  if (confirm('确定要清空剪贴板历史吗？')) {
    localStorage.removeItem('clipboard_history')
    clipboardHistory.value = []
    showClipboardHistory.value = false
    showNotification('✅ 已清空', 'success')
  }
}

// 🔄 清空描述
const clearDescription = () => {
  if (!newTaskDescription.value.trim()) {
    showNotification('描述已经是空的', 'info')
    return
  }
  
  if (confirm('确定要清空描述吗？')) {
    newTaskDescription.value = ''
    showNotification('✅ 已清空', 'success')
  }
}

// 🖼️ 选择图片并插入
const pickImageForTask = async () => {
  try {
    // 1. 选择图片
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos
    })
    
    if (!photo.base64String) {
      showNotification('图片选择失败', 'error')
      return
    }
    
    // 2. 生成媒体ID和文件名
    const mediaId = `img_${Date.now()}`
    const fileName = `${mediaId}.jpg`
    const taskId = currentTaskId.value || 'temp'
    
    // 3. 确保目录存在
    try {
      await Filesystem.mkdir({
        path: `media/${taskId}`,
        directory: Directory.Data,
        recursive: true
      })
    } catch (e) {
      // 目录可能已存在，忽略错误
      console.log('目录已存在或创建失败:', e)
    }
    
    // 4. 保存到本地
    await Filesystem.writeFile({
      path: `media/${taskId}/${fileName}`,
      data: photo.base64String,
      directory: Directory.Data
    })
    
    // 5. 保存元数据到临时数组
    tempMedia.value.push({
      id: mediaId,
      type: 'image',
      name: fileName,
      path: `media/${taskId}/${fileName}`,
      size: photo.base64String.length,
      uploadedAt: new Date().toISOString()
    })
    
    // 6. 插入 Markdown 语法到光标位置
    const syntax = `\n![图片](local://${mediaId})\n`
    const textarea = document.querySelector('.fullscreen-desc-textarea')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = newTaskDescription.value
      newTaskDescription.value = text.substring(0, start) + syntax + text.substring(end)
      
      // 移动光标到插入内容后面
      await nextTick()
      textarea.selectionStart = textarea.selectionEnd = start + syntax.length
      textarea.focus()
    } else {
      // 如果找不到textarea，直接追加到末尾
      newTaskDescription.value += syntax
    }
    
    showNotification('✅ 图片已插入', 'success')
  } catch (error) {
    console.error('图片上传失败:', error)
    showNotification('图片上传失败: ' + error.message, 'error')
  }
}

// 📎 选择文件并插入（PDF、文档、视频等）
const pickFileForTask = async () => {
  try {
    // 创建文件选择器
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov,.avi,.zip,.txt'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      // 文件大小限制 10MB
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        showNotification('文件大小不能超过 10MB', 'error')
        return
      }
      
      // 读取文件为 base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const base64Data = event.target.result.split(',')[1]
          
          // 生成媒体ID和文件名
          const mediaId = `file_${Date.now()}`
          const ext = file.name.split('.').pop()
          const fileName = `${mediaId}.${ext}`
          const taskId = currentTaskId.value || 'temp'
          
          // 确定文件类型
          const fileType = getFileType(ext)
          
          // 确保目录存在
          try {
            await Filesystem.mkdir({
              path: `media/${taskId}`,
              directory: Directory.Data,
              recursive: true
            })
          } catch (e) {
            console.log('目录已存在或创建失败:', e)
          }
          
          // 保存到本地
          await Filesystem.writeFile({
            path: `media/${taskId}/${fileName}`,
            data: base64Data,
            directory: Directory.Data
          })
          
          // 保存元数据
          tempMedia.value.push({
            id: mediaId,
            type: fileType,
            name: file.name,
            originalName: file.name,
            path: `media/${taskId}/${fileName}`,
            size: file.size,
            ext: ext,
            uploadedAt: new Date().toISOString()
          })
          
          // 插入 Markdown 语法
          const syntax = `\n[📎 ${file.name}](local://${mediaId})\n`
          const textarea = document.querySelector('.fullscreen-desc-textarea')
          if (textarea) {
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const text = newTaskDescription.value
            newTaskDescription.value = text.substring(0, start) + syntax + text.substring(end)
            
            await nextTick()
            textarea.selectionStart = textarea.selectionEnd = start + syntax.length
            textarea.focus()
          } else {
            newTaskDescription.value += syntax
          }
          
          showNotification(`✅ ${file.name} 已插入`, 'success')
        } catch (error) {
          console.error('文件上传失败:', error)
          showNotification('文件上传失败: ' + error.message, 'error')
        }
      }
      
      reader.readAsDataURL(file)
    }
    
    input.click()
  } catch (error) {
    console.error('文件选择失败:', error)
    showNotification('文件选择失败: ' + error.message, 'error')
  }
}

// 🔍 根据扩展名判断文件类型
const getFileType = (ext) => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv']
  const docExts = ['doc', 'docx', 'txt', 'rtf']
  const excelExts = ['xls', 'xlsx', 'csv']
  const pptExts = ['ppt', 'pptx']
  const pdfExts = ['pdf']
  const zipExts = ['zip', 'rar', '7z', 'tar', 'gz']
  
  ext = ext.toLowerCase()
  
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (docExts.includes(ext)) return 'document'
  if (excelExts.includes(ext)) return 'excel'
  if (pptExts.includes(ext)) return 'powerpoint'
  if (pdfExts.includes(ext)) return 'pdf'
  if (zipExts.includes(ext)) return 'archive'
  
  return 'file'
}

// 💡 生成 AI 智能建议（新版：模板选择 + 预览）
const generateAISuggestions = async () => {
  if (!quickTaskInput.value.trim()) {
    showNotification('请先输入任务标题', 'error')
    return
  }
  
  // 显示模板选择器
  currentAIMode.value = 'suggestion'
  showTemplateSelector.value = true
}

// 处理模板选择
const handleTemplateSelect = async (template) => {
  showTemplateSelector.value = false
  
  if (currentAIMode.value === 'suggestion') {
    await generateAISuggestionsWithTemplate(template)
  }
}

// 使用模板生成建议
const generateAISuggestionsWithTemplate = async (template) => {
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在生成...'
    
    // 获取默认模型配置
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const defaultModel = models.find(m => m.id === defaultModelId) || models[0]
    
    if (!defaultModel) {
      showNotification('请先配置 AI 模型', 'error')
      aiLoading.value = false
      return
    }
    
    // 构建prompt
    let prompt
    if (template) {
      // 使用模板
      prompt = `任务标题："${quickTaskInput.value}"

${template.prompt}

要求：
1. 结合任务标题生成具体内容
2. 列出3-5个关键要点
3. 每个要点简洁明了（10-20字）
4. 按执行顺序排列
5. 具有可操作性
6. 只返回要点列表，每行一条，以 "- " 开头`
    } else {
      // 自定义生成
      prompt = `请根据任务标题"${quickTaskInput.value}"，生成一段详细的任务描述建议。

要求：
1. 描述任务的目标和意义
2. 列出3-5个关键执行步骤或要点
3. 每个要点简洁明了（10-20字）
4. 按执行顺序排列
5. 具有可操作性
6. 只返回建议列表，每行一条，以 "- " 开头

示例格式：
- 第一步要做什么
- 第二步要做什么
- 第三步要做什么`
    }
    
    // 确保 URL 使用 OpenAI 兼容接口
    let apiUrl = defaultModel.url
    if (!apiUrl.includes('/v1/chat/completions')) {
      apiUrl = apiUrl.replace(/\/api\/.*$/, '').replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultModel.apiKey || 'dummy'}`
      },
      body: JSON.stringify({
        model: defaultModel.modelName || defaultModel.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API错误:', response.status, errorText)
      throw new Error(`AI 请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('AI返回数据:', JSON.stringify(data, null, 2))
    
    // 兼容多种返回格式
    let content = ''
    if (data.choices?.[0]?.message?.content) {
      content = data.choices[0].message.content
    } else if (data.choices?.[0]?.message?.reasoning) {
      // 某些模型把内容放在reasoning字段
      content = data.choices[0].message.reasoning
    } else if (data.response) {
      // Ollama格式
      content = data.response
    }
    
    console.log('AI生成内容:', content)
    
    if (!content || content.trim() === '') {
      throw new Error('AI返回内容为空，请检查模型配置或增加max_tokens')
    }
    
    // 保存当前模板和内容，用于重新生成
    currentAITemplate.value = template
    aiPreviewContent.value = content
    aiPreviewTitle.value = template ? `✨ ${template.name}建议` : '✨ AI建议'
    showAIPreview.value = true
    
  } catch (err) {
    console.error('AI 建议生成失败:', err)
    showNotification(`❌ AI 建议生成失败: ${err.message}`, 'error')
    showNotification('❌ AI 建议生成失败', 'error')
  } finally {
    aiLoading.value = false
  }
}

// 🤖 AI 续写描述（新版：预览模式）
const continueDescription = async () => {
  if (!newTaskDescription.value.trim()) {
    showNotification('请先输入一些内容', 'error')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在续写...'
    aiLoadingSubText.value = '智能补充任务描述'
    
    currentAIMode.value = 'continue'
    
    const result = await AITaskGenerator.continueText(newTaskDescription.value)
    if (result.success) {
      aiPreviewContent.value = result.text
      aiPreviewTitle.value = '🤖 AI续写预览'
      showAIPreview.value = true
      showNotification('✨ AI 续写完成', 'success')
    } else {
      showNotification(result.error || 'AI 续写失败', 'error')
    }
  } catch (error) {
    console.error('AI 续写失败:', error)
    showNotification('AI 续写失败', 'error')
  } finally {
    aiLoading.value = false
  }
}

// 采纳AI生成的内容
const handleAdoptAIContent = (content) => {
  if (currentAIMode.value === 'suggestion') {
    // AI建议：追加到描述框开头
    newTaskDescription.value = content + '\n\n' + newTaskDescription.value
  } else if (currentAIMode.value === 'continue') {
    // AI续写：追加到描述框末尾
    newTaskDescription.value += '\n\n' + content
  } else if (currentAIMode.value === 'polish' || currentAIMode.value === 'rewrite') {
    // 优化润色/改写风格：替换原内容
    newTaskDescription.value = content
  } else if (currentAIMode.value === 'extract') {
    // 提取要点：替换原内容
    newTaskDescription.value = content
  } else if (currentAIMode.value === 'markdown') {
    // Markdown渲染：替换原内容并切换到预览模式
    newTaskDescription.value = content
    isMarkdownPreview.value = true
  }
  
  showAIPreview.value = false
  showNotification('✅ 已采纳内容', 'success')
}

// 🤖 AI助手菜单控制
const toggleAIMenu = () => {
  showAIMenu.value = !showAIMenu.value
}

const handleAITouchStart = () => {
  aiTouchTimer = setTimeout(() => {
    // 长按快速执行智能建议
    if (quickTaskInput.value.trim()) {
      showAIMenu.value = false
      generateAISuggestions()
    }
  }, 500)
}

const handleAITouchEnd = () => {
  if (aiTouchTimer) {
    clearTimeout(aiTouchTimer)
    aiTouchTimer = null
  }
}

// 处理AI功能选择
const handleAIAction = async (action) => {
  showAIMenu.value = false
  
  switch (action) {
    case 'suggestion':
      await generateAISuggestions()
      break
    case 'continue':
      await continueDescription()
      break
    case 'polish':
      await polishDescription()
      break
    case 'markdown':
      await renderMarkdown()
      break
    case 'generateTitle':
      await generateTitle()
      break
    case 'extract':
      await extractKeyPoints()
      break
    case 'rewrite':
      await rewriteStyle()
      break
  }
}

// 📐 Markdown 渲染
const renderMarkdown = async () => {
  if (!newTaskDescription.value.trim()) {
    showNotification('请先输入内容', 'error')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在格式化...'
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const defaultModel = models.find(m => m.id === defaultModelId) || models[0]
    
    if (!defaultModel) {
      showNotification('请先配置 AI 模型', 'error')
      return
    }
    
    const prompt = `请将以下内容转换为格式良好的 Markdown 格式：

${newTaskDescription.value}

要求：
1. 自动识别标题、列表、步骤等结构
2. 使用合适的 Markdown 语法（# 标题、- 列表、\`代码\`、**加粗**等）
3. 保持内容完整，不要删减
4. 优化排版和层级结构
5. 如果有代码，使用代码块包裹
6. 直接返回 Markdown 格式的内容，不要额外说明`
    
    let apiUrl = defaultModel.url
    if (!apiUrl.includes('/v1/chat/completions')) {
      apiUrl = apiUrl.replace(/\/api\/.*$/, '').replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
    }
    
    const requestBody = {
      model: defaultModel.modelName || defaultModel.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    }
    
    // Ollama 使用 num_predict，OpenAI 使用 max_tokens
    if (apiUrl.includes('11434') || apiUrl.includes('ollama')) {
      requestBody.num_predict = 2000
    } else {
      requestBody.max_tokens = 2000
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultModel.apiKey || 'dummy'}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) throw new Error('AI 请求失败')
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || data.response || ''
    
    if (content) {
      currentAIMode.value = 'markdown'
      aiPreviewContent.value = content
      aiPreviewTitle.value = '📐 Markdown 渲染预览'
      showAIPreview.value = true
      showNotification('✨ 格式化完成', 'success')
    }
  } catch (error) {
    console.error('格式化失败:', error)
    showNotification('格式化失败', 'error')
  } finally {
    aiLoading.value = false
  }
}

// ✨ 生成标题
const generateTitle = async () => {
  if (!newTaskDescription.value.trim()) {
    showNotification('请先输入描述内容', 'error')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在生成标题...'
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const defaultModel = models.find(m => m.id === defaultModelId) || models[0]
    
    if (!defaultModel) {
      showNotification('请先配置 AI 模型', 'error')
      return
    }
    
    const prompt = `请根据以下任务描述，生成一个简洁、准确的任务标题（10-20字）：

${newTaskDescription.value}

要求：
1. 标题要简洁明了，突出核心内容
2. 长度控制在10-20字
3. 使用动词开头（如：完成、编写、学习、优化等）
4. 只返回标题文本，不要额外说明`
    
    let apiUrl = defaultModel.url
    if (!apiUrl.includes('/v1/chat/completions')) {
      apiUrl = apiUrl.replace(/\/api\/.*$/, '').replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
    }
    
    const requestBody = {
      model: defaultModel.modelName || defaultModel.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }
    
    if (apiUrl.includes('11434') || apiUrl.includes('ollama')) {
      requestBody.num_predict = 100
    } else {
      requestBody.max_tokens = 100
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultModel.apiKey || 'dummy'}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) throw new Error('AI 请求失败')
    
    const data = await response.json()
    const title = (data.choices?.[0]?.message?.content || data.response || '').trim()
    
    if (title) {
      quickTaskInput.value = title
      showNotification('✨ 标题已生成', 'success')
    }
  } catch (error) {
    console.error('生成标题失败:', error)
    showNotification('生成标题失败', 'error')
  } finally {
    aiLoading.value = false
  }
}

// 🎯 优化润色
const polishDescription = async () => {
  if (!newTaskDescription.value.trim()) {
    showNotification('请先输入内容', 'error')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在优化...'
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const defaultModel = models.find(m => m.id === defaultModelId) || models[0]
    
    if (!defaultModel) {
      showNotification('请先配置 AI 模型', 'error')
      return
    }
    
    const prompt = `请优化以下任务描述，使其更清晰、专业、易读：

${newTaskDescription.value}

要求：
1. 保持原意不变
2. 改善表达和结构
3. 使用更准确的词汇
4. 保持简洁明了
5. 直接返回优化后的内容，不要额外说明`
    
    let apiUrl = defaultModel.url
    if (!apiUrl.includes('/v1/chat/completions')) {
      apiUrl = apiUrl.replace(/\/api\/.*$/, '').replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultModel.apiKey || 'dummy'}`
      },
      body: JSON.stringify({
        model: defaultModel.modelName || defaultModel.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    })
    
    if (!response.ok) throw new Error('AI 请求失败')
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || data.response || ''
    
    if (content) {
      currentAIMode.value = 'polish'
      aiPreviewContent.value = content
      aiPreviewTitle.value = '🎯 优化润色预览'
      showAIPreview.value = true
      showNotification('✨ 优化完成', 'success')
    }
  } catch (error) {
    console.error('优化失败:', error)
    showNotification('优化失败', 'error')
  } finally {
    aiLoading.value = false
  }
}

// 📋 提取要点
const extractKeyPoints = async () => {
  if (!newTaskDescription.value.trim() || newTaskDescription.value.length < 50) {
    showNotification('内容太短，无需提取', 'error')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在提取...'
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const defaultModel = models.find(m => m.id === defaultModelId) || models[0]
    
    if (!defaultModel) {
      showNotification('请先配置 AI 模型', 'error')
      return
    }
    
    const prompt = `请从以下任务描述中提取关键要点和执行步骤：

${newTaskDescription.value}

要求：
1. 提取3-5个核心要点
2. 每个要点简洁明了（10-20字）
3. 按执行顺序排列
4. 以 "- " 开头，每行一条
5. 只返回要点列表，不要额外说明`
    
    let apiUrl = defaultModel.url
    if (!apiUrl.includes('/v1/chat/completions')) {
      apiUrl = apiUrl.replace(/\/api\/.*$/, '').replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultModel.apiKey || 'dummy'}`
      },
      body: JSON.stringify({
        model: defaultModel.modelName || defaultModel.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    })
    
    if (!response.ok) throw new Error('AI 请求失败')
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || data.response || ''
    
    if (content) {
      currentAIMode.value = 'extract'
      aiPreviewContent.value = content
      aiPreviewTitle.value = '📋 关键要点'
      showAIPreview.value = true
      showNotification('✨ 提取完成', 'success')
    }
  } catch (error) {
    console.error('提取失败:', error)
    showNotification('提取失败', 'error')
  } finally {
    aiLoading.value = false
  }
}

// 🔄 改写风格
const rewriteStyle = async () => {
  if (!newTaskDescription.value.trim()) {
    showNotification('请先输入内容', 'error')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在改写...'
    
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const defaultModelId = localStorage.getItem('ai_default_model')
    const defaultModel = models.find(m => m.id === defaultModelId) || models[0]
    
    if (!defaultModel) {
      showNotification('请先配置 AI 模型', 'error')
      return
    }
    
    const prompt = `请用更简洁、口语化的方式改写以下任务描述：

${newTaskDescription.value}

要求：
1. 保持原意不变
2. 使用简单易懂的表达
3. 去除冗余内容
4. 更加口语化、自然
5. 直接返回改写后的内容，不要额外说明`
    
    let apiUrl = defaultModel.url
    if (!apiUrl.includes('/v1/chat/completions')) {
      apiUrl = apiUrl.replace(/\/api\/.*$/, '').replace(/\/v1.*$/, '').replace(/\/$/, '') + '/v1/chat/completions'
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultModel.apiKey || 'dummy'}`
      },
      body: JSON.stringify({
        model: defaultModel.modelName || defaultModel.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    })
    
    if (!response.ok) throw new Error('AI 请求失败')
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || data.response || ''
    
    if (content) {
      currentAIMode.value = 'rewrite'
      aiPreviewContent.value = content
      aiPreviewTitle.value = '🔄 风格改写预览'
      showAIPreview.value = true
      showNotification('✨ 改写完成', 'success')
    }
  } catch (error) {
    console.error('改写失败:', error)
    showNotification('改写失败', 'error')
  } finally {
    aiLoading.value = false
  }
}

// 重新生成AI内容
const handleRegenerateAI = async () => {
  if (currentAIMode.value === 'suggestion') {
    // 重新生成建议
    await generateAISuggestionsWithTemplate(currentAITemplate.value)
  } else if (currentAIMode.value === 'continue') {
    // 重新续写
    await continueDescription()
  }
}

// AI 周报生成
const generateWeeklyReport = async () => {
  // 获取本周完成的任务
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay()) // 本周日
  weekStart.setHours(0, 0, 0, 0)
  
  const completedTasks = taskStore.tasks.filter(task => {
    if (task.status !== 'completed' || !task.completed_at) return false
    const completedDate = new Date(task.completed_at)
    return completedDate >= weekStart
  })
  
  if (completedTasks.length === 0) {
    alert('本周还没有完成的任务')
    return
  }
  
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在生成周报...'
    aiLoadingSubText.value = `分析 ${completedTasks.length} 个任务`
    
    const weekEnd = new Date(now)
    weekEnd.setHours(23, 59, 59, 999)
    
    // 传入Date对象，不是字符串
    const generator = new AIReportGenerator(taskStore.tasks)
    const report = generator.generateWeeklyReport(weekStart, weekEnd, completedTasks)
    
    const startDateStr = weekStart.toISOString().split('T')[0]
    const endDateStr = weekEnd.toISOString().split('T')[0]
    
    // 保存到历史记录
    const reportHistory = JSON.parse(localStorage.getItem('weekly_reports') || '[]')
    const newReport = {
      id: Date.now(),
      title: `工作周报 (${startDateStr} ~ ${endDateStr})`,
      period: `${startDateStr} ~ ${endDateStr}`,
      reportType: 'weekly',
      startDate: startDateStr,
      endDate: endDateStr,
      content: report,
      createdAt: new Date().toISOString(),
      taskCount: completedTasks.length,
      completedCount: completedTasks.length
    }
    reportHistory.unshift(newReport) // 最新的在前面
    
    // 只保留最近20条
    if (reportHistory.length > 20) {
      reportHistory.splice(20)
    }
    
    localStorage.setItem('weekly_reports', JSON.stringify(reportHistory))
    
    // 使用弹窗显示周报
    weeklyReportContent.value = report
    weeklyReportTitle.value = newReport.title
    showWeeklyReportModal.value = true
    
    showNotification('✨ 周报已生成并保存', 'success')
  } catch (error) {
    console.error('AI生成周报失败:', error)
    alert(`AI生成周报失败：${error.message}`)
  } finally {
    aiLoading.value = false
  }
}

// AI 对话创建任务
const handleChatCreateTasks = (tasks) => {
  console.log('Creating tasks from chat:', tasks)
  
  // 将任务数据存储到临时变量
  aiExtractedTasks.value = tasks.map(task => ({
    text: task.text || task.title || '未命名任务',
    description: task.description || '',
    type: task.type || 'today',
    category: task.category || 'life',
    priority: task.priority || 'medium',
    customDate: task.customDate || null,
    customTime: task.customTime || null
  }))
  
  // 关闭AI对话窗口
  showAIChat.value = false
  
  // 打开任务预览弹窗
  showAITaskPreview.value = true
}

// 确认创建AI提取的任务
const handleConfirmAITasks = (tasks) => {
  tasks.forEach(task => {
    const newTask = {
      id: Date.now() + Math.random(),
      text: task.text,
      description: task.description,
      type: task.type,
      category: task.category,
      priority: task.priority,
      customDate: task.customDate,
      customTime: task.customTime,
      status: 'pending',
      created_at: new Date().toISOString(),
      completed_at: null,
      completedPomodoros: 0,
      estimatedPomodoros: task.priority === 'high' ? 4 : task.priority === 'medium' ? 2 : 1,
      pomodoroHistory: [],
      logs: [],
      stats: {
        sessionCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        blockCount: 0,
        resolvedBlockCount: 0,
        latestProgress: 0,
        progressHistory: []
      }
    }
    
    taskStore.addTask(newTask)
  })
  
  showNotification(`✅ 成功创建 ${tasks.length} 个任务`)
}

// AI 写作助手 - 智能提取任务信息

// 生成任务描述
const generateDescription = async () => {
  const title = newTaskText.value.trim()
  
  if (!title) {
    alert('请先输入任务标题')
    return
  }
  
  aiLoading.value = true
  aiLoadingText.value = 'AI 正在生成任务描述...'
  aiLoadingSubText.value = '基于任务标题智能生成'
  
  try {
    const generatedDesc = await AITaskGenerator.generateDescription(title)
    newTaskDescription.value = generatedDesc
    showNotification('✨ AI 已生成任务描述', 'success')
  } catch (error) {
    console.error('AI生成失败:', error)
    alert(`AI生成失败：${error.message}`)
  } finally {
    aiLoading.value = false
  }
}

// 任务输入框失焦时触发智能分类

// 采纳 AI 建议
const applySuggestion = () => {
  if (aiSuggestion.value) {
    newTaskCategory.value = aiSuggestion.value.category
    newTaskPriority.value = aiSuggestion.value.priority
    
    // 如果有时间信息，也应用
    if (aiSuggestion.value.customDate && aiSuggestion.value.customTime) {
      newTaskType.value = aiSuggestion.value.type || 'custom_date'
      customDateTime.value = `${aiSuggestion.value.customDate}T${aiSuggestion.value.customTime}`
    }
    
    showNotification('✅ 已采纳 AI 建议', 'success')
    aiSuggestion.value = null
  }
}

// 忽略 AI 建议
const dismissSuggestion = () => {
  aiSuggestion.value = null
}

// 获取分类标签
const getCategoryLabel = (category) => {
  const labels = {
    work: '工作',
    study: '学习',
    life: '生活'
  }
  return labels[category] || category
}

// 获取优先级标签
const getPriorityLabel = (priority) => {
  const labels = {
    high: '高',
    medium: '中',
    low: '低',
    urgent: '紧急'
  }
  return labels[priority] || priority
}

const copyAIResult = () => {
  navigator.clipboard.writeText(aiResultText.value)
  showNotification('已复制到剪贴板', 'success')
  showAIResult.value = false
}

const handleAIConfigSaved = () => {
  alert('AI配置已保存')
}

// 数据库配置保存处理
const handleDatabaseConfigSaved = (config) => {
  console.log('✅ 数据库配置已保存:', config)
  // TODO: 根据配置初始化对应的数据库连接
}

// 通知设置
const notificationSettings = ref({
  dailySummaryEnabled: true,
  dailySummaryTime: '09:00'
})

// 加载通知设置
const loadNotificationSettings = async () => {
  try {
    const { value } = await Preferences.get({ key: `notification_settings_${userStore.currentUser}` })
    if (value) {
      notificationSettings.value = JSON.parse(value)
    }
  } catch (error) {
    console.error('加载通知设置失败:', error)
  }
}

// 保存通知设置
const saveNotificationSettings = async () => {
  try {
    await Preferences.set({
      key: `notification_settings_${userStore.currentUser}`,
      value: JSON.stringify(notificationSettings.value)
    })
    showNotification('✅ 通知设置已保存', 'success')
    showNotificationSettings.value = false
    // 重新调度每日摘要通知
    await scheduleDailySummaryNotification()
  } catch (error) {
    console.error('保存通知设置失败:', error)
    showNotification('❌ 保存失败', 'error')
  }
}

const showPrivacyPolicy = ref(false)
const showDataInfo = ref(false)
const showUserGuide = ref(false) // 使用指南弹窗
const showPomodoroRules = ref(false) // 番茄规则弹窗
const showPomodoroStats = ref(false) // 番茄钟统计弹窗
const showWelcome = ref(false) // 首次登录欢迎弹窗
const showBackupReminder = ref(false) // 定期备份提醒弹窗
const showNotificationGuide = ref(false) // 通知设置指南弹窗
const showPomodoroTimer = ref(false) // 番茄钟计时器弹窗
const showPasswordModal = ref(false)
const showPhoneModal = ref(false)
const showWeeklyModal = ref(false)
const showCustomDateModal = ref(false)
const showReportModal = ref(false) // 数据报告弹窗（已废弃，保留兼容）
const showBackupList = ref(false) // 备份列表弹窗
const showCustomReportModal = ref(false) // 自定义报告弹窗（已废弃，保留兼容）
const showReportTemplates = ref(false) // 报告模板弹窗
const showTemplateDetail = ref(false) // 模板详情弹窗
const showTemplateEditor = ref(false) // 模板编辑弹窗
const currentTemplate = ref(null) // 当前查看/编辑的模板
const showUnifiedReport = ref(false) // 统一报告弹窗（新）
const historyReportData = ref(null) // 历史报告数据

// 关闭统一报告
const closeUnifiedReport = () => {
  showUnifiedReport.value = false
  historyReportData.value = null // 清空历史数据
}

// 自定义报告配置
const customReportConfig = ref({
  type: 'weekly', // daily, weekly, monthly, quarterly, halfyearly, yearly, custom
  startDate: '',
  endDate: ''
})

// 报告类型选项
const reportTypes = [
  { value: 'daily', label: '日报', icon: '📝', desc: '今日工作总结' },
  { value: 'weekly', label: '周报', icon: '📅', desc: '本周工作总结' },
  { value: 'monthly', label: '月报', icon: '📊', desc: '本月工作总结' },
  { value: 'quarterly', label: '季报', icon: '📈', desc: '本季度工作总结' },
  { value: 'halfyearly', label: '半年报', icon: '📆', desc: '半年工作总结' },
  { value: 'yearly', label: '年报', icon: '🎯', desc: '全年工作总结' },
  { value: 'custom', label: '自定义', icon: '⚙️', desc: '自选时间范围' }
]

// 报告模板选项
const reportTemplates = ref([
  { 
    value: 'work', 
    label: '工作报告', 
    icon: '💼', 
    desc: '完整工作汇报，适用于所有时间维度',
    features: ['智能总结', '分类统计', '进度追踪', '风险预警'],
    sections: [
      { key: 'summary', label: '📝 智能总结', enabled: true },
      { key: 'overview', label: '📊 数据概览', enabled: true },
      { key: 'previousCompleted', label: '✅ 上期完成', enabled: true },
      { key: 'currentGoals', label: '🎯 本期目标', enabled: true },
      { key: 'currentProgress', label: '📈 本期进展', enabled: true },
      { key: 'keyWorks', label: '⭐ 关键工作', enabled: true },
      { key: 'nextPlan', label: '🔜 下期计划', enabled: true },
      { key: 'risks', label: '⚠️ 风险与问题', enabled: true }
    ]
  },
  { 
    value: 'standard', 
    label: '标准模板', 
    icon: '📝', 
    desc: '适合日常周报',
    features: ['统计数据', 'AI总结', '任务列表'],
    sections: [
      { key: 'stats', label: '📊 统计数据', enabled: true },
      { key: 'aiSummary', label: '🤖 AI总结', enabled: true },
      { key: 'taskList', label: '📋 任务列表', enabled: true },
      { key: 'charts', label: '📈 图表分析', enabled: false },
      { key: 'trends', label: '📉 趋势对比', enabled: false }
    ]
  },
  { 
    value: 'detailed', 
    label: '详细模板', 
    icon: '📊', 
    desc: '包含所有统计和图表',
    features: ['完整统计', '图表分析', 'AI建议', '趋势对比'],
    sections: [
      { key: 'stats', label: '📊 统计数据', enabled: true },
      { key: 'aiSummary', label: '🤖 AI总结', enabled: true },
      { key: 'taskList', label: '📋 任务列表', enabled: true },
      { key: 'charts', label: '📈 图表分析', enabled: true },
      { key: 'trends', label: '📉 趋势对比', enabled: true },
      { key: 'heatmap', label: '🔥 热力图', enabled: true }
    ]
  },
  { 
    value: 'simple', 
    label: '简洁模板', 
    icon: '⚡', 
    desc: '只包含核心数据',
    features: ['核心数据', '完成任务'],
    sections: [
      { key: 'stats', label: '📊 统计数据', enabled: true },
      { key: 'taskList', label: '📋 任务列表', enabled: true },
      { key: 'aiSummary', label: '🤖 AI总结', enabled: false },
      { key: 'charts', label: '📈 图表分析', enabled: false }
    ]
  }
])

// 查看模板详情
const viewTemplateDetail = (template) => {
  currentTemplate.value = JSON.parse(JSON.stringify(template))
  showTemplateDetail.value = true
}

// 编辑模板
const editTemplate = (template) => {
  currentTemplate.value = JSON.parse(JSON.stringify(template))
  showTemplateEditor.value = true
}

// 保存模板编辑
const saveTemplateEdit = () => {
  const index = reportTemplates.value.findIndex(t => t.value === currentTemplate.value.value)
  if (index !== -1) {
    reportTemplates.value[index] = currentTemplate.value
    showNotification('模板已保存', 'success')
    showTemplateEditor.value = false
  }
}

// 生成自定义报告
const generateCustomReport = () => {
  const config = customReportConfig.value
  
  // 验证自定义日期
  if (config.type === 'custom') {
    if (!config.startDate || !config.endDate) {
      showNotification('请选择开始和结束日期', 'error')
      return
    }
    if (new Date(config.startDate) > new Date(config.endDate)) {
      showNotification('开始日期不能晚于结束日期', 'error')
      return
    }
  }
  
  showCustomReportModal.value = false
  showNotification('正在生成报告...', 'info')
  
  // 调用AIReportModal生成报告
  setTimeout(() => {
    showAIReport.value = true
  }, 300)
}

// 使用模板
const useTemplate = (templateValue) => {
  customReportConfig.value.template = templateValue
  showReportTemplates.value = false
  showTemplateDetail.value = false
  showCustomReportModal.value = true
  showNotification(`已选择${reportTemplates.value.find(t => t.value === templateValue)?.label}`, 'success')
}

// 番茄钟状态
const pomodoroState = ref({
  isRunning: false,
  isPaused: false,
  currentTask: null,
  remainingSeconds: 25 * 60,
  mode: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
  completedCount: 0,
  startTime: null
})

let pomodoroInterval = null
const backupFiles = ref([]) // 备份文件列表
const reportType = ref('weekly') // 报告类型（默认：周报）
const customStartDate = ref('') // 自定义开始日期
const customEndDate = ref('') // 自定义结束日期
const showReportStartCalendar = ref(false) // 自定义报告开始日期日历
const showReportEndCalendar = ref(false) // 自定义报告结束日期日历
const showCustomReportStartCalendar = ref(false) // 自定义报告配置开始日期日历
const showCustomReportEndCalendar = ref(false) // 自定义报告配置结束日期日历
const reportContent = ref('') // 报告内容（文本格式）
const reportData = ref({}) // 报告数据（结构化）
const showWeeklyReportModal = ref(false) // 周报弹窗显示状态
const weeklyReportContent = ref('') // 周报内容
const weeklyReportTitle = ref('') // 周报标题
const showReportHistoryModal = ref(false) // 周报历史弹窗
const reportHistoryList = ref([]) // 周报历史列表
const reportSearchKeyword = ref('') // 周报搜索关键词

// 过滤后的分组周报
const filteredGroupedReports = computed(() => {
  const keyword = reportSearchKeyword.value.toLowerCase().trim()
  
  if (!keyword) {
    return groupedReportHistory.value
  }
  
  const filterReports = (reports) => {
    return reports.filter(report => 
      report.title?.toLowerCase().includes(keyword) ||
      report.period?.toLowerCase().includes(keyword) ||
      report.content?.toLowerCase().includes(keyword)
    )
  }
  
  return {
    today: filterReports(groupedReportHistory.value.today),
    thisWeek: filterReports(groupedReportHistory.value.thisWeek),
    thisMonth: filterReports(groupedReportHistory.value.thisMonth),
    earlier: filterReports(groupedReportHistory.value.earlier)
  }
})

// showVersionModal, versionHistory, hasUnreadVersions 已在上方声明
const editingTask = ref(null)
const editDescription = ref('')
const editText = ref('')
const editCategory = ref('work')
const editPriority = ref('medium')
const editType = ref('today')
const editCustomDateTime = ref('')
const editWeekdays = ref([])
const editMonthDay = ref(1)
const showAddForm = ref(true)
const currentPage = ref(1)
const pageSize = ref(7) // 改为响应式
const jumpToPage = ref('') // 跳转页码输入

// 月度趋势图配置
const monthlyTrendChartOption = computed(() => {
  if (!reportData.value.monthlyTrend || reportData.value.monthlyTrend.length === 0) return {}
  
  const months = reportData.value.monthlyTrend.map(m => m.month)
  const taskCounts = reportData.value.monthlyTrend.map(m => m.count)
  const pomodoros = reportData.value.monthlyTrend.map(m => m.pomodoros)
  
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: [currentLanguage.value === 'zh' ? '完成任务数' : 'Tasks', currentLanguage.value === 'zh' ? '番茄钟' : 'Pomodoros'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months
    },
    yAxis: [
      {
        type: 'value',
        name: currentLanguage.value === 'zh' ? '任务数' : 'Tasks',
        position: 'left'
      },
      {
        type: 'value',
        name: currentLanguage.value === 'zh' ? '番茄钟' : 'Pomodoros',
        position: 'right'
      }
    ],
    series: [
      {
        name: currentLanguage.value === 'zh' ? '完成任务数' : 'Tasks',
        type: 'line',
        smooth: true,
        data: taskCounts,
        itemStyle: {
          color: '#667eea'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
            ]
          }
        }
      },
      {
        name: currentLanguage.value === 'zh' ? '番茄钟' : 'Pomodoros',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: pomodoros,
        itemStyle: {
          color: '#f5576c'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 87, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 87, 108, 0.05)' }
            ]
          }
        }
      }
    ]
  }
})

// 饼图配置（精力分配）
const pieChartOption = computed(() => {
  if (!reportData.value.categories) return {}
  
  const categories = reportData.value.categories
  
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 🍅 ({d}%)'
    },
    legend: {
      show: false
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
        fontSize: 13,
        fontWeight: 600
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: categories.map(cat => ({
        name: `${cat.icon} ${cat.name}`,
        value: cat.pomodoros,
        itemStyle: {
          color: cat.color.includes('gradient') 
            ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
                { offset: 0, color: cat.color.match(/#[0-9a-f]{6}/gi)?.[0] || '#667eea' },
                { offset: 1, color: cat.color.match(/#[0-9a-f]{6}/gi)?.[1] || '#764ba2' }
              ]}
            : cat.color
        }
      }))
    }]
  }
})

// 雷达图配置
const radarChartOption = computed(() => {
  if (!reportData.value.categories) return {}
  
  const categories = reportData.value.categories
  const maxValue = Math.max(...categories.map(c => c.pomodoros), 10)
  
  return {
    backgroundColor: 'transparent',
    radar: {
      indicator: categories.map(cat => ({
        name: `${cat.icon} ${cat.name}`,
        max: maxValue
      })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#666',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(102, 126, 234, 0.1)'
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(102, 126, 234, 0.2)'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: categories.map(c => c.pomodoros),
        name: currentLanguage.value === 'zh' ? '番茄钟投入' : 'Pomodoro Investment',
        areaStyle: {
          color: 'rgba(102, 126, 234, 0.2)'
        },
        lineStyle: {
          color: '#667eea',
          width: 2
        },
        itemStyle: {
          color: '#667eea'
        }
      }]
    }]
  }
})
const currentLanguage = ref('zh') // 语言切换：zh 中文, en 英文
const priorityMode = ref('traditional') // 优先级模式：traditional 传统三级, eisenhower 时间象限法
const showChangelog = ref(false) // 更新日志弹窗
const fileInput = ref(null)
const restoreFileInput = ref(null)
const mainContent = ref(null)
const showFilterModal = ref(false)
const isRefreshing = ref(false)

// 🔔 通知提醒记录（防止重复提醒）
const notifiedTasks = new Set()

// 撤销Toast相关
const showUndoToast = ref(false)
const undoToastMessage = ref('')
let undoTimer = null
let pendingDeleteTask = null

// 个人主页相关
const newUsername = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const userProfileInfo = ref({
  registerTime: null,
  lastLoginTime: null,
  boundPhone: null
})

// 绑定手机号相关
const bindPhoneNumber = ref('')
const bindVerificationCode = ref('')
const bindGeneratedCode = ref('')
const bindCountdown = ref(0)
let bindTimer = null

// 获取当前用户名
const currentUsername = computed(() => userStore.currentUser)

// 筛选选项
const filters = [
  { label: '全部任务', value: 'all' },
  { label: '未完成', value: 'pending' },
  { label: '已完成', value: 'completed' },
  { label: '已逾期', value: 'overdue' }
]

// 分类选项
const categories = [
  { label: '工作', value: 'work', icon: '💼' },
  { label: '学习', value: 'study', icon: '📚' },
  { label: '生活', value: 'life', icon: '🏠' }
]

// 星期几选项
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 提醒记录（防止重复提醒）
// 已提醒记录已迁移到 Preferences，不再使用内存 Set

// 计算属性：按分类和时间筛选的任务（不按状态筛选，用于统计）
const baseFilteredTasks = computed(() => {
  let tasks = taskStore.getFilteredTasks('all', currentCategoryFilter.value, {
    start: startDate.value,
    end: endDate.value
  })
  
  // 🆕 根据选中的文件夹筛选
  if (selectedCollectionId.value !== null) {
    if (selectedCollectionId.value === 'uncategorized') {
      tasks = tasks.filter(t => !t.collectionId)
    } else {
      tasks = tasks.filter(t => t.collectionId === selectedCollectionId.value)
    }
  }
  
  return tasks
})

// 🆕 文件夹相关计算属性
const sortedCollections = computed(() => {
  // 显示所有笔记本（包括子笔记本），方便快速跳转
  return taskStore.sortedCollections
})

// 🆕 快捷栏显示的前3个文件夹
const quickCollections = computed(() => {
  return sortedCollections.value.slice(0, 3)
})

// 🆕 更多文件夹（第4个及以后）
const moreCollections = computed(() => {
  return sortedCollections.value.slice(3)
})

const uncategorizedTaskCount = computed(() => {
  return taskStore.tasks.filter(t => !t.collectionId).length
})

// 🆕 当前笔记本的面包屑路径
const currentBreadcrumb = computed(() => {
  if (!selectedCollectionId.value || selectedCollectionId.value === 'uncategorized') {
    return []
  }
  return taskStore.getCollectionBreadcrumb(selectedCollectionId.value)
})

const getCollectionTaskCount = (collectionId) => {
  return taskStore.getCollectionTasks(collectionId).length
}

// 计算属性：完全筛选后的任务（包括状态筛选，用于显示）
const filteredTasks = computed(() => {
  let tasks = taskStore.getFilteredTasks(currentFilter.value, currentCategoryFilter.value, {
    start: startDate.value,
    end: endDate.value,
    dimension: timeDimension.value
  })
  
  // 🆕 文件夹筛选
  if (selectedCollectionId.value !== null) {
    if (selectedCollectionId.value === 'uncategorized') {
      // 只显示未分类任务
      tasks = tasks.filter(t => !t.collectionId)
    } else {
      // 只显示选中文件夹的任务
      tasks = tasks.filter(t => t.collectionId === selectedCollectionId.value)
    }
  }
  
  // 🆕 标签筛选（v0.9.0）
  if (selectedTag.value) {
    tasks = tasks.filter(t => 
      t.tags?.some(tag => 
        tag === selectedTag.value || tag.startsWith(selectedTag.value + '/')
      )
    )
  }
  
  // 优先级筛选
  if (currentPriorityFilter.value !== 'all') {
    if (priorityMode.value === 'traditional' && currentPriorityFilter.value === 'high') {
      // 传统模式下，"高"包含 high 和 urgent
      tasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent')
    } else {
      tasks = tasks.filter(t => t.priority === currentPriorityFilter.value)
    }
  }
  
  // 关键字搜索（模糊匹配任务名称和描述）
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    tasks = tasks.filter(t => 
      t.text.toLowerCase().includes(keyword) || 
      (t.description && t.description.toLowerCase().includes(keyword))
    )
  }
  
  return tasks
})

// 统计数据（基于baseFilteredTasks，不受状态筛选影响）
const completionPercentage = computed(() => {
  const total = baseFilteredTasks.value.length
  if (total === 0) return 0
  const completed = baseFilteredTasks.value.filter(t => t.status === TaskStatus.COMPLETED).length
  return Math.round((completed / total) * 100)
})

const pendingCount = computed(() => baseFilteredTasks.value.filter(t => t.status === TaskStatus.PENDING).length)
const completedCount = computed(() => baseFilteredTasks.value.filter(t => t.status === TaskStatus.COMPLETED).length)
const overdueCount = computed(() => baseFilteredTasks.value.filter(t => t.status === TaskStatus.OVERDUE).length)

// 优先级统计（基于baseFilteredTasks）
const highPriorityCount = computed(() => {
  if (priorityMode.value === 'traditional') {
    // 传统模式：high + urgent 合并为"高"
    return baseFilteredTasks.value.filter(t => t.priority === 'high' || t.priority === 'urgent').length
  }
  return baseFilteredTasks.value.filter(t => t.priority === 'high').length
})
const mediumPriorityCount = computed(() => baseFilteredTasks.value.filter(t => t.priority === 'medium').length)
const lowPriorityCount = computed(() => baseFilteredTasks.value.filter(t => t.priority === 'low').length)
const urgentPriorityCount = computed(() => baseFilteredTasks.value.filter(t => t.priority === 'urgent').length)

// 优先级选项（根据模式动态生成）
const priorityOptions = computed(() => {
  if (priorityMode.value === 'eisenhower') {
    // 时间象限法：4个选项
    return [
      { value: 'high', label: t('urgentImportant'), color: '#ef4444', count: highPriorityCount.value },
      { value: 'medium', label: t('important'), color: '#f97316', count: mediumPriorityCount.value },
      { value: 'urgent', label: t('urgent'), color: '#eab308', count: urgentPriorityCount.value },
      { value: 'low', label: t('notUrgentNotImportant'), color: '#9ca3af', count: lowPriorityCount.value }
    ]
  } else {
    // 传统三级：3个选项（high和urgent合并为"高"）
    return [
      { value: 'high', label: t('high'), color: '#ef4444', count: highPriorityCount.value },
      { value: 'medium', label: t('medium'), color: '#f97316', count: mediumPriorityCount.value },
      { value: 'low', label: t('low'), color: '#3b82f6', count: lowPriorityCount.value }
    ]
  }
})

// 分类统计（基于当前文件夹和时间筛选）
const getCategoryCount = (category) => {
  let filtered = taskStore.getFilteredTasks('all', category, {
    start: startDate.value,
    end: endDate.value
  })
  
  // 🆕 如果选中了文件夹，只统计该文件夹内的任务
  if (selectedCollectionId.value !== null) {
    if (selectedCollectionId.value === 'uncategorized') {
      filtered = filtered.filter(t => !t.collectionId)
    } else {
      filtered = filtered.filter(t => t.collectionId === selectedCollectionId.value)
    }
  }
  
  return filtered.length
}

// 筛选结果数量
const filterResultCount = computed(() => filteredTasks.value.length)

// 时间维度标签
const timeDimensionLabel = computed(() => {
  if (timeDimension.value === 'created') return '创建时间'
  if (timeDimension.value === 'deadline') return '截止时间'
  if (timeDimension.value === 'completed') return '完成时间'
  return '时间'
})

// 个人主页统计（基于所有任务）
const completionRate = computed(() => {
  const total = taskStore.tasks.length
  if (total === 0) return 0
  const completed = taskStore.tasks.filter(t => t.status === TaskStatus.COMPLETED).length
  return Math.round((completed / total) * 100)
})

const usageDays = computed(() => {
  if (!userProfileInfo.value.registerTime) return 0
  const registerDate = new Date(userProfileInfo.value.registerTime)
  const today = new Date()
  const diffTime = Math.abs(today - registerDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// 番茄统计
const earnedPomodoros = computed(() => {
  // 已完成任务获得的番茄数（考虑文件夹筛选）
  let tasks = taskStore.tasks.filter(t => t.status === TaskStatus.COMPLETED)
  
  // 🆕 如果选中了文件夹，只统计该文件夹内的任务
  if (selectedCollectionId.value !== null) {
    if (selectedCollectionId.value === 'uncategorized') {
      tasks = tasks.filter(t => !t.collectionId)
    } else {
      tasks = tasks.filter(t => t.collectionId === selectedCollectionId.value)
    }
  }
  
  return tasks.reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const pendingPomodoros = computed(() => {
  // 待完成任务可获得的番茄数（考虑文件夹筛选）
  let tasks = taskStore.tasks.filter(t => t.status === TaskStatus.PENDING)
  
  // 🆕 如果选中了文件夹，只统计该文件夹内的任务
  if (selectedCollectionId.value !== null) {
    if (selectedCollectionId.value === 'uncategorized') {
      tasks = tasks.filter(t => !t.collectionId)
    } else {
      tasks = tasks.filter(t => t.collectionId === selectedCollectionId.value)
    }
  }
  
  return tasks.reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const lostPomodoros = computed(() => {
  // 逾期任务扣除的番茄数（考虑文件夹筛选）
  let tasks = taskStore.tasks.filter(t => t.status === TaskStatus.OVERDUE)
  
  // 🆕 如果选中了文件夹，只统计该文件夹内的任务
  if (selectedCollectionId.value !== null) {
    if (selectedCollectionId.value === 'uncategorized') {
      tasks = tasks.filter(t => !t.collectionId)
    } else {
      tasks = tasks.filter(t => t.collectionId === selectedCollectionId.value)
    }
  }
  
  return tasks.reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const totalPomodoros = computed(() => {
  // 净获得番茄数 = 已获得 - 逾期扣除
  return earnedPomodoros.value - lostPomodoros.value
})

// 按分类统计番茄数（考虑文件夹筛选）

// 按优先级统计番茄数（考虑文件夹筛选）

// 按时间统计番茄数

// 连续打卡天数

// 单日最高番茄数

// 完成率

// 近7天趋势数据

// 获取7天内最大值（用于柱状图高度计算）

// 分类占比

// 等级徽章

// 计算今日完成的番茄钟数

// 计算今日专注时长（分钟）

// 计算本周完成的番茄钟数

// 计算任务的总专注时长（分钟）

// 格式化番茄钟时间（HH:MM）

// 格式化番茄钟日期

// 计算番茄钟时长（分钟）

// 计算属性：总页数
const totalPages = computed(() => {
  if (pageSize.value === 0) return 1 // 全部显示时只有1页
  return Math.ceil(filteredTasks.value.length / pageSize.value)
})

// 计算属性：当前页的任务
const paginatedTasks = computed(() => {
  if (pageSize.value === 0) return filteredTasks.value // 显示全部
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTasks.value.slice(start, end)
})

// 方法：设置筛选条件
const setFilter = (filter) => {
  // 记录上一次的筛选状态
  if (currentFilter.value !== filter) {
    previousFilter.value = currentFilter.value
  }
  currentFilter.value = filter
  if (filter === 'all') {
    currentCategoryFilter.value = 'all'
  }
  currentPage.value = 1
}

// 格式化显示日期
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace(/-/g, '/')
}

// 方法：设置分类筛选
const setCategoryFilter = (category) => {
  currentCategoryFilter.value = category
  currentPage.value = 1
}

// 方法：设置优先级筛选
const setPriorityFilter = (priority) => {
  currentPriorityFilter.value = priority
  currentPage.value = 1
}

// 方法：处理搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 方法：清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
}

// 方法：重置所有筛选
const resetFilters = () => {
  currentFilter.value = 'all'
  currentCategoryFilter.value = 'all'
  currentPriorityFilter.value = 'all'
  searchKeyword.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
}

// 方法：清除时间筛选
const clearDateFilter = () => {
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
}

// 方法：快捷日期设置（扩展版）
const setQuickDate = (type) => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  activeScene.value = '' // 清除场景选择
  
  if (type === 'today') {
    startDate.value = todayStr
    endDate.value = todayStr
  } else if (type === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    startDate.value = yesterdayStr
    endDate.value = yesterdayStr
  } else if (type === 'thisWeek') {
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    startDate.value = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    endDate.value = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`
  } else if (type === 'lastWeek') {
    const dayOfWeek = today.getDay()
    const lastMonday = new Date(today)
    lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7)
    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6)
    
    startDate.value = `${lastMonday.getFullYear()}-${String(lastMonday.getMonth() + 1).padStart(2, '0')}-${String(lastMonday.getDate()).padStart(2, '0')}`
    endDate.value = `${lastSunday.getFullYear()}-${String(lastSunday.getMonth() + 1).padStart(2, '0')}-${String(lastSunday.getDate()).padStart(2, '0')}`
  } else if (type === 'thisMonth') {
    const firstDay = new Date(year, today.getMonth(), 1)
    const lastDay = new Date(year, today.getMonth() + 1, 0)
    
    startDate.value = `${year}-${month}-01`
    endDate.value = `${year}-${month}-${String(lastDay.getDate()).padStart(2, '0')}`
  } else if (type === 'lastMonth') {
    const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1
    const lastMonthYear = today.getMonth() === 0 ? year - 1 : year
    const firstDay = new Date(lastMonthYear, lastMonth, 1)
    const lastDay = new Date(lastMonthYear, lastMonth + 1, 0)
    
    startDate.value = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`
    endDate.value = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
  } else if (type === 'overdue') {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    startDate.value = '2020-01-01'
    endDate.value = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    timeDimension.value = 'deadline' // 逾期按截止时间筛选
  } else if (type === 'recent7') {
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    startDate.value = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`
    endDate.value = todayStr
  } else if (type === 'recent30') {
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    startDate.value = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`
    endDate.value = todayStr
  }
  currentPage.value = 1
}

// 方法：应用快捷场景
const applyScene = (scene) => {
  activeScene.value = scene
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  // 重置所有筛选条件
  searchKeyword.value = ''
  startDate.value = ''
  endDate.value = ''
  currentCategoryFilter.value = 'all'
  currentPriorityFilter.value = 'all'
  currentFilter.value = 'all'
  
  if (scene === 'todayPending') {
    // 今日待办：截止时间=今天 + 状态=待办
    timeDimension.value = 'deadline'
    startDate.value = todayStr
    endDate.value = todayStr
    currentFilter.value = 'pending'
  } else if (scene === 'weekPending') {
    // 本周待办：截止时间=本周 + 状态=待办
    timeDimension.value = 'deadline'
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    startDate.value = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    endDate.value = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`
    currentFilter.value = 'pending'
  } else if (scene === 'todayOverdue') {
    // 今日逾期：截止时间<今天 + 状态=逾期
    timeDimension.value = 'deadline'
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    startDate.value = '2020-01-01'
    endDate.value = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    currentFilter.value = 'overdue'
  } else if (scene === 'highPriority') {
    // 高优先级：优先级=高 + 状态=待办
    currentPriorityFilter.value = 'high'
    currentFilter.value = 'pending'
  } else if (scene === 'workTasks') {
    // 工作任务：分类=工作 + 状态=待办
    currentCategoryFilter.value = 'work'
    currentFilter.value = 'pending'
  } else if (scene === 'studyTasks') {
    // 学习任务：分类=学习 + 状态=待办
    currentCategoryFilter.value = 'study'
    currentFilter.value = 'pending'
  }
  
  currentPage.value = 1
}

// 显示日期选择器
const showDatePicker = (type) => {
  if (type === 'start') {
    showFilterStartCalendar.value = true
  } else {
    showFilterEndCalendar.value = true
  }
}

// 显示自定义日期时间选择器
const showCustomDateTimePicker = () => {
  showCustomDateModal.value = true
}

// 处理日历选择器确认
const handleCalendarConfirm = (dateTimeStr) => {
  customDateTime.value = dateTimeStr
  showCustomDateModal.value = false
}

// 处理自定义日期时间变更（保留用于其他地方）
const handleCustomDateTimeChange = (e) => {
  customDateTime.value = e.target.value
}

// 方法：获取今天的日期时间（YYYY-MM-DDTHH:MM格式）
const getTodayDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// 处理筛选开始日期确认
const handleFilterStartDateConfirm = (dateTimeStr) => {
  const [date] = dateTimeStr.split('T')
  startDate.value = date
  showFilterStartCalendar.value = false
}

// 处理筛选结束日期确认
const handleFilterEndDateConfirm = (dateTimeStr) => {
  const [date] = dateTimeStr.split('T')
  endDate.value = date
  showFilterEndCalendar.value = false
}

// 处理自定义报告开始日期确认
const handleReportStartDateConfirm = (dateTimeStr) => {
  const [date] = dateTimeStr.split('T')
  customStartDate.value = date
  showReportStartCalendar.value = false
}

// 处理自定义报告结束日期确认
const handleReportEndDateConfirm = (dateTimeStr) => {
  const [date] = dateTimeStr.split('T')
  customEndDate.value = date
  showReportEndCalendar.value = false
}

// 处理自定义报告配置开始日期确认
const handleCustomReportStartDateConfirm = (dateTimeStr) => {
  const [date] = dateTimeStr.split('T')
  customReportConfig.value.startDate = date
  showCustomReportStartCalendar.value = false
}

// 处理自定义报告配置结束日期确认
const handleCustomReportEndDateConfirm = (dateTimeStr) => {
  const [date] = dateTimeStr.split('T')
  customReportConfig.value.endDate = date
  showCustomReportEndCalendar.value = false
}

// 格式化日期显示（YYYY/MM/DD）
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

// 快捷设置提醒时间
const setQuickTime = (minutes) => {
  const now = new Date()
  const futureTime = new Date(now.getTime() + minutes * 60 * 1000)
  const year = futureTime.getFullYear()
  const month = String(futureTime.getMonth() + 1).padStart(2, '0')
  const day = String(futureTime.getDate()).padStart(2, '0')
  const hours = String(futureTime.getHours()).padStart(2, '0')
  const mins = String(futureTime.getMinutes()).padStart(2, '0')
  reminderDateTime.value = `${year}-${month}-${day}T${hours}:${mins}`
}

// 方法：格式化显示日期时间
const formatDisplayDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const dt = new Date(dateTimeStr)
  const year = dt.getFullYear()
  const month = dt.getMonth() + 1
  const day = dt.getDate()
  const hours = String(dt.getHours()).padStart(2, '0')
  const minutes = String(dt.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

// 处理起始日期变更
const handleStartDateChange = (e) => {
  const dateStr = e.target.value
  if (dateStr) {
    startDate.value = dateStr
    currentPage.value = 1
    // 自动触发选择结束日期
    setTimeout(() => {
      showDatePicker('end')
    }, 300)
  }
}

// 处理结束日期变更
const handleEndDateChange = (e) => {
  const dateStr = e.target.value
  if (dateStr) {
    endDate.value = dateStr
    currentPage.value = 1
  }
}

// refs
const hiddenStartDate = ref(null)
const hiddenEndDate = ref(null)
const hiddenCustomDateTime = ref(null)
const filterSearchInput = ref(null)

// 方法：筛选任务

// 方法：添加任务并关闭表单

// 方法：拍照或选择照片识别文字
const scanTextFromCamera = async () => {
  try {
    const platform = Capacitor.getPlatform()
    
    if (platform === 'web') {
      // Web 端：选择图片文件
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        try {
          aiLoading.value = true
          aiLoadingText.value = '正在识别文字...'
          aiLoadingSubText.value = 'OCR 文字识别中'
          
          // 使用 Tesseract.js 进行 OCR（需要先安装）
          // 或者调用在线 OCR API
          // 这里先用简单的方法：让用户手动输入
          
          // 创建图片预览
          const reader = new FileReader()
          reader.onload = async (event) => {
            const img = new Image()
            img.src = event.target.result
            
            // 简单方案：提示用户手动输入
            // 未来可以集成 Tesseract.js 或调用 OCR API
            showNotification('Web 端暂不支持自动识别，请手动输入文字', 'info')
            
            // TODO: 集成 OCR 库
            // const text = await recognizeText(img)
            // newTaskText.value = text
          }
          reader.readAsDataURL(file)
          
        } catch (error) {
          showNotification(`识别失败: ${error.message}`, 'error')
        } finally {
          aiLoading.value = false
        }
      }
      
      input.click()
      return
    }
    
    // Android 端：询问用户选择拍照还是相册
    const choice = confirm('选择图片来源：\n\n确定 = 📷 拍照\n取消 = 🖼️ 从相册选择')
    
    const source = choice ? CameraSource.Camera : CameraSource.Photos
    
    // 使用相机拍照或从相册选择
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: source  // Camera 或 Photos
    })
    
    console.log('照片路径:', photo.path)
    
    // 显示识别中提示
    aiLoading.value = true
    aiLoadingText.value = '正在识别文字...'
    aiLoadingSubText.value = 'OCR 文字识别中'
    
    // 2. 中文OCR识别
    const result = await ChineseOcr.detectText({ 
      filename: photo.path
    })
    
    console.log('OCR结果:', JSON.stringify(result))
    
    // 3. 提取文字并使用AI增强
    if (result && result.textDetections && result.textDetections.length > 0) {
      const lines = result.textDetections.map(d => d.text.trim()).filter(t => t)
      
      if (lines.length === 0) {
        showNotification('未识别到文字', 'error')
        aiLoading.value = false
        return
      }
      
      // 合并所有识别的文字
      const fullText = lines.join('\n')
      
      // 使用 AI 增强文本
      try {
        aiLoadingText.value = 'AI 正在优化文本...'
        aiLoadingSubText.value = '智能提取任务信息'
        
        const enhanced = await AITextEnhancer.enhanceText(fullText)
        
        // 🆕 填充到统一输入框
        quickTaskInput.value = enhanced.title
        tempDescription.value = enhanced.description
        newTaskCategory.value = enhanced.category || 'life'
        newTaskPriority.value = enhanced.priority || 'medium'
        
        // 如果AI提取了时间信息，自动设置
        if (enhanced.customDate && enhanced.customTime) {
          newTaskType.value = enhanced.type || 'custom_date'
          customDateTime.value = `${enhanced.customDate}T${enhanced.customTime}`
        }
        
        showNotification(`✨ AI 增强完成！已智能填充所有信息`, 'success')
      } catch (aiError) {
        console.error('AI 增强失败，使用原始文本:', aiError)
        // 🆕 AI 失败时使用原始文本
        quickTaskInput.value = lines[0]
        tempDescription.value = fullText
        showNotification(`识别成功！标题+${lines.length}行完整内容`, 'success')
      }
    } else {
      showNotification('未识别到文字，请确保照片清晰且包含文字', 'error')
    }
  } catch (error) {
    console.error('拍照识别失败:', error)
    
    if (error.message && error.message.includes('not implemented on web')) {
      showNotification('📱 拍照识别功能仅在 Android 应用中可用', 'error')
    } else {
      showNotification(`识别失败: ${error.message || '未知错误'}`, 'error')
    }
  } finally {
    aiLoading.value = false
  }
}

// 方法：添加任务
const addTask = async () => {
  // 🆕 使用统一输入框的值
  const title = quickTaskInput.value.trim()
  const description = tempDescription.value.trim()
  
  if (!title) {
    showNotification('请输入任务标题！', 'error')
    return
  }
  
  // 验证指定日期
  if (newTaskType.value === 'custom_date' && !customDateTime.value) {
    showNotification('请选择任务日期时间！', 'error')
    return
  }
  
  // 验证每周重复
  if (newTaskType.value === 'weekly' && selectedWeekdays.value.length === 0) {
    showNotification('请至少选择一个星期几！', 'error')
    return
  }
  
  // 验证每月重复
  if (newTaskType.value === 'monthly' && (!monthDay.value || monthDay.value < 1 || monthDay.value > 31)) {
    showNotification('请选择每月几号（1-31）！', 'error')
    return
  }
  
  // 解析日期时间
  let customDate = null
  let customTime = null
  if (newTaskType.value === 'custom_date' && customDateTime.value) {
    const dt = new Date(customDateTime.value)
    customDate = customDateTime.value.split('T')[0]
    customTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }
  
  // 🆕 确定文件夹ID：如果选中了具体文件夹，就用该文件夹；否则用null（未分类）
  let collectionId = null
  if (selectedCollectionId.value && selectedCollectionId.value !== 'uncategorized' && selectedCollectionId.value !== null) {
    collectionId = selectedCollectionId.value
  }
  
  const task = {
    text: title,  // 🆕 使用统一输入框的标题
    description: description,  // 🆕 使用临时保存的描述
    type: newTaskType.value,
    category: newTaskCategory.value,
    priority: newTaskPriority.value,
    collectionId: collectionId,  // 🆕 文件夹ID
    weekdays: newTaskType.value === 'weekly' ? selectedWeekdays.value : null,
    monthDay: newTaskType.value === 'monthly' ? monthDay.value : null,
    customDate: customDate,
    customTime: customTime,
    enableReminder: enableReminder.value,
    reminderTime: enableReminder.value && reminderDateTime.value ? new Date(reminderDateTime.value).toISOString() : null,
    forceReminder: enableReminder.value, // 启用提醒就是强制提醒
    media: tempMedia.value  // 🆕 媒体资源
  }
  
  console.log('📝 创建任务 - tempMedia:', tempMedia.value)
  console.log('📝 创建任务 - task.media:', task.media)
  console.log('📝 创建任务 - description:', description)
  console.log('📝 创建任务:', { 
    title, 
    selectedCollectionId: selectedCollectionId.value, 
    collectionId: task.collectionId 
  })
  
  const createdTask = await taskStore.addTask(task)
  
  // 如果启用了提醒，调度通知
  console.log('🔍 检查提醒设置:', {
    enableReminder: enableReminder.value,
    forceReminder: enableReminder.value,
    reminderDateTime: reminderDateTime.value,
    taskReminderTime: createdTask.reminderTime,
    taskId: createdTask.id
  })
  
  if (enableReminder.value && reminderDateTime.value) {
    console.log('📢 开始调度提醒...')
    await scheduleTaskReminder(createdTask)
  } else {
    console.log('⚠️ 未启用提醒或未设置时间')
  }
  
  showNotification('任务添加成功！', 'success')
  
  // 🆕 清空统一输入框
  quickTaskInput.value = ''
  tempDescription.value = ''
  
  // 清空其他输入
  newTaskText.value = ''
  newTaskDescription.value = ''
  newTaskType.value = 'today'
  customDateTime.value = ''
  newTaskCategory.value = 'work'
  newTaskPriority.value = 'medium'
  selectedWeekdays.value = []
  monthDay.value = 1
  enableReminder.value = false
  forceReminder.value = false
  reminderDateTime.value = ''
  
  // 🌳 清空子任务相关状态
  showSubtaskSuggestion.value = false
  detectedSubtasks.value = []
  
  // 🆕 清空媒体资源
  tempMedia.value = []
  currentTaskId.value = null
  
  // 更新每日摘要通知
  await scheduleDailySummaryNotification()
}

// 方法：格式化显示的星期几
const formatSelectedWeekdays = (selected) => {
  if (!selected || selected.length === 0) return ''
  const names = ['一', '二', '三', '四', '五', '六', '日']
  return selected.sort((a, b) => a - b).map(i => names[i]).join(',')
}

// 方法：处理任务类型变化
const handleTaskTypeChange = () => {
  // 切换类型时清空相关数据
  if (newTaskType.value !== 'custom_date') {
    customDateTime.value = ''
  } else {
    // 如果选择了指定日期，自动弹出选择器
    showCustomDateTimePicker()
  }
  
  if (newTaskType.value !== 'weekly') {
    selectedWeekdays.value = []
  } else {
    // 如果选择了每周重复，弹出星期选择模态框
    showWeeklyModal.value = true
  }
  
  if (newTaskType.value === 'monthly' && !monthDay.value) {
    monthDay.value = 1
  }
}

// 方法：获取今天日期（YYYY-MM-DD格式）
const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// 方法：切换任务完成状态
const toggleTaskCompletion = async (taskId) => {
  const task = taskStore.tasks.find(t => t.id === taskId)
  
  // 如果要标记为完成，检查依赖
  if (task && task.status !== 'completed' && !taskStore.canStart(taskId)) {
    const waitForTasks = taskStore.getWaitForTasks(taskId)
    const unfinishedTasks = waitForTasks.filter(t => t.status !== 'completed')
    const taskNames = unfinishedTasks.map(t => t.text).join('、')
    alert(`⚠️ 无法完成任务\n\n请先完成依赖任务：\n${taskNames}`)
    return
  }
  
  // 记录当前状态
  const wasCompleted = task.status === 'completed'
  
  await taskStore.toggleTaskCompletion(taskId)
  
  // 完成任务时清除提醒记录和通知
  notifiedTasks.delete(`urgent_${taskId}`)
  notifiedTasks.delete(`overdue_${taskId}`)
  await cancelTaskReminder(taskId)
  
  // 更新每日摘要通知
  await scheduleDailySummaryNotification()
  
  // 显示提示
  if (wasCompleted) {
    showNotification('🔄 任务已重新打开', 'success')
  } else {
    showNotification('✅ 任务已完成！', 'success')
  }
}

// 方法：置顶/取消置顶任务
const togglePin = async (taskId) => {
  const task = taskStore.tasks.find(t => t.id === taskId)
  const wasPinned = task?.pinned
  
  await taskStore.togglePin(taskId)
  
  // 显示提示
  if (wasPinned) {
    showNotification('📌 已取消置顶', 'success')
  } else {
    showNotification('📌 已置顶任务', 'success')
  }
}

// 番茄钟相关方法
const startPomodoro = (task) => {
  pomodoroState.value = {
    isRunning: true,
    isPaused: false,
    currentTask: task,
    remainingSeconds: POMODORO_CONFIG.FOCUS_TIME,
    mode: 'focus',
    completedCount: task.completedPomodoros || 0,
    startTime: new Date().toISOString()
  }
  showPomodoroTimer.value = true
  startPomodoroTimer()
}

const getTotalSeconds = () => {
  if (pomodoroState.value.mode === 'focus') return POMODORO_CONFIG.FOCUS_TIME
  if (pomodoroState.value.mode === 'shortBreak') return POMODORO_CONFIG.SHORT_BREAK
  return POMODORO_CONFIG.LONG_BREAK
}

const startPomodoroTimer = () => {
  if (pomodoroInterval) clearInterval(pomodoroInterval)
  
  pomodoroInterval = setInterval(() => {
    if (!pomodoroState.value.isPaused && pomodoroState.value.remainingSeconds > 0) {
      pomodoroState.value.remainingSeconds--
    } else if (pomodoroState.value.remainingSeconds === 0) {
      onPomodoroComplete()
    }
  }, 1000)
}

const pausePomodoro = () => {
  pomodoroState.value.isPaused = !pomodoroState.value.isPaused
}

const stopPomodoro = () => {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval)
    pomodoroInterval = null
  }
  pomodoroState.value.isRunning = false
  showPomodoroTimer.value = false
}

// 跳过休息
const skipBreak = () => {
  showNotification('⏭️ 已跳过休息', 'info')
  stopPomodoro()
}

// 继续下一个番茄钟
const continueNextPomodoro = () => {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval)
    pomodoroInterval = null
  }
  
  // 重置为专注模式
  pomodoroState.value.mode = 'focus'
  pomodoroState.value.remainingSeconds = POMODORO_CONFIG.FOCUS_TIME
  pomodoroState.value.isPaused = false
  pomodoroState.value.startTime = new Date().toISOString()
  
  showNotification('🍅 开始新的番茄钟！', 'success')
  startPomodoroTimer()
}

const onPomodoroComplete = async () => {
  clearInterval(pomodoroInterval)
  pomodoroInterval = null
  
  // 如果是专注模式完成
  if (pomodoroState.value.mode === 'focus') {
    // 记录完成的番茄钟
    const task = pomodoroState.value.currentTask
    if (task) {
      const updatedTask = taskStore.tasks.find(t => t.id === task.id)
      if (updatedTask) {
        updatedTask.completedPomodoros = (updatedTask.completedPomodoros || 0) + 1
        updatedTask.pomodoroHistory = updatedTask.pomodoroHistory || []
        updatedTask.pomodoroHistory.push({
          startTime: pomodoroState.value.startTime,
          endTime: new Date().toISOString(),
          completed: true
        })
        await taskStore.updateTask(updatedTask)
      }
    }
    
    // 切换到休息模式
    pomodoroState.value.completedCount++
    pomodoroState.value.mode = pomodoroState.value.completedCount % 4 === 0 ? 'longBreak' : 'shortBreak'
    pomodoroState.value.remainingSeconds = pomodoroState.value.mode === 'longBreak' 
      ? POMODORO_CONFIG.LONG_BREAK 
      : POMODORO_CONFIG.SHORT_BREAK
    
    const breakMinutes = pomodoroState.value.mode === 'longBreak' 
      ? Math.floor(POMODORO_CONFIG.LONG_BREAK / 60) 
      : Math.floor(POMODORO_CONFIG.SHORT_BREAK / 60)
    showNotification(`🎉 完成1个番茄钟！休息${breakMinutes}分钟`, 'success')
    
    // 自动开始休息倒计时
    startPomodoroTimer()
  } else {
    // 休息完成
    showNotification('✨ 休息结束！准备开始下一个番茄钟', 'info')
    stopPomodoro()
  }
}

// 方法：删除任务
// 切换任务完成状态
const toggleTaskStatus = async (taskId) => {
  console.log('toggleTaskStatus 被调用, taskId:', taskId)
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (!task) {
    console.log('任务未找到')
    return
  }
  
  console.log('当前任务状态:', task.status)
  
  if (task.status === 'completed') {
    // 取消完成
    console.log('取消完成任务')
    task.status = 'pending'
    task.completed_at = null
    
    // 重新检查是否逾期
    const deadline = getTaskDeadline(task)
    if (deadline && new Date() > deadline) {
      task.status = 'overdue'
    }
    
    await taskStore.updateTask(task)
    await scheduleDailySummaryNotification()
    
    // 显示提示
    console.log('准备显示提示: 🔄 任务已重新打开')
    showNotification('🔄 任务已重新打开', 'success')
  } else {
    // 标记为完成
    console.log('标记任务为完成')
    task.status = 'completed'
    task.completed_at = new Date().toISOString()
    
    // 清除提醒
    notifiedTasks.delete(`urgent_${taskId}`)
    notifiedTasks.delete(`overdue_${taskId}`)
    await cancelTaskReminder(taskId)
    
    await taskStore.updateTask(task)
    await scheduleDailySummaryNotification()
    
    // 显示提示
    console.log('准备显示提示: ✅ 任务已完成！')
    showNotification('✅ 任务已完成！', 'success')
  }
}

const deleteTask = async (taskId) => {
  // 保存待删除任务信息
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (!task) return
  
  pendingDeleteTask = { ...task }
  
  // 立即从界面移除（视觉上删除）
  await taskStore.deleteTask(taskId)
  
  // 清除提醒记录和通知
  notifiedTasks.delete(`urgent_${taskId}`)
  notifiedTasks.delete(`overdue_${taskId}`)
  await cancelTaskReminder(taskId)
  
  // 更新每日摘要通知
  await scheduleDailySummaryNotification()
  
  // 显示撤销Toast
  undoToastMessage.value = currentLanguage.value === 'zh' ? '任务已删除' : 'Task deleted'
  showUndoToast.value = true
  
  // 清除旧定时器
  if (undoTimer) clearTimeout(undoTimer)
  
  // 5秒后自动隐藏Toast（任务已真正删除到回收站）
  undoTimer = setTimeout(() => {
    showUndoToast.value = false
    pendingDeleteTask = null
  }, 5000)
}

// 方法：撤销删除
const undoDelete = async () => {
  if (!pendingDeleteTask) return
  
  // 清除定时器
  if (undoTimer) clearTimeout(undoTimer)
  
  // 恢复任务
  await taskStore.restoreTask(pendingDeleteTask.id)
  
  // 隐藏Toast
  showUndoToast.value = false
  pendingDeleteTask = null
}

// 方法：恢复任务
const restoreTask = async (taskId) => {
  await taskStore.restoreTask(taskId)
  showNotification('✅ 任务已恢复！', 'success')
}

// 方法：彻底删除
const permanentDelete = async (taskId) => {
  if (confirm('确定要永久删除此任务吗？此操作不可撤销。')) {
    await taskStore.permanentDeleteTask(taskId)
    showNotification('🗑️ 任务已永久删除！', 'error')
  }
}

// 方法：清空回收站
const clearAllTrash = async () => {
  const count = taskStore.deletedTasks.length
  if (confirm(`确定要清空回收站吗？\n\n将永久删除 ${count} 个任务，此操作不可撤销！`)) {
    await taskStore.clearAllDeletedTasks()
    showNotification(`已清空回收站，永久删除 ${count} 个任务`, 'success')
  }
}

// 方法：清空所有任务
const clearAllTasks = async () => {
  const totalCount = taskStore.tasks.length
  const deletedCount = taskStore.deletedTasks.length
  const collectionsCount = taskStore.collections.length
  const total = totalCount + deletedCount
  
  if (total === 0 && collectionsCount === 0) {
    showNotification('当前没有任务和笔记本', 'info')
    return
  }
  
  const message = `🚨 危险操作警告 🚨\n\n` +
    `即将清空所有数据：\n` +
    `• 当前任务：${totalCount} 个\n` +
    `• 回收站任务：${deletedCount} 个\n` +
    `• 笔记本/文件夹：${collectionsCount} 个\n` +
    `• AI报告历史：将被清空\n` +
    `• AI对话历史：将被清空\n` +
    `• 总计：${total} 个任务 + ${collectionsCount} 个笔记本\n\n` +
    `⚠️ 此操作不可撤销！\n` +
    `⚠️ 所有执行日志、番茄钟历史将永久丢失！\n\n` +
    `💡 强烈建议先点击"完整备份"保存数据！\n\n` +
    `确定要继续吗？`
  
  if (!confirm(message)) {
    return
  }
  
  // 二次确认（更严格）
  const confirmText = `最后确认：请输入"删除"二字确认操作`
  const userInput = prompt(confirmText)
  
  if (userInput === '删除') {
    await taskStore.clearAllTasks()
    showNotification(`已清空所有数据（${total} 个任务 + ${collectionsCount} 个笔记本）`, 'success')
  } else {
    showNotification('已取消清空操作', 'info')
  }
}

// 方法：打开编辑模态框
// 切换描述展开/收起

// 方法：打开任务详情（统一入口：复用编辑 Bottom Sheet）
const openTaskDetail = (task) => {
  if (!task) {
    console.warn('openTaskDetail: task is undefined')
    return
  }
  selectedTask.value = task
  showTaskDetail.value = true
}

// 🆕 通过ID打开任务详情（用于标签浏览器）
const openTaskDetailById = (taskId) => {
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (task) {
    openTaskDetail(task)
  }
}

// 方法：处理任务详情刷新
const handleTaskDetailRefresh = () => {
  // 重新加载任务数据
  if (selectedTask.value) {
    const updatedTask = taskStore.tasks.find(t => t.id === selectedTask.value.id)
    if (updatedTask) {
      selectedTask.value = updatedTask
    } else {
      // 任务已被删除，关闭详情页
      showTaskDetail.value = false
      selectedTask.value = null
    }
  }
}

// 方法：从日历打开任务详情
const openTaskFromCalendar = (task) => {
  openTaskDetail(task)
}

// 打开任务关系图谱
const handleOpenGraph = async () => {
  isLoadingGraph.value = true
  graphCenterTaskId.value = null
  
  // 使用 nextTick 确保 UI 更新
  await nextTick()
  
  // 延迟一帧，让加载动画显示出来
  setTimeout(() => {
    showTaskGraph.value = true
    // 图谱打开后再关闭加载状态
    setTimeout(() => {
      isLoadingGraph.value = false
    }, 300)
  }, 50)
}

// 方法：从日历创建任务
const createTaskFromCalendar = (date) => {
  console.log('📅 createTaskFromCalendar 收到日期:', date)
  
  // 格式化日期为 YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  
  console.log('📅 格式化后的日期:', dateStr)
  
  // 设置任务类型为自定义日期，并预填日期
  newTaskType.value = 'custom_date'
  customDateTime.value = dateStr
  
  console.log('📅 已设置 newTaskType:', newTaskType.value)
  console.log('📅 已设置 customDateTime:', customDateTime.value)
  
  // 滚动到顶部并聚焦输入框
  window.scrollTo({ top: 0, behavior: 'smooth' })
  nextTick(() => {
    const input = document.querySelector('.quick-task-input')
    console.log('📅 找到输入框:', input)
    if (input) input.focus()
  })
}

// 处理显示loading
const handleShowLoading = ({ text, subText }) => {
  aiLoading.value = true
  aiLoadingText.value = text
  aiLoadingSubText.value = subText || ''
}

// 处理隐藏loading
const handleHideLoading = () => {
  aiLoading.value = false
}

// 方法：处理编辑类型变化
const handleEditTypeChange = () => {
  // 如果选择指定日期，打开日期选择弹窗
  if (editType.value === 'custom_date') {
    // 设置当前编辑的日期时间到弹窗
    customDateTime.value = editCustomDateTime.value || getTodayDateTime()
    showCustomDateModal.value = true
  }
  // 如果选择每周重复，打开周期选择弹窗
  else if (editType.value === 'weekly') {
    // 设置当前编辑的周期到弹窗
    selectedWeekdays.value = [...editWeekdays.value]
    showWeeklyModal.value = true
  }
  // 如果选择每月重复，设置默认值
  else if (editType.value === 'monthly') {
    if (!editMonthDay.value) {
      editMonthDay.value = 1
    }
  }
  // 其他类型清空相关数据
  else {
    editCustomDateTime.value = ''
    editWeekdays.value = []
  }
}

// 方法：确认自定义日期选择

// 方法：确认周期选择
const confirmWeeklySelect = () => {
  if (editingTask.value) {
    // 如果是编辑任务，同步到编辑表单
    editWeekdays.value = [...selectedWeekdays.value]
  }
  showWeeklyModal.value = false
}

// 方法：保存任务编辑
const saveTaskEdit = async () => {
  if (!editingTask.value) return
  if (!editText.value.trim()) {
    showNotification('任务名称不能为空！', 'error')
    return
  }
  
  // 验证指定日期
  if (editType.value === 'custom_date' && !editCustomDateTime.value) {
    showNotification('请选择任务日期时间！', 'error')
    return
  }
  
  // 如果是每周类型，必须选择至少一天
  if (editType.value === 'weekly' && editWeekdays.value.length === 0) {
    showNotification('每周任务至少选择一天！', 'error')
    return
  }
  
  // 解析日期时间
  let customDate = null
  let customTime = null
  if (editType.value === 'custom_date' && editCustomDateTime.value) {
    const dt = new Date(editCustomDateTime.value)
    customDate = editCustomDateTime.value.split('T')[0]
    customTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }
  
  await taskStore.updateTask(editingTask.value.id, {
    text: editText.value.trim(),
    description: editDescription.value,
    category: editCategory.value,
    priority: editPriority.value,
    type: editType.value,
    customDate: customDate,
    customTime: customTime,
    weekdays: editType.value === 'weekly' ? editWeekdays.value : [],
    monthDay: editType.value === 'monthly' ? editMonthDay.value : null
  })
  
  editingTask.value = null
  showNotification('💾 任务已保存！', 'success')
}

// 方法：退出登录
const handleLogout = async () => {
  await userStore.logout()
  taskStore.clearUser()
  router.push('/')
}

// 方法：报告类型改变时的处理
const onReportTypeChange = () => {
  // 如果不是自定义类型，立即生成报告
  if (reportType.value !== 'custom') {
    generateReportContent()
  } else {
    // 自定义类型，设置默认日期范围（最近30天）
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    customStartDate.value = start.toISOString().split('T')[0]
    customEndDate.value = end.toISOString().split('T')[0]
  }
}

// 方法：生成报告内容
const generateReportContent = () => {
  console.log('🚀 generateReportContent 开始 - reportType:', reportType.value)
  const now = new Date()
  let startDate, endDate, periodName
  
  // 计算时间范围
  switch (reportType.value) {
    case 'custom':
      // 自定义：用户选择的日期范围
      if (!customStartDate.value || !customEndDate.value) {
        alert(currentLanguage.value === 'zh' ? '请选择开始和结束日期' : 'Please select start and end date')
        return
      }
      startDate = new Date(customStartDate.value)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(customEndDate.value)
      endDate.setHours(23, 59, 59, 999)
      
      if (startDate > endDate) {
        alert(currentLanguage.value === 'zh' ? '开始日期不能晚于结束日期' : 'Start date cannot be later than end date')
        return
      }
      
      periodName = currentLanguage.value === 'zh' 
        ? `${customStartDate.value} 至 ${customEndDate.value}`
        : `${customStartDate.value} to ${customEndDate.value}`
      break
    case 'daily':
      // 今天：0点到现在
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      periodName = currentLanguage.value === 'zh' ? `${now.getMonth() + 1}月${now.getDate()}日` : `${now.toLocaleString('en', { month: 'short' })} ${now.getDate()}`
      break
    case 'weekly':
      // 本周：周一到今天
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate = new Date(now)
      startDate.setDate(now.getDate() - diff)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      periodName = currentLanguage.value === 'zh' ? `第${Math.ceil((now.getDate() + diff) / 7)}周` : `Week ${Math.ceil((now.getDate() + diff) / 7)}`
      break
    case 'monthly':
      // 本月：1号到今天
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      periodName = currentLanguage.value === 'zh' ? `${now.getMonth() + 1}月` : `${now.toLocaleString('en', { month: 'long' })}`
      break
    case 'quarterly':
      // 本季度
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      periodName = currentLanguage.value === 'zh' ? `第${quarter + 1}季度` : `Q${quarter + 1}`
      break
    case 'halfyearly':
      // 半年：上半年或下半年
      const halfYear = now.getMonth() < 6 ? 0 : 1
      startDate = new Date(now.getFullYear(), halfYear * 6, 1, 0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      periodName = currentLanguage.value === 'zh' ? `${halfYear === 0 ? '上' : '下'}半年` : `${halfYear === 0 ? 'H1' : 'H2'}`
      break
    case 'yearly':
      // 本年：1月1日到今天
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      periodName = `${now.getFullYear()}${currentLanguage.value === 'zh' ? '年' : ''}`
      break
  }
  
  // 筛选时间范围内的任务
  const periodTasks = taskStore.tasks.filter(task => {
    const taskDate = new Date(task.created_at)
    return taskDate >= startDate && taskDate <= endDate
  })
  
  // 统计数据
  const totalTasks = periodTasks.length
  const completedTasks = periodTasks.filter(t => t.status === TaskStatus.COMPLETED).length
  const pendingTasks = periodTasks.filter(t => t.status === TaskStatus.PENDING).length
  const overdueTasks = periodTasks.filter(t => t.status === TaskStatus.OVERDUE).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const totalPomodoros = periodTasks
    .filter(t => t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
  
  // 按分类统计
  const byCategory = {
    work: periodTasks.filter(t => t.category === 'work'),
    study: periodTasks.filter(t => t.category === 'study'),
    life: periodTasks.filter(t => t.category === 'life')
  }
  
  // 按优先级统计
  const byPriority = {
    high: periodTasks.filter(t => t.priority === 'high' || t.priority === 'urgent'),
    medium: periodTasks.filter(t => t.priority === 'medium'),
    low: periodTasks.filter(t => t.priority === 'low')
  }
  
  // 工作日数和日均数据（修复：标准化到0点避免时分秒干扰）
  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  const workDays = Math.round((endDay - startDay) / (1000 * 60 * 60 * 24)) + 1
  const avgTasksPerDay = workDays > 0 ? (completedTasks / workDays).toFixed(1) : 0
  const avgPomodorosPerDay = workDays > 0 ? (totalPomodoros / workDays).toFixed(1) : 0
  
  // 生成报告文本
  const reportTitleMap = {
    zh: {
      daily: '工作日报',
      weekly: '工作周报',
      monthly: '月度总结',
      quarterly: '季度报告',
      halfyearly: '半年度报告',
      yearly: '年度总结',
      custom: '自定义报告'
    },
    en: {
      daily: 'Daily Report',
      weekly: 'Weekly Report',
      monthly: 'Monthly Summary',
      quarterly: 'Quarterly Report',
      halfyearly: 'Half-Yearly Report',
      yearly: 'Annual Summary',
      custom: 'Custom Report'
    }
  }
  
  const reportTitle = currentLanguage.value === 'zh' 
    ? `【${reportTitleMap.zh[reportType.value]}】${periodName}`
    : `【${reportTitleMap.en[reportType.value]}】${periodName}`
  
  const separator = '━'.repeat(60)
  const doubleSeparator = '═'.repeat(60)
  
  let report = `${separator}\n`
  report += `${reportTitle}\n`
  report += `${separator}\n`
  report += currentLanguage.value === 'zh' 
    ? `汇报人：${currentUsername.value}          生成时间：${formatDateTime(now)}\n`
    : `Reporter: ${currentUsername.value}          Generated: ${formatDateTime(now)}\n`
  report += currentLanguage.value === 'zh'
    ? `周期：${formatDate(startDate)} - ${formatDate(endDate)}\n`
    : `Period: ${formatDate(startDate)} - ${formatDate(endDate)}\n`
  report += `${separator}\n\n\n`
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 提前计算分类统计数据（用于AI摘要）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const workCompleted = byCategory.work.filter(t => t.status === TaskStatus.COMPLETED).length
  const workTotal = byCategory.work.length
  const workRate = workTotal > 0 ? Math.round((workCompleted / workTotal) * 100) : 0
  const workPomodoros = byCategory.work.filter(t => t.status === TaskStatus.COMPLETED).reduce((sum, t) => sum + getPomodoroCount(t), 0)
  
  const studyCompleted = byCategory.study.filter(t => t.status === TaskStatus.COMPLETED).length
  const studyTotal = byCategory.study.length
  const studyRate = studyTotal > 0 ? Math.round((studyCompleted / studyTotal) * 100) : 0
  const studyPomodoros = byCategory.study.filter(t => t.status === TaskStatus.COMPLETED).reduce((sum, t) => sum + getPomodoroCount(t), 0)
  
  const lifeCompleted = byCategory.life.filter(t => t.status === TaskStatus.COMPLETED).length
  const lifeTotal = byCategory.life.length
  const lifeRate = lifeTotal > 0 ? Math.round((lifeCompleted / lifeTotal) * 100) : 0
  const lifePomodoros = byCategory.life.filter(t => t.status === TaskStatus.COMPLETED).reduce((sum, t) => sum + getPomodoroCount(t), 0)
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 轨道1：高频习惯聚合 (用于文本报告)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const completedTasksList = periodTasks.filter(t => t.status === TaskStatus.COMPLETED && t.text)
  const textTaskFrequency = {}
  completedTasksList.forEach(task => {
    const key = (task.text || '').trim().toLowerCase()
    if (!key) return // 跳过空任务名
    
    if (!textTaskFrequency[key]) {
      textTaskFrequency[key] = {
        text: task.text,
        count: 0,
        pomodoros: 0,
        category: task.category,
        priority: task.priority,
        description: task.description || '',
        created_at: task.created_at
      }
    }
    textTaskFrequency[key].count++
    textTaskFrequency[key].pomodoros += getPomodoroCount(task)
  })
  
  const textMinExecutions = reportType.value === 'yearly' ? 3 : reportType.value === 'quarterly' ? 2 : 1
  const textAggregatedTasks = Object.values(textTaskFrequency)
    .filter(task => task.count >= textMinExecutions)
    .sort((a, b) => b.pomodoros - a.pomodoros)
    .slice(0, 10)
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 轨道2：里程碑提取 (用于文本报告) - 去重处理 + Bug2修复：必须有详细备注
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const textMilestonesRaw = completedTasksList.filter(task => {
    // 必须有详细备注才有资格成为里程碑
    if (!task.description || task.description.trim().length === 0) return false
    
    // Bug2修复：全局硬性门槛（所有报告类型）- 过滤低优先级且耗时不足2个番茄的琐事
    const pomodoros = getPomodoroCount(task)
    const isLowValueTask = task.priority === 'low' && pomodoros < 2
    if (isLowValueTask) return false
    
    let score = 0
    const hasRichDescription = (task.description || '').trim().length > 10
    if (hasRichDescription) score++
    const isHighValueTask = (task.priority === 'high' || task.priority === 'urgent') && getPomodoroCount(task) >= 4
    if (isHighValueTask) score++
    const taskKey = (task.text || '').trim().toLowerCase()
    if (!taskKey) return false // 跳过空任务名
    
    const isRareEvent = textTaskFrequency[taskKey] && textTaskFrequency[taskKey].count < 3
    if (isRareEvent) score++
    return score >= 2
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  // 去重：按任务名称去重，只保留最新的一条
  const textMilestonesMap = {}
  textMilestonesRaw.forEach(task => {
    const key = (task.text || '').trim().toLowerCase()
    if (!key) return // 跳过空任务名
    
    if (!textMilestonesMap[key]) {
      textMilestonesMap[key] = task
    }
  })
  const textMilestones = Object.values(textMilestonesMap).slice(0, 5)
  
  // 第一部分：执行摘要
  report += `${doubleSeparator}\n`
  report += currentLanguage.value === 'zh' ? '【第一部分】执行摘要 - Executive Summary\n' : '【Part 1】Executive Summary\n'
  report += `${doubleSeparator}\n\n`
  
  report += currentLanguage.value === 'zh' ? '一、核心数据概览\n' : '1. Core Data Overview\n'
  report += `${separator}\n`
  report += `┌──────────┬──────────┬──────────┬──────────┐\n`
  report += currentLanguage.value === 'zh'
    ? `│ 📝 总任务 │ ✅ 已完成 │ 🍅 番茄钟 │ 📈 完成率 │\n`
    : `│ 📝 Total  │ ✅ Done   │ 🍅 Pomodoro│ 📈 Rate  │\n`
  report += `│   ${String(totalTasks).padStart(3)}    │    ${String(completedTasks).padStart(3)}   │   ${String(totalPomodoros).padStart(3)}    │   ${String(completionRate).padStart(2)}%    │\n`
  report += `└──────────┴──────────┴──────────┴──────────┘\n\n`
  report += currentLanguage.value === 'zh'
    ? `工作日：${workDays}天  |  日均完成：${avgTasksPerDay}任务  |  日均番茄：${avgPomodorosPerDay}个\n\n`
    : `Work Days: ${workDays}  |  Avg Tasks: ${avgTasksPerDay}/day  |  Avg Pomodoros: ${avgPomodorosPerDay}/day\n\n`
  
  // AI 执行官摘要
  const topCategory = [
    { name: t('work'), rate: workRate, icon: '💼', pomodoros: workPomodoros },
    { name: t('study'), rate: studyRate, icon: '📚', pomodoros: studyPomodoros },
    { name: t('life'), rate: lifeRate, icon: '🏠', pomodoros: lifePomodoros }
  ].reduce((max, cat) => cat.pomodoros > max.pomodoros ? cat : max)
  
  const topHabit = textAggregatedTasks.length > 0 ? textAggregatedTasks[0] : null
  const topMilestone = textMilestones.length > 0 ? textMilestones[0] : null
  const totalFocusHours = (totalPomodoros * 0.5).toFixed(1)
  
  report += currentLanguage.value === 'zh' ? '二、AI 执行官摘要\n' : '2. AI Executive Summary\n'
  report += `${separator}\n`
  
  // Bug4修复：优化摘要拼接，添加分类过渡语
  const getMilestoneTransition = () => {
    if (!topMilestone) return ''
    const milestoneCategory = topMilestone.category
    const topCategoryKey = topCategory.icon === '💼' ? 'work' : topCategory.icon === '📚' ? 'study' : 'life'
    
    if (milestoneCategory !== topCategoryKey) {
      return currentLanguage.value === 'zh' ? '。此外，在其他方面最值得铭记的是「' : '. Additionally, the most memorable achievement in other areas was "'
    }
    return currentLanguage.value === 'zh' ? '。本' : '. The '
  }
  
  if (reportType.value === 'yearly') {
    const transition = getMilestoneTransition()
    const milestoneText = topMilestone 
      ? (transition.includes('此外') || transition.includes('Additionally') 
          ? `${transition}${topMilestone.text}」这一里程碑时刻` 
          : `${transition}年最值得铭记的是「${topMilestone.text}」这一里程碑时刻`)
      : ''
    
    report += currentLanguage.value === 'zh'
      ? `在过去的 ${now.getFullYear()} 年，你共计专注了 ${totalFocusHours} 个小时（${totalPomodoros} 个番茄钟）。其中，${topCategory.icon} ${topCategory.name}占据了你 ${topCategory.rate}% 的精力。你保持了${completionRate >= 80 ? '极高' : completionRate >= 60 ? '良好' : '稳定'}的执行力（${completionRate}% 完成率）${topHabit ? `，并且将「${topHabit.text}」培养成了贯穿全年的坚实习惯（累计 ${topHabit.count} 次）` : ''}${milestoneText}。\n\n\n`
      : `In ${now.getFullYear()}, you focused for ${totalFocusHours} hours (${totalPomodoros} pomodoros). ${topCategory.icon} ${topCategory.name} took ${topCategory.rate}% of your energy. You maintained ${completionRate >= 80 ? 'excellent' : completionRate >= 60 ? 'good' : 'steady'} execution (${completionRate}% completion rate)${topHabit ? `, and cultivated "${topHabit.text}" as a solid habit (${topHabit.count} times)` : ''}${topMilestone ? `. ${transition.includes('Additionally') ? transition : 'The '}most memorable milestone was "${topMilestone.text}"` : ''}.\n\n\n`
  } else if (reportType.value === 'halfyearly') {
    const transition = getMilestoneTransition()
    const milestoneText = topMilestone 
      ? (transition.includes('此外') ? `${transition}${topMilestone.text}」` : `${transition}半年最大突破是完成了「${topMilestone.text}」`)
      : ''
    
    report += currentLanguage.value === 'zh'
      ? `本半年你完成了 ${completedTasks} 个任务，累计投入 ${totalFocusHours} 小时。${topCategory.icon} ${topCategory.name}是你的主战场（${topCategory.rate}%）${milestoneText}。\n\n\n`
      : `This half-year you completed ${completedTasks} tasks with ${totalFocusHours} hours invested. ${topCategory.icon} ${topCategory.name} was your main focus (${topCategory.rate}%)${topMilestone ? `. ${transition.includes('Additionally') ? transition : 'The '}biggest breakthrough was completing "${topMilestone.text}"` : ''}.\n\n\n`
  } else if (reportType.value === 'quarterly') {
    const transition = getMilestoneTransition()
    const milestoneText = topMilestone 
      ? (transition.includes('此外') ? `${transition}${topMilestone.text}」` : `${transition}季最大突破是完成了「${topMilestone.text}」`)
      : ''
    
    report += currentLanguage.value === 'zh'
      ? `本季度你完成了 ${completedTasks} 个任务，累计投入 ${totalFocusHours} 小时。${topCategory.icon} ${topCategory.name}是你的主战场（${topCategory.rate}%）${milestoneText}。\n\n\n`
      : `This quarter you completed ${completedTasks} tasks with ${totalFocusHours} hours invested. ${topCategory.icon} ${topCategory.name} was your main focus (${topCategory.rate}%)${topMilestone ? `. ${transition.includes('Additionally') ? transition : 'The '}biggest breakthrough was completing "${topMilestone.text}"` : ''}.\n\n\n`
  } else if (reportType.value === 'monthly') {
    const transition = getMilestoneTransition()
    const milestoneText = topMilestone 
      ? (transition.includes('此外') ? `${transition}${topMilestone.text}」` : `，其中「${topMilestone.text}」最为关键`)
      : ''
    
    report += currentLanguage.value === 'zh'
      ? `本月你完成了 ${completedTasks} 个任务，日均 ${avgTasksPerDay} 个，完成率 ${completionRate}%。${topCategory.icon} ${topCategory.name}是你投入最多的领域（${topCategory.rate}%）${milestoneText}。\n\n\n`
      : `This month you completed ${completedTasks} tasks, averaging ${avgTasksPerDay} per day with ${completionRate}% completion rate. ${topCategory.icon} ${topCategory.name} received the most attention (${topCategory.rate}%)${topMilestone ? `, with "${topMilestone.text}" being the most critical` : ''}.\n\n\n`
  } else if (reportType.value === 'daily') {
    // Bug1修复：零值兜底逻辑
    if (totalTasks === 0 || completedTasks === 0) {
      report += currentLanguage.value === 'zh'
        ? `当前还没有任务数据哦，快去开启今天的第一个番茄钟吧！🍅\n\n\n`
        : `No task data yet. Start your first pomodoro today! 🍅\n\n\n`
    } else {
      const highValueRatio = completedTasks > 0 ? Math.round((byPriority.high.filter(t => t.status === TaskStatus.COMPLETED).length / completedTasks) * 100) : 0
      report += currentLanguage.value === 'zh'
        ? `今天你完成了 ${completedTasks} 个任务，完成率 ${completionRate}%，专注 ${totalPomodoros} 个番茄钟。${topCategory.icon} ${topCategory.name}是今日主要投入（${topCategory.rate}%）。${highValueRatio >= 50 ? '高优先级任务占比超过50%，执行力优秀！' : '继续保持专注！'}\n\n\n`
        : `Today you completed ${completedTasks} tasks with ${completionRate}% completion rate, focusing ${totalPomodoros} pomodoros. ${topCategory.icon} ${topCategory.name} was the main focus (${topCategory.rate}%). ${highValueRatio >= 50 ? 'High-priority tasks exceeded 50%, excellent execution!' : 'Keep focused!'}\n\n\n`
    }
  } else {
    // 周报/自定义报告：区分时间代词
    const highValueRatio = completedTasks > 0 ? Math.round((byPriority.high.filter(t => t.status === TaskStatus.COMPLETED).length / completedTasks) * 100) : 0
    const timePeriod = reportType.value === 'custom' 
      ? (currentLanguage.value === 'zh' ? '本期' : 'During this period')
      : (currentLanguage.value === 'zh' ? '本周' : 'This week')
    const highlightPrefix = reportType.value === 'custom'
      ? (currentLanguage.value === 'zh' ? '本期' : 'The')
      : (currentLanguage.value === 'zh' ? '本周' : 'The')
    
    report += currentLanguage.value === 'zh'
      ? `${timePeriod}你完成了 ${completedTasks} 个任务，完成率 ${completionRate}%，日均专注 ${avgPomodorosPerDay} 个番茄钟。${highValueRatio >= 50 ? '高优先级任务占比超过50%，执行力优秀！' : '继续保持专注！'}${topMilestone ? ` ${highlightPrefix}最大亮点是「${topMilestone.text}」。` : ''}\n\n\n`
      : `${timePeriod} you completed ${completedTasks} tasks with ${completionRate}% completion rate, averaging ${avgPomodorosPerDay} pomodoros per day. ${highValueRatio >= 50 ? 'High-priority tasks exceeded 50%, excellent execution!' : 'Keep focused!'}${topMilestone ? ` ${highlightPrefix} highlight was "${topMilestone.text}".` : ''}\n\n\n`
  }
  
  // 第二部分：分类统计
  report += `${doubleSeparator}\n`
  report += currentLanguage.value === 'zh' ? '【第二部分】分类统计 - Category Statistics\n' : '【Part 2】Category Statistics\n'
  report += `${doubleSeparator}\n\n`
  
  report += currentLanguage.value === 'zh' ? '一、按工作分类统计\n' : '1. By Category\n'
  report += `${separator}\n\n`
  
  report += `💼 ${t('work')} (${workTotal}${currentLanguage.value === 'zh' ? '项' : ' tasks'})\n`
  report += `${currentLanguage.value === 'zh' ? '已完成' : 'Completed'}: ${workCompleted}${currentLanguage.value === 'zh' ? '项' : ''} (${workRate}%)  |  ${currentLanguage.value === 'zh' ? '番茄' : 'Pomodoros'}: ${workPomodoros}${currentLanguage.value === 'zh' ? '个' : ''}\n\n`
  
  report += `📚 ${t('study')} (${studyTotal}${currentLanguage.value === 'zh' ? '项' : ' tasks'})\n`
  report += `${currentLanguage.value === 'zh' ? '已完成' : 'Completed'}: ${studyCompleted}${currentLanguage.value === 'zh' ? '项' : ''} (${studyRate}%)  |  ${currentLanguage.value === 'zh' ? '番茄' : 'Pomodoros'}: ${studyPomodoros}${currentLanguage.value === 'zh' ? '个' : ''}\n\n`
  
  report += `🏠 ${t('life')} (${lifeTotal}${currentLanguage.value === 'zh' ? '项' : ' tasks'})\n`
  report += `${currentLanguage.value === 'zh' ? '已完成' : 'Completed'}: ${lifeCompleted}${currentLanguage.value === 'zh' ? '项' : ''} (${lifeRate}%)  |  ${currentLanguage.value === 'zh' ? '番茄' : 'Pomodoros'}: ${lifePomodoros}${currentLanguage.value === 'zh' ? '个' : ''}\n\n\n`
  
  // Bug1修复：动态标题（年度/季度/半年度/月度）
  const periodTitleMap = {
    yearly: currentLanguage.value === 'zh' ? '年度习惯 Top 10' : 'Annual Top 10 Habits',
    halfyearly: currentLanguage.value === 'zh' ? '半年度习惯 Top 10' : 'Half-Yearly Top 10 Habits',
    quarterly: currentLanguage.value === 'zh' ? '季度习惯 Top 10' : 'Quarterly Top 10 Habits',
    monthly: currentLanguage.value === 'zh' ? '月度习惯 Top 10' : 'Monthly Top 10 Habits'
  }
  
  // 第三部分：习惯 Top 10（仅季报/半年报/年报显示）或 里程碑（所有报告显示）
  if (reportType.value === 'yearly' || reportType.value === 'quarterly' || reportType.value === 'halfyearly') {
    report += `${doubleSeparator}\n`
    report += currentLanguage.value === 'zh' 
      ? `【第三部分】${periodTitleMap[reportType.value]} - Top 10 Habits\n`
      : `【Part 3】${periodTitleMap[reportType.value]}\n`
    report += `${doubleSeparator}\n\n`
    
    textAggregatedTasks.forEach((task, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
      report += `${medal} ${task.text}\n`
      report += `   ${currentLanguage.value === 'zh' ? '累计' : 'Total'}: ${task.count} ${currentLanguage.value === 'zh' ? '次' : 'times'}  |  ${currentLanguage.value === 'zh' ? '消耗' : 'Consumed'}: ${task.pomodoros} 🍅  |  ${currentLanguage.value === 'zh' ? '分类' : 'Category'}: ${getCategoryText(task.category)}\n\n`
    })
    
    // 里程碑
    if (textMilestones.length > 0) {
      report += `${doubleSeparator}\n`
      report += currentLanguage.value === 'zh' ? '【第四部分】闪光的里程碑 - Key Milestones\n' : '【Part 4】Key Milestones\n'
      report += `${doubleSeparator}\n\n`
      
      textMilestones.forEach((milestone, index) => {
        report += `${index + 1}. ${milestone.text}\n`
        report += `   📅 ${formatDate(new Date(milestone.created_at))}  |  ${getCategoryText(milestone.category)}  |  ⚡ ${getPriorityText(milestone.priority)}  |  🍅 ${getPomodoroCount(milestone)}\n`
        if (milestone.description) {
          report += `   💬 ${milestone.description}\n`
        }
        report += `\n`
      })
    }
  } else if (reportType.value === 'monthly') {
    // 月报：显示高频任务 Top 10
    report += `${doubleSeparator}\n`
    report += currentLanguage.value === 'zh' ? '【第三部分】高频任务 Top 10 - Top 10 Tasks\n' : '【Part 3】Top 10 Tasks\n'
    report += `${doubleSeparator}\n\n`
    
    if (textAggregatedTasks.length > 0) {
      textAggregatedTasks.forEach((task, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
        report += `${medal} ${task.text}\n`
        report += `   ${currentLanguage.value === 'zh' ? '累计' : 'Total'}: ${task.count} ${currentLanguage.value === 'zh' ? '次' : 'times'}  |  ${currentLanguage.value === 'zh' ? '消耗' : 'Consumed'}: ${task.pomodoros} 🍅  |  ${currentLanguage.value === 'zh' ? '分类' : 'Category'}: ${getCategoryText(task.category)}\n\n`
      })
    } else {
      report += currentLanguage.value === 'zh' ? '暂无高频任务数据\n\n' : 'No frequent tasks data\n\n'
    }
    
    // Bug2修复：月报添加【闪光的里程碑】模块
    if (textMilestones.length > 0) {
      report += `${doubleSeparator}\n`
      report += currentLanguage.value === 'zh' ? '【第四部分】闪光的里程碑 - Key Milestones\n' : '【Part 4】Key Milestones\n'
      report += `${doubleSeparator}\n\n`
      
      textMilestones.forEach((milestone, index) => {
        report += `${index + 1}. ${milestone.text}\n`
        report += `   📅 ${formatDate(new Date(milestone.created_at))}  |  ${getCategoryText(milestone.category)}  |  ⚡ ${getPriorityText(milestone.priority)}  |  🍅 ${getPomodoroCount(milestone)}\n`
        if (milestone.description) {
          report += `   💬 ${milestone.description}\n`
        }
        report += `\n`
      })
    }
  } else {
    // 周报/日报：先显示高频习惯，再显示里程碑
    
    // Bug2修复：添加【本期高频投入】模块（日报跳过）
    if (reportType.value !== 'daily' && textAggregatedTasks.length > 0) {
      report += `${doubleSeparator}\n`
      report += currentLanguage.value === 'zh' ? '【第三部分】本期高频投入 - Frequent Tasks\n' : '【Part 3】Frequent Tasks\n'
      report += `${doubleSeparator}\n\n`
      
      textAggregatedTasks.slice(0, 5).forEach((task, index) => {
        report += `${index + 1}. ${task.text}\n`
        report += `   ${currentLanguage.value === 'zh' ? '累计' : 'Total'}: ${task.count} ${currentLanguage.value === 'zh' ? '次' : 'times'}  |  ${currentLanguage.value === 'zh' ? '消耗' : 'Consumed'}: ${task.pomodoros} 🍅  |  ${currentLanguage.value === 'zh' ? '分类' : 'Category'}: ${getCategoryText(task.category)}\n\n`
      })
    }
    
    // Bug3修复：里程碑按番茄钟数降序排序（日报跳过）
    if (reportType.value !== 'daily' && textMilestones.length > 0) {
      const sortedMilestones = [...textMilestones].sort((a, b) => {
        const aPomo = getPomodoroCount(a)
        const bPomo = getPomodoroCount(b)
        if (aPomo !== bPomo) return bPomo - aPomo
        const priorityWeight = { high: 3, urgent: 3, medium: 2, low: 1 }
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
      })
      
      report += `${doubleSeparator}\n`
      report += currentLanguage.value === 'zh' ? '【第四部分】本期亮点 - Highlights\n' : '【Part 4】Highlights\n'
      report += `${doubleSeparator}\n\n`
      
      sortedMilestones.forEach((milestone, index) => {
        report += `${index + 1}. ${milestone.text}\n`
        report += `   📅 ${formatDate(new Date(milestone.created_at))}  |  ${getCategoryText(milestone.category)}  |  ⚡ ${getPriorityText(milestone.priority)}  |  🍅 ${getPomodoroCount(milestone)}\n`
        if (milestone.description) {
          report += `   💬 ${milestone.description}\n`
        }
        report += `\n`
      })
    }
  }
  
  // Bug3修复：待办预警去重 + 新增【待办预警】模块
  // 日报：查询所有未完成任务（不限时间范围），其他报告：查询周期内未完成任务
  const incompleteTasks = reportType.value === 'daily' 
    ? taskStore.tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.text)
    : periodTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.text)
    
  if (incompleteTasks.length > 0) {
    // 按任务名称去重，保留优先级最高的
    const incompleteTasksMap = {}
    incompleteTasks.forEach(task => {
      const key = (task.text || '').trim().toLowerCase()
      if (!key) return // 跳过空任务名
      
      if (!incompleteTasksMap[key]) {
        incompleteTasksMap[key] = task
      } else {
        const priorityWeight = { high: 3, urgent: 3, medium: 2, low: 1 }
        const existingWeight = priorityWeight[incompleteTasksMap[key].priority] || 0
        const currentWeight = priorityWeight[task.priority] || 0
        if (currentWeight > existingWeight) {
          incompleteTasksMap[key] = task
        }
      }
    })
    
    const topIncompleteTasks = Object.values(incompleteTasksMap)
      .sort((a, b) => {
        const priorityWeight = { high: 3, urgent: 3, medium: 2, low: 1 }
        const aWeight = priorityWeight[a.priority] || 0
        const bWeight = priorityWeight[b.priority] || 0
        if (aWeight !== bWeight) return bWeight - aWeight
        return new Date(a.created_at) - new Date(b.created_at)
      })
      .slice(0, 5)
    
    report += `${doubleSeparator}\n`
    // 日报显示为第三部分，其他报告显示为待办预警
    if (reportType.value === 'daily') {
      report += currentLanguage.value === 'zh' ? '【第三部分】待办预警 - Pending Tasks\n' : '【Part 3】Pending Tasks\n'
    } else {
      report += currentLanguage.value === 'zh' ? '【待办预警】未完成任务 - Pending Tasks\n' : '【Pending Alert】Incomplete Tasks\n'
    }
    report += `${doubleSeparator}\n\n`
    
    topIncompleteTasks.forEach((task, index) => {
      const statusIcon = task.status === TaskStatus.OVERDUE ? '⏰' : '⏳'
      const statusText = task.status === TaskStatus.OVERDUE 
        ? (currentLanguage.value === 'zh' ? '已逾期' : 'Overdue')
        : (currentLanguage.value === 'zh' ? '待办' : 'Pending')
      
      report += `${index + 1}. ${statusIcon} ${task.text}\n`
      report += `   📅 ${formatDate(new Date(task.created_at))}  |  ${getCategoryText(task.category)}  |  ⚡ ${getPriorityText(task.priority)}  |  ${statusText}\n`
      if (task.description) {
        report += `   💬 ${task.description}\n`
      }
      report += `\n`
    })
  }
  
  report += `\n${separator}\n`
  report += currentLanguage.value === 'zh' 
    ? `报告生成时间：${formatDateTime(now)}\n`
    : `Generated: ${formatDateTime(now)}\n`
  report += currentLanguage.value === 'zh'
    ? `数据来源：TODO App 任务管理系统\n`
    : `Data Source: TODO App Task Management System\n`
  report += `${separator}\n`
  
  reportContent.value = report
  
  // 生成结构化数据用于UI展示
  const categories = [
    {
      name: t('work'),
      icon: '💼',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      total: byCategory.work.length,
      completed: workCompleted,
      rate: workRate,
      pomodoros: workPomodoros
    },
    {
      name: t('study'),
      icon: '📚',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      total: byCategory.study.length,
      completed: studyCompleted,
      rate: studyRate,
      pomodoros: studyPomodoros
    },
    {
      name: t('life'),
      icon: '🏠',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      total: byCategory.life.length,
      completed: lifeCompleted,
      rate: lifeRate,
      pomodoros: lifePomodoros
    }
  ]
  
  const priorities = [
    {
      name: getPriorityLabel('high'),
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      total: byPriority.high.length,
      percentage: totalTasks > 0 ? Math.round((byPriority.high.length / totalTasks) * 100) : 0
    },
    {
      name: getPriorityLabel('medium'),
      color: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      total: byPriority.medium.length,
      percentage: totalTasks > 0 ? Math.round((byPriority.medium.length / totalTasks) * 100) : 0
    },
    {
      name: getPriorityLabel('low'),
      color: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      total: byPriority.low.length,
      percentage: totalTasks > 0 ? Math.round((byPriority.low.length / totalTasks) * 100) : 0
    }
  ]
  
  // 每日趋势
  const dailyTrend = []
  let maxDaily = 0
  for (let i = 0; i < Math.min(workDays, 7); i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = date.toDateString()
    
    const count = periodTasks.filter(t => {
      const taskDate = new Date(t.created_at)
      return taskDate.toDateString() === dateStr && t.status === TaskStatus.COMPLETED
    }).length
    
    maxDaily = Math.max(maxDaily, count)
    
    const label = i === workDays - 1 ? t('todayLabel') : 
                  i === workDays - 2 ? t('yesterdayLabel') :
                  `${date.getMonth() + 1}/${date.getDate()}`
    
    dailyTrend.push({ date: dateStr, label, count })
  }
  
  // 按完成数降序排列
  dailyTrend.sort((a, b) => b.count - a.count)
  
  // 重点任务（按优先级和番茄数排序）
  const keyTasks = completedTasksList
    .sort((a, b) => {
      // 优先级权重：high/urgent=3, medium=2, low=1
      const priorityWeight = (p) => {
        if (p === 'high' || p === 'urgent') return 3
        if (p === 'medium') return 2
        return 1
      }
      const weightA = priorityWeight(a.priority)
      const weightB = priorityWeight(b.priority)
      
      // 先按优先级排序，优先级相同则按番茄数排序
      if (weightB !== weightA) return weightB - weightA
      return getPomodoroCount(b) - getPomodoroCount(a)
    })
    .slice(0, 10)
    .map(task => ({
      id: task.id,
      text: task.text,
      description: task.description,
      categoryIcon: task.category === 'work' ? '💼' : task.category === 'study' ? '📚' : '🏠',
      categoryText: getCategoryText(task.category),
      priorityText: getPriorityText(task.priority),
      pomodoros: getPomodoroCount(task),
      time: formatDateTime(task.created_at)
    }))
  
  // 智能总结（基于实际完成的任务）
  const summary = generateSmartSummary(reportType.value, completedTasksList)
  
  // 新增KPI指标
  const focusEfficiency = avgPomodorosPerDay // 专注力效率（复用已定义的变量）
  const highValueRatio = completedTasks > 0 
    ? Math.round((byPriority.high.filter(t => t.status === TaskStatus.COMPLETED).length / completedTasks) * 100) 
    : 0 // 高价值任务占比
  
  // 智能洞察引擎
  const insights = generateInsights({
    dailyTrend,
    categories,
    highValueRatio,
    completedTasks,
    workDays,
    focusEfficiency,
    byCategory
  })
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 轨道1：高频习惯聚合 (Habit Aggregation) - 用于生成【年度/月度习惯 Top 5】
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const taskFrequency = {}
  completedTasksList.forEach(task => {
    const key = (task.text || '').trim().toLowerCase()
    if (!key) return // 跳过空任务名
    
    if (!taskFrequency[key]) {
      taskFrequency[key] = {
        text: task.text,
        count: 0,
        pomodoros: 0,
        category: task.category,
        priority: task.priority,
        categoryIcon: task.category === 'work' ? '💼' : task.category === 'study' ? '📚' : '🏠'
      }
    }
    taskFrequency[key].count++
    taskFrequency[key].pomodoros += getPomodoroCount(task)
  })
  
  // 转换为数组，过滤碎态数据（频次<3的偶然事件），按总番茄数排序
  const minExecutions = reportType.value === 'yearly' ? 3 : reportType.value === 'quarterly' ? 2 : 1
  const minPomodoros = reportType.value === 'yearly' ? 2 : reportType.value === 'quarterly' ? 2 : 1
  
  const aggregatedTasks = Object.values(taskFrequency)
    .filter(task => task.count >= minExecutions || task.pomodoros >= minPomodoros)
    .sort((a, b) => b.pomodoros - a.pomodoros)
    .slice(0, 10)
    .map(task => ({
      ...task,
      persistence: Math.min(100, task.count * 10)
    }))
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 轨道2：年度大事提取 (Milestone Extraction) - 用于生成【闪光的里程碑】时间轴 - 去重处理
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const milestonesRaw = completedTasksList.filter(task => {
    // 必须有详细备注才有资格成为里程碑
    if (!task.description || task.description.trim().length === 0) return false
    
    // 全局硬性门槛：过滤低优先级且耗时不足2个番茄的琐事
    const pomodoros = getPomodoroCount(task)
    const isLowValueTask = task.priority === 'low' && pomodoros < 2
    if (isLowValueTask) return false
    
    let score = 0
    
    // 条件1：强备注特征（有详细描述）
    const hasRichDescription = (task.description || '').trim().length > 10
    if (hasRichDescription) score++
    
    // 条件2：高优且耗时（优先级=高 且 番茄钟≥4）
    const isHighValueTask = (task.priority === 'high' || task.priority === 'urgent') && getPomodoroCount(task) >= 4
    if (isHighValueTask) score++
    
    // 条件3：低频独立特征（该任务名称在周期内出现次数<3）
    const taskKey = (task.text || '').trim().toLowerCase()
    if (!taskKey) return false // 跳过空任务名
    
    const isRareEvent = taskFrequency[taskKey] && taskFrequency[taskKey].count < 3
    if (isRareEvent) score++
    
    // 满足任意2个条件即为里程碑
    return score >= 2
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // 按时间倒序
  
  // 去重：按任务名称去重，只保留最新的一条
  const milestonesMap = {}
  milestonesRaw.forEach(task => {
    const key = task.text.trim().toLowerCase()
    if (!milestonesMap[key]) {
      milestonesMap[key] = task
    }
  })
  
  const milestones = Object.values(milestonesMap)
    .slice(0, 10)
    .map(task => ({
      id: task.id,
      text: task.text,
      description: task.description || '',
      categoryIcon: task.category === 'work' ? '💼' : task.category === 'study' ? '📚' : '🏠',
      categoryText: getCategoryText(task.category),
      priorityText: getPriorityText(task.priority),
      pomodoros: getPomodoroCount(task),
      time: formatDateTime(task.created_at),
      date: formatDate(new Date(task.created_at))
    }))
  
  // 月度趋势数据（用于年报/半年报/季报的趋势图）
  const monthlyTrend = []
  if (reportType.value === 'yearly' || reportType.value === 'quarterly' || reportType.value === 'halfyearly') {
    const monthsInPeriod = reportType.value === 'yearly' ? 12 : reportType.value === 'halfyearly' ? 6 : 3
    const startMonth = startDate.getMonth()
    const startYear = startDate.getFullYear()
    
    for (let i = 0; i < monthsInPeriod; i++) {
      const month = (startMonth + i) % 12
      const year = startYear + Math.floor((startMonth + i) / 12)
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
      
      const monthTasks = periodTasks.filter(t => {
        const taskDate = new Date(t.created_at)
        return taskDate >= monthStart && taskDate <= monthEnd && t.status === TaskStatus.COMPLETED
      })
      
      const monthPomodoros = monthTasks.reduce((sum, t) => sum + getPomodoroCount(t), 0)
      
      monthlyTrend.push({
        month: `${month + 1}${currentLanguage.value === 'zh' ? '月' : ''}`,
        count: monthTasks.length,
        pomodoros: monthPomodoros
      })
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 热力图数据生成（仅季报/年报）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let heatmapData = null
  let streakStats = null
  
  if (reportType.value === 'yearly' || reportType.value === 'quarterly' || reportType.value === 'halfyearly') {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
    const heatmapDays = []
    
    // 生成每一天的数据
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayTasks = periodTasks.filter(t => {
        const taskDate = new Date(t.created_at)
        return taskDate.toISOString().split('T')[0] === dateStr && t.status === TaskStatus.COMPLETED
      })
      
      heatmapDays.push({
        date: dateStr,
        count: dayTasks.length,
        pomodoros: dayTasks.reduce((sum, t) => sum + getPomodoroCount(t), 0)
      })
    }
    
    // 计算颜色（基于完成任务数）- 紫色渐变主题
    const maxCount = Math.max(...heatmapDays.map(d => d.count), 1)
    const getColor = (count) => {
      if (count === 0) return '#ebedf0'
      const ratio = count / maxCount
      if (ratio <= 0.2) return '#c4b5fd'  // 浅紫
      if (ratio <= 0.4) return '#a78bfa'  // 中浅紫
      if (ratio <= 0.6) return '#8b5cf6'  // 中紫
      return '#6d28d9'  // 深紫
    }
    
    // 按周组织数据
    const weeks = []
    let currentWeek = []
    const firstDayOfWeek = startDate.getDay() // 0=周日, 1=周一
    
    // 填充第一周的空白
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: 0, color: 'transparent' })
    }
    
    heatmapDays.forEach((day, index) => {
      currentWeek.push({
        ...day,
        color: getColor(day.count)
      })
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })
    
    // 填充最后一周的空白
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', count: 0, color: 'transparent' })
      }
      weeks.push(currentWeek)
    }
    
    // 生成月份标签
    const months = []
    let currentMonth = startDate.getMonth()
    for (let i = 0; i < days; i += 30) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const month = date.getMonth()
      if (month !== currentMonth || i === 0) {
        months.push({
          label: currentLanguage.value === 'zh' ? `${month + 1}月` : date.toLocaleString('en', { month: 'short' }),
          offset: Math.floor(i / 7)
        })
        currentMonth = month
      }
    }
    
    heatmapData = { weeks, months }
    
    // 计算连胜记录
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    for (let i = heatmapDays.length - 1; i >= 0; i--) {
      if (heatmapDays[i].count > 0) {
        tempStreak++
        if (i === heatmapDays.length - 1) {
          currentStreak = tempStreak
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)
    
    streakStats = {
      current: currentStreak,
      longest: longestStreak
    }
  }
  
  // 年度总专注时长（番茄钟转小时）
  
  reportData.value = {
    title: reportTitle.replace(/【|】/g, ''),
    period: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    generatedTime: formatDateTime(now),
    totalTasks,
    completedTasks,
    totalPomodoros,
    completionRate,
    focusEfficiency,
    highValueRatio,
    avgTasksPerDay,
    workDays,
    totalFocusHours: (totalPomodoros * 0.5).toFixed(1),
    bestMonth: monthlyTrend.length > 0 ? monthlyTrend.reduce((max, m) => m.count > max.count ? m : max, monthlyTrend[0]) : null,
    categories,
    priorities,
    dailyTrend,
    monthlyTrend,
    maxDaily: maxDaily || 1,
    keyTasks,
    aggregatedTasks,
    milestones,
    heatmapData, // 新增：热力图数据
    streakStats, // 新增：连胜统计
    summary,
    insights
  }
  
  // 生成执行官摘要
  reportData.value.executiveSummary = generateExecutiveSummary(reportData.value, reportType.value)
}

// 生成执行官摘要（Executive Summary）- 结合里程碑数据生成更有温度的摘要
const generateExecutiveSummary = (data, reportType) => {
  const lang = currentLanguage.value
  const year = new Date().getFullYear()
  
  // 调试：打印 reportType（v1.6.4 修复版）
  console.log('🔍 generateExecutiveSummary - reportType:', reportType, typeof reportType)
  
  if (reportType === 'yearly') {
    // 年度摘要
    const topCategory = data.categories.reduce((max, cat) => cat.pomodoros > max.pomodoros ? cat : max, data.categories[0])
    const topHabit = data.aggregatedTasks && data.aggregatedTasks.length > 0 ? data.aggregatedTasks[0] : null
    const topMilestone = data.milestones && data.milestones.length > 0 ? data.milestones[0] : null
    const streakInfo = data.streakStats && data.streakStats.longest > 7 ? `，创造了 ${data.streakStats.longest} 天的最长连胜记录` : ''
    
    return lang === 'zh'
      ? `在过去的 ${year} 年，你共计专注了 ${data.totalFocusHours} 个小时（${data.totalPomodoros} 个番茄钟）。其中，${topCategory.icon} ${topCategory.name}占据了你 ${topCategory.rate}% 的精力。你保持了${data.completionRate >= 80 ? '极高' : data.completionRate >= 60 ? '良好' : '稳定'}的执行力（${data.completionRate}% 完成率）${topHabit ? `，并且将「${topHabit.text}」培养成了贯穿全年的坚实习惯（累计 ${topHabit.count} 次）` : ''}${streakInfo}${topMilestone ? `。最值得铭记的是「${topMilestone.text}」这一里程碑时刻` : ''}。`
      : `In ${year}, you focused for ${data.totalFocusHours} hours (${data.totalPomodoros} pomodoros). ${topCategory.icon} ${topCategory.name} took ${topCategory.rate}% of your energy. You maintained ${data.completionRate >= 80 ? 'excellent' : data.completionRate >= 60 ? 'good' : 'steady'} execution (${data.completionRate}% completion rate)${topHabit ? `, and cultivated "${topHabit.text}" as a solid habit (${topHabit.count} times)` : ''}${data.streakStats && data.streakStats.longest > 7 ? `, achieving a ${data.streakStats.longest}-day longest streak` : ''}${topMilestone ? `. The most memorable milestone was "${topMilestone.text}"` : ''}.`
  } else if (reportType === 'halfyearly') {
    // 半年报摘要
    const topCategory = data.categories.reduce((max, cat) => cat.pomodoros > max.pomodoros ? cat : max, data.categories[0])
    const topMilestone = data.milestones && data.milestones.length > 0 ? data.milestones[0] : null
    const streakInfo = data.streakStats && data.streakStats.longest > 7 ? `，最长连胜 ${data.streakStats.longest} 天` : ''
    
    return lang === 'zh'
      ? `本半年你完成了 ${data.completedTasks} 个任务，累计投入 ${data.totalFocusHours} 小时。${topCategory.icon} ${topCategory.name}是你的主战场（${topCategory.rate}%）${streakInfo}${data.bestMonth ? `，其中 ${data.bestMonth.month}是最高产的月份（${data.bestMonth.count} 个任务）` : ''}${topMilestone ? `。本半年最大突破是完成了「${topMilestone.text}」` : ''}。`
      : `This half-year you completed ${data.completedTasks} tasks with ${data.totalFocusHours} hours invested. ${topCategory.icon} ${topCategory.name} was your main focus (${topCategory.rate}%)${data.streakStats && data.streakStats.longest > 7 ? `, with a ${data.streakStats.longest}-day longest streak` : ''}${data.bestMonth ? `, with ${data.bestMonth.month} being the most productive month (${data.bestMonth.count} tasks)` : ''}${topMilestone ? `. The biggest breakthrough was completing "${topMilestone.text}"` : ''}.`
  } else if (reportType === 'quarterly') {
    // 季度摘要
    const topCategory = data.categories.reduce((max, cat) => cat.pomodoros > max.pomodoros ? cat : max, data.categories[0])
    const topMilestone = data.milestones && data.milestones.length > 0 ? data.milestones[0] : null
    const streakInfo = data.streakStats && data.streakStats.longest > 7 ? `，最长连胜 ${data.streakStats.longest} 天` : ''
    
    return lang === 'zh'
      ? `本季度你完成了 ${data.completedTasks} 个任务，累计投入 ${data.totalFocusHours} 小时。${topCategory.icon} ${topCategory.name}是你的主战场（${topCategory.rate}%）${streakInfo}${data.bestMonth ? `，其中 ${data.bestMonth.month}是最高产的月份（${data.bestMonth.count} 个任务）` : ''}${topMilestone ? `。本季最大突破是完成了「${topMilestone.text}」` : ''}。`
      : `This quarter you completed ${data.completedTasks} tasks with ${data.totalFocusHours} hours invested. ${topCategory.icon} ${topCategory.name} was your main focus (${topCategory.rate}%)${data.streakStats && data.streakStats.longest > 7 ? `, with a ${data.streakStats.longest}-day longest streak` : ''}${data.bestMonth ? `, with ${data.bestMonth.month} being the most productive month (${data.bestMonth.count} tasks)` : ''}${topMilestone ? `. The biggest breakthrough was completing "${topMilestone.text}"` : ''}.`
  } else if (reportType === 'monthly') {
    // 月度摘要
    const topCategory = data.categories.reduce((max, cat) => cat.completed > max.completed ? cat : max, data.categories[0])
    const topMilestone = data.milestones && data.milestones.length > 0 ? data.milestones[0] : null
    
    return lang === 'zh'
      ? `本月你完成了 ${data.completedTasks} 个任务，日均 ${data.avgTasksPerDay} 个，完成率 ${data.completionRate}%。${topCategory.icon} ${topCategory.name}是你投入最多的领域（${topCategory.completed} 个任务）${topMilestone ? `，其中「${topMilestone.text}」最为关键` : ''}。`
      : `This month you completed ${data.completedTasks} tasks, averaging ${data.avgTasksPerDay} per day with ${data.completionRate}% completion rate. ${topCategory.icon} ${topCategory.name} received the most attention (${topCategory.completed} tasks)${topMilestone ? `, with "${topMilestone.text}" being the most critical` : ''}.`
  } else if (reportType === 'daily') {
    // 日报摘要
    const topCategory = data.categories.reduce((max, cat) => cat.completed > max.completed ? cat : max, data.categories[0])
    const highValueRatio = data.completedTasks > 0 ? Math.round((data.priorities[0].completed / data.completedTasks) * 100) : 0
    
    return lang === 'zh'
      ? `今天你完成了 ${data.completedTasks} 个任务，完成率 ${data.completionRate}%，专注 ${data.totalPomodoros} 个番茄钟。${topCategory.icon} ${topCategory.name}是今日主要投入（${topCategory.completed} 个任务）。${highValueRatio >= 50 ? '高优先级任务占比超过50%，执行力优秀！' : '继续保持专注！'}`
      : `Today you completed ${data.completedTasks} tasks with ${data.completionRate}% completion rate, focusing ${data.totalPomodoros} pomodoros. ${topCategory.icon} ${topCategory.name} was the main focus (${topCategory.completed} tasks). ${highValueRatio >= 50 ? 'High-priority tasks exceeded 50%, excellent execution!' : 'Keep focused!'}`
  } else {
    // 周报/自定义摘要
    const topMilestone = data.milestones && data.milestones.length > 0 ? data.milestones[0] : null
    const timePeriod = reportType === 'custom' 
      ? (lang === 'zh' ? '本期' : 'During this period')
      : (lang === 'zh' ? '本周' : 'This week')
    const highlightPrefix = reportType === 'custom'
      ? (lang === 'zh' ? '本期' : 'The')
      : (lang === 'zh' ? '本周' : 'The')
    
    return lang === 'zh'
      ? `${timePeriod}你完成了 ${data.completedTasks} 个任务，完成率 ${data.completionRate}%，日均专注 ${data.focusEfficiency} 个番茄钟。${data.highValueRatio >= 50 ? '高优先级任务占比超过50%，执行力优秀！' : '继续保持专注！'}${topMilestone ? ` ${highlightPrefix}最大亮点是「${topMilestone.text}」。` : ''}`
      : `${timePeriod} you completed ${data.completedTasks} tasks with ${data.completionRate}% completion rate, averaging ${data.focusEfficiency} pomodoros per day. ${data.highValueRatio >= 50 ? 'High-priority tasks exceeded 50%, excellent execution!' : 'Keep focused!'}${topMilestone ? ` ${highlightPrefix} highlight was "${topMilestone.text}".` : ''}`
  }
}

// 智能洞察引擎
const generateInsights = (data) => {
  const insights = []
  const lang = currentLanguage.value
  
  // 规则A：高产分析（找出番茄钟最多的一天）
  if (data.dailyTrend && data.dailyTrend.length > 0) {
    const bestDay = data.dailyTrend.reduce((max, day) => day.count > max.count ? day : max, data.dailyTrend[0])
    if (bestDay.count > 0) {
      const topCategory = data.categories.reduce((max, cat) => cat.completed > max.completed ? cat : max, data.categories[0])
      insights.push({
        icon: '🚀',
        type: 'productivity',
        text: lang === 'zh'
          ? `这周的你犹如神助！${bestDay.label}是你战斗力最强的一天，一口气完成了 ${bestDay.count} 个任务，主要聚焦在${topCategory.icon} ${topCategory.name}上。`
          : `You were on fire! ${bestDay.label} was your most productive day with ${bestDay.count} tasks completed, mainly focused on ${topCategory.icon} ${topCategory.name}.`
      })
    }
  }
  
  // 规则B：失衡预警（工作占比过高）
  const workRatio = data.categories[0].rate
  if (workRatio > 70) {
    insights.push({
      icon: '⚠️',
      type: 'balance',
      text: lang === 'zh'
        ? `本期是个不折不扣的工作狂（工作占比高达 ${workRatio}%）。努力固然可敬，但周末别忘了给"生活"留点时间，去打场球或看个电影吧！`
        : `You're a workaholic this period (work accounts for ${workRatio}%). Hard work is admirable, but don't forget to leave some time for life on weekends!`
    })
  }
  
  // 规则C：执行力巅峰（高优先级任务完成率高）
  if (data.highValueRatio >= 50) {
    insights.push({
      icon: '🎯',
      type: 'execution',
      text: lang === 'zh'
        ? `完美的要事优先执行者！本期你极其精准地消灭了高优先级任务（占比 ${data.highValueRatio}%），没有被琐事牵着鼻子走。`
        : `Perfect prioritization! You precisely eliminated high-priority tasks (${data.highValueRatio}%), not distracted by trivial matters.`
    })
  }
  
  // 规则D：连胜激励（连续多天完成任务）
  if (data.workDays >= 7 && data.completedTasks >= data.workDays) {
    insights.push({
      icon: '🏆',
      type: 'streak',
      text: lang === 'zh'
        ? `大满贯达成！🏆 你创造了完美的 ${data.workDays} 天连续行动记录，自律得让人可怕。`
        : `Grand Slam! 🏆 You've created a perfect ${data.workDays}-day action streak. Your discipline is impressive!`
    })
  }
  
  // 规则E：专注力评价
  if (data.focusEfficiency >= 8) {
    insights.push({
      icon: '⚡',
      type: 'focus',
      text: lang === 'zh'
        ? `超强专注力！日均 ${data.focusEfficiency} 个番茄钟，你的时间管理能力已经超越了90%的人。`
        : `Super focus! ${data.focusEfficiency} pomodoros per day on average. Your time management skills surpass 90% of people.`
    })
  }
  
  return insights
}

// 生成智能总结（基于实际完成的任务）
const generateSmartSummary = (type, completedTasks) => {
  const summary = []
  const lang = currentLanguage.value
  
  // 按分类分组任务
  const workTasks = completedTasks.filter(t => t.category === 'work')
  const studyTasks = completedTasks.filter(t => t.category === 'study')
  const lifeTasks = completedTasks.filter(t => t.category === 'life')
  
  // 提取高优先级任务
  const highPriorityTasks = completedTasks.filter(t => t.priority === 'high' || t.priority === 'urgent')
  
  // 工作类任务总结
  if (workTasks.length > 0) {
    const topWork = workTasks.slice(0, 5).map(t => `• ${t.text}`).join('\n')
    summary.push({
      icon: '💼',
      title: lang === 'zh' ? `工作 (${workTasks.length}项)` : `Work (${workTasks.length})`,
      description: topWork || (lang === 'zh' ? '暂无任务' : 'No tasks')
    })
  }
  
  // 学习类任务总结
  if (studyTasks.length > 0) {
    const topStudy = studyTasks.slice(0, 5).map(t => `• ${t.text}`).join('\n')
    summary.push({
      icon: '📚',
      title: lang === 'zh' ? `学习 (${studyTasks.length}项)` : `Study (${studyTasks.length})`,
      description: topStudy || (lang === 'zh' ? '暂无任务' : 'No tasks')
    })
  }
  
  // 生活类任务总结
  if (lifeTasks.length > 0) {
    const topLife = lifeTasks.slice(0, 5).map(t => `• ${t.text}`).join('\n')
    summary.push({
      icon: '🏠',
      title: lang === 'zh' ? `生活 (${lifeTasks.length}项)` : `Life (${lifeTasks.length})`,
      description: topLife || (lang === 'zh' ? '暂无任务' : 'No tasks')
    })
  }
  
  // 重点突破（高优先级任务）
  if (highPriorityTasks.length > 0) {
    const topHigh = highPriorityTasks.slice(0, 5).map(t => `• ${t.text}`).join('\n')
    summary.push({
      icon: '⚡',
      title: lang === 'zh' ? `重点突破 (${highPriorityTasks.length}项)` : `Key Achievements (${highPriorityTasks.length})`,
      description: topHigh
    })
  }
  
  return summary
}

// 方法：复制报告文本
const copyReportText = async () => {
  try {
    await navigator.clipboard.writeText(reportContent.value)
    alert(currentLanguage.value === 'zh' ? '报告已复制到剪贴板' : 'Report copied to clipboard')
  } catch (err) {
    alert(currentLanguage.value === 'zh' ? '复制失败，请手动复制' : 'Copy failed, please copy manually')
  }
}

// 方法：复制周报
const copyWeeklyReport = async () => {
  try {
    let textToCopy = ''
    
    // 如果是结构化数据，格式化为文本
    if (typeof weeklyReportContent.value === 'object') {
      textToCopy = `${weeklyReportTitle.value}\n\n`
      
      if (weeklyReportContent.value.overview) {
        const o = weeklyReportContent.value.overview
        textToCopy += `📊 数据概览\n`
        textToCopy += `完成任务：${o.totalTasks || 0}个\n`
        textToCopy += `完成率：${o.completionRate || '100%'}\n`
        textToCopy += `高优先级：${o.highPriority || 0}个\n`
        textToCopy += `番茄钟：${o.pomodoros || 0}个\n`
        textToCopy += `分类：💼工作${o.workTasks || 0} 📚学习${o.studyTasks || 0} 🏠生活${o.lifeTasks || 0}\n\n`
      }
      
      if (weeklyReportContent.value.previousCompleted && weeklyReportContent.value.previousCompleted.length > 0) {
        textToCopy += `✅ 已完成情况（截止上期）\n`
        weeklyReportContent.value.previousCompleted.forEach((item, i) => {
          textToCopy += `${i + 1}. ${item}\n`
        })
        textToCopy += '\n'
      }
      
      if (weeklyReportContent.value.monthlyGoals && weeklyReportContent.value.monthlyGoals.length > 0) {
        textToCopy += `🎯 本月目标\n`
        weeklyReportContent.value.monthlyGoals.forEach((item, i) => {
          textToCopy += `${i + 1}. ${item}\n`
        })
        textToCopy += '\n'
      }
      
      if (weeklyReportContent.value.monthlyProgress && weeklyReportContent.value.monthlyProgress.length > 0) {
        textToCopy += `📈 本月进展（截止当前）\n`
        weeklyReportContent.value.monthlyProgress.forEach((item, i) => {
          textToCopy += `${i + 1}. ${item}\n`
        })
        textToCopy += '\n'
      }
      
      if (weeklyReportContent.value.weeklyProgress && weeklyReportContent.value.weeklyProgress.length > 0) {
        textToCopy += `📅 本周进展\n`
        weeklyReportContent.value.weeklyProgress.forEach((item, i) => {
          textToCopy += `${i + 1}. ${item}\n`
        })
        textToCopy += '\n'
      }
      
      if (weeklyReportContent.value.nextWeekPlan && weeklyReportContent.value.nextWeekPlan.length > 0) {
        textToCopy += `📋 下周计划\n`
        weeklyReportContent.value.nextWeekPlan.forEach((item, i) => {
          textToCopy += `${i + 1}. ${item}\n`
        })
        textToCopy += '\n'
      }
      
      if (weeklyReportContent.value.risks && weeklyReportContent.value.risks.length > 0) {
        textToCopy += `⚠️ 风险与问题\n`
        weeklyReportContent.value.risks.forEach((item, i) => {
          textToCopy += `${i + 1}. ${item}\n`
        })
        textToCopy += '\n'
      }
      
      if (weeklyReportContent.value.summary) {
        textToCopy += `📊 整体总结\n${weeklyReportContent.value.summary}\n\n`
      }
      
      if (weeklyReportContent.value.tasks && weeklyReportContent.value.tasks.length > 0) {
        textToCopy += `📋 完成任务明细 (${weeklyReportContent.value.tasks.length}个)\n`
        weeklyReportContent.value.tasks.forEach((t, i) => {
          textToCopy += `${i + 1}. ${t.text}\n`
        })
      }
    } else {
      textToCopy = weeklyReportContent.value
    }
    
    await navigator.clipboard.writeText(textToCopy)
    showNotification('周报已复制到剪贴板', 'success')
  } catch (err) {
    showNotification('复制失败，请手动复制', 'error')
  }
}

// 方法：导出Markdown
const exportMarkdown = () => {
  try {
    // 生成Markdown格式
    const data = reportData.value
    let markdown = `# ${data.title}\n\n`
    markdown += `**${currentLanguage.value === 'zh' ? '周期' : 'Period'}**: ${data.period}  \n`
    markdown += `**${currentLanguage.value === 'zh' ? '汇报人' : 'Reporter'}**: ${currentUsername.value}  \n`
    markdown += `**${currentLanguage.value === 'zh' ? '生成时间' : 'Generated'}**: ${data.generatedTime}\n\n`
    
    markdown += `---\n\n`
    
    // 核心数据
    markdown += `## ${currentLanguage.value === 'zh' ? '📊 核心数据' : '📊 Core Data'}\n\n`
    markdown += `| ${currentLanguage.value === 'zh' ? '指标' : 'Metric'} | ${currentLanguage.value === 'zh' ? '数值' : 'Value'} |\n`
    markdown += `|------|------|\n`
    markdown += `| 📝 ${currentLanguage.value === 'zh' ? '总任务' : 'Total Tasks'} | ${data.totalTasks} |\n`
    markdown += `| ✅ ${currentLanguage.value === 'zh' ? '已完成' : 'Completed'} | ${data.completedTasks} |\n`
    markdown += `| 🍅 ${currentLanguage.value === 'zh' ? '番茄钟' : 'Pomodoros'} | ${data.totalPomodoros} |\n`
    markdown += `| 📈 ${currentLanguage.value === 'zh' ? '完成率' : 'Completion Rate'} | ${data.completionRate}% |\n\n`
    
    // 分类统计
    markdown += `## ${currentLanguage.value === 'zh' ? '📊 分类统计' : '📊 By Category'}\n\n`
    data.categories.forEach(cat => {
      markdown += `### ${cat.icon} ${cat.name}\n\n`
      markdown += `- ${currentLanguage.value === 'zh' ? '总任务' : 'Total'}: ${cat.total}\n`
      markdown += `- ${currentLanguage.value === 'zh' ? '已完成' : 'Completed'}: ${cat.completed} (${cat.rate}%)\n`
      markdown += `- ${currentLanguage.value === 'zh' ? '番茄钟' : 'Pomodoros'}: ${cat.pomodoros}\n\n`
    })
    
    // 智能总结（前置）
    if (data.summary && data.summary.length > 0) {
      markdown += `## ${currentLanguage.value === 'zh' ? '💡 本期重点事项' : '💡 Key Activities'}\n\n`
      data.summary.forEach(item => {
        markdown += `### ${item.icon} ${item.title}\n\n`
        markdown += `${item.description}\n\n`
      })
    }
    
    // 优先级分布
    markdown += `## ${currentLanguage.value === 'zh' ? '⚡ 优先级分布' : '⚡ By Priority'}\n\n`
    data.priorities.forEach(pri => {
      markdown += `- **${pri.name}**: ${pri.total}${currentLanguage.value === 'zh' ? '项' : ''} (${pri.percentage}%)\n`
    })
    markdown += `\n`
    
    // 每日趋势（按完成数降序）
    if (data.dailyTrend && data.dailyTrend.length > 0) {
      markdown += `## ${currentLanguage.value === 'zh' ? '📈 高效工作日排行' : '📈 Most Productive Days'}\n\n`
      data.dailyTrend.forEach(day => {
        markdown += `- **${day.label}**: ${day.count}${currentLanguage.value === 'zh' ? '个任务' : ' tasks'}\n`
      })
      markdown += `\n`
    }
    
    // 重点任务
    markdown += `## ${currentLanguage.value === 'zh' ? '🎯 重点任务' : '🎯 Key Tasks'}\n\n`
    data.keyTasks.forEach((task, index) => {
      markdown += `### ${index + 1}. ${task.text}\n\n`
      markdown += `- ${currentLanguage.value === 'zh' ? '分类' : 'Category'}: ${task.categoryIcon} ${task.categoryText}\n`
      markdown += `- ${currentLanguage.value === 'zh' ? '优先级' : 'Priority'}: ⚡ ${task.priorityText}\n`
      markdown += `- ${currentLanguage.value === 'zh' ? '番茄数' : 'Pomodoros'}: 🍅 ${task.pomodoros}\n`
      markdown += `- ${currentLanguage.value === 'zh' ? '完成时间' : 'Time'}: 📅 ${task.time}\n`
      if (task.description) {
        markdown += `- ${currentLanguage.value === 'zh' ? '说明' : 'Description'}: ${task.description}\n`
      }
      markdown += `\n`
    })
    
    markdown += `---\n\n`
    markdown += `*${currentLanguage.value === 'zh' ? '报告生成时间' : 'Generated'}: ${data.generatedTime}*  \n`
    markdown += `*${currentLanguage.value === 'zh' ? '数据来源' : 'Data Source'}: TODO App*\n`
    
    // 创建下载
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.title.replace(/\s+/g, '_')}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert(currentLanguage.value === 'zh' ? 'Markdown文件已下载' : 'Markdown file downloaded')
  } catch (err) {
    console.error(err)
    alert(currentLanguage.value === 'zh' ? '导出失败' : 'Export failed')
  }
}

// 方法：导出数据海报

const exportHTML = async () => {
  try {
    const reportElement = document.querySelector('.report-preview-cards')
    if (!reportElement) {
      alert(currentLanguage.value === 'zh' ? '未找到报告内容，请先生成报告' : 'Report content not found, please generate report first')
      return
    }
    
    // 显示加载提示
    const loadingMsg = currentLanguage.value === 'zh' ? '正在生成HTML...' : 'Generating HTML...'
    alert(loadingMsg)
    
    // 克隆报告内容
    const clonedElement = reportElement.cloneNode(true)
    
    // 获取所有计算后的样式
    const styles = window.getComputedStyle(reportElement)
    const inlineStyles = Array.from(styles).reduce((acc, key) => {
      acc += `${key}:${styles.getPropertyValue(key)};`
      return acc
    }, '')
    
    // 将所有 ECharts 图表转换为图片
    const chartElements = reportElement.querySelectorAll('canvas')
    const clonedCharts = clonedElement.querySelectorAll('canvas')
    
    for (let i = 0; i < chartElements.length; i++) {
      const canvas = chartElements[i]
      const clonedCanvas = clonedCharts[i]
      
      // 将 canvas 转换为 img
      const img = document.createElement('img')
      img.src = canvas.toDataURL('image/png')
      img.style.width = canvas.style.width || canvas.width + 'px'
      img.style.height = canvas.style.height || canvas.height + 'px'
      
      // 替换 canvas
      clonedCanvas.parentNode.replaceChild(img, clonedCanvas)
    }
    
    // 内联所有样式
    const allElements = clonedElement.querySelectorAll('*')
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el)
      let styleStr = ''
      for (let i = 0; i < computedStyle.length; i++) {
        const key = computedStyle[i]
        styleStr += `${key}:${computedStyle.getPropertyValue(key)};`
      }
      el.setAttribute('style', styleStr)
    })
    
    // 生成完整的 HTML 文档
    const htmlContent = '<!DOCTYPE html>\n' +
'<html lang="' + currentLanguage.value + '">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>' + reportData.value.title + '</title>\n' +
'  <style>\n' +
'    body {\n' +
'      margin: 0;\n' +
'      padding: 20px;\n' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n' +
'      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n' +
'    }\n' +
'    @media print {\n' +
'      body { background: white; padding: 0; }\n' +
'    }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
clonedElement.outerHTML + '\n' +
'</body>\n' +
'</html>'
    
    // 创建下载
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const filename = `${reportData.value.title}_${new Date().getTime()}.html`
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert(currentLanguage.value === 'zh' 
      ? 'HTML文件已下载！\n\n💡 提示：\n1. 用浏览器打开文件\n2. 按 Cmd+P (Mac) 或 Ctrl+P (Windows)\n3. 选择"另存为PDF"即可保存为PDF' 
      : 'HTML file downloaded!\n\n💡 Tip:\n1. Open with browser\n2. Press Cmd+P (Mac) or Ctrl+P (Windows)\n3. Select "Save as PDF"')
  } catch (err) {
    console.error('导出HTML失败:', err)
    alert(currentLanguage.value === 'zh' ? '导出失败：' + err.message : 'Export failed: ' + err.message)
  }
}

// 方法：加载用户信息
const loadUserInfo = async () => {
  const username = currentUsername.value
  if (!username) return
  
  const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
  const userInfo = userInfoData ? JSON.parse(userInfoData) : {}
  
  if (userInfo[username]) {
    userProfileInfo.value = userInfo[username]
  } else {
    // 如果是老用户没有信息，创建默认信息
    userProfileInfo.value = {
      username: username,
      registerTime: new Date().toISOString(),
      lastLoginTime: new Date().toISOString()
    }
    userInfo[username] = userProfileInfo.value
    await Preferences.set({ key: 'userInfo', value: JSON.stringify(userInfo) })
  }
}

// 格式化报告类型
const formatReportType = (type) => {
  const map = {
    daily: '📝 日报',
    weekly: '📅 周报',
    monthly: '📊 月报',
    quarterly: '📈 季报',
    halfyearly: '📆 半年报',
    halfYearly: '📆 半年报',
    yearly: '🎯 年报',
    custom: '🔍 自定义报告'
  }
  return map[type] || '📊 报告'
}

// 方法：日志类型图标
const getLogTypeIcon = (type) => {
  const map = {
    start: '🚀',
    progress: '📈',
    block: '🚫',
    solution: '💡',
    milestone: '🎯',
    complete: '✅'
  }
  return map[type] || '📝'
}

// 方法：格式化日志时间（简短版）

// 自适应textarea高度
const autoResizeTextarea = (event) => {
  const textarea = event.target
  textarea.style.height = 'auto'
  const newHeight = Math.min(Math.max(textarea.scrollHeight, 80), 300)
  textarea.style.height = newHeight + 'px'
}

// 方法：格式化日志时间（完整版）
const formatLogTimeFull = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  // 始终显示完整的 年/月/日 时:分
  return `${year}/${month}/${day} ${hour}:${minute}`
}

// 方法：格式化时间轴时间
const formatTimelineMini = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 方法：格式化截止时间
const formatDeadlineMini = (task) => {
  const deadline = taskStore.calculateDeadline(task)
  if (!deadline) return '无截止'
  
  const deadlineDate = new Date(deadline)
  return `${deadlineDate.getMonth() + 1}/${deadlineDate.getDate()} ${String(deadlineDate.getHours()).padStart(2, '0')}:${String(deadlineDate.getMinutes()).padStart(2, '0')}`
}

// 方法：获取截止时间样式类
const getDeadlineClass = (task) => {
  const deadline = taskStore.calculateDeadline(task)
  if (!deadline) return 'normal'
  
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 0) return 'overdue'
  if (hours < 2) return 'urgent'
  if (hours < 24) return 'warning'
  return 'normal'
}

// 方法：日志类型文本
const getLogTypeText = (type) => {
  const map = {
    start: '开始执行',
    progress: '进展更新',
    block: '遇到阻碍',
    solution: '解决方案',
    milestone: '里程碑',
    complete: '完成总结'
  }
  return map[type] || type
}

// 方法：心情图标
const getMoodIcon = (mood) => {
  const map = {
    good: '😊 顺利',
    neutral: '😐 一般',
    bad: '😓 困难'
  }
  return map[mood] || ''
}

// 方法：排序日志（最新在上）
const sortedLogs = (task) => {
  if (!task.logs) return []
  return [...task.logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

// 方法：打开添加日志弹窗
const openAddLogModal = (task) => {
  currentLogTask.value = task
  showAddLogModal.value = true
}

// 方法：从编辑弹窗删除日志
const deleteLogFromEdit = (logId) => {
  if (confirm('确定要删除这条日志吗？')) {
    if (editingTask.value) {
      editingTask.value.logs = editingTask.value.logs.filter(l => l.id !== logId)
      saveEditingTask()
    }
  }
}

// 方法：处理添加日志
const handleAddLog = async (logData) => {
  if (!currentLogTask.value) return
  
  const taskId = currentLogTask.value.id
  await taskStore.addTaskLog(taskId, logData)
  
  showAddLogModal.value = false
  currentLogTask.value = null
  
  // 刷新任务详情（确保 logs 和 media 同步）
  if (selectedTask.value?.id === taskId) {
    handleTaskDetailRefresh()
  }
  
  // 如果编辑弹窗还开着，更新 editingTask
  if (editingTask.value && editingTask.value.id === taskId) {
    const updatedTask = taskStore.tasks.find(t => t.id === taskId)
    if (updatedTask) {
      editingTask.value = updatedTask
    }
  }
}

// 方法：格式化时长（简短版）
const formatDurationMini = (minutes) => {
  if (!minutes) return '0分'
  if (minutes < 60) return `${minutes}分`
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) return `${hours}时`
  return `${hours}时${mins}分`
}

// 状态：查看全部日志弹窗
const showAllLogs = ref(false)

// 状态：添加日志弹窗
const showAddLogModal = ref(false)
const addLogModalRef = ref(null)
const showTaskDetail = ref(false)
const taskDetailModalRef = ref(null) // TaskDetailModal 组件引用
const unifiedReportModalRef = ref(null) // UnifiedReportModal 组件引用
const tagBrowserRef = ref(null) // 🆕 TagBrowser 组件引用
const selectedTask = ref(null)
const currentLogTask = ref(null)

// 状态：演示模式
const showTutorial = ref(false)

// 方法：开始演示模式
const startTutorial = () => {
  showTutorial.value = true
}

// 方法：演示模式跳过
const handleTutorialSkip = async () => {
  showTutorial.value = false
  // 同样保存完成标记，避免下次登录再次触发
  await Preferences.set({ 
    key: `tutorial_${userStore.currentUser}`, 
    value: 'skipped' 
  })
}

// 方法：演示模式完成
const handleTutorialFinish = async () => {
  showTutorial.value = false
  // 保存用户级别的教程完成标记
  await Preferences.set({ 
    key: `tutorial_${userStore.currentUser}`, 
    value: 'true' 
  })
  // 显示完成提示
  showNotification('🎉 恭喜完成新手教程！', 'success')
}

// 方法：编辑用户名
const editingUsername = ref(false)
const usernameInput = ref(null)

const startEditUsername = () => {
  newUsername.value = currentUsername.value
  editingUsername.value = true
  nextTick(() => {
    usernameInput.value?.focus()
  })
}

const saveUsername = async () => {
  if (!newUsername.value || newUsername.value === currentUsername.value) {
    editingUsername.value = false
    return
  }
  
  const username = currentUsername.value
  const { value: usersData } = await Preferences.get({ key: 'users' })
  const users = usersData ? JSON.parse(usersData) : {}
  
  if (users[newUsername.value]) {
    alert('用户名已存在')
    editingUsername.value = false
    return
  }
  
  const password = users[username]
  delete users[username]
  users[newUsername.value] = password
  
  await Preferences.set({ key: 'users', value: JSON.stringify(users) })
  await Preferences.set({ key: 'currentUser', value: newUsername.value })
  
  // 更新用户信息，保留注册时间，添加修改时间
  const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
  const userInfo = userInfoData ? JSON.parse(userInfoData) : {}
  
  if (userInfo[username]) {
    const oldInfo = userInfo[username]
    delete userInfo[username]
    userInfo[newUsername.value] = {
      ...oldInfo,
      username: newUsername.value,
      usernameModifiedTime: new Date().toISOString(), // 记录修改时间
      lastLoginTime: new Date().toISOString()
    }
    await Preferences.set({ key: 'userInfo', value: JSON.stringify(userInfo) })
    userProfileInfo.value = userInfo[newUsername.value]
  }
  
  taskStore.tasks.forEach(task => {
    if (task.user_id === username) {
      task.user_id = newUsername.value
    }
  })
  await taskStore.saveTasks()
  
  userStore.currentUser = newUsername.value
  editingUsername.value = false
  alert('用户名修改成功')
}

// 方法：修改密码
const updatePassword = async () => {
  if (!oldPassword.value || !newPassword.value) {
    alert('请输入当前密码和新密码')
    return
  }
  
  const { value: usersData } = await Preferences.get({ key: 'users' })
  const users = usersData ? JSON.parse(usersData) : {}
  const username = currentUsername.value
  
  if (users[username] !== oldPassword.value) {
    alert('当前密码错误')
    return
  }
  
  users[username] = newPassword.value
  await Preferences.set({ key: 'users', value: JSON.stringify(users) })
  
  oldPassword.value = ''
  newPassword.value = ''
  showPasswordModal.value = false
  alert('密码修改成功')
}

// 方法：发送绑定手机验证码
const sendBindSMS = async () => {
  if (!/^1[3-9]\d{9}$/.test(bindPhoneNumber.value)) {
    showNotification('请输入正确的手机号', 'error')
    return
  }

  // 检查手机号是否已被其他账号绑定
  const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
  const allUserInfo = userInfoData ? JSON.parse(userInfoData) : {}
  
  for (const [user, info] of Object.entries(allUserInfo)) {
    if (info.boundPhone === bindPhoneNumber.value && user !== currentUsername.value) {
      showNotification('该手机号已被其他账号绑定', 'error')
      return
    }
  }

  bindGeneratedCode.value = Math.floor(100000 + Math.random() * 900000).toString()
  
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.schedule({
    notifications: [{
      title: '【TO-DO 绑定验证码】',
      body: `您的绑定验证码为：${bindGeneratedCode.value}，请在5分钟内完成验证。`,
      id: 2,
      schedule: { at: new Date(Date.now() + 1000) }
    }]
  })

  showNotification('验证码已发送', 'info')
  
  bindCountdown.value = 60
  bindTimer = setInterval(() => {
    bindCountdown.value--
    if (bindCountdown.value <= 0) clearInterval(bindTimer)
  }, 1000)
}

// 方法：确认绑定手机号
const confirmBindPhone = async () => {
  if (String(bindVerificationCode.value) !== String(bindGeneratedCode.value) || !bindGeneratedCode.value) {
    showNotification('验证码错误或已失效', 'error')
    return
  }

  const username = currentUsername.value
  const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
  const userInfo = userInfoData ? JSON.parse(userInfoData) : {}
  
  if (!userInfo[username]) {
    userInfo[username] = {}
  }
  
  userInfo[username].boundPhone = bindPhoneNumber.value
  await Preferences.set({ key: 'userInfo', value: JSON.stringify(userInfo) })
  
  // 创建手机号到用户名的映射
  const { value: phoneMappingData } = await Preferences.get({ key: 'phoneMapping' })
  const phoneMapping = phoneMappingData ? JSON.parse(phoneMappingData) : {}
  phoneMapping[bindPhoneNumber.value] = username
  await Preferences.set({ key: 'phoneMapping', value: JSON.stringify(phoneMapping) })
  
  userProfileInfo.value.boundPhone = bindPhoneNumber.value
  bindPhoneNumber.value = ''
  bindVerificationCode.value = ''
  bindGeneratedCode.value = ''
  showPhoneModal.value = false
  
  showNotification('手机号绑定成功！', 'success')
}

// 方法：解绑手机号
const unbindPhone = async () => {
  if (!confirm('确定要解绑手机号吗？')) return
  
  const username = currentUsername.value
  const phone = userProfileInfo.value.boundPhone
  
  const { value: userInfoData } = await Preferences.get({ key: 'userInfo' })
  const userInfo = userInfoData ? JSON.parse(userInfoData) : {}
  
  if (userInfo[username]) {
    delete userInfo[username].boundPhone
    await Preferences.set({ key: 'userInfo', value: JSON.stringify(userInfo) })
  }
  
  // 删除手机号映射
  const { value: phoneMappingData } = await Preferences.get({ key: 'phoneMapping' })
  const phoneMapping = phoneMappingData ? JSON.parse(phoneMappingData) : {}
  delete phoneMapping[phone]
  await Preferences.set({ key: 'phoneMapping', value: JSON.stringify(phoneMapping) })
  
  userProfileInfo.value.boundPhone = null
  showPhoneModal.value = false
  showNotification('手机号已解绑', 'success')
}

// 方法：导出任务到Excel
// 方法：导出任务到Excel
// 手动备份（JSON + Excel）
const handleManualBackup = async () => {
  try {
    showNotification('正在备份...', 'info')
    const result = await manualBackup()
    
    if (result.success) {
      showNotification(
        `✅ 备份成功！\n\n` +
        `📊 任务数量: ${result.taskCount} 条\n` +
        `📄 JSON: ${result.jsonFile}\n` +
        `📊 Excel: ${result.excelFile}\n\n` +
        `📂 保存位置:\n/storage/emulated/0/Documents/TODO-App-backups/\n\n` +
        `💡 可通过文件管理器访问`,
        'success'
      )
    } else {
      showNotification(`备份失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('备份失败:', error)
    showNotification('备份失败，请重试', 'error')
  }
}

// 触发恢复文件选择
const triggerRestoreFile = () => {
  restoreFileInput.value?.click()
}

// 处理恢复文件
const handleRestoreFile = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  if (!confirm('确定要恢复备份吗？\n\n⚠️ 这将覆盖当前所有数据！')) {
    event.target.value = '' // 清空文件选择
    return
  }
  
  try {
    showNotification('正在恢复...', 'info')
    
    // 读取文件内容
    const text = await file.text()
    const backupData = JSON.parse(text)
    
    // Web端特殊处理：分批恢复，避免配额限制
    const isWeb = Capacitor.getPlatform() === 'web'
    
    // 1. 恢复 Preferences 数据
    let preferencesCount = 0
    for (const key in backupData) {
      if (key === '_localStorage') continue
      
      try {
        if (isWeb && key.startsWith('tasks_')) {
          // Web端：任务数据分批保存（减小批次大小）
          const tasks = JSON.parse(backupData[key])
          const batchSize = 10 // 减小到每批10个任务
          
          for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize)
            const batchKey = `${key}_batch_${Math.floor(i / batchSize)}`
            
            try {
              await Preferences.set({ key: batchKey, value: JSON.stringify(batch) })
            } catch (batchError) {
              if (batchError.name === 'QuotaExceededError') {
                console.warn(`批次 ${batchKey} 超出配额，跳过`)
                continue
              }
              throw batchError
            }
          }
          
          // 保存批次信息
          await Preferences.set({ 
            key: `${key}_meta`, 
            value: JSON.stringify({ 
              total: tasks.length, 
              batches: Math.ceil(tasks.length / batchSize) 
            }) 
          })
        } else if (isWeb && key.startsWith('deletedTasks_')) {
          // 回收站数据也分批
          const tasks = JSON.parse(backupData[key])
          const batchSize = 10
          
          for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize)
            const batchKey = `${key}_batch_${Math.floor(i / batchSize)}`
            
            try {
              await Preferences.set({ key: batchKey, value: JSON.stringify(batch) })
            } catch (batchError) {
              if (batchError.name === 'QuotaExceededError') {
                console.warn(`批次 ${batchKey} 超出配额，跳过`)
                continue
              }
              throw batchError
            }
          }
          
          await Preferences.set({ 
            key: `${key}_meta`, 
            value: JSON.stringify({ 
              total: tasks.length, 
              batches: Math.ceil(tasks.length / batchSize) 
            }) 
          })
        } else {
          await Preferences.set({ key, value: backupData[key] })
        }
        preferencesCount++
      } catch (error) {
        console.error(`恢复失败: ${key}`, error)
        // 继续恢复其他数据
      }
    }
    
    // 2. 恢复 localStorage 数据（跳过大数据）
    let localStorageCount = 0
    if (backupData._localStorage) {
      for (const key in backupData._localStorage) {
        try {
          const value = backupData._localStorage[key]
          // 跳过超大数据（>1MB）
          if (value.length > 1024 * 1024) {
            console.warn(`跳过超大数据: ${key} (${(value.length / 1024).toFixed(0)}KB)`)
            continue
          }
          localStorage.setItem(key, value)
          localStorageCount++
        } catch (error) {
          console.warn(`localStorage恢复失败，跳过: ${key}`)
        }
      }
    }
    
    showNotification(
      `✅ 恢复成功！\n\n` +
      `📦 Preferences: ${preferencesCount}项\n` +
      `💾 localStorage: ${localStorageCount}项\n\n` +
      `即将刷新页面...`,
      'success'
    )
    
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  } catch (error) {
    console.error('恢复失败:', error)
    showNotification(`恢复失败: ${error.message}`, 'error')
  } finally {
    event.target.value = '' // 清空文件选择
  }
}

// 加载备份列表
const loadBackupList = async () => {
  try {
    const files = await listBackups()
    backupFiles.value = files
  } catch (error) {
    console.error('加载备份列表失败:', error)
    backupFiles.value = []
  }
}

// 格式化备份日期
const formatBackupDate = (fileName) => {
  const match = fileName.match(/TODO-App_backup_(\d{4}-\d{2}-\d{2})/)
  if (match) {
    return match[1]
  }
  return fileName
}

// 恢复备份
const handleRestore = async (fileName) => {
  if (!confirm(`确定要恢复备份 ${fileName} 吗？\n\n⚠️ 这将覆盖当前所有数据！`)) {
    return
  }
  
  try {
    showNotification('正在恢复...', 'info')
    const result = await restoreBackup(fileName)
    
    if (result.success) {
      showNotification('恢复成功！即将刷新页面...', 'success')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      showNotification(`恢复失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('恢复失败:', error)
    showNotification('恢复失败，请重试', 'error')
  }
}

// 删除备份
const handleDeleteBackup = async (fileName) => {
  if (!confirm(`确定要删除备份 ${fileName} 吗？\n\n此操作不可恢复！`)) {
    return
  }
  
  try {
    const result = await deleteBackup(fileName)
    
    if (result.success) {
      showNotification('删除成功', 'success')
      // 刷新备份列表
      await loadBackupList()
    } else {
      showNotification(`删除失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showNotification('删除失败，请重试', 'error')
  }
}

// 监听备份列表弹窗打开
watch(showBackupList, (newVal) => {
  if (newVal) {
    loadBackupList()
  }
})

const exportToExcel = async () => {
  const tasks = taskStore.tasks
  
  if (tasks.length === 0) {
    showNotification('暂无任务数据可导出', 'error')
    return
  }
  
  try {
    // 使用统一格式转换
    const exportData = tasks.map(task => taskToExcelRow(task, false))
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '我的任务')
    
    // 生成文件名（统一命名规范）
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '') // HHmmss
    const filename = `TODO-App_export_${currentUsername.value}_${dateStr}_${timeStr}.xlsx`
    
    // 检测运行环境
    const isNative = Capacitor.isNativePlatform()
    
    if (isNative) {
      // 原生应用：统一保存到 Documents/TODO-App-exports/
      try {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
        
        await Filesystem.writeFile({
          path: `TODO-App-exports/${filename}`,
          data: wbout,
          directory: Directory.Documents,
          recursive: true
        })
        
        showNotification(
          `✅ 导出成功！\n\n` +
          `📄 文件名: ${filename}\n` +
          `📂 保存位置:\n/storage/emulated/0/Documents/TODO-App-exports/\n\n` +
          `💡 可通过文件管理器访问`,
          'success'
        )
      } catch (nativeError) {
        console.error('原生保存失败，降级到浏览器下载:', nativeError)
        // 降级到浏览器下载方式
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        showNotification(`文件已下载：${filename}`, 'success')
      }
    } else {
      // 网页版：触发浏览器下载
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      showNotification(`文件已下载：${filename}`, 'success')
    }
    
    // 记录备份时间
    await recordBackupTime()
  } catch (error) {
    console.error('导出失败:', error)
    showNotification('导出失败，请重试', 'error')
  }
}

// 方法：获取任务类型文本

// 方法：获取优先级文本
const getPriorityText = (priority) => {
  return getPriorityLabel(priority)
}

// 方法：获取番茄数（根据优先级）
const getPomodoroCount = (task) => {
  // 如果传入的是字符串（旧版兼容），按优先级返回
  if (typeof task === 'string') {
    const pomodoroMap = { high: 4, medium: 2, low: 1 }
    return pomodoroMap[task] || 2
  }

  // 优先级系数
  const priorityMultiplier = {
    high: 1.5,
    medium: 1.0,
    low: 0.75
  }

  const multiplier = priorityMultiplier[task.priority] || 1.0
  let basePomodoros = 2

  // 对于已完成的任务，基于实际时间跨度计算
  if (task.status === 'completed' && task.completed_at && task.created_at) {
    const createdTime = new Date(task.created_at).getTime()
    const completedTime = new Date(task.completed_at).getTime()
    const daySpan = (completedTime - createdTime) / (1000 * 60 * 60 * 24)
    
    // 如果跨度超过1天，按实际天数计算
    if (daySpan > 1) {
      // 每天2个番茄，最多200个封顶
      basePomodoros = Math.min(Math.round(daySpan * 2), 200)
      return Math.round(basePomodoros * multiplier)
    }
    // 否则继续按下面的逻辑计算
  }

  // 根据任务类型计算基础番茄数（未完成任务或当天完成的任务）
  if (['today', 'tomorrow', 'this_week'].includes(task.type)) {
    // 短期任务：基于预估时长
    const durationMap = {
      quick: 0.5,  // 0.5小时 = 1个番茄
      normal: 2,   // 2小时 = 4个番茄
      long: 4      // 4小时 = 8个番茄
    }
    const hours = durationMap[task.duration || 'normal']
    basePomodoros = hours * 2
  } else if (task.type === 'custom_date') {
    // 长期任务：基于项目规模
    const scaleMap = {
      small: 10,   // 小型项目
      medium: 30,  // 中型项目
      large: 100   // 大型项目
    }
    basePomodoros = scaleMap[task.scale || 'small']
  } else if (['daily', 'weekday', 'weekly'].includes(task.type)) {
    // 重复任务：固定单次番茄数
    basePomodoros = 2
  }

  // 应用优先级系数并四舍五入
  return Math.round(basePomodoros * multiplier)
}

// 获取父任务名称
const getParentTaskName = (parentTaskId) => {
  const parentTask = taskStore.tasks.find(t => t.id === parentTaskId)
  return parentTask ? parentTask.text : '已删除的任务'
}

// 获取子任务数量
const getSubtasksCount = (taskId) => {
  return taskStore.tasks.filter(t => t.parentTaskId === taskId).length
}

// 获取依赖数量（前置任务）
const getDependencyCount = (taskId) => {
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (!task || !task.waitFor || task.waitFor.length === 0) return 0
  return task.waitFor.length
}

// 获取被依赖数量（后置任务）
const getWaitingTasksCount = (taskId) => {
  return taskStore.getWaitingTasks(taskId).length
}

// 方法：获取分类文本
const getCategoryText = (category) => {
  return t(category) // work/study/life 都在语言包中
}

// 方法：获取习惯标题（动态）
const getHabitTitle = () => {
  const titleMap = {
    daily: '今日高频投入 Top 5',
    weekly: '本周高频投入 Top 5',
    monthly: '本月执念 Top 5',
    quarterly: '本季执念 Top 5',
    halfyearly: '半年执念 Top 5',
    yearly: '年度执念 Top 5',
    custom: '本期执念 Top 5'
  }
  return titleMap[reportType.value] || '你的执念 Top 5'
}

// 方法：触发文件选择
const triggerImport = () => {
  fileInput.value?.click()
}

// 方法：显示导入警告
const showImportWarning = () => {
  const confirmed = confirm(
    `⚠️ 导入 Excel 数据警告\n\n` +
    `Excel 导入仅包含基础任务信息，以下数据将丢失：\n\n` +
    `❌ 执行日志（所有推进记录）\n` +
    `❌ 番茄钟历史（专注记录）\n` +
    `❌ AI 总结（智能分析）\n` +
    `❌ 执行统计（进度、耗时等）\n\n` +
    `如需完整备份恢复，请使用"完整备份(JSON)"功能！\n\n` +
    `确定要继续导入 Excel 吗？`
  )
  
  if (confirmed) {
    triggerImport()
  }
}

// 方法：显示清空警告
const showClearWarning = async () => {
  const taskCount = taskStore.tasks.length
  
  // 第一次确认
  const firstConfirm = confirm(
    `⚠️ 危险操作警告\n\n` +
    `您即将清空所有 ${taskCount} 个任务！\n\n` +
    `此操作不可撤销，建议先备份数据。\n\n` +
    `是否要自动创建备份？`
  )
  
  if (!firstConfirm) {
    return
  }
  
  // 自动备份
  try {
    await handleManualBackup()
    showNotification('已自动备份数据', 'success')
  } catch (error) {
    console.error('自动备份失败:', error)
    const continueWithoutBackup = confirm(
      `自动备份失败：${error.message}\n\n` +
      `是否继续清空任务？（不推荐）`
    )
    if (!continueWithoutBackup) {
      return
    }
  }
  
  // 第二次确认 - 要求输入确认文字
  const confirmText = prompt(
    `⚠️ 最后确认\n\n` +
    `请输入"确认清空"四个字以继续：`
  )
  
  if (confirmText === '确认清空') {
    clearAllTasks()
  } else {
    showNotification('已取消清空操作', 'info')
  }
}

// 方法：下载导入模板
const downloadTemplate = async () => {
  try {
    // 生成模板数据（3个示例）
    const templateData = generateTemplateData()
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '任务模板')
    
    // 导出文件
    const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
    const fileName = `TODO导入模板_${new Date().toISOString().split('T')[0]}.xlsx`
    
    await Filesystem.writeFile({
      path: fileName,
      data: excelBuffer,
      directory: Directory.Documents
    })
    
    showNotification(`模板已保存到 Documents/${fileName}`, 'success')
  } catch (error) {
    console.error('下载模板失败:', error)
    showNotification('下载模板失败，请重试', 'error')
  }
}

// 方法：导入任务
// 导入预览数据
const importPreviewData = ref(null)
const showImportPreview = ref(false)

// 数据验证函数
const validateTaskData = (row, rowIndex) => {
  const errors = []
  
  // 1. 验证任务名称（必填）
  const taskName = row['任务名称']?.trim()
  if (!taskName) {
    return { valid: false, errors: ['任务名称为空'] }
  }
  
  // 2. 验证分类（支持中英文）
  const category = row['分类']
  const validCategories = { 
    '工作': 'work', '学习': 'study', '生活': 'life',
    'work': 'work', 'study': 'study', 'life': 'life',
    '💼': 'work', '📚': 'study', '🏠': 'life'
  }
  if (category && !validCategories[category]) {
    errors.push(`分类"${category}"无效，应为：工作/学习/生活 或 work/study/life`)
  }
  
  // 3. 验证优先级（支持中英文）
  const priority = row['优先级']
  const validPriorities = { 
    '高': 'high', '中': 'medium', '低': 'low',
    'high': 'high', 'medium': 'medium', 'low': 'low',
    'High': 'high', 'Medium': 'medium', 'Low': 'low'
  }
  if (priority && !validPriorities[priority]) {
    errors.push(`优先级"${priority}"无效，应为：高/中/低 或 high/medium/low`)
  }
  
  // 4. 验证状态（支持中英文）
  const status = row['状态']
  const validStatuses = { 
    '待办': 'pending', '已完成': 'completed', '已逾期': 'overdue',
    'pending': 'pending', 'completed': 'completed', 'overdue': 'overdue',
    'Pending': 'pending', 'Completed': 'completed', 'Overdue': 'overdue'
  }
  if (status && !validStatuses[status]) {
    errors.push(`状态"${status}"无效，应为：待办/已完成/已逾期 或 pending/completed/overdue`)
  }
  
  // 5. 验证日期格式
  const createdAt = row['创建时间']
  if (createdAt && !isValidDate(createdAt)) {
    errors.push(`创建时间"${createdAt}"格式无效`)
  }
  
  const completedAt = row['完成时间']
  if (completedAt && !isValidDate(completedAt)) {
    errors.push(`完成时间"${completedAt}"格式无效`)
  }
  
  const customDate = row['指定日期']
  if (customDate && !isValidDate(customDate)) {
    errors.push(`指定日期"${customDate}"格式无效`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 日期格式验证
const isValidDate = (dateStr) => {
  if (!dateStr) return true
  
  // 尝试直接解析日期（支持多种格式）
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date)
}

const importFromExcel = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet)
        
        if (rows.length === 0) {
          showNotification('文件中没有数据', 'error')
          return
        }
        
        // 分析导入数据
        const analysis = {
          total: rows.length,
          newTasks: [],
          duplicates: [],
          errors: []
        }
        
        const existingTasks = taskStore.tasks
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const rowNum = i + 2 // Excel行号（从第2行开始）
          
          try {
            // 数据验证
            const validation = validateTaskData(row, rowNum)
            if (!validation.valid) {
              analysis.errors.push({ 
                row: rowNum, 
                reason: validation.errors.join('；') 
              })
              continue
            }
            
            const taskName = row['任务名称'].trim()
            const categoryMap = { 
              '工作': 'work', '学习': 'study', '生活': 'life',
              'work': 'work', 'study': 'study', 'life': 'life',
              'Work': 'work', 'Study': 'study', 'Life': 'life',
              '💼': 'work', '📚': 'study', '🏠': 'life'
            }
            const category = categoryMap[row['分类']] || 'work'
            
            // 检查是否重复
            const isDuplicate = existingTasks.some(t => 
              t.text === taskName && t.category === category
            )
            
            const taskPreview = {
              row: rowNum,
              name: taskName,
              category: row['分类'] || '工作',
              priority: row['优先级'] || '中',
              type: row['任务类型'] || '今天'
            }
            
            if (isDuplicate) {
              analysis.duplicates.push(taskPreview)
            } else {
              analysis.newTasks.push(taskPreview)
            }
          } catch (err) {
            analysis.errors.push({ 
              row: rowNum, 
              reason: `解析失败：${err.message}` 
            })
          }
        }
        
        // 保存预览数据和原始文件
        importPreviewData.value = {
          analysis,
          file,
          rows
        }
        
        // 显示预览弹窗
        showImportPreview.value = true
        
        // 清空文件输入
        fileInput.value.value = ''
      } catch (error) {
        console.error('解析文件失败:', error)
        showNotification('文件格式错误，请使用导出的模板', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  } catch (error) {
    console.error('读取文件失败:', error)
    showNotification('读取文件失败', 'error')
  }
}

// 确认导入
const confirmImport = async () => {
  if (!importPreviewData.value) return
  
  const { rows } = importPreviewData.value
  let successCount = 0
  let errorCount = 0
  
  for (const row of rows) {
    try {
      const taskName = row['任务名称']?.trim()
      if (!taskName) {
        errorCount++
        continue
      }
      
      // 使用统一格式转换
      const newTask = excelRowToTask(row, currentUsername.value)
      newTask.id = Date.now() + successCount
      
      await taskStore.addTask(newTask)
      successCount++
    } catch (err) {
      console.error('导入单条任务失败:', err)
      errorCount++
    }
  }
  
  showNotification(`导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`, 'success')
  
  // 关闭预览
  showImportPreview.value = false
  importPreviewData.value = null
}

// 取消导入
const cancelImport = () => {
  showImportPreview.value = false
  importPreviewData.value = null
}

// 解析分类文本

// 解析优先级文本

// 解析类型文本

// 解析状态文本

// 解析周期（从类型字段提取）

// 解析日期时间

// 方法：格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
}

// 方法：压缩格式日期时间（去掉年份）
const formatCompactDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

// 方法：计算实际耗时（小时）
const calculateActualHours = (task) => {
  if (!task.completed_at) return null
  
  const completedTime = new Date(task.completed_at).getTime()
  let startTime
  
  // 对于重复任务，使用计划完成时间作为起点
  if (['daily', 'weekday', 'weekly'].includes(task.type)) {
    const deadline = calculateDeadline(task)
    if (deadline) {
      // 使用当天开始时间（00:00）作为起点
      const deadlineDate = new Date(deadline)
      deadlineDate.setHours(0, 0, 0, 0)
      startTime = deadlineDate.getTime()
    } else {
      // 如果无法计算截止时间，使用完成当天的开始时间
      const completedDate = new Date(task.completed_at)
      completedDate.setHours(0, 0, 0, 0)
      startTime = completedDate.getTime()
    }
  } else {
    // 非重复任务使用创建时间
    startTime = new Date(task.created_at).getTime()
  }
  
  const hours = (completedTime - startTime) / (1000 * 60 * 60)
  
  // 如果耗时小于1小时，显示分钟
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes}分钟`
  }
  
  // 如果耗时小于24小时，显示小时
  if (hours < 24) {
    const roundedHours = Math.round(hours)
    return `${roundedHours}小时`
  }
  
  // 如果耗时超过24小时，显示天数
  const days = Math.round(hours / 24)
  return `${days}天`
}

// 方法：获取截止日期对象
const getDeadlineDate = (task) => {
  return calculateDeadline(task)
}

// 方法：获取计划完成日期对象
const getPlannedDeadlineDate = (task) => {
  return calculateDeadline(task)
}

// 方法：获取压缩状态文本
const getCompactStatus = (task) => {
  if (task.status !== 'completed') return ''
  const deadline = calculateDeadline(task)
  if (!deadline) return '✅'
  const completedTime = new Date(task.completed_at || task.created_at)
  const isOnTime = completedTime <= deadline
  return isOnTime ? '🏁' : '⚠️'
}

// 方法：获取计划完成时间（纯日期，不含状态）

// 方法：获取任务截止时间文本

// 方法：计算任务截止时间
const calculateDeadline = (task) => {
  const now = new Date()
  
  switch (task.type) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    
    case 'tomorrow':
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)
    
    case 'this_week':
      const endOfWeek = new Date(now)
      const dayOfWeek = now.getDay()
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
      endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday)
      return new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59)
    
    case 'custom_date':
      if (task.customDate) {
        const date = new Date(task.customDate)
        if (task.customTime) {
          const [hours, minutes] = task.customTime.split(':')
          date.setHours(parseInt(hours), parseInt(minutes), 0)
        } else {
          date.setHours(23, 59, 59)
        }
        return date
      }
      return null
    
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      
    case 'weekday':
      const isWeekend = now.getDay() === 0 || now.getDay() === 6
      if (isWeekend) {
        // 如果是周末看工作日任务，截止日期应该是上周五
        const lastFriday = new Date(now)
        const diff = now.getDay() === 0 ? 2 : 1
        lastFriday.setDate(now.getDate() - diff)
        return new Date(lastFriday.getFullYear(), lastFriday.getMonth(), lastFriday.getDate(), 23, 59, 59)
      }
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    case 'weekly':
      if (task.weekdays && task.weekdays.length > 0) {
        const currentDay = now.getDay()
        // 找到最近的一个设定的星期几（过去或今天）
        const pastDays = task.weekdays
          .map(d => (currentDay >= d ? currentDay - d : currentDay + 7 - d))
          .sort((a, b) => a - b)
        
        const lastOccurrence = new Date(now)
        lastOccurrence.setDate(now.getDate() - pastDays[0])
        return new Date(lastOccurrence.getFullYear(), lastOccurrence.getMonth(), lastOccurrence.getDate(), 23, 59, 59)
      }
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    
    default:
      return null
  }
}

// 方法：显示通知
const emit = defineEmits(['notify'])
const showNotification = (message, type = 'info') => {
  console.log('showNotification 被调用:', message, type)
  emit('notify', { message, type })
  console.log('emit notify 事件已触发')
}

// 语言切换方法
const toggleLanguage = () => {
  currentLanguage.value = currentLanguage.value === 'zh' ? 'en' : 'zh'
  // 保存语言偏好到本地存储
  Preferences.set({ key: 'language', value: currentLanguage.value })
}

// 优先级模式切换方法
const togglePriorityMode = () => {
  priorityMode.value = priorityMode.value === 'traditional' ? 'eisenhower' : 'traditional'
  // 保存优先级模式到本地存储
  Preferences.set({ key: 'priorityMode', value: priorityMode.value })
}

// 生成精力洞察文案
const generateEnergyInsight = () => {
  if (!reportData.value.categories || reportData.value.categories.length === 0) return ''
  
  const lang = currentLanguage.value
  const categories = reportData.value.categories
  const topCategory = categories.reduce((max, cat) => cat.pomodoros > max.pomodoros ? cat : max, categories[0])
  const lifeCategory = categories.find(c => c.name.includes('生活') || c.name.includes('Life'))
  
  if (topCategory.rate > 60) {
    return lang === 'zh'
      ? `${topCategory.icon} ${topCategory.name}绝对是本期的主旋律（占比 ${topCategory.rate}%）。但值得开心的是，你在极高强度下，依然为"${lifeCategory?.name || '生活'}"留出了 ${lifeCategory?.pomodoros || 0} 个番茄钟的时间。生活与工作的平衡，你做得比想象中好。`
      : `${topCategory.icon} ${topCategory.name} was absolutely the main theme this period (${topCategory.rate}%). But happily, you still reserved ${lifeCategory?.pomodoros || 0} pomodoros for "${lifeCategory?.name || 'Life'}". You balanced work and life better than expected.`
  } else {
    return lang === 'zh'
      ? `精力分配相当均衡！${topCategory.icon} ${topCategory.name}占比 ${topCategory.rate}%，${categories[1]?.icon} ${categories[1]?.name}占比 ${categories[1]?.rate}%，${categories[2]?.icon} ${categories[2]?.name}占比 ${categories[2]?.rate}%。这是一个全面发展的周期。`
      : `Energy allocation is well balanced! ${topCategory.icon} ${topCategory.name} ${topCategory.rate}%, ${categories[1]?.icon} ${categories[1]?.name} ${categories[1]?.rate}%, ${categories[2]?.icon} ${categories[2]?.name} ${categories[2]?.rate}%. A well-rounded period.`
  }
}

// 刷新方法
const handleRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  
  // 1. 重置所有筛选条件
  currentFilter.value = 'all'
  currentCategoryFilter.value = 'all'
  currentPriorityFilter.value = 'all'
  searchKeyword.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  jumpToPage.value = ''
  
  // 2. 清空输入框和临时数据
  newTaskText.value = ''
  newTaskDescription.value = ''
  quickTaskInput.value = ''
  tempDescription.value = ''
  tempMedia.value = []
  currentTaskId.value = null
  
  // 3. 重置任务表单属性到默认值
  newTaskType.value = 'today'
  newTaskCategory.value = 'work'
  newTaskPriority.value = 'medium'
  newTaskCollectionId.value = null
  customDateTime.value = ''
  selectedWeekdays.value = []
  monthDay.value = 1
  enableReminder.value = false
  forceReminder.value = true
  reminderDateTime.value = ''
  
  // 4. 关闭所有弹窗
  showTaskDetail.value = false
  showTrash.value = false
  showProfile.value = false
  showPomodoroStats.value = false
  showPomodoroTimer.value = false
  showSupport.value = false
  showAIConfig.value = false
  showAIChat.value = false
  showAIResult.value = false
  showAISuggestion.value = false
  showAIPreview.value = false
  showAIMenu.value = false
  showDailySummary.value = false
  showAIReport.value = false
  showTaskSplitter.value = false
  showTextResult.value = false
  showTaskPreview.value = false
  showSubtaskPreview.value = false
  showSubtaskSuggestion.value = false
  showVersionModal.value = false
  showFullscreenDesc.value = false
  showPrivacyPolicy.value = false
  showDataInfo.value = false
  showUserGuide.value = false
  showPomodoroRules.value = false
  showWelcome.value = false
  showBackupReminder.value = false
  showNotificationGuide.value = false
  showAllLogs.value = false
  showAddLogModal.value = false
  showPasswordModal.value = false
  showPhoneModal.value = false
  showWeeklyModal.value = false
  showCustomDateModal.value = false
  showFilterModal.value = false
  showChangelog.value = false
  showUnifiedReport.value = false
  showReportHistoryModal.value = false
  showBackupList.value = false
  showClipboardHistory.value = false
  showImportPreview.value = false
  
  // 🆕 v0.9.0+ 新增弹窗
  showCollectionList.value = false
  showCollectionManage.value = false
  showCollectionMenu.value = false
  showVerifyPasswordModal.value = false
  showTagBrowser.value = false
  showTaskGraph.value = false
  showGanttChart.value = false
  showMoreCollections.value = false
  
  // 5. 清空选中的任务和临时数据
  selectedTask.value = null
  currentLogTask.value = null
  taskToSplit.value = null
  editingTask.value = null
  detectedSubtasks.value = []
  aiSuggestion.value = null
  aiPreviewContent.value = ''
  aiSuggestionsList.value = []
  
  // 6. 重置编辑状态
  editDescription.value = ''
  editText.value = ''
  editCategory.value = 'work'
  editPriority.value = 'medium'
  editType.value = 'today'
  editCustomDateTime.value = ''
  editWeekdays.value = []
  editMonthDay.value = 1
  isMarkdownPreview.value = false
  
  // 7. 重置文件夹和标签选择
  selectedCollectionId.value = null
  selectedTag.value = null
  editingCollectionId.value = null
  editingCollectionName.value = ''
  pendingCollectionId.value = null
  
  // 8. 清空报告相关
  reportType.value = 'weekly'
  customStartDate.value = ''
  customEndDate.value = ''
  reportContent.value = ''
  reportData.value = {}
  reportSearchKeyword.value = ''
  historyReportData.value = null
  
  // 9. 清空导入预览
  importPreviewData.value = null
  
  // 10. 重新加载数据
  await taskStore.setCurrentUser(userStore.currentUser)
  await loadUserInfo()
  taskStore.checkOverdueTasks()

  // 11. 强制清空DOM输入框（防止浏览器缓存问题）
  await nextTick()
  const inputElement = document.querySelector('.quick-task-input')
  if (inputElement) {
    inputElement.value = ''
  }

  setTimeout(() => {
    isRefreshing.value = false
    showNotification('🔄 已刷新到初始状态', 'success')
  }, 800)
}

// 🆕 文件夹相关方法（已废弃，保留兼容性）

const selectCollection = (collectionId) => {
  // 如果正在编辑，先保存
  if (editingCollectionId.value) {
    saveCollectionName()
  }
  
  // 🆕 私密文件夹验证
  const collection = taskStore.collections.find(c => c.id === collectionId)
  if (collection?.isPrivate && !verifiedCollections.value.has(collectionId)) {
    pendingCollectionId.value = collectionId
    showVerifyPasswordModal.value = true
    return
  }
  
  selectedCollectionId.value = collectionId
  selectedTag.value = null  // 🆕 清除标签筛选（v0.9.0）
  
  console.log('📁 选择文件夹:', { 
    collectionId, 
    collectionName: collection?.name || (collectionId === 'uncategorized' ? '未分类' : '全部任务')
  })
  
  // 可选：选择后自动收起列表
  // showCollectionList.value = false
}

// 🆕 标签过滤处理（v0.9.0）
const handleTagFilter = (tagPath) => {
  selectedTag.value = tagPath
  selectedCollectionId.value = null  // 清除文件夹筛选
  console.log('🏷️ 选择标签:', tagPath)
}

// 🆕 图谱导航处理（v0.9.0）
const handleGraphNavigate = (taskId) => {
  console.log('📍 handleGraphNavigate 收到任务ID:', taskId)
  const task = taskStore.tasks.find(t => t.id === taskId)
  console.log('📍 找到的任务:', task)
  if (task) {
    showTaskGraph.value = false
    setTimeout(() => {
      openTaskDetail(task)
    }, 300)
  } else {
    console.warn('⚠️ 未找到任务:', taskId)
  }
}

// 🆕 开始编辑文件夹名称
const startEditCollectionName = (collection) => {
  renamingCollection.value = collection
  showRenameCollectionModal.value = true
}

// 🆕 处理重命名
const handleRenameCollection = async (newName) => {
  if (renamingCollection.value && newName.trim()) {
    await taskStore.updateCollection(renamingCollection.value.id, { 
      name: newName.trim() 
    })
    showNotification('✅ 文件夹已重命名', 'success')
  }
  showRenameCollectionModal.value = false
  renamingCollection.value = null
}

// 🆕 保存文件夹名称（废弃，保留兼容性）
const saveCollectionName = async () => {
  if (editingCollectionId.value && editingCollectionName.value.trim()) {
    await taskStore.updateCollection(editingCollectionId.value, { 
      name: editingCollectionName.value.trim() 
    })
    showNotification('✅ 文件夹已重命名', 'success')
  }
  editingCollectionId.value = null
  editingCollectionName.value = ''
}

// 🆕 取消编辑

// 🆕 获取选中文件夹的名称
const getSelectedCollectionName = () => {
  if (!selectedCollectionId.value) return '全部任务'
  if (selectedCollectionId.value === 'uncategorized') return '未分类'
  const collection = taskStore.collections.find(c => c.id === selectedCollectionId.value)
  return collection ? collection.name : '未知文件夹'
}

// 🆕 打开指定文件夹的批量添加弹窗

// 🆕 打开迁入弹窗
const openBatchMoveIn = (collectionId, fromManage = false) => {
  selectedCollectionId.value = collectionId
  fromCollectionManage.value = fromManage
  showBatchAddModal.value = true
}

// 🆕 打开迁出弹窗
const openBatchMoveOut = (collectionId, fromManage = false) => {
  selectedCollectionId.value = collectionId
  fromCollectionManage.value = fromManage
  showBatchMoveOutModal.value = true
}

// 🆕 批量添加任务完成
const handleBatchAdded = (count) => {
  showNotification(`✅ 已迁入 ${count} 个任务到"${getSelectedCollectionName()}"`, 'success')
  showBatchAddModal.value = false
  
  // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
  if (fromCollectionManage.value) {
    showCollectionManage.value = true
    fromCollectionManage.value = false
  }
}

// 🆕 批量迁出任务完成
const handleBatchMovedOut = (count) => {
  const sourceName = getSelectedCollectionName()
  showNotification(`✅ 已从"${sourceName}"迁出 ${count} 个任务到未分类`, 'success')
  showBatchMoveOutModal.value = false
  
  // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
  if (fromCollectionManage.value) {
    showCollectionManage.value = true
    fromCollectionManage.value = false
  }
}

// 🆕 密码验证成功
const handlePasswordVerified = (password) => {
  const isValid = taskStore.verifyCollectionPassword(pendingCollectionId.value, password)
  
  if (isValid) {
    verifiedCollections.value.add(pendingCollectionId.value)
    showVerifyPasswordModal.value = false
    selectCollection(pendingCollectionId.value)
  } else {
    showNotification('❌ 密码错误', 'error')
  }
}

// 🆕 打开修改密码弹窗
const openChangePassword = (collectionId) => {
  selectedCollectionId.value = collectionId
  showChangePasswordModal.value = true
}

// 🆕 修改密码成功
const handlePasswordChanged = () => {
  showNotification('✅ 密码修改成功', 'success')
}

const showCollectionMenu = (collection) => {
  collectionToDelete.value = collection
  showDeleteCollectionModal.value = true
}

// 🆕 打开删除文件夹弹窗
const openDeleteCollection = (collectionId) => {
  const collection = taskStore.collections.find(c => c.id === collectionId)
  if (collection) {
    collectionToDelete.value = collection
    showDeleteCollectionModal.value = true
  }
}

// 🆕 设为私密（复用创建笔记本的加密逻辑）
const openSetPrivate = (collection) => {
  // 打开修改密码弹窗，但是是"设置密码"模式
  pendingCollectionId.value = collection.id
  showChangePasswordModal.value = true
}

// 🆕 批量加密笔记本
const handleBatchEncrypt = async (collectionIds) => {
  const password = prompt('请输入统一密码（至少4位）：')
  if (!password || password.length < 4) {
    showNotification('❌ 密码至少4位', 'error')
    return
  }
  
  const confirmPwd = prompt('请再次输入密码确认：')
  if (password !== confirmPwd) {
    showNotification('❌ 两次输入的密码不一致', 'error')
    return
  }
  
  collectionIds.forEach(id => {
    const collection = taskStore.collections.find(c => c.id === id)
    if (collection) {
      collection.isPrivate = true
      collection.password = btoa(password)
    }
  })
  
  await taskStore.saveCollections()
  showNotification(`✅ 已为 ${collectionIds.length} 个笔记本设置密码`, 'success')
}

// 🆕 确认移动笔记本
const handleConfirmMoveCollection = async (collectionId, newParentId) => {
  try {
    await taskStore.moveCollection(collectionId, newParentId)
    showNotification('✅ 移动成功', 'success')
    showMoveCollectionModal.value = false
    collectionToMove.value = null
  } catch (error) {
    showNotification(`❌ ${error.message}`, 'error')
  }
}

// 🆕 批量删除笔记本
const handleBatchDelete = async (collectionIds) => {
  const confirmed = confirm(`确定要删除 ${collectionIds.length} 个笔记本吗？\n\n笔记本内的任务将移至"未分类"`)
  if (!confirmed) return
  
  // 🐛 修复：递归收集所有需要删除的笔记本（包括子笔记本）
  const allIdsToDelete = new Set(collectionIds)
  
  const collectChildren = (parentId) => {
    const children = taskStore.collections.filter(c => c.parentId === parentId)
    children.forEach(child => {
      allIdsToDelete.add(child.id)
      collectChildren(child.id) // 递归收集子笔记本
    })
  }
  
  collectionIds.forEach(id => collectChildren(id))
  
  // 将所有笔记本内的任务移至未分类
  let movedCount = 0
  allIdsToDelete.forEach(id => {
    taskStore.tasks.forEach(task => {
      if (task.collectionId === id) {
        task.collectionId = null
        movedCount++
      }
    })
  })
  
  // 删除所有笔记本（包括子笔记本）
  allIdsToDelete.forEach(id => {
    const index = taskStore.collections.findIndex(c => c.id === id)
    if (index > -1) {
      taskStore.collections.splice(index, 1)
    }
  })
  
  await taskStore.saveCollections()
  await taskStore.saveTasks()
  
  showNotification(`✅ 已删除 ${allIdsToDelete.size} 个笔记本，${movedCount} 个任务已移至未分类`, 'success')
}

const handleCollectionCreated = (collection) => {
  showNotification(`✅ 文件夹"${collection.name}"创建成功`, 'success')
  showCreateCollectionModal.value = false
  currentParentId.value = null
  
  // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
  if (fromCollectionManage.value) {
    showCollectionManage.value = true
    fromCollectionManage.value = false
  }
}

const handleCollectionDeleted = () => {
  showNotification('✅ 文件夹已删除', 'success')
  collectionToDelete.value = null
}

// 🆕 移动任务到文件夹
const openMoveToCollection = (task) => {
  taskToMove.value = task
  showMoveToCollectionModal.value = true
}

const handleTaskMoved = (collectionId) => {
  const collectionName = collectionId === null 
    ? '未分类' 
    : taskStore.collections.find(c => c.id === collectionId)?.name || '未知文件夹'
  showNotification(`✅ 任务已移动到"${collectionName}"`, 'success')
  taskToMove.value = null
}

// 方法：跳转到首页
const goToFirstPage = () => {
  currentPage.value = 1
}

// 方法：跳转到末页
const goToLastPage = () => {
  currentPage.value = totalPages.value
}

// 方法：改变每页条数
const changePageSize = (size) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
}

// 方法：跳转到指定页
const jumpToPageNumber = () => {
  const page = parseInt(jumpToPage.value)
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    jumpToPage.value = ''
  } else {
    showNotification(`请输入1-${totalPages.value}之间的页码`, 'error')
  }
}

// 方法：检查备份提醒
const checkBackupReminder = async () => {
  const { value: lastBackupTime } = await Preferences.get({ key: `lastBackup_${userStore.currentUser}` })
  const { value: reminderDisabled } = await Preferences.get({ key: `backupReminderDisabled_${userStore.currentUser}` })
  
  if (reminderDisabled === 'true') return
  
  const now = Date.now()
  const daysSinceBackup = lastBackupTime ? (now - parseInt(lastBackupTime)) / (1000 * 60 * 60 * 24) : 999
  const taskCount = taskStore.tasks.length
  
  // 触发条件：30天未备份 或 任务数超过50且7天未备份
  if (daysSinceBackup > 30 || (taskCount > 50 && daysSinceBackup > 7)) {
    showBackupReminder.value = true
  }
}

// 方法：记录备份时间
const recordBackupTime = async () => {
  await Preferences.set({ key: `lastBackup_${userStore.currentUser}`, value: Date.now().toString() })
}

// 方法：禁用备份提醒
const disableBackupReminder = async () => {
  await Preferences.set({ key: `backupReminderDisabled_${userStore.currentUser}`, value: 'true' })
  showBackupReminder.value = false
}

// 检查并发送逾期提醒
// 检查通知权限
// 清理过期的提醒记录（7天前的记录）
// 初始化通知渠道
const initializeNotificationChannels = async () => {
  try {
    if (!Capacitor.isPluginAvailable('LocalNotifications')) return
    
    // Web 平台不支持创建渠道，仅在原生平台执行
    const platform = Capacitor.getPlatform()
    if (platform === 'web') {
      console.log('⏭️ Web 平台不支持通知渠道，跳过初始化')
      return
    }
    
    // 创建通知渠道（Android 8.0+）
    await LocalNotifications.createChannel({
      id: 'task-reminders-v3',
      name: '任务提醒',
      description: '普通任务提醒通知',
      importance: 4,
      sound: 'default',
      vibration: true,
      lightColor: '#667eea'
    })
    
    await LocalNotifications.createChannel({
      id: 'task-urgent-alarm',
      name: '紧急提醒',
      description: '紧急任务全屏提醒',
      importance: 5,
      sound: 'default',
      vibration: true,
      lightColor: '#FF0000'
    })
    
    await LocalNotifications.createChannel({
      id: 'task-deadline-warning',
      name: '截止时间预警',
      description: '任务即将逾期的预警通知',
      importance: 4,
      sound: 'default',
      vibration: true,
      lightColor: '#FF6B6B'
    })
    
    await LocalNotifications.createChannel({
      id: 'task-daily-summary',
      name: '每日摘要',
      description: '每日任务摘要通知',
      importance: 3,
      sound: 'default',
      vibration: false,
      lightColor: '#667eea'
    })
    
    console.log('✅ 通知渠道已初始化')
  } catch (error) {
    console.error('初始化通知渠道失败:', error)
  }
}

const cleanupExpiredNotifications = async () => {
  try {
    const notifyKey = `notified_deadlines_${userStore.currentUser}`
    const { value: notifiedValue } = await Preferences.get({ key: notifyKey })
    if (!notifiedValue) return
    
    const notifiedIds = JSON.parse(notifiedValue)
    const now = Date.now()
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
    
    // 获取所有任务ID
    const taskIds = new Set(taskStore.tasks.map(t => t.id))
    
    // 删除已完成或已删除的任务的提醒记录
    let cleaned = false
    for (const key in notifiedIds) {
      const taskId = parseInt(key.split('_')[1])
      if (!taskIds.has(taskId)) {
        delete notifiedIds[key]
        cleaned = true
      }
    }
    
    if (cleaned) {
      await Preferences.set({
        key: notifyKey,
        value: JSON.stringify(notifiedIds)
      })
      console.log('✅ 已清理过期的提醒记录')
    }
  } catch (error) {
    console.error('清理提醒记录失败:', error)
  }
}

const checkNotificationPermission = async () => {
  try {
    if (!Capacitor.isPluginAvailable('LocalNotifications')) {
      console.warn('⚠️ 通知功能不可用')
      return false
    }

    // Web 平台不需要请求权限
    const platform = Capacitor.getPlatform()
    if (platform === 'web') {
      console.log('ℹ️ Web 平台通知权限检查跳过')
      return true
    }

    // 请求通知权限
    const result = await LocalNotifications.requestPermissions()
    
    if (result.display === 'granted') {
      console.log('✅ 通知权限已授予')
      return true
    } else {
      console.warn('⚠️ 通知权限被拒绝')
      showNotification('请在系统设置中启用通知权限', 'warning')
      return false
    }
  } catch (error) {
    console.error('检查通知权限失败:', error)
    return false
  }
}

// 生成安全的通知ID（避免冲突）
const generateNotificationId = (taskId, type) => {
  // 使用哈希算法生成唯一ID
  // type: 'urgent' | 'overdue' | 'reminder'
  const typeMap = { urgent: 1, overdue: 2, reminder: 3 }
  const typeCode = typeMap[type] || 0
  // 格式：taskId的后5位 + 类型代码（1位）
  return (Math.abs(taskId) % 100000) * 10 + typeCode
}

const checkAndNotifyDeadline = async () => {
  const now = new Date()
  const notifications = []
  
  // 幽默话术库
  const urgentMessages = [
    '🍅 番茄要逃跑啦！快来抓住它！',
    '⏰ 时间在偷偷溜走，番茄也要跟着跑了！',
    '🏃 番茄已经在打包行李了，快去完成任务！',
    '😱 再不做，番茄就要被别人抢走了！',
    '🚨 紧急！番茄正在倒计时，快救救它！'
  ]
  
  const overdueMessages = [
    '💔 番茄已经逃跑了...快去把它追回来！',
    '😭 番茄伤心地离开了，赶紧去道歉吧！',
    '🏃‍♂️ 番茄跑远了，但还来得及追！',
    '⚠️ 番茄已出走，速度追回还有机会！',
    '😢 番茄等累了已经走了，快去挽回！'
  ]
  
  // 从 Preferences 加载已提醒记录
  const notifyKey = `notified_deadlines_${userStore.currentUser}`
  const { value: notifiedValue } = await Preferences.get({ key: notifyKey })
  const notifiedIds = notifiedValue ? JSON.parse(notifiedValue) : {}
  
  taskStore.tasks.forEach(task => {
    if (task.status === 'completed') return
    
    const deadline = calculateDeadline(task)
    if (!deadline) return
    
    const timeLeft = deadline - now
    const hoursLeft = timeLeft / (1000 * 60 * 60)
    const tomatoCount = task.priority === 'high' ? 4 : task.priority === 'medium' ? 2 : 1
    
    // 1小时内即将逾期的任务
    if (hoursLeft > 0 && hoursLeft <= 1) {
      const notifyKeyId = `urgent_${task.id}`
      if (notifiedIds[notifyKeyId]) return // 已提醒过，跳过
      
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60)
      const randomMsg = urgentMessages[Math.floor(Math.random() * urgentMessages.length)]
      
      const deadlineDate = new Date(deadline)
      const month = deadlineDate.getMonth() + 1
      const day = deadlineDate.getDate()
      const hours = String(deadlineDate.getHours()).padStart(2, '0')
      const mins = String(deadlineDate.getMinutes()).padStart(2, '0')
      
      notifications.push({
        title: `${task.text} (还剩${minutes}分钟)`,
        body: `⏰ 截止：${month}/${day} ${hours}:${mins}\n${randomMsg}\n${tomatoCount}个番茄岌岌可危 ${'🍅'.repeat(tomatoCount)}`,
        id: generateNotificationId(task.id, 'urgent'),
        schedule: { at: new Date(Date.now() + 100) },
        channelId: 'task-deadline-warning'
      })
      notifiedIds[notifyKeyId] = true
    }
    // 已逾期但还未标记的任务
    else if (timeLeft < 0 && task.status !== 'overdue') {
      const notifyKeyId = `overdue_${task.id}`
      if (notifiedIds[notifyKeyId]) return // 已提醒过，跳过
      
      const randomMsg = overdueMessages[Math.floor(Math.random() * overdueMessages.length)]
      
      const deadlineDate = new Date(deadline)
      const month = deadlineDate.getMonth() + 1
      const day = deadlineDate.getDate()
      const hours = String(deadlineDate.getHours()).padStart(2, '0')
      const mins = String(deadlineDate.getMinutes()).padStart(2, '0')
      
      notifications.push({
        title: `${task.text} (已逾期)`,
        body: `⏰ 截止：${month}/${day} ${hours}:${mins}\n${randomMsg}\n损失 ${tomatoCount}个番茄 ${'💔'.repeat(tomatoCount)}`,
        id: generateNotificationId(task.id, 'overdue'),
        schedule: { at: new Date(Date.now() + 100) },
        channelId: 'task-urgent-alarm'
      })
      notifiedIds[notifyKeyId] = true
    }
  })
  
  // 保存更新后的提醒记录
  if (Object.keys(notifiedIds).length > 0) {
    await Preferences.set({ 
      key: notifyKey, 
      value: JSON.stringify(notifiedIds) 
    })
  }
  
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

// 调度任务提醒通知
const scheduleTaskReminder = async (task) => {
  try {
    if (!task.enableReminder || !task.reminderTime) return
    
    const reminderTime = new Date(task.reminderTime)
    const now = new Date()
    const timeDiff = reminderTime - now
    
    // 如果提醒时间已过
    if (timeDiff <= 0) {
      showNotification('⚠️ 提醒时间已过，请选择未来的时间', 'warning')
      console.log('❌ 提醒时间已过:', reminderTime, '当前时间:', now)
      return
    }
    
    // 显示还需等待多久
    const waitMinutes = Math.ceil(timeDiff / 60000)
    console.log(`⏰ 提醒将在 ${waitMinutes} 分钟后触发`)
    
    // 计算任务截止时间
    const deadline = calculateDeadline(task)
    let titleSuffix = ''
    let bodyPrefix = ''
    if (deadline) {
      const deadlineDate = new Date(deadline)
      const month = deadlineDate.getMonth() + 1
      const day = deadlineDate.getDate()
      const hours = String(deadlineDate.getHours()).padStart(2, '0')
      const minutes = String(deadlineDate.getMinutes()).padStart(2, '0')
      titleSuffix = ` (${month}/${day} ${hours}:${minutes})`
      bodyPrefix = `⏰ 截止：${month}月${day}日 ${hours}:${minutes}\n`
    }
    
    // Android通知ID必须是小整数（使用生成函数）
    const notificationId = generateNotificationId(task.id, 'reminder')
    
    await LocalNotifications.schedule({
      notifications: [{
        title: `${task.text}${titleSuffix}`,
        body: `${bodyPrefix}${task.description || '记得完成这个任务哦！'}`,
        id: notificationId,
        schedule: { at: reminderTime },
        channelId: 'task-reminders-v3',  // 使用自定义渠道
        sound: task.reminderMode === 'vibrate' ? null : 'default',  // 仅震动时不播放声音
        autoCancel: true,  // 点击后自动消失
        vibrate: [0, 1000, 500, 1000, 500, 1000, 500, 1000],  // 持续震动：震1秒，停0.5秒，重复4次
        extra: {
          priority: 'max',  // 最高优先级
          visibility: 'public'  // 公开可见
        }
      }]
    })
    
    const timeStr = formatDisplayDateTime(task.reminderTime)
    showNotification(`✅ 提醒已设置：${timeStr}（${waitMinutes}分钟后）`, 'success')
    console.log('✅ 提醒已设置:', task.text, '时间:', reminderTime, `(${waitMinutes}分钟后)`)
    
    // 查看所有待触发的通知
    const pending = await LocalNotifications.getPending()
    console.log('📋 当前待触发的通知列表:', pending)
  } catch (error) {
    console.error('❌ 设置提醒失败:', error)
    showNotification('设置提醒失败: ' + error.message, 'error')
  }
}

// 取消任务提醒
const cancelTaskReminder = async (taskId) => {
  try {
    const notificationId = generateNotificationId(taskId, 'reminder')
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] })
  } catch (error) {
    console.error('取消提醒失败:', error)
  }
}

// 测试通知功能（5秒后触发）

// 设置每日任务摘要通知
const scheduleDailySummaryNotification = async () => {
  try {
    // 取消之前的每日摘要通知
    await LocalNotifications.cancel({ notifications: [{ id: 999999 }] })
    
    // 如果禁用了每日摘要，直接返回
    if (!notificationSettings.value.dailySummaryEnabled) {
      console.log('⏭️ 每日摘要通知已禁用')
      return
    }
    
    // 计算今日任务统计
    const now = new Date()
    const pendingTasks = taskStore.tasks.filter(t => t.status === 'pending')
    const overdueTasks = taskStore.tasks.filter(t => t.status === 'overdue')
    
    // 计算即将逾期的任务（24小时内）
    const urgentTasks = pendingTasks.filter(task => {
      const deadline = calculateDeadline(task)
      if (!deadline) return false
      const hoursLeft = (deadline - now) / (1000 * 60 * 60)
      return hoursLeft > 0 && hoursLeft <= 24
    })
    
    // 构建通知内容
    let body = `📋 待办: ${pendingTasks.length}个`
    if (urgentTasks.length > 0) {
      body += ` | ⏰ 即将逾期: ${urgentTasks.length}个`
    }
    if (overdueTasks.length > 0) {
      body += ` | ❌ 已逾期: ${overdueTasks.length}个`
    }
    
    // 添加激励语
    if (pendingTasks.length === 0 && overdueTasks.length === 0) {
      body = '🎉 太棒了！今天没有待办任务，享受轻松的一天吧！'
    } else if (urgentTasks.length > 0) {
      body += '\n⚡ 有任务即将逾期，记得及时完成哦！'
    } else if (overdueTasks.length > 0) {
      body += '\n💪 加油！把逾期的任务完成吧！'
    } else {
      body += '\n✨ 新的一天，加油完成任务！'
    }
    
    // 设置明天指定时间的通知
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const [hours, minutes] = notificationSettings.value.dailySummaryTime.split(':')
    tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    await LocalNotifications.schedule({
      notifications: [{
        title: '📅 今日任务摘要',
        body: body,
        id: 999999,
        schedule: { 
          at: tomorrow,
          allowWhileIdle: true
        },
        channelId: 'task-daily-summary',
        sound: 'default',
        autoCancel: true,
        vibrate: [0, 1000, 500, 1000, 500, 1000, 500, 1000]
      }]
    })
    
    console.log('✅ 每日摘要通知已设置:', tomorrow)
  } catch (error) {
    console.error('设置每日摘要通知失败:', error)
  }
}

// 打开系统通知设置
const openNotificationSettings = () => {
  try {
    // Android: 打开应用通知设置页面
    if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {
      // 使用 Android Intent 打开应用设置
      const packageName = 'com.todo.app'
      const intent = `android.settings.APP_NOTIFICATION_SETTINGS`
      window.open(`intent://settings/notification?package=${packageName}#Intent;scheme=android-app;end`, '_system')
    } else {
      // 其他平台提示
      showNotification('请手动前往系统设置 → 应用 → TODO App → 通知', 'info')
    }
    showNotificationGuide.value = false
  } catch (error) {
    console.error('打开通知设置失败:', error)
    showNotification('请手动前往系统设置 → 应用 → TODO App → 通知', 'info')
  }
}

// 监听报告弹窗打开，自动生成周报
watch(showReportModal, (newVal) => {
  if (newVal) {
    // 设置默认为周报
    reportType.value = 'weekly'
    // 自动生成报告
    generateReportContent()
  }
})

// 监听"启用提醒"开关，自动设置默认时间为10分钟后
watch(enableReminder, (newVal) => {
  if (newVal && !reminderDateTime.value) {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 10) // 默认10分钟后
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    reminderDateTime.value = `${year}-${month}-${day}T${hours}:${minutes}`
  }
})

// 自动生成日报和周报
const autoGenerateReports = async () => {
  try {
    const { AIReportGenerator } = await import('../services/aiReportGenerator')
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    // ========== 检查今天是否已经提醒过 ==========
    const lastNotifyDate = localStorage.getItem('last_report_notify_date')
    if (lastNotifyDate === todayStr) {
      console.log('今天已经提醒过报告，跳过')
      return
    }
    
    // ========== 昨天的日期 ==========
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    // ========== 上周的日期范围（上周一到上周日）==========
    const lastWeekEnd = new Date(now)
    lastWeekEnd.setDate(now.getDate() - now.getDay())
    if (now.getDay() !== 0) {
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)
    }
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
    
    const lastWeekStart = new Date(lastWeekEnd)
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0]
    
    // ========== 上个月的日期范围 ==========
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0) // 上月最后一天
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1) // 上月第一天
    const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0]
    
    // ========== 上个季度的日期范围 ==========
    const currentQuarter = Math.floor(now.getMonth() / 3) // 0,1,2,3
    const lastQuarterEndMonth = currentQuarter * 3 - 1 // 上季度最后一个月
    const lastQuarterStartMonth = lastQuarterEndMonth - 2 // 上季度第一个月
    
    const lastQuarterStart = new Date(now.getFullYear(), lastQuarterStartMonth, 1)
    const lastQuarterEnd = new Date(now.getFullYear(), lastQuarterEndMonth + 1, 0)
    
    // 如果上季度在去年
    if (lastQuarterStartMonth < 0) {
      lastQuarterStart.setFullYear(now.getFullYear() - 1)
      lastQuarterStart.setMonth(lastQuarterStartMonth + 12)
      lastQuarterEnd.setFullYear(now.getFullYear() - 1)
      lastQuarterEnd.setMonth(lastQuarterEndMonth + 13, 0)
    }
    const lastQuarterStartStr = lastQuarterStart.toISOString().split('T')[0]
    
    // ========== 上半年的日期范围 ==========
    const currentHalf = now.getMonth() < 6 ? 0 : 1 // 0=上半年, 1=下半年
    const lastHalfStart = currentHalf === 0 
      ? new Date(now.getFullYear() - 1, 6, 1)   // 去年7月1日（下半年）
      : new Date(now.getFullYear(), 0, 1)       // 今年1月1日（上半年）
    const lastHalfEnd = currentHalf === 0
      ? new Date(now.getFullYear() - 1, 11, 31) // 去年12月31日（下半年）
      : new Date(now.getFullYear(), 5, 30)      // 今年6月30日（上半年）
    const lastHalfStartStr = lastHalfStart.toISOString().split('T')[0]
    
    // ========== 去年的日期范围 ==========
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)
    const lastYearStartStr = lastYearStart.toISOString().split('T')[0]
    
    // 获取历史报告
    let history = JSON.parse(localStorage.getItem('weekly_reports') || '[]')
    
    // 🔧 立即清理，确保有足够空间
    if (history.length > 30) {
      console.log(`🧹 清理报告历史：${history.length} → 30`)
      history = history.slice(0, 30)
      try {
        localStorage.setItem('weekly_reports', JSON.stringify(history))
      } catch (e) {
        console.warn('清理时保存失败，继续执行')
      }
    }
    
    // 检查是否已生成各类报告
    const hasYesterdayDaily = history.some(r => 
      r.reportType === 'daily' && r.period.includes(yesterdayStr)
    )
    const hasLastWeekly = history.some(r => 
      r.reportType === 'weekly' && r.period.includes(lastWeekStartStr)
    )
    const hasLastMonthly = history.some(r => 
      r.reportType === 'monthly' && r.period.includes(lastMonthStartStr)
    )
    const hasLastQuarterly = history.some(r => 
      r.reportType === 'quarterly' && r.period.includes(lastQuarterStartStr)
    )
    const hasLastHalfyearly = history.some(r => 
      r.reportType === 'halfyearly' && r.period.includes(lastHalfStartStr)
    )
    const hasLastYearly = history.some(r => 
      r.reportType === 'yearly' && r.period.includes(lastYearStartStr)
    )
    
    const generator = new AIReportGenerator(taskStore.tasks)
    
    // ========== 每天生成昨天的日报 ==========
    if (!hasYesterdayDaily) {
      const dayStart = new Date(yesterday)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(yesterday)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dailyReport = generator.generateReport(dayStart, dayEnd, 'daily', 'work')
      
      history.unshift({
        id: Date.now(),
        reportType: 'daily',
        title: `日报 - ${dailyReport.period.start} 至 ${dailyReport.period.end}`,
        period: `${dailyReport.period.start} 至 ${dailyReport.period.end}`,
        content: formatReportAsText(dailyReport, 'daily'),
        reportData: dailyReport,
        taskCount: dailyReport.completionStats.total,
        completedCount: dailyReport.completionStats.completed,
        createdAt: now.toISOString()
      })
      console.log('✅ 自动生成昨天的日报')
      
      // 通知用户
      showNotification(`📝 已为您生成昨天的日报（${dailyReport.period.start}）`, 'success')
    }
    
    // ========== 每周一生成上周的周报 ==========
    if (!hasLastWeekly && now.getDay() === 1) {
      const weekStart = new Date(lastWeekStart)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(lastWeekEnd)
      weekEnd.setHours(23, 59, 59, 999)
      
      const weeklyReport = generator.generateReport(weekStart, weekEnd, 'weekly', 'work')
      
      history.unshift({
        id: Date.now() + 1,
        reportType: 'weekly',
        title: `周报 - ${weeklyReport.period.start} 至 ${weeklyReport.period.end}`,
        period: `${weeklyReport.period.start} 至 ${weeklyReport.period.end}`,
        content: formatReportAsText(weeklyReport, 'weekly'),
        reportData: weeklyReport,
        taskCount: weeklyReport.completionStats.total,
        completedCount: weeklyReport.completionStats.completed,
        createdAt: now.toISOString()
      })
      console.log('✅ 自动生成上周的周报')
      
      // 通知用户
      showNotification(`📅 已为您生成上周的周报（${weeklyReport.period.start} 至 ${weeklyReport.period.end}）`, 'success')
    }
    
    // ========== 每月1号生成上个月的月报 ==========
    if (!hasLastMonthly && now.getDate() === 1) {
      const monthStart = new Date(lastMonthStart)
      monthStart.setHours(0, 0, 0, 0)
      const monthEnd = new Date(lastMonthEnd)
      monthEnd.setHours(23, 59, 59, 999)
      
      const monthlyReport = generator.generateReport(monthStart, monthEnd, 'monthly', 'work')
      
      history.unshift({
        id: Date.now() + 2,
        reportType: 'monthly',
        title: `月报 - ${monthlyReport.period.start} 至 ${monthlyReport.period.end}`,
        period: `${monthlyReport.period.start} 至 ${monthlyReport.period.end}`,
        content: formatReportAsText(monthlyReport, 'monthly'),
        reportData: monthlyReport,
        taskCount: monthlyReport.completionStats.total,
        completedCount: monthlyReport.completionStats.completed,
        createdAt: now.toISOString()
      })
      console.log('✅ 自动生成上个月的月报')
      
      // 通知用户
      showNotification(`📊 已为您生成上月的月报（${monthlyReport.period.start} 至 ${monthlyReport.period.end}）`, 'success')
    }
    
    // ========== 每季度第一天生成上季度的季报 ==========
    if (!hasLastQuarterly && now.getDate() === 1 && now.getMonth() % 3 === 0) {
      const quarterStart = new Date(lastQuarterStart)
      quarterStart.setHours(0, 0, 0, 0)
      const quarterEnd = new Date(lastQuarterEnd)
      quarterEnd.setHours(23, 59, 59, 999)
      
      const quarterlyReport = generator.generateReport(quarterStart, quarterEnd, 'quarterly', 'work')
      
      history.unshift({
        id: Date.now() + 3,
        reportType: 'quarterly',
        title: `季报 - ${quarterlyReport.period.start} 至 ${quarterlyReport.period.end}`,
        period: `${quarterlyReport.period.start} 至 ${quarterlyReport.period.end}`,
        content: formatReportAsText(quarterlyReport, 'quarterly'),
        reportData: quarterlyReport,
        taskCount: quarterlyReport.completionStats.total,
        completedCount: quarterlyReport.completionStats.completed,
        createdAt: now.toISOString()
      })
      console.log('✅ 自动生成上季度的季报')
      
      // 通知用户
      showNotification(`📈 已为您生成上季度的季报（${quarterlyReport.period.start} 至 ${quarterlyReport.period.end}）`, 'success')
    }
    
    // ========== 每半年第一天生成上半年的半年报 ==========
    if (!hasLastHalfyearly && now.getDate() === 1 && (now.getMonth() === 0 || now.getMonth() === 6)) {
      const halfStart = new Date(lastHalfStart)
      halfStart.setHours(0, 0, 0, 0)
      const halfEnd = new Date(lastHalfEnd)
      halfEnd.setHours(23, 59, 59, 999)
      
      const halfyearlyReport = generator.generateReport(halfStart, halfEnd, 'halfyearly', 'work')
      
      history.unshift({
        id: Date.now() + 4,
        reportType: 'halfyearly',
        title: `半年报 - ${halfyearlyReport.period.start} 至 ${halfyearlyReport.period.end}`,
        period: `${halfyearlyReport.period.start} 至 ${halfyearlyReport.period.end}`,
        content: formatReportAsText(halfyearlyReport, 'halfyearly'),
        reportData: halfyearlyReport,
        taskCount: halfyearlyReport.completionStats.total,
        completedCount: halfyearlyReport.completionStats.completed,
        createdAt: now.toISOString()
      })
      console.log('✅ 自动生成上半年的半年报')
      
      // 通知用户
      showNotification(`📆 已为您生成上半年的半年报（${halfyearlyReport.period.start} 至 ${halfyearlyReport.period.end}）`, 'success')
    }
    
    // ========== 每年1月1日生成去年的年报 ==========
    if (!hasLastYearly && now.getMonth() === 0 && now.getDate() === 1) {
      const yearStart = new Date(lastYearStart)
      yearStart.setHours(0, 0, 0, 0)
      const yearEnd = new Date(lastYearEnd)
      yearEnd.setHours(23, 59, 59, 999)
      
      const yearlyReport = generator.generateReport(yearStart, yearEnd, 'yearly', 'work')
      
      history.unshift({
        id: Date.now() + 5,
        reportType: 'yearly',
        title: `年报 - ${yearlyReport.period.start} 至 ${yearlyReport.period.end}`,
        period: `${yearlyReport.period.start} 至 ${yearlyReport.period.end}`,
        content: formatReportAsText(yearlyReport, 'yearly'),
        reportData: yearlyReport,
        taskCount: yearlyReport.completionStats.total,
        completedCount: yearlyReport.completionStats.completed,
        createdAt: now.toISOString()
      })
      console.log('✅ 自动生成去年的年报')
      
      // 通知用户
      showNotification(`🎯 已为您生成去年的年报（${yearlyReport.period.start} 至 ${yearlyReport.period.end}）`, 'success')
    }
    
    // 🔧 三重防护：保存前先清理，确保有足够空间
    // 第一层：限制到 30 个（降低从 50）
    if (history.length > 30) {
      history.splice(30)
      console.log('🧹 自动裁剪报告历史到 30 个')
    }
    
    // 保存更新后的历史
    try {
      localStorage.setItem('weekly_reports', JSON.stringify(history))
      console.log('✅ 报告生成完成，已保存')
    } catch (quotaError) {
      // 第二层：如果还是超限，强制清理到 15 个
      console.warn('⚠️ 配额不足，强制清理到 15 个报告')
      history.splice(15)
      try {
        localStorage.setItem('weekly_reports', JSON.stringify(history))
      } catch (finalError) {
        // 第三层：最后手段，清空所有报告
        console.error('❌ 配额严重不足，清空所有报告')
        localStorage.removeItem('weekly_reports')
      }
    }
    
    // 记录今天已经提醒过
    localStorage.setItem('last_report_notify_date', todayStr)
    console.log('✅ 报告生成完成，已记录提醒日期:', todayStr)
  } catch (error) {
    console.error('❌ 自动生成报告失败:', error)
  }
}

// 格式化报告为纯文本（复用handleReportGenerated中的逻辑）
const formatReportAsText = (report, type) => {
  const typeMap = {
    daily: '日报',
    weekly: '周报',
    monthly: '月报',
    quarterly: '季报',
    halfyearly: '半年报',
    yearly: '年报',
    custom: '区间报告'
  }
  
  let text = `📝 ${typeMap[type] || '报告'} - ${report.period.start} 至 ${report.period.end}\n\n`
  
  if (report.summary) {
    text += `📝 智能总结\n${report.summary}\n\n`
  }
  
  if (report.overview) {
    text += `📊 数据概览\n`
    text += `完成任务：${report.overview.totalTasks}个\n`
    text += `高优先级：${report.overview.highPriority}个\n`
    text += `番茄钟：${report.overview.pomodoros}个\n`
    text += `💼 工作：${report.overview.workTasks}个\n`
    text += `📚 学习：${report.overview.studyTasks}个\n`
    text += `🏠 生活：${report.overview.lifeTasks}个\n\n`
  }
  
  if (report.completedTasks && report.completedTasks.length > 0) {
    text += `✅ 完成任务明细\n`
    report.completedTasks.forEach((task, index) => {
      text += `${index + 1}. ${task.text}`
      if (task.priority === 'high') text += ' ⭐'
      if (task.category) text += ` [${task.category}]`
      text += '\n'
    })
    text += '\n'
  }
  
  if (report.keyWorks && report.keyWorks.length > 0) {
    text += `🎯 关键工作\n`
    report.keyWorks.forEach((work, index) => {
      text += `${index + 1}. ${work.text}\n`
    })
    text += '\n'
  }
  
  if (report.issues && report.issues.total > 0) {
    text += `⚠️ 风险与问题\n`
    text += `逾期任务：${report.issues.total} 个\n`
    if (report.issues.suggestions) {
      report.issues.suggestions.forEach(s => {
        text += `💡 ${s}\n`
      })
    }
    text += '\n'
  }
  
  if (report.nextPlan) {
    text += `📅 下期计划\n`
    text += `待办任务：${report.nextPlan.total} 个\n`
    text += `高优先级：${report.nextPlan.highPriority} 个\n`
    if (report.nextPlan.recommendations) {
      report.nextPlan.recommendations.forEach(r => {
        text += `💡 ${r}\n`
      })
    }
  }
  
  return text
}

// 🔧 清理 LocalStorage 旧数据，防止配额超限
const cleanupOldReports = () => {
  try {
    // 清理 weekly_reports（只保留最近 20 个）
    const weeklyReports = JSON.parse(localStorage.getItem('weekly_reports') || '[]')
    if (weeklyReports.length > 20) {
      localStorage.setItem('weekly_reports', JSON.stringify(weeklyReports.slice(0, 20)))
      console.log(`🧹 清理旧周报：${weeklyReports.length} → 20`)
    }
    
    // 清理 unified_reports（只保留最近 20 个）
    const unifiedReports = JSON.parse(localStorage.getItem('unified_reports') || '[]')
    if (unifiedReports.length > 20) {
      localStorage.setItem('unified_reports', JSON.stringify(unifiedReports.slice(0, 20)))
      console.log(`🧹 清理旧统一报告：${unifiedReports.length} → 20`)
    }
  } catch (error) {
    console.error('清理旧数据失败:', error)
    // 如果清理失败，尝试清空
    try {
      localStorage.setItem('weekly_reports', '[]')
      localStorage.setItem('unified_reports', '[]')
      console.log('🧹 强制清空所有报告')
    } catch (e) {
      console.error('强制清空失败:', e)
    }
  }
}

onMounted(async () => {
  // 🔧 首先清理旧数据
  cleanupOldReports()
  
  await userStore.checkLogin()
  await loadUserInfo()
  
  // 加载语言偏好
  const { value: savedLanguage } = await Preferences.get({ key: 'language' })
  if (savedLanguage) {
    currentLanguage.value = savedLanguage
  }
  
  // 加载优先级模式偏好
  const { value: savedPriorityMode } = await Preferences.get({ key: 'priorityMode' })
  if (savedPriorityMode) {
    priorityMode.value = savedPriorityMode
  }
  
  // 🆕 监听文件预览事件
  window.addEventListener('preview-file', (e) => {
    console.log('📎 收到预览事件:', e.detail)
    previewFile.value = e.detail
    showFilePreview.value = true
  })
  
  // 检查版本更新（首次打开或版本升级时自动弹出）
  checkVersionUpdate()
  
  // 检查并显示 AI 建议（延迟 2 秒）
  setTimeout(() => {
    checkAISuggestion()
  }, 2000)
  
  // 设置任务Store的当前用户并加载该用户的任务
  await taskStore.setCurrentUser(userStore.currentUser)
  
  // 初始化智能提醒服务
  const { SmartReminderService } = await import('../services/smartReminderService')
  await SmartReminderService.init()
  
  // 每日检查（卡壳任务、连续完成天数）
  await SmartReminderService.dailyCheck(taskStore.tasks)
  
  // 自动生成日报和周报
  await autoGenerateReports()
  
  // 检查精确闹钟权限（首次使用）
  const { value: hasCheckedAlarm } = await Preferences.get({ key: 'hasCheckedAlarmPermission' })
  if (!hasCheckedAlarm) {
    setTimeout(() => {
      const needPermission = confirm(
        '⚠️ 重要提示\n\n' +
        '为了确保强制提醒功能正常工作，需要授权：\n\n' +
        '📱 精确闹钟权限\n' +
        '🔔 全屏显示权限\n\n' +
        '点击"确定"前往设置页面授权'
      )
      
      if (needPermission) {
        // 打开系统设置
        window.open('intent://settings#Intent;scheme=android-app;package=com.android.settings;end', '_system')
        showNotification('请在设置中找到"TODO App"，开启"闹钟和提醒"权限', 'info')
      }
      
      Preferences.set({ key: 'hasCheckedAlarmPermission', value: 'true' })
    }, 2000)
  }
  
  // 检查是否需要显示首次登录备份提醒（按用户隔离）
  const { value: showReminder } = await Preferences.get({ key: `showBackupReminder_${userStore.currentUser}` })
  if (showReminder === 'true') {
    await Preferences.remove({ key: `showBackupReminder_${userStore.currentUser}` })
    setTimeout(() => {
      showBackupReminder.value = true
    }, 500)
  }
  
  // 检查是否首次登录
  const { value: hasSeenWelcome } = await Preferences.get({ key: `welcome_${userStore.currentUser}` })
  if (!hasSeenWelcome) {
    showWelcome.value = true
    await Preferences.set({ key: `welcome_${userStore.currentUser}`, value: 'true' })
  }
  
  // 检查是否需要自动启动演示模式（新用户首次登录）
  const { value: tutorialCompleted } = await Preferences.get({ key: `tutorial_${userStore.currentUser}` })
  if (!tutorialCompleted) {
    // 延迟1秒启动，让用户先看到主界面
    setTimeout(() => {
      showTutorial.value = true
    }, 1000)
  }
  
  // 检查是否需要备份提醒
  await checkBackupReminder()
  
  // 只在原生平台（Android/iOS）上初始化通知
  if (Capacitor.isNativePlatform()) {
    // 请求通知权限
    await LocalNotifications.requestPermissions()
    
    // 删除旧的通知渠道（如果存在）
    try {
      await LocalNotifications.deleteChannel({ id: 'task-reminders' })
      await LocalNotifications.deleteChannel({ id: 'task-reminders-v2' })
    } catch (error) {
      // 忽略错误（渠道可能不存在）
    }
    
    // 创建通知渠道（Android 8.0+）- 使用闹钟类型
    try {
      await LocalNotifications.createChannel({
        id: 'task-reminders-v3', // 普通提醒
        name: '任务提醒',
        description: '任务到期提醒通知',
        importance: 5,
        visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#FF0000'
    })
    
    // 创建紧急闹钟渠道
    await LocalNotifications.createChannel({
      id: 'task-urgent-alarm',
      name: '紧急任务闹钟',
      description: '重要任务的闹钟提醒，会全屏显示并持续响铃',
      importance: 5, // IMPORTANCE_HIGH
      sound: 'default',
      vibration: true,
      visibility: 1, // VISIBILITY_PUBLIC
      lights: true,
      lightColor: '#FF0000'
    })
    
    console.log('✅ 通知渠道已创建（普通+紧急）')
  } catch (error) {
    console.error('❌ 创建通知渠道失败:', error)
  }
  
    // 监听通知触发事件
    LocalNotifications.addListener('localNotificationReceived', async (notificationEvent) => {
      console.log('🔔 通知触发:', notificationEvent)
      
      // 通知数据可能在 notification 或直接在根级别
      const notification = notificationEvent.notification || notificationEvent
      const extra = notification.extra
      
      console.log('📦 Extra数据:', extra)
      console.log('🔍 forceReminder:', extra?.forceReminder)
      
      // 如果是强制提醒，显示全屏通知
      if (extra?.forceReminder) {
        try {
          console.log('🚀 准备显示全屏通知...')
        console.log('插件可用性:', Capacitor.isPluginAvailable('FullScreenNotification'))
        console.log('Capacitor.Plugins:', Object.keys(Capacitor.Plugins))
        
        const FullScreenNotification = Capacitor.Plugins.FullScreenNotification
        if (FullScreenNotification) {
          // 获取任务详情
          const task = taskStore.tasks.find(t => t.id === notification.id)
          
          if (task) {
            // 映射显示文本
            const categoryMap = { work: '💼 工作', study: '📚 学习', life: '🏠 生活' }
            const priorityMap = { high: '⚡ 高优先级', medium: '📌 中优先级', low: '📍 低优先级' }
            const typeMap = { 
              today: '📅 今天', 
              tomorrow: '📅 明天', 
              this_week: '📅 本周内',
              custom_date: '📅 指定日期',
              daily: '🔄 每天重复',
              weekday: '🔄 工作日重复',
              weekly: '🔄 每周重复'
            }
            
            // 格式化截止时间
            let deadlineText = '⏰ 截止：'
            if (task.customDate && task.customTime) {
              const date = new Date(task.customDate + 'T' + task.customTime)
              deadlineText += `${date.getMonth() + 1}月${date.getDate()}日 ${task.customTime}`
            } else if (task.type === 'today') {
              deadlineText += '今天 23:59'
            } else if (task.type === 'tomorrow') {
              deadlineText += '明天 23:59'
            } else {
              deadlineText += '未设置'
            }
            
            // 格式化创建时间
            const createdDate = new Date(task.created_at)
            const createdText = `🕐 创建于：${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')} ${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`
            
            await FullScreenNotification.showFullScreenNotification({
              id: notification.id,
              title: '🚨 紧急任务提醒',
              body: task.text,
              category: categoryMap[task.category] || '💼 工作',
              priority: priorityMap[task.priority] || '📌 中优先级',
              type: typeMap[task.type] || '📅 今天',
              deadline: deadlineText,
              created: createdText,
              description: task.description || ''
            })
          } else {
            // 任务未找到，使用基本信息
            await FullScreenNotification.showFullScreenNotification({
              id: notification.id,
              title: '🚨 紧急任务提醒',
              body: extra.taskText || notification.body,
              category: '💼 工作',
              priority: '📌 中优先级',
              type: '📅 今天',
              deadline: '⏰ 截止：今天 23:59',
              created: '🕐 创建于：刚刚',
              description: ''
            })
          }
          console.log('✅ 全屏通知已显示')
        } else {
          console.error('❌ FullScreenNotification插件未找到')
        }
      } catch (error) {
        console.error('❌ 全屏通知失败:', error)
      }
    }
  })
  
  // 监听通知操作
  LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
    const { actionId, notification: notif } = notification
    const taskId = notif.extra?.taskId
    
    if (actionId === 'complete') {
      // 完成任务
      await taskStore.toggleTaskCompletion(taskId)
      await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
      showNotification('任务已完成！', 'success')
    } else if (actionId === 'snooze') {
      // 10分钟后再提醒
      const snoozeTime = new Date(Date.now() + 10 * 60 * 1000)
      const task = taskStore.tasks.find(t => t.id === taskId)
      if (task) {
        task.reminderTime = snoozeTime.toISOString()
        await taskStore.updateTask(task)
        showNotification('已设置10分钟后提醒', 'info')
      }
    } else if (actionId === 'dismiss') {
      // 关闭通知
      await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
    }
  })
  
  // 监听全屏提醒的操作（来自原生Activity）
  const FullScreenNotification = Capacitor.Plugins.FullScreenNotification
  if (FullScreenNotification) {
    FullScreenNotification.addListener('alarmAction', async (data) => {
      console.log('🔔 全屏提醒操作:', data)
      const { action, taskId } = data
      
      if (action === 'complete') {
        // 完成任务
        await taskStore.toggleTaskCompletion(taskId)
        await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
        showNotification('✅ 任务已完成！', 'success')
      } else if (action === 'snooze') {
        // 10分钟后再提醒
        const snoozeTime = new Date(Date.now() + 10 * 60 * 1000)
        const task = taskStore.tasks.find(t => t.id === taskId)
        if (task) {
          task.reminderTime = snoozeTime.toISOString()
          await taskStore.scheduleTaskReminder(task)
          showNotification('⏰ 已设置10分钟后提醒', 'info')
        }
      } else if (action === 'dismiss') {
        // 关闭通知
        await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
        showNotification('已关闭提醒', 'info')
      }
    })
  }
  
  // 全局处理函数（供原生层直接调用）
  window.handleAlarmAction = async (action, taskId, minutes = 10) => {
    console.log('🔔 全局处理提醒操作:', action, taskId, minutes)
    
    if (action === 'complete') {
      await taskStore.toggleTaskCompletion(taskId)
      await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
      showNotification('✅ 任务已完成！', 'success')
    } else if (action === 'snooze') {
      const snoozeTime = new Date(Date.now() + minutes * 60 * 1000)
      const task = taskStore.tasks.find(t => t.id === taskId)
      if (task) {
        task.reminderTime = snoozeTime.toISOString()
        await taskStore.scheduleTaskReminder(task)
        const timeText = minutes >= 60 ? `${minutes / 60}小时` : `${minutes}分钟`
        showNotification(`⏰ 已设置${timeText}后提醒`, 'info')
      }
    } else if (action === 'dismiss') {
      await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
      showNotification('已关闭提醒', 'info')
    }
  }
  
  } // 结束 isNativePlatform 检查
  
  // 设置每日任务摘要通知
  await scheduleDailySummaryNotification()
  
  // 初始化通知渠道
  await initializeNotificationChannels()
  
  // 检查通知权限
  await checkNotificationPermission()
  
  // 加载通知设置
  await loadNotificationSettings()
  
  // 清理过期的提醒记录
  await cleanupExpiredNotifications()
  
  countdownInterval.value = setInterval(() => {
    taskStore.checkOverdueTasks()
    taskStore.checkTaskReminders() // 检查任务提醒
    checkAndNotifyDeadline()
  }, 60000) // 每分钟检查一次
  
  // 首次立即检查
  taskStore.checkTaskReminders()
  checkAndNotifyDeadline()
  
  // 监听打开任务详情事件（从子任务跳转）
  window.addEventListener('open-task-detail', (event) => {
    const { taskId, task } = event.detail
    if (task) {
      openTaskDetail(task)
    } else if (taskId) {
      const foundTask = taskStore.tasks.find(t => t.id === taskId)
      if (foundTask) {
        openTaskDetail(foundTask)
      }
    }
  })

  // 🆕 监听打开任务图谱事件（v0.9.0）
  window.addEventListener('open-task-graph', (event) => {
    const { taskId } = event.detail
    graphCenterTaskId.value = taskId
    showTaskGraph.value = true
  })

  // Android 返回手势监听
  if (Capacitor.getPlatform() === 'android') {
    console.log('📱 Android 平台检测成功，注册返回手势监听器...')
    const backButtonHandler = ({ canGoBack }) => {
      console.log('🔙 返回手势触发, canGoBack:', canGoBack)
      console.log('📝 表单状态:', {
        标题: newTaskText.value,
        描述: newTaskDescription.value,
        类型: newTaskType.value,
        分类: newTaskCategory.value,
        优先级: newTaskPriority.value
      })
      
      // 临时调试：显示表单状态
      const debugInfo = `标题: ${newTaskText.value}\n描述: ${newTaskDescription.value.substring(0, 20)}...\n类型: ${newTaskType.value}`
      
      // 检查是否有打开的弹窗（按层级优先级关闭）
      
      // 特殊状态：AI 加载中（强制中断）
      if (aiLoading.value) {
        console.log('✅ 中断 AI 加载')
        showNotification('中断 AI 加载', 'info')
        aiLoading.value = false
        aiLoadingText.value = ''
        aiLoadingSubText.value = ''
        return
      }
      
      // 第三层弹窗（最上层，优先关闭）
      if (showPasswordModal.value) {
        console.log('✅ 关闭密码弹窗')
        showPasswordModal.value = false
        return
      } else if (showPhoneModal.value) {
        console.log('✅ 关闭手机号弹窗')
        showPhoneModal.value = false
        return
      } else if (showWeeklyModal.value) {
        console.log('✅ 关闭周期选择弹窗')
        showWeeklyModal.value = false
        return
      } else if (showCustomDateModal.value) {
        console.log('✅ 关闭自定义日期弹窗')
        showCustomDateModal.value = false
        return
      } else if (showPomodoroStats.value) {
        console.log('✅ 关闭番茄钟统计')
        showPomodoroStats.value = false
        return
      } else if (showSupport.value) {
        console.log('✅ 关闭联系与支持')
        showSupport.value = false
        return
      } else if (showAIConfig.value) {
        console.log('✅ 关闭AI配置')
        showAIConfig.value = false
        return
      } else if (showDatabaseConfig.value) {
        console.log('✅ 关闭数据库配置')
        showDatabaseConfig.value = false
        return
      } else if (showNotificationSettings.value) {
        console.log('✅ 关闭通知设置')
        showNotificationSettings.value = false
        return
      } else if (showVersionModal.value) {
        console.log('✅ 关闭版本更新')
        showVersionModal.value = false
        return
      } else if (showPrivacyPolicy.value) {
        console.log('✅ 关闭隐私政策')
        showPrivacyPolicy.value = false
        return
      } else if (showDataInfo.value) {
        console.log('✅ 关闭数据说明')
        showDataInfo.value = false
        return
      } else if (showUserGuide.value) {
        console.log('✅ 关闭使用指南')
        showUserGuide.value = false
        return
      } else if (showPomodoroRules.value) {
        console.log('✅ 关闭番茄钟规则')
        showPomodoroRules.value = false
        return
      } else if (showWelcome.value) {
        console.log('✅ 关闭欢迎弹窗')
        showWelcome.value = false
        return
      } else if (showBackupReminder.value) {
        console.log('✅ 关闭备份提醒')
        showBackupReminder.value = false
        return
      } else if (showNotificationGuide.value) {
        console.log('✅ 关闭通知引导')
        showNotificationGuide.value = false
        return
      } else if (showReportTemplates.value) {
        console.log('✅ 关闭报告模板')
        showReportTemplates.value = false
        return
      } else if (showUnifiedReport.value && historyReportData.value) {
        console.log('✅ 关闭历史报告详情')
        // 检查是否有内部状态需要处理（AI汇报弹窗）
        if (unifiedReportModalRef.value && unifiedReportModalRef.value.handleBackButton) {
          const handled = unifiedReportModalRef.value.handleBackButton()
          if (handled) {
            return
          }
        }
        // 关闭历史报告详情，返回报告历史列表
        showUnifiedReport.value = false
        historyReportData.value = null
        return
      } else if (showReportHistoryModal.value) {
        console.log('✅ 关闭报告历史列表')
        showReportHistoryModal.value = false
        return
      } else if (showTemplateDetail.value) {
        console.log('✅ 关闭模板详情')
        showTemplateDetail.value = false
        return
      } else if (showTemplateEditor.value) {
        console.log('✅ 关闭模板编辑')
        showTemplateEditor.value = false
        return
      } else if (showCustomReportModal.value) {
        console.log('✅ 关闭自定义报告')
        showCustomReportModal.value = false
        return
      } else if (showWeeklyReportModal.value) {
        console.log('✅ 关闭周报')
        showWeeklyReportModal.value = false
        return
      } else if (showBackupList.value) {
        console.log('✅ 关闭备份列表')
        showBackupList.value = false
        return
      } else if (showImportPreview.value) {
        console.log('✅ 关闭导入预览')
        showImportPreview.value = false
        return
      } else if (showChangelog.value) {
        console.log('✅ 关闭更新日志')
        showChangelog.value = false
        return
      } else if (showClipboardHistory.value) {
        console.log('✅ 关闭剪贴板历史')
        showClipboardHistory.value = false
        return
      } else if (showAISuggestions.value) {
        console.log('✅ 关闭AI建议卡片')
        showAISuggestions.value = false
        return
      } else if (showAIPreview.value) {
        console.log('✅ 关闭AI预览')
        showAIPreview.value = false
        return
      } else if (showAIMenu.value) {
        console.log('✅ 关闭AI菜单')
        showAIMenu.value = false
        return
      } else if (showAITaskPreview.value) {
        console.log('✅ 关闭AI任务预览')
        showAITaskPreview.value = false
        return
      } else if (showTemplateSelector.value) {
        console.log('✅ 关闭模板选择器')
        showTemplateSelector.value = false
        return
      } else if (showSubtaskSuggestion.value) {
        console.log('✅ 关闭子任务建议')
        showSubtaskSuggestion.value = false
        return
      } else if (showManualSubtaskModal.value) {
        console.log('✅ 关闭手动添加子任务')
        showManualSubtaskModal.value = false
        manualSubtaskParent.value = null
        manualSubtaskData.value = null
        return
      } else if (showAddLogModal.value) {
        // 先检查日志弹窗内的全屏编辑器
        if (addLogModalRef.value?.showFullscreenEditor) {
          addLogModalRef.value.showFullscreenEditor = false
          return
        }
        console.log('✅ 关闭添加日志')
        showAddLogModal.value = false
        currentLogTask.value = null
        return
      } else if (showCalendar.value) {
        console.log('✅ 关闭日历视图')
        showCalendar.value = false
        return
      } else if (showTaskPreview.value) {
        console.log('✅ 关闭任务预览')
        showTaskPreview.value = false
        return
      } else if (showSubtaskPreview.value) {
        console.log('✅ 关闭子任务预览')
        showSubtaskPreview.value = false
        return
      } else if (showTaskInputPreview.value) {
        console.log('✅ 关闭任务输入预览，返回全屏编辑')
        showTaskInputPreview.value = false
        previewTaskData.value = null
        // 重新打开全屏编辑器
        showFullscreenDesc.value = true
        return
      } else if (showTaskSplitter.value) {
        console.log('✅ 关闭AI任务拆分')
        showTaskSplitter.value = false
        taskToSplit.value = null
        return
      } else if (showFullscreenDesc.value) {
        console.log('✅ 关闭全屏描述编辑')
        showFullscreenDesc.value = false
        return
      } else if (showRenameCollectionModal.value) {
        console.log('✅ 关闭重命名文件夹')
        showRenameCollectionModal.value = false
        renamingCollection.value = null
        // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
        if (fromCollectionManage.value) {
          showCollectionManage.value = true
          fromCollectionManage.value = false
        }
        return
      } else if (showVerifyPasswordModal.value) {
        console.log('✅ 关闭密码验证')
        showVerifyPasswordModal.value = false
        pendingCollectionId.value = null
        return
      } else if (showChangePasswordModal.value) {
        console.log('✅ 关闭修改密码')
        showChangePasswordModal.value = false
        // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
        if (fromCollectionManage.value) {
          showCollectionManage.value = true
          fromCollectionManage.value = false
        }
        return
      } else if (showCreateCollectionModal.value) {
        console.log('✅ 关闭创建文件夹')
        showCreateCollectionModal.value = false
        // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
        if (fromCollectionManage.value) {
          showCollectionManage.value = true
          fromCollectionManage.value = false
        }
        return
      } else if (showDeleteCollectionModal.value) {
        console.log('✅ 关闭删除文件夹')
        showDeleteCollectionModal.value = false
        // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
        if (fromCollectionManage.value) {
          showCollectionManage.value = true
          fromCollectionManage.value = false
        }
        return
      } else if (showMoveToCollectionModal.value) {
        console.log('✅ 关闭移动到文件夹')
        showMoveToCollectionModal.value = false
        taskToMove.value = null
        return
      } else if (showBatchAddModal.value) {
        console.log('✅ 关闭批量迁入')
        showBatchAddModal.value = false
        // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
        if (fromCollectionManage.value) {
          showCollectionManage.value = true
          fromCollectionManage.value = false
        }
        return
      } else if (showBatchMoveOutModal.value) {
        console.log('✅ 关闭批量迁出')
        showBatchMoveOutModal.value = false
        // 🆕 如果是从文件夹管理打开的，返回到文件夹管理
        if (fromCollectionManage.value) {
          showCollectionManage.value = true
          fromCollectionManage.value = false
        }
        return
      } else if (showFilePreview.value) {
        console.log('✅ 关闭文件预览')
        showFilePreview.value = false
        return
      } else if (showMoveCollectionModal.value) {
        console.log('✅ 关闭移动笔记本')
        showMoveCollectionModal.value = false
        collectionToMove.value = null
        return
      }
      // 🆕 第二层：文件夹管理页面
      else if (showCollectionManage.value) {
        console.log('✅ 关闭文件夹管理')
        showCollectionManage.value = false
        return
      }
      // 🆕 第二层：标签浏览器（v0.9.0）
      else if (showTagBrowser.value) {
        // 先尝试让 TagBrowser 处理（迁入/迁出弹窗、任务列表）
        if (tagBrowserRef.value && tagBrowserRef.value.handleBackButton) {
          const handled = tagBrowserRef.value.handleBackButton()
          if (handled) {
            console.log('✅ TagBrowser 内部返回')
            return
          }
        }
        console.log('✅ 关闭标签浏览器')
        showTagBrowser.value = false
        return
      }
      // 🆕 第二层：任务关系图谱（v0.9.0）
      else if (showTaskGraph.value) {
        console.log('✅ 关闭任务关系图谱')
        showTaskGraph.value = false
        return
      }
      // 🆕 第二层：甘特图（v0.9.0）
      else if (showGanttChart.value) {
        console.log('✅ 关闭甘特图')
        showGanttChart.value = false
        return
      }
      // 🆕 第二层：更多文件夹选择
      else if (showMoreCollections.value) {
        console.log('✅ 关闭更多文件夹')
        showMoreCollections.value = false
        return
      }
      // 第二层弹窗（中层）
      else if (showTutorial.value) {
        console.log('✅ 关闭教程模式')
        showTutorial.value = false
      } else if (showPomodoroTimer.value) {
        console.log('✅ 关闭番茄钟计时器')
        showPomodoroTimer.value = false
      } else if (showUnifiedReport.value) {
        console.log('✅ 关闭普通报告中心')
        // 检查是否有内部状态需要处理
        if (unifiedReportModalRef.value && unifiedReportModalRef.value.handleBackButton) {
          const handled = unifiedReportModalRef.value.handleBackButton()
          if (handled) {
            // 内部已处理（返回到选择页）
            return
          }
        }
        // 关闭整个弹窗
        showUnifiedReport.value = false
        historyReportData.value = null
      } else if (showTaskDetail.value) {
        console.log('✅ 关闭任务详情')
        // 检查 TaskDetailModal 内部是否有打开的子弹窗
        if (taskDetailModalRef.value) {
          if (taskDetailModalRef.value.showDeleteConfirm) {
            taskDetailModalRef.value.showDeleteConfirm = false
            return
          } else if (taskDetailModalRef.value.showFullscreenEditor) {
            taskDetailModalRef.value.showFullscreenEditor = false
            return
          } else if (taskDetailModalRef.value.showAddLogModal) {
            taskDetailModalRef.value.showAddLogModal = false
            return
          } else if (taskDetailModalRef.value.showWaitForSelector) {
            taskDetailModalRef.value.showWaitForSelector = false
            return
          }
        }
        // 没有子弹窗，关闭任务详情本身
        showTaskDetail.value = false
        selectedTask.value = null
      } else if (showAIChat.value) {
        console.log('✅ 关闭AI问答')
        showAIChat.value = false
      } else if (showProfile.value) {
        console.log('✅ 关闭个人主页')
        // 没有子弹窗，关闭个人主页本身
        showProfile.value = false
      } else if (showFilterModal.value) {
        console.log('✅ 关闭高级筛选')
        showFilterModal.value = false
      } else if (showTrash.value) {
        console.log('✅ 关闭回收站')
        showTrash.value = false
      } else if (showDailySummary.value) {
        console.log('✅ 关闭今日总结')
        showDailySummary.value = false
      } else if (showReportModal.value) {
        console.log('✅ 关闭数据报告')
        showReportModal.value = false
      } else if (showAIResult.value) {
        console.log('✅ 关闭AI结果')
        showAIResult.value = false
      } else if (showAISuggestion.value) {
        console.log('✅ 关闭AI建议')
        showAISuggestion.value = false
      } else if (showAIReport.value) {
        console.log('✅ 关闭AI报告')
        showAIReport.value = false
      } else if (showTaskSplitter.value) {
        console.log('✅ 关闭任务拆分')
        showTaskSplitter.value = false
      } 
      // 第一层：表单状态清空（逐步恢复到初始状态）
      else if (showAutocomplete) {
        // 自动补全优先级最低，放在表单清空之前
        console.log('✅ 关闭自动补全')
        closeAutocomplete()
      } else if (selectedCollectionId.value !== null) {
        // 文件夹选择状态
        console.log('✅ 返回到全部任务')
        selectCollection(null)
      } else if (selectedTag.value) {
        // 如果有标签筛选，先清空标签筛选
        console.log('✅ 清空标签筛选')
        selectedTag.value = null
      } else if (newTaskDescription.value.trim() !== '') {
        // 如果有任务描述，先清空描述
        console.log('✅ 清空任务描述')
        newTaskDescription.value = ''
      } else if (newTaskText.value.trim() !== '') {
        // 如果有任务标题，清空标题
        console.log('✅ 清空任务标题')
        newTaskText.value = ''
      } else if (newTaskType.value !== 'today' || 
                 newTaskCategory.value !== 'work' || 
                 newTaskPriority.value !== 'medium' ||
                 customDateTime.value !== '' ||
                 selectedWeekdays.value.length > 0 ||
                 enableReminder.value !== false) {
        // 如果有其他表单状态被修改，恢复默认值
        console.log('✅ 恢复表单默认值')
        newTaskType.value = 'today'
        newTaskCategory.value = 'work'
        newTaskPriority.value = 'medium'
        customDateTime.value = ''
        selectedWeekdays.value = []
        enableReminder.value = false
        reminderDateTime.value = ''
      } else if (currentFilter.value !== 'all') {
        // 如果当前不是"全部"，恢复到"全部"
        console.log('✅ 恢复筛选状态')
        setFilter('all')
        return
      } 
      // 首页状态：不处理，让系统默认行为生效（退出应用或返回上一页）
      else {
        console.log('✅ 首页返回 → 使用系统默认行为')
        // 不调用 return，让事件继续传播
        // 系统会自动处理：手势导航返回桌面，按钮导航退出应用
      }
    }
    
    App.addListener('backButton', backButtonHandler)
    console.log('✅ 返回手势监听器注册完成')
  }
})

// 生命周期钩子：组件卸载时
onUnmounted(() => {
  if (countdownInterval.value) clearInterval(countdownInterval.value)
  
  // 移除 Android 返回监听
  if (Capacitor.getPlatform() === 'android') {
    App.removeAllListeners()
  }
})

// 监听筛选弹窗打开，自动聚焦搜索框
watch(showFilterModal, (newVal) => {
  if (newVal) {
    nextTick(() => {
      filterSearchInput.value?.focus()
    })
  }
})

// 监听报告数据变化，触发数字滚动动画
watch(() => reportData.value, (newData) => {
  if (newData && showReportModal.value) {
    nextTick(() => {
      // 番茄钟数字滚动
      if (newData.totalPomodoros && document.getElementById('countup-pomodoros')) {
        new CountUp('countup-pomodoros', newData.totalPomodoros, {
          duration: 2,
          useEasing: true
        }).start()
      }
      
      // 已完成任务数字滚动
      if (newData.completedTasks && document.getElementById('countup-completed')) {
        new CountUp('countup-completed', newData.completedTasks, {
          duration: 2,
          useEasing: true
        }).start()
      }
      
      // 完成率数字滚动
      if (newData.completionRate !== undefined && document.getElementById('countup-rate')) {
        new CountUp('countup-rate', newData.completionRate, {
          duration: 2,
          useEasing: true,
          suffix: '%'
        }).start()
      }
    })
  }
}, { deep: true })
</script>

<style scoped>
.todo-layout {
  display: flex;
  justify-content: center;
  padding: 0;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.main-content {
  width: 100%;
  max-width: 100%;
  flex: none;
  padding: 0.1rem 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 任务列表与统计区域内容完全对齐（像素级） */
.task-list {
  width: 100% !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box;
}

.task-list ul {
  width: 100%;
  max-width: none;
  list-style: none;
  padding: 0;
  margin: 0;
}

/* v1.5.6: 扁平化设计 - 去掉外壳，让组件直接呼吸 */
.dashboard-area {
  /* 移除厚重外壳：无背景、无边框、无padding */
  background: transparent;
  border-radius: 0;
  padding: 0;
  margin: 0 0 0.2rem 0;
  border: none;
  box-shadow: none;
  width: 100%;
}

/* 当添加表单展开时，dashboard-area 不需要底部间距 */
.dashboard-area:has(.add-form-two-row) {
  margin-bottom: 0;
}

.stats-all-in-one {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  flex-wrap: nowrap;
}

/* v1.5: 极简状态栏 */
.stats-compact {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-start;
  margin-bottom: 0.8rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 0.2rem 0;
}

/* 图标按钮 */
.icon-btn {
  width: 16px;
  height: 16px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 3px;
  font-size: 0.55rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.icon-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.icon-btn:active {
  transform: scale(0.95);
}

/* v1.5.6: Grid统计卡片 - 扁平化，直接浮在背景上 */
.stats-grid {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
  width: 100%;
}

.stats-grid > .stat-card:not(.add-toggle-card):not(.filter-card) {
  flex: 1;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0.5rem 0.8rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  height: 50px;
  box-sizing: border-box;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  gap: 0.2rem;
}

/* 核心指标突出 - 全部和已逾期 */
.stat-card-all,
.stat-card-overdue {
  flex: 1.2 !important;  /* 比其他卡片宽20% */
  font-weight: 600;
}

/* 色彩语义化 - 已完成（淡绿色背景） */
.stat-card-completed {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(129, 199, 132, 0.05) 100%);
  border: 1px solid rgba(76, 175, 80, 0.15);
}

.stat-card-completed:hover {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(129, 199, 132, 0.08) 100%);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

/* 色彩语义化 - 待办（淡蓝色背景） */
.stat-card-pending {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(100, 181, 246, 0.05) 100%);
  border: 1px solid rgba(33, 150, 243, 0.15);
}

.stat-card-pending:hover {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.12) 0%, rgba(100, 181, 246, 0.08) 100%);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
}

/* 色彩语义化 - 已逾期（淡红色背景） */
.stat-card-overdue {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(239, 83, 80, 0.05) 100%);
  border: 1px solid rgba(244, 67, 54, 0.15);
}

.stat-card-overdue:hover {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.12) 0%, rgba(239, 83, 80, 0.08) 100%);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.15);
}

.stat-card.add-toggle-card {
  max-width: 50px;
  min-width: 50px;
  padding: 0;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 筛选按钮卡片 - 与箭头按钮高度一致 */
.stat-card.filter-card {
  max-width: 50px;
  min-width: 50px;
  padding: 0;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card.filter-card:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 图标+文字组合样式 */
.icon-with-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.icon-small {
  font-size: 1.1rem;
  line-height: 1;
}

.label-small {
  font-size: 0.9rem;
  line-height: 1;
  color: #666;
  font-weight: 500;
}

.filter-card:hover .label-small {
  color: #667eea;
}

.add-toggle-card:hover .label-small {
  color: #667eea;
}

.toggle-pill {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toggle-pill:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: scale(1.05);
}

.arrow-icon {
  color: #667eea;
  transition: transform 0.3s ease;
  display: inline-block;
}

.arrow-icon.rotated {
  transform: rotate(180deg);
}

/* 激活状态 */
.stat-card.add-toggle-card.active .toggle-pill {
  background: rgba(102, 126, 234, 0.12);
}

.stat-card.add-toggle-card.active .arrow-icon {
  color: #667eea;
}

.stat-card.clickable {
  cursor: pointer;
}

/* 微交互 - 悬停效果增强 */
.stat-card.clickable:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.active {
  background: white;
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.stat-card .stat-label {
  font-size: 1rem;
  color: #333;
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.2;
}

.stat-card .stat-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  line-height: 1;
}

.stat-card .stat-value.success {
  color: #10b981;
}

.stat-card .stat-value.danger {
  color: #ef4444;
}

/* v1.5.6: 操作栏 - 扁平化 */
.action-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.label-small {
  font-size: 1rem;
  line-height: 1.2;
  color: #333;
  font-weight: 600;
}

.icon-small {
  font-size: 0.8rem;
  line-height: 1;
}

.search-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-main {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.9rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: white;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  color: #333;
  transition: all 0.3s;
  height: 36px;
  box-sizing: border-box;
}

.search-input-main::placeholder {
  color: #999;
}

.search-input-main:focus {
  outline: none;
  background: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
  width: 22px;
  height: 22px;
  border: none;
  background: #e0e0e0;
  color: #666;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.clear-search-btn:hover {
  background: #ccc;
  transform: scale(1.1);
}

.action-btn {
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.filter-btn-main {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.filter-btn-main:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.add-btn-main {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(118, 75, 162, 0.3);
}

.add-btn-main:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.5);
}

.action-btn:active {
  transform: scale(0.95);
}

/* 旧版样式保留（兼容） */
/* v1.5: 极简状态栏 */
.stats-compact {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-start;
  margin-bottom: 0.8rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 0.2rem 0;
}

/* 图标按钮 */
.icon-btn {
  width: 16px;
  height: 16px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 3px;
  font-size: 0.55rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.icon-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.icon-btn:active {
  transform: scale(0.95);
}

/* 第二行：操作按钮 */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  justify-content: flex-start;
}

.filter-btn {
  padding: 0.3rem 0.6rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  width: fit-content;
  display: inline-block;
}

.filter-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* v1.2: 统计数据横向紧凑排列 */
.stat-row {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.2rem 0.3rem;
  border-radius: 8px;
  transition: all 0.3s;
  flex-shrink: 0;
  white-space: nowrap;
}

.stat-row.clickable {
  cursor: pointer;
}

.stat-row.clickable:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.stat-row.active {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.stat-count {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dark);
  flex-shrink: 0;
}

.stat-count.success { color: var(--success-color); }
.stat-count.danger { color: var(--error-color); }

.stat-count-plain {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-light);
  opacity: 0.7;
  flex-shrink: 0;
}

.stat-label-mini {
  font-size: 0.7rem;
  color: var(--text-light);
  white-space: nowrap;
  flex-shrink: 0;
}

/* 第二行：状态和时间筛选 (合并为一行) */
.filter-row-unified {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  margin-top: 0.4rem;
  flex-wrap: nowrap;
}

.filter-row-unified .stat-row {
  flex: 0.8;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.2rem 0.2rem;
}

/* 搜索框 */
.search-box {
  flex: 2;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.2rem 2rem 0.2rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.4);
  font-size: 0.7rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.6);
  border-color: var(--primary-color);
}

.search-input::placeholder {
  color: var(--text-light);
  opacity: 0.7;
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem;
  transition: color 0.2s;
}

.clear-search:hover {
  color: var(--error-color);
}

.date-range-display {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 0.2rem 0;
  gap: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  flex: 2.5;
  position: relative;
  overflow: hidden;
}

.date-range-display:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: var(--primary-color);
}

.range-values {
  display: flex;
  align-items: center;
  flex: 1;
  height: 100%;
}

.date-clickable-area {
  flex: 1;
  height: 100%;
  padding: 0 0.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.date-clickable-area:hover {
  background: rgba(102, 126, 234, 0.1);
}

.date-clickable-area.placeholder {
  color: var(--text-light);
  font-weight: 400;
  opacity: 0.6;
}

.range-sep {
  color: var(--text-light);
  opacity: 0.5;
}

.clear-date-icon {
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  font-weight: bold;
  margin-left: auto;
}

.calendar-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.add-btn-text {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border: none;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.add-btn-text:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.add-btn-text:active {
  transform: scale(0.95);
}

.interaction-area {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.interaction-area {
  display: none;
}

.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}

.filter-toolbar::-webkit-scrollbar {
  display: none;
}

.mobile-select {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  padding: 0.5rem 0.8rem;
  font-size: 0.85rem;
  color: var(--text-dark);
  cursor: pointer;
  transition: all 0.3s;
}

.mobile-select:focus {
  outline: none;
  background: white;
  border-color: var(--primary-color);
}

.mobile-time-range {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  gap: 0.3rem;
}

.range-sep {
  color: var(--text-light);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0 0.2rem;
}

.clear-icon {
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
  flex-shrink: 0;
}

.clear-icon:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
}

.clear-icon:active {
  transform: scale(0.95);
}

.task-input-section {
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.date-input-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input-item .input {
  flex: 1;
}

.task-time {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-light);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  line-height: 1;
  height: 24px;
  box-sizing: border-box;
}

/* 压缩时间样式（更紧凑） */
.task-time-compact {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  color: #666;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.03);
  line-height: 1;
  height: 22px;
  white-space: nowrap;
}

/* 提醒时间样式 */
.task-time-compact.reminder-time {
  background: rgba(147, 51, 234, 0.1);
  color: #9333ea;
  font-weight: 500;
}

/* 压缩状态样式 */
.task-status-compact {
  display: inline-flex;
  align-items: center;
  font-size: 0.625rem;
  line-height: 1;
  height: auto;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
}

/* 完成时间徽章 */
.task-completed-time {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.1);
  line-height: 1;
  height: 24px;
  box-sizing: border-box;
}

/* 计划完成时间徽章 */
.task-deadline-planned {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #6366f1;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.1);
  line-height: 1;
  height: 24px;
  box-sizing: border-box;
}

/* 任务类型徽章 */
.task-type.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.1);
  color: var(--primary-color);
  line-height: 1;
  height: 24px;
  box-sizing: border-box;
}

.task-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.weekday-select {
  display: flex;
  flex-direction: column;
  padding: 0.8rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
}

.weekday-checkboxes {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.weekday-checkbox-item {
  display: flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.8rem;
}

.weekday-checkbox-item:has(input:checked) {
  background: var(--primary-color);
  color: white;
}

/* v1.2: 触摸优化 - 增大点击热区 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem; /* 增大点击热区 */
  margin: -0.6rem -0.6rem -0.6rem -0.6rem; /* 四周负边距完全抵消padding */
  cursor: pointer;
}

.checkbox-wrapper.checkbox-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* v1.2: 任务卡片触摸反馈 */
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 6px; /* 调整至6px，平衡紧凑与呼吸感 */
  padding: 0.8rem;
  background: white;
  border-radius: 12px;
  margin: 0 0 0.1rem 0 !important; /* 与统计区域间距一致 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
  width: 100%;
}

.task-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.task-checkbox {
  width: 14px; /* 缩小至14px，小于文字 */
  height: 14px;
  cursor: pointer;
  margin-top: 0.2rem; /* 重新微调对齐 */
  flex-shrink: 0;
  /* 加粗边框，防止发虚 */
  border: 1.5px solid #999 !important;
  border-radius: 3px;
  appearance: none;
  -webkit-appearance: none;
  background: white;
  position: relative;
  transition: all 0.2s;
}

.task-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background: #f5f5f5;
}

.task-checkbox:checked {
  background: #8b5cf6;
  border-color: #8b5cf6 !important;
}

.task-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 10px; /* 同步缩小勾号 */
  font-weight: bold;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* v1.2: 字体比例优化 */
/* 任务标题行（标题+操作按钮） */
.task-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.task-title {
  font-size: 0.9rem; /* 14.4px，稍微增大 */
  font-weight: 700; /* 更粗 */
  color: #333; /* 深色 */
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1.5;
  flex: 1;
}

.task-title:hover {
  color: var(--primary-color);
}

/* 任务操作按钮组 */
.task-actions {
  display: flex;
  gap: 0.8rem;
  flex-shrink: 0;
  align-items: center;
}

/* 提醒状态指示器 */
.reminder-indicator {
  font-size: 0.875rem;
  opacity: 0.7;
  cursor: help;
  transition: all 0.2s;
  line-height: 1;
}

.reminder-indicator:hover {
  opacity: 1;
  transform: scale(1.15);
}

/* 置顶按钮 */
.btn-pin-inline {
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.6rem;
  margin: -0.6rem;
  opacity: 0.3;
  transition: all 0.2s;
  flex-shrink: 0;
  line-height: 1;
  filter: grayscale(1);
}

.btn-pin-inline:hover {
  opacity: 0.8;
  transform: scale(1.15);
  filter: grayscale(0);
}

.btn-pin-inline.pinned {
  opacity: 1;
  filter: grayscale(0);
  transform: rotate(45deg);
}

/* 🆕 移动到文件夹按钮 */
.btn-move-inline {
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.6rem;
  margin: -0.6rem;
  opacity: 0.3;
  transition: all 0.2s;
  flex-shrink: 0;
  line-height: 1;
  filter: grayscale(1);
}

.btn-move-inline:hover {
  opacity: 0.8;
  transform: scale(1.15);
  filter: grayscale(0);
}

/* 番茄钟按钮 */
.btn-pomodoro-inline {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.75rem;
  margin: -0.75rem;
  opacity: 0.7;
  transition: all 0.2s;
  flex-shrink: 0;
  line-height: 1;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-pomodoro-inline:hover {
  opacity: 1;
  transform: scale(1.25);
}

.btn-pomodoro-inline:active {
  transform: scale(1.1);
}

/* 内联删除按钮 */
.btn-delete-inline {
  background: none;
  border: none;
  font-size: 0.875rem; /* 14px，视觉小巧 */
  cursor: pointer;
  padding: 0.6rem; /* 增大点击热区至44px（14px + 0.6rem*2 ≈ 44px） */
  margin: -0.6rem; /* 负边距抵消padding，保持视觉位置 */
  opacity: 0.6; /* 提高对比度：从0.35增至0.6 */
  transition: all 0.2s;
  flex-shrink: 0;
  line-height: 1;
  color: #666; /* 加深颜色：从#999改为#666 */
}

.btn-delete-inline:hover {
  opacity: 1;
  transform: scale(1.15);
  color: #333; /* 悬停更深 */
}

.task-description {
  font-size: 0.75rem; /* 12px */
  color: #999; /* 更浅的灰色 */
  margin-top: 0.4rem;
  margin-left: calc(-14px - 6px); /* 向左延伸到复选框位置 */
  line-height: 1.6; /* 增加行高 */
  max-width: calc(100% + 14px + 6px); /* 补偿左边距 */
  word-wrap: break-word;
  white-space: pre-wrap; /* 保留换行和空格 */
  padding: 0.5rem 0.75rem; /* 添加内边距 */
  background: rgba(0, 0, 0, 0.02); /* 浅灰背景 */
  border-radius: 6px;
  border-left: 3px solid #e0e0e0; /* 左侧边框 */
  cursor: pointer; /* 可点击 */
  transition: all 0.2s;
  position: relative;
}

/* 🆕 任务卡片中的 Markdown 样式（紧凑版） */
.task-description :deep(.markdown-renderer) {
  font-size: 0.75rem;
  color: #666;
}

.task-description :deep(.markdown-renderer h1),
.task-description :deep(.markdown-renderer h2),
.task-description :deep(.markdown-renderer h3) {
  font-size: 0.85rem;
  margin: 0.3rem 0;
  border: none;
  color: #333;
}

.task-description :deep(.markdown-renderer p) {
  margin: 0.2rem 0;
}

.task-description :deep(.markdown-renderer ul),
.task-description :deep(.markdown-renderer ol) {
  margin: 0.2rem 0;
  padding-left: 1.2rem;
}

.task-description :deep(.markdown-renderer li) {
  margin: 0.1rem 0;
}

.task-description :deep(.markdown-renderer code) {
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
}

.task-description :deep(.markdown-renderer pre) {
  margin: 0.3rem 0;
  padding: 0.5rem;
  font-size: 0.7rem;
}

.task-description :deep(.markdown-renderer blockquote) {
  margin: 0.3rem 0;
  padding-left: 0.5rem;
  font-size: 0.7rem;
}

/* 已完成任务的描述 */
.task-description.description-completed {
  opacity: 0.5;
}

/* 根据优先级变色左侧边框 */
.task-description.description-priority-high {
  border-left-color: #f44336; /* 红色 */
}

.task-description.description-priority-medium {
  border-left-color: #ff9800; /* 橙色 */
}

.task-description.description-priority-low {
  border-left-color: #2196f3; /* 蓝色 */
}

/* 描述悬停效果 */
.task-description:hover {
  background: rgba(0, 0, 0, 0.04);
  border-left-width: 4px;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
  margin-top: 0.35rem;
  margin-left: calc(-14px - 6px); /* 向左延伸到复选框位置 */
  max-width: calc(100% + 14px + 6px); /* 补偿左边距 */
  line-height: 1;
}

/* v1.2: 图标化徽章 */
.badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem; /* 10px */
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.05);
}

/* 优先级背景色 */
.priority-high {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.priority-medium {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.priority-low {
  background: rgba(102, 126, 234, 0.1);
  color: var(--primary-color);
}

/* 分类背景色 */
.category-work {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.category-study {
  background: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
}

.category-life {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

/* 番茄数徽章 */
.badge-pomodoro {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem; /* 10px */
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

.pomodoro-high {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.pomodoro-medium {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.pomodoro-low {
  background: rgba(102, 126, 234, 0.1);
  color: var(--primary-color);
}

/* 日志徽章 */
.badge-logs {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
  color: var(--primary-color);
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 等待状态徽章 */
.badge-waiting {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(251, 191, 36, 0.15);
  color: #d97706;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 依赖已完成徽章（绿色） */
.badge-waiting-done {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 被依赖状态徽章 */
.badge-blocking {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 父任务徽章（子任务显示） */
.badge-parent {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 子任务徽章（父任务显示） */
.badge-children {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 依赖徽章（前置任务） */
.badge-dependency {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 被依赖徽章（后置任务） */
.badge-blocking {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 进度徽章 */
.badge-progress {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
  transition: all 0.3s;
  line-height: 1;
  height: auto;
  box-sizing: border-box;
}

/* 任务截止时间显示 */
.task-deadline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;  /* 统一内边距 */
  border-radius: 12px;
  transition: all 0.3s;
  line-height: 1;  /* 统一行高 */
  height: 24px;  /* 固定高度 */
  box-sizing: border-box;
}

.deadline-normal {
  background: rgba(102, 126, 234, 0.1);
  color: var(--primary-color);
}

.deadline-warning {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.deadline-urgent {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  animation: pulse 2s infinite;
}

.deadline-overdue {
  background: rgba(244, 67, 54, 0.15);
  color: #d32f2f;
  font-weight: 700;
}

.deadline-completed {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
  text-decoration: line-through;
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.header-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  width: 100%;
  justify-content: space-between;
}

.header {
  padding: 1rem 0.1rem 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--glass-border);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* 统一的横向布局 */
.header-row {
  display: flex;
  width: 100%;
}

/* 第一行：两端对齐，笔记本靠左，其余靠右 */
.header-row-1 {
  justify-content: space-between;
}

/* 第二行：左对齐 */
.header-row-2 {
  justify-content: flex-start;
}

/* 展开/收起按钮 */
.btn-toggle-row2 {
  font-size: 12px;
  background: rgba(255,255,255,0.85) !important;
  color: #6d28d9 !important;
  border: 1px solid rgba(109,40,217,0.3) !important;
}

/* 左右分组 */
.header-group {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

/* 每个图标+文字单元 */
.header-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

/* 文字标签 */
.item-label {
  font-size: 0.7rem;
  color: #666;
  white-space: nowrap;
  text-align: center;
  line-height: 1;
  margin: 0;
  padding: 0;
}

/* 🆕 左侧区域（任务树 + 文件夹按钮） */
.left-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 🆕 文件夹按钮 */
.btn-folder-toggle {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-folder-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-color: rgba(255, 255, 255, 1);
}

.btn-folder-toggle.active {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border-color: rgba(255, 255, 255, 1);
}

/* 🆕 面包屑导航 */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  margin-bottom: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  font-size: 0.9rem;
}

.breadcrumb-nav::-webkit-scrollbar {
  display: none;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
  color: #667eea;
  flex-shrink: 0;
}

.breadcrumb-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.breadcrumb-item .separator {
  color: #9ca3af;
  margin: 0 2px;
  pointer-events: none;
}

.breadcrumb-item .crumb-text {
  font-weight: 500;
}

/* 响应式：小屏幕只显示最后2级 */
@media (max-width: 600px) {
  .breadcrumb-item:not(:nth-last-child(-n+2)):not(:first-child) {
    display: none;
  }
  
  /* 在第一个和倒数第二个之间显示省略号 */
  .breadcrumb-item:first-child::after {
    content: '›';
    color: #9ca3af;
    margin-left: 4px;
  }
}

/* 🆕 文件夹快捷栏 */
.collection-quick-bar {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 0 0 2px 0;
  margin-bottom: 2px;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}

.collection-quick-bar::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}

/* 🆕 统计筛选栏（全部左对齐） */
.stats-quick-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0;
  padding: 2px 0;
  margin-bottom: 2px;
}

.stats-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex: 1;
  min-height: 36px;
}

.stats-chip:hover {
  border-color: #8b5cf6;
  background: #f3f0ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.stats-chip.active {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.stats-chip .chip-name {
  font-weight: 500;
}

.stats-chip .chip-count {
  font-weight: 600;
  opacity: 0.9;
}

.stats-chip.chip-overdue .chip-count {
  color: #ef4444;
}

.stats-chip.chip-overdue.active .chip-count {
  color: white;
}

.stats-chip.chip-filter,
.stats-chip.chip-toggle {
  background: #f0f0f0;
  border-color: #d0d0d0;
}

.stats-chip.chip-filter:hover,
.stats-chip.chip-toggle:hover {
  background: #e0e0e0;
}

.stats-chip.chip-toggle.active {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border-color: #8b5cf6;
}


/* 🆕 文件夹图标按钮 */
.quick-bar-icon-btn {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 24px;
  border: 2px solid #e0e0e0;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}

.quick-bar-icon-btn .icon {
  font-size: 1.4rem;
}

.quick-bar-icon-btn .text {
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
}

.quick-bar-icon-btn .count {
  font-size: 0.85rem;
  color: #666;
}

.quick-bar-icon-btn:hover {
  border-color: #8b5cf6;
  background: #f3f0ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.quick-bar-icon-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.quick-bar-icon-btn.active .text,
.quick-bar-icon-btn.active .count {
  color: white;
}

.collection-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 36px;
}

.collection-chip:hover {
  border-color: #8b5cf6;
  background: #f3f0ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.collection-chip.active {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.chip-icon {
  font-size: 1rem;
}

.chip-name {
  font-weight: 500;
  font-size: 0.85rem;
}

.chip-count {
  font-size: 0.8rem;
  opacity: 0.9;
}

.manage-btn {
  min-width: 36px;
  min-height: 36px;
  padding: 6px;
  font-size: 1.2rem;
}

.chip-count {
  opacity: 0.7;
  font-size: 0.8rem;
}

.collection-chip.active .chip-count {
  opacity: 0.9;
}

.chip-more {
  background: #f0f0f0;
  border-color: #d0d0d0;
}

.chip-more:hover {
  background: #e0e0e0;
}

.chip-more.active {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
}

/* 🆕 批量添加按钮 */
.chip-batch-add {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-color: #10b981;
}

.chip-batch-add:hover {
  background: linear-gradient(135deg, #059669, #047857);
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

/* 🆕 文件夹列表面板 */
.collection-list-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-height: 300px;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 🆕 文件夹项 */
.collection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.collection-item:hover {
  background: #f3f0ff;
  transform: translateX(4px);
}

.collection-item.active {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
}

.collection-item.editing {
  background: #f3f0ff;
  border: 2px solid #8b5cf6;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

/* 🆕 完整列表中的操作按钮组 */
.collection-actions {
  display: flex;
  gap: 4px;
}

.collection-actions .action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collection-actions .action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.collection-actions .action-move-in:hover {
  background: #d1fae5;
  color: #059669;
}

.collection-actions .action-move-out:hover {
  background: #fed7aa;
  color: #d97706;
}

.collection-actions .action-password:hover {
  background: #fef3c7;
  color: #f59e0b;
}

.collection-actions .action-delete:hover {
  background: #fee;
  color: #dc2626;
}

.collection-item.active .collection-actions .action-btn {
  background: rgba(255, 255, 255, 0.3);
}

.collection-item.active .collection-actions .action-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.collection-icon {
  font-size: 1.2rem;
}

.lock-icon {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-left: 2px;
}

.collection-name {
  font-weight: 500;
  cursor: text;
}

.collection-name:hover {
  text-decoration: underline;
  text-decoration-style: dashed;
}

/* 🆕 文件夹名称编辑输入框 */
.collection-name-input {
  flex: 1;
  padding: 4px 8px;
  border: 2px solid #8b5cf6;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  background: white;
  outline: none;
}

.collection-name-input:focus {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.collection-name {
  font-weight: 500;
}

.collection-count {
  color: #888;
  font-size: 0.9rem;
}

.collection-item.active .collection-count {
  color: rgba(255, 255, 255, 0.8);
}

.check-mark {
  margin-left: auto;
  font-size: 1.2rem;
}

.btn-more {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.collection-item:hover .btn-more {
  opacity: 1;
}

.btn-more:hover {
  background: rgba(0,0,0,0.1);
}

.collection-item.active .btn-more:hover {
  background: rgba(255,255,255,0.2);
}

/* 🆕 新建文件夹按钮 */
.btn-new-collection {
  width: 100%;
  padding: 12px;
  border: 2px dashed #8b5cf6;
  background: white;
  border-radius: 8px;
  color: #8b5cf6;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-new-collection:hover {
  background: #f3f0ff;
  border-color: #6366f1;
}

/* 任务树成长 */
.user-info h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

/* 统一的圆形图标按钮 */
.btn-icon-circle {
  width: 36px; /* 42px → 36px */
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.1rem; /* 1.35rem → 1.1rem */
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-icon-circle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon-circle:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-icon-circle:active:not(:disabled) {
  transform: scale(0.95);
}

/* 小型加载动画 */
.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-icon-circle:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.btn-manage {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-manage:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
}

.btn-icon-circle:active {
  transform: scale(0.95);
}

/* 只让图标自转，不让按钮转 */
.btn-icon-circle .spinning {
  display: inline-block;
  animation: spin-only 0.8s linear infinite;
}

@keyframes spin-only {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 刷新按钮 */
.btn-refresh-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-refresh-icon:hover {
  border-color: rgba(255, 255, 255, 1) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* AI问答按钮 */
.btn-ai {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-ai:hover {
  border-color: rgba(255, 255, 255, 1) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 演示模式按钮 */
.btn-tutorial {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-tutorial:hover {
  border-color: rgba(255, 255, 255, 1) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 回收站按钮 */
.btn-trash {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-trash:hover {
  border-color: rgba(255, 255, 255, 1) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 数据统计按钮 */
.btn-stats {
  /* 使用默认样式 */
}

/* 数字气泡 */
.badge-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-avatar {
  height: 36px; /* 42px → 36px */
  padding: 0 1rem; /* 1.2rem → 1rem */
  border-radius: 18px; /* 21px → 18px */
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-avatar:hover {
  border-color: rgba(255, 255, 255, 1) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-avatar:active {
  transform: scale(0.95);
}

.username-text {
  color: white;
  font-size: 0.85rem; /* 1rem → 0.85rem */
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-avatar:hover {
  transform: translateY(-2px) scale(1.05);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-avatar:active {
  transform: scale(0.95);
}

/* 个人主页样式 */
.profile-section {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 12px;
  margin-bottom: 1rem;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.profile-info h2 {
  margin: 0 0 0.4rem 0;
  font-size: 1.1rem;
  color: var(--text-dark);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.username-edit-input {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  width: 200px;
}

.edit-icon {
  font-size: 0.85rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.edit-icon:hover {
  opacity: 1;
}

.password-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.password-row .input {
  flex: 1;
  margin: 0;
  font-size: 0.85rem;
  padding: 0.5rem;
}

.btn-compact {
  padding: 0.5rem 0.9rem;
  white-space: nowrap;
  font-size: 0.85rem;
}

.bind-phone-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.bind-phone-row .input {
  flex: 1;
  margin: 0;
  font-size: 0.85rem;
  padding: 0.5rem;
}

.bound-phone-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.phone-display {
  font-size: 1rem;
  color: #333;
  font-weight: 500;
}

.bind-hint {
  margin: 0.4rem 0 0 0;
  font-size: 0.7rem;
  color: #999;
  line-height: 1.3;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.profile-meta {
  margin: 0;
  color: var(--text-light);
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  line-height: 1.3;
}
/* 统计信息 - 紧凑单行 */
.profile-stats-compact {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.profile-stats-compact .stat-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
  justify-content: center;
}

.profile-stats-compact .stat-label {
  font-size: 0.75rem;
  color: var(--text-light);
}

.profile-stats-compact .stat-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--primary-color);
}

/* 番茄统计入口 */
.pomodoro-entry {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 0.9rem;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%);
  border-radius: 12px;
  margin-bottom: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.pomodoro-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 入口分组 */
.pomodoro-entry-group {
  margin-bottom: 1.5rem;
}

.entry-group-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #667eea;
  padding: 0.5rem 0.75rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  margin-bottom: 0.8rem;
  display: inline-block;
}

.entry-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.entry-content {
  flex: 1;
}

.entry-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.2rem;
}

.entry-summary {
  font-size: 0.75rem;
  color: var(--text-light);
  line-height: 1.3;
}

.entry-arrow {
  font-size: 1.3rem;
  color: var(--text-light);
}

/* 设置入口 */
.settings-entry {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 0.9rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  margin-bottom: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.settings-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
}

/* 通知设置样式 */
.settings-section {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.section-title {
  margin: 0 0 0.8rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.setting-checkbox input[type="checkbox"] {
  display: none;
}

.checkbox-visual {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  margin-top: 0.2rem;
}

.setting-checkbox input:checked + .checkbox-visual {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.setting-checkbox input:checked + .checkbox-visual::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.setting-text {
  flex: 1;
}

.setting-text strong {
  display: block;
  font-size: 0.9rem;
  color: #1f2937;
  margin-bottom: 0.2rem;
}

.setting-label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.time-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

.time-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.setting-desc {
  margin: 0.5rem 0 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

/* 弹窗表单样式 */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-dark);
}

.form-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.verification-row {
  display: flex;
  gap: 0.5rem;
}

.verification-row .input {
  flex: 1;
}

.bound-phone-display {
  text-align: center;
  padding: 2rem 1rem;
}

.phone-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.phone-hint {
  font-size: 0.85rem;
  color: var(--text-light);
}

.bind-hint {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-top: 0.5rem;
}

/* 等级徽章 */
.level-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: white;
}

.level-badge-icon {
  font-size: 3rem;
}

.badge-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.badge-desc {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* 趋势图 */
.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 180px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  gap: 0.5rem;
}

.trend-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.trend-bar {
  width: 100%;
  min-height: 20px;
  background: linear-gradient(to top, var(--primary-color), rgba(102, 126, 234, 0.6));
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: all 0.3s;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.3rem;
}

.trend-bar:hover {
  background: linear-gradient(to top, #5568d3, var(--primary-color));
}

.trend-value {
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.trend-label {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-light);
  text-align: center;
}

/* 分类占比条 */
.category-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.category-bar-value {
  font-weight: 600;
  color: var(--primary-color);
}

.category-bar-bg {
  height: 24px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
}

.category-bar-fill.work {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.category-bar-fill.study {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

.category-bar-fill.life {
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

/* 今日专注统计 */
.today-focus-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.focus-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.15);
  padding: 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.focus-icon {
  font-size: 32px;
  line-height: 1;
}

.focus-data {
  flex: 1;
}

.focus-value {
  font-size: 24px;
  font-weight: bold;
  color: white;
  line-height: 1.2;
}

.focus-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

/* 番茄统计详情弹窗 */
.pomodoro-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.overview-item {
  text-align: center;
  padding: 1rem;
  border-radius: 10px;
  transition: all 0.3s;
}

.overview-item:hover {
  transform: translateY(-2px);
}

.overview-item.earned {
  background: rgba(76, 175, 80, 0.1);
}

.overview-item.pending {
  background: rgba(255, 152, 0, 0.1);
}

.overview-item.lost {
  background: rgba(244, 67, 54, 0.1);
}

.overview-item.total {
  background: rgba(102, 126, 234, 0.15);
}

.overview-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.overview-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.overview-item.earned .overview-value {
  color: #4caf50;
}

.overview-item.pending .overview-value {
  color: #ff9800;
}

.overview-item.lost .overview-value {
  color: #f44336;
}

.overview-item.total .overview-value {
  color: var(--primary-color);
}

.overview-label {
  font-size: 0.75rem;
  color: var(--text-light);
}

.stats-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-dark);
}

/* 侧边栏/详情页内的统计网格 - 保持3列 */
.detail-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stats-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  transition: all 0.3s;
}

.stats-card:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.stats-icon {
  font-size: 1.8rem;
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.2rem;
}

.stats-label {
  font-size: 0.8rem;
  color: var(--text-light);
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.achievement-card {
  text-align: center;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 12px;
  transition: all 0.3s;
}

.achievement-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.2);
}

.achievement-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.achievement-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.3rem;
}

.achievement-label {
  font-size: 0.85rem;
  color: var(--text-light);
  font-weight: 500;
}

.profile-form {
  padding: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 支持与联系区域 */
/* 数据导出区域 */
.export-section {
  margin-top: 1rem;
  padding: 0.8rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 12px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  text-align: center;
}

.backup-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.8rem;
  background: rgba(255, 193, 7, 0.15);
  border: 2px solid rgba(255, 193, 7, 0.5);
  border-radius: 8px;
  margin-bottom: 0.8rem;
  text-align: left;
}

.warning-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.warning-text {
  font-size: 0.7rem;
  color: #333;
  line-height: 1.4;
}

.warning-text strong {
  color: #d32f2f;
}

.export-title {
  margin: 0 0 0.8rem 0;
  font-size: 0.85rem;
  color: var(--text-dark);
  font-weight: 600;
}

.export-desc {
  margin: 0 0 0.8rem 0;
  font-size: 0.7rem;
  color: var(--text-light);
  line-height: 1.3;
}

/* 备份分组 */
.backup-group {
  margin-bottom: 1rem;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.backup-group.danger-group {
  background: rgba(244, 67, 54, 0.05);
  border-color: rgba(244, 67, 54, 0.3);
}

.backup-group.info-group {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.3);
}

.group-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.4rem;
  text-align: left;
}

.group-desc {
  font-size: 0.7rem;
  color: #666;
  margin-bottom: 0.6rem;
  text-align: left;
  line-height: 1.4;
}

.warning-text-small {
  color: #d32f2f;
  font-weight: 500;
}

.data-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  width: 100%;
}

.data-buttons .btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 0.3rem;
  min-height: 60px;
}

.data-buttons .export-icon {
  font-size: 1.5rem;
  margin-bottom: 0.2rem;
}

.data-buttons .btn-text {
  font-size: 0.7rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  color: white;
  font-weight: 600;
}

/* 按钮颜色 */
.btn-backup-full {
  background: linear-gradient(135deg, #4caf50, #45a049);
}

.btn-backup-full:hover {
  background: linear-gradient(135deg, #45a049, #3d8b40);
}

/* 备份列表样式 */
.backup-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.backup-date {
  font-size: 0.75rem;
  color: #666;
}

.btn-restore-small {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-restore-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(138, 43, 226, 0.3);
}

.backup-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-delete-small {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-small:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

/* 导入预览弹窗 */
.import-preview-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.import-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.summary-item.success {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
}

.summary-item.warning {
  background: rgba(255, 152, 0, 0.1);
  border-color: rgba(255, 152, 0, 0.3);
}

.summary-item.error {
  background: rgba(244, 67, 54, 0.1);
  border-color: rgba(244, 67, 54, 0.3);
}

.summary-icon {
  font-size: 1.5rem;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

.import-details {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section.collapsed {
  opacity: 0.7;
}

.collapse-hint {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
  padding: 0.5rem;
  background: #f9f9f9;
  border-radius: 6px;
  text-align: center;
}

.detail-section h4 {
  font-size: 0.9rem;
  margin: 0 0 0.75rem 0;
  color: #333;
}

.task-preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #4caf50;
}

.task-preview-item.duplicate {
  border-left-color: #ff9800;
  opacity: 0.7;
}

.task-preview-item.error {
  border-left-color: #f44336;
  opacity: 0.7;
  flex-direction: column;
  align-items: flex-start;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}

.error-row {
  font-size: 0.75rem;
  font-weight: 600;
  color: #f44336;
}

.error-reason {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

.task-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.task-meta {
  font-size: 0.75rem;
  color: #666;
}

.more-hint {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #999;
}

.import-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.import-actions .btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.import-actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-restore-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(138, 43, 226, 0.3);
}

.btn-restore, .btn-backup, .btn-export, .btn-import, .btn-template, .btn-clear-all {

  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  justify-content: center;
}

.btn-import {
  background: linear-gradient(135deg, #10b981, #059669);
}

.btn-template {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.btn-clear-all {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.btn-clear-all:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-export:hover, .btn-import:hover, .btn-template:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-import:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-template:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-export:active, .btn-import:active, .btn-template:active {
  transform: translateY(0);
}

.export-icon {
  font-size: 1.2rem;
}

/* 支持与联系区域 */
/* 联系与支持入口 */
.support-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
  border-radius: 12px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px dashed rgba(255, 193, 7, 0.3);
}

.support-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
}

.support-desc {
  margin: 0 0 1rem 0;
  font-size: 0.75rem;
  color: var(--text-light);
  text-align: center;
  line-height: 1.5;
  word-break: break-word;
}

.qr-codes {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0;
}

.qr-item {
  text-align: center;
  flex: 1;
}

.qr-image {
  width: 100%;
  max-width: 160px;
  height: auto;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
  padding: 4px;
}

.qr-label {
  margin: 0.3rem 0 0 0;
  font-size: 0.8rem;
  color: var(--text-dark);
  font-weight: 600;
}

.contact-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.contact-icon {
  font-size: 1rem;
}

.contact-text {
  font-size: 0.8rem;
  color: var(--text-dark);
  font-weight: 600;
}

.app-footer {
  text-align: center;
  padding: 1rem 0 0 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.app-version {
  margin: 0 0 0.3rem 0;
  font-size: 0.85rem;
  color: var(--text-dark);
  font-weight: 600;
}

.copyright {
  margin: 0 0 0.3rem 0;
  font-size: 0.7rem;
  color: var(--text-light);
}

.footer-links {
  margin: 0;
  font-size: 0.7rem;
  color: var(--text-light);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10002;
  backdrop-filter: blur(8px);
}

/* Bottom Sheet 样式 */
.bottom-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: stretch;
  animation: fadeIn 0.2s ease;
}

.bottom-sheet {
  background: white;
  width: 100%;
  margin: 0;
  padding: 0;
  max-height: 75vh;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.bottom-sheet-header {
  position: relative;
  padding: 1rem 0.8rem 0.8rem;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: #d0d0d0;
  border-radius: 2px;
  margin: 0 auto 0.8rem;
}

.bottom-sheet-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.bottom-sheet-header .close-btn {
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
}

.bottom-sheet-body {
  overflow-y: auto;
  padding: 0.8rem;
  flex: 1;
}

.detail-section {
  margin-bottom: 1.5rem;
}

/* 番茄钟历史记录 */
.pomodoro-history {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px;
  border-radius: 12px;
}

.pomodoro-history .section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.history-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.summary-item {
  font-size: 13px;
  color: #666;
}

.summary-item strong {
  color: #667eea;
  font-size: 16px;
  margin-right: 4px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.history-icon {
  font-size: 20px;
  line-height: 1;
}

.history-content {
  flex: 1;
}

.history-time {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.history-duration {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.history-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4caf50;
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
}

/* 任务详情优化样式 */
.detail-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.status-badge.status-completed {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
}

.status-badge.status-pending {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
}

.status-badge.status-overdue {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.detail-title-large {
  font-size: 1.4rem;
  font-weight: 700;
  color: #222;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.detail-description-large {
  color: #666;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.9rem;
}

/* 信息卡片 */
.detail-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  background: white;
  border: 2px solid #e0e0e0;
  transition: all 0.2s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 0.7rem;
  color: #999;
  margin-bottom: 0.2rem;
}

.card-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.info-card.card-priority.priority-high {
  border-color: #f44336;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
}

.info-card.card-priority.priority-medium {
  border-color: #ff9800;
  background: linear-gradient(135deg, #fff8f0 0%, #ffedd5 100%);
}

.info-card.card-priority.priority-low {
  border-color: #2196f3;
  background: linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%);
}

.info-card.card-category.category-work {
  border-color: #9c27b0;
  background: linear-gradient(135deg, #f8f0ff 0%, #f3e5f5 100%);
}

.info-card.card-category.category-study {
  border-color: #2196f3;
  background: linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%);
}

.info-card.card-category.category-life {
  border-color: #4caf50;
  background: linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%);
}

/* 时间轴增强 */
.timeline-section {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.section-title-new {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 1rem 0;
}

.timeline-enhanced {
  position: relative;
}

.timeline-item-enhanced {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.timeline-item-enhanced:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: 3px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  z-index: 2;
}

.timeline-dot.dot-success {
  border-color: #4caf50;
  background: #e8f5e9;
}

.timeline-dot.dot-danger {
  border-color: #f44336;
  background: #ffebee;
}

.timeline-line {
  position: absolute;
  left: 17px;
  top: 36px;
  bottom: -24px;
  width: 2px;
  background: #e0e0e0;
}

.timeline-line.line-success {
  background: #4caf50;
}

.timeline-line.line-danger {
  background: #f44336;
}

.timeline-item-enhanced:last-child .timeline-line {
  display: none;
}

.timeline-content-enhanced {
  flex: 1;
  padding-top: 0.3rem;
}

.timeline-label-new {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.2rem;
}

.timeline-value-new {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

/* 底部按钮增强 */
.detail-actions-enhanced {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-action {
  padding: 0.75rem;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
}

.btn-complete {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  grid-column: span 3;
}

.btn-uncomplete {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  grid-column: span 3;
}

.btn-edit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-delete {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-action:active {
  transform: translateY(0);
}

.detail-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.detail-description {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* 时间轴样式 */
.timeline {
  position: relative;
  padding-left: 2.5rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #e0e0e0, #f5f5f5);
}

.timeline-item {
  position: relative;
  margin-bottom: 1.2rem;
  display: flex;
  align-items: flex-start;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-icon {
  position: absolute;
  left: -1.8rem;
  width: 1.5rem;
  height: 1.5rem;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  box-shadow: 0 0 0 2px #f5f5f5;
}

.timeline-content {
  flex: 1;
}

.timeline-label {
  font-size: 0.7rem;
  color: #999;
  margin-bottom: 0.2rem;
}

.timeline-value {
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
}

/* 属性列表 */
.attributes {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
}

.attr-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  border-bottom: 1px solid #e9ecef;
}

.attr-item:last-child {
  border-bottom: none;
}

.attr-label {
  font-size: 0.75rem;
  color: #666;
}

.attr-value {
  font-size: 0.75rem;
}

.attr-value.badge {
  font-size: 0.75rem;
}

/* 操作按钮 */
.detail-actions {
  margin-top: 1rem;
}

.detail-actions .btn {
  width: 100%;
  padding: 0.9rem;
  font-size: 1rem;
  border-radius: 12px;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-content {
  padding: 1.2rem;
  width: 96%;
  max-width: 650px;
  max-height: 80vh;
  overflow-y: auto;
}

/* v1.5.6: 筛选弹窗 - 极致空间利用，边距压缩至极限 */
/* 设置类 Bottom Sheet（修改密码、绑定手机号） */
.settings-bottom-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.settings-bottom-sheet .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.settings-bottom-sheet .modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.settings-bottom-sheet .modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
}

.settings-bottom-sheet .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* 联系与支持 Bottom Sheet */
.support-bottom-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.support-bottom-sheet .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.support-bottom-sheet .modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.support-bottom-sheet .modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
}

.support-bottom-sheet .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* 番茄钟统计 Bottom Sheet */
.stats-bottom-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.stats-bottom-sheet .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.stats-bottom-sheet .modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.stats-bottom-sheet .modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
}

.stats-bottom-sheet .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* 数据报告 Bottom Sheet */
.report-bottom-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.report-bottom-sheet .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.report-bottom-sheet .modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.report-bottom-sheet .modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  text-align: center;
}

.report-bottom-sheet .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* 筛选 Bottom Sheet */
.filter-bottom-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.filter-bottom-sheet .modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.filter-bottom-sheet .modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.filter-bottom-sheet .modal-header h3 {
  margin: 0;
  padding-top: 0.5rem;
}

.filter-bottom-sheet .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.filter-bottom-sheet .modal-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.filter-modal {
  max-width: 600px; /* 放宽上限 */
  width: 98%;      /* 进一步贴合屏幕边缘 */
  background: white;
  border-radius: 12px;
  padding: 0 !important;
}

.filter-body {
  padding: 1rem 0.6rem; /* 从1.5rem减至1rem */
}

.filter-section {
  margin-bottom: 1rem; /* 从1.8rem减至1rem，压缩44% */
  padding-bottom: 0.8rem; /* 从1.5rem减至0.8rem */
  border-bottom: 1px solid #f0f0f0;
  width: 100%;
}

.filter-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.filter-label {
  display: block;
  font-size: 0.85rem; /* 从0.9rem减至0.85rem */
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem; /* 从0.8rem减至0.5rem，收紧标题距离 */
}

/* 合并行布局 */
.filter-row-combined {
  display: flex;
  gap: 1rem; /* 从1.5rem减至1rem */
  align-items: flex-start;
}

.filter-group-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* 从0.6rem减至0.5rem */
}

.filter-label-inline {
  font-size: 0.85rem; /* 从0.9rem减至0.85rem */
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.filter-buttons-inline {
  display: flex;
  gap: 0.4rem; /* 从0.5rem减至0.4rem */
  flex-wrap: wrap;
}

/* 日期范围 - 撑满宽度并实现左右完美对齐 */
.date-range-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* 从0.6rem减至0.5rem */
  width: 100%;
}

.date-input-box {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 2px solid #d0d0d0;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #999;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  background: #fafafa;
}

.date-input-box.has-value {
  color: #333;
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  font-weight: 500;
}

.date-input-box:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.03);
}

/* 内联日期按钮 */
.date-btn-inline {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  color: #1f2937;
}

.date-btn-inline:hover {
  background: #f9fafb;
  border-color: #8b5cf6;
}

.date-separator {
  color: #999;
  font-size: 0.8rem;
  font-weight: 500;
  flex-shrink: 0;
}

/* 分类/优先级按钮 - 彻底实现横向自适应平铺 */
.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem; /* 从0.8rem减至0.6rem */
  width: 100%;
}

.filter-chip {
  flex: 1;
  min-width: calc(25% - 0.6rem); /* 调整为新的gap */
  padding: 0.25rem 0.4rem; /* 从0.3rem 0.5rem减至0.25rem 0.4rem，更扁平 */
  border: 2px solid #d0d0d0;
  background: #fafafa;
  border-radius: 10px; /* 从12px减至10px */
  font-size: 0.85rem; /* 从0.9rem减至0.85rem */
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: center;
  gap: 0.15rem; /* 从0.1rem增至0.15rem，数字和文字间距4px */
  box-sizing: border-box;
  min-height: 42px; /* 从52px减至42px，压缩19% */
}

/* 针对分类（4个按钮：全部+3个分类）和优先级（4个按钮：全部+3个优先级）的特殊处理 */
@media (max-width: 480px) {
  .filter-chip {
    min-width: calc(50% - 0.6rem);
  }
}

.filter-chip .chip-label {
  font-weight: 600;
  color: #888;
  font-size: 0.75rem; /* 从0.8rem减至0.75rem */
  letter-spacing: 0.3px;
  line-height: 1;
}

.filter-chip .chip-count {
  font-weight: 800;
  font-size: 1.1rem; /* 从1.25rem减至1.1rem */
  color: #333;
  line-height: 1;
}

.filter-chip:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.filter-chip.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.filter-chip.active .chip-label,
.filter-chip.active .chip-count {
  color: white;
}

.filter-chip.priority-high.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.35);
}

.filter-chip.priority-medium.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.35);
}

.filter-chip.priority-low.active {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.35);
}

/* 快捷场景按钮 */
.scene-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
}

.scene-btn {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.scene-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.scene-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 紧凑布局 */
.filter-section-compact {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
}

.filter-label-inline {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  min-width: 60px;
}

.search-input-wrapper-inline {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-buttons-inline {
  flex: 1;
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

/* 时间维度选择器 */
.time-dimension-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.dimension-select {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 2px solid #d0d0d0;
  border-radius: 10px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.dimension-select:hover {
  border-color: #667eea;
}

.dimension-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dimension-hint {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.75rem;
  padding: 0.4rem 0.6rem;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

/* 快捷日期区域 */
.quick-date-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.quick-date-label {
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  min-width: 50px;
}

.quick-date-buttons {
  flex: 1;
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.quick-date-btn {
  padding: 0.35rem 0.7rem;
  border-radius: 16px;
  border: 1px solid #ddd;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-date-btn:hover {
  background: #667eea;
  color: white;
  border-color: transparent;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 自定义范围 */
.custom-date-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 筛选结果提示 */
.filter-result-hint {
  padding: 0.75rem;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0e8ff 100%);
  border-radius: 8px;
  border-left: 4px solid #667eea;
  margin-top: 0.5rem;
}

.filter-result-main {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.filter-result-count {
  font-weight: 700;
  color: #667eea;
  font-size: 1.1rem;
}

.filter-result-detail {
  font-size: 0.75rem;
  color: #666;
  line-height: 1.4;
}

/* 新标签样式 - 水平布局 */
.filter-chip-tag {
  flex-direction: row !important;
  justify-content: flex-start !important;
  gap: 0.4rem !important;
  padding: 0.45rem 0.6rem !important;
  overflow: hidden;
}

.chip-label-main {
  font-weight: 600;
  color: #333;
  font-size: 0.8rem;
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-count-badge {
  font-weight: 400;
  font-size: 0.7rem;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.filter-chip-tag.active .chip-label-main,
.filter-chip-tag.active .chip-count-badge {
  color: white;
}

.filter-chip-tag.active .chip-count-badge {
  background: rgba(255, 255, 255, 0.25);
}

/* 优先级颜色点 */
.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-high {
  background: #f5576c;
}

.dot-medium {
  background: #4facfe;
}

.dot-low {
  background: #43e97b;
}

/* 快捷日期按钮 */
.time-dimension-buttons {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.dimension-btn {
  flex: 1;
  padding: 0.5rem 0.8rem;
  border: 2px solid #d0d0d0;
  background: #fafafa;
  border-radius: 18px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.dimension-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

.dimension-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.quick-date-buttons {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.quick-date-btn {
  flex: 1;
  padding: 0.5rem 0.8rem;
  border: 2px solid #d0d0d0;
  background: #fafafa;
  border-radius: 18px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-date-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

.quick-date-btn:active {
  transform: scale(0.95);
}

/* 搜索框 - 撑满宽度 */
.search-input-wrapper {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  width: 100%;
}

.search-input-modal {
  flex: 1;
  padding: 0.6rem 0.8rem; /* 从0.8rem 1rem减至0.6rem 0.8rem */
  border: 2px solid #d0d0d0;
  border-radius: 10px;
  font-size: 0.85rem; /* 从0.9rem减至0.85rem */
  transition: all 0.3s;
  background: #fafafa;
  color: #333;
  width: 100%;
}

.search-input-modal::placeholder {
  color: #999;
}

.search-input-modal:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-btn-small {
  padding: 0.4rem 0.8rem; /* 从0.5rem 1rem减至0.4rem 0.8rem */
  background: #e8e8e8;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem; /* 从0.85rem减至0.8rem */
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.clear-btn-small:hover {
  background: #e0e0e0;
  color: #333;
}

/* 底部按钮 - 极致压缩左右padding */
.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0;
  padding: 1.2rem 0.6rem;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 0 0 12px 12px;
}

.btn-reset {
  flex: 1;
  padding: 0.8rem 1.5rem;
  background: white;
  color: #666;
  border: 2px solid #d0d0d0;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-reset:hover {
  background: #f5f5f5;
  border-color: #999;
  color: #333;
}

.btn-confirm {
  flex: 1;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.btn-confirm:active,
.btn-reset:active {
  transform: scale(0.98);
}

/* 个人主页 Bottom Sheet */
.profile-bottom-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.profile-bottom-sheet .modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-bottom-sheet .modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.profile-bottom-sheet .modal-header h3 {
  margin: 0;
  padding-top: 0.5rem;
}

.profile-bottom-sheet .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.profile-modal {
  max-width: 96%;
  width: 96%;
  padding: 1rem;
}

.profile-modal .modal-body {
  padding: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  border-bottom: 1px solid #eee;
  padding: 1rem 0.6rem; /* 极致压缩左右内边距 */
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
}

.back-btn {
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0 1rem;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.trash-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f5f5f5;
}

.trash-info {
  display: flex;
  flex-direction: column;
}

.trash-title {
  font-weight: 600;
}

.trash-meta {
  font-size: 0.85rem;
  color: #888;
}

.trash-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-success {
  background-color: var(--success-color);
  color: white;
}

.btn-info {
  background-color: var(--primary-color);
  color: white;
  opacity: 0.9;
}

.btn-info:hover {
  opacity: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--text-light);
  text-align: center;
}

/* 编辑弹窗样式优化 */
/* 编辑弹窗改为Bottom Sheet */
.edit-bottom-sheet {
  max-height: 92vh;
  overflow-y: auto;
}

.edit-sheet-body {
  padding: 0 0.8rem 1.5rem 0.8rem;
}

/* 编辑弹窗宽度优化 */
.edit-modal-wide {
  max-width: 96% !important;
  width: 96% !important;
  padding: 1.5rem !important;
  margin: 0 2%;
}

.edit-modal-body {
  padding: 0.5rem 0;
}

.edit-section {
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 10px;
}

/* 日志预览区域 */
.logs-preview-section {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

/* 时间轴区域 */
.timeline-section {
  background: white;
  border: 1px solid #e0e0e0;
}

.timeline-container {
  display: flex;
  align-items: center;
  padding: 2rem 1rem;
  overflow-x: auto;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  flex: 1;
}

.timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.timeline-dot.created {
  background: #2196f3;
}

.timeline-dot.normal {
  background: #4caf50;
}

.timeline-dot.warning {
  background: #ff9800;
}

.timeline-dot.urgent {
  background: #f44336;
}

.timeline-dot.overdue {
  background: #9e9e9e;
}

.timeline-dot.completed {
  background: #4caf50;
}

.timeline-content {
  text-align: center;
}

.timeline-label {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.timeline-value {
  font-size: 0.9rem;
  color: #333;
  font-weight: 700;
}

.timeline-line {
  flex: 1;
  height: 3px;
  background: linear-gradient(to right, #2196f3, #4caf50);
  margin: 0 1rem;
  min-width: 50px;
  align-self: flex-start;
  margin-top: 10px;
  border-radius: 2px;
}

.timeline-line.completed {
  background: #4caf50;
}

/* 日志完整列表 */
.logs-full-section {
  background: #f8f9fa;
}

.empty-logs-mini {
  text-align: center;
  padding: 1.5rem;
  color: #999;
}

.empty-logs-mini p {
  margin: 0.5rem 0;
}

.hint-mini {
  font-size: 0.85rem;
}

.logs-full-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.log-full-item {
  background: white;
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid #667eea;
}

.log-full-item.log-start { border-left-color: #4caf50; }
.log-full-item.log-progress { border-left-color: #2196f3; }
.log-full-item.log-block { border-left-color: #f44336; }
.log-full-item.log-solution { border-left-color: #ff9800; }
.log-full-item.log-milestone { border-left-color: #9c27b0; }
.log-full-item.log-complete { 
  border-left-color: #4caf50;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.log-full-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.log-type-full {
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
  flex: 1;
}

.progress-inline {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #667eea;
  font-weight: 500;
}

.log-time-full {
  font-size: 0.75rem;
  color: #999;
}

.log-delete-btn-mini {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.log-delete-btn-mini:hover {
  opacity: 1;
}

.log-content-textarea-mini {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  max-height: 300px;
  overflow-y: auto;
  transition: border-color 0.2s;
  line-height: 1.5;
}

.log-content-textarea-mini:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.log-content-full {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
  white-space: pre-wrap;
  margin-bottom: 0.5rem;
}

.log-meta-full {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.log-tag-inline {
  display: inline-block;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

.meta-item-full {
  font-size: 0.75rem;
  color: #666;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.log-tags-full {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.log-tag-full {
  background: #e3f2fd;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-add-log-inline {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-log-inline:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.logs-preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.log-preview-item {
  background: white;
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid #667eea;
}

.log-preview-item.log-start { border-left-color: #4caf50; }
.log-preview-item.log-progress { border-left-color: #2196f3; }
.log-preview-item.log-block { border-left-color: #f44336; }
.log-preview-item.log-solution { border-left-color: #ff9800; }
.log-preview-item.log-milestone { border-left-color: #9c27b0; }
.log-preview-item.log-complete { border-left-color: #4caf50; }

.log-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.log-type-mini {
  font-size: 0.85rem;
  font-weight: 600;
}

.log-time-mini {
  font-size: 0.75rem;
  color: #999;
}

.log-content-mini {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

.btn-view-all-logs {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view-all-logs:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 统计迷你区域 */
.stats-mini-section {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.stats-mini-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.stat-mini-item {
  background: white;
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
}

.stat-mini-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.stat-mini-label {
  display: block;
  font-size: 0.75rem;
  color: #666;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.edit-field {
  margin-bottom: 1rem;
  position: relative;
}

.edit-field:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  color: #555;
}

.edit-input,
.edit-textarea,
.edit-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
  background: white;
}

.edit-input:focus,
.edit-textarea:focus,
.edit-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.edit-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
  font-family: inherit;
}

.char-count {
  position: absolute;
  right: 8px;
  bottom: -20px;
  font-size: 0.7rem;
  color: #999;
}

.edit-row {
  display: flex;
  gap: 1rem;
}

.edit-field-half {
  flex: 1;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  min-width: 100px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}

.btn-save {
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.edit-field label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-dark);
}

.task-name-static {
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}

.textarea {
  width: 100%;
  resize: vertical;
  min-height: 120px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-secondary {
  background-color: #e9ecef;
  color: #495057;
}

.btn-secondary:hover {
  background-color: #dee2e6;
}

/* v1.5.6: 两行布局添加表单 - 完全扁平化 */
.add-form-two-row {
  margin-top: 0;
  margin-bottom: 0.2rem !important; /* 与统计区域间距一致 */
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
}

/* 🆕 统一输入框样式 */
.add-form-unified {
  margin-top: 2px;
  margin-bottom: 2px !important;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
}

.unified-input-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 2px;
}

.quick-task-input {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: inherit;
}

/* 占位符样式 */
.quick-task-input::placeholder {
  color: #999;
  font-size: 0.85rem;
}

/* 有描述时的样式（三个点提示） */
.quick-task-input.has-description {
  color: #667eea;
  font-weight: 500;
}

.quick-task-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.quick-buttons {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.quick-buttons button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-buttons button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.quick-buttons button:active:not(:disabled) {
  transform: scale(0.95);
}

/* 第一行：主输入区 - 去掉外层卡片，让输入框直接呼吸 */
.add-form-row-main {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.btn-ai-assist,
.btn-camera {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-ai-assist:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ai-assist:hover:not(:disabled),
.btn-camera:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-ai-assist:active:not(:disabled),
.btn-camera:active {
  transform: scale(0.95);
}

/* AI 建议气泡 */
.ai-suggestion-bubble {
  background: linear-gradient(135deg, #fff5e6 0%, #ffe6f0 100%);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 0.75rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.suggestion-icon {
  font-size: 1.2rem;
}

.suggestion-text {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.suggestion-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-apply,
.btn-dismiss {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.btn-apply {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-apply:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-dismiss {
  background: #f0f0f0;
  color: #666;
}

.btn-dismiss:hover {
  background: #e0e0e0;
}

/* 🌳 子任务自动识别建议气泡 */
.subtask-suggestion-bubble {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border: 2px solid #40a9ff;
  border-radius: 12px;
  padding: 0.75rem;
  margin-top: 0.5rem;
  animation: slideDown 0.3s ease-out;
}

.subtask-preview {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.subtask-preview-item {
  font-size: 0.8rem;
  color: #555;
  padding: 0.25rem 0;
  line-height: 1.4;
}

.subtask-more {
  font-size: 0.75rem;
  color: #999;
  font-style: italic;
  margin-top: 0.25rem;
}

.subtask-tip {
  font-size: 0.75rem;
  color: #666;
  padding: 0.5rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 6px;
  margin-top: 0.5rem;
  line-height: 1.4;
}

/* 描述框带 AI 按钮 */
.textarea-with-ai {
  position: relative;
  width: 100%;
  flex: 1;
}

.btn-ai-desc,
.btn-fullscreen-desc {
  position: absolute;
  bottom: 0.5rem;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-ai-desc {
  right: 3rem;
}

.btn-fullscreen-desc {
  right: 0.5rem;
  font-size: 1.2rem;
}

.btn-ai-desc:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ai-desc:hover:not(:disabled),
.btn-fullscreen-desc:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 全屏描述编辑 */
.fullscreen-desc-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  z-index: 10002;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px); /* iOS刘海屏适配 */
  overflow: hidden; /* 关键：防止整体滚动 */
}

.fullscreen-desc-header {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-bottom: 0.5px solid #e8e8e8;
  flex-shrink: 0;
  margin-top: env(safe-area-inset-top, 20px);
}

/* 顶层：导航栏 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 1rem;
}

.nav-btn-text {
  background: transparent;
  border: none;
  color: #007aff;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  padding: 0;
  min-width: 50px;
  text-align: left;
}

.nav-btn-text:active {
  opacity: 0.4;
}

.task-name-center {
  font-size: 17px;
  font-weight: 600;
  color: #000;
  text-align: center;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 1rem;
}

.task-name-left {
  flex: 1;
  padding: 0 1rem;
}

.task-name-input {
  width: 100%;
  font-size: 17px;
  font-weight: 600;
  color: #000;
  text-align: left;
  border: none;
  background: transparent;
  outline: none;
  padding: 0;
}

.task-name-input::placeholder {
  color: #999;
  font-weight: 500;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-btn-primary {
  background: transparent;
  border: none;
  color: #007aff;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  min-width: 50px;
  text-align: right;
}

.nav-btn-secondary {
  background: transparent;
  border: none;
  color: #666;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  min-width: 50px;
  text-align: right;
}

.nav-btn-primary:active,
.nav-btn-secondary:active {
  opacity: 0.4;
}

/* 🆕 任务标题显示区（固定，不可编辑） */
.task-title-display {
  padding: 1rem 1.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #000;
  text-align: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-bottom: 1px solid #f0f0f0;
}

/* 中层：状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: transparent;
}

.status-left {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* 🆕 Markdown 切换按钮 */
.markdown-toggle-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.markdown-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.markdown-toggle-btn:active {
  transform: translateY(0);
}

.markdown-toggle-btn.active {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.status-right {
  display: flex;
  align-items: center;
}

.status-text {
  font-size: 12px;
  color: #8e8e93;
  font-weight: 400;
}

/* 输入区包装器 */
.input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 关键：允许flex子元素滚动 */
  overflow: hidden; /* 防止wrapper本身滚动 */
}

/* 🆕 Markdown 预览容器 */
.markdown-preview-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  background: #ffffff;
  min-height: 0; /* 关键：允许flex子元素滚动 */
  -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
}

/* 悬浮提示标签 */
.floating-hint {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 12px;
  color: #ff9500;
  background: rgba(255, 149, 0, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
  z-index: 1;
  pointer-events: none;
}

/* AI 智能建议卡片 */
.ai-suggestions-card {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  z-index: 2;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.btn-close-suggestions {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem 0;
}

.suggestions-list li {
  color: white;
  font-size: 13px;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  line-height: 1.4;
}

.suggestions-list li:last-child {
  border-bottom: none;
}

.suggestions-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-adopt,
.btn-ignore {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-adopt {
  background: white;
  color: #667eea;
}

.btn-adopt:active {
  transform: scale(0.95);
}

.btn-ignore {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-ignore:active {
  transform: scale(0.95);
}

/* 剪贴板历史选择器 */
.clipboard-history-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 60%;
  background: white;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

/* AI 功能菜单 */
.ai-menu-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70%;
  background: white;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.btn-close-menu {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: #f8f8f8;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.menu-item:active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scale(0.98);
}

.menu-item:active .menu-icon,
.menu-item:active .menu-title,
.menu-item:active .menu-desc {
  color: white;
}

.menu-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-item:disabled:active {
  background: #f8f8f8;
  transform: none;
}

.menu-icon {
  font-size: 24px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.menu-content {
  flex: 1;
}

.menu-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.menu-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.3;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 15px;
}

.history-tip {
  padding: 0.5rem 1rem;
  font-size: 12px;
  color: #999;
  background: #f8f8f8;
  text-align: center;
}

.btn-close-history {
  background: #f0f0f0;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.history-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f8f8f8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:active {
  background: #e8e8e8;
  transform: scale(0.98);
}

.history-text {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.history-time {
  font-size: 11px;
  color: #999;
}

.history-footer {
  padding: 0.75rem;
  border-top: 1px solid #e8e8e8;
}

.btn-clear-history {
  width: 100%;
  padding: 0.6rem;
  background: #ff3b30;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-clear-history:active {
  opacity: 0.8;
}

.fullscreen-desc-textarea {
  flex: 1;
  width: 100%;
  padding: 1.5rem 1.5rem;
  border: none;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  resize: none;
  line-height: 1.6;
  background: white;
  color: #1a1a1a;
}

.fullscreen-desc-textarea:focus {
  outline: none;
}

.fullscreen-desc-textarea::placeholder {
  color: #c7c7cc;
}

/* 底部工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8f8f8;
  border-top: 0.5px solid #e8e8e8;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  overflow-x: auto;
}

.toolbar-btn {
  padding: 0.5rem 0.75rem;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.toolbar-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-input-main {
  flex: 1;
  padding: 0.5rem 1.2rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: white;
  font-size: 0.85rem;
  color: #333;
  transition: all 0.3s;
  /* 悬浮阴影 - Z轴拉高 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03);
  line-height: 1.5;
  height: 36px;
  box-sizing: border-box;
}

.task-input-main::placeholder {
  color: #bbb;
}

.task-input-main:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  /* 聚焦时增强悬浮感 */
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 6px 16px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

/* 任务描述输入框 */
.add-form-row-desc {
  margin-top: 0.5rem;
  padding: 0;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.task-textarea-desc {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: white;
  font-size: 0.85rem;
  color: #333;
  transition: all 0.3s;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.05);
  line-height: 1.5;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
}

.task-textarea-desc::placeholder {
  color: #bbb;
}

.task-textarea-desc:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15);
}

.btn-submit-main {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-submit-main:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.5);
}

.btn-submit-main:active {
  transform: scale(0.95);
}

/* 第二行：属性配置区 - 胶囊样式 */
.add-form-row-attrs {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.add-form-row-attrs .btn-submit-main {
  margin-left: auto;
}

.attr-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0 0.5rem;
  /* 胶囊样式 - 浅灰色背景，无边框 */
  background: rgba(0, 0, 0, 0.04);
  border: none;
  border-radius: 18px;
  transition: all 0.3s;
  box-shadow: none;
  height: 36px;
  box-sizing: border-box;
}

.attr-group:hover {
  background: rgba(102, 126, 234, 0.08);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.attr-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

/* 提醒设置区域 */
.reminder-section {
  margin-top: 0.8rem;
  padding: 0.8rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 10px;
  border: 1px dashed rgba(102, 126, 234, 0.2);
}

.reminder-toggle {
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.test-notification-btn {
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.test-notification-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
}

.test-notification-btn:active {
  transform: scale(0.95);
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  cursor: pointer;
  user-select: none;
}

.reminder-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.reminder-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.reminder-config {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
}

.reminder-time-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.reminder-time-group label {
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
}

.reminder-time-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
}

.reminder-time-input-inline {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  margin-left: 0.5rem;
}

.quick-time-buttons {
  display: inline-flex;
  gap: 0.3rem;
  margin-left: 0.5rem;
}

.quick-time-btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  border: 1px solid #9b59b6;
  background: white;
  color: #9b59b6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-time-btn:hover {
  background: #9b59b6;
  color: white;
}

.quick-time-btn:active {
  transform: scale(0.95);
}

.guide-link-btn-inline {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: 0.5rem;
}

.guide-link-btn-inline:hover {
  background: #f5f5f5;
  border-color: #999;
  transform: scale(1.05);
}

.guide-link-btn-inline:active {
  transform: scale(0.95);
}

.reminder-mode-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reminder-mode-group label {
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
}

.reminder-mode-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
}

.guide-link-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.guide-link-btn:hover {
  background: #f5f5f5;
  border-color: #999;
  transform: scale(1.05);
}

.guide-link-btn:active {
  transform: scale(0.95);
}

.attr-select {
  border: none;
  background: transparent;
  font-size: 0.85rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  outline: none;
  font-weight: 500;
}

.attr-select-date {
  min-width: 110px;
}

.attr-select-short {
  min-width: 42px;
}

/* 🆕 文件夹选择器 */
.attr-select-collection {
  min-width: 90px;
  max-width: 120px;
}

.attr-text {
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel-attr {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.95);
  color: #ef4444;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-left: auto;
}

.btn-cancel-attr:hover {
  background: white;
  border-color: #ef4444;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* 周期选择行 */
.weekday-select-row {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.weekday-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.weekday-label:hover {
  background: white;
  border-color: #667eea;
}

.weekday-label input[type="checkbox"] {
  cursor: pointer;
}

/* 旧版样式保留（兼容） */
/* 内联添加表单 */
.add-form-inline {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.input-inline {
  flex: 1.2;
  min-width: 0;
  padding: 0.4rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  box-sizing: border-box;
}

.input-inline:focus {
  outline: none;
  background: white;
  border-color: var(--primary-color);
}

.select-inline {
  padding: 0.4rem 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  cursor: pointer;
  min-width: 0;
  box-sizing: border-box;
  flex-shrink: 1;
}

.select-inline:focus {
  outline: none;
  background: white;
  border-color: var(--primary-color);
}

.date-picker-inline {
  padding: 0.4rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  cursor: pointer;
  min-width: 80px;
  text-align: center;
  transition: all 0.2s;
  white-space: nowrap;
}

.date-picker-inline:hover {
  background: white;
  border-color: var(--primary-color);
}

.date-picker-inline.placeholder {
  color: var(--text-light);
  opacity: 0.7;
}

.time-picker-inline {
  padding: 0.4rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  cursor: pointer;
  min-width: 70px;
  text-align: center;
  transition: all 0.2s;
  white-space: nowrap;
}

.time-picker-inline:hover {
  background: white;
  border-color: var(--primary-color);
}

.time-picker-inline.placeholder {
  color: var(--text-light);
}

/* 报告Hero Section样式 */
.report-hero {
  text-align: center;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 2rem;
}

.hero-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0 auto 1.5rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.hero-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 0;
}

.executive-summary-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.executive-summary-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: pulse 8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.summary-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
}

.summary-text-hero {
  font-size: 1.05rem;
  line-height: 1.8;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

.hero-stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.hero-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}

.hero-stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.hero-stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'DIN Alternate', 'Roboto Mono', monospace;
  margin-bottom: 0.3rem;
}

.hero-stat-label {
  font-size: 0.9rem;
  color: #666;
}

.report-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
}

.energy-allocation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
}

.energy-chart {
  min-height: 280px;
}

.energy-insight {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
}

.insight-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: #667eea;
  color: white;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.insight-text-large {
  font-size: 0.95rem;
  line-height: 1.8;
  color: #333;
}

/* 年度习惯进度条卡片 */
.habits-hall-of-fame {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.habit-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
  border-radius: 12px;
  border-left: 4px solid #667eea;
  transition: all 0.3s;
}

.habit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.15);
}

.habit-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.habit-rank-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.habit-rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

.habit-rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
}

.habit-rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #e6a85c 100%);
}

.habit-info {
  flex: 1;
}

.habit-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
}

.habit-category {
  font-size: 0.85rem;
  color: #666;
}

.habit-flame {
  font-size: 2rem;
  animation: flame 1.5s ease-in-out infinite;
}

@keyframes flame {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.habit-progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.8rem;
}

.habit-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  transition: width 1s ease-out;
}

.habit-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.insight-text-large {
  font-size: 0.95rem;
  line-height: 1.8;
  color: #333;
  margin: 0;
}

.time-picker-inline.placeholder {
  color: var(--text-light);
  opacity: 0.7;
}

.btn-inline {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.btn-add {
  background: var(--success-color);
  color: white;
}

.btn-add:hover {
  transform: scale(1.1);
}

.btn-cancel {
  background: #e9ecef;
  color: #666;
}

.btn-cancel:hover {
  background: #dee2e6;
}

.weekday-select-inline {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.weekday-select-inline .weekday-checkbox-item {
  padding: 0.3rem 0.6rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.8rem;
}

.weekday-select-inline .weekday-checkbox-item:has(input:checked) {
  background: var(--primary-color);
  color: white;
}

/* 悬浮添加按钮 - 已移除，改为顶部按钮 */

/* 底部抽屉 - 已移除，改为内联表单 */

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.15rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  padding: 0;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.page-btn {
  min-width: 28px;
  height: 28px;
  padding: 0;
  border: 1.5px solid var(--primary-color);
  border-radius: 50%;
  background: white;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-btn:hover:not(:disabled) {
  color: var(--secondary-color);
  transform: scale(1.1);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: var(--text-dark);
  font-weight: 600;
  min-width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.page-size-select {
  padding: 0.2rem 0.4rem;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 4px;
  background: white;
  color: var(--text-dark);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.page-size-select:hover {
  border-color: var(--primary-color);
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

.jump-input {
  width: 35px;
  padding: 0.2rem;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
}

.jump-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.jump-btn {
  padding: 0.2rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: var(--primary-color);
  color: white;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.3s;
}

.jump-btn:hover {
  background: var(--secondary-color);
}

/* 页脚版权信息 */
.app-footer {
  margin-top: 0.25rem;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.footer-content {
  text-align: center;
}

.footer-main {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.footer-links {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.3rem;
  line-height: 1.4;
}

.executive-summary {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  align-items: flex-start;
}

.executive-summary .summary-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.executive-summary .summary-content {
  flex: 1;
}

.executive-summary .summary-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  opacity: 0.9;
}

.executive-summary .summary-text {
  font-size: 0.95rem;
  line-height: 1.8;
  opacity: 0.95;
}

.footer-version {
  font-weight: 500;
  color: #666;
}

.footer-copyright {
  color: #666;
}

.footer-divider {
  color: #999;
  margin: 0 0.2rem;
}

.footer-text {
  color: #666;
}

.footer-link {
  color: #666;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s;
  border-bottom: 1px solid transparent;
}

.footer-link:hover {
  color: #333;
  border-bottom: 1px solid rgba(102, 126, 234, 0.5);
}

/* 隐私政策模态框 */
.privacy-modal {
  background: white;
  max-width: 750px;
  width: 96%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1rem;
}

.privacy-content {
  padding: 1.5rem;
  line-height: 1.8;
}

.privacy-content .update-date {
  text-align: center;
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.privacy-content h4 {
  color: #667eea;
  font-size: 1.1rem;
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.privacy-content p {
  margin: 0.8rem 0;
  color: #333;
  text-align: justify;
}

.privacy-content ul {
  margin: 0.8rem 0;
  padding-left: 1.5rem;
}

.privacy-content li {
  margin: 0.5rem 0;
  color: #555;
}

/* 更新日志样式 */
.changelog-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

/* 欢迎弹窗样式 */
.welcome-content h4 {
  color: #667eea;
  font-size: 0.95rem;
  margin: 1rem 0 0.5rem 0;
}

.welcome-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.welcome-list li {
  padding: 0.4rem 0;
  font-size: 0.85rem;
  color: #555;
}

.backup-guide {
  background: rgba(102, 126, 234, 0.1);
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 600;
  text-align: center;
  margin: 0.5rem 0;
}

.welcome-warning {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem;
  background: rgba(255, 193, 7, 0.15);
  border: 2px solid rgba(255, 193, 7, 0.5);
  border-radius: 8px;
  margin-top: 1rem;
}

.welcome-warning .warning-text {
  font-size: 0.85rem;
  color: #d32f2f;
  font-weight: 600;
}

/* 备份提醒弹窗样式 */
.backup-reminder-text {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.backup-reminder-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.btn-text {
  background: none;
  border: none;
  color: #999;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.5rem;
}

.btn-text:hover {
  color: #667eea;
}

.changelog-section:last-of-type {
  border-bottom: none;
}

.changelog-section h4 {
  color: #667eea;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.version-tag {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.2rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-bottom: 1rem;
}

.changelog-section ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.changelog-section li {
  margin: 0.6rem 0;
  color: #555;
  line-height: 1.6;
}

.changelog-link {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #eee;
}

.changelog-link a {
  color: #667eea;
  font-weight: 500;
  font-size: 1rem;
}

.changelog-link a:hover {
  color: #764ba2;
}

/* 周选择器样式 */
.weekly-selector-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}

.weekday-checkbox-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.8rem 0.4rem;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
}

.weekday-checkbox-item:has(input:checked) {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.weekday-checkbox-item input {
}

.highlight-box {
  background: #f0f4ff;
  padding: 1rem;
  border-left: 4px solid #667eea;
  margin: 1rem 0;
  border-radius: 4px;
}

.contact-box {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.contact-box p {
  margin: 0.5rem 0;
}

/* 数据说明弹窗样式 */
.data-info-modal {
  background: white;
  max-width: 750px;
  width: 96%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1rem;
}

.data-info-modal .modal-body {
  padding: 1.5rem;
  line-height: 1.8;
}

.data-info-modal h4 {
  color: #333;
  margin: 1.5rem 0 1rem 0;
  font-size: 1.1rem;
  border-left: 4px solid #667eea;
  padding-left: 0.8rem;
}

.data-info-modal h4:first-child {
  margin-top: 0;
}

.data-info-modal p {
  margin: 0.8rem 0;
  color: #555;
}

.data-info-modal ul {
  margin: 0.8rem 0;
  padding-left: 2rem;
}

.data-info-modal li {
  margin: 0.5rem 0;
  color: #555;
}

.data-info-modal code {
  background: #f5f5f5;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #e83e8c;
  font-family: 'Courier New', monospace;
}

.pros-box {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #4caf50;
}

.pros-box p {
  margin: 0.5rem 0;
  color: #2e7d32;
  font-weight: 500;
}

.cons-box {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #ff9800;
}

.cons-box p {
  margin: 0.5rem 0;
  color: #e65100;
  font-weight: 500;
}

.export-guide {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #2196f3;
}

.export-guide ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.export-guide li {
  margin: 0.3rem 0;
  color: #1565c0;
}

.backup-tips {
  background: #f3e5f5;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #9c27b0;
}

.backup-tips p {
  margin: 0.5rem 0;
  color: #6a1b9a;
  font-weight: 500;
}

.security-promise {
  background: linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #3f51b5;
}

.security-promise p {
  margin: 0.5rem 0;
  color: #283593;
  font-weight: 500;
}

.weekly-selector-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}

.weekday-checkbox-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.8rem 0.4rem;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
}

.weekday-checkbox-item:has(input:checked) {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.weekday-checkbox-item input {
  width: 18px;
  height: 18px;
}

.weekday-name {
  font-size: 0.85rem;
  color: #333;
}

/* 编辑模态框周期选择器 */
.weekday-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.weekday-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.weekday-label:has(input:checked) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.weekday-label input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

/* 数据报告样式 */
.report-preview-cards {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.5rem;
}

.report-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  text-align: center;
}

.report-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.report-period {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0.3rem 0;
}

.report-meta {
  font-size: 0.75rem;
  opacity: 0.8;
  margin: 0.3rem 0 0 0;
}

.report-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.stat-card-report {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.stat-card-report:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.stat-card-report.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card-report .stat-icon {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.stat-card-report .stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0.3rem 0;
}

.stat-card-report .stat-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.report-section {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #333;
}

.category-stats, .priority-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-item, .priority-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.category-header, .priority-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.category-name, .priority-name {
  font-weight: 600;
  color: #333;
}

.category-value, .priority-value {
  color: #666;
  font-size: 0.8rem;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.category-detail {
  font-size: 0.75rem;
  color: #999;
}

.insights-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insight-card {
  display: flex;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%);
  border-left: 4px solid #667eea;
  align-items: flex-start;
}

.insight-card.insight-productivity {
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  border-left-color: #00acc1;
}

.insight-card.insight-balance {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left-color: #fb8c00;
}

.insight-card.insight-execution {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  border-left-color: #8e24aa;
}

.insight-card.insight-streak {
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
  border-left-color: #fbc02d;
}

.insight-card.insight-focus {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left-color: #43a047;
}

.insight-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.insight-text {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
}

.daily-trend {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trend-label {
  width: 60px;
  font-size: 0.8rem;
  color: #666;
  text-align: right;
}

.trend-bar-container {
  flex: 1;
  height: 28px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.trend-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  transition: width 0.3s ease;
  min-width: 30px;
}

.trend-value {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.report-kpi-section {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 10px;
}

.kpi-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.kpi-icon {
  font-size: 1.5rem;
}

.kpi-label {
  font-size: 0.75rem;
  color: #666;
}

.kpi-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.aggregated-tasks {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.aggregated-task-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fff 0%, #f9f9f9 100%);
  border-radius: 8px;
  border-left: 4px solid #667eea;
  align-items: flex-start;
}

.task-rank {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.task-info {
  flex: 1;
}

.task-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.task-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.task-frequency {
  color: #667eea;
  font-weight: 600;
}

.task-persistence {
  color: #f5576c;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

/* 里程碑时间轴样式 - 优化版 */
.milestones-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 1rem;
  position: relative;
}

.milestone-item {
  display: flex;
  gap: 1rem;
  position: relative;
  transition: transform 0.3s ease;
}

.milestone-item:hover {
  transform: translateX(4px);
}

.milestone-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.milestone-dot {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5), 0 0 0 4px rgba(102, 126, 234, 0.1);
  flex-shrink: 0;
  z-index: 2;
  transition: all 0.3s ease;
}

.milestone-item:hover .milestone-dot {
  transform: scale(1.2);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6), 0 0 0 6px rgba(102, 126, 234, 0.15);
}

.milestone-line {
  width: 3px;
  flex: 1;
  background: linear-gradient(180deg, #667eea 0%, #e0e0e0 100%);
  margin-top: 4px;
  min-height: 40px;
  border-radius: 2px;
}

.milestone-content {
  flex: 1;
  padding: 0.5rem 1rem 1.5rem 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(255, 255, 255, 0) 100%);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.milestone-item:hover .milestone-content {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.milestone-date {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.3rem;
  font-weight: 500;
}

.milestone-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.4rem;
  line-height: 1.4;
}

.milestone-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.milestone-meta span {
  padding: 2px 8px;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.milestone-meta span:hover {
  background: rgba(102, 126, 234, 0.15);
}

.milestone-description {
  font-size: 0.85rem;
  color: #555;
  line-height: 1.6;
  padding: 0.8rem 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  border-left: 4px solid #667eea;
  font-style: italic;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  position: relative;
}

.milestone-description::before {
  content: '💬';
  position: absolute;
  left: -12px;
  top: 8px;
  font-size: 1.2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* 热力图样式 */
.heatmap-container {
  padding: 1rem;
  background: white;
  border-radius: 8px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: #666;
}

.legend-colors {
  display: flex;
  gap: 3px;
}

.legend-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(27, 31, 35, 0.06);
}

.heatmap-grid {
  overflow-x: auto;
}

.heatmap-months {
  display: flex;
  gap: 0;
  margin-bottom: 0.5rem;
  padding-left: 20px;
}

.month-label {
  font-size: 0.7rem;
  color: #666;
  min-width: 60px;
}

.heatmap-weeks {
  display: flex;
  gap: 3px;
}

.heatmap-week {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.heatmap-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(27, 31, 35, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.heatmap-day:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.heatmap-stats {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.streak-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.streak-label {
  font-size: 0.8rem;
  color: #666;
}

.streak-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #667eea;
}

/* 趋势图样式 */
.trend-chart-container {
  padding: 1rem;
  background: white;
  border-radius: 8px;
}

.key-tasks {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.task-item-report {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.task-number {
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.summary-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.summary-text {
  flex: 1;
}

.summary-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
}

.summary-desc {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.8;
  white-space: pre-line;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.task-content-report {
  flex: 1;
}

.task-title-report {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
}

.task-meta-report {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.3rem;
}

.task-meta-report span {
  background: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.task-desc-report {
  font-size: 0.75rem;
  color: #999;
  line-height: 1.4;
  margin-top: 0.3rem;
}

/* 撤销Toast - Gmail风格 */
.undo-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(50, 50, 50, 0.95);
  color: white;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  backdrop-filter: blur(10px);
}

.toast-message {
  font-size: 0.9rem;
  font-weight: 500;
}

.toast-undo-btn {
  background: transparent;
  border: none;
  color: #4facfe;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toast-undo-btn:hover {
  background: rgba(79, 172, 254, 0.2);
}

.toast-undo-btn:active {
  transform: scale(0.95);
}

/* Toast滑入滑出动画 */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from {
  transform: translate(-50%, 100px);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translate(-50%, 100px);
  opacity: 0;
}

/* 通知设置指南弹窗样式 */
.notification-guide-modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
}

.guide-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
  position: relative;
}

.guide-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  animation: ring 2s infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-15deg); }
  20%, 40% { transform: rotate(15deg); }
}

.guide-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.guide-header .close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.guide-header .close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.guide-content {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.guide-intro {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.guide-steps {
  margin: 1.5rem 0;
}

.step-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 0.3rem 0;
  color: #333;
  font-size: 1rem;
}

.step-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.guide-tips {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  border-left: 4px solid #2196f3;
}

.tip-title {
  font-weight: 600;
  color: #1565c0;
  margin: 0 0 0.5rem 0;
}

.guide-tips ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.guide-tips li {
  margin: 0.5rem 0;
  color: #1976d2;
  line-height: 1.5;
}

.guide-note {
  background: #fff3e0;
  padding: 0.8rem;
  border-radius: 6px;
  margin-top: 1rem;
  border-left: 4px solid #ff9800;
}

.guide-note p {
  margin: 0;
  color: #e65100;
  font-size: 0.85rem;
  line-height: 1.5;
}

.guide-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}

.guide-actions button {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #999;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:active,
.btn-secondary:active {
  transform: translateY(0);
}

/* 番茄钟全屏界面 */
.pomodoro-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.pomodoro-container {
  width: 100%;
  max-width: 500px;
  text-align: center;
  color: white;
}

.pomodoro-header {
  margin-bottom: 40px;
}

.pomodoro-mode-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.mode-focus {
  background: rgba(255, 107, 107, 0.3);
}

.mode-shortBreak {
  background: rgba(76, 175, 80, 0.3);
}

.mode-longBreak {
  background: rgba(255, 152, 0, 0.3);
}

.pomodoro-task-name {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 10px 0;
}

.pomodoro-progress {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

.pomodoro-timer {
  margin: 40px 0;
}

.timer-circle {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto;
}

.timer-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 8;
}

.timer-progress {
  fill: none;
  stroke: white;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 565.48;
  transition: stroke-dashoffset 1s linear;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 64px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.pomodoro-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin: 40px 0;
}

.btn-pomodoro-control,
.btn-pomodoro-stop {
  padding: 16px 32px;
  font-size: 18px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-pomodoro-control {
  background: white;
  color: #667eea;
}

.btn-pomodoro-control:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-pomodoro-stop {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-pomodoro-stop:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-pomodoro-primary {
  padding: 16px 32px;
  font-size: 18px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-pomodoro-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.pomodoro-task-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: left;
  font-size: 14px;
  line-height: 1.8;
}

.pomodoro-task-info p {
  margin: 8px 0;
}

.pomodoro-task-info strong {
  opacity: 0.7;
  margin-right: 8px;
}

/* 周报弹窗样式 */
.weekly-report-content {
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
}

.report-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.overview-section {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 2px solid #667eea;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.overview-item {
  text-align: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
}

.overview-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.overview-label {
  font-size: 0.85rem;
  color: #666;
}

.category-stats {
  display: flex;
  justify-content: space-around;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.highlight-special {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 3px solid #ff9800;
}

.risk-item {
  background: #ffebee;
  border-left: 3px solid #f44336;
}

.report-section .section-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
}

.task-count {
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 500;
}

.summary-card,
.suggestions-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 3px solid #667eea;
  padding: 1rem;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
  font-size: 0.95rem;
}

.highlights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.category-header {
  font-weight: 600;
  font-size: 0.95rem;
  color: #667eea;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.highlight-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.highlight-text {
  flex: 1;
  color: #333;
  line-height: 1.5;
}

.task-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.task-chip {
  background: white;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.task-chip.more {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.report-text {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

/* 周报历史样式 */
.report-toolbar {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1rem 0.5rem;
  align-items: center;
}

.report-search-input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.report-search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-batch-delete {
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1px solid #ff4444;
  color: #ff4444;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-batch-delete:hover {
  background: #ff4444;
  color: white;
}

.report-history-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.report-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #667eea;
  padding: 0.5rem 0.75rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  display: inline-block;
  align-self: flex-start;
}

.history-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.history-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.history-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.history-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.history-type {
  font-weight: 700;
  color: #667eea;
  font-size: 1rem;
  white-space: nowrap;
}

.history-period {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.btn-delete-small {
  background: transparent;
  border: 1px solid #ff4444;
  color: #ff4444;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete-small:hover {
  background: #ff4444;
  color: white;
  transform: scale(1.1);
}

.history-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* 自定义报告弹窗样式 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.report-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.type-card {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.type-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.type-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.type-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.type-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.type-desc {
  font-size: 0.75rem;
  color: #999;
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
}

.template-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.template-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-option:hover {
  border-color: #667eea;
}

.template-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.template-icon {
  font-size: 2rem;
}

.template-info {
  flex: 1;
}

.template-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.template-desc {
  font-size: 0.8rem;
  color: #999;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* 模板管理样式 */
.template-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.template-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.25rem;
  background: white;
}

.template-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.template-icon-large {
  font-size: 3rem;
}

.template-details {
  flex: 1;
}

.template-name-large {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
}

.template-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.feature-tag {
  padding: 0.25rem 0.75rem;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-template-action {
  padding: 0.4rem 1rem;
  background: white;
  color: #667eea;
  border: 1.5px solid #667eea;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-template-action:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn-template-use {
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-template-use:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 模板详情样式 */
.template-detail-section {
  margin-bottom: 1.5rem;
}

.detail-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.detail-value {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: white;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.section-item.disabled {
  opacity: 0.5;
  background: #f5f5f5;
}

.section-icon {
  font-size: 1rem;
}

.section-label {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

/* 模板编辑样式 */
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.checkbox-group-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label-large {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-label-large:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.checkbox-label-large input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label-large span {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

/* 版本历史样式 */
/* 任务树成长详情弹窗 - 复用 report-bottom-sheet 样式 */
.growth-current {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.tree-icon-large {
  font-size: 4rem;
  animation: treeGrow 2s ease-in-out infinite;
}

.growth-info {
  color: white;
}

.level-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.score-text {
  font-size: 1rem;
  opacity: 0.9;
}

.growth-progress-section {
  margin-bottom: 1.5rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.progress-bar-large {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-percent {
  text-align: right;
  font-size: 0.85rem;
  color: #10b981;
  font-weight: 600;
}

.growth-levels,
.growth-rules {
  margin-bottom: 1.5rem;
}

.growth-levels h4,
.growth-rules h4 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  color: #333;
}

.level-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: #f9fafb;
  opacity: 0.5;
  transition: all 0.3s;
}

.level-item.active {
  opacity: 1;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #10b981;
}

.level-icon {
  font-size: 1.5rem;
}

.level-name {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.level-score {
  font-size: 0.85rem;
  color: #666;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: #f9fafb;
}

.rule-icon {
  font-size: 1.25rem;
}

.rule-text {
  flex: 1;
  color: #333;
}

.rule-score {
  font-weight: 600;
  color: #10b981;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.version-item {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s;
}

.version-item.version-new {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea05 0%, #764ba205 100%);
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f0f0f0;
}

.version-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.version-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: #667eea;
}

.badge-new {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.version-date {
  color: #999;
  font-size: 0.9rem;
}

.version-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.version-section {
  margin: 0;
}

.version-section-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.version-section ul {
  margin: 0;
  padding-left: 1.5rem;
}

.version-section li {
  color: #666;
  line-height: 1.8;
  font-size: 0.9rem;
}

</style>