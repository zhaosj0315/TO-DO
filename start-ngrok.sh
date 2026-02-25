#!/bin/bash

# Ollama Ngrok隧道启动脚本

echo "🚀 启动Ollama Ngrok隧道"
echo "================================"

# 检查ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ 未找到ngrok，请先安装: brew install ngrok"
    exit 1
fi

# 检查Ollama是否运行
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama未运行，正在启动..."
    ollama serve &
    sleep 3
fi

echo "✅ Ollama运行中"
echo ""
echo "🔌 启动Ngrok隧道 (端口11434)..."
echo ""

# 后台启动ngrok
ngrok http 11434 > /dev/null &
NGROK_PID=$!

# 等待ngrok启动（增加等待时间）
echo "⏳ 等待ngrok启动..."
sleep 5

# 尝试多次获取公网地址
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else '')" 2>/dev/null)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    echo "   尝试 $i/10..."
    sleep 1
done

if [ -z "$NGROK_URL" ]; then
    echo ""
    echo "❌ 自动获取地址失败，请手动查看："
    echo "   打开浏览器访问: http://127.0.0.1:4040"
    echo ""
    echo "🤖 可用模型列表："
    ollama list | tail -n +2 | awk '{print "   • " $1}'
    echo ""
    echo "🛑 停止服务: Ctrl+C"
    echo ""
    trap "kill $NGROK_PID 2>/dev/null; echo ''; echo '👋 服务已停止'; exit" INT TERM
    wait $NGROK_PID
    exit 0
fi

# 显示完整配置地址
echo ""
echo "✅ Ngrok隧道已启动！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 复制以下地址到TO-DO应用："
echo ""
echo "   ${NGROK_URL}/api/generate"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 配置步骤："
echo "   1. 类型：自定义"
echo "   2. 地址：${NGROK_URL}/api/generate"
echo "   3. 模型：从下方选择一个复制"
echo ""
echo "🤖 可用模型列表："
ollama list | tail -n +2 | awk '{print "   • " $1}'
echo ""
echo "🌐 Web管理界面: http://127.0.0.1:4040"
echo "🛑 停止服务: Ctrl+C"
echo ""

# 保持运行
trap "kill $NGROK_PID 2>/dev/null; echo ''; echo '👋 服务已停止'; exit" INT TERM
wait $NGROK_PID
