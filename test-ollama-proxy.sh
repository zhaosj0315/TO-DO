#!/bin/bash

# 测试Ollama代理服务

echo "🧪 测试Ollama代理服务"
echo "====================="

# 测试本地Ollama
echo ""
echo "1️⃣ 测试本地Ollama..."
if curl -s http://192.168.31.159:11434/api/tags > /dev/null; then
    echo "✅ 本地Ollama运行正常"
else
    echo "❌ 本地Ollama无法访问"
    exit 1
fi

# 测试代理服务
echo ""
echo "2️⃣ 测试代理服务..."
if curl -s http://localhost:8899/health > /dev/null; then
    echo "✅ 代理服务运行正常"
    curl -s http://localhost:8899/health | python3 -m json.tool
else
    echo "❌ 代理服务未启动"
    echo "💡 运行: ./start-ollama-proxy.sh"
    exit 1
fi

# 测试API调用
echo ""
echo "3️⃣ 测试API调用..."
RESPONSE=$(curl -s -X POST http://localhost:8899/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma2:2b","prompt":"Say hello in 5 words","stream":false}')

if echo "$RESPONSE" | grep -q "response"; then
    echo "✅ API调用成功"
    echo "$RESPONSE" | python3 -m json.tool | head -20
else
    echo "❌ API调用失败"
    echo "$RESPONSE"
fi

echo ""
echo "✅ 所有测试通过！"
echo ""
echo "💡 下一步："
echo "   1. 启动公网隧道: ssh -R 80:localhost:8899 serveo.net"
echo "   2. 复制公网域名"
echo "   3. 在TO-DO应用中配置"
