# 数据库自动初始化说明

## 功能说明

**用户只需提供数据库连接信息，应用自动完成所有初始化工作！**

---

## 自动初始化流程

### 用户操作
```
1. 点击右上角"数据库配置"
2. 选择MySQL
3. 输入数据库信息：
   - 主机地址：localhost 或 云服务器IP
   - 端口：3306
   - 用户名：root 或 其他用户
   - 密码：数据库密码
   - 数据库名：todo_app（可自定义）
4. 点击"测试连接"
```

### 应用自动执行
```
1. 连接到MySQL服务器（不指定数据库）
   ↓
2. 自动创建数据库（如果不存在）
   CREATE DATABASE IF NOT EXISTS `todo_app`
   ↓
3. 连接到目标数据库
   ↓
4. 自动创建所有表（如果不存在）
   - tasks（任务表）
   - collections（文件夹表）
   - task_logs（日志表）
   - deleted_tasks（回收站表）
   - user_settings（用户配置表）
   - ai_chat_history（AI对话表）
   - reports（报告表）
   ↓
5. 返回成功消息
   ✅ 连接成功！数据库 todo_app 已就绪
```

---

## 支持的场景

### 场景1：全新的MySQL服务器
```
用户：刚安装MySQL，里面什么都没有
应用：
  1. 自动创建数据库 todo_app
  2. 自动创建7个表
  3. 用户可以直接使用 ✅
```

### 场景2：已有数据库，但没有表
```
用户：数据库 todo_app 已存在，但是空的
应用：
  1. 检测到数据库已存在
  2. 自动创建7个表
  3. 用户可以直接使用 ✅
```

### 场景3：已有数据库和表
```
用户：数据库和表都已存在（之前使用过）
应用：
  1. 检测到数据库已存在
  2. 检测到表已存在（IF NOT EXISTS）
  3. 不做任何修改
  4. 用户可以直接使用 ✅
```

### 场景4：表结构不完整
```
用户：只有部分表（如只有tasks表）
应用：
  1. 检测到数据库已存在
  2. 检测到部分表已存在
  3. 自动创建缺失的表
  4. 用户可以直接使用 ✅
```

---

## 技术实现

### 1. 自动创建数据库
```javascript
// 先连接到MySQL服务器（不指定数据库）
let connection = await mysql.createConnection({
  host: host || 'localhost',
  port: port || 3306,
  user,
  password
})

// 创建数据库（如果不存在）
await connection.execute(
  `CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
   DEFAULT CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci`
)
```

### 2. 自动创建表
```javascript
// 重新连接到目标数据库
connection = await mysql.createConnection({
  host: host || 'localhost',
  port: port || 3306,
  user,
  password,
  database: dbName
})

// 初始化所有表
await initDatabase(connection)
```

### 3. 表结构定义
```sql
-- 1. 任务表（23个字段）
CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT PRIMARY KEY,
  username VARCHAR(100),
  text VARCHAR(500),
  description TEXT,
  type VARCHAR(50),
  category VARCHAR(50),
  priority VARCHAR(50),
  status VARCHAR(50),
  created_at DATETIME,
  completed_at DATETIME,
  collection_id BIGINT,
  parent_task_id BIGINT,
  weekdays JSON,
  custom_date DATE,
  custom_time TIME,
  is_pinned BOOLEAN,
  enable_reminder BOOLEAN,
  reminder_time DATETIME,
  force_reminder BOOLEAN,
  wait_for JSON,
  subtasks JSON,
  ai_summary TEXT,
  data JSON,
  INDEX idx_username (username),
  INDEX idx_status (status),
  INDEX idx_pinned (is_pinned),
  INDEX idx_collection (collection_id)
)

-- 2. 文件夹表
CREATE TABLE IF NOT EXISTS collections (...)

-- 3. 日志表
CREATE TABLE IF NOT EXISTS task_logs (...)

-- 4. 回收站表
CREATE TABLE IF NOT EXISTS deleted_tasks (...)

-- 5. 用户配置表
CREATE TABLE IF NOT EXISTS user_settings (...)

-- 6. AI对话表
CREATE TABLE IF NOT EXISTS ai_chat_history (...)

-- 7. 报告表
CREATE TABLE IF NOT EXISTS reports (...)
```

---

## 用户体验

### 零配置使用
```
用户：我有一个MySQL服务器，但里面什么都没有
操作：
  1. 输入连接信息
  2. 点击"测试连接"
  3. 看到"✅ 连接成功！数据库 todo_app 已就绪"
  4. 点击"保存配置"
  5. 开启"接管模式"
  6. 开始使用 ✅

无需手动创建数据库！
无需手动创建表！
无需了解表结构！
```

### 安全性保障
```
✅ 使用 IF NOT EXISTS：不会覆盖已有数据
✅ 使用 utf8mb4：支持中文和emoji
✅ 添加索引：提升查询性能
✅ 字段类型合理：避免数据丢失
```

---

## 常见问题

### Q1: 我需要手动创建数据库吗？
**A**: 不需要！应用会自动创建。

### Q2: 我需要手动创建表吗？
**A**: 不需要！应用会自动创建所有7个表。

### Q3: 如果我的数据库已经有数据了怎么办？
**A**: 不会影响！使用 `IF NOT EXISTS`，不会覆盖已有数据。

### Q4: 我需要了解表结构吗？
**A**: 不需要！应用自动处理所有表结构。

### Q5: 如果表结构不完整怎么办？
**A**: 应用会自动创建缺失的表。

---

## 总结

**应用已实现完全自动化的数据库初始化！**

用户只需：
1. ✅ 提供MySQL连接信息
2. ✅ 点击"测试连接"
3. ✅ 开始使用

应用自动：
1. ✅ 创建数据库（如果不存在）
2. ✅ 创建所有表（如果不存在）
3. ✅ 设置字符集和索引
4. ✅ 保证数据安全

**零配置，开箱即用！**
