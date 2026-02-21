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
              <span class="icon-small">🔍</span>
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

        <!-- 第二行：搜索框 -->
        <div class="action-bar">
          <!-- 搜索框 -->
          <div class="search-container">
            <input 
              v-model="searchKeyword" 
              type="text" 
              class="search-input-main" 
              :placeholder="t('searchPlaceholder')"
              @input="handleSearch"
            >
            <button v-if="searchKeyword" class="clear-search-btn" @click="clearSearch">✕</button>
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

          <!-- 任务描述（可选） -->
          <div class="add-form-row-desc" v-if="newTaskText.trim()">
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

            <!-- 提交按钮 -->
            <button class="btn-submit-main" @click="addTask" title="添加任务">✓</button>
          </div>
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
            <div class="task-content">
              <span class="task-title" @click="openEditModal(task)" title="点击编辑详情">{{ task.text }}</span>
              <div v-if="task.description" class="task-description">{{ task.description }}</div>
              <div class="task-meta">
                <span class="task-time" title="添加时间">📝 {{ formatDateTime(task.created_at) }}</span>
                <span class="task-deadline" :class="getDeadlineClass(task)" title="计划完成时间">⏰ {{ getDeadlineText(task) }}</span>
                <span class="task-type badge">{{ getTaskTypeText(task) }}</span>
                <span class="badge badge-icon" :class="`priority-${task.priority}`" :title="`优先级: ${getPriorityText(task.priority)}`">
                  ⚡ {{ getPriorityText(task.priority) }}
                </span>
                <span class="badge badge-icon" :class="`category-${task.category}`" :title="`分类: ${getCategoryText(task.category)}`">
                  🏷️ {{ getCategoryText(task.category) }}
                </span>
                <span class="badge badge-pomodoro" :class="`pomodoro-${task.priority}`" :title="`预估番茄数: ${getPomodoroCount(task.priority)}个`">
                  <span v-for="n in getPomodoroCount(task.priority)" :key="n">🍅</span>
                </span>
              </div>
            </div>
            <!-- v1.2: 增大删除按钮点击区域 -->
            <button class="btn-delete-touch" @click="deleteTask(task.id)" title="删除任务">
              ×
            </button>
          </li>
        </ul>
        <div v-else class="empty-state">
          <img src="https://illustrations.popsy.co/purple/taking-notes.svg" alt="empty" style="width: 150px; opacity: 0.5; margin-bottom: 1rem;">
          <p>任务清单空空如也，开启高效的一天吧！</p>
        </div>
        
        <!-- 分页控件 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1" 
            @click="currentPage--"
          >
            ‹
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages" 
            @click="currentPage++"
          >
            ›
          </button>
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
                {{ currentLanguage === 'zh' ? '联系支持' : 'Support' }}
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
          <h3>🔍 {{ t('advancedFilter') }}</h3>
          <button class="close-btn" @click="showFilterModal = false">&times;</button>
        </div>
        <div class="modal-body filter-body">
          <!-- 日期范围 -->
          <div class="filter-section">
            <label class="filter-label">📅 {{ t('dateRange') }}</label>
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

          <!-- 分类筛选 -->
          <div class="filter-section">
            <label class="filter-label">🏷️ {{ t('category') }}</label>
            <div class="filter-buttons">
              <button 
                v-for="cat in categories" 
                :key="cat.value"
                class="filter-chip" 
                :class="{ active: currentCategoryFilter === cat.value }"
                @click="setCategoryFilter(cat.value)"
              >
                <span class="chip-label">{{ cat.label }}</span>
                <span class="chip-count">{{ getCategoryCount(cat.value) }}</span>
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
                class="filter-chip" 
                :class="{ active: currentPriorityFilter === opt.value, [`priority-${opt.value}`]: true }"
                @click="setPriorityFilter(opt.value)"
              >
                <span class="chip-label">{{ opt.label }}</span>
                <span class="chip-count">{{ opt.count }}</span>
              </button>
            </div>
          </div>

          <!-- 关键字搜索 -->
          <div class="filter-section">
            <label class="filter-label">🔍 {{ t('keywordSearch') }}</label>
            <div class="search-input-wrapper">
              <input 
                v-model="searchKeyword" 
                type="text" 
                class="search-input-modal" 
                :placeholder="t('searchTaskPlaceholder')"
                @input="handleSearch"
              >
              <button v-if="searchKeyword" class="clear-btn-small" @click="clearSearch">{{ t('clear') }}</button>
            </div>
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
          <h3>💝 {{ currentLanguage === 'zh' ? '联系与支持' : 'Contact & Support' }}</h3>
          <button class="close-btn" @click="showSupport = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="support-desc">{{ currentLanguage === 'zh' ? '遇到bug别慌，扫码找我唠唠；用得爽了，请我喝杯奶茶呗 ☕' : 'Found a bug? Scan to contact me. Enjoying the app? Buy me a coffee ☕' }}</p>
          
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
            <span class="contact-icon">📞</span>
            <span class="contact-text">{{ currentLanguage === 'zh' ? '联系电话：17858441076' : 'Phone: 17858441076' }}</span>
          </div>
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
              <select v-model="reportType" class="input" style="width: 150px;" @change="generateReportContent">
                <option value="weekly">{{ t('weeklyReport') }}</option>
                <option value="monthly">{{ t('monthlyReport') }}</option>
                <option value="quarterly">{{ t('quarterlyReport') }}</option>
                <option value="yearly">{{ t('yearlyReport') }}</option>
              </select>
            </div>
          </div>

          <!-- 报告预览 - 卡片式UI -->
          <div class="report-preview-cards">
            <!-- 报告头部 -->
            <div class="report-header">
              <h2>{{ reportData.title }}</h2>
              <p class="report-period">{{ reportData.period }}</p>
              <p class="report-meta">{{ currentLanguage === 'zh' ? '汇报人' : 'Reporter' }}: {{ currentUsername }} | {{ currentLanguage === 'zh' ? '生成时间' : 'Generated' }}: {{ reportData.generatedTime }}</p>
            </div>

            <!-- 核心数据卡片 -->
            <div class="report-stats-grid">
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
            <div class="report-section" v-if="reportData.dailyTrend && reportData.dailyTrend.length > 0">
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

            <!-- 高频任务（聚合去重） -->
            <div class="report-section" v-if="reportData.aggregatedTasks && reportData.aggregatedTasks.length > 0">
              <h3 class="section-title">{{ currentLanguage === 'zh' ? '🔥 高频任务 Top 10' : '🔥 Most Frequent Tasks' }}</h3>
              <div class="aggregated-tasks">
                <div v-for="(task, index) in reportData.aggregatedTasks" :key="index" class="aggregated-task-item">
                  <div class="task-rank">{{ index + 1 }}</div>
                  <div class="task-info">
                    <div class="task-name">{{ task.text }}</div>
                    <div class="task-stats">
                      <span class="task-frequency">{{ currentLanguage === 'zh' ? '完成' : 'Done' }} {{ task.count }} {{ currentLanguage === 'zh' ? '次' : 'times' }}</span>
                      <span class="task-pomodoros">🍅 {{ task.pomodoros }}</span>
                      <span class="task-persistence">{{ currentLanguage === 'zh' ? '坚持度' : 'Persistence' }} {{ Math.min(100, task.count * 20) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 重点任务 -->
            <div class="report-section">
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
          <button class="btn btn-secondary" @click="copyReportText">{{ t('copyText') }}</button>
          <button class="btn btn-secondary" @click="exportMarkdown">{{ t('exportMarkdown') }}</button>
          <button class="btn btn-primary" @click="showReportModal = false">{{ t('close') }}</button>
        </div>
      </div>
    </div>

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
import EChart from '../components/EChart.vue'

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
    dataReportDesc: '生成周报、月报、年报',
    generateReport: '生成报告',
    reportType: '报告类型',
    weeklyReport: '周报',
    monthlyReport: '月报',
    quarterlyReport: '季报',
    yearlyReport: '年报',
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
    weeklyReport: 'Weekly',
    monthlyReport: 'Monthly',
    quarterlyReport: 'Quarterly',
    yearlyReport: 'Yearly',
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
const showPasswordModal = ref(false)
const showPhoneModal = ref(false)
const showWeeklyModal = ref(false)
const showCustomDateModal = ref(false)
const showReportModal = ref(false) // 数据报告弹窗
const reportType = ref('weekly') // 报告类型
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
const pageSize = 6
const fileInput = ref(null)
const mainContent = ref(null)
const showFilterModal = ref(false)
const isRefreshing = ref(false)

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
    .reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
})

const pendingPomodoros = computed(() => {
  // 待完成任务可获得的番茄数
  return taskStore.tasks
    .filter(t => t.status === TaskStatus.PENDING)
    .reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
})

const lostPomodoros = computed(() => {
  // 逾期任务扣除的番茄数
  return taskStore.tasks
    .filter(t => t.status === TaskStatus.OVERDUE)
    .reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
})

const totalPomodoros = computed(() => {
  // 净获得番茄数 = 已获得 - 逾期扣除
  return earnedPomodoros.value - lostPomodoros.value
})

// 按分类统计番茄数
const getPomodorosByCategory = (category) => {
  return taskStore.tasks
    .filter(t => t.category === category && t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
}

// 按优先级统计番茄数
const getPomodorosByPriority = (priority) => {
  return taskStore.tasks
    .filter(t => t.priority === priority && t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
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
    .reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
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
      dailyStats[date] += getPomodoroCount(t.priority)
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
      .reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
    
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
  return Math.ceil(filteredTasks.value.length / pageSize)
})

// 计算属性：当前页的任务
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
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
  await taskStore.deleteTask(taskId)
  // 删除任务时清除提醒记录
  notifiedTasks.delete(`urgent_${taskId}`)
  notifiedTasks.delete(`overdue_${taskId}`)
  showNotification('任务已移至回收站！', 'info')
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

// 方法：生成报告内容
const generateReportContent = () => {
  const now = new Date()
  let startDate, endDate, periodName
  
  // 计算时间范围
  switch (reportType.value) {
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
    .reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
  
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
  
  // 工作日数
  const workDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
  
  // 生成报告文本
  const reportTitle = currentLanguage.value === 'zh' 
    ? `【${reportType.value === 'weekly' ? '工作周报' : reportType.value === 'monthly' ? '月度总结' : reportType.value === 'quarterly' ? '季度报告' : '年度总结'}】${periodName}`
    : `【${reportType.value === 'weekly' ? 'Weekly Report' : reportType.value === 'monthly' ? 'Monthly Summary' : reportType.value === 'quarterly' ? 'Quarterly Report' : 'Annual Summary'}】${periodName}`
  
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
    ? `工作日：${workDays}天  |  日均完成：${avgTasksPerDay}任务  |  日均番茄：${(totalPomodoros / workDays).toFixed(1)}个\n\n\n`
    : `Work Days: ${workDays}  |  Avg Tasks: ${avgTasksPerDay}/day  |  Avg Pomodoros: ${(totalPomodoros / workDays).toFixed(1)}/day\n\n\n`
  
  // 第二部分：分类统计
  report += `${doubleSeparator}\n`
  report += currentLanguage.value === 'zh' ? '【第二部分】分类统计 - Category Statistics\n' : '【Part 2】Category Statistics\n'
  report += `${doubleSeparator}\n\n`
  
  report += currentLanguage.value === 'zh' ? '一、按工作分类统计\n' : '1. By Category\n'
  report += `${separator}\n\n`
  
  // 工作类任务
  const workCompleted = byCategory.work.filter(t => t.status === TaskStatus.COMPLETED).length
  const workTotal = byCategory.work.length
  const workRate = workTotal > 0 ? Math.round((workCompleted / workTotal) * 100) : 0
  const workPomodoros = byCategory.work.filter(t => t.status === TaskStatus.COMPLETED).reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
  
  report += `💼 ${t('work')} (${workTotal}${currentLanguage.value === 'zh' ? '项' : ' tasks'})\n`
  report += `${currentLanguage.value === 'zh' ? '已完成' : 'Completed'}: ${workCompleted}${currentLanguage.value === 'zh' ? '项' : ''} (${workRate}%)  |  ${currentLanguage.value === 'zh' ? '番茄' : 'Pomodoros'}: ${workPomodoros}${currentLanguage.value === 'zh' ? '个' : ''}\n\n`
  
  // 学习类任务
  const studyCompleted = byCategory.study.filter(t => t.status === TaskStatus.COMPLETED).length
  const studyTotal = byCategory.study.length
  const studyRate = studyTotal > 0 ? Math.round((studyCompleted / studyTotal) * 100) : 0
  const studyPomodoros = byCategory.study.filter(t => t.status === TaskStatus.COMPLETED).reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
  
  report += `📚 ${t('study')} (${studyTotal}${currentLanguage.value === 'zh' ? '项' : ' tasks'})\n`
  report += `${currentLanguage.value === 'zh' ? '已完成' : 'Completed'}: ${studyCompleted}${currentLanguage.value === 'zh' ? '项' : ''} (${studyRate}%)  |  ${currentLanguage.value === 'zh' ? '番茄' : 'Pomodoros'}: ${studyPomodoros}${currentLanguage.value === 'zh' ? '个' : ''}\n\n`
  
  // 生活类任务
  const lifeCompleted = byCategory.life.filter(t => t.status === TaskStatus.COMPLETED).length
  const lifeTotal = byCategory.life.length
  const lifeRate = lifeTotal > 0 ? Math.round((lifeCompleted / lifeTotal) * 100) : 0
  const lifePomodoros = byCategory.life.filter(t => t.status === TaskStatus.COMPLETED).reduce((sum, t) => sum + getPomodoroCount(t.priority), 0)
  
  report += `🏠 ${t('life')} (${lifeTotal}${currentLanguage.value === 'zh' ? '项' : ' tasks'})\n`
  report += `${currentLanguage.value === 'zh' ? '已完成' : 'Completed'}: ${lifeCompleted}${currentLanguage.value === 'zh' ? '项' : ''} (${lifeRate}%)  |  ${currentLanguage.value === 'zh' ? '番茄' : 'Pomodoros'}: ${lifePomodoros}${currentLanguage.value === 'zh' ? '个' : ''}\n\n\n`
  
  // 第三部分：本期重点事项
  report += `${doubleSeparator}\n`
  report += currentLanguage.value === 'zh' ? '【第三部分】本期重点事项 - Key Activities\n' : '【Part 3】Key Activities\n'
  report += `${doubleSeparator}\n\n`
  
  // 按分类归纳任务
  const workTasks = periodTasks.filter(t => t.status === TaskStatus.COMPLETED && t.category === 'work')
  const studyTasks = periodTasks.filter(t => t.status === TaskStatus.COMPLETED && t.category === 'study')
  const lifeTasks = periodTasks.filter(t => t.status === TaskStatus.COMPLETED && t.category === 'life')
  
  if (workTasks.length > 0) {
    report += `💼 ${currentLanguage.value === 'zh' ? '工作' : 'Work'} (${workTasks.length}${currentLanguage.value === 'zh' ? '项' : ''})\n`
    workTasks.slice(0, 10).forEach(t => {
      report += `  • ${t.text}\n`
    })
    report += `\n`
  }
  
  if (studyTasks.length > 0) {
    report += `📚 ${currentLanguage.value === 'zh' ? '学习' : 'Study'} (${studyTasks.length}${currentLanguage.value === 'zh' ? '项' : ''})\n`
    studyTasks.slice(0, 10).forEach(t => {
      report += `  • ${t.text}\n`
    })
    report += `\n`
  }
  
  if (lifeTasks.length > 0) {
    report += `🏠 ${currentLanguage.value === 'zh' ? '生活' : 'Life'} (${lifeTasks.length}${currentLanguage.value === 'zh' ? '项' : ''})\n`
    lifeTasks.slice(0, 10).forEach(t => {
      report += `  • ${t.text}\n`
    })
    report += `\n`
  }
  
  // 第四部分：重点任务（按优先级排序）
  report += `${doubleSeparator}\n`
  report += currentLanguage.value === 'zh' ? '【第四部分】重点任务 Top 10 - Key Tasks\n' : '【Part 4】Key Tasks Top 10\n'
  report += `${doubleSeparator}\n\n`
  
  const completedTasksList = periodTasks
    .filter(t => t.status === TaskStatus.COMPLETED)
    .sort((a, b) => {
      const priorityWeight = (p) => {
        if (p === 'high' || p === 'urgent') return 3
        if (p === 'medium') return 2
        return 1
      }
      const weightA = priorityWeight(a.priority)
      const weightB = priorityWeight(b.priority)
      if (weightB !== weightA) return weightB - weightA
      return getPomodoroCount(b.priority) - getPomodoroCount(a.priority)
    })
    .slice(0, 10)
  
  completedTasksList.forEach((task, index) => {
    report += `${index + 1}. ${task.text}\n`
    report += `   ${currentLanguage.value === 'zh' ? '分类' : 'Category'}: ${getCategoryText(task.category)}  |  ${currentLanguage.value === 'zh' ? '优先级' : 'Priority'}: ${getPriorityText(task.priority)}  |  ${currentLanguage.value === 'zh' ? '番茄' : 'Pomodoros'}: ${getPomodoroCount(task.priority)}\n`
    if (task.description) {
      report += `   ${currentLanguage.value === 'zh' ? '说明' : 'Description'}: ${task.description}\n`
    }
    report += `\n`
  })
  
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
      return getPomodoroCount(b.priority) - getPomodoroCount(a.priority)
    })
    .slice(0, 10)
    .map(task => ({
      id: task.id,
      text: task.text,
      description: task.description,
      categoryIcon: task.category === 'work' ? '💼' : task.category === 'study' ? '📚' : '🏠',
      categoryText: getCategoryText(task.category),
      priorityText: getPriorityText(task.priority),
      pomodoros: getPomodoroCount(task.priority),
      time: formatDateTime(task.created_at)
    }))
  
  // 智能总结（基于实际完成的任务）
  const summary = generateSmartSummary(reportType.value, completedTasksList)
  
  // 新增KPI指标
  const focusEfficiency = workDays > 0 ? (totalPomodoros / workDays).toFixed(1) : 0 // 专注力效率
  const highValueRatio = completedTasks > 0 
    ? Math.round((byPriority.high.filter(t => t.status === TaskStatus.COMPLETED).length / completedTasks) * 100) 
    : 0 // 高价值任务占比
  const avgTasksPerDay = workDays > 0 ? (completedTasks / workDays).toFixed(1) : 0
  
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
  
  // 任务聚合（去重统计）
  const taskFrequency = {}
  completedTasksList.forEach(task => {
    const key = task.text.trim().toLowerCase()
    if (!taskFrequency[key]) {
      taskFrequency[key] = {
        text: task.text,
        count: 0,
        pomodoros: 0,
        category: task.category,
        priority: task.priority
      }
    }
    taskFrequency[key].count++
    taskFrequency[key].pomodoros += getPomodoroCount(task.priority)
  })
  
  // 转换为数组并按频次排序
  const aggregatedTasks = Object.values(taskFrequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
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
    categories,
    priorities,
    dailyTrend,
    maxDaily: maxDaily || 1,
    keyTasks,
    aggregatedTasks,
    summary,
    insights
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
    // 准备导出数据
    const exportData = tasks.map(task => ({
      '任务名称': task.text,
      '详细描述': task.description || '',
      '分类': getCategoryText(task.category),
      '优先级': getPriorityText(task.priority),
      '类型': getTaskTypeText(task),
      '状态': task.status === 'completed' ? '已完成' : task.status === 'overdue' ? '已逾期' : '待办',
      '创建时间': formatDate(task.created_at)
    }))
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '我的任务')
    
    // 生成文件名
    const filename = `TODO任务_${currentUsername.value}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    
    // 生成二进制数据
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    
    // 保存到Android下载目录
    await Filesystem.writeFile({
      path: filename,
      data: wbout,
      directory: Directory.Documents
    })
    
    showNotification(`文件已保存到：文档/${filename}`, 'success')
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
const getPomodoroCount = (priority) => {
  const pomodoroMap = {
    high: 4,
    medium: 2,
    low: 1
  }
  return pomodoroMap[priority] || 2
}

// 方法：获取分类文本
const getCategoryText = (category) => {
  return t(category) // work/study/life 都在语言包中
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

// 方法：获取任务截止时间文本
const getDeadlineText = (task) => {
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
    
    // 基础日期格式
    let dateStr = `${year}/${month}/${day} ${hour}:${minute}`
    if (date.toDateString() === now.toDateString()) {
      dateStr = `${t('todayLabel')} ${hour}:${minute}`
    } else if (new Date(now.getTime() + 86400000).toDateString() === date.toDateString()) {
      dateStr = `${t('tomorrow')} ${hour}:${minute}`
    }
    
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

// 监听报告弹窗打开，自动生成报告
watch(showReportModal, (newVal) => {
  if (newVal) {
    generateReportContent()
  }
})

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
  padding: 0.5rem;
  margin: -0.5rem 0.2rem -0.5rem -0.5rem; /* 微调间距以对齐统计按钮 */
  cursor: pointer;
}

/* v1.2: 任务卡片触摸反馈 */
.task-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
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
  transform: scale(1.3);
  cursor: pointer;
}

/* v1.2: 触摸优化 - 删除按钮 */
.btn-delete-touch {
  min-width: 44px;
  min-height: 44px;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #f44336, #e91e63);
  color: white;
  font-size: 1.5rem;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-delete-touch:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

.btn-delete-touch:active {
  transform: scale(0.95);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* v1.2: 字体比例优化 */
.task-title {
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1.4;
}

.task-title:hover {
  color: var(--primary-color);
}

.task-description {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.4rem;
  line-height: 1.4;
  max-width: 100%;
  word-wrap: break-word;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-top: 0.5rem;
  line-height: 1;  /* 统一行高 */
}

/* v1.2: 图标化徽章 */
.badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;  /* 统一内边距 */
  border-radius: 12px;
  line-height: 1;  /* 统一行高 */
  height: 24px;  /* 固定高度 */
  box-sizing: border-box;
}

/* 番茄数徽章 */
.badge-pomodoro {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;  /* 统一内边距 */
  border-radius: 12px;
  transition: all 0.3s;
  line-height: 1;  /* 统一行高 */
  height: 24px;  /* 固定高度 */
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-size: 1.6rem;
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
  font-size: 2.2rem;
  background: rgba(102, 126, 234, 0.25) !important; /* 紫色背景 */
  color: white !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-refresh-icon:hover {
  background: rgba(102, 126, 234, 0.4) !important; /* 悬停更深 */
  color: white !important;
}

/* 回收站按钮 */
.btn-trash {
  font-size: 1.4rem;
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
  width: 40px;
  height: 40px;
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
  font-size: 1rem;
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

.export-title {
  margin: 0 0 0.3rem 0;
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
  /* 内阴影 - 凹陷感 */
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.05);
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
  /* 聚焦时去掉内阴影，增加外阴影 */
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15);
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
  gap: 1rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  padding: 0;
}

.page-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(102, 126, 234, 0.3);
  background: white;
  color: var(--primary-color);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: var(--text-dark);
  font-weight: 600;
  min-width: 60px;
  text-align: center;
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
  align-items: center;
}

.task-rank {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
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
}

.task-frequency {
  color: #667eea;
  font-weight: 600;
}

.task-persistence {
  color: #f5576c;
  font-weight: 600;
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
</style>