#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
死代码检测脚本 - Vue3 + JavaScript 项目
安全策略：保守检测，避免误删
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

class DeadCodeDetector:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.src_dir = self.project_root / 'src'
        
        # 函数定义和引用统计
        self.functions = defaultdict(lambda: {
            'file': '',
            'line': 0,
            'type': '',  # 'function', 'const_function', 'method', 'computed', 'watch'
            'references': 0,
            'definition_count': 0,
            'files_referenced': set()
        })
        
        # 白名单：这些函数即使引用为0也不应删除
        self.whitelist = {
            # Vue生命周期钩子
            'onMounted', 'onUnmounted', 'onBeforeMount', 'onBeforeUnmount',
            'onUpdated', 'onBeforeUpdate', 'onActivated', 'onDeactivated',
            'onErrorCaptured', 'onRenderTracked', 'onRenderTriggered',
            
            # Vue Composition API
            'setup', 'render',
            
            # 导出的函数（可能被外部调用）
            'default', 'main', 'init', 'install',
            
            # 事件处理器（可能在模板中使用）
            'handle', 'on', 'emit',
            
            # 测试相关
            'describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach',
            
            # 常见工具函数前缀
            'use',  # composables
        }
        
        # 动态调用模式（这些函数可能被动态调用）
        self.dynamic_patterns = [
            r'this\.\$emit',  # Vue事件
            r'@click=',  # 模板事件
            r'@\w+=',  # 其他模板事件
            r'v-on:',  # v-on指令
            r'\[.*\]',  # 动态属性访问
            r'window\.',  # 全局对象
            r'eval\(',  # eval调用
            r'new Function',  # 动态函数
        ]
    
    def is_whitelisted(self, func_name):
        """检查函数是否在白名单中"""
        # 完全匹配
        if func_name in self.whitelist:
            return True
        
        # 前缀匹配
        for prefix in ['handle', 'on', 'use', 'init', 'setup']:
            if func_name.startswith(prefix):
                return True
        
        # 后缀匹配
        for suffix in ['Handler', 'Listener', 'Callback']:
            if func_name.endswith(suffix):
                return True
        
        return False
    
    def extract_functions(self, file_path):
        """提取文件中的函数定义"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            return
        
        lines = content.split('\n')
        
        # 正则模式
        patterns = [
            # function声明: function xxx() {}
            (r'^\s*function\s+(\w+)\s*\(', 'function'),
            
            # const/let/var函数: const xxx = () => {}
            (r'^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(.*?\)\s*=>', 'const_function'),
            
            # const/let/var函数: const xxx = function() {}
            (r'^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function', 'const_function'),
            
            # 对象方法: xxx() {}
            (r'^\s*(\w+)\s*\(.*?\)\s*\{', 'method'),
            
            # async函数: async function xxx() {}
            (r'^\s*async\s+function\s+(\w+)\s*\(', 'function'),
            
            # computed: const xxx = computed(() => {})
            (r'^\s*const\s+(\w+)\s*=\s*computed\s*\(', 'computed'),
            
            # watch: watch(() => xxx, ...)
            # 这个不提取，因为watch的函数名不重要
        ]
        
        for line_num, line in enumerate(lines, 1):
            for pattern, func_type in patterns:
                match = re.search(pattern, line)
                if match:
                    func_name = match.group(1)
                    
                    # 跳过特殊名称
                    if func_name in ['if', 'for', 'while', 'switch', 'catch']:
                        continue
                    
                    key = func_name
                    self.functions[key]['file'] = str(file_path.relative_to(self.project_root))
                    self.functions[key]['line'] = line_num
                    self.functions[key]['type'] = func_type
                    self.functions[key]['definition_count'] += 1
    
    def count_references(self, file_path):
        """统计函数引用次数"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            return
        
        # 移除注释（简单处理）
        content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        
        for func_name in self.functions.keys():
            # 查找函数调用：funcName( 或 funcName.
            pattern = rf'\b{re.escape(func_name)}\s*[\(\.]'
            matches = re.findall(pattern, content)
            
            if matches:
                count = len(matches)
                # 减去定义本身（定义行也会匹配到）
                if str(file_path.relative_to(self.project_root)) == self.functions[func_name]['file']:
                    count = max(0, count - 1)
                
                self.functions[func_name]['references'] += count
                if count > 0:
                    self.functions[func_name]['files_referenced'].add(
                        str(file_path.relative_to(self.project_root))
                    )
    
    def scan_project(self):
        """扫描整个项目"""
        print("🔍 开始扫描项目...")
        
        # 获取所有源文件
        files = list(self.src_dir.rglob('*.vue')) + list(self.src_dir.rglob('*.js'))
        print(f"📁 找到 {len(files)} 个文件")
        
        # 第一遍：提取所有函数定义
        print("\n📝 第一遍：提取函数定义...")
        for file_path in files:
            self.extract_functions(file_path)
        
        print(f"✅ 找到 {len(self.functions)} 个函数定义")
        
        # 第二遍：统计引用次数
        print("\n🔢 第二遍：统计引用次数...")
        for file_path in files:
            self.count_references(file_path)
        
        print("✅ 引用统计完成")
    
    def generate_report(self):
        """生成报告"""
        # 分类统计
        unused = []
        low_usage = []
        safe_to_delete = []
        
        for func_name, info in self.functions.items():
            # 跳过白名单
            if self.is_whitelisted(func_name):
                continue
            
            # 跳过多次定义的函数（可能是重载或多个文件中的同名函数）
            if info['definition_count'] > 1:
                continue
            
            if info['references'] == 0:
                unused.append((func_name, info))
                
                # 进一步判断是否安全删除
                # 1. 不是导出的函数
                # 2. 不是事件处理器
                # 3. 文件名不包含test
                if (not func_name.startswith('handle') and 
                    not func_name.startswith('on') and
                    'test' not in info['file'].lower()):
                    safe_to_delete.append((func_name, info))
            
            elif info['references'] <= 2:
                low_usage.append((func_name, info))
        
        # 生成报告
        report = {
            'summary': {
                'total_functions': len(self.functions),
                'unused_functions': len(unused),
                'low_usage_functions': len(low_usage),
                'safe_to_delete': len(safe_to_delete)
            },
            'unused': [],
            'low_usage': [],
            'safe_to_delete': []
        }
        
        # 未使用函数
        for func_name, info in sorted(unused, key=lambda x: x[1]['file']):
            report['unused'].append({
                'name': func_name,
                'file': info['file'],
                'line': info['line'],
                'type': info['type'],
                'references': info['references']
            })
        
        # 低使用率函数
        for func_name, info in sorted(low_usage, key=lambda x: x[1]['references']):
            report['low_usage'].append({
                'name': func_name,
                'file': info['file'],
                'line': info['line'],
                'type': info['type'],
                'references': info['references'],
                'referenced_in': list(info['files_referenced'])
            })
        
        # 安全删除列表
        for func_name, info in sorted(safe_to_delete, key=lambda x: x[1]['file']):
            report['safe_to_delete'].append({
                'name': func_name,
                'file': info['file'],
                'line': info['line'],
                'type': info['type']
            })
        
        return report
    
    def print_report(self, report):
        """打印报告"""
        print("\n" + "="*80)
        print("📊 死代码检测报告")
        print("="*80)
        
        print(f"\n📈 统计摘要:")
        print(f"  • 总函数数: {report['summary']['total_functions']}")
        print(f"  • 未使用函数: {report['summary']['unused_functions']}")
        print(f"  • 低使用率函数 (≤2次): {report['summary']['low_usage_functions']}")
        print(f"  • 建议删除: {report['summary']['safe_to_delete']}")
        
        if report['safe_to_delete']:
            print(f"\n🎯 建议删除的函数 ({len(report['safe_to_delete'])}个):")
            print("-" * 80)
            for item in report['safe_to_delete'][:20]:  # 只显示前20个
                print(f"  ❌ {item['name']}")
                print(f"     文件: {item['file']}:{item['line']}")
                print(f"     类型: {item['type']}")
                print()
            
            if len(report['safe_to_delete']) > 20:
                print(f"  ... 还有 {len(report['safe_to_delete']) - 20} 个函数")
        
        if report['low_usage']:
            print(f"\n⚠️  低使用率函数 ({len(report['low_usage'])}个):")
            print("-" * 80)
            for item in report['low_usage'][:10]:  # 只显示前10个
                print(f"  ⚡ {item['name']} (引用{item['references']}次)")
                print(f"     文件: {item['file']}:{item['line']}")
                if item['referenced_in']:
                    print(f"     引用位置: {', '.join(item['referenced_in'][:3])}")
                print()
            
            if len(report['low_usage']) > 10:
                print(f"  ... 还有 {len(report['low_usage']) - 10} 个函数")
        
        print("\n" + "="*80)
        print("⚠️  安全提示:")
        print("  1. 删除前请仔细检查函数是否在模板中使用（@click等）")
        print("  2. 检查是否有动态调用（this[funcName]、eval等）")
        print("  3. 建议先注释掉函数，测试无误后再删除")
        print("  4. 使用Git保留历史，方便回滚")
        print("="*80)
    
    def save_report(self, report, output_file='dead_code_report.json'):
        """保存报告到JSON文件"""
        output_path = self.project_root / output_file
        
        # 转换set为list（JSON不支持set）
        for item in report['low_usage']:
            if 'referenced_in' in item and isinstance(item['referenced_in'], set):
                item['referenced_in'] = list(item['referenced_in'])
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 详细报告已保存到: {output_file}")


def main():
    # 项目根目录
    project_root = '/Users/zhaosj/Desktop/TO-DO'
    
    # 创建检测器
    detector = DeadCodeDetector(project_root)
    
    # 扫描项目
    detector.scan_project()
    
    # 生成报告
    report = detector.generate_report()
    
    # 打印报告
    detector.print_report(report)
    
    # 保存报告
    detector.save_report(report)
    
    # 生成Markdown报告
    generate_markdown_report(report, project_root)


def generate_markdown_report(report, project_root):
    """生成Markdown格式的报告"""
    md_content = f"""# 死代码检测报告

**生成时间**: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**项目路径**: {project_root}

---

## 📊 统计摘要

| 指标 | 数量 |
|------|------|
| 总函数数 | {report['summary']['total_functions']} |
| 未使用函数 | {report['summary']['unused_functions']} |
| 低使用率函数 (≤2次) | {report['summary']['low_usage_functions']} |
| **建议删除** | **{report['summary']['safe_to_delete']}** |

---

## 🎯 建议删除的函数

以下函数引用次数为0，且不在白名单中，建议删除：

"""
    
    if report['safe_to_delete']:
        md_content += "| 函数名 | 文件 | 行号 | 类型 |\n"
        md_content += "|--------|------|------|------|\n"
        for item in report['safe_to_delete']:
            md_content += f"| `{item['name']}` | {item['file']} | {item['line']} | {item['type']} |\n"
    else:
        md_content += "✅ 未发现可安全删除的函数\n"
    
    md_content += "\n---\n\n## ⚠️ 低使用率函数\n\n"
    md_content += "以下函数引用次数≤2次，建议review是否需要保留：\n\n"
    
    if report['low_usage']:
        md_content += "| 函数名 | 文件 | 行号 | 引用次数 | 引用位置 |\n"
        md_content += "|--------|------|------|----------|----------|\n"
        for item in report['low_usage'][:50]:  # 最多显示50个
            refs = ', '.join(item['referenced_in'][:2]) if item['referenced_in'] else '-'
            md_content += f"| `{item['name']}` | {item['file']} | {item['line']} | {item['references']} | {refs} |\n"
    else:
        md_content += "✅ 未发现低使用率函数\n"
    
    md_content += """
---

## 🛡️ 安全策略

### 白名单机制
以下类型的函数即使引用为0也不会被标记为删除：
- Vue生命周期钩子（onMounted、onUnmounted等）
- 事件处理器（handleXxx、onXxx等）
- Composables（useXxx）
- 导出函数（default、main、init等）
- 测试相关函数

### 动态调用检测
以下情况可能导致误判，需要人工review：
- 模板中的事件绑定（@click、v-on等）
- 动态属性访问（obj[funcName]）
- 全局对象挂载（window.xxx）
- eval或new Function动态调用

### 删除建议
1. ✅ **先注释，后删除**：注释掉函数，测试无误后再删除
2. ✅ **Git保护**：确保代码已提交，方便回滚
3. ✅ **分批删除**：每次删除5-10个函数，逐步验证
4. ✅ **运行测试**：删除后运行完整测试套件
5. ✅ **检查模板**：手动检查Vue模板中是否使用

---

## 📝 使用说明

### 查看详细报告
```bash
cat dead_code_report.json
```

### 搜索特定函数
```bash
grep -r "functionName" src/
```

### 删除函数前的检查清单
- [ ] 确认函数引用次数为0
- [ ] 检查Vue模板中是否使用（@click等）
- [ ] 检查是否有动态调用
- [ ] 先注释掉函数代码
- [ ] 运行项目，测试相关功能
- [ ] 运行测试套件
- [ ] 确认无误后删除

---

**⚠️ 重要提示**: 本报告由自动化工具生成，可能存在误判。删除前请务必人工review！
"""
    
    # 保存Markdown报告
    md_path = Path(project_root) / 'DEAD_CODE_REPORT.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"📄 Markdown报告已保存到: DEAD_CODE_REPORT.md")


if __name__ == '__main__':
    main()
