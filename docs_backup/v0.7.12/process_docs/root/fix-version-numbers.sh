#!/bin/bash

# TO-DO App 版本号统一脚本
# 将CHANGELOG.md中的v1.x.x版本号统一改为v0.x.x

set -e

echo "=========================================="
echo "TO-DO App 版本号统一脚本"
echo "=========================================="
echo ""

CHANGELOG="CHANGELOG.md"
BACKUP="CHANGELOG.md.backup_$(date +%Y%m%d_%H%M%S)"

# 备份原文件
echo "📋 备份原文件..."
cp "$CHANGELOG" "$BACKUP"
echo "  ✓ 备份至: $BACKUP"
echo ""

# 执行替换
echo "🔄 执行版本号替换..."
echo ""

# v1.7.x → v0.7.x
sed -i '' 's/\[1\.7\.\([0-9]\+\)\]/[0.7.\1]/g' "$CHANGELOG"
sed -i '' 's/v1\.7\.\([0-9]\+\)/v0.7.\1/g' "$CHANGELOG"

# v1.6.x → v0.6.x
sed -i '' 's/\[1\.6\.\([0-9]\+\)\]/[0.6.\1]/g' "$CHANGELOG"
sed -i '' 's/v1\.6\.\([0-9]\+\)/v0.6.\1/g' "$CHANGELOG"

echo "  ✓ v1.7.x → v0.7.x"
echo "  ✓ v1.6.x → v0.6.x"
echo ""

# 显示差异
echo "📊 版本号替换统计:"
echo "  - v0.7.x: $(grep -o 'v0\.7\.[0-9]\+' "$CHANGELOG" | wc -l | tr -d ' ') 处"
echo "  - v0.6.x: $(grep -o 'v0\.6\.[0-9]\+' "$CHANGELOG" | wc -l | tr -d ' ') 处"
echo ""

# 检查是否还有v1.x.x残留
REMAINING=$(grep -c '\[1\.[67]\.' "$CHANGELOG" || echo "0")
if [ "$REMAINING" -gt 0 ]; then
  echo "⚠️  警告: 仍有 $REMAINING 处v1.x.x版本号未替换"
  grep -n '\[1\.[67]\.' "$CHANGELOG" | head -5
else
  echo "✅ 所有版本号已统一为v0.x.x体系"
fi

echo ""
echo "=========================================="
echo "✅ 版本号统一完成！"
echo "=========================================="
echo ""
echo "📄 备份文件: $BACKUP"
echo "📄 修改文件: $CHANGELOG"
echo ""
echo "🎯 下一步:"
echo "  1. 查看差异: diff $BACKUP $CHANGELOG | head -50"
echo "  2. 确认无误后提交: git add CHANGELOG.md && git commit -m 'docs: 统一版本号体系为v0.x.x'"
echo "  3. 如需回滚: mv $BACKUP $CHANGELOG"
echo ""
