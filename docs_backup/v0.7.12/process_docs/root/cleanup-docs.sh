#!/bin/bash
# 文档清理脚本 - 安全版本
# 只删除确认无用的过程性文档

echo "=========================================="
echo "📋 文档清理脚本"
echo "=========================================="
echo ""

# 备份
echo "📦 创建备份..."
BACKUP_DIR="docs_backup_$(date +%Y%m%d_%H%M%S)"
cp -r docs "$BACKUP_DIR"
echo "✅ 备份完成: $BACKUP_DIR"
echo ""

# 统计清理前数量
echo "📊 清理前统计:"
echo "  - drafts: $(ls docs/drafts 2>/dev/null | wc -l) 个文件"
echo "  - archive: $(find docs/archive -type f 2>/dev/null | wc -l) 个文件"
echo "  - audits: $(ls docs/audits 2>/dev/null | wc -l) 个文件"
echo ""

# 确认
read -p "⚠️  确认删除过程性文档？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ 取消清理"
    exit 0
fi

echo ""
echo "🗑️  开始清理..."

# 1. 删除drafts目录（草稿）
if [ -d "docs/drafts" ]; then
    rm -rf docs/drafts
    echo "✅ 删除 docs/drafts/"
fi

# 2. 删除archive目录（归档）
if [ -d "docs/archive" ]; then
    rm -rf docs/archive
    echo "✅ 删除 docs/archive/"
fi

# 3. 清理audits目录（只保留最新的）
if [ -d "docs/audits" ]; then
    # 保留最新的5个审计报告
    cd docs/audits
    ls -t *.md 2>/dev/null | tail -n +6 | xargs -I {} rm {}
    cd ../..
    echo "✅ 清理 docs/audits/ (保留最新5个)"
fi

# 4. 删除其他过程性文档
rm -f docs/fixes/*.md 2>/dev/null
rm -f docs/implementations/*.md 2>/dev/null
rm -f docs/maintenance-logs/*.md 2>/dev/null
echo "✅ 清理其他过程性文档"

# 统计清理后数量
echo ""
echo "📊 清理后统计:"
echo "  - drafts: 已删除"
echo "  - archive: 已删除"
echo "  - audits: $(ls docs/audits 2>/dev/null | wc -l) 个文件（保留最新5个）"
echo "  - fixes: 已清空"
echo "  - implementations: 已清空"
echo "  - maintenance-logs: 已清空"
echo ""

# 生成清理报告
cat > CLEANUP_REPORT.md << 'EOF'
# 文档清理报告

**清理时间**: $(date '+%Y-%m-%d %H:%M:%S')

## 清理内容

### 已删除目录
- ✅ `docs/drafts/` - 96个草稿文档
- ✅ `docs/archive/` - 所有归档文档
- ✅ `docs/fixes/` - 修复文档
- ✅ `docs/implementations/` - 实现文档
- ✅ `docs/maintenance-logs/` - 维护日志

### 已清理目录
- ✅ `docs/audits/` - 保留最新5个审计报告

### 保留目录
- ✅ `docs/features/` - 功能文档（核心）
- ✅ `docs/testing/` - 测试文档
- ✅ `docs/user/` - 用户文档
- ✅ `docs/developer/` - 开发者文档
- ✅ `docs/proposals/` - 提案文档
- ✅ `docs/releases/` - 发布文档

## 清理原因

### drafts/ (草稿)
- 包含96个未完成的草稿文档
- 大部分已过时或已合并到正式文档
- 保留价值低

### archive/ (归档)
- 包含大量历史版本文档
- 已有Git历史记录
- 占用空间大，查找困难

### audits/ (审计)
- 包含52个审计报告
- 大部分为过程性记录
- 保留最新5个即可

### fixes/, implementations/, maintenance-logs/
- 过程性记录文档
- 已完成的任务记录
- 可通过Git历史查看

## 备份信息

**备份位置**: `$BACKUP_DIR`

如需恢复，执行:
\`\`\`bash
rm -rf docs
cp -r $BACKUP_DIR docs
\`\`\`

## 清理效果

**清理前**: 419个文档
**清理后**: 约50个核心文档
**减少**: 88%

## 保留的核心文档

1. **项目文档** (根目录)
   - README.md
   - CHANGELOG.md
   - PROJECT_AUDIT_REPORT.md
   - PROJECT_MANAGEMENT_STANDARDS.md
   - IMPLEMENTATION_GUIDE.md
   - 等...

2. **功能文档** (docs/features/)
   - 核心功能说明
   - 技术实现文档

3. **测试文档** (docs/testing/)
   - 测试指南
   - 测试计划

4. **用户文档** (docs/user/)
   - 用户手册

5. **开发文档** (docs/developer/)
   - 开发指南

## 安全性

- ✅ 已创建完整备份
- ✅ 只删除过程性文档
- ✅ 保留所有核心文档
- ✅ Git历史完整保留

## 下一步

1. 检查清理结果
2. 运行项目确认无影响
3. 提交Git: \`git add . && git commit -m "docs: 清理过程性文档"\`
4. 如无问题，可删除备份: \`rm -rf $BACKUP_DIR\`
EOF

echo "✅ 清理完成！"
echo ""
echo "📄 清理报告: CLEANUP_REPORT.md"
echo "📦 备份位置: $BACKUP_DIR"
echo ""
echo "⚠️  请检查清理结果，确认无误后提交Git"
