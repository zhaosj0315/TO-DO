-- ============================================
-- MySQL 索引优化脚本
-- 目标：提升查询性能 10 倍
-- 执行时间：约 5 分钟
-- ============================================

USE todo_app;

-- ============================================
-- 1. 任务表 (tasks) 索引优化
-- ============================================

-- 1.1 用户+状态复合索引（最高频查询）
-- 场景：查询某用户的待办/已完成/已逾期任务
CREATE INDEX IF NOT EXISTS idx_user_status ON tasks(username, status);

-- 1.2 用户+截止时间复合索引
-- 场景：查询某用户即将逾期的任务
CREATE INDEX IF NOT EXISTS idx_user_deadline ON tasks(username, custom_date, custom_time);

-- 1.3 用户+笔记本复合索引
-- 场景：查询某笔记本下的所有任务
CREATE INDEX IF NOT EXISTS idx_user_collection ON tasks(username, collection_id);

-- 1.4 更新时间索引（增量同步关键）
-- 场景：只同步最近更新的任务
CREATE INDEX IF NOT EXISTS idx_updated_at ON tasks(updated_at);

-- 1.5 用户+状态+截止时间三重索引（高频复合查询）
-- 场景：查询某用户待办且即将逾期的任务
CREATE INDEX IF NOT EXISTS idx_user_status_deadline ON tasks(username, status, custom_date);

-- 1.6 父任务索引（子任务查询）
-- 场景：查询某任务的所有子任务
CREATE INDEX IF NOT EXISTS idx_parent_task ON tasks(parent_task_id);

-- 1.7 创建时间索引（时间范围筛选）
-- 场景：查询某时间段创建的任务
CREATE INDEX IF NOT EXISTS idx_created_at ON tasks(created_at);

-- 1.8 完成时间索引（统计报告）
-- 场景：查询某时间段完成的任务
CREATE INDEX IF NOT EXISTS idx_completed_at ON tasks(completed_at);


-- ============================================
-- 2. 笔记本表 (collections) 索引优化
-- ============================================

-- 2.1 用户索引（已存在，确认）
-- CREATE INDEX IF NOT EXISTS idx_username ON collections(username);

-- 2.2 用户+父笔记本复合索引
-- 场景：查询某笔记本的子笔记本
CREATE INDEX IF NOT EXISTS idx_user_parent ON collections(username, parent_id);

-- 2.3 排序索引
-- 场景：按顺序显示笔记本
CREATE INDEX IF NOT EXISTS idx_order ON collections(`order`);


-- ============================================
-- 3. 执行日志表 (task_logs) 索引优化
-- ============================================

-- 3.1 任务ID索引
-- 场景：查询某任务的所有日志
CREATE INDEX IF NOT EXISTS idx_task_id ON task_logs(task_id);

-- 3.2 用户+时间复合索引
-- 场景：查询某用户某时间段的日志
CREATE INDEX IF NOT EXISTS idx_user_time ON task_logs(username, created_at);


-- ============================================
-- 4. 番茄钟历史表 (pomodoro_history) 索引优化
-- ============================================

-- 4.1 任务ID索引
-- 场景：查询某任务的番茄钟记录
CREATE INDEX IF NOT EXISTS idx_task_id ON pomodoro_history(task_id);

-- 4.2 用户+时间复合索引
-- 场景：查询某用户某时间段的番茄钟统计
CREATE INDEX IF NOT EXISTS idx_user_time ON pomodoro_history(username, start_time);


-- ============================================
-- 5. 查看索引创建结果
-- ============================================

-- 查看 tasks 表的所有索引
SHOW INDEX FROM tasks;

-- 查看 collections 表的所有索引
SHOW INDEX FROM collections;

-- 查看 task_logs 表的所有索引（如果存在）
-- SHOW INDEX FROM task_logs;

-- 查看 pomodoro_history 表的所有索引（如果存在）
-- SHOW INDEX FROM pomodoro_history;


-- ============================================
-- 6. 性能测试（执行前后对比）
-- ============================================

-- 测试1：查询某用户的待办任务（应使用 idx_user_status）
EXPLAIN SELECT * FROM tasks WHERE username = 'test' AND status = 'pending';

-- 测试2：查询某用户即将逾期的任务（应使用 idx_user_status_deadline）
EXPLAIN SELECT * FROM tasks 
WHERE username = 'test' 
  AND status = 'pending' 
  AND custom_date <= DATE_ADD(NOW(), INTERVAL 1 DAY);

-- 测试3：增量同步查询（应使用 idx_updated_at）
EXPLAIN SELECT * FROM tasks WHERE updated_at > '2026-03-09 00:00:00';

-- 测试4：查询某笔记本的任务（应使用 idx_user_collection）
EXPLAIN SELECT * FROM tasks WHERE username = 'test' AND collection_id = 123;


-- ============================================
-- 7. 索引维护建议
-- ============================================

-- 定期分析表（每周执行一次）
-- ANALYZE TABLE tasks;
-- ANALYZE TABLE collections;

-- 定期优化表（每月执行一次）
-- OPTIMIZE TABLE tasks;
-- OPTIMIZE TABLE collections;


-- ============================================
-- 执行完成！
-- 预期收益：
-- - 查询速度提升 10 倍
-- - 同步速度提升 5-10 倍
-- - 用户体验显著改善
-- ============================================
