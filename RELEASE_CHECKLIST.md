# 版本发布检查清单 | Release Checklist

**用途**: 每次版本开发完成后，按此清单逐项对齐，确保所有信息一致  
**原则**: 代码已封板，文档和配置无条件适配代码

---

## 📋 必须执行项（每次发布都要做）

### 1. 版本号对齐（3处）

| 文件 | 位置 | 示例 |
|------|------|------|
| `package.json` | `"version"` 字段 | `"version": "0.9.4"` |
| `src/views/TodoView.vue` | `const CURRENT_VERSION` | `const CURRENT_VERSION = '0.9.4'` |
| `src/views/TodoView.vue` | 底部 footer | `TO-DO App v0.9.4` |

> ⚠️ 三处必须完全一致，否则版本更新通知逻辑会出错

---

### 2. 版本更新通知内容（TodoView.vue）

位置：`initVersionHistory()` 函数中的 `allVersions` 数组

在数组**最前面**插入新版本对象：
```js
{
  version: 'x.x.x',
  date: 'YYYY-MM-DD',
  features: [   // 新功能
    '✨ 功能描述',
  ],
  improvements: [ // 优化改进
    '🎯 优化描述',
  ],
  fixes: [      // Bug修复
    '🐛 修复描述',
  ]
}
```

---

### 3. CHANGELOG.md

在文件顶部（`---` 分隔线后）插入新版本记录：
```markdown
## [x.x.x] - YYYY-MM-DD

### 新增 (Added)
- ✨ 功能描述

### 优化 (Changed)
- 🎯 优化描述

### 修复 (Fixed)
- 🐛 修复描述
```

---

### 4. README.md 版本历史

位置：`## 📝 版本历史` 章节，在最前面插入新版本：
```markdown
### vx.x.x (YYYY-MM-DD)
- ✨ 功能描述
- 🐛 修复描述
```

同时更新文件头部：
```markdown
**当前版本**: vx.x.x  
**更新日期**: YYYY-MM-DD
```

---

### 5. 教程内容（TutorialMode.vue）

检查以下步骤是否需要更新：
- [ ] 欢迎页标题版本号（`欢迎使用 TO-DO App vx.x.x`）
- [ ] 顶部功能区描述（图标顺序/布局有变化时）
- [ ] 结尾提示（按钮图标/文字有变化时）
- [ ] 如有重大新功能，考虑新增步骤

---

## 📄 按需执行项（有对应变更时才做）

### 6. 核心文档版本号同步

当功能有重大变化时，更新以下文档头部的 `**版本**` 和 `**更新日期**`：

| 文档 | 触发条件 |
|------|---------|
| `DEVELOPER.md` | 架构/技术栈变化 |
| `ARCHITECTURE.md` | 架构变化 |
| `API_REFERENCE.md` | Store/接口变化 |
| `FEATURES.md` | 新增/删除功能 |
| `QUICK_START.md` | 安装/启动流程变化 |
| `USER_MANUAL.md` / `USER_MANUAL_COMPLETE.md` | 用户操作流程变化 |
| `TESTING_GUIDE.md` | 测试范围变化 |
| `DOCS_INDEX.md` | 文档结构变化 |

---

### 7. 功能文档（docs/features/）

新增重大功能时，检查对应文档是否需要更新版本号和内容：
- `AI_FEATURES.md`、`AI_CHAT_GUIDE.md` 等

---

### 8. 打包产物

| 平台 | 文件命名规范 |
|------|------------|
| Android | `TODO-App-vx.x.x.apk` |
| macOS x64 | `TODO-App-vx.x.x-mac-x64.zip` |
| macOS arm64 | `TODO-App-vx.x.x-mac-arm64.zip` |
| Windows | `TODO App Setup x.x.x.exe` |

打包完成后：
```bash
# 创建 GitHub Release 并上传安装包
gh release create vx.x.x \
  "release/TODO-App-vx.x.x.apk#Android APK" \
  "release/TODO-App-vx.x.x-mac-x64.zip#macOS x64 Intel" \
  "release/TODO-App-vx.x.x-mac-arm64.zip#macOS arm64 Apple Silicon" \
  "release/TODO App Setup x.x.x.exe#Windows Installer" \
  --title "vx.x.x - 版本标题" \
  --notes "更新说明"
```

---

## 🔍 发布前自检

```bash
# 1. 确认三处版本号一致
grep '"version"' package.json
grep 'CURRENT_VERSION' src/views/TodoView.vue
grep 'footer-version' src/views/TodoView.vue

# 2. 死代码检测（清理后再发布）
python3 scripts/find_dead_code.py

# 3. 确认无未提交变更
git status
```

---

## 🚀 发布流程

```
代码封板
  ↓
按上方清单逐项对齐（版本号→通知内容→CHANGELOG→README→教程）
  ↓
死代码检测 & 清理
  ↓
git commit & push
  ↓
打包（Android / macOS / Windows）
  ↓
gh release create 上传安装包
```

---

**维护者**: 开发团队  
**最后更新**: 2026-03-15
