# 自动备份功能说明

## 功能特点

### 自动触发
- ✅ 每天首次数据变动时自动备份
- ✅ 同一天内不重复备份
- ✅ 无需手动操作

### 备份内容
- ✅ 所有用户账号信息
- ✅ 所有用户的任务数据
- ✅ 回收站数据
- ✅ 手机号绑定信息
- ✅ 密保问题
- ✅ 提醒通知记录（防重复提醒）
- ✅ 备份历史记录

### 文件管理
- 文件名格式：`TODO-App_backup_YYYY-MM-DD.json`
- 存储位置：`Documents/TODO-App-backups/`
- 示例：`TODO-App_backup_2026-02-24.json`

## 使用方法

### 查看备份文件
```javascript
import { listBackups } from '@/utils/autoBackup'

const backups = await listBackups()
// ['TODO-App_backup_2026-02-24.json', 'TODO-App_backup_2026-02-23.json', ...]
```

### 恢复备份
```javascript
import { restoreBackup } from '@/utils/autoBackup'

const result = await restoreBackup('TODO-App_backup_2026-02-24.json')
if (result.success) {
  console.log('恢复成功')
}
```

### 手动触发备份
```javascript
import { performBackup } from '@/utils/autoBackup'

const result = await performBackup()
if (result.success && !result.skipped) {
  console.log(`备份成功: ${result.fileName}`)
}
```

## 技术实现

### 备份时机
每次调用 `saveTasks()` 时自动检查：
- 获取今天日期
- 对比上次备份日期
- 不同则执行备份

### 数据结构
```json
{
  "users": "{...}",
  "currentUser": "username",
  "userInfo": "{...}",
  "phoneMapping": "{...}",
  "security": "{...}",
  "lastBackupDate": "2026-02-24",
  "tasks_username": "[...]",
  "deletedTasks_username": "[...]",
  "notified_reminders_username": "{...}"
}
```

## 注意事项

1. **存储空间**: 每个备份文件约几KB到几MB，建议定期清理旧备份
2. **隐私安全**: 备份文件包含所有用户数据，请妥善保管
3. **恢复操作**: 恢复备份会覆盖当前所有数据，请谨慎操作
4. **文件位置**: Android上位于 `/storage/emulated/0/Documents/TODO-App-backups/`

## 后续优化建议

- [ ] 添加备份管理界面
- [ ] 支持手动删除旧备份
- [ ] 备份文件加密
- [ ] 云端同步备份
- [ ] 自动清理超过30天的备份
