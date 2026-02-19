# 跨平台打包指南

## 📦 支持的平台

- ✅ **Android** - APK 安装包
- ✅ **Windows** - EXE 安装程序
- ✅ **iOS** - IPA 安装包（需要 Apple Developer 账号）

---

## 🤖 Android 打包

### 一键打包
```bash
./build-apk.sh
```

### 输出文件
- `TODO-App.apk` (约 5-10 MB)

### 详细文档
查看 [APK_BUILD_QUICK.md](APK_BUILD_QUICK.md)

---

## 🪟 Windows 打包

### 一键打包
```bash
./build-windows.sh
```

### 输出文件
- `release/TODO App Setup 1.4.0.exe` (约 185 KB - 安装程序)
- `release/todo-app-1.4.0-x64.nsis.7z` (约 100 MB - 压缩包)

### 详细文档
查看 [WINDOWS_BUILD_GUIDE.md](WINDOWS_BUILD_GUIDE.md)

---

## 🍎 iOS 打包

### 一键打包
```bash
./build-ios.sh
```

这会自动：
1. 构建前端代码
2. 同步到 iOS 平台
3. 打开 Xcode 项目

然后在 Xcode 中：
1. 配置签名（Signing & Capabilities）
2. Product > Archive
3. Distribute App > 导出 IPA

### 输出文件
- `TODO-App.ipa` (约 20-30 MB)

### 详细文档
查看 [IOS_BUILD_GUIDE.md](IOS_BUILD_GUIDE.md)

---

## 📊 平台对比

| 平台 | 打包难度 | 文件大小 | 发布方式 | 成本 |
|------|---------|---------|---------|------|
| Android | ⭐ 简单 | 5-10 MB | APK 直接安装 | 免费 |
| Windows | ⭐⭐ 中等 | 100 MB | EXE 安装程序 | 免费 |
| iOS | ⭐⭐⭐ 复杂 | 20-30 MB | App Store / TestFlight | $99/年 |

---

## 🔧 技术栈

### Android
- **框架**: Capacitor
- **构建工具**: Gradle
- **输出格式**: APK

### Windows
- **框架**: Electron
- **打包工具**: electron-builder
- **安装程序**: NSIS
- **输出格式**: EXE

### iOS
- **框架**: Capacitor
- **构建工具**: Xcode
- **输出格式**: IPA

---

## 📝 版本管理

当前版本: **v1.4.0**

更新版本号时需要修改：
1. `package.json` - `version` 字段
2. `android/app/build.gradle` - `versionCode` 和 `versionName`
3. `ios/App/App/Info.plist` - `CFBundleShortVersionString`（如果有 iOS）

---

## 🚀 快速开始

### 打包所有平台
```bash
# Android
./build-apk.sh

# Windows
./build-windows.sh

# iOS (需要 macOS)
npx cap sync ios
npx cap open ios
# 然后在 Xcode 中打包
```

---

## 📚 相关文档

- [APK 打包指南](APK_BUILD_QUICK.md)
- [Windows 打包指南](WINDOWS_BUILD_GUIDE.md)
- [功能说明](FEATURES.md)
- [README](README.md)
