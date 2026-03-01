#!/bin/bash

# TO-DO App v0.7.8 材料清理执行脚本
# 基于综合审计报告执行清理

set -e

echo "=========================================="
echo "TO-DO App v0.7.8 材料清理"
echo "=========================================="
echo ""

LOG="MATERIALS_CLEANUP_LOG_$(date +%Y%m%d_%H%M%S).md"

cat > "$LOG" << 'EOF'
# TO-DO App v0.7.8 材料清理日志

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**执行原则**: 安全清理，过程性材料归档

---

## 🗑️ 删除清单

### 1. 备份文件

EOF

echo "📋 [1/4] 删除备份文件..."
FILES=(
  "CHANGELOG.md.backup_20260302_004924"
  "CHANGELOG.md.backup_manual"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    echo "  ✓ 删除: $file ($SIZE)"
    echo "- ✅ $file ($SIZE)" >> "$LOG"
    rm -f "$file"
  fi
done

cat >> "$LOG" << 'EOF'

### 2. 测试脚本

EOF

echo ""
echo "📋 [2/4] 删除测试脚本..."
SCRIPTS=(
  "scripts/test-ai-prompt-config.js"
  "scripts/test-parent-child.js"
  "scripts/quick-fix.js"
  "scripts/batch-fix-parent-child.js"
  "scripts/fix-parent-child-relationship.js"
)

for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "  ✓ 删除: $script"
    echo "- ✅ $script" >> "$LOG"
    rm -f "$script"
  fi
done

cat >> "$LOG" << 'EOF'

### 3. 临时文件

EOF

echo ""
echo "📋 [3/4] 删除临时文件..."
TEMP=(
  "AI_CHAT_TEST.html"
  "ollama-proxy.py"
  "release/test.txt"
)

for file in "${TEMP[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ 删除: $file"
    echo "- ✅ $file" >> "$LOG"
    rm -f "$file"
  fi
done

cat >> "$LOG" << 'EOF'

### 4. 系统临时文件

EOF

echo ""
echo "📋 [4/4] 删除系统临时文件..."
find . -name ".DS_Store" -type f | while read file; do
  echo "  ✓ 删除: $file"
  echo "- ✅ $file" >> "$LOG"
  rm -f "$file"
done

# 更新.gitignore
if ! grep -q "^\.DS_Store$" .gitignore 2>/dev/null; then
  echo "" >> .gitignore
  echo "# macOS system files" >> .gitignore
  echo ".DS_Store" >> .gitignore
  echo "  ✓ 更新: .gitignore"
  echo "- ✅ .gitignore (添加.DS_Store)" >> "$LOG"
fi

cat >> "$LOG" << 'EOF'

---

## 📁 归档清单

### 过程性报告

EOF

echo ""
echo "📁 归档过程性报告..."
mkdir -p docs/audits

REPORTS=(
  "DOC_MAINTENANCE_FINAL_REPORT_V0.7.8.md"
  "FINAL_CLEANUP_REPORT.md"
  "PROCESS_MATERIALS_CLEANUP_REPORT.md"
  "VERSION_ADJUSTMENT_REPORT.md"
)

for report in "${REPORTS[@]}"; do
  if [ -f "$report" ]; then
    echo "  ✓ 移动: $report → docs/audits/"
    echo "- ✅ $report → docs/audits/" >> "$LOG"
    mv "$report" "docs/audits/"
  fi
done

cat >> "$LOG" << EOF

---

## 📊 清理统计

- **删除文件**: $(grep -c "^- ✅.*删除:" "$LOG" || echo "0")
- **归档文件**: $(grep -c "→ docs/audits/" "$LOG" || echo "0")
- **更新文件**: 1 (.gitignore)

---

## ✅ 清理完成

所有过程性材料已清理或归档。

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo ""
echo "=========================================="
echo "✅ 清理完成！"
echo "=========================================="
echo ""
echo "📄 详细日志: $LOG"
echo ""

