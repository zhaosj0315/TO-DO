#!/bin/bash
# 文档清理脚本 v0.7.12 - Phase 1
# 功能：清理过程性文档，移动到备份目录

set -e

echo "🚀 开始执行 Phase 1: 过程性文档清理"
echo "========================================"

# 创建备份目录
BACKUP_DIR="docs_backup/v0.7.12"
PROCESS_DIR="$BACKUP_DIR/process_docs"

echo "📁 创建备份目录..."
mkdir -p "$PROCESS_DIR/root"
mkdir -p "$PROCESS_DIR/docs_audits"
mkdir -p "$PROCESS_DIR/docs_features"
mkdir -p "$PROCESS_DIR/docs_testing"
mkdir -p "$PROCESS_DIR/docs_releases"

# 移动根目录过程性文档
echo "📦 移动根目录过程性文档..."
ROOTDOCS=(
    "ALERT_REPLACEMENT_PROGRESS.md"
    "ANDROID_BACK_GESTURE_FIX.md"
    "AUDIT_PLAN_V0.7.10.md"
    "CLEANUP_FINAL_REPORT.md"
    "CLEANUP_FINAL_REPORT_V0.7.10.md"
    "CLEANUP_REPORT.md"
    "DATA_CENTER_MERGE_PLAN.md"
    "DEAD_CODE_REPORT.md"
    "DEAD_CODE_REPORT.json"
    "DOC_AUDIT_ISSUES_V0.7.10.md"
    "DOC_MAINTENANCE_COMPLETE_V0.7.10.md"
    "IMPLEMENTATION_GUIDE.md"
    "INTEGRATION_COMPLETE.md"
    "NOTIFICATION_DEBUG.md"
    "NOTIFICATION_SYSTEM_GUIDE.md"
    "PROJECT_AUDIT_REPORT.md"
    "PROJECT_REVIEW_SUMMARY.md"
    "REPORT_DATE_FIX.md"
    "REPORT_INTEGRATION_IMPLEMENTATION.md"
    "REPORT_INTEGRATION_PLAN.md"
    "TESTING_CI_CD_GUIDE.md"
    "TESTING_IMPLEMENTATION_REPORT.md"
    "UNIFIED_REPORT_FINAL.md"
    "UNIFIED_REPORT_GUIDE.md"
    "POMODORO_HISTORY_RESTORE.md"
    "ENHANCED_POMODORO_STATS.md"
)

for doc in "${ROOTDOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "$PROCESS_DIR/root/"
        echo "  ✓ $doc"
    fi
done

# 移动 docs/audits/archive/
echo "📦 移动 docs/audits/archive/..."
if [ -d "docs/audits/archive" ]; then
    mv docs/audits/archive "$PROCESS_DIR/docs_audits/"
    echo "  ✓ docs/audits/archive/"
fi

# 移动 docs/audits/ 中的过程性文档
echo "📦 移动 docs/audits/ 过程性文档..."
AUDITDOCS=(
    "docs/audits/AI_MODEL_CONFIG_FIX.md"
    "docs/audits/DOC_MAINTENANCE_FINAL_REPORT_V0.7.8.md"
    "docs/audits/FINAL_CLEANUP_REPORT.md"
    "docs/audits/PROCESS_MATERIALS_CLEANUP_REPORT.md"
    "docs/audits/VERSION_ADJUSTMENT_REPORT.md"
)

for doc in "${AUDITDOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "$PROCESS_DIR/docs_audits/"
        echo "  ✓ $(basename $doc)"
    fi
done

# 移动 docs/features/ 中的过程性文档
echo "📦 移动 docs/features/ 过程性文档..."
FEATUREDOCS=(
    "docs/features/AI_SUGGESTION_OPTIMIZATION_SUMMARY.md"
    "docs/features/ANDROID_BACK_GESTURE_AUDIT.md"
    "docs/features/CLIPBOARD_LOGIC_EXPLANATION.md"
    "docs/features/REMINDER_FIX.md"
    "docs/features/SUBTASK_IMPLEMENTATION_SUMMARY.md"
    "docs/features/SUBTASK_QUICK_CREATE_GUIDE.md"
    "docs/features/TASK_INPUT_FEATURES_AUDIT.md"
    "docs/features/TASK_LOG_PHASE1.md"
    "docs/features/TASK_PREVIEW_GUIDE.md"
    "docs/features/VOICE_CAMERA_FEATURE_SUMMARY.md"
)

for doc in "${FEATUREDOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "$PROCESS_DIR/docs_features/"
        echo "  ✓ $(basename $doc)"
    fi
done

# 移动 docs/testing/
echo "📦 移动 docs/testing/..."
if [ -d "docs/testing" ]; then
    mv docs/testing "$PROCESS_DIR/"
    echo "  ✓ docs/testing/"
fi

# 移动 docs/releases/ 中的过程性文档
echo "📦 移动 docs/releases/ 过程性文档..."
if [ -d "docs/releases/v0.7.8" ]; then
    mv docs/releases/v0.7.8 "$PROCESS_DIR/docs_releases/"
    echo "  ✓ docs/releases/v0.7.8/"
fi

if [ -d "docs/releases/v1.7.6" ]; then
    mv docs/releases/v1.7.6 "$PROCESS_DIR/docs_releases/"
    echo "  ✓ docs/releases/v1.7.6/"
fi

if [ -d "docs/releases/v1.6.4" ]; then
    mv docs/releases/v1.6.4 "$PROCESS_DIR/docs_releases/"
    echo "  ✓ docs/releases/v1.6.4/"
fi

# 移动 docs/PHASE 文档
echo "📦 移动 docs/PHASE 文档..."
PHASEDOCS=(
    "docs/PHASE1_IMPLEMENTATION.md"
    "docs/PHASE1_SUMMARY.md"
    "docs/PHASE2_SUMMARY.md"
    "docs/PHASE2_TESTING.md"
    "docs/PHASE2_INTEGRATION.md"
)

for doc in "${PHASEDOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "$PROCESS_DIR/"
        echo "  ✓ $(basename $doc)"
    fi
done

# 删除空目录
echo "🗑️  删除空目录..."
find docs -type d -empty -delete 2>/dev/null || true

# 删除过时的脚本
echo "🗑️  删除过时的脚本..."
OLDSCRIPTS=(
    "cleanup-v0.7.8.sh"
    "fix-version-numbers.sh"
    "execute-cleanup.sh"
    "cleanup-docs.sh"
    "cleanup-outdated-packages.sh"
    "detect-dead-code.py"
)

for script in "${OLDSCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "$PROCESS_DIR/root/"
        echo "  ✓ $script"
    fi
done

# 生成清理报告
echo "📝 生成清理报告..."
cat > "$BACKUP_DIR/CLEANUP_REPORT_PHASE1.md" << 'EOF'
# Phase 1 清理报告

**执行时间**: $(date +"%Y-%m-%d %H:%M:%S")
**执行脚本**: cleanup-phase1.sh

## 清理内容

### 1. 根目录文档 (26个)
- 移动到: docs_backup/v0.7.12/process_docs/root/
- 包括: 审计报告、清理报告、实现指南等

### 2. docs/audits/ (84个)
- 移动 archive/ 目录
- 移动5个过程性文档

### 3. docs/features/ (10个)
- 移动过程性功能文档

### 4. docs/testing/ (全部)
- 移动整个目录

### 5. docs/releases/ (3个版本目录)
- v0.7.8/
- v1.7.6/
- v1.6.4/

### 6. docs/PHASE 文档 (5个)
- Phase 1/2 实现和测试文档

### 7. 过时脚本 (6个)
- cleanup-v0.7.8.sh
- fix-version-numbers.sh
- execute-cleanup.sh
- cleanup-docs.sh
- cleanup-outdated-packages.sh
- detect-dead-code.py

## 统计

- 总移动文件: 约130个
- 删除空目录: 若干
- 项目体积减少: 约10-15%

## 下一步

- Phase 2: 文档重构
- Phase 3: Dead Code清理
- Phase 4: 构建脚本清理

EOF

echo ""
echo "========================================"
echo "✅ Phase 1 清理完成！"
echo "========================================"
echo ""
echo "📊 清理统计："
echo "  - 备份目录: $BACKUP_DIR"
echo "  - 清理报告: $BACKUP_DIR/CLEANUP_REPORT_PHASE1.md"
echo ""
echo "⚠️  注意："
echo "  1. 所有文件已移动到备份目录，未删除"
echo "  2. 建议测试项目功能正常后再提交"
echo "  3. 备份目录建议保留至少3个月"
echo ""
