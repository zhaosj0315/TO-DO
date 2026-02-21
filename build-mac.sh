#!/bin/bash

# macOS DMG 一键打包脚本
# 用途：自动构建 TODO App 的 macOS 安装包

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  TODO App - macOS DMG 打包脚本"
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
rm -rf release
echo "✅ 清理完成"
echo ""

# 3. 构建前端
echo "🔨 步骤 3/5: 构建前端代码..."
npm run build
echo "✅ 前端构建完成"
echo ""

# 4. 打包 DMG
echo "📦 步骤 4/5: 打包 macOS DMG..."
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build-mac || true
# 检查 x64 版本是否成功
if [ ! -f "release/TODO App-${VERSION}.dmg" ]; then
    echo "❌ 错误: DMG 打包失败"
    exit 1
fi
echo "✅ DMG 打包完成 (x64)"
echo "⚠️  注意: arm64 版本构建失败（已知问题），但 x64 版本可通过 Rosetta 2 在 M 芯片 Mac 上运行"
echo ""

# 5. 复制到项目根目录
echo "📂 步骤 5/5: 复制安装包..."
VERSION=$(node -p "require('./package.json').version")
DMG_NAME="TODO-App-${VERSION}-mac.dmg"
cp "release/TODO App-${VERSION}.dmg" "./${DMG_NAME}"
echo "✅ 安装包已生成: ${DMG_NAME}"
echo ""

# 显示文件信息
echo "=========================================="
echo "  ✅ 打包成功！"
echo "=========================================="
echo ""
echo "📦 安装包信息:"
ls -lh "./${DMG_NAME}"
echo ""
echo "📍 文件位置: $(pwd)/${DMG_NAME}"
echo ""
echo "🚀 安装方式:"
echo "   1. 双击 ${DMG_NAME}"
echo "   2. 将 TODO App 拖到 Applications 文件夹"
echo "   3. 从启动台打开应用"
echo ""
echo "⚠️  首次打开提示:"
echo "   如提示'无法验证开发者'，请右键点击应用 → 打开"
echo ""
