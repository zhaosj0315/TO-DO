# 自动备份逻辑审查报告

## 📋 审查时间
2026-03-09 23:31

---

## 🔍 审查范围

### **核心文件**
1. `src/utils/autoBackup.js` - 备份核心逻辑
2. `src/stores/offlineTaskStore.js` - 调用入口

---

## ✅ 正确的设计

### **1. 触发机制** ✅
```javascript
async saveTasks() {
  // 1. 本地存储（主数据源）
  await Preferences.set(...)
  
  // 2. 自动备份（每天首次变动时）
  await performBackup()
  
  // 3. 数据库同步（异步）
  this.syncToDatabase()
}
```

**优点**：
- ✅ 每次保存任务时触发
- ✅ 自动备份不阻塞主流程
- ✅ 顺序合理（本地→备份→数据库）

---

### **2. 去重机制** ✅
```javascript
export async function performBackup(force = false) {
  const today = getTodayDate()
  const lastBackup = await getLastBackupDate()
  
  // 今天已备份过，且非强制备份，跳过
  if (!force && today === lastBackup) {
    return { success: true, skipped: true }
  }
  // ...
}
```

**优点**：
- ✅ 每天只备份一次
- ✅ 避免重复备份
- ✅ 支持强制备份（手动备份）

---

### **3. 数据完整性** ✅
```javascript
async function getAllData() {
  // 1. Preferences 基础数据
  const keys = ['users', 'currentUser', 'userInfo', 'phoneMapping', 'security', 'lastBackupDate']
  
  // 2. 所有用户的任务数据
  for (const username in users) {
    const tasksKey = `tasks_${username}`
    const deletedKey = `deletedTasks_${username}`
    const notifiedKey = `notified_reminders_${username}`
    // ...
  }
  
  // 3. localStorage 数据（AI相关）
  const localStorageKeys = [
    'weekly_reports', 'unified_reports', 'ai_chat_list', 'ai_models', ...
  ]
  
  // 4. 所有用户的collections数据（文件夹）
  for (const username in users) {
    const collectionsKey = `collections_${username}`
    // ...
  }
}
```

**优点**：
- ✅ 备份所有用户数据
- ✅ 包含任务、回收站、提醒
- ✅ 包含AI配置、对话、报告
- ✅ 包含文件夹数据

---

## ⚠️ 发现的问题

### **问题1：localStorage数据备份不完整** 🔴 严重

**当前逻辑**：
```javascript
const { value: currentUserStr } = await Preferences.get({ key: 'currentUser' })
const currentUser = currentUserStr || 'guest'

const localStorageKeys = [
  // 只备份当前用户的数据
  `weekly_reports_${currentUser}`,
  `unified_reports_${currentUser}`,
  `ai_chat_list_${currentUser}`,
  // ...
]
```

**问题**：
- ❌ 只备份当前登录用户的localStorage数据
- ❌ 其他用户的AI配置、报告、对话不会被备份
- ❌ 切换用户后，之前用户的数据丢失

**影响**：
- 用户A登录时备份 → 只备份用户A的数据
- 用户B的AI配置、报告全部丢失 ❌

**修复方案**：
```javascript
// 应该备份所有用户的localStorage数据
const { value: usersStr } = await Preferences.get({ key: 'users' })
if (usersStr) {
  const users = JSON.parse(usersStr)
  for (const username in users) {
    const userKeys = [
      `weekly_reports_${username}`,
      `unified_reports_${username}`,
      `ai_chat_list_${username}`,
      `ai_models_${username}`,
      `ai_default_model_${username}`,
      `ai_provider_configs_${username}`,
      `last_app_version_${username}`
    ]
    
    for (const key of userKeys) {
      const value = localStorage.getItem(key)
      if (value) data._localStorage[key] = value
    }
  }
}
```

---

### **问题2：文件夹数据备份位置错误** 🟡 中等

**当前逻辑**：
```javascript
// 4. 获取所有用户的collections数据（文件夹）
if (usersStr) {
  const users = JSON.parse(usersStr)
  for (const username in users) {
    const collectionsKey = `collections_${username}`
    const { value: collections } = await Preferences.get({ key: collectionsKey })
    if (collections) data[collectionsKey] = collections
  }
}
```

**问题**：
- ⚠️ 文件夹数据在步骤4备份
- ⚠️ 但任务数据在步骤2备份
- ⚠️ 逻辑分散，不易维护

**建议**：
- 合并到步骤2，统一备份用户数据

---

### **问题3：恢复逻辑缺少collections** 🟡 中等

**当前恢复逻辑**：
```javascript
export async function restoreBackup(fileName) {
  // 1. 恢复 Preferences 数据
  for (const key in backupData) {
    if (key === '_localStorage') continue
    await Preferences.set({ key, value: backupData[key] })
  }
  
  // 2. 恢复 localStorage 数据
  if (backupData._localStorage) {
    for (const key in backupData._localStorage) {
      localStorage.setItem(key, backupData._localStorage[key])
    }
  }
}
```

**问题**：
- ✅ 恢复Preferences数据（包含collections）
- ✅ 恢复localStorage数据
- ⚠️ 但没有明确说明collections已恢复

**建议**：
- 添加日志，明确显示恢复的数据类型

---

### **问题4：移动端路径不一致** 🟡 中等

**备份路径**：
```javascript
await Filesystem.writeFile({
  path: `TODO-App-backups/${fileName}`,  // ✅ 正确
  directory: Directory.Documents
})
```

**删除路径**：
```javascript
await Filesystem.deleteFile({
  path: `backups/${fileName}`,  // ❌ 错误！缺少 TODO-App- 前缀
  directory: Directory.Documents
})
```

**问题**：
- ❌ 删除时路径不一致
- ❌ 会导致删除失败

**修复**：
```javascript
await Filesystem.deleteFile({
  path: `TODO-App-backups/${fileName}`,  // ✅ 修复
  directory: Directory.Documents
})
```

---

### **问题5：Web端备份记录限制过小** 🟢 轻微

**当前逻辑**：
```javascript
// 只保留最近3个备份记录
if (backups.length > 3) {
  backups.shift()
}
```

**问题**：
- ⚠️ 只保留3个备份记录
- ⚠️ 用户可能需要更多历史记录

**建议**：
- 增加到10个或20个
- 或者让用户自定义

---

## 📊 问题优先级

| 问题 | 严重程度 | 影响范围 | 修复难度 |
|------|---------|---------|---------|
| localStorage数据不完整 | 🔴 严重 | 所有用户 | 简单 |
| 移动端删除路径错误 | 🟡 中等 | 移动端用户 | 简单 |
| 文件夹备份位置分散 | 🟡 中等 | 代码维护 | 简单 |
| 恢复逻辑缺少日志 | 🟡 中等 | 用户体验 | 简单 |
| 备份记录限制过小 | 🟢 轻微 | Web用户 | 简单 |

---

## ✅ 修复建议

### **立即修复（P0）**
1. ✅ 修复localStorage备份逻辑（备份所有用户）
2. ✅ 修复移动端删除路径

### **建议修复（P1）**
3. ✅ 合并文件夹备份逻辑
4. ✅ 添加恢复日志
5. ✅ 增加备份记录限制

---

## 🎯 总体评分

**功能完整性**: 85/100  
**逻辑正确性**: 75/100  
**代码质量**: 80/100  

**综合评分**: 80/100 ⭐⭐⭐⭐

---

## 💡 优化建议

1. **增量备份**：只备份变更的数据，减少备份时间
2. **压缩备份**：使用gzip压缩，减少文件大小
3. **云端备份**：支持上传到云存储（可选）
4. **备份验证**：恢复前验证备份文件完整性
5. **备份加密**：敏感数据加密存储

---

需要我立即修复这些问题吗？
