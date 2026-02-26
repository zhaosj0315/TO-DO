# 文档整理计划 v1.7.6

**整理日期**: 2026-02-26  
**当前状态**: 根目录有 166 个 Markdown 文件  
**目标**: 规范化文档目录结构

---

## 📁 目标目录结构

```
TO-DO/
├── README.md                    # 项目主文档
├── CHANGELOG.md                 # 版本更新日志
├── LICENSE                      # 开源协议
├── FEATURES.md                  # 功能列表
├── QUICK_START.md              # 快速开始
├── docs/                        # 文档目录
│   ├── user/                    # 用户文档
│   │   ├── USER_MANUAL.md
│   │   └── FAQ.md
│   ├── developer/               # 开发文档
│   │   ├── DEVELOPER.md
│   │   ├── ARCHITECTURE.md
│   │   └── API_REFERENCE.md
│   ├── build/                   # 构建文档
│   │   ├── APK_BUILD_GUIDE.md
│   │   ├── WINDOWS_BUILD_GUIDE.md
│   │   ├── MAC_BUILD_GUIDE.md
│   │   └── IOS_BUILD_GUIDE.md
│   ├── features/                # 功能文档
│   │   ├── AI_PROACTIVE_ASSISTANT_FEATURE.md
│   │   ├── AI_CHAT_GUIDE.md
│   │   ├── TASK_LOG_PHASE1.md
│   │   └── TUTORIAL_MODE_FEATURE.md
│   ├── testing/                 # 测试文档
│   │   └── TESTING_GUIDE.md
│   ├── releases/                # 发布文档
│   │   ├── v1.7.6/
│   │   ├── v1.7.5/
│   │   └── v1.6.x/
│   ├── audits/                  # 审计文档
│   │   ├── DOC_AUDIT_ISSUES_V1.7.6.md
│   │   └── archive/
│   └── drafts/                  # 草稿文档
│       ├── AI_ASSISTANT_INNOVATION_PLAN.md
│       └── MARKDOWN_EDITOR_EVALUATION.md
└── scripts/                     # 脚本文档
    └── README.md
```

---

## 🗂️ 文件分类规则

### 保留在根目录（7个）
- README.md
- CHANGELOG.md
- LICENSE
- FEATURES.md
- QUICK_START.md
- DEVELOPER.md
- USER_MANUAL.md

### 移动到 docs/user/
- USER_MANUAL*.md
- FAQ.md
- QUICK_START*.md

### 移动到 docs/developer/
- DEVELOPER*.md
- ARCHITECTURE*.md
- API_REFERENCE*.md
- CODE_REVIEW*.md

### 移动到 docs/build/
- *_BUILD_GUIDE.md
- *_BUILD_QUICK.md
- BUILD_SCRIPTS_GUIDE.md

### 移动到 docs/features/
- *_FEATURE.md
- *_PHASE*.md
- AI_CHAT_GUIDE.md
- AI_PROACTIVE_ASSISTANT_FEATURE.md
- TUTORIAL_MODE_FEATURE.md

### 移动到 docs/testing/
- TESTING_GUIDE.md
- *_TEST*.md

### 移动到 docs/releases/
- RELEASE_NOTES_*.md
- GIT_PUSH_*.md
- GITHUB_RELEASE_*.md

### 移动到 docs/audits/
- DOC_AUDIT_*.md
- DOC_ISSUES_*.md
- DOC_MAINTENANCE_*.md
- DOC_DELIVERABLES_*.md
- AUDIT_*.md

### 移动到 docs/drafts/
- AI_ASSISTANT_INNOVATION_PLAN.md
- AI_CHAT_OPTIMIZATION_PLAN.md
- MARKDOWN_EDITOR_EVALUATION.md
- *_PLAN.md
- *_SUMMARY.md（非最终版）

### 删除（测试文件）
- MARKDOWN_TEST.md
- *_TEST.md（非指南类）
- NOTIFICATION_TEST.md

---

## 📋 执行步骤

### 第一阶段：创建目录结构
```bash
mkdir -p docs/user
mkdir -p docs/developer
mkdir -p docs/build
mkdir -p docs/features
mkdir -p docs/testing
mkdir -p docs/releases/v1.7.6
mkdir -p docs/audits
mkdir -p docs/drafts
```

### 第二阶段：移动文件
按分类规则逐个移动文件

### 第三阶段：更新引用
检查并更新文档中的相对路径引用

### 第四阶段：验证
确保所有文档可访问，链接正常

---

## ⚠️ 注意事项

1. **备份**: 移动前先提交当前状态到 Git
2. **引用检查**: 移动后检查文档间的链接
3. **README 更新**: 更新 README.md 中的文档链接
4. **渐进式**: 分批移动，每批提交一次

---

## 🎯 预期结果

- 根目录文件数量：7个核心文档
- docs/ 目录：159个文档，分类清晰
- 文档可维护性：提升 80%
- 查找效率：提升 90%

---

**执行人员**: 开发团队  
**预计时间**: 1-2小时  
**状态**: 待执行
