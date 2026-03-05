#!/usr/bin/env python3
"""
Dead Code 检测器 - 零风险版本
检测Vue/JS项目中未使用的函数和方法
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

class DeadCodeDetector:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.functions = {}  # {name: [locations]}
        self.references = defaultdict(int)  # {name: count}
        self.safe_patterns = []  # 安全模式（不删除）
        
    def scan_project(self):
        """扫描项目文件"""
        print("🔍 扫描项目文件...")
        
        # 扫描src目录下的js和vue文件
        js_files = list(self.project_root.glob('src/**/*.js'))
        vue_files = list(self.project_root.glob('src/**/*.vue'))
        
        all_files = js_files + vue_files
        
        for file_path in all_files:
            if self._should_skip(file_path):
                continue
            self._scan_file(file_path)
        
        print(f"✅ 扫描完成: 扫描了 {len(all_files)} 个文件，找到 {len(self.functions)} 个函数定义")
        
    def _should_skip(self, file_path):
        """跳过不需要扫描的文件"""
        skip_patterns = [
            'node_modules',
            '.spec.js',
            '.test.js',
            '__tests__',
            'dist',
            'build'
        ]
        return any(pattern in str(file_path) for pattern in skip_patterns)
    
    def _scan_file(self, file_path):
        """扫描单个文件"""
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # 查找函数定义
            self._find_function_definitions(file_path, content)
            
            # 查找函数引用
            self._find_function_references(content)
            
        except Exception as e:
            print(f"⚠️  读取文件失败: {file_path} - {e}")
    
    def _find_function_definitions(self, file_path, content):
        """查找函数定义"""
        patterns = [
            # JavaScript函数
            r'function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(',
            r'const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function',
            r'const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>',
            r'let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function',
            r'var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function',
            
            # Vue Composition API
            r'const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>',
            
            # 对象方法
            r'([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{',
            
            # async函数
            r'async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(',
            r'async\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{',
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, content):
                func_name = match.group(1)
                
                # 跳过Vue生命周期和保留字
                if self._is_safe_function(func_name):
                    continue
                
                if func_name not in self.functions:
                    self.functions[func_name] = []
                
                self.functions[func_name].append({
                    'file': str(file_path.relative_to(self.project_root)),
                    'line': content[:match.start()].count('\n') + 1
                })
    
    def _find_function_references(self, content):
        """查找函数引用"""
        for func_name in self.functions.keys():
            # 使用词边界匹配，避免误判
            pattern = r'\b' + re.escape(func_name) + r'\b'
            matches = re.findall(pattern, content)
            self.references[func_name] += len(matches)
    
    def _is_safe_function(self, name):
        """判断是否为安全函数（不应删除）"""
        safe_keywords = [
            # Vue生命周期
            'onMounted', 'onUnmounted', 'onBeforeMount', 'onBeforeUnmount',
            'onUpdated', 'onBeforeUpdate', 'onActivated', 'onDeactivated',
            'onErrorCaptured', 'onRenderTracked', 'onRenderTriggered',
            
            # Vue Composition API
            'setup', 'render',
            
            # 常见钩子
            'created', 'mounted', 'updated', 'destroyed',
            'beforeCreate', 'beforeMount', 'beforeUpdate', 'beforeDestroy',
            
            # 事件处理器
            'handle', 'on',
            
            # 导出函数
            'default', 'main', 'init',
            
            # 测试相关
            'test', 'describe', 'it', 'expect',
        ]
        
        # 检查是否包含安全关键字
        for keyword in safe_keywords:
            if keyword.lower() in name.lower():
                return True
        
        # 检查是否为私有函数（_开头）
        if name.startswith('_'):
            return True
        
        return False
    
    def analyze(self):
        """分析结果"""
        print("\n📊 分析结果...")
        
        dead_functions = []
        suspicious_functions = []
        
        for func_name, locations in self.functions.items():
            ref_count = self.references.get(func_name, 0)
            
            # 减去定义本身的引用
            actual_refs = ref_count - len(locations)
            
            if actual_refs == 0:
                dead_functions.append({
                    'name': func_name,
                    'locations': locations,
                    'references': 0
                })
            elif actual_refs == 1:
                suspicious_functions.append({
                    'name': func_name,
                    'locations': locations,
                    'references': 1
                })
        
        return dead_functions, suspicious_functions
    
    def generate_report(self, dead_functions, suspicious_functions):
        """生成报告"""
        report = {
            'summary': {
                'total_functions': len(self.functions),
                'dead_functions': len(dead_functions),
                'suspicious_functions': len(suspicious_functions),
                'safe_functions': len(self.functions) - len(dead_functions) - len(suspicious_functions)
            },
            'dead_functions': dead_functions,
            'suspicious_functions': suspicious_functions
        }
        
        # 保存JSON报告
        report_path = self.project_root / 'DEAD_CODE_REPORT.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # 生成Markdown报告
        self._generate_markdown_report(report)
        
        print(f"\n✅ 报告已生成:")
        print(f"   - {report_path}")
        print(f"   - {self.project_root / 'DEAD_CODE_REPORT.md'}")
        
        return report
    
    def _generate_markdown_report(self, report):
        """生成Markdown报告"""
        md_path = self.project_root / 'DEAD_CODE_REPORT.md'
        
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("# Dead Code 检测报告\n\n")
            f.write(f"**生成时间**: {self._get_timestamp()}\n\n")
            
            # 摘要
            f.write("## 📊 摘要\n\n")
            f.write(f"- 总函数数: {report['summary']['total_functions']}\n")
            f.write(f"- 🚨 Dead Code: {report['summary']['dead_functions']}\n")
            f.write(f"- ⚠️  可疑函数: {report['summary']['suspicious_functions']}\n")
            f.write(f"- ✅ 安全函数: {report['summary']['safe_functions']}\n\n")
            
            # Dead Functions
            if report['dead_functions']:
                f.write("## 🚨 Dead Code（0引用）\n\n")
                f.write("**⚠️ 警告**: 删除前请人工确认！\n\n")
                
                for func in report['dead_functions']:
                    f.write(f"### `{func['name']}`\n\n")
                    f.write("**定义位置**:\n")
                    for loc in func['locations']:
                        f.write(f"- `{loc['file']}:{loc['line']}`\n")
                    f.write("\n")
            
            # Suspicious Functions
            if report['suspicious_functions']:
                f.write("## ⚠️  可疑函数（1引用）\n\n")
                f.write("**说明**: 仅被引用1次，可能是定义+导出\n\n")
                
                for func in report['suspicious_functions'][:10]:  # 只显示前10个
                    f.write(f"- `{func['name']}` - {func['locations'][0]['file']}\n")
                
                if len(report['suspicious_functions']) > 10:
                    f.write(f"\n... 还有 {len(report['suspicious_functions']) - 10} 个\n")
            
            # 安全提示
            f.write("\n## 🛡️ 安全提示\n\n")
            f.write("### 不要删除的情况\n\n")
            f.write("1. **动态调用**: `this[funcName]()`, `obj[key]()`\n")
            f.write("2. **字符串引用**: `'functionName'` 作为参数传递\n")
            f.write("3. **模板引用**: Vue模板中的 `@click=\"funcName\"`\n")
            f.write("4. **导出函数**: `export { funcName }`\n")
            f.write("5. **事件处理器**: `addEventListener('click', funcName)`\n")
            f.write("6. **生命周期钩子**: Vue/React生命周期方法\n\n")
            
            f.write("### 删除步骤\n\n")
            f.write("1. 人工确认函数确实未使用\n")
            f.write("2. 使用Git创建备份分支\n")
            f.write("3. 删除函数代码\n")
            f.write("4. 运行测试: `npm test`\n")
            f.write("5. 手动测试关键功能\n")
            f.write("6. 提交前Code Review\n")
    
    def _get_timestamp(self):
        """获取时间戳"""
        from datetime import datetime
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def main():
    """主函数"""
    project_root = os.getcwd()
    
    print("=" * 60)
    print("🔍 Dead Code 检测器 - 零风险版本")
    print("=" * 60)
    print(f"\n📁 项目目录: {project_root}\n")
    
    detector = DeadCodeDetector(project_root)
    
    # 扫描项目
    detector.scan_project()
    
    # 分析结果
    dead_functions, suspicious_functions = detector.analyze()
    
    # 生成报告
    report = detector.generate_report(dead_functions, suspicious_functions)
    
    # 打印摘要
    print("\n" + "=" * 60)
    print("📊 检测完成")
    print("=" * 60)
    print(f"🚨 Dead Code: {len(dead_functions)} 个")
    print(f"⚠️  可疑函数: {len(suspicious_functions)} 个")
    print(f"✅ 安全函数: {report['summary']['safe_functions']} 个")
    print("\n⚠️  警告: 删除前请人工确认，避免误删！")
    print("=" * 60)


if __name__ == '__main__':
    main()
