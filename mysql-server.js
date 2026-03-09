const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// 日期格式化函数（保持本地时区）
function formatDateForMySQL(isoString) {
  if (!isoString) return null
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 测试连接并自动创建数据库
app.post('/api/mysql/test', async (req, res) => {
  const { host, port, user, password, database } = req.body
  const dbName = database || 'todo_app'
  
  try {
    // 先连接到MySQL服务器（不指定数据库）
    let connection = await mysql.createConnection({
      host: host || 'localhost',
      port: port || 3306,
      user,
      password
    })
    
    // 创建数据库（如果不存在）
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.end()
    
    // 重新连接到目标数据库
    connection = await mysql.createConnection({
      host: host || 'localhost',
      port: port || 3306,
      user,
      password,
      database: dbName
    })
    
    // 初始化表结构
    await initDatabase(connection)
    
    await connection.end()
    res.json({ success: true, message: `✅ 连接成功！数据库 ${dbName} 已就绪` })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})

// 初始化数据库表
async function initDatabase(connection) {
  // 1. 任务表（扩展字段）
  await connection.execute(`
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
      is_pinned BOOLEAN DEFAULT FALSE,
      enable_reminder BOOLEAN DEFAULT FALSE,
      reminder_time DATETIME,
      force_reminder BOOLEAN DEFAULT FALSE,
      wait_for JSON,
      subtasks JSON,
      ai_summary TEXT,
      data JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_status (status),
      INDEX idx_pinned (is_pinned),
      INDEX idx_collection (collection_id)
    )
  `)

  // 2. 文件夹表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS collections (
      id BIGINT PRIMARY KEY,
      username VARCHAR(100),
      name VARCHAR(200),
      icon VARCHAR(50),
      parent_id BIGINT,
      order_num INT,
      is_encrypted BOOLEAN,
      data JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_parent (parent_id)
    )
  `)

  // 3. 任务执行日志表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id BIGINT PRIMARY KEY,
      task_id BIGINT,
      username VARCHAR(100),
      log_type VARCHAR(50),
      content TEXT,
      duration INT,
      progress INT,
      mood VARCHAR(20),
      tags JSON,
      created_at DATETIME,
      INDEX idx_task_id (task_id),
      INDEX idx_username (username)
    )
  `)

  // 4. 回收站表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS deleted_tasks (
      id BIGINT PRIMARY KEY,
      username VARCHAR(100),
      task_data JSON,
      deleted_at DATETIME,
      INDEX idx_username (username),
      INDEX idx_deleted_at (deleted_at)
    )
  `)

  // 5. 用户设置表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      username VARCHAR(100) PRIMARY KEY,
      ai_models JSON,
      notified_tasks JSON,
      last_version VARCHAR(20),
      settings JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // 6. AI对话历史表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id VARCHAR(100) PRIMARY KEY,
      username VARCHAR(100),
      chat_id VARCHAR(100),
      messages JSON,
      created_at DATETIME,
      INDEX idx_username (username),
      INDEX idx_chat_id (chat_id)
    )
  `)

  // 7. 报告历史表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id BIGINT PRIMARY KEY,
      username VARCHAR(100),
      report_type VARCHAR(50),
      report_data JSON,
      created_at DATETIME,
      INDEX idx_username (username),
      INDEX idx_type (report_type)
    )
  `)
}

// 同步数据
app.post('/api/mysql/sync', async (req, res) => {
  const { config, data } = req.body
  let connection
  
  try {
    connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database || 'todo_app'
    })

    await initDatabase(connection)

    // 0. 先删除远程数据库中已被删除的任务（关键！）
    if (data.deletedTasks && data.deletedTasks.length > 0) {
      for (const deletedTask of data.deletedTasks) {
        await connection.execute(
          'DELETE FROM tasks WHERE id = ? AND username = ?',
          [deletedTask.id, data.username]
        )
        // 同时删除该任务的日志
        await connection.execute(
          'DELETE FROM task_logs WHERE task_id = ? AND username = ?',
          [deletedTask.id, data.username]
        )
      }
    }

    // 1. 同步任务（扩展字段）
    for (const task of data.tasks) {
      const createdAt = task.created_at ? formatDateForMySQL(task.created_at) : null
      const completedAt = task.completed_at ? formatDateForMySQL(task.completed_at) : null
      const reminderTime = task.reminderTime ? formatDateForMySQL(task.reminderTime) : null
      
      await connection.execute(
        `INSERT INTO tasks (
          id, username, text, description, type, category, priority, status,
          created_at, completed_at, collection_id, parent_task_id,
          weekdays, custom_date, custom_time, is_pinned,
          enable_reminder, reminder_time, force_reminder,
          wait_for, subtasks, ai_summary, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          text=VALUES(text), description=VALUES(description), status=VALUES(status),
          completed_at=VALUES(completed_at), is_pinned=VALUES(is_pinned),
          wait_for=VALUES(wait_for), subtasks=VALUES(subtasks), data=VALUES(data)`,
        [
          task.id || 0,
          data.username || '',
          task.text || '',
          task.description || '',
          task.type || '',
          task.category || '',
          task.priority || '',
          task.status || 'pending',
          createdAt,
          completedAt,
          task.collectionId !== undefined ? task.collectionId : null,
          task.parentTaskId !== undefined ? task.parentTaskId : null,
          JSON.stringify(task.weekdays || []),
          task.customDate || null,
          task.customTime || null,
          task.is_pinned || false,
          task.enableReminder || false,
          reminderTime,
          task.forceReminder || false,
          JSON.stringify(task.waitFor || []),
          JSON.stringify(task.subtasks || []),
          task.aiSummary || null,
          JSON.stringify(task)
        ]
      )
      
      // 同步任务日志
      if (task.logs && task.logs.length > 0) {
        for (const log of task.logs) {
          const logCreatedAt = log.timestamp ? formatDateForMySQL(log.timestamp) : null
          await connection.execute(
            `INSERT INTO task_logs (id, task_id, username, log_type, content, duration, progress, mood, tags, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE content=VALUES(content), duration=VALUES(duration), progress=VALUES(progress)`,
            [
              log.id || Date.now(),
              task.id,
              data.username,
              log.type || '',
              log.content || '',
              log.duration || 0,
              log.progress || 0,
              log.mood || '',
              JSON.stringify(log.tags || []),
              logCreatedAt
            ]
          )
        }
      }
    }

    // 2. 同步文件夹
    for (const collection of data.collections || []) {
      await connection.execute(
        `INSERT INTO collections (id, username, name, icon, parent_id, order_num, is_encrypted, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         name=VALUES(name), icon=VALUES(icon), parent_id=VALUES(parent_id), order_num=VALUES(order_num), data=VALUES(data)`,
        [
          collection.id || 0,
          data.username || '',
          collection.name || '',
          collection.icon || '📁',
          collection.parentId !== undefined ? collection.parentId : null,
          collection.order !== undefined ? collection.order : 0,
          collection.isEncrypted !== undefined ? collection.isEncrypted : false,
          JSON.stringify(collection)
        ]
      )
    }
    
    // 3. 同步回收站
    if (data.deletedTasks && data.deletedTasks.length > 0) {
      for (const task of data.deletedTasks) {
        const deletedAt = task.deleted_at ? formatDateForMySQL(task.deleted_at) : null
        await connection.execute(
          `INSERT INTO deleted_tasks (id, username, task_data, deleted_at)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE task_data=VALUES(task_data), deleted_at=VALUES(deleted_at)`,
          [task.id, data.username, JSON.stringify(task), deletedAt]
        )
      }
    }
    
    // 4. 同步用户配置
    if (data.userSettings) {
      await connection.execute(
        `INSERT INTO user_settings (username, ai_models, notified_tasks, last_version, settings)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         ai_models=VALUES(ai_models), notified_tasks=VALUES(notified_tasks), 
         last_version=VALUES(last_version), settings=VALUES(settings)`,
        [
          data.username,
          JSON.stringify(data.userSettings.aiModels || []),
          JSON.stringify(data.userSettings.notifiedTasks || []),
          data.userSettings.lastVersion || '',
          JSON.stringify(data.userSettings.settings || {})
        ]
      )
    }
    
    // 5. 同步AI对话历史
    if (data.aiChatHistory && data.aiChatHistory.length > 0) {
      for (const chat of data.aiChatHistory) {
        const createdAt = chat.createdAt ? formatDateForMySQL(chat.createdAt) : null
        await connection.execute(
          `INSERT INTO ai_chat_history (id, username, chat_id, messages, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE messages=VALUES(messages)`,
          [
            chat.id || `${Date.now()}_${Math.random()}`,
            data.username,
            chat.chatId || '',
            JSON.stringify(chat.messages || []),
            createdAt
          ]
        )
      }
    }
    
    // 6. 同步报告历史
    if (data.reports && data.reports.length > 0) {
      for (const report of data.reports) {
        const createdAt = report.createdAt ? formatDateForMySQL(report.createdAt) : null
        await connection.execute(
          `INSERT INTO reports (id, username, report_type, report_data, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE report_data=VALUES(report_data)`,
          [
            report.id || Date.now(),
            data.username,
            report.type || '',
            JSON.stringify(report.data || {}),
            createdAt
          ]
        )
      }
    }

    await connection.end()
    
    const stats = {
      tasks: data.tasks.length,
      collections: (data.collections || []).length,
      deletedTasks: (data.deletedTasks || []).length,
      logs: data.tasks.reduce((sum, t) => sum + (t.logs?.length || 0), 0),
      aiChats: (data.aiChatHistory || []).length,
      reports: (data.reports || []).length
    }
    
    res.json({ 
      success: true, 
      message: `同步成功: ${stats.tasks}任务, ${stats.collections}文件夹, ${stats.deletedTasks}回收站, ${stats.logs}日志, ${stats.aiChats}对话, ${stats.reports}报告` 
    })
  } catch (error) {
    if (connection) await connection.end()
    res.json({ success: false, error: error.message })
  }
})

// 从MySQL恢复数据
app.post('/api/mysql/restore', async (req, res) => {
  const { config, username } = req.body
  let connection
  
  try {
    connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database || 'todo_app'
    })

    // 辅助函数：安全解析JSON
    const safeJsonParse = (data) => {
      if (!data) return null
      if (typeof data === 'object') return data  // 已经是对象，直接返回
      try {
        return JSON.parse(data)  // 是字符串，尝试解析
      } catch (e) {
        console.error('JSON解析失败:', e)
        return null
      }
    }

    // 1. 恢复任务
    const [tasks] = await connection.execute(
      'SELECT data FROM tasks WHERE username = ?',
      [username]
    )
    
    // 2. 恢复任务日志（关键！）
    const [taskLogs] = await connection.execute(
      'SELECT task_id, id, log_type, content, duration, progress, mood, tags, created_at FROM task_logs WHERE username = ?',
      [username]
    )
    
    // 3. 将日志组装到任务中
    const taskMap = new Map()
    tasks.forEach(row => {
      const task = safeJsonParse(row.data)
      if (task) {
        task.logs = []  // 初始化日志数组
        taskMap.set(task.id, task)
      }
    })
    
    // 将日志添加到对应的任务
    taskLogs.forEach(log => {
      const task = taskMap.get(log.task_id)
      if (task) {
        task.logs.push({
          id: log.id,
          type: log.log_type,
          content: log.content,
          duration: log.duration,
          progress: log.progress,
          mood: log.mood,
          tags: safeJsonParse(log.tags) || [],
          timestamp: log.created_at
        })
      }
    })
    
    const tasksWithLogs = Array.from(taskMap.values())

    // 4. 恢复文件夹
    const [collections] = await connection.execute(
      'SELECT data FROM collections WHERE username = ?',
      [username]
    )
    
    // 5. 恢复回收站
    const [deletedTasks] = await connection.execute(
      'SELECT task_data FROM deleted_tasks WHERE username = ?',
      [username]
    )
    
    // 6. 恢复用户配置
    const [userSettings] = await connection.execute(
      'SELECT ai_models, notified_tasks, last_version, settings FROM user_settings WHERE username = ?',
      [username]
    )
    
    // 7. 恢复AI对话
    const [aiChats] = await connection.execute(
      'SELECT chat_id, messages FROM ai_chat_history WHERE username = ? ORDER BY created_at DESC',
      [username]
    )
    
    // 8. 恢复报告
    const [reports] = await connection.execute(
      'SELECT report_type, report_data FROM reports WHERE username = ? ORDER BY created_at DESC',
      [username]
    )

    await connection.end()

    res.json({
      success: true,
      data: {
        tasks: tasksWithLogs,  // 包含日志的任务
        collections: collections.map(row => safeJsonParse(row.data)).filter(Boolean),
        deletedTasks: deletedTasks.map(row => safeJsonParse(row.task_data)).filter(Boolean),
        userSettings: userSettings[0] ? {
          aiModels: safeJsonParse(userSettings[0].ai_models) || [],
          notifiedTasks: safeJsonParse(userSettings[0].notified_tasks) || [],
          lastVersion: userSettings[0].last_version || '',
          settings: safeJsonParse(userSettings[0].settings) || {}
        } : null,
        aiChatHistory: aiChats.map(row => ({
          id: row.chat_id,
          messages: safeJsonParse(row.messages) || []
        })),
        reports: reports.map(row => ({
          type: row.report_type,
          ...(safeJsonParse(row.report_data) || {})
        }))
      }
    })
  } catch (error) {
    if (connection) await connection.end()
    res.json({ success: false, error: error.message })
  }
})

const PORT = 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MySQL同步服务运行在:`)
  console.log(`   本地: http://localhost:${PORT}`)
  console.log(`   局域网: http://192.168.31.159:${PORT}`)
})
