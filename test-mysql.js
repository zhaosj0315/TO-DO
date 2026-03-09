const mysql = require('mysql2/promise')

async function testMySQL() {
  console.log('🔍 测试MySQL连接...')
  console.log('配置信息:')
  console.log('  Host: localhost')
  console.log('  Port: 3306')
  console.log('  User: root')
  console.log('  Password: 66315066')
  console.log('')

  try {
    // 连接到MySQL服务器
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '66315066'
    })

    console.log('✅ MySQL连接成功！')

    // 创建数据库
    await connection.execute('CREATE DATABASE IF NOT EXISTS `todo_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
    console.log('✅ 数据库 todo_app 已创建/存在')

    await connection.end()

    // 重新连接到目标数据库
    const dbConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '66315066',
      database: 'todo_app'
    })

    // 创建tasks表
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT PRIMARY KEY,
        username VARCHAR(100),
        text VARCHAR(500),
        description TEXT,
        type VARCHAR(50),
        category VARCHAR(50),
        priority VARCHAR(50),
        status VARCHAR(50),
        created_at DATETIME,
        completed_at DATETIME,
        collection_id INT,
        parent_task_id INT,
        data JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_status (status)
      )
    `)
    console.log('✅ tasks表已创建')

    // 创建collections表
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT PRIMARY KEY,
        username VARCHAR(100),
        name VARCHAR(200),
        icon VARCHAR(50),
        parent_id INT,
        order_num INT,
        is_encrypted BOOLEAN,
        data JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      )
    `)
    console.log('✅ collections表已创建')

    await dbConnection.end()
    console.log('')
    console.log('🎉 所有测试通过！MySQL已就绪')
    console.log('💡 现在可以启动同步服务: node mysql-server.js')
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

testMySQL()
