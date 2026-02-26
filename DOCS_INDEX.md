# 文档索引 | Documentation Index

**版本**: v1.7.5.1  
**更新日期**: 2026-02-26  
**维护**: 开发团队

---

## 📚 核心文档（必读）

### 项目概览
- **[README.md](README.md)** - 项目完整说明（功能、安装、使用）
- **[CHANGELOG.md](CHANGELOG.md)** - 版本变更记录
- **[LICENSE](LICENSE)** - MIT 开源协议

### 用户文档
- **[USER_MANUAL.md](USER_MANUAL.md)** - 用户使用手册
- **[QUICK_START.md](QUICK_START.md)** - 快速开始指南
- **[FEATURES.md](FEATURES.md)** - 功能详细说明

### 开发文档
- **[DEVELOPER.md](DEVELOPER.md)** - 开发者指南
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - 测试指南
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - 实现总结

---

## 🔧 构建文档

### Android
- **[APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md)** - APK 完整构建指南
- **[APK_BUILD_QUICK.md](APK_BUILD_QUICK.md)** - APK 快速构建指南
- **[build-apk.sh](build-apk.sh)** - 一键打包脚本

### Windows
- **[WINDOWS_BUILD_GUIDE.md](WINDOWS_BUILD_GUIDE.md)** - Windows 构建指南
- **[build-windows.sh](build-windows.sh)** - Windows 打包脚本（macOS/Linux）
- **[build-windows.bat](build-windows.bat)** - Windows 打包脚本（Windows）

### 多平台
- **[BUILD_SCRIPTS_GUIDE.md](BUILD_SCRIPTS_GUIDE.md)** - 构建脚本使用指南
- **[build-all.sh](build-all.sh)** - 全平台一键打包

---

## ✨ 功能文档

### 核心功能
- **[TASK_LOG_PHASE1.md](TASK_LOG_PHASE1.md)** - 任务执行日志系统（v1.7.0）
- **[TUTORIAL_MODE_FEATURE.md](TUTORIAL_MODE_FEATURE.md)** - 演示模式系统（v1.7.1）

### AI 功能
- **[AI_CHAT_GUIDE.md](AI_CHAT_GUIDE.md)** - AI 智能问答使用指南
- **[OLLAMA_PROXY_GUIDE.md](OLLAMA_PROXY_GUIDE.md)** - Ollama 代理配置指南
- **[OLLAMA_PROXY_QUICKREF.md](OLLAMA_PROXY_QUICKREF.md)** - Ollama 快速参考
- **[start-ngrok.sh](start-ngrok.sh)** - Ngrok 启动脚本
- **[start-ollama-lan.sh](start-ollama-lan.sh)** - Ollama 局域网启动
- **[start-ollama-optimized.sh](start-ollama-optimized.sh)** - Ollama 优化启动
- **[ollama-proxy.py](ollama-proxy.py)** - Ollama 代理服务器

---

## 📋 规范文档

### 开发规范
- **[DOC_MANAGEMENT_POLICY.md](DOC_MANAGEMENT_POLICY.md)** - 文档开发管理规范
- **[GIT_PUSH_POLICY.md](GIT_PUSH_POLICY.md)** - Git 推送规范
- **[DOC_STANDARDS.md](DOC_STANDARDS.md)** - 文档标准

### 发布文档
- **[RELEASE_NOTES_v1.7.5.md](RELEASE_NOTES_v1.7.5.md)** - v1.7.5 发布说明

---

## 📦 归档文档

历史版本文档已归档至 `docs/archive/` 目录：

### 版本归档
- **[docs/archive/v1.7.5/](docs/archive/v1.7.5/)** - v1.7.5 审计和推送记录
- **[docs/archive/v1.7.0/](docs/archive/v1.7.0/)** - v1.7.0-v1.7.2 文档
- **[docs/archive/v1.6.x/](docs/archive/v1.6.x/)** - v1.6.x 发布说明
- **[docs/archive/v1.5.x/](docs/archive/v1.5.x/)** - v1.5.x 文档

### 功能归档
- **[docs/archive/ai-features/](docs/archive/ai-features/)** - AI 功能开发文档
- **[docs/archive/reminders/](docs/archive/reminders/)** - 提醒功能文档
- **[docs/archive/platform-builds/](docs/archive/platform-builds/)** - 平台构建文档
- **[docs/archive/import-feature/](docs/archive/import-feature/)** - 导入功能文档
- **[docs/archive/misc/](docs/archive/misc/)** - 杂项文档

### 草稿文档
- **[docs/drafts/](docs/drafts/)** - 未完成功能文档（v1.8.0-alpha）

---

## 🔍 文档查找指南

### 我想了解...

**如何使用应用？**
→ [USER_MANUAL.md](USER_MANUAL.md) 或 [QUICK_START.md](QUICK_START.md)

**如何打包 APK？**
→ [APK_BUILD_QUICK.md](APK_BUILD_QUICK.md)

**如何配置 AI 功能？**
→ [AI_CHAT_GUIDE.md](AI_CHAT_GUIDE.md)

**如何参与开发？**
→ [DEVELOPER.md](DEVELOPER.md)

**版本更新了什么？**
→ [CHANGELOG.md](CHANGELOG.md)

**如何编写文档？**
→ [DOC_MANAGEMENT_POLICY.md](DOC_MANAGEMENT_POLICY.md)

---

## 📝 文档维护

### 更新原则
1. **代码为准**: 文档必须无条件适配代码
2. **及时同步**: 代码变更后立即更新文档
3. **版本一致**: 文档版本号与 package.json 保持一致

### 归档规则
- 每个主版本发布后，将旧版本文档移至 `docs/archive/`
- 保留最新版本的核心文档在根目录
- 草稿文档放在 `docs/drafts/`

### 文档分类
- **核心文档**: 项目必备文档，永久保留在根目录
- **功能文档**: 特定功能说明，可归档
- **版本文档**: 发布说明和审计报告，必须归档
- **草稿文档**: 未完成功能，放在 drafts 目录

---

**最后更新**: 2026-02-26  
**维护团队**: 开发团队  
**反馈渠道**: GitHub Issues
