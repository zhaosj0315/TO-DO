# 基础开发打包指南

**适用版本**: v0.7.9+  
**更新日期**: 2026-03-02  
**支持平台**: Android / Windows / macOS / iOS

---

## 📋 目录

- [环境准备](#环境准备)
- [快速开始](#快速开始)
- [平台打包](#平台打包)
- [常见问题](#常见问题)
- [版本管理](#版本管理)

---

## 环境准备

### 通用环境

所有平台都需要：

```bash
# 1. Node.js (v18+)
node -v  # 应显示 v18.0.0 或更高

# 2. npm (v8+)
npm -v   # 应显示 v8.0.0 或更高

# 3. 安装项目依赖
npm install
```

### 平台特定环境

| 平台 | 额外要求 | 验证命令 |
|------|---------|---------|
| **Android** | Java 17 | `java -version` |
| **Windows** | 无（可跨平台编译） | - |
| **macOS** | Xcode Command Line Tools | `xcode-select -v` |
| **iOS** | macOS + Xcode + Apple Developer | `xcodebuild -version` |

---

## 快速开始

### 一键打包所有平台

```bash
./build-all.sh
```

生成文件：
```
release/
├── TODO-App.apk                      # Android (54MB)
├── TODO-App-0.7.9-mac-x64.zip        # macOS Intel (132MB)
├── TODO-App-0.7.9-mac-arm64.zip      # macOS Apple Silicon (128MB)
└── TODO App Setup 0.7.9.exe          # Windows (109MB)
```

### 单独打包某个平台

```bash
# Android
./build-apk.sh

# Windows
./build-windows.sh

# macOS
./build-mac.sh

# iOS (需要手动操作)
./build-ios.sh
```

---

## 平台打包

### 🤖 Android APK

#### 一键打包
```bash
./build-apk.sh
```

#### 手动步骤
```bash
# 1. 构建前端
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 打包 APK
cd android
./gradlew assembleDebug

# 4. 复制到根目录
cp app/build/outputs/apk/debug/app-debug.apk ../TODO-App.apk
```

#### 输出文件
- **位置**: `release/TODO-App.apk`
- **大小**: 约 54MB
- **类型**: Debug 版本

#### 详细文档
→ [APK_BUILD_QUICK.md](./APK_BUILD_QUICK.md)

---

### 🪟 Windows EXE

#### 一键打包
```bash
# Windows 系统
build-windows.bat

# macOS/Linux 系统
./build-windows.sh
```

#### 手动步骤
```bash
# 1. 构建前端
npm run build

# 2. 打包 Electron
npm run build:win
```

#### 输出文件
- **位置**: `release/TODO App Setup 0.7.9.exe`
- **大小**: 约 109MB
- **类型**: NSIS 安装程序

#### 详细文档
→ [WINDOWS_BUILD_GUIDE.md](./WINDOWS_BUILD_GUIDE.md)

---

### 🍎 macOS DMG/ZIP

#### 一键打包
```bash
./build-mac.sh
```

#### 手动步骤
```bash
# 1. 构建前端
npm run build

# 2. 打包 Electron (x64)
npm run build:mac:x64

# 3. 打包 Electron (arm64)
npm run build:mac:arm64
```

#### 输出文件
- **位置**: 
  - `release/TODO-App-0.7.9-mac-x64.zip` (Intel)
  - `release/TODO-App-0.7.9-mac-arm64.zip` (Apple Silicon)
- **大小**: 约 128-132MB
- **类型**: ZIP 压缩包

#### 详细文档
→ [MAC_BUILD_QUICK.md](./MAC_BUILD_QUICK.md)

---

### 📱 iOS IPA

#### 一键准备
```bash
./build-ios.sh
```

这会自动：
1. 构建前端代码
2. 同步到 iOS 平台
3. 打开 Xcode 项目

#### 手动步骤

**1. 准备代码**
```bash
npm run build
npx cap sync ios
npx cap open ios
```

**2. 在 Xcode 中配置**
- 打开 `Signing & Capabilities`
- 选择你的 Team 和 Bundle Identifier
- 确保签名配置正确

**3. 打包 IPA**
- 菜单: `Product` → `Archive`
- 等待归档完成
- 点击 `Distribute App`
- 选择导出方式（Ad Hoc / App Store）
- 导出 IPA 文件

#### 输出文件
- **位置**: Xcode 导出目录
- **大小**: 约 20-30MB
- **类型**: IPA 安装包

#### 详细文档
→ [IOS_BUILD_GUIDE.md](./IOS_BUILD_GUIDE.md)

---

## 常见问题

### 通用问题

#### Q: 打包前需要清理吗？
```bash
# 清理前端构建
rm -rf dist/

# 清理 node_modules（可选）
rm -rf node_modules/
npm install
```

#### Q: 如何验证打包成功？
- **Android**: 安装 APK 到设备测试
- **Windows**: 运行 EXE 安装程序
- **macOS**: 解压 ZIP 并运行 .app
- **iOS**: 通过 TestFlight 或直接安装测试

#### Q: 打包失败怎么办？
1. 检查环境要求是否满足
2. 清理构建缓存重试
3. 查看对应平台的详细文档
4. 检查错误日志

---

### Android 问题

#### Q: Java 版本错误？
```bash
# 检查版本
java -version  # 必须是 Java 17

# macOS 切换版本
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

#### Q: Gradle 构建失败？
```bash
cd android
./gradlew clean
cd ..
./build-apk.sh
```

---

### Windows 问题

#### Q: 打包后白屏？
确保 `vite.config.js` 中配置了：
```javascript
export default defineConfig({
  base: './',  // 使用相对路径
})
```

#### Q: 安装程序无法运行？
- 右键 → 属性 → 解除锁定
- 或者以管理员身份运行

---

### macOS 问题

#### Q: 无法打开应用？
```bash
# 方法1: 右键打开
右键点击 .app → 打开 → 确认

# 方法2: 移除隔离属性
xattr -cr "TODO App.app"
```

#### Q: arm64 打包失败？
正常现象，x64 版本可通过 Rosetta 2 在 Apple Silicon 上运行。

---

### iOS 问题

#### Q: 签名失败？
- 确保有有效的 Apple Developer 账号
- 检查 Bundle Identifier 是否唯一
- 确保证书和描述文件正确

#### Q: 无法安装到设备？
- 确保设备已添加到描述文件
- 使用 Ad Hoc 或 Development 方式导出
- 或通过 TestFlight 分发

---

## 版本管理

### 更新版本号

修改以下文件：

**1. package.json**
```json
{
  "version": "0.7.9"
}
```

**2. Android (android/app/build.gradle)**
```gradle
android {
    defaultConfig {
        versionCode 79
        versionName "0.7.9"
    }
}
```

**3. iOS (ios/App/App/Info.plist)**
```xml
<key>CFBundleShortVersionString</key>
<string>0.7.9</string>
<key>CFBundleVersion</key>
<string>79</string>
```

**4. 打包脚本**
- `build-mac.sh`: 文件名中的版本号
- `build-windows.sh`: 文件名中的版本号
- `build-all.sh`: 文件名中的版本号

### 版本号规则

采用语义化版本 (Semantic Versioning):
- **主版本号**: 重大架构变更
- **次版本号**: 新功能添加
- **修订号**: Bug 修复

示例: `0.7.9` → `0.8.0` (新功能) → `1.0.0` (正式版)

---

## 平台对比

| 平台 | 打包难度 | 文件大小 | 发布方式 | 成本 | 推荐度 |
|------|---------|---------|---------|------|--------|
| Android | ⭐ 简单 | 54MB | APK 直接安装 | 免费 | ⭐⭐⭐⭐⭐ |
| Windows | ⭐⭐ 中等 | 109MB | EXE 安装程序 | 免费 | ⭐⭐⭐⭐ |
| macOS | ⭐⭐ 中等 | 130MB | ZIP 解压运行 | 免费 | ⭐⭐⭐⭐ |
| iOS | ⭐⭐⭐ 复杂 | 25MB | App Store / TestFlight | $99/年 | ⭐⭐⭐ |

---

## 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router

### 移动端 (Android/iOS)
- **框架**: Capacitor 8.x
- **存储**: Capacitor Preferences API
- **通知**: Capacitor Local Notifications

### 桌面端 (Windows/macOS)
- **框架**: Electron
- **打包工具**: electron-builder
- **安装程序**: NSIS (Windows) / DMG (macOS)

---

## 发布流程

### 1. 准备发布

```bash
# 1. 更新版本号
# 修改 package.json, build.gradle, Info.plist

# 2. 更新 README.md
# 修改版本号和更新日期

# 3. 提交代码
git add .
git commit -m "chore: bump version to 0.7.9"
git tag v0.7.9
git push origin main --tags
```

### 2. 打包所有平台

```bash
./build-all.sh
```

### 3. 测试安装包

- Android: 安装到真机测试
- Windows: 在 Windows 系统测试安装
- macOS: 在 Intel 和 Apple Silicon 测试
- iOS: 通过 TestFlight 测试

### 4. 发布到 GitHub Release

```bash
# 1. 在 GitHub 创建新 Release
# 2. 上传 release/ 目录中的所有文件
# 3. 编写 Release Notes
# 4. 发布
```

---

## 自动化建议

### CI/CD 集成

可以使用 GitHub Actions 自动化打包：

```yaml
# .github/workflows/build.yml
name: Build All Platforms

on:
  push:
    tags:
      - 'v*'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build APK
        run: ./build-apk.sh
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: android-apk
          path: release/TODO-App.apk

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Windows
        run: ./build-windows.bat
      - name: Upload EXE
        uses: actions/upload-artifact@v3
        with:
          name: windows-exe
          path: release/*.exe

  # ... 其他平台
```

---

## 相关文档

### 平台详细指南
- [APK 打包指南](./APK_BUILD_QUICK.md)
- [Windows 打包指南](./WINDOWS_BUILD_GUIDE.md)
- [macOS 打包指南](./MAC_BUILD_QUICK.md)
- [iOS 打包指南](./IOS_BUILD_GUIDE.md)

### 其他文档
- [跨平台打包总览](./CROSS_PLATFORM_BUILD.md)
- [打包脚本说明](./BUILD_SCRIPTS_GUIDE.md)
- [项目 README](../../README.md)

---

## 总结

### 推荐打包顺序

1. **Android** (最简单，优先测试)
2. **Windows** (中等难度，用户量大)
3. **macOS** (中等难度，开发者友好)
4. **iOS** (最复杂，需要付费账号)

### 最佳实践

- ✅ 每次打包前更新版本号
- ✅ 打包后立即测试安装
- ✅ 保留所有平台的安装包
- ✅ 使用 Git Tag 标记版本
- ✅ 编写详细的 Release Notes
- ❌ 不要将安装包提交到 Git
- ❌ 不要跳过测试直接发布

---

**最后更新**: 2026-03-02  
**文档版本**: v1.0.0
