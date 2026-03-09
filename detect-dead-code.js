#!/usr/bin/env node

/**
 * 死代码检测脚本
 * 检测项目中未使用的函数（0引用）
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  srcDir: './src',
  extensions: ['.js', '.vue'],
  excludeDirs: ['node_modules', 'dist', 'build', '.git'],
  minReferences: 0 // 0引用才算死代码
};

// 存储结果
const results = {
  functions: new Map(), // 函数名 -> {file, line, references: []}
  methods: new Map(),   // 方法名 -> {file, line, references: []}
  deadCode: []
};

/**
 * 递归扫描目录
 */
function scanDirectory(dir) {
  const files = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!config.excludeDirs.includes(item)) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (config.extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * 提取函数定义
 */
function extractFunctions(content, filePath) {
  const functionPatterns = [
    // function name() {}
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
    // const name = function() {}
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g,
    // const name = () => {}
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>/g,
    // async function name() {}
    /async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
  ];
  
  const lines = content.split('\n');
  
  functionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const funcName = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      if (!results.functions.has(funcName)) {
        results.functions.set(funcName, {
          file: filePath,
          line: lineNum,
          references: []
        });
      }
    }
  });
}

/**
 * 提取Vue方法定义
 */
function extractVueMethods(content, filePath) {
  // methods: { methodName() {} }
  const methodPattern = /methods:\s*{([^}]+)}/gs;
  const match = methodPattern.exec(content);
  
  if (match) {
    const methodsBlock = match[1];
    const methodNames = methodsBlock.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
    
    if (methodNames) {
      methodNames.forEach(m => {
        const name = m.replace(/\s*\(/, '');
        const lineNum = content.substring(0, content.indexOf(m)).split('\n').length;
        
        if (!results.methods.has(name)) {
          results.methods.set(name, {
            file: filePath,
            line: lineNum,
            references: []
          });
        }
      });
    }
  }
}

/**
 * 查找函数引用
 */
function findReferences(content, funcName, filePath) {
  // 排除定义行
  const lines = content.split('\n');
  const references = [];
  
  lines.forEach((line, idx) => {
    // 跳过注释
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    
    // 查找函数调用
    const callPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    if (callPattern.test(line)) {
      references.push({
        file: filePath,
        line: idx + 1,
        code: line.trim()
      });
    }
  });
  
  return references;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始扫描代码...\n');
  
  // 1. 扫描所有文件
  const files = scanDirectory(config.srcDir);
  console.log(`📁 找到 ${files.length} 个文件\n`);
  
  // 2. 提取所有函数定义
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    extractFunctions(content, file);
    if (file.endsWith('.vue')) {
      extractVueMethods(content, file);
    }
  });
  
  console.log(`📊 找到 ${results.functions.size} 个函数`);
  console.log(`📊 找到 ${results.methods.size} 个Vue方法\n`);
  
  // 3. 查找每个函数的引用
  const allFunctions = new Map([...results.functions, ...results.methods]);
  
  allFunctions.forEach((info, funcName) => {
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const refs = findReferences(content, funcName, file);
      info.references.push(...refs);
    });
    
    // 排除自身定义
    info.references = info.references.filter(ref => 
      ref.file !== info.file || ref.line !== info.line
    );
  });
  
  // 4. 找出死代码（0引用）
  allFunctions.forEach((info, funcName) => {
    if (info.references.length === config.minReferences) {
      results.deadCode.push({
        name: funcName,
        ...info
      });
    }
  });
  
  // 5. 输出结果
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`🎯 检测结果：找到 ${results.deadCode.length} 个可能的死代码\n`);
  
  if (results.deadCode.length === 0) {
    console.log('✅ 没有发现未使用的函数！\n');
    return;
  }
  
  // 按文件分组
  const byFile = {};
  results.deadCode.forEach(item => {
    if (!byFile[item.file]) {
      byFile[item.file] = [];
    }
    byFile[item.file].push(item);
  });
  
  // 输出详细信息
  Object.keys(byFile).sort().forEach(file => {
    console.log(`📄 ${file}`);
    byFile[file].forEach(item => {
      console.log(`   ⚠️  ${item.name} (第${item.line}行) - 0次引用`);
    });
    console.log('');
  });
  
  // 6. 生成报告
  const report = {
    scanTime: new Date().toISOString(),
    totalFiles: files.length,
    totalFunctions: allFunctions.size,
    deadCodeCount: results.deadCode.length,
    details: results.deadCode.map(item => ({
      function: item.name,
      file: item.file,
      line: item.line,
      references: item.references.length
    }))
  };
  
  fs.writeFileSync(
    './dead-code-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('📝 详细报告已保存到: dead-code-report.json\n');
  console.log('⚠️  注意：请手动确认这些函数是否真的未使用（可能存在动态调用）\n');
}

// 运行
try {
  main();
} catch (error) {
  console.error('❌ 错误:', error.message);
  process.exit(1);
}
