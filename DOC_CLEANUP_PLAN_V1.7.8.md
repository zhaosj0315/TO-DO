# 文档整理计划 - v1.7.8

**执行日期**: 2026-03-01  
**目标**: 整理项目根目录，将临时文档归档

---

## 📋 整理清单

### 1. 移动到 `docs/drafts/` 的文档（临时文档）

```bash
# AI相关临时文档
mv AI_GENERATE_DESCRIPTION.md docs/drafts/
mv AI_LOADING_FIX.md docs/drafts/
mv AI_UNIFIED_QUICKSTART.md docs/drafts/
mv AI_EXTRACTION_SUMMARY.md docs/drafts/
mv AI_PROMPT_UNIFIED.md docs/drafts/

# 数据管理临时文档
mv DATA_MANAGEMENT_AUDIT.md docs/drafts/
mv DATA_MANAGEMENT_FIX_COMPLETE.md docs/drafts/
mv LOCALSTORAGE_QUOTA_FIX.md docs/drafts/

# UI优化临时文档
mv EXPAND_COLLAPSE_CLEANUP.md docs/drafts/
mv DESCRIPTION_HEIGHT_FIX.md docs/drafts/
mv FULLSCREEN_EDITOR_OPTIMIZATION.md docs/drafts/
mv UNIFIED_INPUT_COMPLETE.md docs/drafts/
mv UNIFIED_INPUT_IMPLEMENTATION.md docs/drafts/
mv UNIFIED_INPUT_FINAL.md docs/drafts/
mv UNIFIED_INPUT_DESIGN.md docs/drafts/

# 教程更新临时文档
mv TUTORIAL_UPDATE_COMPLETE.md docs/drafts/
mv TUTORIAL_UPDATE_PLAN.md docs/drafts/

# 报告功能临时文档
mv WORK_REPORT_MISSING_INFO.md docs/drafts/
mv REPORT_LOGIC_FIX.md docs/drafts/
mv REPORT_INTEGRATION_PLAN.md docs/drafts/

# 筛选优化临时文档
mv FILTER_OPTIMIZATION_COMPLETE.md docs/drafts/
mv FILTER_OPTIMIZATION_PLAN.md docs/drafts/

# 任务关系临时文档
mv TASK_RELATIONSHIPS_EXPLAINED.md docs/drafts/
mv BADGE_VERIFICATION_COMPLETE.md docs/drafts/
mv FIX_VERIFICATION.md docs/drafts/
mv HOW_TO_SHOW_PARENT_CHILD_BADGES.md docs/drafts/
mv TASK_BADGE_GUIDE.md docs/drafts/
mv TASK_RELATIONSHIP_LOGIC.md docs/drafts/
mv TASK_RELATIONSHIP_CHECKLIST.md docs/drafts/
mv TASK_RELATIONSHIP_DISPLAY.md docs/drafts/
mv PARENT_CHILD_EXAMPLES.md docs/drafts/
mv PARENT_CHILD_CHECKLIST.md docs/drafts/
mv PARENT_CHILD_IMPLEMENTATION.md docs/drafts/
mv PARENT_CHILD_TASKS.md docs/drafts/
mv FIX_PARENT_CHILD_GUIDE.md docs/drafts/

# 依赖功能临时文档
mv DEPENDENCY_IMPLEMENTATION.md docs/drafts/

# 其他临时文档
mv TEXT_SELECTION_OPTIMIZATION.md docs/drafts/
mv ANDROID_BACK_GESTURE.md docs/drafts/
mv DATA_MANAGEMENT_COMPATIBILITY.md docs/drafts/
mv AI_ASSISTANT_GUIDE.md docs/drafts/
mv AI_SMART_INTEGRATION.md docs/drafts/
mv AI_INTEGRATION_SUMMARY.md docs/drafts/
mv PROJECT_PROGRESS_V1.7.6.md docs/drafts/
```

### 2. 移动到 `docs/audits/` 的文档（审计文档）

```bash
# 已存在的审计文档（保持不动，已在正确位置）
# docs/audits/ 目录下已有 79 个审计文档

# 根目录的审计文档需要移动
mv DOC_AUDIT_REPORT_V1.7.12.md docs/audits/
mv DOC_ISSUES_LIST_V1.7.12.md docs/audits/
mv DOC_MAINTENANCE_COMPLETE_V1.7.12.md docs/audits/
mv DOC_DELIVERY_CHECKLIST_V1.7.10.md docs/audits/
mv DOC_MAINTENANCE_SUMMARY_V1.7.10_FINAL.md docs/audits/
mv DOC_ISSUES_LIST_V1.7.10_FINAL.md docs/audits/
mv DOC_AUDIT_REPORT_V1.7.10_FINAL.md docs/audits/
mv DOC_DELIVERY_CHECKLIST_V1.7.7.md docs/audits/
mv DOC_MAINTENANCE_SUMMARY_V1.7.7_FINAL.md docs/audits/
mv DOC_MAINTENANCE_COMPLETE_V1.7.7_FINAL.md docs/audits/
mv DOC_ISSUES_LIST_V1.7.7_FINAL_V2.md docs/audits/
mv DOC_AUDIT_REPORT_V1.7.7_FINAL.md docs/audits/
mv DOC_ISSUES_LIST_V1.7.7_FINAL.md docs/audits/
mv DOC_AUDIT_REPORT_V1.7.7.md docs/audits/
mv DOC_MAINTENANCE_COMPLETE_V1.7.6_HOTFIX.md docs/audits/
mv DOC_FIX_SUMMARY_V1.7.6_HOTFIX.md docs/audits/
mv AUDIT_REPORT_V1.7.6_HOTFIX.md docs/audits/
```

### 3. 删除的文件（临时测试文件）

```bash
# 测试HTML文件
rm badge-test.html
rm public/check-badges.html

# 临时JS脚本
rm check-task-data.js
rm debug-id-mismatch.js

# 临时日志文件
rm output.log
rm nohup.out
```

### 4. 保留在根目录的文档（核心文档）

```
✅ README.md
✅ CHANGELOG.md
✅ LICENSE
✅ DOC_MANAGEMENT_POLICY.md
✅ DOC_STANDARDS.md
✅ DOCS_INDEX.md
✅ USER_MANUAL.md
✅ DEVELOPER.md
✅ QUICK_START.md
✅ FEATURES.md
✅ DOC_AUDIT_REPORT_V1.7.8_CRITICAL.md（最新审计报告）
```

---

## 🎯 执行步骤

### 步骤1: 创建必要的目录

```bash
mkdir -p docs/drafts
mkdir -p docs/audits
```

### 步骤2: 批量移动文档

```bash
# 执行上述移动命令
# 或使用脚本自动执行
```

### 步骤3: 验证整理结果

```bash
# 检查根目录文件数量
ls -1 | wc -l

# 应该只剩下约 20-30 个文件（核心文档 + 构建产物 + 配置文件）
```

### 步骤4: 更新 DOCS_INDEX.md

更新文档索引，反映新的目录结构

---

## 📊 整理前后对比

| 项目 | 整理前 | 整理后 |
|------|--------|--------|
| 根目录文件数 | 237 | ~30 |
| 临时文档 | 50+ | 0 |
| 审计文档 | 17 | 1（最新） |
| 核心文档 | 混杂 | 清晰 |

---

## ✅ 验收标准

1. [ ] 根目录只保留核心文档和必要文件
2. [ ] 所有临时文档移至 `docs/drafts/`
3. [ ] 所有审计文档移至 `docs/audits/`
4. [ ] 删除所有临时测试文件
5. [ ] 更新 DOCS_INDEX.md
6. [ ] 验证所有链接仍然有效

---

**执行人**: 开发团队  
**执行日期**: 2026-03-01  
**预计耗时**: 30分钟
