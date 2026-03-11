#!/bin/bash

# TO-DO App APK 一键打包脚本
# 使用方法: ./build-apk.sh

set -e

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

echo "=========================================="
echo "  TO-DO App APK 一键打包 v${VERSION}"
echo "=========================================="

# 1. 构建Vue项目
echo ""
echo "📦 [1/5] 构建Vue项目..."
npm run build

# 2. 同步到Android
echo ""
echo "🔄 [2/5] 同步到Android项目..."
npx cap sync android

# 3. 修复Java版本配置（确保全局使用Java 17）
echo ""
echo "🔧 [3/5] 修复Java版本配置..."
# 修复 Capacitor 自动生成的配置文件
if [ -f "android/app/capacitor.build.gradle" ]; then
    sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' android/app/capacitor.build.gradle
fi
if [ -f "android/capacitor-cordova-android-plugins/build.gradle" ]; then
    sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' android/capacitor-cordova-android-plugins/build.gradle
fi
# 修复 Capacitor 插件的 Java 版本
if [ -f "node_modules/@capacitor/local-notifications/android/build.gradle" ]; then
    sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' node_modules/@capacitor/local-notifications/android/build.gradle
fi
if [ -f "node_modules/@capacitor/filesystem/android/build.gradle" ]; then
    sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' node_modules/@capacitor/filesystem/android/build.gradle
fi
if [ -f "node_modules/@capacitor/preferences/android/build.gradle" ]; then
    sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' node_modules/@capacitor/preferences/android/build.gradle
fi

# 4. 构建APK
echo ""
echo "🏗️  [4/5] 构建APK..."
cd android
./gradlew clean assembleDebug
cd ..

# 5. 复制APK到项目根目录
echo ""
echo "📋 [5/5] 复制APK到项目根目录..."
cp android/app/build/outputs/apk/debug/app-debug.apk "TODO-App-v${VERSION}.apk"

# 完成
echo ""
echo "=========================================="
echo "✅ 打包完成！"
echo "📦 APK位置: $(pwd)/TODO-App-v${VERSION}.apk"
echo "📊 文件大小: $(ls -lh "TODO-App-v${VERSION}.apk" | awk '{print $5}')"
echo "=========================================="
