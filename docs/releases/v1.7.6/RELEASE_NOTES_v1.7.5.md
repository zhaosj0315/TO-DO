# TO-DO App v1.7.5 发布说明

**发布日期**: 2026-02-25  
**版本类型**: UI/UX 优化版本  
**核心主题**: Bottom Sheet 统一布局，提升应用专业性

---

## 🎨 核心更新：Bottom Sheet 统一布局

### 设计理念
将所有弹窗统一为 Bottom Sheet（从底部向上滑出）样式，实现：
- 100% 宽度，充分利用屏幕空间
- 统一的紫色渐变头部
- 顶部拖动手柄，符合移动端交互习惯
- 统一的滑动动画效果
- 提升应用整体专业性和一致性

### 已统一的弹窗（共 8 个）

#### 1. 任务详情页面 (TaskDetailModal)
- 点击任务卡片打开
- 显示任务信息、执行统计、日志列表
- 操作：添加日志、标记完成、删除任务

#### 2. 添加日志弹窗 (AddLogModal)
- 从任务详情页面打开
- 6 种日志类型选择
- 支持进度、标签、心情、评分等

#### 3. 高级筛选弹窗
- 点击筛选按钮（🎛️）打开
- 关键字搜索、分类、优先级、日期范围筛选

#### 4. 个人主页
- 点击右上角头像打开
- 用户信息、统计数据、设置入口

#### 5. 番茄钟统计
- 从个人主页打开
- 今日专注统计、本周统计、番茄钟历史

#### 6. 数据报告
- 从个人主页打开
- 日报、周报、月报、季报、半年报、年报、自定义报告

#### 7. AI 模型配置
- 从个人主页打开（位置调整至修改密码上方）
- 默认模型选择、模型列表管理、添加新模型
- 图标更新为 🤖，样式统一为 pomodoro-entry

#### 8. 修改密码
- 从个人主页打开
- 输入旧密码和新密码
- 删除重复的修改密码入口

#### 9. 绑定手机号
- 从个人主页打开
- 绑定/解绑手机号功能

#### 10. 联系与支持
- 从个人主页打开
- 微信二维码、打赏二维码、邮箱联系方式

### 特殊弹窗（保持原样）
- 备份提醒（无背景遮罩的顶部提示）
- 通知引导（系统级引导）

---

## 🐛 Bug 修复

### 1. 任务详情页面按钮失效
**问题**: 添加日志、标记完成、删除任务按钮点击无反应
**原因**: 
- `updateTask` 方法调用参数错误
- `showNotification` 函数名拼写错误
- 删除任务时组件卸载顺序问题

**修复**:
- 修正 `updateTask(taskId, updates)` 参数格式
- 统一使用 `showNotification` 函数
- 优化删除任务时先关闭弹窗再删除

### 2. AddLogModal 缺少 logTypeLabels
**问题**: 打开添加日志弹窗报错 "logTypeLabels is not defined"
**修复**: 添加 `logTypeLabels` 映射对象

### 3. 文本选中菜单点击失效
**问题**: 选中文本后弹出的 AI 菜单（总结、扩写、翻译等）点击无反应
**原因**: 
- 菜单显示后立即被 `mouseup` 事件隐藏
- `notifications` 和 `showNotify` 未定义

**修复**:
- 添加点击菜单时的事件拦截
- 延迟 10ms 获取选中文本
- 修正为 `showNotification` 函数
- 使用默认模型的 `modelName`

### 4. AI 结果弹窗被遮挡
**问题**: 在任务卡片中选中文本并处理后，结果弹窗被任务详情页面遮挡
**修复**: 将 AI 结果弹窗的 z-index 提升至 10002（最高层级）

### 5. 个人主页重复的修改密码入口
**问题**: 个人主页中有两个修改密码按钮
**修复**: 删除重复的入口，只保留一个

### 6. AI 配置位置不合理
**问题**: AI 配置入口位置太靠下
**修复**: 移动至修改密码上方，图标改为 🤖

---

## 🔧 功能优化

### 1. AI 模型配置使用默认模型
- AI 问答使用配置的默认模型
- 任务总结使用配置的默认模型
- 文本处理（总结、扩写、翻译）使用配置的默认模型
- 自动补全 OpenAI API URL 路径（`/chat/completions`）

### 2. AI 问答显示模型名称
- 每条 AI 回复下方显示使用的模型名称
- 格式：🤖 模型名称
- 样式：灰色小字，右对齐

### 3. Web 端拍照功能优化
- Web 端点击拍照按钮弹出文件选择器
- Android 端继续使用相机拍照 + OCR 识别
- 友好的平台检测和错误提示

### 4. Ngrok 启动脚本优化
- 自动提取并显示完整的 API 地址（带 `/api/generate`）
- 自动列出所有可用的 Ollama 模型
- 提供配置步骤说明

---

## 📊 层级管理

### Z-Index 层级规范
```
- 普通弹窗: 1000
- 任务详情: 2000
- 文本选中菜单: 10001
- AI 结果弹窗: 10002
- Bottom Sheet 系列: 固定在底部，使用 fixed 定位
```

---

## 🎯 未来优化建议

### 待统一为 Bottom Sheet 的弹窗（11 个）
1. 隐私政策 (`showPrivacyPolicy`)
2. 数据说明 (`showDataInfo`)
3. 回收站 (`showTrash`)
4. 欢迎提示 (`showWelcome`)
5. 备份提醒弹窗 (`showBackupReminder` - 890行)
6. 使用指南 (`showUserGuide`)
7. 番茄钟规则 (`showPomodoroRules`)
8. 更新日志 (`showChangelog`)
9. 每周重复选择 (`showWeeklyModal`)
10. 自定义日期选择 (`showCustomDateModal`)
11. AI 结果展示 (`showAIResult` - 需统一样式)

**注**: 由于代码已封板，这些优化将在下一版本实现。

---

## 📦 技术细节

### Bottom Sheet 样式规范
```css
.xxx-bottom-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.xxx-bottom-sheet .modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.xxx-bottom-sheet .modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}
```

### 滑动动画
```css
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

---

## 📝 文件变更

### 修改的文件
- `src/views/TodoView.vue` - 主要 UI 和逻辑修改
- `src/components/TaskDetailModal.vue` - Bottom Sheet 样式 + Bug 修复
- `src/components/AddLogModal.vue` - Bottom Sheet 样式 + 添加 logTypeLabels
- `src/components/AIModelConfig.vue` - 统一 Bottom Sheet 样式
- `src/components/AIChat.vue` - 使用默认模型 + 显示模型名称
- `README.md` - 更新版本号和功能说明
- `CHANGELOG.md` - 添加 v1.7.5 更新日志

### 新增的文件
- `start-ngrok.sh` - Ngrok 启动脚本（优化版）

---

## 🎉 用户体验提升

### 统一性
- 所有弹窗使用相同的交互模式
- 统一的视觉语言（紫色渐变）
- 一致的动画效果

### 专业性
- 符合移动端设计规范
- 拖动手柄提示可交互
- 充分利用屏幕空间

### 易用性
- 从底部滑出更符合手指操作习惯
- 100% 宽度提供更大的操作区域
- 统一的关闭方式（点击背景或关闭按钮）

---

## 📱 兼容性

- Android: ✅ 完全支持
- Web (浏览器): ✅ 完全支持
- iOS: ✅ 理论支持（未测试）

---

## 🔗 相关文档

- [README.md](README.md) - 项目总览
- [CHANGELOG.md](CHANGELOG.md) - 完整更新日志
- [AI_MODEL_CONFIG.md](AI_MODEL_CONFIG.md) - AI 模型配置指南
- [DOC_MANAGEMENT_POLICY.md](DOC_MANAGEMENT_POLICY.md) - 文档管理规范
- [GIT_PUSH_POLICY.md](GIT_PUSH_POLICY.md) - Git 推送规范

---

**版本号**: v1.7.5  
**构建日期**: 2026-02-25  
**APK 大小**: 54MB  
**最低 Android 版本**: 5.0 (API 21)
