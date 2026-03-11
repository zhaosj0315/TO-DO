#!/bin/bash

# macOS ZIP 一键打包脚本
# 用途：自动构建 TODO App 的 macOS 安装包

set -e  # 遇到错误立即退出

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

echo "=========================================="
echo "  TODO App - macOS ZIP 打包脚本 v${VERSION}"
echo "=========================================="
echo ""

# 1. 检查环境
echo "📋 步骤 1/5: 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    exit 1
fi
echo "✅ Node.js 版本: $(node -v)"
echo ""

# 2. 清理旧文件
echo "🧹 步骤 2/5: 清理旧文件..."
rm -rf dist
# 只清理 macOS 相关文件，不删除整个 release 目录
rm -f release/TODO-App-*-mac*.zip
rm -rf release/mac release/mac-arm64
echo "✅ 清理完成"
echo ""

# 3. 构建前端
echo "🔨 步骤 3/5: 构建前端代码..."
npm run build
echo "✅ 前端构建完成"
echo ""

# 4. 打包 ZIP
echo "📦 步骤 4/5: 打包 macOS ZIP..."
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build-mac 2>&1 | tee /tmp/build-mac.log

echo "✅ ZIP 打包完成"
echo ""

# 5. 复制到项目根目录
echo "📂 步骤 5/5: 复制安装包..."

# 检查并复制 x64 版本
if [ -f "release/TODO App-${VERSION}-mac.zip" ]; then
    cp "release/TODO App-${VERSION}-mac.zip" "./TODO-App-v${VERSION}-mac-x64.zip"
    echo "✅ x64 安装包: TODO-App-v${VERSION}-mac-x64.zip"
fi

# 检查并复制 arm64 版本
if [ -f "release/TODO App-${VERSION}-arm64-mac.zip" ]; then
    cp "release/TODO App-${VERSION}-arm64-mac.zip" "./TODO-App-v${VERSION}-mac-arm64.zip"
    echo "✅ arm64 安装包: TODO-App-v${VERSION}-mac-arm64.zip"
fi

echo ""

# 显示文件信息
echo "=========================================="
echo "  ✅ 打包成功！"
echo "=========================================="
echo ""
echo "📦 安装包信息:"
ls -lh ./TODO-App-v${VERSION}-mac-*.zip 2>/dev/null || echo "未找到安装包"
echo ""
echo "🚀 安装方式:"
echo "   1. 解压 ZIP 文件"
echo "   2. 将 TODO App.app 拖到 Applications 文件夹"
echo "   3. 从启动台打开应用"
echo ""
echo "⚠️  首次打开提示:"
echo "   如提示'无法验证开发者'，请右键点击应用 → 打开"
echo ""
