#!/bin/bash

# 一键打包所有平台脚本
# 支持: Windows, macOS (x64 + arm64), Android APK

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

echo "=========================================="
echo "  TODO App - 全平台一键打包 v${VERSION}"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 记录开始时间
START_TIME=$(date +%s)

# 询问用户要打包哪些平台
echo "请选择要打包的平台（多选用空格分隔，直接回车打包全部）:"
echo "  1) Windows"
echo "  2) macOS"
echo "  3) Android APK"
echo ""
read -p "输入选项 (1 2 3) 或直接回车打包全部: " PLATFORMS

# 如果用户直接回车，打包全部
if [ -z "$PLATFORMS" ]; then
    BUILD_WINDOWS=true
    BUILD_MAC=true
    BUILD_APK=true
else
    BUILD_WINDOWS=false
    BUILD_MAC=false
    BUILD_APK=false
    
    for platform in $PLATFORMS; do
        case $platform in
            1) BUILD_WINDOWS=true ;;
            2) BUILD_MAC=true ;;
            3) BUILD_APK=true ;;
        esac
    done
fi

echo ""
echo -e "${BLUE}📋 打包计划:${NC}"
[ "$BUILD_WINDOWS" = true ] && echo "  ✓ Windows"
[ "$BUILD_MAC" = true ] && echo "  ✓ macOS (x64 + arm64)"
[ "$BUILD_APK" = true ] && echo "  ✓ Android APK"

echo ""
echo "=========================================="
echo -e "${GREEN}🚀 开始打包...${NC}"
echo "=========================================="
echo ""

# 创建统一的 release 目录（如果不存在）
RELEASE_DIR="release"
mkdir -p "$RELEASE_DIR"

# 清理旧的安装包（保留目录结构）
echo -e "${BLUE}🧹 清理旧的安装包...${NC}"
rm -f "$RELEASE_DIR/TODO-App-v"*".apk"
rm -f "$RELEASE_DIR/TODO-App-v"*"-mac"*.zip
rm -f "$RELEASE_DIR/"*.exe "$RELEASE_DIR/"*.exe.blockmap
rm -f "$RELEASE_DIR/"*.yml "$RELEASE_DIR/"*.yaml
rm -rf "$RELEASE_DIR/mac" "$RELEASE_DIR/mac-arm64" "$RELEASE_DIR/win-unpacked"
echo -e "${GREEN}✅ 清理完成${NC}"
echo ""

# 计数器
SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0

# 1. 打包 Android APK
if [ "$BUILD_APK" = true ]; then
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    echo ""
    echo -e "${BLUE}[1/3] 📱 打包 Android APK...${NC}"
    echo "=========================================="
    
    if sh build-apk.sh; then
        # 移动 APK 到 release 目录
        if [ -f "TODO-App-v${VERSION}.apk" ]; then
            mv "TODO-App-v${VERSION}.apk" "$RELEASE_DIR/"
            echo -e "${GREEN}✅ Android APK 打包成功 → release/TODO-App-v${VERSION}.apk${NC}"
        fi
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}❌ Android APK 打包失败${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

# 2. 打包 macOS
if [ "$BUILD_MAC" = true ]; then
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    echo ""
    echo -e "${BLUE}[2/3] 🍎 打包 macOS (x64 + arm64)...${NC}"
    echo "=========================================="
    
    if sh build-mac.sh; then
        # 移动 macOS ZIP 到 release 目录
        if [ -f "TODO-App-v${VERSION}-mac-x64.zip" ]; then
            mv "TODO-App-v${VERSION}-mac-x64.zip" "$RELEASE_DIR/"
        fi
        if [ -f "TODO-App-v${VERSION}-mac-arm64.zip" ]; then
            mv "TODO-App-v${VERSION}-mac-arm64.zip" "$RELEASE_DIR/"
        fi
        echo -e "${GREEN}✅ macOS 打包成功 → release/TODO-App-v${VERSION}-mac-*.zip${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}❌ macOS 打包失败${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

# 3. 打包 Windows
if [ "$BUILD_WINDOWS" = true ]; then
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    echo ""
    echo -e "${BLUE}[3/3] 🪟 打包 Windows...${NC}"
    echo "=========================================="
    
    if sh build-windows.sh; then
        echo -e "${GREEN}✅ Windows 打包成功 → release/TODO App Setup 0.7.8.exe${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}❌ Windows 打包失败${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

# 计算耗时
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# 打印总结
echo ""
echo "=========================================="
echo -e "${GREEN}📊 打包完成总结${NC}"
echo "=========================================="
echo ""
echo -e "✅ 成功: ${GREEN}${SUCCESS_COUNT}${NC} / ${TOTAL_COUNT}"
[ $FAIL_COUNT -gt 0 ] && echo -e "❌ 失败: ${RED}${FAIL_COUNT}${NC} / ${TOTAL_COUNT}"
echo -e "⏱️  总耗时: ${MINUTES}分${SECONDS}秒"
echo ""

# 列出生成的文件
echo "=========================================="
echo -e "${BLUE}📦 生成的安装包 (release/ 目录):${NC}"
echo "=========================================="
echo ""

if [ "$BUILD_APK" = true ] && [ -f "$RELEASE_DIR/TODO-App-v${VERSION}.apk" ]; then
    APK_SIZE=$(ls -lh "$RELEASE_DIR/TODO-App-v${VERSION}.apk" | awk '{print $5}')
    echo -e "📱 Android:  ${GREEN}TODO-App-v${VERSION}.apk${NC} (${APK_SIZE})"
fi

if [ "$BUILD_MAC" = true ]; then
    if [ -f "$RELEASE_DIR/TODO-App-v${VERSION}-mac-x64.zip" ]; then
        MAC_X64_SIZE=$(ls -lh "$RELEASE_DIR/TODO-App-v${VERSION}-mac-x64.zip" | awk '{print $5}')
        echo -e "🍎 macOS x64:  ${GREEN}TODO-App-v${VERSION}-mac-x64.zip${NC} (${MAC_X64_SIZE})"
    fi
    if [ -f "$RELEASE_DIR/TODO-App-v${VERSION}-mac-arm64.zip" ]; then
        MAC_ARM_SIZE=$(ls -lh "$RELEASE_DIR/TODO-App-v${VERSION}-mac-arm64.zip" | awk '{print $5}')
        echo -e "🍎 macOS arm64:  ${GREEN}TODO-App-v${VERSION}-mac-arm64.zip${NC} (${MAC_ARM_SIZE})"
    fi
fi

if [ "$BUILD_WINDOWS" = true ] && [ -f "$RELEASE_DIR/TODO App Setup 0.7.8.exe" ]; then
    WIN_SIZE=$(ls -lh "$RELEASE_DIR/TODO App Setup 0.7.8.exe" | awk '{print $5}')
    echo -e "🪟 Windows:  ${GREEN}TODO App Setup 0.7.8.exe${NC} (${WIN_SIZE})"
fi

echo ""
echo "=========================================="
echo -e "${YELLOW}💡 提示:${NC}"
echo "=========================================="
echo "  • 所有安装包已统一放在 release/ 目录"
echo "  • 可以直接上传到 GitHub Release 分发"
echo ""

# 询问是否打开文件夹
read -p "是否打开 release/ 文件夹? (y/n): " OPEN_FOLDER
if [ "$OPEN_FOLDER" = "y" ] || [ "$OPEN_FOLDER" = "Y" ]; then
    open "$RELEASE_DIR"
fi

echo ""
echo -e "${GREEN}🎉 全部完成！${NC}"
echo ""
