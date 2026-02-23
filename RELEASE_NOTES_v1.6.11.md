# Release Notes v1.6.11

**发布日期**: 2026-02-23  
**版本号**: 1.6.11

---

## 🎉 新增功能

### Windows 打包支持
- ✅ 新增 `build-windows.bat` Windows 打包脚本
- ✅ 新增 `build-windows.sh` macOS/Linux 打包脚本
- ✅ 生成 NSIS 安装程序（109MB）
- ✅ 支持自定义安装目录
- ✅ 自动创建桌面快捷方式和开始菜单快捷方式
- ✅ 新增 `WINDOWS_BUILD_GUIDE.md` 详细打包指南

---

## 🐛 Bug 修复

### 重复任务耗时计算修复
**问题描述**:
- 重复任务（每天/工作日/每周）使用创建时间计算实际耗时
- 导致显示不合理数值（如"799小时"）

**修复方案**:
- 重复任务改为从当天 00:00 开始计算耗时
- 一次性任务继续使用创建时间
- 优化显示格式：
  - < 1小时 → "X分钟"
  - 1-24小时 → "X小时"
  - ≥ 24小时 → "X天"

**示例**:
- 修复前：每周任务完成于 11:42 → 显示"799小时"
- 修复后：每周任务完成于 11:42 → 显示"11小时"

---

## 🎨 UI 优化

### 优先级按钮样式优化
- 减小字体大小：0.9rem → 0.8rem
- 压缩内边距：0.5rem 0.8rem → 0.45rem 0.6rem
- 减小间距：0.5rem → 0.4rem
- 添加文字溢出处理：`overflow: hidden` + `text-overflow: ellipsis`
- 优化数字徽章：更小的字体和内边距，添加 `flex-shrink: 0` 防止被压缩

### 页脚文字颜色优化
- 版本号、版权信息、链接、"完全离线·本地存储"：白色 → #666（灰黑色）
- 分隔符：白色 → #999（浅灰色）
- 悬停效果：白色 → #333（深灰黑色）
- 解决白色文字在浅色背景下看不清的问题

---

## 📦 macOS 打包优化

### ZIP 格式打包
- 改用 ZIP 格式（127-132MB）
- 禁用代码签名（`identity: null`）避免兼容性问题
- 支持 x64 和 arm64 双架构
- 解决 DMG 打包在某些 macOS 版本上的 `hdiutil` 错误

---

## 📥 下载

### Android
- **文件名**: TODO-App.apk
- **大小**: 5.2 MB
- **架构**: ARM + x86

### Windows
- **文件名**: TODO App Setup 1.6.11.exe
- **大小**: 109 MB
- **架构**: x64
- **安装方式**: NSIS 安装程序

### macOS
- **Intel 版本**: TODO-App-1.6.11-mac-x64.zip (132 MB)
- **Apple Silicon 版本**: TODO-App-1.6.11-mac-arm64.zip (127 MB)
- **安装方式**: 解压后拖到 Applications 文件夹

---

## 🔧 技术细节

### 构建配置更新
```json
{
  "win": {
    "signAndEditExecutable": false
  },
  "mac": {
    "target": "zip",
    "identity": null
  }
}
```

### 代码修改
- `src/views/TodoView.vue`: 修复 `calculateActualHours` 函数
- `package.json`: 添加 Windows 和 macOS 打包配置
- `build-windows.bat`: 新增 Windows 打包脚本
- `build-windows.sh`: 新增跨平台打包脚本
- `build-mac.sh`: 更新 macOS 打包脚本

---

## ⚠️ 已知问题

1. **macOS DMG 打包失败**: 在某些 macOS 版本上 DMG 打包会失败，已改用 ZIP 格式
2. **Electron 应用体积**: macOS 和 Windows 版本体积较大（100MB+），这是 Electron 框架的固有限制

---

## 📚 相关文档

- [Windows 打包指南](WINDOWS_BUILD_GUIDE.md)
- [macOS 打包指南](MAC_BUILD_GUIDE.md)
- [APK 打包指南](APK_BUILD_QUICK.md)
- [主 README](README.md)

---

## 🙏 致谢

感谢所有用户的反馈和建议！

---

**上一版本**: [v1.6.10](RELEASE_NOTES_v1.6.10.md)  
**下一版本**: 开发中
