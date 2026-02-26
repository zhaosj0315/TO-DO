# iOS 打包指南

## 📱 前置要求

- ✅ macOS 系统
- ✅ Xcode 14+ (已安装)
- ⚠️ Apple Developer 账号（用于签名和发布）

---

## 🚀 快速开始

### 1. 构建前端并同步到 iOS
```bash
npm run build
npx cap sync ios
```

### 2. 打开 Xcode 项目
```bash
npx cap open ios
```

Xcode 会自动打开 `ios/App/App.xcworkspace` 项目。

---

## ⚙️ Xcode 配置步骤

### 1. 选择开发团队
1. 在 Xcode 左侧项目导航中选择 **App** 项目
2. 选择 **Signing & Capabilities** 标签
3. 在 **Team** 下拉菜单中选择你的 Apple Developer 团队
   - 如果没有团队，点击 **Add Account** 登录 Apple ID

### 2. 配置 Bundle Identifier
- 默认: `com.todo.app`
- 如果需要修改，在 **General** 标签下的 **Bundle Identifier** 字段修改

### 3. 选择目标设备
- 在 Xcode 顶部工具栏选择：
  - **Any iOS Device (arm64)** - 用于打包 IPA
  - 或选择连接的真机设备 - 用于真机测试

---

## 📦 打包 IPA 文件

### 方法一：Archive 打包（推荐）

#### 1. 创建 Archive
1. 在 Xcode 菜单栏选择 **Product** > **Archive**
2. 等待构建完成（首次可能需要 5-10 分钟）
3. 构建成功后会自动打开 **Organizer** 窗口

#### 2. 导出 IPA
1. 在 Organizer 中选择刚创建的 Archive
2. 点击右侧 **Distribute App** 按钮
3. 选择发布方式：
   - **Ad Hoc**: 用于内部测试（最多 100 台设备）
   - **Development**: 用于开发测试
   - **App Store Connect**: 用于 TestFlight 或 App Store 发布
4. 点击 **Next**，选择导出选项
5. 点击 **Export**，选择保存位置
6. IPA 文件会保存在选择的目录中

### 方法二：命令行打包

```bash
# 1. 构建 Archive
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

# 2. 导出 IPA
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build \
  -exportOptionsPlist exportOptions.plist
```

---

## 🧪 测试方式

### 1. 模拟器测试（免费）
1. 在 Xcode 顶部选择 iOS 模拟器（如 iPhone 15）
2. 点击运行按钮 ▶️
3. 应用会在模拟器中启动

### 2. 真机测试（需要 Apple Developer 账号）
1. 用 USB 连接 iPhone 到 Mac
2. 在 Xcode 顶部选择你的设备
3. 点击运行按钮 ▶️
4. 首次运行需要在 iPhone 上信任开发者证书：
   - 设置 > 通用 > VPN与设备管理 > 信任开发者

### 3. TestFlight 测试（需要 Apple Developer 账号）
1. 将 IPA 上传到 App Store Connect
2. 在 TestFlight 中添加测试用户
3. 测试用户通过 TestFlight App 安装

---

## 📤 发布到 App Store

### 1. 准备工作
- 在 [App Store Connect](https://appstoreconnect.apple.com) 创建应用
- 准备应用截图（必需）
- 准备应用描述和关键词
- 准备隐私政策 URL（如果收集用户数据）

### 2. 上传 IPA
1. 在 Xcode Organizer 中选择 Archive
2. 点击 **Distribute App**
3. 选择 **App Store Connect**
4. 完成上传

### 3. 提交审核
1. 在 App Store Connect 中完善应用信息
2. 添加截图和描述
3. 提交审核
4. 等待审核结果（通常 1-3 天）

---

## 🔧 常见问题

### 1. 签名错误
**问题**: "Failed to register bundle identifier"

**解决**:
- 确保已登录 Apple Developer 账号
- 修改 Bundle Identifier 为唯一值
- 在 Apple Developer 网站手动创建 App ID

### 2. 构建失败
**问题**: "Command PhaseScriptExecution failed"

**解决**:
```bash
# 清理构建缓存
cd ios
rm -rf Pods
pod install
cd ..
npx cap sync ios
```

### 3. 真机无法安装
**问题**: "Untrusted Developer"

**解决**:
- iPhone 设置 > 通用 > VPN与设备管理
- 找到开发者证书并点击信任

### 4. 没有 Apple Developer 账号
**免费账号限制**:
- ✅ 可以在模拟器测试
- ✅ 可以在自己的设备测试（7天有效期）
- ❌ 无法发布到 App Store
- ❌ 无法使用 TestFlight

**付费账号 ($99/年)**:
- ✅ 无限制真机测试
- ✅ 发布到 App Store
- ✅ 使用 TestFlight
- ✅ 使用推送通知等高级功能

---

## 📊 打包信息

- **项目路径**: `ios/App/App.xcworkspace`
- **Bundle ID**: `com.todo.app`
- **版本号**: 1.4.0
- **最低 iOS 版本**: iOS 13.0
- **预计 IPA 大小**: 20-30 MB

---

## 📝 下次打包

当代码更新后，重新打包：

```bash
# 1. 构建前端
npm run build

# 2. 同步到 iOS
npx cap sync ios

# 3. 打开 Xcode
npx cap open ios

# 4. 在 Xcode 中 Archive 并导出
```

---

## 🎯 当前状态

✅ iOS 项目已创建
✅ Xcode 已打开
⏳ 等待配置签名和打包

**下一步**:
1. 在 Xcode 中配置开发团队（Signing & Capabilities）
2. 选择 Product > Archive
3. 导出 IPA 文件

---

## 📚 相关资源

- [Capacitor iOS 文档](https://capacitorjs.com/docs/ios)
- [Apple Developer](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Xcode 下载](https://developer.apple.com/xcode/)
