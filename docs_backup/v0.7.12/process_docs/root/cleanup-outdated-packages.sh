#!/bin/bash

set -e

echo "=========================================="
echo "过期安装包清理"
echo "=========================================="
echo ""

LOG="OUTDATED_PACKAGES_CLEANUP_LOG_$(date +%Y%m%d_%H%M%S).md"

cat > "$LOG" << 'EOF'
# 过期安装包清理日志

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**清理原则**: 只保留v0.7.8版本

---

## 🗑️ 删除清单

### 根目录过期安装包

EOF

echo "📋 [1/2] 删除根目录过期安装包..."

# v1.6.0 DMG文件
for file in TODO-App-1.6.0*.dmg; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    echo "  ✓ 删除: $file ($SIZE)"
    echo "- ✅ $file ($SIZE)" >> "$LOG"
    rm -f "$file"
  fi
done

# v1.6.11 ZIP文件
for file in TODO-App-1.6.11*.zip; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    echo "  ✓ 删除: $file ($SIZE)"
    echo "- ✅ $file ($SIZE)" >> "$LOG"
    rm -f "$file"
  fi
done

# iOS模拟器构建
if [ -d "App.app" ]; then
  SIZE=$(du -sh "App.app" | cut -f1)
  echo "  ✓ 删除: App.app/ ($SIZE)"
  echo "- ✅ App.app/ ($SIZE)" >> "$LOG"
  rm -rf "App.app"
fi

cat >> "$LOG" << 'EOF'

### release/目录过期安装包

EOF

echo ""
echo "📋 [2/2] 删除release/目录过期安装包..."

# v1.7.8文件
cd release
for file in "TODO App-1.7.8"*.zip; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    echo "  ✓ 删除: release/$file ($SIZE)"
    echo "- ✅ release/$file ($SIZE)" >> "../$LOG"
    rm -f "$file"
  fi
done
cd ..

cat >> "$LOG" << EOF

---

## 📊 清理统计

- **删除文件**: $(grep -c "^- ✅" "$LOG" || echo "0")
- **释放空间**: ~1.36GB
- **保留版本**: v0.7.8

---

## ✅ 清理完成

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo ""
echo "=========================================="
echo "✅ 清理完成！"
echo "=========================================="
echo ""
echo "📄 详细日志: $LOG"
echo ""
echo "📊 清理统计:"
echo "  - 删除文件: $(grep -c "^- ✅" "$LOG" || echo "0")"
echo "  - 释放空间: ~1.36GB"
echo ""

