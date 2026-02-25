#!/bin/bash

# AI问答功能快速测试脚本

echo "🤖 AI问答功能测试"
echo "=================="
echo ""

# 检查文件
echo "📁 检查文件..."
if [ -f "src/components/AIChat.vue" ]; then
    echo "✅ AIChat.vue 存在"
else
    echo "❌ AIChat.vue 不存在"
    exit 1
fi

if grep -q "showAIChat" src/views/TodoView.vue; then
    echo "✅ TodoView.vue 已集成"
else
    echo "❌ TodoView.vue 未集成"
    exit 1
fi

echo ""
echo "📚 文档文件："
ls -lh AI_CHAT_*.md AI_CHAT_*.html 2>/dev/null || echo "⚠️  部分文档文件不存在"

echo ""
echo "🚀 启动开发服务器..."
echo "运行命令: npm run dev"
echo ""
echo "📝 测试步骤："
echo "1. 打开浏览器访问 http://localhost:5173"
echo "2. 登录应用"
echo "3. 点击右上角 🤖 按钮"
echo "4. 选择模型并配置API"
echo "5. 测试快捷问题或输入自定义问题"
echo ""
echo "🔧 盘古API配置示例："
echo "   http://localhost:8000/api/chat"
echo ""
echo "📖 详细文档："
echo "   - AI_CHAT_GUIDE.md - 使用指南"
echo "   - AI_CHAT_TEST.html - 测试页面"
echo "   - AI_CHAT_IMPLEMENTATION.md - 实现说明"
echo ""

# 询问是否启动
read -p "是否启动开发服务器？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev
fi
