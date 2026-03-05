# 项目材料全面审计与清理计划 v0.7.10

**审计日期**: 2026-03-03  
**审计员**: 外部审计视角  
**代码版本**: v0.7.10 (已封板，不可修改)  
**核心原则**: 文档必须无条件适配代码

---

## 📋 审计范围

### 1. 文档材料审计
- [ ] README.md - 主文档
- [ ] CHANGELOG.md - 版本历史
- [ ] 根目录所有 .md 文件（29个）
- [ ] docs/ 目录下所有文档
- [ ] 检查文档与代码的一致性

### 2. 过程性材料识别与清理
- [ ] 识别临时文档（DOC_AUDIT_*, DOC_ISSUES_*, DOC_MAINTENANCE_*）
- [ ] 识别草稿文档（docs/drafts/）
- [ ] 识别重复文档
- [ ] 识别过时文档

### 3. 无用代码清理
- [ ] 检测未使用的函数
- [ ] 检测未使用的组件
- [ ] 检测未使用的服务
- [ ] 检测未使用的工具函数

### 4. 依赖关系检查
- [ ] 需求 → 设计 → 实现 → 测试 链路完整性
- [ ] 文档间引用关系
- [ ] 代码与文档的对应关系

---

## 🔍 第一阶段：文档问题清单

### 根目录文档问题

#### 过程性文档（建议归档或删除）
1. `DOC_AUDIT_REPORT_V0.7.9_FINAL.md` - v0.7.9审计报告（过程性）
2. `DOC_AUDIT_REPORT_V0.7.9.md` - v0.7.9审计报告（重复）
3. `DOC_DELIVERABLES_V0.7.9_FINAL.md` - v0.7.9交付物清单（过程性）
4. `DOC_ISSUES_LIST_V0.7.9_FINAL.md` - v0.7.9问题清单（过程性）
5. `DOC_ISSUES_LIST_V0.7.9.md` - v0.7.9问题清单（重复）
6. `DOC_MAINTENANCE_COMPLETE_V0.7.9_FINAL.md` - v0.7.9维护完成报告（过程性）
7. `DOC_MAINTENANCE_COMPLETE_V0.7.9.md` - v0.7.9维护完成报告（重复）
8. `DOC_MAINTENANCE_SUMMARY_V0.7.9.md` - v0.7.9维护摘要（过程性）
9. `RELEASE_NOTES_v0.7.9.md` - v0.7.9发布说明（应整合到CHANGELOG）

#### 功能说明文档（建议移至docs/features/）
10. `AI_SUGGESTION_OPTIMIZATION_SUMMARY.md` - AI建议优化总结
11. `ANDROID_BACK_GESTURE_AUDIT.md` - Android返回手势审计
12. `CLIPBOARD_LOGIC_EXPLANATION.md` - 剪贴板逻辑说明
13. `SUBTASK_IMPLEMENTATION_SUMMARY.md` - 子任务实现总结
14. `SUBTASK_QUICK_CREATE_GUIDE.md` - 子任务快速创建指南
15. `TASK_INPUT_FEATURES_AUDIT.md` - 任务输入功能审计
16. `TASK_PREVIEW_GUIDE.md` - 任务预览指南
17. `VOICE_CAMERA_FEATURE_SUMMARY.md` - 语音相机功能总结

#### 规范文档（保留）
- `DOC_MANAGEMENT_POLICY.md` - 文档管理规范 ✅
- `DOC_STANDARDS.md` - 文档标准 ✅
- `DOCS_INDEX.md` - 文档索引 ✅

#### 核心文档（保留并审计）
- `README.md` - 主文档 ✅
- `CHANGELOG.md` - 版本历史 ✅
- `FEATURES.md` - 功能列表 ✅
- `QUICK_START.md` - 快速开始 ✅
- `USER_MANUAL.md` - 用户手册 ✅
- `DEVELOPER.md` - 开发者指南 ✅
- `ARCHITECTURE.md` - 架构文档 ✅
- `API_REFERENCE.md` - API参考 ✅
- `TESTING_GUIDE.md` - 测试指南 ✅

---

## 🗂️ 第二阶段：docs/ 目录审计

### docs/audits/ (115个文件)
**问题**: 大量历史审计报告，建议归档

**建议操作**:
- 保留最新的审计报告（v0.7.10）
- 将v0.7.9及之前的审计报告移至 `docs/archive/audits/`
- 删除重复的审计报告

### docs/drafts/ (98个文件)
**问题**: 大量草稿文档，部分已过时

**建议操作**:
- 识别已完成的草稿（功能已实现）→ 移至对应的features/或删除
- 识别未完成的草稿（功能未实现）→ 保留或移至archive
- 删除重复的草稿

### docs/features/ (15个文件)
**建议**: 保留，但需要审查是否与代码一致

### docs/releases/ (多个版本目录)
**建议**: 保留，但整理版本号（v1.x.x → v0.x.x）

---

## 🧹 第三阶段：清理执行计划

### 安全清理策略

#### 1. 过程性文档清理
```bash
# 移动到归档目录
mkdir -p docs/archive/v0.7.9-process
mv DOC_*_V0.7.9*.md docs/archive/v0.7.9-process/
mv RELEASE_NOTES_v0.7.9.md docs/archive/v0.7.9-process/
```

#### 2. 功能文档整理
```bash
# 移动到features目录
mv AI_SUGGESTION_OPTIMIZATION_SUMMARY.md docs/features/
mv ANDROID_BACK_GESTURE_AUDIT.md docs/features/
mv CLIPBOARD_LOGIC_EXPLANATION.md docs/features/
mv SUBTASK_*.md docs/features/
mv TASK_*.md docs/features/
mv VOICE_CAMERA_FEATURE_SUMMARY.md docs/features/
```

#### 3. 审计报告归档
```bash
# 归档旧版本审计报告
mkdir -p docs/archive/audits/v0.7.9
mv docs/audits/DOC_*_V0.7.9*.md docs/archive/audits/v0.7.9/
mv docs/audits/*_V1.7.*.md docs/archive/audits/v1.7.x/
```

---

## 🔧 第四阶段：无用代码检测

### 自动化检测脚本

```python
#!/usr/bin/env python3
"""
Dead Code Detector for Vue.js Project
检测未使用的函数、组件、服务
"""

import os
import re
from collections import defaultdict

# 项目根目录
PROJECT_ROOT = "/Users/zhaosj/Desktop/TO-DO"
SRC_DIR = os.path.join(PROJECT_ROOT, "src")

# 函数定义模式
FUNCTION_PATTERNS = [
    r'function\s+(\w+)\s*\(',  # function xxx()
    r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>', # const xxx = () =>
    r'(\w+)\s*:\s*function\s*\(',  # xxx: function()
    r'async\s+function\s+(\w+)\s*\(',  # async function xxx()
]

# 组件定义模式
COMPONENT_PATTERN = r'<script.*?>(.*?)</script>'

def find_all_functions(file_path):
    """查找文件中定义的所有函数"""
    functions = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            for pattern in FUNCTION_PATTERNS:
                matches = re.findall(pattern, content)
                functions.extend(matches)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return functions

def count_references(function_name, search_dir):
    """统计函数在项目中的引用次数"""
    count = 0
    for root, dirs, files in os.walk(search_dir):
        # 排除node_modules, dist等目录
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', 'build', '.git']]
        
        for file in files:
            if file.endswith(('.vue', '.js', '.ts')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # 使用单词边界匹配，避免误判
                        pattern = r'\b' + re.escape(function_name) + r'\b'
                        count += len(re.findall(pattern, content))
                except Exception:
                    pass
    return count

def detect_dead_code():
    """检测死代码"""
    print("🔍 开始检测未使用的函数...")
    
    dead_functions = []
    
    for root, dirs, files in os.walk(SRC_DIR):
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist']]
        
        for file in files:
            if file.endswith(('.vue', '.js')):
                file_path = os.path.join(root, file)
                functions = find_all_functions(file_path)
                
                for func in functions:
                    # 跳过常见的生命周期钩子和保留字
                    if func in ['mounted', 'created', 'setup', 'data', 'methods', 'computed', 'watch']:
                        continue
                    
                    ref_count = count_references(func, SRC_DIR)
                    
                    # 引用次数为1表示只有定义，没有调用
                    if ref_count <= 1:
                        dead_functions.append({
                            'file': file_path.replace(PROJECT_ROOT, ''),
                            'function': func,
                            'references': ref_count
                        })
    
    return dead_functions

if __name__ == '__main__':
    results = detect_dead_code()
    
    print(f"\n📊 检测结果: 发现 {len(results)} 个可能未使用的函数\n")
    
    for item in results:
        print(f"❌ {item['file']}")
        print(f"   函数: {item['function']}")
        print(f"   引用次数: {item['references']}")
        print()
```

### 安全策略

**动态调用检测**:
1. 检查是否有 `this[functionName]()` 模式
2. 检查是否有 `window[functionName]()` 模式
3. 检查是否有事件监听器绑定
4. 检查是否有路由守卫

**人工复核清单**:
- [ ] 检查函数是否在模板中使用（@click, v-on等）
- [ ] 检查函数是否通过props传递
- [ ] 检查函数是否通过emit触发
- [ ] 检查函数是否在watch/computed中使用

---

## 📝 第五阶段：文档与代码一致性审查

### 审查清单

#### README.md
- [ ] 版本号是否正确（v0.7.10）
- [ ] 功能列表是否完整
- [ ] 安装步骤是否准确
- [ ] 技术栈是否最新

#### CHANGELOG.md
- [ ] v0.7.10条目是否完整
- [ ] 历史版本是否准确
- [ ] 版本号是否统一（v0.x.x）

#### FEATURES.md
- [ ] 所有功能是否在代码中存在
- [ ] 代码中的功能是否都有文档

#### API_REFERENCE.md
- [ ] API接口是否与代码一致
- [ ] 参数说明是否准确
- [ ] 返回值说明是否准确

---

## ✅ 执行检查清单

### 清理前确认
- [ ] 已备份项目（Git commit）
- [ ] 已创建清理分支
- [ ] 已生成清理报告
- [ ] 已人工复核清理列表

### 清理后验证
- [ ] 项目可正常构建
- [ ] 所有功能可正常运行
- [ ] 文档链接无死链
- [ ] Git历史完整

---

## 📊 预期成果

1. **文档精简**: 根目录文档从29个减少到10个核心文档
2. **目录整理**: docs/目录结构清晰，分类明确
3. **代码优化**: 删除未使用的函数和组件
4. **一致性**: 文档与代码100%一致

---

## 🚀 下一步行动

1. 执行文档清理脚本
2. 运行死代码检测脚本
3. 生成清理报告
4. 提交清理结果到Git
5. 更新DOCS_INDEX.md

