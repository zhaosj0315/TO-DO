# 批量替换 alert() 为统一通知服务

## 已完成替换

### AIModelConfig.vue
- [x] `alert('✅ 配置已删除')` → `showSuccess('配置已删除')`
- [x] `alert('请先输入厂商地址')` → `showError('请先输入厂商地址')`
- [x] 测试单个模型的3个alert → showSuccess/showError
- [ ] `alert('暂无模型配置')` → `showInfo('暂无模型配置')`
- [ ] 测试全部的alert → `showInfo('测试完成', message)`
- [ ] 导入配置的alert → showSuccess/showError
- [ ] 其他11个alert

## 替换规则

### 成功提示
```javascript
// 替换前
alert('✅ 操作成功')

// 替换后
showSuccess('操作成功')
```

### 错误提示
```javascript
// 替换前
alert('❌ 操作失败')

// 替换后
showError('操作失败', '详细错误信息')
```

### 信息提示
```javascript
// 替换前
alert('提示信息')

// 替换后
showInfo('提示信息')
```

### 确认对话框
```javascript
// 替换前
if (confirm('确定删除吗？')) {
  // 删除逻辑
}

// 替换后
const confirmed = await showConfirm('确定删除吗？', '此操作不可恢复')
if (confirmed) {
  // 删除逻辑
}
```

## 待替换文件统计

- TodoView.vue: 29个
- AIModelConfig.vue: 15个 (进行中)
- LogStats.vue: 6个
- UnifiedReportModal.vue: 6个
- TaskDetailModal.vue: 5个
- AIConfigModal.vue: 3个
- 其他: 9个

**总计**: 73个

## 优先级

1. **P0 - 高频使用**: AIModelConfig.vue, TodoView.vue
2. **P1 - 中频使用**: UnifiedReportModal.vue, TaskDetailModal.vue
3. **P2 - 低频使用**: 其他组件
