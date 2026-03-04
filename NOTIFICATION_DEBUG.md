# 通知系统测试指南

## 问题诊断

用户反馈：点击"测试连接"后，显示的是原生 alert() 弹窗（顶部居中），而不是 Bottom Sheet（底部滑出）。

## 可能的原因

1. **浏览器缓存**：开发服务器缓存了旧代码
2. **热更新失败**：Vite 热更新没有生效
3. **导入路径错误**：`@/services/notificationService` 路径解析失败

## 解决方案

### 方案1：强制刷新浏览器
```bash
# 在浏览器中按
Cmd + Shift + R  (Mac)
Ctrl + Shift + R (Windows/Linux)
```

### 方案2：重启开发服务器
```bash
# 停止当前服务器 (Ctrl + C)
# 然后重新启动
npm run dev
```

### 方案3：清除缓存并重新构建
```bash
# 删除 node_modules/.vite 缓存
rm -rf node_modules/.vite

# 重新启动
npm run dev
```

### 方案4：检查控制台错误
打开浏览器开发者工具（F12），查看 Console 标签页是否有错误信息。

## 验证步骤

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 点击"测试连接"按钮
4. 查看是否有以下错误：
   - `Cannot find module '@/services/notificationService'`
   - `showSuccess is not defined`
   - 其他导入错误

## 手动测试

在浏览器控制台中执行：

```javascript
// 测试1：检查 notificationState 是否存在
console.log(window.__VUE_DEVTOOLS_GLOBAL_HOOK__)

// 测试2：手动触发通知（需要在 Vue 组件中）
// 打开 Vue DevTools，在任意组件中执行：
import { showSuccess } from '@/services/notificationService'
showSuccess('测试', '这是一个测试通知')
```

## 预期效果

正确的 Bottom Sheet 通知应该：
1. 从屏幕底部滑出
2. 左右全屏（width: 100%）
3. 紫色渐变头部
4. 顶部有小横条
5. 圆角顶部（20px）

## 如果还是不行

检查 `dist/` 目录中的构建文件是否包含 `NotificationSheet` 组件：

```bash
grep -r "NotificationSheet" dist/
```

如果没有找到，说明构建时组件没有被包含进去。
