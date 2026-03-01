# 开发者文档 | Developer Documentation

**版本**: v1.7.8  
**更新日期**: 2026-03-01

## 🏗️ 架构概览

### 技术栈 (v1.7.6)
- **前端框架**: Vue 3.5.13 (Composition API)
- **状态管理**: Pinia 3.0.4
- **路由**: Vue Router 4.4.5 (Hash模式)
- **移动框架**: Capacitor 8.1.0
- **桌面框架**: Electron 40.5.0
- **构建工具**: Vite 6.0.3
- **存储方案**: Capacitor Preferences (移动端/桌面端统一)

### 架构模式
- **全离线化 (Pure Offline)**: 从 CS 架构完全迁移至本地优先。
- **用户数据隔离**: 使用 `tasks_{username}` 键名实现多账号本地隔离。
- **跨平台适配**: 统一逻辑代码，通过 Capacitor 和 Electron 分别打包 Android 和 Windows 端。

---

## 📁 项目结构详解

```
TO-DO/
├── electron/                         # Electron 桌面端配置
├── src/                              # 前端源码
│   ├── views/                        # 页面组件
│   │   ├── LoginView.vue            # 登录/注册（含密保/手机绑定逻辑）
│   │   └── TodoView.vue             # 核心业务（含番茄钟统计/Excel导入导出）
│   ├── stores/                       # Pinia Store
│   │   ├── offlineTaskStore.js      # 任务核心逻辑（按用户隔离存储）
│   │   └── offlineUserStore.js      # 用户状态管理
│   ├── assets/                       # 静态资源（含 icons/images）
│   └── main.js                       # 入口文件
├── android/                          # Capacitor Android 原生工程
├── scripts/                          # 数据清理与统计实用脚本
├── TODO导入模板示例.xlsx             # 官方导入模板
├── capacitor.config.json            # Capacitor 配置
└── package.json                      # 项目元数据与依赖
```

---

## 🧩 核心组件说明

### LoadingSpinner 组件 (v1.7.6.1)
**文件位置**: `src/components/LoadingSpinner.vue`

**功能**: 统一的AI加载动画组件，用于所有需要等待AI响应的场景

**Props**:
```javascript
{
  visible: Boolean,      // 是否显示（必需）
  text: String,          // 主提示文本（默认: "AI 思考中..."）
  subText: String,       // 副提示文本（可选）
  transparent: Boolean   // 是否使用透明背景（默认: false）
}
```

**使用示例**:
```vue
<template>
  <LoadingSpinner
    :visible="aiLoading"
    :text="aiLoadingText"
    :sub-text="aiLoadingSubText"
  />
</template>

<script setup>
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { ref } from 'vue'

const aiLoading = ref(false)
const aiLoadingText = ref('AI 思考中...')
const aiLoadingSubText = ref('')

const someAIFunction = async () => {
  try {
    aiLoading.value = true
    aiLoadingText.value = 'AI 正在处理...'
    aiLoadingSubText.value = '请稍候'
    
    // AI操作...
    
  } finally {
    aiLoading.value = false
  }
}
</script>
```

**样式特性**:
- 全屏遮罩层（z-index: 10003）
- 毛玻璃背景效果（backdrop-filter: blur(4px)）
- 白色卡片容器（圆角16px）
- 紫色旋转圆环动画（1s linear infinite）
- 双行文本提示（主文本1rem加粗，副文本0.85rem）

**应用场景**:
- 今日规划生成
- AI写作助手
- 生成任务描述
- AI续写
- OCR拍照识别
- 周报/月报生成

---

### Bottom Sheet 组件规范 (v1.7.8)

**设计原则**: 所有 UI 组件统一使用 Bottom Sheet 样式（从底部滑出，左右全屏）

**标准样式**:
```css
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;      /* 底部对齐 */
  justify-content: center;
  z-index: 2000;
  padding: 0;                  /* 无内边距 */
  animation: fadeIn 0.2s;
}

/* 内容容器 */
.modal-content {
  background: white;
  border-radius: 16px 16px 0 0;  /* 只保留顶部圆角 */
  width: 100%;                    /* 全屏宽度 */
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);  /* 向上的阴影 */
  animation: slideUp 0.3s ease;
  margin: 0;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }  /* 从底部完全滑出 */
  to { transform: translateY(0); }
}
```

**已统一的组件** (v1.7.8):
1. `AddDependencyModal.vue` - 添加依赖关系
2. `SmartTaskSplitter.vue` - AI任务拆分
3. `WaitForSelector.vue` - 等待任务选择器

**实现要点**:
- 使用 `align-items: flex-end` 确保从底部对齐
- 使用 `width: 100%` 确保左右全屏
- 使用 `translateY(100%)` 实现从底部滑出动画
- 移除 `backdrop-filter: blur()` 以提升性能
- 使用向上的阴影效果

---

## 🔧 开发环境配置

### 系统要求
- **Node.js**: >= 22.0.0 (推荐)
- **Java**: JDK 17 (Android 构建必需)
- **平台**: macOS (推荐) / Windows

### 常用开发命令
```bash
# 1. 启动 Web 开发预览
npm run dev

# 2. 启动 Electron 桌面开发模式
npm run electron:dev

# 3. Android 同步与打包
npm run build && npx cap sync android
./build-apk.sh
```

---

## 💾 数据存储结构 (Capacitor Preferences)

### 1. 核心键值 (Storage Keys)
- `users`: `{ "zhaosj": "pass123" }`
- `currentUser`: `"zhaosj"`
- `tasks_{username}`: 任务数组。
- `deletedTasks_{username}`: 回收站数组。
- `userInfo`: 存储详细资料（注册时间、手机号、用户名修改记录）。
- `phoneMapping`: `{ "17858441076": "zhaosj" }`（用于手机号登录检索）。

### 2. 任务对象模型 (Task Object)
```javascript
{
  id: Number,              // 时间戳
  text: String,            // 任务标题
  description: String,     // 详细描述
  type: String,            // 'today'|'tomorrow'|'this_week'|'custom_date'|'daily'|'weekday'|'weekly'
  category: String,        // 'work'|'study'|'life'
  priority: String,        // 'high'|'medium'|'low'
  status: String,          // 'pending'|'completed'|'overdue'
  created_at: String,      // ISO 格式创建时间
  customDate: String,      // 仅用于 custom_date 类型
  customTime: String,      // 仅用于 custom_date 类型
  weekdays: Array          // 仅用于 weekly 类型 [0, 1, 2...]
}
```

---

## 🍅 番茄钟激励系统逻辑

### 计算规则
- **高优先级**: 4 🍅 | **中优先级**: 2 🍅 | **低优先级**: 1 🍅
- **奖励**: 任务状态转为 `completed` 时获得。
- **惩罚**: 任务状态转为 `overdue` 时扣除相应分值。
- **等级公式**: 
  - `totalPomodoros = earned - lost`
  - 根据 `total` 映射至 5 个勋章等级。

---

## 🛠️ 打包指南

### Android 打包
请参考 `APK_BUILD_GUIDE.md`。必须确保 `JAVA_HOME` 指向 JDK 17。

### Windows 打包 (Electron)
```bash
# 构建 Windows 安装程序 (.exe)
npm run electron:build-win
```
输出文件位于 `release/` 目录。

---

**版本**: v1.6.0  
**更新日期**: 2026-02-21  
**维护者**: TO-DO 开发团队
