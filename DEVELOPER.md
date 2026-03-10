# 开发者文档 | Developer Documentation

**版本**: v0.8.9  
**更新日期**: 2026-03-10

## 🏗️ 架构概览

### 技术栈 (v0.8.9)
- **前端框架**: Vue 3.5.13 (Composition API)
- **状态管理**: Pinia 3.0.4
- **路由**: Vue Router 4.4.5 (Hash模式)
- **移动框架**: Capacitor 8.1.0
- **桌面框架**: Electron 40.5.0
- **构建工具**: Vite 6.0.3
- **存储方案**: Capacitor Preferences + Filesystem
- **富媒体处理**: marked 14.1.3 + dompurify 3.1.7
- **文件系统**: @capacitor/camera + @capacitor/filesystem

### 架构模式
- **全离线化 (Pure Offline)**: 从 CS 架构完全迁移至本地优先
- **富媒体本地存储**: 文件存储在 Directory.Data/media/ 目录
- **用户数据隔离**: 使用 `tasks_{username}` 键名实现多账号本地隔离
- **跨平台适配**: 统一逻辑代码，通过 Capacitor 和 Electron 分别打包

---

## 📁 项目结构详解

```
TO-DO/
├── electron/                         # Electron 桌面端配置
├── src/                              # 前端源码
│   ├── views/                        # 页面组件
│   │   ├── LoginView.vue            # 登录/注册（含密保/手机绑定逻辑）
│   │   └── TodoView.vue             # 核心业务（含富媒体上传功能）
│   ├── components/                   # 组件库
│   │   ├── MarkdownRenderer.vue     # Markdown渲染器（富媒体支持）
│   │   └── FilePreviewModal.vue     # 文件预览弹窗
│   ├── stores/                       # Pinia Store
│   │   ├── offlineTaskStore.js      # 任务核心逻辑（含media字段）
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

## 📎 富媒体系统技术实现

### 核心组件架构

#### 1. MarkdownRenderer.vue
**功能**: Markdown解析和富媒体渲染
```javascript
// 核心方法
processLocalImages()     // 处理本地图片URL
bindFileCardEvents()     // 绑定文件卡片点击事件
getFileIcon()           // 获取文件类型图标
```

**技术实现**:
- 使用 `marked` 解析Markdown语法
- 使用 `DOMPurify` 防止XSS攻击
- 自定义渲染器处理 `local://` 协议

#### 2. FilePreviewModal.vue
**功能**: 文件预览弹窗
```javascript
// 支持的预览类型
- 图片: 全屏居中显示
- PDF: iframe原生预览
- 视频: HTML5播放器
- 文本: 等宽字体显示
```

### 文件上传流程

#### 图片上传 (pickImageForTask)
```javascript
const pickImageForTask = async () => {
  // 1. 调用相机API选择图片
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos
  });
  
  // 2. 生成唯一ID和文件名
  const imageId = `img_${Date.now()}`;
  const fileName = `${imageId}.jpg`;
  
  // 3. 保存到本地文件系统
  await Filesystem.writeFile({
    path: `media/${taskId}/${fileName}`,
    data: image.base64String,
    directory: Directory.Data
  });
  
  // 4. 插入Markdown语法
  const markdownSyntax = `![图片](local://${imageId})`;
  
  // 5. 保存媒体元数据
  const mediaItem = {
    id: imageId,
    type: 'image',
    name: fileName,
    originalName: '图片.jpg',
    path: `media/${taskId}/${fileName}`,
    size: base64Size,
    ext: 'jpg',
    uploadedAt: new Date().toISOString()
  };
};
```

#### 文件上传 (pickFileForTask)
```javascript
const pickFileForTask = async () => {
  // 1. 创建文件选择器
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov,.avi,.zip,.txt';
  
  // 2. 文件大小检查
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('文件大小不能超过10MB');
  }
  
  // 3. 转换为Base64
  const base64Data = await fileToBase64(file);
  
  // 4. 保存到文件系统
  const fileId = `file_${Date.now()}`;
  const fileName = `${fileId}.${getFileExtension(file.name)}`;
  
  // 5. 插入Markdown语法
  const icon = getFileIcon(file.name);
  const markdownSyntax = `[${icon} ${file.name}](local://${fileId})`;
};
```

### 数据结构设计

#### Task对象扩展
```javascript
{
  id: 123,
  text: "任务标题",
  description: "![图片](local://img_123)\n[📎 文档](local://file_456)",
  media: [
    {
      id: "img_123",
      type: "image",
      name: "img_123.jpg",
      originalName: "照片.jpg", 
      path: "media/123/img_123.jpg",
      size: 1024000,
      ext: "jpg",
      uploadedAt: "2026-03-10T14:30:00.000Z"
    },
    {
      id: "file_456",
      type: "pdf",
      name: "file_456.pdf",
      originalName: "报告.pdf",
      path: "media/123/file_456.pdf", 
      size: 2048000,
      ext: "pdf",
      uploadedAt: "2026-03-10T14:35:00.000Z"
    }
  ]
}
```

### 文件类型识别

#### getFileType函数
```javascript
const getFileType = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const typeMap = {
    // 图片
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'bmp': 'image', 'webp': 'image',
    // 文档
    'pdf': 'pdf', 'doc': 'document', 'docx': 'document', 'txt': 'text', 'rtf': 'text',
    // 表格
    'xls': 'excel', 'xlsx': 'excel', 'csv': 'excel',
    // 演示
    'ppt': 'powerpoint', 'pptx': 'powerpoint',
    // 视频
    'mp4': 'video', 'mov': 'video', 'avi': 'video', 'mkv': 'video', 'flv': 'video', 'wmv': 'video',
    // 压缩包
    'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive'
  };
  return typeMap[ext] || 'unknown';
};
```

### 安全机制

#### XSS防护
```javascript
// 使用DOMPurify净化HTML
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(markdownHtml, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'data-media-id'],
  ALLOW_DATA_ATTR: true
});
```

#### 文件大小限制
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  throw new Error(`文件大小不能超过${MAX_FILE_SIZE / 1024 / 1024}MB`);
}
```

---

## 🧩 核心组件说明

### MarkdownRenderer.vue (v0.8.9)
**功能**: Markdown解析和富媒体渲染
**依赖**: marked, dompurify
**核心方法**:
- `processLocalImages()`: 处理local://协议的图片URL
- `bindFileCardEvents()`: 绑定文件卡片点击事件
- `getFileIcon()`: 根据文件扩展名返回对应图标

### FilePreviewModal.vue (v0.8.9)
**功能**: 文件预览弹窗
**支持格式**: 图片、PDF、视频、文本
**特性**: 全屏显示、一键下载、优雅降级

### TodoView.vue
**核心业务组件**，包含：
- 任务CRUD操作
- 富媒体上传功能 (pickImageForTask, pickFileForTask)
- AI智能助手集成
- 番茄钟计时器
- 数据导入导出

---

## 🔧 开发环境搭建

### 环境要求
- **Node.js**: 18.x 或更高版本
- **Java**: JDK 17 (Android构建必需)
- **Android Studio**: 最新版本 (Android开发)
- **Xcode**: 最新版本 (iOS开发，仅macOS)

### 安装步骤
```bash
# 1. 克隆项目
git clone <repository-url>
cd TO-DO

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 同步到移动端
npx cap sync android
npx cap sync ios

# 5. 在IDE中打开
npx cap open android
npx cap open ios
```

### 开发服务器
```bash
# 启动Web开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## 📱 移动端开发

### Android开发
```bash
# 同步代码到Android项目
npx cap sync android

# 在Android Studio中打开
npx cap open android

# 直接构建APK (需要配置签名)
cd android
./gradlew assembleDebug
```

### iOS开发 (仅macOS)
```bash
# 同步代码到iOS项目
npx cap sync ios

# 在Xcode中打开
npx cap open ios
```

### 一键打包脚本
```bash
# Android APK
./build-apk.sh

# Windows EXE
./build-windows.sh

# macOS APP
./build-mac.sh
```

---

## 🔌 富媒体系统开发指南

### 添加新文件类型支持

#### 1. 扩展文件类型识别
```javascript
// 在 getFileType 函数中添加新类型
const typeMap = {
  // 现有类型...
  'newext': 'newtype'  // 添加新扩展名
};
```

#### 2. 添加文件图标
```javascript
// 在 getFileIcon 函数中添加图标
const iconMap = {
  // 现有图标...
  'newtype': '🆕'  // 添加新图标
};
```

#### 3. 扩展预览支持
```javascript
// 在 FilePreviewModal.vue 中添加预览逻辑
if (fileType === 'newtype') {
  // 新类型的预览实现
}
```

### 自定义Markdown渲染器

#### 扩展语法支持
```javascript
// 在 MarkdownRenderer.vue 中自定义渲染器
const renderer = new marked.Renderer();

// 自定义链接渲染
renderer.link = (href, title, text) => {
  if (href.startsWith('local://')) {
    // 处理本地文件链接
    return `<span class="file-card" data-file-id="${href.replace('local://', '')}">${text}</span>`;
  }
  return `<a href="${href}" title="${title}">${text}</a>`;
};
```

### 文件存储优化

#### 目录结构管理
```javascript
// 推荐的文件存储结构
Directory.Data/
├── media/
│   ├── {taskId}/
│   │   ├── images/
│   │   ├── documents/
│   │   └── videos/
└── cache/
    └── thumbnails/
```

#### 缓存策略
```javascript
// 实现文件缓存机制
const cacheFile = async (filePath, cacheKey) => {
  const cached = await getCachedFile(cacheKey);
  if (cached) return cached;
  
  const file = await Filesystem.readFile({ path: filePath });
  await setCachedFile(cacheKey, file);
  return file;
};
```

---

## 🎨 UI组件开发规范

### 组件命名规范
- **页面组件**: `XxxView.vue` (如 TodoView.vue)
- **业务组件**: `XxxModal.vue` (如 FilePreviewModal.vue)
- **通用组件**: `XxxComponent.vue` (如 LoadingSpinner.vue)

### 样式规范
```scss
// 使用CSS变量定义主题色
:root {
  --primary-color: #8b5cf6;
  --secondary-color: #a78bfa;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}

// 组件样式结构
.component-name {
  // 布局样式
  
  &__element {
    // 元素样式
  }
  
  &--modifier {
    // 修饰符样式
  }
}
```

### 响应式设计
```scss
// 断点定义
$mobile: 768px;
$tablet: 1024px;
$desktop: 1200px;

// 移动端优先
.component {
  // 移动端样式
  
  @media (min-width: $tablet) {
    // 平板样式
  }
  
  @media (min-width: $desktop) {
    // 桌面样式
  }
}
```

---

## 🔍 调试和测试

### 开发调试
```javascript
// 启用详细日志
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Debug info:', data);
}
```

### 移动端调试
```bash
# Android设备调试
adb logcat | grep -i capacitor

# Chrome DevTools远程调试
chrome://inspect/#devices
```

### 性能监控
```javascript
// 监控文件上传性能
const startTime = performance.now();
await uploadFile(file);
const endTime = performance.now();
console.log(`Upload took ${endTime - startTime} milliseconds`);
```

---

## 📦 构建和部署

### 构建配置

#### Vite配置 (vite.config.js)
```javascript
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia', 'vue-router'],
          markdown: ['marked', 'dompurify']
        }
      }
    }
  }
});
```

#### Capacitor配置 (capacitor.config.json)
```json
{
  "appId": "com.todo.app",
  "appName": "TODO App",
  "webDir": "dist",
  "plugins": {
    "Camera": {
      "permissions": ["camera", "photos"]
    },
    "Filesystem": {
      "permissions": ["storage"]
    }
  }
}
```

### 版本管理
```bash
# 更新版本号
npm version patch  # 0.8.9 -> 0.8.10
npm version minor  # 0.8.9 -> 0.9.0
npm version major  # 0.8.9 -> 1.0.0

# 同步到所有配置文件
npm run version-sync
```

---

## 🚀 最佳实践

### 代码组织
1. **单一职责**: 每个组件只负责一个功能
2. **组合式API**: 优先使用Composition API
3. **类型安全**: 使用JSDoc注释提供类型信息
4. **错误处理**: 统一的错误处理机制

### 性能优化
1. **懒加载**: 大组件使用动态导入
2. **虚拟滚动**: 长列表使用虚拟滚动
3. **图片优化**: 压缩图片，使用WebP格式
4. **缓存策略**: 合理使用浏览器缓存

### 安全考虑
1. **输入验证**: 所有用户输入都要验证
2. **XSS防护**: 使用DOMPurify净化HTML
3. **文件上传**: 限制文件类型和大小
4. **本地存储**: 敏感数据加密存储

### 用户体验
1. **加载状态**: 所有异步操作显示加载状态
2. **错误提示**: 友好的错误提示信息
3. **离线支持**: 确保离线功能正常
4. **响应式设计**: 适配各种屏幕尺寸

---

## 📚 API参考

### 富媒体API

#### pickImageForTask()
```javascript
/**
 * 选择图片并上传到任务
 * @returns {Promise<string>} 返回Markdown语法字符串
 */
const pickImageForTask = async () => {
  // 实现细节...
};
```

#### pickFileForTask()
```javascript
/**
 * 选择文件并上传到任务
 * @returns {Promise<string>} 返回Markdown语法字符串
 */
const pickFileForTask = async () => {
  // 实现细节...
};
```

#### getFileType(fileName)
```javascript
/**
 * 根据文件名获取文件类型
 * @param {string} fileName - 文件名
 * @returns {string} 文件类型
 */
const getFileType = (fileName) => {
  // 实现细节...
};
```

### Store API

#### addTask(task)
```javascript
/**
 * 添加新任务（支持media字段）
 * @param {Object} task - 任务对象
 * @param {Array} task.media - 媒体文件数组
 */
const addTask = (task) => {
  // 实现细节...
};
```

---

## 🔧 故障排除

### 常见问题

#### 1. 文件上传失败
**问题**: 文件上传后无法显示
**解决**: 检查文件路径和权限设置

#### 2. Markdown渲染异常
**问题**: 富媒体内容不显示
**解决**: 检查DOMPurify配置和local://协议处理

#### 3. 移动端权限问题
**问题**: 相机或文件访问被拒绝
**解决**: 检查Capacitor权限配置

### 调试技巧
1. **使用浏览器DevTools**: 检查网络请求和控制台错误
2. **Capacitor日志**: 查看原生层日志
3. **文件系统检查**: 验证文件是否正确保存
4. **性能分析**: 使用Performance面板分析性能

---

**文档维护**: TO-DO App 开发团队  
**技术支持**: GitHub Issues  
**最后更新**: 2026-03-10  
**文档版本**: v0.8.9

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

### Bottom Sheet 组件规范 (v0.7.8)

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

**已统一的组件** (v0.7.8):
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
