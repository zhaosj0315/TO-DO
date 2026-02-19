#!/bin/bash

# TO-DO App APK 自动打包脚本
# 使用方法: ./build-apk.sh

set -e

echo "🚀 开始打包 TO-DO App..."

# 1. 构建前端
echo "📦 构建前端..."
npm run build

# 2. 同步到 Android
echo "🔄 同步到 Android..."
npx cap sync android

# 3. 修复 Java 版本配置（如果需要）
if grep -q "VERSION_21" android/app/capacitor.build.gradle; then
  echo "🔧 修复 Java 版本配置..."
  sed -i '' 's/VERSION_21/VERSION_17/g' android/app/capacitor.build.gradle
  sed -i '' 's/VERSION_21/VERSION_17/g' android/capacitor-cordova-android-plugins/build.gradle
fi

# 4. 构建 APK
echo "🔨 构建 APK..."
cd android
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
./gradlew assembleDebug

# 5. 复制到项目根目录
echo "📋 复制 APK..."
cp app/build/outputs/apk/debug/app-debug.apk ../TODO-App.apk

# 6. 显示结果
cd ..
echo ""
echo "✅ 打包完成！"
echo "📱 APK 位置: $(pwd)/TODO-App.apk"
ls -lh TODO-App.apk
