#!/usr/bin/env python3
"""
Dead Code Detector for Vue/JS project
输出"引用计数为0"的函数，供人工确认后删除。
安全策略：只检测，不修改任何文件。
"""
import os, re
from collections import defaultdict

SRC_DIRS = ['src']
EXTS = ('.vue', '.js')

# 收集所有源码
all_files = []
for d in SRC_DIRS:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith(EXTS):
                all_files.append(os.path.join(root, f))

all_code = ''
file_contents = {}
for fp in all_files:
    with open(fp, encoding='utf-8', errors='ignore') as f:
        content = f.read()
        file_contents[fp] = content
        all_code += content + '\n'

# 提取函数定义（function xxx / const xxx = / function xxx(）
func_pattern = re.compile(
    r'(?:^|\n)\s*(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\('
    r'|(?:^|\n)\s*(?:export\s+)?(?:async\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\('
    r'|(?:^|\n)\s*(?:export\s+)?(?:async\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?function'
)

defined_funcs = defaultdict(list)  # name -> [file, ...]
for fp, content in file_contents.items():
    for m in func_pattern.finditer(content):
        name = m.group(1) or m.group(2) or m.group(3)
        if name:
            defined_funcs[name].append(fp)

# 动态调用风险词（跳过这些函数，防止误判）
DYNAMIC_RISK = {
    # Vue 生命周期
    'onMounted','onUnmounted','onBeforeUnmount','onUpdated','onBeforeMount',
    # 常见动态调用模式
    'setup','install','main',
    # 导出的工具函数（可能被外部引用）
    'defineExpose',
}

# 统计引用次数（排除定义行本身）
results = []
for name, def_files in defined_funcs.items():
    if name in DYNAMIC_RISK:
        continue
    if len(name) <= 2:  # 太短的名字跳过，误判率高
        continue
    
    # 统计在所有代码中出现的次数
    count = len(re.findall(r'\b' + re.escape(name) + r'\b', all_code))
    # 减去定义本身的出现次数（每个定义文件至少1次）
    definition_count = len(def_files)
    ref_count = count - definition_count
    
    if ref_count == 0:
        results.append((name, def_files, count))

# 输出报告
print(f"{'='*60}")
print(f"Dead Code 检测报告")
print(f"扫描文件数: {len(all_files)}")
print(f"发现函数定义数: {len(defined_funcs)}")
print(f"疑似未使用函数: {len(results)}")
print(f"{'='*60}\n")

print("⚠️  以下函数引用计数为0，请人工确认后再决定是否删除：")
print("（注意：动态调用、模板中调用、defineExpose暴露的函数可能被误判）\n")

for name, files, total in sorted(results, key=lambda x: x[0]):
    print(f"  函数名: {name}")
    for f in files:
        print(f"    定义于: {f}")
    print()

print(f"\n{'='*60}")
print("安全提示：")
print("1. 模板中 @click='xxx' 调用的函数不会被此脚本检测到 → 需人工核查")
print("2. defineExpose 暴露给父组件的函数 → 已跳过检测")
print("3. 动态调用如 obj[methodName]() → 无法静态检测，需人工核查")
print("4. 建议：先注释掉函数，运行测试，确认无报错后再删除")
