#!/bin/bash

# TO-DO App iOS 一键打包脚本
# 使用方法: ./build-ios.sh

set -e

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

echo "=========================================="
echo "  TO-DO App iOS 一键打包 v${VERSION}"
echo "=========================================="

# 1. 构建Vue项目
echo ""
echo "📦 [1/4] 构建Vue项目..."
npm run build

# 2. 同步到iOS
echo ""
echo "🔄 [2/4] 同步到iOS项目..."
npx cap sync ios

# 3. 打开Xcode项目
echo ""
echo "🍎 [3/4] 打开Xcode项目..."
echo ""
echo "⚠️  请在Xcode中完成以下步骤："
echo "   1. 选择开发团队（Signing & Capabilities）"
echo "   2. 连接iOS设备或选择模拟器"
echo "   3. 点击 Product > Archive 打包"
echo "   4. 或点击 ▶️ 按钮直接运行"
echo ""

npx cap open ios

echo ""
echo "✅ [4/4] Xcode已打开！"
echo ""
echo "📝 提示："
echo "   - 真机测试需要Apple开发者账号"
echo "   - 模拟器测试无需账号"
echo "   - Archive后可导出IPA文件"
echo ""
