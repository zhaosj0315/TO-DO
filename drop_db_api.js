const mysql = require('mysql2/promise');

async function dropDatabase() {
  try {
    // 使用你配置的连接信息
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'Zhaosj0315'  // 使用你的密码
    });
    
    console.log('🔗 连接MySQL成功');
    
    // 删除数据库
    await connection.execute('DROP DATABASE IF EXISTS todo_app');
    console.log('✅ 数据库 todo_app 已删除');
    
    // 显示当前数据库列表
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('\n📋 当前数据库列表：');
    databases.forEach(db => {
      if (db.Database !== 'information_schema' && 
          db.Database !== 'mysql' && 
          db.Database !== 'performance_schema' && 
          db.Database !== 'sys') {
        console.log('  -', db.Database);
      }
    });
    
    console.log('\n✅ 现在可以在前端测试自动创建功能了！');
    
    await connection.end();
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

dropDatabase();
