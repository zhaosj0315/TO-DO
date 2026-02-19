# Windows EXE 打包快速指南

## 📦 一键打包（推荐）

```bash
./build-windows.sh
```

安装程序将生成在 `release/` 目录下。

---

## 🛠️ 手动打包步骤

### 1. 构建前端
```bash
npm run build
```

### 2. 打包 Windows 安装程序
```bash
npm run electron:build-win
```

### 3. 查看生成的文件
```bash
ls -lh release/
```

---

## 📁 输出文件

打包完成后，在 `release/` 目录下会生成：

- `TODO App Setup 1.4.0.exe` - Windows 安装程序（NSIS）
- 文件大小约 150-200 MB

---

## 🚀 安装和使用

1. 双击 `TODO App Setup 1.4.0.exe`
2. 选择安装目录
3. 完成安装
4. 从桌面快捷方式或开始菜单启动应用

---

## ⚙️ 配置说明

### 安装程序特性
- ✅ 可选择安装目录
- ✅ 创建桌面快捷方式
- ✅ 创建开始菜单快捷方式
- ✅ 支持卸载

### 应用特性
- ✅ 完全离线运行
- ✅ 数据存储在本地
- ✅ 支持 Windows 10/11

---

## 🔧 技术栈

- **前端**: Vue 3 + Vite
- **桌面框架**: Electron
- **打包工具**: electron-builder
- **安装程序**: NSIS

---

## 📝 注意事项

1. **首次打包**: 首次打包会下载 Electron 二进制文件（约 100MB），需要一些时间
2. **网络要求**: 打包过程需要网络连接下载依赖
3. **系统要求**: 
   - macOS 可以打包 Windows 版本（交叉编译）
   - 需要 Node.js 16+ 环境
4. **文件大小**: 打包后的安装程序约 150-200 MB（包含 Chromium 内核）

---

## 🐛 常见问题

### 打包失败
```bash
# 清理缓存重试
rm -rf node_modules release dist
npm install
./build-windows.sh
```

### 找不到 electron 命令
```bash
# 重新安装依赖
npm install
```

---

## 📚 相关文档

- [Electron 官方文档](https://www.electronjs.org/)
- [electron-builder 文档](https://www.electron.build/)
- [APK 打包指南](APK_BUILD_QUICK.md)
