#!/bin/bash
# 优化的 Ollama 启动脚本

echo "🛑 停止现有 Ollama 进程..."
pkill -f "ollama serve"
sleep 1

echo "🚀 启动 Ollama（优化配置）..."

# 环境变量配置
export OLLAMA_HOST=0.0.0.0:11434          # 监听所有网络接口（局域网可访问）
export OLLAMA_MAX_LOADED_MODELS=5         # 最多同时加载5个模型
export OLLAMA_NUM_PARALLEL=10             # 并行请求数
export OLLAMA_NUM_THREAD=20               # 线程数
export OLLAMA_ORIGINS="*"                 # 允许所有来源（解决CORS）

# 启动服务
nohup /usr/local/bin/ollama serve > ~/ollama.log 2>&1 &

sleep 2

# 验证启动
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama 启动成功！"
    echo "📍 本地访问: http://localhost:11434"
    echo "📍 局域网访问: http://192.168.31.159:11434"
    echo "📋 日志文件: ~/ollama.log"
    echo ""
    echo "可用模型:"
    curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -10
else
    echo "❌ Ollama 启动失败，请查看日志: ~/ollama.log"
fi
