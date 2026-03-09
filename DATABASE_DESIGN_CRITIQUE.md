# 数据库表设计批判性审查

## 审查时间
2026-03-09 14:33

## 当前表设计

### 表1: tasks
```sql
- id, username, text, description
- type, category, priority, status
- created_at, completed_at
- collection_id, parent_task_id
- data (JSON) ← 存储所有其他字段
```

### 表2: collections
```sql
- id, username, name, icon
- parent_id, order_num, is_encrypted
- data (JSON) ← 存储所有其他字段
```

---

## ❌ 严重问题：数据覆盖不完整

### 缺失的核心业务数据

#### 1. 任务字段缺失 (23个字段 → 只存了12个)
**本地存储的完整字段**：
```javascript
{
  id, text, description, type, category, priority, status,
  created_at, completed_at, collection_id, parent_task_id,
  
  // ❌ 以下字段未单独存储，全在JSON里
  weekdays: [],           // 每周重复的日期
  customDate: null,       // 自定义日期
  customTime: null,       // 自定义时间
  user_id: 'zhaosj',     // 用户ID
  is_pinned: false,       // 是否置顶
  enableReminder: false,  // 是否启用提醒
  reminderTime: null,     // 提醒时间
  forceReminder: false,   // 强制提醒
  logs: [],              // 执行日志 ⚠️ 重要
  stats: {},             // 统计数据 ⚠️ 重要
  waitFor: [],           // 前置任务 ⚠️ 重要
  subtasks: [],          // 子任务列表 ⚠️ 重要
  aiSummary: null        // AI总结
}
```

#### 2. 未同步的本地数据
```javascript
// ❌ 完全未同步
deletedTasks_${username}     // 回收站数据
notified_tasks_${username}   // 通知记录

// ❌ localStorage数据未同步
ai_models                    // AI模型配置
ai_chat_history             // AI对话历史
weekly_reports              // 周报历史
unified_reports             // 统一报告
backupFiles                 // 备份文件列表
ai_suggestion_snooze        // AI建议暂停
last_app_version            // 版本记录
```

---

## 🔴 核心问题分析

### 问题1: JSON字段导致查询困难
**影响**：
- 无法按 `is_pinned` 查询置顶任务
- 无法按 `waitFor` 查询依赖关系
- 无法按 `logs` 统计执行情况
- 无法按 `customDate` 查询指定日期任务

### 问题2: 回收站数据未同步
**影响**：
- 用户删除的任务无法在数据库中恢复
- 换设备后回收站数据丢失

### 问题3: AI相关数据未同步
**影响**：
- AI模型配置换设备后丢失
- AI对话历史无法跨设备
- 周报/月报历史无法跨设备

### 问题4: 用户配置数据未同步
**影响**：
- 通知记录丢失，可能重复通知
- 版本记录丢失，可能重复显示更新通知

---

## ✅ 修复方案

### 方案1: 扩展表结构（推荐）

#### 1.1 tasks表增加字段
```sql
ALTER TABLE tasks ADD COLUMN (
  weekdays JSON,           -- 每周重复日期
  custom_date DATE,        -- 自定义日期
  custom_time TIME,        -- 自定义时间
  is_pinned BOOLEAN,       -- 置顶
  enable_reminder BOOLEAN, -- 启用提醒
  reminder_time DATETIME,  -- 提醒时间
  wait_for JSON,          -- 前置任务ID数组
  subtasks JSON,          -- 子任务ID数组
  ai_summary TEXT         -- AI总结
);
```

#### 1.2 新增表: task_logs
```sql
CREATE TABLE task_logs (
  id BIGINT PRIMARY KEY,
  task_id BIGINT,
  username VARCHAR(100),
  log_type VARCHAR(50),    -- start/progress/block/solution/milestone/complete
  content TEXT,
  duration INT,            -- 耗时（分钟）
  progress INT,            -- 进度（0-100）
  mood VARCHAR(20),        -- 心情
  tags JSON,              -- 标签
  created_at DATETIME,
  INDEX idx_task_id (task_id)
);
```

#### 1.3 新增表: deleted_tasks
```sql
CREATE TABLE deleted_tasks (
  id BIGINT PRIMARY KEY,
  username VARCHAR(100),
  task_data JSON,         -- 完整任务数据
  deleted_at DATETIME,
  INDEX idx_username (username)
);
```

#### 1.4 新增表: user_settings
```sql
CREATE TABLE user_settings (
  username VARCHAR(100) PRIMARY KEY,
  ai_models JSON,         -- AI模型配置
  notified_tasks JSON,    -- 通知记录
  last_version VARCHAR(20),
  settings JSON,          -- 其他设置
  updated_at TIMESTAMP
);
```

#### 1.5 新增表: ai_chat_history
```sql
CREATE TABLE ai_chat_history (
  id BIGINT PRIMARY KEY,
  username VARCHAR(100),
  chat_id VARCHAR(100),
  messages JSON,
  created_at DATETIME,
  INDEX idx_username (username)
);
```

#### 1.6 新增表: reports
```sql
CREATE TABLE reports (
  id BIGINT PRIMARY KEY,
  username VARCHAR(100),
  report_type VARCHAR(50), -- daily/weekly/monthly/quarterly/yearly
  report_data JSON,
  created_at DATETIME,
  INDEX idx_username (username)
);
```

### 方案2: 保持现状（不推荐）
**优点**：无需修改
**缺点**：
- 数据不完整
- 无法跨设备同步所有数据
- 查询困难

---

## 🎯 建议

### 立即修复（高优先级）
1. ✅ 扩展tasks表：添加关键字段（is_pinned, wait_for, subtasks）
2. ✅ 新增deleted_tasks表：同步回收站数据
3. ✅ 新增task_logs表：同步执行日志

### 后续优化（中优先级）
4. 新增user_settings表：同步用户配置
5. 新增ai_chat_history表：同步AI对话
6. 新增reports表：同步报告历史

---

## 结论

❌ **当前表设计不完整，无法覆盖所有业务逻辑**

**数据覆盖率**：约40%（2个表 vs 需要7个表）

**建议**：立即实施方案1的前3项修复
