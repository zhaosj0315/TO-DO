#!/usr/bin/env python3
"""
项目审计和清理工具 v0.7.12
功能：
1. 检测未使用的函数（Dead Code）
2. 扫描过程性文档
3. 生成清理报告
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# 配置
PROJECT_ROOT = Path(__file__).parent
EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist', 'build', 'android', 'ios', 
    'release', 'docs_backup_20260303_170852', '.gradle', '.kotlin',
    'tests', '__tests__'
}
EXCLUDE_FILES = {
    'audit-and-cleanup.py', 'detect-dead-code.py'
}

# 代码文件扩展名
CODE_EXTENSIONS = {'.js', '.vue', '.ts', '.jsx', '.tsx'}
# 文档文件扩展名
DOC_EXTENSIONS = {'.md'}

class ProjectAuditor:
    def __init__(self):
        self.functions = defaultdict(lambda: {'defined': [], 'called': []})
        self.components = defaultdict(lambda: {'defined': [], 'imported': []})
        self.docs = []
        self.process_docs = []
        
    def scan_code_files(self):
        """扫描所有代码文件"""
        print("📂 扫描代码文件...")
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # 排除目录
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                    
                file_path = Path(root) / file
                if file_path.suffix in CODE_EXTENSIONS:
                    self._analyze_code_file(file_path)
    
    def _analyze_code_file(self, file_path):
        """分析单个代码文件"""
        try:
            content = file_path.read_text(encoding='utf-8')
            rel_path = file_path.relative_to(PROJECT_ROOT)
            
            # 检测函数定义
            # JavaScript/Vue: function xxx, const xxx = function, const xxx = ()
            func_patterns = [
                r'function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(',
                r'const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\([^)]*\)\s*=>)',
                r'export\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)',
                r'([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:async\s+)?function',
            ]
            
            for pattern in func_patterns:
                for match in re.finditer(pattern, content):
                    func_name = match.group(1)
                    # 排除常见的非函数名
                    if func_name not in {'if', 'for', 'while', 'switch', 'catch', 'return'}:
                        self.functions[func_name]['defined'].append(str(rel_path))
            
            # 检测Vue组件定义
            component_pattern = r'<script[^>]*>.*?export\s+default\s+{.*?name:\s*[\'"]([^\'"]+)[\'"]'
            for match in re.finditer(component_pattern, content, re.DOTALL):
                comp_name = match.group(1)
                self.components[comp_name]['defined'].append(str(rel_path))
            
        except Exception as e:
            print(f"⚠️  读取文件失败: {file_path} - {e}")
    
    def detect_function_calls(self):
        """检测函数调用"""
        print("🔍 检测函数调用...")
        for root, dirs, files in os.walk(PROJECT_ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                    
                file_path = Path(root) / file
                if file_path.suffix in CODE_EXTENSIONS:
                    self._detect_calls_in_file(file_path)
    
    def _detect_calls_in_file(self, file_path):
        """检测文件中的函数调用"""
        try:
            content = file_path.read_text(encoding='utf-8')
            rel_path = file_path.relative_to(PROJECT_ROOT)
            
            for func_name in self.functions.keys():
                # 检测函数调用模式
                call_patterns = [
                    rf'\b{func_name}\s*\(',  # 直接调用
                    rf'\.{func_name}\s*\(',  # 方法调用
                    rf'@{func_name}',        # Vue事件绑定
                    rf':{func_name}',        # Vue属性绑定
                ]
                
                for pattern in call_patterns:
                    if re.search(pattern, content):
                        self.functions[func_name]['called'].append(str(rel_path))
                        break
                        
        except Exception as e:
            pass
    
    def scan_documents(self):
        """扫描文档文件"""
        print("📄 扫描文档文件...")
        for root, dirs, files in os.walk(PROJECT_ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix in DOC_EXTENSIONS:
                    rel_path = file_path.relative_to(PROJECT_ROOT)
                    self.docs.append(str(rel_path))
                    
                    # 判断是否为过程性文档
                    if self._is_process_doc(file_path):
                        self.process_docs.append(str(rel_path))
    
    def _is_process_doc(self, file_path):
        """判断是否为过程性文档"""
        process_keywords = [
            'AUDIT', 'CLEANUP', 'FIX', 'IMPLEMENTATION', 'COMPLETE',
            'REPORT', 'SUMMARY', 'CHECKLIST', 'PLAN', 'GUIDE',
            'TODO', 'DRAFT', 'TEMP', 'WIP', 'DEBUG', 'TEST',
            'PROGRESS', 'STATUS', 'LOG', 'ISSUE'
        ]
        
        filename = file_path.name.upper()
        return any(keyword in filename for keyword in process_keywords)
    
    def generate_report(self):
        """生成审计报告"""
        print("\n" + "="*80)
        print("📊 项目审计报告")
        print("="*80)
        
        # 1. Dead Code 报告
        print("\n## 1. 未使用函数检测（Dead Code）\n")
        dead_functions = []
        for func_name, info in self.functions.items():
            if info['defined'] and not info['called']:
                # 排除特殊函数
                if not self._is_special_function(func_name):
                    dead_functions.append({
                        'name': func_name,
                        'defined_in': info['defined']
                    })
        
        if dead_functions:
            print(f"⚠️  发现 {len(dead_functions)} 个可能未使用的函数：\n")
            for func in sorted(dead_functions, key=lambda x: x['name']):
                print(f"  - {func['name']}")
                for file in func['defined_in']:
                    print(f"    定义于: {file}")
        else:
            print("✅ 未发现明显的未使用函数")
        
        # 2. 过程性文档报告
        print(f"\n## 2. 过程性文档检测\n")
        print(f"📄 总文档数: {len(self.docs)}")
        print(f"🗑️  过程性文档: {len(self.process_docs)}\n")
        
        if self.process_docs:
            print("建议清理的过程性文档：\n")
            for doc in sorted(self.process_docs):
                print(f"  - {doc}")
        
        # 3. 生成JSON报告
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'version': '0.7.12',
            'dead_functions': dead_functions,
            'process_docs': self.process_docs,
            'statistics': {
                'total_functions': len(self.functions),
                'dead_functions': len(dead_functions),
                'total_docs': len(self.docs),
                'process_docs': len(self.process_docs)
            }
        }
        
        report_file = PROJECT_ROOT / 'AUDIT_REPORT_v0.7.12.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ 详细报告已保存至: {report_file}")
        
        return report_data
    
    def _is_special_function(self, func_name):
        """判断是否为特殊函数（生命周期、事件处理等）"""
        special_patterns = [
            r'^on[A-Z]',      # 事件处理: onClick, onSubmit
            r'^handle[A-Z]',  # 事件处理: handleClick
            r'^use[A-Z]',     # Composables: useStore
            r'^setup$',       # Vue setup
            r'^mounted$',     # Vue生命周期
            r'^created$',
            r'^beforeMount$',
            r'^updated$',
            r'^destroyed$',
        ]
        
        return any(re.match(pattern, func_name) for pattern in special_patterns)

def main():
    print("🚀 启动项目审计工具 v0.7.12\n")
    
    auditor = ProjectAuditor()
    
    # 执行扫描
    auditor.scan_code_files()
    auditor.detect_function_calls()
    auditor.scan_documents()
    
    # 生成报告
    report = auditor.generate_report()
    
    print("\n" + "="*80)
    print("✅ 审计完成！")
    print("="*80)
    
    # 安全提示
    print("\n⚠️  安全提示：")
    print("  1. Dead Code检测可能存在误报（动态调用、字符串调用等）")
    print("  2. 删除前请人工确认每个函数")
    print("  3. 建议先注释代码，测试无误后再删除")
    print("  4. 过程性文档建议移动到 docs_backup 而非直接删除")

if __name__ == '__main__':
    main()
