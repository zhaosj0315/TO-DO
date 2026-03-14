# 系统架构文档 | Architecture Documentation

**版本**: v0.9.4  
**更新日期**: 2026-03-15

---

## 📋 目录

1. [架构概览](#架构概览)
2. [技术选型](#技术选型)
3. [系统架构](#系统架构)
4. [数据流向](#数据流向)
5. [模块划分](#模块划分)
6. [富媒体架构](#富媒体架构)
7. [设计模式](#设计模式)

---

## 🏗️ 架构概览

### 架构类型

**单体离线应用架构 (Offline-First Monolithic Architecture)**

- **前端**: Vue 3 单页应用 (SPA)
- **存储**: 本地存储 (Capacitor Preferences + Filesystem)
- **打包**: Capacitor (移动端) + Electron (桌面端)
- **特点**: 完全离线、无后端、数据本地化、富媒体支持

### 架构演进

```
v1.0 - v1.2: CS架构（前后端分离）
    ↓
v1.3 - v1.7: 纯前端架构（完全离线）
    ↓
v0.8.8: Markdown编辑器集成
    ↓
v0.8.9: 富媒体附件系统（当前架构）
```

---

## 📎 富媒体架构

### 组件架构图

```
TodoView.vue (主界面)
    ├── 🖼️ pickImageForTask() ──┐
    ├── 📎 pickFileForTask() ───┤
    │                          │
    └── MarkdownRenderer ──────┼── FilePreviewModal
            │                  │        │
            ├── processLocalImages()     │
            ├── bindFileCardEvents() ────┘
            └── getFileIcon()
```

### 数据流架构

```
用户操作 → 文件选择 → Base64转换 → 本地存储 → 元数据保存 → Markdown渲染 → 预览显示
    ↓           ↓          ↓         ↓         ↓           ↓         ↓
  UI交互    Camera/File   内存处理   Filesystem  Task.media  DOM更新   用户查看
```

### 存储架构

```
Directory.Data/
└── media/
    └── {taskId}/
        ├── img_1773104018300.jpg
        ├── file_1773104018301.pdf
        └── file_1773104018302.docx

Task Object:
{
  id: 123,
  text: "任务标题",
  description: "![图片](local://img_1773104018300)\n[📎 文档](local://file_1773104018301)",
  media: [
    {
      id: "img_1773104018300",
      type: "image",
      name: "img_1773104018300.jpg",
      originalName: "照片.jpg",
      path: "media/123/img_1773104018300.jpg",
      size: 1024000
    }
  ]
}
```

---

## 🛠️ 技术选型

### 前端框架

**Vue 3.5.13**

选择理由:
- ✅ Composition API 提供更好的代码组织
- ✅ 响应式系统性能优秀
- ✅ 生态系统成熟（Pinia、Vue Router）
- ✅ 学习曲线平缓
- ✅ 打包体积小

### 富媒体处理

**新增依赖 (v0.8.9)**:
- **marked 14.1.3**: Markdown 解析和渲染
- **dompurify 3.1.7**: XSS 防护和 HTML 净化
- **@capacitor/camera 6.0.2**: 图片选择和拍照
- **@capacitor/filesystem 6.0.1**: 本地文件存储

### 状态管理

**Pinia 3.0.4**

选择理由:
- ✅ Vue 3 官方推荐
- ✅ TypeScript 支持良好
- ✅ 开发工具集成完善
- ✅ API 简洁直观
- ✅ 支持模块化

### 路由管理

**Vue Router 4.4.5**

选择理由:
- ✅ Vue 官方路由
- ✅ Hash 模式适配 Capacitor
- ✅ 路由守卫功能强大
- ✅ 支持懒加载

### 移动端框架

**Capacitor 8.1.0**

选择理由:
- ✅ 跨平台支持（Android/iOS）
- ✅ Web 技术栈
- ✅ 插件生态丰富
- ✅ 性能优秀
- ✅ 原生功能访问便捷

### 桌面端框架

**Electron 40.5.0**

选择理由:
- ✅ 跨平台支持（Windows/Mac/Linux）
- ✅ Web 技术栈
- ✅ 成熟稳定
- ✅ 社区活跃

### 构建工具

**Vite 6.0.3**

选择理由:
- ✅ 开发服务器启动快
- ✅ 热更新速度快
- ✅ 构建速度快
- ✅ 配置简单
- ✅ 插件生态丰富

### 本地存储

**Capacitor Preferences API**

选择理由:
- ✅ 跨平台统一 API
- ✅ 简单易用
- ✅ 性能优秀
- ✅ 数据持久化可靠

---

## 🏛️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     用户界面层 (UI Layer)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ LoginView.vue│  │ TodoView.vue │  │ Components   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   状态管理层 (State Layer)                 │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ offlineTaskStore │  │ offlineUserStore │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   数据持久层 (Data Layer)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Capacitor Preferences API                 │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │  │
│  │  │ tasks  │  │ users  │  │ logs   │  │ config │ │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   平台适配层 (Platform Layer)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Android    │  │   Windows    │  │     iOS      │  │
│  │  (Capacitor) │  │  (Electron)  │  │ (Capacitor)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 分层说明

**用户界面层 (UI Layer)**:
- 负责用户交互和视图渲染
- 使用 Vue 3 组件构建
- 响应用户操作，调用状态管理层

**状态管理层 (State Layer)**:
- 管理应用状态
- 处理业务逻辑
- 调用数据持久层进行数据存储

**数据持久层 (Data Layer)**:
- 封装数据存储操作
- 提供统一的数据访问接口
- 使用 Capacitor Preferences API

**平台适配层 (Platform Layer)**:
- 适配不同平台
- 提供原生功能访问
- 处理平台特定逻辑

---

## 🔄 数据流向

### 任务创建流程

```
用户输入
  ↓
TodoView.vue (addTask)
  ↓
offlineTaskStore.addTask()
  ↓
数据验证 + 生成ID
  ↓
tasks 数组添加任务
  ↓
Preferences.set('tasks_username', JSON.stringify(tasks))
  ↓
本地存储
  ↓
UI 自动更新（响应式）
```

### 任务完成流程

```
用户点击复选框
  ↓
TodoView.vue (toggleTaskCompletion)
  ↓
offlineTaskStore.toggleTaskCompletion(taskId)
  ↓
检查依赖关系（canStart）
  ↓
更新任务状态
  ↓
记录完成时间
  ↓
取消提醒通知
  ↓
通知等待任务
  ↓
保存到本地存储
  ↓
UI 自动更新
```

### 数据同步流程

```
应用启动
  ↓
用户登录
  ↓
offlineUserStore.login()
  ↓
offlineTaskStore.setCurrentUser(username)
  ↓
Preferences.get('tasks_username')
  ↓
加载任务数据到 Store
  ↓
checkOverdueTasks()（检查逾期和重置重复任务）
  ↓
UI 渲染任务列表
```

---

## 📦 模块划分

### 核心模块

**1. 用户模块 (User Module)**

文件:
- `src/views/LoginView.vue`
- `src/stores/offlineUserStore.js`

功能:
- 用户注册
- 用户登录
- 会话管理
- 密码找回

---

**2. 任务模块 (Task Module)**

文件:
- `src/views/TodoView.vue`
- `src/stores/offlineTaskStore.js`
- `src/components/TaskDetailModal.vue`

功能:
- 任务CRUD
- 任务筛选
- 任务排序
- 任务依赖
- 重复任务

---

**3. 日志模块 (Log Module)**

文件:
- `src/components/AddLogModal.vue`
- `src/components/LogTimeline.vue`
- `src/components/LogStats.vue`

功能:
- 添加日志
- 查看日志
- 统计分析

---

**4. AI 模块 (AI Module)**

文件:
- `src/components/AIChat.vue`
- `src/components/AISuggestionCard.vue`
- `src/components/AIReportModal.vue`
- `src/components/SmartTaskSplitter.vue`
- `src/services/aiChatService.js`
- `src/services/aiTaskSplitter.js`
- `src/services/aiReportGenerator.js`

功能:
- AI 问答
- AI 任务拆分
- AI 报告生成
- AI 主动提醒

---

**5. 番茄钟模块 (Pomodoro Module)**

文件:
- `src/components/PomodoroTimer.vue`
- `src/components/PomodoroStats.vue`

功能:
- 番茄钟计时
- 休息模式
- 历史记录
- 统计分析

---

**6. 数据管理模块 (Data Module)**

文件:
- `src/components/DataStatsModal.vue`
- `src/utils/excelFormat.js`
- `src/utils/autoBackup.js`

功能:
- 数据导出
- 数据导入
- 自动备份

---

### 模块依赖关系

```
用户模块
  ↓
任务模块 ← 日志模块
  ↓         ↓
AI 模块 ← 番茄钟模块
  ↓
数据管理模块
```

---

## 🎨 设计模式

### 1. 单例模式 (Singleton Pattern)

**应用**: Pinia Store

```javascript
// offlineTaskStore.js
export const useOfflineTaskStore = defineStore('offlineTask', {
  // 全局唯一实例
})
```

---

### 2. 观察者模式 (Observer Pattern)

**应用**: Vue 响应式系统

```javascript
// 数据变化自动触发 UI 更新
const tasks = ref([])
// 修改 tasks 时，所有依赖的组件自动更新
```

---

### 3. 策略模式 (Strategy Pattern)

**应用**: 任务类型处理

```javascript
// calculateDeadline 根据不同任务类型使用不同策略
switch (task.type) {
  case 'today': return getTodayDeadline()
  case 'daily': return getDailyDeadline()
  case 'weekly': return getWeeklyDeadline()
}
```

---

### 4. 工厂模式 (Factory Pattern)

**应用**: 任务创建

```javascript
// addTask 工厂方法创建标准化任务对象
const task = {
  id: generateId(),
  text: taskData.text,
  // ... 其他默认值
}
```

---

### 5. 装饰器模式 (Decorator Pattern)

**应用**: 任务增强

```javascript
// 基础任务 → 添加日志 → 添加番茄钟 → 添加依赖
task → task + logs → task + pomodoros → task + dependencies
```

---

### 6. 适配器模式 (Adapter Pattern)

**应用**: 平台适配

```javascript
// Capacitor 适配不同平台的 API
if (Capacitor.getPlatform() === 'android') {
  // Android 特定逻辑
} else if (Capacitor.getPlatform() === 'ios') {
  // iOS 特定逻辑
}
```

---

## 🔐 安全设计

### 数据隔离

- 每个用户的数据使用独立的存储键
- 格式: `tasks_{username}`
- 登录时只加载当前用户数据

### 密码存储

- ⚠️ 当前版本: 明文存储（本地设备）
- 未来计划: 加密存储

### 数据备份

- 用户主动导出 Excel
- 数据完全由用户控制
- 不上传到云端

---

## 📊 性能优化

### 1. 虚拟滚动

- 大量任务时使用虚拟滚动
- 只渲染可见区域的任务

### 2. 计算属性缓存

- 使用 Vue computed 缓存计算结果
- 避免重复计算

### 3. 懒加载

- 路由懒加载
- 组件按需加载

### 4. 防抖节流

- 搜索输入防抖
- 滚动事件节流

### 5. 数据分页

- 大量数据分页加载
- 减少内存占用

---

## 🔮 未来架构演进

### 短期计划 (v1.8.x)

- 引入 IndexedDB 替代 Preferences（支持更大数据量）
- 优化 AI 模块架构（插件化）
- 增强离线能力（Service Worker）

### 中期计划 (v2.x)

- 可选云同步功能
- 多设备数据同步
- 协作功能

### 长期计划 (v3.x)

- 微前端架构
- 插件系统
- 开放 API

---

## 🔗 相关文档

- [API 参考](./API_REFERENCE.md)
- [开发者文档](./DEVELOPER.md)
- [测试指南](./TESTING_GUIDE.md)

---

**版本**: v0.7.8  
**更新日期**: 2026-03-01  
**维护**: 开发团队
