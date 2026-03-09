const mysql = require('mysql2/promise');

async function dropDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    });
    
    await connection.execute('DROP DATABASE IF EXISTS todo_app');
    console.log('✅ 数据库 todo_app 已删除');
    
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('\n当前数据库列表：');
    databases.forEach(db => {
      if (db.Database !== 'information_schema' && 
          db.Database !== 'mysql' && 
          db.Database !== 'performance_schema' && 
          db.Database !== 'sys') {
        console.log('  -', db.Database);
      }
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

dropDatabase();
