# Android 返回手势支持说明

## ✅ 已实现功能

### 支持的返回方式
在 Android 设备上，以下操作都会触发返回逻辑：
- ✅ 从左边缘向右滑动
- ✅ 从右边缘向左滑动
- ✅ 点击虚拟返回键（三角形按钮）
- ✅ 点击物理返回键（如果有）

### 返回优先级（三层架构 + 特殊状态）

#### 特殊状态（最高优先级）
0. **AI 加载动画** (`aiLoading`) - 强制中断 AI 生成过程 ⭐

#### 第三层弹窗（最上层，优先关闭）
1. 修改密码弹窗 (`showPasswordModal`)
2. 绑定手机弹窗 (`showPhoneModal`)
3. 每周重复设置 (`showWeeklyModal`)
4. 自定义日期设置 (`showCustomDateModal`)
5. 番茄钟统计 (`showPomodoroStats`)
6. 联系与支持 (`showSupport`)
7. **AI 模型配置** (`showAIConfig`) ⭐
8. 版本历史 (`showVersionModal`)
9. 隐私政策 (`showPrivacyPolicy`)
10. 数据说明 (`showDataInfo`)
11. 使用指南 (`showUserGuide`)
12. 番茄规则 (`showPomodoroRules`)
13. 首次欢迎 (`showWelcome`)
14. 备份提醒 (`showBackupReminder`)
15. 通知设置指南 (`showNotificationGuide`)
16. **报告模板** (`showReportTemplates`) ⭐
17. **周报历史** (`showReportHistoryModal`) ⭐
18. 添加日志弹窗 (`showAddLogModal`)
19. 任务预览 (`showTaskPreview`)
20. 子任务预览 (`showSubtaskPreview`)
21. 全屏描述 (`showFullscreenDesc`)

#### 第二层弹窗（中层）
22. **演示模式** (`showTutorial`) ⭐
23. **番茄钟计时器** (`showPomodoroTimer`) ⭐
24. 任务详情页 (`showTaskDetail`)
25. AI 问答 (`showAIChat`)
26. 个人主页 (`showProfile`)
27. 高级筛选 (`showFilterModal`)
28. 回收站 (`showTrash`)
29. 数据统计 (`showDataStats`)
30. 今日规划 (`showDailyPlan`)
31. 每日总结 (`showDailySummary`)
32. 数据报告 (`showReportModal`)
33. 智能任务拆分 (`showSmartSplitter`)
34. AI 结果 (`showAIResult`)
35. AI 建议 (`showAISuggestion`)
36. AI 报告 (`showAIReport`)
37. 任务拆分器 (`showTaskSplitter`)

#### 第一层：路由返回或退出
- 如果可以返回上一页 → 执行路由返回
- 如果已在首页 → 退出应用

### 🎯 修复的问题（v1.7.7.2）
- ✅ **AI 生成规划动画**现在支持返回手势强制中断
- ✅ **演示模式**现在支持返回手势
- ✅ **报告模板弹窗**现在支持返回手势
- ✅ **周报历史弹窗**现在支持返回手势
- ✅ 所有 37 个弹窗 + 1 个加载状态全部支持返回手势
- ✅ 多层弹窗逐层关闭（如：个人主页 → 报告模板 → 返回两次）

## 🔧 技术实现

### 使用的插件
- `@capacitor/app` v8.0.1

### 核心代码
```javascript
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

// 在 onMounted 中注册监听
if (Capacitor.getPlatform() === 'android') {
  App.addListener('backButton', ({ canGoBack }) => {
    // 第三层弹窗（最上层）
    if (showPasswordModal.value) {
      showPasswordModal.value = false
    } else if (showAIConfig.value) {
      showAIConfig.value = false
    } 
    // ... 其他第三层弹窗
    
    // 第二层弹窗
    else if (showPomodoroTimer.value) {
      showPomodoroTimer.value = false
    } else if (showTaskDetail.value) {
      showTaskDetail.value = false
    }
    // ... 其他第二层弹窗
    
    // 第一层：路由返回或退出
    else if (canGoBack) {
      window.history.back()
    } else {
      App.exitApp()
    }
  })
}

// 在 onUnmounted 中移除监听
onUnmounted(() => {
  if (Capacitor.getPlatform() === 'android') {
    App.removeAllListeners()
  }
})
```

## 📱 测试步骤

### 1. 重新构建 APK
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

### 2. 安装到 Android 设备
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 3. 测试场景

#### 场景 1：AI 模型配置（之前不生效）
1. 点击个人主页
2. 点击"AI 配置"
3. 从左/右边缘向内滑动
4. ✅ 预期：AI 配置关闭，返回个人主页
5. 再次滑动
6. ✅ 预期：个人主页关闭，返回任务列表

#### 场景 2：番茄钟计时器（之前不生效）
1. 点击任务卡片的 🍅 按钮
2. 番茄钟计时器全屏显示
3. 从边缘滑动
4. ✅ 预期：番茄钟关闭，返回任务列表

#### 场景 3：多层弹窗（修改密码）
1. 打开个人主页
2. 点击"修改密码"
3. 从边缘滑动
4. ✅ 预期：密码弹窗关闭
5. 再次滑动
6. ✅ 预期：个人主页关闭

#### 场景 4：任务详情 + 添加日志
1. 点击任务卡片打开详情
2. 点击"添加日志"按钮
3. 从边缘滑动
4. ✅ 预期：添加日志弹窗关闭
5. 再次滑动
6. ✅ 预期：任务详情关闭

## ⚠️ 注意事项

### 仅支持 Android
- iOS 不支持 `backButton` 事件
- 如需支持 iOS，需要使用 History API 或手势库

### 弹窗层级设计
- **第三层**：从其他弹窗中打开的子弹窗（如个人主页中的修改密码）
- **第二层**：主要功能弹窗（如任务详情、AI 问答）
- **第一层**：路由级别（页面切换或退出应用）

### 性能优化
- 使用 `Capacitor.getPlatform()` 检查平台，避免在非 Android 设备上注册监听
- 在组件卸载时移除监听器，防止内存泄漏

## 🐛 故障排查

### 问题 1：滑动无反应
**原因**：APK 未重新构建
**解决**：
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### 问题 2：弹窗未关闭
**原因**：弹窗变量名不匹配
**解决**：检查 `showXXX.value` 变量名是否正确

### 问题 3：应用直接退出
**原因**：弹窗检查逻辑有误
**解决**：在 `App.addListener` 中添加 `console.log` 调试

## 📊 版本信息

- **实现版本**：v1.7.7+
- **修复版本 1**：v1.7.7.1（2026-02-27 18:22）- 修复 AI 配置和番茄钟
- **修复版本 2**：v1.7.7.2（2026-02-27 18:36）- 修复报告模板、演示模式、AI 加载
- **依赖版本**：
  - `@capacitor/app`: ^8.0.1
  - `@capacitor/core`: ^8.1.0
- **测试平台**：Android 10+
- **支持弹窗数量**：37 个弹窗 + 1 个加载状态

## 🔗 相关文档

- [Capacitor App Plugin 官方文档](https://capacitorjs.com/docs/apis/app)
- [Android 返回手势指南](https://developer.android.com/guide/navigation/gestures)

## 📝 更新日志

### v1.7.7.2 (2026-02-27 18:36)
- ✅ 新增 AI 加载动画强制中断支持
- ✅ 新增演示模式返回手势支持
- ✅ 新增报告模板弹窗返回支持
- ✅ 新增周报历史弹窗返回支持
- ✅ 总计支持 37 个弹窗 + 1 个加载状态

### v1.7.7.1 (2026-02-27 18:22)
- ✅ 修复 AI 模型配置页面不支持返回手势
- ✅ 修复番茄钟计时器页面不支持返回手势
- ✅ 新增 24 个遗漏的弹窗支持
- ✅ 优化弹窗层级结构（三层架构）
- ✅ 支持多层弹窗逐层关闭
