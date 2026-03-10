# 富媒体附件系统

**版本**: v0.8.9  
**更新日期**: 2026-03-10  
**状态**: 已实现  
**负责人**: 开发团队

---

## 📋 目录
- [功能概述](#功能概述)
- [支持的文件类型](#支持的文件类型)
- [核心组件](#核心组件)
- [使用方法](#使用方法)
- [技术实现](#技术实现)
- [数据结构](#数据结构)
- [API接口](#api接口)
- [测试用例](#测试用例)

---

## 功能概述

富媒体附件系统是 TO-DO App v0.8.9 的核心功能，支持在任务描述中插入多种类型的文件，并提供预览功能。该系统采用本地存储策略，确保离线可用性。

### 核心特性

- **多文件类型支持**: 支持图片、PDF、Word、Excel、PPT、视频、压缩包等 8 大类型
- **双重上传方式**: 🖼️ 图片按钮（相册选择）+ 📎 文件按钮（文档上传）
- **全屏预览系统**: 支持图片、PDF、视频在线预览
- **智能文件识别**: 自动识别 20+ 种文件扩展名
- **本地存储**: 所有文件保存在设备本地，支持离线访问
- **Markdown 集成**: 无缝集成到 Markdown 编辑器中

---

## 支持的文件类型

### 图片类型
- **扩展名**: JPG, JPEG, PNG, GIF, BMP, WebP
- **图标**: 📸
- **预览**: 全屏居中显示，黑色背景
- **特性**: 默认 300px 宽度，点击可全屏预览

### 文档类型
- **PDF**: 📕 - 浏览器原生 iframe 预览
- **Word**: 📄 - DOC/DOCX，显示文件卡片
- **文本**: 📄 - TXT/RTF，等宽字体显示

### 表格类型
- **Excel**: 📊 - XLS/XLSX/CSV，显示文件卡片
- **图标**: 📊

### 演示类型
- **PowerPoint**: 📽️ - PPT/PPTX，显示文件卡片
- **图标**: 📽️

### 视频类型
- **扩展名**: MP4, MOV, AVI, MKV, FLV, WMV
- **图标**: 🎬
- **预览**: HTML5 播放器，支持播放控制

### 压缩包类型
- **扩展名**: ZIP, RAR, 7Z, TAR, GZ
- **图标**: 📦
- **预览**: 显示文件信息，支持下载

---

## 核心组件

### 1. MarkdownRenderer.vue
**功能**: Markdown 渲染器，支持富媒体内容渲染
**位置**: `src/components/MarkdownRenderer.vue`

**主要方法**:
- `processLocalImages()`: 处理本地图片和文件链接
- `bindFileCardEvents()`: 绑定文件卡片和图片点击事件
- `getFileIcon()`: 获取文件类型对应图标
- `formatFileSize()`: 格式化文件大小显示

### 2. FilePreviewModal.vue
**功能**: 文件预览弹窗组件
**位置**: `src/components/FilePreviewModal.vue`

**主要功能**:
- 全屏预览弹窗（左右全屏）
- 支持图片、PDF、视频预览
- 文件下载功能
- 优雅降级处理

### 3. TodoView.vue (富媒体相关部分)
**功能**: 主界面中的富媒体上传功能
**位置**: `src/views/TodoView.vue`

**主要方法**:
- `pickImageForTask()`: 图片选择和上传
- `pickFileForTask()`: 文件选择和上传
- `getFileType()`: 文件类型判断

---

## 使用方法

### 1. 上传图片
1. 在任务编辑界面点击 🖼️ 图片按钮
2. 选择相册中的图片
3. 系统自动插入 Markdown 语法: `![图片](local://img_xxx)`
4. 预览模式下可看到真实图片

### 2. 上传文件
1. 在任务编辑界面点击 📎 文件按钮
2. 选择本地文件（支持多种格式）
3. 系统自动插入 Markdown 语法: `[📎 文件名](local://file_xxx)`
4. 预览模式下显示文件卡片

### 3. 预览文件
1. 点击任务中的图片或文件卡片
2. 自动打开全屏预览弹窗
3. 支持的格式直接预览，不支持的提供下载

### 4. 下载文件
1. 在预览弹窗中点击下载按钮
2. 或点击文件卡片直接下载
3. 文件保存到设备本地

---

## 技术实现

### 存储策略
- **存储位置**: `Directory.Data/media/{taskId}/`
- **文件命名**: `{mediaId}.{ext}` (如: `img_1773104018300.jpg`)
- **元数据存储**: 保存在任务对象的 `media` 字段中

### 数据流程
```
用户选择文件 → 读取为Base64 → 保存到本地 → 生成元数据 → 插入Markdown语法 → 渲染显示
```

### 文件大小限制
- **上传限制**: 10MB
- **检查时机**: 文件选择后立即检查
- **超限处理**: 显示错误提示，拒绝上传

### 安全措施
- **DOMPurify**: 防止 XSS 攻击
- **文件类型验证**: 基于扩展名验证
- **本地存储**: 避免网络安全风险

---

## 数据结构

### Media 对象结构
```javascript
{
  id: 'img_1773104018300',           // 媒体ID
  type: 'image',                     // 文件类型
  name: 'img_1773104018300.jpg',     // 存储文件名
  originalName: '照片.jpg',          // 原始文件名
  path: 'media/taskId/filename.jpg', // 存储路径
  size: 1024000,                     // 文件大小（字节）
  ext: 'jpg',                        // 文件扩展名
  uploadedAt: '2026-03-10T08:51:54.704Z' // 上传时间
}
```

### 任务对象扩展
```javascript
{
  // ... 其他任务字段
  media: [                           // 媒体资源数组
    {
      id: 'img_xxx',
      type: 'image',
      // ... 其他媒体字段
    }
  ]
}
```

---

## API接口

### 图片上传
```javascript
const pickImageForTask = async () => {
  // 使用 @capacitor/camera 选择图片
  const photo = await Camera.getPhoto({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos
  })
  
  // 保存到本地并生成元数据
  // 插入 Markdown 语法
}
```

### 文件上传
```javascript
const pickFileForTask = async () => {
  // 创建文件选择器
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov,.avi,.zip,.txt'
  
  // 处理文件选择和保存
}
```

### 文件类型判断
```javascript
const getFileType = (ext) => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv']
  // ... 其他类型判断
  
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  // ... 返回对应类型
}
```

---

## 测试用例

### 功能测试
1. **图片上传测试**
   - 选择不同格式图片 (JPG, PNG, GIF)
   - 验证图片正确显示
   - 验证点击预览功能

2. **文件上传测试**
   - 上传不同类型文件 (PDF, Word, Excel)
   - 验证文件卡片显示
   - 验证文件大小限制 (10MB)

3. **预览功能测试**
   - PDF 预览测试
   - 视频播放测试
   - 文本文件预览测试

### 边界测试
1. **文件大小测试**
   - 上传超过 10MB 的文件
   - 验证错误提示

2. **文件格式测试**
   - 上传不支持的文件格式
   - 验证优雅降级

3. **存储空间测试**
   - 设备存储空间不足时的处理
   - 验证错误处理机制

### 兼容性测试
1. **平台兼容性**
   - Android 设备测试
   - Web 浏览器测试
   - iOS 设备测试 (如适用)

2. **文件系统兼容性**
   - 不同文件系统的兼容性
   - 文件路径处理测试

---

## 已知限制

1. **Web 环境限制**
   - 文件选择器功能在 Web 环境下受限
   - 某些文件格式预览可能不支持

2. **存储限制**
   - 依赖设备本地存储空间
   - 大文件可能影响应用性能

3. **预览限制**
   - Word/Excel/PPT 文件无法直接预览
   - 需要下载后使用对应应用打开

---

## 未来规划

### Phase 3 计划
- [ ] 支持文件编辑功能
- [ ] 增加文件压缩选项
- [ ] 支持批量文件上传
- [ ] 增加文件搜索功能

### 性能优化
- [ ] 大文件分块上传
- [ ] 图片自动压缩
- [ ] 缓存机制优化

---

**文档维护**: 开发团队  
**最后更新**: 2026-03-10
