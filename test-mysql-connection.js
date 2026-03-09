const mysql = require('mysql2/promise')

async function testConnection() {
  console.log('🔍 测试 MySQL 连接...\n')
  
  const configs = [
    { host: 'localhost', port: 3306, user: 'root', password: '', database: 'todo_app' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'todo_app' },
    { host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'todo_app' },
  ]
  
  for (const config of configs) {
    try {
      console.log(`尝试连接: ${config.user}@${config.host}:${config.port}`)
      const connection = await mysql.createConnection(config)
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM tasks')
      await connection.end()
      
      console.log(`✅ 连接成功！任务数量: ${rows[0].count}`)
      console.log(`\n使用配置:`)
      console.log(JSON.stringify(config, null, 2))
      return config
    } catch (error) {
      console.log(`❌ 失败: ${error.message}\n`)
    }
  }
  
  console.log('❌ 所有配置都失败了')
  console.log('\n💡 请确保:')
  console.log('  1. MySQL 服务已启动: ./start-mysql-server.sh')
  console.log('  2. 数据库 todo_app 已创建')
  console.log('  3. 用户名和密码正确')
}

testConnection()
