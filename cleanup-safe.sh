#!/bin/bash
# 安全清理脚本 - v0.8.1
# 只删除确认安全的文件

echo "🧹 开始安全清理..."
echo "================================"

# 1. 删除过时的版本文档
echo "📄 清理过时版本文档..."
rm -f RELEASE_NOTES_v0.8.1.md
rm -f ANDROID_BACK_GESTURE_FIX_v0.8.0.md
rm -f DEAD_CODE_CLEANUP_GUIDE_v0.7.12.md
rm -f MAINTENANCE_SUMMARY_v0.7.12.md
rm -f DOC_AUDIT_REPORT_v0.7.12.md
rm -f DOCUMENTATION_INDEX_v0.7.12.md
rm -f PHASE_2_4_COMPLETE_v0.7.12.md
rm -f AUDIT_REPORT_v0.7.12.json
rm -f GIT_COMMIT_GUIDE_v0.7.12.md
rm -f FINAL_DELIVERABLES_v0.7.12.md
rm -f MAINTENANCE_COMPLETE_v0.7.12.md
rm -f RELEASE_v0.7.10.md

# 2. 删除过程性脚本
echo "🔧 清理过程性脚本..."
rm -f audit-and-cleanup.py
rm -f cleanup-phase1.sh
rm -f execute-phase2-4.sh

# 3. 删除备份目录
echo "📦 清理备份目录..."
rm -rf docs_backup
rm -rf docs_backup_20260303_170852

# 4. 删除.DS_Store文件
echo "🗑️  清理系统文件..."
find . -name ".DS_Store" -type f -delete

echo "================================"
echo "✅ 清理完成！"
echo ""
echo "已删除:"
echo "  - 12个过时版本文档"
echo "  - 3个过程性脚本"
echo "  - 2个备份目录"
echo "  - 所有.DS_Store文件"
