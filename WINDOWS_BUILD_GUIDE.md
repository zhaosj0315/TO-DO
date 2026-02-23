# Windows 安装包打包指南

## 📋 目录
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [常见问题](#常见问题)

---

## 环境要求

### 必需软件
- **Node.js**: v16+ (推荐 v18 或更高)
- **npm**: v8+ (随 Node.js 安装)
- **操作系统**: Windows 10/11 或 macOS/Linux（交叉编译）

### 验证环境
```bash
node -v    # 应显示 v16.0.0 或更高
npm -v     # 应显示 v8.0.0 或更高
```

---

## 快速开始

### Windows 系统
双击运行 `build-windows.bat` 即可自动完成打包。

### macOS/Linux 系统
```bash
chmod +x build-windows.sh  # 首次运行需要
./build-windows.sh
```

---

## 详细步骤

### 1. 安装依赖（首次运行）
```bash
npm install
```

### 2. 运行打包脚本

#### Windows 用户
```cmd
build-windows.bat
```

#### macOS/Linux 用户
```bash
./build-windows.sh
```

### 3. 等待打包完成
脚本会自动执行以下步骤：
1. 清理旧的构建文件
2. 构建前端代码（Vue + Vite）
3. 打包 Electron 应用为 Windows 安装程序

### 4. 获取安装包
打包完成后，安装包位于：
```
release/TODO App Setup 1.6.11.exe
```

---

## 打包配置说明

### package.json 配置
```json
{
  "build": {
    "appId": "com.todo.app",
    "productName": "TODO App",
    "win": {
      "target": "nsis",
      "arch": ["x64"],
      "icon": "public/icon.png",
      "signAndEditExecutable": false
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### 配置说明
- **target**: `nsis` - 使用 NSIS 安装程序格式
- **arch**: `x64` - 64位 Windows 系统
- **oneClick**: `false` - 允许用户选择安装目录
- **createDesktopShortcut**: 创建桌面快捷方式
- **createStartMenuShortcut**: 创建开始菜单快捷方式
- **signAndEditExecutable**: `false` - 禁用代码签名（避免证书问题）

---

## 安装包使用

### 安装步骤
1. 双击 `TODO App Setup 1.6.11.exe`
2. 选择安装语言（如果提示）
3. 选择安装目录（默认：`C:\Program Files\TODO App`）
4. 等待安装完成
5. 从桌面快捷方式或开始菜单启动应用

### 卸载方法
- **方法1**: 控制面板 → 程序和功能 → 卸载 TODO App
- **方法2**: 开始菜单 → TODO App → Uninstall

---

## 常见问题

### 1. 打包失败：`electron-builder not found`
**解决方案**:
```bash
npm install electron-builder --save-dev
```

### 2. 打包失败：`Cannot find module 'electron'`
**解决方案**:
```bash
npm install electron --save-dev
```

### 3. 图标未显示
**原因**: `public/icon.png` 文件不存在或格式不正确

**解决方案**:
- 确保 `public/icon.png` 存在
- 图标尺寸建议：256x256 或 512x512
- 格式：PNG（推荐）或 ICO

### 4. 安装包体积过大
**原因**: 包含了 node_modules 中的所有文件

**解决方案**: 在 package.json 中配置 `files` 字段：
```json
{
  "build": {
    "files": [
      "dist/**/*",
      "electron/**/*",
      "!node_modules/**/android/**/*",
      "!node_modules/**/*.dex",
      "!node_modules/**/*.jar"
    ]
  }
}
```

### 5. Windows Defender 报毒
**原因**: 未签名的 Electron 应用可能被误报

**解决方案**:
- 用户端：添加信任例外
- 开发端：购买代码签名证书并配置签名

### 6. 在 macOS/Linux 上打包 Windows 版本
**要求**: 需要安装 Wine（可选）

**不使用 Wine**:
```bash
# electron-builder 支持交叉编译
./build-windows.sh
```

**使用 Wine**（更完整的测试）:
```bash
# macOS
brew install wine-stable

# Linux
sudo apt-get install wine
```

---

## 高级配置

### 多架构打包
如需同时打包 32 位和 64 位版本：
```json
{
  "win": {
    "target": "nsis",
    "arch": ["x64", "ia32"]
  }
}
```

### 便携版（免安装）
```json
{
  "win": {
    "target": ["nsis", "portable"]
  }
}
```

### 自定义安装程序界面
```json
{
  "nsis": {
    "installerIcon": "build/installer.ico",
    "uninstallerIcon": "build/uninstaller.ico",
    "installerHeaderIcon": "build/installerHeader.ico",
    "license": "LICENSE.txt"
  }
}
```

---

## 文件结构

```
TO-DO/
├── build-windows.bat          # Windows 打包脚本
├── build-windows.sh           # macOS/Linux 打包脚本
├── package.json               # 项目配置（含 electron-builder 配置）
├── electron/
│   └── main.js               # Electron 主进程
├── dist/                     # 前端构建产物（自动生成）
└── release/                  # 打包输出目录（自动生成）
    └── TODO App Setup 1.6.11.exe
```

---

## 参考资源

- [Electron Builder 官方文档](https://www.electron.build/)
- [NSIS 配置选项](https://www.electron.build/configuration/nsis)
- [代码签名指南](https://www.electron.build/code-signing)

---

## 版本历史

### v1.6.11 (2026-02-23)
- ✅ 初始 Windows 打包支持
- ✅ 创建自动化打包脚本
- ✅ 配置 NSIS 安装程序
- ✅ 禁用代码签名（避免证书问题）

---

**注意**: 本指南基于 Electron Builder 26.x 和 Electron 40.x 版本编写。
