# 统一通知系统使用指南

## 📋 概述

已创建统一的 Bottom Sheet 样式通知系统，替代原生 `alert()` 和 `confirm()`。

## 🎨 特点

- ✅ 底部滑出动画
- ✅ 左右全屏布局
- ✅ 紫色渐变头部
- ✅ 顶部小横条
- ✅ 统一视觉风格

## 📦 组件结构

```
src/
├── components/
│   └── NotificationSheet.vue    # 通知组件
└── services/
    └── notificationService.js   # 通知服务
```

## 🚀 使用方法

### 1. 导入服务

```javascript
import { showSuccess, showError, showWarning, showInfo, showConfirm } from '@/services/notificationService'
```

### 2. 显示通知

#### 成功通知
```javascript
showSuccess('连接成功！', '模型响应正常，可以正常使用。')
```

#### 错误通知
```javascript
showError('连接失败', `错误信息：${error.message}\n\n请检查：\n1. URL地址是否正确\n2. 模型服务是否启动`)
```

#### 警告通知
```javascript
showWarning('注意', '此操作可能影响现有配置')
```

#### 信息通知
```javascript
showInfo('提示', '操作已完成')
```

#### 确认对话框
```javascript
const confirmed = await showConfirm('确定要删除吗？', '此操作不可恢复')
if (confirmed) {
  // 用户点击确定
} else {
  // 用户点击取消
}
```

### 3. 自定义通知

```javascript
import { showNotification } from '@/services/notificationService'

showNotification({
  type: 'success',        // success, error, warning, info, confirm
  title: '自定义标题',
  message: '主要消息',
  details: '详细信息（可选）',
  showCancel: false,      // 是否显示取消按钮
  confirmText: '确定',
  cancelText: '取消'
})
```

## 🔄 替换原有 alert

### 替换前
```javascript
alert('✅ 连接成功！\n\n模型响应正常，可以正常使用。')
```

### 替换后
```javascript
showSuccess('连接成功！', '模型响应正常，可以正常使用。')
```

### 替换前（confirm）
```javascript
if (confirm('确定要删除吗？')) {
  // 删除逻辑
}
```

### 替换后
```javascript
const confirmed = await showConfirm('确定要删除吗？', '此操作不可恢复')
if (confirmed) {
  // 删除逻辑
}
```

## 📝 待替换的文件

### 高优先级
- [x] `AIModelConfig.vue` - 已导入服务
- [ ] `AIModelConfig.vue` - 替换所有 alert 调用
- [ ] `AIConfigModal.vue` - 替换所有 alert 调用

### 中优先级
- [ ] `TodoView.vue` - 替换部分 alert
- [ ] 其他组件中的 alert

## 🎯 替换示例

### AIModelConfig.vue

```javascript
// 测试连接成功
// 替换前：
alert('✅ 连接成功！\n\n模型响应正常，可以正常使用。')

// 替换后：
showSuccess('连接成功！', '模型响应正常，可以正常使用。')

// 测试连接失败
// 替换前：
alert(`❌ 连接失败\n\n错误信息：${error.message}\n\n请检查：\n1. URL地址是否正确\n2. 模型服务是否启动\n3. 网络连接是否正常`)

// 替换后：
showError('连接失败', `错误信息：${error.message}\n\n请检查：\n1. URL地址是否正确\n2. 模型服务是否启动\n3. 网络连接是否正常`)

// 测试全部完成
// 替换前：
alert(message)

// 替换后：
showInfo('测试完成', message)
```

## 🎨 UI效果

### 成功通知
```
┌─────────────────────────────────┐
│  ← 返回  |  ✅ 成功  |  占位     │ (紫色渐变)
├─────────────────────────────────┤
│                                  │
│            ✅                    │
│                                  │
│        连接成功！                │
│                                  │
│  模型响应正常，可以正常使用。    │
│                                  │
├─────────────────────────────────┤
│           [确定]                 │
└─────────────────────────────────┘
```

### 确认对话框
```
┌─────────────────────────────────┐
│  ← 返回  |  ❓ 确认  |  占位     │ (紫色渐变)
├─────────────────────────────────┤
│                                  │
│            ❓                    │
│                                  │
│      确定要删除这个报告吗？      │
│                                  │
│      此操作不可恢复              │
│                                  │
├─────────────────────────────────┤
│      [取消]      [确定]          │
└─────────────────────────────────┘
```

## ✅ 优势

1. **视觉统一**：所有通知使用相同的 Bottom Sheet 样式
2. **用户体验**：符合移动端操作习惯
3. **易于维护**：集中管理通知逻辑
4. **功能丰富**：支持成功/错误/警告/信息/确认等多种类型
5. **可扩展**：易于添加新的通知类型

## 🔧 技术实现

### 全局状态管理
```javascript
// notificationService.js
export const notificationState = ref({
  visible: false,
  type: 'info',
  title: '提示',
  message: '',
  details: '',
  showCancel: false,
  onConfirm: null,
  onCancel: null
})
```

### Promise 支持
```javascript
export function showNotification(options) {
  return new Promise((resolve) => {
    notificationState.value = {
      ...options,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false)
    }
  })
}
```

## 📊 进度追踪

- [x] 创建 NotificationSheet 组件
- [x] 创建 notificationService 服务
- [x] 集成到 App.vue
- [x] 导入到 AIModelConfig.vue
- [ ] 替换 AIModelConfig.vue 中的 alert
- [ ] 替换 AIConfigModal.vue 中的 alert
- [ ] 替换其他组件中的 alert

## 🎉 总结

统一通知系统已创建完成，现在可以逐步替换项目中的 `alert()` 和 `confirm()` 调用，提供更好的用户体验！
