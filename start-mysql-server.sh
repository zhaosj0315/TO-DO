#!/bin/bash

echo "🚀 启动MySQL同步服务..."

# 检查是否已安装依赖
if [ ! -d "node_modules/express" ]; then
  echo "📦 安装依赖..."
  npm install express mysql2 cors
fi

# 启动服务
echo "✅ 启动服务在 http://localhost:3000"
node mysql-server.js
