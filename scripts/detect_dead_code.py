#!/usr/bin/env python3
"""
Dead Code Detection Script for Vue.js Project
检测 Vue 项目中未使用的函数和方法

安全策略：
1. 只检测，不删除
2. 输出详细报告供人工审查
3. 标注可能的误判情况
"""

import os
import re
from collections import defaultdict
from pathlib import Path

# 配置
PROJECT_ROOT = "."
EXTENSIONS = [".vue", ".js", ".ts"]
EXCLUDE_DIRS = ["node_modules", "dist", "build", ".git", "android", "ios"]

# 函数定义模式
FUNCTION_PATTERNS = [
    # JavaScript/TypeScript 函数
    r"function\s+(\w+)\s*\(",
    r"const\s+(\w+)\s*=\s*\([^)]*\)\s*=>",
    r"const\s+(\w+)\s*=\s*function",
    r"(\w+)\s*:\s*function\s*\(",
    r"(\w+)\s*\([^)]*\)\s*{",  # 方法简写
    # Vue Composition API
    r"const\s+(\w+)\s*=\s*ref\(",
    r"const\s+(\w+)\s*=\s*reactive\(",
    r"const\s+(\w+)\s*=\s*computed\(",
]

# 动态调用模式（需要特别注意）
DYNAMIC_PATTERNS = [
    r"\[(\w+)\]",  # obj[funcName]
    r"\.(\w+)\(",  # obj.funcName()
    r"@(\w+)=",    # Vue 事件绑定
    r":(\w+)=",    # Vue 属性绑定
]


def should_skip_dir(dir_path):
    """检查是否应该跳过该目录"""
    for exclude in EXCLUDE_DIRS:
        if exclude in dir_path:
            return True
    return False


def extract_functions(file_path):
    """从文件中提取所有函数定义"""
    functions = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            for pattern in FUNCTION_PATTERNS:
                matches = re.finditer(pattern, content)
                for match in matches:
                    func_name = match.group(1)
                    # 过滤掉常见的非函数名
                    if func_name and not func_name.startswith('_') and len(func_name) > 1:
                        line_num = content[:match.start()].count('\n') + 1
                        functions.append({
                            'name': func_name,
                            'file': file_path,
                            'line': line_num,
                            'pattern': pattern
                        })
    except Exception as e:
        print(f"⚠️  读取文件失败: {file_path} - {e}")
    return functions


def count_references(func_name, project_root):
    """统计函数在整个项目中的引用次数"""
    count = 0
    files_with_refs = []
    
    for root, dirs, files in os.walk(project_root):
        # 跳过排除的目录
        dirs[:] = [d for d in dirs if not should_skip_dir(os.path.join(root, d))]
        
        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # 统计引用次数（排除定义本身）
                        refs = len(re.findall(rf'\b{func_name}\b', content))
                        if refs > 0:
                            count += refs
                            files_with_refs.append((file_path, refs))
                except Exception:
                    pass
    
    return count, files_with_refs


def detect_dynamic_usage(func_name, project_root):
    """检测是否可能存在动态调用"""
    dynamic_hints = []
    
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if not should_skip_dir(os.path.join(root, d))]
        
        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # 检查动态调用模式
                        if re.search(rf'@{func_name}=', content):
                            dynamic_hints.append(f"Vue事件绑定: @{func_name}")
                        if re.search(rf':{func_name}=', content):
                            dynamic_hints.append(f"Vue属性绑定: :{func_name}")
                        if re.search(rf'\["{func_name}"\]', content):
                            dynamic_hints.append(f"对象动态访问: ['{func_name}']")
                except Exception:
                    pass
    
    return dynamic_hints


def main():
    print("🔍 开始检测无用代码...")
    print(f"📁 项目根目录: {os.path.abspath(PROJECT_ROOT)}")
    print(f"📄 扫描文件类型: {', '.join(EXTENSIONS)}")
    print(f"🚫 排除目录: {', '.join(EXCLUDE_DIRS)}\n")
    
    # 收集所有函数定义
    all_functions = []
    file_count = 0
    
    for root, dirs, files in os.walk(PROJECT_ROOT):
        dirs[:] = [d for d in dirs if not should_skip_dir(os.path.join(root, d))]
        
        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                file_path = os.path.join(root, file)
                functions = extract_functions(file_path)
                all_functions.extend(functions)
                file_count += 1
    
    print(f"✅ 扫描完成: {file_count} 个文件, {len(all_functions)} 个函数定义\n")
    
    # 分析引用情况
    print("📊 分析引用情况...\n")
    
    unused_functions = []
    low_usage_functions = []
    
    for func in all_functions:
        func_name = func['name']
        ref_count, ref_files = count_references(func_name, PROJECT_ROOT)
        dynamic_hints = detect_dynamic_usage(func_name, PROJECT_ROOT)
        
        # 引用计数 - 1（排除定义本身）
        actual_refs = ref_count - 1
        
        func['ref_count'] = actual_refs
        func['ref_files'] = ref_files
        func['dynamic_hints'] = dynamic_hints
        
        if actual_refs == 0:
            unused_functions.append(func)
        elif actual_refs <= 2:
            low_usage_functions.append(func)
    
    # 生成报告
    print("=" * 80)
    print("📋 检测报告")
    print("=" * 80)
    
    # 1. 零引用函数（高度可疑）
    print(f"\n🚨 零引用函数 ({len(unused_functions)} 个):")
    print("-" * 80)
    
    if unused_functions:
        for func in sorted(unused_functions, key=lambda x: x['file']):
            print(f"\n函数名: {func['name']}")
            print(f"位置: {func['file']}:{func['line']}")
            if func['dynamic_hints']:
                print(f"⚠️  可能的动态调用: {', '.join(func['dynamic_hints'])}")
            else:
                print("✅ 未检测到动态调用，可能是无用代码")
    else:
        print("✅ 未发现零引用函数")
    
    # 2. 低使用率函数（需要审查）
    print(f"\n\n⚠️  低使用率函数 ({len(low_usage_functions)} 个，引用≤2次):")
    print("-" * 80)
    
    if low_usage_functions:
        for func in sorted(low_usage_functions, key=lambda x: x['ref_count']):
            print(f"\n函数名: {func['name']} (引用 {func['ref_count']} 次)")
            print(f"位置: {func['file']}:{func['line']}")
            if func['ref_files']:
                print(f"引用文件: {func['ref_files'][0][0]}")
    else:
        print("✅ 未发现低使用率函数")
    
    # 3. 安全建议
    print("\n\n" + "=" * 80)
    print("🛡️  安全建议")
    print("=" * 80)
    print("""
1. ⚠️  不要直接删除零引用函数，可能存在以下情况：
   - Vue 模板中的事件处理器（@click="funcName"）
   - 动态调用（obj[funcName]()）
   - 外部调用（通过 window 或 export）
   - 生命周期钩子（mounted、created 等）

2. ✅ 建议的清理流程：
   - 先注释掉函数，观察1-2天
   - 运行完整的测试套件
   - 手动测试所有功能
   - 确认无问题后再删除

3. 🔍 重点检查：
   - 零引用且无动态调用提示的函数
   - 文件名包含 "old"、"backup"、"deprecated" 的函数
   - 注释中标注为 "TODO: remove" 的函数

4. 📝 建议使用 Git：
   - 删除前先提交当前代码
   - 删除后单独提交，便于回滚
    """)
    
    # 4. 统计摘要
    print("\n" + "=" * 80)
    print("📈 统计摘要")
    print("=" * 80)
    print(f"总函数数: {len(all_functions)}")
    print(f"零引用函数: {len(unused_functions)} ({len(unused_functions)/len(all_functions)*100:.1f}%)")
    print(f"低使用率函数: {len(low_usage_functions)} ({len(low_usage_functions)/len(all_functions)*100:.1f}%)")
    print(f"正常使用函数: {len(all_functions) - len(unused_functions) - len(low_usage_functions)}")
    
    # 5. 导出详细报告
    report_file = "dead_code_report.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("Dead Code Detection Report\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("零引用函数列表:\n")
        f.write("-" * 80 + "\n")
        for func in unused_functions:
            f.write(f"{func['name']}\t{func['file']}:{func['line']}\n")
        
        f.write("\n\n低使用率函数列表:\n")
        f.write("-" * 80 + "\n")
        for func in low_usage_functions:
            f.write(f"{func['name']}\t{func['file']}:{func['line']}\t引用{func['ref_count']}次\n")
    
    print(f"\n📄 详细报告已导出: {report_file}")
    print("\n✅ 检测完成！")


if __name__ == "__main__":
    main()
