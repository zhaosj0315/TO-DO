#!/bin/bash

# TO-DO App v0.7.8 清理脚本
# 根据审计报告执行清理操作

set -e

echo "=========================================="
echo "TO-DO App v0.7.8 清理脚本"
echo "=========================================="
echo ""

# 记录删除的文件
CLEANUP_LOG="CLEANUP_EXECUTION_LOG_$(date +%Y%m%d_%H%M%S).md"

cat > "$CLEANUP_LOG" << 'EOF'
# TO-DO App v0.7.8 清理执行日志

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**执行原则**: 非必要不推送，只删除过时和临时文件

---

## 🗑️ 删除清单

### 优先级1：过时构建产物

EOF

echo "📋 开始清理..."
echo ""

# ============================================
# 优先级1：删除过时构建产物
# ============================================

echo "🔴 优先级1：删除过时构建产物"
echo ""

# 1. 删除根目录v1.6.x安装包
echo "  [1/3] 删除根目录v1.6.x安装包..."
FILES_TO_DELETE=(
  "TODO-App-1.6.11-mac-arm64.zip"
  "TODO-App-1.6.11-mac-x64.zip"
  "TODO-App-1.6.0-mac-arm64.dmg"
  "TODO-App-1.6.0-mac-x64.dmg"
  "TODO-App-1.6.0-iOS-Simulator.zip"
)

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    echo "    ✓ 删除: $file ($SIZE)"
    echo "- ✅ $file ($SIZE)" >> "$CLEANUP_LOG"
    rm -f "$file"
  fi
done

# 2. 删除App.app目录
if [ -d "App.app" ]; then
  SIZE=$(du -sh "App.app" | cut -f1)
  echo "    ✓ 删除: App.app/ ($SIZE)"
  echo "- ✅ App.app/ ($SIZE)" >> "$CLEANUP_LOG"
  rm -rf "App.app"
fi

# 3. 删除release/目录v1.7.8构建产物
echo "  [2/3] 删除release/目录v1.7.8构建产物..."
RELEASE_FILES=(
  "release/TODO App-1.7.8-mac.zip"
  "release/TODO App-1.7.8-mac.zip.blockmap"
  "release/TODO App-1.7.8-arm64-mac.zip"
  "release/TODO App-1.7.8-arm64-mac.zip.blockmap"
)

for file in "${RELEASE_FILES[@]}"; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    echo "    ✓ 删除: $file ($SIZE)"
    echo "- ✅ $file ($SIZE)" >> "$CLEANUP_LOG"
    rm -f "$file"
  fi
done

echo ""

# ============================================
# 优先级2：归档过程性报告
# ============================================

echo "🟡 优先级2：归档过程性报告"
echo ""

# 创建归档目录
mkdir -p docs/audits

echo "  [3/3] 移动过程性报告到docs/audits/..."
REPORTS=(
  "DOC_MAINTENANCE_FINAL_REPORT_V0.7.8.md"
  "FINAL_CLEANUP_REPORT.md"
  "PROCESS_MATERIALS_CLEANUP_REPORT.md"
  "VERSION_ADJUSTMENT_REPORT.md"
)

cat >> "$CLEANUP_LOG" << 'EOF'

### 优先级2：归档过程性报告

EOF

for report in "${REPORTS[@]}"; do
  if [ -f "$report" ]; then
    echo "    ✓ 移动: $report → docs/audits/"
    echo "- ✅ $report → docs/audits/" >> "$CLEANUP_LOG"
    mv "$report" "docs/audits/"
  fi
done

echo ""

# ============================================
# 优先级3：删除测试脚本和临时文件
# ============================================

echo "🟡 优先级3：删除测试脚本和临时文件"
echo ""

cat >> "$CLEANUP_LOG" << 'EOF'

### 优先级3：测试脚本和临时文件

EOF

# 删除测试脚本
echo "  [4/5] 删除测试脚本..."
TEST_SCRIPTS=(
  "scripts/test-ai-prompt-config.js"
  "scripts/test-parent-child.js"
  "scripts/quick-fix.js"
  "scripts/batch-fix-parent-child.js"
  "scripts/fix-parent-child-relationship.js"
)

for script in "${TEST_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "    ✓ 删除: $script"
    echo "- ✅ $script" >> "$CLEANUP_LOG"
    rm -f "$script"
  fi
done

# 删除临时测试文件
echo "  [5/5] 删除临时测试文件..."
TEMP_FILES=(
  "AI_CHAT_TEST.html"
  "ollama-proxy.py"
  "release/test.txt"
)

for file in "${TEMP_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "    ✓ 删除: $file"
    echo "- ✅ $file" >> "$CLEANUP_LOG"
    rm -f "$file"
  fi
done

echo ""

# ============================================
# 优先级4：清理系统临时文件
# ============================================

echo "🟢 优先级4：清理系统临时文件"
echo ""

cat >> "$CLEANUP_LOG" << 'EOF'

### 优先级4：系统临时文件

EOF

# 删除.DS_Store
echo "  [6/6] 删除.DS_Store文件..."
find . -name ".DS_Store" -type f | while read file; do
  echo "    ✓ 删除: $file"
  echo "- ✅ $file" >> "$CLEANUP_LOG"
  rm -f "$file"
done

# 更新.gitignore
if ! grep -q "^\.DS_Store$" .gitignore 2>/dev/null; then
  echo "" >> .gitignore
  echo "# macOS system files" >> .gitignore
  echo ".DS_Store" >> .gitignore
  echo "    ✓ 更新: .gitignore (添加.DS_Store)"
  echo "- ✅ .gitignore (添加.DS_Store)" >> "$CLEANUP_LOG"
fi

echo ""

# ============================================
# 完成统计
# ============================================

cat >> "$CLEANUP_LOG" << 'EOF'

---

## 📊 清理统计

EOF

# 计算释放的空间
FREED_SPACE=$(du -sh release/ 2>/dev/null | cut -f1 || echo "N/A")

cat >> "$CLEANUP_LOG" << EOF

- **删除文件数**: $(grep -c "^- ✅" "$CLEANUP_LOG" || echo "0")
- **释放空间**: ~1GB (估算)
- **保留构建产物**: v0.7.8 (4个文件)

---

## ✅ 清理完成

所有过时文件已清理，项目结构更加清晰。

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo "=========================================="
echo "✅ 清理完成！"
echo "=========================================="
echo ""
echo "📄 详细日志: $CLEANUP_LOG"
echo ""
echo "📊 清理统计:"
echo "  - 删除文件数: $(grep -c "^- ✅" "$CLEANUP_LOG" || echo "0")"
echo "  - 释放空间: ~1GB (估算)"
echo ""
echo "🎯 下一步:"
echo "  1. 查看清理日志: cat $CLEANUP_LOG"
echo "  2. 查看审计报告: cat AUDIT_REPORT_v0.7.8.md"
echo "  3. 提交清理结果: git add . && git commit -m 'chore: 清理过时构建产物和临时文件'"
echo ""
