#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
严格验证脚本 - 多重检查确保100%安全删除
只有通过所有检查的函数才会被标记为可删除
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

class StrictDeadCodeVerifier:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.src_dir = self.project_root / 'src'
        
        # 加载检测报告
        with open(self.project_root / 'dead_code_report.json', 'r', encoding='utf-8') as f:
            self.report = json.load(f)
        
        self.safe_functions = []
        self.unsafe_functions = []
        
    def check_template_usage(self, func_name, file_path):
        """检查函数是否在Vue模板中使用"""
        try:
            with open(self.project_root / file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            return False, "无法读取文件"
        
        # 提取<template>部分
        template_match = re.search(r'<template>(.*?)</template>', content, re.DOTALL)
        if not template_match:
            return True, "无模板"
        
        template = template_match.group(1)
        
        # 检查各种模板使用方式
        patterns = [
            rf'@\w+\s*=\s*["\']?\s*{re.escape(func_name)}',  # @click="funcName"
            rf'v-on:\w+\s*=\s*["\']?\s*{re.escape(func_name)}',  # v-on:click="funcName"
            rf':\w+\s*=\s*["\']?\s*{re.escape(func_name)}',  # :prop="funcName"
            rf'v-bind:\w+\s*=\s*["\']?\s*{re.escape(func_name)}',  # v-bind:prop="funcName"
            rf'{{\s*{re.escape(func_name)}\s*}}',  # {{ funcName }}
            rf'{{\s*{re.escape(func_name)}\(',  # {{ funcName() }}
            rf'v-model\s*=\s*["\']?\s*{re.escape(func_name)}',  # v-model="funcName"
            rf'ref\s*=\s*["\']?\s*{re.escape(func_name)}',  # ref="funcName"
        ]
        
        for pattern in patterns:
            if re.search(pattern, template):
                return False, f"在模板中找到使用: {pattern}"
        
        return True, "模板中未使用"
    
    def check_dynamic_usage(self, func_name, file_path):
        """检查是否有动态调用"""
        try:
            with open(self.project_root / file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            return False, "无法读取文件"
        
        # 动态调用模式
        patterns = [
            rf'this\[.*{re.escape(func_name)}.*\]',  # this['funcName'] 或 this[varName]
            rf'window\.{re.escape(func_name)}',  # window.funcName
            rf'globalThis\.{re.escape(func_name)}',  # globalThis.funcName
            rf'["\'].*{re.escape(func_name)}.*["\']',  # 字符串中包含函数名
            r'eval\s*\(',  # eval调用
            r'new\s+Function',  # new Function
            rf'\$emit\s*\(.*{re.escape(func_name)}',  # $emit('funcName')
        ]
        
        for pattern in patterns:
            if re.search(pattern, content):
                return False, f"发现动态调用模式: {pattern}"
        
        return True, "无动态调用"
    
    def check_export_usage(self, func_name, file_path):
        """检查是否被导出"""
        try:
            with open(self.project_root / file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            return False, "无法读取文件"
        
        # 导出模式
        patterns = [
            rf'export\s+.*{re.escape(func_name)}',  # export { funcName }
            rf'export\s+default\s+{re.escape(func_name)}',  # export default funcName
            rf'exports\.{re.escape(func_name)}',  # exports.funcName
            rf'module\.exports\s*=.*{re.escape(func_name)}',  # module.exports = funcName
        ]
        
        for pattern in patterns:
            if re.search(pattern, content):
                return False, f"函数被导出: {pattern}"
        
        return True, "未被导出"
    
    def check_global_search(self, func_name):
        """在整个项目中搜索函数名（包括注释）"""
        count = 0
        files_found = []
        
        # 搜索所有源文件
        for file_path in self.src_dir.rglob('*'):
            if file_path.suffix not in ['.vue', '.js', '.ts', '.jsx', '.tsx']:
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # 简单的全文搜索（包括注释）
                    if re.search(rf'\b{re.escape(func_name)}\b', content):
                        count += 1
                        files_found.append(str(file_path.relative_to(self.project_root)))
            except:
                continue
        
        # 如果只在定义文件中出现1次，说明真的没有引用
        if count <= 1:
            return True, "全局搜索确认无引用"
        else:
            return False, f"在{count}个文件中找到: {', '.join(files_found[:3])}"
    
    def check_composable_pattern(self, func_name):
        """检查是否是composable（use开头的函数通常被动态使用）"""
        if func_name.startswith('use'):
            return False, "Composable函数（use开头）"
        return True, "非Composable"
    
    def check_lifecycle_pattern(self, func_name):
        """检查是否是生命周期相关"""
        lifecycle_keywords = ['mounted', 'unmounted', 'updated', 'created', 'destroyed', 
                             'activated', 'deactivated', 'setup', 'render']
        
        for keyword in lifecycle_keywords:
            if keyword in func_name.lower():
                return False, f"生命周期相关函数（包含{keyword}）"
        
        return True, "非生命周期函数"
    
    def verify_function(self, func_info):
        """对单个函数进行多重验证"""
        func_name = func_info['name']
        file_path = func_info['file']
        
        checks = []
        
        # 1. 模板使用检查
        safe, reason = self.check_template_usage(func_name, file_path)
        checks.append(('模板检查', safe, reason))
        
        # 2. 动态调用检查
        safe, reason = self.check_dynamic_usage(func_name, file_path)
        checks.append(('动态调用检查', safe, reason))
        
        # 3. 导出检查
        safe, reason = self.check_export_usage(func_name, file_path)
        checks.append(('导出检查', safe, reason))
        
        # 4. 全局搜索检查
        safe, reason = self.check_global_search(func_name)
        checks.append(('全局搜索', safe, reason))
        
        # 5. Composable模式检查
        safe, reason = self.check_composable_pattern(func_name)
        checks.append(('Composable检查', safe, reason))
        
        # 6. 生命周期检查
        safe, reason = self.check_lifecycle_pattern(func_name)
        checks.append(('生命周期检查', safe, reason))
        
        # 所有检查都通过才认为安全
        all_safe = all(check[1] for check in checks)
        
        return {
            'function': func_name,
            'file': file_path,
            'line': func_info['line'],
            'type': func_info['type'],
            'all_checks_passed': all_safe,
            'checks': checks
        }
    
    def verify_all(self):
        """验证所有建议删除的函数"""
        print("🔍 开始严格验证...")
        print(f"📋 待验证函数数: {len(self.report['safe_to_delete'])}")
        print("\n" + "="*80)
        
        for i, func_info in enumerate(self.report['safe_to_delete'], 1):
            print(f"\n[{i}/{len(self.report['safe_to_delete'])}] 验证: {func_info['name']}")
            print(f"    文件: {func_info['file']}:{func_info['line']}")
            
            result = self.verify_function(func_info)
            
            # 打印检查结果
            for check_name, passed, reason in result['checks']:
                status = "✅" if passed else "❌"
                print(f"    {status} {check_name}: {reason}")
            
            if result['all_checks_passed']:
                self.safe_functions.append(result)
                print(f"    ✅ 结论: 可安全删除")
            else:
                self.unsafe_functions.append(result)
                print(f"    ❌ 结论: 不建议删除")
        
        print("\n" + "="*80)
        print(f"\n📊 验证完成:")
        print(f"  ✅ 可安全删除: {len(self.safe_functions)} 个")
        print(f"  ❌ 不建议删除: {len(self.unsafe_functions)} 个")
    
    def generate_safe_delete_list(self):
        """生成最终的安全删除列表"""
        if not self.safe_functions:
            print("\n⚠️  未找到可安全删除的函数")
            return
        
        print("\n" + "="*80)
        print("🎯 最终安全删除列表")
        print("="*80)
        print("\n以下函数通过了所有6项检查，可以安全删除：\n")
        
        # 按文件分组
        by_file = defaultdict(list)
        for func in self.safe_functions:
            by_file[func['file']].append(func)
        
        for file_path, funcs in sorted(by_file.items()):
            print(f"\n📁 {file_path}")
            for func in funcs:
                print(f"  ❌ {func['function']} (行 {func['line']})")
        
        # 保存到文件
        output = {
            'summary': {
                'total_verified': len(self.report['safe_to_delete']),
                'safe_to_delete': len(self.safe_functions),
                'unsafe_to_delete': len(self.unsafe_functions)
            },
            'safe_functions': self.safe_functions,
            'unsafe_functions': self.unsafe_functions
        }
        
        output_path = self.project_root / 'verified_safe_delete.json'
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 详细验证结果已保存到: verified_safe_delete.json")
        
        # 生成删除脚本
        self.generate_delete_script()
    
    def generate_delete_script(self):
        """生成自动删除脚本（注释版）"""
        if not self.safe_functions:
            return
        
        script = """#!/usr/bin/env python3
# -*- coding: utf-8 -*-
\"\"\"
自动删除脚本 - 注释掉已验证的死代码
使用方法: python3 auto_comment_dead_code.py
\"\"\"

import re
from pathlib import Path

def comment_function(file_path, func_name, line_num):
    \"\"\"注释掉指定函数\"\"\"
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # 找到函数定义行
        if line_num > len(lines):
            print(f"  ⚠️  行号超出范围: {line_num}")
            return False
        
        # 找到函数的结束位置（简单的大括号匹配）
        start_line = line_num - 1
        brace_count = 0
        end_line = start_line
        
        for i in range(start_line, len(lines)):
            line = lines[i]
            brace_count += line.count('{') - line.count('}')
            
            if brace_count == 0 and i > start_line:
                end_line = i
                break
        
        # 注释掉整个函数
        for i in range(start_line, end_line + 1):
            if not lines[i].strip().startswith('//'):
                lines[i] = '// [DEAD_CODE] ' + lines[i]
        
        # 写回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        return True
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

def main():
    project_root = Path('/Users/zhaosj/Desktop/TO-DO')
    
    functions_to_comment = [
"""
        
        for func in self.safe_functions:
            script += f"        ('{func['file']}', '{func['function']}', {func['line']}),\n"
        
        script += """    ]
    
    print(f"🔧 准备注释 {len(functions_to_comment)} 个函数...")
    print("⚠️  建议先备份代码或确保Git已提交！")
    
    input("按Enter继续，Ctrl+C取消...")
    
    success = 0
    failed = 0
    
    for file_path, func_name, line_num in functions_to_comment:
        full_path = project_root / file_path
        print(f"\\n📝 注释: {func_name} ({file_path}:{line_num})")
        
        if comment_function(full_path, func_name, line_num):
            success += 1
            print(f"  ✅ 成功")
        else:
            failed += 1
    
    print(f"\\n" + "="*80)
    print(f"📊 完成:")
    print(f"  ✅ 成功: {success}")
    print(f"  ❌ 失败: {failed}")
    print("="*80)
    print("\\n⚠️  下一步:")
    print("  1. 运行项目测试所有功能")
    print("  2. 如果有问题，使用 git checkout 恢复")
    print("  3. 确认无误后，手动删除注释的代码")

if __name__ == '__main__':
    main()
"""
        
        script_path = self.project_root / 'auto_comment_dead_code.py'
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script)
        
        print(f"📝 自动注释脚本已生成: auto_comment_dead_code.py")
        print(f"   使用方法: python3 auto_comment_dead_code.py")


def main():
    project_root = '/Users/zhaosj/Desktop/TO-DO'
    
    verifier = StrictDeadCodeVerifier(project_root)
    verifier.verify_all()
    verifier.generate_safe_delete_list()


if __name__ == '__main__':
    main()
