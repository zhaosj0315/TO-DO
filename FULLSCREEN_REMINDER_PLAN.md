# 全屏提醒实现方案（无需额外插件）

## 方案：使用LocalNotifications + Android原生配置

由于capacitor-fullscreen-notification与Capacitor 8不兼容，我们采用以下方案：

### 核心思路
1. 使用LocalNotifications的最高优先级配置
2. 修改AndroidManifest.xml添加全屏权限
3. 创建自定义通知渠道（最高重要性）
4. 添加持续铃声和震动
5. 设置为不可关闭（ongoing）

### 实现步骤

#### 1. 修改AndroidManifest.xml

在 `android/app/src/main/AndroidManifest.xml` 的 `<activity>` 标签中添加：

```xml
<activity
    android:name=".MainActivity"
    android:showWhenLocked="true"
    android:turnScreenOn="true"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
    android:label="@string/title_activity_main"
    android:launchMode="singleTask"
    android:theme="@style/AppTheme.NoActionBarLaunch">
```

在 `<manifest>` 标签中添加权限：

```xml
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

#### 2. 创建高优先级通知渠道

```javascript
// 在应用启动时创建
async function createUrgentChannel() {
  await LocalNotifications.createChannel({
    id: 'task-urgent-alarm',
    name: '紧急任务闹钟',
    description: '重要任务的闹钟提醒，会全屏显示',
    importance: 5, // IMPORTANCE_HIGH
    sound: 'default',
    vibration: true,
    visibility: 1, // VISIBILITY_PUBLIC
    lights: true,
    lightColor: '#FF0000'
  })
}
```

#### 3. 发送全屏提醒通知

```javascript
async function scheduleFullScreenReminder(task) {
  const notification = {
    id: task.id,
    title: '🚨 紧急任务提醒',
    body: task.text,
    schedule: { at: new Date(task.reminderTime) },
    channelId: 'task-urgent-alarm',
    sound: 'default',
    smallIcon: 'ic_stat_icon_config_sample',
    iconColor: '#FF0000',
    
    // 全屏配置
    ongoing: true, // 不可滑动关闭
    autoCancel: false, // 点击不消失
    priority: 5, // 最高优先级
    importance: 5,
    
    // 震动模式（持续震动）
    vibrate: [0, 500, 300, 500, 300, 500, 300, 500],
    
    // 操作按钮
    actions: [
      {
        id: 'complete',
        title: '✅ 完成任务',
        foreground: true
      },
      {
        id: 'snooze',
        title: '⏰ 10分钟后提醒',
        foreground: false
      },
      {
        id: 'dismiss',
        title: '❌ 关闭',
        foreground: true,
        destructive: true
      }
    ],
    
    extra: { 
      taskId: task.id,
      fullScreen: true
    }
  }
  
  await LocalNotifications.schedule({ notifications: [notification] })
}
```

#### 4. 监听通知操作

```javascript
// 监听通知操作
LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
  const { actionId, notification: notif } = notification
  const taskId = notif.extra?.taskId
  
  if (actionId === 'complete') {
    // 完成任务
    await taskStore.toggleTaskStatus(taskId)
    await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
  } else if (actionId === 'snooze') {
    // 10分钟后再提醒
    const snoozeTime = new Date(Date.now() + 10 * 60 * 1000)
    await LocalNotifications.schedule({
      notifications: [{
        ...notif,
        schedule: { at: snoozeTime }
      }]
    })
  } else if (actionId === 'dismiss') {
    // 关闭通知
    await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
  }
})
```

### 效果说明

**锁屏状态：**
- ✅ 屏幕自动点亮
- ✅ 显示在锁屏界面上方
- ✅ 持续响铃和震动
- ✅ 无法滑动关闭

**解锁状态：**
- ✅ 全屏弹窗（Heads-up notification）
- ✅ 持续响铃和震动
- ✅ 必须点击按钮才能关闭

### 注意事项

1. **Android 12+**: 需要用户授权"显示在其他应用上层"权限
2. **Android 13+**: 需要授权通知权限
3. **厂商限制**: 
   - 小米：需要开启"后台弹出界面"
   - 华为：需要开启"锁屏显示"
   - OPPO：需要开启"悬浮窗"

### 权限引导

添加权限检查和引导：

```javascript
async function checkFullScreenPermission() {
  // 检查通知权限
  const { display } = await LocalNotifications.checkPermissions()
  
  if (display !== 'granted') {
    const result = await LocalNotifications.requestPermissions()
    if (result.display !== 'granted') {
      alert('请在设置中开启通知权限，以便接收任务提醒')
      return false
    }
  }
  
  return true
}
```

### 测试方法

1. 创建一个1分钟后的强制提醒任务
2. 锁屏手机
3. 等待提醒触发
4. 观察：
   - 屏幕是否点亮
   - 是否显示在锁屏上
   - 是否持续响铃震动
   - 是否无法滑动关闭

---

## 实施清单

- [ ] 修改AndroidManifest.xml
- [ ] 创建紧急通知渠道
- [ ] 修改scheduleTaskReminder方法
- [ ] 添加通知操作监听
- [ ] 添加权限检查
- [ ] 测试锁屏提醒
- [ ] 测试解锁提醒
- [ ] 添加用户引导文档
