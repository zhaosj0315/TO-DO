# 通知功能快速测试

## 🧪 立即测试（推荐）

### 步骤1：启动应用
```bash
npm run dev
```

### 步骤2：测试通知
1. 登录应用
2. 点击"展开"按钮
3. 输入任意任务名称
4. 向下滚动到"🔔 启用提醒"区域
5. **点击右侧的"🧪 测试"按钮**
6. 等待5秒，应该收到测试通知

### 预期结果
- 点击测试按钮后，显示"测试通知已设置，5秒后触发"
- 5秒后收到标题为"🧪 测试通知"的弹窗
- 内容："如果你看到这条通知，说明通知功能正常！"

## 📱 真实任务提醒测试

### 如果测试通知成功
1. 勾选"🔔 启用提醒"
2. 选择1分钟后的时间
3. 提交任务
4. 等待1分钟，应该收到任务提醒

### 如果测试通知失败
检查以下几点：

#### 1. 浏览器通知权限
- Chrome：地址栏左侧 → 网站设置 → 通知 → 允许
- 或者：chrome://settings/content/notifications

#### 2. 系统通知权限（macOS）
- 系统偏好设置 → 通知 → Chrome → 允许通知

#### 3. 控制台错误
- 按F12打开开发者工具
- 查看Console标签是否有错误

## 🔍 调试信息

### 查看通知是否已调度
在浏览器控制台执行：
```javascript
// 查看所有已调度的通知
const { LocalNotifications } = await import('@capacitor/local-notifications')
const pending = await LocalNotifications.getPending()
console.log('待触发的通知:', pending)
```

### 立即触发通知（不等待）
```javascript
const { LocalNotifications } = await import('@capacitor/local-notifications')
await LocalNotifications.schedule({
  notifications: [{
    title: '立即测试',
    body: '这是一个立即触发的通知',
    id: 77777,
    schedule: { at: new Date(Date.now() + 100) } // 0.1秒后
  }]
})
```

## 📋 通知格式对比

### 短信验证码（已验证可用）
```javascript
{
  title: '【TO-DO 验证码】',
  body: '您的登录验证码为：123456',
  id: 1,
  schedule: { at: new Date(Date.now() + 1000) }
}
```

### 任务提醒（完全相同格式）
```javascript
{
  title: '🔔 任务名称',
  body: '任务提醒时间到了！',
  id: task.id,
  schedule: { at: reminderTime }
}
```

## ❓ 常见问题

### Q: 点击测试按钮没反应？
A: 查看控制台是否有错误，确认通知权限已授予

### Q: 5秒后没有通知？
A: 
1. 检查浏览器是否在前台（某些浏览器后台不显示通知）
2. 检查系统勿扰模式是否开启
3. 尝试刷新页面重新测试

### Q: Android真机测试？
A: 
```bash
./build-apk.sh
```
安装后测试，Android通知更可靠

## 🎯 下一步

如果测试通知成功：
- ✅ 通知功能正常
- ✅ 可以正常使用任务提醒

如果测试通知失败：
- ❌ 需要检查权限设置
- ❌ 可能是浏览器/系统限制
- ❌ 建议在Android真机测试
