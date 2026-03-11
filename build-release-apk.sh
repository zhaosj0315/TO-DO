#!/bin/bash

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

echo "=========================================="
echo "  TODO App - 生成签名 Release APK v${VERSION}"
echo "=========================================="
echo ""

echo "📦 正在构建 Release APK..."
echo ""

cd android

# 构建 Release APK
./gradlew assembleRelease

if [ $? -ne 0 ]; then
  echo "❌ 构建失败！"
  exit 1
fi

cd ..

# 复制到项目根目录
if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
  cp android/app/build/outputs/apk/release/app-release.apk "./TODO-App-v${VERSION}-Release.apk"
  echo ""
  echo "=========================================="
  echo "✅ Release APK 构建成功！"
  echo ""
  echo "📁 文件位置："
  echo "   - android/app/build/outputs/apk/release/app-release.apk"
  echo "   - TODO-App-v${VERSION}-Release.apk (已复制到项目根目录)"
  echo ""
  ls -lh "TODO-App-v${VERSION}-Release.apk"
  echo ""
  echo "📝 此 APK 可用于："
  echo "   ✓ 上传到应用商店"
  echo "   ✓ 分发给用户安装"
  echo "   ✓ 正式发布"
  echo "=========================================="
else
  echo "❌ 未找到生成的 APK 文件"
  exit 1
fi
