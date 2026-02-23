# Release Notes v1.6.11

**发布日期**: 2026-02-23  
**版本号**: 1.6.11  
**类型**: 稳定版本 ⭐

---

## 🎉 核心新增功能

### 1. 每日任务摘要通知 🔔
**功能描述**:
- 每天早上 **9:00** 自动推送任务摘要通知
- 统计内容：待办任务数、即将逾期任务数、已逾期任务数
- 智能激励语：
  - 无任务：`🎉 今天没有待办任务，享受轻松的一天吧！`
  - 有紧急任务：`⚡ 有任务即将逾期，记得及时完成哦！`
  - 有逾期任务：`❗ 有任务已经逾期，赶紧处理吧！`
  - 正常情况：`💪 加油完成今天的任务吧！`
- 任务变化时自动更新明天的通知内容

**技术实现**:
- 使用 `LocalNotifications.schedule()` 定时推送
- 通知ID: 999999（固定ID，避免重复）
- 每次任务增删改时重新调度

**示例通知**:
```
📅 今日任务摘要
📋 待办: 5个 | ⏰ 即将逾期: 2个 | ❌ 已逾期: 1个
⚡ 有任务即将逾期，记得及时完成哦！
```

---

### 2. 首次登录备份提醒 💾
**功能描述**:
- 新用户首次登录时弹窗提醒
- 强调数据存储在本地，卸载会丢失
- 引导用户定期导出备份

**弹窗内容**:
- 标题：`⚠️ 重要提示：数据备份`
- 说明本地存储的优缺点
- 提供导出Excel的操作指引
- 建议定期备份到云盘

**技术实现**:
- 通过 `Preferences` 存储 `showBackupReminder` 标记
- 首次登录后设置为 `true`
- TodoView 加载时检查并显示弹窗
- 用户关闭后不再显示

---

### 3. 数据说明弹窗 📊
**功能描述**:
- 页脚新增"📊 数据说明"链接
- 详细说明数据存储方式和位置
- 列出本地存储的优缺点
- 提供完整的导出备份指南

**弹窗内容**:
- **存储方式**: Capacitor Preferences API
- **存储位置**: 
  - Android: `/data/data/com.todo.app/shared_prefs/`
  - iOS: `UserDefaults`
  - Windows/macOS: `localStorage`
- **优点**: 完全离线、数据隔离、隐私保护、快速响应
- **限制**: 无云端同步、卸载丢失、无加密存储、单设备使用
- **导出方法**: Excel导出完整操作步骤
- **备份建议**: 定期导出、多处保存、更换设备迁移
- **安全承诺**: 数据永不上传、不收集隐私、完全开源

---

### 4. 导出兼容性优化 📤
**问题背景**:
- 部分Android设备（如红米手机）导出失败
- 原因：不同设备的文件系统权限差异

**修复方案**:
- 实现多重降级策略：
  1. **Documents目录** (`Directory.Documents`)
  2. **外部存储** (`Directory.ExternalStorage`)
  3. **Data目录** (`Directory.Data`)
  4. **浏览器下载** (Blob + URL.createObjectURL)
- 每个策略失败后自动尝试下一个
- 优化错误提示，告知用户实际保存位置

**技术细节**:
```javascript
// 降级策略
try {
  await Filesystem.writeFile({ path, data, directory: Directory.Documents })
} catch {
  try {
    await Filesystem.writeFile({ path, data, directory: Directory.ExternalStorage })
  } catch {
    try {
      await Filesystem.writeFile({ path, data, directory: Directory.Data })
    } catch {
      // 最后使用浏览器下载
      const blob = new Blob([data], { type: 'application/vnd.ms-excel' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
    }
  }
}
```

---

### 5. 页脚布局重构 🎨
**优化内容**:
- 重新组织为 **3行清晰布局**：
  - **第1行**: 应用信息（版本号 · 离线特性 · 版权）
  - **第2行**: 文档与下载（使用指南 · 更新日志 · 下载安装包 · GitHub）
  - **第3行**: 设置与帮助（隐私政策 · 数据说明 · 反馈 · 语言切换）
- 删除重复的"🍅 番茄规则"链接（已包含在使用指南中）
- 版本号更新到 **v1.6.11**
- 下载链接指向：`https://github.com/zhaosj0315/TO-DO/releases/tag/v1.6.11`

**布局示例**:
```
TO-DO App v1.6.11 · 完全离线 · 本地存储 · © 2026 TO-DO Team
📖 使用指南 · 📋 更新日志 · 📦 下载安装包 · GitHub
隐私政策 · 📊 数据说明 · 💬 反馈 · 🌐 EN
```

---

### 6. Windows 打包支持 💻
- ✅ 新增 `build-windows.bat` Windows 打包脚本
- ✅ 新增 `build-windows.sh` macOS/Linux 打包脚本
- ✅ 生成 NSIS 安装程序（109MB）
- ✅ 支持自定义安装目录
- ✅ 自动创建桌面快捷方式和开始菜单快捷方式
- ✅ 新增 `WINDOWS_BUILD_GUIDE.md` 详细打包指南

---

## 🐛 Bug 修复

### 1. 重复任务耗时计算修复
**问题描述**:
- 重复任务（每天/工作日/每周）使用创建时间计算实际耗时
- 导致显示不合理数值（如"799小时"）

**修复方案**:
- 重复任务改为从当天 00:00 开始计算耗时
- 一次性任务继续使用创建时间
- 优化显示格式：
  - < 1小时 → "X分钟"
  - 1-24小时 → "X小时"
  - ≥ 24小时 → "X天"

**代码修改**:
```javascript
// 重复任务从当天00:00开始计算
if (['daily', 'weekday', 'weekly'].includes(task.type)) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  startTime = today
} else {
  startTime = new Date(task.created_at)
}
```

**示例**:
- 修复前：每周任务完成于 11:42 → 显示"799小时"
- 修复后：每周任务完成于 11:42 → 显示"11小时"

---

### 2. 红米手机导出失败修复
**问题**: 红米手机导出Excel时提示"导出失败"
**原因**: 文件系统权限限制
**修复**: 实现多重降级策略（见"导出兼容性优化"）

---

## 🎨 UI 优化

### 1. 优先级按钮样式优化
- 减小字体大小：0.9rem → 0.8rem
- 压缩内边距：0.5rem 0.8rem → 0.45rem 0.6rem
- 减小间距：0.5rem → 0.4rem
- 添加文字溢出处理：`overflow: hidden` + `text-overflow: ellipsis`
- 优化数字徽章：更小的字体和内边距，添加 `flex-shrink: 0` 防止被压缩

### 2. 页脚文字颜色优化
- 版本号、版权信息、链接、"完全离线·本地存储"：白色 → #666（灰黑色）
- 分隔符：白色 → #999（浅灰色）
- 悬停效果：白色 → #333（深灰黑色）
- 解决白色文字在浅色背景下看不清的问题

---

## 📦 macOS 打包优化

### ZIP 格式打包
- 改用 ZIP 格式（127-132MB）
- 禁用代码签名（`identity: null`）避免兼容性问题
- 支持 x64 和 arm64 双架构
- 解决 DMG 打包在某些 macOS 版本上的 `hdiutil` 错误

---

## 📥 下载安装包

### Android
- **文件名**: TODO-App.apk
- **大小**: 5.2 MB
- **架构**: ARM + x86
- **最低版本**: Android 5.0+

### Windows
- **文件名**: TODO App Setup 1.6.11.exe
- **大小**: 109 MB
- **架构**: x64
- **安装方式**: NSIS 安装程序
- **最低版本**: Windows 7+

### macOS
- **Intel 版本**: TODO-App-1.6.11-mac-x64.zip (132 MB)
- **Apple Silicon 版本**: TODO-App-1.6.11-mac-arm64.zip (127 MB)
- **安装方式**: 解压后拖到 Applications 文件夹
- **最低版本**: macOS 10.13+

**下载地址**: https://github.com/zhaosj0315/TO-DO/releases/tag/v1.6.11

---

## 🔧 技术细节

### 构建配置更新
```json
{
  "version": "1.6.11",
  "win": {
    "signAndEditExecutable": false
  },
  "mac": {
    "target": "zip",
    "identity": null
  }
}
```

### 代码修改文件
- `src/views/TodoView.vue`: 
  - 新增 `scheduleDailySummaryNotification()` 函数
  - 新增 `showDataInfo` 弹窗
  - 新增 `showBackupReminder` 弹窗
  - 修复 `calculateActualHours()` 函数
  - 优化 `exportToExcel()` 多重降级策略
  - 重构页脚布局
- `src/views/LoginView.vue`:
  - 新增首次登录标记设置
- `package.json`: 
  - 版本号更新到 1.6.11
  - 添加 Windows 和 macOS 打包配置
- `build-windows.bat`: 新增 Windows 打包脚本
- `build-windows.sh`: 新增跨平台打包脚本
- `build-mac.sh`: 更新 macOS 打包脚本

---

## 📊 通知系统总览

v1.6.11 版本共有 **6种通知类型**：

1. **登录短信验证码** (ID: 1)
2. **注册短信验证码** (ID: 3)
3. **绑定手机短信验证码** (ID: 2)
4. **任务即将逾期提醒** (ID: task.id, 1小时内)
5. **任务已逾期提醒** (ID: task.id + 100000)
6. **每日任务摘要** (ID: 999999, 每天9:00) ⭐ 新增

---

## ⚠️ 已知问题

1. **macOS DMG 打包失败**: 在某些 macOS 版本上 DMG 打包会失败，已改用 ZIP 格式
2. **Electron 应用体积**: macOS 和 Windows 版本体积较大（100MB+），这是 Electron 框架的固有限制
3. **短信验证码无冷却**: 短信验证码缺少60秒冷却时间（建议v1.6.12修复）
4. **批量通知可能扰民**: 多个任务同时逾期时会连续推送通知（建议合并为一条）

---

## 🎯 推荐理由

这是一个 **功能完善、稳定可靠** 的版本：
- ✅ **智能通知系统**：每日摘要 + 任务提醒，不错过任何重要事项
- ✅ **数据安全保障**：备份提醒 + 导出优化，数据永不丢失
- ✅ **全平台支持**：Android + Windows + macOS，随时随地使用
- ✅ **UI体验优化**：布局清晰 + 颜色合理，视觉舒适
- ✅ **稳定性验证**：经过充分测试，无重大Bug

---

## 📚 相关文档

- [Windows 打包指南](WINDOWS_BUILD_GUIDE.md)
- [macOS 打包指南](MAC_BUILD_GUIDE.md)
- [APK 打包指南](APK_BUILD_QUICK.md)
- [用户手册](USER_MANUAL.md)
- [功能说明](FEATURES.md)
- [主 README](README.md)
- [文档导航](DOCS_INDEX.md)

---

## 🙏 致谢

感谢所有用户的反馈和建议！特别感谢红米手机用户报告的导出问题。

---

## 📝 版本链接

**上一版本**: [v1.6.10](RELEASE_NOTES_v1.6.10.md)  
**当前版本**: v1.6.11 (本文档)  
**下一版本**: v1.6.12 (开发中)

---

**发布者**: TO-DO Team  
**发布日期**: 2026-02-23  
**Git Tag**: v1.6.11  
**Git Commit**: e52145b

