#!/bin/bash

echo "=========================================="
echo "  TODO App - iOS 一键打包脚本"
echo "=========================================="
echo ""

# 1. 构建前端
echo "📦 步骤 1/3: 构建前端代码..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ 前端构建失败！"
  exit 1
fi

echo "✅ 前端构建完成"
echo ""

# 2. 同步到 iOS
echo "🔄 步骤 2/3: 同步到 iOS 平台..."
npx cap sync ios

if [ $? -ne 0 ]; then
  echo "❌ iOS 同步失败！"
  exit 1
fi

echo "✅ iOS 同步完成"
echo ""

# 3. 打开 Xcode
echo "🚀 步骤 3/3: 打开 Xcode 项目..."
npx cap open ios

echo ""
echo "=========================================="
echo "✅ Xcode 已打开！"
echo ""
echo "📝 接下来在 Xcode 中操作："
echo "   1. 选择 Signing & Capabilities 配置开发团队"
echo "   2. 选择 Product > Archive"
echo "   3. 点击 Distribute App 导出 IPA"
echo ""
echo "📚 详细步骤请查看: IOS_BUILD_GUIDE.md"
echo "=========================================="
