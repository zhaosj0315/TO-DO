const mysql = require('mysql2/promise')

async function fixTables() {
  console.log('🔧 修复数据库表结构...')
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '66315066',
      database: 'todo_app'
    })

    // 删除旧表
    await connection.execute('DROP TABLE IF EXISTS tasks')
    await connection.execute('DROP TABLE IF EXISTS collections')
    console.log('✅ 旧表已删除')

    // 创建新表（使用BIGINT）
    await connection.execute(`
      CREATE TABLE tasks (
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
    console.log('✅ tasks表已重建（BIGINT）')

    await connection.execute(`
      CREATE TABLE collections (
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
    console.log('✅ collections表已重建（BIGINT）')

    await connection.end()
    console.log('🎉 表结构修复完成！现在可以同步数据了')
  } catch (error) {
    console.error('❌ 修复失败:', error.message)
  }
}

fixTables()
