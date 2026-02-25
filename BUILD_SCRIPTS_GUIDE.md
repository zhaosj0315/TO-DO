# 打包脚本使用说明

## 📦 一键打包所有平台

```bash
./build-all.sh
```

### 功能特性

1. **统一目录管理**：所有安装包统一放在 `release/` 目录
2. **智能清理**：只清理旧的安装包，保留其他文件
3. **交互式选择**：可选择打包单个或多个平台
4. **进度统计**：显示成功/失败数量和总耗时

### 打包顺序

1. Android APK (54MB)
2. macOS x64 + arm64 (132MB + 128MB)
3. Windows Setup (109MB)

### 生成的文件

```
release/
├── TODO-App.apk                      # Android
├── TODO-App-1.7.5-mac-x64.zip        # macOS Intel
├── TODO-App-1.7.5-mac-arm64.zip      # macOS Apple Silicon
└── TODO App Setup 1.7.5.exe          # Windows
```

---

## 🔧 单独打包某个平台

### Android APK

```bash
./build-apk.sh
```

生成：`release/TODO-App.apk`

### macOS

```bash
./build-mac.sh
```

生成：
- `release/TODO-App-1.7.5-mac-x64.zip`
- `release/TODO-App-1.7.5-mac-arm64.zip`

### Windows

```bash
./build-windows.sh
```

生成：`release/TODO App Setup 1.7.5.exe`

---

## ⚠️ 注意事项

### 清理逻辑

每个脚本只清理自己相关的文件，不会删除其他平台的安装包：

- `build-apk.sh`：清理 `TODO-App.apk`
- `build-mac.sh`：清理 `TODO-App-*-mac*.zip`
- `build-windows.sh`：清理 `*.exe` 和 `win-unpacked/`
- `build-all.sh`：开始前统一清理所有旧安装包

### 文件冲突

如果单独运行脚本，不会互相覆盖：

```bash
# 正确：依次打包，文件都会保留
./build-apk.sh
./build-mac.sh
./build-windows.sh

# 正确：一键打包全部
./build-all.sh
```

---

## 📤 上传到 GitHub Release

打包完成后，直接上传 `release/` 目录中的文件：

```bash
# 查看生成的文件
ls -lh release/

# 上传到 GitHub Release
# 1. 在 GitHub 创建新 Release
# 2. 上传 release/ 目录中的所有 .apk, .zip, .exe 文件
```

---

## 🐛 故障排查

### 问题：打包后只有一个平台的文件

**原因**：旧版本脚本会 `rm -rf release`，导致覆盖

**解决**：更新到最新版本脚本（已修复）

### 问题：macOS 打包失败

**原因**：Node.js 版本不兼容

**解决**：
```bash
node -v  # 确保 >= 18.0.0
```

### 问题：Android 打包失败

**原因**：Java 版本不是 17

**解决**：
```bash
java -version  # 确保是 Java 17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

---

## 📝 版本更新

修改版本号后需要更新：

1. `package.json` → `version`
2. `build-mac.sh` → 文件名中的版本号
3. `build-windows.sh` → 文件名中的版本号
4. `build-all.sh` → 文件名中的版本号
