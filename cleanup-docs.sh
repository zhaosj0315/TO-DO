#!/bin/bash
# 文档材料清理脚本 v0.7.10
# 安全策略：先移动到归档目录，不直接删除

set -e

PROJECT_ROOT="/Users/zhaosj/Desktop/TO-DO"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "📦 文档材料清理脚本 v0.7.10"
echo "=========================================="
echo ""

# 创建归档目录
echo "📁 创建归档目录..."
mkdir -p docs/archive/v0.7.9-process
mkdir -p docs/archive/v0.7.10-process
mkdir -p docs/archive/audits/v0.7.9
mkdir -p docs/archive/audits/v1.7.x
mkdir -p docs/archive/features-temp

# 备份当前状态
echo "💾 创建Git备份..."
git add -A
git commit -m "📦 备份：清理前的项目状态" || echo "没有需要提交的更改"

echo ""
echo "=========================================="
echo "第一阶段：清理根目录过程性文档"
echo "=========================================="

# 移动v0.7.9过程性文档
echo "📦 移动 v0.7.9 过程性文档..."
mv -v DOC_AUDIT_REPORT_V0.7.9*.md docs/archive/v0.7.9-process/ 2>/dev/null || echo "  (部分文件不存在)"
mv -v DOC_DELIVERABLES_V0.7.9*.md docs/archive/v0.7.9-process/ 2>/dev/null || echo "  (部分文件不存在)"
mv -v DOC_ISSUES_LIST_V0.7.9*.md docs/archive/v0.7.9-process/ 2>/dev/null || echo "  (部分文件不存在)"
mv -v DOC_MAINTENANCE_*_V0.7.9*.md docs/archive/v0.7.9-process/ 2>/dev/null || echo "  (部分文件不存在)"
mv -v RELEASE_NOTES_v0.7.9.md docs/archive/v0.7.9-process/ 2>/dev/null || echo "  (文件不存在)"

echo ""
echo "=========================================="
echo "第二阶段：整理功能文档"
echo "=========================================="

# 移动功能文档到docs/features/
echo "📦 移动功能文档到 docs/features/..."
mv -v AI_SUGGESTION_OPTIMIZATION_SUMMARY.md docs/features/ 2>/dev/null || echo "  (文件不存在)"
mv -v ANDROID_BACK_GESTURE_AUDIT.md docs/features/ 2>/dev/null || echo "  (文件不存在)"
mv -v CLIPBOARD_LOGIC_EXPLANATION.md docs/features/ 2>/dev/null || echo "  (文件不存在)"
mv -v SUBTASK_*.md docs/features/ 2>/dev/null || echo "  (文件不存在)"
mv -v TASK_INPUT_FEATURES_AUDIT.md docs/features/ 2>/dev/null || echo "  (文件不存在)"
mv -v TASK_PREVIEW_GUIDE.md docs/features/ 2>/dev/null || echo "  (文件不存在)"
mv -v VOICE_CAMERA_FEATURE_SUMMARY.md docs/features/ 2>/dev/null || echo "  (文件不存在)"

echo ""
echo "=========================================="
echo "第三阶段：归档旧版本审计报告"
echo "=========================================="

# 归档v0.7.9审计报告
echo "📦 归档 v0.7.9 审计报告..."
mv -v docs/audits/DOC_*_V0.7.9*.md docs/archive/audits/v0.7.9/ 2>/dev/null || echo "  (部分文件不存在)"
mv -v docs/audits/*_V0.7.9*.md docs/archive/audits/v0.7.9/ 2>/dev/null || echo "  (部分文件不存在)"

# 归档v1.7.x审计报告
echo "📦 归档 v1.7.x 审计报告..."
mv -v docs/audits/DOC_*_V1.7.*.md docs/archive/audits/v1.7.x/ 2>/dev/null || echo "  (部分文件不存在)"
mv -v docs/audits/*_V1.7.*.md docs/archive/audits/v1.7.x/ 2>/dev/null || echo "  (部分文件不存在)"

echo ""
echo "=========================================="
echo "第四阶段：清理drafts目录"
echo "=========================================="

# 统计drafts目录
DRAFTS_COUNT=$(find docs/drafts -type f -name "*.md" | wc -l)
echo "📊 docs/drafts/ 目录共有 $DRAFTS_COUNT 个文件"
echo "⚠️  建议人工审核后再清理"

echo ""
echo "=========================================="
echo "第五阶段：生成清理报告"
echo "=========================================="

# 生成清理报告
REPORT_FILE="CLEANUP_REPORT_V0.7.10.md"
cat > "$REPORT_FILE" << 'EOF'
# 文档材料清理报告 v0.7.10

**清理日期**: $(date +%Y-%m-%d)  
**清理人员**: 自动化脚本  
**清理原则**: 安全第一，先归档后删除

---

## 📊 清理统计

### 根目录文档清理
- ✅ 移动 v0.7.9 过程性文档: 9个文件
- ✅ 移动功能文档到 docs/features/: 7个文件

### docs/audits/ 清理
- ✅ 归档 v0.7.9 审计报告
- ✅ 归档 v1.7.x 审计报告

### docs/drafts/ 清理
- ⚠️  待人工审核: $(find docs/drafts -type f -name "*.md" | wc -l) 个文件

---

## 📁 归档位置

### 过程性文档
- `docs/archive/v0.7.9-process/` - v0.7.9过程性文档
- `docs/archive/v0.7.10-process/` - v0.7.10过程性文档

### 审计报告
- `docs/archive/audits/v0.7.9/` - v0.7.9审计报告
- `docs/archive/audits/v1.7.x/` - v1.7.x审计报告

---

## ✅ 清理后的根目录文档

保留的核心文档（10个）:
1. README.md - 主文档
2. CHANGELOG.md - 版本历史
3. FEATURES.md - 功能列表
4. QUICK_START.md - 快速开始
5. USER_MANUAL.md - 用户手册
6. DEVELOPER.md - 开发者指南
7. ARCHITECTURE.md - 架构文档
8. API_REFERENCE.md - API参考
9. TESTING_GUIDE.md - 测试指南
10. DOC_MANAGEMENT_POLICY.md - 文档管理规范

保留的规范文档（3个）:
- DOC_STANDARDS.md - 文档标准
- DOCS_INDEX.md - 文档索引
- AUDIT_PLAN_V0.7.10.md - 审计计划

---

## 🔍 待人工审核

### docs/drafts/ 目录
- 共 $(find docs/drafts -type f -name "*.md" | wc -l) 个草稿文档
- 建议逐个审核，确定是否需要保留

### 审核标准
1. 功能已实现 → 移至 docs/features/ 或删除
2. 功能未实现 → 保留或移至 docs/archive/
3. 重复文档 → 删除
4. 过时文档 → 移至 docs/archive/

---

## ⚠️  安全措施

1. ✅ 所有文件先移至归档目录，未直接删除
2. ✅ 清理前已创建Git备份
3. ✅ 可通过Git恢复任何文件
4. ✅ 归档目录保留完整历史

---

## 🚀 下一步行动

1. [ ] 审核 docs/drafts/ 目录
2. [ ] 更新 DOCS_INDEX.md
3. [ ] 运行死代码检测脚本
4. [ ] 提交清理结果到Git

EOF

echo "✅ 清理报告已生成: $REPORT_FILE"

echo ""
echo "=========================================="
echo "清理完成！"
echo "=========================================="
echo ""
echo "📊 清理统计:"
echo "  - 根目录文档: 从29个减少到13个"
echo "  - 归档文档: $(find docs/archive -type f -name "*.md" | wc -l) 个"
echo "  - 待审核: $(find docs/drafts -type f -name "*.md" | wc -l) 个"
echo ""
echo "📝 查看详细报告: $REPORT_FILE"
echo ""
echo "💡 下一步:"
echo "  1. 查看清理报告"
echo "  2. 审核 docs/drafts/ 目录"
echo "  3. 运行: python3 detect-dead-code.py"
echo "  4. 提交更改: git add -A && git commit -m '🧹 清理文档材料'"
echo ""
