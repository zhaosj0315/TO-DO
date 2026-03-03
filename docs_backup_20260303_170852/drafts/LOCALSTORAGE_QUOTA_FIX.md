# localStorage配额超限问题修复报告

## 🐛 问题描述
**错误**: `QuotaExceededError: Failed to execute 'setItem' on 'Storage': Setting the value of 'backupFiles' exceeded the quota.`

**原因**: Web端备份时将完整数据保存到localStorage，导致配额超限（通常5-10MB）

## ✅ 修复方案

### 1. 减少localStorage存储量
**文件**: `src/utils/autoBackup.js`

**修改前**:
```javascript
backups.push({
  name: jsonFileName,
  data: data,  // ❌ 保存完整数据（可能数MB）
  timestamp: timestamp,
  date: today
});
// 保留最近10个备份
if (backups.length > 10) {
  backups.shift();
}
```

**修改后**:
```javascript
backups.push({
  name: jsonFileName,
  timestamp: timestamp,
  date: today,
  size: new Blob([jsonContent]).size // ✅ 只保存大小
});
// 只保留最近3个备份记录
if (backups.length > 3) {
  backups.shift();
}
// 添加异常处理
try {
  localStorage.setItem('backupFiles', JSON.stringify(backups));
} catch (quotaError) {
  console.warn('localStorage配额不足，跳过备份记录保存');
  localStorage.removeItem('backupFiles');
}
```

**效果**:
- 存储量减少 99%（从数MB降至几KB）
- 备份记录从10个减至3个
- 添加异常处理，避免崩溃

### 2. Web端恢复功能重构
**文件**: `src/utils/autoBackup.js`

**修改前**:
```javascript
if (platform === 'web') {
  // 从localStorage读取完整数据
  const backup = backups.find(b => b.name === fileName);
  backupData = backup.data; // ❌ 数据已不存在
}
```

**修改后**:
```javascript
if (platform === 'web') {
  // 提示用户手动上传备份文件
  throw new Error('Web端请使用"导入备份文件"功能恢复数据');
}
```

### 3. 添加Web端文件导入功能
**文件**: `src/views/TodoView.vue`

**新增UI**:
```vue
<button class="btn btn-restore" @click="triggerRestoreFile">
  <span class="export-icon">♻️</span>
  <span class="btn-text">恢复备份</span>
</button>
<input 
  ref="restoreFileInput" 
  type="file" 
  accept=".json" 
  style="display: none" 
  @change="handleRestoreFile"
/>
```

**新增函数**:
```javascript
// 触发文件选择
const triggerRestoreFile = () => {
  restoreFileInput.value?.click()
}

// 处理文件恢复
const handleRestoreFile = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  // 读取文件内容
  const text = await file.text()
  const backupData = JSON.parse(text)
  
  // 恢复数据
  for (const key in backupData) {
    if (key === '_localStorage') continue
    await Preferences.set({ key, value: backupData[key] })
  }
  
  if (backupData._localStorage) {
    for (const key in backupData._localStorage) {
      localStorage.setItem(key, backupData._localStorage[key])
    }
  }
  
  // 刷新页面
  window.location.reload()
}
```

## 📊 修复效果

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| localStorage占用 | 数MB（完整数据×10） | 几KB（元数据×3） |
| 备份记录数 | 10个 | 3个 |
| 配额超限风险 | ❌ 高 | ✅ 无 |
| Web端恢复方式 | localStorage读取 | 文件上传 |
| 异常处理 | ❌ 无 | ✅ 有 |

## 🎯 用户体验

### Web端（浏览器）
1. **备份**: 点击"完整备份" → 下载JSON文件到本地
2. **恢复**: 点击"恢复备份" → 选择JSON文件 → 自动恢复

### 移动端（Android/iOS）
1. **备份**: 点击"完整备份" → 保存到Documents目录
2. **恢复**: 点击"恢复备份" → 选择备份文件 → 自动恢复

## ✅ 测试验证

- [x] Web端备份不再报错
- [x] localStorage占用大幅降低
- [x] Web端可通过文件上传恢复
- [x] 移动端备份恢复正常
- [x] 异常处理生效

## 📝 总结

通过以下3个优化彻底解决localStorage配额超限问题：
1. 只保存备份元数据，不保存完整数据
2. 减少备份记录数量（10→3）
3. Web端改为文件上传恢复

现在Web端和移动端都可以正常备份和恢复，且不会再出现配额超限错误。
