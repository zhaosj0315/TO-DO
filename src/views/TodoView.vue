<template>
  <div class="todo-layout">
    <!-- 核心内容区 -->
    <main class="main-content glass-card" ref="mainContent">
      <!-- 顶部标题栏 -->
      <header class="header">
        <div class="user-info">
          <h1>{{ currentUsername }}{{ t('tasksSuffix') }}</h1>
        </div>
        <div class="header-actions">
          <!-- 刷新按钮 -->
          <button class="btn-icon-circle btn-refresh-icon" @click="handleRefresh" :title="t('refresh')">
            <span :class="{ spinning: isRefreshing }">⟳</span>
          </button>
          <!-- 回收站按钮（带数字气泡） -->
          <button class="btn-icon-circle btn-trash" @click="showTrash = true" :title="t('trash')">
            🗑️
            <span v-if="taskStore.deletedTasks.length > 0" class="badge-count">{{ taskStore.deletedTasks.length }}</span>
          </button>
          <!-- 个人头像 -->
          <button class="btn-avatar" @click="showProfile = true" :title="t('profile')">
            <div class="avatar-mini">{{ currentUsername ? currentUsername.charAt(0).toUpperCase() : 'U' }}</div>
          </button>
        </div>
      </header>

      <!-- 统计+筛选+添加 - 两行布局 v1.5.2 -->
      <section class="dashboard-area">
        <!-- 第一行：统计数据（Grid均匀分布） -->
        <div class="stats-grid">
          <!-- 全部 -->
          <div class="stat-card stat-card-all clickable" @click="setFilter('all')" :class="{ active: currentFilter === 'all' }">
            <span class="stat-label">{{ t('all') }}</span>
            <span class="stat-value">{{ baseFilteredTasks.length }}</span>
          </div>

          <!-- 已完成 -->
          <div class="stat-card stat-card-completed clickable" @click="setFilter('completed')" :class="{ active: currentFilter === 'completed' }">
            <span class="stat-label">{{ t('completed') }}</span>
            <span class="stat-value success">{{ completedCount }}</span>
          </div>

          <!-- 待办 -->
          <div class="stat-card stat-card-pending clickable" @click="setFilter('pending')" :class="{ active: currentFilter === 'pending' }">
            <span class="stat-label">{{ t('pending') }}</span>
            <span class="stat-value">{{ pendingCount }}</span>
          </div>

          <!-- 已逾期 -->
          <div class="stat-card stat-card-overdue clickable" @click="setFilter('overdue')" :class="{ active: currentFilter === 'overdue' }">
            <span class="stat-label">{{ t('overdue') }}</span>
            <span class="stat-value danger">{{ overdueCount }}</span>
          </div>

          <!-- 筛选按钮 - 移到统计栏 -->
          <button class="stat-card filter-card" @click="showFilterModal = true" :title="t('filter')">
            <div class="icon-with-label">
              <span class="icon-small">🎛️</span>
              <span class="label-small">{{ t('filter') }}</span>
            </div>
          </button>

          <!-- 添加/收起按钮 - 融入统计栏 -->
          <div class="stat-card add-toggle-card" @click="showAddForm = !showAddForm" :class="{ active: showAddForm }">
            <div class="icon-with-label">
              <span class="icon-small arrow-icon" :class="{ rotated: showAddForm }">↓</span>
              <span class="label-small">{{ showAddForm ? t('collapse') : t('expand') }}</span>
            </div>
          </div>
        </div>

        <!-- 添加任务表单 - 两行布局 -->
        <div v-if="showAddForm" class="add-form-two-row">
          <!-- 第一行：任务名称 -->
          <div class="add-form-row-main">
            <input 
              type="text" 
              v-model="newTaskText" 
              class="task-input-main"
              :placeholder="t('addTaskPlaceholder')"
              @keyup.enter="addTask"
            >
          </div>

          <!-- 只有输入任务名称后才显示以下部分 -->
          <template v-if="newTaskText.trim()">
            <!-- 任务描述（可选） -->
            <div class="add-form-row-desc">
              <textarea 
                v-model="newTaskDescription" 
                class="task-textarea-desc"
                placeholder="📝 任务描述（可选）..."
                rows="2"
              ></textarea>
            </div>

            <!-- 第二行：属性配置 -->
            <div class="add-form-row-attrs">
              <!-- 日期类型 -->
              <div class="attr-group">
                <select v-model="newTaskType" class="attr-select attr-select-date" @change="handleTaskTypeChange">
                  <option value="today">{{ t('today') }}</option>
                  <option value="tomorrow">{{ t('tomorrow') }}</option>
                  <option value="this_week">{{ t('thisWeek') }}</option>
                  <option value="daily">{{ t('daily') }}</option>
                  <option value="weekday">{{ t('weekday') }}</option>
                  <option value="custom_date">{{ customDateTime ? formatDisplayDateTime(customDateTime) : t('customDate') }}</option>
                  <option value="weekly">{{ selectedWeekdays.length > 0 ? formatSelectedWeekdays(selectedWeekdays) : t('weekly') }}</option>
                </select>
              </div>

              <input ref="hiddenCustomDateTime" type="datetime-local" style="display:none" :min="getTodayDateTime()" @change="handleCustomDateTimeChange">

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

              <!-- 时长/规模选择器 -->
              <div class="attr-group" v-if="['today', 'tomorrow', 'this_week'].includes(newTaskType)">
                <select v-model="newTaskDuration" class="attr-select attr-select-short">
                  <option value="quick">⚡快速</option>
                  <option value="normal">⏱️正常</option>
                  <option value="long">⏳较长</option>
                </select>
              </div>

              <div class="attr-group" v-else-if="newTaskType === 'custom_date'">
                <select v-model="newTaskScale" class="attr-select attr-select-short">
                  <option value="small">📦小型</option>
                  <option value="medium">📊中型</option>
                  <option value="large">🎯大型</option>
                </select>
              </div>

              <!-- 提交按钮 -->
              <button class="btn-submit-main" @click="addTask" title="添加任务">✓</button>
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
            <label class="checkbox-wrapper">
              <input 
                type="checkbox" 
                class="task-checkbox" 
                :checked="task.status === TaskStatus.COMPLETED"
                @change="toggleTaskCompletion(task.id)"
              >
            </label>
            <div class="task-content" @click="openTaskDetail(task)" style="cursor: pointer;">
              <div class="task-title-row">
                <span class="task-title" title="点击查看详情">{{ task.text }}</span>
                <button class="btn-delete-inline" @click.stop="deleteTask(task.id)" title="删除任务">🗑️</button>
              </div>
              <div v-if="task.description" class="task-description">{{ task.description }}</div>
              <div class="task-meta">
                <!-- 时间信息（压缩格式：去掉年份） -->
                <span class="task-time-compact" title="创建时间">📝 {{ formatCompactDateTime(task.created_at) }}</span>
                
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
                <span class="badge badge-pomodoro" :class="`pomodoro-${task.priority}`">
                  🍅×{{ getPomodoroCount(task) }}
                </span>
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
            <option :value="6">6条/页</option>
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
              <span class="footer-version">TO-DO App v1.6.0</span>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="showChangelog = true">
                {{ currentLanguage === 'zh' ? '📋 更新日志' : '📋 Changelog' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="showUserGuide = true">
                {{ currentLanguage === 'zh' ? '📖 使用指南' : '📖 Guide' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="showPomodoroRules = true">
                {{ currentLanguage === 'zh' ? '🍅 番茄规则' : '🍅 Rules' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-copyright">© 2026 TO-DO Team</span>
            </p>
            <p class="footer-links">
              <a href="https://github.com/zhaosj0315/TO-DO" target="_blank" class="footer-link">GitHub</a>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="showPrivacyPolicy = true">
                {{ currentLanguage === 'zh' ? '隐私政策' : 'Privacy' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="showSupport = true">
                {{ currentLanguage === 'zh' ? '💬 反馈' : '💬 Feedback' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-link" @click="toggleLanguage">
                {{ currentLanguage === 'zh' ? '🌐 EN' : '🌐 中文' }}
              </span>
              <span class="footer-divider">·</span>
              <span class="footer-text">
                {{ currentLanguage === 'zh' ? '完全离线 · 本地存储' : 'Offline · Local Storage' }}
              </span>
            </p>
          </div>
        </footer>
      </div>
    </main>

    <!-- 隐私政策模态框 -->
    <div v-if="showPrivacyPolicy" class="modal-overlay" @click.self="showPrivacyPolicy = false">
      <div class="modal-content privacy-modal">
        <div class="modal-header">
          <h3>🔒 隐私政策</h3>
          <button class="close-btn" @click="showPrivacyPolicy = false">&times;</button>
        </div>
        <div class="modal-body privacy-content">
          <p class="update-date"><strong>更新日期：2026年2月19日</strong></p>
          
          <h4>1. 概述</h4>
          <p>TODO App（以下简称"本应用"）尊重并保护用户隐私。本隐私政策说明我们如何收集、使用和保护您的信息。</p>
          
          <div class="highlight-box">
            <strong>核心承诺：</strong>本应用完全离线运行，<strong>不收集任何用户数据</strong>，所有数据仅存储在您的设备本地。
          </div>
          
          <h4>2. 信息收集</h4>
          <p>本应用完全离线运行，<strong>不收集任何用户数据</strong>。具体包括：</p>
          <ul>
            <li>不收集个人身份信息（姓名、邮箱、电话等）</li>
            <li>不收集设备信息</li>
            <li>不收集位置信息</li>
            <li>不收集使用行为数据</li>
            <li>不使用任何分析工具或统计服务</li>
          </ul>
          
          <h4>3. 数据存储</h4>
          <p>所有任务数据存储在您的设备本地存储中：</p>
          <ul>
            <li>✓ 数据存储在设备本地</li>
            <li>✓ 数据不会上传到任何服务器</li>
            <li>✓ 数据不会与第三方共享</li>
            <li>✓ 卸载应用会删除所有本地数据</li>
            <li>✓ 您完全控制自己的数据</li>
          </ul>
          
          <h4>4. 权限说明</h4>
          <p>本应用申请的权限及用途：</p>
          <ul>
            <li><strong>存储权限</strong>：用于保存任务数据到设备本地，以及导入导出Excel文件</li>
            <li><strong>通知权限</strong>：用于任务提醒功能（可选，用户可在系统设置中关闭）</li>
          </ul>
          
          <h4>5. 数据安全</h4>
          <div class="highlight-box">
            <p><strong>本应用不联网，数据完全在本地，不存在数据泄露风险。</strong></p>
          </div>
          
          <h4>6. 第三方服务</h4>
          <p>本应用<strong>不使用任何第三方服务或 SDK</strong>。</p>
          
          <h4>7. 联系我们</h4>
          <div class="contact-box">
            <p>如对本隐私政策有任何疑问，请联系：</p>
            <p><strong>📧 邮箱：</strong>17858441076@163.com</p>
            <p><strong>📞 电话：</strong>17858441076</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选弹窗 -->
    <div v-if="showFilterModal" class="modal-overlay" @click.self="showFilterModal = false">
      <div class="modal-content filter-modal">
        <div class="modal-header">
          <h3>🎛️ {{ t('advancedFilter') }}</h3>
          <button class="close-btn" @click="showFilterModal = false">&times;</button>
        </div>
        <div class="modal-body filter-body">
          <!-- 关键字搜索 - 置顶 -->
          <div class="filter-section">
            <label class="filter-label">🔍 {{ t('keywordSearch') }}</label>
            <div class="search-input-wrapper">
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
          <div class="filter-section">
            <label class="filter-label">🏷️ {{ t('category') }}</label>
            <div class="filter-buttons">
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
          <div class="filter-section">
            <label class="filter-label">⚡ {{ t('priority') }}</label>
            <div class="filter-buttons">
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

          <!-- 日期范围 -->
          <div class="filter-section">
            <label class="filter-label">📅 {{ t('dateRange') }}</label>
            <!-- 快捷日期按钮 -->
            <div class="quick-date-buttons">
              <button class="quick-date-btn" @click="setQuickDate('today')">{{ t('today') }}</button>
              <button class="quick-date-btn" @click="setQuickDate('thisWeek')">{{ t('thisWeek') }}</button>
              <button class="quick-date-btn" @click="setQuickDate('overdue')">{{ t('overdue') }}</button>
            </div>
            <!-- 自定义日期 -->
            <div class="date-range-picker">
              <div 
                class="date-input-box" 
                :class="{ 'has-value': startDate }" 
                @click="showDatePicker('start')"
              >
                {{ startDate ? formatDisplayDate(startDate) : t('startDate') }}
              </div>
              <span class="date-separator">{{ t('to') }}</span>
              <div 
                class="date-input-box" 
                :class="{ 'has-value': endDate }" 
                @click="showDatePicker('end')"
              >
                {{ endDate ? formatDisplayDate(endDate) : t('endDate') }}
              </div>
              <button v-if="startDate || endDate" class="clear-btn-small" @click="clearDateFilter">{{ t('clear') }}</button>
            </div>
            <input ref="hiddenStartDate" type="date" style="display:none" @change="handleStartDateChange">
            <input ref="hiddenEndDate" type="date" style="display:none" @change="handleEndDateChange">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-reset" @click="resetFilters">{{ t('reset') }}</button>
          <button class="btn btn-confirm" @click="showFilterModal = false">{{ t('confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 回收站模态框 -->
    <div v-if="showTrash" class="modal-overlay" @click.self="showTrash = false">
      <div class="modal-content glass-card" style="background: white; width: 96%; padding: 1rem;">
        <div class="modal-header">
          <h3>{{ t('recycleBin') }}</h3>
          <button class="close-btn" @click="showTrash = false">&times;</button>
        </div>
        <div class="modal-body">
          <ul v-if="taskStore.deletedTasks.length > 0">
            <li v-for="task in taskStore.deletedTasks" :key="task.id" class="trash-item">
              <div class="trash-info">
                <span class="trash-title">{{ task.text }}</span>
                <span class="trash-meta:">{{ t('originalCategory') }}: {{ getCategoryText(task.category) }}</span>
              </div>
              <div class="trash-actions">
                <button class="btn btn-success btn-sm" @click="restoreTask(task.id)">{{ t('restore') }}</button>
                <button class="btn btn-danger btn-sm" @click="permanentDelete(task.id)">{{ t('permanentDelete') }}</button>
              </div>
            </li>
          </ul>
          <p v-else class="empty-state">{{ t('emptyTrash') }}</p>
        </div>
      </div>
    </div>

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
    <div v-if="showProfile" class="modal-overlay" @click.self="showProfile = false">
      <div class="modal-content glass-card profile-modal" style="background: white;">
        <div class="modal-header">
          <h3>{{ t('personalProfile') }}</h3>
          <button class="close-btn" @click="showProfile = false">&times;</button>
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

          <!-- 番茄统计入口 -->
          <div class="pomodoro-entry" @click="showPomodoroStats = true">
            <div class="entry-icon">🍅</div>
            <div class="entry-content">
              <div class="entry-title">{{ t('pomodoroStats') }}</div>
              <div class="entry-summary">
                {{ t('earnedPomodoros') }} {{ earnedPomodoros }} {{ currentLanguage === 'zh' ? '个' : '' }} | {{ t('netPomodoros') }} {{ totalPomodoros }} {{ currentLanguage === 'zh' ? '个' : '' }}
              </div>
            </div>
            <div class="entry-arrow">›</div>
          </div>

          <!-- 数据报告入口 -->
          <div class="pomodoro-entry" @click="showReportModal = true">
            <div class="entry-icon">📊</div>
            <div class="entry-content">
              <div class="entry-title">{{ t('dataReport') }}</div>
              <div class="entry-summary">
                {{ t('dataReportDesc') }}
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
            <div class="data-buttons">
              <button class="btn btn-export" @click="exportToExcel">
                <span class="export-icon">📥</span>
                {{ t('exportTasks') }}
              </button>
              <button class="btn btn-import" @click="triggerImport">
                <span class="export-icon">📤</span>
                {{ t('importTasks') }}
              </button>
              <button class="btn btn-template" @click="downloadTemplate">
                <span class="export-icon">📋</span>
                {{ t('downloadTemplate') }}
              </button>
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

          <!-- 联系与支持 -->
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

    <!-- 联系与支持详情弹窗 -->
    <div v-if="showSupport" class="modal-overlay" @click.self="showSupport = false">
      <div class="modal-content glass-card" style="background: white; max-width: 550px; width: 96%; padding: 0.8rem;">
        <div class="modal-header">
          <h3>💬 {{ currentLanguage === 'zh' ? '问题反馈' : 'Feedback' }}</h3>
          <button class="close-btn" @click="showSupport = false">&times;</button>
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
    <div v-if="showUserGuide" class="modal-overlay" @click.self="showUserGuide = false">
      <div class="modal-content privacy-modal">
        <div class="modal-header">
          <h3>📖 {{ currentLanguage === 'zh' ? '使用指南' : 'User Guide' }}</h3>
          <button class="close-btn" @click="showUserGuide = false">&times;</button>
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
            <li><strong>查看详情</strong>：点击任务标题</li>
            <li><strong>编辑任务</strong>：在详情页点击"编辑任务"</li>
            <li><strong>删除任务</strong>：点击任务右侧的🗑️图标</li>
            <li><strong>恢复任务</strong>：在回收站中点击"恢复"</li>
          </ul>

          <h4>三、筛选与搜索</h4>
          <ul>
            <li><strong>快速筛选</strong>：点击统计卡片（全部/已完成/待办/已逾期）</li>
            <li><strong>高级筛选</strong>：点击🎛️按钮，可按日期/分类/优先级筛选</li>
            <li><strong>关键字搜索</strong>：在搜索框输入关键词</li>
            <li><strong>重置筛选</strong>：点击⟳刷新按钮</li>
          </ul>

          <h4>四、数据管理</h4>
          <ul>
            <li><strong>导出数据</strong>：个人主页 → 数据管理 → 导出Excel</li>
            <li><strong>导入数据</strong>：个人主页 → 数据管理 → 导入Excel</li>
            <li><strong>下载模板</strong>：个人主页 → 数据管理 → 下载模板</li>
          </ul>

          <h4>五、常见问题</h4>
          <p><strong>Q: 如何修改用户名？</strong></p>
          <p>A: 点击右上角头像 → 个人主页 → 修改用户名</p>

          <p><strong>Q: 数据存储在哪里？</strong></p>
          <p>A: 所有数据存储在设备本地，完全离线，不会上传到服务器</p>

          <p><strong>Q: 如何备份数据？</strong></p>
          <p>A: 使用"导出Excel"功能定期备份数据</p>

          <p><strong>Q: 卸载应用会丢失数据吗？</strong></p>
          <p>A: 是的，卸载前请先导出数据备份</p>
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
    <div v-if="showChangelog" class="modal-overlay" @click.self="showChangelog = false">
      <div class="modal-content privacy-modal">
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
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal-content glass-card" style="background: white; max-width: 450px; width: 96%; padding: 1rem;">
        <div class="modal-header">
          <h3>🔒 {{ t('changePassword') }}</h3>
          <button class="close-btn" @click="showPasswordModal = false">&times;</button>
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
    <div v-if="showPhoneModal" class="modal-overlay" @click.self="showPhoneModal = false">
      <div class="modal-content glass-card" style="background: white; max-width: 450px; width: 96%; padding: 1rem;">
        <div class="modal-header">
          <h3>📱 {{ t('bindPhone') }}</h3>
          <button class="close-btn" @click="showPhoneModal = false">&times;</button>
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

    <!-- 番茄统计详情弹窗 -->
    <div v-if="showPomodoroStats" class="modal-overlay" @click.self="showPomodoroStats = false">
      <div class="modal-content glass-card" style="background: white; max-width: 650px; width: 96%; padding: 1rem;">
        <div class="modal-header">
          <h3>🍅 {{ t('pomodoroOverview') }}</h3>
          <button class="close-btn" @click="showPomodoroStats = false">&times;</button>
        </div>
        <div class="modal-body">
          <!-- 总览 -->
          <div class="pomodoro-overview">
            <div class="overview-item earned">
              <div class="overview-icon">✅</div>
              <div class="overview-value">{{ earnedPomodoros }}</div>
              <div class="overview-label">{{ t('earned') }}</div>
            </div>
            <div class="overview-item pending">
              <div class="overview-icon">⏳</div>
              <div class="overview-value">{{ pendingPomodoros }}</div>
              <div class="overview-label">{{ t('pendingEarn') }}</div>
            </div>
            <div class="overview-item lost">
              <div class="overview-icon">❌</div>
              <div class="overview-value">{{ lostPomodoros }}</div>
              <div class="overview-label">{{ t('overdueDeduct') }}</div>
            </div>
            <div class="overview-item total">
              <div class="overview-icon">🏆</div>
              <div class="overview-value">{{ totalPomodoros }}</div>
              <div class="overview-label">{{ t('netEarned') }}</div>
            </div>
          </div>

          <!-- 等级徽章 -->
          <div class="level-badge">
            <div class="level-badge-icon">{{ getLevelBadge().icon }}</div>
            <div class="badge-info">
              <div class="badge-title">{{ getLevelBadge().title }}</div>
              <div class="badge-desc">{{ t('accumulatedEarned') }} {{ earnedPomodoros }} {{ t('pomodoros') }}</div>
            </div>
          </div>

          <!-- 近7天趋势 -->
          <div class="stats-section">
            <h4 class="section-title">📈 {{ t('last7DaysTrend') }}</h4>
            <div class="trend-chart">
              <div v-for="(day, index) in getLast7DaysTrend()" :key="index" class="trend-bar-wrapper">
                <div class="trend-bar" :style="{ height: (day.count / getMaxDailyInWeek() * 100) + '%' }">
                  <span class="trend-value">{{ day.count }}</span>
                </div>
                <div class="trend-label">{{ day.label }}</div>
              </div>
            </div>
          </div>

          <!-- 时间维度统计 -->
          <div class="stats-section">
            <h4 class="section-title">📅 {{ t('timeStats') }}</h4>
            <div class="detail-stats-grid">
              <div class="stats-card time-today">
                <div class="stats-icon">☀️</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByTime('today') }}</div>
                  <div class="stats-label">{{ t('today') }}</div>
                </div>
              </div>
              <div class="stats-card time-week">
                <div class="stats-icon">📊</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByTime('week') }}</div>
                  <div class="stats-label">{{ t('thisWeek') }}</div>
                </div>
              </div>
              <div class="stats-card time-month">
                <div class="stats-icon">📈</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByTime('month') }}</div>
                  <div class="stats-label">{{ t('thisMonth') }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分类占比 -->
          <div class="stats-section">
            <h4 class="section-title">📊 {{ t('categoryDistribution') }}</h4>
            <div class="category-bars">
              <div class="category-bar-item">
                <div class="category-bar-header">
                  <span>💼 {{ t('work') }}</span>
                  <span class="category-bar-value">{{ getPomodorosByCategory('work') }} ({{ getCategoryPercent('work') }}%)</span>
                </div>
                <div class="category-bar-bg">
                  <div class="category-bar-fill work" :style="{ width: getCategoryPercent('work') + '%' }"></div>
                </div>
              </div>
              <div class="category-bar-item">
                <div class="category-bar-header">
                  <span>📚 {{ t('study') }}</span>
                  <span class="category-bar-value">{{ getPomodorosByCategory('study') }} ({{ getCategoryPercent('study') }}%)</span>
                </div>
                <div class="category-bar-bg">
                  <div class="category-bar-fill study" :style="{ width: getCategoryPercent('study') + '%' }"></div>
                </div>
              </div>
              <div class="category-bar-item">
                <div class="category-bar-header">
                  <span>🏠 {{ t('life') }}</span>
                  <span class="category-bar-value">{{ getPomodorosByCategory('life') }} ({{ getCategoryPercent('life') }}%)</span>
                </div>
                <div class="category-bar-bg">
                  <div class="category-bar-fill life" :style="{ width: getCategoryPercent('life') + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 按分类统计 -->
          <div class="stats-section">
            <h4 class="section-title">🏷️ {{ t('categoryDetails') }}</h4>
            <div class="detail-stats-grid">
              <div class="stats-card">
                <div class="stats-icon">💼</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByCategory('work') }}</div>
                  <div class="stats-label">{{ t('work') }}</div>
                </div>
              </div>
              <div class="stats-card">
                <div class="stats-icon">📚</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByCategory('study') }}</div>
                  <div class="stats-label">{{ t('study') }}</div>
                </div>
              </div>
              <div class="stats-card">
                <div class="stats-icon">🏠</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByCategory('life') }}</div>
                  <div class="stats-label">{{ t('life') }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 按优先级统计 -->
          <div class="stats-section">
            <h4 class="section-title">⚡ {{ t('priorityStats') }}</h4>
            <div class="detail-stats-grid">
              <div class="stats-card priority-high">
                <div class="stats-icon">🔴</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByPriority('high') }}</div>
                  <div class="stats-label">{{ t('highPriority') }}</div>
                </div>
              </div>
              <div class="stats-card priority-medium">
                <div class="stats-icon">🟠</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByPriority('medium') }}</div>
                  <div class="stats-label">{{ t('mediumPriority') }}</div>
                </div>
              </div>
              <div class="stats-card priority-low">
                <div class="stats-icon">🔵</div>
                <div class="stats-info">
                  <div class="stats-value">{{ getPomodorosByPriority('low') }}</div>
                  <div class="stats-label">{{ t('lowPriority') }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 成就统计 -->
          <div class="stats-section">
            <h4 class="section-title">🎯 {{ t('achievementStats') }}</h4>
            <div class="achievement-grid">
              <div class="achievement-card">
                <div class="achievement-icon">🔥</div>
                <div class="achievement-info">
                  <div class="achievement-value">{{ getConsecutiveDays() }}</div>
                  <div class="achievement-label">{{ t('consecutiveDays') }}</div>
                </div>
              </div>
              <div class="achievement-card">
                <div class="achievement-icon">⭐</div>
                <div class="achievement-info">
                  <div class="achievement-value">{{ getMaxDailyPomodoros() }}</div>
                  <div class="achievement-label">{{ t('maxDaily') }}</div>
                </div>
              </div>
              <div class="achievement-card">
                <div class="achievement-icon">📊</div>
                <div class="achievement-info">
                  <div class="achievement-value">{{ getCompletionRate() }}%</div>
                  <div class="achievement-label">{{ t('completionRateLabel') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 星期选择模态框 - 每周重复 -->
    <div v-if="showWeeklyModal" class="modal-overlay" @click.self="showWeeklyModal = false" style="z-index: 1100;">
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

    <!-- 自定义日期时间模态框 -->
    <div v-if="showCustomDateModal" class="modal-overlay" @click.self="confirmCustomDate" style="z-index: 1100;">
      <div class="modal-content glass-card" style="background: white; max-width: 450px; width: 96%; padding: 1rem;" @click.stop>
        <div class="modal-header">
          <h3>选择日期时间</h3>
          <button class="close-btn" @click="confirmCustomDate">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>日期和时间</label>
            <input 
              v-model="customDateTime" 
              type="datetime-local" 
              class="input" 
              :min="getTodayDateTime()"
              style="width: 100%; font-size: 1rem;"
              @change="confirmCustomDate"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情抽屉 (Bottom Sheet) -->
    <div v-if="showTaskDetail" class="bottom-sheet-overlay" @click.self="closeTaskDetail">
      <div class="bottom-sheet">
        <div class="bottom-sheet-header">
          <div class="sheet-handle"></div>
          <h3>📋 任务详情</h3>
          <button class="close-btn" @click="closeTaskDetail">&times;</button>
        </div>
        <div class="bottom-sheet-body" v-if="detailTask">
          <!-- 任务标题和描述 -->
          <div class="detail-section">
            <h4 class="detail-title">{{ detailTask.text }}</h4>
            <p v-if="detailTask.description" class="detail-description">{{ detailTask.description }}</p>
          </div>

          <!-- 时间轴 -->
          <div class="detail-section timeline">
            <div class="timeline-item">
              <div class="timeline-icon">📝</div>
              <div class="timeline-content">
                <div class="timeline-label">创建时间</div>
                <div class="timeline-value">{{ formatDateTime(detailTask.created_at) }}</div>
              </div>
            </div>
            
            <div class="timeline-item" v-if="detailTask.status !== 'completed'">
              <div class="timeline-icon">⏰</div>
              <div class="timeline-content">
                <div class="timeline-label">截止时间</div>
                <div class="timeline-value" :class="getDeadlineClass(detailTask)">{{ getDeadlineText(detailTask) }}</div>
              </div>
            </div>

            <template v-if="detailTask.status === 'completed'">
              <div class="timeline-item">
                <div class="timeline-icon">⏰</div>
                <div class="timeline-content">
                  <div class="timeline-label">计划完成时间</div>
                  <div class="timeline-value">{{ getPlannedDeadlineText(detailTask) }}</div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-icon">✅</div>
                <div class="timeline-content">
                  <div class="timeline-label">实际完成时间</div>
                  <div class="timeline-value">{{ formatDateTime(detailTask.completed_at || detailTask.created_at) }}</div>
                </div>
              </div>
              <div v-if="detailTask.completed_at && calculateActualHours(detailTask)" class="timeline-item">
                <div class="timeline-icon">⏱️</div>
                <div class="timeline-content">
                  <div class="timeline-label">实际耗时</div>
                  <div class="timeline-value">{{ calculateActualHours(detailTask) }}</div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-icon">🏁</div>
                <div class="timeline-content">
                  <div class="timeline-label">完成状态</div>
                  <div class="timeline-value task-deadline-success">{{ getDeadlineText(detailTask) }}</div>
                </div>
              </div>
            </template>
          </div>

          <!-- 任务属性 -->
          <div class="detail-section attributes">
            <div class="attr-item">
              <span class="attr-label">📅 任务类型</span>
              <span class="attr-value badge">{{ getTaskTypeText(detailTask) }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">⚡ 优先级</span>
              <span class="attr-value badge" :class="`priority-${detailTask.priority}`">{{ getPriorityText(detailTask.priority) }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">🏷️ 分类</span>
              <span class="attr-value badge" :class="`category-${detailTask.category}`">{{ getCategoryText(detailTask.category) }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">🍅 番茄钟</span>
              <span class="attr-value badge badge-pomodoro" :class="`pomodoro-${detailTask.priority}`">
                🍅×{{ getPomodoroCount(detailTask) }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-actions">
            <button class="btn btn-primary" @click="openEditModal(detailTask); closeTaskDetail()">
              ✏️ 编辑任务
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情编辑模态框 -->
    <div v-if="editingTask" class="modal-overlay" @click.self="editingTask = null">
      <div class="modal-content glass-card" style="background: white; max-width: 550px; width: 96%; padding: 1rem;">
        <div class="modal-header">
          <h3>{{ t('edit') }}{{ currentLanguage === 'zh' ? '任务详情' : ' Task' }}</h3>
          <button class="close-btn" @click="editingTask = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="edit-field">
            <label>{{ currentLanguage === 'zh' ? '任务名称' : 'Task Name' }}</label>
            <input 
              v-model="editText" 
              class="input" 
              :placeholder="currentLanguage === 'zh' ? '任务名称' : 'Task name'"
            >
          </div>
          <div class="edit-field">
            <label>{{ currentLanguage === 'zh' ? '详细描述' : 'Description' }}</label>
            <textarea 
              v-model="editDescription" 
              class="input textarea" 
              :placeholder="currentLanguage === 'zh' ? '添加更多细节描述...' : 'Add more details...'"
              rows="4"
            ></textarea>
          </div>
          <div class="edit-field">
            <label>{{ currentLanguage === 'zh' ? '任务分类' : 'Category' }}</label>
            <select v-model="editCategory" class="input">
              <option value="work">💼 {{ t('work') }}</option>
              <option value="study">📚 {{ t('study') }}</option>
              <option value="life">🏠 {{ t('life') }}</option>
            </select>
          </div>
          <div class="edit-field">
            <label>{{ currentLanguage === 'zh' ? '优先级' : 'Priority' }}</label>
            <select v-model="editPriority" class="input">
              <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="edit-field">
            <label>{{ currentLanguage === 'zh' ? '任务类型' : 'Type' }}</label>
            <select v-model="editType" class="input" @change="handleEditTypeChange">
              <option value="today">{{ t('today') }}</option>
              <option value="tomorrow">{{ t('tomorrow') }}</option>
              <option value="this_week">{{ t('thisWeek') }}</option>
              <option value="daily">{{ t('daily') }}</option>
              <option value="weekday">{{ t('weekday') }}</option>
              <option value="custom_date">{{ editCustomDateTime ? formatDisplayDateTime(editCustomDateTime) : t('customDate') }}</option>
              <option value="weekly">{{ editWeekdays.length > 0 ? formatSelectedWeekdays(editWeekdays) : t('weekly') }}</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="editingTask = null">{{ t('cancel') }}</button>
            <button class="btn btn-primary" @click="saveTaskEdit">{{ t('save') }}{{ currentLanguage === 'zh' ? '更改' : ' Changes' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据报告弹窗 -->
    <div v-if="showReportModal" class="modal-overlay" @click.self="showReportModal = false">
      <div class="modal-content glass-card" style="background: white; max-width: 800px; width: 96%; max-height: 90vh; overflow-y: auto; padding: 1rem;">
        <div class="modal-header">
          <h3>📊 {{ t('dataReport') }}</h3>
          <button class="close-btn" @click="showReportModal = false">&times;</button>
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
              <input type="date" v-model="customStartDate" class="input" style="width: 150px;">
              <label style="margin-left: 1rem;">{{ currentLanguage === 'zh' ? '结束日期' : 'End Date' }}:</label>
              <input type="date" v-model="customEndDate" class="input" style="width: 150px;">
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

    <!-- 撤销Toast -->
    <transition name="toast-slide">
      <div v-if="showUndoToast" class="undo-toast">
        <span class="toast-message">{{ undoToastMessage }}</span>
        <button class="toast-undo-btn" @click="undoDelete">
          {{ currentLanguage === 'zh' ? '撤销' : 'UNDO' }}
        </button>
      </div>
    </transition>

    <!-- 底部抽屉 - 添加任务 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOfflineTaskStore } from '../stores/offlineTaskStore'
import { useOfflineUserStore } from '../stores/offlineUserStore'
import { Preferences } from '@capacitor/preferences'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { LocalNotifications } from '@capacitor/local-notifications'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import EChart from '../components/EChart.vue'
import { CountUp } from 'countup.js'

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
    completed: '已完成',
    pending: '待办',
    overdue: '已逾期',
    filter: '筛选',
    expand: '展开',
    collapse: '收起',
    // 搜索
    searchPlaceholder: '🔍 搜索任务名称或描述...',
    // 添加任务
    addTaskPlaceholder: '➕ 新建任务：输入任务名称...',
    descriptionPlaceholder: '📝 添加详细描述（可选）...',
    // 按钮
    add: '添加',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    // 任务类型
    today: '今天',
    tomorrow: '明天',
    thisWeek: '本周内',
    customDate: '指定日期',
    daily: '每天重复',
    weekday: '工作日重复',
    weekly: '每周重复',
    // 分类
    work: '工作',
    study: '学习',
    life: '生活',
    // 优先级
    high: '高',
    medium: '中',
    low: '低',
    // 其他
    refresh: '刷新',
    trash: '回收站',
    profile: '个人主页',
    // 弹窗标题
    changePassword: '修改密码',
    bindPhone: '绑定手机号',
    advancedFilter: '高级筛选',
    recycleBin: '回收站',
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
    exportTasks: '导出任务',
    importTasks: '导入任务',
    downloadTemplate: '下载模板',
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
    today: '今日',
    thisWeek: '本周',
    thisMonth: '本月',
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
    descriptionPlaceholder: '📝 Add description (optional)...',
    // 按钮
    add: 'Add',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    // 任务类型
    today: 'Today',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    customDate: 'Custom Date',
    daily: 'Daily',
    weekday: 'Weekdays',
    weekly: 'Weekly',
    // 分类
    work: 'Work',
    study: 'Study',
    life: 'Life',
    // 优先级
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    // 其他
    refresh: 'Refresh',
    trash: 'Trash',
    profile: 'Profile',
    // 弹窗标题
    changePassword: 'Change Password',
    bindPhone: 'Bind Phone',
    advancedFilter: 'Advanced Filter',
    recycleBin: 'Recycle Bin',
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
    exportTasks: 'Export',
    importTasks: 'Import',
    downloadTemplate: 'Template',
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
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
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

// 响应式数据
const newTaskText = ref('')
const newTaskDescription = ref('')
const newTaskType = ref('today')
const customDateTime = ref('')
const newTaskCategory = ref('work')
const newTaskPriority = ref('medium')
const newTaskDuration = ref('normal') // 短期任务时长：quick(0.5h) / normal(2h) / long(4h)
const newTaskScale = ref('small') // 长期任务规模：small(1-3天) / medium(1-2周) / large(1个月+)
const selectedWeekdays = ref([])
const currentFilter = ref('all')
const currentCategoryFilter = ref('all')
const currentPriorityFilter = ref('all')
const searchKeyword = ref('')
const startDate = ref('')
const endDate = ref('')
const countdownInterval = ref(null)
const showTrash = ref(false)
const showProfile = ref(false)
const showPomodoroStats = ref(false)
const showSupport = ref(false)
const showPrivacyPolicy = ref(false)
const showUserGuide = ref(false) // 使用指南弹窗
const showPomodoroRules = ref(false) // 番茄规则弹窗
const showWelcome = ref(false) // 首次登录欢迎弹窗
const showBackupReminder = ref(false) // 定期备份提醒弹窗
const showPasswordModal = ref(false)
const showPhoneModal = ref(false)
const showWeeklyModal = ref(false)
const showCustomDateModal = ref(false)
const showReportModal = ref(false) // 数据报告弹窗
const reportType = ref('weekly') // 报告类型（默认：周报）
const customStartDate = ref('') // 自定义开始日期
const customEndDate = ref('') // 自定义结束日期
const reportContent = ref('') // 报告内容（文本格式）
const reportData = ref({}) // 报告数据（结构化）
const editingTask = ref(null)
const editDescription = ref('')
const editText = ref('')
const editCategory = ref('work')
const editPriority = ref('medium')
const editType = ref('today')
const editCustomDateTime = ref('')
const editWeekdays = ref([])
const showAddForm = ref(true)
const currentPage = ref(1)
const pageSize = ref(6) // 改为响应式
const jumpToPage = ref('') // 跳转页码输入

// Bottom Sheet 状态
const showTaskDetail = ref(false)
const detailTask = ref(null)

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
const mainContent = ref(null)
const showFilterModal = ref(false)
const isRefreshing = ref(false)

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
const notifiedTasks = new Set() // 存储已提醒的任务ID

// 计算属性：按分类和时间筛选的任务（不按状态筛选，用于统计）
const baseFilteredTasks = computed(() => {
  return taskStore.getFilteredTasks('all', currentCategoryFilter.value, {
    start: startDate.value,
    end: endDate.value
  })
})

// 计算属性：完全筛选后的任务（包括状态筛选，用于显示）
const filteredTasks = computed(() => {
  let tasks = taskStore.getFilteredTasks(currentFilter.value, currentCategoryFilter.value, {
    start: startDate.value,
    end: endDate.value
  })
  
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

// 获取优先级显示文本（传统模式下 urgent 也显示为"高"）
const getPriorityLabel = (priority) => {
  if (priorityMode.value === 'traditional' && priority === 'urgent') {
    return t('high')
  }
  const option = priorityOptions.value.find(opt => opt.value === priority)
  return option ? option.label : priority
}

// 分类统计（基于当前时间筛选）
const getCategoryCount = (category) => {
  const filtered = taskStore.getFilteredTasks('all', category, {
    start: startDate.value,
    end: endDate.value
  })
  return filtered.length
}

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
  // 已完成任务获得的番茄数
  return taskStore.tasks
    .filter(t => t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const pendingPomodoros = computed(() => {
  // 待完成任务可获得的番茄数
  return taskStore.tasks
    .filter(t => t.status === TaskStatus.PENDING)
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const lostPomodoros = computed(() => {
  // 逾期任务扣除的番茄数
  return taskStore.tasks
    .filter(t => t.status === TaskStatus.OVERDUE)
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
})

const totalPomodoros = computed(() => {
  // 净获得番茄数 = 已获得 - 逾期扣除
  return earnedPomodoros.value - lostPomodoros.value
})

// 按分类统计番茄数
const getPomodorosByCategory = (category) => {
  return taskStore.tasks
    .filter(t => t.category === category && t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
}

// 按优先级统计番茄数
const getPomodorosByPriority = (priority) => {
  return taskStore.tasks
    .filter(t => t.priority === priority && t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
}

// 按时间统计番茄数
const getPomodorosByTime = (period) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  return taskStore.tasks
    .filter(t => {
      if (t.status !== TaskStatus.COMPLETED) return false
      const completedDate = new Date(t.created_at)
      
      if (period === 'today') {
        return completedDate >= today
      } else if (period === 'week') {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return completedDate >= weekStart
      } else if (period === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return completedDate >= monthStart
      }
      return false
    })
    .reduce((sum, t) => sum + getPomodoroCount(t), 0)
}

// 连续打卡天数
const getConsecutiveDays = () => {
  const completedTasks = taskStore.tasks
    .filter(t => t.status === TaskStatus.COMPLETED)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  if (completedTasks.length === 0) return 0
  
  let consecutive = 1
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let currentDate = new Date(completedTasks[0].created_at)
  currentDate.setHours(0, 0, 0, 0)
  
  // 如果最近完成的任务不是今天或昨天，返回0
  const daysDiff = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24))
  if (daysDiff > 1) return 0
  
  for (let i = 1; i < completedTasks.length; i++) {
    const prevDate = new Date(completedTasks[i].created_at)
    prevDate.setHours(0, 0, 0, 0)
    
    const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      consecutive++
      currentDate = prevDate
    } else if (diff > 1) {
      break
    }
  }
  
  return consecutive
}

// 单日最高番茄数
const getMaxDailyPomodoros = () => {
  const dailyStats = {}
  
  taskStore.tasks
    .filter(t => t.status === TaskStatus.COMPLETED)
    .forEach(t => {
      const date = new Date(t.created_at).toDateString()
      if (!dailyStats[date]) dailyStats[date] = 0
      dailyStats[date] += getPomodoroCount(t)
    })
  
  return Object.keys(dailyStats).length > 0 
    ? Math.max(...Object.values(dailyStats)) 
    : 0
}

// 完成率
const getCompletionRate = () => {
  const total = taskStore.tasks.length
  if (total === 0) return 0
  const completed = taskStore.tasks.filter(t => t.status === TaskStatus.COMPLETED).length
  return Math.round((completed / total) * 100)
}

// 近7天趋势数据
const getLast7DaysTrend = () => {
  const trend = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toDateString()
    
    const count = taskStore.tasks
      .filter(t => {
        if (t.status !== TaskStatus.COMPLETED) return false
        const taskDate = new Date(t.created_at)
        return taskDate.toDateString() === dateStr
      })
      .reduce((sum, t) => sum + getPomodoroCount(t), 0)
    
    const label = i === 0 ? t('todayLabel') : i === 1 ? t('yesterdayLabel') : `${date.getMonth() + 1}/${date.getDate()}`
    trend.push({ label, count, date: dateStr })
  }
  
  return trend
}

// 获取7天内最大值（用于柱状图高度计算）
const getMaxDailyInWeek = () => {
  const trend = getLast7DaysTrend()
  const max = Math.max(...trend.map(d => d.count))
  return max || 1 // 避免除以0
}

// 分类占比
const getCategoryPercent = (category) => {
  const total = earnedPomodoros.value
  if (total === 0) return 0
  const categoryCount = getPomodorosByCategory(category)
  return Math.round((categoryCount / total) * 100)
}

// 等级徽章
const getLevelBadge = () => {
  const total = earnedPomodoros.value
  if (total >= 500) return { icon: '👑', title: t('pomodoroMaster') }
  if (total >= 300) return { icon: '🏆', title: t('pomodoroExpert') }
  if (total >= 150) return { icon: '⭐', title: t('pomodoroTalent') }
  if (total >= 50) return { icon: '🌟', title: t('pomodoroRising') }
  return { icon: '🌱', title: t('pomodoroNovice') }
}

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

// 方法：快捷日期设置
const setQuickDate = (type) => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  if (type === 'today') {
    startDate.value = todayStr
    endDate.value = todayStr
  } else if (type === 'thisWeek') {
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    startDate.value = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    endDate.value = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`
  } else if (type === 'overdue') {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    startDate.value = '2020-01-01'
    endDate.value = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  }
  currentPage.value = 1
}

// 显示日期选择器
const showDatePicker = (type) => {
  const pickerRef = type === 'start' ? hiddenStartDate : hiddenEndDate
  pickerRef.value?.showPicker()
}

// 显示自定义日期时间选择器
const showCustomDateTimePicker = () => {
  hiddenCustomDateTime.value?.showPicker()
}

// 处理自定义日期时间变更
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
const filterTasks = () => {
  // 筛选逻辑已在taskStore中实现
}

// 方法：添加任务并关闭表单
const addTaskAndClose = async () => {
  await addTask()
  if (newTaskText.value.trim()) {
    showAddForm.value = false
  }
}

// 方法：添加任务
const addTask = async () => {
  if (!newTaskText.value.trim()) return
  
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
  
  // 解析日期时间
  let customDate = null
  let customTime = null
  if (newTaskType.value === 'custom_date' && customDateTime.value) {
    const dt = new Date(customDateTime.value)
    customDate = customDateTime.value.split('T')[0]
    customTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }
  
  const task = {
    text: newTaskText.value.trim(),
    description: newTaskDescription.value.trim(),
    type: newTaskType.value,
    category: newTaskCategory.value,
    priority: newTaskPriority.value,
    duration: newTaskDuration.value, // 新增：时长
    scale: newTaskScale.value, // 新增：规模
    weekdays: newTaskType.value === 'weekly' ? selectedWeekdays.value : null,
    customDate: customDate,
    customTime: customTime
  }
  
  await taskStore.addTask(task)
  
  // 清空输入
  newTaskText.value = ''
  newTaskDescription.value = ''
  newTaskType.value = 'today'
  customDateTime.value = ''
  newTaskCategory.value = 'work'
  newTaskPriority.value = 'medium'
  newTaskDuration.value = 'normal'
  newTaskScale.value = 'small'
  selectedWeekdays.value = []
  
  showNotification('任务添加成功！', 'success')
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
}

// 方法：获取今天日期（YYYY-MM-DD格式）
const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// 方法：切换任务完成状态
const toggleTaskCompletion = async (taskId) => {
  await taskStore.toggleTaskCompletion(taskId)
  // 完成任务时清除提醒记录
  notifiedTasks.delete(`urgent_${taskId}`)
  notifiedTasks.delete(`overdue_${taskId}`)
}

// 方法：删除任务
const deleteTask = async (taskId) => {
  // 保存待删除任务信息
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (!task) return
  
  pendingDeleteTask = { ...task }
  
  // 立即从界面移除（视觉上删除）
  await taskStore.deleteTask(taskId)
  
  // 清除提醒记录
  notifiedTasks.delete(`urgent_${taskId}`)
  notifiedTasks.delete(`overdue_${taskId}`)
  
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
  showNotification('任务已恢复！', 'success')
}

// 方法：彻底删除
const permanentDelete = async (taskId) => {
  if (confirm('确定要永久删除此任务吗？此操作不可撤销。')) {
    await taskStore.permanentDeleteTask(taskId)
    showNotification('任务已永久删除！', 'error')
  }
}

// 方法：打开编辑模态框
const openEditModal = (task) => {
  editingTask.value = { ...task }
  editText.value = task.text
  editDescription.value = task.description || ''
  editCategory.value = task.category
  editPriority.value = task.priority
  editType.value = task.type
  
  // 组合日期和时间为datetime-local格式
  if (task.customDate) {
    editCustomDateTime.value = task.customDate + (task.customTime ? `T${task.customTime}` : 'T00:00')
  } else {
    editCustomDateTime.value = ''
  }
  
  editWeekdays.value = task.weekdays ? [...task.weekdays] : []
}

// 方法：打开任务详情抽屉
const openTaskDetail = (task) => {
  detailTask.value = task
  showTaskDetail.value = true
}

// 方法：关闭任务详情抽屉
const closeTaskDetail = () => {
  showTaskDetail.value = false
  detailTask.value = null
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
  // 其他类型清空相关数据
  else {
    editCustomDateTime.value = ''
    editWeekdays.value = []
  }
}

// 方法：确认自定义日期选择
const confirmCustomDate = () => {
  if (editingTask.value) {
    // 如果是编辑任务，同步到编辑表单
    editCustomDateTime.value = customDateTime.value
  }
  showCustomDateModal.value = false
}

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
    weekdays: editType.value === 'weekly' ? editWeekdays.value : []
  })
  
  editingTask.value = null
  showNotification('任务已更新！', 'success')
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
  const completedTasksList = periodTasks.filter(t => t.status === TaskStatus.COMPLETED)
  const textTaskFrequency = {}
  completedTasksList.forEach(task => {
    const key = task.text.trim().toLowerCase()
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
    const hasRichDescription = task.description.trim().length > 10
    if (hasRichDescription) score++
    const isHighValueTask = (task.priority === 'high' || task.priority === 'urgent') && getPomodoroCount(task) >= 4
    if (isHighValueTask) score++
    const taskKey = task.text.trim().toLowerCase()
    const isRareEvent = textTaskFrequency[taskKey] && textTaskFrequency[taskKey].count < 3
    if (isRareEvent) score++
    return score >= 2
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  // 去重：按任务名称去重，只保留最新的一条
  const textMilestonesMap = {}
  textMilestonesRaw.forEach(task => {
    const key = task.text.trim().toLowerCase()
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
    ? taskStore.tasks.filter(t => t.status !== TaskStatus.COMPLETED)
    : periodTasks.filter(t => t.status !== TaskStatus.COMPLETED)
    
  if (incompleteTasks.length > 0) {
    // 按任务名称去重，保留优先级最高的
    const incompleteTasksMap = {}
    incompleteTasks.forEach(task => {
      const key = task.text.trim().toLowerCase()
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
    const key = task.text.trim().toLowerCase()
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
    const hasRichDescription = task.description.trim().length > 10
    if (hasRichDescription) score++
    
    // 条件2：高优且耗时（优先级=高 且 番茄钟≥4）
    const isHighValueTask = (task.priority === 'high' || task.priority === 'urgent') && getPomodoroCount(task) >= 4
    if (isHighValueTask) score++
    
    // 条件3：低频独立特征（该任务名称在周期内出现次数<3）
    const taskKey = task.text.trim().toLowerCase()
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
const exportPoster = async () => {
  try {
    const reportElement = document.querySelector('.report-preview-cards')
    if (!reportElement) {
      alert(currentLanguage.value === 'zh' ? '未找到报告内容，请先生成报告' : 'Report content not found, please generate report first')
      return
    }
    
    // 显示加载提示
    const loadingMsg = currentLanguage.value === 'zh' ? '正在生成海报...' : 'Generating poster...'
    const button = event.target
    const originalText = button.textContent
    button.textContent = loadingMsg
    button.disabled = true
    
    // 保存原始滚动位置和样式
    const modalBody = document.querySelector('.modal-body')
    const originalOverflow = modalBody.style.overflow
    const originalMaxHeight = modalBody.style.maxHeight
    const originalScrollTop = modalBody.scrollTop
    
    // 临时移除滚动限制，显示完整内容
    modalBody.style.overflow = 'visible'
    modalBody.style.maxHeight = 'none'
    
    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 生成海报（完整内容）
    const canvas = await html2canvas(reportElement, {
      backgroundColor: '#f5f5f5',
      scale: 3, // 提高清晰度（3倍分辨率）
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowHeight: reportElement.scrollHeight, // 关键：设置为完整高度
      height: reportElement.scrollHeight,
      width: reportElement.scrollWidth,
      scrollX: 0,
      scrollY: 0
    })
    
    // 恢复原始样式
    modalBody.style.overflow = originalOverflow
    modalBody.style.maxHeight = originalMaxHeight
    modalBody.scrollTop = originalScrollTop
    
    // 转换为图片并下载
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const filename = `${reportData.value.title}_${new Date().getTime()}.png`
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // 恢复按钮状态
      button.textContent = originalText
      button.disabled = false
      
      alert(currentLanguage.value === 'zh' ? '海报已保存（高清版）' : 'Poster saved (HD)')
    }, 'image/png', 1.0) // 最高质量
  } catch (err) {
    console.error('导出海报失败:', err)
    // 确保恢复样式
    const modalBody = document.querySelector('.modal-body')
    if (modalBody) {
      modalBody.style.overflow = ''
      modalBody.style.maxHeight = ''
    }
    alert(currentLanguage.value === 'zh' ? '导出失败，请重试' : 'Export failed, please try again')
    // 恢复按钮状态
    if (event.target) {
      event.target.disabled = false
    }
  }
}

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

// 方法：格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
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
const exportToExcel = async () => {
  const tasks = taskStore.tasks
  
  if (tasks.length === 0) {
    alert('暂无任务数据可导出')
    return
  }
  
  try {
    // 准备导出数据（完整字段）
    const exportData = tasks.map(task => {
      // 计算实际耗时
      let actualHours = ''
      if (task.status === 'completed' && task.completed_at && task.created_at) {
        actualHours = calculateActualHours(task) || ''
      }
      
      // 时长/规模
      let durationScale = ''
      if (task.duration) {
        durationScale = task.duration === 'quick' ? '快速(0.5h)' : 
                       task.duration === 'normal' ? '正常(2h)' : '较长(4h)'
      } else if (task.scale) {
        durationScale = task.scale === 'small' ? '小型' : 
                       task.scale === 'medium' ? '中型' : '大型'
      }
      
      const data = {
        '任务名称': task.text || '',
        '详细描述': task.description || '',
        '任务类型': getTaskTypeText(task) || '',
        '分类': getCategoryText(task.category) || '',
        '优先级': getPriorityText(task.priority) || '',
        '状态': task.status === 'completed' ? '已完成' : task.status === 'overdue' ? '已逾期' : '待办',
        '创建时间': task.created_at ? formatDateTime(task.created_at) : '',
        '截止时间': (task.status !== 'completed' && getDeadlineDate(task)) ? formatDateTime(getDeadlineDate(task)) : '',
        '计划完成时间': (task.status === 'completed' && getPlannedDeadlineDate(task)) ? formatDateTime(getPlannedDeadlineDate(task)) : '',
        '实际完成时间': (task.status === 'completed' && task.completed_at) ? formatDateTime(task.completed_at) : '',
        '实际耗时': actualHours,
        '番茄数': getPomodoroCount(task) || 0,
        '时长/规模': durationScale,
        '指定日期': task.customDate || '',
        '指定时间': task.customTime || '',
        '重复周期': (task.weekdays && task.weekdays.length > 0) ? formatSelectedWeekdays(task.weekdays) : '',
        '任务ID': task.id || ''
      }
      return data
    })
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '我的任务')
    
    // 生成文件名
    const filename = `TODO任务_${currentUsername.value}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    
    // 检测运行环境
    const isNative = Capacitor.isNativePlatform()
    
    if (isNative) {
      // 原生应用：保存到文件系统
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
      await Filesystem.writeFile({
        path: filename,
        data: wbout,
        directory: Directory.Documents
      })
      showNotification(`文件已保存到：文档/${filename}`, 'success')
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
const getTaskTypeText = (task) => {
  switch (task.type) {
    case 'today':
      return t('today')
    case 'tomorrow':
      return t('tomorrow')
    case 'this_week':
      return t('thisWeek')
    case 'custom_date':
      if (task.customDate) {
        const date = new Date(task.customDate)
        const month = date.getMonth() + 1
        const day = date.getDate()
        let text = `${month}/${day}`
        // 如果有具体时间，也显示时间
        if (task.customTime) {
          text += ` ${task.customTime}`
        }
        return text
      }
      return t('customDate')
    case 'daily':
      return t('daily')
    case 'weekday':
      return t('weekday')
    case 'weekly':
      if (task.weekdays) {
        const selectedDays = task.weekdays.map(day => weekdays[day]).join(',')
        return currentLanguage.value === 'zh' ? `每周${selectedDays}` : `Weekly: ${selectedDays}`
      }
      return t('weekly')
    default:
      return ''
  }
}

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

// 方法：下载导入模板
const downloadTemplate = () => {
  const templateUrl = 'https://github.com/zhaosj0315/TO-DO/raw/main/TODO%E5%AF%BC%E5%85%A5%E6%A8%A1%E6%9D%BF%E7%A4%BA%E4%BE%8B.xlsx'
  const link = document.createElement('a')
  link.href = templateUrl
  link.download = 'TODO导入模板示例.xlsx'
  link.click()
  showNotification('开始下载导入模板...', 'success')
}

// 方法：导入任务
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
        
        let successCount = 0
        let errorCount = 0
        
        for (const row of rows) {
          try {
            const taskName = row['任务名称']?.trim()
            if (!taskName) {
              errorCount++
              continue
            }
            
            const category = parseCategoryText(row['分类'])
            const priority = parsePriorityText(row['优先级'])
            const type = parseTypeText(row['类型'])
            const status = parseStatusText(row['状态'])
            const createdAt = parseDateTime(row['创建时间'])
            
            const newTask = {
              id: Date.now() + successCount,
              text: taskName,
              description: row['详细描述'] || '',
              type: type,
              category: category,
              priority: priority,
              weekdays: type === 'weekly' ? parseWeekdays(row['类型']) : [],
              status: status,
              created_at: createdAt,
              user_id: currentUsername.value
            }
            
            // 如果是已完成状态，设置完成时间
            if (status === 'completed') {
              const completedTime = parseDateTime(row['实际完成时间'])
              newTask.completed_at = completedTime || createdAt
            }
            
            await taskStore.addTask(newTask)
            successCount++
          } catch (err) {
            console.error('导入单条任务失败:', err)
            errorCount++
          }
        }
        
        showNotification(`导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`, 'success')
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

// 解析分类文本
const parseCategoryText = (text) => {
  const map = { '工作': 'work', '学习': 'study', '生活': 'life' }
  return map[text] || 'work'
}

// 解析优先级文本
const parsePriorityText = (text) => {
  const map = { '高': 'high', '中': 'medium', '低': 'low' }
  return map[text] || 'medium'
}

// 解析类型文本
const parseTypeText = (text) => {
  if (!text) return 'today'
  if (text === '仅今天') return 'today'
  if (text === '每天') return 'daily'
  if (text.includes('每周')) return 'weekly'
  return 'today'
}

// 解析状态文本
const parseStatusText = (text) => {
  if (text === '已完成') return 'completed'
  if (text === '已逾期') return 'overdue'
  return 'pending'
}

// 解析周期（从类型字段提取）
const parseWeekdays = (text) => {
  if (!text || !text.includes('每周')) return []
  const dayMap = { '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0 }
  const days = []
  for (const [key, value] of Object.entries(dayMap)) {
    if (text.includes(key)) days.push(value)
  }
  return days
}

// 解析日期时间
const parseDateTime = (text) => {
  if (!text) return new Date().toISOString()
  try {
    // 处理字符串格式
    if (typeof text === 'string') {
      // 替换斜杠为横杠，统一格式
      const normalized = text.replace(/\//g, '-')
      const date = new Date(normalized)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    // 处理Excel日期数字格式
    if (typeof text === 'number') {
      // Excel日期是从1900-01-01开始的天数
      const excelEpoch = new Date(1900, 0, 1)
      const date = new Date(excelEpoch.getTime() + (text - 2) * 86400000)
      return date.toISOString()
    }
    // 直接尝试转换
    const date = new Date(text)
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

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
  if (!task.completed_at || !task.created_at) return null
  const createdTime = new Date(task.created_at).getTime()
  const completedTime = new Date(task.completed_at).getTime()
  const hours = (completedTime - createdTime) / (1000 * 60 * 60)
  
  // 四舍五入到整数小时
  const roundedHours = Math.round(hours)
  return `${roundedHours}h`
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
const getPlannedDeadlineText = (task) => {
  const deadline = calculateDeadline(task)
  if (!deadline) return t('noDeadline')
  
  const date = new Date(deadline)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hour}:${minute}`
}

// 方法：获取任务截止时间文本
const getDeadlineText = (task) => {
  // 已完成任务：显示完成状态（准时/逾期）
  if (task.status === 'completed') {
    const deadline = calculateDeadline(task)
    if (!deadline) return '✅ 已完成'
    
    const completedTime = new Date(task.completed_at || task.created_at)
    const isOnTime = completedTime <= deadline
    
    return isOnTime ? '🏁 准时完成' : '⚠️ 逾期完成'
  }
  
  const deadline = calculateDeadline(task)
  if (!deadline) return t('noDeadline')
  
  const now = new Date()
  const diff = deadline - now
  
  if (diff < 0) {
    // 已逾期
    const absDiff = Math.abs(diff)
    const hours = Math.floor(absDiff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    
    if (days > 0) return `${t('overdue')} ${days}${t('days')} ${remainingHours}${t('hours')}`
    return `${t('overdue')} ${hours}${t('hours')}`
  } else {
    // 未逾期
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    
    const date = new Date(deadline)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    // 始终显示具体日期格式（不使用"今天"、"明天"）
    const dateStr = `${year}/${month}/${day} ${hour}:${minute}`
    
    // 添加剩余时间提醒
    if (days > 0) return `${dateStr} (${t('remaining')} ${days}${t('days')})`
    return `${dateStr} (${t('onlyRemaining')} ${hours}${t('hours')})`
  }
}

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

// 方法：获取截止时间颜色类
const getDeadlineClass = (task) => {
  if (task.status === TaskStatus.COMPLETED) return 'deadline-completed'
  
  const deadline = calculateDeadline(task)
  if (!deadline) return ''
  
  const now = new Date()
  const diff = deadline - now
  const hours = diff / (1000 * 60 * 60)
  
  if (diff < 0) return 'deadline-overdue'        // 已逾期：红色
  if (hours <= 1) return 'deadline-urgent'       // 小于1小时：红色
  if (hours <= 6) return 'deadline-warning'      // 小于6小时：橙色
  return 'deadline-normal'                        // 正常：蓝色
}

// 方法：显示通知
const emit = defineEmits(['notify'])
const showNotification = (message, type = 'info') => {
  emit('notify', { message, type })
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
  
  // 重置所有筛选条件到初始状态
  currentFilter.value = 'all'
  currentCategoryFilter.value = 'all'
  currentPriorityFilter.value = 'all'
  searchKeyword.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  
  // 重新加载数据
  await taskStore.setCurrentUser(userStore.currentUser)
  await loadUserInfo()
  taskStore.checkOverdueTasks()

  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
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
  
  taskStore.tasks.forEach(task => {
    if (task.status === 'completed') return
    
    const deadline = calculateDeadline(task)
    if (!deadline) return
    
    const timeLeft = deadline - now
    const hoursLeft = timeLeft / (1000 * 60 * 60)
    const tomatoCount = task.priority === 'high' ? 4 : task.priority === 'medium' ? 2 : 1
    
    // 1小时内即将逾期的任务
    if (hoursLeft > 0 && hoursLeft <= 1) {
      const notifyKey = `urgent_${task.id}`
      if (notifiedTasks.has(notifyKey)) return // 已提醒过，跳过
      
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60)
      const randomMsg = urgentMessages[Math.floor(Math.random() * urgentMessages.length)]
      notifications.push({
        title: `⏰ ${task.text}`,
        body: `还剩 ${minutes} 分钟！${randomMsg}\n${tomatoCount}个番茄岌岌可危 ${'🍅'.repeat(tomatoCount)}`,
        id: task.id,
        schedule: { at: new Date(Date.now() + 100) }
      })
      notifiedTasks.add(notifyKey) // 记录已提醒
    }
    // 已逾期但还未标记的任务
    else if (timeLeft < 0 && task.status !== 'overdue') {
      const notifyKey = `overdue_${task.id}`
      if (notifiedTasks.has(notifyKey)) return // 已提醒过，跳过
      
      const randomMsg = overdueMessages[Math.floor(Math.random() * overdueMessages.length)]
      notifications.push({
        title: `❌ ${task.text}`,
        body: `${randomMsg}\n损失 ${tomatoCount}个番茄 ${'💔'.repeat(tomatoCount)}`,
        id: task.id + 100000,
        schedule: { at: new Date(Date.now() + 100) }
      })
    }
  })
  
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

// 监听报告弹窗打开，自动生成报告（已禁用，改为手动生成）
// watch(showReportModal, (newVal) => {
//   if (newVal) {
//     generateReportContent()
//   }
// })

onMounted(async () => {
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
  
  // 设置任务Store的当前用户并加载该用户的任务
  await taskStore.setCurrentUser(userStore.currentUser)
  
  // 检查是否首次登录
  const { value: hasSeenWelcome } = await Preferences.get({ key: `welcome_${userStore.currentUser}` })
  if (!hasSeenWelcome) {
    showWelcome.value = true
    await Preferences.set({ key: `welcome_${userStore.currentUser}`, value: 'true' })
  }
  
  // 检查是否需要备份提醒
  await checkBackupReminder()
  
  // 请求通知权限
  await LocalNotifications.requestPermissions()
  
  countdownInterval.value = setInterval(() => {
    taskStore.checkOverdueTasks()
    checkAndNotifyDeadline()
  }, 60000) // 每分钟检查一次
  
  // 首次立即检查
  checkAndNotifyDeadline()
})

// 生命周期钩子：组件卸载时
onUnmounted(() => {
  if (countdownInterval.value) clearInterval(countdownInterval.value)
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
  padding: 0.5rem 0.8rem;
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
  margin: 0 0 0.8rem 0;
  border: none;
  box-shadow: none;
  width: 100%;
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
  flex-direction: column-reverse;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.1rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  height: 44px;
  box-sizing: border-box;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
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
  font-size: 0.9rem;
  line-height: 1;
}

.label-small {
  font-size: 0.65rem;
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
  font-size: 0.6rem; /* 极小标签 */
  color: #888;
  margin-top: 1px;
  font-weight: 600;
  white-space: nowrap; /* 强制不换行 */
}

.stat-card .stat-value {
  font-size: 0.9rem; /* 适中数字 */
  font-weight: 800;
  color: #222;
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
  margin-bottom: 0.4rem; /* 减少底部边距 */
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

/* v1.2: 任务卡片触摸反馈 */
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 6px; /* 调整至6px，平衡紧凑与呼吸感 */
  padding: 0.8rem;
  background: white;
  border-radius: 12px;
  margin: 0 0 1rem 0 !important; /* 增加底部间距 */
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
/* 任务标题行（标题+删除按钮） */
.task-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.task-title {
  font-size: 0.875rem; /* 14px */
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1.4;
  flex: 1;
}

.task-title:hover {
  color: var(--primary-color);
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
  color: #888;
  margin-top: 0.25rem;
  line-height: 1.4;
  max-width: 100%;
  word-wrap: break-word;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
  margin-top: 0.35rem;
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
  gap: 0.5rem;
  align-items: center;
  /* 胶囊化封装 - iOS风格 */
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 0.4rem 0.6rem;
  border-radius: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 0.8rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--glass-border);
  width: 100%;
}

.user-info h1 {
  font-size: 1.4rem;
  margin: 0;
}

/* 统一的圆形图标按钮 */
.btn-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.btn-icon-circle:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
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

/* 刷新按钮特殊尺寸和样式 */
.btn-refresh-icon {
  font-size: 1.6rem;
  background: rgba(102, 126, 234, 0.25) !important;
  color: white !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-refresh-icon:hover {
  background: rgba(102, 126, 234, 0.4) !important;
  color: white !important;
}

/* 回收站按钮 */
.btn-trash {
  font-size: 1.1rem;
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.btn-avatar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.avatar-mini {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 800;
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

.data-buttons {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
}

.btn-export, .btn-import, .btn-template {
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
  z-index: 1000;
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
  animation: fadeIn 0.2s ease;
}

.bottom-sheet {
  background: white;
  width: 100%;
  max-height: 75vh;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bottom-sheet-header {
  position: relative;
  padding: 1rem 1.5rem 0.8rem;
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
  padding: 1.5rem;
  flex: 1;
}

.detail-section {
  margin-bottom: 1.5rem;
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
  padding: 0.6rem 0.8rem; /* 从0.8rem 1rem减至0.6rem 0.8rem，压缩高度 */
  border: 2px solid #d0d0d0;
  border-radius: 10px;
  font-size: 0.85rem; /* 从0.9rem减至0.85rem */
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

.date-separator {
  color: #999;
  font-size: 0.8rem; /* 从0.85rem减至0.8rem */
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

/* 新标签样式 - 水平布局 */
.filter-chip-tag {
  flex-direction: row !important;
  justify-content: flex-start !important;
  gap: 0.5rem !important;
  padding: 0.5rem 0.8rem !important;
}

.chip-label-main {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  flex: 1;
  text-align: left;
}

.chip-count-badge {
  font-weight: 400;
  font-size: 0.75rem;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
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

.edit-field {
  margin-bottom: 1.5rem;
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
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
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
}

.task-textarea-desc {
  width: 100%;
  padding: 0.5rem 1.2rem;
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
  color: rgba(255, 255, 255, 0.7);
}

.footer-copyright {
  color: rgba(255, 255, 255, 0.7);
}

.footer-divider {
  color: rgba(255, 255, 255, 0.3);
  margin: 0 0.2rem;
}

.footer-text {
  color: rgba(255, 255, 255, 0.7);
}

.footer-link {
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s;
  border-bottom: 1px solid transparent;
}

.footer-link:hover {
  color: rgba(255, 255, 255, 1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
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
</style>