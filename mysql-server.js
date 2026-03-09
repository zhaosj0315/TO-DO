const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

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
      data JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_status (status)
    )
  `)

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
      INDEX idx_username (username)
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

    // 同步任务
    for (const task of data.tasks) {
      // 转换ISO日期为MySQL格式，处理undefined
      const createdAt = task.created_at ? new Date(task.created_at).toISOString().slice(0, 19).replace('T', ' ') : null
      const completedAt = task.completed_at ? new Date(task.completed_at).toISOString().slice(0, 19).replace('T', ' ') : null
      
      await connection.execute(
        `INSERT INTO tasks (id, username, text, description, type, category, priority, status, created_at, completed_at, collection_id, parent_task_id, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         text=VALUES(text), description=VALUES(description), status=VALUES(status), completed_at=VALUES(completed_at), data=VALUES(data)`,
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
          JSON.stringify(task)
        ]
      )
    }

    // 同步文件夹
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

    await connection.end()
    res.json({ 
      success: true, 
      message: `同步成功: ${data.tasks.length} 个任务, ${(data.collections || []).length} 个文件夹` 
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

    const [tasks] = await connection.execute(
      'SELECT data FROM tasks WHERE username = ?',
      [username]
    )

    const [collections] = await connection.execute(
      'SELECT data FROM collections WHERE username = ?',
      [username]
    )

    await connection.end()

    res.json({
      success: true,
      data: {
        tasks: tasks.map(row => JSON.parse(row.data)),
        collections: collections.map(row => JSON.parse(row.data))
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
