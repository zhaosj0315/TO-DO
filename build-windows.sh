#!/bin/bash

echo "=========================================="
echo "  TODO App - Windows EXE 一键打包脚本"
echo "=========================================="
echo ""

# 1. 构建前端
echo "📦 步骤 1/2: 构建前端代码..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ 前端构建失败！"
  exit 1
fi

echo "✅ 前端构建完成"
echo ""

# 2. 打包 Windows EXE
echo "🔨 步骤 2/2: 打包 Windows 安装程序..."
npm run electron:build-win

if [ $? -ne 0 ]; then
  echo "❌ Windows 打包失败！"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ Windows 安装程序打包完成！"
echo "📁 输出目录: release/"
echo "=========================================="
echo ""

# 显示生成的文件
if [ -d "release" ]; then
  echo "生成的文件："
  ls -lh release/*.exe 2>/dev/null || echo "未找到 .exe 文件"
fi
