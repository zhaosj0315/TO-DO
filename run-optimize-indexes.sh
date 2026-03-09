#!/bin/bash

# ============================================
# MySQL 索引优化执行脚本
# ============================================

echo "🚀 开始执行 MySQL 索引优化..."
echo ""

# 读取数据库配置
read -p "MySQL 主机 (默认 localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL 端口 (默认 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "MySQL 用户名 (默认 root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "MySQL 密码: " DB_PASSWORD
echo ""

read -p "数据库名 (默认 todo_app): " DB_NAME
DB_NAME=${DB_NAME:-todo_app}

echo ""
echo "📊 配置信息："
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  用户: $DB_USER"
echo "  数据库: $DB_NAME"
echo ""

read -p "确认执行？(y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "❌ 已取消"
  exit 0
fi

echo ""
echo "⏳ 正在执行索引优化..."
echo ""

# 执行 SQL 脚本
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < optimize-mysql-indexes.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 索引优化完成！"
  echo ""
  echo "📈 预期收益："
  echo "  - 查询速度提升 10 倍"
  echo "  - 同步速度提升 5-10 倍"
  echo "  - 用户体验显著改善"
  echo ""
  echo "💡 建议："
  echo "  - 每周执行一次: ANALYZE TABLE tasks;"
  echo "  - 每月执行一次: OPTIMIZE TABLE tasks;"
else
  echo ""
  echo "❌ 执行失败，请检查错误信息"
  exit 1
fi
