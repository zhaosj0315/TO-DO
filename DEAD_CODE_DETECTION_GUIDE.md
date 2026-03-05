# Dead Code 检测与清理指南

本指南提供了一套零风险的Dead Code清理方案，适用于Vue 3 + Vite项目。

---

## 🛠️ 推荐工具

### 1. ESLint + eslint-plugin-unused-imports

**安装**:
```bash
npm install --save-dev eslint-plugin-unused-imports
```

**配置** `.eslintrc.js`:
```javascript
module.exports = {
  plugins: ['unused-imports'],
  rules: {
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_'
      }
    ]
  }
}
```

**运行**:
```bash
npm run lint
```

---

### 2. Vite 构建分析

**安装**:
```bash
npm install --save-dev rollup-plugin-visualizer
```

**配置** `vite.config.js`:
```javascript
import { visualizer } from 'rollup-plugin-visualizer'

export default {
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
}
```

**运行**:
```bash
npm run build
# 自动打开 stats.html 查看未使用的代码
```

---

### 3. depcheck（检查未使用的npm包）

**安装**:
```bash
npm install -g depcheck
```

**运行**:
```bash
depcheck
```

**输出示例**:
```
Unused dependencies
* package-name-1
* package-name-2

Unused devDependencies
* dev-package-1
```

**删除**:
```bash
npm uninstall package-name-1 package-name-2
```

---

### 4. 自定义Python脚本

本项目已提供 `cleanup-analyzer.py` 脚本（已删除，可从Git历史恢复）。

**特点**:
- 扫描所有 `.js`, `.vue`, `.ts` 文件
- 提取函数定义
- 统计引用次数
- 生成JSON和Markdown报告

**局限性**:
- 无法识别Vue模板中的函数调用
- 无法识别动态调用（如 `window[funcName]()`）
- 无法识别Composables的解构使用

---

## ⚠️ 动态调用与隐式调用

### 1. 动态调用示例

```javascript
// 字符串调用
const funcName = 'handleClick'
window[funcName]() // 静态分析无法检测

// 事件系统
eventBus.on('click', handleClick) // 可能被误判为未使用

// 对象方法
const handlers = { onClick: handleClick }
handlers.onClick() // 可能被误判为未使用
```

**防止误判**:
- 添加注释标记: `// @used-by: event-system`
- 使用ESLint的 `eslint-disable` 注释
- 保留导出的公共API

---

### 2. Vue特殊情况

```vue
<template>
  <!-- 模板中的函数调用 -->
  <button @click="handleClick">{{ formatDate(date) }}</button>
</template>

<script setup>
// 这些函数可能被误判为未使用
function handleClick() { }
function formatDate(date) { }
</script>
```

**解决方案**:
- 使用Vue官方的ESLint插件: `eslint-plugin-vue`
- 手动审查所有模板引用的函数

---

### 3. Composables

```javascript
// useTextSelection.js
export function useTextSelection() {
  const selectedText = ref('')
  const replaceSelectedText = (text) => { }
  
  return {
    selectedText,
    replaceSelectedText // 可能被误判为未使用
  }
}

// 使用
const { replaceSelectedText } = useTextSelection()
```

**解决方案**:
- Composables的所有导出函数都应保留
- 不要删除任何 `export function use*()` 函数

---

## 🛡️ 安全删除流程

### 第1步: 识别候选函数

```bash
# 运行ESLint
npm run lint

# 或使用自定义脚本
python3 cleanup-analyzer.py
```

### 第2步: 人工审查

对于每个"未使用"的函数，检查：

1. **是否在Vue模板中使用?**
   ```bash
   grep -r "functionName" src/**/*.vue
   ```

2. **是否是导出的API?**
   ```javascript
   export function functionName() { } // 保留
   export default { functionName } // 保留
   ```

3. **是否是Composable?**
   ```javascript
   export function useFunctionName() { } // 保留
   ```

4. **是否被动态调用?**
   ```bash
   grep -r "['\"]\s*functionName\s*['\"]" src/
   ```

### 第3步: 注释代码

```javascript
// ❌ 不要直接删除
// function unusedFunction() { }

// ✅ 先注释
/*
function unusedFunction() {
  // 原始代码
}
*/
```

### 第4步: 测试

```bash
# 构建测试
npm run build

# 单元测试
npm run test

# 手动测试所有功能
```

### 第5步: 提交观察

```bash
git add .
git commit -m "chore: 注释未使用的函数 - 待验证"
git push
```

**观察期**: 1-2周

### 第6步: 永久删除

```bash
# 确认无问题后
git add .
git commit -m "chore: 删除确认未使用的函数"
git push
```

---

## 📋 检查清单

使用此清单确保安全删除：

- [ ] 函数未在Vue模板中使用
- [ ] 函数未被导出为公共API
- [ ] 函数不是Composable
- [ ] 函数未被动态调用
- [ ] 函数未被事件系统使用
- [ ] 已注释代码并测试
- [ ] 已提交Git并观察1-2周
- [ ] 确认无问题后永久删除

---

## 🎯 本项目的分析结果

### 统计数据
- **代码文件**: 79个
- **总函数数**: 482个
- **疑似未使用**: 347个
- **误报率**: 估计 >80%

### 常见误报

1. **Vue Composables** (约50个)
   ```javascript
   export function useTextSelection() { }
   export function useFeature() { }
   ```

2. **Vue模板函数** (约100个)
   ```vue
   <button @click="handleClick">
   {{ formatDate(date) }}
   ```

3. **导出的工具函数** (约50个)
   ```javascript
   export function excelRowToTask() { }
   export function generateTemplateData() { }
   ```

4. **事件处理器** (约50个)
   ```javascript
   const { closeMenu, replaceSelectedText } = useTextSelection()
   ```

### 建议

**不建议批量删除**，原因：
1. 误报率太高（>80%）
2. Vue项目的特殊性（模板、Composables）
3. 动态调用难以检测

**建议方案**:
1. 使用ESLint自动检测import
2. 手动审查明显未使用的函数（<10个）
3. 重点清理测试代码和临时函数

---

## 📚 参考资源

- [ESLint Plugin: unused-imports](https://github.com/sweepline/eslint-plugin-unused-imports)
- [Vite Plugin: visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [depcheck](https://github.com/depcheck/depcheck)
- [Vue ESLint Plugin](https://eslint.vuejs.org/)

---

## 💡 最佳实践

### 1. 预防胜于治疗

```javascript
// ✅ 好的做法：及时删除未使用的代码
import { usedFunction } from './utils'
// import { unusedFunction } from './utils' // 删除

// ❌ 坏的做法：保留"可能有用"的代码
import { mightBeUseful } from './utils' // 从未使用
```

### 2. 使用ESLint自动化

```json
{
  "scripts": {
    "lint": "eslint --fix src/",
    "lint:check": "eslint src/"
  }
}
```

### 3. 定期清理

- **每周**: 运行 `npm run lint`
- **每月**: 运行 `depcheck`
- **每季度**: 手动审查未使用的函数

### 4. 代码审查

在Pull Request中：
- 检查新增的import是否都被使用
- 检查删除的代码是否真的未使用
- 使用ESLint自动检查

---

**最后更新**: 2026-03-06  
**适用版本**: v0.8.1
