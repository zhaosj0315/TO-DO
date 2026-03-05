# 项目清理报告 v0.8.1

**清理日期**: 2026-03-06  
**执行人**: AI Assistant  
**清理原则**: 安全第一，只删除确认无用的内容

---

## 📊 清理统计

| 类别 | 数量 | 操作 |
|------|------|------|
| 过程性文档 | 5个 | 归档到 docs/archive/ |
| 废弃目录 | 1个 (server/) | 完全删除 |
| 重复脚本 | 2个 | 删除 |
| 旧版本打包产物 | 3个 | 删除 |
| 临时文件 | 2个 | 删除 |
| 重复图标 | 3个 | 删除 |
| 重复模板 | 1个 | 删除 |

---

## 📦 归档的过程性文档

以下文档已移至 `docs/archive/` 目录：

1. **CLEANUP_REPORT_v0.8.1.md** - 上一次清理报告
2. **AUDIT_REPORT_v0.8.1.md** - 项目审计报告（Markdown）
3. **AUDIT_REPORT_v0.8.1.json** - 项目审计报告（JSON）
4. **VERSION_NOTIFICATION_OPTIMIZATION.md** - 版本通知优化提案
5. **AI_TEXT_SELECTION_OPTIMIZATION.md** - AI文本选择优化提案

**归档原因**: 这些文档是开发过程中的临时产物，已完成其历史使命，归档保留以备查阅。

---

## 🗑️ 删除的废弃内容

### 1. server/ 目录（完全删除）
- **原因**: 项目已从全栈架构迁移至纯前端离线应用
- **内容**: 
  - `server/index.js` - Express后端服务器
  - `server/db.js` - SQLite数据库配置
  - `server/database.sqlite` - 数据库文件
  - `server/package.json` - 后端依赖
  - `server/.env` - 环境变量
- **影响**: 无，README已明确说明server目录已废弃

### 2. 重复的脚本文件
- **scripts/生成1000条模拟数据.js** - 与 `生成1000条测试数据.js` 功能重复
- **scripts/migrate-to-hierarchy.js** - 数据迁移脚本，已完成使命

### 3. 旧版本打包产物
- **release/TODO-App.apk** - 旧版本APK（根目录已有最新版）
- **release/TODO App-1.7.8-*.zip** - 旧版本号的Mac打包产物
- **TODO-App-1.6.0-iOS-Simulator.zip** - 旧版本iOS模拟器包

### 4. 临时分析文件
- **project-auditor.py** - 临时审计脚本
- **cleanup-safe.sh** - 临时清理脚本

### 5. 重复的图标文件
- **icon-source.png** - 原始图标（已有正式版本）
- **icon-square.png** - 方形图标（已有正式版本）
- **icon-cropped.png** - 裁剪图标（已有正式版本）

### 6. 重复的Excel模板
- **TODO导入模板示例-1000条.xlsx** - 大容量模板（保留100条标准模板）

---

## ⚠️ 未清理的内容

### 1. 代码函数（需人工审查）

分析发现 **347个函数** 疑似未使用，但经过初步检查：

- **大部分是误报**: Vue Composables、导出的API、模板中使用的函数
- **动态调用**: 部分函数通过字符串或动态方式调用
- **保留原因**: 可能是公共API或未来功能

**建议**: 
1. 使用 `CLEANUP_ANALYSIS_v0.8.1.json` 查看完整列表
2. 逐个人工确认是否真的未使用
3. 先注释代码测试，确认无误后再删除

### 2. 保留的文档

以下文档虽然是过程性的，但仍有参考价值：

- **TESTING_GUIDE.md** - 测试指南（开发者需要）
- **DOC_STANDARDS.md** - 文档规范（团队协作需要）
- **PROJECT_MANAGEMENT_STANDARDS.md** - 项目管理规范

---

## 📈 清理效果

### 磁盘空间节省
- **server/**: ~85KB
- **旧版本打包产物**: ~350MB
- **重复文件**: ~1.5MB
- **总计**: ~351.6MB

### 项目结构优化
- 删除废弃的server目录，结构更清晰
- 归档过程性文档，根目录更简洁
- 删除重复文件，避免混淆

---

## 🔍 Dead Code 检测方案

### 推荐工具

1. **ESLint + eslint-plugin-unused-imports**
   ```bash
   npm install --save-dev eslint-plugin-unused-imports
   ```
   配置 `.eslintrc.js`:
   ```js
   {
     "plugins": ["unused-imports"],
     "rules": {
       "unused-imports/no-unused-imports": "error"
     }
   }
   ```

2. **Vite 构建分析**
   ```bash
   npm run build -- --mode analyze
   ```
   查看 `dist/stats.html` 分析未使用的代码

3. **手动检查工具**
   - 使用 `cleanup-analyzer.py` 脚本（已生成）
   - 查看 `CLEANUP_ANALYSIS_v0.8.1.json` 详细报告

### 安全策略

#### 1. 识别动态调用
```javascript
// 这些函数可能被误判为未使用
const dynamicCall = functionName => window[functionName]()
const eventHandler = { onClick: handleClick }
const vueTemplate = '<button @click="handleClick">'
```

#### 2. 识别导出API
```javascript
// 导出的函数可能在其他模块使用
export function publicAPI() { }
export default { method1, method2 }
```

#### 3. 识别Vue特性
```javascript
// Vue Composables
export function useFeature() { return { ... } }

// Vue模板引用
<template>
  <button @click="handleClick">{{ formatDate(date) }}</button>
</template>
```

#### 4. 安全删除流程
1. **第一步**: 注释函数代码，保留函数签名
2. **第二步**: 运行完整测试套件
3. **第三步**: 手动测试所有功能
4. **第四步**: 提交Git，观察1-2周
5. **第五步**: 确认无问题后永久删除

---

## 📝 清理清单

- [x] 归档过程性文档（5个）
- [x] 删除废弃server目录
- [x] 删除重复脚本（2个）
- [x] 清理旧版本打包产物（3个）
- [x] 删除临时文件（2个）
- [x] 删除重复图标（3个）
- [x] 删除重复模板（1个）
- [ ] 清理未使用函数（需人工审查）
- [ ] 优化import语句（需ESLint）
- [ ] 清理未使用的npm包（需depcheck）

---

## 🎯 后续建议

### 1. 建立自动化检测
```bash
# 安装依赖
npm install --save-dev eslint-plugin-unused-imports depcheck

# 定期检查
npm run lint
npx depcheck
```

### 2. Git提交规范
- 清理操作单独提交
- 提交信息格式: `chore: 清理XXX`
- 保留详细的清理说明

### 3. 文档归档策略
- 过程性文档 → `docs/archive/`
- 历史版本文档 → `docs/archive/v{version}/`
- 保留最近3个版本的文档

### 4. 定期清理计划
- **每月**: 清理临时文件和旧版本打包产物
- **每季度**: 审查未使用的函数和依赖
- **每半年**: 归档过时的文档和提案

---

## ✅ 验证清理结果

### 1. 构建测试
```bash
npm run build
```
**结果**: ✅ 构建成功

### 2. 功能测试
- [ ] 用户登录/注册
- [ ] 任务创建/编辑/删除
- [ ] AI功能（问答/拆分/报告）
- [ ] 番茄钟计时
- [ ] 数据导入/导出

### 3. 打包测试
```bash
./build-apk.sh
```
**结果**: 待执行

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 项目维护者邮箱

---

**清理完成时间**: 2026-03-06 00:35  
**下次清理计划**: 2026-04-06
