# PDF预览修复说明

## 问题描述
Web端PDF预览正常，但手机端（Android/iOS）无法预览PDF文件。

## 原因分析
- **Web端**：浏览器原生支持 `<iframe>` 预览PDF
- **手机端**：大部分移动浏览器不支持iframe预览PDF（iOS Safari、部分Android浏览器）

## 解决方案

### 1. 安装 FileOpener 插件
```bash
npm install @capacitor-community/file-opener
npx cap sync
```

### 2. 修改 FilePreviewModal.vue
- **移除**：`<iframe>` PDF预览（手机端不支持）
- **新增**：PDF打开按钮，调用原生PDF查看器
- **逻辑**：
  - 原生端（Android/iOS）：使用 `FileOpener.open()` 打开系统PDF查看器
  - Web端：降级为下载文件

### 3. 核心代码
```javascript
import { FileOpener } from '@capacitor-community/file-opener'
import { Capacitor } from '@capacitor/core'

const handleOpenPDF = async () => {
  const isNative = Capacitor.isNativePlatform()
  
  if (isNative) {
    // 原生端：使用系统PDF查看器
    await FileOpener.open({
      filePath: props.file.path,
      contentType: 'application/pdf',
      openWithDefault: true
    })
  } else {
    // Web端：下载文件
    await handleDownload()
  }
}
```

## 用户体验
- **手机端**：点击"📖 打开PDF"按钮 → 系统PDF查看器打开
- **Web端**：点击"📖 打开PDF"按钮 → 下载PDF文件

## 测试步骤
1. 上传一个PDF文件到任务描述
2. 点击PDF附件预览
3. 点击"📖 打开PDF"按钮
4. 验证：
   - Android：使用系统PDF查看器打开
   - iOS：使用系统PDF查看器打开
   - Web：下载PDF文件

## 优势
- ✅ 原生体验：使用系统自带的PDF查看器（支持缩放、搜索、分享等）
- ✅ 兼容性好：支持所有Android/iOS设备
- ✅ 性能优秀：不需要在WebView中渲染PDF
- ✅ 统一体验：与系统其他应用保持一致

## 相关文件
- `src/components/FilePreviewModal.vue`：PDF预览组件
- `package.json`：新增 `@capacitor-community/file-opener` 依赖
