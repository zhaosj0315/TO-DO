# TO-DO App | 跨平台离线待办事项管理应用

**支持平台**: Android / Windows / iOS / Mac

[English](#english) | [中文](#中文)

---

<a name="english"></a>
## English Description

This is an **offline Android To-Do management application** built with **Vue 3** and **Capacitor**. All data is stored locally on the device using Capacitor Preferences API, requiring **no internet connection or backend server**.

### 🌟 Key Features
- **AI Task Splitter** 🤖 (NEW in v1.7.7):
  - **Smart Task Decomposition**: Input task title and description, AI automatically splits into executable subtasks
  - **Subtask Preview**: Bottom Sheet displays split results with edit and delete support
  - **Auto Dependency Setup**: Subtasks automatically depend on parent task completion
  - **Smart Time Conversion**: AI returns hours, automatically converted to minutes for display
  - **4 Split Templates**: Quick split, detailed split, time-priority, priority-first
  - **Estimated Duration**: AI estimates time for each subtask (0.5-8 hours)
- **Task Dependency System** 🔗 (NEW in v1.7.7):
  - **One-way Dependency**: A task can "wait for" another task to complete
  - **Dependency Selector**: Search, filter, single-select mode
  - **Status Display**: Waiting🔒 / Depended🔓 / No Dependency✅
  - **Task Card Badge**: 🔒 Waiting (yellow badge)
  - **Smart Notification**: Auto-notify waiting tasks when dependency completes
  - **Auto Cleanup**: Auto-clear dependencies when task is deleted
  - **Task Navigation**: Click waiting task card to jump to details
  - **Data Migration**: Auto-add waitFor field to old tasks
- **AI Proactive Assistant** 🤖 (v1.7.6):
  - **Smart Reminder Card**: Auto-detect overdue and pending tasks with proactive reminders
  - **Daily Smart Summary**: Daily work summary with AI insights and tomorrow's plan
  - **Weekly/Monthly Report Generator**: Auto-generate structured reports with export options
  - **Smart Task Splitter**: AI-powered task decomposition with 4 templates and time estimation
- **AI Chat Assistant** 🤖 (v1.7.4):
  - **Intelligent Q&A**: Ask questions about your tasks in natural language
  - **Multi-Model Support**: Pangu AI, OpenAI, or local models (Ollama)
  - **Complete Data Context**: AI has access to all task data, logs, and statistics
  - **Quick Questions**: 6 built-in common questions for instant insights
  - **Smart Analysis**: Get efficiency analysis, suggestions, and task recommendations
  - **Time-based Queries**: "What did I do today/this week/this month?"
  - **Status Queries**: Check pending, completed, or overdue tasks
  - **Execution Insights**: Analyze blocks, solutions, and progress
- **User Registration & Login**: 
  - Dynamic gradient avatar based on username initials
  - Auto-login with session persistence
  - Optional security questions for password recovery
  - **Phone Number Login**: SMS verification code login (simulated via LocalNotifications)
  - **Phone Binding**: Bind phone number during registration or in profile settings
  - **User Data Isolation**: Each user's tasks are completely isolated
- **Offline Operation**: Fully functional without internet connection
- **Smart Refresh**: Top refresh button with rotation animation
- **Smart Reminders**: 
  - Overdue alerts with humorous messages ("Tomatoes are escaping!")
  - 1-hour warning before deadline
  - Anti-spam mechanism (one notification per task per status)
- **Pomodoro Timer** 🍅:
  - **25-minute Focus Sessions**: Full-screen purple gradient timer interface
  - **Automatic Break Mode**: 5-minute short break / 15-minute long break (every 4th)
  - **Circular Progress Bar**: Visual countdown with SVG animation
  - **Pause/Resume/Abandon**: Full control during focus sessions
  - **Skip Break / Continue Next**: Quick actions after break completion
  - **Pomodoro History**: Track all completed focus sessions with timestamps
  - **Today's Focus Stats**: View today's focus time and completed pomodoros
  - **Weekly Statistics**: Track weekly pomodoro completion
  - **Task Integration**: Start pomodoro directly from task cards (🍅 button)
- **Dashboard & Stats**:
  - Grid layout with 5 stat cards (Completion Rate, All, Completed, Pending, Overdue)
  - Search bar with filter and add buttons
  - Interactive filtering by clicking any stat item
  - Advanced filter modal with date range, category, priority, and keyword search
- **Task Management**:
  - **7 Task Types**: Today, Tomorrow, This Week, Custom Date, Daily Repeat, Weekday Repeat, Weekly Repeat
  - **Custom Date & Time**: Specify exact date and time for tasks
  - **Category support**: Work 💼, Study 📚, Life 🏠
  - **Priority levels**: High, Medium, Low
  - **Task descriptions**: Inline display with full editing support
  - **Deadline Display**: Auto-calculated deadline with color-coded urgency
  - **Pomodoro System**: Visual tomato count based on priority (🍅🍅🍅🍅)
  - **Pin to Top**: Pin important tasks to stay at the top of the list (📌 button)
- **Task Execution Logs** 💬 (NEW in v1.7.0):
  - **6 Log Types**: Start, Progress, Block, Solution, Milestone, Complete
  - **Unlimited Logs**: Add multiple logs per task to track execution process
  - **Auto Timestamp**: Time automatically recorded when adding logs
  - **Execution Stats**: Track session count, total duration, average time, blocks resolved
  - **Progress Tracking**: Record progress percentage for each session
  - **Tag System**: Organize logs with custom tags
  - **Mood Tracking**: Record how you feel during execution (Good/Neutral/Bad)
  - **Block Resolution**: Link solutions to previous blocks
  - **Completion Summary**: Add quality rating and lessons learned when completing tasks
  - **Task Detail View**: Bottom Sheet (drawer from bottom) showing all logs, statistics, timeline, and editing capabilities
  - **Timeline View**: Visual timeline showing creation → deadline → completion with color-coded urgency
  - **Unified Entry**: Click task title or description to open the same Bottom Sheet
  - **Log Badges**: Task cards display log count (💬 X) and progress (📊 X%)
- **Smart Sorting System**:
  - Intelligent weight-based sorting algorithm
  - Pinned tasks always on top (sorted by priority internally)
  - Overdue penalty with decay mechanism (3-day threshold)
  - 2-hour urgent warning auto-promotion
  - Weight tiers: Pinned(0-2) → Overdue Critical(100-200) → Overdue Decay(200-500) → Urgent Warning(600-650) → Normal Pending(700-900) → Completed(10000+)
- **Advanced Filtering**:
  - Filter by status (All, Pending, Completed, Overdue)
  - Filter by category (Work, Study, Life)
  - Filter by priority (High, Medium, Low)
  - Filter by date range with multiple time dimensions
  - **Multi-Time Dimension Filtering**:
    - Filter by creation time: View tasks created in a time period
    - Filter by deadline: View tasks due in a time period
    - Filter by completion time: View tasks completed in a time period
  - Keyword search (fuzzy match on title and description)
  - All filters can be combined
- **Pomodoro Statistics**:
  - Earned pomodoros from completed tasks
  - Pending pomodoros from active tasks
  - Lost pomodoros from overdue tasks
  - Net pomodoro achievement tracking
- **Local Storage**: All data persists on device using Capacitor Preferences API
- **Data Import/Export**: 
  - Export tasks to Excel for backup
  - Import tasks from Excel in batch
  - Download import template with 100 sample tasks
- **Soft Delete (Recycle Bin)**: 
  - Deleted tasks are moved to the trash first
  - Supports restoring or permanent deletion
- **Mobile Optimized**: Full-width layout optimized for mobile screens

### 🛠️ Tech Stack
- **Frontend**: Vue 3 (Composition API), Pinia, Vue Router
- **Mobile Framework**: Capacitor 8.x
- **Storage**: Capacitor Preferences API (Local Storage)
- **Build Tool**: Vite
- **Platform**: Android (APK)

### 📱 Installation (End Users)
1. Download `TODO-App.apk` from the releases
2. Enable "Install from Unknown Sources" on your Android device
3. Install the APK
4. Open the app and register a new account
5. Start managing your tasks offline!

### 🚀 Development Setup
1. **Install Dependencies**: `npm install`
2. **Run Development Server**: `npm run dev`
3. **Build for Production**: `npm run build`
4. **Sync to Android**: `npx cap sync android`
5. **Build APK**: 
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
6. **APK Location**: `android/app/build/outputs/apk/debug/app-debug.apk`

### ⚙️ Configuration
- **Java Version**: Requires Java 17
- **Capacitor Config**: `capacitor.config.json`
- **App ID**: com.todo.app
- **App Name**: TODO App

---

<a name="中文"></a>
## 中文说明

这是一个基于 **Vue 3** 和 **Capacitor** 构建的 **Android离线待办事项管理应用**。所有数据使用 Capacitor Preferences API 存储在设备本地，**无需网络连接或后端服务器**。

### 🌟 核心功能
- **AI任务拆分** 🤖 (v1.7.7 新增):
  - **智能任务拆解**：输入任务标题和描述，AI自动拆分为可执行子任务
  - **子任务预览**：Bottom Sheet展示拆分结果，支持编辑和删除
  - **依赖关系自动设置**：子任务自动依赖父任务，完成父任务后子任务才能开始
  - **预计时长智能转换**：AI返回小时数，自动转换为分钟显示
  - **4种拆分模板**：快速拆分、详细拆分、时间优先、优先级优先
  - **预估时长**：AI为每个子任务估算时长（0.5-8小时）
- **任务依赖关系** 🔗 (v1.7.7 新增):
  - **单向依赖**：一个任务可以"等待"另一个任务完成
  - **依赖选择器**：搜索、筛选、单选模式
  - **状态显示**：等待中🔒/被依赖🔓/无依赖✅
  - **任务卡片徽章**：🔒 等待中（黄色徽章）
  - **智能通知**：完成任务时自动通知等待的任务可以开始
  - **自动清理**：删除任务时自动清除依赖关系
  - **任务跳转**：点击等待的任务卡片可跳转到详情
  - **数据迁移**：自动为旧任务添加 waitFor 字段
- **AI主动式助手** 🤖 (v1.7.6 新增):
  - **智能提醒卡片**: 自动检测逾期和待办任务，主动提醒
  - **每日智能总结**: 每日工作总结，AI 建议，明日计划
  - **周报/月报生成**: 自动生成结构化报告，支持导出
  - **智能任务分解**: AI 驱动的任务拆解，4种模板，时间估算
- **AI智能问答** 🤖 (v1.7.4 新增):
  - **自然语言问答**: 用自然语言询问任务相关问题
  - **多模型支持**: 盘古大模型、OpenAI、本地模型（Ollama）
  - **完整数据上下文**: AI可访问所有任务数据、日志、统计信息
  - **快捷问题**: 6个内置常用问题，一键获取洞察
  - **智能分析**: 获取效率分析、建议和任务推荐
  - **时间维度查询**: "今天/本周/本月做了什么？"
  - **状态查询**: 查看待办、已完成、已逾期任务
  - **执行洞察**: 分析阻碍、解决方案和进度
- **用户注册与登录**: 
  - 动态首字母渐变头像
  - 自动登录和会话保持
  - 可选的密保问题（用于密码找回）
  - **手机号登录**: 短信验证码登录（通过LocalNotifications模拟）
  - **手机号绑定**: 注册时或个人主页绑定手机号
  - **用户数据隔离**: 每个用户的任务完全隔离
- **完全离线运行**: 无需网络连接即可使用全部功能
- **智能刷新**: 顶部刷新按钮，环形箭头旋转动画
- **智能提醒**: 
  - 逾期提醒（幽默话术："番茄要逃跑啦"）
  - 1小时前预警提醒
  - 防刷屏机制（每个任务每种状态只提醒1次）
- **番茄钟计时器** 🍅:
  - **25分钟专注模式**: 全屏紫色渐变计时界面
  - **自动休息模式**: 5分钟短休息 / 15分钟长休息（每4个番茄钟）
  - **圆形进度条**: SVG动画可视化倒计时
  - **暂停/继续/放弃**: 专注过程中完全控制
  - **跳过休息/继续下一个**: 休息完成后快捷操作
  - **番茄钟历史**: 追踪所有完成的专注记录（带时间戳）
  - **今日专注统计**: 查看今日专注时长和完成番茄钟数
  - **本周统计**: 追踪本周番茄钟完成情况
  - **任务集成**: 直接从任务卡片启动番茄钟（🍅按钮）
- **任务看板**:
  - Grid布局，5列统计卡片（完成占比、全部、已完成、待办、已逾期）
  - 搜索框 + 筛选按钮 + 添加按钮
  - 交互式筛选：点击任何统计项直接筛选列表
  - 高级筛选弹窗：日期范围、分类、优先级、关键字搜索
- **任务管理**:
  - **7种任务类型**: 今天、明天、本周内、指定日期、每天重复、工作日重复、每周重复
  - **自定义日期时间**: 可指定具体日期和时间
  - 支持任务分类（💼工作、📚学习、🏠生活）
  - 支持优先级设置（高、中、低）
  - 任务详细描述，直接在列表中显示
  - **截止时间显示**: 自动计算截止时间，颜色分级提醒
  - **番茄钟系统**: 根据优先级显示番茄数（🍅🍅🍅🍅）
  - **置顶功能**: 点击📌按钮将重要任务置顶（📌 按钮）
- **任务执行日志** 💬 (v1.7.0 新增):
  - **6种日志类型**: 开始、进展、阻碍、方案、里程碑、完成
  - **无限追加日志**: 每个任务可添加多条日志记录执行过程
  - **时间自动记录**: 添加日志时自动记录时间戳
  - **执行统计**: 追踪推进次数、总耗时、平均时长、阻碍解决情况
  - **进度追踪**: 每次记录可标注当前进度百分比
  - **标签系统**: 使用自定义标签组织日志
  - **心情追踪**: 记录执行过程中的心情状态（顺利/一般/困难）
  - **阻碍解决**: 解决方案可关联到之前的阻碍日志
  - **完成总结**: 完成任务时可添加质量评分和经验教训
  - **任务详情页**: 全屏弹窗展示所有日志和统计数据
  - **日志徽章**: 任务卡片显示日志数量（💬 X条）和进度（📊 X%）
- **智能排序系统**:
  - 智能权重排序算法
  - 置顶任务永远在最前面（内部按优先级细分）
  - 逾期任务惩罚衰减机制（3天阈值）
  - 2小时紧急预警自动提升
  - 权重分层：置顶(0-2) → 逾期高危(100-200) → 逾期衰减(200-500) → 紧急预警(600-650) → 正常待办(700-900) → 已完成(10000+)
- **高级筛选**:
  - 按状态筛选（全部、待办、已完成、已逾期）
  - 按分类筛选（工作、学习、生活）
  - 按优先级筛选（高、中、低）
  - 按日期范围筛选
  - **多时间维度筛选**:
    - 按创建时间筛选：查看某时间段创建的任务
    - 按截止时间筛选：查看某时间段需要完成的任务
    - 按完成时间筛选：查看某时间段实际完成的任务
  - 关键字搜索（模糊匹配任务名称和描述）
  - 所有筛选条件可组合使用
- **番茄钟统计**:
  - 已获得番茄（完成任务获得）
  - 待获得番茄（待完成任务）
  - 逾期扣除（逾期任务扣除）
  - 净获得番茄（成就追踪）
- **本地存储**: 所有数据持久化存储在设备本地
- **数据导入导出**:
  - 导出任务到Excel文件进行备份
  - 从Excel批量导入任务
  - 下载导入模板（内含100条示例任务）
- **逻辑删除 (回收站)**: 
  - 删除的任务会先移入回收站
  - 支持从回收站中一键恢复或彻底删除任务
- **移动端优化**: 全屏宽度布局，完美适配手机屏幕

### 🛠️ 技术栈
- **前端框架**: Vue 3 (Composition API), Pinia, Vue Router
- **移动端框架**: Capacitor 8.x
- **数据存储**: Capacitor Preferences API（本地存储）
- **构建工具**: Vite
- **目标平台**: Android (APK)

## 📱 安装使用（最终用户）

### Android 版本
1. 下载 `TODO-App.apk` 安装包
2. 在Android设备上开启"允许安装未知来源应用"
3. 安装APK文件
4. 打开应用并注册新账号
5. 开始离线管理您的任务！

### Windows 版本
1. 下载 `TODO App Setup 1.6.11.exe` 安装程序
2. 双击运行安装程序
3. 选择安装目录并完成安装
4. 从桌面快捷方式启动应用
5. 开始管理您的任务！

### 🚀 开发环境搭建
1. **安装依赖**: `npm install`
2. **运行开发服务器**: `npm run dev`
3. **生产环境构建**: `npm run build`
4. **同步到Android**: `npx cap sync android`
5. **一键打包APK**: 
   ```bash
   ./build-apk.sh
   ```
6. **一键打包Windows**: 
   ```bash
   # Windows 系统
   build-windows.bat
   
   # macOS/Linux 系统
   ./build-windows.sh
   ```
7. **APK位置**: `TODO-App.apk`（项目根目录）
8. **Windows安装包位置**: `release/TODO App Setup 1.6.11.exe`

**详细打包流程**: 
- Android APK: 请查看 [APK打包快速指南](APK_BUILD_QUICK.md) 或 [完整指南](APK_BUILD_GUIDE.md)
- Windows EXE: 请查看 [Windows打包指南](WINDOWS_BUILD_GUIDE.md)
   ./build-apk.sh
   ```
6. **APK位置**: `TODO-App.apk`（项目根目录）

**详细打包流程**: 请查看 [APK打包快速指南](APK_BUILD_QUICK.md) 或 [完整指南](APK_BUILD_GUIDE.md)

### ⚙️ 配置要求
- **Java版本**: 需要 Java 17
- **Capacitor配置**: `capacitor.config.json`
- **应用ID**: com.todo.app
- **应用名称**: TODO App

## 📂 项目结构 | Project Structure
```
TO-DO/
├── src/                          # 前端源码 | Frontend source code
│   ├── views/                    # 页面组件 | Page components
│   │   ├── LoginView.vue        # 登录/注册页面 | Login/Register page
│   │   └── TodoView.vue         # 任务管理页面 | Task management page
│   ├── stores/                   # Pinia状态管理 | Pinia stores
│   │   ├── offlineTaskStore.js  # 离线任务Store | Offline task store
│   │   └── offlineUserStore.js  # 离线用户Store | Offline user store
│   ├── router/                   # 路由配置 | Router config
│   ├── assets/                   # 静态资源 | Static assets
│   ├── App.vue                   # 根组件 | Root component
│   └── main.js                   # 入口文件 | Entry file
├── android/                      # Android项目目录 | Android project
├── scripts/                      # 实用脚本 | Utility scripts
│   ├── 清理本地数据.js          # 清空任务数据 | Clear local data
│   └── 统计任务数据.js          # 统计任务信息 | Task statistics
├── server/                       # 已废弃的后端代码 | Deprecated backend code
├── capacitor.config.json         # Capacitor配置 | Capacitor config
├── TODO导入模板示例.xlsx        # 官方导入模板 | Official import template
├── TODO-App.apk                  # Android安装包 | Android APK
├── package.json                  # 项目依赖 | Project dependencies
├── vite.config.js               # Vite配置 | Vite config
└── README.md                     # 项目说明 | Project documentation
```

## 🔧 技术细节 | Technical Details

### 数据存储结构 | Data Storage Structure
使用 Capacitor Preferences API 存储以下数据：
- `users`: 用户账号密码映射 `{ username: password }`
- `currentUser`: 当前登录用户
- `tasks_{username}`: 按用户隔离的任务数据
- `deletedTasks_{username}`: 按用户隔离的回收站数据
- `userInfo`: 用户详细信息（注册时间、修改时间、绑定手机号等）
- `phoneMapping`: 手机号→用户名映射 `{ phone: username }`
- `security`: 安全问题答案（可选）

### 用户信息结构 | User Info Structure
```javascript
userInfo[username] = {
  username: String,              // 用户名
  registerTime: String,          // 注册时间（ISO格式，不变）
  usernameModifiedTime: String,  // 用户名修改时间（可选）
  lastLoginTime: String,         // 最后登录时间
  boundPhone: String             // 绑定的手机号（可选）
}
```

### 路由模式 | Router Mode
使用 Hash 模式 (`createWebHashHistory`) 以适配 Capacitor 环境。

### 任务数据结构 | Task Data Structure
```javascript
{
  id: Number,              // 任务ID（时间戳）
  text: String,            // 任务标题
  description: String,     // 任务描述
  type: String,            // 类型: 'today' | 'tomorrow' | 'this_week' | 'custom_date' | 'daily' | 'weekday' | 'weekly'
  category: String,        // 分类: 'work' | 'study' | 'life'
  priority: String,        // 优先级: 'high' | 'medium' | 'low'
  weekdays: Array,         // 周期（仅weekly类型）
  customDate: String,      // 指定日期（YYYY-MM-DD格式，仅custom_date类型）
  customTime: String,      // 指定时间（HH:MM格式，仅custom_date类型）
  status: String,          // 状态: 'pending' | 'completed' | 'overdue'
  created_at: String,      // 创建时间（ISO格式）
  completed_at: String,    // 实际完成时间（ISO格式，仅completed状态）
  duration: String,        // 时长: 'quick' | 'normal' | 'long'（短期任务）
  scale: String,           // 规模: 'small' | 'medium' | 'large'（长期任务）
  completedPomodoros: Number,  // 已完成的番茄钟数量
  estimatedPomodoros: Number,  // 预估番茄钟数量（基于优先级：高4/中2/低1）
  pomodoroHistory: Array,      // 番茄钟历史记录
  // pomodoroHistory 结构:
  // [{
  //   startTime: String,     // 开始时间（ISO格式）
  //   endTime: String,       // 结束时间（ISO格式）
  //   completed: Boolean     // 是否完成
  // }]
  user_id: String          // 所属用户
}
```

## 🎯 功能特性详解 | Feature Details

### 用户系统
- ✅ 本地注册（无限制）
- ✅ 本地登录验证
- ✅ 用户数据隔离
- ❌ 无密码加密（本地存储）
- ❌ 无云端同步

### 任务管理
- ✅ 添加任务（标题、描述、分类、优先级、周期）
- ✅ 编辑任务（点击任务标题）
- ✅ 完成/取消完成
- ✅ 删除到回收站
- ✅ 从回收站恢复
- ✅ 永久删除
- ✅ 筛选（状态、分类、时间范围）
- ✅ 自动排序（完成状态、优先级、创建时间）
- ✅ 逾期检测（仅今天类型任务）

### 界面特性
- ✅ 全屏宽度布局（移动端优化）
- ✅ 渐变色背景
- ✅ 毛玻璃效果卡片
- ✅ 实时倒计时
- ✅ 任务进度统计
- ✅ 通知提示

## 📝 版本历史 | Version History

### v1.7.7 (2026-02-27)
- ✨ **任务依赖关系系统**（极简设计）:
  - **单向依赖**：一个任务可以"等待"另一个任务完成
  - **等待任务选择器**：搜索、筛选、单选模式
  - **依赖状态显示**：等待中🔒/被依赖🔓/无依赖✅
  - **任务卡片徽章**：🔒 等待中（黄色）
  - **智能通知**：完成任务时自动通知等待的任务可以开始
  - **自动清理**：删除任务时自动清除依赖关系
  - **任务跳转**：点击等待的任务卡片可跳转到详情
  - **数据迁移**：自动为旧任务添加 waitFor 字段
- 🎯 **使用场景**:
  - 简单依赖：A → B
  - 依赖链：A → B → C → D
  - 多任务等待：A → B/C/D
- 📊 **极简设计**：1个字段、5个方法、3个UI组件
- 🤖 **AI模型配置优化**:
  - **手动输入模型支持**：当厂商不提供模型列表接口时，支持手动输入模型名称
  - **自动创建厂商配置**：手动输入模型时自动创建并保存厂商配置
  - **流式响应自动降级**：AI问答优先使用流式响应，失败时自动降级为非流式
  - **流式数据解析优化**：修复不同厂商流式数据格式差异导致的解析失败
  - **API路径统一修复**：所有AI功能统一使用 `/v1/chat/completions` 标准路径
  - **按钮文字优化**：导出/导入按钮添加文字标签，避免图标混淆
- 🐛 **Bug修复**:
  - 修复AI模型配置页面重复的"添加新模型"区域
  - 修复手动输入模型时"厂商配置丢失"错误
  - 修复AI问答流式响应解析失败导致无法显示内容
  - 修复多个AI服务使用错误的API路径（缺少 `/v1/`）

### v1.7.6.2 (2026-02-27)
- 🎨 **UI优化**: 缩小右上角功能图标大小以适配移动端
  - 圆形图标按钮：40px → 28px（缩小30%）
  - 图标字体：1.2rem → 0.9rem
  - 头像按钮：40px → 28px
  - 修复安卓设备上头像图标被遮挡的问题

### v1.7.6.1 (2026-02-27)
- 🐛 **Bug修复**:
  - 恢复今日规划按钮（🌅）在右上角功能区
  - 统一所有AI功能使用LoadingSpinner加载动画
  - 修复AI功能缺少加载提示的问题
  - 删除重复的变量声明

### v1.7.6 (2026-02-27)
- ✨ **AI 主动式助手系统**:
  - 智能提醒卡片（逾期/待办检测）
  - 每日智能总结（完成统计+AI建议）
  - 周报/月报/季报/年报/自定义日期范围报告生成器
  - 智能任务分解（4种模板+时间估算）
- ✨ **AI 对话历史记录**:
  - 多对话管理（类似ChatGPT）
  - 时间智能分组（今天/昨天/最近7天/更早）
  - 对话切换和删除功能
- ✨ **完整备份系统**:
  - 100%数据覆盖（任务+日志+番茄钟+用户信息）
  - 一键导出/导入JSON格式
- ✨ **拍照OCR + AI文本增强**:
  - 离线OCR识别（Android MLKit）
  - AI智能优化任务描述
- 🐛 **Bug修复**:
  - 修复AI报告模块访问undefined属性崩溃
  - 修复报告类型选择不生效（季报/年报/自定义）
  - 修复报告历史弹窗race condition
  - 修复任务详情白屏崩溃（stats空值检查）
- 🎨 **UI优化**:
  - Bottom Sheet统一布局（10个弹窗）
  - AI配置界面优化
  - 报告类型选择器优化

### v1.7.4 (2026-02-25)
- ✨ **AI智能问答功能**:
  - 新增🤖 AI问答按钮（演示模式左侧）
  - **统一模型配置中心**：个人主页 → AI配置
  - 支持多模型管理（本地Ollama/OpenAI/自定义）
  - 设置默认模型，全局复用
  - 完整的任务数据上下文（任务、日志、番茄钟、统计）
  - 6个快捷问题按钮（今日完成、本周情况、高优先级等）
  - 智能分析和建议功能
  - 时间维度查询（今天/本周/本月）
  - 状态和分类查询
  - 执行洞察（阻碍、解决方案、进度）
- 📊 **数据上下文优化**:
  - 结构化Markdown格式数据
  - 包含整体统计、时间维度统计、任务详情
  - 执行日志和番茄钟历史完整展示
- 🎨 **UI优化**:
  - 紫色渐变AI按钮
  - 对话式界面设计
  - 快捷问题卡片
  - 消息气泡样式
  - 统一模型配置界面
- 🔧 **技术实现**:
  - AIChat.vue - AI问答组件
  - AIModelConfig.vue - 模型配置组件
  - 全局模型配置复用（问答+任务总结）
  - localStorage持久化

### v1.7.3 (2026-02-25)
- ✨ **拍照识别文字功能（OCR）**:
  - 新增📷拍照按钮（任务输入框旁）
  - 集成@capacitor/camera相机插件
  - 集成@capacitor-community/image-to-text OCR插件
  - 使用Android MLKit离线识别（无需网络）
  - 支持中英文混合识别
  - 一键拍照自动填充任务标题
- 🔧 **技术优化**:
  - 添加相机和存储权限
  - 配置Firebase MLKit（离线模式）
  - 修复Java版本兼容性（强制Java 17）
  - 优化添加日志弹窗为全屏宽度Bottom Sheet

### v1.7.2 (2026-02-25)
- 🐛 **Bug修复**:
  - 修复演示模式第一步闪现问题（初始化居中样式）
  - 修复日志时间显示（始终显示完整年/月/日 时:分）
  - 修复日志排序（改为正序，从早到晚）
  - 优化移动端边界检测（响应式宽度计算）
- ✨ **功能增强**:
  - 新增步骤5：引导用户导入模板数据
  - 教程步骤扩展至22步
  - 优化创建任务引导流程

### v1.7.1 (2026-02-25)
- ✨ **演示模式系统（Tutorial Mode）**:
  - 22步完整教程，覆盖90%核心功能
  - 新用户首次登录自动触发（1秒延迟）
  - 进度条显示（5% → 100%）
  - 分类标签（介绍/基础/进阶）
  - 重点介绍v1.7.0执行日志系统
  - 移动端响应式设计
- 🐛 **Bug修复**:
  - 优化日志时间显示格式
  - 修复日志排序顺序
  - 完善边界检测
  - 优化目标元素选择器

### v1.7.0 (2026-02-25)
- ✨ **任务执行日志系统（Phase 1 核心功能）**:
  - 6种日志类型（开始/进展/阻碍/方案/里程碑/完成）
  - 无限追加日志，记录任务执行全过程
  - 时间自动记录，类型和内容必填
  - 执行统计自动计算（推进次数、总耗时、平均时长、阻碍统计）
  - 进度追踪（0-100%滑块）
  - 标签系统（自定义标签组织日志）
  - 心情追踪（顺利/一般/困难）
  - 阻碍解决追踪（解决方案可关联阻碍）
  - 完成总结（质量评分1-5星 + 经验教训）
- ✨ **任务详情页面重构**:
  - 全屏弹窗设计，最大化内容展示
  - 任务概览卡片（状态、优先级、分类、截止时间）
  - 执行统计网格（2×2布局，紫色渐变背景）
  - 日志列表（时间倒序，类型颜色区分）
  - 操作按钮（添加日志、完成任务、删除任务）
- ✨ **添加日志弹窗**:
  - Bottom Sheet 从底部滑出
  - 类型选择（3×2网格按钮）
  - 内容输入（500字限制，字符计数）
  - 耗时选择（快速选择 + 自定义输入）
  - 进度滑块（可视化进度选择）
  - 标签输入（动态添加多个标签）
  - 心情选择（3种状态）
  - 完成类型特有字段（评分 + 经验教训）
  - 解决方案关联阻碍（下拉选择）
- ✨ **任务卡片增强**:
  - 日志数量徽章（💬 X条，紫色）
  - 进度徽章（📊 X%，蓝色）
  - 点击卡片打开详情页面
- 🔧 **数据结构扩展**:
  - 任务对象新增 `logs` 数组字段
  - 任务对象新增 `stats` 统计字段
  - 自动数据迁移（为旧任务添加空数组）
- 📚 **文档完善**:
  - 新增 TASK_LOG_PHASE1.md（功能说明）
  - 新增 TESTING_GUIDE.md（测试指南）
  - 新增 IMPLEMENTATION_SUMMARY.md（实现总结）

### v1.6.12 (2026-02-25)
- ✨ **番茄钟功能（Phase 1 MVP）**:
  - 25分钟专注计时器，全屏紫色渐变界面
  - 自动切换休息模式（5分钟短休息/15分钟长休息）
  - 圆形SVG进度条可视化
  - 暂停/继续/放弃控制
  - 任务卡片🍅按钮启动番茄钟
  - 番茄钟历史记录（startTime/endTime/completed）
  - 根据优先级预估番茄钟数（高4/中2/低1）
- ✨ **番茄钟功能（Phase 2 增强）**:
  - 今日专注统计（今日时长+完成数+本周完成数）
  - 番茄钟历史记录展示（任务详情中）
  - 跳过休息/继续下一个番茄钟按钮
  - 休息模式智能按钮切换
- ✨ **任务详情页面全面优化**:
  - 状态徽章（✓已完成/⏳进行中/⚠️已逾期）
  - 信息卡片化（2×2网格，彩色背景）
  - 时间轴视觉增强（大号圆点+垂直连接线+状态颜色）
  - 快捷操作按钮（完成/编辑/删除）
  - 番茄钟历史记录完整展示
- ✨ **编辑弹窗优化**:
  - 从Modal改为Bottom Sheet（从底部滑出）
  - 分组设计（基本信息组+任务属性组）
  - 图标化标签（每个字段都有图标）
  - 字符计数（任务名称X/100，描述X/500·N行）
  - 输入框聚焦紫色光晕效果
  - 按钮优化（取消/保存，紫色渐变）
- ✨ **任务描述交互增强**:
  - 长描述自动折叠（超过100字符折叠为2行）
  - 展开/收起按钮
  - 优先级彩色边框（高优先级红色/中优先级橙色/低优先级蓝色）
  - 已完成任务描述透明度50%
  - 点击描述直接编辑任务
  - 描述保留换行格式（white-space: pre-wrap）
- 🐛 **Bug修复**:
  - 修复任务详情页面"完成任务"按钮无效问题
  - 添加toggleTaskStatus方法
  - 修复编辑弹窗重复的任务属性组
- 🎨 **UI优化**:
  - 任务标题加粗加深（font-weight: 700）
  - 任务描述浅灰背景+左侧边框
  - 编辑弹窗最大化利用屏幕宽度
  - 所有Bottom Sheet统一风格

### v1.6.11 (2026-02-23)
- ✨ **每日任务摘要通知**:
  - 每天早上9:00自动推送任务统计
  - 显示待办/即将逾期/已逾期任务数量
  - 智能激励语（无任务/有紧急/有逾期/正常）
  - 任务变化时自动更新通知内容
- ✨ **首次登录备份提醒**:
  - 新用户首次登录弹窗提醒
  - 强调本地存储特性和备份重要性
  - 引导用户定期导出Excel备份
- ✨ **数据说明弹窗**:
  - 页脚新增"📊 数据说明"链接
  - 详细说明存储位置、优缺点、导出方法
  - 提供完整的备份指南和安全承诺
- ✨ **导出兼容性优化**:
  - 修复红米手机导出失败问题
  - 实现多重降级策略（Documents → ExternalStorage → Data → Browser）
  - 优化错误提示和用户引导
- ✨ **页脚布局重构**:
  - 重新组织为3行清晰分类
  - 第1行：应用信息（版本 · 离线特性 · 版权）
  - 第2行：文档与下载（使用指南 · 更新日志 · 下载 · GitHub）
  - 第3行：设置与帮助（隐私 · 数据说明 · 反馈 · 语言）
  - 新增"📦 下载安装包"链接指向GitHub Release
- ✨ **Windows 打包支持**:
  - 新增 build-windows.bat 和 build-windows.sh 脚本
  - 生成 NSIS 安装程序（109MB）
  - 支持自定义安装目录、桌面快捷方式
- 🐛 **重复任务耗时计算修复**:
  - 修复重复任务使用创建时间导致耗时异常（如799小时）
  - 重复任务改为从当天00:00开始计算
  - 优化显示格式：分钟/小时/天自动切换
- 🎨 **UI 优化**:
  - 优化优先级按钮样式，防止文字溢出
  - 页脚文字改为灰黑色（#666），提升可读性
- 📦 **macOS 打包优化**:
  - 改用 ZIP 格式（127-132MB）
  - 禁用代码签名避免兼容性问题

### v1.6.10 (2026-02-22)
- 🐛 **自定义报告Bug修复**:
  - 修复AI摘要时间代词错乱（46天报告显示"本周" → "本期"）
  - 修复里程碑过滤逻辑不全局（可视化报告混入低优1番茄琐事）
  - 统一两套里程碑引擎的过滤门槛（纯文本 + 可视化）
- ✅ **压力测试验证**:
  - 289任务 × 46天跨度测试通过
  - 日期计算精准（1月24天 + 2月22天 = 46天）
  - 数据聚合稳定，琐事拦截100%生效

### v1.6.9 (2026-02-22)
- 🎨 **Hero区域视觉升级**:
  - 数字滚动动画（CountUp.js）
  - 里程碑时间轴美化（垂直线条 + 圆点标记）
  - 精力天平动画优化

### v1.6.8 (2026-02-22)
- 📊 **纯文本引擎正式竣工**:
  - 完善所有报告类型的文本导出逻辑
  - 优化数据报告生成性能

### v1.6.7 (2026-02-21)
- 🔧 **数据报告生成逻辑优化**:
  - 重构报告生成流程
  - 提升大数据量处理性能

### v1.6.6 (2026-02-21)
- ✨ **年度习惯进度条卡片**:
  - Hall of Fame 展示模块
  - 执行官摘要功能（自然语言数据故事）
- 🎨 **报告视觉重构**:
  - Hero Section 设计
  - 精力天平可视化
  - 精力分配雷达图（ECharts）
  - 智能洞察引擎

### v1.6.5 (2026-02-21)
- ✨ **自定义日期范围报告**:
  - 新增"自定义"报告类型选项
  - 用户可自由选择开始和结束日期
  - 动态日期选择器（选择"自定义"时显示）
  - 智能日期验证（非空、开始≤结束）
  - 默认范围：最近30天
- 🎯 **7种报告类型**:
  - 日报、周报、月报、季报、半年报、年报、自定义
  - 从固定周期到完全自定义的灵活选择

### v1.6.4 (2026-02-21)
- ✨ **新增日报和半年报功能**:
  - 日报：今日完成任务列表 + AI 摘要
  - 半年报：习惯 Top 10 + 里程碑 + 热力图 + 月度趋势图
  - 实现分层展示策略（战术级/战役级/战略级）
- 📄 **优化数据报告导出功能**:
  - HTML 导出：完整样式 + 图表转图片，可打印为 PDF
  - 替换低质量图片截图为高质量 HTML 导出
  - ECharts Canvas 图表转换为 PNG 图片（Base64 内联）
  - 内联所有计算后的 CSS 样式
- 🐛 **Bug 修复**:
  - 修复半年报 AI 摘要显示"本周"而非"本半年"的问题
  - 修复报告弹窗自动生成导致 reportType 错误
  - 修复 HTML 导出缺少样式和图表的问题

### v1.6.3 (2026-02-21)
- ✨ **高级数据可视化功能**:
  - 热力图（Heatmap）：365天小方块矩阵，GitHub风格
  - 数据海报导出：使用html2canvas生成高清PNG图片
  - 月度趋势图：折线图展示月度完成情况
- 📊 **数据总结功能智能化重构** (v1.6.1):
  - 实现双轨制数据提取引擎（习惯聚合 + 里程碑提取）
  - 同名任务智能合并统计（Group By）
  - 里程碑提取算法（3选2规则）

### v1.6.0 (2026-02-21)
- ✨ **UI视觉系统全面升级**:
  - 统计区域主次分明：核心指标宽度+20%
  - 色彩语义化：绿(已完成)、蓝(待办)、红(已逾期)
  - 微交互增强：悬停上浮、阴影加深
  - 创建任务区凹陷感设计
  - 右上角胶囊化封装（iOS风格）
  - 任务列表标签严格对齐（24px统一高度）
- 🎨 **高级筛选弹窗紧凑化**:
  - 弹窗高度缩短15-20%
  - 间距压缩44%，信息密度提升
  - 类似macOS系统设置的紧凑感
- 🔄 **刷新按钮重新定义**:
  - 颜色改为紫色（对比度更高）
  - 功能：重置所有筛选条件到初始状态
  - 真正的"刷新"体验
- 💬 **输入框占位符优化**:
  - 新建框：`➕ 新建任务：输入任务名称...`
  - 区分搜索和新建功能

### v1.5.9 (2026-02-21)
- 🐛 **修复待办统计与筛选不一致bug**:
  - 修复前：点击"待办"显示所有未完成任务（包括pending和overdue）
  - 修复后：点击"待办"只显示真正pending状态的任务
  - 解决了待办统计显示1个但列表显示多个任务的问题
- 🎨 **弹窗留白优化**:
  - 所有弹窗宽度从90%增至96%，左右留白减少60%
  - 弹窗内边距优化，空间利用率提升6-8%
  - 优化个人主页、番茄钟统计、联系与支持等所有弹窗

### v1.5.8 (2026-02-21)
- 🎨 **筛选按钮位置调整**:
  - 将筛选按钮（🔍）从第二行移至第一行统计栏
  - 新布局：[全部] [已完成] [待办] [已逾期] [🔍] [▼]
  - 统一按钮高度为44px，视觉更协调
  - 第二行简化为只保留搜索框

### v1.5.7 (2026-02-20)
- ✅ **UI布局全面优化**:
  - 添加/收起按钮简化为箭头图标(▲/▼)，宽度缩小至50px
  - 统计区域改用flex布局，左侧5卡片平分空间，按钮右对齐
  - 统一表单元素高度：搜索框/输入框/属性组36px，统计卡片44px
  - 统一字体大小：所有输入框0.85rem
- ✅ **表单区域紧凑化**:
  - 删除属性配置图标(📅🏷️⚡)，界面更简洁
  - 优化属性选择器宽度：日期110px，分类/优先级42px
  - 缩小内边距至0.5rem，提升空间利用率
- ✅ **日期显示增强**:
  - 指定日期格式改为"年/月/日 时:分"（如：2026/2/20 13:30）
  - 增加选择器宽度以完整显示日期时间
- ✅ **筛选功能精简**:
  - 删除高级筛选中的"全部"选项
  - 分类仅保留：工作/学习/生活
  - 优先级仅保留：高/中/低

### v1.5.6 (2026-02-20)
- ✅ **扁平化设计重构**:
  - 消除统计区、搜索栏、任务创建区的"俄罗斯套娃"效应
  - 去掉所有外层容器，组件直接浮在背景上
  - 空间利用率提升40%
- ✅ **筛选弹窗全面优化**:
  - 按钮强制撑满整行（Grid 3列平分宽度）
  - 弹窗宽度增至560px，边距压减至0.6rem
  - 按钮全宽自适应平铺，消除右侧留白
- ✅ **UI精制化**:
  - KPI指标去冒号，全宽对齐
  - 刷新按钮图标：3rem → 2.5rem
  - 刷新动画：公转 → 自转
  - 添加/收起按钮移至统计栏
- ✅ **交互优化**:
  - 特殊任务类型（指定日期、每周重复）改为弹窗化
  - 修复首页统计区换行问题
  - 移除下拉菜单重复图标

### v1.5.5 (2026-02-20)
- ✅ **右上角按钮组精致化**:
  - 统一视觉风格：所有按钮44x44px圆形，半透明白色背景
  - 回收站优化：只显示🗑️图标，右上角红色数字气泡
  - 刷新动画优化：只自转不放大，图标3rem
  - 交互增强：悬停上浮+阴影，点击缩小反馈

### v1.5.4 (2026-02-20)
- ✅ **两行布局重构**:
  - 第一行：任务输入框（90%宽）+ 绿色提交按钮
  - 第二行：图标引导的属性配置（📅日期 🏷️分类 ⚡优先级）
  - 白色卡片容器，圆角10px
- ✅ **统计区轻量化**:
  - 高度减少30%（48px→42px）
  - 标签和数字颜色加深，字重增强

### v1.5.3 (2026-02-20)
- ✅ **筛选弹窗精致化**:
  - 统一10px圆角
  - 提升对比度（占位符#999，边框#d0d0d0）
  - Grid布局优化（日期4列，按钮自适应）
  - 模块化分区，section间分割线
  - 底部按钮重构：重置+确定并排

### v1.5.2 (2026-02-20)
- ✅ **Grid布局优化**:
  - 第一行：Grid统计卡片（5列均匀分布）
  - 第二行：搜索框 + 筛选按钮 + 添加按钮
- ✅ **对比度增强（符合WCAG）**:
  - 标签文字：白色→#666深灰
  - 数字文字：白色→#333深色
  - 卡片背景：半透明→白色(0.9透明度)
- ✅ **统一按钮颜色**：绿色→紫色系渐变

### v1.5.1 (2026-02-20)
- ✅ **单行布局优化**:
  - 合并为一行：状态统计 + 图标按钮
  - 筛选/添加按钮改为纯图标（🔍/➕/✕）
- ✅ **筛选弹窗美化**:
  - 添加数字统计（分类:数量、优先级:数量）
  - 优化按钮样式：悬停上浮、激活渐变、彩色阴影
- ✅ **刷新按钮点击放大效果**（1.4倍）

### v1.5.0 (2026-02-19)
- ✅ **极简状态栏**:
  - 将三行筛选区域简化为两行
  - 第一行：完成占比 + 核心状态（全部/已完成/待办/已逾期）
  - 第二行：筛选和添加按钮（紧凑布局）
- ✅ **高级筛选弹窗**:
  - 点击"🔍 筛选"后弹出
  - 包含：日期/分类/优先级/搜索
- ✅ **删除下拉刷新**：改为顶部刷新按钮（环形箭头+旋转动画）
- ✅ **移除首页退出登录**：移至个人主页底部
- ✅ **空间优化**：筛选区域高度减少72%，任务列表可见行数增加75%

### v1.4.0 (2026-02-19)
- ✅ **手机号登录系统**:
  - 注册时可选绑定手机号（验证码验证）
  - 个人主页支持绑定/解绑手机号
  - 手机号登录自动识别绑定账号
  - 使用LocalNotifications模拟短信验证码
- ✅ **下拉刷新**: 
  - 支持移动端手势刷新数据
  - 刷新指示器动画（下拉/准备/刷新中）
- ✅ **智能逾期提醒**:
  - 1小时内即将逾期提醒（幽默话术："番茄要逃跑啦"）
  - 已逾期提醒（"番茄已经逃跑了"）
  - 防刷屏机制（每个任务每种状态只提醒1次）
  - 每分钟检查一次
- ✅ **用户数据隔离**: 
  - 任务数据按用户完全隔离（tasks_{username}）
  - 用户名修改时间记录
  - 保留原始注册时间
- ✅ **个人主页优化**:
  - 紧凑化布局（纵向高度缩减30%）
  - 横向布局优化（空间利用率提升25%）
  - 联系与支持改版（入口+弹窗）
  - 字体全面精简
- ✅ **任务类型扩展**: 新增明天、本周内、指定日期、工作日重复类型
- ✅ **日期时间选择**: 指定日期支持同时选择日期和时间（datetime-local）
- ✅ **任务截止时间系统**: 
  - 根据任务类型自动计算截止时间
  - 颜色分级：正常/警告/紧急/已逾期/已完成
  - 显示格式：今天 23:59 / 明天 23:59 / 2/25 14:30
- ✅ **番茄钟激励系统**:
  - 任务卡片显示预估番茄数（🍅🍅🍅🍅）
  - 根据优先级自动建议：高4/中2/低1
  - 个人主页番茄统计：已获得/待获得/逾期扣除/净获得
- ✅ **增强筛选功能**:
  - 新增优先级筛选（全部/高/中/低）
  - 新增关键字搜索（模糊匹配任务名称和描述）
  - 所有筛选条件可组合使用
- ✅ **任务编辑增强**: 支持编辑所有字段（分类、优先级、类型、周期、日期时间）
- ✅ **会话管理**: 自动登录、路由守卫、会话保持
- ✅ **密保问题优化**: 密保问题改为可选项
- ✅ **一键打包**: 新增 build-apk.sh 脚本
- ✅ **UI优化**: 多项布局和样式优化

### v1.3.1 (2026-02-19)
- ✅ **UI 重构与层级调整**: 重新排列统计区域（分类统计上移，状态下移）
- ✅ **全站视觉标准化**: 所有统计项统一为 `图标 + 数字 + 标签` 结构，移除环形进度条
- ✅ **现代感头像**: 动态首字母渐变头像，替代旧版 Emoji
- ✅ **分类专属图标**: 为工作、学习、生活添加专属图标

## v1.3.0 (2026-02-19)
- ✅ 新增任务批量导入功能
- ✅ 支持从Excel导入任务（任务名称、描述、分类、优先级、类型、状态、创建时间）
- ✅ 数据管理区域新增"下载模板"按钮（三按钮布局）
- ✅ 提供官方导入模板（100条示例任务，时间范围2026-01-01至2026-02-25）
- ✅ 智能解析Excel数据格式
- ✅ 导入结果统计（成功/失败数量）
- 🐛 修复addTask方法保留导入数据完整字段
- 🐛 修复待办统计逻辑，避免与已逾期重复计数
- 📄 新增导入模板使用说明文档
- 🛠️ 新增清理数据和统计数据脚本

### v1.2.1 (2026-02-18)
- 🐛 修复小屏手机上统计数字被截断的问题
- 🔄 优化统计区域字体和间距，确保文字完整显示

### v1.2.0 (2026-02-18)
- ✅ 统计数据垂直排列+图标化
- ✅ 任务卡片图标化（⚡ 优先级、🏷️ 分类）
- ✅ 剩余时间颜色分级（蓝/橙/红）
- ✅ 触摸热区优化（44x44px）
- ✅ 统计栏卡片感增强
- ✅ 字体比例优化
- ✅ 安卓体验优化

### v1.1.0 (2026-02-17)
- ✅ 统计数据交互式筛选功能
- ✅ 统计和筛选区域完全融合
- ✅ 点击统计数字直接筛选任务
- ✅ 胶囊按钮样式的分类筛选
- ✅ 添加表单默认展开
- ✅ 内联表单设计（一行输入）
- ✅ 空间优化（节省约130px）

### v1.0.0 (2026-02-17)
- ✅ 实现Android离线版APP
- ✅ 用户注册与登录功能
- ✅ 完整的任务管理功能
- ✅ 本地数据持久化
- ✅ 回收站功能
- ✅ 移动端UI优化
- ✅ 完全离线运行

## ⚠️ 注意事项 | Important Notes

1. **数据安全**: 所有数据存储在本地设备，卸载应用会丢失数据。
2. **无云同步**: 数据不会在多设备间同步。
3. **密码安全**: 密码以明文存储在本地，请勿使用重要密码。
4. **Java版本**: 构建APK需要Java 17环境。
5. **已废弃**: `/server` 目录中的后端代码已不再使用。

## 🤝 贡献指南 | Contributing

欢迎提交Issue和Pull Request！

## 📄 开源协议 | License

MIT License

---

**注意**: 本项目已从全栈架构迁移至纯前端离线Android应用。`/server` 目录中的代码仅作历史参考，不再维护。
