#!/usr/bin/env python3
"""
TO-DO App 项目全面审计和清理工具
版本: v0.8.1
日期: 2026-03-06
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

class ProjectAuditor:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.issues = []
        self.cleanup_candidates = []
        self.dead_code = []
        
    def audit_documents(self):
        """审计文档材料"""
        print("📋 开始文档审计...")
        
        # 1. 检查过时的版本号文档
        version_docs = [
            'RELEASE_NOTES_v0.8.1.md',
            'ANDROID_BACK_GESTURE_FIX_v0.8.0.md',
            'DEAD_CODE_CLEANUP_GUIDE_v0.7.12.md',
            'MAINTENANCE_SUMMARY_v0.7.12.md',
            'DOC_AUDIT_REPORT_v0.7.12.md',
            'DOCUMENTATION_INDEX_v0.7.12.md',
            'PHASE_2_4_COMPLETE_v0.7.12.md',
            'AUDIT_REPORT_v0.7.12.json',
            'GIT_COMMIT_GUIDE_v0.7.12.md',
            'FINAL_DELIVERABLES_v0.7.12.md',
            'MAINTENANCE_COMPLETE_v0.7.12.md',
            'RELEASE_v0.7.10.md'
        ]
        
        for doc in version_docs:
            doc_path = self.project_root / doc
            if doc_path.exists():
                self.cleanup_candidates.append({
                    'file': doc,
                    'reason': '过时的版本文档（已有v0.8.1）',
                    'type': 'version_doc',
                    'safe_to_delete': True
                })
        
        # 2. 检查过程性脚本
        process_scripts = [
            'audit-and-cleanup.py',
            'cleanup-phase1.sh',
            'execute-phase2-4.sh'
        ]
        
        for script in process_scripts:
            script_path = self.project_root / script
            if script_path.exists():
                self.cleanup_candidates.append({
                    'file': script,
                    'reason': '过程性脚本（已完成任务）',
                    'type': 'process_script',
                    'safe_to_delete': True
                })
        
        # 3. 检查备份目录
        backup_dirs = [
            'docs_backup',
            'docs_backup_20260303_170852'
        ]
        
        for backup_dir in backup_dirs:
            backup_path = self.project_root / backup_dir
            if backup_path.exists():
                self.cleanup_candidates.append({
                    'file': backup_dir,
                    'reason': '旧版本备份目录（已归档）',
                    'type': 'backup_dir',
                    'safe_to_delete': True
                })
        
        # 4. 检查.DS_Store文件
        ds_store_files = list(self.project_root.rglob('.DS_Store'))
        for ds_file in ds_store_files:
            self.cleanup_candidates.append({
                'file': str(ds_file.relative_to(self.project_root)),
                'reason': 'macOS系统文件',
                'type': 'system_file',
                'safe_to_delete': True
            })
    
    def find_dead_code(self):
        """查找未使用的函数"""
        print("🔍 开始查找Dead Code...")
        
        # 扫描所有Vue和JS文件
        code_files = []
        code_files.extend(self.project_root.glob('src/**/*.vue'))
        code_files.extend(self.project_root.glob('src/**/*.js'))
        
        # 提取所有函数定义
        function_defs = defaultdict(list)
        function_pattern = re.compile(r'(?:const|let|var|function)\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\(')
        
        for file_path in code_files:
            try:
                content = file_path.read_text(encoding='utf-8')
                matches = function_pattern.finditer(content)
                for match in matches:
                    func_name = match.group(1) or match.group(2)
                    if func_name and not func_name.startswith('_'):  # 忽略私有函数
                        function_defs[func_name].append(str(file_path.relative_to(self.project_root)))
            except Exception as e:
                print(f"⚠️  读取文件失败: {file_path} - {e}")
        
        # 检查每个函数的引用次数
        all_content = ""
        for file_path in code_files:
            try:
                all_content += file_path.read_text(encoding='utf-8') + "\n"
            except:
                pass
        
        for func_name, locations in function_defs.items():
            # 计算引用次数（排除定义本身）
            ref_count = len(re.findall(rf'\b{func_name}\b', all_content)) - len(locations)
            
            if ref_count == 0:
                self.dead_code.append({
                    'function': func_name,
                    'defined_in': locations,
                    'references': 0,
                    'safe_to_delete': False  # 需要人工确认
                })
    
    def check_readme_accuracy(self):
        """检查README与代码的一致性"""
        print("📖 检查README准确性...")
        
        readme_path = self.project_root / 'README.md'
        if not readme_path.exists():
            self.issues.append("❌ README.md 不存在")
            return
        
        readme_content = readme_path.read_text(encoding='utf-8')
        
        # 检查版本号
        if '0.8.1' not in readme_content:
            self.issues.append("⚠️  README中版本号可能未更新到0.8.1")
        
        # 检查任务树成长系统是否在README中
        if '任务树' not in readme_content and '成长系统' not in readme_content:
            self.issues.append("⚠️  README缺少任务树成长系统的说明")
    
    def generate_report(self):
        """生成审计报告"""
        report = {
            'audit_date': datetime.now().isoformat(),
            'project_version': 'v0.8.1',
            'summary': {
                'total_issues': len(self.issues),
                'cleanup_candidates': len(self.cleanup_candidates),
                'dead_code_found': len(self.dead_code)
            },
            'issues': self.issues,
            'cleanup_candidates': self.cleanup_candidates,
            'dead_code': self.dead_code
        }
        
        # 保存JSON报告
        report_path = self.project_root / 'AUDIT_REPORT_v0.8.1.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # 生成Markdown报告
        self.generate_markdown_report(report)
        
        return report
    
    def generate_markdown_report(self, report):
        """生成Markdown格式的审计报告"""
        md_content = f"""# TO-DO App 项目审计报告

**版本**: v0.8.1  
**审计日期**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**审计员**: 自动化审计工具

---

## 📊 审计摘要

- **发现问题**: {len(self.issues)}个
- **清理候选**: {len(self.cleanup_candidates)}个
- **Dead Code**: {len(self.dead_code)}个

---

## ⚠️ 发现的问题

"""
        
        if self.issues:
            for i, issue in enumerate(self.issues, 1):
                md_content += f"{i}. {issue}\n"
        else:
            md_content += "✅ 未发现问题\n"
        
        md_content += "\n---\n\n## 🗑️ 清理候选列表\n\n"
        
        if self.cleanup_candidates:
            # 按类型分组
            by_type = defaultdict(list)
            for item in self.cleanup_candidates:
                by_type[item['type']].append(item)
            
            for type_name, items in by_type.items():
                md_content += f"\n### {type_name}\n\n"
                for item in items:
                    safe_mark = "✅" if item['safe_to_delete'] else "⚠️"
                    md_content += f"- {safe_mark} `{item['file']}` - {item['reason']}\n"
        else:
            md_content += "✅ 无需清理\n"
        
        md_content += "\n---\n\n## 💀 Dead Code 分析\n\n"
        
        if self.dead_code:
            md_content += "⚠️ **以下函数可能未被使用，但需要人工确认（可能是动态调用）**\n\n"
            for item in self.dead_code:
                md_content += f"- `{item['function']}` 定义在: {', '.join(item['defined_in'])}\n"
        else:
            md_content += "✅ 未发现Dead Code\n"
        
        md_content += "\n---\n\n## 🔧 建议操作\n\n"
        md_content += """
### 1. 清理过时文档
```bash
# 删除v0.7.x版本文档
rm -f *_v0.7.*.md
rm -f AUDIT_REPORT_v0.7.12.json

# 删除过程性脚本
rm -f audit-and-cleanup.py cleanup-phase1.sh execute-phase2-4.sh
```

### 2. 清理备份目录
```bash
# 删除旧备份
rm -rf docs_backup docs_backup_20260303_170852
```

### 3. 清理系统文件
```bash
# 删除.DS_Store
find . -name ".DS_Store" -delete
```

### 4. Dead Code处理
- 需要人工review每个未使用的函数
- 确认是否为动态调用或未来功能
- 谨慎删除

---

## ✅ 审计结论

本次审计发现的问题主要集中在：
1. 过时的版本文档（v0.7.x）
2. 已完成的过程性脚本
3. 旧版本备份目录
4. 系统临时文件

**建议**: 执行清理操作，保持项目目录整洁。
"""
        
        report_path = self.project_root / 'AUDIT_REPORT_v0.8.1.md'
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"✅ 审计报告已生成: {report_path}")

def main():
    project_root = Path(__file__).parent
    auditor = ProjectAuditor(project_root)
    
    print("🚀 开始项目审计...")
    print("=" * 60)
    
    auditor.audit_documents()
    auditor.find_dead_code()
    auditor.check_readme_accuracy()
    
    print("=" * 60)
    print("📝 生成审计报告...")
    
    report = auditor.generate_report()
    
    print("=" * 60)
    print("✅ 审计完成！")
    print(f"📊 发现问题: {len(auditor.issues)}个")
    print(f"🗑️  清理候选: {len(auditor.cleanup_candidates)}个")
    print(f"💀 Dead Code: {len(auditor.dead_code)}个")
    print("=" * 60)
    print("📄 查看详细报告: AUDIT_REPORT_v0.8.1.md")

if __name__ == '__main__':
    main()
