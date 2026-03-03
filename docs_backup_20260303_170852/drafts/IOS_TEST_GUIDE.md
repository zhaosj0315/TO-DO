# iPhone版本测试指南

## 📱 方案1: 免费Apple ID测试（推荐）

### 前置条件
- ✅ 已安装Xcode
- ✅ 有Apple ID（免费）
- ✅ 有真实iPhone设备

### 步骤

#### 1. 打开Xcode项目
```bash
open ios/App/App.xcodeproj
```

#### 2. 配置签名
1. 选择项目 "App"
2. 点击 "Signing & Capabilities"
3. 勾选 "Automatically manage signing"
4. Team: 选择你的Apple ID
5. Bundle Identifier: 改为唯一ID（如：com.yourname.todoapp）

#### 3. 连接iPhone
1. 用USB线连接iPhone到Mac
2. iPhone上点击"信任此电脑"
3. 输入iPhone密码

#### 4. 选择设备并运行
1. Xcode顶部选择你的iPhone设备
2. 点击运行按钮（▶️）
3. 等待构建和安装

#### 5. 信任开发者
1. iPhone上打开"设置"
2. 通用 → VPN与设备管理
3. 找到你的Apple ID
4. 点击"信任"

#### 6. 打开应用
从iPhone主屏幕打开TODO App

### ⚠️ 限制
- 应用7天后过期，需重新安装
- 只能安装到自己的设备
- 不能分发给其他人

---

## 📱 方案2: TestFlight测试（需付费账号）

### 前置条件
- ❌ 需要Apple Developer账号（$99/年）
- ✅ 可以分发给100个测试用户
- ✅ 应用90天有效期

### 步骤
1. 申请Apple Developer账号
2. 创建App ID和证书
3. 在Xcode中配置
4. Archive并上传到App Store Connect
5. 通过TestFlight分发

---

## 📱 方案3: 使用Expo Go（最简单，但功能受限）

### 优点
- ✅ 无需开发者账号
- ✅ 无需代码签名
- ✅ 扫码即可测试

### 缺点
- ❌ 不支持Capacitor插件
- ❌ 功能受限

---

## 🎯 推荐方案

### 立即测试（免费）
使用**方案1**：免费Apple ID + 真实设备

### 正式发布（付费）
使用**方案2**：Apple Developer账号 + TestFlight

---

## 📝 当前项目状态

### 已完成
- ✅ iOS项目已配置（ios/App/）
- ✅ Capacitor已同步
- ✅ 前端代码已构建

### 待完成
- ⏳ 配置代码签名
- ⏳ 连接真实设备
- ⏳ 运行测试

---

## 🔧 快速测试命令

```bash
# 1. 构建前端
npm run build

# 2. 同步到iOS
npx cap sync ios

# 3. 打开Xcode
npx cap open ios

# 4. 在Xcode中配置签名并运行
```

---

## ❓ 常见问题

### Q: 没有iPhone怎么办？
A: 可以使用iOS模拟器，但需要先安装：
```bash
# 在Xcode中下载iOS模拟器
Xcode → Settings → Platforms → iOS
```

### Q: 免费账号够用吗？
A: 测试够用，但7天后需重新安装

### Q: 如何长期使用？
A: 需要付费Apple Developer账号（$99/年）

---

**下一步**: 
1. 连接iPhone到Mac
2. 打开Xcode项目
3. 配置签名
4. 运行测试
