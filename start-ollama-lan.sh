#!/bin/bash
# 启动 Ollama 并监听局域网所有设备

echo "🚀 启动 Ollama（局域网模式）"
echo "📍 局域网地址: http://192.168.31.159:11434"
echo ""

# 设置监听所有网络接口
export OLLAMA_HOST=0.0.0.0:11434

# 启动 Ollama
ollama serve
