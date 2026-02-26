# APK文件清理指南 | APK Cleanup Guide

**创建日期**: 2026-02-18  
**目的**: 清理项目根目录中的冗余APK文件

---

## 📋 当前APK文件状态

项目根目录中存在以下APK文件：

```
TODO-App.apk                    # 旧版本
TODO-App-v1.2.1.apk            # v1.2.1版本（保留）
TODO-App-v1.2.1-fix.apk        # v1.2.1修复版本（最新，保留）
TODO-App_副本.apk              # 备份文件（删除）
TODO-App-Debug.apk             # 调试版本（删除）
TODO-App-Offline.apk           # 旧版本（删除）
```

---

## ✅ 推荐操作

### 保留文件
- **TODO-App-v1.2.1-fix.apk** - 最新版本，重命名为标准格式

### 删除文件
```bash
# 在项目根目录执行
rm TODO-App.apk
rm TODO-App-v1.2.1.apk
rm TODO-App_副本.apk
rm TODO-App-Debug.apk
rm TODO-App-Offline.apk
```

### 重命名最新版本
```bash
mv TODO-App-v1.2.1-fix.apk TODO-App-v1.2.1.apk
```

---

## 📝 APK文件命名规范

### 标准格式
```
TODO-App-vX.Y.Z.apk
```

### 示例
- `TODO-App-v1.2.1.apk` ✅ 正确
- `TODO-App-v1.2.1-fix.apk` ❌ 不规范（包含额外后缀）
- `TODO-App.apk` ❌ 不规范（缺少版本号）
- `TODO-App_副本.apk` ❌ 不规范（中文后缀）

---

## 🔄 未来版本发布流程

### 1. 构建APK
```bash
npm run build
npx cap sync android
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
cd android && ./gradlew assembleDebug
```

### 2. 复制并命名APK
```bash
# 从构建目录复制到项目根目录
cp android/app/build/outputs/apk/debug/app-debug.apk TODO-App-vX.Y.Z.apk
```

### 3. 删除旧版本APK
```bash
# 删除所有旧版本（.gitignore已配置忽略*.apk）
rm TODO-App-v*.apk  # 删除旧版本
# 保留最新版本
```

### 4. 验证
```bash
# 确保只有一个APK文件
ls -lh TODO-App-v*.apk
```

---

## ⚠️ 注意事项

1. **Git忽略**: `.gitignore`已配置忽略`*.apk`，APK文件不会被提交到仓库
2. **版本管理**: 只在项目根目录保留最新版本的APK
3. **发布渠道**: 通过GitHub Releases或其他渠道分发APK，不要提交到代码仓库
4. **备份**: 如需保留历史版本，请存储在项目外的目录

---

## 📦 推荐的APK管理方式

### 方案1: GitHub Releases（推荐）
1. 在GitHub仓库创建Release
2. 上传APK文件作为Release附件
3. 项目根目录不保留APK文件

### 方案2: 外部存储
1. 将APK文件存储在云盘或专门的发布目录
2. 在README中提供下载链接
3. 项目根目录不保留APK文件

### 方案3: 本地保留（当前方案）
1. 项目根目录只保留最新版本APK
2. 旧版本APK移至`releases/`目录（不提交到Git）
3. `.gitignore`已配置忽略所有APK文件

---

## 🚀 一键清理脚本

创建`cleanup-apk.sh`脚本：

```bash
#!/bin/bash

# APK清理脚本
echo "开始清理旧版本APK文件..."

# 获取最新版本号
LATEST_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
echo "当前版本: v$LATEST_VERSION"

# 删除所有APK文件（除了最新版本）
find . -maxdepth 1 -name "*.apk" ! -name "TODO-App-v$LATEST_VERSION.apk" -delete

echo "清理完成！"
echo "保留文件: TODO-App-v$LATEST_VERSION.apk"
```

使用方法：
```bash
chmod +x cleanup-apk.sh
./cleanup-apk.sh
```

---

**维护者**: 开发团队  
**最后更新**: 2026-02-18
