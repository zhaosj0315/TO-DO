#!/usr/bin/env python3
"""
Dead Code Detector for Vue.js Project
检测未使用的函数、组件、服务

安全策略：
1. 只检测，不删除
2. 生成详细报告供人工审核
3. 标注可能的误判情况
"""

import os
import re
import json
from collections import defaultdict
from pathlib import Path

# 项目配置
PROJECT_ROOT = "/Users/zhaosj/Desktop/TO-DO"
SRC_DIR = os.path.join(PROJECT_ROOT, "src")

# 排除的目录
EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'android', 'ios', 'release']

# 排除的函数名（Vue生命周期钩子、保留字等）
EXCLUDE_FUNCTIONS = {
    # Vue 3 生命周期
    'setup', 'onMounted', 'onUnmounted', 'onBeforeMount', 'onBeforeUnmount',
    'onUpdated', 'onBeforeUpdate', 'onActivated', 'onDeactivated',
    'onErrorCaptured', 'onRenderTracked', 'onRenderTriggered',
    # Vue 2 生命周期
    'data', 'methods', 'computed', 'watch', 'props', 'emits',
    'beforeCreate', 'created', 'beforeMount', 'mounted',
    'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed',
    # 常见方法
    'render', 'default', 'main', 'init', 'constructor',
    # 单字母变量
    'i', 'j', 'k', 'x', 'y', 'z', 'e', 't', 'v', 'n', 'm',
}

# 函数定义模式
FUNCTION_PATTERNS = [
    (r'function\s+(\w+)\s*\(', 'function declaration'),
    (r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>', 'arrow function'),
    (r'const\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>', 'async arrow function'),
    (r'async\s+function\s+(\w+)\s*\(', 'async function'),
    (r'(\w+)\s*:\s*function\s*\(', 'object method'),
    (r'(\w+)\s*:\s*async\s*function\s*\(', 'async object method'),
]

def should_exclude_dir(dir_name):
    """判断是否应该排除该目录"""
    return dir_name in EXCLUDE_DIRS or dir_name.startswith('.')

def find_all_functions(file_path):
    """查找文件中定义的所有函数"""
    functions = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            for pattern, func_type in FUNCTION_PATTERNS:
                for match in re.finditer(pattern, content):
                    func_name = match.group(1)
                    if func_name not in EXCLUDE_FUNCTIONS and len(func_name) > 1:
                        functions.append({
                            'name': func_name,
                            'type': func_type,
                            'line': content[:match.start()].count('\n') + 1
                        })
    except Exception as e:
        print(f"⚠️  Error reading {file_path}: {e}")
    return functions

def count_references(function_name, search_dir):
    """统计函数在项目中的引用次数"""
    references = []
    
    for root, dirs, files in os.walk(search_dir):
        # 过滤排除目录
        dirs[:] = [d for d in dirs if not should_exclude_dir(d)]
        
        for file in files:
            if file.endswith(('.vue', '.js', '.ts')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # 使用单词边界匹配
                        pattern = r'\b' + re.escape(function_name) + r'\b'
                        matches = list(re.finditer(pattern, content))
                        
                        for match in matches:
                            line_num = content[:match.start()].count('\n') + 1
                            references.append({
                                'file': file_path.replace(PROJECT_ROOT, ''),
                                'line': line_num
                            })
                except Exception:
                    pass
    
    return references

def check_dynamic_usage(function_name, file_path):
    """检查是否有动态调用的可能"""
    dynamic_patterns = [
        r'this\[',  # this[xxx]
        r'window\[',  # window[xxx]
        r'@click=',  # Vue模板事件
        r'v-on:',  # Vue模板事件
        r'addEventListener',  # 事件监听
        r'router\.',  # 路由相关
        r'emit\(',  # Vue emit
    ]
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            for pattern in dynamic_patterns:
                if re.search(pattern, content):
                    return True
    except Exception:
        pass
    
    return False

def detect_dead_code():
    """检测死代码"""
    print("🔍 开始扫描项目文件...")
    
    all_files = []
    for root, dirs, files in os.walk(SRC_DIR):
        dirs[:] = [d for d in dirs if not should_exclude_dir(d)]
        for file in files:
            if file.endswith(('.vue', '.js')):
                all_files.append(os.path.join(root, file))
    
    print(f"📁 找到 {len(all_files)} 个源文件")
    print("🔍 开始分析函数定义和引用...\n")
    
    results = {
        'dead_functions': [],
        'suspicious_functions': [],
        'safe_functions': [],
        'total_scanned': 0
    }
    
    for file_path in all_files:
        functions = find_all_functions(file_path)
        results['total_scanned'] += len(functions)
        
        for func_info in functions:
            func_name = func_info['name']
            references = count_references(func_name, SRC_DIR)
            has_dynamic = check_dynamic_usage(func_name, file_path)
            
            ref_count = len(references)
            
            item = {
                'file': file_path.replace(PROJECT_ROOT, ''),
                'function': func_name,
                'type': func_info['type'],
                'line': func_info['line'],
                'references': ref_count,
                'reference_locations': references[:5],  # 只保留前5个引用位置
                'has_dynamic_usage': has_dynamic
            }
            
            # 分类
            if ref_count == 1 and not has_dynamic:
                # 只有定义，没有调用，且没有动态使用迹象
                results['dead_functions'].append(item)
            elif ref_count <= 2 and not has_dynamic:
                # 引用很少，可能未使用
                results['suspicious_functions'].append(item)
            else:
                # 正常使用
                results['safe_functions'].append(item)
    
    return results

def generate_report(results):
    """生成清理报告"""
    report_path = os.path.join(PROJECT_ROOT, 'DEAD_CODE_REPORT.md')
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# 死代码检测报告\n\n")
        f.write(f"**生成时间**: {Path(__file__).stat().st_mtime}\n")
        f.write(f"**扫描目录**: {SRC_DIR}\n")
        f.write(f"**扫描函数总数**: {results['total_scanned']}\n\n")
        
        f.write("---\n\n")
        
        # 死代码列表
        f.write(f"## ❌ 确认未使用的函数 ({len(results['dead_functions'])})\n\n")
        f.write("**建议**: 可以安全删除\n\n")
        
        for item in results['dead_functions']:
            f.write(f"### {item['function']}\n")
            f.write(f"- **文件**: `{item['file']}`\n")
            f.write(f"- **行号**: {item['line']}\n")
            f.write(f"- **类型**: {item['type']}\n")
            f.write(f"- **引用次数**: {item['references']}\n")
            f.write(f"- **动态调用**: {'可能' if item['has_dynamic_usage'] else '否'}\n\n")
        
        # 可疑函数列表
        f.write(f"\n## ⚠️  可疑函数 ({len(results['suspicious_functions'])})\n\n")
        f.write("**建议**: 需要人工审核\n\n")
        
        for item in results['suspicious_functions']:
            f.write(f"### {item['function']}\n")
            f.write(f"- **文件**: `{item['file']}`\n")
            f.write(f"- **行号**: {item['line']}\n")
            f.write(f"- **类型**: {item['type']}\n")
            f.write(f"- **引用次数**: {item['references']}\n")
            f.write(f"- **动态调用**: {'可能' if item['has_dynamic_usage'] else '否'}\n")
            
            if item['reference_locations']:
                f.write(f"- **引用位置**:\n")
                for ref in item['reference_locations']:
                    f.write(f"  - `{ref['file']}:{ref['line']}`\n")
            f.write("\n")
        
        # 统计信息
        f.write(f"\n## 📊 统计信息\n\n")
        f.write(f"- 扫描函数总数: {results['total_scanned']}\n")
        f.write(f"- 确认未使用: {len(results['dead_functions'])}\n")
        f.write(f"- 可疑函数: {len(results['suspicious_functions'])}\n")
        f.write(f"- 正常使用: {len(results['safe_functions'])}\n")
        f.write(f"- 清理潜力: {len(results['dead_functions']) + len(results['suspicious_functions'])} 个函数\n\n")
        
        f.write("---\n\n")
        f.write("## ⚠️  注意事项\n\n")
        f.write("1. **动态调用**: 标记为\"可能\"的函数可能通过动态方式调用，删除前需仔细检查\n")
        f.write("2. **模板使用**: Vue模板中使用的函数可能未被检测到，需人工确认\n")
        f.write("3. **导出函数**: 导出的函数可能被外部模块使用，不应删除\n")
        f.write("4. **测试代码**: 测试文件中的函数可能只在测试时使用\n\n")
    
    print(f"✅ 报告已生成: {report_path}")
    
    # 同时生成JSON格式
    json_path = os.path.join(PROJECT_ROOT, 'DEAD_CODE_REPORT.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"✅ JSON报告已生成: {json_path}")

if __name__ == '__main__':
    print("=" * 60)
    print("🔍 死代码检测工具 v1.0")
    print("=" * 60)
    print()
    
    results = detect_dead_code()
    
    print("\n" + "=" * 60)
    print("📊 检测完成！")
    print("=" * 60)
    print(f"✅ 扫描函数总数: {results['total_scanned']}")
    print(f"❌ 确认未使用: {len(results['dead_functions'])}")
    print(f"⚠️  可疑函数: {len(results['suspicious_functions'])}")
    print(f"✓  正常使用: {len(results['safe_functions'])}")
    print()
    
    generate_report(results)
    
    print("\n💡 下一步:")
    print("1. 查看 DEAD_CODE_REPORT.md 了解详情")
    print("2. 人工审核\"确认未使用\"和\"可疑函数\"列表")
    print("3. 确认安全后再删除代码")
