#!/bin/bash

# Windows Electron 一键打包脚本（macOS/Linux 环境）
# 用途：自动构建 TODO App 的 Windows 安装程序

set -e  # 遇到错误立即退出

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

echo "=========================================="
echo "  TODO App - Windows 安装包打包脚本 v${VERSION}"
echo "=========================================="
echo ""

# 1. 清理旧文件
echo "🧹 步骤 1/3: 清理旧文件..."
rm -rf dist
# 只清理 Windows 相关文件，不删除整个 release 目录
rm -f release/*.exe release/*.exe.blockmap release/*.yml release/*.yaml
rm -rf release/win-unpacked
echo "✅ 清理完成"
echo ""

# 2. 构建前端代码
echo "🔨 步骤 2/3: 构建前端代码..."
npm run build
echo "✅ 前端构建完成"
echo ""

# 3. 打包 Windows 安装程序
echo "📦 步骤 3/3: 打包 Windows 安装程序..."
npx electron-builder --win

echo "✅ Windows 打包完成"
echo ""

# 显示文件信息
echo "=========================================="
echo "  ✅ 打包成功！"
echo "=========================================="
echo ""
echo "📦 安装包位置: release/TODO App Setup ${VERSION}.exe"
echo ""
echo "🚀 安装方式:"
echo "   1. 双击运行 Setup 安装程序"
echo "   2. 选择安装目录"
echo "   3. 完成安装后从桌面快捷方式启动"
echo ""
