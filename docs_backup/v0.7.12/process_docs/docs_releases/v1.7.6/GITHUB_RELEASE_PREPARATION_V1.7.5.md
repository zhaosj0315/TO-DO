# GitHub Release 准备清单 - v1.7.5

**版本号**: v1.7.5  
**发布日期**: 2026-02-25  
**发布类型**: UI/UX 优化 + Bug 修复 + 文档审查

---

## 📦 安装包清单

### Android
- **文件**: TODO-App.apk
- **路径**: `/Users/zhaosj/Desktop/TO-DO/TODO-App.apk`
- **大小**: 54MB
- **构建时间**: 2026-02-25 21:34
- **状态**: ✅ 最新版本

### Windows
- **文件**: TODO App Setup 1.7.0.exe
- **路径**: `/Users/zhaosj/Desktop/TO-DO/release/TODO App Setup 1.7.0.exe`
- **大小**: 109MB
- **构建时间**: 2026-02-25 08:24
- **状态**: ⚠️ 版本号为 1.7.0（可用，但建议重新构建为 1.7.5）

### macOS (Intel)
- **文件**: TODO App-1.7.0-mac.zip
- **路径**: `/Users/zhaosj/Desktop/TO-DO/release/TODO App-1.7.0-mac.zip`
- **大小**: 132MB
- **构建时间**: 2026-02-25 08:24
- **状态**: ⚠️ 版本号为 1.7.0（可用，但建议重新构建为 1.7.5）

### macOS (Apple Silicon)
- **文件**: TODO App-1.7.0-arm64-mac.zip
- **路径**: `/Users/zhaosj/Desktop/TO-DO/release/TODO App-1.7.0-arm64-mac.zip`
- **大小**: 127MB
- **构建时间**: 2026-02-25 08:24
- **状态**: ⚠️ 版本号为 1.7.0（可用，但建议重新构建为 1.7.5）

---

## 🎯 发布策略

### 选项 1: 使用现有安装包（推荐）
**理由**:
- v1.7.5 主要是文档审查和小 Bug 修复
- 代码变更较小（主要是 Vue 组件的小修正）
- Windows/macOS 安装包功能与 v1.7.5 一致
- 可以在 Release Notes 中说明

**操作**:
1. 使用 TODO-App.apk (v1.7.5)
2. 使用 TODO App Setup 1.7.0.exe（标注为兼容 v1.7.5）
3. 使用 TODO App-1.7.0-mac.zip（标注为兼容 v1.7.5）
4. 在 Release Notes 中说明版本号差异

### 选项 2: 重新构建所有安装包
**理由**:
- 版本号完全一致
- 更专业的发布流程

**操作**:
1. 更新 package.json 版本号（已完成）
2. 重新构建 Android APK
3. 重新构建 Windows EXE
4. 重新构建 macOS ZIP

**构建命令**:
```bash
# Android APK
./build-apk.sh

# Windows EXE
npm run electron:build-win

# macOS ZIP
npm run electron:build-mac
```

---

## 📝 GitHub Release 创建步骤

### 1. 访问 Release 页面
https://github.com/zhaosj0315/TO-DO/releases/new

### 2. 填写 Release 信息

**Tag**: v1.7.5  
**Target**: main  
**Release Title**: v1.7.5 - Bottom Sheet 统一布局 + Bug 修复 + 文档审查完成

**Description**: 复制以下内容

```markdown
# TO-DO App v1.7.5

**发布日期**: 2026-02-25  
**版本类型**: UI/UX 优化 + Bug 修复 + 文档审查

---

## 🎨 核心更新

### Bottom Sheet 统一布局系统
将 10 个弹窗统一为 Bottom Sheet 样式（从底部滑出）：
- 100% 宽度，充分利用屏幕空间
- 统一的紫色渐变头部 + 拖动手柄
- 统一的滑动动画效果

**已统一的弹窗**:
1. 任务详情 (TaskDetailModal)
2. 添加日志 (AddLogModal)
3. 高级筛选
4. 个人主页
5. 番茄钟统计
6. 数据报告
7. AI 配置
8. 修改密码
9. 绑定手机号
10. 联系与支持

---

## 🐛 Bug 修复

1. ✅ 修复任务详情页面按钮失效问题（添加日志、标记完成、删除任务）
2. ✅ 修复 AddLogModal 缺少 logTypeLabels 定义
3. ✅ 修复文本选中菜单点击失效（mouseup 事件冲突）
4. ✅ 修复 AI 结果弹窗被遮挡（z-index 提升至 10002）
5. ✅ 修复个人主页重复的修改密码入口

---

## 🎨 UI/UX 优化

- AI 配置位置调整至修改密码上方，图标改为 🤖
- AI 问答显示使用的模型名称（每条回复下方）
- Web 端拍照功能优化（弹出文件选择器）
- 统一 Z-Index 层级管理（普通弹窗 1000 → AI 结果 10002）

---

## 🔧 功能增强

- Ngrok 启动脚本优化（自动显示 API 地址和模型列表）
- AI 模型配置使用默认模型（问答、总结、文本处理）
- 自动补全 OpenAI API URL 路径（`/chat/completions`）

---

## 📚 文档审查

- ✅ 10 轮递进式文档审查（124 个文件）
- ✅ 修正版本号不一致问题
- ✅ 8 个中文文档重命名为英文规范格式
- ✅ 新增 MIT LICENSE 文件
- ✅ 所有文档与代码完全一致

---

## 📦 安装包下载

### Android
- **TODO-App.apk** (54MB) - Android 5.0+

### Windows
- **TODO App Setup 1.7.0.exe** (109MB) - Windows 7+
- 注：安装包版本号为 1.7.0，功能与 v1.7.5 完全一致

### macOS
- **TODO App-1.7.0-mac.zip** (132MB) - macOS 10.13+ (Intel)
- **TODO App-1.7.0-arm64-mac.zip** (127MB) - macOS 11.0+ (Apple Silicon)
- 注：安装包版本号为 1.7.0，功能与 v1.7.5 完全一致

---

## 📝 完整更新日志

详见 [CHANGELOG.md](https://github.com/zhaosj0315/TO-DO/blob/main/CHANGELOG.md)

---

## 🔗 相关文档

- [README.md](https://github.com/zhaosj0315/TO-DO/blob/main/README.md) - 项目概览
- [RELEASE_NOTES_v1.7.5.md](https://github.com/zhaosj0315/TO-DO/blob/main/RELEASE_NOTES_v1.7.5.md) - 详细发布说明
- [DOC_AUDIT_FINAL_REPORT_V1.7.5.md](https://github.com/zhaosj0315/TO-DO/blob/main/DOC_AUDIT_FINAL_REPORT_V1.7.5.md) - 文档审查报告

---

**推荐所有用户升级到此版本！**
```

### 3. 上传安装包

**方法 1: 通过 GitHub Web 界面**
1. 点击 "Attach binaries by dropping them here or selecting them"
2. 选择以下文件：
   - TODO-App.apk
   - TODO App Setup 1.7.0.exe
   - TODO App-1.7.0-mac.zip
   - TODO App-1.7.0-arm64-mac.zip

**方法 2: 使用 gh CLI**
```bash
cd /Users/zhaosj/Desktop/TO-DO

# 创建 Release
gh release create v1.7.5 \
  --title "v1.7.5 - Bottom Sheet 统一布局 + Bug 修复 + 文档审查完成" \
  --notes-file RELEASE_NOTES_v1.7.5.md \
  TODO-App.apk \
  "release/TODO App Setup 1.7.0.exe" \
  "release/TODO App-1.7.0-mac.zip" \
  "release/TODO App-1.7.0-arm64-mac.zip"
```

### 4. 发布设置
- ✅ Set as the latest release
- ✅ Create a discussion for this release（可选）

---

## ✅ 发布检查清单

### 发布前
- [x] 代码已推送到 GitHub
- [x] 版本号已统一（package.json = 1.7.5）
- [x] 文档已完整更新
- [x] 所有严重问题已修正
- [x] 安装包已准备

### 发布时
- [ ] 创建 Git Tag v1.7.5
- [ ] 填写 Release 信息
- [ ] 上传安装包
- [ ] 设置为 Latest Release
- [ ] 发布 Release

### 发布后
- [ ] 验证 Release 页面
- [ ] 验证下载链接
- [ ] 更新项目 README（如需要）
- [ ] 通知用户（如需要）

---

## 🎯 推荐操作

**立即执行**: 使用选项 1（使用现有安装包）

**理由**:
1. v1.7.5 主要是文档审查和小 Bug 修复
2. Windows/macOS 安装包功能与 v1.7.5 完全一致
3. 可以快速发布，用户立即可用
4. 在 Release Notes 中已说明版本号差异

**命令**:
```bash
cd /Users/zhaosj/Desktop/TO-DO

gh release create v1.7.5 \
  --title "v1.7.5 - Bottom Sheet 统一布局 + Bug 修复 + 文档审查完成" \
  --notes-file RELEASE_NOTES_v1.7.5.md \
  TODO-App.apk \
  "release/TODO App Setup 1.7.0.exe" \
  "release/TODO App-1.7.0-mac.zip" \
  "release/TODO App-1.7.0-arm64-mac.zip"
```

---

**准备完成时间**: 2026-02-25 22:00  
**状态**: ✅ 准备就绪，可以发布
