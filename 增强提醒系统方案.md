# 增强提醒系统实现方案

## 当前问题
- 通知可以被滑动关闭
- 没有持续铃声
- 无法全屏唤醒

## 解决方案

### 方案A：优化现有LocalNotifications（快速实现）

#### 1. 添加铃声和震动
```javascript
const notification = {
  id: task.id,
  title: '⏰ 任务提醒',
  body: task.text,
  schedule: { at: reminderTime },
  channelId: 'task-reminders-urgent', // 使用紧急渠道
  sound: 'default', // 系统铃声
  vibrate: [500, 300, 500, 300, 500], // 震动模式
  ongoing: true, // 不可滑动关闭
  autoCancel: false, // 点击不消失
  priority: 5, // 最高优先级
  importance: 5, // IMPORTANCE_HIGH
  extra: { taskId: task.id }
}
```

#### 2. 创建高优先级通知渠道
```javascript
// 在应用启动时创建
await LocalNotifications.createChannel({
  id: 'task-reminders-urgent',
  name: '紧急任务提醒',
  description: '重要任务的提醒通知',
  importance: 5, // IMPORTANCE_HIGH
  sound: 'default',
  vibration: true,
  visibility: 1 // VISIBILITY_PUBLIC
})
```

#### 3. 添加操作按钮
```javascript
actions: [
  {
    id: 'complete',
    title: '✅ 完成',
    foreground: true
  },
  {
    id: 'snooze',
    title: '⏰ 稍后提醒',
    foreground: false
  }
]
```

**优点：**
- ✅ 快速实现（1小时内）
- ✅ 无需额外插件
- ✅ 有铃声和震动

**缺点：**
- ❌ 无法全屏唤醒
- ❌ 用户仍可通过设置关闭

---

### 方案B：使用capacitor-fullscreen-notification（完整方案）

#### 1. 安装插件
```bash
npm install capacitor-fullscreen-notification
npx cap sync android
```

#### 2. 修改AndroidManifest.xml
在`<activity>`标签中添加：
```xml
android:showWhenLocked="true"
android:turnScreenOn="true"
```

#### 3. 使用方法
```javascript
import { FullScreenNotification } from 'capacitor-fullscreen-notification'

// 监听全屏通知启动
FullScreenNotification.addListener('launch', (data) => {
  console.log('全屏通知启动:', data)
  // 导航到任务详情页
  router.push(`/task/${data.fullScreenId}`)
})

// 发送全屏通知
await LocalNotifications.schedule({
  notifications: [{
    id: task.id,
    title: '⏰ 紧急任务提醒',
    body: task.text,
    schedule: { at: reminderTime },
    extra: {
      fullScreenId: `task-${task.id}`,
      channelId: 'fullscreen-urgent',
      channelName: '全屏紧急提醒',
      title: '⏰ 紧急任务',
      text: task.text,
      timeout: '30000', // 30秒后自动关闭
      vibrationPattern: '[500, 300, 500, 300, 500, 300]',
      actionButtons: JSON.stringify([
        { id: 'complete', text: '✅ 完成' },
        { id: 'snooze', text: '⏰ 稍后提醒' }
      ])
    }
  }]
})
```

**优点：**
- ✅ 锁屏状态直接打开APP
- ✅ 全屏显示，无法忽略
- ✅ 支持震动和铃声
- ✅ 支持操作按钮

**缺点：**
- ⚠️ Android 14+需要用户手动授权
- ⚠️ 需要额外开发时间（2-3小时）

---

## 推荐实施步骤

### 第一阶段：快速优化（今天完成）
1. 优化现有LocalNotifications
2. 添加铃声和震动
3. 创建高优先级渠道
4. 添加操作按钮

### 第二阶段：完整方案（后续）
1. 安装fullscreen插件
2. 修改AndroidManifest
3. 实现全屏唤醒逻辑
4. 添加权限引导

---

## 代码实现（方案A）

### 1. 修改offlineTaskStore.js

```javascript
// 创建紧急通知渠道
async createUrgentChannel() {
  try {
    await LocalNotifications.createChannel({
      id: 'task-reminders-urgent',
      name: '紧急任务提醒',
      description: '重要任务的提醒通知，会持续响铃和震动',
      importance: 5, // IMPORTANCE_HIGH
      sound: 'default',
      vibration: true,
      visibility: 1, // VISIBILITY_PUBLIC
      lights: true,
      lightColor: '#FF0000'
    })
  } catch (error) {
    console.error('创建通知渠道失败:', error)
  }
},

// 增强版提醒通知
async scheduleTaskReminder(task) {
  if (!task.enableReminder || !task.reminderTime) return

  try {
    const reminderTime = new Date(task.reminderTime)
    if (reminderTime <= new Date()) return

    const notification = {
      id: task.id,
      title: task.forceReminder ? '🚨 紧急任务提醒' : '⏰ 任务提醒',
      body: task.text,
      schedule: { at: reminderTime },
      channelId: task.forceReminder ? 'task-reminders-urgent' : 'task-reminders-v3',
      sound: 'default', // 系统铃声
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: task.forceReminder ? '#FF0000' : '#FF6B6B',
      extra: { 
        taskId: task.id,
        forceReminder: task.forceReminder || false
      }
    }

    // 强制提醒增强配置
    if (task.forceReminder) {
      notification.ongoing = true // 不可滑动关闭
      notification.autoCancel = false // 点击不消失
      notification.priority = 5 // 最高优先级
      notification.importance = 5
      notification.vibrate = [500, 300, 500, 300, 500, 300] // 持续震动
      notification.actions = [
        {
          id: 'complete',
          title: '✅ 完成任务',
          foreground: true
        },
        {
          id: 'snooze',
          title: '⏰ 10分钟后提醒',
          foreground: false
        }
      ]
    }

    await LocalNotifications.schedule({ notifications: [notification] })
  } catch (error) {
    console.error('安排提醒失败:', error)
  }
}
```

### 2. 在App启动时创建渠道

```javascript
// main.js 或 App.vue
import { LocalNotifications } from '@capacitor/local-notifications'

// 应用启动时
await LocalNotifications.createChannel({
  id: 'task-reminders-urgent',
  name: '紧急任务提醒',
  description: '重要任务的提醒通知',
  importance: 5,
  sound: 'default',
  vibration: true
})
```

---

## 测试方法

1. 创建一个1分钟后的强制提醒任务
2. 锁屏手机
3. 等待提醒触发
4. 检查：
   - ✅ 是否有铃声
   - ✅ 是否震动
   - ✅ 是否无法滑动关闭
   - ✅ 点击后是否不消失

---

## 注意事项

1. **Android 12+**: 需要在AndroidManifest.xml中声明SCHEDULE_EXACT_ALARM权限
2. **Android 13+**: 需要请求POST_NOTIFICATIONS权限
3. **Android 14+**: 全屏Intent需要用户手动授权
4. **厂商限制**: 小米/华为/OPPO等可能需要用户手动开启"后台弹出界面"权限

---

## 下一步

你想先实现哪个方案？
- A: 快速优化现有通知（1小时）
- B: 完整全屏方案（2-3小时）
