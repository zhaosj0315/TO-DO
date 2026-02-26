# 全屏提醒权限设置指南

## 问题现象
- 提醒通知已触发，但没有全屏显示
- 日志显示："Exact alarms not allowed in user settings"

## 原因
Android 12+ 需要用户手动授权以下权限：
1. **精确闹钟权限** (SCHEDULE_EXACT_ALARM)
2. **全屏Intent权限** (USE_FULL_SCREEN_INTENT)

## 解决方案

### 步骤1：授权精确闹钟权限

**方法A：通过设置**
1. 打开手机"设置"
2. 进入"应用" → "TODO App"
3. 找到"闹钟和提醒"
4. 开启"允许设置闹钟和提醒"

**方法B：通过代码引导**
```javascript
// 检查并请求精确闹钟权限
async function requestExactAlarmPermission() {
  // Android 12+ 需要引导用户到设置页面
  if (Capacitor.getPlatform() === 'android') {
    const { App } = await import('@capacitor/app')
    await App.openUrl({ 
      url: 'android.settings.REQUEST_SCHEDULE_EXACT_ALARM' 
    })
  }
}
```

### 步骤2：授权全屏Intent权限

**Android 14+特别注意：**
需要用户手动授权"显示在其他应用上层"权限

1. 打开手机"设置"
2. 进入"应用" → "TODO App"
3. 找到"显示在其他应用上层"
4. 开启权限

### 步骤3：重新测试

1. 创建一个强制提醒任务
2. 设置1分钟后提醒
3. 锁屏手机
4. 等待提醒触发

**预期效果：**
- ✅ 屏幕自动点亮
- ✅ 全屏显示通知
- ✅ 持续响铃和震动
- ✅ 显示操作按钮

## 厂商特殊设置

### 小米 MIUI
1. 设置 → 应用设置 → 应用管理 → TODO App
2. 开启"后台弹出界面"
3. 开启"锁屏显示"
4. 开启"显示悬浮窗"

### 华为 EMUI
1. 设置 → 应用 → 应用管理 → TODO App
2. 开启"锁屏显示"
3. 开启"悬浮窗"

### OPPO ColorOS
1. 设置 → 应用管理 → TODO App
2. 开启"悬浮窗"
3. 开启"锁屏显示"

### vivo OriginOS
1. 设置 → 应用与权限 → 应用管理 → TODO App
2. 开启"悬浮窗"
3. 开启"锁屏显示"

## 调试日志

查看是否成功：
```
✅ 成功：
- "Notification scheduled with exact alarm"
- 屏幕点亮并显示全屏通知

❌ 失败：
- "Exact alarms not allowed"
- 只显示普通通知栏图标
```

## 代码实现（权限检查）

在TodoView.vue的onMounted中添加：

```javascript
// 检查精确闹钟权限
const checkAlarmPermission = async () => {
  try {
    // 显示权限引导
    const needPermission = confirm(
      '为了确保任务提醒准时触发，需要授权以下权限：\n\n' +
      '1. 精确闹钟权限\n' +
      '2. 全屏显示权限\n\n' +
      '是否前往设置？'
    )
    
    if (needPermission) {
      // 引导用户到设置页面
      showNotification('请在设置中开启"闹钟和提醒"权限', 'info')
    }
  } catch (error) {
    console.error('权限检查失败:', error)
  }
}

// 首次使用时检查
const { value: hasCheckedPermission } = await Preferences.get({ 
  key: 'hasCheckedAlarmPermission' 
})

if (!hasCheckedPermission) {
  await checkAlarmPermission()
  await Preferences.set({ 
    key: 'hasCheckedAlarmPermission', 
    value: 'true' 
  })
}
```

## 总结

全屏提醒需要3个条件：
1. ✅ AndroidManifest.xml配置正确
2. ✅ 代码配置正确（ongoing, autoCancel, priority等）
3. ⚠️ **用户手动授权权限**（最关键）

当前问题就是第3点，需要用户手动开启权限。
