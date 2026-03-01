# 数据管理兼容性说明

## 📊 当前任务数据结构（v1.7.6）

### 核心字段
- `id`, `text`, `description`, `type`, `category`, `priority`, `status`
- `created_at`, `completed_at`, `customDate`, `customTime`, `weekdays`
- `is_pinned`, `enableReminder`, `reminderTime`, `forceReminder`

### 新增字段（v1.7.0+）
- **执行日志系统**：
  - `logs[]`: 任务执行日志数组（开始/进展/阻碍/方案/里程碑/完成）
  - `stats{}`: 统计数据（总耗时、推进次数、平均时长、进度历史、标签、阻碍统计）

- **番茄钟系统**：
  - `pomodoroHistory[]`: 番茄钟历史记录（startTime, endTime, completed）
  - `completedPomodoros`: 已完成番茄钟数
  - `estimatedPomodoros`: 预估番茄钟数（基于优先级：高4/中2/低1）

---

## 🔄 数据管理功能兼容性

### ✅ 完整备份（JSON）- **推荐**
**保留所有数据**，包括：
- ✅ 执行日志（logs）
- ✅ 番茄钟历史（pomodoroHistory）
- ✅ 统计数据（stats）
- ✅ AI 总结（aiSummary）
- ✅ 所有用户数据（users, userInfo, phoneMapping）

**使用场景**：
- 完整数据备份
- 跨设备迁移
- 数据恢复

**文件格式**：`TODO-App_backup_YYYY-MM-DD_timestamp.json`

---

### ⚠️ Excel 导入导出 - **仅基础数据**
**仅包含基础字段**，不包含：
- ❌ 执行日志（logs）
- ❌ 番茄钟历史（pomodoroHistory）
- ❌ AI 总结（aiSummary）

**包含的统计信息**（只读）：
- ✅ 已完成番茄钟数
- ✅ 预估番茄钟数
- ✅ 执行日志数量
- ✅ 最新进度百分比

**使用场景**：
- 批量导入任务（100条模板）
- 与其他工具交换数据
- 快速查看任务列表

**导入行为**：
- 新任务会自动初始化空的 `logs[]`, `stats{}`, `pomodoroHistory[]`
- 预估番茄钟数根据优先级自动设置

---

## 🔧 数据迁移机制

### 自动迁移（已实现）
在 `offlineTaskStore.js` 的 `loadTasks()` 方法中：

```javascript
this.tasks = this.tasks.map(task => ({
  ...task,
  logs: task.logs || [],
  stats: task.stats || this.calculateTaskStats([]),
  pomodoroHistory: task.pomodoroHistory || [],
  completedPomodoros: task.completedPomodoros || 0,
  estimatedPomodoros: task.estimatedPomodoros || this.getEstimatedPomodoros(task.priority)
}))
```

**触发时机**：
- 每次登录加载任务时
- 从回收站恢复任务时

**兼容性**：
- ✅ 旧版本任务（v1.6.x 及之前）自动补全新字段
- ✅ 新版本任务（v1.7.0+）保持原样
- ✅ Excel 导入任务自动初始化新字段

---

## 📋 推荐备份策略

### 日常使用
1. **每周一次完整备份（JSON）**：保留所有执行历史
2. **每月导出 Excel**：便于查看和分析任务列表

### 重要操作前
- 卸载应用前：**必须完整备份（JSON）**
- 系统升级前：**完整备份（JSON）**
- 批量导入前：**完整备份（JSON）**

### 数据恢复优先级
1. **JSON 完整备份** → 100% 数据恢复
2. **Excel 备份** → 仅恢复任务基础信息，丢失执行历史

---

## 🐛 已知限制

1. **Excel 不支持嵌套数据**：
   - 无法导出/导入完整的 logs 数组
   - 无法导出/导入 pomodoroHistory 数组
   - 只能导出统计摘要（日志数、番茄钟数）

2. **日期格式兼容性**：
   - 支持多种格式：`YYYY-MM-DD`, `YYYY/MM/DD HH:mm`, `YYYY-MM-DD HH:mm:ss`
   - 使用 JavaScript 原生 `new Date()` 解析

3. **Web 端备份限制**：
   - 备份文件存储在 localStorage（有大小限制）
   - 建议定期下载到本地

---

## 🔮 未来改进方向

1. **增强 Excel 导出**：
   - 添加"执行日志"工作表（展开 logs 数组）
   - 添加"番茄钟历史"工作表（展开 pomodoroHistory 数组）

2. **云端同步**：
   - 支持 iCloud / Google Drive 自动备份
   - 多设备实时同步

3. **增量备份**：
   - 只备份变更的数据
   - 减少备份文件大小

---

**最后更新**：2026-02-26  
**当前版本**：v1.7.6
