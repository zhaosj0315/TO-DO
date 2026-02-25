#!/bin/bash

# Ollama公网代理启动脚本

echo "🚀 启动Ollama公网代理服务"
echo "================================"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3"
    exit 1
fi

# 安装依赖
echo "📦 检查依赖..."
pip3 install flask flask-cors requests -q

# 启动代理服务
echo "🌐 启动代理服务 (端口8899)..."
python3 ollama-proxy.py &
PROXY_PID=$!

# 等待服务启动
sleep 2

# 启动公网隧道
echo "🔌 启动公网隧道..."
ssh -R 80:localhost:8899 serveo.net &
TUNNEL_PID=$!

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "📍 本地访问: http://localhost:8899"
echo "🌐 公网访问: https://xxx.serveo.net (查看上方输出)"
echo ""
echo "💡 使用方法:"
echo "   1. 复制公网域名"
echo "   2. 在TO-DO应用中选择'盘古大模型'"
echo "   3. 填入: https://xxx.serveo.net/api/generate"
echo ""
echo "🛑 停止服务: Ctrl+C"

# 等待中断
trap "kill $PROXY_PID $TUNNEL_PID 2>/dev/null; echo ''; echo '👋 服务已停止'; exit" INT TERM

wait
